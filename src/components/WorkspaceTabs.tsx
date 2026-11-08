import React from 'react';
import { Language } from '../types';
import { i18n } from '../data/i18n';
import { Navigation, Map, Rocket, CheckSquare, Radio } from 'lucide-react';

interface WorkspaceTabsProps {
  activeTab: 'waypoints' | 'map' | 'calc' | 'log' | 'news';
  onSelectTab: (tab: 'waypoints' | 'map' | 'calc' | 'log' | 'news') => void;
  currentLang: Language;
}

export const WorkspaceTabs: React.FC<WorkspaceTabsProps> = ({
  activeTab,
  onSelectTab,
  currentLang,
}) => {
  const t = i18n[currentLang];

  const tabs: Array<{
    id: 'waypoints' | 'map' | 'calc' | 'log' | 'news';
    label: string;
    icon: React.ReactNode;
    tag: string;
  }> = [
    {
      id: 'waypoints',
      label: t.tabWaypoints,
      icon: <Navigation className="w-4 h-4 text-cyan-400 shrink-0" />,
      tag: '88 WP',
    },
    {
      id: 'map',
      label: t.tabGalaxyMap,
      icon: <Map className="w-4 h-4 text-amber-400 shrink-0" />,
      tag: '42 Regions',
    },
    {
      id: 'calc',
      label: t.tabRouteCalc,
      icon: <Rocket className="w-4 h-4 text-orange-400 shrink-0" />,
      tag: 'FSD / FC',
    },
    {
      id: 'log',
      label: t.tabCmdrLog,
      icon: <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />,
      tag: 'Checklist',
    },
    {
      id: 'news',
      label: t.tabNews,
      icon: <Radio className="w-4 h-4 text-cyan-400 shrink-0" />,
      tag: 'EDSM #229',
    },
  ];

  return (
    <div id="workspace-section" className="scroll-mt-24 space-y-2">
      {/* Responsive Grid Layout to guarantee zero overlap between buttons */}
      <div className="bg-space-900 border border-space-700 p-2 sm:p-2.5 rounded-2xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 shadow-lg">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          const isFifthOnTwoCol = idx === 4 ? 'col-span-2 sm:col-span-1' : '';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`w-full ${isFifthOnTwoCol} flex items-center justify-between gap-2 py-3 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none text-left ${
                isActive
                  ? 'bg-space-800 text-white border border-cyan-500/60 shadow-md ring-1 ring-cyan-500/40'
                  : 'bg-space-950/40 text-slate-400 hover:text-slate-100 hover:bg-space-800/60 border border-space-800 hover:border-space-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {tab.icon}
                <span className={`truncate text-xs sm:text-sm ${isActive ? 'text-slate-100 font-bold' : ''}`}>
                  {tab.label}
                </span>
              </div>

              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-space-900 text-slate-500 border border-space-800'
                }`}
              >
                {tab.tag}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
