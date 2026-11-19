import React, { useState, useRef, useMemo } from 'react';
import axios from 'axios';
import {
    Plus, Search, Download, Check, X,
    RefreshCw, UploadCloud, FileText,
    Filter, Mail, Calendar, MessageSquare, Briefcase,
    SlidersHorizontal, AlertCircle, ArrowUpDown, CheckCircle2,
    Users, BarChart2, TrendingUp, Award, Clock, ChevronRight,
    ExternalLink, Database, Layers, ArrowRight, ShieldCheck,
    CheckCircle, AlertTriangle, User, MapPin, Phone, GraduationCap,
    ChevronDown, ChevronUp, Copy, DollarSign, Globe, Wrench, Sparkles,
    Zap, Brain, ListChecks, Target, Network, MessageCircle
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const PRESET_POSITIONS = [
    {
        id: 'pos-1',
        jobId: 'REQ-101',
        department: 'AI & Engineering',
        title: 'Senior Full Stack & AI Developer',
        status: 'Open',
        statusColor: '#059669',
        statusBg: 'var(--score-high-bg)',
        statusBorder: 'var(--score-high-border)',
        meta: 'Salary: $120k-$150k | Full-time | Remote OK | 3-5 years exp',
        experienceRequired: '3-5 years',
        educationRequired: "Bachelor's or Master's in Computer Science",
        location: 'Remote / Global',
        workType: 'Full-time',
        salaryRange: '$120,000 - $150,000',
        description: `Job Title: Senior Full Stack & AI Developer
Location: Remote / Global
Experience Required: 3-5 years of industry experience
Education: Bachelor's or Master's in Computer Science

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
- Familiarity with MongoDB or Redis caching`
    },
    {
        id: 'pos-2',
        jobId: 'REQ-102',
        department: 'Backend Engineering',
        title: 'Backend Developer - Lisbon',
        status: 'Open',
        statusColor: '#059669',
        statusBg: 'var(--score-high-bg)',
        statusBorder: 'var(--score-high-border)',
        meta: 'Salary: €50k-€65k | Full-time | Hybrid | 3+ years exp',
        experienceRequired: '3+ years',
        educationRequired: "Bachelor's Degree in Computer Science or related field",
        location: 'Lisbon, Portugal',
        workType: 'Hybrid',
        salaryRange: '€50,000 - €65,000',
        description: `Job Title: Backend Developer
Location: Lisbon, Portugal
Experience Required: 3+ years in Python, FastAPI/Django, PostgreSQL, Redis, Docker, and REST APIs.`
    },
    {
        id: 'pos-3',
        jobId: 'REQ-103',
        department: 'Infrastructure & Cloud',
        title: 'DevOps Engineer - Berlin',
        status: 'Open',
        statusColor: '#059669',
        statusBg: 'var(--score-high-bg)',
        statusBorder: 'var(--score-high-border)',
        meta: 'Salary: €70k-€85k | Full-time | Remote OK | 4+ years exp',
        experienceRequired: '4+ years',
        educationRequired: "B.Sc in Information Technology or Computer Engineering",
        location: 'Berlin, Germany',
        workType: 'Remote OK',
        salaryRange: '€70,000 - €85,000',
        description: `Job Title: DevOps Engineer
Location: Berlin, Germany
Experience: 4+ years in AWS, Kubernetes (K8s), Docker, Terraform, CI/CD, and Linux.`
    },
    {
        id: 'pos-4',
        jobId: 'REQ-104',
        department: 'Data Science',
        title: 'Data Scientist - New York',
        status: 'Draft',
        statusColor: '#d97706',
        statusBg: 'var(--score-mid-bg)',
        statusBorder: 'var(--score-mid-border)',
        meta: 'Salary: $130k-$160k | Full-time | Hybrid | 2+ years exp',
        experienceRequired: '2+ years',
        educationRequired: "Master's or Bachelor's in Data Science, Statistics, or CS",
        location: 'New York, USA',
        workType: 'Hybrid',
        salaryRange: '$130,000 - $160,000',
        description: `Job Title: Data Scientist
Location: New York, USA
Experience: 2+ years in Machine Learning, Python, SQL, and Power BI.`
    },
    {
        id: 'pos-5',
        jobId: 'REQ-105',
        department: 'Product Design',
        title: 'Senior Product Designer - Global',
        status: 'Closed',
        statusColor: '#dc2626',
        statusBg: 'var(--score-low-bg)',
        statusBorder: 'var(--score-low-border)',
        meta: 'Salary: $90k-$110k | Contract | Remote OK | 5+ years exp',
        experienceRequired: '5+ years',
        educationRequired: "Bachelor's Degree in Design, HCI, or equivalent portfolio",
        location: 'Remote',
        workType: 'Contract',
        salaryRange: '$90,000 - $110,000',
        description: `Job Title: Senior Product Designer
Location: Remote
Experience: 5+ years in SaaS Product Design, Figma, User Research, and Design Systems.`
    }
];

export default function BatchAtsPage({
    theme,
    toggleTheme,
    activeNav = 'positions',
    setActiveNav,
    settings,
    onOpenSettings,
    showToast
}) {
    // ── Positions State ──
    const [positions, setPositions] = useState(PRESET_POSITIONS);
    const [activePositionId, setActivePositionId] = useState('pos-1');
    const [positionSearch, setPositionSearch] = useState('');
    const [positionCategoryFilter, setPositionCategoryFilter] = useState('All');
    const [showNewPositionModal, setShowNewPositionModal] = useState(false);
    const [showJdDetailsModal, setShowJdDetailsModal] = useState(false);

    // ── Candidates & Ranking State (Dynamic real-time storage per position) ──
    const [candidateSearch, setCandidateSearch] = useState('');
    const [sortBy, setSortBy] = useState('score'); // 'score' | 'exp' | 'name' | 'skills'
    const [selectedCandidateIds, setSelectedCandidateIds] = useState(new Set());
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [positionResults, setPositionResults] = useState({});
    const results = positionResults[activePositionId] || null;

    // Dynamic pipeline stats helper (Real-time counts, shortlisted increases when candidate gets Offer)
    const getPositionSubtitle = (pos) => {
        const res = positionResults[pos.id];
        if (!res || !res.candidates || res.candidates.length === 0) {
            return '0 candidates evaluated';
        }
        const total = res.candidates.length;
        const minPass = settings?.minPassingScore || 50;
        const shortlisted = res.candidates.filter(c => {
            const currentStage = candidateStages[c.candidate_id] || (
                c.overall_score < minPass ? 'Reject' : 'Screen'
            );
            return currentStage === 'Offer';
        }).length;
        return `${total} in pipeline | ${shortlisted} shortlisted`;
    };

    // Keep selected candidate in sync with active position
    React.useEffect(() => {
        const currentRes = positionResults[activePositionId];
        if (currentRes && currentRes.candidates && currentRes.candidates.length > 0) {
            setSelectedCandidate(currentRes.candidates[0]);
        } else {
            setSelectedCandidate(null);
        }
    }, [activePositionId, positionResults]);
    const [resumeFiles, setResumeFiles] = useState([]);
    const [uploadedFilesMap, setUploadedFilesMap] = useState({}); // Stores native File objects for original-format download
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [minScoreFilter, setMinScoreFilter] = useState(0);
    const [minExpFilter, setMinExpFilter] = useState(0);
    const [errorMsg, setErrorMsg] = useState(null);
    const resumeInputRef = useRef(null);

    // ── Selected Candidate Drilldown & Notes State ──
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [candidateStages, setCandidateStages] = useState({});
    const [candidateNotes, setCandidateNotes] = useState({});
    const [noteInputText, setNoteInputText] = useState('');
    const [candidateDetailTab, setCandidateDetailTab] = useState('match'); // 'match' | 'resume'

    // ── Invite Modal State ──
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteCandidate, setInviteCandidate] = useState(null);
    const [interviewType, setInterviewType] = useState('Technical Interview');

    // ── Helper: Extract experience requirement from JD text ──
    const parseJdExperience = (text) => {
        if (!text) return '0 years (Fresher)';
        const t = text.toLowerCase();
        if (/\b(?:0\s*(?:-|to)\s*[01]|0\+?)\s*(?:years?|yrs?)/i.test(t) ||
            /\b(?:no\s+prior\s+experience|no\s+experience\s+required|freshers?\s+welcome|freshers?\s+can\s+apply|fresher)\b/i.test(t) ||
            /\b(?:entry[\s-]level|intern|internship|trainee|campus\s+hire)\b/i.test(t)) {
            return '0 years (Fresher)';
        }
        const range = t.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)/);
        if (range) {
            const min = parseFloat(range[1]);
            const max = parseFloat(range[2]);
            return min === 0 ? `0–${max} years (Entry Level)` : `${min}–${max} years`;
        }
        const single = t.match(/(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:professional|relevant|work|industry))?\s+experience/);
        if (single) {
            const y = parseFloat(single[1]);
            return y === 0 ? '0 years (Fresher)' : `${y}+ years`;
        }
        return '0 years (Fresher)';
    };

    // ── New Position Modal State ──
    const [newPosJobId, setNewPosJobId] = useState('');
    const [newPosTitle, setNewPosTitle] = useState('');
    const [newPosDept, setNewPosDept] = useState('AI & Engineering');
    const [newPosStatus, setNewPosStatus] = useState('Open'); // 'Open' | 'Draft' | 'Closed'
    const [newPosMeta, setNewPosMeta] = useState('');
    const [newPosExp, setNewPosExp] = useState('0 years (Fresher)');
    const [newPosJd, setNewPosJd] = useState('');

    // ── Jobs View State ──
    const [jobsSearch, setJobsSearch] = useState('');
    const [jobsFilterTab, setJobsFilterTab] = useState('all'); // 'all' | 'Open' | 'Draft' | 'Closed'

    // ── Candidates Directory View State (According to Opening) ──
    const [poolSearch, setPoolSearch] = useState('');
    const [poolStageFilter, setPoolStageFilter] = useState('all');
    const [poolOpeningFilter, setPoolOpeningFilter] = useState('all');

    // ── Analytics View State (According to Job Opening) ──
    const [analyticsOpeningFilter, setAnalyticsOpeningFilter] = useState('all');

    const activePosition = positions.find(p => p.id === activePositionId) || positions[0];

    // ── Dynamic Recalculation When Settings/Weights Change ──
    const activeWeights = settings?.weights || {
        semantic: 40,
        skills: 35,
        experience: 15,
        education: 10
    };

    // ── 1-Click Load Demo Dataset ──
    const handleLoadDemoDataset = () => {
        const demoCandidates = [
            {
                filename: 'Vincent_Caetano_Senior_FullStack.txt',
                text: `Vincent Caetano
São Paulo, Brazil | Email: vincent.caetano@example.com | Phone: +55 11 98765-4321
LinkedIn: linkedin.com/in/vincent-caetano | GitHub: github.com/vincent-caetano

EDUCATION
Bachelor of Engineering in Computer Science, USP (2019)

WORK EXPERIENCE
Senior Full Stack Engineer | CloudScale SaaS (Jan 2021 – Present, 3.5 years)
- Led frontend and backend architecture of cloud analytics platform serving 2M users.
- Developed scalable REST APIs using FastAPI and Python with PostgreSQL database clusters.
- Built real-time React web application dashboards with TypeScript and Redux.
- Deployed microservices using Docker containers on AWS with automated CI/CD pipelines.
- Integrated Sentence Transformers NLP embeddings for semantic talent search.

Software Engineer | DataTech Brazil (June 2019 – Dec 2020, 1.5 years)
- Engineered backend data pipelines in Python and SQL.
- Implemented Scikit-learn classification models and machine learning pipelines.

SKILLS
React, Python, FastAPI, TypeScript, JavaScript, Docker, PostgreSQL, SQL, Machine Learning, Natural Language Processing, PyTorch, AWS, Git, CI/CD, REST API, Agile.`
            },
            {
                filename: 'Maya_Johnson_AI_Developer.txt',
                text: `Maya Johnson
Toronto, Canada | Email: maya.johnson@example.com | Phone: +1 (416) 555-0199
LinkedIn: linkedin.com/in/mayajohnson

EDUCATION
Bachelor of Science in Computer Science, University of Toronto (2020)

WORK EXPERIENCE
Full Stack AI Developer | NeuroSoft (July 2020 – Present, 4 years)
- Architected intelligent document analysis pipelines using Python, FastAPI, and Transformers.
- Designed responsive interfaces using modern React and TypeScript.
- Managed relational databases in PostgreSQL and optimized SQL execution plans.
- Containerized workloads using Docker and deployed on AWS ECS.

SKILLS
Python, React, FastAPI, Machine Learning, Natural Language Processing, PostgreSQL, SQL, Docker, AWS, Git, REST API, Pandas, NumPy, Communication.`
            },
            {
                filename: 'Arjun_Patel_FullStack_Engineer.txt',
                text: `Arjun Patel
Mumbai, India | Email: arjun.patel@example.com | Phone: +91 98765 43210
LinkedIn: linkedin.com/in/arjunpatel

EDUCATION
B.Tech in Computer Engineering, VJTI Mumbai (2020)

WORK EXPERIENCE
Full Stack Developer | FinTech Labs (Aug 2020 – Present, 3.8 years)
- Built enterprise web applications using React, Python, FastAPI, and PostgreSQL.
- Implemented machine learning recommendation algorithms using Scikit-learn.
- Managed Dockerized container deployments and Git workflows.

SKILLS
Python, React, FastAPI, JavaScript, Docker, PostgreSQL, SQL, Machine Learning, Git, REST API, Problem Solving, Communication.`
            },
            {
                filename: 'Fatima_Khan_Backend_Engineer.txt',
                text: `Fatima Khan
Dubai, UAE | Email: fatima.khan@example.com | Phone: +971 50 123 4567
LinkedIn: linkedin.com/in/fatimakhan

EDUCATION
B.S. in Software Engineering (2020)

WORK EXPERIENCE
Backend Developer | InnoTech Middle East (2020 – Present, 3.5 years)
- Developed robust REST APIs in Python and Flask.
- Optimized PostgreSQL database performance and Docker configurations.

SKILLS
Python, Flask, REST API, PostgreSQL, SQL, Docker, Git, CI/CD, Linux, Redis, Problem Solving.`
            },
            {
                filename: 'Olivia_Martinez_Frontend_Engineer.txt',
                text: `Olivia Martinez
Madrid, Spain | Email: olivia.martinez@example.com | Phone: +34 612 345 678
LinkedIn: linkedin.com/in/oliviamartinez

EDUCATION
B.Sc in Computer Science, Complutense University (2020)

WORK EXPERIENCE
Frontend Engineer | DigitalCraft (2020 – Present, 3.5 years)
- Developed single-page web applications using React, TypeScript, and Redux.
- Collaborated with backend engineers on REST API integrations.

SKILLS
React, JavaScript, TypeScript, HTML, CSS, Tailwind, Git, Figma, Communication, Teamwork.`
            },
            {
                filename: 'Noah_Thompson_DevOps_Engineer.txt',
                text: `Noah Thompson
Sydney, Australia | Email: noah.thompson@example.com | Phone: +61 2 9876 5432
LinkedIn: linkedin.com/in/noahthompson

EDUCATION
B.Sc in Information Technology (2021)

WORK EXPERIENCE
Cloud Engineer | CloudOps Global (Jan 2022 – Present, 2.5 years)
- Automated AWS deployments via Terraform and GitHub Actions.
- Maintained Docker Kubernetes clusters and Grafana monitoring.

SKILLS
AWS, Docker, Kubernetes, Terraform, Linux, Git, CI/CD, Python, Bash, Monitoring.`
            },
            {
                filename: 'Sofia_Rossi_Data_Analyst.txt',
                text: `Sofia Rossi
Rome, Italy | Email: sofia.rossi@example.com | Phone: +39 06 1234 5678
LinkedIn: linkedin.com/in/sofiarossi

EDUCATION
B.S. in Statistics, Sapienza University (2021)

WORK EXPERIENCE
Data Analyst | Insight Analytics (Feb 2022 – Present, 2 years)
- Analyzed customer data using SQL and Python.
- Built interactive dashboards in Power BI and Excel.

SKILLS
Python, SQL, PostgreSQL, Power BI, Excel, Statistics, Data Analysis, Communication.`
            },
            {
                filename: 'Ethan_Lee_Fresher_Engineer.txt',
                text: `Ethan Lee
Seoul, South Korea | Email: ethan.lee@example.com | Phone: +82 10 1234 5678
LinkedIn: linkedin.com/in/ethanlee

EDUCATION
Bachelor of Science in Computer Science, Seoul National University (2020 – 2024)
- 4-Year Full-time Engineering Degree

ACADEMIC PROJECTS & INTERNSHIPS
Software Engineering Intern | TechStart Korea (Summer 2023, 3 months)
- Built sample React components and Python scripts.

SKILLS
Python, JavaScript, React, Git, HTML, CSS, Problem Solving.`
            },
            {
                filename: 'Aisha_El-Sayed_Junior_WebDev.txt',
                text: `Aisha El-Sayed
Cairo, Egypt | Email: aisha.elsayed@example.com | Phone: +20 2 1234 5678
LinkedIn: linkedin.com/in/aishaelsayed

EDUCATION
Bachelor of Computer Science (2023)

WORK EXPERIENCE
Junior Web Developer | Cairo Web Studio (Jan 2024 – Present, 8 months)
- Developed WordPress websites and basic HTML/CSS landing pages.

SKILLS
HTML, CSS, JavaScript, WordPress, PHP, Basic Git.`
            },
            {
                filename: 'Lucas_Dubois_ML_Researcher.txt',
                text: `Lucas Dubois
Paris, France | Email: lucas.dubois@example.com | Phone: +33 1 23 45 67 89
LinkedIn: linkedin.com/in/lucasdubois

EDUCATION
Master of Science in Artificial Intelligence, Sorbonne University (2021)

WORK EXPERIENCE
Machine Learning Engineer | VisionAI Labs (Nov 2021 – Present, 3 years)
- Trained Transformer architectures and PyTorch computer vision models.
- Built FastAPI inference microservices packaged in Docker.

SKILLS
Python, PyTorch, Machine Learning, Natural Language Processing, Transformers, FastAPI, Docker, Git, Linux, Research.`
            }
        ];

        runBatchAnalysis(demoCandidates, activePosition.description);
    };

    // ── Run Batch AI Analysis Engine ──
    const runBatchAnalysis = async (filesOrTexts, jdText) => {
        setIsAnalyzing(true);
        setErrorMsg(null);

        try {
            const isFileArray = filesOrTexts.length > 0 && filesOrTexts[0] instanceof File;
            let response;

            if (isFileArray) {
                const formData = new FormData();
                formData.append('jd_text', jdText);
                const fileMap = { ...uploadedFilesMap };
                filesOrTexts.forEach(file => {
                    formData.append('resumes', file);
                    fileMap[file.name] = file;
                });
                setUploadedFilesMap(fileMap);

                response = await axios.post(`${API_BASE}/api/batch-rank`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                response = await axios.post(`${API_BASE}/api/sample-demo-data`, {
                    jd_text: jdText,
                    candidates: filesOrTexts
                });
            }

            if (response.data && response.data.candidates) {
                setPositionResults(prev => ({
                    ...prev,
                    [activePositionId]: response.data
                }));
                setSelectedCandidate(response.data.candidates[0] || null);

                // Initialize default stage mappings
                const initialStages = {};
                response.data.candidates.forEach(cand => {
                    if (cand.overall_score >= 80) initialStages[cand.candidate_id] = 'Offer';
                    else if (cand.overall_score >= 60) initialStages[cand.candidate_id] = 'Interview';
                    else initialStages[cand.candidate_id] = 'Reject';
                });
                setCandidateStages(initialStages);

                if (showToast) {
                    showToast(`Evaluated ${response.data.total_evaluated} resumes in ${response.data.processing_time_seconds}s!`);
                }
            }
        } catch (err) {
            console.error('Batch evaluation error:', err);
            setErrorMsg(err.response?.data?.detail || 'Failed to connect to ATS backend engine. Ensure backend is running.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ── Recalculate candidate scores dynamically when custom weights are set ──
    const evaluatedCandidates = useMemo(() => {
        if (!results?.candidates) return [];

        const weightSum = activeWeights.semantic + activeWeights.skills + activeWeights.experience + activeWeights.education;
        const normSem = activeWeights.semantic / weightSum;
        const normSk = activeWeights.skills / weightSum;
        const normExp = activeWeights.experience / weightSum;
        const normEdu = activeWeights.education / weightSum;

        return results.candidates.map(cand => {
            if (!cand.score_breakdown) return cand;

            const customScore = (
                (cand.score_breakdown.semantic_score * normSem) +
                (cand.score_breakdown.skill_score * normSk) +
                (cand.score_breakdown.experience_score * normExp) +
                (cand.score_breakdown.education_score * normEdu)
            );
            const clamped = Math.round(Math.min(100, Math.max(0, customScore)) * 10) / 10;
            return {
                ...cand,
                overall_score: clamped,
                match_percentage: Math.round(clamped)
            };
        });
    }, [results, activeWeights]);

    // ── Filter & Sort Candidates in Column 3 ──
    const filteredCandidates = useMemo(() => {
        return evaluatedCandidates
            .filter(cand => {
                if (minScoreFilter > 0 && cand.overall_score < minScoreFilter) return false;
                if (minExpFilter > 0 && (cand.experience_years || 0) < minExpFilter) return false;
                if (!candidateSearch) return true;
                const query = candidateSearch.toLowerCase();
                const nameMatch = cand.name?.toLowerCase().includes(query);
                const skillMatch = cand.skills?.some(s => s.toLowerCase().includes(query));
                const locMatch = cand.location?.toLowerCase().includes(query);
                return nameMatch || skillMatch || locMatch;
            })
            .sort((a, b) => {
                if (sortBy === 'score') return b.overall_score - a.overall_score;
                if (sortBy === 'exp') return (b.experience_years || 0) - (a.experience_years || 0);
                if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
                if (sortBy === 'skills') return (b.matched_count || 0) - (a.matched_count || 0);
                return 0;
            });
    }, [evaluatedCandidates, minScoreFilter, minExpFilter, candidateSearch, sortBy]);

    // ── Handle Checkbox Selection ──
    const handleToggleCandidate = (candId, e) => {
        e.stopPropagation();
        setSelectedCandidateIds(prev => {
            const next = new Set(prev);
            if (next.has(candId)) next.delete(candId);
            else next.add(candId);
            return next;
        });
    };

    const handleSelectAll = () => {
        if (selectedCandidateIds.size === filteredCandidates.length) {
            setSelectedCandidateIds(new Set());
        } else {
            setSelectedCandidateIds(new Set(filteredCandidates.map(c => c.candidate_id)));
        }
    };

    // ── Pipeline Stage Switcher ──
    const handleSetStage = (candId, stage) => {
        setCandidateStages(prev => ({ ...prev, [candId]: stage }));
        if (showToast) showToast(`Candidate moved to ${stage} stage.`);
    };

    // ── Add Team Note ──
    const handleAddNote = () => {
        if (!noteInputText.trim() || !selectedCandidate) return;
        const candId = selectedCandidate.candidate_id;
        const newNote = {
            author: 'Hiring Manager',
            text: noteInputText.trim(),
            time: 'Just now'
        };
        setCandidateNotes(prev => ({
            ...prev,
            [candId]: [...(prev[candId] || []), newNote]
        }));
        setNoteInputText('');
    };

    // ── Download CV in Original Format (.pdf, .docx, .txt) ──
    const handleDownloadCv = async (cand) => {
        if (!cand) return;
        const filename = cand.filename || `${cand.name.replace(/\s+/g, '_')}_CV.txt`;

        // 1. If we have the native File object in memory from direct batch upload
        if (uploadedFilesMap && uploadedFilesMap[cand.filename]) {
            const file = uploadedFilesMap[cand.filename];
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            if (showToast) showToast(`Downloaded ${file.name} in original format`);
            return;
        }

        // 2. Try fetching the file from the backend API (for test_resumes or server uploads)
        if (cand.filename) {
            try {
                const resp = await fetch(`${API_BASE}/api/download-resume/${encodeURIComponent(cand.filename)}`);
                if (resp.ok) {
                    const blob = await resp.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = cand.filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    if (showToast) showToast(`Downloaded ${cand.filename}`);
                    return;
                }
            } catch (e) {
                console.warn('Backend download failed, falling back to text file:', e);
            }
        }

        // 3. Fallback: generate download as .txt
        const textContent = cand.raw_text || `${cand.name}\n\nEmail: ${cand.email}\nExperience: ${cand.experience_formatted}\nSkills: ${cand.skills?.join(', ')}`;
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.pdf') || filename.endsWith('.docx') ? `${cand.name.replace(/\s+/g, '_')}_CV.txt` : filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (showToast) showToast(`Downloaded resume for ${cand.name}`);
    };

    // ── Export CSV ──
    const handleExportCsv = () => {
        if (!filteredCandidates.length) return;
        const headers = ['Rank', 'Name', 'Email', 'Location', 'Experience', 'Match %', 'Score (5.0)', 'Stage', 'Mandatory Skills Matched', 'Missing Mandatory Skills'];
        const rows = filteredCandidates.map(c => [
            c.rank || 1,
            `"${c.name}"`,
            `"${c.email}"`,
            `"${c.location || 'N/A'}"`,
            `"${c.experience_formatted}"`,
            `${c.match_percentage}%`,
            (c.overall_score / 20).toFixed(1),
            candidateStages[c.candidate_id] || 'Screen',
            `"${(c.matched_mandatory || []).join('; ')}"`,
            `"${(c.missing_mandatory || []).join('; ')}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${activePosition.title.replace(/\s+/g, '_')}_Rankings.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ── Update Position Status (Open, Draft, Closed) ──
    const handleUpdatePositionStatus = (posId, newStatus) => {
        setPositions(prev => prev.map(p => {
            if (p.id !== posId) return p;
            let color = '#059669';
            let bg = 'var(--score-high-bg)';
            let border = 'var(--score-high-border)';
            if (newStatus === 'Draft') {
                color = '#d97706';
                bg = 'rgba(217, 119, 6, 0.12)';
                border = 'rgba(217, 119, 6, 0.3)';
            } else if (newStatus === 'Closed') {
                color = '#dc2626';
                bg = 'rgba(220, 38, 38, 0.12)';
                border = 'rgba(220, 38, 38, 0.3)';
            }
            return {
                ...p,
                status: newStatus,
                statusColor: color,
                statusBg: bg,
                statusBorder: border
            };
        }));
        if (showToast) showToast(`Job status set to ${newStatus}`);
    };

    // ── Create New Position ──
    const handleCreatePosition = () => {
        if (!newPosTitle.trim()) return;
        const jobIdToUse = newPosJobId.trim() || `REQ-${Math.floor(100 + Math.random() * 900)}`;
        let color = '#059669';
        let bg = 'var(--score-high-bg)';
        let border = 'var(--score-high-border)';
        if (newPosStatus === 'Draft') {
            color = '#d97706';
            bg = 'rgba(217, 119, 6, 0.12)';
            border = 'rgba(217, 119, 6, 0.3)';
        } else if (newPosStatus === 'Closed') {
            color = '#dc2626';
            bg = 'rgba(220, 38, 38, 0.12)';
            border = 'rgba(220, 38, 38, 0.3)';
        }

        const expToUse = newPosExp.trim() || parseJdExperience(newPosJd);

        const newPos = {
            id: `pos-${Date.now()}`,
            jobId: jobIdToUse,
            department: newPosDept,
            title: newPosTitle.trim(),
            status: newPosStatus,
            statusColor: color,
            statusBg: bg,
            statusBorder: border,
            meta: newPosMeta || `Full-time | Remote | ${expToUse}`,
            experienceRequired: expToUse,
            educationRequired: "Bachelor's Degree",
            location: 'Remote / Global',
            workType: 'Full-time',
            salaryRange: '$80k-$110k',
            description: newPosJd.trim() || newPosTitle.trim()
        };
        setPositions(prev => [newPos, ...prev]);
        setActivePositionId(newPos.id);
        setShowNewPositionModal(false);
        setNewPosJobId('');
        setNewPosTitle('');
        setNewPosExp('0 years (Fresher)');
        setNewPosStatus('Open');
        setNewPosMeta('');
        setNewPosJd('');
        if (showToast) showToast(`Position "${newPos.title}" (${jobIdToUse}) created with ${expToUse}.`);
    };

    // ── All candidates aggregated across all evaluated positions ──
    const allPoolCandidates = useMemo(() => {
        const list = [];
        positions.forEach(pos => {
            const res = positionResults[pos.id];
            if (res && res.candidates) {
                res.candidates.forEach(cand => {
                    list.push({
                        ...cand,
                        positionId: pos.id,
                        positionTitle: pos.title,
                        positionJobId: pos.jobId
                    });
                });
            }
        });
        if (list.length === 0 && evaluatedCandidates.length > 0) {
            return evaluatedCandidates.map(c => ({
                ...c,
                positionId: activePosition.id,
                positionTitle: activePosition.title,
                positionJobId: activePosition.jobId
            }));
        }
        return list;
    }, [positions, positionResults, evaluatedCandidates, activePosition]);

    // ── Open Invite Modal ──
    const handleOpenInvite = (cand, e) => {
        if (e) e.stopPropagation();
        setInviteCandidate(cand);
        setShowInviteModal(true);
    };

    // ── Copy Text to Clipboard ──
    const handleCopyText = (text, label) => {
        navigator.clipboard.writeText(text);
        if (showToast) showToast(`Copied ${label} to clipboard!`);
    };

    return (
        <div style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            background: 'var(--bg-app)',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* ══════════════════════════════════════════════════════════════
                VIEW: REQUISITIONS & OPEN JOBS (Matches Reference Mockup Image 3 & 4)
            ══════════════════════════════════════════════════════════════ */}
            {activeNav === 'jobs' && (
                <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', background: 'var(--bg-app)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                    Open Requisitions & Jobs
                                </h1>
                                <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: 'var(--score-high-bg)',
                                    color: 'var(--score-high)',
                                    border: '1px solid var(--score-high-border)',
                                    padding: '2px 8px',
                                    borderRadius: '999px'
                                }}>
                                    {positions.length} Positions Active
                                </span>
                            </div>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Manage job requisitions, view applicant pipelines, and trigger AI matching evaluations.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setShowNewPositionModal(true)}
                                style={{
                                    background: 'var(--accent-cta)',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                                }}
                            >
                                <Plus size={15} /> Add Job
                            </button>
                            <button
                                onClick={() => setActiveNav('positions')}
                                style={{
                                    background: 'var(--card-bg)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-default)',
                                    padding: '8px 14px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: 'var(--card-shadow)'
                                }}
                            >
                                Go to Ranking Matrix &rarr;
                            </button>
                        </div>
                    </div>

                    {/* Filter Tabs & Search Bar */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginBottom: '16px',
                        padding: '10px 14px',
                        background: 'var(--card-bg)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '10px',
                        boxShadow: 'var(--card-shadow)'
                    }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {['all', 'Open', 'Draft', 'Closed'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setJobsFilterTab(tab)}
                                    style={{
                                        padding: '5px 12px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: jobsFilterTab === tab ? '#059669' : 'transparent',
                                        color: jobsFilterTab === tab ? '#ffffff' : 'var(--text-secondary)',
                                        boxShadow: jobsFilterTab === tab ? '0 1px 4px rgba(5, 150, 105, 0.3)' : 'none'
                                    }}
                                >
                                    {tab === 'all' ? `All Jobs (${positions.length})` : `${tab} Jobs (${positions.filter(p => p.status === tab).length})`}
                                </button>
                            ))}
                        </div>

                        <div style={{ position: 'relative', width: '280px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-tertiary)' }} />
                            <input
                                type="text"
                                placeholder="Search by job title, ID, or department..."
                                value={jobsSearch}
                                onChange={(e) => setJobsSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '6px 10px 6px 30px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-default)',
                                    background: 'var(--bg-subtle)',
                                    color: 'var(--text-primary)',
                                    fontSize: '11px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Jobs Table in Elevated Card */}
                    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '12px 16px' }}>Job ID</th>
                                    <th style={{ padding: '12px 16px' }}>Job Title</th>
                                    <th style={{ padding: '12px 16px' }}>Department</th>
                                    <th style={{ padding: '12px 16px' }}>Pipeline Status</th>
                                    <th style={{ padding: '12px 16px' }}>Requisition State</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {positions
                                    .filter(pos => {
                                        if (jobsFilterTab !== 'all' && pos.status !== jobsFilterTab) return false;
                                        if (!jobsSearch) return true;
                                        const q = jobsSearch.toLowerCase();
                                        return pos.title.toLowerCase().includes(q) || (pos.jobId && pos.jobId.toLowerCase().includes(q)) || (pos.department && pos.department.toLowerCase().includes(q));
                                    })
                                    .map(pos => {
                                        const isCurrent = pos.id === activePositionId;
                                        return (
                                            <tr key={pos.id} style={{ borderBottom: '1px solid var(--border-subtle)', background: isCurrent ? 'rgba(5, 150, 105, 0.05)' : 'transparent' }}>
                                                <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-tertiary)' }}>
                                                    {pos.jobId || 'REQ-100'}
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pos.title}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{pos.meta}</div>
                                                </td>
                                                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                                                    {pos.department || 'Engineering'}
                                                </td>
                                                <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 600 }}>
                                                    {getPositionSubtitle(pos)}
                                                </td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <select
                                                        value={pos.status}
                                                        onChange={(e) => handleUpdatePositionStatus(pos.id, e.target.value)}
                                                        style={{
                                                            padding: '3px 8px',
                                                            borderRadius: '999px',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            background: pos.status === 'Open' ? 'var(--score-high-bg)' : pos.status === 'Draft' ? 'var(--score-mid-bg)' : 'var(--score-low-bg)',
                                                            color: pos.status === 'Open' ? 'var(--score-high)' : pos.status === 'Draft' ? 'var(--score-mid)' : 'var(--score-low)',
                                                            border: `1px solid ${pos.status === 'Open' ? 'var(--score-high-border)' : pos.status === 'Draft' ? 'var(--score-mid-border)' : 'var(--score-low-border)'}`,
                                                            cursor: 'pointer',
                                                            outline: 'none'
                                                        }}
                                                        title="Change requisition status"
                                                    >
                                                        <option value="Open">Open</option>
                                                        <option value="Draft">Draft</option>
                                                        <option value="Closed">Closed</option>
                                                    </select>
                                                </td>
                                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => {
                                                            setActivePositionId(pos.id);
                                                            setActiveNav('positions');
                                                        }}
                                                        style={{
                                                            background: '#059669',
                                                            color: '#ffffff',
                                                            border: 'none',
                                                            padding: '5px 12px',
                                                            borderRadius: '5px',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Rank Candidates &rarr;
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                VIEW: TALENT POOL & CANDIDATES DIRECTORY (Filtered by Opening)
            ══════════════════════════════════════════════════════════════ */}
            {activeNav === 'candidates' && (() => {
                const displayedPool = allPoolCandidates.filter(cand => {
                    if (poolOpeningFilter !== 'all' && cand.positionId !== poolOpeningFilter) return false;
                    const currentStage = candidateStages[cand.candidate_id] || (cand.overall_score >= 80 ? 'Offer' : cand.overall_score >= 60 ? 'Interview' : 'Reject');
                    if (poolStageFilter !== 'all' && currentStage !== poolStageFilter) return false;
                    if (!poolSearch) return true;
                    const q = poolSearch.toLowerCase();
                    return cand.name?.toLowerCase().includes(q) || cand.skills?.some(s => s.toLowerCase().includes(q)) || cand.location?.toLowerCase().includes(q);
                });

                return (
                    <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', background: 'var(--bg-app)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                        Talent Pool & Candidate Directory
                                    </h1>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        background: 'var(--score-high-bg)',
                                        color: 'var(--score-high)',
                                        border: '1px solid var(--score-high-border)',
                                        padding: '2px 8px',
                                        borderRadius: '999px'
                                    }}>
                                        {displayedPool.length} Shown / {allPoolCandidates.length} Total
                                    </span>
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Search, review, and advance talent evaluated across your active job openings.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {allPoolCandidates.length === 0 && (
                                    <button
                                        onClick={handleLoadDemoDataset}
                                        style={{
                                            background: 'var(--accent-indigo)',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '8px 14px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
                                        }}
                                    >
                                        <Database size={14} /> Load 10 Demo Candidates
                                    </button>
                                )}
                                <button
                                    onClick={() => setActiveNav('positions')}
                                    style={{
                                        background: '#059669',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                                    }}
                                >
                                    Open 4-Column ATS Matrix &rarr;
                                </button>
                            </div>
                        </div>

                        {/* Filter Bar with Opening Selector and Stage Tabs */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px',
                            marginBottom: '16px',
                            padding: '10px 14px',
                            background: 'var(--card-bg)',
                            border: '1px solid var(--border-default)',
                            borderRadius: '10px',
                            boxShadow: 'var(--card-shadow)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Opening:</span>
                                    <select
                                        value={poolOpeningFilter}
                                        onChange={(e) => setPoolOpeningFilter(e.target.value)}
                                        style={{
                                            background: 'var(--bg-subtle)',
                                            border: '1px solid var(--border-default)',
                                            borderRadius: '6px',
                                            padding: '4px 8px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="all">All Openings ({positions.length})</option>
                                        {positions.map(p => (
                                            <option key={p.id} value={p.id}>{p.title} ({p.jobId})</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {['all', 'Offer', 'Interview', 'Screen', 'Reject'].map(stg => (
                                        <button
                                            key={stg}
                                            onClick={() => setPoolStageFilter(stg)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                border: 'none',
                                                cursor: 'pointer',
                                                background: poolStageFilter === stg ? (stg === 'Offer' ? '#059669' : stg === 'Interview' ? '#2563eb' : stg === 'Reject' ? '#dc2626' : '#64748b') : 'transparent',
                                                color: poolStageFilter === stg ? '#ffffff' : 'var(--text-secondary)'
                                            }}
                                        >
                                            {stg === 'all' ? 'All Stages' : stg}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ position: 'relative', width: '260px' }}>
                                <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Search candidate, skill, location..."
                                    value={poolSearch}
                                    onChange={(e) => setPoolSearch(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '6px 10px 6px 30px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-default)',
                                        background: 'var(--bg-subtle)',
                                        color: 'var(--text-primary)',
                                        fontSize: '11px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {!allPoolCandidates.length ? (
                            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-tertiary)', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border-default)', boxShadow: 'var(--card-shadow)' }}>
                                <Users size={40} style={{ marginBottom: '12px', color: 'var(--text-tertiary)' }} />
                                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>No Candidates Evaluated Yet</div>
                                <div style={{ fontSize: '13px', marginTop: '6px', maxWidth: '420px', margin: '6px auto 16px auto' }}>
                                    Load the sample candidate batch or upload resumes against any active job description to see instant AI ranking.
                                </div>
                                <button
                                    onClick={handleLoadDemoDataset}
                                    style={{
                                        background: '#059669',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '8px 18px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                                    }}
                                >
                                    <Database size={14} /> Populate Talent Pool with 10 Candidates
                                </button>
                            </div>
                        ) : (
                            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', borderRadius: '10px', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                                            <th style={{ padding: '12px 16px' }}>Rank</th>
                                            <th style={{ padding: '12px 16px' }}>Candidate Name</th>
                                            <th style={{ padding: '12px 16px' }}>Target Opening</th>
                                            <th style={{ padding: '12px 16px' }}>Experience</th>
                                            <th style={{ padding: '12px 16px' }}>ATS Match Score</th>
                                            <th style={{ padding: '12px 16px' }}>Stage</th>
                                            <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayedPool.map((cand, idx) => {
                                            const stage = candidateStages[cand.candidate_id] || (cand.overall_score >= 80 ? 'Offer' : cand.overall_score >= 60 ? 'Interview' : 'Reject');
                                            const rating5 = (cand.overall_score / 20).toFixed(1);
                                            return (
                                                <tr key={cand.candidate_id || idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>#{cand.rank || idx + 1}</td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cand.name}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{cand.email} • {cand.location || 'Remote'}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ fontWeight: 600, color: '#059669', fontSize: '11px' }}>
                                                            {cand.positionTitle || activePosition.title}
                                                        </div>
                                                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                                                            {cand.positionJobId || activePosition.jobId}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '11px',
                                                            background: cand.experience_years === 0 ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-subtle)',
                                                            color: cand.experience_years === 0 ? 'var(--accent-blue)' : 'var(--text-primary)',
                                                            fontWeight: 500
                                                        }}>
                                                            {cand.experience_formatted}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            padding: '3px 8px',
                                                            borderRadius: '999px',
                                                            fontSize: '11px',
                                                            fontWeight: 700,
                                                            background: cand.overall_score >= 80 ? 'var(--score-high-bg)' : cand.overall_score >= 60 ? 'var(--score-mid-bg)' : 'var(--score-low-bg)',
                                                            color: cand.overall_score >= 80 ? 'var(--score-high)' : cand.overall_score >= 60 ? 'var(--score-mid)' : 'var(--score-low)',
                                                            border: `1px solid ${cand.overall_score >= 80 ? 'var(--score-high-border)' : cand.overall_score >= 60 ? 'var(--score-mid-border)' : 'var(--score-low-border)'}`
                                                        }}>
                                                            {rating5} ({cand.match_percentage}%)
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            padding: '3px 10px',
                                                            borderRadius: '999px',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            background: stage === 'Offer' ? 'var(--score-high-bg)' : stage === 'Interview' ? 'rgba(37, 99, 235, 0.12)' : stage === 'Reject' ? 'var(--score-low-bg)' : 'var(--bg-subtle)',
                                                            color: stage === 'Offer' ? 'var(--score-high)' : stage === 'Interview' ? 'var(--accent-blue)' : stage === 'Reject' ? 'var(--score-low)' : 'var(--text-secondary)',
                                                            border: `1px solid ${stage === 'Offer' ? 'var(--score-high-border)' : stage === 'Interview' ? 'rgba(37, 99, 235, 0.3)' : stage === 'Reject' ? 'var(--score-low-border)' : 'var(--border-default)'}`
                                                        }}>
                                                            {stage}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => {
                                                                if (cand.positionId) setActivePositionId(cand.positionId);
                                                                setSelectedCandidate(cand);
                                                                setActiveNav('positions');
                                                            }}
                                                            style={{
                                                                background: '#059669',
                                                                color: '#ffffff',
                                                                border: 'none',
                                                                padding: '5px 12px',
                                                                borderRadius: '5px',
                                                                fontSize: '11px',
                                                                fontWeight: 600,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Inspect Profile &rarr;
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* ══════════════════════════════════════════════════════════════
                VIEW: RECRUITMENT PIPELINE ANALYTICS (Opening-Specific)
            ══════════════════════════════════════════════════════════════ */}
            {activeNav === 'analytics' && (() => {
                const targetCandidates = analyticsOpeningFilter === 'all'
                    ? allPoolCandidates
                    : allPoolCandidates.filter(c => c.positionId === analyticsOpeningFilter);

                const selectedOpening = positions.find(p => p.id === analyticsOpeningFilter);
                const avgScore = targetCandidates.length
                    ? Math.round(targetCandidates.reduce((a, b) => a + b.overall_score, 0) / targetCandidates.length)
                    : 0;
                const topContenders = targetCandidates.filter(c => c.overall_score >= 80).length;
                const interviewCount = targetCandidates.filter(c => {
                    const stg = candidateStages[c.candidate_id] || (c.overall_score >= 80 ? 'Offer' : c.overall_score >= 60 ? 'Interview' : 'Reject');
                    return stg === 'Interview';
                }).length;
                const offerCount = targetCandidates.filter(c => {
                    const stg = candidateStages[c.candidate_id] || (c.overall_score >= 80 ? 'Offer' : c.overall_score >= 60 ? 'Interview' : 'Reject');
                    return stg === 'Offer';
                }).length;

                // Derive skills based on opening
                const skillsToShow = selectedOpening
                    ? (selectedOpening.id === 'pos-1' ? ['Python', 'FastAPI', 'React', 'Docker', 'PostgreSQL', 'Machine Learning', 'TypeScript', 'SQL', 'REST API'] :
                       selectedOpening.id === 'pos-2' ? ['Python', 'Django', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'REST API', 'Git', 'CI/CD'] :
                       selectedOpening.id === 'pos-3' ? ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Linux', 'Prometheus', 'Bash'] :
                       ['Python', 'SQL', 'Machine Learning', 'Statistics', 'Pandas', 'Scikit-Learn', 'PyTorch'])
                    : ['Python', 'React', 'FastAPI', 'PostgreSQL', 'Docker', 'Machine Learning', 'AWS', 'TypeScript', 'SQL', 'REST API'];

                return (
                    <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto', background: 'var(--bg-app)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                    Hiring Pipeline & Evaluation Analytics
                                </h1>
                                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Screening accuracy, stage conversion rates, and skill distribution {selectedOpening ? `for ${selectedOpening.title}` : 'across all openings'}.
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Filter by Job:</span>
                                    <select
                                        value={analyticsOpeningFilter}
                                        onChange={(e) => setAnalyticsOpeningFilter(e.target.value)}
                                        style={{
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--border-default)',
                                            borderRadius: '6px',
                                            padding: '6px 10px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            boxShadow: 'var(--card-shadow)'
                                        }}
                                    >
                                        <option value="all">All Job Openings Aggregate</option>
                                        {positions.map(p => (
                                            <option key={p.id} value={p.id}>{p.title} ({p.jobId})</option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => setActiveNav('positions')}
                                    style={{
                                        background: '#059669',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '8px 16px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                                    }}
                                >
                                    Go to ATS Matrix &rarr;
                                </button>
                            </div>
                        </div>

                        {/* Metric Cards Row - Elevated floating cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '18px', boxShadow: 'var(--card-shadow)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Evaluated Resumes</div>
                                <div style={{ fontSize: '30px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                    {targetCandidates.length}
                                </div>
                                <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 500 }}>Multi-format parsed (PDF/DOCX/TXT)</div>
                            </div>

                            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '18px', boxShadow: 'var(--card-shadow)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Top Contenders</div>
                                <div style={{ fontSize: '30px', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
                                    {topContenders}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Score &ge; 80% (Ready for Offer)</div>
                            </div>

                            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '18px', boxShadow: 'var(--card-shadow)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Average ATS Score</div>
                                <div style={{ fontSize: '30px', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                                    {avgScore}%
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Semantic AI Match Fit</div>
                            </div>

                            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '18px', boxShadow: 'var(--card-shadow)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Interview Invitations</div>
                                <div style={{ fontSize: '30px', fontWeight: 700, color: '#7c3aed', marginTop: '4px' }}>
                                    {interviewCount + offerCount}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Recruiter actioned pipeline</div>
                            </div>
                        </div>

                        {/* Pipeline Funnel Card */}
                        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '20px', marginBottom: '24px', boxShadow: 'var(--card-shadow)' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
                                Recruitment Stage Conversion Funnel {selectedOpening ? `(${selectedOpening.jobId})` : ''}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Stage 1: Screened</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                        {targetCandidates.length}
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--border-default)', borderRadius: '3px', marginTop: '8px' }}>
                                        <div style={{ width: '100%', height: '100%', background: '#64748b', borderRadius: '3px' }} />
                                    </div>
                                </div>
                                <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Stage 2: Technical Interview</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                                        {interviewCount}
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--border-default)', borderRadius: '3px', marginTop: '8px' }}>
                                        <div style={{ width: targetCandidates.length ? `${(interviewCount / targetCandidates.length) * 100}%` : '0%', height: '100%', background: '#2563eb', borderRadius: '3px' }} />
                                    </div>
                                </div>
                                <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-default)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Stage 3: Final Offer</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
                                        {offerCount}
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--border-default)', borderRadius: '3px', marginTop: '8px' }}>
                                        <div style={{ width: targetCandidates.length ? `${(offerCount / targetCandidates.length) * 100}%` : '0%', height: '100%', background: '#059669', borderRadius: '3px' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skill Demand vs Supply */}
                        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border-default)', borderRadius: '10px', padding: '20px', boxShadow: 'var(--card-shadow)' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)' }}>
                                Core Mandatory Skills {selectedOpening ? `(${selectedOpening.title})` : 'Distribution'}
                            </h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {skillsToShow.map((skill, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            background: 'var(--score-high-bg)',
                                            color: 'var(--score-high)',
                                            border: '1px solid var(--score-high-border)',
                                            padding: '5px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        <Check size={12} strokeWidth={2.5} /> {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ══════════════════════════════════════════════════════════════
                FLAGSHIP 4-COLUMN VIEW (All Sections Pop Out with Depth)
            ══════════════════════════════════════════════════════════════ */}
            {activeNav === 'positions' && (
                <>
                    {/* ── COLUMN 2: Open Positions List Panel (ENHANCED SIDE PANEL) ── */}
                    <div style={{
                        width: '280px',
                        borderRight: '1px solid var(--border-default)',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--bg-surface)',
                        flexShrink: 0
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '14px 16px',
                            borderBottom: '1px solid var(--border-default)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-surface)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                                    Open Positions
                                </h2>
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    background: 'var(--score-high-bg)',
                                    color: 'var(--score-high)',
                                    border: '1px solid var(--score-high-border)',
                                    padding: '1px 6px',
                                    borderRadius: '999px'
                                }}>
                                    {positions.length} Active
                                </span>
                            </div>

                            <button
                                onClick={() => setShowNewPositionModal(true)}
                                title="Add New Job Description"
                                style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '6px',
                                    background: '#059669',
                                    color: '#ffffff',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: 0,
                                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
                                }}
                            >
                                <Plus size={15} />
                            </button>
                        </div>

                        {/* Search & Category Filter */}
                        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={13} style={{ position: 'absolute', left: '8px', top: '8px', color: 'var(--text-tertiary)' }} />
                                <input
                                    type="text"
                                    placeholder="Filter by title, dept..."
                                    value={positionSearch}
                                    onChange={(e) => setPositionSearch(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '6px 8px 6px 28px',
                                        fontSize: '11px',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: '6px',
                                        outline: 'none',
                                        background: 'var(--bg-subtle)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>

                            {/* Quick Category Chips */}
                            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
                                {['All', 'AI & Engineering', 'Data Science', 'Design'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setPositionCategoryFilter(cat)}
                                        style={{
                                            background: positionCategoryFilter === cat ? '#059669' : 'var(--bg-subtle)',
                                            color: positionCategoryFilter === cat ? '#ffffff' : 'var(--text-secondary)',
                                            border: '1px solid var(--border-default)',
                                            borderRadius: '4px',
                                            padding: '2px 7px',
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {cat === 'AI & Engineering' ? 'Eng' : cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Positions List - POPPING CARDS WITH DEPTH */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                            {positions
                                .filter(p => {
                                    if (positionCategoryFilter !== 'All' && !p.department?.includes(positionCategoryFilter) && !p.title?.includes(positionCategoryFilter)) return false;
                                    if (!positionSearch) return true;
                                    const q = positionSearch.toLowerCase();
                                    return p.title.toLowerCase().includes(q) || p.department?.toLowerCase().includes(q) || p.jobId?.toLowerCase().includes(q);
                                })
                                .map(pos => {
                                    const isSelected = pos.id === activePositionId;
                                    return (
                                        <div
                                            key={pos.id}
                                            onClick={() => setActivePositionId(pos.id)}
                                            style={{
                                                padding: '12px 14px',
                                                borderRadius: '8px',
                                                marginBottom: '8px',
                                                cursor: 'pointer',
                                                border: isSelected ? '1.5px solid #059669' : '1px solid var(--border-default)',
                                                borderLeft: isSelected ? '4px solid #059669' : '1px solid var(--border-default)',
                                                background: isSelected ? (theme === 'dark' ? 'rgba(5, 150, 105, 0.12)' : '#ecfdf5') : 'var(--card-bg)',
                                                boxShadow: isSelected ? '0 4px 12px rgba(5, 150, 105, 0.15)' : 'var(--card-shadow)',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                                        <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-tertiary)' }}>
                                                            {pos.jobId}
                                                        </span>
                                                        <span style={{ fontSize: '10px', color: 'var(--accent-blue)', fontWeight: 600 }}>
                                                            {pos.department}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                                        {pos.title}
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    padding: '2px 8px',
                                                    borderRadius: '999px',
                                                    background: pos.status === 'Open' ? 'var(--score-high-bg)' : pos.status === 'Draft' ? 'var(--score-mid-bg)' : 'var(--score-low-bg)',
                                                    color: pos.status === 'Open' ? 'var(--score-high)' : pos.status === 'Draft' ? 'var(--score-mid)' : 'var(--score-low)',
                                                    border: `1px solid ${pos.status === 'Open' ? 'var(--score-high-border)' : pos.status === 'Draft' ? 'var(--score-mid-border)' : 'var(--score-low-border)'}`,
                                                    flexShrink: 0
                                                }}>
                                                    {pos.status}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-secondary)' }}>
                                                <span>{pos.location}</span>
                                                <span style={{ fontWeight: 600 }}>{pos.experienceRequired}</span>
                                            </div>

                                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', fontWeight: 500 }}>
                                                {getPositionSubtitle(pos)}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* ── COLUMN 3: Position Details & Candidate Ranking List (ENHANCED MIDDLE PANEL) ── */}
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        borderRight: '1px solid var(--border-default)',
                        background: 'var(--bg-app)',
                        overflow: 'hidden'
                    }}>
                        {/* Column 3 Header Card (Streamlined for maximum candidate list space) */}
                        <div style={{
                            padding: '12px 18px',
                            borderBottom: '1px solid var(--border-default)',
                            background: 'var(--card-bg)',
                            boxShadow: 'var(--card-shadow)'
                        }}>
                            {/* Row 1: Position Title + Spec Badges + Action Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{
                                        fontFamily: 'monospace',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        background: 'var(--bg-subtle)',
                                        color: 'var(--text-secondary)',
                                        border: '1px solid var(--border-default)'
                                    }}>
                                        {activePosition.jobId}
                                    </span>
                                    <select
                                        value={activePosition.status}
                                        onChange={(e) => handleUpdatePositionStatus(activePosition.id, e.target.value)}
                                        title="Click to change job status (Open, Draft, Closed)"
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            padding: '2px 8px',
                                            borderRadius: '999px',
                                            cursor: 'pointer',
                                            border: `1px solid ${activePosition.status === 'Open' ? 'var(--score-high-border)' : activePosition.status === 'Draft' ? 'rgba(217, 119, 6, 0.4)' : 'rgba(220, 38, 38, 0.4)'}`,
                                            background: activePosition.status === 'Open' ? 'var(--score-high-bg)' : activePosition.status === 'Draft' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                                            color: activePosition.status === 'Open' ? '#059669' : activePosition.status === 'Draft' ? '#d97706' : '#dc2626',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                    <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                                        {activePosition.title}
                                    </h2>
                                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                                        {activePosition.location}
                                    </span>
                                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', color: '#059669', fontWeight: 600 }}>
                                        {activePosition.salaryRange}
                                    </span>
                                    <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                                        {activePosition.experienceRequired}
                                    </span>
                                </div>

                                {/* Action Buttons: View JD + Load Demo + Upload Batch */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        onClick={() => setShowJdDetailsModal(true)}
                                        style={{
                                            background: 'var(--bg-subtle)',
                                            border: '1px solid var(--border-default)',
                                            padding: '5px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <FileText size={12} style={{ color: '#059669' }} /> View Full JD
                                    </button>

                                    <button
                                        onClick={handleLoadDemoDataset}
                                        style={{
                                            border: 'none',
                                            background: '#4f46e5',
                                            color: '#ffffff',
                                            padding: '5px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)'
                                        }}
                                    >
                                        <Database size={12} /> Load Demo Dataset
                                    </button>

                                    <button
                                        onClick={() => setShowUploadModal(true)}
                                        style={{
                                            border: 'none',
                                            background: '#059669',
                                            color: '#ffffff',
                                            padding: '5px 12px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                                        }}
                                    >
                                        <UploadCloud size={12} /> Upload Batch Resumes
                                    </button>
                                </div>
                            </div>

                            {/* Row 2: Search Bar + Selection / Sort / Filter Controls */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: '10px',
                                gap: '10px',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                                    <Search size={13} style={{ position: 'absolute', left: '10px', top: '8px', color: 'var(--text-tertiary)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search candidate by name, specific skill (e.g. React, Docker), or location..."
                                        value={candidateSearch}
                                        onChange={(e) => setCandidateSearch(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '6px 10px 6px 30px',
                                            fontSize: '11px',
                                            border: '1px solid var(--border-default)',
                                            borderRadius: '6px',
                                            outline: 'none',
                                            background: 'var(--bg-subtle)',
                                            color: 'var(--text-primary)'
                                        }}
                                    />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>
                                        <input
                                            type="checkbox"
                                            checked={filteredCandidates.length > 0 && selectedCandidateIds.size === filteredCandidates.length}
                                            onChange={handleSelectAll}
                                            style={{ cursor: 'pointer', accentColor: '#059669' }}
                                        />
                                        Select All
                                    </label>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Sort:</span>
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            style={{
                                                background: 'var(--bg-subtle)',
                                                border: '1px solid var(--border-default)',
                                                borderRadius: '4px',
                                                padding: '3px 6px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="score">Highest Match Score</option>
                                            <option value="exp">Experience (Years)</option>
                                            <option value="skills">Skills Matched Count</option>
                                            <option value="name">Alphabetical</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        style={{
                                            border: '1px solid var(--border-default)',
                                            background: showFilters ? '#059669' : 'var(--card-bg)',
                                            color: showFilters ? '#ffffff' : 'var(--text-primary)',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <Filter size={11} /> Filters
                                    </button>

                                    <button
                                        onClick={handleExportCsv}
                                        disabled={filteredCandidates.length === 0}
                                        style={{
                                            border: '1px solid var(--border-default)',
                                            background: 'var(--card-bg)',
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 500,
                                            cursor: filteredCandidates.length === 0 ? 'not-allowed' : 'pointer',
                                            color: 'var(--text-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            opacity: filteredCandidates.length === 0 ? 0.5 : 1
                                        }}
                                    >
                                        <Download size={11} /> Export CSV
                                    </button>

                                    {selectedCandidateIds.size > 0 && (
                                        <button
                                            onClick={() => {
                                                if (showToast) showToast(`Invited ${selectedCandidateIds.size} candidates to Technical Interview!`);
                                                setSelectedCandidateIds(new Set());
                                            }}
                                            style={{
                                                background: 'var(--score-high)',
                                                color: '#ffffff',
                                                border: 'none',
                                                padding: '3px 10px',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Bulk Invite ({selectedCandidateIds.size})
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Slim 1-Line Evaluation Summary (Adjustable <50% auto-reject, HR decides offer) */}
                            {evaluatedCandidates.length > 0 && (() => {
                                const minPass = settings?.minPassingScore || 50;
                                const offersCount = evaluatedCandidates.filter(c => (candidateStages[c.candidate_id] || (c.overall_score < minPass ? 'Reject' : 'Screen')) === 'Offer').length;
                                const qualifiedCount = evaluatedCandidates.filter(c => c.overall_score >= minPass).length;
                                const rejectedCount = evaluatedCandidates.filter(c => c.overall_score < minPass).length;

                                return (
                                    <div style={{
                                        marginTop: '8px',
                                        padding: '5px 12px',
                                        borderRadius: '6px',
                                        background: 'var(--bg-subtle)',
                                        border: '1px solid var(--border-default)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '8px',
                                        fontSize: '11px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{evaluatedCandidates.length} Evaluated</span>
                                            <span>•</span>
                                            <span>Opening: <strong style={{ color: '#059669' }}>{activePosition.title}</strong></span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: '999px',
                                                background: 'var(--score-high-bg)',
                                                color: '#059669',
                                                border: '1px solid var(--score-high-border)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669' }} />
                                                {offersCount} Offers Extended
                                            </span>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: '999px',
                                                background: 'rgba(37, 99, 235, 0.1)',
                                                color: '#2563eb',
                                                border: '1px solid rgba(37, 99, 235, 0.3)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }} />
                                                {qualifiedCount} Qualified (&ge;{minPass}%)
                                            </span>
                                            <span style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                padding: '2px 8px',
                                                borderRadius: '999px',
                                                background: 'rgba(220, 38, 38, 0.08)',
                                                color: '#dc2626',
                                                border: '1px solid rgba(220, 38, 38, 0.25)',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626' }} />
                                                {rejectedCount} Auto-Reject (&lt;{minPass}%)
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Filter Tray */}
                            {showFilters && (
                                <div style={{
                                    marginTop: '10px',
                                    padding: '12px 16px',
                                    background: 'var(--bg-subtle)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-default)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '16px',
                                    fontSize: '11px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>Min Score:</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="90"
                                            step="5"
                                            value={minScoreFilter}
                                            onChange={(e) => setMinScoreFilter(Number(e.target.value))}
                                            style={{ accentColor: '#059669', cursor: 'pointer' }}
                                        />
                                        <strong>{minScoreFilter}%</strong>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>Min Experience:</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="8"
                                            step="1"
                                            value={minExpFilter}
                                            onChange={(e) => setMinExpFilter(Number(e.target.value))}
                                            style={{ accentColor: '#059669', cursor: 'pointer' }}
                                        />
                                        <strong>{minExpFilter} yrs</strong>
                                    </div>

                                    <button
                                        onClick={() => { setMinScoreFilter(0); setMinExpFilter(0); }}
                                        style={{ background: 'transparent', border: 'none', color: '#059669', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Candidate Ranking List Body - RICH CARDS WITH HIGHLIGHTS */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
                            {isAnalyzing ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '320px', gap: '12px' }}>
                                    <RefreshCw size={26} style={{ animation: 'spin 1s linear infinite', color: '#059669' }} />
                                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Evaluating Resumes with Semantic AI Matching...</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Comparing semantic context, mapping mandatory skills, and evaluating career duration.</div>
                                </div>
                            ) : errorMsg ? (
                                <div style={{ padding: '16px', borderRadius: '8px', background: 'var(--score-low-bg)', border: '1px solid var(--score-low-border)', color: 'var(--score-low)', fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <AlertCircle size={16} />
                                    <span>{errorMsg}</span>
                                </div>
                            ) : !results ? (
                                /* Clean Fresh Initial State (NO pre-filled data) */
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '340px',
                                    border: '2px dashed var(--border-default)',
                                    borderRadius: '10px',
                                    padding: '28px',
                                    textAlign: 'center',
                                    background: 'var(--card-bg)',
                                    boxShadow: 'var(--card-shadow)'
                                }}>
                                    <UploadCloud size={40} style={{ color: '#059669', marginBottom: '10px' }} />
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        No Candidates Evaluated Yet
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '420px', marginTop: '6px', lineHeight: 1.5 }}>
                                        Upload batch resumes (PDF, DOCX, TXT) to evaluate against <strong>{activePosition.title}</strong>, or load our synthetic 10-candidate test dataset.
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
                                        <button
                                            onClick={() => setShowUploadModal(true)}
                                            style={{
                                                background: '#059669',
                                                color: '#ffffff',
                                                border: 'none',
                                                padding: '8px 18px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)'
                                            }}
                                        >
                                            <UploadCloud size={14} /> Upload Resumes
                                        </button>
                                        <button
                                            onClick={handleLoadDemoDataset}
                                            style={{
                                                background: '#4f46e5',
                                                color: '#ffffff',
                                                border: 'none',
                                                padding: '8px 18px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)'
                                            }}
                                        >
                                            <Database size={14} /> Load Demo Dataset (10 Resumes)
                                        </button>
                                    </div>
                                </div>
                            ) : filteredCandidates.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                    No candidates match your search and filter criteria.
                                </div>
                            ) : (
                                filteredCandidates.map(cand => {
                                    const isSelected = selectedCandidate?.candidate_id === cand.candidate_id;
                                    const isChecked = selectedCandidateIds.has(cand.candidate_id);
                                    const rating5 = (cand.overall_score / 20).toFixed(1);

                                    const minPass = settings?.minPassingScore || 50;
                                    const stage = candidateStages[cand.candidate_id] || (
                                        cand.overall_score < minPass ? 'Reject' : 'Screen'
                                    );

                                    const initials = cand.name
                                        ? cand.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                                        : 'CD';

                                    return (
                                        <div
                                            key={cand.candidate_id}
                                            onClick={() => setSelectedCandidate(cand)}
                                            style={{
                                                background: isSelected ? (theme === 'dark' ? '#0d1117' : '#f0fdf4') : 'var(--card-bg)',
                                                border: isSelected ? '2px solid #059669' : '1px solid var(--border-default)',
                                                borderRadius: '8px',
                                                padding: '12px 16px',
                                                marginBottom: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px',
                                                boxShadow: isSelected ? '0 4px 12px rgba(5, 150, 105, 0.14)' : 'var(--card-shadow)',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {/* Line 1: Checkbox, Avatar, Name, Email, Score Pill, Stage Dropdown, Invite */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={(e) => handleToggleCandidate(cand.candidate_id, e)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ cursor: 'pointer', accentColor: '#059669', flexShrink: 0 }}
                                                    />

                                                    <div style={{
                                                        width: '30px',
                                                        height: '30px',
                                                        borderRadius: '6px',
                                                        background: cand.overall_score >= 80 ? 'rgba(5, 150, 105, 0.15)' : cand.overall_score >= 60 ? 'rgba(37, 99, 235, 0.15)' : 'rgba(220, 38, 38, 0.15)',
                                                        color: cand.overall_score >= 80 ? '#059669' : cand.overall_score >= 60 ? '#2563eb' : '#dc2626',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        flexShrink: 0
                                                    }}>
                                                        {initials}
                                                    </div>

                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                                {cand.name}
                                                            </span>
                                                            <span style={{
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                color: cand.overall_score >= 80 ? 'var(--score-high)' : cand.overall_score >= 60 ? 'var(--score-mid)' : 'var(--score-low)',
                                                                background: cand.overall_score >= 80 ? 'var(--score-high-bg)' : cand.overall_score >= 60 ? 'var(--score-mid-bg)' : 'var(--score-low-bg)',
                                                                border: `1px solid ${cand.overall_score >= 80 ? 'var(--score-high-border)' : cand.overall_score >= 60 ? 'var(--score-mid-border)' : 'var(--score-low-border)'}`,
                                                                padding: '1px 7px',
                                                                borderRadius: '999px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '3px'
                                                            }}>
                                                                {rating5} / 5.0 ({cand.match_percentage}%)
                                                            </span>
                                                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                                                {cand.badge}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Stage Dropdown + INVITE Button */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                                    <select
                                                        value={stage}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            handleSetStage(cand.candidate_id, e.target.value);
                                                        }}
                                                        style={{
                                                            fontSize: '11px',
                                                            fontWeight: 700,
                                                            padding: '3px 8px',
                                                            borderRadius: '999px',
                                                            background: stage === 'Offer' ? 'var(--score-high-bg)' : stage === 'Interview' ? 'rgba(37, 99, 235, 0.12)' : stage === 'Reject' ? 'rgba(220, 38, 38, 0.12)' : 'var(--bg-subtle)',
                                                            color: stage === 'Offer' ? 'var(--score-high)' : stage === 'Interview' ? '#2563eb' : stage === 'Reject' ? '#dc2626' : 'var(--text-secondary)',
                                                            border: `1px solid ${stage === 'Offer' ? 'var(--score-high-border)' : stage === 'Interview' ? 'rgba(37, 99, 235, 0.3)' : stage === 'Reject' ? 'rgba(220, 38, 38, 0.3)' : 'var(--border-default)'}`,
                                                            cursor: 'pointer',
                                                            outline: 'none'
                                                        }}
                                                    >
                                                        <option value="Screen">Screen</option>
                                                        <option value="Interview">Interview</option>
                                                        <option value="Offer">Offer</option>
                                                        <option value="Reject">Reject</option>
                                                    </select>

                                                    <button
                                                        onClick={(e) => handleOpenInvite(cand, e)}
                                                        style={{
                                                            background: 'transparent',
                                                            border: '1px solid var(--border-default)',
                                                            padding: '3px 9px',
                                                            borderRadius: '6px',
                                                            fontSize: '11px',
                                                            fontWeight: 700,
                                                            color: 'var(--text-primary)',
                                                            cursor: 'pointer',
                                                            letterSpacing: '0.3px',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.borderColor = '#059669';
                                                            e.currentTarget.style.color = '#059669';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.borderColor = 'var(--border-default)';
                                                            e.currentTarget.style.color = 'var(--text-primary)';
                                                        }}
                                                    >
                                                        INVITE
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Line 2: CV Link • Email • Experience Tag • Top 3 Skills */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)', paddingLeft: '40px', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDownloadCv(cand); }}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        padding: 0,
                                                        color: '#059669',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        textDecoration: 'underline'
                                                    }}
                                                >
                                                    CV &darr;
                                                </button>
                                                <span>•</span>
                                                <span>{cand.email}</span>
                                                <span>•</span>
                                                <span style={{
                                                    fontSize: '10px',
                                                    fontWeight: 600,
                                                    padding: '1px 6px',
                                                    borderRadius: '4px',
                                                    background: cand.experience_years === 0 ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-subtle)',
                                                    color: cand.experience_years === 0 ? '#2563eb' : 'var(--text-primary)',
                                                    border: '1px solid var(--border-default)'
                                                }}>
                                                    {cand.experience_formatted} {cand.experience_status ? `(${cand.experience_status})` : ''}
                                                </span>
                                                {cand.matched_mandatory?.slice(0, 3).map((sk, i) => (
                                                    <span
                                                        key={`sk-${i}`}
                                                        style={{
                                                            fontSize: '10px',
                                                            fontWeight: 600,
                                                            padding: '1px 5px',
                                                            borderRadius: '4px',
                                                            background: 'var(--score-high-bg)',
                                                            color: 'var(--score-high)',
                                                            border: '1px solid var(--score-high-border)',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '2px'
                                                        }}
                                                    >
                                                        <Check size={9} strokeWidth={2.5} /> {sk}
                                                    </span>
                                                ))}
                                                {cand.matched_mandatory && cand.matched_mandatory.length > 3 && (
                                                    <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                                                        +{cand.matched_mandatory.length - 3}
                                                    </span>
                                                )}
                                                {cand.missing_mandatory && cand.missing_mandatory.length > 0 && (
                                                    <span
                                                        style={{
                                                            fontSize: '10px',
                                                            fontWeight: 500,
                                                            padding: '1px 5px',
                                                            borderRadius: '4px',
                                                            background: 'var(--score-low-bg)',
                                                            color: 'var(--score-low)',
                                                            border: '1px solid var(--score-low-border)',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '2px'
                                                        }}
                                                    >
                                                        <AlertCircle size={9} /> {cand.missing_mandatory.length} missing
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* ── COLUMN 4: Selected Candidate Drilldown (DEEP ACC-TO-JD EVALUATION PANEL) ── */}
                    {selectedCandidate && (
                        <div style={{
                            width: '380px',
                            display: 'flex',
                            flexDirection: 'column',
                            background: 'var(--bg-app)',
                            borderLeft: '1px solid var(--border-default)',
                            flexShrink: 0,
                            overflowY: 'auto',
                            padding: '16px',
                            gap: '14px'
                        }}>
                            {/* Card 1: Candidate Overview & Quick Contact Card */}
                            <div style={{
                                background: 'var(--card-bg)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: '10px',
                                    padding: '16px',
                                    boxShadow: 'var(--card-shadow)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            Candidate Profile
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button
                                                onClick={(e) => handleOpenInvite(selectedCandidate, e)}
                                                style={{
                                                    background: '#059669',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
                                                }}
                                            >
                                                <Calendar size={12} /> Invite
                                            </button>
                                            <button
                                                onClick={() => setSelectedCandidate(null)}
                                                title="Close profile panel to see wide candidate list"
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'var(--text-tertiary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '2px'
                                                }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
                                            {selectedCandidate.name}
                                        </h3>
                                        <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                                            Evaluating for: {activePosition.title}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '11px', flexWrap: 'wrap', color: 'var(--text-secondary)' }}>
                                            <span>{selectedCandidate.email}</span>
                                            {selectedCandidate.location && (
                                                <>
                                                    <span>•</span>
                                                    <span>{selectedCandidate.location}</span>
                                                </>
                                            )}
                                            {selectedCandidate.linkedin && (
                                                <>
                                                    <span>•</span>
                                                    <a
                                                        href={`https://${selectedCandidate.linkedin}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                                                    >
                                                        LinkedIn ↗
                                                    </a>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleDownloadCv(selectedCandidate)}
                                            style={{
                                                flex: 1,
                                                background: 'var(--bg-subtle)',
                                                border: '1px solid var(--border-default)',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }}
                                        >
                                            <Download size={13} style={{ color: '#059669' }} /> Download CV {selectedCandidate.filename ? `(${selectedCandidate.filename.split('.').pop().toUpperCase()})` : ''}
                                        </button>
                                        <button
                                            onClick={() => handleCopyText(selectedCandidate.email, 'Email')}
                                            style={{
                                                background: 'var(--bg-subtle)',
                                                border: '1px solid var(--border-default)',
                                                borderRadius: '6px',
                                                padding: '6px 10px',
                                                fontSize: '11px',
                                                color: 'var(--text-secondary)',
                                                cursor: 'pointer'
                                            }}
                                            title="Copy Candidate Email"
                                        >
                                            <Copy size={13} />
                                        </button>
                                    </div>
                                </div>

                                {/* Tabs for Column 4: JD Fit Analysis vs Full CV Text */}
                                <div style={{
                                    display: 'flex',
                                    borderBottom: '1px solid var(--border-default)',
                                    background: 'var(--card-bg)',
                                    borderRadius: '8px',
                                    padding: '4px',
                                    boxShadow: 'var(--card-shadow)'
                                }}>
                                    <button
                                        onClick={() => setCandidateDetailTab('match')}
                                        style={{
                                            flex: 1,
                                            padding: '6px 0',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: candidateDetailTab === 'match' ? '#059669' : 'transparent',
                                            color: candidateDetailTab === 'match' ? '#ffffff' : 'var(--text-secondary)',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        JD Match Evaluation
                                    </button>
                                    <button
                                        onClick={() => setCandidateDetailTab('resume')}
                                        style={{
                                            flex: 1,
                                            padding: '6px 0',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: candidateDetailTab === 'resume' ? '#059669' : 'transparent',
                                            color: candidateDetailTab === 'resume' ? '#ffffff' : 'var(--text-secondary)',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        Full Resume Text
                                    </button>
                                </div>

                                {candidateDetailTab === 'match' ? (
                                    <>
                                        {/* Card 2: Deep Multi-Factor Scoring Breakdown according to JD */}
                                        <div style={{
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--border-default)',
                                            borderRadius: '10px',
                                            padding: '16px',
                                            boxShadow: 'var(--card-shadow)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    ATS Scoring Breakdown (vs JD)
                                                </div>
                                                <span style={{
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    color: selectedCandidate.overall_score >= 80 ? 'var(--score-high)' : selectedCandidate.overall_score >= 60 ? 'var(--score-mid)' : 'var(--score-low)',
                                                    background: selectedCandidate.overall_score >= 80 ? 'var(--score-high-bg)' : selectedCandidate.overall_score >= 60 ? 'var(--score-mid-bg)' : 'var(--score-low-bg)',
                                                    border: `1px solid ${selectedCandidate.overall_score >= 80 ? 'var(--score-high-border)' : selectedCandidate.overall_score >= 60 ? 'var(--score-mid-border)' : 'var(--score-low-border)'}`,
                                                    padding: '3px 10px',
                                                    borderRadius: '999px'
                                                }}>
                                                    {(selectedCandidate.overall_score / 20).toFixed(1)} / 5.0 ({selectedCandidate.match_percentage}%)
                                                </span>
                                            </div>

                                            {/* Overall Progress Gauge */}
                                            <div style={{ width: '100%', height: '8px', background: 'var(--border-default)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${selectedCandidate.match_percentage}%`,
                                                    height: '100%',
                                                    background: selectedCandidate.overall_score >= 80 ? '#059669' : selectedCandidate.overall_score >= 60 ? '#d97706' : '#dc2626',
                                                    borderRadius: '4px',
                                                    transition: 'width 0.4s ease'
                                                }} />
                                            </div>

                                            {/* 4 Multi-Factor Evaluation Pillars */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                                {/* 1. Semantic Similarity */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>
                                                            <strong>1. Semantic Context Fit:</strong>
                                                        </span>
                                                        <strong style={{ color: '#2563eb' }}>
                                                            {selectedCandidate.score_breakdown?.semantic_score || 0}%
                                                        </strong>
                                                    </div>
                                                    <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${selectedCandidate.score_breakdown?.semantic_score || 0}%`, height: '100%', background: '#2563eb' }} />
                                                    </div>
                                                </div>

                                                {/* 2. Mandatory Skills Alignment */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>
                                                            <strong>2. Mandatory Skills Overlap (2x Weight):</strong>
                                                        </span>
                                                        <strong style={{ color: '#059669' }}>
                                                            {selectedCandidate.matched_mandatory?.length || 0} / {((selectedCandidate.matched_mandatory?.length || 0) + (selectedCandidate.missing_mandatory?.length || 0))} ({selectedCandidate.score_breakdown?.skill_score || 0}%)
                                                        </strong>
                                                    </div>
                                                    <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${selectedCandidate.score_breakdown?.skill_score || 0}%`, height: '100%', background: '#059669' }} />
                                                    </div>
                                                </div>

                                                {/* 3. Experience Fit */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>
                                                            <strong>3. Experience Fit (vs {activePosition.experienceRequired}):</strong>
                                                        </span>
                                                        <strong style={{ color: '#d97706' }}>
                                                            {selectedCandidate.score_breakdown?.experience_score || 0}%
                                                        </strong>
                                                    </div>
                                                    <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${selectedCandidate.score_breakdown?.experience_score || 0}%`, height: '100%', background: '#d97706' }} />
                                                    </div>
                                                </div>

                                                {/* 4. Education Fit */}
                                                <div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>
                                                            <strong>4. Education & Degree Alignment:</strong>
                                                        </span>
                                                        <strong style={{ color: '#7c3aed' }}>
                                                            {selectedCandidate.score_breakdown?.education_score || 0}%
                                                        </strong>
                                                    </div>
                                                    <div style={{ width: '100%', height: '4px', background: 'var(--border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${selectedCandidate.score_breakdown?.education_score || 0}%`, height: '100%', background: '#7c3aed' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 3: Deep JD Requirements vs Candidate Reality Matrix */}
                                        <div style={{
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--border-default)',
                                            borderRadius: '10px',
                                            padding: '16px',
                                            boxShadow: 'var(--card-shadow)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px'
                                        }}>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                JD Requirements vs Candidate Gap Matrix
                                            </div>

                                            {/* Section A: Core Mandatory Skills (Hard Requirements) */}
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Mandatory Requirements:</span>
                                                    <span style={{ color: '#059669' }}>
                                                        {selectedCandidate.matched_mandatory?.length || 0} Met • {selectedCandidate.missing_mandatory?.length || 0} Missing
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                    {selectedCandidate.matched_mandatory?.map((skill, i) => (
                                                        <span
                                                            key={`mand-${i}`}
                                                            style={{
                                                                background: 'var(--score-high-bg)',
                                                                color: 'var(--score-high)',
                                                                padding: '3px 8px',
                                                                borderRadius: '5px',
                                                                fontSize: '11px',
                                                                border: '1px solid var(--score-high-border)',
                                                                fontWeight: 600,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            <Check size={11} strokeWidth={2.5} /> {skill}
                                                        </span>
                                                    ))}

                                                    {selectedCandidate.missing_mandatory?.map((skill, i) => (
                                                        <span
                                                            key={`missing-${i}`}
                                                            title="JD Requires this skill, but not found in resume"
                                                            style={{
                                                                background: 'var(--score-low-bg)',
                                                                color: 'var(--score-low)',
                                                                padding: '3px 8px',
                                                                borderRadius: '5px',
                                                                fontSize: '11px',
                                                                border: '1px solid var(--score-low-border)',
                                                                fontWeight: 500,
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                        >
                                                            <AlertCircle size={11} /> missing: {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Section B: Bonus / Good-to-have Skills */}
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                                    Bonus Skills Match (Nice-to-Have):
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                    {selectedCandidate.matched_bonus?.length > 0 ? (
                                                        selectedCandidate.matched_bonus.map((skill, i) => (
                                                            <span
                                                                key={`bonus-${i}`}
                                                                style={{
                                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                                    color: 'var(--accent-blue)',
                                                                    padding: '3px 8px',
                                                                    borderRadius: '5px',
                                                                    fontSize: '11px',
                                                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                                                    fontWeight: 600,
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '3px'
                                                                }}
                                                            >
                                                                <span>+</span> {skill}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                                            No documented bonus skills found.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Section C: Experience Evaluation Check against JD */}
                                            <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                                    <span>Experience Alignment:</span>
                                                    <span style={{ color: selectedCandidate.experience_status?.includes('surplus') ? '#059669' : selectedCandidate.experience_status?.includes('below') ? '#dc2626' : 'var(--text-secondary)' }}>
                                                        {selectedCandidate.experience_status || 'Fit'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                                    JD requires <strong>{activePosition.experienceRequired}</strong>. Candidate has <strong>{selectedCandidate.experience_formatted}</strong> of full-time career experience.
                                                </div>
                                            </div>

                                            {/* Section D: Education & Degree Verification */}
                                            <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                                    <span>Education Alignment:</span>
                                                    <span style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                        <Check size={11} strokeWidth={2.5} /> Degree Verified
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                                    Required: <strong>{activePosition.educationRequired}</strong>. Candidate holds documented university degree.
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card 4: AI Recruiter Evaluation & Probing Questions */}
                                        <div style={{
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--border-default)',
                                            borderRadius: '10px',
                                            padding: '16px',
                                            boxShadow: 'var(--card-shadow)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px'
                                        }}>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Zap size={13} style={{ color: '#d97706' }} /> AI Recruiter Summary & Interview Probing
                                            </div>

                                            {/* Decision Reasons */}
                                            <div style={{
                                                fontSize: '11px',
                                                color: 'var(--text-secondary)',
                                                lineHeight: 1.5,
                                                background: 'rgba(5, 150, 105, 0.06)',
                                                border: '1px solid rgba(5, 150, 105, 0.2)',
                                                borderRadius: '6px',
                                                padding: '10px'
                                            }}>
                                                <div style={{ fontWeight: 700, color: '#059669', marginBottom: '4px' }}>
                                                    AI Assessment for {activePosition.title}:
                                                </div>
                                                {selectedCandidate.reasons?.map((reason, idx) => (
                                                    <div key={idx} style={{ marginBottom: '4px' }}>
                                                        • {reason}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Card 5: Pipeline Progression & Team Collaboration Notes */}
                                        <div style={{
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--border-default)',
                                            borderRadius: '10px',
                                            padding: '16px',
                                            boxShadow: 'var(--card-shadow)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '12px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    Recruitment Pipeline Stage
                                                </div>
                                                <select
                                                    value={candidateStages[selectedCandidate.candidate_id] || (selectedCandidate.overall_score < (settings?.minPassingScore || 50) ? 'Reject' : 'Screen')}
                                                    onChange={(e) => handleSetStage(selectedCandidate.candidate_id, e.target.value)}
                                                    style={{
                                                        fontSize: '11px',
                                                        fontWeight: 700,
                                                        padding: '3px 8px',
                                                        borderRadius: '6px',
                                                        border: '1px solid var(--border-default)',
                                                        background: 'var(--bg-subtle)',
                                                        color: 'var(--text-primary)',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="Screen">Screen</option>
                                                    <option value="Interview">Interview</option>
                                                    <option value="Offer">Offer</option>
                                                    <option value="Reject">Reject</option>
                                                </select>
                                            </div>

                                            {/* Stage Stepper Buttons */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(4, 1fr)',
                                                gap: '6px',
                                                background: 'var(--bg-subtle)',
                                                padding: '6px',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border-default)'
                                            }}>
                                                {[
                                                    { name: 'Screen', activeBg: '#64748b', activeBorder: '#475569' },
                                                    { name: 'Interview', activeBg: '#2563eb', activeBorder: '#1d4ed8' },
                                                    { name: 'Offer', activeBg: '#059669', activeBorder: '#047857' },
                                                    { name: 'Reject', activeBg: '#dc2626', activeBorder: '#b91c1c' }
                                                ].map(stg => {
                                                    const minPass = settings?.minPassingScore || 50;
                                                    const current = candidateStages[selectedCandidate.candidate_id] || (selectedCandidate.overall_score < minPass ? 'Reject' : 'Screen');
                                                    const isActive = current === stg.name;
                                                    return (
                                                        <button
                                                            key={stg.name}
                                                            onClick={() => handleSetStage(selectedCandidate.candidate_id, stg.name)}
                                                            style={{
                                                                padding: '6px 0',
                                                                borderRadius: '6px',
                                                                fontSize: '11px',
                                                                fontWeight: 700,
                                                                background: isActive ? stg.activeBg : 'transparent',
                                                                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                                                                border: isActive ? `1px solid ${stg.activeBorder}` : '1px solid transparent',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '3px',
                                                                boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                                                                transition: 'all 0.15s ease'
                                                            }}
                                                        >
                                                            {isActive && <Check size={10} strokeWidth={3} />}
                                                            {stg.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Team Notes List */}
                                            <div>
                                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                                    Internal Team Notes & Feedback:
                                                </div>
                                                {(candidateNotes[selectedCandidate.candidate_id] || []).length > 0 ? (
                                                    (candidateNotes[selectedCandidate.candidate_id] || []).map((n, idx) => (
                                                        <div key={idx} style={{ fontSize: '11px', padding: '6px 8px', background: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{n.author}: </span>
                                                            <span style={{ color: 'var(--text-secondary)' }}>{n.text}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic', marginBottom: '6px' }}>
                                                        No notes added yet for this candidate.
                                                    </div>
                                                )}
                                            </div>

                                            {/* Comment Input */}
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Add candidate feedback (visible to hiring team)..."
                                                    value={noteInputText}
                                                    onChange={(e) => setNoteInputText(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                                                    style={{
                                                        flex: 1,
                                                        border: '1px solid var(--border-default)',
                                                        borderRadius: '6px',
                                                        padding: '7px 10px',
                                                        fontSize: '11px',
                                                        outline: 'none',
                                                        background: 'var(--bg-subtle)',
                                                        color: 'var(--text-primary)'
                                                    }}
                                                />
                                                <button
                                                    onClick={handleAddNote}
                                                    style={{
                                                        background: '#059669',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        padding: '6px 14px',
                                                        borderRadius: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Post
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    /* TAB 2: Full Resume Text Viewer */
                                    <div style={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: '10px',
                                        padding: '16px',
                                        boxShadow: 'var(--card-shadow)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                Parsed CV Content: {selectedCandidate.name}
                                            </div>
                                            <button
                                                onClick={() => handleCopyText(selectedCandidate.raw_text || selectedCandidate.summary || '', 'Resume text')}
                                                style={{
                                                    background: 'transparent',
                                                    border: '1px solid var(--border-default)',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '10px',
                                                    cursor: 'pointer',
                                                    color: 'var(--text-secondary)'
                                                }}
                                            >
                                                Copy Text
                                            </button>
                                        </div>

                                        <div style={{
                                            maxHeight: '520px',
                                            overflowY: 'auto',
                                            background: 'var(--bg-subtle)',
                                            padding: '12px',
                                            borderRadius: '6px',
                                            border: '1px solid var(--border-subtle)',
                                            fontFamily: 'monospace',
                                            fontSize: '11px',
                                            lineHeight: 1.6,
                                            whiteSpace: 'pre-wrap',
                                            color: 'var(--text-primary)'
                                        }}>
                                            {selectedCandidate.raw_text || selectedCandidate.summary || 'No text extracted.'}
                                        </div>
                                    </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ── Modal: Full Job Description Requirements Drawer ── */}
            {showJdDetailsModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '10px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '650px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-tertiary)' }}>
                                    {activePosition.jobId}
                                </span>
                                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                                    {activePosition.title}
                                </h3>
                            </div>
                            <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowJdDetailsModal(false)} />
                        </div>

                        {/* Overview Spec Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                            <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-default)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Department & Location:</div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                                    {activePosition.department} • {activePosition.location}
                                </div>
                            </div>
                            <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-default)' }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>Required Experience:</div>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#059669', marginTop: '2px' }}>
                                    {activePosition.experienceRequired} ({activePosition.workType})
                                </div>
                            </div>
                        </div>

                        {/* Full JD Text */}
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                                Job Description Text:
                            </div>
                            <div style={{
                                background: 'var(--bg-subtle)',
                                padding: '14px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-subtle)',
                                fontSize: '11px',
                                lineHeight: 1.6,
                                whiteSpace: 'pre-wrap',
                                color: 'var(--text-secondary)',
                                maxHeight: '300px',
                                overflowY: 'auto'
                            }}>
                                {activePosition.description}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button
                                onClick={() => setShowJdDetailsModal(false)}
                                style={{
                                    background: '#059669',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '7px 18px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Close JD View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Interview Invitation ── */}
            {showInviteModal && inviteCandidate && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '10px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '460px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                Schedule Interview: {inviteCandidate.name}
                            </h3>
                            <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowInviteModal(false)} />
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Target Position: <strong style={{ color: 'var(--text-primary)' }}>{activePosition.title}</strong>
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>
                                Interview Format
                            </label>
                            <select
                                value={interviewType}
                                onChange={(e) => setInterviewType(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '12px' }}
                            >
                                <option value="Technical Interview">Technical Interview (1 hr - Live Coding & AI Architecture)</option>
                                <option value="Hiring Manager Screen">Hiring Manager Screen (30 mins)</option>
                                <option value="Cultural Alignment">Cultural Alignment & Leadership (45 mins)</option>
                                <option value="Final Offer Discussion">Final Offer Discussion</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                style={{ background: 'transparent', border: '1px solid var(--border-default)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleSetStage(inviteCandidate.candidate_id, 'Interview');
                                    setShowInviteModal(false);
                                    if (showToast) showToast(`Invitation sent to ${inviteCandidate.email}!`);
                                }}
                                style={{
                                    background: '#059669',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                }}
                            >
                                Send Invitation
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Create New Position ── */}
            {showNewPositionModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '10px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '540px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                Create New Job Requisition
                            </h3>
                            <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowNewPositionModal(false)} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                                        Job ID / Requisition #
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. REQ-106"
                                        value={newPosJobId}
                                        onChange={(e) => setNewPosJobId(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '12px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                                        Initial Status
                                    </label>
                                    <select
                                        value={newPosStatus}
                                        onChange={(e) => setNewPosStatus(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '12px' }}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                                    Job Title *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Lead Full Stack Engineer"
                                    value={newPosTitle}
                                    onChange={(e) => setNewPosTitle(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '12px' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Engineering"
                                        value={newPosDept}
                                        onChange={(e) => setNewPosDept(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '12px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                                        Experience Required
                                    </label>
                                    <select
                                        value={newPosExp}
                                        onChange={(e) => setNewPosExp(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '12px' }}
                                    >
                                        <option value="0 years (Fresher)">0 years (Fresher / Entry Level)</option>
                                        <option value="1-2 years">1-2 years (Junior)</option>
                                        <option value="2-4 years">2-4 years (Mid-Level)</option>
                                        <option value="3-5 years">3-5 years (Mid-Senior)</option>
                                        <option value="5+ years">5+ years (Senior / Lead)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                                    Job Description & Key Requirements
                                </label>
                                <textarea
                                    rows={5}
                                    placeholder="Paste full job description with must-have skills, experience years, and responsibilities..."
                                    value={newPosJd}
                                    onChange={(e) => setNewPosJd(e.target.value)}
                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', fontSize: '11px', resize: 'vertical' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                            <button
                                onClick={() => setShowNewPositionModal(false)}
                                style={{ background: 'transparent', border: '1px solid var(--border-default)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePosition}
                                disabled={!newPosTitle.trim()}
                                style={{
                                    background: '#059669',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: !newPosTitle.trim() ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Create Position
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Upload Batch Resumes ── */}
            {showUploadModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: '10px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '500px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                Batch Upload Resumes
                            </h3>
                            <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowUploadModal(false)} />
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Evaluating against: <strong style={{ color: 'var(--text-primary)' }}>{activePosition.title}</strong>
                        </div>

                        <div
                            onClick={() => resumeInputRef.current?.click()}
                            style={{
                                border: '2px dashed var(--border-default)',
                                borderRadius: '8px',
                                padding: '36px 20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: 'var(--bg-subtle)'
                            }}
                        >
                            <UploadCloud size={32} style={{ color: '#059669', marginBottom: '8px' }} />
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Click to browse or drop resume files here
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                Supports PDF, DOCX, and TXT (Batch upload 10+ resumes simultaneously)
                            </div>
                            <input
                                ref={resumeInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.docx,.txt"
                                onChange={(e) => {
                                    if (e.target.files) setResumeFiles(Array.from(e.target.files));
                                }}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {resumeFiles.length > 0 && (
                            <div style={{ marginTop: '12px', fontSize: '12px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={12} strokeWidth={2.5} /> {resumeFiles.length} resumes selected for processing
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                style={{ background: 'transparent', border: '1px solid var(--border-default)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    runBatchAnalysis(resumeFiles, activePosition.description);
                                }}
                                disabled={resumeFiles.length === 0}
                                style={{
                                    background: '#059669',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '6px 16px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: resumeFiles.length === 0 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Run AI Ranking ({resumeFiles.length})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
