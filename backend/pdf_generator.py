"""
pdf_generator.py — Generate a formatted PDF from resume text using fpdf2.
"""

from fpdf import FPDF
import re
import io
from typing import Optional


class ResumePDF(FPDF):
    """Custom PDF class for resume generation."""

    def header(self):
        pass

    def footer(self):
        self.set_y(-12)
        self.set_font("Helvetica", "I", 7)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")


def generate_resume_pdf(text: str) -> bytes:
    """Convert resume text to a clean, formatted PDF. Returns bytes."""
    pdf = ResumePDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    pdf.set_margins(20, 15, 20)

    # Section heading patterns
    heading_pattern = re.compile(
        r"^(EDUCATION|EXPERIENCE|SKILLS|PROJECTS|SUMMARY|OBJECTIVE|"
        r"PROFESSIONAL SUMMARY|WORK EXPERIENCE|TECHNICAL SKILLS|"
        r"CERTIFICATIONS|ACHIEVEMENTS|PUBLICATIONS|CONTACT|"
        r"PROFESSIONAL EXPERIENCE|CORE COMPETENCIES|HOBBIES|"
        r"LANGUAGES|REFERENCES|INTERESTS|AWARDS)[\s:]*$",
        re.IGNORECASE
    )

    lines = text.split("\n")
    first_line = True

    for line in lines:
        stripped = line.strip()
        if not stripped:
            pdf.ln(3)
            continue

        # Name (first non-empty line, large font)
        if first_line and stripped:
            pdf.set_font("Helvetica", "B", 16)
            pdf.set_text_color(30, 30, 30)
            pdf.cell(0, 10, stripped, ln=True, align="C")
            pdf.ln(2)
            first_line = False
            continue

        # Contact line (email, phone, links)
        if first_line is False and (
            "@" in stripped or
            re.search(r"\b\d{10}\b", stripped) or
            "linkedin" in stripped.lower() or
            "github" in stripped.lower()
        ):
            pdf.set_font("Helvetica", "", 8)
            pdf.set_text_color(80, 80, 80)
            # Handle encoding
            safe = stripped.encode('latin-1', 'replace').decode('latin-1')
            pdf.cell(0, 5, safe, ln=True, align="C")
            continue

        # Section headings
        if heading_pattern.match(stripped):
            pdf.ln(4)
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(40, 40, 40)
            safe = stripped.upper().encode('latin-1', 'replace').decode('latin-1')
            pdf.cell(0, 7, safe, ln=True)
            # Underline
            pdf.set_draw_color(100, 100, 100)
            pdf.line(20, pdf.get_y(), pdf.w - 20, pdf.get_y())
            pdf.ln(3)
            continue

        # Bullet points
        if stripped[0] in "-*":
            content = re.sub(r"^[-*]\s*", "", stripped).strip()
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(50, 50, 50)
            safe = content.encode('latin-1', 'replace').decode('latin-1')
            # Indent bullet
            x = pdf.get_x()
            pdf.set_x(25)
            pdf.cell(5, 5, chr(8226), ln=False)  # bullet char
            pdf.multi_cell(pdf.w - 50, 5, safe)
            continue

        # Regular text
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(50, 50, 50)
        safe = stripped.encode('latin-1', 'replace').decode('latin-1')
        pdf.multi_cell(0, 5, safe)

    return pdf.output()
