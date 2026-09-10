"""
OCR Service for SAIL Material Management Module
Cross-platform support:
1. PyTesseract / Tesseract OCR (Linux, Docker, Render)
2. Windows Native Media.Ocr runner (Local Windows)
3. Safe fallback if no OCR binary is available
"""
import os
import sys
import subprocess
import pathlib
from typing import Dict, Any, List

class OCRService:
    def __init__(self):
        self.runner_script = pathlib.Path(__file__).parent / "win_ocr_runner.ps1"
        self.is_windows = sys.platform.startswith("win")

    def run_ocr_on_image(self, image_path: str) -> Dict[str, Any]:
        img_p = pathlib.Path(image_path).resolve()
        if not img_p.exists():
            return {
                "text": "",
                "lines": [],
                "confidence": 0.0,
                "confidence_str": "0%",
                "status": "file_not_found"
            }

        # Method 1: Try PyTesseract (Linux/Render/Docker)
        try:
            import pytesseract
            from PIL import Image
            img = Image.open(str(img_p))
            text = pytesseract.image_to_string(img).strip()
            if text:
                lines = [l.strip() for l in text.splitlines() if l.strip()]
                word_count = len(text.split())
                conf = 0.95 if word_count > 40 else (0.85 if word_count > 10 else 0.70)
                return {
                    "text": text,
                    "lines": lines,
                    "confidence": conf,
                    "confidence_str": f"{int(conf * 100)}%",
                    "status": "success",
                    "engine": "Tesseract-OCR"
                }
        except Exception:
            pass

        # Method 2: Windows Native PowerShell OCR
        if self.is_windows and self.runner_script.exists():
            try:
                cmd = [
                    "powershell",
                    "-NoProfile",
                    "-ExecutionPolicy", "Bypass",
                    "-File", str(self.runner_script),
                    "-ImagePath", str(img_p)
                ]
                proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=90)
                if proc.returncode == 0:
                    stdout = proc.stdout.strip()
                    lines = [line.strip() for line in stdout.splitlines() if line.strip()]
                    full_text = "\n".join(lines)
                    word_count = len(full_text.split())
                    conf = 0.96 if word_count > 50 else (0.90 if word_count > 20 else 0.75)
                    return {
                        "text": full_text,
                        "lines": lines,
                        "confidence": conf,
                        "confidence_str": f"{int(conf * 100)}%",
                        "status": "success",
                        "engine": "Windows.Media.Ocr"
                    }
            except Exception:
                pass

        # Method 3: Graceful fallback
        return {
            "text": "",
            "lines": [],
            "confidence": 0.0,
            "confidence_str": "0%",
            "status": "ocr_engine_not_available",
            "engine": "None"
        }

ocr_engine = OCRService()

