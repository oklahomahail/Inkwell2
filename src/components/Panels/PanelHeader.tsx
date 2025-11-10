// src/components/Panels/PanelHeader.tsx
import React from 'react';

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  children?: React.ReactNode;
}

export const PanelHeader: React.FC<PanelHeaderProps> = ({
  title,
  subtitle,
  showLogo = true,
  children,
}) => {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-4">
        {showLogo && <img src="/brand/1.svg" alt="Inkwell" className="h-10 w-10 flex-shrink-0" />}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
};
