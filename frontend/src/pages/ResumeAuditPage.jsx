import { useState, useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import { Search, Sparkles, AlertTriangle, Upload, Award, Lightbulb, CheckCircle, AlertCircle, Minus, Target, Brain, FileText } from 'lucide-react';
import ScoreGauge from '../components/ScoreGauge';
import ProgressBar from '../components/ProgressBar';
import Expandable from '../components/Expandable';
import { uploadFile } from '../services/api';
import API from '../services/api';
import { SAMPLE_RESUME } from '../data/sampleData';

const sColor = v => v >= 75 ? 'var(--green)' : v >= 50 ? 'var(--accent)' : v >= 35 ? 'var(--amber)' : 'var(--red)';
const gCls = g => g === 'A+' || g === 'A' ? 'pill-g' : g === 'B' ? 'pill-b' : g === 'C' ? 'pill-a' : 'pill-r';
const rTag = r => r === 'Strong' ? 'tag-green' : r === 'Good' ? 'tag-blue' : r === 'Needs Work' ? 'tag-amber' : 'tag-red';
const rIcon = r => r === 'Strong' ? <CheckCircle size={12} /> : r === 'Good' ? <Minus size={12} /> : <AlertCircle size={12} />;

export default function ResumeAuditPage() {
    const { resumeText: text, setResumeText: setText } = useResume();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fRef = useRef();

    const up = async () => { const f = fRef.current?.files?.[0]; if (!f) return; try { setText((await uploadFile(f)).data.text); } catch (e) { setError('Upload failed.'); } };

    const run = async () => {
        if (text.length < 20) { setError('Provide at least 20 characters.'); return; }
        setLoading(true); setError(''); setResult(null);
        try { setResult((await API.post('/audit', { resume_text: text })).data); }
        catch (e) { setError(e.response?.data?.detail || 'Audit failed.'); }
        finally { setLoading(false); }
    };

    const sc = result?.score_card;
    const ats = result?.ats;
    const sk = result?.skills;
    const bl = result?.bullets;
    const rl = result?.roles;
    const st = result?.stats;

    return (
        <div className="page">
            <h1 className="pg-title">Resume Audit</h1>
            <p className="pg-desc">Upload your resume and get a complete analysis — ATS score, score card, skills, bullet review, role prediction — no job description needed.</p>

            <div className="btn-row"><button className="btn btn-ghost" onClick={() => setText(SAMPLE_RESUME)}><Sparkles size={13} /> Sample</button></div>
            <div className="input-grid input-full"><div>
                <div className="field-lbl"><span>Resume</span><button className="upload-btn" onClick={() => fRef.current?.click()}><Upload size={10} /> Upload</button><input type="file" ref={fRef} accept=".pdf,.docx,.doc,.txt" hidden onChange={up} /></div>
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste or upload your resume (PDF, DOCX, TXT)..." style={{ minHeight: 200 }} />
            </div></div>
            <div className="btn-row"><button className="btn btn-primary" onClick={run} disabled={loading}><Search size={14} /> {loading ? 'Auditing...' : 'Full Audit'}</button></div>

            {error && <div className="alrt alrt-err"><AlertTriangle size={15} /> {error}</div>}
            {loading && <div className="ld"><div className="spin" /><span className="ld-msg">Running full analysis (Score Card + ATS + Skills + Bullets + Roles)...</span></div>}

            {result && (
                <div className="res">
                    {/* Score Gauges */}
                    <div className="scores">
                        {sc && <ScoreGauge score={sc.total_score} label="Overall Score" color={sColor(sc.total_score)} />}
                        {ats && <ScoreGauge score={ats.ats_score} label="ATS Score" color={sColor(ats.ats_score)} />}
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                        {sc && <span className={`pill ${gCls(sc.grade)}`}><Award size={13} /> Grade: {sc.grade}</span>}
                        {sc && <span className="pill pill-b">Top {100 - sc.percentile}%</span>}
                        {ats && <span className={`pill ${ats.ats_score >= 70 ? 'pill-g' : ats.ats_score >= 40 ? 'pill-a' : 'pill-r'}`}>{ats.recommendation}</span>}
                    </div>

                    {/* Quick Stats */}
                    {st && (
                        <div className="mets">
                            <div className="met"><div className="met-n" style={{ color: 'var(--accent)' }}>{st.word_count}</div><div className="met-l">Words</div></div>
                            <div className="met"><div className="met-n" style={{ color: 'var(--green)' }}>{sk?.total_skills || 0}</div><div className="met-l">Skills</div></div>
                            <div className="met"><div className="met-n" style={{ color: 'var(--purple)' }}>{bl?.total || 0}</div><div className="met-l">Bullets</div></div>
                            <div className="met"><div className="met-n" style={{ color: 'var(--amber)' }}>{bl?.average_score || 0}</div><div className="met-l">Bullet Avg</div></div>
                            <div className="met"><div className="met-n" style={{ color: st.has_email ? 'var(--green)' : 'var(--red)' }}>{st.has_email ? 'Yes' : 'No'}</div><div className="met-l">Email</div></div>
                            <div className="met"><div className="met-n" style={{ color: st.has_linkedin ? 'var(--green)' : 'var(--red)' }}>{st.has_linkedin ? 'Yes' : 'No'}</div><div className="met-l">LinkedIn</div></div>
                        </div>
                    )}

                    {/* Score Card Dimensions */}
                    {sc && (
                        <div className="card">
                            <div className="card-hd"><Award size={15} /> Score Card Breakdown</div>
                            {Object.entries(sc.dimensions).map(([k, d]) => (
                                <ProgressBar key={k} label={`${k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} (${d.score}/${d.max})`} value={(d.score / d.max) * 100} color={sColor((d.score / d.max) * 100)} />
                            ))}
                        </div>
                    )}

                    {/* ATS Breakdown */}
                    {ats && (
                        <Expandable title="ATS Score Breakdown" defaultOpen>
                            {Object.entries(ats.breakdown).map(([k, v]) => (
                                <ProgressBar key={k} label={k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} value={v} color={sColor(v)} />
                            ))}
                        </Expandable>
                    )}

                    {/* ATS Improvements */}
                    {ats?.improvements?.length > 0 && (
                        <Expandable title="ATS Improvements Needed">
                            <ul className="tips">{ats.improvements.map((t, i) => <li key={i}><Lightbulb size={12} style={{ color: 'var(--amber)', flexShrink: 0 }} /><span>{t}</span></li>)}</ul>
                        </Expandable>
                    )}

                    {/* Top Fixes */}
                    {sc?.top_fixes?.length > 0 && (
                        <div className="card">
                            <div className="card-hd"><Lightbulb size={15} color="var(--amber)" /> Top Areas to Fix</div>
                            <ul className="tips">{sc.top_fixes.map((f, i) => <li key={i}><Lightbulb size={12} style={{ color: 'var(--amber)', flexShrink: 0 }} /><span>{f}</span></li>)}</ul>
                        </div>
                    )}

                    {/* Skills */}
                    {sk && (
                        <Expandable title={`Skills Found (${sk.total_skills})`} icon={<Brain size={13} />} defaultOpen>
                            {Object.entries(sk.skills_by_category).map(([cat, skills]) => (
                                skills.length > 0 && <div key={cat} style={{ marginBottom: 8 }}>
                                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 3 }}>{cat}</div>
                                    <div className="tags">{skills.map(s => <span key={s} className="tag tag-blue">{s}</span>)}</div>
                                </div>
                            ))}
                            {sk.missing_categories.length > 0 && <div style={{ marginTop: 8 }}><div style={{ fontSize: '.68rem', color: 'var(--t3)', marginBottom: 3 }}>MISSING CATEGORIES</div><div className="tags">{sk.missing_categories.map(c => <span key={c} className="tag tag-red">{c}</span>)}</div></div>}
                        </Expandable>
                    )}

                    {/* Bullet Review */}
                    {bl && bl.items.length > 0 && (
                        <Expandable title={`Bullet Review (${bl.strong} strong, ${bl.weak} weak)`}>
                            {bl.items.slice(0, 10).map((b, i) => (
                                <div key={i} className="blt">
                                    <div className="blt-txt">{b.text}</div>
                                    <div className="blt-meta">
                                        <span className="blt-score" style={{ color: b.score >= 55 ? 'var(--green)' : 'var(--amber)' }}>{b.score}/100</span>
                                        <span className={`tag ${rTag(b.rating)}`}>{rIcon(b.rating)} {b.rating}</span>
                                        {b.has_action_verb && <span className="tag tag-green">Action Verb</span>}
                                        {b.has_metrics && <span className="tag tag-sky">Metrics</span>}
                                    </div>
                                    {b.tips.length > 0 && <ul className="blt-tips">{b.tips.map((t, j) => <li key={j}><Lightbulb size={11} style={{ color: 'var(--amber)', flexShrink: 0 }} /><span>{t}</span></li>)}</ul>}
                                </div>
                            ))}
                        </Expandable>
                    )}

                    {/* Top Role */}
                    {rl?.predictions?.[0] && (
                        <div className="card">
                            <div className="card-hd"><Target size={15} /> Best-Fit Role</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <span style={{ fontSize: '1rem', fontWeight: 800 }}>{rl.predictions[0].role}</span>
                                <span className="pill pill-b">{rl.predictions[0].combined_score}%</span>
                            </div>
                            <div style={{ fontSize: '.78rem', color: 'var(--t3)', marginBottom: 6 }}>Skills: {rl.predictions[0].matched_count}/{rl.predictions[0].total_skills} matched</div>
                            {rl.predictions[0].missing_skills.length > 0 && <div><div style={{ fontSize: '.65rem', color: 'var(--t3)', marginBottom: 2 }}>ADD THESE SKILLS</div><div className="tags">{rl.predictions[0].missing_skills.map(s => <span key={s} className="tag tag-red">{s}</span>)}</div></div>}
                            {rl.predictions.length > 1 && <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>{rl.predictions.slice(1).map((p, i) => <span key={i} className="tag tag-blue">{p.role} ({p.combined_score}%)</span>)}</div>}
                        </div>
                    )}

                    {/* Summary */}
                    {result.summary?.summary && (
                        <Expandable title="AI Summary" icon={<FileText size={13} />}>
                            <div className="sum-box">{result.summary.summary}</div>
                        </Expandable>
                    )}
                </div>
            )}
        </div>
    );
}
