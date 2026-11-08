/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Language, Waypoint } from './types';
import { INITIAL_WAYPOINTS, ALL_WAYPOINTS } from './data/expeditionData';
import { Header } from './components/Header';
import { HeroAnnouncement } from './components/HeroAnnouncement';
import { ExpeditionSummary } from './components/ExpeditionSummary';
import { WaypointsTable } from './components/WaypointsTable';
import { GalaxyMapVisualizer } from './components/GalaxyMapVisualizer';
import { RoutePlanner } from './components/RoutePlanner';
import { CommanderLog } from './components/CommanderLog';
import { ExpeditionNewsfeed } from './components/ExpeditionNewsfeed';
import { WorkspaceTabs } from './components/WorkspaceTabs';
import { WaypointModal } from './components/WaypointModal';
import { Footer } from './components/Footer';

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('belka_lang');
      if (saved === 'en' || saved === 'ru') return saved;
    } catch {
      // fallback
    }
    return 'en';
  });

  const [activeTab, setActiveTab] = useState<'waypoints' | 'map' | 'calc' | 'log' | 'news'>('waypoints');
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('belka_lang', currentLang);
    } catch {
      // ignore
    }
  }, [currentLang]);

  const toggleLanguage = () => {
    setCurrentLang(prev => (prev === 'en' ? 'ru' : 'en'));
  };

  const handleSelectTab = (tab: 'waypoints' | 'map' | 'calc' | 'log' | 'news') => {
    setActiveTab(tab);
    // Smooth scroll down to workspace section for instant visibility
    setTimeout(() => {
      const el = document.getElementById('workspace-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleOpenCalculator = (wp: Waypoint) => {
    handleSelectTab('calc');
    setSelectedWaypoint(null);
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation / Header adhering to Top Bar contract */}
      <Header
        currentLang={currentLang}
        onToggleLanguage={toggleLanguage}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Hero Announcement Section */}
        <HeroAnnouncement currentLang={currentLang} />

        {/* Expedition Summary & Live Timer Grid */}
        <ExpeditionSummary currentLang={currentLang} />

        {/* In-page Prominent Workspace Navigation Bar */}
        <WorkspaceTabs
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          currentLang={currentLang}
        />

        {/* Dynamic Tab Views */}
        {activeTab === 'waypoints' && (
          <WaypointsTable
            currentLang={currentLang}
            initialWaypoints={INITIAL_WAYPOINTS}
            allWaypoints={ALL_WAYPOINTS}
            onSelectWaypoint={setSelectedWaypoint}
            selectedWaypointNum={selectedWaypoint?.num}
          />
        )}

        {activeTab === 'map' && (
          <GalaxyMapVisualizer
            currentLang={currentLang}
            waypoints={ALL_WAYPOINTS}
            onSelectWaypoint={setSelectedWaypoint}
            selectedWaypointNum={selectedWaypoint?.num}
          />
        )}

        {activeTab === 'calc' && (
          <RoutePlanner
            currentLang={currentLang}
            waypoints={ALL_WAYPOINTS}
          />
        )}

        {activeTab === 'log' && (
          <CommanderLog
            currentLang={currentLang}
            waypoints={ALL_WAYPOINTS}
            onSelectWaypoint={setSelectedWaypoint}
          />
        )}

        {activeTab === 'news' && (
          <ExpeditionNewsfeed
            currentLang={currentLang}
          />
        )}

      </main>

      {/* Waypoint Intelligence Modal */}
      <WaypointModal
        waypoint={selectedWaypoint}
        currentLang={currentLang}
        onClose={() => setSelectedWaypoint(null)}
        onOpenCalculator={handleOpenCalculator}
      />

      {/* Footer */}
      <Footer currentLang={currentLang} />
    </div>
  );
}
