"""
Document Parser for SAIL Material Management Module
Handles:
1. Multi-page PDFs (vector text & table extraction via pdfplumber + pypdf)
2. Scanned PDFs (automatic image rendering via pypdfium2 and OCR via ocr_service)
3. DOCX documents (python-docx)
4. XLSX/XLS spreadsheets (openpyxl)
5. Direct Image files (PNG, JPG, JPEG)
"""
import os
import json
import hashlib
import pathlib
import tempfile
from typing import Dict, Any, List, Tuple
import pdfplumber
import pypdf
import pypdfium2 as pdfium
import docx
import openpyxl

from app.services.ocr_service import ocr_engine

class DocumentParser:
    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def parse_file(self, file_path: str, original_filename: str) -> Dict[str, Any]:
        p = pathlib.Path(file_path).resolve()
        if not p.exists():
            return {
                "text": "",
                "pages": [],
                "page_count": 0,
                "tables": [],
                "is_scanned": False,
                "status": "error",
                "error": "File not found"
            }

        # Fast cache lookup using path, size, and modified time
        try:
            stat = p.stat()
            cache_key = f"{p}_{stat.st_size}_{stat.st_mtime}"
            if cache_key in self._cache:
                return dict(self._cache[cache_key])
        except Exception:
            cache_key = None

        ext = p.suffix.lower()

        if ext == ".pdf":
            res = self._parse_pdf(str(p), original_filename)
        elif ext in [".docx", ".doc"]:
            res = self._parse_docx(str(p), original_filename)
        elif ext in [".xlsx", ".xls"]:
            res = self._parse_xlsx(str(p), original_filename)
        elif ext in [".png", ".jpg", ".jpeg"]:
            res = self._parse_image(str(p), original_filename)
        else:
            res = {
                "text": "",
                "pages": [],
                "page_count": 0,
                "tables": [],
                "is_scanned": False,
                "status": "unsupported_format",
                "error": f"Unsupported extension: {ext}"
            }

        if cache_key and res.get("status") == "success":
            self._cache[cache_key] = res

        return res

    def _compute_sha256(self, path: str) -> str:
        """Computes SHA-256 hash of a file for content-based OCR caching."""
        h = hashlib.sha256()
        try:
            with open(path, "rb") as f:
                while chunk := f.read(65536):
                    h.update(chunk)
            return h.hexdigest()
        except Exception:
            return ""

    def _parse_pdf(self, pdf_path: str, original_filename: str) -> Dict[str, Any]:
        """Multi-page PDF extraction with scanned PDF detection and OCR fallback."""
        pages_text: List[str] = []
        all_tables: List[List[List[str]]] = []
        is_scanned = False

        # Phase 1: Try digital text & table extraction via pdfplumber
        try:
            with pdfplumber.open(pdf_path) as pdf:
                page_count = len(pdf.pages)
                for i, page in enumerate(pdf.pages):
                    ptxt = page.extract_text() or ""
                    pages_text.append(ptxt)

                    # Extract tables from page
                    try:
                        tbls = page.extract_tables()
                        if tbls:
                            for tbl in tbls:
                                # Clean None values
                                clean_tbl = [[str(cell or "").strip() for cell in row] for row in tbl]
                                all_tables.append(clean_tbl)
                    except Exception:
                        pass
        except Exception as ex:
            # Fallback to pypdf
            try:
                reader = pypdf.PdfReader(pdf_path)
                page_count = len(reader.pages)
                pages_text = [p.extract_text() or "" for p in reader.pages]
            except Exception as ex2:
                return {
                    "text": "",
                    "pages": [],
                    "page_count": 0,
                    "tables": [],
                    "is_scanned": True,
                    "status": "error",
                    "error": f"PDF parse error: {str(ex2)}"
                }

        combined_text = "\n\n".join(pages_text).strip()

        # Check if scanned (very little or no digital text across all pages)
        if len(combined_text) < 40 and page_count > 0:
            is_scanned = True

            # Content-hash based OCR cache check (Requirement 14 & 15)
            file_hash = self._compute_sha256(pdf_path)
            cache_dir = pathlib.Path(pdf_path).parent / ".ocr_cache"
            cache_dir.mkdir(parents=True, exist_ok=True)
            hash_cache_file = cache_dir / f"{file_hash}.json" if file_hash else None
            direct_cache_file = pathlib.Path(pdf_path).with_suffix(".ocr.json")

            cached_candidates = [hash_cache_file, direct_cache_file] if hash_cache_file else [direct_cache_file]
            for cf in cached_candidates:
                if cf and cf.exists():
                    try:
                        loaded_pages = json.loads(cf.read_text(encoding="utf-8"))
                        loaded_text = "\n\n".join(loaded_pages).strip()
                        if len(loaded_text) > 40:
                            pages_text = loaded_pages
                            combined_text = loaded_text
                            break
                    except Exception:
                        pass

            if not pages_text or len(combined_text) < 40:
                temp_dir = pathlib.Path(pdf_path).parent / ".ocr_temp"
                temp_dir.mkdir(parents=True, exist_ok=True)
                temp_files: List[str] = []
                try:
                    pdf_doc = pdfium.PdfDocument(pdf_path)
                    for p_idx in range(len(pdf_doc)):
                        img = pdf_doc[p_idx].render(scale=2).to_pil()
                        with tempfile.NamedTemporaryFile(dir=str(temp_dir), suffix=".png", delete=False) as tmp:
                            tmp_path = tmp.name
                        img.save(tmp_path)
                        temp_files.append(tmp_path)

                    # Bounded concurrent OCR with per-page and overall timeouts (Requirement 7 & 9)
                    ocr_results = ocr_engine.run_ocr_batch(temp_files, page_timeout=15, total_timeout=38)
                    pages_text = [r.get("text", "") for r in ocr_results]
                    combined_text = "\n\n".join(pages_text).strip()

                    # Save to persistent disk caches for instant subsequent processing (Requirement 14 & 15)
                    if combined_text and len(combined_text) > 40:
                        try:
                            if hash_cache_file:
                                hash_cache_file.write_text(json.dumps(pages_text, ensure_ascii=False), encoding="utf-8")
                            direct_cache_file.write_text(json.dumps(pages_text, ensure_ascii=False), encoding="utf-8")
                        except Exception:
                            pass
                except Exception as ocr_err:
                    combined_text += f"\n[OCR Fallback encountered error: {str(ocr_err)}]"
                finally:
                    for tf in temp_files:
                        try:
                            if os.path.exists(tf):
                                os.remove(tf)
                        except Exception:
                            pass

        return {
            "text": combined_text,
            "pages": pages_text,
            "page_count": page_count,
            "tables": all_tables,
            "is_scanned": is_scanned,
            "status": "success",
            "error": None
        }

    def _parse_docx(self, docx_path: str, original_filename: str) -> Dict[str, Any]:
        try:
            doc = docx.Document(docx_path)
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
            tables = []
            for t in doc.tables:
                rows = []
                for row in t.rows:
                    rows.append([cell.text.strip() for cell in row.cells])
                tables.append(rows)

            full_text = "\n".join(paragraphs)
            return {
                "text": full_text,
                "pages": [full_text],
                "page_count": 1,
                "tables": tables,
                "is_scanned": False,
                "status": "success",
                "error": None
            }
        except Exception as ex:
            return {
                "text": "",
                "pages": [],
                "page_count": 0,
                "tables": [],
                "is_scanned": False,
                "status": "error",
                "error": str(ex)
            }

    def _parse_xlsx(self, xlsx_path: str, original_filename: str) -> Dict[str, Any]:
        try:
            wb = openpyxl.load_workbook(xlsx_path, data_only=True)
            text_lines = []
            tables = []
            for sheet in wb.sheetnames:
                ws = wb[sheet]
                text_lines.append(f"--- Sheet: {sheet} ---")
                sheet_rows = []
                for row in ws.iter_rows(values_only=True):
                    row_vals = [str(c).strip() if c is not None else "" for c in row]
                    if any(row_vals):
                        sheet_rows.append(row_vals)
                        text_lines.append(" | ".join(row_vals))
                if sheet_rows:
                    tables.append(sheet_rows)
            
            full_text = "\n".join(text_lines)
            return {
                "text": full_text,
                "pages": [full_text],
                "page_count": len(wb.sheetnames),
                "tables": tables,
                "is_scanned": False,
                "status": "success",
                "error": None
            }
        except Exception as ex:
            return {
                "text": "",
                "pages": [],
                "page_count": 0,
                "tables": [],
                "is_scanned": False,
                "status": "error",
                "error": str(ex)
            }

    def _parse_image(self, img_path: str, original_filename: str) -> Dict[str, Any]:
        res = ocr_engine.run_ocr_on_image(img_path)
        txt = res.get("text", "")
        return {
            "text": txt,
            "pages": [txt],
            "page_count": 1,
            "tables": [],
            "is_scanned": True,
            "status": res.get("status", "success"),
            "error": None
        }

document_parser = DocumentParser()
