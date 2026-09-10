"""
SAIL Material Management Module - Salem Steel Plant
FastAPI Application Entrypoint
"""
import os
import pathlib
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.models.database import init_db
from app.api.routes_documents import router as documents_router
from app.api.routes_materials import router as materials_router
from app.api.routes_dashboard import router as dashboard_router
from app.api.routes_reports import router as reports_router

# Initialize database
init_db()

app = FastAPI(
    title="SAIL Material Management Module - Salem Steel Plant",
    description="Enterprise Document Extraction, OCR, and Standardized Material Procurement Platform",
    version="2.0.0"
)

from fastapi.responses import JSONResponse, FileResponse

# CORS Middleware (allow frontend communication & production domains)
raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(documents_router)
app.include_router(materials_router)
app.include_router(dashboard_router)
app.include_router(reports_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "plant": "Salem Steel Plant",
        "module": "SAIL Material Management",
        "ocr_engine": "Online",
        "ai_analysis": "Online",
        "database": "Online"
    }

@app.post("/api/analyze")
async def legacy_analyze(file: UploadFile = File(...)):
    """Legacy compatibility endpoint for direct analysis."""
    import tempfile
    ext = pathlib.Path(file.filename or "").suffix.lower() or ".pdf"
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    try:
        from app.services.ai_analyzer import ai_analyzer
        res = ai_analyzer.analyze_document(tmp_path, file.filename or "uploaded.pdf")
        return res["structured_data"].model_dump()
    finally:
        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass

@app.post("/api/load-sample")
def legacy_load_sample():
    """Legacy compatibility endpoint for loading sample proposal."""
    from app.services.ai_analyzer import ai_analyzer
    from app.services.template_mapper import template_mapper
    demo_path = pathlib.Path(__file__).resolve().parent / "sample_docs" / "sample_indent.pdf"
    if not demo_path.exists():
        demo_path = pathlib.Path(__file__).resolve().parent.parent / "sample_docs" / "sample_indent.pdf"
    if demo_path.exists():
        res = ai_analyzer.analyze_document(str(demo_path), "sample_indent.pdf")
        return res["structured_data"].model_dump()
    return {}

# Check if built frontend exists
FRONTEND_DIST_OPTIONS = [
    pathlib.Path(__file__).resolve().parent.parent / "frontend" / "dist",
    pathlib.Path(__file__).resolve().parent / "dist",
    pathlib.Path(__file__).resolve().parent / "static",
]

static_dir = None
for dist_path in FRONTEND_DIST_OPTIONS:
    if dist_path.exists() and (dist_path / "index.html").exists():
        static_dir = dist_path
        break

if static_dir:
    # Mount assets subfolder if present
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # SPA Catch-all Route: Serves index.html for frontend routes while keeping API intact
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})
        file_path = static_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(static_dir / "index.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
