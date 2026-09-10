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
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.models import Document, MaterialItem, ActivityLog
from app.utils.file_validation import validate_uploaded_file, format_file_size, MAX_FILE_SIZE_BYTES
from app.utils.security import sanitize_filename
from app.services.ai_analyzer import ai_analyzer
from app.services.export_service import export_service
from app.schemas.procurement_schema import FixedOutputTemplate, DocumentResponse, DocumentListItem

router = APIRouter(prefix="/api/documents", tags=["Documents"])

UPLOADS_DIR = pathlib.Path(__file__).resolve().parent.parent.parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    original_name = file.filename or "uploaded_document.pdf"
    clean_name = sanitize_filename(original_name)

    # Read file content & validate size
    contents = await file.read()
    file_size = len(contents)

    is_valid, err_msg, mime_type = validate_uploaded_file(original_name, file_size)
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)

    doc_id = str(uuid.uuid4())
    stored_path = UPLOADS_DIR / f"{doc_id}_{clean_name}"
    with open(stored_path, "wb") as f:
        f.write(contents)

    # Determine file type
    ext = pathlib.Path(clean_name).suffix.upper().replace(".", "")

    doc = Document(
        id=doc_id,
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
        "message": "File uploaded successfully",
        "document_id": doc.id,
        "filename": doc.original_name,
        "file_size": format_file_size(doc.file_size_bytes),
        "status": doc.status
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

@router.post("/{doc_id}/process")
def process_document(doc_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if not pathlib.Path(doc.stored_path).exists():
        raise HTTPException(status_code=404, detail="Stored document file not found on disk")

    try:
        doc.status = "PROCESSING"
        db.commit()

        # Run AI & OCR analysis pipeline
        analysis_result = ai_analyzer.analyze_document(doc.stored_path, doc.original_name)

        parsed_doc = analysis_result["parsed_doc"]
        raw_text = analysis_result["raw_ocr_text"]
        template: FixedOutputTemplate = analysis_result["structured_data"]
        materials_count = analysis_result["materials_count"]

        doc.page_count = parsed_doc.get("page_count", 1)
        doc.status = "COMPLETED"
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

        return {
            "message": "Document processed successfully",
            "document_id": doc.id,
            "status": doc.status,
            "materials_count": materials_count,
            "overall_confidence": doc.overall_confidence,
            "structured_data": doc.structured_json
        }
    except Exception as ex:
        doc.status = "FAILED"
        doc.error_message = str(ex)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(ex)}")

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

@router.post("/demo/{demo_id}")
def load_demo_document(demo_id: str, db: Session = Depends(get_db)):
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
    return process_document(doc.id, db)
