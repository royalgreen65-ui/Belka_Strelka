import { NewsItem, Waypoint, NextCarrierTarget } from '../types';
import { fetchEdsmSystemTraffic, EdsmTrafficResponse } from './edsmService';

export const EDSM_EXPEDITION_URL =
  'https://www.edsm.net/en/expeditions/summary/id/229/name/Open+Galactic+Circumnavigation+Scientific+Expedition+Named+after+Belka+and+Strelka';

// Format UTC date into Elite Dangerous standard game format, e.g. "13 NOV 2026 04:49 UTC"
export function formatGameDate(date: Date): string {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes} UTC`;
}

// Format countdown duration
function formatRemaining(ms: number): string {
  if (Number.isNaN(ms)) return 'Schedule TBA';
  if (ms <= 0) return 'T-00:00 (Jump Window Open)';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `T-${days}d ${hours}h ${minutes}m`;
}

function extractShipBreakdown(resp: EdsmTrafficResponse | null): string[] | undefined {
  if (!resp?.breakdown || Object.keys(resp.breakdown).length === 0) return undefined;
  return Object.entries(resp.breakdown).map(([ship, count]) => `${ship} (${count})`);
}

export async function fetchExpeditionNews(
  waypoints: Waypoint[] = [],
  carrierTarget?: NextCarrierTarget
): Promise<NewsItem[]> {
  const now = new Date();
  const expeditionStart = new Date(Date.UTC(2026, 10, 1, 12, 0, 0)); // 01 NOV 2026 12:00 UTC
  const targetJumpIso = carrierTarget?.scheduledJumpIso || '2026-11-14T18:00:00Z';
  const carrierNextJump = new Date(targetJumpIso);

  // Dynamically calculate current mission day
  const msElapsed = now.getTime() - expeditionStart.getTime();
  const currentDay = Math.max(1, Math.floor(msElapsed / (1000 * 60 * 60 * 24)) + 1);

  // Compute live countdown to the active next carrier jump
  const msToJump = carrierNextJump.getTime() - now.getTime();
  const countdownStr = formatRemaining(msToJump);
  const scheduledJumpGameDate = formatGameDate(carrierNextJump);

  const anchorWp = waypoints.find((w) => w.num === (carrierTarget?.anchorWaypointNum ?? 2));
  const nextWp = waypoints.find((w) => w.num === (carrierTarget?.nextWaypointNum ?? 3));
  const anchorSystem = anchorWp?.system || 'Plaa Aescs WR-Z b2-2';
  const nextSystem = nextWp?.isAnnounced ? nextWp.system : 'Ploi Aim SF-V c3-39';

  // Custom commander-entered waypoints
  const customWaypoints = waypoints.filter((w) => w.isCustomCmdrEntry);

  // Query live EDSM traffic concurrently for core phase-1 systems + any custom waypoints
  const customSystemsToQuery = customWaypoints.slice(0, 3).map((w) => w.system);
  const [wp2Traffic, wp3Traffic, wp4Traffic, wp6Traffic, ...customTraffics] = await Promise.all([
    fetchEdsmSystemTraffic('Plaa Aescs WR-Z b2-2'),
    fetchEdsmSystemTraffic('Ploi Aim SF-V c3-39'),
    fetchEdsmSystemTraffic('Pru Ain TP-D d13-4'),
    fetchEdsmSystemTraffic('Cyookaea DW-N e6-1'),
    ...customSystemsToQuery.map((sys) => fetchEdsmSystemTraffic(sys)),
  ]);

  const wp2Total = wp2Traffic?.traffic?.total ?? 19;
  const wp2Week = wp2Traffic?.traffic?.week ?? 2;
  const wp2Day = wp2Traffic?.traffic?.day ?? 1;
  const wp2Cmdr = wp2Traffic?.discovery?.commander ?? 'Skibcha';

  const wp3Total = wp3Traffic?.traffic?.total ?? 16;
  const wp3Week = wp3Traffic?.traffic?.week ?? 2;
  const wp3Cmdr = wp3Traffic?.discovery?.commander ?? 'MAXMED66';

  const wp4Total = wp4Traffic?.traffic?.total ?? 18;
  const wp4Week = wp4Traffic?.traffic?.week ?? 12;
  const wp4Cmdr = wp4Traffic?.discovery?.commander ?? 'KotoSobak';

  const wp6Total = wp6Traffic?.traffic?.total ?? 19;
  const wp6Week = wp6Traffic?.traffic?.week ?? 19;
  const wp6Day = wp6Traffic?.traffic?.day ?? 4;
  const wp6Cmdr = wp6Traffic?.discovery?.commander ?? 'A. Twostone';
  const wp6Ships = extractShipBreakdown(wp6Traffic);

  const dispatches: NewsItem[] = [];

  // 1) If commanders wrote in custom waypoints, surface those fresh dispatches right at the top!
  customWaypoints
    .slice()
    .sort((a, b) => {
      const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return tb - ta;
    })
    .forEach((cwp, idx) => {
      const matchedTraffic = customTraffics[idx] || null;
      const totalTraffic = matchedTraffic?.traffic?.total ?? cwp.edsmTrafficTotal;
      const weekTraffic = matchedTraffic?.traffic?.week ?? cwp.edsmTrafficWeek;
      const discoveryCmdr = matchedTraffic?.discovery?.commander ?? cwp.edsmDiscoveryCmdr;
      const ships = extractShipBreakdown(matchedTraffic);
      const subDate = cwp.submittedAt ? new Date(cwp.submittedAt) : now;
      const isActiveTarget = carrierTarget?.nextWaypointNum === cwp.num;

      dispatches.push({
        id: `news-cmdr-wp-${cwp.num}-${subDate.getTime()}`,
        timestamp: subDate.toISOString(),
        gameDate: formatGameDate(subDate),
        category: 'operations',
        isPinned: idx === 0,
        title: `CMDR Dispatch: Waypoint #${cwp.num} Locked — ${cwp.system}${isActiveTarget ? ' (Next Carrier Target)' : ''}`,
        titleRu: `Сводка CMDR: Точка пути #${cwp.num} зафиксирована — ${cwp.system}${isActiveTarget ? ' (Цель карриера)' : ''}`,
        summary: `CMDR ${cwp.submittedBy || 'Explorer'} logged Waypoint #${cwp.num} (${cwp.system}) in ${cwp.region} at ${cwp.distanceStr} from Meni.${cwp.edsmVerified ? ' Coordinates & star class verified via live EDSM.' : ''}`,
        summaryRu: `CMDR ${cwp.submittedBy || 'Explorer'} вписал точку пути #${cwp.num} (${cwp.system}) в регионе ${cwp.regionRu || cwp.region} на дистанции ${cwp.distanceStr} от Meni.${cwp.edsmVerified ? ' Координаты подтверждены в EDSM.' : ''}`,
        content: `Logged by ${cwp.submittedBy || 'CMDR'} at coordinates X:${cwp.x.toFixed(1)}, Y:${cwp.y.toFixed(1)}, Z:${cwp.z.toFixed(1)}. ${cwp.primaryStar ? `Primary star: ${cwp.primaryStar}. ` : ''}${cwp.notableFeatures || ''}`,
        contentRu: `Передано пилотом ${cwp.submittedBy || 'CMDR'}, координаты X:${cwp.x.toFixed(1)}, Y:${cwp.y.toFixed(1)}, Z:${cwp.z.toFixed(1)}. ${cwp.primaryStar ? `Главная звезда: ${cwp.primaryStar}. ` : ''}${cwp.notableFeaturesRu || cwp.notableFeatures || ''}`,
        system: cwp.system,
        region: cwp.region,
        regionRu: cwp.regionRu || cwp.region,
        ...(isActiveTarget
          ? {
              carrierStatus: {
                tritiumTons: 18350,
                jumpState: `Next Carrier Jump Target (${countdownStr})`,
                nextJumpSchedule: `${scheduledJumpGameDate} (${countdownStr})`,
              },
            }
          : {}),
        ...(totalTraffic !== undefined || discoveryCmdr
          ? {
              liveEdsmData: {
                totalTraffic,
                weekTraffic,
                discoveryCmdr,
                shipBreakdown: ships,
              },
            }
          : {}),
        author: `CMDR ${cwp.submittedBy || 'Scout Wing'}`,
        edsmUrl: matchedTraffic?.url ?? EDSM_EXPEDITION_URL,
      });
    });

  // 2) Live Daily Dispatch for Current Mission Day
  dispatches.push({
    id: `news-live-day-${currentDay}`,
    timestamp: now.toISOString(),
    gameDate: formatGameDate(now),
    category: 'operations',
    isPinned: customWaypoints.length === 0,
    title: `Daily Dispatch (Day ${currentDay}): Pre-Jump Staging for ${nextSystem} (${countdownStr})`,
    titleRu: `Ежедневная сводка (День ${currentDay}): Подготовка к прыжку в ${nextSystem} (${countdownStr})`,
    summary: `Expedition enters Day ${currentDay}. Fleet Carrier Space Tourist holds orbit at ${anchorSystem} (${wp2Total} EDSM visits, ${wp2Day} today) ahead of the burn to Waypoint #${nextWp?.num ?? 3} (${nextSystem}).`,
    summaryRu: `Идёт ${currentDay}-й день экспедиции. Флит-карриер Space Tourist удерживает орбиту в ${anchorSystem} (${wp2Total} визитов по EDSM, ${wp2Day} за сутки) перед прыжком к точке #${nextWp?.num ?? 3} (${nextSystem}).`,
    content: `On Day ${currentDay} of the Belka & Strelka Circumnavigation, Fleet Carrier Space Tourist (J7Q-9KY) continues fueling and tritium depot intake in ${anchorSystem} (first discovered by CMDR ${wp2Cmdr}). Scheduled departure for Waypoint #${nextWp?.num ?? 3} (${nextSystem}, ${nextWp?.distanceStr ?? '10,326.61 ly'}) is locked for ${scheduledJumpGameDate} (${countdownStr}). Meanwhile, advance scouts at Waypoint #4 (${wp4Total} ships) and Waypoint #6 (${wp6Total} ships) report clear neutron and exobiology corridors.`,
    contentRu: `На ${currentDay}-й день кругосветки Белки и Стрелки флит-карриер Space Tourist (J7Q-9KY) завершает заправку тритием в системе ${anchorSystem} (первооткрыватель: CMDR ${wp2Cmdr}). Прыжок к точке пути #${nextWp?.num ?? 3} (${nextSystem}, ${nextWp?.distanceStr ?? '10 326,61 св. л.'}) запланирован на ${scheduledJumpGameDate} (${countdownStr}). Передовые разведчики в точках #4 (${wp4Total} кораблей) и #6 (${wp6Total} кораблей) докладывают о чистых коридорах для прыжков и богатой экзобиологии.`,
    system: anchorSystem,
    region: anchorWp?.region || 'Inner Orion Spur',
    regionRu: anchorWp?.regionRu || 'Внутренний рукав Ориона',
    carrierStatus: {
      tritiumTons: 18350,
      jumpState: `Pre-Jump Staging (${countdownStr})`,
      nextJumpSchedule: `${scheduledJumpGameDate} (${countdownStr})`,
    },
    liveEdsmData: {
      totalTraffic: wp2Total,
      weekTraffic: wp2Week,
      dayTraffic: wp2Day,
      discoveryCmdr: wp2Cmdr,
      shipBreakdown: extractShipBreakdown(wp2Traffic),
    },
    author: 'CMDR Trokimus (Expedition Leader)',
    edsmUrl: wp2Traffic?.url ?? EDSM_EXPEDITION_URL,
  });

  // 3) Live Forward Scout Telemetry Dispatch (WP #6 Cyookaea DW-N e6-1)
  dispatches.push({
    id: 'news-live-wp6-scouts',
    timestamp: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    gameDate: formatGameDate(new Date(now.getTime() - 4 * 3600 * 1000)),
    category: 'discovery',
    title: `Forward Scouts Active at Waypoint #6 (Cyookaea DW-N e6-1): ${wp6Day} Ships in Last 24h`,
    titleRu: `Разведка на точке пути #6 (Cyookaea DW-N e6-1): ${wp6Day} кораблей за 24 часа`,
    summary: `Live EDSM transponder logs confirm ${wp6Total} total commander visits (${wp6Week} this week) reaching 19,662.66 ly out in Dryman's Point near the Neutron binary.`,
    summaryRu: `Телеметрия EDSM подтверждает ${wp6Total} визитов командиров (${wp6Week} за неделю) на рубеже 19 662,66 св. лет в секторе Точка Драймана.`,
    content: `Independent exploration wings have pushed ahead to Waypoint #6 (Cyookaea DW-N e6-1, discovered by CMDR ${wp6Cmdr}). Commanders flying ${wp6Ships ? wp6Ships.join(', ') : 'long-range explorers'} logged active supercharging passes and Stratum Laminilim exobiology scans across the ringed worlds.`,
    contentRu: `Независимые исследовательские крылья продвинулись до точки пути #6 (Cyookaea DW-N e6-1, первооткрыватель: CMDR ${wp6Cmdr}). Командиры на кораблях ${wp6Ships ? wp6Ships.join(', ') : 'дальней разведки'} выполнили суперзарядку FSD на нейтронной звезде и собрали образцы Stratum Laminilim.`,
    system: 'Cyookaea DW-N e6-1',
    region: "Dryman's Point",
    regionRu: 'Точка Драймана',
    liveEdsmData: {
      totalTraffic: wp6Total,
      weekTraffic: wp6Week,
      dayTraffic: wp6Day,
      discoveryCmdr: wp6Cmdr,
      shipBreakdown: wp6Ships,
    },
    author: 'Forward Reconnaissance Wing',
    edsmUrl: wp6Traffic?.url ?? EDSM_EXPEDITION_URL,
  });

  // 4) Hawking's Gap & WP #3 / #4 Telemetry Update
  dispatches.push({
    id: 'news-live-wp3-wp4',
    timestamp: '2026-11-10T18:20:00Z',
    gameDate: '10 NOV 2026 18:20 UTC',
    category: 'edsm',
    title: `Hawking's Gap Transit Verified: WP #3 (${wp3Total} CMDRs) & WP #4 (${wp4Total} CMDRs)`,
    titleRu: `Маршрут через Щель Хокинга проверен: WP #3 (${wp3Total} CMDR) и WP #4 (${wp4Total} CMDR)`,
    summary: `Route beacons across Ploi Aim SF-V c3-39 and Pru Ain TP-D d13-4 are live on EDSM ahead of the Fleet Carrier jump sequence.`,
    summaryRu: `Маяки систем Ploi Aim SF-V c3-39 и Pru Ain TP-D d13-4 синхронизированы в EDSM перед прыжком флит-карриера.`,
    content: `EDSM telemetry confirms CMDR ${wp3Cmdr} (WP #3, ${wp3Week} weekly visits) and CMDR ${wp4Cmdr} (WP #4, ${wp4Week} weekly visits) have verified safe carrier parking orbits and tritium mining rings along the Hawking's Gap corridor.`,
    contentRu: `Телеметрия EDSM подтверждает данные CMDR ${wp3Cmdr} (точка #3, ${wp3Week} визитов за неделю) и CMDR ${wp4Cmdr} (точка #4, ${wp4Week} визитов за неделю): орбиты парковки карриера и тритиевые кольца в Щели Хокинга подтверждены.`,
    system: 'Ploi Aim SF-V c3-39',
    region: "Hawking's Gap",
    regionRu: 'Щель Хокинга',
    liveEdsmData: {
      totalTraffic: wp3Total,
      weekTraffic: wp3Week,
      discoveryCmdr: wp3Cmdr,
    },
    author: 'EDSM Relay / Cartography Wing',
    edsmUrl: wp3Traffic?.url ?? EDSM_EXPEDITION_URL,
  });

  // 5) Fleet Carrier Staging at WP #2
  dispatches.push({
    id: 'news-001',
    timestamp: '2026-11-08T14:30:00Z',
    gameDate: '08 NOV 2026 14:30 UTC',
    category: 'carrier',
    isPinned: false,
    title: 'Fleet Carrier Space Tourist Stabilized at Waypoint #2 (Plaa Aescs WR-Z b2-2)',
    titleRu: 'Флит-карриер Space Tourist занял орбиту на точке пути #2 (Plaa Aescs WR-Z b2-2)',
    summary: 'Carrier concluded its initial 7,001.57 ly burn from Meni. Tritium refueling depot and shipyard repairs are open to all docked commanders.',
    summaryRu: 'Авианосец успешно завершил переход из системы Meni, преодолев 7 001,57 св. лет. Заправочное депо трития открыто для всех состыкованных командиров.',
    content: `The flagship mobile base Space Tourist (J7Q-9KY) stabilized orbit around Plaa Aescs WR-Z b2-2 planet 3. Tritium storage holds 18,420 tons. Fleet Carrier navigation computer has plotted the transit itinerary towards Hawking's Gap.`,
    contentRu: `Флагманская мобильная база Space Tourist (J7Q-9KY) стабилизировала орбиту вокруг планеты 3 в системе Plaa Aescs WR-Z b2-2. В хранилищах 18 420 тонн трития. Навигационный компьютер карриера проложил курс в Щель Хокинга.`,
    system: 'Plaa Aescs WR-Z b2-2',
    region: 'Inner Orion Spur',
    regionRu: 'Внутренний рукав Ориона',
    carrierStatus: {
      tritiumTons: 18420,
      jumpState: 'Orbital Hold (Ready for Flight Ops)',
      nextJumpSchedule: scheduledJumpGameDate,
    },
    author: 'Expedition Command / Carrier Captain',
    edsmUrl: EDSM_EXPEDITION_URL,
  });

  // 6) Exobiology Discovery at WP #2
  dispatches.push({
    id: 'news-002',
    timestamp: '2026-11-07T19:15:00Z',
    gameDate: '07 NOV 2026 19:15 UTC',
    category: 'discovery',
    title: 'Exobiology Dispatch: Stratum Cucumisis & Tubus Conifer Cataloged',
    titleRu: 'Сводка экзобиологии: каталогизированы Stratum Cucumisis и Tubus Conifer',
    summary: 'First biological genetic scans recorded on high-metal content world Plaa Aescs WR-Z b2-2 2 C. Exobiologists report excellent specimen diversity.',
    summaryRu: 'Зарегистрированы первые биологические сканы на богатой металлами планете Plaa Aescs WR-Z b2-2 2 C. Разнообразие образцов признано высоким.',
    content: 'Participating commanders logged the first planetary touchdowns of Phase 1. Planet 2 C (0.04 atm Carbon Dioxide, 0.42G) yielded dense carpets of Stratum Cucumisis along the tectonic faultlines and colonies of Tubus Conifer within mountain craters.',
    contentRu: 'Участники экспедиции зафиксировали первые посадки 1-го этапа. На планете 2 C (0,04 атм CO2, 0,42G) обнаружены ковры Stratum Cucumisis вдоль тектонических разломов и колонии Tubus Conifer в горных кратерах.',
    system: 'Plaa Aescs WR-Z b2-2',
    region: 'Inner Orion Spur',
    regionRu: 'Внутренний рукав Ориона',
    author: 'Chief Exobiologist CMDR V. Strelka',
    edsmUrl: EDSM_EXPEDITION_URL,
  });

  // 7) Official Launch from Meni
  dispatches.push({
    id: 'news-005',
    timestamp: '2026-11-01T12:00:00Z',
    gameDate: '01 NOV 2026 12:00 UTC',
    category: 'operations',
    title: 'Official Expedition Launch from Meni: Year-Long Circumnavigation Underway',
    titleRu: 'Официальный старт экспедиции из Meni: годовая кругосветка началась',
    summary: 'The Belka and Strelka Circumnavigation Expedition officially launched with 37 registered commanders embarking on a 295,206.29 ly journey.',
    summaryRu: 'Экспедиция Белки и Стрелки официально стартовала: 37 командиров отправились в путешествие протяженностью 295 206,29 св. лет.',
    content: 'At 12:00 UTC, Fleet Carrier Space Tourist departed Meni after final tritium loading and system diagnostics. The expedition honors the historic pioneer dogs Belka and Strelka, setting an ambitious course through all 42 galactic regions over 362 days.',
    contentRu: 'В 12:00 UTC флит-карриер Space Tourist покинул систему Meni после загрузки трития и проверки всех систем. Экспедиция в честь Белки и Стрелки взяла курс через все 42 региона галактики на 362 дня пути.',
    system: 'Meni',
    region: 'Inner Orion Spur',
    regionRu: 'Внутренний рукав Ориона',
    author: 'Expedition Leader',
    edsmUrl: EDSM_EXPEDITION_URL,
  });

  return dispatches;
}
