"""
Documents API Endpoints:
- Upload with 30MB validation
- Process document through OCR & AI extraction
- Fetch document, OCR text, analysis results
- Preview file
- Export Excel, PDF, JSON
- Demo presets loader
"""
import os
import io
import shutil
import pathlib
import datetime
import uuid
import threading
import time
import traceback
import zipfile
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session

from app.models.database import get_db, SessionLocal
from app.models.models import Document, MaterialItem, ActivityLog
from app.utils.file_validation import validate_uploaded_file, format_file_size, MAX_FILE_SIZE_BYTES
from app.utils.security import sanitize_filename
from app.services.ai_analyzer import ai_analyzer
from app.services.export_service import export_service
from app.schemas.procurement_schema import FixedOutputTemplate, DocumentResponse, DocumentListItem

router = APIRouter(prefix="/api/documents", tags=["Documents"])

UPLOADS_DIR = pathlib.Path(__file__).resolve().parent.parent.parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

async def _save_uploaded_file(file: UploadFile, batch_id: Optional[str], db: Session) -> Dict[str, Any]:
    original_name = file.filename or "uploaded_document.pdf"
    clean_name = sanitize_filename(original_name)

    # Read file content & validate size
    contents = await file.read()
    file_size = len(contents)

    is_valid, err_msg, mime_type = validate_uploaded_file(original_name, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"File '{original_name}': {err_msg}")

    doc_id = str(uuid.uuid4())
    stored_path = UPLOADS_DIR / f"{doc_id}_{clean_name}"
    with open(stored_path, "wb") as f:
        f.write(contents)

    # Determine file type
    ext = pathlib.Path(clean_name).suffix.upper().replace(".", "")

    doc = Document(
        id=doc_id,
        batch_id=batch_id,
        original_name=original_name,
        stored_path=str(stored_path),
        file_type=ext,
        file_size_bytes=file_size,
        status="UPLOADED",
        upload_timestamp=datetime.datetime.utcnow()
    )
    db.add(doc)

    # Log activity
    act = ActivityLog(
        document_id=doc_id,
        action_type="UPLOAD",
        message=f"Uploaded '{original_name}' ({format_file_size(file_size)})"
    )
    db.add(act)
    db.commit()
    db.refresh(doc)

    return {
        "document_id": doc.id,
        "filename": doc.original_name,
        "file_size": format_file_size(doc.file_size_bytes),
        "file_size_bytes": doc.file_size_bytes,
        "status": doc.status,
        "batch_id": batch_id
    }

@router.post("/upload")
async def upload_document(
    file: Optional[UploadFile] = File(None),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    upload_list = []
    if files:
        upload_list.extend(files)
    if file:
        upload_list.append(file)

    if not upload_list:
        raise HTTPException(status_code=400, detail="No files uploaded")

    batch_id = str(uuid.uuid4()) if len(upload_list) > 1 else None
    results = []
    for f in upload_list:
        res = await _save_uploaded_file(f, batch_id, db)
        results.append(res)

    if len(results) == 1 and not files:
        r = results[0]
        return {
            "message": "File uploaded successfully",
            "document_id": r["document_id"],
            "filename": r["filename"],
            "file_size": r["file_size"],
            "status": r["status"]
        }

    return {
        "message": f"{len(results)} files uploaded successfully",
        "batch_id": batch_id,
        "documents": results
    }

@router.post("/upload-batch")
async def upload_documents_batch(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided in batch upload")

    batch_id = str(uuid.uuid4())
    results = []
    for f in files:
        res = await _save_uploaded_file(f, batch_id, db)
        results.append(res)

    return {
        "message": f"{len(results)} files uploaded successfully in batch",
        "batch_id": batch_id,
        "documents": results
    }

@router.get("")
@router.get("/")
def list_documents(db: Session = Depends(get_db)):
    docs = db.query(Document).order_by(Document.upload_timestamp.desc()).all()
    results = []
    for d in docs:
        mats_count = db.query(MaterialItem).filter(MaterialItem.document_id == d.id).count()
        results.append({
            "id": d.id,
            "original_name": d.original_name,
            "file_type": d.file_type,
            "file_size_bytes": d.file_size_bytes,
            "file_size_formatted": format_file_size(d.file_size_bytes),
            "page_count": d.page_count,
            "status": d.status,
            "upload_timestamp": d.upload_timestamp.strftime("%Y-%m-%d %H:%M:%S") if d.upload_timestamp else "Not Available",
            "processing_timestamp": d.processing_timestamp.strftime("%Y-%m-%d %H:%M:%S") if d.processing_timestamp else "Not Available",
            "overall_confidence": d.overall_confidence,
            "document_type": d.document_type,
            "materials_count": mats_count,
            "verification_count": d.verification_needed_count,
        })
    return results

# In-memory tracking for real-time document processing progress and status polling
PROCESSING_STATUS: Dict[str, Dict[str, Any]] = {}

def _execute_document_processing(doc_id: str):
    """Background worker for asynchronous document processing."""
    t0 = time.time()
    print(f"[PROCESS] started: document_id={doc_id}", flush=True)
    db = SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if not doc:
            print(f"[PROCESS] ERROR: Document record {doc_id} not found in database", flush=True)
            PROCESSING_STATUS[doc_id] = {
                "document_id": doc_id,
                "status": "FAILED",
                "current_step": 1,
                "step_label": "Failed",
                "step_detail": "Document record not found",
                "progress_percent": 0,
                "error": "Document record not found"
            }
            return

        print(f"[PROCESS] file found: path={doc.stored_path}, size={doc.file_size_bytes} bytes, original_name={doc.original_name}", flush=True)

        doc.status = "PROCESSING"
        doc.error_message = None
        doc.current_step = 2
        doc.step_label = "Extracting PDF Text..."
        doc.step_detail = "Starting background OCR and analysis pipeline..."
        doc.progress_percent = 10
        db.commit()
        print(f"[PROCESS] database status updated: status=PROCESSING, step=2 (10%) - Extracting PDF Text...", flush=True)

        def on_progress(step: int, label: str, detail: str, percent: int):
            status = "COMPLETED" if step >= 7 else "PROCESSING"
            PROCESSING_STATUS[doc_id] = {
                "document_id": doc_id,
                "status": status,
                "current_step": step,
                "step_label": label,
                "step_detail": detail,
                "progress_percent": percent,
                "error": None
            }
            try:
                d = db.query(Document).filter(Document.id == doc_id).first()
                if d:
                    d.status = status
                    d.current_step = step
                    d.step_label = label
                    d.step_detail = detail
                    d.progress_percent = percent
                    db.commit()
                print(f"[PROCESS] database status updated: status={status}, step={step} ({percent}%) - {label}: {detail}", flush=True)
            except Exception as dberr:
                print(f"[PROCESS] Warning updating progress in DB: {dberr}", flush=True)
                try:
                    db.rollback()
                except Exception:
                    pass

        on_progress(2, "Extracting PDF Text...", "Analyzing document structure and layout", 12)

        # Run AI & OCR analysis pipeline with live progress callbacks
        analysis_result = ai_analyzer.analyze_document(doc.stored_path, doc.original_name, on_progress=on_progress)

        parsed_doc = analysis_result["parsed_doc"]
        raw_text = analysis_result["raw_ocr_text"]
        template: FixedOutputTemplate = analysis_result["structured_data"]
        materials_count = analysis_result["materials_count"]

        doc = db.query(Document).filter(Document.id == doc_id).first()
        doc.page_count = parsed_doc.get("page_count", 1)
        doc.status = "COMPLETED"
        doc.current_step = 7
        doc.step_label = "Completed"
        doc.step_detail = f"Successfully extracted {materials_count} materials ({template.confidence.overall_confidence} confidence)"
        doc.progress_percent = 100
        doc.processing_timestamp = datetime.datetime.utcnow()
        doc.overall_confidence = template.confidence.overall_confidence
        doc.confidence_score = template.confidence.confidence_score
        doc.raw_ocr_text = raw_text
        doc.structured_json = template.model_dump()
        doc.document_type = template.document_information.document_type
        doc.department = template.document_information.department
        doc.verification_needed_count = len(template.confidence.fields_requiring_verification)

        # Clear existing materials if re-processing
        db.query(MaterialItem).filter(MaterialItem.document_id == doc_id).delete()

        # Save extracted materials
        for m in template.materials:
            mat_item = MaterialItem(
                document_id=doc_id,
                sl_no=m.sl_no,
                material_code=m.material_code,
                material_description=m.material_description,
                specification=m.specification,
                quantity=m.quantity,
                unit=m.unit,
                grade=m.grade,
                make_brand=m.make_brand,
                vendor=m.vendor,
                required_date=m.required_date,
                status=m.status,
                remarks=m.remarks,
                category=template.material_information.material_category,
                unit_price=template.commercial_information.unit_price,
                total_value=template.commercial_information.total_value
            )
            db.add(mat_item)

        act = ActivityLog(
            document_id=doc_id,
            action_type="ANALYSIS",
            message=f"Analyzed '{doc.original_name}': {materials_count} materials extracted ({doc.overall_confidence} confidence)"
        )
        db.add(act)
        db.commit()
        db.refresh(doc)

        elapsed = round(time.time() - t0, 2)
        print(f"[PROCESS] completed: document_id={doc.id}, time={elapsed}s, materials={materials_count}", flush=True)

        PROCESSING_STATUS[doc_id] = {
            "document_id": doc.id,
            "status": "COMPLETED",
            "current_step": 7,
            "step_label": "Completed",
            "step_detail": f"Successfully extracted {materials_count} materials ({doc.overall_confidence} confidence)",
            "progress_percent": 100,
            "materials_count": materials_count,
            "overall_confidence": doc.overall_confidence,
            "structured_data": doc.structured_json,
            "error": None
        }
    except Exception as ex:
        err_msg = str(ex)
        full_tb = traceback.format_exc()
        print(f"[PROCESS] ERROR with full traceback for {doc_id}:\n{full_tb}", flush=True)
        try:
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if doc:
                doc.status = "FAILED"
                doc.current_step = 1
                doc.step_label = "Failed"
                doc.step_detail = f"Processing error: {err_msg}"
                doc.error_message = err_msg
                db.commit()
        except Exception as dberr:
            print(f"[PROCESS] Failed to record error in DB: {dberr}", flush=True)
        PROCESSING_STATUS[doc_id] = {
            "document_id": doc_id,
            "status": "FAILED",
            "current_step": 1,
            "step_label": "Failed",
            "step_detail": f"Processing error: {err_msg}",
            "progress_percent": 0,
            "error": err_msg
        }
    finally:
        db.close()

@router.get("/{doc_id}/status")
def get_document_status(doc_id: str, db: Session = Depends(get_db)):
    """Live status and real-time step polling endpoint."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # If memory status exists and is up to date, use it
    active = PROCESSING_STATUS.get(doc_id)
    if active and active.get("status") == "COMPLETED" and not active.get("structured_data"):
        if doc.structured_json:
            active["structured_data"] = doc.structured_json

    if active and (active.get("progress_percent", 0) >= (doc.progress_percent or 0)):
        return active

    # Return persistent DB state
    if doc.status == "COMPLETED" and doc.structured_json:
        return {
            "document_id": doc.id,
            "status": "COMPLETED",
            "current_step": doc.current_step or 7,
            "step_label": doc.step_label or "Completed",
            "step_detail": doc.step_detail or "Analysis ready for review and multi-format export",
            "progress_percent": doc.progress_percent or 100,
            "materials_count": len(doc.structured_json.get("materials", [])),
            "overall_confidence": doc.overall_confidence,
            "structured_data": doc.structured_json,
            "error": None
        }
    elif doc.status == "PROCESSING":
        return {
            "document_id": doc.id,
            "status": "PROCESSING",
            "current_step": doc.current_step or 2,
            "step_label": doc.step_label or "Processing...",
            "step_detail": doc.step_detail or "Analyzing document...",
            "progress_percent": doc.progress_percent or 15,
            "error": None
        }
    elif doc.status == "FAILED":
        return {
            "document_id": doc.id,
            "status": "FAILED",
            "current_step": doc.current_step or 1,
            "step_label": doc.step_label or "Failed",
            "step_detail": doc.step_detail or doc.error_message or "Processing failed",
            "progress_percent": 0,
            "error": doc.error_message or "Processing failed"
        }
    else:
        return {
            "document_id": doc.id,
            "status": doc.status or "UPLOADED",
            "current_step": doc.current_step or 1,
            "step_label": doc.step_label or "Uploaded",
            "step_detail": doc.step_detail or "Ready for processing",
            "progress_percent": doc.progress_percent or 5,
            "error": None
        }

@router.post("/{doc_id}/process")
def process_document(doc_id: str, background_tasks: BackgroundTasks, force: bool = False, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # If already processed and not forced, return cached structured output instantly
    if not force and doc.status == "COMPLETED" and doc.structured_json:
        return {
            "document_id": doc.id,
            "status": doc.status,
            "current_step": 7,
            "step_label": "Completed",
            "progress_percent": 100,
            "structured_data": doc.structured_json,
            "materials_count": len(doc.structured_json.get("materials", [])),
            "cached": True
        }

    # If already processing in background and not forced, return current progress
    active = PROCESSING_STATUS.get(doc_id)
    if not force and active and active.get("status") == "PROCESSING":
        return active

    if not pathlib.Path(doc.stored_path).exists():
        raise HTTPException(status_code=404, detail="Stored document file not found on disk")

    # Mark document as PROCESSING in DB immediately
    doc.status = "PROCESSING"
    doc.error_message = None
    doc.current_step = 2
    doc.step_label = "Extracting PDF Text..."
    doc.step_detail = "Starting background OCR and analysis pipeline..."
    doc.progress_percent = 10
    db.commit()

    PROCESSING_STATUS[doc_id] = {
        "document_id": doc.id,
        "status": "PROCESSING",
        "current_step": 2,
        "step_label": "Extracting PDF Text...",
        "step_detail": "Starting background OCR and analysis pipeline...",
        "progress_percent": 10,
        "error": None
    }

    # Launch background task via FastAPI BackgroundTasks
    background_tasks.add_task(_execute_document_processing, doc_id)

    return {
        "message": "Document processing started in background",
        "document_id": doc.id,
        "status": "PROCESSING",
        "current_step": 2,
        "step_label": "Extracting PDF Text...",
        "progress_percent": 10
    }

@router.post("/batch-process")
def batch_process_documents(
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    doc_ids = payload.get("document_ids", [])
    if not doc_ids:
        raise HTTPException(status_code=400, detail="No document IDs provided for batch processing")

    results = []
    for d_id in doc_ids:
        doc = db.query(Document).filter(Document.id == d_id).first()
        if not doc:
            results.append({"document_id": d_id, "status": "NOT_FOUND", "message": "Document not found"})
            continue

        if doc.status == "COMPLETED" and doc.structured_json:
            results.append({"document_id": doc.id, "status": "COMPLETED", "message": "Already processed", "cached": True})
            continue

        if not pathlib.Path(doc.stored_path).exists():
            doc.status = "FAILED"
            doc.error_message = "Stored file not found on disk"
            db.commit()
            results.append({"document_id": doc.id, "status": "FAILED", "message": "File not found on disk"})
            continue

        doc.status = "PROCESSING"
        doc.error_message = None
        doc.current_step = 2
        doc.step_label = "Extracting PDF Text..."
        doc.step_detail = "Starting background OCR and analysis pipeline..."
        doc.progress_percent = 10
        db.commit()

        PROCESSING_STATUS[d_id] = {
            "document_id": doc.id,
            "status": "PROCESSING",
            "current_step": 2,
            "step_label": "Extracting PDF Text...",
            "step_detail": "Starting background OCR and analysis pipeline...",
            "progress_percent": 10,
            "error": None
        }

        background_tasks.add_task(_execute_document_processing, d_id)
        results.append({"document_id": doc.id, "status": "PROCESSING", "message": "Processing started in background"})

    return {
        "message": f"Batch processing initiated for {len(results)} documents",
        "results": results
    }

@router.get("/{doc_id}")
def get_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    mats_count = db.query(MaterialItem).filter(MaterialItem.document_id == doc_id).count()

    return {
        "id": doc.id,
        "original_name": doc.original_name,
        "file_type": doc.file_type,
        "file_size_bytes": doc.file_size_bytes,
        "file_size_formatted": format_file_size(doc.file_size_bytes),
        "page_count": doc.page_count,
        "status": doc.status,
        "upload_timestamp": doc.upload_timestamp.strftime("%Y-%m-%d %H:%M:%S") if doc.upload_timestamp else "Not Available",
        "processing_timestamp": doc.processing_timestamp.strftime("%Y-%m-%d %H:%M:%S") if doc.processing_timestamp else "Not Available",
        "overall_confidence": doc.overall_confidence,
        "document_type": doc.document_type,
        "structured_data": doc.structured_json,
        "materials_count": mats_count,
        "verification_count": doc.verification_needed_count,
        "error_message": doc.error_message
    }

@router.get("/{doc_id}/ocr")
def get_document_ocr(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "document_id": doc.id,
        "filename": doc.original_name,
        "page_count": doc.page_count,
        "raw_ocr_text": doc.raw_ocr_text or "No text extracted yet."
    }

@router.get("/{doc_id}/analysis")
def get_document_analysis(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return {
        "document_id": doc.id,
        "filename": doc.original_name,
        "structured_data": doc.structured_json
    }

@router.get("/{doc_id}/template-pdf")
def get_template_pdf(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    stream = export_service.export_pdf(doc.structured_json, doc.original_name)
    return Response(
        content=stream.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=SAIL_Procurement_Template_{pathlib.Path(doc.original_name).stem}.pdf"}
    )

@router.get("/{doc_id}/template-docx")
@router.get("/{doc_id}/export/docx")
def get_template_docx(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    stream = export_service.export_docx(doc.structured_json, doc.original_name)
    clean_stem = pathlib.Path(doc.original_name).stem.replace(" ", "_")
    return Response(
        content=stream.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=SAIL_Procurement_Template_{clean_stem}.docx"}
    )

@router.get("/{doc_id}/preview")
def preview_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not pathlib.Path(doc.stored_path).exists():
        raise HTTPException(status_code=404, detail="Document file not found")

    p = pathlib.Path(doc.stored_path)
    ext = p.suffix.lower()
    media_types = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }
    media_type = media_types.get(ext, "application/octet-stream")
    return FileResponse(
        path=str(p),
        media_type=media_type,
        filename=doc.original_name,
        headers={"Content-Disposition": f"inline; filename={doc.original_name}"}
    )

@router.get("/{doc_id}/export/excel")
def export_document_excel(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    stream = export_service.export_excel(doc.structured_json, doc.original_name)
    export_filename = f"SAIL_Salem_Material_Report_{pathlib.Path(doc.original_name).stem}.xlsx"
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={export_filename}"}
    )

@router.get("/{doc_id}/export/pdf")
def export_document_pdf(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    stream = export_service.export_pdf(doc.structured_json, doc.original_name)
    export_filename = f"SAIL_Salem_Material_Report_{pathlib.Path(doc.original_name).stem}.pdf"
    return StreamingResponse(
        stream,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={export_filename}"}
    )

@router.get("/{doc_id}/export/json")
def export_document_json(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    json_str = export_service.export_json(doc.structured_json)
    export_filename = f"SAIL_Salem_Material_Report_{pathlib.Path(doc.original_name).stem}.json"
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={export_filename}"}
    )

@router.get("/batch-export")
def batch_export_documents(doc_ids: str, db: Session = Depends(get_db)):
    """Exports a ZIP archive containing PDF, DOCX, and Excel files for all specified document IDs."""
    ids = [d.strip() for d in doc_ids.split(",") if d.strip()]
    if not ids:
        raise HTTPException(status_code=400, detail="No document IDs specified for batch export")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for d_id in ids:
            doc = db.query(Document).filter(Document.id == d_id).first()
            if not doc or not doc.structured_json:
                continue

            stem = pathlib.Path(doc.original_name).stem.replace(" ", "_")
            # PDF
            try:
                pdf_st = export_service.export_pdf(doc.structured_json, doc.original_name)
                zip_file.writestr(f"{stem}/SAIL_Procurement_Template_{stem}.pdf", pdf_st.getvalue())
            except Exception:
                pass
            # DOCX
            try:
                docx_st = export_service.export_docx(doc.structured_json, doc.original_name)
                zip_file.writestr(f"{stem}/SAIL_Procurement_Template_{stem}.docx", docx_st.getvalue())
            except Exception:
                pass
            # Excel
            try:
                xl_st = export_service.export_excel(doc.structured_json, doc.original_name)
                zip_file.writestr(f"{stem}/SAIL_Material_Report_{stem}.xlsx", xl_st.getvalue())
            except Exception:
                pass

    zip_buffer.seek(0)
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=SAIL_Batch_Procurement_Export.zip"}
    )

@router.post("/demo/{demo_id}")
def load_demo_document(demo_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Loads realistic demo documents for immediate testing (e.g. Salem Proposal Note)."""
    # Check if Salem reference PDF exists in Downloads
    salem_pdf_path = pathlib.Path(r"C:\Users\HARISH\Downloads\procurement_template_format_updated (2) (1).pdf")
    
    doc_id = str(uuid.uuid4())
    filename = "procurement_template_format_updated (2) (1).pdf"
    stored_path = UPLOADS_DIR / f"{doc_id}_{filename}"

    if salem_pdf_path.exists():
        shutil.copyfile(salem_pdf_path, stored_path)
    else:
        # Fallback: create a dummy file if not found
        stored_path.write_bytes(b"%PDF-1.4 demo")

    file_size = stored_path.stat().st_size
    doc = Document(
        id=doc_id,
        original_name=filename,
        stored_path=str(stored_path),
        file_type="PDF",
        file_size_bytes=file_size,
        status="UPLOADED",
        upload_timestamp=datetime.datetime.utcnow()
    )
    db.add(doc)
    db.commit()

    # Automatically process the demo document
    return process_document(doc.id, background_tasks=background_tasks, db=db)
