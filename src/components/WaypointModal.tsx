import React, { useState } from 'react';
import { Waypoint, Language } from '../types';
import { i18n } from '../data/i18n';
import { X, Copy, Check, Compass, Sparkles, Navigation, Globe } from 'lucide-react';

interface WaypointModalProps {
  waypoint: Waypoint | null;
  currentLang: Language;
  onClose: () => void;
  onOpenCalculator?: (wp: Waypoint) => void;
}

export const WaypointModal: React.FC<WaypointModalProps> = ({
  waypoint,
  currentLang,
  onClose,
  onOpenCalculator,
}) => {
  if (!waypoint) return null;

  const t = i18n[currentLang];
  const [copied, setCopied] = useState(false);

  const displayName = (!waypoint.isAnnounced && currentLang === 'ru') ? 'Будет объявлено' : waypoint.system;
  const displayRegion = (currentLang === 'ru' && waypoint.regionRu) ? waypoint.regionRu : waypoint.region;
  const displayFeatures = (currentLang === 'ru' && waypoint.notableFeaturesRu) ? waypoint.notableFeaturesRu : waypoint.notableFeatures;

  const handleCopy = () => {
    if (!waypoint.isAnnounced) return;
    navigator.clipboard.writeText(waypoint.system);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-space-900 border border-space-700 w-full max-w-xl rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-space-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-orbitron text-cyan-400 font-bold tracking-wider uppercase">
            <Compass className="w-4 h-4" />
            <span>Waypoint #{waypoint.num} • {displayRegion}</span>
          </div>
          <h3 className="font-orbitron text-2xl font-bold text-white tracking-wide">
            {displayName}
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            {t.colDistance}: {waypoint.distanceStr}
          </p>
        </div>

        {/* Coordinates Grid */}
        <div className="bg-space-950/70 p-4 rounded-xl border border-space-800 space-y-2">
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center space-x-1.5">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.modalCoords} (Sol = 0, 0, 0)</span>
          </div>
          <div className="grid grid-cols-3 gap-2 font-mono text-xs sm:text-sm">
            <div className="bg-space-900 p-2.5 rounded-lg border border-space-800">
              <span className="text-slate-500">X:</span>{' '}
              <span className="text-slate-200 font-semibold">{waypoint.x.toFixed(1)} ly</span>
            </div>
            <div className="bg-space-900 p-2.5 rounded-lg border border-space-800">
              <span className="text-slate-500">Y:</span>{' '}
              <span className="text-slate-200 font-semibold">{waypoint.y.toFixed(1)} ly</span>
            </div>
            <div className="bg-space-900 p-2.5 rounded-lg border border-space-800">
              <span className="text-slate-500">Z:</span>{' '}
              <span className="text-slate-200 font-semibold">{waypoint.z.toFixed(1)} ly</span>
            </div>
          </div>
        </div>

        {/* Spectral Class / Star Type */}
        {waypoint.primaryStar && (
          <div className="flex items-center space-x-2 text-xs text-slate-300 bg-space-800/60 p-3 rounded-xl border border-space-700/60">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-400">{t.modalPrimaryStar}:</span>
            <span className="font-semibold text-slate-100">{waypoint.primaryStar}</span>
          </div>
        )}

        {/* Notable Scientific Features */}
        {displayFeatures && (
          <div className="space-y-1.5">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {t.modalNotable}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-space-800/40 p-3 rounded-xl border border-space-800">
              {displayFeatures}
            </p>
          </div>
        )}

        {/* Potential Exobiology */}
        {waypoint.exobiologyTypes && waypoint.exobiologyTypes.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.modalExobiology}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {waypoint.exobiologyTypes.map((bio) => (
                <span
                  key={bio}
                  className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-md text-xs font-mono"
                >
                  {bio}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-space-800">
          {waypoint.isAnnounced ? (
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium px-4 py-2 rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>{t.modalCopied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t.modalCopySystem}</span>
                </>
              )}
            </button>
          ) : (
            <div className="text-xs text-slate-500 font-mono italic">
              System name will be broadcast when carrier locks navigation.
            </div>
          )}

          <div className="flex items-center space-x-2">
            {onOpenCalculator && waypoint.isAnnounced && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCalculator(waypoint);
                }}
                className="text-xs text-slate-300 hover:text-cyan-400 bg-space-800 hover:bg-space-700 border border-space-700 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Plan Jump Route
              </button>
            )}
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white bg-space-800 hover:bg-space-700 border border-space-700 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              {t.modalClose}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
