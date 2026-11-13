import React, { useState, useMemo } from 'react';
import { Waypoint, Language } from '../types';
import { i18n } from '../data/i18n';
import { GALAXY_LANDMARKS } from '../data/expeditionData';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Compass,
  ExternalLink,
  Layers,
  HelpCircle,
  X,
  Radio,
  Sparkles,
  Map as MapIcon,
  Crosshair,
  Flame,
  CheckCircle2,
  Key,
} from 'lucide-react';

interface GalaxyMapVisualizerProps {
  currentLang: Language;
  waypoints: Waypoint[];
  onSelectWaypoint: (wp: Waypoint) => void;
  selectedWaypointNum?: number;
}

// 42 Official Elite Dangerous Galactic Regions with exact game coordinates (ly)
const OFFICIAL_GALACTIC_REGIONS = [
  { id: 1, name: 'Galactic Centre', nameRu: 'Центр галактики', x: 0, z: 25900, radius: 5500 },
  { id: 2, name: 'Empyrean Straits', nameRu: 'Эмпирейские проливы', x: -4500, z: 27500, radius: 5000 },
  { id: 3, name: "Ryker's Hope", nameRu: 'Надежда Райкера', x: -8000, z: 32000, radius: 5000 },
  { id: 4, name: "Odin's Hold", nameRu: 'Твердыня Одина', x: -11500, z: 36000, radius: 5500 },
  { id: 5, name: 'Norma Arm', nameRu: 'Рукав Наугольника', x: -15000, z: 40000, radius: 5500 },
  { id: 6, name: "Kepler's Crest", nameRu: 'Гребень Кеплера', x: -18500, z: 46000, radius: 6500 },
  { id: 7, name: 'The Abyss', nameRu: 'Бездна', x: -8000, z: 54000, radius: 8000 },
  { id: 8, name: 'Izanami', nameRu: 'Идзанами', x: -1000, z: 58000, radius: 6000 },
  { id: 9, name: 'Mare Somnia', nameRu: 'Море снов', x: 6000, z: 60000, radius: 6000 },
  { id: 10, name: 'Perseus Arm', nameRu: 'Рукав Персея', x: 14000, z: 54000, radius: 7500 },
  { id: 11, name: "Achilles's Altar", nameRu: 'Алтарь Ахилла', x: 19000, z: 47000, radius: 6500 },
  { id: 12, name: 'Formidine Rift', nameRu: 'Формидинский разлом', x: 18000, z: 38000, radius: 7500 },
  { id: 13, name: 'Outer Arm', nameRu: 'Внешний рукав', x: 16000, z: 28000, radius: 7500 },
  { id: 14, name: 'Elysian Shore', nameRu: 'Элисийский берег', x: 13000, z: 18000, radius: 7000 },
  { id: 15, name: 'Sanguineous Rim', nameRu: 'Кровавый обод', x: 8000, z: 9000, radius: 6000 },
  { id: 16, name: 'Inner Orion Spur', nameRu: 'Внутренний рукав Ориона', x: 0, z: 1000, radius: 4500 },
  { id: 17, name: "Hawking's Gap", nameRu: 'Щель Хокинга', x: 5000, z: 11500, radius: 5000 },
  { id: 18, name: "Dryman's Point", nameRu: 'Точка Драймана', x: 7500, z: 17000, radius: 5500 },
  { id: 19, name: 'Sagittarius-Carina Arm', nameRu: 'Рукав Стрельца-Киля', x: 9500, z: 23000, radius: 6500 },
  { id: 20, name: 'Scutum-Centaurus Arm', nameRu: 'Рукав Щита-Центавра', x: 7000, z: 32000, radius: 6500 },
];

export const GalaxyMapVisualizer: React.FC<GalaxyMapVisualizerProps> = ({
  currentLang,
  waypoints,
  onSelectWaypoint,
  selectedWaypointNum,
}) => {
  const t = i18n[currentLang];

  // Primary view switcher: Route Vector Overlay with Real Game Tiles vs Live Embedded EDAstro
  const [viewMode, setViewMode] = useState<'overlay' | 'embed'>('overlay');

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredWp, setHoveredWp] = useState<Waypoint | null>(null);

  // Map layer switches:
  // 'edastro': True Elite Dangerous Galaxy Raster Tiles (from EDAstro)
  // 'heatmap': True Exploration Density Heatmap (from EDAstro)
  // 'tactical': Procedural Minimal Dark Radar
  const [rasterLayer, setRasterLayer] = useState<'edastro' | 'heatmap' | 'tactical'>('edastro');
  const [showRegions, setShowRegions] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Exact Astrometric Projection (Derived directly from EDAstro GalMap projection formulas):
  // Bounds: 81920 ly half-width. Center: (0, 25000 ly).
  // SVG Canvas: 800 x 800.
  // sx = 400 + (gx / 81920) * 400;
  // sy = 400 - ((gz - 25000) / 81920) * 400;
  const toSvgCoords = (gx: number, gz: number) => {
    const sx = 400 + (gx / 81920) * 400;
    const sy = 400 - ((gz - 25000) / 81920) * 400;
    return { sx, sy };
  };

  // Trajectory polyline
  const routePointsString = useMemo(() => {
    return waypoints
      .map((wp) => {
        const { sx, sy } = toSvgCoords(wp.x, wp.z);
        return `${sx.toFixed(1)},${sy.toFixed(1)}`;
      })
      .join(' ');
  }, [waypoints]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (factor: number) => {
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.6), 4));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // 4x4 Grid of EDAstro zoom 2 raster tiles (200x200 each inside 800x800)
  const tileIndices = [0, 1, 2, 3];

  return (
    <section className="bg-space-900 border border-space-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md relative overflow-hidden">
      
      {/* Title & Cartographic Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-amber-400 shrink-0" />
            <h3 className="font-orbitron text-lg sm:text-xl font-bold text-white tracking-wide">
              {t.mapTitle}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.mapSub}
          </p>
        </div>

        {/* Real Game Map Action Buttons & Guide */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main FAQ / API Guide Button */}
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.mapGuideBtn}</span>
          </button>

          {/* Live EDSM 3D Galaxy Map link */}
          <a
            href="https://www.edsm.net/en/map/galaxy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-space-800 hover:bg-space-750 text-cyan-400 border border-space-700 hover:border-cyan-500/40 transition-colors cursor-pointer"
            title="Open EDSM's Interactive 3D WebGL Galaxy Map"
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>{t.mapOpenEDSM3D}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* External EDAstro GalMap link */}
          <a
            href="https://edastro.com/galmap/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-space-800 hover:bg-space-750 text-slate-200 border border-space-700 hover:border-cyan-500/40 transition-colors cursor-pointer"
            title="Open EDAstro in full browser window"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.mapOpenEDAstro}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Primary View Switcher: Overlay Chart vs Live Embedded EDAstro */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-space-950/70 p-2.5 rounded-xl border border-space-800">
        
        {/* Mode Tabs */}
        <div className="flex items-center gap-1.5 bg-space-900 p-1 rounded-lg border border-space-700">
          <button
            type="button"
            onClick={() => setViewMode('overlay')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'overlay'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{t.mapViewRouteOverlay}</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('embed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer flex items-center space-x-1.5 ${
              viewMode === 'embed'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t.mapViewLiveGalMap}</span>
          </button>
        </div>

        {/* Sub-Controls for Overlay Mode */}
        {viewMode === 'overlay' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Base Tile Layer Toggle */}
            <div className="bg-space-800 p-1 rounded-lg flex items-center border border-space-700">
              <button
                type="button"
                onClick={() => setRasterLayer('edastro')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center space-x-1 ${
                  rasterLayer === 'edastro'
                    ? 'bg-cyan-500 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Real in-game galaxy star density tiles from EDAstro"
              >
                <Sparkles className="w-3 h-3" />
                <span>{t.mapLayerEDAstro}</span>
              </button>
              <button
                type="button"
                onClick={() => setRasterLayer('heatmap')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center space-x-1 ${
                  rasterLayer === 'heatmap'
                    ? 'bg-orange-500 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Galactic exploration and commander travel traffic heatmap"
              >
                <Flame className="w-3 h-3" />
                <span>{t.mapLayerHeatmap}</span>
              </button>
              <button
                type="button"
                onClick={() => setRasterLayer('tactical')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  rasterLayer === 'tactical'
                    ? 'bg-amber-500 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.mapLayerTactical}
              </button>
            </div>

            {/* Region Overlays */}
            <button
              type="button"
              onClick={() => setShowRegions(!showRegions)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                showRegions
                  ? 'bg-space-800 text-cyan-400 border-cyan-500/40 font-semibold'
                  : 'text-slate-500 border-space-700 hover:text-slate-300'
              }`}
            >
              {t.mapLayerRegions}
            </button>

            {/* Grid Rings */}
            <button
              type="button"
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                showGrid
                  ? 'bg-space-800 text-amber-400 border-amber-500/40 font-semibold'
                  : 'text-slate-500 border-space-700 hover:text-slate-300'
              }`}
            >
              Grid
            </button>

            {/* Zoom / Pan Controls */}
            <div className="flex items-center space-x-1 bg-space-800/90 border border-space-700 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleZoom(1.25)}
                className="p-1 text-slate-300 hover:text-cyan-400 hover:bg-space-700 rounded-md transition-colors cursor-pointer"
                title={t.mapZoomIn}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleZoom(0.8)}
                className="p-1 text-slate-300 hover:text-cyan-400 hover:bg-space-700 rounded-md transition-colors cursor-pointer"
                title={t.mapZoomOut}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="p-1 text-slate-300 hover:text-amber-400 hover:bg-space-700 rounded-md transition-colors cursor-pointer"
                title={t.mapReset}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {viewMode === 'embed' && (
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Direct Live EDAstro Cartography (Deep Zoom, Star Search & DSSA Carriers)</span>
          </div>
        )}
      </div>

      {/* Main View Area */}
      {viewMode === 'overlay' ? (
        <div
          className="w-full h-[560px] sm:h-[680px] bg-[#02040a] rounded-xl border border-space-800 relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Background starlight dots */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#f97316 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
              backgroundPosition: '0 0, 24px 24px',
            }}
          />

          {/* SVG Map Container */}
          <svg
            viewBox="0 0 800 800"
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <defs>
              {/* Galactic Core Glow */}
              <radialGradient id="galacticCoreGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="15%" stopColor="#fef08a" stopOpacity="0.8" />
                <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.5" />
                <stop offset="65%" stopColor="#ea580c" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#030712" stopOpacity="0" />
              </radialGradient>

              <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* REAL ELITE DANGEROUS GALAXY MAP TILES (EDAstro Cartographic Tiles) */}
            {(rasterLayer === 'edastro' || rasterLayer === 'heatmap') && (
              <g className="opacity-95 pointer-events-none">
                {tileIndices.map((y) =>
                  tileIndices.map((x) => (
                    <image
                      key={`ed-tile-${rasterLayer}-${x}-${y}`}
                      href={`https://edastro.com/galmap/tiles/${
                        rasterLayer === 'edastro' ? 'galaxy' : 'indexedheat'
                      }/2/${x}/${y}.png`}
                      x={x * 200}
                      y={y * 200}
                      width={200}
                      height={200}
                      preserveAspectRatio="none"
                      crossOrigin="anonymous"
                    />
                  ))
                )}
              </g>
            )}

            {/* Tactical Fallback Spiral when tiles are disabled */}
            {rasterLayer === 'tactical' && (
              <g className="opacity-70 pointer-events-none">
                <ellipse cx="400" cy="400" rx="340" ry="340" fill="none" stroke="#172554" strokeWidth="80" strokeOpacity="0.1" />
                <path d="M 400 400 Q 490 320 560 210 T 480 60 T 310 30" fill="none" stroke="#38bdf8" strokeWidth="16" strokeOpacity="0.12" strokeLinecap="round" />
                <path d="M 400 400 Q 310 480 220 580 T 330 710 T 540 680" fill="none" stroke="#38bdf8" strokeWidth="18" strokeOpacity="0.12" strokeLinecap="round" />
              </g>
            )}

            {/* Concentric Distance Rings from Galactic Center (Sagittarius A*) */}
            {showGrid &&
              [10000, 20000, 30000, 42000].map((radiusLy) => {
                const rSvg = (radiusLy / 81920) * 400;
                return (
                  <g key={radiusLy} className="pointer-events-none">
                    <circle
                      cx="400"
                      cy="395.6"
                      r={rSvg}
                      fill="none"
                      stroke="#334155"
                      strokeWidth="0.8"
                      strokeDasharray="4 6"
                      strokeOpacity="0.5"
                    />
                    <text
                      x={400 + rSvg + 4}
                      y="393"
                      fill="#64748b"
                      fontSize="8.5"
                      fontFamily="monospace"
                    >
                      {radiusLy.toLocaleString()} ly
                    </text>
                  </g>
                );
              })}

            {/* Coordinate Crosshairs */}
            {showGrid && (
              <g className="pointer-events-none opacity-40">
                <line x1="60" y1="395.6" x2="740" y2="395.6" stroke="#475569" strokeWidth="0.8" strokeDasharray="2 4" />
                <line x1="400" y1="50" x2="400" y2="750" stroke="#475569" strokeWidth="0.8" strokeDasharray="2 4" />
              </g>
            )}

            {/* Official 42 Frontier Codex Regions Overlay */}
            {showRegions &&
              OFFICIAL_GALACTIC_REGIONS.map((reg) => {
                const { sx, sy } = toSvgCoords(reg.x, reg.z);
                const rSvg = (reg.radius / 81920) * 400;
                const name = currentLang === 'ru' ? reg.nameRu : reg.name;

                return (
                  <g key={reg.id} className="pointer-events-none">
                    <circle
                      cx={sx}
                      cy={sy}
                      r={rSvg}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="0.8"
                      strokeDasharray="3 4"
                      strokeOpacity="0.3"
                    />
                    <text
                      x={sx}
                      y={sy}
                      fill="#94a3b8"
                      fontSize="7.5"
                      fontFamily="sans-serif"
                      textAnchor="middle"
                      fillOpacity="0.75"
                    >
                      {name}
                    </text>
                  </g>
                );
              })}

            {/* Galactic Core Glow (Sagittarius A*) */}
            <circle cx="400" cy="395.6" r="35" fill="url(#galacticCoreGlow)" className="pointer-events-none" />

            {/* Circumnavigation Trajectory Polyline */}
            <polyline
              points={routePointsString}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.4"
              strokeDasharray="6 3"
              strokeOpacity="0.9"
            />

            {/* Major Game Landmarks (Sol, Sag A*, Beagle Point, Colonia) */}
            {GALAXY_LANDMARKS.map((lm) => {
              const { sx, sy } = toSvgCoords(lm.x, lm.z);
              return (
                <g key={lm.name} className="pointer-events-none">
                  <circle
                    cx={sx}
                    cy={sy}
                    r={lm.isCore ? 6 : lm.isHub ? 5 : 4}
                    fill={lm.color}
                    filter={lm.isCore ? 'url(#glowFilter)' : undefined}
                  />
                  <text
                    x={sx + 8}
                    y={sy + 3}
                    fill={lm.color}
                    fontSize="9.5"
                    fontFamily="sans-serif"
                    fontWeight="600"
                  >
                    {lm.name}
                  </text>
                </g>
              );
            })}

            {/* Waypoint Nodes (88 Total) */}
            {waypoints.map((wp) => {
              const { sx, sy } = toSvgCoords(wp.x, wp.z);
              const isSelected = selectedWaypointNum === wp.num;
              const isHovered = hoveredWp?.num === wp.num;
              const isMeni = wp.num === 1;

              return (
                <g
                  key={wp.num}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectWaypoint(wp);
                  }}
                  onMouseEnter={() => setHoveredWp(wp)}
                  onMouseLeave={() => setHoveredWp(null)}
                  className="cursor-pointer transition-transform"
                >
                  {/* Selected / Start Ring */}
                  {(isSelected || isMeni) && (
                    <circle
                      cx={sx}
                      cy={sy}
                      r={isSelected ? 11 : 9}
                      fill="none"
                      stroke={isSelected ? '#06b6d4' : '#f97316'}
                      strokeWidth="1.8"
                      strokeOpacity="0.95"
                    />
                  )}

                  {/* Waypoint Dot */}
                  <circle
                    cx={sx}
                    cy={sy}
                    r={isSelected || isHovered ? 6 : wp.isAnnounced ? 4.2 : 2.5}
                    fill={isMeni ? '#f97316' : wp.isAnnounced ? '#06b6d4' : '#64748b'}
                    stroke="#02040a"
                    strokeWidth="1.2"
                  />

                  {/* Node label */}
                  {(wp.isAnnounced || isHovered || isSelected) && (
                    <text
                      x={sx + 7}
                      y={sy - 4}
                      fill={isSelected ? '#38bdf8' : wp.isAnnounced ? '#f1f5f9' : '#94a3b8'}
                      fontSize={isSelected ? '10' : '8.5'}
                      fontFamily="monospace"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      #{wp.num} {wp.isAnnounced ? wp.system : ''}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover / Inspection Card */}
          {hoveredWp && (
            <div className="absolute bottom-4 left-4 bg-space-900/95 border border-cyan-500/40 backdrop-blur-md p-3.5 rounded-xl text-xs max-w-xs shadow-xl pointer-events-none space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="font-orbitron font-bold text-cyan-400">
                  Waypoint #{hoveredWp.num}
                </span>
                <span className="font-mono text-slate-400">{hoveredWp.distanceStr}</span>
              </div>
              <div className="text-slate-100 font-semibold truncate">
                {!hoveredWp.isAnnounced && currentLang === 'ru' ? 'Будет объявлено' : hoveredWp.system}
              </div>
              <div className="text-slate-400 text-[11px]">
                {currentLang === 'ru' && hoveredWp.regionRu ? hoveredWp.regionRu : hoveredWp.region}
              </div>
              <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-slate-300 border-t border-space-800">
                <span>Reached: {hoveredWp.reached}</span>
                <span>Visited: {hoveredWp.visited}</span>
              </div>
            </div>
          )}

          {/* Astrometric Orientation HUD (Beagle Point North / Sol South) */}
          <div className="absolute top-4 right-4 bg-space-900/85 border border-space-700/80 p-2.5 rounded-xl text-center text-[10px] font-mono text-slate-400 backdrop-blur-sm pointer-events-none">
            <div className="text-cyan-400 font-bold mb-0.5">NORTH (+Z: Beagle Point)</div>
            <div className="flex justify-between gap-4">
              <span>-X: WEST</span>
              <span>+X: EAST</span>
            </div>
            <div className="text-amber-400 font-bold mt-0.5">SOUTH (-Z: Sol / Bubble)</div>
          </div>
        </div>
      ) : (
        /* LIVE EMBEDDED EDASTRO GALMAP (Deep Zoom, Star Search & DSSA Fleet Carriers) */
        <div className="w-full h-[620px] sm:h-[720px] rounded-xl border border-space-800 relative overflow-hidden bg-space-950">
          <iframe
            src="https://edastro.com/galmap/"
            title="EDAstro Interactive GalMap"
            className="w-full h-full border-0"
            allow="fullscreen"
          />
        </div>
      )}

      {/* Map Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400 pt-2 border-t border-space-800">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
          <span>{t.mapLegendSol}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span>{t.mapLegendCore}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
          <span>{t.mapLegendWaypoint}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
          <span>{t.filterTBA}</span>
        </div>
      </div>

      {/* Cartography & API Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="bg-space-900 border border-space-700 w-full max-w-2xl rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-space-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs font-orbitron text-amber-400 font-bold tracking-wider uppercase">
                <Compass className="w-4 h-4" />
                <span>Elite Dangerous Cartography & API System</span>
              </div>
              <h3 className="font-orbitron text-xl sm:text-2xl font-bold text-white tracking-wide">
                {t.mapGuideTitle}
              </h3>
            </div>

            {/* DIRECT ANSWER HIGHLIGHT CALLOUT */}
            <div className="bg-gradient-to-r from-emerald-950/70 to-space-900 border border-emerald-500/40 p-4 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-orbitron font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{t.mapGuideAnswerHeader}</span>
              </div>
              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
                {t.mapGuideAnswerText}
              </p>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-slate-300">
              
              {/* Step 1: Why FDev has no web map */}
              <div className="bg-space-950/70 p-4 rounded-xl border border-space-800 space-y-1.5">
                <div className="font-orbitron font-semibold text-orange-400 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{t.mapGuideStep1Title}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {t.mapGuideStep1Text}
                </p>
              </div>

              {/* Step 2: How EDAstro & EDSM work */}
              <div className="bg-space-950/70 p-4 rounded-xl border border-space-800 space-y-1.5">
                <div className="font-orbitron font-semibold text-cyan-400 flex items-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>{t.mapGuideStep2Title}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {t.mapGuideStep2Text}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <a
                    href="https://edastro.com/galmap/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-amber-400 hover:underline font-mono"
                  >
                    <span>EDAstro Interactive GalMap</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-slate-600">·</span>
                  <a
                    href="https://www.edsm.net/en/map/galaxy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-cyan-400 hover:underline font-mono"
                  >
                    <span>EDSM Interactive 3D Galaxy Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step 3: When an API Key IS needed */}
              <div className="bg-space-950/70 p-4 rounded-xl border border-space-800 space-y-1.5">
                <div className="font-orbitron font-semibold text-amber-400 flex items-center space-x-2">
                  <Key className="w-4 h-4" />
                  <span>{t.mapGuideStep3Title}</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {t.mapGuideStep3Text}
                </p>
                <div className="bg-space-900 p-2.5 rounded-lg border border-space-800 font-mono text-[11px] text-slate-400 break-all">
                  Journal Logs: %USERPROFILE%\Saved Games\Frontier Developments\Elite Dangerous\Journal.*.log
                </div>
              </div>

            </div>

            <div className="flex justify-end pt-2 border-t border-space-800">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-space-800 hover:bg-space-750 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                {t.modalClose}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
