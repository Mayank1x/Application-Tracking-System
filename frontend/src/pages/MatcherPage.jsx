import { useState, useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import { Search, Sparkles, AlertTriangle, Lightbulb, Download, Upload, CheckCircle, RefreshCw, Zap, ArrowRight } from 'lucide-react';
import ScoreGauge from '../components/ScoreGauge';
import ProgressBar from '../components/ProgressBar';
import Expandable from '../components/Expandable';
import { deepAnalyze, rewriteResume, uploadFile, downloadPdf } from '../services/api';
import { SAMPLE_RESUME, SAMPLE_JOB_DESCRIPTION } from '../data/sampleData';

const sColor = v => v >= 75 ? 'var(--green)' : v >= 50 ? 'var(--accent)' : v >= 35 ? 'var(--amber)' : 'var(--red)';
const recCls = r => /Strong|Ready/i.test(r) ? 'pill-g' : /Good|Friendly/i.test(r) ? 'pill-b' : /Partial|Needs/i.test(r) ? 'pill-a' : 'pill-r';

export default function MatcherPage() {
    const { resumeText: resume, setResumeText: setResume } = useResume();
    const [jd, setJd] = useState('');
    const [result, setResult] = useState(null);
    const [rw, setRw] = useState(null);
    const [loading, setLoading] = useState(false);
    const [rwLoading, setRwLoading] = useState(false);
    const [error, setError] = useState('');
    const rRef = useRef(), jRef = useRef();

    const upload = async (r, s) => { const f = r.current?.files?.[0]; if (!f) return; try { s((await uploadFile(f)).data.text); } catch (e) { setError(e.response?.data?.detail || 'Upload failed.'); } };

    const analyze = async () => {
        if (resume.length < 20 || jd.length < 20) { setError('Both fields need at least 20 characters.'); return; }
        setLoading(true); setError(''); setResult(null); setRw(null);
        try { setResult((await deepAnalyze(resume, jd)).data); } catch (e) { setError(e.response?.data?.detail || 'Analysis failed.'); } finally { setLoading(false); }
    };

    const rewrite = async () => {
        setRwLoading(true); setError('');
        try { setRw((await rewriteResume(resume, jd)).data); } catch (e) { setError(e.response?.data?.detail || 'Rewrite failed.'); } finally { setRwLoading(false); }
    };

    const ga = result?.gemini_analysis, gc = result?.gemini_changes;

    return (
        <div className="page">
            <h1 className="pg-title">Resume Matcher</h1>
            <p className="pg-desc">Hybrid NLP + Gemini AI analysis. Upload PDF, DOCX, or paste text for deep scoring, precise changes, and resume rewriting.</p>

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

            <div className="btn-row"><button className="btn btn-primary" onClick={analyze} disabled={loading}><Zap size={14} /> {loading ? 'Analyzing...' : 'Deep Analyze'}</button></div>

            {error && <div className="alrt alrt-err"><AlertTriangle size={15} /> {error}</div>}
            {loading && <div className="ld"><div className="spin" /><span className="ld-msg">Running NLP + Gemini analysis...</span></div>}

            {result && (
                <div className="res">
                    <div className="scores">
                        <ScoreGauge score={result.match.score} label="NLP Match" color={sColor(result.match.score)} />
                        <ScoreGauge score={result.ats.ats_score} label="ATS Score" color={sColor(result.ats.ats_score)} />
                        {ga?.relevancy_score > 0 && <ScoreGauge score={ga.relevancy_score} label="AI Relevancy" color={sColor(ga.relevancy_score)} />}
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                        <span className={`pill ${recCls(result.match.recommendation)}`}>{result.match.recommendation}</span>
                        <span className={`pill ${recCls(result.ats.recommendation)}`}>{result.ats.recommendation}</span>
                        {ga?.semantic_match && <span className={`pill ${recCls(ga.semantic_match)}`}>{ga.semantic_match}</span>}
                    </div>

                    {ga?.overall_verdict && <div className="card"><div className="card-hd"><Zap size={15} /> AI Verdict</div><p style={{ color: 'var(--t2)', fontSize: '.84rem', lineHeight: 1.7 }}>{ga.overall_verdict}</p></div>}

                    {ga?.strengths && <div className="card"><div className="card-hd"><CheckCircle size={15} color="var(--green)" /> Strengths</div><ul className="tips">{ga.strengths.map((s, i) => <li key={i}><CheckCircle size={12} style={{ color: 'var(--green)', flexShrink: 0 }} /><span>{s}</span></li>)}</ul></div>}

                    {ga?.weaknesses && <div className="card"><div className="card-hd"><AlertTriangle size={15} color="var(--amber)" /> Weaknesses</div><ul className="tips">{ga.weaknesses.map((s, i) => <li key={i}><AlertTriangle size={12} style={{ color: 'var(--amber)', flexShrink: 0 }} /><span>{s}</span></li>)}</ul></div>}

                    {ga?.section_feedback && (
                        <Expandable title="Section Feedback" defaultOpen>
                            <div style={{ display: 'grid', gap: 8 }}>
                                {Object.entries(ga.section_feedback).map(([k, v]) => (
                                    <div key={k} style={{ padding: '10px 14px', background: 'var(--bg-2)', borderRadius: 'var(--radius)', border: '1px solid var(--bdr)' }}>
                                        <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'capitalize', marginBottom: 3 }}>{k}</div>
                                        <div style={{ fontSize: '.82rem', color: 'var(--t2)', lineHeight: 1.6 }}>{v}</div>
                                    </div>
                                ))}
                            </div>
                        </Expandable>
                    )}

                    {gc?.changes?.length > 0 && (
                        <div className="card">
                            <div className="card-hd"><RefreshCw size={15} /> Precise Changes</div>
                            {gc.changes.map((c, i) => (
                                <div key={i} style={{ padding: '10px 0', borderBottom: i < gc.changes.length - 1 ? '1px solid var(--bdr)' : 'none' }}>
                                    <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--accent-text)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3 }}>{c.section}</div>
                                    <div style={{ fontSize: '.78rem', color: 'var(--red)', fontFamily: "'JetBrains Mono', monospace", padding: '5px 8px', background: 'var(--red-dim)', borderRadius: '4px', marginBottom: 4 }}>{c.original}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, margin: '3px 0' }}><ArrowRight size={12} color="var(--green)" /><span style={{ fontSize: '.65rem', color: 'var(--t3)' }}>Replace with:</span></div>
                                    <div style={{ fontSize: '.78rem', color: 'var(--green)', fontFamily: "'JetBrains Mono', monospace", padding: '5px 8px', background: 'var(--green-dim)', borderRadius: '4px' }}>{c.suggested}</div>
                                    <div style={{ fontSize: '.72rem', color: 'var(--t3)', marginTop: 3 }}>{c.reason}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {gc?.additions?.length > 0 && <Expandable title="Content to Add">{gc.additions.map((a, i) => <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--bdr)', fontSize: '.82rem', color: 'var(--t2)' }}><span className={`tag ${a.priority === 'high' ? 'tag-red' : 'tag-amber'}`} style={{ marginRight: 6 }}>{a.priority}</span><strong>{a.section}:</strong> {a.content}</div>)}</Expandable>}

                    <Expandable title="ATS Score Breakdown">{Object.entries(result.ats.breakdown).map(([k, v]) => <ProgressBar key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={v} color={sColor(v)} />)}</Expandable>

                    <Expandable title="Matching Keywords"><div className="tags">{result.match.matching_keywords.map(k => <span key={k} className="tag tag-green">{k}</span>)}{!result.match.matching_keywords.length && <span style={{ color: 'var(--t3)' }}>None</span>}</div></Expandable>

                    <Expandable title="Missing Keywords"><div className="tags">{result.match.missing_keywords.map(k => <span key={k} className="tag tag-red">{k}</span>)}{!result.match.missing_keywords.length && <span style={{ color: 'var(--t3)' }}>None</span>}</div></Expandable>

                    {result.ats.improvements?.length > 0 && <Expandable title="Tips"><ul className="tips">{result.ats.improvements.map((t, i) => <li key={i}><Lightbulb size={13} style={{ color: 'var(--amber)', flexShrink: 0 }} /><span>{t}</span></li>)}</ul></Expandable>}

                    <div className="card" style={{ marginTop: 12 }}>
                        <div className="card-hd"><Sparkles size={15} /> Generate Optimized Resume</div>
                        <p style={{ color: 'var(--t3)', fontSize: '.82rem', marginBottom: 10 }}>Generate an ATS-optimized resume tailored to this JD via Gemini AI.</p>
                        <button className="btn btn-primary" onClick={rewrite} disabled={rwLoading}><Sparkles size={13} /> {rwLoading ? 'Generating...' : 'Generate'}</button>
                        {rw && (
                            <div style={{ marginTop: 14 }}>
                                <div className="alrt alrt-ok"><CheckCircle size={14} /> Generated via {rw.source === 'gemini' ? 'Gemini AI' : 'NLP'}. Review before use.</div>
                                <textarea value={rw.rewritten_resume} readOnly style={{ minHeight: 280 }} />
                                <div className="btn-row" style={{ marginTop: 8 }}>
                                    <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(rw.rewritten_resume); alert('Copied to clipboard! You can paste this directly into Word or Google Docs.'); }}><CheckCircle size={13} /> Copy Text</button>
                                    <button className="btn btn-ghost" onClick={() => { const b = new Blob([rw.rewritten_resume], { type: 'text/plain' }); const u = URL.createObjectURL(b); Object.assign(document.createElement('a'), { href: u, download: 'optimized_resume.md' }).click(); URL.revokeObjectURL(u); }}><Download size={13} /> Download .MD</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
