export default function ProgressBar({ label, value, color = 'var(--accent)' }) {
    return (
        <div className="pbar">
            <div className="pbar-top"><span>{label}</span><span style={{ color }}>{Math.round(value)}%</span></div>
            <div className="pbar-track"><div className="pbar-fill" style={{ width: `${Math.min(value, 100)}%`, background: color }} /></div>
        </div>
    );
}
