import React from 'react';
import { Language } from '../types';
import { i18n } from '../data/i18n';

interface FooterProps {
  currentLang: Language;
}

export const Footer: React.FC<FooterProps> = ({ currentLang }) => {
  const t = i18n[currentLang];

  return (
    <footer className="border-t border-space-800 bg-space-900/90 py-8 mt-16 text-center text-xs text-slate-500 space-y-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
        <p className="font-medium text-slate-400">
          {t.footerText}
        </p>
        <p className="text-[11px] text-slate-500 font-mono">
          {t.footerAffiliation}
        </p>
      </div>
    </footer>
  );
};
