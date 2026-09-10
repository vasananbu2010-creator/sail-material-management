import os
import io
from backend.ocr_engine import OCREngine
from backend.template_analyzer import TemplateAnalyzer
from backend.models import EnquiryProposalNote
from backend.docx_generator import generate_proposal_docx
from backend.pdf_generator import generate_proposal_pdf
from backend.database import init_db, insert_record, get_record_by_id, get_records
from backend.sample_generator import generate_samples

def test_16_page_analyzer():
    print("\n--- 1. Testing Sample Document Generation ---")
    samples_dir = 'C:/Users/HARISH/.gemini/antigravity/scratch/sail_material_management/frontend/assets/sample_docs'
    generate_samples(samples_dir)
    indent_file = os.path.join(samples_dir, 'A612002_INDENT.pdf')
    assert os.path.exists(indent_file)
    print(f"[OK] 16-Page Indent PDF verified ({os.path.getsize(indent_file)} bytes).")

    print("\n--- 2. Testing Multi-Page OCR & Layout Analysis ---")
    ocr = OCREngine()
    with open(indent_file, 'rb') as f:
        file_bytes = f.read()
    
    extraction = ocr.extract_document(file_bytes, 'A612002_INDENT.pdf')
    page_count = len(extraction.get('pages', []))
    print(f"[OK] Extracted {page_count} pages. Total raw text length: {len(extraction['raw_text'])} chars.")
    assert page_count >= 15
    assert extraction['ocr_confidence'] > 85.0

    print("\n--- 3. Testing Template Analyzer (Constant vs Dynamic Separation) ---")
    analyzer = TemplateAnalyzer()
    note = analyzer.analyze(extraction, 'A612002_INDENT.pdf')
    print(f"Ref No: {note.ref_no}")
    print(f"Initiator: {note.initiator}")
    print(f"Item: {note.item_description}")
    print(f"Quantity: {note.quantity} {note.unit}")
    print(f"Cost: {note.estimated_cost}")
    print(f"Consumption Rows Count: {len(note.consumption_table)}")
    print(f"12-Step Justification Count: {len(note.justification_table)}")
    print(f"Task Force Scrap Count: {len(note.task_force_table)}")
    print(f"Proposals Count: {len(note.proposals)}")
    print(f"Confidence Score: {note.confidence_score}%")

    assert "SMS" in note.ref_no
    assert "135010000304" in note.material_code
    assert note.quantity == "31000"
    assert len(note.consumption_table) == 4
    assert len(note.justification_table) == 12
    assert len(note.task_force_table) == 6
    assert len(note.proposals) == 8
    print("[OK] Dynamic variables extracted and mapped to standard Enquiry Proposal Note layout.")

    print("\n--- 4. Testing Word (.docx) Document Generator ---")
    docx_stream = generate_proposal_docx(note)
    docx_bytes = docx_stream.getvalue()
    assert len(docx_bytes) > 20000
    print(f"[OK] Word .docx generated successfully ({len(docx_bytes)} bytes).")

    print("\n--- 5. Testing PDF Document Generator ---")
    pdf_stream = generate_proposal_pdf(note)
    pdf_bytes = pdf_stream.getvalue()
    assert len(pdf_bytes) > 5000
    print(f"[OK] PDF report generated successfully ({len(pdf_bytes)} bytes).")

    print("\n--- 6. Testing Database Persistence ---")
    init_db()
    rec_id = insert_record('A612002_INDENT.pdf', note)
    assert rec_id > 0
    rec = get_record_by_id(rec_id)
    assert rec is not None
    assert rec.full_data is not None
    assert rec.full_data.get('quantity') == "31000"
    print(f"[OK] Record #{rec_id} inserted with complete full_data JSON payload.")

    print("\n========================================================")
    print("[SUCCESS] ALL 16-PAGE ANALYZER & DOCX/PDF TESTS PASSED 100%!")
    print("========================================================")

if __name__ == '__main__':
    test_16_page_analyzer()