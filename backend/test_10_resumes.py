import os
import sys

sys.path.append(os.path.dirname(__file__))
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
test_dir = os.path.join(root_dir, "test_resumes")
jd_path = os.path.join(test_dir, "SAMPLE_JOB_DESCRIPTION.txt")

with open(jd_path, "r", encoding="utf-8") as f:
    jd_text = f.read()

# Collect all 10 PDF files
pdf_files = [f for f in sorted(os.listdir(test_dir)) if f.endswith(".pdf")]
print(f"Testing Batch Evaluation with {len(pdf_files)} PDF resumes against JD...")

files_payload = []
file_handles = []

for pdf_name in pdf_files:
    p = os.path.join(test_dir, pdf_name)
    fh = open(p, "rb")
    file_handles.append(fh)
    files_payload.append(("resumes", (pdf_name, fh, "application/pdf")))

try:
    res = client.post("/api/batch-rank", data={"jd_text": jd_text}, files=files_payload)
    print("Status Code:", res.status_code)
    if res.status_code == 200:
        data = res.json()
        print(f"\nSuccessfully evaluated {data['total_evaluated']} resumes for role: {data['job_description']['title']}")
        print(f"Required Experience: {data['job_description']['experience']['display']}")
        print(f"Mandatory Skills ({len(data['job_description']['mandatory_skills'])}): {data['job_description']['mandatory_skills']}")
        print("\n" + "="*85)
        print(f"{'Rank':<5} | {'Candidate Name':<20} | {'Exp':<10} | {'Match %':<8} | {'Badge':<16} | {'Matched Skills'}")
        print("="*85)
        for c in data["candidates"]:
            matched_str = ", ".join(c["matched_skills"][:4])
            if len(c["matched_skills"]) > 4:
                matched_str += f" (+{len(c['matched_skills']) - 4})"
            print(f"#{c['rank']:<4} | {c['name']:<20} | {c['experience_formatted']:<10} | {c['match_percentage']:<8}% | {c['badge']:<16} | {matched_str}")
        print("="*85)
    else:
        print("Error:", res.text)
finally:
    for fh in file_handles:
        fh.close()
