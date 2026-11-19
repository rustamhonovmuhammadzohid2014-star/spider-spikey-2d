import { CASE_MAP, CaseSpinResult, buildCaseRouletteReel, rollCaseOutcome } from './cases';
import {
  LiveCalendarInfo,
  buildSeasonPassLevels,
  getLiveCalendarInfo,
  getSeasonLevelFromXp,
} from './seasons';
import { ALL_SKINS, RARITY_META, getSkinById, getSkinMinLevel, starterColorToSkinId } from './skins';
import {
  AchievementDef,
  CaseType,
  EconomyData,
  EconomyTransaction,
  SpiderColorId,
} from './types';
import { ALL_WEB_DESIGNS, getWebDesignById } from './webDesigns';
import { isZaiEventWindowOpen } from './zaiCollection';

export const MAX_PLAYER_LEVEL = 100;

export function getPlayerXpForNextLevel(level: number): number {
  const lvl = Math.max(1, Math.min(MAX_PLAYER_LEVEL, Math.floor(level)));
  return 100 + (lvl - 1) * 65;
}

export function getPlayerLevelProgress(totalXp: number): {
  level: number;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  ratio: number;
} {
  let remaining = Math.max(0, Math.floor(totalXp));
  let level = 1;
  while (level < MAX_PLAYER_LEVEL) {
    const req = getPlayerXpForNextLevel(level);
    if (remaining < req) {
      return {
        level,
        totalXp: Math.max(0, Math.floor(totalXp)),
        currentLevelXp: remaining,
        nextLevelXp: req,
        ratio: Math.min(1, remaining / req),
      };
    }
    remaining -= req;
    level += 1;
  }
  const capReq = getPlayerXpForNextLevel(MAX_PLAYER_LEVEL);
  return {
    level: MAX_PLAYER_LEVEL,
    totalXp: Math.max(0, Math.floor(totalXp)),
    currentLevelXp: capReq,
    nextLevelXp: capReq,
    ratio: 1,
  };
}

export function addPlayerXp(draft: EconomyData, xpAmount: number): void {
  if (xpAmount <= 0) return;
  const curXp = Math.max(0, Math.floor(draft.playerXp ?? 0));
  const nextXp = Math.min(10000000, curXp + Math.floor(xpAmount));
  draft.playerXp = nextXp;
  draft.playerLevel = getPlayerLevelProgress(nextXp).level;
}

const ECONOMY_KEY_PREFIX = 'spider_spikey_economy_v1_';

export interface DailyRewardDef {
  day: number;
  kind: 'coins' | 'case' | 'skin' | 'mythicBundle';
  coins?: number;
  caseType?: CaseType;
  skinId?: string;
  xpBonus?: number;
  labelUz: string;
  milestone?: 'day10' | 'day20' | 'day30';
}

export const DAILY_REWARDS_30: DailyRewardDef[] = [
  { day: 1, kind: 'coins', coins: 100, xpBonus: 30, labelUz: '100 Tanga' },
  { day: 2, kind: 'coins', coins: 150, xpBonus: 30, labelUz: '150 Tanga' },
  { day: 3, kind: 'case', caseType: 'common', xpBonus: 40, labelUz: 'Oddiy Keys' },
  { day: 4, kind: 'coins', coins: 200, xpBonus: 40, labelUz: '200 Tanga' },
  { day: 5, kind: 'skin', skinId: 'blue_neon', xpBonus: 50, labelUz: 'Tasodifiy Skin' },
  { day: 6, kind: 'coins', coins: 250, xpBonus: 50, labelUz: '250 Tanga' },
  { day: 7, kind: 'case', caseType: 'rare', xpBonus: 70, labelUz: 'Nodir Keys' },
  { day: 8, kind: 'coins', coins: 300, xpBonus: 50, labelUz: '300 Tanga' },
  { day: 9, kind: 'case', caseType: 'uncommon', xpBonus: 60, labelUz: 'Noyobroq Keys' },
  {
    day: 10,
    kind: 'case',
    caseType: 'legendary',
    coins: 250,
    xpBonus: 120,
    labelUz: 'Afsonaviy Keys + 250 Tanga',
    milestone: 'day10',
  },
  { day: 11, kind: 'coins', coins: 350, xpBonus: 50, labelUz: '350 Tanga' },
  { day: 12, kind: 'case', caseType: 'uncommon', xpBonus: 60, labelUz: 'Noyobroq Keys' },
  { day: 13, kind: 'coins', coins: 400, xpBonus: 60, labelUz: '400 Tanga' },
  { day: 14, kind: 'case', caseType: 'rare', xpBonus: 80, labelUz: 'Nodir Keys' },
  { day: 15, kind: 'skin', skinId: 'flame_spikey', xpBonus: 90, labelUz: 'Olovli Skin' },
  { day: 16, kind: 'coins', coins: 450, xpBonus: 60, labelUz: '450 Tanga' },
  { day: 17, kind: 'case', caseType: 'rare', xpBonus: 80, labelUz: 'Nodir Keys' },
  { day: 18, kind: 'coins', coins: 500, xpBonus: 70, labelUz: '500 Tanga' },
  { day: 19, kind: 'case', caseType: 'epic', xpBonus: 100, labelUz: 'Epik Keys' },
  {
    day: 20,
    kind: 'case',
    caseType: 'legendary',
    coins: 1000,
    xpBonus: 200,
    labelUz: 'Afsonaviy Keys + 1,000 Tanga',
    milestone: 'day20',
  },
  { day: 21, kind: 'coins', coins: 600, xpBonus: 80, labelUz: '600 Tanga' },
  { day: 22, kind: 'case', caseType: 'seasonal', xpBonus: 100, labelUz: 'Sezon Keysi' },
  { day: 23, kind: 'coins', coins: 700, xpBonus: 80, labelUz: '700 Tanga' },
  { day: 24, kind: 'skin', skinId: 'crystal_web', xpBonus: 120, labelUz: 'Epik Kristall Skin' },
  { day: 25, kind: 'case', caseType: 'epic', xpBonus: 120, labelUz: 'Epik Keys' },
  { day: 26, kind: 'coins', coins: 850, xpBonus: 100, labelUz: '850 Tanga' },
  { day: 27, kind: 'case', caseType: 'seasonal', xpBonus: 120, labelUz: 'Sezon Keysi' },
  { day: 28, kind: 'coins', coins: 1000, xpBonus: 120, labelUz: '1,000 Tanga' },
  { day: 29, kind: 'case', caseType: 'legendary', xpBonus: 150, labelUz: 'Afsonaviy Keys' },
  {
    day: 30,
    kind: 'mythicBundle',
    caseType: 'mythic',
    coins: 2500,
    xpBonus: 500,
    labelUz: 'MIFIK KEYS + 2,500 Tanga + 500 XP',
    milestone: 'day30',
  },
];

export interface SpecialItemMeta {
  id: string;
  nameUz: string;
  descriptionUz: string;
  priceCoins: number;
}

export const SPECIAL_ITEMS_META: Record<string, SpecialItemMeta> = {
  xp_boost: {
    id: 'xp_boost',
    nameUz: 'Sezon XP Kuchaytirgich',
    descriptionUz: 'Foydalanilganda darhol +150 Sezon XP beradi.',
    priceCoins: 350,
  },
  lucky_clover: {
    id: 'lucky_clover',
    nameUz: 'Oltin Omad Nishoni',
    descriptionUz: 'Inventardagi noyob kolleksiya buyumi (+200 tanga qiymat).',
    priceCoins: 500,
  },
  season_token: {
    id: 'season_token',
    nameUz: 'Bayram Nishoni',
    descriptionUz: 'Bayram tadbirlaridan olinadigan maxsus medal.',
    priceCoins: 400,
  },
};

export interface MissionDef {
  id: string;
  period: 'daily' | 'weekly' | 'seasonal';
  titleUz: string;
  descriptionUz: string;
  target: number;
  rewardCoins: number;
  rewardXp: number;
  metric: 'stages_cleared' | 'enemies_defeated' | 'coins_collected' | 'crystals_collected' | 'bosses_defeated' | 'cases_opened';
}

export const ALL_MISSIONS: MissionDef[] = [
  // Daily
  {
    id: 'd_stage_1',
    period: 'daily',
    titleUz: 'Kunlik Sarguzasht',
    descriptionUz: 'Bugun 1 ta bosqichni muvaffaqiyatli yakunlang.',
    target: 1,
    rewardCoins: 150,
    rewardXp: 80,
    metric: 'stages_cleared',
  },
  {
    id: 'd_enemies_10',
    period: 'daily',
    titleUz: 'Zararkunanda Ovchisi',
    descriptionUz: 'Bugun 10 ta dushmanni mag‘lub eting.',
    target: 10,
    rewardCoins: 120,
    rewardXp: 70,
    metric: 'enemies_defeated',
  },
  {
    id: 'd_coins_40',
    period: 'daily',
    titleUz: 'Tanga Teruvchi',
    descriptionUz: 'Bosqichlarda 40 ta tanga yig‘ing.',
    target: 40,
    rewardCoins: 140,
    rewardXp: 75,
    metric: 'coins_collected',
  },
  {
    id: 'd_case_1',
    period: 'daily',
    titleUz: 'Omad Sandig‘i',
    descriptionUz: 'Bugun kamida 1 ta keys oching.',
    target: 1,
    rewardCoins: 180,
    rewardXp: 90,
    metric: 'cases_opened',
  },
  // Weekly
  {
    id: 'w_stages_5',
    period: 'weekly',
    titleUz: 'Haftalik Qahramon',
    descriptionUz: 'Ushbu haftada 5 ta bosqichni yakunlang.',
    target: 5,
    rewardCoins: 500,
    rewardXp: 250,
    metric: 'stages_cleared',
  },
  {
    id: 'w_boss_1',
    period: 'weekly',
    titleUz: 'Boss Yenguvchi',
    descriptionUz: 'Hafta davomida 1 ta dunyo bossini mag‘lub eting.',
    target: 1,
    rewardCoins: 650,
    rewardXp: 300,
    metric: 'bosses_defeated',
  },
  {
    id: 'w_crystals_3',
    period: 'weekly',
    titleUz: 'Kristall Yig‘uvchi',
    descriptionUz: 'Hafta davomida 3 ta Sehrli Kristall toping.',
    target: 3,
    rewardCoins: 450,
    rewardXp: 220,
    metric: 'crystals_collected',
  },
  // Seasonal
  {
    id: 's_stages_12',
    period: 'seasonal',
    titleUz: 'Sezon Fathchisi',
    descriptionUz: 'Joriy sezonda 12 ta bosqichni yakunlang.',
    target: 12,
    rewardCoins: 1200,
    rewardXp: 600,
    metric: 'stages_cleared',
  },
  {
    id: 's_bosses_3',
    period: 'seasonal',
    titleUz: 'Sezon Bosslari Qiroli',
    descriptionUz: 'Joriy sezonda 3 ta boss jangida g‘alaba qozoning.',
    target: 3,
    rewardCoins: 1500,
    rewardXp: 750,
    metric: 'bosses_defeated',
  },
  {
    id: 's_cases_5',
    period: 'seasonal',
    titleUz: 'Kolleksioner Ruhi',
    descriptionUz: 'Joriy sezonda 5 ta keys oching.',
    target: 5,
    rewardCoins: 1000,
    rewardXp: 500,
    metric: 'cases_opened',
  },
  {
    id: 's_coins_500',
    period: 'seasonal',
    titleUz: 'Sezon Boyligi',
    descriptionUz: 'Bosqichlardan 500 ta tanga yig‘ing.',
    target: 500,
    rewardCoins: 1200,
    rewardXp: 600,
    metric: 'coins_collected',
  },
];

export const ECONOMY_ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_skin_buy',
    title: 'Ilk Moda Qadami',
    description: 'Marketdan ilk skinni sotib oling.',
    icon: 'sparkles',
    rewardCoins: 150,
    rewardXp: 80,
    category: 'economy',
  },
  {
    id: 'collector_5',
    title: 'Skin Kolleksioneri',
    description: 'Inventaringizda 5 xil skinga ega bo‘ling.',
    icon: 'award',
    rewardCoins: 400,
    rewardXp: 150,
    category: 'economy',
  },
  {
    id: 'collector_15',
    title: 'Buyuk Kolleksioner',
    description: 'Inventaringizda 15 xil skinga ega bo‘ling.',
    icon: 'crown',
    rewardCoins: 1200,
    rewardXp: 400,
    category: 'economy',
  },
  {
    id: 'case_opener_1',
    title: 'Ilk Omad Sinovi',
    description: 'Birinchi marta keys oching.',
    icon: 'box',
    rewardCoins: 150,
    rewardXp: 90,
    category: 'economy',
  },
  {
    id: 'case_opener_10',
    title: 'Keys Ustasi',
    description: 'Jami 10 ta keys oching.',
    icon: 'box',
    rewardCoins: 600,
    rewardXp: 250,
    category: 'economy',
  },
  {
    id: 'mythic_hunter',
    title: 'Mifik Afsona',
    description: 'MIFIK darajadagi skinga ega bo‘ling!',
    icon: 'flame',
    rewardCoins: 2000,
    rewardXp: 500,
    category: 'economy',
  },
  {
    id: 'season_lvl_10',
    title: 'Sezon Boshlovchisi',
    description: 'Sezon Pass 10-darajasiga chiqing.',
    icon: 'star',
    rewardCoins: 300,
    rewardXp: 100,
    category: 'economy',
  },
  {
    id: 'season_lvl_25',
    title: 'Sezon Tajribakori',
    description: 'Sezon Pass 25-darajasiga chiqing.',
    icon: 'star',
    rewardCoins: 800,
    rewardXp: 200,
    category: 'economy',
  },
  {
    id: 'season_lvl_50',
    title: 'Sezon Mutlaq Qiroli',
    description: 'Sezon Pass 50-darajasini zabt eting!',
    icon: 'trophy',
    rewardCoins: 2500,
    rewardXp: 0,
    category: 'economy',
  },
  {
    id: 'streak_7',
    title: 'Haftalik Sadoqat',
    description: '7 kun ketma-ket kunlik sovg‘a oling.',
    icon: 'calendar',
    rewardCoins: 400,
    rewardXp: 180,
    category: 'economy',
  },
  {
    id: 'rich_5000',
    title: 'Weboria Millioneri',
    description: 'Hisobingizda 5,000 Spikey Coins to‘plang.',
    icon: 'coins',
    rewardCoins: 500,
    rewardXp: 200,
    category: 'economy',
  },
  {
    id: 'trader_1',
    title: 'Halol Savdogar',
    description: 'Boshqa o‘yinchi bilan real skin savdosini yakunlang.',
    icon: 'handshake',
    rewardCoins: 350,
    rewardXp: 150,
    category: 'economy',
  },
];

export function createInitialEconomyData(
  ownerId = 'local',
  initialCoins = 0,
  starterColor: SpiderColorId = 'classic',
  cal: LiveCalendarInfo = getLiveCalendarInfo()
): EconomyData {
  const starterSkin = starterColorToSkinId(starterColor);
  const ownedSkins: Record<string, number> = { classic: 1 };
  if (starterSkin !== 'classic') {
    ownedSkins[starterSkin] = 1;
  }
  return {
    ownerId,
    spikeyCoins: Math.max(0, Math.floor(initialCoins)),
    equippedSkin: starterSkin,
    ownedSkins,
    ownedCases: {
      common: 1, // Starter welcome Common Case so players can immediately experience opening a case!
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
      seasonal: 0,
      zai_monthly: 0,
      zai_summer: 0,
      zai_starfall: 0,
      zai_shadow: 0,
    },
    specialItems: {
      xp_boost: 0,
      lucky_clover: 0,
      season_token: 0,
    },
    seasonMonthKey: cal.monthKey,
    seasonXp: 0,
    claimedSeasonLevels: [],
    dailyStreak: 0,
    claimedDailyDays: [],
    lastDailyClaimDate: '',
    dailyMissionDate: cal.dateKey,
    weeklyMissionKey: cal.weekKey,
    missionProgress: {},
    claimedMissions: [],
    holidayClaimedIds: [],
    casesOpenedTotal: 0,
    mythicsFoundTotal: 0,
    skinsSoldTotal: 0,
    tradesCompletedTotal: 0,
    unlockedEconomyAchievements: [],
    transactions: [],
    processedTxIds: [],
    playerXp: 0,
    playerLevel: 1,
    equippedWebDesign: 'classic_white',
    ownedWebDesigns: { classic_white: 1 },
    selectedLanguage: 'en',
  };
}

export function normalizeEconomyData(
  raw: Partial<EconomyData> | null | undefined,
  ownerId = 'local',
  cal: LiveCalendarInfo = getLiveCalendarInfo()
): EconomyData {
  const base = createInitialEconomyData(ownerId, 0, 'classic', cal);
  if (!raw) return base;

  const rawXp = Math.max(0, Math.floor(raw.playerXp ?? 0));
  const derivedLevel = getPlayerLevelProgress(rawXp).level;

  const merged: EconomyData = {
    ...base,
    ...raw,
    ownerId: raw.ownerId || ownerId,
    spikeyCoins: Math.max(0, Math.min(50000000, Math.floor(raw.spikeyCoins ?? 0))),
    equippedSkin: raw.equippedSkin || 'classic',
    ownedSkins: { classic: 1, ...(raw.ownedSkins ?? {}) },
    ownedCases: { ...base.ownedCases, ...(raw.ownedCases ?? {}) },
    specialItems: { ...base.specialItems, ...(raw.specialItems ?? {}) },
    claimedSeasonLevels: Array.isArray(raw.claimedSeasonLevels) ? [...raw.claimedSeasonLevels] : [],
    claimedDailyDays: Array.isArray(raw.claimedDailyDays) ? [...raw.claimedDailyDays] : [],
    missionProgress: { ...(raw.missionProgress ?? {}) },
    claimedMissions: Array.isArray(raw.claimedMissions) ? [...raw.claimedMissions] : [],
    holidayClaimedIds: Array.isArray(raw.holidayClaimedIds) ? [...raw.holidayClaimedIds] : [],
    unlockedEconomyAchievements: Array.isArray(raw.unlockedEconomyAchievements)
      ? [...raw.unlockedEconomyAchievements]
      : [],
    transactions: Array.isArray(raw.transactions) ? raw.transactions.slice(0, 40) : [],
    processedTxIds: Array.isArray(raw.processedTxIds) ? raw.processedTxIds.slice(-120) : [],
    playerXp: rawXp,
    playerLevel: Math.max(derivedLevel, Math.floor(raw.playerLevel ?? 1)),
    equippedWebDesign: raw.equippedWebDesign || 'classic_white',
    ownedWebDesigns: { classic_white: 1, ...(raw.ownedWebDesigns ?? {}) },
    selectedLanguage: raw.selectedLanguage || 'en',
  };

  // Auto-roll live monthly season if real calendar month has changed
  if (merged.seasonMonthKey !== cal.monthKey) {
    merged.seasonMonthKey = cal.monthKey;
    merged.seasonXp = 0;
    merged.claimedSeasonLevels = [];
    for (const m of ALL_MISSIONS.filter((x) => x.period === 'seasonal')) {
      delete merged.missionProgress[`seasonal:${m.metric}`];
      merged.claimedMissions = merged.claimedMissions.filter((id) => id !== m.id);
    }
  }

  // Auto-reset daily missions if calendar date changed
  if (merged.dailyMissionDate !== cal.dateKey) {
    merged.dailyMissionDate = cal.dateKey;
    for (const key of Object.keys(merged.missionProgress)) {
      if (key.startsWith('daily:')) delete merged.missionProgress[key];
    }
    merged.claimedMissions = merged.claimedMissions.filter(
      (id) => !ALL_MISSIONS.some((m) => m.id === id && m.period === 'daily')
    );
  }

  // Auto-reset weekly missions if calendar week changed
  if (merged.weeklyMissionKey !== cal.weekKey) {
    merged.weeklyMissionKey = cal.weekKey;
    for (const key of Object.keys(merged.missionProgress)) {
      if (key.startsWith('weekly:')) delete merged.missionProgress[key];
    }
    merged.claimedMissions = merged.claimedMissions.filter(
      (id) => !ALL_MISSIONS.some((m) => m.id === id && m.period === 'weekly')
    );
  }

  // Guarantee equipped skin and web design are owned
  if (!merged.ownedSkins[merged.equippedSkin] || merged.ownedSkins[merged.equippedSkin] <= 0) {
    merged.equippedSkin = 'classic';
  }
  const equippedWeb = merged.equippedWebDesign || 'classic_white';
  if (!merged.ownedWebDesigns || !merged.ownedWebDesigns[equippedWeb] || merged.ownedWebDesigns[equippedWeb] <= 0) {
    merged.equippedWebDesign = 'classic_white';
  }

  return merged;
}

export function loadLocalEconomy(uid?: string, cal = getLiveCalendarInfo()): EconomyData {
  try {
    const raw = localStorage.getItem(`${ECONOMY_KEY_PREFIX}${uid ?? 'local'}`);
    if (!raw) return createInitialEconomyData(uid ?? 'local', 0, 'classic', cal);
    return normalizeEconomyData(JSON.parse(raw) as Partial<EconomyData>, uid ?? 'local', cal);
  } catch {
    return createInitialEconomyData(uid ?? 'local', 0, 'classic', cal);
  }
}

export function persistLocalEconomy(data: EconomyData, uid?: string): void {
  try {
    localStorage.setItem(`${ECONOMY_KEY_PREFIX}${uid ?? 'local'}`, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

function appendTx(
  draft: EconomyData,
  txId: string,
  kind: EconomyTransaction['kind'],
  amount: number,
  labelUz: string
): boolean {
  if (draft.processedTxIds.includes(txId)) {
    return false;
  }
  draft.processedTxIds = [...draft.processedTxIds.slice(-119), txId];
  draft.transactions = [
    {
      id: txId,
      kind,
      amount,
      labelUz,
      timestamp: new Date().toISOString(),
    },
    ...draft.transactions,
  ].slice(0, 40);
  return true;
}

export function grantSkinCount(draft: EconomyData, skinId: string, count = 1): void {
  draft.ownedSkins[skinId] = (draft.ownedSkins[skinId] ?? 0) + count;
}

export function evaluateEconomyAchievements(draft: EconomyData): string[] {
  const newly: string[] = [];
  const grant = (id: string) => {
    if (!draft.unlockedEconomyAchievements.includes(id)) {
      const def = ECONOMY_ACHIEVEMENTS.find((a) => a.id === id);
      draft.unlockedEconomyAchievements.push(id);
      newly.push(id);
      if (def) {
        if (def.rewardCoins && def.rewardCoins > 0) {
          draft.spikeyCoins += def.rewardCoins;
          appendTx(draft, `ach_${id}`, 'earn', def.rewardCoins, `Yutuq: ${def.title}`);
        }
        if (def.rewardXp && def.rewardXp > 0) {
          draft.seasonXp += def.rewardXp;
        }
      }
    }
  };

  const uniqueOwnedCount = Object.values(draft.ownedSkins).filter((qty) => qty > 0).length;
  if (uniqueOwnedCount >= 2) grant('first_skin_buy');
  if (uniqueOwnedCount >= 5) grant('collector_5');
  if (uniqueOwnedCount >= 15) grant('collector_15');
  if (draft.casesOpenedTotal >= 1) grant('case_opener_1');
  if (draft.casesOpenedTotal >= 10) grant('case_opener_10');

  const ownsMythic = Object.entries(draft.ownedSkins).some(
    ([sid, qty]) => qty > 0 && getSkinById(sid).rarity === 'mythic'
  );
  if (ownsMythic || draft.mythicsFoundTotal > 0) grant('mythic_hunter');

  const sLvl = getSeasonLevelFromXp(draft.seasonXp);
  if (sLvl >= 10) grant('season_lvl_10');
  if (sLvl >= 25) grant('season_lvl_25');
  if (sLvl >= 50) grant('season_lvl_50');
  if (draft.dailyStreak >= 7) grant('streak_7');
  if (draft.spikeyCoins >= 5000) grant('rich_5000');
  if (draft.tradesCompletedTotal >= 1) grant('trader_1');

  return newly;
}

export function applyGameplayRewards(
  prev: EconomyData,
  input: {
    txId: string;
    coinsEarned: number;
    crystalsFound: number;
    enemiesDefeated: number;
    bossDefeated: boolean;
    stageCompleted: boolean;
  },
  cal = getLiveCalendarInfo()
): { next: EconomyData; newlyAchievements: string[]; xpEarned: number } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  if (next.processedTxIds.includes(input.txId)) {
    return { next, newlyAchievements: [], xpEarned: 0 };
  }

  let xpEarned = 0;
  if (input.stageCompleted) xpEarned += input.bossDefeated ? 140 : 75;
  xpEarned += input.crystalsFound * 25;
  xpEarned += Math.min(60, input.enemiesDefeated * 4);

  if (input.coinsEarned > 0) {
    next.spikeyCoins += input.coinsEarned;
    appendTx(next, input.txId, 'earn', input.coinsEarned, 'Bosqichdan yig‘ilgan tangalar');
  } else {
    next.processedTxIds = [...next.processedTxIds.slice(-119), input.txId];
  }

  next.seasonXp += xpEarned;
  addPlayerXp(next, xpEarned);

  const bump = (metric: MissionDef['metric'], amount: number) => {
    if (amount <= 0) return;
    next.missionProgress[`daily:${metric}`] = (next.missionProgress[`daily:${metric}`] ?? 0) + amount;
    next.missionProgress[`weekly:${metric}`] = (next.missionProgress[`weekly:${metric}`] ?? 0) + amount;
    next.missionProgress[`seasonal:${metric}`] = (next.missionProgress[`seasonal:${metric}`] ?? 0) + amount;
  };

  if (input.stageCompleted) bump('stages_cleared', 1);
  if (input.bossDefeated) bump('bosses_defeated', 1);
  bump('coins_collected', input.coinsEarned);
  bump('crystals_collected', input.crystalsFound);
  bump('enemies_defeated', input.enemiesDefeated);

  const newlyAchievements = evaluateEconomyAchievements(next);
  return { next, newlyAchievements, xpEarned };
}

export function buySkinAction(
  prev: EconomyData,
  skinId: string,
  cal = getLiveCalendarInfo(),
  now: Date = new Date()
): { ok: boolean; errorUz?: string; next: EconomyData; newlyAchievements: string[] } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  const skin = ALL_SKINS.find((s) => s.id === skinId);
  if (!skin || !skin.marketPurchasable) {
    return { ok: false, errorUz: 'Ushbu skin marketda sotuvda emas.', next: prev, newlyAchievements: [] };
  }
  if (skin.eventId && !isZaiEventWindowOpen(skin.eventId, now)) {
    return { ok: false, errorUz: `Ushbu ZAI tadbir (${skin.releaseDateLabel ?? ''}) hozir yopiq.`, next: prev, newlyAchievements: [] };
  }
  const reqLevel = getSkinMinLevel(skin);
  const pLevel = next.playerLevel ?? 1;
  if (pLevel < reqLevel) {
    return { ok: false, errorUz: `Daraja yetarli emas! Kamida ${reqLevel}-daraja kerak.`, next: prev, newlyAchievements: [] };
  }
  if (next.spikeyCoins < skin.price) {
    return { ok: false, errorUz: 'Spikey Coins yetarli emas!', next: prev, newlyAchievements: [] };
  }
  const txId = `buy_skin_${skinId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  next.spikeyCoins -= skin.price;
  grantSkinCount(next, skinId, 1);
  next.equippedSkin = skinId;
  appendTx(next, txId, 'spend', -skin.price, `Skin xarid qilindi: ${skin.name}`);
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, next, newlyAchievements };
}

export function buyWebDesignAction(
  prev: EconomyData,
  webId: string,
  cal = getLiveCalendarInfo(),
  now: Date = new Date()
): { ok: boolean; errorUz?: string; next: EconomyData; newlyAchievements: string[] } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  const web = ALL_WEB_DESIGNS.find((w) => w.id === webId);
  if (!web || !web.marketPurchasable) {
    return { ok: false, errorUz: 'Ushbu to‘r dizayni sotuvda emas.', next: prev, newlyAchievements: [] };
  }
  if (web.eventId && !isZaiEventWindowOpen(web.eventId, now)) {
    return { ok: false, errorUz: `Ushbu ZAI tadbir (${web.releaseDateLabel ?? ''}) hozir yopiq.`, next: prev, newlyAchievements: [] };
  }
  const pLevel = next.playerLevel ?? 1;
  if (pLevel < web.minPlayerLevel) {
    return { ok: false, errorUz: `Daraja yetarli emas! Kamida ${web.minPlayerLevel}-daraja kerak.`, next: prev, newlyAchievements: [] };
  }
  if (next.spikeyCoins < web.price) {
    return { ok: false, errorUz: 'Spikey Coins yetarli emas!', next: prev, newlyAchievements: [] };
  }
  const txId = `buy_web_${webId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  next.spikeyCoins -= web.price;
  next.ownedWebDesigns = { ...(next.ownedWebDesigns ?? { classic_white: 1 }) };
  next.ownedWebDesigns[webId] = (next.ownedWebDesigns[webId] ?? 0) + 1;
  next.equippedWebDesign = webId;
  appendTx(next, txId, 'spend', -web.price, `To‘r dizayni xarid qilindi: ${web.name}`);
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, next, newlyAchievements };
}

export function equipWebDesignAction(
  prev: EconomyData,
  webId: string,
  cal = getLiveCalendarInfo()
): { ok: boolean; errorUz?: string; next: EconomyData } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  if (!next.ownedWebDesigns?.[webId] || next.ownedWebDesigns[webId] <= 0) {
    return { ok: false, errorUz: 'Sizda bu to‘r dizayni mavjud emas.', next: prev };
  }
  next.equippedWebDesign = webId;
  return { ok: true, next };
}

export function canSellWebDesign(economy: EconomyData, webId: string): { eligible: boolean; reasonUz?: string; price: number } {
  const web = getWebDesignById(webId);
  const qty = economy.ownedWebDesigns?.[webId] ?? 0;
  const sellPrice = web.sellPrice || Math.round(web.price * 0.5);
  if (qty <= 0) return { eligible: false, reasonUz: 'Sizda bu to‘r dizayni yo‘q', price: sellPrice };
  if (!web.tradable) return { eligible: false, reasonUz: 'Boshlang‘ich to‘r sotilmaydi', price: sellPrice };
  if (economy.equippedWebDesign === webId && qty <= 1) {
    return { eligible: false, reasonUz: 'Taqilgan yagona to‘rni sotib bo‘lmaydi', price: sellPrice };
  }
  return { eligible: true, price: sellPrice };
}

export function sellWebDesignAction(
  prev: EconomyData,
  webId: string,
  cal = getLiveCalendarInfo()
): { ok: boolean; errorUz?: string; soldPrice: number; next: EconomyData; newlyAchievements: string[] } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  const check = canSellWebDesign(next, webId);
  if (!check.eligible) {
    return { ok: false, errorUz: check.reasonUz, soldPrice: 0, next: prev, newlyAchievements: [] };
  }
  const web = getWebDesignById(webId);
  next.ownedWebDesigns = { ...(next.ownedWebDesigns ?? { classic_white: 1 }) };
  next.ownedWebDesigns[webId] = (next.ownedWebDesigns[webId] ?? 1) - 1;
  if (next.ownedWebDesigns[webId] <= 0) delete next.ownedWebDesigns[webId];
  next.spikeyCoins += check.price;
  next.skinsSoldTotal += 1;
  const txId = `sell_web_${webId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  appendTx(next, txId, 'sell', check.price, `To‘r dizayni sotildi: ${web.name}`);
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, soldPrice: check.price, next, newlyAchievements };
}

export function equipSkinAction(
  prev: EconomyData,
  skinId: string,
  cal = getLiveCalendarInfo()
): { ok: boolean; errorUz?: string; next: EconomyData } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  if (!next.ownedSkins[skinId] || next.ownedSkins[skinId] <= 0) {
    return { ok: false, errorUz: 'Sizda bu skin mavjud emas.', next: prev };
  }
  next.equippedSkin = skinId;
  return { ok: true, next };
}

export function canSellSkin(economy: EconomyData, skinId: string): { eligible: boolean; reasonUz?: string; price: number } {
  const skin = getSkinById(skinId);
  const qty = economy.ownedSkins[skinId] ?? 0;
  const sellPrice = RARITY_META[skin.rarity].sellPrice;
  if (qty <= 0) return { eligible: false, reasonUz: 'Sizda bu skin yo‘q', price: sellPrice };
  if (!skin.tradable) return { eligible: false, reasonUz: 'Boshlang‘ich skin sotilmaydi', price: sellPrice };
  if (economy.equippedSkin === skinId && qty <= 1) {
    return { eligible: false, reasonUz: 'Kiyilgan skinni sotib bo‘lmaydi', price: sellPrice };
  }
  return { eligible: true, price: sellPrice };
}

export function sellSkinAction(
  prev: EconomyData,
  skinId: string,
  cal = getLiveCalendarInfo()
): { ok: boolean; errorUz?: string; soldPrice: number; next: EconomyData; newlyAchievements: string[] } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  const check = canSellSkin(next, skinId);
  if (!check.eligible) {
    return { ok: false, errorUz: check.reasonUz, soldPrice: 0, next: prev, newlyAchievements: [] };
  }
  const skin = getSkinById(skinId);
  next.ownedSkins[skinId] = (next.ownedSkins[skinId] ?? 1) - 1;
  if (next.ownedSkins[skinId] <= 0) {
    delete next.ownedSkins[skinId];
  }
  next.spikeyCoins += check.price;
  next.skinsSoldTotal += 1;
  const txId = `sell_skin_${skinId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  appendTx(next, txId, 'sell', check.price, `Skin sotildi: ${skin.name}`);
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, soldPrice: check.price, next, newlyAchievements };
}

export function buyCaseAction(
  prev: EconomyData,
  caseType: CaseType,
  cal = getLiveCalendarInfo(),
  now: Date = new Date()
): { ok: boolean; errorUz?: string; next: EconomyData } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  const def = CASE_MAP[caseType];
  if (def.eventId && !isZaiEventWindowOpen(def.eventId, now)) {
    return { ok: false, errorUz: `${def.nameEn} tadbiri hozir faol emas!`, next: prev };
  }
  const pLevel = next.playerLevel ?? 1;
  if (def.minPlayerLevel && pLevel < def.minPlayerLevel) {
    return { ok: false, errorUz: `Kamida ${def.minPlayerLevel}-daraja kerak!`, next: prev };
  }
  if (next.spikeyCoins < def.price) {
    return { ok: false, errorUz: 'Spikey Coins yetarli emas!', next: prev };
  }
  const txId = `buy_case_${caseType}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  next.spikeyCoins -= def.price;
  next.ownedCases[caseType] = (next.ownedCases[caseType] ?? 0) + 1;
  appendTx(next, txId, 'spend', -def.price, `Keys xarid qilindi: ${def.nameUz}`);
  return { ok: true, next };
}

export function openOwnedCaseAction(
  prev: EconomyData,
  caseType: CaseType,
  cal = getLiveCalendarInfo()
): {
  ok: boolean;
  errorUz?: string;
  next: EconomyData;
  spinResult?: CaseSpinResult;
  newlyAchievements: string[];
} {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  const count = next.ownedCases[caseType] ?? 0;
  if (count <= 0) {
    return { ok: false, errorUz: 'Inventarda bu keysdan yo‘q. Avval sotib oling.', next: prev, newlyAchievements: [] };
  }

  // Strictly roll true probability BEFORE reveal reel!
  const winningSkin = rollCaseOutcome(caseType);
  const { reel, winningIndex } = buildCaseRouletteReel(caseType, winningSkin);
  const wasOwned = (next.ownedSkins[winningSkin.id] ?? 0) > 0;

  next.ownedCases[caseType] = count - 1;
  grantSkinCount(next, winningSkin.id, 1);
  next.casesOpenedTotal += 1;
  if (winningSkin.rarity === 'mythic' || winningSkin.rarity === 'limited') {
    next.mythicsFoundTotal += 1;
  }

  next.missionProgress['daily:cases_opened'] = (next.missionProgress['daily:cases_opened'] ?? 0) + 1;
  next.missionProgress['weekly:cases_opened'] = (next.missionProgress['weekly:cases_opened'] ?? 0) + 1;
  next.missionProgress['seasonal:cases_opened'] = (next.missionProgress['seasonal:cases_opened'] ?? 0) + 1;
  next.seasonXp += 45;
  addPlayerXp(next, 35);

  const txId = `open_case_${caseType}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  appendTx(next, txId, 'case', 0, `${CASE_MAP[caseType].nameUz} ochildi → ${winningSkin.name}`);

  const newlyAchievements = evaluateEconomyAchievements(next);
  return {
    ok: true,
    next,
    spinResult: { winningSkin, reel, winningIndex, isNewSkin: !wasOwned },
    newlyAchievements,
  };
}

export function getDateDiffDays(prevDateKey: string, todayDateKey: string): number {
  if (!prevDateKey) return 999;
  const [py, pm, pd] = prevDateKey.split('-').map(Number);
  const [ty, tm, td] = todayDateKey.split('-').map(Number);
  if (!py || !pm || !pd || !ty || !tm || !td) return 999;
  const pUtc = Date.UTC(py, pm - 1, pd);
  const tUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((tUtc - pUtc) / 86400000);
}

export function getEffectiveStreakStatus(economy: EconomyData, cal = getLiveCalendarInfo()): {
  canClaimToday: boolean;
  effectiveStreak: number;
  nextDayNumber: number;
  missedReset: boolean;
} {
  if (!economy.lastDailyClaimDate) {
    return { canClaimToday: true, effectiveStreak: 0, nextDayNumber: 1, missedReset: false };
  }
  const diff = getDateDiffDays(economy.lastDailyClaimDate, cal.dateKey);
  if (diff <= 0) {
    return {
      canClaimToday: false,
      effectiveStreak: economy.dailyStreak,
      nextDayNumber: Math.min(30, economy.dailyStreak + 1),
      missedReset: false,
    };
  }
  if (diff === 1) {
    const nextDay = economy.dailyStreak >= 30 ? 1 : economy.dailyStreak + 1;
    return {
      canClaimToday: true,
      effectiveStreak: economy.dailyStreak,
      nextDayNumber: nextDay,
      missedReset: false,
    };
  }
  // Missed at least 1 day -> consecutive streak resets to 0 while claimed history stays!
  return {
    canClaimToday: true,
    effectiveStreak: 0,
    nextDayNumber: 1,
    missedReset: economy.dailyStreak > 0,
  };
}

export function claimDailyRewardAction(
  prev: EconomyData,
  cal = getLiveCalendarInfo()
): {
  ok: boolean;
  errorUz?: string;
  reward?: DailyRewardDef;
  next: EconomyData;
  newlyAchievements: string[];
} {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  const status = getEffectiveStreakStatus(next, cal);
  if (!status.canClaimToday) {
    return { ok: false, errorUz: 'Bugungi sovg‘ani allaqachon oldingiz! Ertaga qayting.', next: prev, newlyAchievements: [] };
  }

  const dayNum = status.nextDayNumber;
  const def = DAILY_REWARDS_30.find((d) => d.day === dayNum) ?? DAILY_REWARDS_30[0];
  const txId = `daily_${cal.dateKey}_day${dayNum}`;
  if (next.processedTxIds.includes(txId)) {
    return { ok: false, errorUz: 'Bu kunlik sovg‘a allaqachon olingan.', next: prev, newlyAchievements: [] };
  }

  next.dailyStreak = dayNum;
  next.lastDailyClaimDate = cal.dateKey;
  if (!next.claimedDailyDays.includes(dayNum)) {
    next.claimedDailyDays.push(dayNum);
  }
  if (def.coins && def.coins > 0) {
    next.spikeyCoins += def.coins;
  }
  if (def.caseType) {
    next.ownedCases[def.caseType] = (next.ownedCases[def.caseType] ?? 0) + 1;
  }
  if (def.skinId) {
    grantSkinCount(next, def.skinId, 1);
  }
  if (def.xpBonus) {
    next.seasonXp += def.xpBonus;
    addPlayerXp(next, Math.round(def.xpBonus * 0.75));
  }

  appendTx(next, txId, 'earn', def.coins ?? 0, `Kunlik sovg‘a (${dayNum}-kun): ${def.labelUz}`);
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, reward: def, next, newlyAchievements };
}

export function claimSeasonPassLevelAction(
  prev: EconomyData,
  level: number,
  cal = getLiveCalendarInfo()
): {
  ok: boolean;
  errorUz?: string;
  labelUz?: string;
  next: EconomyData;
  newlyAchievements: string[];
} {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  const currentLevel = getSeasonLevelFromXp(next.seasonXp);
  if (level > currentLevel) {
    return { ok: false, errorUz: `Avval ${level}-darajaga yeting!`, next: prev, newlyAchievements: [] };
  }
  if (next.claimedSeasonLevels.includes(level)) {
    return { ok: false, errorUz: 'Bu daraja sovg‘asi allaqachon olingan.', next: prev, newlyAchievements: [] };
  }

  const rewards = buildSeasonPassLevels(cal.month);
  const def = rewards.find((r) => r.level === level);
  if (!def) {
    return { ok: false, errorUz: 'Daraja topilmadi.', next: prev, newlyAchievements: [] };
  }

  const txId = `season_${cal.monthKey}_lvl${level}`;
  if (next.processedTxIds.includes(txId)) {
    return { ok: false, errorUz: 'Takroriy urinish bloklandi.', next: prev, newlyAchievements: [] };
  }

  next.claimedSeasonLevels.push(level);
  if (def.coins) next.spikeyCoins += def.coins;
  if (def.caseType) next.ownedCases[def.caseType] = (next.ownedCases[def.caseType] ?? 0) + 1;
  if (def.skinId) grantSkinCount(next, def.skinId, 1);
  if (def.specialItemId) {
    next.specialItems[def.specialItemId] = (next.specialItems[def.specialItemId] ?? 0) + 1;
  }

  appendTx(next, txId, 'earn', def.coins ?? 0, `Sezon Pass ${level}-daraja: ${def.labelUz}`);
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, labelUz: def.labelUz, next, newlyAchievements };
}

export function claimMissionAction(
  prev: EconomyData,
  missionId: string,
  cal = getLiveCalendarInfo()
): { ok: boolean; errorUz?: string; next: EconomyData; newlyAchievements: string[] } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  const def = ALL_MISSIONS.find((m) => m.id === missionId);
  if (!def) return { ok: false, errorUz: 'Topshiriq topilmadi.', next: prev, newlyAchievements: [] };
  if (next.claimedMissions.includes(missionId)) {
    return { ok: false, errorUz: 'Mukofot allaqachon olingan.', next: prev, newlyAchievements: [] };
  }
  const progress = next.missionProgress[`${def.period}:${def.metric}`] ?? 0;
  if (progress < def.target) {
    return { ok: false, errorUz: 'Topshiriq hali bajarilmagan.', next: prev, newlyAchievements: [] };
  }

  const periodStamp =
    def.period === 'daily'
      ? cal.dateKey
      : def.period === 'weekly'
      ? cal.weekKey
      : cal.monthKey;
  const txId = `mission_${missionId}_${periodStamp}`;
  if (next.processedTxIds.includes(txId)) {
    return { ok: false, errorUz: 'Takroriy urinish.', next: prev, newlyAchievements: [] };
  }

  next.claimedMissions.push(missionId);
  next.spikeyCoins += def.rewardCoins;
  next.seasonXp += def.rewardXp;
  addPlayerXp(next, def.rewardXp);
  appendTx(next, txId, 'earn', def.rewardCoins, `Topshiriq bajarildi: ${def.titleUz}`);
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, next, newlyAchievements };
}

export function claimHolidayGiftAction(
  prev: EconomyData,
  cal = getLiveCalendarInfo()
): { ok: boolean; errorUz?: string; next: EconomyData; newlyAchievements: string[] } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  const claimId = `gift_${cal.monthKey}`;
  if (next.holidayClaimedIds.includes(claimId)) {
    return { ok: false, errorUz: 'Ushbu oyning bayram sovg‘asi allaqachon olingan.', next: prev, newlyAchievements: [] };
  }
  next.holidayClaimedIds.push(claimId);
  next.spikeyCoins += cal.season.eventGiftCoins;
  next.ownedCases[cal.season.eventGiftCase] = (next.ownedCases[cal.season.eventGiftCase] ?? 0) + 1;
  next.specialItems.season_token = (next.specialItems.season_token ?? 0) + 1;
  next.seasonXp += 150;
  addPlayerXp(next, 120);
  appendTx(
    next,
    `holiday_${cal.monthKey}`,
    'earn',
    cal.season.eventGiftCoins,
    `${cal.season.eventTitleUz} bepul sovg‘asi`
  );
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, next, newlyAchievements };
}

export function useSpecialItemAction(
  prev: EconomyData,
  itemId: string,
  cal = getLiveCalendarInfo()
): { ok: boolean; errorUz?: string; labelUz?: string; next: EconomyData; newlyAchievements: string[] } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  const qty = next.specialItems[itemId] ?? 0;
  if (qty <= 0) {
    return { ok: false, errorUz: 'Bu buyum inventarda yo‘q.', next: prev, newlyAchievements: [] };
  }
  next.specialItems[itemId] = qty - 1;
  let labelUz = '';
  if (itemId === 'xp_boost') {
    next.seasonXp += 150;
    labelUz = '+150 Sezon XP qo‘shildi!';
  } else if (itemId === 'lucky_clover') {
    next.spikeyCoins += 200;
    labelUz = '+200 Spikey Coins qo‘shildi!';
    appendTx(next, `item_${itemId}_${Date.now()}`, 'earn', 200, 'Oltin Omad Nishoni faollashtirildi');
  } else {
    next.seasonXp += 100;
    next.spikeyCoins += 150;
    labelUz = '+150 Tanga va +100 Sezon XP qo‘shildi!';
    appendTx(next, `item_${itemId}_${Date.now()}`, 'earn', 150, 'Bayram Nishoni almashtirildi');
  }
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, labelUz, next, newlyAchievements };
}
