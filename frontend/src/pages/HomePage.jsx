import { Link } from 'react-router-dom';
import { GitCompareArrows, Brain, FileText, ListChecks, Network, Star, Target, MessageCircle, Info, ClipboardCheck } from 'lucide-react';

const F = [
    { to: '/audit', icon: <ClipboardCheck size={18} strokeWidth={1.5} />, cat: 'ANALYZE', title: 'Resume Audit', desc: 'Check your resume for common formatting and content mistakes.' },
    { to: '/matcher', icon: <GitCompareArrows size={18} strokeWidth={1.5} />, cat: 'ANALYZE', title: 'Resume Matcher', desc: 'Compare your resume to a job description to see how well you match.' },
    { to: '/skills', icon: <Brain size={18} strokeWidth={1.5} />, cat: 'ANALYZE', title: 'Skill Extractor', desc: 'Automatically find and organize the skills listed in your resume.' },
    { to: '/bullet-review', icon: <ListChecks size={18} strokeWidth={1.5} />, cat: 'OPTIMIZE', title: 'Bullet Review', desc: 'Get feedback on your work experience points to make them stronger.' },
    { to: '/summarizer', icon: <FileText size={18} strokeWidth={1.5} />, cat: 'OPTIMIZE', title: 'Summarizer', desc: 'Create a short professional summary from your full resume.' },
    { to: '/semantic-matcher', icon: <Network size={18} strokeWidth={1.5} />, cat: 'AI INSIGHTS', title: 'Semantic Matcher', desc: 'Smart matching that understands finding "JavaScript" when a job asks for "JS".' },
    { to: '/score-card', icon: <Star size={18} strokeWidth={1.5} />, cat: 'AI INSIGHTS', title: 'Score Card', desc: 'Get an overall grade and percentile score for your resume.' },
    { to: '/role-predictor', icon: <Target size={18} strokeWidth={1.5} />, cat: 'AI INSIGHTS', title: 'Role Predictor', desc: 'Discover which job roles suit your skills best.' },
    { to: '/ai-coach', icon: <MessageCircle size={18} strokeWidth={1.5} />, cat: 'AI INSIGHTS', title: 'AI Coach', desc: 'Chat with an AI assistant for tips on how to improve your resume.' },
];

export default function HomePage() {
    return (
        <div className="page">
            <div className="dash-header">
                <h1 className="pg-title">Dashboard</h1>
                <p className="pg-desc" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 20 }}>Select a module to begin your analysis.</p>
                <div style={{ height: 1, background: 'var(--border-default)', marginBottom: 24 }}></div>
            </div>
            
            <div className="feat-grid">
                {F.map(f => (
                    <Link to={f.to} key={f.to} className="feat-card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span className="feat-cat">{f.cat}</span>
                            <div style={{ color: 'var(--text-tertiary)' }}>{f.icon}</div>
                        </div>
                        <h3>{f.title}</h3>
                        <p>{f.desc}</p>
                    </Link>
                ))}
            </div>

            <div className="dash-info">
                <Info size={16} color="var(--text-tertiary)" strokeWidth={1.5} />
                <span className="dash-info-txt">Upload a resume using the sidebar to enable full analysis across all modules.</span>
            </div>
        </div>
    );
}
