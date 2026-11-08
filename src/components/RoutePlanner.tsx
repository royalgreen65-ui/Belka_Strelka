import React, { useState } from 'react';
import { Waypoint, Language } from '../types';
import { i18n } from '../data/i18n';
import { Rocket, Fuel, Zap, Clock, Navigation } from 'lucide-react';

interface RoutePlannerProps {
  currentLang: Language;
  waypoints: Waypoint[];
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({ currentLang, waypoints }) => {
  const t = i18n[currentLang];

  const announcedWaypoints = waypoints.filter(wp => wp.isAnnounced);

  const [fromNum, setFromNum] = useState<number>(1); // Meni
  const [toNum, setToNum] = useState<number>(6); // Cyookaea DW-N e6-1
  const [jumpRange, setJumpRange] = useState<number>(65); // standard exploration DBX/Phantom
  const [useNeutron, setUseNeutron] = useState<boolean>(false);

  const fromWp = waypoints.find(w => w.num === fromNum) || waypoints[0];
  const toWp = waypoints.find(w => w.num === toNum) || waypoints[1];

  // 3D Euclidean distance calculation
  const dx = toWp.x - fromWp.x;
  const dy = toWp.y - fromWp.y;
  const dz = toWp.z - fromWp.z;
  const directDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Practical route factor in Elite Dangerous (usually ~1.08x - 1.15x direct distance due to star distribution)
  const routeDistance = directDistance * 1.12;

  // Carrier calculations (Carrier max jump is 500 ly)
  const carrierJumps = Math.ceil(directDistance / 500);
  // Average Tritium: ~120 tons per 500ly jump for a typical carrier loadout
  const estimatedTritium = carrierJumps * 125;

  // Ship calculations
  const effectiveShipRange = useNeutron ? jumpRange * 3.8 : jumpRange;
  const estimatedShipJumps = Math.max(1, Math.ceil(routeDistance / Math.max(effectiveShipRange, 10)));
  
  // Time estimate: standard honk-and-jump is ~45s per jump
  const estimatedSeconds = estimatedShipJumps * 45;
  const hours = Math.floor(estimatedSeconds / 3600);
  const minutes = Math.floor((estimatedSeconds % 3600) / 60);

  return (
    <section className="bg-space-900 border border-space-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Rocket className="w-5 h-5 text-orange-400 shrink-0" />
            <h3 className="font-orbitron text-lg sm:text-xl font-bold text-white tracking-wide">
              {t.calcTitle}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.calcSub}
          </p>
        </div>
      </div>

      {/* Input Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-space-950/60 p-5 rounded-xl border border-space-800">
        
        {/* From Selector */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            {t.calcFromWP}
          </label>
          <select
            value={fromNum}
            onChange={(e) => setFromNum(Number(e.target.value))}
            className="w-full bg-space-800 border border-space-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {announcedWaypoints.map((wp) => (
              <option key={wp.num} value={wp.num}>
                #{wp.num} - {wp.system} ({wp.region})
              </option>
            ))}
          </select>
        </div>

        {/* To Selector */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            {t.calcToWP}
          </label>
          <select
            value={toNum}
            onChange={(e) => setToNum(Number(e.target.value))}
            className="w-full bg-space-800 border border-space-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {announcedWaypoints.map((wp) => (
              <option key={wp.num} value={wp.num}>
                #{wp.num} - {wp.system} ({wp.region})
              </option>
            ))}
          </select>
        </div>

        {/* Ship Range & Options */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider flex justify-between">
            <span>{t.calcShipRange}</span>
            <span className="font-mono text-cyan-400">{jumpRange} ly</span>
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="25"
              max="90"
              step="1"
              value={jumpRange}
              onChange={(e) => setJumpRange(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={useNeutron}
                onChange={(e) => setUseNeutron(e.target.checked)}
                className="accent-cyan-500 rounded"
              />
              <span className="text-slate-300">Neutron Highway (4x boost)</span>
            </label>
            <div className="text-[11px] text-slate-500 font-mono">
              Presets: <button onClick={() => setJumpRange(50)} className="hover:text-cyan-400 underline mr-1">50ly</button>
              <button onClick={() => setJumpRange(68)} className="hover:text-cyan-400 underline mr-1">68ly</button>
              <button onClick={() => setJumpRange(80)} className="hover:text-cyan-400 underline">80ly</button>
            </div>
          </div>
        </div>
      </div>

      {/* Calculated Results Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Direct Vector Distance */}
        <div className="bg-space-800/60 border border-space-700/80 p-4 rounded-xl space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>Direct Vector Distance</span>
          </div>
          <div className="font-orbitron text-xl font-bold text-white tabular-nums">
            {directDistance.toLocaleString('en-US', { maximumFractionDigits: 1 })} <span className="text-xs font-normal text-slate-400 font-mono">ly</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Est. Star Path: ~{routeDistance.toLocaleString('en-US', { maximumFractionDigits: 1 })} ly
          </div>
        </div>

        {/* Carrier Jumps */}
        <div className="bg-space-800/60 border border-space-700/80 p-4 rounded-xl space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Rocket className="w-3.5 h-3.5 text-orange-400" />
            <span>{t.calcCarrierJumps}</span>
          </div>
          <div className="font-orbitron text-xl font-bold text-orange-400 tabular-nums">
            {carrierJumps} <span className="text-xs font-normal text-slate-400 font-mono">jumps</span>
          </div>
          <div className="text-[11px] text-slate-400">
            ~15 min spinup / cooldown per jump
          </div>
        </div>

        {/* Ship Hyperspace Jumps */}
        <div className="bg-space-800/60 border border-space-700/80 p-4 rounded-xl space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.calcShipJumps}</span>
          </div>
          <div className="font-orbitron text-xl font-bold text-cyan-400 tabular-nums">
            {estimatedShipJumps} <span className="text-xs font-normal text-slate-400 font-mono">jumps</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {useNeutron ? 'Utilizing neutron star boosts' : 'Standard scoop & jump'}
          </div>
        </div>

        {/* Estimated Tritium / Time */}
        <div className="bg-space-800/60 border border-space-700/80 p-4 rounded-xl space-y-1">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Fuel className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.calcTritiumEst}</span>
          </div>
          <div className="font-orbitron text-xl font-bold text-amber-400 tabular-nums">
            ~{estimatedTritium.toLocaleString()} <span className="text-xs font-normal text-slate-400 font-mono">T</span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-slate-400">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Est. Flight Time: {hours > 0 ? `${hours}h ` : ''}{minutes}m</span>
          </div>
        </div>

      </div>

      {/* Suggested Legs Strip */}
      <div className="bg-space-800/30 border border-space-800 p-4 rounded-xl text-xs text-slate-400 space-y-2">
        <div className="font-semibold text-slate-300">
          Featured Expedition Legs:
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setFromNum(1); setToNum(6); }}
            className="px-2.5 py-1 rounded bg-space-800 hover:bg-space-750 text-slate-300 hover:text-cyan-400 border border-space-700 transition-colors"
          >
            Leg 1: Meni (#1) → Cyookaea (#6) [~19,663 ly]
          </button>
          <button
            onClick={() => { setFromNum(6); setToNum(11); }}
            className="px-2.5 py-1 rounded bg-space-800 hover:bg-space-750 text-slate-300 hover:text-cyan-400 border border-space-700 transition-colors"
          >
            Leg 2: Cyookaea (#6) → Stuemeae / Sag A* (#11) [~13,117 ly]
          </button>
          <button
            onClick={() => { setFromNum(11); setToNum(19); }}
            className="px-2.5 py-1 rounded bg-space-800 hover:bg-space-750 text-slate-300 hover:text-cyan-400 border border-space-700 transition-colors"
          >
            Leg 3: Stuemeae (#11) → Xeehao / Abyss (#19) [~22,780 ly]
          </button>
        </div>
      </div>
    </section>
  );
};
