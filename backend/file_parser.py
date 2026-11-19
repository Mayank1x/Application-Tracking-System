"""
file_parser.py — Extract text from PDF, DOCX, and TXT files.
"""

import io
from typing import Tuple


def parse_file(content: bytes, filename: str) -> Tuple[str, str]:
    """
    Parse uploaded file bytes and return (extracted_text, file_type).
    Supports: .pdf, .docx, .doc, .txt
    """
    name = filename.lower()

    if name.endswith(".pdf"):
        return _parse_pdf(content), "pdf"
    elif name.endswith((".docx", ".doc")):
        return _parse_docx(content), "docx"
    elif name.endswith((".txt", ".text")):
        return content.decode("utf-8", errors="ignore"), "txt"
    else:
        raise ValueError(f"Unsupported file type: {filename}. Use PDF, DOCX, or TXT.")


def _parse_pdf(content: bytes) -> str:
    """Extract text from PDF bytes using PyPDF2."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(content))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text.strip())
        result = "\n\n".join(pages)
        if not result.strip():
            raise ValueError("PDF appears to be image-based or empty. Please use a text-based PDF.")
        return result
    except ImportError:
        raise ValueError("PyPDF2 is not installed. Run: pip install PyPDF2")
    except Exception as e:
        if "image-based" in str(e):
            raise
        raise ValueError(f"Failed to read PDF: {e}")


def _parse_docx(content: bytes) -> str:
    """Extract text from DOCX bytes using python-docx."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        paragraphs = []
        for para in doc.paragraphs:
            text = para.text.strip()
            if text:
                paragraphs.append(text)
        result = "\n".join(paragraphs)
        if not result.strip():
            raise ValueError("DOCX file appears to be empty.")
        return result
    except ImportError:
        raise ValueError("python-docx is not installed. Run: pip install python-docx")
    except Exception as e:
        if "empty" in str(e):
            raise
        raise ValueError(f"Failed to read DOCX: {e}")
