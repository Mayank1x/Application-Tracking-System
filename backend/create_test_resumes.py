"""
create_test_resumes.py — Generate 10 diverse synthetic resumes as both TXT and PDF files
for testing batch ATS ranking against standard Job Descriptions.
"""

import os
from fpdf import FPDF

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "test_resumes"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

CANDIDATES = [
    {
        "filename": "01_Aarav_Sharma_Senior_FullStack",
        "name": "Aarav Sharma",
        "title": "Senior Full Stack & AI Engineer",
        "contact": "Email: aarav.sharma@example.com | Phone: +91 9876543210 | Bangalore, India\nGitHub: github.com/aaravsharma | LinkedIn: linkedin.com/in/aaravsharma",
        "summary": "Senior Full Stack & AI Engineer with 5+ years of experience architecting end-to-end web applications and NLP microservices. Expert in Python, FastAPI, React, PostgreSQL, Docker, and PyTorch.",
        "education": "Bachelor of Technology in Computer Science, IIT Madras (2019)",
        "experience": [
            "Senior Software Engineer | CloudTech Solutions (Jan 2021 - Present)\n- Architected high-throughput REST APIs using FastAPI and Python, serving 10M+ daily requests.\n- Built real-time React frontend dashboards with TypeScript and Tailwind CSS.\n- Integrated Sentence Transformers and PyTorch embeddings for semantic candidate search.\n- Containerized microservices using Docker and orchestrated CI/CD pipelines.",
            "Software Engineer | DataCraft Labs (June 2019 - Dec 2020)\n- Developed data pipelines using PostgreSQL and Python.\n- Implemented NLP classification models using Scikit-learn and NLTK."
        ],
        "skills": "Python, FastAPI, React, TypeScript, JavaScript, Docker, PostgreSQL, SQL, Machine Learning, NLP, PyTorch, Git, CI/CD, REST API, AWS, Redis, Communication."
    },
    {
        "filename": "02_Sneha_Reddy_AI_Developer",
        "name": "Sneha Reddy",
        "title": "AI & Full Stack Developer",
        "contact": "Email: sneha.reddy@example.com | Phone: +91 9123456789 | Hyderabad\nLinkedIn: linkedin.com/in/snehareddy",
        "summary": "Full Stack AI Developer with 4 years of experience specializing in Machine Learning, Python, FastAPI, React, and SQL database systems.",
        "education": "B.Tech in Information Technology, NIT Warangal (2020)",
        "experience": [
            "AI Engineer | AI Systems Corp (July 2020 - Present)\n- Developed intelligent document processing pipelines using Python, FastAPI, and Transformers.\n- Built responsive user interfaces with React and Redux.\n- Designed relational schemas in PostgreSQL and optimized complex SQL queries.\n- Containerized workloads using Docker and deployed on AWS."
        ],
        "skills": "Python, React, FastAPI, Machine Learning, Natural Language Processing, PostgreSQL, SQL, Docker, AWS, Git, REST API, Pandas, NumPy, Problem Solving."
    },
    {
        "filename": "03_Rohan_Mehta_Backend_Engineer",
        "name": "Rohan Mehta",
        "title": "Backend Software Engineer",
        "contact": "Email: rohan.mehta@example.com | Phone: +91 9811223344 | Pune",
        "summary": "Backend Software Engineer with 3.5 years of experience building scalable REST APIs in Python and Flask. Strong SQL and Docker knowledge.",
        "education": "B.E. in Computer Science, Pune University (2020)",
        "experience": [
            "Backend Developer | InnoTech (Aug 2020 - Present)\n- Built robust RESTful APIs using Flask and Python.\n- Managed PostgreSQL database clusters and wrote comprehensive unit tests.\n- Dockerized applications and maintained Git workflows."
        ],
        "skills": "Python, Flask, REST API, PostgreSQL, SQL, Docker, Git, CI/CD, Redis, Linux, Problem Solving."
    },
    {
        "filename": "04_Priya_Patel_Frontend_Lead",
        "name": "Priya Patel",
        "title": "Frontend Engineer",
        "contact": "Email: priya.patel@example.com | Phone: +91 9988776655 | Mumbai",
        "summary": "Frontend Engineer with 4 years of experience crafting modern web applications using React, JavaScript, TypeScript, and HTML/CSS.",
        "education": "B.Sc in Computer Science, Mumbai University (2020)",
        "experience": [
            "Frontend Developer | WebSolutions (2020 - Present)\n- Engineered single-page applications using React, Next.js, and Redux.\n- Integrated REST APIs and collaborated with backend engineers."
        ],
        "skills": "React, JavaScript, TypeScript, HTML, CSS, Tailwind, Git, Figma, Communication, Teamwork."
    },
    {
        "filename": "05_Vikram_Singhania_Data_Scientist",
        "name": "Vikram Singhania",
        "title": "Data Scientist",
        "contact": "Email: vikram.s@example.com | Phone: +91 9456123789 | Delhi",
        "summary": "Data Scientist with 3 years of experience in Machine Learning, NLP, Python, and SQL. Passionate about predictive modeling and data visualization.",
        "education": "Master of Science in Data Science (2021), Delhi University",
        "experience": [
            "Data Scientist | AnalyticsHub (2021 - Present)\n- Built predictive machine learning models using Scikit-learn, Pandas, and PyTorch.\n- Performed NLP sentiment analysis and text summarization.\n- Extracted insights using SQL and built Power BI reports."
        ],
        "skills": "Python, Machine Learning, Natural Language Processing, PyTorch, Scikit-learn, SQL, Power BI, Git, Docker."
    },
    {
        "filename": "06_Ananya_Deshmukh_DevOps_Cloud",
        "name": "Ananya Deshmukh",
        "title": "DevOps & Cloud Engineer",
        "contact": "Email: ananya.d@example.com | Phone: +91 9871122445 | Bangalore",
        "summary": "Cloud & DevOps Engineer with 4 years of experience managing AWS infrastructure, Docker containers, Kubernetes (K8s), and CI/CD automation.",
        "education": "B.Tech in Electrical Engineering (2020)",
        "experience": [
            "DevOps Engineer | CloudScale (2020 - Present)\n- Automated continuous integration and deployment pipelines using GitHub Actions and Jenkins.\n- Managed Kubernetes clusters and Docker containers on AWS.\n- Scripted infrastructure using Python and Bash."
        ],
        "skills": "AWS, Docker, Kubernetes, CI/CD, Git, Linux, Python, Bash, Terraform, SQL."
    },
    {
        "filename": "07_Kavita_Nair_Junior_FullStack",
        "name": "Kavita Nair",
        "title": "Junior Full Stack Developer",
        "contact": "Email: kavita.nair@example.com | Phone: +91 9321456789 | Kochi",
        "summary": "Junior Full Stack Developer with 1.5 years of experience building web apps with React, Python, and SQLite.",
        "education": "Bachelor of Computer Applications (BCA, 2022)",
        "experience": [
            "Junior Web Developer | TechNest (2022 - Present)\n- Assisted in developing REST APIs using FastAPI.\n- Created React UI components."
        ],
        "skills": "Python, React, JavaScript, FastAPI, HTML, CSS, Git, SQLite."
    },
    {
        "filename": "08_Arjun_Kapoor_Python_Fresher",
        "name": "Arjun Kapoor",
        "title": "Entry Level Python Developer",
        "contact": "Email: arjun.k@example.com | Phone: +91 9765432109 | Chennai",
        "summary": "Recent Computer Science graduate seeking an entry-level software engineering role. Strong foundation in Python, SQL, and algorithms.",
        "education": "B.Tech in Computer Science (2023), Anna University",
        "experience": [
            "Academic Projects (2022 - 2023)\n- AI Resume Matcher: Developed a Python script to calculate similarity scores.\n- Student Management Portal: Web app built with Python and SQLite."
        ],
        "skills": "Python, SQL, HTML, CSS, Git, Communication, Problem Solving."
    },
    {
        "filename": "09_Sunil_Rao_Java_Developer",
        "name": "Sunil Rao",
        "title": "Senior Java Developer",
        "contact": "Email: sunil.rao@example.com | Phone: +91 9812345670 | Hyderabad",
        "summary": "Java Backend Developer with 5 years of experience developing enterprise services using Java, Spring Boot, and Oracle SQL.",
        "education": "B.Tech in Computer Science (2019)",
        "experience": [
            "Senior Java Developer | Enterprise Systems (2019 - Present)\n- Built microservices using Java and Spring Boot.\n- Managed relational database schemas with SQL."
        ],
        "skills": "Java, Spring Boot, SQL, Microservices, REST API, Git, Docker, Linux, Agile."
    },
    {
        "filename": "10_Neha_Gupta_QA_Automation",
        "name": "Neha Gupta",
        "title": "QA Automation Engineer",
        "contact": "Email: neha.gupta@example.com | Phone: +91 9654321987 | Noida",
        "summary": "QA Automation Engineer with 3 years of experience writing automated test suites using Python, Selenium, and Postman.",
        "education": "B.Tech in Information Technology (2021)",
        "experience": [
            "QA Engineer | QualitySoft (2021 - Present)\n- Designed automated test frameworks using Python.\n- Tested REST APIs using Postman and Swagger."
        ],
        "skills": "Python, Selenium, Postman, Unit Testing, Git, Jira, Agile, Manual Testing."
    }
]


def create_pdf(cand: dict, filepath: str):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Name Header
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 10, cand["name"], ln=True)

    # Title & Contact
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 6, cand["title"], ln=True)
    pdf.set_font("Helvetica", "", 9)
    for line in cand["contact"].split("\n"):
        pdf.cell(0, 5, line, ln=True)

    pdf.ln(4)

    # Professional Summary
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 7, "PROFESSIONAL SUMMARY", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5, cand["summary"])
    pdf.ln(3)

    # Education
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 7, "EDUCATION", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5, cand["education"])
    pdf.ln(3)

    # Experience
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 7, "WORK EXPERIENCE", ln=True)
    pdf.set_font("Helvetica", "", 10)
    for exp in cand["experience"]:
        pdf.multi_cell(0, 5, exp)
        pdf.ln(2)

    # Skills
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 7, "TECHNICAL SKILLS", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5, cand["skills"])

    pdf.output(filepath)


def main():
    print(f"Generating 10 test resumes in {OUTPUT_DIR}...")
    for cand in CANDIDATES:
        txt_path = os.path.join(OUTPUT_DIR, f"{cand['filename']}.txt")
        pdf_path = os.path.join(OUTPUT_DIR, f"{cand['filename']}.pdf")

        # TXT format
        full_text = f"""{cand['name']}
{cand['title']}
{cand['contact']}

PROFESSIONAL SUMMARY
{cand['summary']}

EDUCATION
{cand['education']}

WORK EXPERIENCE
{chr(10).join(cand['experience'])}

SKILLS
{cand['skills']}
"""
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(full_text)

        # PDF format
        create_pdf(cand, pdf_path)
        print(f"  ✓ Created: {cand['filename']}.pdf & .txt")

    # Also save SAMPLE_JOB_DESCRIPTION.txt in test_resumes
    jd_content = """Job Title: Senior Full Stack / AI Developer
Location: Remote / Hybrid
Experience Required: 3-5 years of industry experience
Education: Bachelor's or Master's in Computer Science or related engineering field

About the Role:
We are looking for a Senior Full Stack & AI Engineer to architect, build, and deploy high-performance intelligent web applications. You will work on scalable FastAPI backends, React web interfaces, and integrate state-of-the-art NLP and Large Language Model pipelines.

Key Requirements (Must Have):
- 3+ years of professional experience with Python and JavaScript / TypeScript
- Strong proficiency in modern React and backend frameworks like FastAPI or Flask
- Hands-on experience with Machine Learning, Natural Language Processing (NLP), or Sentence Transformers
- Proficiency in Relational Databases (PostgreSQL or SQL) and Docker containerization
- Solid grasp of REST API development, Git version control, and CI/CD pipelines
- Strong problem solving and communication skills

Nice to Have (Bonus Skills):
- Experience with PyTorch or Deep Learning architectures
- Experience with Cloud deployment (AWS or GCP) and Kubernetes (K8s)
- Familiarity with MongoDB or Redis caching
- Experience building AI-driven ATS or recommendation systems
"""
    with open(os.path.join(OUTPUT_DIR, "SAMPLE_JOB_DESCRIPTION.txt"), "w", encoding="utf-8") as f:
        f.write(jd_content)
    print("  ✓ Created: SAMPLE_JOB_DESCRIPTION.txt")
    print("\nAll 10 test resumes generated successfully!")


if __name__ == "__main__":
    main()
