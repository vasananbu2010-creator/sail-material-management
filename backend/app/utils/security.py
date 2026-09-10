"""
Security utilities for sanitized filenames and path safety
"""
import re
import pathlib
import uuid

def sanitize_filename(filename: str) -> str:
    clean_name = pathlib.Path(filename).name
    clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '_', clean_name)
    if not clean_name or clean_name.startswith('.'):
        clean_name = f"doc_{uuid.uuid4().hex[:8]}{clean_name}"
    return clean_name
