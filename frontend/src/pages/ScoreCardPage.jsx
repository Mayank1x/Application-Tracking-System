import { useState, useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import { Search, Sparkles, AlertTriangle, Upload, Star, Lightbulb, Award } from 'lucide-react';
import ScoreGauge from '../components/ScoreGauge';
import ProgressBar from '../components/ProgressBar';
import { scoreCard, uploadFile } from '../services/api';
import { SAMPLE_RESUME } from '../data/sampleData';

const sColor = v => v >= 75 ? 'var(--green)' : v >= 50 ? 'var(--accent)' : v >= 35 ? 'var(--amber)' : 'var(--red)';
const gCls = g => g === 'A+' || g === 'A' ? 'pill-g' : g === 'B' ? 'pill-b' : g === 'C' ? 'pill-a' : 'pill-r';

export default function ScoreCardPage() {
    const { resumeText: text, setResumeText: setText } = useResume();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fRef = useRef();

    const up = async () => { const f = fRef.current?.files?.[0]; if (!f) return; try { setText((await uploadFile(f)).data.text); } catch (e) { setError('Upload failed.'); } };

    const run = async () => {
        if (text.length < 20) { setError('Min 20 characters.'); return; }
        setLoading(true); setError(''); setResult(null);
        try { setResult((await scoreCard(text)).data); }
        catch (e) { setError(e.response?.data?.detail || 'Scoring failed.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="page">
            <h1 className="pg-title">Score Card</h1>
            <p className="pg-desc">5-dimension grading: Content, Skills, Structure, Language, and ATS Compatibility. Get a letter grade and improvement roadmap.</p>

            <div className="btn-row"><button className="btn btn-ghost" onClick={() => setText(SAMPLE_RESUME)}><Sparkles size={13} /> Sample</button></div>
            <div className="input-grid input-full"><div>
                <div className="field-lbl"><span>Resume</span><button className="upload-btn" onClick={() => fRef.current?.click()}><Upload size={10} /> Upload</button><input type="file" ref={fRef} accept=".pdf,.docx,.doc,.txt" hidden onChange={up} /></div>
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Paste or upload resume..." />
            </div></div>
            <div className="btn-row"><button className="btn btn-primary" onClick={run} disabled={loading}><Star size={14} /> {loading ? 'Scoring...' : 'Score Resume'}</button></div>

            {error && <div className="alrt alrt-err"><AlertTriangle size={15} /> {error}</div>}
            {loading && <div className="ld"><div className="spin" /><span className="ld-msg">Computing 5-dimension score...</span></div>}

            {result && (
                <div className="res">
                    <div className="scores">
                        <ScoreGauge score={result.total_score} label="Overall Score" color={sColor(result.total_score)} />
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                        <span className={`pill ${gCls(result.grade)}`}><Award size={14} /> Grade: {result.grade}</span>
                        <span className="pill pill-b">Better than {result.percentile}% of resumes</span>
                    </div>

                    <div className="card">
                        <div className="card-hd"><Star size={15} /> Dimension Scores</div>
                        {Object.entries(result.dimensions).map(([key, dim]) => (
                            <ProgressBar
                                key={key}
                                label={`${key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} (${dim.score}/${dim.max})`}
                                value={(dim.score / dim.max) * 100}
                                color={sColor((dim.score / dim.max) * 100)}
                            />
                        ))}
                    </div>

                    {Object.entries(result.dimensions).map(([key, dim]) => (
                        <div key={key} className="card">
                            <div className="card-hd" style={{ fontSize: '.82rem' }}>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} — {dim.score}/{dim.max}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                {Object.entries(dim.details).map(([dk, dv]) => (
                                    <div key={dk} style={{ fontSize: '.78rem', padding: '5px 8px', background: 'var(--bg-2)', borderRadius: '4px', border: '1px solid var(--bdr)' }}>
                                        <span style={{ color: 'var(--t3)' }}>{dk.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: </span>
                                        <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{typeof dv === 'boolean' ? (dv ? 'Yes' : 'No') : String(dv)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {result.top_fixes.length > 0 && (
                        <div className="card">
                            <div className="card-hd"><Lightbulb size={15} color="var(--amber)" /> Top Areas to Fix</div>
                            <ul className="tips">{result.top_fixes.map((f, i) => <li key={i}><Lightbulb size={12} style={{ color: 'var(--amber)', flexShrink: 0 }} /><span>{f}</span></li>)}</ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
