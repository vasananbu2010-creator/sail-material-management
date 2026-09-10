import os
import sqlite3
import json
import datetime
from typing import List, Dict, Any, Optional, Tuple
from .models import EnquiryProposalNote, RecordCreate, RecordUpdate, RecordResponse

DB_PATH = os.path.join(os.path.dirname(__file__), 'records.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id TEXT NOT NULL,
            document_type TEXT NOT NULL,
            plant TEXT NOT NULL,
            extracted_on TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            supplier_name TEXT DEFAULT '',
            material_name TEXT DEFAULT '',
            material_grade_spec TEXT DEFAULT '',
            quantity TEXT DEFAULT '',
            unit TEXT DEFAULT 'MT',
            heat_batch_number TEXT DEFAULT '',
            po_number TEXT DEFAULT '',
            invoice_number TEXT DEFAULT '',
            date_of_document TEXT DEFAULT '',
            remarks TEXT DEFAULT '',
            confidence_score REAL DEFAULT 0.0,
            field_confidence TEXT DEFAULT '{}',
            raw_ocr_text TEXT DEFAULT '',
            full_data TEXT DEFAULT '{}',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    # Check if full_data column exists (migration check)
    cursor.execute("PRAGMA table_info(records)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'full_data' not in columns:
        cursor.execute("ALTER TABLE records ADD COLUMN full_data TEXT DEFAULT '{}'")

    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_doc_id ON records(document_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_records_doc_type ON records(document_type);")
    conn.commit()
    conn.close()

def insert_record(original_filename: str, doc: EnquiryProposalNote) -> int:
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    now_iso = datetime.datetime.now().isoformat()
    full_json = doc.model_dump_json()

    cursor.execute("""
        INSERT INTO records (
            document_id, document_type, plant, extracted_on, original_filename,
            supplier_name, material_name, material_grade_spec, quantity, unit,
            heat_batch_number, po_number, invoice_number, date_of_document, remarks,
            confidence_score, field_confidence, raw_ocr_text, full_data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc.document_id, doc.document_type, doc.plant, doc.extracted_on, original_filename,
        doc.supplier_name, doc.material_name, doc.material_grade_spec, doc.quantity, doc.unit,
        doc.heat_batch_number, doc.po_number, doc.invoice_number, doc.date_of_document, doc.remarks,
        doc.confidence_score, json.dumps(doc.field_confidence), doc.raw_ocr_text, full_json, now_iso, now_iso
    ))
    record_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return record_id

def _row_to_response(row: sqlite3.Row) -> RecordResponse:
    d = dict(row)
    try: fc = json.loads(d.get('field_confidence') or '{}')
    except Exception: fc = {}
    
    try: full_data = json.loads(d.get('full_data') or '{}')
    except Exception: full_data = {}

    return RecordResponse(
        id=d['id'],
        document_id=d['document_id'],
        document_type=d['document_type'],
        plant=d['plant'],
        extracted_on=d['extracted_on'],
        original_filename=d['original_filename'],
        supplier_name=d['supplier_name'] or '',
        material_name=d['material_name'] or '',
        material_grade_spec=d['material_grade_spec'] or '',
        quantity=d['quantity'] or '',
        unit=d['unit'] or 'MT',
        heat_batch_number=d['heat_batch_number'] or '',
        po_number=d['po_number'] or '',
        invoice_number=d['invoice_number'] or '',
        date_of_document=d['date_of_document'] or '',
        remarks=d['remarks'] or '',
        confidence_score=float(d['confidence_score'] or 0.0),
        field_confidence=fc,
        raw_ocr_text=d['raw_ocr_text'] or '',
        full_data=full_data,
        created_at=d['created_at'],
        updated_at=d['updated_at']
    )

def get_record_by_id(record_id: int) -> Optional[RecordResponse]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM records WHERE id = ?", (record_id,))
    row = cursor.fetchone()
    conn.close()
    if row: return _row_to_response(row)
    return None

def get_records(search: Optional[str] = None, doc_type: Optional[str] = None, 
                supplier: Optional[str] = None, limit: int = 50, offset: int = 0) -> Tuple[List[RecordResponse], int]:
    conn = get_connection()
    cursor = conn.cursor()
    conditions, params = [], []

    if search and search.strip():
        term = f"%{search.strip()}%"
        conditions.append("""(
            document_id LIKE ? OR supplier_name LIKE ? OR material_name LIKE ? 
            OR material_grade_spec LIKE ? OR po_number LIKE ? OR invoice_number LIKE ? 
            OR heat_batch_number LIKE ? OR original_filename LIKE ?
        )""")
        params.extend([term] * 8)

    if doc_type and doc_type.strip() and doc_type != "All":
        conditions.append("document_type LIKE ?")
        params.append(f"%{doc_type.strip()}%")

    if supplier and supplier.strip():
        conditions.append("supplier_name LIKE ?")
        params.append(f"%{supplier.strip()}%")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    count_query = f"SELECT COUNT(*) FROM records {where_clause}"
    cursor.execute(count_query, params)
    total_count = cursor.fetchone()[0]

    data_query = f"SELECT * FROM records {where_clause} ORDER BY id DESC LIMIT ? OFFSET ?"
    cursor.execute(data_query, params + [limit, offset])
    rows = cursor.fetchall()
    conn.close()

    records = [_row_to_response(r) for r in rows]
    return records, total_count

def update_record(record_id: int, updates: RecordUpdate) -> Optional[RecordResponse]:
    conn = get_connection()
    cursor = conn.cursor()
    update_fields, params = [], []
    update_dict = updates.model_dump(exclude_unset=True)

    if not update_dict:
        conn.close()
        return get_record_by_id(record_id)

    existing = get_record_by_id(record_id)
    if existing and existing.full_data:
        fd = dict(existing.full_data)
        for k, v in update_dict.items():
            if v is not None:
                fd[k] = v
        update_fields.append("full_data = ?")
        params.append(json.dumps(fd))

    for field, value in update_dict.items():
        if value is not None:
            update_fields.append(f"{field} = ?")
            params.append(value)

    update_fields.append("updated_at = ?")
    params.append(datetime.datetime.now().isoformat())
    params.append(record_id)

    query = f"UPDATE records SET {', '.join(update_fields)} WHERE id = ?"
    cursor.execute(query, params)
    conn.commit()
    conn.close()
    return get_record_by_id(record_id)

def delete_record(record_id: int) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM records WHERE id = ?", (record_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

def get_summary_stats() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*), AVG(confidence_score) FROM records")
    total_records, avg_conf = cursor.fetchone()
    avg_conf = round(avg_conf or 0.0, 1)

    cursor.execute("SELECT document_type, COUNT(*) FROM records GROUP BY document_type")
    type_counts = {row[0]: row[1] for row in cursor.fetchall()}

    cursor.execute("""
        SELECT supplier_name, COUNT(*) as cnt FROM records 
        WHERE supplier_name != '' AND supplier_name NOT LIKE '%Not Specified%'
        GROUP BY supplier_name ORDER BY cnt DESC LIMIT 5
    """)
    top_suppliers = [{"supplier": row[0], "count": row[1]} for row in cursor.fetchall()]
    conn.close()

    return {
        "total_records": total_records or 0,
        "avg_confidence": avg_conf,
        "type_counts": type_counts,
        "top_suppliers": top_suppliers
    }