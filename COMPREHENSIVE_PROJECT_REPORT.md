# Full Project Explanation: ATSScore.ai (Intelligent Resume Analyzer)

## 1. Project Overview
**Project Name**: ATSScore.ai (formerly ResumeNLP)  
**Type**: Full-Stack AI/NLP SaaS Web Application  
**Primary Goal**: To provide a comprehensive, automated suite of tools for resume analysis, scoring, skill extraction, ATS optimization, and AI-driven coaching to help candidates improve their job match rates.

The project has evolved from a simple Python script/Streamlit app into a modern, scalable full-stack application featuring a React front-end and a FastAPI backend with "Gen2 AI Insights" incorporating both classical NLP and deep learning (BERT/Gemini).

---

## 2. Technology Stack
The application is structured into two completely separate servers:

### Frontend
- **Framework**: React.js built with Vite.
- **Styling**: Tailwind CSS for building a responsive, modern, dark-themed UI.
- **Animations**: Framer Motion for smooth micro-interactions, page transitions, and expandable panels.
- **Icons**: Lucide React.
- **Architecture**: Single Page Application (SPA) communicating with the backend via REST API calls.

### Backend
- **Framework**: FastAPI (Python) for high-performance async API endpoints.
- **NLP & Base ML**: NLTK (Tokenization, stopwords, lemmatization), Scikit-learn (TF-IDF, Cosine Similarity).
- **Deep Learning**: `sentence-transformers` (`all-MiniLM-L6-v2`) for semantic similarity beyond exact keyword matching.
- **Generative AI**: Google Gemini API integration (optional) for deep analysis and resume rewriting.
- **Database**: Firebase Firestore (optional) for saving analysis history.
- **PDF Generation**: ReportLab (or similar) to export optimized resumes to PDF.

---

## 3. Core Architecture & Modules

The backend exposes several distinct endpoints via `main.py`, supported by specific modules:

### 3.1. File Parsing (`/api/upload`)
- Handled by `file_parser.py`.
- Accepts PDF, DOCX, and TXT files.
- Extracts raw text to standardizing inputs for subsequent NLP pipelines.

### 3.2. Resume-Job Matcher (`/api/match` & `/api/semantic-match`)
- **Classical NLP Matcher** (`nlp_engine.py`): Cleans text, tokenizes, removes stopwords/punctuation, lemmatizes. Applies **TF-IDF Vectorization** and computes **Cosine Similarity** between the resume and the target Job Description (JD). Calculates exact keyword overlap.
- **Semantic Matcher** (`semantic_matcher.py`): Advanced Gen2 feature. Uses BERT embeddings (`all-MiniLM-L6-v2`) to capture context. It identifies skills that are semantically identical but worded differently (e.g., "ML" vs "Machine Learning") finding matches that traditional regex/TF-IDF would miss.

### 3.3. Skill Extractor (`/api/skills`)
- Uses dictionary-driven regex matching in `nlp_engine.py`.
- Categorizes extracted skills into 6 buckets: Programming Languages, AI & Machine Learning, Web Development, Database & Cloud, Data & BI Tools, and Soft Skills.
- Identifies strong categories and highlights missing categories, suggesting highly demanded market skills to add.

### 3.4. Score Card Reader (`/api/score-card`)
- Handled by `score_card.py`.
- Generates a holistic out-of-100 grade based on 5 dimensions:
  1. **Content (25 pts)**: Action verbs, quantifiable achievements, word count, penalizes filler phrases.
  2. **Skills (20 pts)**: Breadth of skills covered.
  3. **Structure (20 pts)**: Presence of critical sections (education, experience, projects) and links (email, LinkedIn, GitHub).
  4. **Language (20 pts)**: Spelling errors, passive voice, average sentence length, first-person pronouns.
  5. **ATS Compatibility (15 pts)**: Checks for weird unicode characters, standard headings, and dates.
- Output includes a letter grade, top 3 fixes needed, and a competitive percentile.

### 3.5. Role Predictor (`/api/role-predict`)
- Handled by `role_predictor.py`.
- Identifies the top 3 best-fit career roles out of 10 standard tech profiles (e.g., Data Scientist, Web Developer, DevOps, Business Analyst).
- Uses a hybrid scoring mechanism combining:
  1. Direct skill intersection (60% weight).
  2. Profile description vs. resume TF-IDF cosine similarity (40% weight).

### 3.6. Resume Summarizer (`/api/summarize`)
- Uses Extractive Summarization.
- Splits the resume into sentences, computes word importance based on intra-document TF-IDF style weighting.
- Ranks sentences and splices the top 5-7 into a coherent summary paragraph, measuring the compression ratio.

### 3.7. AI Coach & Bullet Reviewer (`/api/coach` & `/api/bullet-review`)
- **AI Coach** (`ai_coach.py`): A rule-based conversational agent. It detects intent using keyword patterns (e.g. asking about "score", "missing skills", "ATS readiness") and securely routes the query to the corresponding internal python function.
- **Bullet Review**: Analyzes individual bullet points, scoring them strictly based on presence of Action Verbs, quantifiable metrics (numbers/%), and optimal word count.

### 3.8. Generative AI Deep Analysis (`/api/deep-analyze` & `/api/rewrite`)
- Connects to Google's Gemini LLM.
- **Deep Analyze**: Provides qualitative feedback not achievable through strict matching (e.g., tone, framing, strategic impact).
- **Rewrite**: Restructures the entire resume to be ATS compliant while optimizing formatting for applicant tracking systems. If the API limits are hit, it gracefully falls back to a custom NLP python rewrite engine.

### 3.9 PDF Generator (`/api/generate-pdf`)
- Converts the ATS-optimized/rewritten text directly back into a cleanly formatted, ready-to-download PDF document directly from the frontend.

---

## 4. WorkFlow / Data Flow

1. **User Interaction**: The user accesses the React web app. The interface uses a sleek dark theme.
2. **Input**: User uploads a resume (PDF/DOCX) or pastes text. Optionally pastes a Job Description.
3. **Execution**: React sends a REST HTTP POST to the FastAPI backend.
4. **Processing**:
   - The FastAPI controller (`main.py`) routes the request.
   - Text is run through the `file_parser` -> Cleaned via NLP Regex -> Passed to specific analytical modules (Score Card, Semantic Matcher, Predictor).
5. **Output**: Calculations are returned as JSON to the React frontend.
6. **Rendering**: React updates the UI state, presenting dynamic progress bars, animated expander cards, radar charts (if applicable), and clear action items.
7. **Persistence**: Analysis results are sent to Google Firebase Firestore to save user history.

---

## 5. Main Upgrades in "Gen 2"
The original project utilized basic TF-IDF and traditional string matching. The "Gen 2 AI Insights" introduced:
1. **Semantic Matcher (`sentence-transformers`)**: Understanding context rather than strict words.
2. **5-Dimension Score Card**: Multi-vector holistic resume grading.
3. **Role Predictor Model**: Automatically suggesting career paths based on detected capabilities.
4. **AI Coach Chat Handler**: Conversational UI to explore resume weaknesses.
5. **Dark Mode UI Redesign**: Transitioned from a generic UI to a robust, professional deep-dark theme.

This architecture enables a robust, highly modular, scalable platform perfectly suited to bridge the gap between classical NLP transparency and Modern Deep Learning insights.
