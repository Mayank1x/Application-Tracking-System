import sys
import os
import io

sys.path.append(os.path.dirname(__file__))
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sample_jd_path = os.path.join(root_dir, "sample_job_description.txt")
sample_res_path = os.path.join(root_dir, "sample_resume.txt")

with open(sample_jd_path, "rb") as f:
    jd_bytes = f.read()

with open(sample_res_path, "rb") as f:
    res_bytes = f.read()

candidate_b_text = b"""
Priya Patel
Email: priya.patel@example.com
Phone: +91 9123456780
Software Developer with 3 years of experience building Python and SQL applications.
Education: Bachelor of Technology in Computer Science (2021)
Skills: Python, SQL, REST API, Git, Docker, Flask
Experience:
Software Engineer at TechSolutions (2021 - Present)
- Developed REST APIs using Flask and Python
- Managed SQL database schemas and optimized queries
"""

candidate_c_text = b"""
Rahul Verma
Email: rahul.verma@example.com
Phone: +91 9988776655
Junior Web Developer with 1 year of experience in HTML, CSS, JavaScript, and basic Python.
Education: BCA (2023)
Skills: HTML, CSS, JavaScript, Python, Git
"""

files = [
    ("resumes", ("Aarav_Sharma.txt", io.BytesIO(res_bytes), "text/plain")),
    ("resumes", ("Priya_Patel.txt", io.BytesIO(candidate_b_text), "text/plain")),
    ("resumes", ("Rahul_Verma.txt", io.BytesIO(candidate_c_text), "text/plain")),
]
data = {"jd_text": jd_bytes.decode("utf-8")}

response = client.post("/api/batch-rank", data=data, files=files)
print("Response Status Code:", response.status_code)

if response.status_code == 200:
    res_data = response.json()
    print("Parsed Job Title:", res_data["job_description"]["title"])
    print("Required Min Experience:", res_data["job_description"]["experience"]["display"])
    print("Total Evaluated:", res_data["total_evaluated"])
    print("\n--- CANDIDATE RANKINGS ---")
    for c in res_data["candidates"]:
        print(f"Rank #{c['rank']}: {c['name']} | Exp: {c['experience_formatted']} | Match: {c['match_percentage']}% | Badge: {c['badge']}")
        print(f"   Matched Skills ({len(c['matched_skills'])}): {c['matched_skills'][:6]}...")
        print(f"   Missing Mandatory ({len(c['missing_mandatory'])}): {c['missing_mandatory'][:4]}")
        print(f"   Recruiter Reason: {c['reasons'][0]}")
else:
    print("Error:", response.text)
