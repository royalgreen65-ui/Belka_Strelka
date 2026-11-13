/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Language, Waypoint, NextCarrierTarget } from './types';
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
import { WriteInWaypointModal } from './components/WriteInWaypointModal';
import { Footer } from './components/Footer';

const CUSTOM_WAYPOINTS_STORAGE_KEY = 'belka_custom_waypoints_v1';
const CARRIER_TARGET_STORAGE_KEY = 'belka_carrier_target_v1';

const DEFAULT_CARRIER_TARGET: NextCarrierTarget = {
  anchorWaypointNum: 2,
  nextWaypointNum: 3,
  scheduledJumpIso: '2026-11-14T18:00:00Z',
};

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

  // Custom commander-submitted / updated waypoints map (keyed by waypoint num)
  const [customWaypoints, setCustomWaypoints] = useState<Record<number, Waypoint>>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_WAYPOINTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // fallback
    }
    return {};
  });

  // Active Fleet Carrier anchor & next jump target
  const [carrierTarget, setCarrierTarget] = useState<NextCarrierTarget>(() => {
    try {
      const saved = localStorage.getItem(CARRIER_TARGET_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.nextWaypointNum === 'number') {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_CARRIER_TARGET;
  });

  // Write-In Modal state
  const [writeModalOpen, setWriteModalOpen] = useState<boolean>(false);
  const [writeModalSlotNum, setWriteModalSlotNum] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('belka_lang', currentLang);
    } catch {
      // ignore
    }
  }, [currentLang]);

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_WAYPOINTS_STORAGE_KEY, JSON.stringify(customWaypoints));
    } catch {
      // ignore
    }
  }, [customWaypoints]);

  useEffect(() => {
    try {
      localStorage.setItem(CARRIER_TARGET_STORAGE_KEY, JSON.stringify(carrierTarget));
    } catch {
      // ignore
    }
  }, [carrierTarget]);

  // Merge custom commander entries into initial (1-22) and full (1-88+) waypoint lists
  const mergedInitialWaypoints = useMemo(() => {
    return INITIAL_WAYPOINTS.map((wp) => customWaypoints[wp.num] ?? wp);
  }, [customWaypoints]);

  const mergedAllWaypoints = useMemo(() => {
    const baseMerged = ALL_WAYPOINTS.map((wp) => customWaypoints[wp.num] ?? wp);
    const maxBaseNum = ALL_WAYPOINTS.length;
    const extraCustom = Object.values(customWaypoints)
      .filter((wp) => wp.num > maxBaseNum)
      .sort((a, b) => a.num - b.num);
    return [...baseMerged, ...extraCustom];
  }, [customWaypoints]);

  const hasCustomEdits = Object.keys(customWaypoints).length > 0;

  const toggleLanguage = () => {
    setCurrentLang((prev) => (prev === 'en' ? 'ru' : 'en'));
  };

  const handleSelectTab = (tab: 'waypoints' | 'map' | 'calc' | 'log' | 'news') => {
    setActiveTab(tab);
    setTimeout(() => {
      const el = document.getElementById('workspace-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleOpenCalculator = () => {
    handleSelectTab('calc');
    setSelectedWaypoint(null);
  };

  const handleOpenWriteIn = (slotNum?: number) => {
    setWriteModalSlotNum(slotNum ?? null);
    setWriteModalOpen(true);
  };

  const handleSaveWaypoint = (
    updatedWp: Waypoint,
    setAsNextTarget: boolean,
    scheduledJumpIso?: string
  ) => {
    setCustomWaypoints((prev) => ({
      ...prev,
      [updatedWp.num]: updatedWp,
    }));

    if (setAsNextTarget) {
      setCarrierTarget((prev) => ({
        ...prev,
        nextWaypointNum: updatedWp.num,
        scheduledJumpIso: scheduledJumpIso || prev.scheduledJumpIso,
        updatedBy: updatedWp.submittedBy,
      }));
    }

    // If the currently inspected modal waypoint matches, keep it synced
    if (selectedWaypoint?.num === updatedWp.num) {
      setSelectedWaypoint(updatedWp);
    }
  };

  const handleResetCustomWaypoints = () => {
    setCustomWaypoints({});
    setCarrierTarget(DEFAULT_CARRIER_TARGET);
  };

  return (
    <div className="min-h-screen bg-space-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Navigation / Header */}
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
        <ExpeditionSummary
          currentLang={currentLang}
          waypoints={mergedAllWaypoints}
          carrierTarget={carrierTarget}
          onSelectTab={handleSelectTab}
          onOpenWriteIn={handleOpenWriteIn}
        />

        {/* Workspace Navigation Bar */}
        <WorkspaceTabs
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          currentLang={currentLang}
        />

        {/* Dynamic Tab Views */}
        {activeTab === 'waypoints' && (
          <WaypointsTable
            currentLang={currentLang}
            initialWaypoints={mergedInitialWaypoints}
            allWaypoints={mergedAllWaypoints}
            onSelectWaypoint={setSelectedWaypoint}
            selectedWaypointNum={selectedWaypoint?.num}
            nextTargetNum={carrierTarget.nextWaypointNum}
            hasCustomEdits={hasCustomEdits}
            onOpenWriteIn={handleOpenWriteIn}
            onResetCustomWaypoints={handleResetCustomWaypoints}
          />
        )}

        {activeTab === 'map' && (
          <GalaxyMapVisualizer
            currentLang={currentLang}
            waypoints={mergedAllWaypoints}
            onSelectWaypoint={setSelectedWaypoint}
            selectedWaypointNum={selectedWaypoint?.num}
          />
        )}

        {activeTab === 'calc' && (
          <RoutePlanner currentLang={currentLang} waypoints={mergedAllWaypoints} />
        )}

        {activeTab === 'log' && (
          <CommanderLog
            currentLang={currentLang}
            waypoints={mergedAllWaypoints}
            onSelectWaypoint={setSelectedWaypoint}
          />
        )}

        {activeTab === 'news' && (
          <ExpeditionNewsfeed
            currentLang={currentLang}
            waypoints={mergedAllWaypoints}
            carrierTarget={carrierTarget}
            onOpenWriteIn={handleOpenWriteIn}
          />
        )}
      </main>

      {/* Waypoint Intelligence Modal */}
      <WaypointModal
        waypoint={selectedWaypoint}
        currentLang={currentLang}
        onClose={() => setSelectedWaypoint(null)}
        onOpenCalculator={handleOpenCalculator}
        onEditWaypoint={(wp) => handleOpenWriteIn(wp.num)}
      />

      {/* Commander Write-In Next Waypoint Modal */}
      <WriteInWaypointModal
        isOpen={writeModalOpen}
        currentLang={currentLang}
        waypoints={mergedAllWaypoints}
        initialSlotNum={writeModalSlotNum}
        currentCarrierTarget={carrierTarget}
        onClose={() => setWriteModalOpen(false)}
        onSaveWaypoint={handleSaveWaypoint}
      />

      {/* Footer */}
      <Footer currentLang={currentLang} />
    </div>
  );
}
