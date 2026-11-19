import { useState, useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import { Search, Sparkles, AlertTriangle, Upload, Network, ArrowRight } from 'lucide-react';
import { semanticMatch, uploadFile } from '../services/api';
import { SAMPLE_RESUME, SAMPLE_JOB_DESCRIPTION } from '../data/sampleData';

export default function SemanticMatcherPage() {
    const { resumeText: resume, setResumeText: setResume } = useResume();
    const [jd, setJd] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const rRef = useRef(), jRef = useRef();

    const upload = async (r, s) => { const f = r.current?.files?.[0]; if (!f) return; try { s((await uploadFile(f)).data.text); } catch (e) { setError('Upload failed.'); } };

    const run = async () => {
        if (resume.length < 20 || jd.length < 20) { setError('Both fields need at least 20 characters.'); return; }
        setLoading(true); setError(''); setResult(null);
        try { setResult((await semanticMatch(resume, jd)).data); }
        catch (e) { setError(e.response?.data?.detail || 'Analysis failed. Model may be loading.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="page">
            <h1 className="pg-title">Semantic Matcher</h1>
            <p className="pg-desc">Advanced semantic AI matching. Recognizes synonyms, context, and intent (e.g. "JavaScript" from "JS", "Machine Learning" from "ML").</p>

            <div className="btn-row">
                <button className="btn btn-ghost" onClick={() => setResume(SAMPLE_RESUME)}><Sparkles size={13} /> Sample Resume</button>
                <button className="btn btn-ghost" onClick={() => setJd(SAMPLE_JOB_DESCRIPTION)}><Sparkles size={13} /> Sample JD</button>
            </div>

            <div className="input-grid">
                <div>
                    <div className="field-lbl"><span>Resume</span><button className="upload-btn" onClick={() => rRef.current?.click()}><Upload size={10} /> Upload</button><input type="file" ref={rRef} accept=".pdf,.docx,.doc,.txt" hidden onChange={() => upload(rRef, setResume)} /></div>
                    <textarea value={resume} onChange={e => setResume(e.target.value)} placeholder="Paste or upload resume..." />
                </div>
                <div>
                    <div className="field-lbl"><span>Job Description</span><button className="upload-btn" onClick={() => jRef.current?.click()}><Upload size={10} /> Upload</button><input type="file" ref={jRef} accept=".pdf,.docx,.doc,.txt" hidden onChange={() => upload(jRef, setJd)} /></div>
                    <textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste or upload JD..." />
                </div>
            </div>

            <div className="btn-row"><button className="btn btn-primary" onClick={run} disabled={loading}><Network size={14} /> {loading ? 'Matching...' : 'Semantic Match'}</button></div>

            {error && <div className="alrt alrt-err"><AlertTriangle size={15} /> {error}</div>}
            {loading && <div className="ld"><div className="spin" /><span className="ld-msg">Computing Semantic AI embeddings...</span></div>}

            {result && (
                <div className="res">
                    <div className="mets">
                        <div className="met"><div className="met-n" style={{ color: 'var(--accent)' }}>{result.jd_skills_total}</div><div className="met-l">JD Skills</div></div>
                        <div className="met"><div className="met-n" style={{ color: 'var(--green)' }}>{result.exact_match_count}</div><div className="met-l">Exact Match</div></div>
                        <div className="met"><div className="met-n" style={{ color: 'var(--sky)' }}>{result.semantic_match_count}</div><div className="met-l">Semantic Match</div></div>
                        <div className="met"><div className="met-n" style={{ color: 'var(--amber)' }}>+{result.semantic_only_count}</div><div className="met-l">Extra Found</div></div>
                    </div>

                    <div className="card" style={{ textAlign: 'center', marginBottom: 12 }}>
                        <p style={{ fontSize: '.88rem', color: 'var(--t1)' }}>Semantic matching found <strong style={{ color: 'var(--sky)' }}>{result.semantic_only_count}</strong> more skills than keyword-only matching</p>
                        <p style={{ fontSize: '.78rem', color: 'var(--t3)', marginTop: 4 }}>Exact: {result.exact_score}% | Semantic: {result.semantic_score}%</p>
                    </div>

                    <div className="cmp-cols">
                        <div className="cmp-col">
                            <h4>Exact Matches ({result.exact_match_count})</h4>
                            <div className="tags">{result.exact_matches.map(s => <span key={s} className="tag tag-green">{s}</span>)}{result.exact_match_count === 0 && <span style={{ color: 'var(--t3)', fontSize: '.78rem' }}>None found</span>}</div>
                        </div>
                        <div className="cmp-col">
                            <h4>Semantic-Only ({result.semantic_only_count})</h4>
                            <div className="tags">{result.semantic_only.map(s => <span key={s} className="tag tag-sky">{s}</span>)}{result.semantic_only_count === 0 && <span style={{ color: 'var(--t3)', fontSize: '.78rem' }}>None extra</span>}</div>
                        </div>
                    </div>

                    {result.semantic_details.length > 0 && (
                        <div className="card">
                            <div className="card-hd"><Network size={15} /> Semantic Match Details</div>
                            {result.semantic_details.map((d, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < result.semantic_details.length - 1 ? '1px solid var(--bdr)' : 'none', fontSize: '.82rem' }}>
                                    <span style={{ color: 'var(--t2)', flex: 1 }}>{d.jd_skill}</span>
                                    <ArrowRight size={12} color="var(--t3)" />
                                    <span style={{ color: 'var(--sky)', flex: 1 }}>{d.resume_match}</span>
                                    <span className="tag tag-sky">{d.similarity}%</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {result.missed_by_both.length > 0 && (
                        <div className="card">
                            <div className="card-hd"><AlertTriangle size={15} color="var(--red)" /> Missed by Both</div>
                            <div className="tags">{result.missed_by_both.map(s => <span key={s} className="tag tag-red">{s}</span>)}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
