"""
SQLAlchemy ORM Models for Documents, Materials, and Audit Activities
"""
import datetime
import uuid
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    original_name = Column(String(255), nullable=False)
    stored_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    page_count = Column(Integer, default=1)
    batch_id = Column(String(36), nullable=True, index=True)
    status = Column(String(50), default="UPLOADED")  # UPLOADED, PROCESSING, COMPLETED, FAILED
    upload_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    processing_timestamp = Column(DateTime, nullable=True)
    overall_confidence = Column(String(20), default="95%")
    confidence_score = Column(Float, default=0.95)
    verification_needed_count = Column(Integer, default=0)
    document_type = Column(String(100), default="Procurement Document")
    department = Column(String(100), default="Salem Steel Plant")
    
    current_step = Column(Integer, default=1)
    step_label = Column(String(200), default="Uploaded")
    step_detail = Column(String(500), default="Ready for processing")
    progress_percent = Column(Integer, default=0)
    
    raw_ocr_text = Column(Text, default="")
    structured_json = Column(JSON, default=dict)
    error_message = Column(Text, nullable=True)

    materials = relationship("MaterialItem", back_populates="document", cascade="all, delete-orphan")
    activities = relationship("ActivityLog", back_populates="document", cascade="all, delete-orphan")

class MaterialItem(Base):
    __tablename__ = "materials"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    sl_no = Column(Integer, default=1)
    material_code = Column(String(100), default="Not Available")
    material_description = Column(Text, default="Not Available")
    specification = Column(Text, default="Not Available")
    quantity = Column(String(50), default="Not Available")
    unit = Column(String(50), default="Not Available")
    grade = Column(String(100), default="Not Available")
    make_brand = Column(String(100), default="Not Available")
    vendor = Column(String(200), default="Not Available")
    required_date = Column(String(50), default="Not Available")
    status = Column(String(50), default="Pending")  # Pending, Under Review, Approved, Procurement, Received, Needs Verification
    remarks = Column(Text, default="Not Available")
    category = Column(String(100), default="Steel & Scrap")
    unit_price = Column(String(50), default="Not Available")
    total_value = Column(String(50), default="Not Available")

    document = relationship("Document", back_populates="materials")

class ActivityLog(Base):
    __tablename__ = "activities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    action_type = Column(String(50), nullable=False)  # UPLOAD, OCR, ANALYSIS, EXPORT, STATUS_UPDATE
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(20), default="success")

    document = relationship("Document", back_populates="activities")
