import { useState, useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import { Search, Sparkles, AlertTriangle, Upload, FileText } from 'lucide-react';
import { summarizeResume, uploadFile } from '../services/api';
import { SAMPLE_RESUME } from '../data/sampleData';
export default function SummarizerPage() {
    const { resumeText: t, setResumeText: setT } = useResume(); const [r, setR] = useState(null); const [l, setL] = useState(false); const [e, setE] = useState(''); const fRef = useRef();
    const up = async () => { const f = fRef.current?.files?.[0]; if (!f) return; try { setT((await uploadFile(f)).data.text); } catch (x) { setE('Upload failed.'); } };
    const run = async () => { if (t.length < 50) { setE('Provide at least 50 characters.'); return; } setL(true); setE(''); setR(null); try { setR((await summarizeResume(t)).data); } catch (x) { setE(x.response?.data?.detail || 'Failed.'); } finally { setL(false); } };
    return (
        <div className="page">
            <h1 className="pg-title">Resume Summarizer</h1>
            <p className="pg-desc">Extractive TF-IDF sentence scoring. Top sentences are selected and reordered.</p>
            <div className="btn-row"><button className="btn btn-ghost" onClick={() => setT(SAMPLE_RESUME)}><Sparkles size={13} /> Sample</button></div>
            <div className="input-grid input-full"><div>
                <div className="field-lbl"><span>Resume</span><button className="upload-btn" onClick={() => fRef.current?.click()}><Upload size={10} /> Upload</button><input type="file" ref={fRef} accept=".pdf,.docx,.doc,.txt" hidden onChange={up} /></div>
                <textarea value={t} onChange={v => setT(v.target.value)} placeholder="Paste or upload resume..." style={{ minHeight: 220 }} />
            </div></div>
            <div className="btn-row"><button className="btn btn-primary" onClick={run} disabled={l}><Search size={14} /> {l ? 'Summarizing...' : 'Generate Summary'}</button></div>
            {e && <div className="alrt alrt-err"><AlertTriangle size={15} /> {e}</div>}
            {l && <div className="ld"><div className="spin" /><span className="ld-msg">Scoring sentences...</span></div>}
            {r && (<div className="res">
                <div className="mets">
                    <div className="met"><div className="met-n" style={{ color: 'var(--accent)' }}>{r.original_word_count}</div><div className="met-l">Original</div></div>
                    <div className="met"><div className="met-n" style={{ color: 'var(--green)' }}>{r.summary_word_count}</div><div className="met-l">Summary</div></div>
                    <div className="met"><div className="met-n" style={{ color: 'var(--purple)' }}>{r.compression_ratio}%</div><div className="met-l">Compression</div></div>
                    <div className="met"><div className="met-n" style={{ color: 'var(--amber)' }}>{r.selected_sentence_count}</div><div className="met-l">Sentences</div></div>
                </div>
                <div className="card"><div className="card-hd"><FileText size={15} /> Summary</div><div className="sum-box">{r.summary}</div></div>
            </div>)}
        </div>
    );
}
