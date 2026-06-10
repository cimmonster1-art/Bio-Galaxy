import React from 'react';

interface PanelProps {
  title?: string;
  /** Small monospace eyebrow above the title. */
  eyebrow?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** Titled glass section used throughout the atlas side panels. */
export const Panel: React.FC<PanelProps> = ({ title, eyebrow, right, children, className }) => (
  <section className={`panel rounded-md ${className ?? ''}`}>
    {(title || eyebrow) && (
      <header className="flex items-center justify-between border-b border-white/10 px-3.5 py-2.5">
        <div>
          {eyebrow && <div className="meta-label mb-0.5">{eyebrow}</div>}
          {title && <h2 className="text-[13px] font-semibold text-slate-100">{title}</h2>}
        </div>
        {right}
      </header>
    )}
    <div className="px-3.5 py-3">{children}</div>
  </section>
);
