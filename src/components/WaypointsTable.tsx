import React, { useState, useMemo } from 'react';
import { Waypoint, Language, SortColumn, SortDirection } from '../types';
import { i18n } from '../data/i18n';
import { Search, MapPin, ArrowUpDown, Copy, Check, Info } from 'lucide-react';

interface WaypointsTableProps {
  currentLang: Language;
  initialWaypoints: Waypoint[];
  allWaypoints: Waypoint[];
  onSelectWaypoint: (wp: Waypoint) => void;
  selectedWaypointNum?: number;
}

export const WaypointsTable: React.FC<WaypointsTableProps> = ({
  currentLang,
  initialWaypoints,
  allWaypoints,
  onSelectWaypoint,
  selectedWaypointNum,
}) => {
  const t = i18n[currentLang];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'announced' | 'tba'>('all');
  const [viewScope, setViewScope] = useState<'initial' | 'full'>('initial');
  const [sortColumn, setSortColumn] = useState<SortColumn>('num');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [copiedSystem, setCopiedSystem] = useState<string | null>(null);

  const activeDataset = viewScope === 'initial' ? initialWaypoints : allWaypoints;

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const handleCopy = (e: React.MouseEvent, systemName: string) => {
    e.stopPropagation();
    if (systemName === 'To be announced') return;
    navigator.clipboard.writeText(systemName);
    setCopiedSystem(systemName);
    setTimeout(() => setCopiedSystem(null), 2000);
  };

  const processedData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = activeDataset.filter(wp => {
      // Status filter
      if (filterType === 'announced' && !wp.isAnnounced) return false;
      if (filterType === 'tba' && wp.isAnnounced) return false;

      // Text query
      if (!query) return true;
      const numMatch = wp.num.toString() === query;
      const sysMatch = wp.system.toLowerCase().includes(query);
      const regMatch = wp.region.toLowerCase().includes(query) || (wp.regionRu && wp.regionRu.toLowerCase().includes(query));
      return numMatch || sysMatch || regMatch;
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      let valA: string | number = a.num;
      let valB: string | number = b.num;

      if (sortColumn === 'num') {
        valA = a.num;
        valB = b.num;
      } else if (sortColumn === 'system') {
        valA = a.system.toLowerCase();
        valB = b.system.toLowerCase();
      } else if (sortColumn === 'distance') {
        valA = a.distanceNum;
        valB = b.distanceNum;
      } else if (sortColumn === 'reached') {
        valA = parseFloat(a.reached) || 0;
        valB = parseFloat(b.reached) || 0;
      } else if (sortColumn === 'visited') {
        valA = parseFloat(a.visited) || 0;
        valB = parseFloat(b.visited) || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [activeDataset, searchQuery, filterType, sortColumn, sortDirection]);

  return (
    <section className="bg-space-900 border border-space-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md">
      {/* Table Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-orange-400 shrink-0" />
            <h3 className="font-orbitron text-lg sm:text-xl font-bold text-white tracking-wide">
              {t.waypointsTitle} {viewScope === 'initial' ? '(1 - 22)' : `(1 - ${allWaypoints.length})`}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t.waypointsSub}
          </p>
        </div>

        {/* View Scope Toggle (1-22 vs 1-88) */}
        <div className="flex items-center gap-2">
          <div className="bg-space-800/90 border border-space-700 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setViewScope('initial')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                viewScope === 'initial'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.viewModeInitial}
            </button>
            <button
              onClick={() => setViewScope('full')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                viewScope === 'full'
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.viewModeFull}
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filter Pills / Segments */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-space-750 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 bg-space-800/60 border border-transparent'
            }`}
          >
            {t.filterAll}
          </button>
          <button
            onClick={() => setFilterType('announced')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filterType === 'announced'
                ? 'bg-space-750 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 bg-space-800/60 border border-transparent'
            }`}
          >
            {t.filterAnnounced}
          </button>
          <button
            onClick={() => setFilterType('tba')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filterType === 'tba'
                ? 'bg-space-750 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 bg-space-800/60 border border-transparent'
            }`}
          >
            {t.filterTBA}
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-space-800 border border-space-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-space-700 bg-space-950/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-space-800 bg-space-900/90 text-xs font-orbitron text-slate-400 uppercase tracking-wider">
              {/* Column: # */}
              <th
                onClick={() => handleSort('num')}
                className="py-3.5 px-4 cursor-pointer hover:text-cyan-400 transition-colors select-none whitespace-nowrap"
              >
                <div className="flex items-center space-x-1.5">
                  <span>{t.colNum}</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>

              {/* Column: System */}
              <th
                onClick={() => handleSort('system')}
                className="py-3.5 px-4 cursor-pointer hover:text-cyan-400 transition-colors select-none whitespace-nowrap"
              >
                <div className="flex items-center space-x-1.5">
                  <span>{t.colSystem}</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>

              {/* Column: Region */}
              <th className="py-3.5 px-4 select-none whitespace-nowrap hidden md:table-cell">
                <span>{t.colRegion}</span>
              </th>

              {/* Column: Distance */}
              <th
                onClick={() => handleSort('distance')}
                className="py-3.5 px-4 cursor-pointer hover:text-cyan-400 transition-colors select-none whitespace-nowrap"
              >
                <div className="flex items-center space-x-1.5">
                  <span>{t.colDistance}</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>

              {/* Column: Reached % */}
              <th
                onClick={() => handleSort('reached')}
                className="py-3.5 px-4 cursor-pointer hover:text-cyan-400 transition-colors select-none whitespace-nowrap"
              >
                <div className="flex items-center space-x-1.5">
                  <span>{t.colReached}</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>

              {/* Column: Visited % */}
              <th
                onClick={() => handleSort('visited')}
                className="py-3.5 px-4 cursor-pointer hover:text-cyan-400 transition-colors select-none whitespace-nowrap"
              >
                <div className="flex items-center space-x-1.5">
                  <span>{t.colVisited}</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>

              {/* Column: Actions */}
              <th className="py-3.5 px-4 text-right select-none whitespace-nowrap">
                <span>{t.colActions}</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-space-800/60 text-xs sm:text-sm text-slate-300">
            {processedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                  No matching waypoints found.
                </td>
              </tr>
            ) : (
              processedData.map((wp) => {
                const isSelected = selectedWaypointNum === wp.num;
                const displayName = (!wp.isAnnounced && currentLang === 'ru') ? 'Будет объявлено' : wp.system;
                const displayRegion = (currentLang === 'ru' && wp.regionRu) ? wp.regionRu : wp.region;
                const isCopied = copiedSystem === wp.system;

                return (
                  <tr
                    key={wp.num}
                    onClick={() => onSelectWaypoint(wp)}
                    className={`transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-cyan-950/30 border-l-2 border-l-cyan-400'
                        : 'hover:bg-space-800/50'
                    }`}
                  >
                    {/* # */}
                    <td className="py-3.5 px-4 font-orbitron font-semibold text-cyan-400 tabular-nums">
                      #{wp.num}
                    </td>

                    {/* System Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${wp.isAnnounced ? 'text-slate-100 font-semibold' : 'text-slate-400 italic'}`}>
                          {displayName}
                        </span>
                        {wp.isAnnounced && (
                          <button
                            onClick={(e) => handleCopy(e, wp.system)}
                            title="Copy system name for in-game galaxy map"
                            className="text-slate-500 hover:text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-space-700/60"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Region */}
                    <td className="py-3.5 px-4 text-slate-400 hidden md:table-cell">
                      <span className="truncate max-w-[180px] inline-block">
                        {displayRegion}
                      </span>
                    </td>

                    {/* Distance from Start */}
                    <td className="py-3.5 px-4 text-slate-300 font-mono tabular-nums">
                      {wp.distanceStr}
                    </td>

                    {/* Reached % */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-200 tabular-nums">
                          {wp.reached}
                        </span>
                      </div>
                    </td>

                    {/* Visited % */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-amber-400 tabular-nums">
                          {wp.visited}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWaypoint(wp);
                        }}
                        className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-cyan-400 px-2 py-1 rounded bg-space-800 hover:bg-space-750 transition-colors border border-space-700"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Info</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Status / Count Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2">
        <span>
          {t.filterShowing} {processedData.length} {t.filterOf} {activeDataset.length} {t.filterWaypointsSuffix}
        </span>
        <span className="hidden sm:inline">
          Click any waypoint to inspect galactic coordinates & exobiology data
        </span>
      </div>
    </section>
  );
};
