import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

export function SidebarSelect({
  value,
  options,
  onChange,
  disabled,
  pending,
  'aria-label': ariaLabel
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? '—';

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open]);

  const handlePick = (v) => {
    if (v === value) {
      setOpen(false);
      return;
    }
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="jira-sidebar-select-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`jira-sidebar-select-trigger ${open ? 'open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className="jira-sidebar-select-trigger-text">
          {pending && <Loader2 size={14} className="animate-spin" aria-hidden />}
          {displayLabel}
        </span>
        <ChevronDown size={16} className="jira-sidebar-select-chevron" aria-hidden />
      </button>
      {open && !disabled && (
        <ul className="jira-sidebar-select-menu" role="listbox">
          {options.map((o) => (
            <li key={o.value === '' ? '__empty' : String(o.value)}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                className={`jira-sidebar-select-option ${o.value === value ? 'selected' : ''}`}
                onClick={() => handlePick(o.value)}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
