import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { i18n } from '../data/i18n';
import { EXPEDITION_STATS } from '../data/expeditionData';
import {
  PieChart,
  Clock,
  Calendar,
  Compass,
  Users,
  AlertOctagon,
  ExternalLink,
  ShieldCheck,
  User,
} from 'lucide-react';

interface ExpeditionSummaryProps {
  currentLang: Language;
}

export const ExpeditionSummary: React.FC<ExpeditionSummaryProps> = ({ currentLang }) => {
  const t = i18n[currentLang];

  const [elapsedString, setElapsedString] = useState<string>('Calculating...');
  const [remainingString, setRemainingString] = useState<string>('Calculating...');

  useEffect(() => {
    function updateTimer() {
      const startDate = new Date(EXPEDITION_STATS.startDate).getTime();
      const arrivalDate = new Date(EXPEDITION_STATS.arrivalDate).getTime();
      const now = Date.now();

      const elapsedMs = now - startDate;
      const remainingMs = arrivalDate - now;

      setElapsedString(formatDuration(elapsedMs, true, currentLang));
      setRemainingString(formatDuration(remainingMs, false, currentLang));
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentLang]);

  function formatDuration(ms: number, isElapsed: boolean, lang: Language): string {
    if (isElapsed && ms < 0) {
      return i18n[lang].timerNotStarted;
    }
    if (!isElapsed && ms < 0) {
      return i18n[lang].timerCompleted;
    }

    const absMs = Math.abs(ms);
    const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absMs % (1000 * 60)) / 1000);

    if (lang === 'ru') {
      return `${days} дн. ${hours} ч. ${minutes} мин. ${seconds} сек.`;
    }
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Summary Stats Card (Takes 2 cols) */}
      <div className="lg:col-span-2 bg-space-900 border border-space-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-cyan-400" />
            <h3 className="font-orbitron text-lg font-bold text-white tracking-wide">
              {t.summaryHeader}
            </h3>
          </div>

          {/* EDSM Official Registry Badge with Link */}
          <a
            href={EXPEDITION_STATS.edsmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-mono bg-space-800 hover:bg-space-750 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 transition-colors self-start sm:self-auto"
            title="Open official expedition profile on Elite Dangerous Star Map (EDSM)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>EDSM Registry #{EXPEDITION_STATS.edsmId}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          
          {/* Starting Date */}
          <div className="bg-space-800/50 border border-space-700/60 p-4 rounded-xl space-y-1.5 transition-colors hover:border-space-600">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.labelStartDate}</span>
            </div>
            <div className="font-orbitron text-sm font-semibold text-slate-200">
              Nov 1, 2026
            </div>
          </div>

          {/* Arrival Date */}
          <div className="bg-space-800/50 border border-space-700/60 p-4 rounded-xl space-y-1.5 transition-colors hover:border-space-600">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.labelArrivalDate}</span>
            </div>
            <div className="font-orbitron text-sm font-semibold text-slate-200">
              Oct 29, 2027
            </div>
          </div>

          {/* Estimated Distance */}
          <div className="bg-space-800/50 border border-space-700/60 p-4 rounded-xl space-y-1.5 transition-colors hover:border-cyan-500/30">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.labelEstDistance}</span>
            </div>
            <div className="font-orbitron text-sm font-bold text-cyan-400 tabular-nums">
              295,206.29 ly
            </div>
          </div>

          {/* Starting / Arrival System */}
          <div className="bg-space-800/50 border border-space-700/60 p-4 rounded-xl space-y-1.5 transition-colors hover:border-orange-500/30">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
              <span>{t.labelSystems}</span>
            </div>
            <div className="font-orbitron text-sm font-semibold text-orange-400">
              Meni
            </div>
          </div>

          {/* Participants */}
          <div className="bg-space-800/50 border border-space-700/60 p-4 rounded-xl space-y-1.5 transition-colors hover:border-space-600">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.labelParticipants}</span>
            </div>
            <div className="font-orbitron text-sm font-semibold text-slate-200">
              {EXPEDITION_STATS.participantsCount} Commanders
            </div>
          </div>

          {/* Abandonment / Success */}
          <div className="bg-space-800/50 border border-space-700/60 p-4 rounded-xl space-y-1.5 transition-colors hover:border-space-600">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 uppercase tracking-wider">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.labelStatusStats}</span>
            </div>
            <div className="font-orbitron text-sm font-semibold text-slate-200">
              {EXPEDITION_STATS.abandonedCount} / {EXPEDITION_STATS.successCount}
            </div>
          </div>

        </div>

        {/* Expedition Organizer Callout */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-3 border-t border-space-800/70 gap-2 font-mono">
          <div className="flex items-center space-x-2">
            <User className="w-3.5 h-3.5 text-orange-400" />
            <span>Expedition Leader:</span>
            <span className="text-slate-200 font-semibold">{EXPEDITION_STATS.leader}</span>
          </div>
          <div>
            Mobile Base: <span className="text-cyan-400 font-semibold">{EXPEDITION_STATS.carrierName} ({EXPEDITION_STATS.carrierCallsign})</span>
          </div>
        </div>
      </div>

      {/* Timer Card (Takes 1 col) */}
      <div className="bg-space-900 border border-space-700 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-md">
        <div>
          <h3 className="font-orbitron text-lg font-bold text-white flex items-center space-x-2 mb-4">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>{t.timerHeader}</span>
          </h3>
          
          <div className="space-y-4">
            {/* Elapsed Time */}
            <div>
              <div className="text-xs text-slate-400 mb-1 font-medium">
                {t.elapsedLabel}
              </div>
              <div className="font-orbitron text-xs sm:text-sm font-bold text-cyan-400 bg-space-800/90 p-3 rounded-xl border border-space-700 tabular-nums">
                {elapsedString}
              </div>
            </div>

            {/* Remaining Time */}
            <div>
              <div className="text-xs text-slate-400 mb-1 font-medium">
                {t.remainingLabel}
              </div>
              <div className="font-orbitron text-xs sm:text-sm font-bold text-amber-400 bg-space-800/90 p-3 rounded-xl border border-space-700 tabular-nums">
                {remainingString}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 text-xs text-slate-400 border-t border-space-800/60 text-center font-mono">
          <span>{t.carrierBaseNote}</span>
        </div>
      </div>

    </section>
  );
};
