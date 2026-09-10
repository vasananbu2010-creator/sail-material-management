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

    def run_ocr_batch(self, image_paths: List[str]) -> List[Dict[str, Any]]:
        """Run OCR on multiple images in a single batch process for high performance."""
        if not image_paths:
            return []

        if len(image_paths) == 1:
            return [self.run_ocr_on_image(image_paths[0])]

        # Method 1: Try PyTesseract in parallel (Linux/Render/Docker)
        try:
            import pytesseract
            from PIL import Image
            import concurrent.futures

            # Limit thread contention for Tesseract on shared container CPUs
            os.environ["OMP_THREAD_LIMIT"] = "1"
            os.environ["OPENBLAS_NUM_THREADS"] = "1"
            os.environ["MKL_NUM_THREADS"] = "1"

            def _ocr_tess(p):
                try:
                    img = Image.open(p)
                    txt = pytesseract.image_to_string(img, timeout=25).strip()
                    if txt:
                        lines = [l.strip() for l in txt.splitlines() if l.strip()]
                        wc = len(txt.split())
                        conf = 0.95 if wc > 40 else (0.85 if wc > 10 else 0.70)
                        return {"text": txt, "lines": lines, "confidence": conf, "confidence_str": f"{int(conf*100)}%", "status": "success", "engine": "Tesseract-OCR"}
                except Exception:
                    pass
                return {"text": "", "lines": [], "confidence": 0.0, "confidence_str": "0%", "status": "error", "engine": "Tesseract-OCR"}

            with concurrent.futures.ThreadPoolExecutor(max_workers=min(2, len(image_paths))) as executor:
                results = list(executor.map(_ocr_tess, image_paths))
                if any(r["text"] for r in results):
                    return results
        except Exception:
            pass

        # Method 2: Windows Native PowerShell Batch OCR (Single PowerShell Process for all pages)
        if self.is_windows and self.runner_script.exists():
            import tempfile
            list_file_path = None
            try:
                with tempfile.NamedTemporaryFile(suffix=".txt", delete=False, mode="w", encoding="utf-8") as lf:
                    for ip in image_paths:
                        lf.write(str(pathlib.Path(ip).resolve()) + "\n")
                    list_file_path = lf.name

                cmd = [
                    "powershell",
                    "-NoProfile",
                    "-ExecutionPolicy", "Bypass",
                    "-File", str(self.runner_script),
                    "-ImageListFile", list_file_path
                ]
                # Timeout of 60s for batch OCR
                proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=60)
                if proc.returncode == 0:
                    stdout = proc.stdout
                    # Parse pages delimited by ---PAGE_START:idx--- and ---PAGE_END:idx---
                    pages_data: List[Dict[str, Any]] = []
                    chunks = stdout.split("---PAGE_START:")
                    for idx, chunk in enumerate(chunks[1:]):
                        content = chunk.split(f"---PAGE_END:{idx}---")[0] if f"---PAGE_END:{idx}---" in chunk else chunk.split("---PAGE_END:")[0]
                        lines = [l.strip() for l in content.splitlines() if l.strip() and not l.strip().startswith("---PAGE_")]
                        txt = "\n".join(lines).strip()
                        wc = len(txt.split())
                        conf = 0.96 if wc > 50 else (0.90 if wc > 20 else 0.75)
                        pages_data.append({
                            "text": txt,
                            "lines": lines,
                            "confidence": conf if txt else 0.0,
                            "confidence_str": f"{int(conf * 100)}%" if txt else "0%",
                            "status": "success" if txt else "empty",
                            "engine": "Windows.Media.Ocr"
                        })

                    if len(pages_data) == len(image_paths):
                        return pages_data
                    elif len(pages_data) > 0:
                        while len(pages_data) < len(image_paths):
                            pages_data.append({"text": "", "lines": [], "confidence": 0.0, "confidence_str": "0%", "status": "missing", "engine": "Windows.Media.Ocr"})
                        return pages_data
            except Exception:
                pass
            finally:
                if list_file_path and os.path.exists(list_file_path):
                    try: os.remove(list_file_path)
                    except Exception: pass

        # Method 3: Fallback to running individually if batch had an issue
        return [self.run_ocr_on_image(p) for p in image_paths]

ocr_engine = OCRService()

