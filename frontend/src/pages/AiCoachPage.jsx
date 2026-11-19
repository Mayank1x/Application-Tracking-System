import { useState, useRef, useEffect } from 'react';
import { useResume } from '../context/ResumeContext';
import { Send, Upload, MessageCircle, Sparkles } from 'lucide-react';
import { coachChat, uploadFile } from '../services/api';

const QUICK = [
    "What's my resume score?",
    "What skills am I missing?",
    "Is my resume ATS friendly?",
    "What action verbs should I add?",
    "Predict my best job roles",
    "Summarize my resume",
];

export default function AiCoachPage() {
    const { resumeText: resume, setResumeText: setResume } = useResume();
    const [msgs, setMsgs] = useState([{ from: 'ai', text: "Hello! I'm your AI resume coach. Upload your resume above, then ask me anything. Try the quick questions below to get started." }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const fRef = useRef();
    const bottom = useRef();

    useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

    const up = async () => {
        const f = fRef.current?.files?.[0]; if (!f) return;
        try {
            const res = await uploadFile(f);
            setResume(res.data.text);
            setMsgs(m => [...m, { from: 'ai', text: `Resume loaded (${res.data.chars} characters from ${res.data.filename}). Ask me anything about it!` }]);
        } catch (e) { setMsgs(m => [...m, { from: 'ai', text: 'Upload failed. Try PDF, DOCX, or TXT.' }]); }
    };

    const send = async (msg) => {
        const text = msg || input.trim();
        if (!text) return;
        setInput('');
        setMsgs(m => [...m, { from: 'user', text }]);
        setLoading(true);
        try {
            const res = await coachChat(resume, text);
            setMsgs(m => [...m, { from: 'ai', text: res.data.response, data: res.data.data }]);
        } catch (e) {
            setMsgs(m => [...m, { from: 'ai', text: 'Something went wrong. Please try again.' }]);
        }
        setLoading(false);
    };

    const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

    return (
        <div className="page">
            <h1 className="pg-title">AI Coach</h1>
            <p className="pg-desc">Chat about your resume. Get scores, skill analysis, ATS tips, and role predictions — all in one place.</p>

            <div className="btn-row">
                <button className="btn btn-ghost" onClick={() => fRef.current?.click()}><Upload size={13} /> Upload Resume</button>
                <input type="file" ref={fRef} accept=".pdf,.docx,.doc,.txt" hidden onChange={up} />
                {resume && <span className="tag tag-green">Resume loaded</span>}
            </div>

            <div className="chat-wrap">
                <div className="chat-msgs">
                    {msgs.map((m, i) => (
                        <div key={i} className={`chat-msg ${m.from === 'user' ? 'chat-user' : 'chat-ai'}`}>
                            {m.text}
                        </div>
                    ))}
                    {loading && <div className="chat-msg chat-ai" style={{ opacity: .6 }}>Thinking...</div>}
                    <div ref={bottom} />
                </div>

                <div className="chat-chips">
                    {QUICK.map(q => <button key={q} className="chat-chip" onClick={() => send(q)}><Sparkles size={10} /> {q}</button>)}
                </div>

                <div className="chat-input-row">
                    <input
                        className="chat-input"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Ask about your resume..."
                        disabled={loading}
                    />
                    <button className="btn btn-primary" onClick={() => send()} disabled={loading || !input.trim()}>
                        <Send size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
