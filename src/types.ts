export type Language = 'en' | 'ru';

export interface Waypoint {
  num: number;
  system: string;
  distanceNum: number;
  distanceStr: string;
  reached: string;
  visited: string;
  isAnnounced: boolean;
  region: string;
  regionRu?: string;
  x: number; // Galactic coordinates (ly) Sol=(0,0,0) SagA*=(0, 0, ~25900)
  y: number; // Height above/below plane
  z: number;
  notableFeatures?: string;
  notableFeaturesRu?: string;
  exobiologyTypes?: string[];
  primaryStar?: string;
  isCustomCmdrEntry?: boolean;
  submittedBy?: string;
  submittedAt?: string;
  edsmVerified?: boolean;
  edsmTrafficTotal?: number;
  edsmTrafficWeek?: number;
  edsmDiscoveryCmdr?: string;
}

export interface NextCarrierTarget {
  anchorWaypointNum: number;
  nextWaypointNum: number;
  scheduledJumpIso: string;
  updatedBy?: string;
  notes?: string;
}

export type SortColumn = 'num' | 'system' | 'distance' | 'reached' | 'visited';
export type SortDirection = 'asc' | 'desc';

export interface CommanderProgress {
  cmdrName: string;
  shipName: string;
  jumpRange: number;
  visitedWaypointIds: number[];
  reachedWaypointIds: number[];
  notes: Record<number, string>;
}

export interface ExpeditionStats {
  edsmId: number;
  edsmUrl: string;
  leader: string;
  startDate: string;
  arrivalDate: string;
  startArrivalSystem: string;
  carrierName: string;
  carrierCallsign: string;
  totalWaypoints: number;
  totalRegions: number;
  estimatedDistanceLy: number;
  participantsCount: number;
  abandonedCount: number;
  successCount: number;
}

export type NewsCategory = 'all' | 'carrier' | 'discovery' | 'operations' | 'edsm';

export interface NewsItem {
  id: string;
  timestamp: string; // ISO or Elite Dangerous UTC timestamp
  gameDate: string; // e.g. "08 NOV 2026 14:15 UTC"
  category: 'carrier' | 'discovery' | 'operations' | 'edsm';
  title: string;
  titleRu: string;
  summary: string;
  summaryRu: string;
  content: string;
  contentRu: string;
  system?: string;
  region?: string;
  regionRu?: string;
  carrierStatus?: {
    tritiumTons: number;
    jumpState: string;
    nextJumpSchedule?: string;
  };
  liveEdsmData?: {
    totalTraffic?: number;
    weekTraffic?: number;
    dayTraffic?: number;
    discoveryCmdr?: string;
    discoveryDate?: string;
    starClass?: string;
    shipBreakdown?: string[];
  };
  author: string;
  edsmUrl?: string;
  isPinned?: boolean;
}

