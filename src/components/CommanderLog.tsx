import React, { useState, useEffect } from 'react';
import { Waypoint, Language, CommanderProgress } from '../types';
import { i18n } from '../data/i18n';
import { CheckSquare, User, Ship, Check, Award, RotateCcw } from 'lucide-react';

interface CommanderLogProps {
  currentLang: Language;
  waypoints: Waypoint[];
  onSelectWaypoint: (wp: Waypoint) => void;
}

const STORAGE_KEY = 'belka_cmdr_progress_v1';

export const CommanderLog: React.FC<CommanderLogProps> = ({
  currentLang,
  waypoints,
  onSelectWaypoint,
}) => {
  const t = i18n[currentLang];

  const [progress, setProgress] = useState<CommanderProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          cmdrName: typeof parsed?.cmdrName === 'string' ? parsed.cmdrName : 'Explorer One',
          shipName: typeof parsed?.shipName === 'string' ? parsed.shipName : 'DSS Horizon',
          jumpRange: typeof parsed?.jumpRange === 'number' ? parsed.jumpRange : 65,
          visitedWaypointIds: Array.isArray(parsed?.visitedWaypointIds) ? parsed.visitedWaypointIds : [1],
          reachedWaypointIds: Array.isArray(parsed?.reachedWaypointIds) ? parsed.reachedWaypointIds : [1, 2],
          notes: parsed?.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
        };
      }
    } catch {
      // fallback
    }
    return {
      cmdrName: 'Explorer One',
      shipName: 'DSS Horizon',
      jumpRange: 65,
      visitedWaypointIds: [1], // Meni starting system
      reachedWaypointIds: [1, 2],
      notes: {},
    };
  });

  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // ignore
    }
  }, [progress]);

  const toggleVisited = (num: number) => {
    setProgress(prev => {
      const visitedList = Array.isArray(prev.visitedWaypointIds) ? prev.visitedWaypointIds : [];
      const reachedList = Array.isArray(prev.reachedWaypointIds) ? prev.reachedWaypointIds : [];
      const exists = visitedList.includes(num);
      const updatedVisited = exists
        ? visitedList.filter(id => id !== num)
        : [...visitedList, num];
      
      // If visited, ensure it's also marked reached
      const updatedReached = (!exists && !reachedList.includes(num))
        ? [...reachedList, num]
        : reachedList;

      return {
        ...prev,
        visitedWaypointIds: updatedVisited,
        reachedWaypointIds: updatedReached,
      };
    });
  };

  const toggleReached = (num: number) => {
    setProgress(prev => {
      const reachedList = Array.isArray(prev.reachedWaypointIds) ? prev.reachedWaypointIds : [];
      const exists = reachedList.includes(num);
      return {
        ...prev,
        reachedWaypointIds: exists
          ? reachedList.filter(id => id !== num)
          : [...reachedList, num],
      };
    });
  };

  const handleSaveNote = (num: number) => {
    setProgress(prev => ({
      ...prev,
      notes: {
        ...prev.notes,
        [num]: noteDraft,
      },
    }));
    setEditingNoteId(null);
  };

  const handleReset = () => {
    if (window.confirm(t.cmdrResetConfirm)) {
      setProgress({
        cmdrName: 'Explorer One',
        shipName: 'DSS Horizon',
        jumpRange: 65,
        visitedWaypointIds: [1],
        reachedWaypointIds: [1],
        notes: {},
      });
    }
  };

  // Only consider announced waypoints or initial 22 for progress metrics
  const announcedCount = waypoints.filter(w => w.isAnnounced).length;
  const safeVisitedIds = Array.isArray(progress?.visitedWaypointIds) ? progress.visitedWaypointIds : [];
  const safeReachedIds = Array.isArray(progress?.reachedWaypointIds) ? progress.reachedWaypointIds : [];
  const visitedCount = safeVisitedIds.filter(id => waypoints.some(w => w.num === id)).length;
  const progressPct = announcedCount > 0 ? Math.round((visitedCount / announcedCount) * 100) : 0;

  return (
    <section className="bg-space-900 border border-space-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
            <h3 className="font-orbitron text-lg sm:text-xl font-bold text-white tracking-wide">
              {t.cmdrTitle}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.cmdrSub}
          </p>
        </div>

        <button
          onClick={handleReset}
          className="self-start sm:self-auto flex items-center space-x-1.5 text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg border border-space-700 hover:border-rose-500/40 bg-space-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Progress</span>
        </button>
      </div>

      {/* Commander Profile Inputs & Progress Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-space-950/60 p-5 rounded-xl border border-space-800">
        
        {/* CMDR Name */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.cmdrNameLabel}</span>
          </label>
          <input
            type="text"
            value={progress.cmdrName}
            onChange={(e) => setProgress({ ...progress, cmdrName: e.target.value })}
            className="w-full bg-space-800 border border-space-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Ship Name */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium flex items-center space-x-1.5">
            <Ship className="w-3.5 h-3.5 text-orange-400" />
            <span>{t.cmdrShipLabel}</span>
          </label>
          <input
            type="text"
            value={progress.shipName}
            onChange={(e) => setProgress({ ...progress, shipName: e.target.value })}
            className="w-full bg-space-800 border border-space-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Completion Indicator */}
        <div className="space-y-1.5 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.cmdrProgressLabel}</span>
            </span>
            <span className="font-orbitron font-bold text-cyan-400">
              {visitedCount} / {announcedCount} ({progressPct}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-space-800 rounded-full overflow-hidden border border-space-700">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

      </div>

      {/* Checklist Table */}
      <div className="overflow-x-auto rounded-xl border border-space-700 bg-space-950/40">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-space-800 bg-space-900/80 text-xs font-orbitron text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">System</th>
              <th className="py-3 px-4">Region</th>
              <th className="py-3 px-4 text-center">Reached</th>
              <th className="py-3 px-4 text-center">Visited (Touchdown)</th>
              <th className="py-3 px-4">Log Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-space-800/60 text-xs sm:text-sm text-slate-300">
            {waypoints.slice(0, 22).map((wp) => {
              const isReached = safeReachedIds.includes(wp.num);
              const isVisited = safeVisitedIds.includes(wp.num);
              const noteText = progress?.notes?.[wp.num] || '';

              return (
                <tr key={wp.num} className="hover:bg-space-800/40 transition-colors">
                  <td className="py-3 px-4 font-orbitron font-semibold text-cyan-400">
                    #{wp.num}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onSelectWaypoint(wp)}
                      className="font-medium text-slate-200 hover:text-cyan-400 transition-colors text-left"
                    >
                      {wp.isAnnounced ? wp.system : 'To be announced'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs">
                    {currentLang === 'ru' && wp.regionRu ? wp.regionRu : wp.region}
                  </td>

                  {/* Reached Checkbox */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleReached(wp.num)}
                      className={`w-6 h-6 rounded-md inline-flex items-center justify-center border transition-colors cursor-pointer ${
                        isReached
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                          : 'bg-space-800 border-space-700 text-transparent hover:border-slate-500'
                      }`}
                      title="Toggle Reached status"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </td>

                  {/* Visited Checkbox */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleVisited(wp.num)}
                      className={`w-6 h-6 rounded-md inline-flex items-center justify-center border transition-colors cursor-pointer ${
                        isVisited
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                          : 'bg-space-800 border-space-700 text-transparent hover:border-slate-500'
                      }`}
                      title="Toggle Visited / First Footfall status"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </td>

                  {/* Log Note */}
                  <td className="py-3 px-4">
                    {editingNoteId === wp.num ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder={t.cmdrNotesPlaceholder}
                          className="bg-space-800 border border-cyan-500 rounded px-2.5 py-1 text-xs text-slate-100 w-full focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveNote(wp.num)}
                          className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1 rounded cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setEditingNoteId(wp.num);
                          setNoteDraft(noteText);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer truncate max-w-xs"
                      >
                        {noteText ? (
                          <span className="text-slate-200 italic">{noteText}</span>
                        ) : (
                          <span className="text-slate-600">+ Add note...</span>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
