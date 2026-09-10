import os
import io
from backend.ocr_engine import OCREngine
from backend.parser import DocumentParser
from backend.models import StandardizedDocument, RecordCreate, RecordUpdate
from backend.database import init_db, insert_record, get_records, get_record_by_id, update_record, delete_record, get_summary_stats
from backend.exporter import export_records_to_excel, export_single_record_pdf
from backend.sample_generator import generate_samples

def test_full_pipeline():
    print("\n--- 1. Testing Sample Document Generation ---")
    samples_dir = 'C:/Users/HARISH/.gemini/antigravity/scratch/sail_material_management/frontend/assets/sample_docs'
    generate_samples(samples_dir)
    assert os.path.exists(os.path.join(samples_dir, 'SAIL_Salem_MTC_SS304.pdf'))
    assert os.path.exists(os.path.join(samples_dir, 'SAIL_Salem_PurchaseOrder_PO8831.pdf'))
    assert os.path.exists(os.path.join(samples_dir, 'SAIL_Salem_GRN_GRN4419.pdf'))
    assert os.path.exists(os.path.join(samples_dir, 'SAIL_Salem_TaxInvoice_INV9021.pdf'))
    print("? All sample PDFs generated and verified.")

    print("\n--- 2. Testing OCR & Layout Extraction ---")
    ocr = OCREngine()
    mtc_file = os.path.join(samples_dir, 'SAIL_Salem_MTC_SS304.pdf')
    with open(mtc_file, 'rb') as f:
        mtc_bytes = f.read()
    
    extract_res = ocr.extract_document(mtc_bytes, 'SAIL_Salem_MTC_SS304.pdf')
    assert len(extract_res['raw_text']) > 100
    assert extract_res['ocr_confidence'] > 70.0
    print(f"? Document extracted. Engine used: {extract_res.get('engine_used')}, Confidence: {extract_res['ocr_confidence']}%")

    print("\n--- 3. Testing Standardized Schema Parsing ---")
    parser = DocumentParser()
    parsed_doc = parser.parse(extract_res, 'SAIL_Salem_MTC_SS304.pdf')
    print(f"Parsed Doc Type: {parsed_doc.document_type}")
    print(f"Parsed Grade/Spec: {parsed_doc.material_grade_spec}")
    print(f"Parsed Heat No: {parsed_doc.heat_batch_number}")
    print(f"Parsed Quantity: {parsed_doc.quantity} {parsed_doc.unit}")
    print(f"Parsed Overall Confidence: {parsed_doc.confidence_score}%")

    assert "Material Test Certificate" in parsed_doc.document_type
    assert "304" in parsed_doc.material_grade_spec
    assert "H84920" in parsed_doc.heat_batch_number
    assert float(parsed_doc.quantity) > 0
    assert parsed_doc.plant == "Salem Steel Plant"
    print("? Standardized schema fields parsed accurately.")

    print("\n--- 4. Testing SQLite Database Persistence ---")
    init_db()
    rec_id = insert_record('SAIL_Salem_MTC_SS304.pdf', parsed_doc)
    assert rec_id > 0
    print(f"? Record inserted with ID: {rec_id}")

    rec = get_record_by_id(rec_id)
    assert rec is not None
    assert rec.heat_batch_number == "H84920"

    # Test Update
    updated = update_record(rec_id, RecordUpdate(remarks="User manual correction verified"))
    assert updated.remarks == "User manual correction verified"
    print("? Record update verified.")

    # Test List & Search
    records, total = get_records(search="H84920")
    assert total >= 1
    assert any(r.id == rec_id for r in records)
    print("? Search query verified.")

    print("\n--- 5. Testing Excel and PDF Exporters ---")
    excel_stream = export_records_to_excel([rec])
    assert excel_stream.getbuffer().nbytes > 1000
    print(f"? Excel export generated ({excel_stream.getbuffer().nbytes} bytes).")

    pdf_stream = export_single_record_pdf(rec)
    assert pdf_stream.getbuffer().nbytes > 1000
    print(f"? PDF export generated ({pdf_stream.getbuffer().nbytes} bytes).")

    stats = get_summary_stats()
    print(f"? Summary Stats: {stats}")
    print("\n=========================================")
    print("? ALL BACKEND PIPELINE TESTS PASSED 100%!")
    print("=========================================")

if __name__ == '__main__':
    test_full_pipeline()
