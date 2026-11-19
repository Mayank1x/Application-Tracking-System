import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
export default function Expandable({ title, icon, children, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="exp">
            <div className="exp-hd" onClick={() => setOpen(!open)}>
                <h4>{icon} {title}</h4>
                <ChevronDown size={14} className={`exp-chev ${open ? 'open' : ''}`} />
            </div>
            {open && <div className="exp-body">{children}</div>}
        </div>
    );
}
