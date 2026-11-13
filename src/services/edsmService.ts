export interface EdsmSystemInfo {
  found: boolean;
  name: string;
  coords?: {
    x: number;
    y: number;
    z: number;
  };
  primaryStar?: string;
  distanceFromMeni?: number;
  discoveryCmdr?: string;
  discoveryDate?: string;
  trafficTotal?: number;
  trafficWeek?: number;
  trafficDay?: number;
  shipBreakdown?: string[];
  url?: string;
}

// Exact EDSM coordinates of starting hub Meni
export const MENI_COORDS = {
  x: 38.0625,
  y: -36.21875,
  z: -24.28125,
};

export interface EdsmTrafficResponse {
  id?: number;
  name?: string;
  url?: string;
  discovery?: {
    commander?: string;
    date?: string;
  };
  traffic?: {
    total?: number;
    week?: number;
    day?: number;
  };
  breakdown?: Record<string, number>;
}

export async function fetchEdsmSystemTraffic(systemName: string): Promise<EdsmTrafficResponse | null> {
  if (!systemName || systemName.toLowerCase() === 'to be announced') return null;
  try {
    const encoded = encodeURIComponent(systemName.trim());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://www.edsm.net/api-system-v1/traffic?systemName=${encoded}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || Object.keys(data).length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export async function lookupEdsmSystem(systemName: string): Promise<EdsmSystemInfo> {
  const cleanName = systemName.trim();
  if (!cleanName) {
    return { found: false, name: '' };
  }

  try {
    const encoded = encodeURIComponent(cleanName);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const [sysRes, trafficData] = await Promise.all([
      fetch(
        `https://www.edsm.net/api-v1/system?systemName=${encoded}&showCoordinates=1&showPrimaryStar=1&showInformation=1`,
        { signal: controller.signal }
      ),
      fetchEdsmSystemTraffic(cleanName),
    ]);
    clearTimeout(timeout);

    if (!sysRes.ok) {
      return { found: false, name: cleanName };
    }

    const sysData = await sysRes.json();
    if (!sysData || Array.isArray(sysData) || !sysData.name) {
      return { found: false, name: cleanName };
    }

    const coords = sysData.coords
      ? {
          x: Number(sysData.coords.x),
          y: Number(sysData.coords.y),
          z: Number(sysData.coords.z),
        }
      : undefined;

    let distanceFromMeni: number | undefined;
    if (coords) {
      const dx = coords.x - MENI_COORDS.x;
      const dy = coords.y - MENI_COORDS.y;
      const dz = coords.z - MENI_COORDS.z;
      distanceFromMeni = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) * 100) / 100;
    }

    const shipBreakdown = trafficData?.breakdown
      ? Object.entries(trafficData.breakdown).map(([ship, count]) => `${ship} (${count})`)
      : undefined;

    return {
      found: true,
      name: sysData.name,
      coords,
      primaryStar: sysData.primaryStar?.type,
      distanceFromMeni,
      discoveryCmdr: trafficData?.discovery?.commander,
      discoveryDate: trafficData?.discovery?.date,
      trafficTotal: trafficData?.traffic?.total,
      trafficWeek: trafficData?.traffic?.week,
      trafficDay: trafficData?.traffic?.day,
      shipBreakdown,
      url: trafficData?.url,
    };
  } catch {
    return { found: false, name: cleanName };
  }
}
