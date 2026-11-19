# Intelligent Resume Analyzer using Natural Language Processing

## 1. TITLE PAGE INFO

**Title:** Intelligent Resume Analyzer using Natural Language Processing  
**Subject:** CSA4028 - Natural Language Processing  
**University:** VIT Bhopal University  
**Program:** B.Tech Computer Science and Engineering  
**Semester:** Winter Semester 2025-2026  

---

## 2. AIM

The aim of this project is to design and implement an offline, Python-based NLP system that performs intelligent resume analysis through interpretable classical natural language processing techniques. The system is intended to automate three core recruitment-oriented tasks: resume-job similarity matching, skill extraction and categorization, and extractive resume summarization. The project applies text preprocessing, tokenization, stopword removal, lemmatization, TF-IDF feature modeling, cosine similarity, rule-based keyword extraction, and sentence scoring to produce measurable and explainable outputs for academic and practical use.

---

## 3. ABSTRACT

Recruitment and talent screening processes frequently involve manual reading of large volumes of resumes, which is time-intensive, subjective, and often inconsistent across reviewers. This project presents an offline, interpretable, and modular NLP application titled *Intelligent Resume Analyzer using Natural Language Processing* to support automated resume understanding using classical methods rather than large language model APIs. The proposed system is implemented in Python and Streamlit and contains three integrated NLP modules: (i) Resume vs Job Description Matcher, which computes alignment using cleaning, token normalization, TF-IDF vectorization, and cosine similarity; (ii) Skill Extractor and Categorizer, which identifies single-word and multi-word skills through dictionary-driven regex matching with category-level aggregation; and (iii) Resume Summarizer, which performs extractive summarization by sentence scoring based on TF-IDF-inspired word importance and ranking. The framework uses NLTK for tokenization and linguistic normalization, scikit-learn for vector-space representation and similarity computation, and auxiliary scientific libraries for data handling and visualization. Experimental test cases demonstrate that preprocessing significantly improves matching reliability and keyword quality, while the skill extraction module provides transparent category-wise skill intelligence, and the summarization module reduces resume length with preservation of key professional signals. The final system is lightweight, educationally explainable, fully offline, and suitable for mini-project deployment in NLP coursework.

---

## 4. INTRODUCTION

Natural Language Processing (NLP) is a specialized branch of artificial intelligence and computational linguistics that focuses on enabling machines to process, understand, transform, and generate human language in useful ways. Human language is inherently ambiguous, context-dependent, and variable across writing styles, dialects, and domains. Unlike structured numerical data, textual information contains implicit semantics, latent intent, and non-standard formatting, making computational interpretation challenging. NLP addresses this challenge by combining linguistic principles with statistical and algorithmic methods to convert unstructured text into representations that machines can analyze and reason upon.

The significance of NLP has grown rapidly with digital transformation across industries. Every day, organizations generate text-rich data in the form of emails, support tickets, legal contracts, medical notes, social media posts, HR documents, and technical reports. Without automated language analytics, extracting insights from such data is expensive and slow. NLP systems are therefore foundational in modern applications such as machine translation, sentiment analysis, document classification, information extraction, search relevance, digital assistants, and summarization engines. In the recruitment domain in particular, NLP is highly relevant because resumes and job descriptions are predominantly free-form text documents that must be interpreted quickly and consistently.

Historically, NLP evolved through multiple paradigms. Early systems (1950s-1980s) were rule-based and depended heavily on handcrafted grammars and symbolic logic. Although interpretable, these systems struggled with coverage and scalability. The next major phase introduced statistical NLP (1990s-2010s), where probabilistic models, n-grams, Hidden Markov Models, and later discriminative methods improved robustness by learning from data. The subsequent deep learning era (2013 onward) introduced distributed representations and neural architectures such as recurrent neural networks, attention mechanisms, and transformers, significantly improving task performance. Despite advances in neural methods, classical NLP pipelines remain highly important in academic settings and practical low-resource deployments because they are transparent, computationally lighter, and easier to explain.

Core NLP tasks provide the foundation for most text analytics systems. **Tokenization** splits text into meaningful units (words, subwords, or sentences) and serves as the first structural transformation. **Part-of-Speech (POS) tagging** labels tokens with grammatical categories (noun, verb, adjective, etc.) and supports higher-level syntax-aware tasks. **Named Entity Recognition (NER)** identifies entities such as person names, organizations, dates, and locations. **Text classification** assigns labels to documents or sentences (for example, spam/ham, positive/negative sentiment, or topic categories). **Summarization** condenses long text into concise forms while retaining key information; this may be extractive (selecting existing sentences) or abstractive (generating new sentences). In recruitment technology, these tasks appear in resume parsing, job-candidate matching, skill detection, and profile ranking.

Before applying any NLP model, text preprocessing is essential. Raw text frequently contains noise such as URLs, email addresses, phone numbers, punctuation artifacts, inconsistent capitalization, and irregular spacing. If this noise is retained, it can distort feature distributions and reduce model reliability. Preprocessing therefore standardizes textual input and improves signal quality. Typical steps include lowercasing, regex-based pattern removal, punctuation handling, tokenization, stopword removal, and lemmatization. **Stopword removal** reduces very common words (for example, "the," "is," "and") that often carry low discriminative value for similarity and keyword tasks. **Lemmatization** maps inflected forms to base forms (for example, "developing" to "develop"), which improves semantic grouping and reduces feature sparsity.

One of the most widely taught and practically useful NLP techniques for document representation is TF-IDF (Term Frequency-Inverse Document Frequency). TF-IDF assigns higher importance to words that are frequent in a given document but comparatively rare in a document collection. This balances local relevance and global uniqueness. For term $t$ in document $d$, term frequency can be written as:

$$
TF(t,d) = \frac{f(t,d)}{\sum_{t' \in d} f(t',d)}
$$

where $f(t,d)$ is the raw count of term $t$ in document $d$.

Inverse document frequency for corpus $D$ is:

$$
IDF(t,D) = \log\left(\frac{N}{1 + df(t)}\right) + 1
$$

where $N$ is the total number of documents and $df(t)$ is the number of documents containing term $t$. The final TF-IDF weight is typically:

$$
TFIDF(t,d,D) = TF(t,d) \times IDF(t,D)
$$

In this project, TF-IDF is used both for document-level similarity (resume vs job description) and for sentence-level salience estimation in summarization.

After vectorization, similarity between two texts is measured using cosine similarity, which computes the cosine of the angle between vector representations. Given vectors $A$ and $B$:

$$
\cos(\theta) = \frac{A \cdot B}{\|A\|\,\|B\|}
$$

A value close to 1 indicates strong directional similarity (high lexical-semantic overlap in the vector space), while values near 0 indicate weak similarity. Cosine similarity is effective for sparse vectors such as TF-IDF and is scale-invariant, making it suitable for comparing documents of different lengths.

Summarization is another important NLP capability in this project. Two broad paradigms exist: **extractive summarization** and **abstractive summarization**. Extractive methods select and reorder important sentences from the original text. They are typically simpler, deterministic, and less prone to factual hallucination, making them ideal for educational and high-trust applications. Abstractive summarization generates novel sentences and is often powered by neural sequence models; although more fluent in some settings, it can be harder to control and explain. For this mini project, extractive summarization is chosen intentionally to maintain transparency and reproducibility.

Keyword and skill extraction is a domain-specific NLP task crucial in recruitment analytics. A resume may contain technical competencies, tools, methods, and soft skills distributed across sections such as summary, projects, internships, and certifications. Automated skill extraction converts these mentions into structured signals, enabling profile comparison, gap analysis, and recommendation generation. In practical systems, this can be performed using dictionaries, regex rules, NER models, sequence labeling, or transformer-based span extraction. This project adopts dictionary-plus-regex extraction because it is interpretable, easy to validate, and appropriate for an undergraduate mini project.

The problem addressed by this project is the inefficiency and inconsistency of manual resume screening. Recruiters often evaluate many resumes under time constraints, and quality of evaluation may vary due to fatigue, subjective interpretation, or uneven attention to detail. Important candidates may be overlooked if resumes use different wording than the job advertisement. Similarly, candidates often struggle to identify missing skills or optimize resume content for specific roles. Conventional manual screening does not always provide transparent feedback on match quality, missing competencies, or concise profile summaries.

NLP can reduce these limitations through systematic text normalization, machine-readable feature extraction, and reproducible scoring. A standardized preprocessing pipeline ensures fairer comparison between documents. TF-IDF and cosine similarity provide quantitative matching indicators. Keyword overlap and missing-term detection provide interpretable evidence for the score. Rule-based skill extraction transforms narrative resume text into structured category-wise skill inventories. Extractive summarization converts lengthy profiles into concise summaries that can accelerate human review while preserving essential content.

The proposed system, titled **Intelligent Resume Analyzer using NLP**, consists of three tightly integrated modules. Module 1 computes resume-job match percentage and recommendation labels. Module 2 extracts and categorizes skills into six predefined categories, reports strong and missing categories, and suggests in-demand additions. Module 3 performs extractive summarization with sentence ranking and compression statistics. A Streamlit interface connects all modules in a user-friendly blue-white dashboard with navigation, text input, analysis buttons, and expandable result panels.

This design is particularly suitable for academic learning outcomes in NLP because each transformation step is visible and explainable. Students can inspect how regex cleaning affects token quality, how stopword filtering changes vocabulary, how lemmatization reduces sparsity, and how TF-IDF weighting influences similarity and summarization. Unlike opaque black-box solutions, the present implementation enables direct reasoning from input to output.

From an industry perspective, the project maps to practical functions in Applicant Tracking Systems (ATS) and talent intelligence workflows. Real-world ATS platforms commonly include parsing, matching, ranking, and analytics layers. Although production systems may use larger data and more advanced models, classical NLP pipelines remain relevant where interpretability, low compute overhead, and offline operation are necessary. Small organizations, educational institutions, and early-stage products can benefit from such lightweight architectures before transitioning to deeper neural systems.

In summary, NLP provides the scientific and engineering foundation for turning unstructured recruitment documents into actionable information. By combining preprocessing, vector-space modeling, dictionary-based extraction, and extractive summarization in a single offline application, this project demonstrates both conceptual depth and implementation practicality. It also establishes a strong baseline that can be extended to advanced semantic embeddings, multilingual processing, and deep learning-based ranking in future work.

---

## 5. RELATED WORK

Recent research from 2018 to 2024 demonstrates significant progress in automated recruitment intelligence, skill extraction, and summarization. This section reviews six relevant studies and highlights how the present mini project positions itself relative to them.

### Paper 1: Qin et al. (2018) - Ability-aware Person-Job Fit (SIGIR)
Qin, Zhu, Xu, Zhu, Jiang, Chen, and Xiong proposed an ability-aware neural framework for person-job fit in talent recruitment. Their model represented candidate and job text using neural encoders and introduced attention-like mechanisms to align ability requirements with profile evidence. The work demonstrated that richer representation learning can improve matching performance over shallow baselines in recruitment datasets. A practical limitation, however, is model complexity and dependence on training data quality. In contrast, the current project uses TF-IDF and cosine similarity to create a transparent and deterministic baseline suitable for educational settings and low-resource scenarios.

### Paper 2: Qin et al. (2020) - Enhanced Neural Network for Person-Job Fit (ACM TOIS)
In a later extension, the same research line introduced an enhanced neural approach to person-job fit and reported gains over earlier matching strategies. The paper emphasized multi-granularity textual interactions between candidate and job content and showed robust ranking improvements. Despite stronger predictive power, model interpretability and deployment cost remain concerns for institutions requiring explainable scoring. The mini project presented here addresses that limitation by favoring explainable vector similarity, explicit keyword overlap, and missing keyword reporting that users can directly interpret.

### Paper 3: Wang et al. (2022) - Co-attention Networks for Person-Job Fit (Neurocomputing)
Wang, Wei, Xu, Xu, and Mao proposed a co-attention neural network that integrates candidate profile content and recruitment history for person-job fit estimation. Their method captures richer context and interaction patterns by leveraging both text and behavioral data. The results show advantages in personalized recruitment settings. However, this architecture assumes access to historical recruitment logs, which many educational or small-scale systems do not possess. The current project intentionally avoids data dependencies beyond text input, making it suitable for standalone resume analysis.

### Paper 4: Zhang et al. (2022) - SkillSpan for Hard and Soft Skill Extraction (NAACL)
Zhang, Jensen, Sonniks, and Plank introduced SkillSpan, an annotated benchmark for extracting hard and soft skills from English job postings. The study provided high-quality span-level annotations and evaluated sequence labeling models for skill identification. This work is highly relevant because it formalizes skill extraction as a robust NLP task and separates hard from soft competencies. Its limitation in classroom contexts is annotation and model-training overhead. The present project adopts a dictionary-plus-regex method that is less sophisticated but easy to implement, explain, and validate without labeled training corpora.

### Paper 5: Campos et al. (2020) - YAKE! Keyword Extraction (Information Sciences)
Campos, Mangaravite, Pasquali, Jorge, Nunes, and Jatowt proposed YAKE!, a keyword extraction approach based on local statistical features from single documents. YAKE! showed strong performance without requiring large corpora or supervision, making it suitable for document-level keyphrase detection. For recruitment analytics, this idea is relevant for identifying salient skills and role terms from resumes or job descriptions. The limitation for mini-project constraints is implementation complexity relative to basic regex and TF-IDF pipelines. The current project addresses educational simplicity while still producing useful keyword intelligence through overlap and missing-term analysis.

### Paper 6: Zhang et al. (2020) - PEGASUS for Summarization (ICML)
Zhang, Zhao, Saleh, and Liu presented PEGASUS, a pretraining method for abstractive summarization based on gap-sentence generation objectives. Their model achieved state-of-the-art performance on several summarization benchmarks and demonstrated strong semantic compression. However, abstractive transformer models require substantial compute, pretrained checkpoints, and careful inference control. For an undergraduate offline mini project, extractive summarization offers better interpretability, deterministic behavior, and lower computational cost. Therefore, the current system employs TF-IDF-inspired sentence scoring rather than neural generation.

### Synthesis and Gap Addressed
The reviewed literature indicates that advanced neural methods can achieve high quality in matching, extraction, and summarization, but they often require large datasets, training infrastructure, and tuning expertise. The gap addressed by this project is the need for a fully offline, interpretable, low-compute, and academically explainable pipeline that still covers end-to-end recruitment NLP functionalities. By integrating classical preprocessing, vector-based matching, rule-driven skill mining, and extractive summarization into a single Streamlit application, the project delivers educational value and practical utility while remaining transparent and reproducible.

---

## 6. METHODOLOGY

### 6.1 Overall System Architecture and Data Flow
The proposed architecture follows a modular pipeline design with shared preprocessing and module-specific analytics. Input is free-form resume text and, for Module 1, job description text. The workflow is:

1. **Input Acquisition Layer:** Streamlit text areas receive raw user text. Example-input buttons can auto-fill demo content for reproducibility.
2. **Preprocessing Layer (shared):** regex cleaning, normalization, tokenization, stopword removal, lemmatization, and token filtering are applied.
3. **Feature/Rule Layer:**
   - Module 1: TF-IDF vectorization + cosine similarity.
   - Module 2: dictionary-driven regex skill detection and categorization.
   - Module 3: sentence segmentation + TF-IDF-style sentence scoring.
4. **Decision Layer:** score interpretation, recommendations, strong/missing category logic, summary sentence selection.
5. **Presentation Layer:** metrics, progress bars, color-coded messages, and detailed outputs in expanders.

This architecture ensures code reuse, consistency, and easier debugging. Shared preprocessing minimizes feature mismatch between modules and supports fair comparison across tasks.

### 6.2 Preprocessing Pipeline (Detailed)
The preprocessing strategy is designed to improve linguistic signal quality before feature extraction.

1. **Lowercasing:** all text is converted to lowercase to reduce case-sensitive duplicates (for example, "Python" and "python").
2. **Regex-based noise removal:** URLs, email addresses, and phone numbers are removed because they do not usually contribute to semantic matching quality.
3. **Special-character cleanup:** punctuation and non-alphanumeric symbols are replaced or removed to stabilize token boundaries.
4. **Whitespace normalization:** repeated spaces and newlines are collapsed into single spaces.
5. **Word tokenization:** NLTK `word_tokenize` splits the cleaned text into lexical units.
6. **Stopword removal:** common function words are removed using NLTK English stopword corpus.
7. **Lemmatization:** NLTK `WordNetLemmatizer` converts inflected terms to base forms.
8. **Single-character filtering:** one-character tokens are removed to reduce noise.

The result is a compact normalized token stream with reduced sparsity and stronger semantic discriminability.

### 6.3 Module 1 Methodology: Resume vs Job Description Matcher

#### 6.3.1 Feature Extraction with TF-IDF
After preprocessing, resume and job-description texts are transformed using scikit-learn `TfidfVectorizer` with `max_features=5000` and `ngram_range=(1,2)`. Unigrams capture individual term relevance, while bigrams preserve short phrase context (for example, "machine learning", "rest api").

#### 6.3.2 Similarity Calculation
Cosine similarity is computed between the two resulting vectors. The output score is converted to percentage:

$$
Match\ Score(\%) = 100 \times \cos(\theta)
$$

#### 6.3.3 Keyword Overlap and Missing-Term Analysis
Two sets are formed from processed resume and job tokens:
- Matching keywords: intersection of both sets.
- Missing keywords: job terms absent from resume.

To prioritize feedback, important missing terms are ranked using TF-IDF weights from the job-description vector.

#### 6.3.4 Recommendation Rules
The percentage score is mapped to qualitative labels:
- 75-100: Strong Match
- 60-74.99: Good Match
- 40-59.99: Needs Improvement
- 0-39.99: Poor Match

#### 6.3.5 Small Numerical Example
Suppose the preprocessed resume tokens include {python, nlp, fastapi, sql} and JD tokens include {python, nlp, docker, aws, sql}. Intersection size is 3, missing includes {docker, aws}. If cosine similarity is 0.68, match percentage is 68%, which maps to "Good Match." The missing-keyword panel helps the candidate improve resume alignment.

### 6.4 Module 2 Methodology: Skill Extractor and Categorizer

#### 6.4.1 Skill Dictionary Design
A predefined dictionary is created using six categories exactly as required:
- Programming Languages
- AI & Machine Learning
- Web Development
- Database & Cloud
- Data & BI Tools
- Soft Skills

This dictionary contains both single-word and multi-word terms (for example, "deep learning", "power bi", "problem solving").

#### 6.4.2 Matching Strategy
Skill detection uses regular expressions with:
- case-insensitive matching (`re.IGNORECASE`),
- word-boundary control,
- flexible multi-word spacing,
- basic singular/plural handling by optional suffix logic.

Each detected skill is added to its category set, preventing duplicate counting.

#### 6.4.3 Category Aggregation Logic
After extraction:
- `total_skills` = sum of unique skills across categories.
- `strong_categories` = categories with at least three detected skills.
- `missing_categories` = categories with zero detected skills.
- `suggested_skills` = in-demand skills absent from extracted set.

This converts unstructured resume content into structured capability analytics.

### 6.5 Module 3 Methodology: Resume Summarizer

#### 6.5.1 Sentence Segmentation
The raw resume is split with NLTK `sent_tokenize` to preserve sentence boundaries.

#### 6.5.2 TF-IDF-inspired Word Weighting
A global word-frequency dictionary is built from normalized sentence tokens. For each word:
- global term frequency is computed over all resume tokens,
- sentence-level document frequency is computed across all sentences,
- weight is calculated as TF × IDF.

#### 6.5.3 Sentence Scoring
For each sentence, token weights are summed and normalized by number of valid tokens:

$$
Score(sentence_i) = \frac{\sum_{w \in sentence_i} weight(w)}{|sentence_i|}
$$

Normalization prevents long sentences from receiving unfairly high scores only due to length.

#### 6.5.4 Sentence Selection and Ordering
Sentences are ranked by score. Top 5-7 sentences are selected depending on input length. Selected sentences are then reordered according to original document position to maintain readability and narrative flow.

#### 6.5.5 Summary Statistics
The module outputs:
- generated summary paragraph,
- original word count,
- summary word count,
- compression ratio:

$$
Compression\ Ratio(\%) = \frac{Summary\ Words}{Original\ Words} \times 100
$$

### 6.6 Streamlit UI Integration
The user interface is single-file (`app.py`) and organized with sidebar navigation:
- Home
- Resume-JD Matcher
- Skill Extractor
- Resume Summarizer

Each page contains:
- title and short description,
- text input area(s),
- example auto-fill button(s),
- action button,
- formatted outputs via `st.metric`, `st.success`, `st.warning`, `st.error`, `st.progress`, and `st.expander`.

A custom blue-white theme is applied using CSS for professional visual consistency.

### 6.7 Error Handling Strategy
Each analysis module is wrapped in `try-except` blocks. If invalid or insufficient text is provided, meaningful exceptions are raised and shown via Streamlit error messages. This improves robustness and user experience during classroom demonstrations.

### 6.8 Flowchart Description (Textual)
The flowchart for drawing can be represented as:

**Start -> Home Page -> Select Module -> Enter/Paste Text -> Click Analyze -> Shared Preprocessing -> Module-Specific Processing -> Result Computation -> Visual Output -> End/Repeat**

Detailed branch view:
- From Module Selection:
  - Branch A: Matcher -> TF-IDF -> Cosine Similarity -> Score + Keywords + Recommendation
  - Branch B: Skill Extractor -> Regex Matching -> Category Grouping -> Strength/Missing Analysis
  - Branch C: Summarizer -> Sentence Tokenization -> Word Weights -> Sentence Ranking -> Summary + Compression

This structured flow supports both implementation and explanatory presentation during viva.

---

## 7. HARDWARE AND SOFTWARE REQUIREMENTS

### 7.1 Hardware Requirements
- Processor: Intel Core i3 / AMD Ryzen 3 or above
- RAM: Minimum 4 GB (8 GB recommended)
- Storage: Minimum 1 GB free disk space
- Internet: Required only for first-time package and NLTK resource download; analysis can run offline afterward

### 7.2 Software Requirements
- Operating System: Windows 10/11, Linux, or macOS
- Python: 3.8+
- Browser: Chrome, Edge, or Firefox for Streamlit interface

### 7.3 Python Library Versions Used
- streamlit==1.41.1
- scikit-learn==1.5.2
- nltk==3.9.1
- numpy==1.26.4
- pandas==2.1.4

---

## 8. RESULTS AND DISCUSSION

### 8.1 Test Cases for Module 1 (Resume vs Job Matcher)

#### Test Case 1
**Sample Input:**
- Resume: Candidate profile with Python, NLP, Scikit-learn, FastAPI, SQL, Docker, AWS.
- Job Description: NLP Engineer intern requiring Python, NLP, Scikit-learn, NLTK, FastAPI, REST API, SQL, Docker, AWS.

**Expected Output:**
- Match score in strong/good range.
- Large overlap in technical keywords.
- Few missing terms (for example, NLTK if absent).

**Observed Discussion:**
The module produced a high score and highlighted key overlaps correctly. Missing-term feedback was actionable and specific. This indicates that TF-IDF with bi-grams captures practical job-skill alignment effectively for structured technical roles.

#### Test Case 2
**Sample Input:**
- Resume: Mostly web-development profile (HTML, CSS, React, Bootstrap) with minimal NLP content.
- Job Description: NLP/ML intern role requiring machine learning stack.

**Expected Output:**
- Low-to-moderate match score.
- Missing keywords dominated by NLP/ML terms.
- Recommendation likely "Needs Improvement" or "Poor Match."

**Observed Discussion:**
The output correctly reflected role mismatch and surfaced specific missing terms such as "machine learning" and "natural language processing." This supports the module's usefulness for role-targeted resume refinement.

### 8.2 Test Cases for Module 2 (Skill Extractor)

#### Test Case 1
**Sample Input:** Resume containing Python, Java, SQL, Machine Learning, NLP, Scikit-learn, FastAPI, REST API, Git, Docker, Communication.

**Expected Output:**
- Non-zero skill count across multiple categories.
- Strong categories in Programming and AI/ML.
- Some missing categories depending on resume breadth.

**Observed Discussion:**
The extractor grouped skills correctly and handled multi-word terms such as "machine learning" and "rest api." Category-wise organization improved readability for profile analysis and interview preparation.

#### Test Case 2
**Sample Input:** Resume focused on soft skills and managerial points with limited technical terms.

**Expected Output:**
- Soft Skills category prominent.
- Technical categories largely missing.
- Suggestion list recommending technical in-demand skills.

**Observed Discussion:**
The module successfully separated soft-skill-heavy profiles from technical profiles and provided constructive suggestions. This confirms utility for academic profile enhancement planning.

### 8.3 Test Cases for Module 3 (Resume Summarizer)

#### Test Case 1
**Sample Input:** Full resume text of 350+ words with sections on education, projects, internship, and skills.

**Expected Output:**
- Summary of top 5-7 sentences preserving core achievements and skills.
- Compression ratio around 30-50% depending on input structure.

**Observed Discussion:**
The summarizer selected project and experience sentences with high informational density. Output remained coherent because selected sentences were reordered by original position.

#### Test Case 2
**Sample Input:** Very short resume paragraph with only 3-4 sentences.

**Expected Output:**
- Minimal summarization or near-original output.
- Stable behavior without crashes.

**Observed Discussion:**
The module handled short input safely and produced a concise output. This demonstrates robust edge-case handling.

### 8.4 Effectiveness and Accuracy Discussion
The three modules jointly provide meaningful and interpretable results for resume analytics:
- Module 1 offers quantitative alignment and transparent term-level evidence.
- Module 2 gives structured skill intelligence and practical recommendations.
- Module 3 speeds profile review through concise extractive summaries.

While no supervised gold-standard benchmark was used in this mini project, qualitative evaluation across controlled test cases indicates consistent behavior and expected outputs aligned with NLP design goals.

### 8.5 With vs Without Preprocessing Comparison

| Scenario | Match Score Behavior | Keyword Quality | Summary Quality |
|---|---|---|---|
| Without preprocessing | Noisy and unstable due to punctuation/case artifacts | Includes irrelevant tokens | Less focused sentence ranking |
| With preprocessing | More stable and role-relevant | Cleaner overlap/missing lists | Better salience and coherence |

This comparison confirms that cleaning, stopword removal, and lemmatization are essential for robust downstream analysis.

### 8.6 Why TF-IDF Was Chosen
TF-IDF was selected because it is:
1. Interpretable and mathematically explainable.
2. Effective for sparse document comparison.
3. Lightweight for CPU-only offline execution.
4. Easy to integrate with cosine similarity and sentence scoring.

Compared to deep embeddings, TF-IDF may miss deeper semantic paraphrases, but it remains highly suitable for a pedagogical mini project emphasizing core NLP principles.

### 8.7 Current Limitations
- Dictionary-based skill extraction may miss unseen synonyms.
- Rule-based matching may underperform on highly unstructured resumes.
- Extractive summarization does not rewrite text for fluency as abstractive models do.
- No PDF/DOCX parser in the current version (text input is manual paste).
- No multilingual processing in this baseline implementation.

---

## 9. CONCLUSION AND FUTURE SCOPE

This project successfully designed and implemented a complete offline NLP application for intelligent resume analysis under the title *Intelligent Resume Analyzer using Natural Language Processing*. The system achieved the intended objective of demonstrating practical recruitment-oriented NLP workflows through three independent yet integrated modules: resume-job matching, skill extraction and categorization, and resume summarization. Each module was built using transparent, classical NLP methods so that every processing step is explainable in academic discussions and viva examinations.

From a technical perspective, the work applied and validated major NLP concepts including text cleaning, tokenization, stopword elimination, lemmatization, TF-IDF vectorization, cosine similarity, regex-driven keyword extraction, and extractive sentence ranking. The project therefore satisfies core course-aligned learning outcomes by linking NLP theory to implementation. The Streamlit interface further converted these methods into a user-friendly analytical tool with visual metrics, recommendation cues, and detailed expandable diagnostics.

In practical terms, the system is useful for students and early professionals who want to evaluate resume relevance against target roles, identify missing competencies, and create concise professional summaries for profile optimization. The solution is lightweight, reproducible, and executable on standard hardware without paid APIs, making it accessible and reliable for educational environments.

Future scope is substantial. The matcher can be upgraded with contextual embeddings (for example, BERT or sentence transformers) to improve semantic understanding beyond lexical overlap. The skill extractor can evolve into sequence-labeling models trained on span-annotated corpora such as SkillSpan. The summarizer can be extended to neural abstractive summarization for higher fluency. Additional enhancements include automatic PDF/DOCX parsing, multilingual resume support, ontology-based skill normalization, role-specific recommendation engines, and cloud deployment for scalable multi-user access. Together, these directions can transform the current baseline into an industry-grade ATS assistant while preserving the strong explainable foundation established in this project.

---

## 10. REFERENCES (IEEE FORMAT, EXACTLY 10)

[1] C. Qin, H. Zhu, T. Xu, C. Zhu, L. Jiang, E. Chen, and H. Xiong, "Enhancing Person-Job Fit for Talent Recruitment: An Ability-aware Neural Network Approach," in *Proceedings of the 41st International ACM SIGIR Conference on Research and Development in Information Retrieval (SIGIR)*, 2018, pp. 25-34.

[2] C. Qin, H. Zhu, T. Xu, C. Zhu, C. Ma, E. Chen, and H. Xiong, "An Enhanced Neural Network Approach to Person-Job Fit in Talent Recruitment," *ACM Transactions on Information Systems*, vol. 38, no. 2, pp. 15:1-15:33, 2020.

[3] M. Zhang, K. N. Jensen, S. D. Sonniks, and B. Plank, "SkillSpan: Hard and Soft Skill Extraction from English Job Postings," in *Proceedings of NAACL-HLT*, 2022, pp. 4962-4984.

[4] R. Campos, V. Mangaravite, A. Pasquali, A. Jorge, C. Nunes, and A. Jatowt, "YAKE! Keyword extraction from single documents using multiple local features," *Information Sciences*, vol. 509, pp. 257-289, 2020.

[5] D. Jurafsky and J. H. Martin, *Speech and Language Processing*, 3rd ed. draft, 2024. [Online]. Available: https://web.stanford.edu/~jurafsky/slp3/

[6] S. Bird, E. Klein, and E. Loper, *Natural Language Processing with Python*. Sebastopol, CA, USA: O'Reilly Media, 2009.

[7] NLTK Project, "NLTK 3.9 Documentation," [Online]. Available: https://www.nltk.org/

[8] Scikit-learn Developers, "scikit-learn User Guide," [Online]. Available: https://scikit-learn.org/stable/user_guide.html

[9] U.S. Department of Labor, Employment and Training Administration, "O*NET Database," [Online]. Available: https://www.onetcenter.org/database.html

[10] Streamlit Inc., "Streamlit Documentation," [Online]. Available: https://docs.streamlit.io/

---

## 11. APPENDIX

### Appendix A: Full Commented Python Code
The complete commented implementation is provided in the submitted project file:
- `app.py`

### Appendix B: requirements.txt

```txt
streamlit==1.41.1
scikit-learn==1.5.2
nltk==3.9.1
numpy==1.26.4
pandas==2.1.4
```

### Appendix C: Sample Test Resume Text
The sample resume used for testing is provided in:
- `sample_resume.txt`

### Appendix D: Sample Job Description Text
The sample job description used for testing is provided in:
- `sample_job_description.txt`

### Appendix E: Run Instructions

```bash
pip install -r requirements.txt
streamlit run app.py
```

Expected startup behavior:
1. NLTK resources are downloaded on first run.
2. Open the local Streamlit URL in browser.
3. Use sidebar to test all three modules.
