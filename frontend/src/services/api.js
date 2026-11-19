import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:8000/api', timeout: 120000 });

export const uploadFile = (file) => {
    const fd = new FormData(); fd.append('file', file);
    return API.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export const deepAnalyze = (r, j) => API.post('/deep-analyze', { resume_text: r, job_text: j });
export const rewriteResume = (r, j) => API.post('/rewrite', { resume_text: r, job_text: j });
export const matchResume = (r, j) => API.post('/match', { resume_text: r, job_text: j });
export const extractSkills = (r) => API.post('/skills', { resume_text: r });
export const summarizeResume = (r) => API.post('/summarize', { resume_text: r });
export const bulletReview = (r) => API.post('/bullet-review', { resume_text: r });
export const semanticMatch = (r, j) => API.post('/semantic-match', { resume_text: r, job_text: j });
export const scoreCard = (r) => API.post('/score-card', { resume_text: r });
export const rolePredict = (r) => API.post('/role-predict', { resume_text: r });
export const coachChat = (r, m) => API.post('/coach', { resume_text: r, message: m });

export const downloadPdf = async (text) => {
    const res = await API.post('/generate-pdf', { text }, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    Object.assign(document.createElement('a'), { href: url, download: 'optimized_resume.pdf' }).click();
    URL.revokeObjectURL(url);
};

export default API;
