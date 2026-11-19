import { useState, useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import { Search, Sparkles, AlertTriangle, Upload, Brain, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import Expandable from '../components/Expandable';
import { extractSkills, uploadFile } from '../services/api';
import { SAMPLE_RESUME } from '../data/sampleData';
const CT = { 'Programming Languages': 'tag-blue', 'AI & Machine Learning': 'tag-purple', 'Web Development': 'tag-green', 'Database & Cloud': 'tag-amber', 'Data & BI Tools': 'tag-sky', 'Soft Skills': 'tag-green' };
export default function SkillsPage() {
    const { resumeText: t, setResumeText: setT } = useResume(); const [r, setR] = useState(null); const [l, setL] = useState(false); const [e, setE] = useState(''); const fRef = useRef();
    const up = async () => { const f = fRef.current?.files?.[0]; if (!f) return; try { setT((await uploadFile(f)).data.text); } catch (x) { setE(x.response?.data?.detail || 'Upload failed.'); } };
    const run = async () => { if (t.length < 20) { setE('Provide at least 20 characters.'); return; } setL(true); setE(''); setR(null); try { setR((await extractSkills(t)).data); } catch (x) { setE(x.response?.data?.detail || 'Failed.'); } finally { setL(false); } };
    return (
        <div className="page">
            <h1 className="pg-title">Skill Extractor</h1>
            <p className="pg-desc">Detect and categorize skills across 6 categories using dictionary-driven regex matching.</p>
            <div className="btn-row"><button className="btn btn-ghost" onClick={() => setT(SAMPLE_RESUME)}><Sparkles size={13} /> Sample</button></div>
            <div className="input-grid input-full"><div>
                <div className="field-lbl"><span>Resume</span><button className="upload-btn" onClick={() => fRef.current?.click()}><Upload size={10} /> Upload</button><input type="file" ref={fRef} accept=".pdf,.docx,.doc,.txt" hidden onChange={up} /></div>
                <textarea value={t} onChange={v => setT(v.target.value)} placeholder="Paste or upload resume..." />
            </div></div>
            <div className="btn-row"><button className="btn btn-primary" onClick={run} disabled={l}><Search size={14} /> {l ? 'Extracting...' : 'Extract Skills'}</button></div>
            {e && <div className="alrt alrt-err"><AlertTriangle size={15} /> {e}</div>}
            {l && <div className="ld"><div className="spin" /><span className="ld-msg">Scanning...</span></div>}
            {r && (<div className="res">
                <div className="mets">
                    <div className="met"><div className="met-n" style={{ color: 'var(--accent)' }}>{r.total_skills}</div><div className="met-l">Total</div></div>
                    <div className="met"><div className="met-n" style={{ color: 'var(--green)' }}>{r.strong_categories.length}</div><div className="met-l">Strong</div></div>
                    <div className="met"><div className="met-n" style={{ color: 'var(--red)' }}>{r.missing_categories.length}</div><div className="met-l">Missing</div></div>
                    <div className="met"><div className="met-n" style={{ color: 'var(--purple)' }}>{Object.keys(r.skills_by_category).length}</div><div className="met-l">Categories</div></div>
                </div>
                {Object.entries(r.skills_by_category).map(([c, s]) => <Expandable key={c} title={`${c} (${s.length})`} icon={<Brain size={13} />} defaultOpen><div className="tags">{s.map(x => <span key={x} className={`tag ${CT[c] || 'tag-blue'}`}>{x}</span>)}</div></Expandable>)}
                {r.strong_categories.length > 0 && <Expandable title="Strong Categories" icon={<CheckCircle size={13} />}><div className="tags">{r.strong_categories.map(c => <span key={c} className="tag tag-green">{c}</span>)}</div></Expandable>}
                {r.missing_categories.length > 0 && <Expandable title="Missing Categories" icon={<XCircle size={13} />}><div className="tags">{r.missing_categories.map(c => <span key={c} className="tag tag-red">{c}</span>)}</div></Expandable>}
                {r.suggested_skills.length > 0 && <div className="card"><div className="card-hd"><Lightbulb size={15} /> Suggested Skills</div><div className="tags">{r.suggested_skills.map(s => <span key={s} className="tag tag-amber">{s}</span>)}</div></div>}
            </div>)}
        </div>
    );
}
