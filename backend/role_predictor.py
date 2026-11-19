"""
role_predictor.py — Predict top 3 job roles from resume using skill matching + TF-IDF.
"""

import re
from typing import Dict, List
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

ROLE_PROFILES = {
    "Data Scientist": {
        "skills": ["python", "r", "sql", "machine learning", "deep learning", "statistics",
                    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "data analysis",
                    "data visualization", "jupyter", "matplotlib", "seaborn", "nlp",
                    "regression", "classification", "clustering"],
        "description": "Data scientist leveraging statistical modeling, machine learning, and data analysis to extract insights from complex datasets using Python, R, SQL, and visualization tools."
    },
    "Web Developer": {
        "skills": ["html", "css", "javascript", "react", "vue", "angular", "node.js",
                    "typescript", "webpack", "sass", "tailwind", "bootstrap", "responsive",
                    "rest api", "graphql", "git", "figma", "ui", "ux", "frontend"],
        "description": "Web developer building responsive, interactive web applications using HTML, CSS, JavaScript frameworks like React and Vue, with REST API integration and modern UI/UX practices."
    },
    "Backend Developer": {
        "skills": ["python", "java", "c#", "go", "node.js", "sql", "postgresql", "mongodb",
                    "redis", "rest api", "graphql", "docker", "microservices", "aws", "linux",
                    "git", "ci/cd", "flask", "django", "spring", "fastapi"],
        "description": "Backend developer designing scalable server-side architectures using Python, Java, or Go with database management, API design, containerization, and cloud deployment."
    },
    "ML Engineer": {
        "skills": ["python", "tensorflow", "pytorch", "keras", "scikit-learn", "docker",
                    "mlops", "aws", "gcp", "azure", "kubernetes", "machine learning",
                    "deep learning", "model deployment", "data pipeline", "feature engineering",
                    "mlflow", "airflow", "sql", "linux"],
        "description": "ML engineer building and deploying production machine learning pipelines using TensorFlow, PyTorch, MLOps tools, containerization, and cloud infrastructure."
    },
    "DevOps Engineer": {
        "skills": ["docker", "kubernetes", "jenkins", "terraform", "ansible", "aws", "gcp",
                    "azure", "linux", "bash", "ci/cd", "git", "monitoring", "prometheus",
                    "grafana", "nginx", "networking", "security", "python", "shell scripting"],
        "description": "DevOps engineer automating infrastructure provisioning and deployment pipelines using Docker, Kubernetes, Terraform, CI/CD tools, and cloud platforms."
    },
    "UI/UX Designer": {
        "skills": ["figma", "sketch", "adobe xd", "photoshop", "illustrator", "wireframing",
                    "prototyping", "user research", "usability testing", "interaction design",
                    "visual design", "design systems", "accessibility", "responsive design",
                    "typography", "color theory", "html", "css", "ui", "ux"],
        "description": "UI/UX designer creating intuitive, accessible digital experiences through user research, wireframing, prototyping, and visual design using Figma, Sketch, and Adobe tools."
    },
    "Business Analyst": {
        "skills": ["sql", "excel", "power bi", "tableau", "jira", "agile", "scrum",
                    "requirements", "stakeholder", "communication", "data analysis",
                    "project management", "process improvement", "documentation",
                    "presentation", "critical thinking", "problem solving", "reporting"],
        "description": "Business analyst bridging technology and business through requirements gathering, data analysis, stakeholder communication, and process improvement using BI tools and agile methodologies."
    },
    "Cybersecurity Analyst": {
        "skills": ["networking", "security", "firewall", "siem", "penetration testing",
                    "vulnerability", "encryption", "linux", "python", "wireshark", "nmap",
                    "incident response", "compliance", "risk assessment", "iso 27001",
                    "malware", "forensics", "ids", "ips", "soc"],
        "description": "Cybersecurity analyst protecting organizational assets through threat detection, vulnerability assessment, penetration testing, incident response, and security compliance frameworks."
    },
    "Mobile Developer": {
        "skills": ["android", "ios", "kotlin", "swift", "react native", "flutter", "dart",
                    "java", "xcode", "android studio", "firebase", "rest api", "sqlite",
                    "mobile ui", "app store", "google play", "push notifications",
                    "responsive", "git", "agile"],
        "description": "Mobile developer building native and cross-platform applications for Android and iOS using Kotlin, Swift, React Native, or Flutter with backend API integration."
    },
    "Cloud Engineer": {
        "skills": ["aws", "azure", "gcp", "terraform", "cloudformation", "docker",
                    "kubernetes", "serverless", "lambda", "s3", "ec2", "vpc", "iam",
                    "networking", "linux", "python", "bash", "monitoring", "cost optimization",
                    "ci/cd"],
        "description": "Cloud engineer architecting and managing scalable cloud infrastructure on AWS, Azure, or GCP using IaC tools, containerization, serverless computing, and DevOps practices."
    },
}


def predict_roles(resume_text: str) -> Dict:
    """Predict top job roles from resume using skills + TF-IDF hybrid scoring."""
    resume_lower = resume_text.lower()

    results = []
    for role, profile in ROLE_PROFILES.items():
        # Skill match score
        matched = [s for s in profile["skills"] if re.search(r'\b' + re.escape(s) + r'\b', resume_lower)]
        missing = [s for s in profile["skills"] if s not in matched]
        skill_score = len(matched) / len(profile["skills"]) * 100

        # TF-IDF similarity
        try:
            tfidf = TfidfVectorizer(max_features=3000, ngram_range=(1, 2))
            vectors = tfidf.fit_transform([resume_text, profile["description"]])
            tfidf_score = float(cosine_similarity(vectors[0], vectors[1])[0][0]) * 100
        except Exception:
            tfidf_score = 0

        combined = 0.6 * skill_score + 0.4 * tfidf_score

        results.append({
            "role": role,
            "combined_score": round(combined, 1),
            "skill_score": round(skill_score, 1),
            "tfidf_score": round(tfidf_score, 1),
            "matched_skills": matched,
            "missing_skills": missing[:8],
            "matched_count": len(matched),
            "total_skills": len(profile["skills"]),
        })

    results.sort(key=lambda x: x["combined_score"], reverse=True)

    return {
        "predictions": results[:3],
        "all_roles": results,
    }
