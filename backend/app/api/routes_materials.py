"""
Materials API Endpoints:
- List materials with dynamic search & filtering
- Update material status / details
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.database import get_db
from app.models.models import MaterialItem, Document, ActivityLog

router = APIRouter(prefix="/api/materials", tags=["Materials"])

@router.get("")
def list_materials(
    search: Optional[str] = Query(None),
    code: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    vendor: Optional[str] = Query(None),
    grade: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    document_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(MaterialItem)

    if document_id:
        query = query.filter(MaterialItem.document_id == document_id)

    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                MaterialItem.material_description.ilike(s),
                MaterialItem.material_code.ilike(s),
                MaterialItem.specification.ilike(s),
                MaterialItem.vendor.ilike(s),
                MaterialItem.grade.ilike(s),
                MaterialItem.remarks.ilike(s)
            )
        )

    if code and code != "all":
        query = query.filter(MaterialItem.material_code.ilike(f"%{code}%"))

    if category and category != "all":
        query = query.filter(MaterialItem.category == category)

    if vendor and vendor != "all":
        query = query.filter(MaterialItem.vendor.ilike(f"%{vendor}%"))

    if grade and grade != "all":
        query = query.filter(MaterialItem.grade.ilike(f"%{grade}%"))

    if status and status != "all":
        query = query.filter(MaterialItem.status == status)

    materials = query.order_by(MaterialItem.sl_no).limit(limit).all()

    return {
        "count": len(materials),
        "materials": [
            {
                "id": m.id,
                "document_id": m.document_id,
                "sl_no": m.sl_no,
                "material_code": m.material_code,
                "material_description": m.material_description,
                "specification": m.specification,
                "quantity": m.quantity,
                "unit": m.unit,
                "grade": m.grade,
                "make_brand": m.make_brand,
                "vendor": m.vendor,
                "required_date": m.required_date,
                "status": m.status,
                "remarks": m.remarks,
                "category": m.category,
                "unit_price": m.unit_price,
                "total_value": m.total_value
            }
            for m in materials
        ]
    }

@router.put("/{mat_id}")
def update_material_status(
    mat_id: str,
    payload: dict,
    db: Session = Depends(get_db)
):
    m = db.query(MaterialItem).filter(MaterialItem.id == mat_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Material item not found")

    new_status = payload.get("status")
    if new_status:
        m.status = new_status

    for field in ["material_code", "material_description", "specification", "quantity", "unit", "grade", "remarks"]:
        if field in payload:
            setattr(m, field, payload[field])

    # Log activity
    act = ActivityLog(
        document_id=m.document_id,
        action_type="STATUS_UPDATE",
        message=f"Updated item '{m.material_description}' status to {m.status}"
    )
    db.add(act)
    db.commit()
    db.refresh(m)

    return {"message": "Material updated successfully", "material": m.id, "status": m.status}
