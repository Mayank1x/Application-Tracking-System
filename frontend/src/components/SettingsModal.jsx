import React, { useState } from 'react';
import { X, Sliders, Cpu, ShieldCheck, Check, RotateCcw, CheckCircle2 } from 'lucide-react';

export const DEFAULT_SETTINGS = {
    weights: {
        semantic: 40,
        skills: 35,
        experience: 15,
        education: 10
    },
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    minPassingScore: 60,
    strictMandatory: true,
    fresherProtection: true
};

export default function SettingsModal({
    isOpen,
    onClose,
    settings = DEFAULT_SETTINGS,
    onSave,
    theme
}) {
    if (!isOpen) return null;

    const [formSettings, setFormSettings] = useState(JSON.parse(JSON.stringify(settings)));
    const [savedSuccess, setSavedSuccess] = useState(false);

    const totalWeight =
        Number(formSettings.weights.semantic) +
        Number(formSettings.weights.skills) +
        Number(formSettings.weights.experience) +
        Number(formSettings.weights.education);

    const handleWeightChange = (key, val) => {
        setFormSettings(prev => ({
            ...prev,
            weights: {
                ...prev.weights,
                [key]: Number(val)
            }
        }));
    };

    const applyPreset = (presetWeights) => {
        setFormSettings(prev => ({
            ...prev,
            weights: presetWeights
        }));
    };

    const handleSave = () => {
        onSave(formSettings);
        setSavedSuccess(true);
        setTimeout(() => {
            setSavedSuccess(false);
            onClose();
        }, 600);
    };

    const handleReset = () => {
        setFormSettings(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            animation: 'fadeIn 0.15s ease'
        }}>
            <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '10px',
                width: '100%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                color: 'var(--text-primary)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '18px 24px',
                    borderBottom: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'sticky',
                    top: 0,
                    background: 'var(--bg-surface)',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(5, 150, 105, 0.12)',
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Sliders size={18} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                ATS Algorithm & Matching Configuration
                            </h2>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                                Customize multi-factor scoring formula, AI model, and guardrails
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-tertiary)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Weight Presets */}
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Weight Presets
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                            <button
                                type="button"
                                onClick={() => applyPreset({ semantic: 40, skills: 35, experience: 15, education: 10 })}
                                style={{
                                    padding: '7px 6px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    border: '1px solid var(--border-default)',
                                    background: formSettings.weights.semantic === 40 && formSettings.weights.skills === 35 ? 'rgba(5, 150, 105, 0.15)' : 'var(--bg-subtle)',
                                    color: formSettings.weights.semantic === 40 && formSettings.weights.skills === 35 ? '#059669' : 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                Balanced (Default)
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset({ semantic: 20, skills: 55, experience: 20, education: 5 })}
                                style={{
                                    padding: '7px 6px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    border: '1px solid var(--border-default)',
                                    background: formSettings.weights.skills === 55 ? 'rgba(5, 150, 105, 0.15)' : 'var(--bg-subtle)',
                                    color: formSettings.weights.skills === 55 ? '#059669' : 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                Skills-First
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset({ semantic: 60, skills: 20, experience: 15, education: 5 })}
                                style={{
                                    padding: '7px 6px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    border: '1px solid var(--border-default)',
                                    background: formSettings.weights.semantic === 60 ? 'rgba(5, 150, 105, 0.15)' : 'var(--bg-subtle)',
                                    color: formSettings.weights.semantic === 60 ? '#059669' : 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                Semantic-Heavy
                            </button>
                            <button
                                type="button"
                                onClick={() => applyPreset({ semantic: 20, skills: 25, experience: 45, education: 10 })}
                                style={{
                                    padding: '7px 6px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    border: '1px solid var(--border-default)',
                                    background: formSettings.weights.experience === 45 ? 'rgba(5, 150, 105, 0.15)' : 'var(--bg-subtle)',
                                    color: formSettings.weights.experience === 45 ? '#059669' : 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                Senior / Exp
                            </button>
                        </div>
                    </div>

                    {/* Weight Sliders */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Scoring Weight Breakdown
                            </div>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: totalWeight === 100 ? 'rgba(5, 150, 105, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: totalWeight === 100 ? '#059669' : '#ef4444',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                {totalWeight === 100 ? <Check size={12} strokeWidth={2.5} /> : null}
                                Total: {totalWeight}% {totalWeight === 100 ? '(Valid)' : '(Must equal 100%)'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Semantic */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                        Dense Semantic AI Matching:
                                    </span>
                                    <strong style={{ color: '#2563eb' }}>{formSettings.weights.semantic}%</strong>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={formSettings.weights.semantic}
                                    onChange={(e) => handleWeightChange('semantic', e.target.value)}
                                    style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                                />
                            </div>

                            {/* Skills */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                        Skills Alignment (Mandatory 2x + Bonus 1x):
                                    </span>
                                    <strong style={{ color: '#059669' }}>{formSettings.weights.skills}%</strong>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={formSettings.weights.skills}
                                    onChange={(e) => handleWeightChange('skills', e.target.value)}
                                    style={{ width: '100%', accentColor: '#059669', cursor: 'pointer' }}
                                />
                            </div>

                            {/* Experience */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                        Experience Fit (Duration vs JD Requirements):
                                    </span>
                                    <strong style={{ color: '#d97706' }}>{formSettings.weights.experience}%</strong>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={formSettings.weights.experience}
                                    onChange={(e) => handleWeightChange('experience', e.target.value)}
                                    style={{ width: '100%', accentColor: '#d97706', cursor: 'pointer' }}
                                />
                            </div>

                            {/* Education */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                        Education & Degree Match:
                                    </span>
                                    <strong style={{ color: '#7c3aed' }}>{formSettings.weights.education}%</strong>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={formSettings.weights.education}
                                    onChange={(e) => handleWeightChange('education', e.target.value)}
                                    style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Embedding Model Selection */}
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                            Embedding Model Architecture
                        </div>
                        <select
                            value={formSettings.model}
                            onChange={(e) => setFormSettings(prev => ({ ...prev, model: e.target.value }))}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-default)',
                                background: 'var(--bg-subtle)',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="sentence-transformers/all-MiniLM-L6-v2">
                                High-Speed Semantic Matching (Standard Embeddings, &lt;0.8s) - Active
                            </option>
                            <option value="sentence-transformers/all-mpnet-base-v2">
                                Deep Contextual Semantic Matching (768-dim High Precision)
                            </option>
                            <option value="BAAI/bge-small-en-v1.5">
                                Enterprise MTEB Semantic Retrieval Model
                            </option>
                        </select>
                    </div>

                    {/* Heuristic Guardrails */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            Recruiter Guardrails
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                            <input
                                type="checkbox"
                                checked={formSettings.fresherProtection}
                                onChange={(e) => setFormSettings(prev => ({ ...prev, fresherProtection: e.target.checked }))}
                                style={{ accentColor: '#059669' }}
                            />
                            <span>
                                <strong>Fresher Protection:</strong> Strictly exclude degree duration (4-year engineering) & college internships from full-time work experience
                            </span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', cursor: 'pointer', color: 'var(--text-primary)' }}>
                            <input
                                type="checkbox"
                                checked={formSettings.strictMandatory}
                                onChange={(e) => setFormSettings(prev => ({ ...prev, strictMandatory: e.target.checked }))}
                                style={{ accentColor: '#059669' }}
                            />
                            <span>
                                <strong>Strict Skill Enforcement:</strong> Apply a 20% penalty if a candidate is missing 3+ core mandatory skills
                            </span>
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--bg-subtle)'
                }}>
                    <button
                        type="button"
                        onClick={handleReset}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border-default)',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                    >
                        <RotateCcw size={13} /> Reset Defaults
                    </button>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border-default)',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={totalWeight !== 100}
                            style={{
                                background: savedSuccess ? '#059669' : 'var(--accent-cta)',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 16px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: totalWeight !== 100 ? 'not-allowed' : 'pointer',
                                opacity: totalWeight !== 100 ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {savedSuccess ? (
                                <>
                                    <CheckCircle2 size={14} /> Saved & Applied!
                                </>
                            ) : (
                                'Save & Apply Settings'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
