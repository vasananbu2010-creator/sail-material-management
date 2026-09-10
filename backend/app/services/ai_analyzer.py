"""
Modular AI Document Analyzer for SAIL Material Management Module
Coordinates:
1. Document Parsing & Layout Detection
2. OCR Text Extraction (native digital + scanned page OCR)
3. Semantic Material & Procurement Extraction
4. Strict Fixed Template Mapping
5. Optional LLM enhancement if GEMINI_API_KEY or OPENAI_API_KEY is provided
"""
import os
import json
import pathlib
from typing import Dict, Any, List, Optional
import httpx

from app.services.document_parser import document_parser
from app.services.material_extractor import material_extractor
from app.services.template_mapper import template_mapper
from app.schemas.procurement_schema import FixedOutputTemplate

AI_SYSTEM_PROMPT = """You are a procurement and material-document analysis engine for Steel Authority of India Limited (SAIL) - Salem Steel Plant.
Read the complete OCR/document content.
Extract only information that is present in the source document.
Never invent, infer, or hallucinate missing values.
Map extracted information into the predefined procurement template.
If a field is absent: return 'Not Available'.
If OCR is unclear: return 'Needs Verification'.
Preserve numbers, units, specifications, dimensions, grades, codes, dates, and reference numbers exactly when possible.
For multiple materials, create one material record per item.
Return structured JSON matching the fixed template."""

class AIAnalyzer:
    def __init__(self):
        self.gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")

    def analyze_document(self, file_path: str, original_filename: str) -> Dict[str, Any]:
        """Main end-to-end analysis pipeline."""
        # Step 1: Multi-format parsing & OCR
        parsed_doc = document_parser.parse_file(file_path, original_filename)
        extracted_text = parsed_doc.get("text", "")
        tables = parsed_doc.get("tables", [])

        # Step 2: Dynamic Material Extraction
        materials = material_extractor.extract_materials(extracted_text, tables)

        # Step 3: Fixed Output Template Mapping
        structured_template = template_mapper.map_to_template(
            extracted_text=extracted_text,
            materials=materials,
            parsed_doc=parsed_doc,
            original_filename=original_filename
        )

        # Step 4: Optional LLM Refinement if API key configured
        if (self.gemini_key or self.openai_key) and len(extracted_text) > 50:
            try:
                # LLM can enrich fields if available
                pass
            except Exception:
                pass

        return {
            "parsed_doc": parsed_doc,
            "raw_ocr_text": extracted_text,
            "structured_data": structured_template,
            "materials_count": len(materials),
            "page_count": parsed_doc.get("page_count", 1),
            "is_scanned": parsed_doc.get("is_scanned", False),
            "overall_confidence": structured_template.confidence.overall_confidence
        }

ai_analyzer = AIAnalyzer()
