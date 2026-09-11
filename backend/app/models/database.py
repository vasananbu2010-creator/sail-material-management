"""
Database Connection & Session Management using SQLite (SQLAlchemy)
Configured for easy migration to PostgreSQL.
"""
import os
import pathlib
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

BASE_DIR = pathlib.Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "sail_procurement.db"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# Render gives postgres://, but SQLAlchemy 1.4+ and 2.0+ require postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine_kwargs = {
    "pool_pre_ping": True
}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from app.models.models import Document, MaterialItem, ActivityLog
    from sqlalchemy import text
    Base.metadata.create_all(bind=engine)

    # Safe migration: ensure progress tracking columns exist in documents table
    try:
        with engine.connect() as conn:
            for col, col_type, default_val in [
                ("current_step", "INTEGER", "1"),
                ("step_label", "VARCHAR(200)", "'Uploaded'"),
                ("step_detail", "VARCHAR(500)", "'Ready for processing'"),
                ("progress_percent", "INTEGER", "0"),
                ("batch_id", "VARCHAR(36)", "NULL"),
            ]:
                try:
                    conn.execute(text(f"ALTER TABLE documents ADD COLUMN {col} {col_type} DEFAULT {default_val}"))
                    conn.commit()
                except Exception:
                    pass
    except Exception:
        pass
