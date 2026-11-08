import React from 'react';
import { Language } from '../types';
import { i18n } from '../data/i18n';
import { Globe, Map, Navigation, CheckSquare, Radio, Rocket } from 'lucide-react';
import { ExpeditionLogo } from './ExpeditionLogo';

interface HeaderProps {
  currentLang: Language;
  onToggleLanguage: () => void;
  activeTab: 'waypoints' | 'map' | 'calc' | 'log' | 'news';
  onSelectTab: (tab: 'waypoints' | 'map' | 'calc' | 'log' | 'news') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  onToggleLanguage,
  activeTab,
  onSelectTab,
}) => {
  const t = i18n[currentLang];

  const navItems: Array<{
    id: 'waypoints' | 'map' | 'calc' | 'log' | 'news';
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'waypoints',
      label: t.tabWaypoints,
      icon: <Navigation className="w-4 h-4 text-cyan-400 shrink-0" />,
    },
    {
      id: 'map',
      label: t.tabGalaxyMap,
      icon: <Map className="w-4 h-4 text-amber-400 shrink-0" />,
    },
    {
      id: 'calc',
      label: t.tabRouteCalc,
      icon: <Rocket className="w-4 h-4 text-orange-400 shrink-0" />,
    },
    {
      id: 'log',
      label: t.tabCmdrLog,
      icon: <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />,
    },
    {
      id: 'news',
      label: t.tabNews,
      icon: <Radio className="w-4 h-4 text-cyan-400 shrink-0" />,
    },
  ];

  return (
    <header className="border-b border-space-700 bg-space-900/95 backdrop-blur-md sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Zone 1: Wordmark with Official Expedition SVG Patch */}
        <div
          onClick={() => onSelectTab('waypoints')}
          className="flex items-center gap-3 shrink-0 cursor-pointer group"
          title="Return to Waypoints Overview"
        >
          <div className="group-hover:scale-105 transition-transform duration-200">
            <ExpeditionLogo size="md" showGlow />
          </div>
          <div>
            <h1 className="font-orbitron text-base sm:text-lg font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200 whitespace-nowrap">
              {t.headerTitle}
            </h1>
            <p className="text-xs text-slate-400 hidden xl:block whitespace-nowrap">
              {t.headerSubtitle}
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Buttons (Desktop) */}
        <nav className="hidden lg:flex items-center gap-2 xl:gap-3">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs xl:text-sm font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-space-800 text-cyan-400 border border-cyan-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-800/60 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Language Toggle Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleLanguage}
            className="flex items-center gap-2 bg-space-800 hover:bg-space-700 border border-space-600 hover:border-cyan-500/50 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm text-slate-200 cursor-pointer"
            title="Toggle Language / Переключить язык"
          >
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-semibold">{t.langBtnText}</span>
          </button>
        </div>
      </div>

      {/* Tablet & Mobile Sub-Navigation Bar (Horizontal Scrollable with distinct buttons and no overlap) */}
      <div className="lg:hidden flex items-center gap-2 border-t border-space-800 bg-space-950/95 px-3 py-2.5 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`shrink-0 flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl whitespace-nowrap cursor-pointer transition-colors ${
                isActive
                  ? 'text-cyan-400 bg-space-800 border border-cyan-500/40 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-space-850 bg-space-900 border border-space-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
