import { CaseType, SeasonMonth } from './types';

export interface ZaiMonthlyTheme {
  month: SeasonMonth;
  themeCode: string;
  nameEn: string;
  nameUz: string;
  skinId: string;
  webId: string;
  primaryHex: string;
  secondaryHex: string;
  accentHex: string;
  glowRgba: string;
  releaseDateLabel: string;
}

export const ZAI_MONTHLY_THEMES: Record<SeasonMonth, ZaiMonthlyTheme> = {
  1: {
    month: 1,
    themeCode: 'ZAI-01',
    nameEn: 'Ice Crystal',
    nameUz: 'Muz Kristalli',
    skinId: 'zai_jan_ice',
    webId: 'zai_web_jan_ice',
    primaryHex: '#38bdf8',
    secondaryHex: '#e0f2fe',
    accentHex: '#fbbf24',
    glowRgba: 'rgba(56, 189, 248, 0.38)',
    releaseDateLabel: 'Jan 01',
  },
  2: {
    month: 2,
    themeCode: 'ZAI-02',
    nameEn: 'Heart Galaxy',
    nameUz: 'Yurak Galaktikasi',
    skinId: 'zai_feb_ruby',
    webId: 'zai_web_feb_ruby',
    primaryHex: '#f43f5e',
    secondaryHex: '#c084fc',
    accentHex: '#fbbf24',
    glowRgba: 'rgba(244, 63, 94, 0.38)',
    releaseDateLabel: 'Feb 01',
  },
  3: {
    month: 3,
    themeCode: 'ZAI-03',
    nameEn: 'Emerald',
    nameUz: 'Zumrad',
    skinId: 'zai_mar_emerald',
    webId: 'zai_web_mar_emerald',
    primaryHex: '#10b981',
    secondaryHex: '#a7f3d0',
    accentHex: '#fde047',
    glowRgba: 'rgba(16, 185, 129, 0.38)',
    releaseDateLabel: 'Mar 01',
  },
  4: {
    month: 4,
    themeCode: 'ZAI-04',
    nameEn: 'Spring Bloom',
    nameUz: 'Bahor Gullashi',
    skinId: 'zai_apr_sakura',
    webId: 'zai_web_apr_sakura',
    primaryHex: '#f472b6',
    secondaryHex: '#fbcfe8',
    accentHex: '#fbbf24',
    glowRgba: 'rgba(244, 114, 182, 0.38)',
    releaseDateLabel: 'Apr 01',
  },
  5: {
    month: 5,
    themeCode: 'ZAI-05',
    nameEn: 'Solar',
    nameUz: 'Quyosh Nuri',
    skinId: 'zai_may_forest',
    webId: 'zai_web_may_forest',
    primaryHex: '#facc15',
    secondaryHex: '#bef264',
    accentHex: '#fbbf24',
    glowRgba: 'rgba(250, 204, 21, 0.38)',
    releaseDateLabel: 'May 01',
  },
  6: {
    month: 6,
    themeCode: 'ZAI-06',
    nameEn: 'Summer Flame',
    nameUz: 'Yozgi Alanga',
    skinId: 'zai_jun_ocean',
    webId: 'zai_web_jun_ocean',
    primaryHex: '#f97316',
    secondaryHex: '#fde047',
    accentHex: '#38bdf8',
    glowRgba: 'rgba(249, 115, 22, 0.42)',
    releaseDateLabel: 'Jun 01',
  },
  7: {
    month: 7,
    themeCode: 'ZAI-07',
    nameEn: 'Ocean',
    nameUz: 'Okean',
    skinId: 'zai_jul_solar',
    webId: 'zai_web_jul_solar',
    primaryHex: '#06b6d4',
    secondaryHex: '#67e8f9',
    accentHex: '#fbbf24',
    glowRgba: 'rgba(6, 182, 212, 0.42)',
    releaseDateLabel: 'Jul 01',
  },
  8: {
    month: 8,
    themeCode: 'ZAI-08',
    nameEn: 'Starfall',
    nameUz: 'Yulduzlar Yomg‘iri',
    skinId: 'zai_aug_cosmic',
    webId: 'zai_web_aug_cosmic',
    primaryHex: '#a855f7',
    secondaryHex: '#22d3ee',
    accentHex: '#fde047',
    glowRgba: 'rgba(168, 85, 247, 0.42)',
    releaseDateLabel: 'Aug 01',
  },
  9: {
    month: 9,
    themeCode: 'ZAI-09',
    nameEn: 'Shadow',
    nameUz: 'Soya',
    skinId: 'zai_sep_shadow',
    webId: 'zai_web_sep_shadow',
    primaryHex: '#6366f1',
    secondaryHex: '#1e1b4b',
    accentHex: '#fbbf24',
    glowRgba: 'rgba(99, 102, 241, 0.42)',
    releaseDateLabel: 'Sep 01',
  },
  10: {
    month: 10,
    themeCode: 'ZAI-10',
    nameEn: 'Dark Halloween',
    nameUz: 'Qora Halloween',
    skinId: 'zai_oct_phantom',
    webId: 'zai_web_oct_phantom',
    primaryHex: '#f97316',
    secondaryHex: '#c084fc',
    accentHex: '#fde047',
    glowRgba: 'rgba(249, 115, 22, 0.42)',
    releaseDateLabel: 'Oct 01',
  },
  11: {
    month: 11,
    themeCode: 'ZAI-11',
    nameEn: 'Golden Storm',
    nameUz: 'Oltin Bo‘ron',
    skinId: 'zai_nov_golden',
    webId: 'zai_web_nov_golden',
    primaryHex: '#eab308',
    secondaryHex: '#fde68a',
    accentHex: '#38bdf8',
    glowRgba: 'rgba(234, 179, 8, 0.42)',
    releaseDateLabel: 'Nov 01',
  },
  12: {
    month: 12,
    themeCode: 'ZAI-12',
    nameEn: 'Christmas Crystal',
    nameUz: 'Rojdestvo Kristalli',
    skinId: 'zai_dec_xmas',
    webId: 'zai_web_dec_xmas',
    primaryHex: '#38bdf8',
    secondaryHex: '#ffffff',
    accentHex: '#ef4444',
    glowRgba: 'rgba(186, 230, 253, 0.45)',
    releaseDateLabel: 'Dec 01',
  },
};

export type AnnualZaiEventId = 'zai_summer' | 'zai_starfall' | 'zai_shadow';

export interface AnnualZaiEventDef {
  id: AnnualZaiEventId;
  caseType: Extract<CaseType, 'zai_summer' | 'zai_starfall' | 'zai_shadow'>;
  month: number; // 1..12
  day: number; // 1..31
  durationDays: number;
  title: string;
  dateLabel: string;
  exclusiveSkinId: string;
  exclusiveWebId: string;
  accentHex: string;
  secondaryHex: string;
  descriptionEn: string;
}

export const ANNUAL_ZAI_EVENTS: AnnualZaiEventDef[] = [
  {
    id: 'zai_summer',
    caseType: 'zai_summer',
    month: 6,
    day: 10,
    durationDays: 7,
    title: 'ZAI SUMMER CASE',
    dateLabel: 'June 10',
    exclusiveSkinId: 'zai_event_summer',
    exclusiveWebId: 'zai_web_event_summer',
    accentHex: '#06b6d4',
    secondaryHex: '#fde047',
    descriptionEn: 'Sun-forged ocean prism Spikey armor, luminous azure-gold silk webs, and limited annual case drops.',
  },
  {
    id: 'zai_starfall',
    caseType: 'zai_starfall',
    month: 8,
    day: 23,
    durationDays: 7,
    title: 'ZAI STARFALL CASE',
    dateLabel: 'August 23',
    exclusiveSkinId: 'zai_event_starfall',
    exclusiveWebId: 'zai_web_event_starfall',
    accentHex: '#c084fc',
    secondaryHex: '#38bdf8',
    descriptionEn: 'Celestial meteor-shower armor, galaxy-threaded webs, and ultra-rare Starfall limited collectibles.',
  },
  {
    id: 'zai_shadow',
    caseType: 'zai_shadow',
    month: 9,
    day: 9,
    durationDays: 7,
    title: 'ZAI SHADOW CASE',
    dateLabel: 'September 9',
    exclusiveSkinId: 'zai_event_shadow',
    exclusiveWebId: 'zai_web_event_shadow',
    accentHex: '#fbbf24',
    secondaryHex: '#6366f1',
    descriptionEn: 'Obsidian Shadow Monarch carapace trimmed in brushed champagne gold with eclipse silk patterns.',
  },
];

export type ZaiEventSimMode =
  | 'live'
  | 'warning_7d'
  | 'warning_24h'
  | 'warning_1h'
  | 'active_now';

export type ZaiWarningPhase =
  | 'none'
  | 'warning_7d'
  | 'warning_24h'
  | 'warning_1h'
  | 'active_now';

export interface AnnualZaiEventStatus {
  event: AnnualZaiEventDef;
  isActive: boolean;
  isUpcoming: boolean;
  targetStart: Date;
  targetEnd: Date;
  countdownMs: number;
  countdownText: string; // DD:HH:MM:SS
  countdownParts: {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  };
  year: number;
}

export interface ZaiAnnouncementSnapshot {
  status: AnnualZaiEventStatus;
  phase: ZaiWarningPhase;
  daysLeftCeil: number;
  eventInstanceKey: string; // e.g. zai_summer_2027
}

export function getCountdownParts(ms: number) {
  const clamped = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(clamped / 86400);
  const hours = Math.floor((clamped % 86400) / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(mins),
    seconds: pad(secs),
  };
}

export function formatCountdownDDHHMMSS(ms: number): string {
  const p = getCountdownParts(ms);
  return `${p.days}:${p.hours}:${p.minutes}:${p.seconds}`;
}

export function getAnnualZaiEventStatus(
  eventOrId: AnnualZaiEventDef | AnnualZaiEventId,
  now: Date = new Date()
): AnnualZaiEventStatus {
  const event =
    typeof eventOrId === 'string'
      ? ANNUAL_ZAI_EVENTS.find((e) => e.id === eventOrId) ?? ANNUAL_ZAI_EVENTS[0]
      : eventOrId;

  const year = now.getFullYear();
  const thisStart = new Date(year, event.month - 1, event.day, 0, 0, 0, 0);
  const thisEnd = new Date(
    year,
    event.month - 1,
    event.day + event.durationDays - 1,
    23,
    59,
    59,
    999
  );

  if (now >= thisStart && now <= thisEnd) {
    const remaining = thisEnd.getTime() - now.getTime();
    return {
      event,
      isActive: true,
      isUpcoming: false,
      targetStart: thisStart,
      targetEnd: thisEnd,
      countdownMs: remaining,
      countdownText: formatCountdownDDHHMMSS(remaining),
      countdownParts: getCountdownParts(remaining),
      year,
    };
  }

  const nextStart =
    now < thisStart
      ? thisStart
      : new Date(year + 1, event.month - 1, event.day, 0, 0, 0, 0);
  const nextEnd = new Date(
    nextStart.getFullYear(),
    event.month - 1,
    event.day + event.durationDays - 1,
    23,
    59,
    59,
    999
  );
  const waitMs = nextStart.getTime() - now.getTime();

  return {
    event,
    isActive: false,
    isUpcoming: true,
    targetStart: nextStart,
    targetEnd: nextEnd,
    countdownMs: waitMs,
    countdownText: formatCountdownDDHHMMSS(waitMs),
    countdownParts: getCountdownParts(waitMs),
    year: nextStart.getFullYear(),
  };
}

export function isZaiEventWindowOpen(eventId?: string, now: Date = new Date()): boolean {
  if (!eventId) return false;
  if (eventId !== 'zai_summer' && eventId !== 'zai_starfall' && eventId !== 'zai_shadow') {
    return false;
  }
  return getAnnualZaiEventStatus(eventId, now).isActive;
}

export function isZaiMonthlyWindowOpen(seasonalMonth?: number, now: Date = new Date()): boolean {
  const monthNow = now.getMonth() + 1;
  const dayNow = now.getDate();
  if (dayNow < 1 || dayNow > 7) return false;
  if (typeof seasonalMonth === 'number') {
    return monthNow === seasonalMonth;
  }
  return true;
}

export function isZaiItemAvailableNow(
  item: { isZaiLimited?: boolean; eventId?: string; seasonalMonth?: number },
  now: Date = new Date()
): boolean {
  if (!item.isZaiLimited) return true;
  if (item.eventId) {
    return isZaiEventWindowOpen(item.eventId, now);
  }
  if (typeof item.seasonalMonth === 'number') {
    return isZaiMonthlyWindowOpen(item.seasonalMonth, now);
  }
  return false;
}

export function isZaiCaseAvailableNow(
  caseDef: { type: CaseType; isZaiLimited?: boolean; eventId?: string },
  now: Date = new Date()
): boolean {
  if (!caseDef.isZaiLimited) return true;
  if (caseDef.eventId) {
    return isZaiEventWindowOpen(caseDef.eventId, now);
  }
  if (caseDef.type === 'zai_monthly') {
    return isZaiMonthlyWindowOpen(undefined, now);
  }
  return false;
}

export function isAnyZaiCollectionActiveNow(now: Date = new Date()): boolean {
  const anyAnnual = ANNUAL_ZAI_EVENTS.some((ev) => getAnnualZaiEventStatus(ev, now).isActive);
  return anyAnnual || isZaiMonthlyWindowOpen(undefined, now);
}

export function getNextAnnualZaiEventStatus(now: Date = new Date()): AnnualZaiEventStatus {
  const statuses = ANNUAL_ZAI_EVENTS.map((ev) => getAnnualZaiEventStatus(ev, now));
  const active = statuses.find((s) => s.isActive);
  if (active) return active;
  statuses.sort((a, b) => a.countdownMs - b.countdownMs);
  return statuses[0];
}

/**
 * Computes an effective Date when the Events Preview Simulator is active,
 * allowing instant verification of 7-day, 24-hour, 1-hour, and release-day states
 * while keeping real calendar countdowns as default ('live').
 */
export function getEffectiveEventClock(
  simMode: ZaiEventSimMode,
  simTargetEventId: AnnualZaiEventId | null,
  simAnchorRealMs: number,
  realNow: Date = new Date()
): Date {
  if (simMode === 'live') return realNow;
  const elapsedSinceSimStartMs = Math.max(0, realNow.getTime() - simAnchorRealMs);
  const baseUpcoming = simTargetEventId
    ? getAnnualZaiEventStatus(simTargetEventId, realNow)
    : getNextAnnualZaiEventStatus(realNow);

  const releaseMs = baseUpcoming.targetStart.getTime();
  const ONE_HOUR = 3600 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  if (simMode === 'warning_7d') {
    // 6d 23h 59m 55s remaining and counting down every second!
    return new Date(releaseMs - (7 * ONE_DAY - 5000) + elapsedSinceSimStartMs);
  }
  if (simMode === 'warning_24h') {
    return new Date(releaseMs - (23 * ONE_HOUR + 59 * 60000 + 50000) + elapsedSinceSimStartMs);
  }
  if (simMode === 'warning_1h') {
    return new Date(releaseMs - (59 * 60000 + 50000) + elapsedSinceSimStartMs);
  }
  // 'active_now' -> 12 seconds inside the active release window!
  return new Date(releaseMs + 12000 + elapsedSinceSimStartMs);
}

/**
 * Resolves the active Roblox-style Red Neon Warning / Gold Release Banner state.
 * Activates automatically within 7 days before release, escalates at <=24h and <=1h,
 * and transforms cleanly into Gold+Red AVAILABLE NOW during the active event window.
 */
export function getActiveOrWarningZaiAnnouncement(now: Date = new Date()): ZaiAnnouncementSnapshot {
  const status = getNextAnnualZaiEventStatus(now);
  const SEVEN_DAYS_MS = 7 * 24 * 3600 * 1000;
  const ONE_DAY_MS = 24 * 3600 * 1000;
  const ONE_HOUR_MS = 3600 * 1000;

  let phase: ZaiWarningPhase = 'none';
  if (status.isActive) {
    phase = 'active_now';
  } else if (status.countdownMs <= ONE_HOUR_MS) {
    phase = 'warning_1h';
  } else if (status.countdownMs <= ONE_DAY_MS) {
    phase = 'warning_24h';
  } else if (status.countdownMs <= SEVEN_DAYS_MS) {
    phase = 'warning_7d';
  }

  const daysLeftCeil = status.isActive
    ? 0
    : Math.max(1, Math.min(7, Math.ceil(status.countdownMs / ONE_DAY_MS)));

  return {
    status,
    phase,
    daysLeftCeil,
    eventInstanceKey: `${status.event.id}_${status.year}`,
  };
}
