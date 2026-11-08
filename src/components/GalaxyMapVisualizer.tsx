import React, { useState, useMemo } from 'react';
import { Waypoint, Language } from '../types';
import { i18n } from '../data/i18n';
import { GALAXY_LANDMARKS } from '../data/expeditionData';
import { ZoomIn, ZoomOut, RotateCcw, Compass, MapPin } from 'lucide-react';

interface GalaxyMapVisualizerProps {
  currentLang: Language;
  waypoints: Waypoint[];
  onSelectWaypoint: (wp: Waypoint) => void;
  selectedWaypointNum?: number;
}

export const GalaxyMapVisualizer: React.FC<GalaxyMapVisualizerProps> = ({
  currentLang,
  waypoints,
  onSelectWaypoint,
  selectedWaypointNum,
}) => {
  const t = i18n[currentLang];

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredWp, setHoveredWp] = useState<Waypoint | null>(null);

  // SVG Coordinate mapping:
  // Galactic Center is at (0, 25900 ly).
  // Map center in SVG: width = 800, height = 800
  // viewBox: 0 0 800 800
  // Center of galaxy: (400, 440)
  // Scale: 1 ly = 0.0078 SVG units (so ~80,000 ly fits in ~624px)
  const mapCenter = { x: 400, y: 440 };
  const scale = 0.0076;

  const toSvgCoords = (gx: number, gz: number) => {
    // gx is X (+ East, - West)
    // gz is Z (+ North / toward Beagle Point, - South)
    // In SVG, y is downwards, so higher Z should go UP (-y)
    const sx = mapCenter.x + gx * scale;
    const sy = mapCenter.y - (gz - 25900) * scale;
    return { sx, sy };
  };

  // Route path polyline string
  const routePointsString = useMemo(() => {
    return waypoints
      .map(wp => {
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
    setZoom(prev => Math.min(Math.max(prev * factor, 0.6), 4));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <section className="bg-space-900 border border-space-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md relative overflow-hidden">
      {/* Title & Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        {/* Zoom & View Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-auto bg-space-800/90 border border-space-700 p-1.5 rounded-xl">
          <button
            onClick={() => handleZoom(1.25)}
            className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-space-700 rounded-lg transition-colors cursor-pointer"
            title={t.mapZoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1.5 text-slate-300 hover:text-cyan-400 hover:bg-space-700 rounded-lg transition-colors cursor-pointer"
            title={t.mapZoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-300 hover:text-amber-400 hover:bg-space-700 rounded-lg transition-colors cursor-pointer"
            title={t.mapReset}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Map Viewport */}
      <div
        className="w-full h-[520px] sm:h-[620px] bg-space-950 rounded-xl border border-space-800 relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#f97316 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px',
          }}
        />

        {/* SVG Galaxy Map */}
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
            {/* Core Glow */}
            <radialGradient id="galacticCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffeedd" stopOpacity="0.9" />
              <stop offset="20%" stopColor="#fbbf24" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#ea580c" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0b0f19" stopOpacity="0" />
            </radialGradient>

            {/* Arm Glow Filter */}
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Concentric Distance Rings from Core */}
          {[10000, 20000, 30000, 42000].map((radiusLy) => {
            const rSvg = radiusLy * scale;
            return (
              <g key={radiusLy}>
                <circle
                  cx={mapCenter.x}
                  cy={mapCenter.y}
                  r={rSvg}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
                <text
                  x={mapCenter.x + rSvg + 4}
                  y={mapCenter.y - 4}
                  fill="#475569"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {radiusLy.toLocaleString()} ly
                </text>
              </g>
            );
          })}

          {/* Coordinate Axes */}
          <line
            x1="100"
            y1={mapCenter.y}
            x2="700"
            y2={mapCenter.y}
            stroke="#1f2937"
            strokeWidth="1"
          />
          <line
            x1={mapCenter.x}
            y1="80"
            x2={mapCenter.x}
            y2="720"
            stroke="#1f2937"
            strokeWidth="1"
          />

          {/* Stylized Spiral Arms (Dense star clouds approximation) */}
          <path
            d="M 400 440 Q 480 380 540 260 T 470 110 T 320 80 T 160 180"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="16"
            strokeOpacity="0.07"
            strokeLinecap="round"
          />
          <path
            d="M 400 440 Q 320 500 240 600 T 340 730 T 520 700 T 660 560"
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="18"
            strokeOpacity="0.07"
            strokeLinecap="round"
          />
          <path
            d="M 400 440 Q 490 480 590 520 T 680 400 T 630 220"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="12"
            strokeOpacity="0.06"
            strokeLinecap="round"
          />
          <path
            d="M 400 440 Q 310 390 220 370 T 140 480 T 210 650"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="12"
            strokeOpacity="0.06"
            strokeLinecap="round"
          />

          {/* Galactic Core Gradient Disc */}
          <circle
            cx={mapCenter.x}
            cy={mapCenter.y}
            r="90"
            fill="url(#galacticCoreGlow)"
          />

          {/* Expedition Circumnavigation Trajectory Line */}
          <polyline
            points={routePointsString}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeDasharray="5 3"
            strokeOpacity="0.75"
          />

          {/* Galaxy Landmarks */}
          {GALAXY_LANDMARKS.map((lm) => {
            const { sx, sy } = toSvgCoords(lm.x, lm.z);
            return (
              <g key={lm.name}>
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
                  fontSize="10"
                  fontFamily="sans-serif"
                  fontWeight="600"
                >
                  {lm.name}
                </text>
              </g>
            );
          })}

          {/* Waypoint Nodes */}
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
                {/* Active / Selected Ripple */}
                {(isSelected || isMeni) && (
                  <circle
                    cx={sx}
                    cy={sy}
                    r={isSelected ? 10 : 8}
                    fill="none"
                    stroke={isSelected ? '#06b6d4' : '#f97316'}
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                  />
                )}

                {/* Waypoint Dot */}
                <circle
                  cx={sx}
                  cy={sy}
                  r={isSelected || isHovered ? 5.5 : wp.isAnnounced ? 4 : 2.5}
                  fill={
                    isMeni
                      ? '#f97316'
                      : wp.isAnnounced
                      ? '#06b6d4'
                      : '#64748b'
                  }
                  stroke="#030712"
                  strokeWidth="1"
                />

                {/* Show label for announced waypoints or hovered/selected */}
                {(wp.isAnnounced || isHovered || isSelected) && (
                  <text
                    x={sx + 6}
                    y={sy - 4}
                    fill={isSelected ? '#38bdf8' : wp.isAnnounced ? '#cbd5e1' : '#64748b'}
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

        {/* Hover / Inspection Card in bottom-left corner */}
        {hoveredWp && (
          <div className="absolute bottom-4 left-4 bg-space-900/95 border border-cyan-500/40 backdrop-blur-md p-3.5 rounded-xl text-xs max-w-xs shadow-xl pointer-events-none space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="font-orbitron font-bold text-cyan-400">
                Waypoint #{hoveredWp.num}
              </span>
              <span className="font-mono text-slate-400">
                {hoveredWp.distanceStr}
              </span>
            </div>
            <div className="text-slate-100 font-semibold truncate">
              {(!hoveredWp.isAnnounced && currentLang === 'ru') ? 'Будет объявлено' : hoveredWp.system}
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

        {/* Compass / Orientation Indicator in top-right */}
        <div className="absolute top-4 right-4 bg-space-900/80 border border-space-700/80 p-2.5 rounded-xl text-center text-[10px] font-mono text-slate-400 backdrop-blur-sm pointer-events-none">
          <div className="text-cyan-400 font-bold mb-0.5">NORTH (Beagle Point)</div>
          <div className="flex justify-between gap-4">
            <span>WEST</span>
            <span>EAST</span>
          </div>
          <div className="text-amber-400 font-bold mt-0.5">SOUTH (Sol / Bubble)</div>
        </div>
      </div>

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
    </section>
  );
};
