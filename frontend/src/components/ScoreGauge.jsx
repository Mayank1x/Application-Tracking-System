import { useEffect, useState } from 'react';
export default function ScoreGauge({ score, label, color = 'var(--accent)' }) {
    const r = 52, circ = 2 * Math.PI * r;
    const [off, setOff] = useState(circ);
    useEffect(() => { const t = setTimeout(() => setOff(circ - (score / 100) * circ), 60); return () => clearTimeout(t); }, [score, circ]);
    return (
        <div className="ring-wrap">
            <div className="ring">
                <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle className="trk" cx="60" cy="60" r={r} />
                    <circle className="fill" cx="60" cy="60" r={r} stroke={color} strokeDasharray={circ} strokeDashoffset={off} />
                </svg>
                <div className="ring-val">
                    <div className="ring-num" style={{ color }}>{Math.round(score || 0)}</div>
                    <div className="ring-unit">/100</div>
                </div>
            </div>
            <div className="ring-lbl">{label}</div>
        </div>
    );
}
