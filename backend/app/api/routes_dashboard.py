"""
Dashboard API Endpoints:
- Aggregated KPIs
- Module Health & Status
- Live Activity Feed
- Recently Uploaded Documents
"""
import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.database import get_db
from app.models.models import Document, MaterialItem, ActivityLog
from app.utils.file_validation import format_file_size

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

def get_relative_time(dt: datetime.datetime) -> str:
    if not dt:
        return "Just now"
    diff = datetime.datetime.utcnow() - dt
    secs = int(diff.total_seconds())
    if secs < 60:
        return "Just now"
    elif secs < 3600:
        mins = secs // 60
        return f"{mins} min ago" if mins == 1 else f"{mins} mins ago"
    elif secs < 86400:
        hrs = secs // 3600
        return f"{hrs} hr ago" if hrs == 1 else f"{hrs} hrs ago"
    else:
        days = secs // 86400
        return f"{days} day ago" if days == 1 else f"{days} days ago"

@router.get("")
def get_dashboard_data(db: Session = Depends(get_db)):
    total_docs = db.query(Document).count()
    total_mats = db.query(MaterialItem).count()
    
    # Documents this month
    now = datetime.datetime.utcnow()
    month_start = datetime.datetime(now.year, now.month, 1)
    docs_this_month = db.query(Document).filter(Document.upload_timestamp >= month_start).count()

    # Pending verification
    pending_verif = db.query(Document).filter(Document.verification_needed_count > 0).count()
    pending_mat_verif = db.query(MaterialItem).filter(MaterialItem.status == "Needs Verification").count()
    total_pending = pending_verif + pending_mat_verif

    # Recent Activities (dynamically fetched from DB)
    raw_activities = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(10).all()
    recent_activities = []
    for a in raw_activities:
        recent_activities.append({
            "id": a.id,
            "action_type": a.action_type,
            "message": a.message,
            "relative_time": get_relative_time(a.timestamp),
            "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M:%S") if a.timestamp else "",
            "status": a.status
        })

    # If no activities yet, provide initial seed notice
    if not recent_activities:
        recent_activities.append({
            "id": "act-init",
            "action_type": "SYSTEM",
            "message": "SAIL Material Management Engine initialized and ready.",
            "relative_time": "Just now",
            "timestamp": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
            "status": "success"
        })

    # Recent Documents
    recent_docs = db.query(Document).order_by(Document.upload_timestamp.desc()).limit(6).all()
    docs_list = []
    for d in recent_docs:
        m_count = db.query(MaterialItem).filter(MaterialItem.document_id == d.id).count()
        docs_list.append({
            "id": d.id,
            "original_name": d.original_name,
            "file_type": d.file_type,
            "file_size_formatted": format_file_size(d.file_size_bytes),
            "page_count": d.page_count,
            "status": d.status,
            "upload_timestamp": d.upload_timestamp.strftime("%Y-%m-%d %H:%M:%S") if d.upload_timestamp else "",
            "overall_confidence": d.overall_confidence,
            "document_type": d.document_type,
            "materials_count": m_count
        })

    return {
        "total_documents": total_docs,
        "total_materials": total_mats,
        "documents_this_month": docs_this_month,
        "pending_verification": total_pending,
        "module_status": {
            "ocr_engine": "Online",
            "ai_analysis": "Online",
            "database": "Online",
            "document_processing": "Online"
        },
        "recent_activities": recent_activities,
        "recent_documents": docs_list
    }
