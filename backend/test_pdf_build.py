import io
import pypdf
from app.services.template_pdf_generator import generate_procurement_template_pdf
from app.schemas.procurement_schema import FixedOutputTemplate

t = FixedOutputTemplate()
buf = generate_procurement_template_pdf(t.model_dump(), 'test_procurement.pdf')
reader = pypdf.PdfReader(buf)
print("SUCCESS: Exact Page count =", len(reader.pages))
for idx, p in enumerate(reader.pages):
    print(f"Page {idx+1} length: {len(p.extract_text())} characters")
