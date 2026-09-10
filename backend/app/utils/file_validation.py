"""
File validation utilities:
- 30MB file size limit
- File type validation for PDF, DOCX, DOC, XLSX, XLS, PNG, JPG, JPEG
- Size formatters
"""
import os
import pathlib
from typing import Tuple

MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024  # 30 Megabytes

SUPPORTED_EXTENSIONS = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg"
}

def format_file_size(size_in_bytes: int) -> str:
    if size_in_bytes < 1024:
        return f"{size_in_bytes} B"
    elif size_in_bytes < 1024 * 1024:
        return f"{size_in_bytes / 1024:.1f} KB"
    else:
        return f"{size_in_bytes / (1024 * 1024):.2f} MB"

def validate_uploaded_file(filename: str, file_size: int) -> Tuple[bool, str, str]:
    if file_size > MAX_FILE_SIZE_BYTES:
        return False, "File size exceeds the maximum limit of 30 MB.", ""
    
    if file_size <= 0:
        return False, "Uploaded file is empty (0 bytes).", ""

    ext = pathlib.Path(filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        return False, f"Unsupported file type '{ext}'. Supported formats: PDF, DOCX, DOC, XLSX, XLS, PNG, JPG.", ""

    return True, "", SUPPORTED_EXTENSIONS[ext]
