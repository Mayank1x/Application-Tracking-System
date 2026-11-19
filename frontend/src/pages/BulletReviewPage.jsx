import { useState, useRef } from 'react';
import { useResume } from '../context/ResumeContext';
import { Search, Sparkles, AlertTriangle, Upload, Lightbulb, CheckCircle, AlertCircle, Minus } from 'lucide-react';
import { bulletReview, uploadFile } from '../services/api';
import { SAMPLE_RESUME } from '../data/sampleData';
const rTag = r => r === 'Strong' ? 'tag-green' : r === 'Good' ? 'tag-blue' : r === 'Needs Work' ? 'tag-amber' : 'tag-red';
const rIcon = r => r === 'Strong' ? <CheckCircle size={12} /> : r === 'Good' ? <Minus size={12} /> : <AlertCircle size={12} />;
export default function BulletReviewPage() {
    const { resumeText: t, setResumeText: setT } = useResume(); const [r, setR] = useState(null); const [l, setL] = useState(false); const [e, setE] = useState(''); const fRef = useRef();
    const up = async () => { const f = fRef.current?.files?.[0]; if (!f) return; try { setT((await uploadFile(f)).data.text); } catch (x) { setE('Upload failed.'); } };
    const run = async () => { if (t.length < 20) { setE('Min 20 chars.'); return; } setL(true); setE(''); setR(null); try { setR((await bulletReview(t)).data); } catch (x) { setE(x.response?.data?.detail || 'Failed.'); } finally { setL(false); } };
    return (
        <div className="page">
            <h1 className="pg-title">Bullet Impact Review</h1>
            <p className="pg-desc">Line-by-line feedback on experience bullets. Scored for action verbs, metrics, and conciseness.</p>
            <div className="btn-row"><button className="btn btn-ghost" onClick={() => setT(SAMPLE_RESUME)}><Sparkles size={13} /> Sample</button></div>
            <div className="input-grid input-full"><div>
                <div className="field-lbl"><span>Resume</span><button className="upload-btn" onClick={() => fRef.current?.click()}><Upload size={10} /> Upload</button><input type="file" ref={fRef} accept=".pdf,.docx,.doc,.txt" hidden onChange={up} /></div>
                <textarea value={t} onChange={v => setT(v.target.value)} placeholder="Paste or upload resume..." style={{ minHeight: 200 }} />
            </div></div>
            <div className="btn-row"><button className="btn btn-primary" onClick={run} disabled={l}><Search size={14} /> {l ? 'Reviewing...' : 'Review Bullets'}</button></div>
            {e && <div className="alrt alrt-err"><AlertTriangle size={15} /> {e}</div>}
            {l && <div className="ld"><div className="spin" /><span className="ld-msg">Analyzing bullets...</span></div>}
            {r && (<div className="res">
                <div className="mets">
                    <div className="met"><div className="met-n" style={{ color: 'var(--accent)' }}>{r.total}</div><div className="met-l">Bullets</div></div>
                    <div className="met"><div className="met-n" style={{ color: 'var(--green)' }}>{r.strong_count}</div><div className="met-l">Strong</div></div>
                    <div className="met"><div className="met-n" style={{ color: 'var(--red)' }}>{r.weak_count}</div><div className="met-l">Weak</div></div>
                    <div className="met"><div className="met-n" style={{ color: 'var(--purple)' }}>{r.average_score}</div><div className="met-l">Avg Score</div></div>
                </div>
                {r.bullets.map((b, i) => (<div key={i} className="blt">
                    <div className="blt-txt">{b.text}</div>
                    <div className="blt-meta">
                        <span className="blt-score" style={{ color: b.score >= 55 ? 'var(--green)' : 'var(--amber)' }}>{b.score}/100</span>
                        <span className={`tag ${rTag(b.rating)}`}>{rIcon(b.rating)} {b.rating}</span>
                        {b.has_action_verb && <span className="tag tag-green">Action Verb</span>}
                        {b.has_metrics && <span className="tag tag-sky">Metrics</span>}
                    </div>
                    {b.tips.length > 0 && <ul className="blt-tips">{b.tips.map((tp, j) => <li key={j}><Lightbulb size={11} style={{ color: 'var(--amber)', flexShrink: 0 }} /><span>{tp}</span></li>)}</ul>}
                </div>))}
            </div>)}
        </div>
    );
}
