import React, { useState, useEffect } from 'react';
import { Waypoint, Language, NextCarrierTarget } from '../types';
import { i18n } from '../data/i18n';
import { lookupEdsmSystem, MENI_COORDS } from '../services/edsmService';
import {
  X,
  Compass,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Navigation,
  Sparkles,
  Calendar,
  Send,
} from 'lucide-react';

interface WriteInWaypointModalProps {
  isOpen: boolean;
  currentLang: Language;
  waypoints: Waypoint[];
  initialSlotNum?: number | null;
  currentCarrierTarget: NextCarrierTarget;
  onClose: () => void;
  onSaveWaypoint: (updatedWp: Waypoint, setAsNextTarget: boolean, scheduledJumpIso?: string) => void;
}

const GALACTIC_REGION_OPTIONS = [
  "Inner Orion Spur",
  "Hawking's Gap",
  "Dryman's Point",
  "Sagittarius-Carina Arm",
  "Scutum-Centaurus Arm",
  "Galactic Centre",
  "Empyrean Straits",
  "Ryker's Hope",
  "Odin's Hold",
  "Norma Arm",
  "Norma Expanse",
  "Kepler's Crest",
  "The Abyss",
  "Izanami",
  "Mare Somnia",
  "Perseus Arm",
  "Achilles's Altar",
  "Formidine Rift",
  "Outer Arm",
  "Elysian Shore",
  "Sanguineous Rim",
  "Vulkan Gate",
  "Outer Orion Spur",
  "Orion-Cygnus Arm",
  "Tenebris",
  "Arcadian Stream",
  "Newton's Vault",
  "The Conduit",
  "Outer Scutum-Centaurus Arm",
  "Inner Scutum-Centaurus Arm",
  "Odin's Crag",
  "Zephyrus",
  "Acheron",
  "Temple",
  "Inner Orion-Perseus Conflux",
  "The Veils",
  "Errant Marches",
  "Aquila's Halo",
  "Hieronymus Delta",
  "Xibalba",
  "Lyra's Song",
  "The Void",
];

export const WriteInWaypointModal: React.FC<WriteInWaypointModalProps> = ({
  isOpen,
  currentLang,
  waypoints,
  initialSlotNum,
  currentCarrierTarget,
  onClose,
  onSaveWaypoint,
}) => {
  const t = i18n[currentLang];

  // Pick default slot: either provided initialSlotNum or first "To be announced" waypoint (e.g. #7)
  const firstUnannouncedNum =
    waypoints.find((w) => !w.isAnnounced)?.num ?? waypoints.length + 1;

  const [slotMode, setSlotMode] = useState<'existing' | 'new'>('existing');
  const [selectedNum, setSelectedNum] = useState<number>(initialSlotNum ?? firstUnannouncedNum);

  const [cmdrName, setCmdrName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('belka_cmdr_progress_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.cmdrName) return parsed.cmdrName;
      }
    } catch {
      // fallback
    }
    return 'Explorer One';
  });

  const [systemName, setSystemName] = useState<string>('');
  const [region, setRegion] = useState<string>('Sagittarius-Carina Arm');
  const [coordX, setCoordX] = useState<string>('0');
  const [coordY, setCoordY] = useState<string>('0');
  const [coordZ, setCoordZ] = useState<string>('21500');
  const [primaryStar, setPrimaryStar] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [exobiology, setExobiology] = useState<string>('');
  const [setAsNextTarget, setSetAsNextTarget] = useState<boolean>(true);
  const [jumpDateInput, setJumpDateInput] = useState<string>(() => {
    return currentCarrierTarget.scheduledJumpIso.slice(0, 16);
  });

  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
  const [edsmDetails, setEdsmDetails] = useState<{
    distanceFromMeni?: number;
    discoveryCmdr?: string;
    trafficTotal?: number;
    trafficWeek?: number;
  } | null>(null);

  // Sync form fields when modal opens or selected slot changes
  useEffect(() => {
    if (!isOpen) return;
    const targetNum = initialSlotNum ?? firstUnannouncedNum;
    if (targetNum > waypoints.length) {
      setSlotMode('new');
      setSelectedNum(waypoints.length + 1);
      setSystemName('');
      setRegion('Sagittarius-Carina Arm');
      setCoordX('0');
      setCoordY('0');
      setCoordZ('25900');
      setPrimaryStar('');
      setNotes('');
      setExobiology('');
    } else {
      setSlotMode('existing');
      setSelectedNum(targetNum);
      const wp = waypoints.find((w) => w.num === targetNum);
      if (wp) {
        setSystemName(wp.isAnnounced ? wp.system : '');
        setRegion(wp.region || 'Sagittarius-Carina Arm');
        setCoordX(String(wp.x));
        setCoordY(String(wp.y));
        setCoordZ(String(wp.z));
        setPrimaryStar(wp.primaryStar || '');
        setNotes(wp.notableFeatures && wp.isAnnounced ? wp.notableFeatures : '');
        setExobiology(wp.exobiologyTypes ? wp.exobiologyTypes.join(', ') : '');
      }
    }
    setLookupStatus('idle');
    setEdsmDetails(null);
    setJumpDateInput(currentCarrierTarget.scheduledJumpIso.slice(0, 16));
  }, [isOpen, initialSlotNum]);

  // Also refresh fields when switching slot manually inside dropdown
  const handleSlotChange = (val: string) => {
    if (val === 'NEW') {
      setSlotMode('new');
      setSelectedNum(waypoints.length + 1);
      setSystemName('');
      setPrimaryStar('');
      setNotes('');
      setExobiology('');
      setLookupStatus('idle');
      setEdsmDetails(null);
      return;
    }

    const num = Number(val);
    setSlotMode('existing');
    setSelectedNum(num);
    const wp = waypoints.find((w) => w.num === num);
    if (wp) {
      setSystemName(wp.isAnnounced ? wp.system : '');
      setRegion(wp.region || 'Sagittarius-Carina Arm');
      setCoordX(String(wp.x));
      setCoordY(String(wp.y));
      setCoordZ(String(wp.z));
      setPrimaryStar(wp.primaryStar || '');
      setNotes(wp.isAnnounced && wp.notableFeatures ? wp.notableFeatures : '');
      setExobiology(wp.exobiologyTypes ? wp.exobiologyTypes.join(', ') : '');
    }
    setLookupStatus('idle');
    setEdsmDetails(null);
  };

  const handleEdsmLookup = async () => {
    if (!systemName.trim()) return;
    setLookupLoading(true);
    setLookupStatus('idle');

    const info = await lookupEdsmSystem(systemName);
    setLookupLoading(false);

    if (info.found) {
      setLookupStatus('found');
      setSystemName(info.name);
      if (info.coords) {
        setCoordX(String(info.coords.x));
        setCoordY(String(info.coords.y));
        setCoordZ(String(info.coords.z));
      }
      if (info.primaryStar) {
        setPrimaryStar(info.primaryStar);
      }
      setEdsmDetails({
        distanceFromMeni: info.distanceFromMeni,
        discoveryCmdr: info.discoveryCmdr,
        trafficTotal: info.trafficTotal,
        trafficWeek: info.trafficWeek,
      });
    } else {
      setLookupStatus('not_found');
      setEdsmDetails(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSystem = systemName.trim();
    if (!cleanSystem) return;

    const numX = parseFloat(coordX) || 0;
    const numY = parseFloat(coordY) || 0;
    const numZ = parseFloat(coordZ) || 0;

    // Calculate true distance from Meni
    const dx = numX - MENI_COORDS.x;
    const dy = numY - MENI_COORDS.y;
    const dz = numZ - MENI_COORDS.z;
    const distFromMeni = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * 100) / 100;

    const existingWp = waypoints.find((w) => w.num === selectedNum);
    const bioList = exobiology
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedWp: Waypoint = {
      num: selectedNum,
      system: cleanSystem,
      distanceNum: distFromMeni,
      distanceStr: `${distFromMeni.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ly`,
      reached: existingWp?.reached && existingWp.reached !== '0.00%' ? existingWp.reached : 'New',
      visited: existingWp?.visited && existingWp.visited !== '0.00%' ? existingWp.visited : '0.00%',
      isAnnounced: true,
      region,
      regionRu: existingWp?.region === region ? existingWp.regionRu : region,
      x: numX,
      y: numY,
      z: numZ,
      primaryStar: primaryStar.trim() || existingWp?.primaryStar,
      notableFeatures:
        notes.trim() ||
        `Commander-submitted waypoint logged by CMDR ${cmdrName.trim() || 'Explorer'}.`,
      notableFeaturesRu:
        notes.trim() ||
        `Точка пути добавлена командиром CMDR ${cmdrName.trim() || 'Explorer'}.`,
      exobiologyTypes: bioList.length > 0 ? bioList : existingWp?.exobiologyTypes,
      isCustomCmdrEntry: true,
      submittedBy: cmdrName.trim() || 'CMDR',
      submittedAt: new Date().toISOString(),
      edsmVerified: lookupStatus === 'found',
      edsmTrafficTotal: edsmDetails?.trafficTotal,
      edsmTrafficWeek: edsmDetails?.trafficWeek,
      edsmDiscoveryCmdr: edsmDetails?.discoveryCmdr,
    };

    const isoJump = jumpDateInput ? `${jumpDateInput}:00Z` : undefined;
    onSaveWaypoint(updatedWp, setAsNextTarget, isoJump);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-space-900 border border-space-700 w-full max-w-2xl rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-space-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center space-x-2 text-xs font-orbitron text-orange-400 font-bold tracking-wider uppercase">
            <Compass className="w-4 h-4" />
            <span>Belka & Strelka Waypoint Dispatch</span>
          </div>
          <h3 className="font-orbitron text-xl sm:text-2xl font-bold text-white tracking-wide">
            {t.writeModalTitle}
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            {t.writeModalSub}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Slot Selector + Commander Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t.writeModalSlotLabel}</span>
              </label>
              <select
                value={slotMode === 'new' ? 'NEW' : selectedNum}
                onChange={(e) => handleSlotChange(e.target.value)}
                className="w-full bg-space-800 border border-space-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="NEW">
                  + #{waypoints.length + 1} ({t.writeModalAddNewSlot})
                </option>
                {waypoints.map((wp) => (
                  <option key={wp.num} value={wp.num}>
                    #{wp.num} — {wp.isAnnounced ? wp.system : 'To be announced'} ({wp.region})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-orange-400" />
                <span>{t.writeModalCmdrLabel}</span>
              </label>
              <input
                type="text"
                value={cmdrName}
                onChange={(e) => setCmdrName(e.target.value)}
                placeholder="CMDR Name"
                required
                className="w-full bg-space-800 border border-space-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Row 2: System Name + EDSM Live Lookup */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              {t.writeModalSystemLabel}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={systemName}
                onChange={(e) => {
                  setSystemName(e.target.value);
                  setLookupStatus('idle');
                }}
                placeholder={t.writeModalSystemPlaceholder}
                required
                className="flex-1 bg-space-800 border border-space-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleEdsmLookup}
                disabled={lookupLoading || !systemName.trim()}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              >
                {lookupLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.writeModalLookingUp}</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>{t.writeModalLookupBtn}</span>
                  </>
                )}
              </button>
            </div>

            {/* EDSM Lookup Feedback Banner */}
            {lookupStatus === 'found' && (
              <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-300 flex flex-col gap-1">
                <div className="flex items-center space-x-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.writeModalEdsmFound}</span>
                </div>
                {edsmDetails && (
                  <div className="font-mono text-[11px] text-emerald-200/80 pl-6 flex flex-wrap gap-3">
                    {edsmDetails.distanceFromMeni !== undefined && (
                      <span>Dist from Meni: {edsmDetails.distanceFromMeni.toLocaleString()} ly</span>
                    )}
                    {edsmDetails.discoveryCmdr && (
                      <span>Discovered: CMDR {edsmDetails.discoveryCmdr}</span>
                    )}
                    {edsmDetails.trafficTotal !== undefined && (
                      <span>Traffic: {edsmDetails.trafficTotal} ships</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {lookupStatus === 'not_found' && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{t.writeModalEdsmNotFound}</span>
              </div>
            )}
          </div>

          {/* Row 3: Region & Primary Star */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {t.writeModalRegionLabel}
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-space-800 border border-space-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {GALACTIC_REGION_OPTIONS.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.writeModalStarLabel}</span>
              </label>
              <input
                type="text"
                value={primaryStar}
                onChange={(e) => setPrimaryStar(e.target.value)}
                placeholder="e.g. K (Yellow-Orange) Star / Neutron"
                className="w-full bg-space-800 border border-space-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Row 4: Galactic Coordinates (X, Y, Z) */}
          <div className="bg-space-950/60 p-3.5 rounded-xl border border-space-800 space-y-2">
            <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              {t.modalCoords} (Sol = 0, 0, 0)
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono text-slate-500 block mb-1">X (ly)</label>
                <input
                  type="number"
                  step="any"
                  value={coordX}
                  onChange={(e) => setCoordX(e.target.value)}
                  className="w-full bg-space-800 border border-space-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-500 block mb-1">Y (ly)</label>
                <input
                  type="number"
                  step="any"
                  value={coordY}
                  onChange={(e) => setCoordY(e.target.value)}
                  className="w-full bg-space-800 border border-space-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono text-slate-500 block mb-1">Z (ly)</label>
                <input
                  type="number"
                  step="any"
                  value={coordZ}
                  onChange={(e) => setCoordZ(e.target.value)}
                  className="w-full bg-space-800 border border-space-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Exobiology & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {t.modalExobiology} (comma separated)
              </label>
              <input
                type="text"
                value={exobiology}
                onChange={(e) => setExobiology(e.target.value)}
                placeholder="Stratum Tectonicas, Bacterium..."
                className="w-full bg-space-800 border border-space-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                {t.writeModalNotesLabel}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.writeModalNotesPlaceholder}
                className="w-full bg-space-800 border border-space-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Row 6: Set as Active Next Carrier Jump Target */}
          <div className="bg-space-800/60 border border-orange-500/30 rounded-xl p-4 space-y-3">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={setAsNextTarget}
                onChange={(e) => setSetAsNextTarget(e.target.checked)}
                className="w-4 h-4 accent-orange-500 rounded"
              />
              <span className="text-xs sm:text-sm font-semibold text-orange-300">
                {t.writeModalSetTargetLabel}
              </span>
            </label>

            {setAsNextTarget && (
              <div className="pl-6 space-y-1.5">
                <label className="text-xs text-slate-400 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.writeModalJumpTimeLabel}</span>
                </label>
                <input
                  type="datetime-local"
                  value={jumpDateInput}
                  onChange={(e) => setJumpDateInput(e.target.value)}
                  className="bg-space-900 border border-space-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-space-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-space-800 hover:bg-space-750 border border-space-700 transition-colors cursor-pointer"
            >
              {t.modalClose}
            </button>
            <button
              type="submit"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-md transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{t.writeModalSaveBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
