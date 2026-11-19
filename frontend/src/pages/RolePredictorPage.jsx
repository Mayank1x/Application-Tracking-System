import { useState, useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import { Search, Sparkles, AlertTriangle, Upload, Target, CheckCircle, XCircle } from 'lucide-react';
import Expandable from '../components/Expandable';
import { rolePredict, uploadFile } from '../services/api';
import { SAMPLE_RESUME } from '../data/sampleData';

const sColor = v => v >= 60 ? 'var(--green)' : v >= 35 ? 'var(--accent)' : v >= 20 ? 'var(--amber)' : 'var(--red)';

export default function RolePredictorPage() {
    const { resumeText: text, setResumeText: setText } = useResume();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fRef = useRef();

    const up = async () => { const f = fRef.current?.files?.[0]; if (!f) return; try { setText((await uploadFile(f)).data.text); } catch (e) { setError('Upload failed.'); } };

    const run = async () => {
        if (text.length < 20) { setError('Min 20 characters.'); return; }
        setLoading(true); setError(''); setResult(null);
        try { setResult((await rolePredict(text)).data); }
        catch (e) { setError(e.response?.data?.detail || 'Prediction failed.'); }
        finally { setLoading(false); }
    };

    const top = result?.predictions?.[0];

    return (
        <div className="page">
            <h1 className="pg-title">Role Predictor</h1>
            <p className="pg-desc">Predict your top 3 best-fit job roles based on skill alignment and TF-IDF text similarity across 10 career paths.</p>

            <div className="btn-row"><button className="btn btn-ghost" onClick={() => setText(SAMPLE_RESUME)}><Sparkles size={13} /> Sample</button></div>
            <div className="input-grid input-full"><div>
                <div className="field-lbl"><span>Resume</span><button className="upload-btn" onClick={() => fRef.current?.click()}><Upload size={10} /> Upload</button><input type="file" ref={fRef} accept=".pdf,.docx,.doc,.txt" hidden onChange={up} /></div>
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste or upload resume..." />
            </div></div>
            <div className="btn-row"><button className="btn btn-primary" onClick={run} disabled={loading}><Target size={14} /> {loading ? 'Predicting...' : 'Predict Roles'}</button></div>

            {error && <div className="alrt alrt-err"><AlertTriangle size={15} /> {error}</div>}
            {loading && <div className="ld"><div className="spin" /><span className="ld-msg">Matching skills to 10 role profiles...</span></div>}

            {result && (
                <div className="res">
                    {top && (
                        <div className="role-top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--accent-dim)', display: 'grid', placeItems: 'center' }}><Target size={18} color="var(--accent)" /></div>
                                <div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{top.role}</div>
                                    <div style={{ fontSize: '.78rem', color: 'var(--t3)' }}>Top predicted role</div>
                                </div>
                                <span className="pill pill-b" style={{ marginLeft: 'auto' }}>{top.combined_score}%</span>
                            </div>
                            <div style={{ fontSize: '.75rem', color: 'var(--t3)', marginBottom: 4 }}>Skills matched: {top.matched_count}/{top.total_skills} | Skill: {top.skill_score}% | TF-IDF: {top.tfidf_score}%</div>
                            <div style={{ marginBottom: 8 }}><div style={{ fontSize: '.68rem', color: 'var(--t3)', marginBottom: 3 }}>MATCHED</div><div className="tags">{top.matched_skills.map(s => <span key={s} className="tag tag-green">{s}</span>)}</div></div>
                            {top.missing_skills.length > 0 && <div><div style={{ fontSize: '.68rem', color: 'var(--t3)', marginBottom: 3 }}>ADD THESE SKILLS</div><div className="tags">{top.missing_skills.map(s => <span key={s} className="tag tag-red">{s}</span>)}</div></div>}
                        </div>
                    )}

                    {result.predictions.length > 1 && (
                        <div className="role-grid">
                            {result.predictions.slice(1).map((p, i) => (
                                <div key={i} className="role-sm">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontWeight: 700, fontSize: '.88rem' }}>{p.role}</span>
                                        <span className="tag tag-blue">{p.combined_score}%</span>
                                    </div>
                                    <div style={{ fontSize: '.72rem', color: 'var(--t3)' }}>{p.matched_count}/{p.total_skills} skills matched</div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="card">
                        <div className="card-hd"><Target size={15} /> All Roles</div>
                        {result.all_roles.map((r, i) => (
                            <div key={i} className="role-bar">
                                <span className="role-bar-name">{r.role}</span>
                                <div className="role-bar-track"><div className="role-bar-fill" style={{ width: `${r.combined_score}%`, background: sColor(r.combined_score) }} /></div>
                                <span className="role-bar-val" style={{ color: sColor(r.combined_score) }}>{r.combined_score}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
