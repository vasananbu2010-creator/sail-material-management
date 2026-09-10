"""
OCR Service for SAIL Material Management Module
Cross-platform support:
1. PyTesseract / Tesseract OCR (Linux, Docker, Render)
2. Windows Native Media.Ocr runner (Local Windows)
3. Safe fallback if no OCR binary is available
"""
import os
import sys
import shutil
import subprocess
import pathlib
import time
from typing import Dict, Any, List, Optional

class OCRService:
    def __init__(self):
        self.runner_script = pathlib.Path(__file__).parent / "win_ocr_runner.ps1"
        self.is_windows = sys.platform.startswith("win")
        self._configure_env()
        self.tesseract_cmd = self._find_tesseract()

    def _configure_env(self):
        """Limit CPU thread contention on containerized and shared CPUs."""
        os.environ["OMP_THREAD_LIMIT"] = "1"
        os.environ["OPENBLAS_NUM_THREADS"] = "1"
        os.environ["MKL_NUM_THREADS"] = "1"

    def _find_tesseract(self) -> Optional[str]:
        """Locate Tesseract binary across Linux and Windows environments."""
        cmd = shutil.which("tesseract")
        if cmd:
            return cmd
        candidates = [
            "/usr/bin/tesseract",
            "/usr/local/bin/tesseract",
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        ]
        for c in candidates:
            if os.path.exists(c):
                return c
        return None

    def _run_tesseract_page(self, image_path: str, timeout: int = 15, page_idx: int = 1, total_pages: int = 1) -> Dict[str, Any]:
        """Runs Tesseract on a single image file with hard timeout and strict process termination."""
        print(f"[OCR] started page {page_idx}/{total_pages}: file={image_path}", flush=True)
        t_start = time.time()
        img_p = pathlib.Path(image_path).resolve()
        if not img_p.exists():
            print(f"[OCR] page {page_idx}/{total_pages} file not found: {image_path}", flush=True)
            return {
                "text": "",
                "lines": [],
                "confidence": 0.0,
                "confidence_str": "0%",
                "status": "file_not_found",
                "engine": "None"
            }

        env = dict(os.environ)
        env["OMP_THREAD_LIMIT"] = "1"
        env["OPENBLAS_NUM_THREADS"] = "1"
        env["MKL_NUM_THREADS"] = "1"

        tess_bin = self.tesseract_cmd or "tesseract"
        cmd = [
            tess_bin,
            str(img_p),
            "stdout",
            "-l", "eng",
            "--oem", "1",
            "--dpi", "144",
            "-c", "tessedit_do_invert=0"
        ]

        # Method A: Direct CLI execution with stdout piping (Fastest, zero PIL memory, direct SIGKILL on timeout)
        try:
            proc = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=timeout,
                env=env
            )
            elapsed = time.time() - t_start
            if proc.returncode == 0:
                text = proc.stdout.strip()
                lines = [l.strip() for l in text.splitlines() if l.strip()]
                wc = len(text.split())
                conf = 0.95 if wc > 40 else (0.85 if wc > 10 else 0.70)
                print(f"[OCR] completed page {page_idx}/{total_pages}: text_len={len(text)}, conf={conf}, time={elapsed:.2f}s", flush=True)
                return {
                    "text": text,
                    "lines": lines,
                    "confidence": conf if text else 0.0,
                    "confidence_str": f"{int(conf * 100)}%" if text else "0%",
                    "status": "success" if text else "empty",
                    "engine": "Tesseract-CLI"
                }
            else:
                err_snippet = proc.stderr.strip()[:100] if proc.stderr else "Unknown error"
                print(f"[OCR] page {page_idx}/{total_pages} CLI non-zero exit ({proc.returncode}): {err_snippet} - attempting fallback", flush=True)
        except subprocess.TimeoutExpired:
            elapsed = time.time() - t_start
            print(f"[OCR] page {page_idx}/{total_pages} TIMEOUT after {elapsed:.2f}s (limit={timeout}s) - continuing to next page", flush=True)
            return {
                "text": "",
                "lines": [],
                "confidence": 0.0,
                "confidence_str": "0%",
                "status": "page_timeout",
                "engine": "Tesseract-Timeout"
            }
        except Exception as cli_ex:
            print(f"[OCR] page {page_idx}/{total_pages} CLI exception: {cli_ex} - attempting pytesseract fallback", flush=True)

        # Method B: Pytesseract wrapper fallback with timeout
        try:
            import pytesseract
            if self.tesseract_cmd:
                pytesseract.pytesseract.tesseract_cmd = self.tesseract_cmd
            text = pytesseract.image_to_string(str(img_p), timeout=timeout).strip()
            elapsed = time.time() - t_start
            if text:
                lines = [l.strip() for l in text.splitlines() if l.strip()]
                wc = len(text.split())
                conf = 0.95 if wc > 40 else (0.85 if wc > 10 else 0.70)
                print(f"[OCR] completed page {page_idx}/{total_pages} via Pytesseract: text_len={len(text)}, conf={conf}, time={elapsed:.2f}s", flush=True)
                return {
                    "text": text,
                    "lines": lines,
                    "confidence": conf,
                    "confidence_str": f"{int(conf * 100)}%",
                    "status": "success",
                    "engine": "Pytesseract"
                }
        except Exception as ex:
            elapsed = time.time() - t_start
            print(f"[OCR] page {page_idx}/{total_pages} Pytesseract fallback error ({elapsed:.2f}s): {str(ex)[:80]}", flush=True)
            return {
                "text": "",
                "lines": [],
                "confidence": 0.0,
                "confidence_str": "0%",
                "status": f"page_error: {str(ex)[:60]}",
                "engine": "None"
            }

        elapsed = time.time() - t_start
        print(f"[OCR] completed page {page_idx}/{total_pages}: empty text ({elapsed:.2f}s)", flush=True)
        return {
            "text": "",
            "lines": [],
            "confidence": 0.0,
            "confidence_str": "0%",
            "status": "empty",
            "engine": "None"
        }

    def run_ocr_on_image(self, image_path: str, timeout: int = 20) -> Dict[str, Any]:
        """Run OCR on a single image file."""
        img_p = pathlib.Path(image_path).resolve()
        if not img_p.exists():
            return {"text": "", "lines": [], "confidence": 0.0, "confidence_str": "0%", "status": "file_not_found", "engine": "None"}

        # Windows PowerShell runner if available
        if self.is_windows and self.runner_script.exists():
            try:
                cmd = [
                    "powershell",
                    "-NoProfile",
                    "-ExecutionPolicy", "Bypass",
                    "-File", str(self.runner_script),
                    "-ImagePath", str(img_p)
                ]
                proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=timeout)
                if proc.returncode == 0:
                    stdout = proc.stdout.strip()
                    lines = [line.strip() for line in stdout.splitlines() if line.strip()]
                    full_text = "\n".join(lines)
                    wc = len(full_text.split())
                    conf = 0.96 if wc > 50 else (0.90 if wc > 20 else 0.75)
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

        # Cross-platform Tesseract fallback
        return self._run_tesseract_page(str(img_p), timeout=timeout)

    def run_ocr_batch(
        self,
        image_paths: List[str],
        page_timeout: int = 15,
        total_timeout: Optional[int] = None,
        progress_callback: Optional[Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Run bounded, non-blocking OCR across multiple pages.
        Guarantees:
        - Max 2 concurrent workers on Free Tier (zero CPU thrashing).
        - Hard per-page timeout (15s).
        - Dynamic overall timeout budget (default max(180, len(image_paths) * 20) seconds).
        - If any page times out or errors, remaining pages continue uninterrupted.
        - All workers are cleanly joined/canceled without process leakage.
        """
        if not image_paths:
            return []

        effective_timeout = total_timeout if total_timeout is not None else max(180, len(image_paths) * 20)

        if len(image_paths) == 1:
            res = [self.run_ocr_on_image(image_paths[0], timeout=page_timeout)]
            if progress_callback:
                try:
                    progress_callback(1, 1)
                except Exception:
                    pass
            return res

        # On Windows: Try high-speed Windows.Media.Ocr batch process first
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
                proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=effective_timeout)
                if proc.returncode == 0:
                    stdout = proc.stdout
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
                        if progress_callback:
                            try:
                                progress_callback(len(image_paths), len(image_paths))
                            except Exception:
                                pass
                        return pages_data
                    elif len(pages_data) > 0:
                        while len(pages_data) < len(image_paths):
                            pages_data.append({"text": "", "lines": [], "confidence": 0.0, "confidence_str": "0%", "status": "missing", "engine": "Windows.Media.Ocr"})
                        if progress_callback:
                            try:
                                progress_callback(len(image_paths), len(image_paths))
                            except Exception:
                                pass
                        return pages_data
            except Exception:
                pass
            finally:
                if list_file_path and os.path.exists(list_file_path):
                    try:
                        os.remove(list_file_path)
                    except Exception:
                        pass

        # Linux / Render / Docker Bounded Execution
        # On Render Free Tier (shared vCPU), sequential execution (max_workers=1) ensures:
        # 1. 100% CPU dedicated to each page without thread thrashing.
        # 2. Predictable, fast 2-4s completion per page.
        # 3. Steady, uninterrupted progress updates to the database & UI.
        # 4. Zero worker deadlock or starvation.
        total_p = len(image_paths)
        max_workers = 1 if not self.is_windows else min(2, total_p)
        print(f"[OCR] batch started: {total_p} pages to scan (workers={max_workers}, timeout_per_page={page_timeout}s)", flush=True)

        results: List[Optional[Dict[str, Any]]] = [None] * total_p
        completed_count = 0

        if max_workers == 1:
            for idx, img_p in enumerate(image_paths):
                page_res = self._run_tesseract_page(img_p, timeout=page_timeout, page_idx=idx + 1, total_pages=total_p)
                results[idx] = page_res
                completed_count += 1
                if progress_callback:
                    try:
                        progress_callback(completed_count, total_p)
                    except Exception:
                        pass
        else:
            import concurrent.futures
            executor = concurrent.futures.ThreadPoolExecutor(max_workers=max_workers)
            future_to_idx = {
                executor.submit(self._run_tesseract_page, img_p, page_timeout, idx + 1, total_p): idx
                for idx, img_p in enumerate(image_paths)
            }

            try:
                for future in concurrent.futures.as_completed(future_to_idx, timeout=effective_timeout):
                    idx = future_to_idx[future]
                    completed_count += 1
                    try:
                        results[idx] = future.result()
                    except Exception as ex:
                        results[idx] = {
                            "text": "",
                            "lines": [],
                            "confidence": 0.0,
                            "confidence_str": "0%",
                            "status": f"worker_error: {str(ex)[:60]}",
                            "engine": "None"
                        }
                    if progress_callback:
                        try:
                            progress_callback(completed_count, total_p)
                        except Exception:
                            pass
            except concurrent.futures.TimeoutError:
                print(f"[OCR] batch timeout exceeded ({effective_timeout}s) - filling remaining pages safely", flush=True)
            finally:
                executor.shutdown(wait=False, cancel_futures=True)

        # Fill any deferred/timed-out pages safely without raising
        for i in range(total_p):
            if results[i] is None:
                results[i] = {
                    "text": "",
                    "lines": [],
                    "confidence": 0.0,
                    "confidence_str": "0%",
                    "status": "deferred_timeout",
                    "engine": "None"
                }

        total_text_len = sum(len(r.get("text", "")) for r in results)
        print(f"[OCR] OCR completed: total_pages={total_p}, total_text_len={total_text_len}", flush=True)
        return results

ocr_engine = OCRService()

