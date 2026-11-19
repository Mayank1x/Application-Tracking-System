import React, { createContext, useContext, useState } from 'react';

const ResumeContext = createContext(null);

export function ResumeProvider({ children }) {
    const [resumeText, setResumeText] = useState('');
    const [fileName, setFileName] = useState('No file loaded');
    const [isUploading, setIsUploading] = useState(false);

    // Common upload handler that calls the backend API securely
    const handleFileUpload = async (file) => {
        if (!file) return;
        setIsUploading(true);
        setFileName('Parsing file...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:8000/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail || 'Upload failed');
            }

            const data = await response.json();
            setResumeText(data.text);
            setFileName(data.filename);
        } catch (error) {
            console.error("File parsing error:", error);
            alert("Error parsing file: " + error.message);
            setFileName('Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <ResumeContext.Provider value={{ resumeText, setResumeText, fileName, isUploading, handleFileUpload }}>
            {children}
        </ResumeContext.Provider>
    );
}

export function useResume() {
    const context = useContext(ResumeContext);
    if (!context) {
        throw new Error('useResume must be used within a ResumeProvider');
    }
    return context;
}
