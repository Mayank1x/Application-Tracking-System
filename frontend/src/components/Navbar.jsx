import React from 'react';
import { Home, Briefcase, Users, BarChart2, Settings, Moon, Sun } from 'lucide-react';

export default function Sidebar({ theme, toggleTheme, activeNav, setActiveNav, onOpenSettings }) {
    return (
        <aside style={{
            width: '56px',
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '12px 0',
            flexShrink: 0,
            zIndex: 50,
            transition: 'background 0.2s ease, border-color 0.2s ease'
        }}>
            {/* Top Brand Logo - Crisp Geometric Origami Bird Mark from Reference Mockup (NO STAR LOGO) */}
            <button
                onClick={() => setActiveNav('positions')}
                title="CodeLens ATS - Candidate Ranking System"
                style={{
                    width: '38px',
                    height: '38px',
                    background: theme === 'dark' ? '#09090b' : '#ffffff',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-default)',
                    marginBottom: '18px',
                    cursor: 'pointer',
                    padding: 0,
                    boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.4)' : '0 1px 4px rgba(0,0,0,0.06)',
                    transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                {/* Origami Bird Facet Glyph */}
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                    {/* Head / Beak */}
                    <polygon points="16,4 26,12 18,14" fill="#10b981" />
                    {/* Upper Wing */}
                    <polygon points="16,4 18,14 6,10" fill="#3b82f6" opacity="0.9" />
                    {/* Body */}
                    <polygon points="6,10 18,14 14,24" fill="#6366f1" />
                    {/* Tail */}
                    <polygon points="14,24 18,14 26,20" fill="#ec4899" opacity="0.95" />
                    {/* Accent Underwing */}
                    <polygon points="14,24 26,20 20,28" fill="#f59e0b" />
                </svg>
            </button>

            {/* Navigation Icons */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'center' }}>
                {/* 1. Open Positions & Ranking (Home) */}
                <button
                    onClick={() => setActiveNav('positions')}
                    title="Open Positions & Candidate Ranking"
                    style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        color: activeNav === 'positions' ? '#059669' : 'var(--text-tertiary)',
                        background: activeNav === 'positions' ? (theme === 'dark' ? 'rgba(5, 150, 105, 0.15)' : '#ecfdf5') : 'transparent',
                        border: activeNav === 'positions' ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <Home size={18} />
                    {activeNav === 'positions' && (
                        <span style={{
                            position: 'absolute',
                            left: '-6px',
                            width: '3px',
                            height: '18px',
                            background: '#059669',
                            borderRadius: '0 2px 2px 0'
                        }} />
                    )}
                </button>

                {/* 2. Requisitions & Open Jobs Directory (Reference Mockup Image 3) */}
                <button
                    onClick={() => setActiveNav('jobs')}
                    title="Requisitions & Open Jobs"
                    style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        color: activeNav === 'jobs' ? '#2563eb' : 'var(--text-tertiary)',
                        background: activeNav === 'jobs' ? (theme === 'dark' ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff') : 'transparent',
                        border: activeNav === 'jobs' ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <Briefcase size={18} />
                    {activeNav === 'jobs' && (
                        <span style={{
                            position: 'absolute',
                            left: '-6px',
                            width: '3px',
                            height: '18px',
                            background: '#2563eb',
                            borderRadius: '0 2px 2px 0'
                        }} />
                    )}
                </button>

                {/* 3. Talent Pool & Candidate Directory */}
                <button
                    onClick={() => setActiveNav('candidates')}
                    title="Talent Pool & Candidates Directory"
                    style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        color: activeNav === 'candidates' ? '#7c3aed' : 'var(--text-tertiary)',
                        background: activeNav === 'candidates' ? (theme === 'dark' ? 'rgba(124, 58, 237, 0.15)' : '#f5f3ff') : 'transparent',
                        border: activeNav === 'candidates' ? '1px solid rgba(124, 58, 237, 0.3)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <Users size={18} />
                    {activeNav === 'candidates' && (
                        <span style={{
                            position: 'absolute',
                            left: '-6px',
                            width: '3px',
                            height: '18px',
                            background: '#7c3aed',
                            borderRadius: '0 2px 2px 0'
                        }} />
                    )}
                </button>

                {/* 4. Recruitment Pipeline Analytics */}
                <button
                    onClick={() => setActiveNav('analytics')}
                    title="Recruitment Pipeline Analytics"
                    style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        color: activeNav === 'analytics' ? '#d97706' : 'var(--text-tertiary)',
                        background: activeNav === 'analytics' ? (theme === 'dark' ? 'rgba(217, 119, 6, 0.15)' : '#fffbeb') : 'transparent',
                        border: activeNav === 'analytics' ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <BarChart2 size={18} />
                    {activeNav === 'analytics' && (
                        <span style={{
                            position: 'absolute',
                            left: '-6px',
                            width: '3px',
                            height: '18px',
                            background: '#d97706',
                            borderRadius: '0 2px 2px 0'
                        }} />
                    )}
                </button>
            </nav>

            {/* Bottom Actions: Theme Toggle + Settings (NO profile avatar / NO HM!) */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                {/* Professional Dark / Light Mode Toggle */}
                <button
                    onClick={toggleTheme}
                    title={theme === 'dark' ? 'Switch to Crisp Light Mode' : 'Switch to True OLED Black Dark Mode'}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#6366f1" />}
                </button>

                {/* Settings Gear - Opens Full ATS Algorithm Configuration Modal */}
                <button
                    onClick={onOpenSettings}
                    title="ATS Algorithm & Matching Settings"
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#059669';
                        e.currentTarget.style.borderColor = '#059669';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                    }}
                >
                    <Settings size={17} />
                </button>
            </div>
        </aside>
    );
}
