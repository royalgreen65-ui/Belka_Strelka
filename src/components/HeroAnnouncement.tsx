import React from 'react';
import { Language } from '../types';
import { i18n } from '../data/i18n';
import { Radio, Compass, ShieldCheck } from 'lucide-react';
import { ExpeditionLogo } from './ExpeditionLogo';
import { EXPEDITION_STATS } from '../data/expeditionData';

interface HeroAnnouncementProps {
  currentLang: Language;
}

export const HeroAnnouncement: React.FC<HeroAnnouncementProps> = ({ currentLang }) => {
  const t = i18n[currentLang];

  return (
    <section className="bg-gradient-to-r from-space-900 via-space-850 to-space-900 border border-space-700 rounded-2xl p-6 sm:p-8 relative overflow-hidden glow-cyan shadow-xl">
      {/* Background celestial glow effect */}
      <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 translate-y-16 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 lg:gap-8">
        
        {/* Left Column: Text & Badges */}
        <div className="space-y-4 flex-1">
          {/* Badges / Header Indicators */}
          <div className="flex flex-wrap gap-2.5 items-center">
            <div className="inline-flex items-center space-x-2 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-semibold text-orange-300">
              <Radio className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>{t.badgeCarrier}</span>
            </div>

            <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-semibold text-cyan-300">
              <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{t.badgeWaypoints}</span>
            </div>

            <a
              href={EXPEDITION_STATS.edsmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 bg-space-800/80 hover:bg-space-750 border border-space-700 hover:border-cyan-500/40 px-3 py-1 rounded-full text-xs font-mono text-slate-300 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>EDSM #229</span>
            </a>
          </div>

          {/* Title */}
          <h2 className="font-orbitron text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-wide leading-tight max-w-4xl text-balance">
            {t.announcementTitle}
          </h2>

          {/* Mission Description */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
            {t.announcementDesc}
          </p>

          <div className="flex items-center gap-3 pt-1 text-xs text-slate-400 font-mono">
            <span>Official Patch: <span className="text-orange-400 font-semibold">ОГКНЭ им. Белки и Стрелки</span></span>
            <span aria-hidden="true">·</span>
            <span>Lead: <span className="text-slate-200 font-semibold">{EXPEDITION_STATS.leader}</span></span>
          </div>
        </div>

        {/* Right Column: Official Mission Patch SVG Emblem */}
        <div className="shrink-0 flex flex-col items-center justify-center p-2">
          <div className="hover:scale-105 transition-transform duration-300">
            <ExpeditionLogo size="lg" showGlow />
          </div>
          <span className="text-[10px] font-mono text-slate-400 mt-2 tracking-wider uppercase">
            Mission Insignia
          </span>
        </div>

      </div>
    </section>
  );
};
