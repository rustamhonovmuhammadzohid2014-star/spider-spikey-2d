import { CASE_MAP, CaseSpinResult, buildCaseRouletteReel, rollCaseOutcome } from './cases';
import {
  LiveCalendarInfo,
  MAX_SEASON_LEVEL,
  buildSeasonPassLevels,
  getLiveCalendarInfo,
  getSeasonLevelFromXp,
  getSeasonLevelSkipCost,
  getXpForLevel,
} from './seasons';
import { ALL_SKINS, RARITY_META, getSkinById, getSkinMinLevel, starterColorToSkinId } from './skins';
import {
  AchievementDef,
  CaseType,
  EconomyData,
  EconomyTransaction,
  OwnerGiftRecord,
  SpiderColorId,
} from './types';
import { ALL_WEB_DESIGNS, getWebDesignById } from './webDesigns';
import { isZaiCaseAvailableNow, isZaiItemAvailableNow } from './zaiCollection';

export const MAX_PLAYER_LEVEL = 103;

export function getPlayerXpForNextLevel(level: number): number {
  const lvl = Math.max(1, Math.min(MAX_PLAYER_LEVEL, Math.floor(level)));
  return 260 + (lvl - 1) * 165 + Math.floor(Math.pow(lvl - 1, 1.35) * 22);
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
    priceCoins: 950,
  },
  lucky_clover: {
    id: 'lucky_clover',
    nameUz: 'Oltin Omad Nishoni',
    descriptionUz: 'Inventardagi noyob kolleksiya buyumi (+200 tanga qiymat).',
    priceCoins: 1300,
  },
  season_token: {
    id: 'season_token',
    nameUz: 'Bayram Nishoni',
    descriptionUz: 'Bayram tadbirlaridan olinadigan maxsus medal.',
    priceCoins: 1100,
  },
};

export type MissionDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type MissionMetric =
  | 'stages_cleared'
  | 'enemies_defeated'
  | 'coins_collected'
  | 'crystals_collected'
  | 'bosses_defeated'
  | 'cases_opened'
  | 'houses_built'
  | 'web_swings'
  | 'no_damage_clears'
  | 'fast_clears'
  | 'full_crystal_clears'
  | 'secrets_found'
  | 'no_damage_bosses'
  | 'trades_completed';

export interface MissionDef {
  id: string;
  period: 'daily' | 'weekly' | 'seasonal';
  difficulty: MissionDifficulty;
  titleUz: string;
  descriptionUz: string;
  target: number;
  rewardCoins: number;
  rewardXp: number;
  metric: MissionMetric;
}

export const ALL_MISSIONS: MissionDef[] = [
  // Daily (Harder 3x-4.5x targets)
  {
    id: 'd_stage_1',
    period: 'daily',
    difficulty: 'medium',
    titleUz: 'Kunlik Sarguzasht',
    descriptionUz: 'Bugun 4 ta bosqichni muvaffaqiyatli yakunlang.',
    target: 4,
    rewardCoins: 1800,
    rewardXp: 160,
    metric: 'stages_cleared',
  },
  {
    id: 'd_houses_3',
    period: 'daily',
    difficulty: 'medium',
    titleUz: 'Ipak Me’mori (E)',
    descriptionUz: 'Bugun E tugmasi bilan 12 ta o‘rgimchak uyini quring.',
    target: 12,
    rewardCoins: 1600,
    rewardXp: 150,
    metric: 'houses_built',
  },
  {
    id: 'd_swings_8',
    period: 'daily',
    difficulty: 'medium',
    titleUz: 'Osmon Tebranishi (Q)',
    descriptionUz: 'Q tugmasi bilan 32 marta to‘rga osilib uching.',
    target: 32,
    rewardCoins: 1700,
    rewardXp: 160,
    metric: 'web_swings',
  },
  {
    id: 'd_enemies_10',
    period: 'daily',
    difficulty: 'hard',
    titleUz: 'Zararkunanda Ovchisi',
    descriptionUz: 'Bugun 45 ta dushmanni mag‘lub eting.',
    target: 45,
    rewardCoins: 2100,
    rewardXp: 190,
    metric: 'enemies_defeated',
  },
  {
    id: 'd_coins_40',
    period: 'daily',
    difficulty: 'hard',
    titleUz: 'Tanga Teruvchi',
    descriptionUz: 'Bosqichlarda 180 ta tanga yig‘ing.',
    target: 180,
    rewardCoins: 2400,
    rewardXp: 200,
    metric: 'coins_collected',
  },
  {
    id: 'd_case_1',
    period: 'daily',
    difficulty: 'medium',
    titleUz: 'Omad Sandig‘i',
    descriptionUz: 'Bugun kamida 3 ta keys oching.',
    target: 3,
    rewardCoins: 2200,
    rewardXp: 180,
    metric: 'cases_opened',
  },
  // Weekly (Hard & Expert 3x-5x targets)
  {
    id: 'w_stages_5',
    period: 'weekly',
    difficulty: 'hard',
    titleUz: 'Haftalik Qahramon',
    descriptionUz: 'Ushbu haftada 20 ta bosqichni yakunlang.',
    target: 20,
    rewardCoins: 6500,
    rewardXp: 500,
    metric: 'stages_cleared',
  },
  {
    id: 'w_fast_2',
    period: 'weekly',
    difficulty: 'expert',
    titleUz: 'Chaqmoq Tezligi',
    descriptionUz: '8 ta bosqichni 90 soniyadan tezroq yakunlang.',
    target: 8,
    rewardCoins: 9000,
    rewardXp: 650,
    metric: 'fast_clears',
  },
  {
    id: 'w_nodmg_2',
    period: 'weekly',
    difficulty: 'expert',
    titleUz: 'Betakror Himoya',
    descriptionUz: '6 ta bosqichni zarar olmay (No-Damage) yakunlang.',
    target: 6,
    rewardCoins: 11000,
    rewardXp: 750,
    metric: 'no_damage_clears',
  },
  {
    id: 'w_all_crystals_2',
    period: 'weekly',
    difficulty: 'expert',
    titleUz: 'Mukammal Kristallchi',
    descriptionUz: '8 ta bosqichda barcha 3 ta kristallni yig‘ib o‘ting.',
    target: 8,
    rewardCoins: 8500,
    rewardXp: 620,
    metric: 'full_crystal_clears',
  },
  {
    id: 'w_boss_1',
    period: 'weekly',
    difficulty: 'hard',
    titleUz: 'Boss Yenguvchi',
    descriptionUz: 'Hafta davomida 4 ta dunyo bossini mag‘lub eting.',
    target: 4,
    rewardCoins: 9500,
    rewardXp: 600,
    metric: 'bosses_defeated',
  },
  {
    id: 'w_crystals_3',
    period: 'weekly',
    difficulty: 'hard',
    titleUz: 'Kristall Yig‘uvchi',
    descriptionUz: 'Hafta davomida 15 ta Sehrli Kristall toping.',
    target: 15,
    rewardCoins: 6000,
    rewardXp: 460,
    metric: 'crystals_collected',
  },
  // Seasonal (Expert 3x-4x targets)
  {
    id: 's_stages_12',
    period: 'seasonal',
    difficulty: 'expert',
    titleUz: 'Sezon Fathchisi',
    descriptionUz: 'Joriy sezonda 45 ta bosqichni yakunlang.',
    target: 45,
    rewardCoins: 16000,
    rewardXp: 1100,
    metric: 'stages_cleared',
  },
  {
    id: 's_secrets_5',
    period: 'seasonal',
    difficulty: 'expert',
    titleUz: 'Maxfiy Xona Ustasi',
    descriptionUz: 'Joriy sezonda 20 ta yashirin devor yoki sandiq toping.',
    target: 20,
    rewardCoins: 20000,
    rewardXp: 1400,
    metric: 'secrets_found',
  },
  {
    id: 's_nodmg_boss_1',
    period: 'seasonal',
    difficulty: 'expert',
    titleUz: 'Mutlaq Chempion (Expert)',
    descriptionUz: '3 ta Boss jangini zarar olmay (No-Damage) yuting!',
    target: 3,
    rewardCoins: 25000,
    rewardXp: 1800,
    metric: 'no_damage_bosses',
  },
  {
    id: 's_bosses_3',
    period: 'seasonal',
    difficulty: 'expert',
    titleUz: 'Sezon Bosslari Qiroli',
    descriptionUz: 'Joriy sezonda 12 ta boss jangida g‘alaba qozoning.',
    target: 12,
    rewardCoins: 18000,
    rewardXp: 1300,
    metric: 'bosses_defeated',
  },
  {
    id: 's_cases_5',
    period: 'seasonal',
    difficulty: 'expert',
    titleUz: 'Kolleksioner Ruhi',
    descriptionUz: 'Joriy sezonda 20 ta keys oching.',
    target: 20,
    rewardCoins: 15000,
    rewardXp: 1000,
    metric: 'cases_opened',
  },
  {
    id: 's_coins_500',
    period: 'seasonal',
    difficulty: 'expert',
    titleUz: 'Sezon Boyligi',
    descriptionUz: 'Bosqichlardan 2,000 ta tanga yig‘ing.',
    target: 2000,
    rewardCoins: 18000,
    rewardXp: 1200,
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
      common: 2, // Welcome bonus: exactly 2 Free Common Cases for every new account!
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
    claimedBonusSeasonLevels: [],
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
    noDamageStreak: 0,
    unlockedEconomyAchievements: [],
    unlockedAvatars: [],
    unlockedProfileFrames: ['frame_winter_steel'],
    equippedProfileFrame: 'frame_winter_steel',
    transactions: [],
    processedTxIds: [],
    ownerGiftsReceived: [],
    playerXp: 0,
    playerLevel: 1,
    equippedWebDesign: 'classic_white',
    ownedWebDesigns: { classic_white: 1 },
    selectedLanguage: 'en',
    isCreator: false,
  };
}

export function createCreatorVipEconomyData(
  cal: LiveCalendarInfo = getLiveCalendarInfo()
): EconomyData {
  const base = createInitialEconomyData('creator_admin', 999999999, 'classic', cal);
  const allSkins: Record<string, number> = {};
  for (const s of ALL_SKINS) {
    allSkins[s.id] = 99;
  }
  const allWebs: Record<string, number> = {};
  for (const w of ALL_WEB_DESIGNS) {
    allWebs[w.id] = 99;
  }
  return {
    ...base,
    ownerId: 'creator_admin',
    isCreator: true,
    spikeyCoins: 999999999,
    equippedSkin: 'zai_event_shadow',
    ownedSkins: allSkins,
    equippedWebDesign: 'cosmic_galaxy_web',
    ownedWebDesigns: allWebs,
    ownedCases: {
      common: 99,
      uncommon: 99,
      rare: 99,
      epic: 99,
      legendary: 99,
      mythic: 99,
      seasonal: 99,
      zai_monthly: 99,
      zai_summer: 99,
      zai_starfall: 99,
      zai_shadow: 99,
    },
    specialItems: {
      xp_boost: 99,
      lucky_clover: 99,
      season_token: 99,
    },
    seasonXp: getXpForLevel(MAX_SEASON_LEVEL),
    playerXp: 2500000,
    playerLevel: MAX_PLAYER_LEVEL,
    unlockedAvatars: [
      'av_classic_spikey',
      'av_emerald_spikey',
      'av_cobalt_frost',
      'av_amethyst_king',
      'av_crimson_spark',
      'av_neon_cyber',
      'av_shadow_ninja',
      'av_flame_blaze',
      'av_winter_frost_king',
      'av_santa_holiday',
      'av_zai_crystal_crown',
      'av_aurora_mythic',
    ],
    unlockedProfileFrames: [
      'frame_winter_steel',
      'frame_emerald_silk',
      'frame_amethyst_prism',
      'frame_gold_monarch',
      'frame_zai_neon',
    ],
    equippedProfileFrame: 'frame_zai_neon',
  };
}

export function normalizeEconomyData(
  raw: Partial<EconomyData> | null | undefined,
  ownerId = 'local',
  cal: LiveCalendarInfo = getLiveCalendarInfo()
): EconomyData {
  const base = createInitialEconomyData(ownerId, 0, 'classic', cal);
  if (!raw) return base;

  const isCreator = Boolean(raw.isCreator || ownerId === 'creator_admin');
  const rawXp = isCreator ? Math.max(2500000, Math.floor(raw.playerXp ?? 0)) : Math.max(0, Math.floor(raw.playerXp ?? 0));
  const derivedLevel = getPlayerLevelProgress(rawXp).level;

  const ownedSkins: Record<string, number> = { classic: 1, ...(raw.ownedSkins ?? {}) };
  const ownedWebDesigns: Record<string, number> = { classic_white: 1, ...(raw.ownedWebDesigns ?? {}) };
  if (isCreator) {
    for (const s of ALL_SKINS) ownedSkins[s.id] = Math.max(1, ownedSkins[s.id] ?? 99);
    for (const w of ALL_WEB_DESIGNS) ownedWebDesigns[w.id] = Math.max(1, ownedWebDesigns[w.id] ?? 99);
  }

  const merged: EconomyData = {
    ...base,
    ...raw,
    ownerId: raw.ownerId || ownerId,
    isCreator,
    spikeyCoins: isCreator
      ? 999999999
      : Number.isFinite(Number(raw.spikeyCoins))
      ? Math.max(0, Math.floor(Number(raw.spikeyCoins)))
      : 0,
    equippedSkin: raw.equippedSkin || 'classic',
    ownedSkins,
    ownedCases: { ...base.ownedCases, ...(raw.ownedCases ?? {}) },
    specialItems: { ...base.specialItems, ...(raw.specialItems ?? {}) },
    claimedSeasonLevels: Array.isArray(raw.claimedSeasonLevels) ? [...raw.claimedSeasonLevels] : [],
    claimedBonusSeasonLevels: Array.isArray(raw.claimedBonusSeasonLevels)
      ? [...raw.claimedBonusSeasonLevels]
      : [],
    claimedDailyDays: Array.isArray(raw.claimedDailyDays) ? [...raw.claimedDailyDays] : [],
    missionProgress: { ...(raw.missionProgress ?? {}) },
    claimedMissions: Array.isArray(raw.claimedMissions) ? [...raw.claimedMissions] : [],
    holidayClaimedIds: Array.isArray(raw.holidayClaimedIds) ? [...raw.holidayClaimedIds] : [],
    unlockedEconomyAchievements: Array.isArray(raw.unlockedEconomyAchievements)
      ? [...raw.unlockedEconomyAchievements]
      : [],
    unlockedAvatars: Array.isArray(raw.unlockedAvatars) ? [...raw.unlockedAvatars] : [],
    unlockedProfileFrames: Array.isArray(raw.unlockedProfileFrames) && raw.unlockedProfileFrames.length > 0
      ? [...raw.unlockedProfileFrames]
      : ['frame_winter_steel'],
    equippedProfileFrame: raw.equippedProfileFrame || 'frame_winter_steel',
    noDamageStreak: Math.max(0, Math.floor(raw.noDamageStreak ?? 0)),
    transactions: Array.isArray(raw.transactions) ? raw.transactions.slice(0, 40) : [],
    processedTxIds: Array.isArray(raw.processedTxIds) ? raw.processedTxIds.slice(-120) : [],
    ownerGiftsReceived: Array.isArray(raw.ownerGiftsReceived)
      ? [...raw.ownerGiftsReceived]
      : [],
    playerXp: rawXp,
    playerLevel: derivedLevel,
    equippedWebDesign: raw.equippedWebDesign || 'classic_white',
    ownedWebDesigns,
    selectedLanguage: raw.selectedLanguage || 'en',
  };

  // Auto-roll live monthly season if real calendar month has changed
  if (merged.seasonMonthKey !== cal.monthKey) {
    merged.seasonMonthKey = cal.monthKey;
    merged.seasonXp = 0;
    merged.claimedSeasonLevels = [];
    merged.claimedBonusSeasonLevels = [];
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
    housesBuiltCount?: number;
    webSwingsCount?: number;
    secretsFoundCount?: number;
    noDamage?: boolean;
    timeSec?: number;
    allCrystals?: boolean;
  },
  cal = getLiveCalendarInfo()
): { next: EconomyData; newlyAchievements: string[]; xpEarned: number } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  if (next.processedTxIds.includes(input.txId)) {
    return { next, newlyAchievements: [], xpEarned: 0 };
  }

  let xpEarned = 0;
  if (input.stageCompleted) xpEarned += input.bossDefeated ? 150 : 80;
  xpEarned += input.crystalsFound * 25;
  xpEarned += Math.min(60, input.enemiesDefeated * 4);
  if (input.noDamage && input.stageCompleted) xpEarned += 45;
  if (input.allCrystals && input.stageCompleted) xpEarned += 35;

  if (input.coinsEarned > 0) {
    next.spikeyCoins += input.coinsEarned;
    appendTx(next, input.txId, 'earn', input.coinsEarned, 'Bosqichdan yig‘ilgan tangalar');
  } else {
    next.processedTxIds = [...next.processedTxIds.slice(-119), input.txId];
  }

  if (input.stageCompleted) {
    next.noDamageStreak = input.noDamage ? (next.noDamageStreak ?? 0) + 1 : 0;
  }

  next.seasonXp += xpEarned;
  addPlayerXp(next, Math.max(1, Math.round(xpEarned * 0.75)));

  const bump = (metric: MissionDef['metric'], amount: number) => {
    if (amount <= 0) return;
    next.missionProgress[`daily:${metric}`] = (next.missionProgress[`daily:${metric}`] ?? 0) + amount;
    next.missionProgress[`weekly:${metric}`] = (next.missionProgress[`weekly:${metric}`] ?? 0) + amount;
    next.missionProgress[`seasonal:${metric}`] = (next.missionProgress[`seasonal:${metric}`] ?? 0) + amount;
  };

  if (input.stageCompleted) bump('stages_cleared', 1);
  if (input.bossDefeated) bump('bosses_defeated', 1);
  if (input.stageCompleted && input.noDamage) bump('no_damage_clears', 1);
  if (input.bossDefeated && input.noDamage) bump('no_damage_bosses', 1);
  if (input.stageCompleted && typeof input.timeSec === 'number' && input.timeSec <= 90) {
    bump('fast_clears', 1);
  }
  if (input.stageCompleted && input.allCrystals) bump('full_crystal_clears', 1);
  bump('coins_collected', input.coinsEarned);
  bump('crystals_collected', input.crystalsFound);
  bump('enemies_defeated', input.enemiesDefeated);
  bump('houses_built', input.housesBuiltCount ?? 0);
  bump('web_swings', input.webSwingsCount ?? 0);
  bump('secrets_found', input.secretsFoundCount ?? 0);

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
  if (skin.isZaiLimited && !isZaiItemAvailableNow(skin, now)) {
    return {
      ok: false,
      errorUz: `Ushbu ZAI kolleksiya (${skin.releaseDateLabel ?? ''}) faqat belgilangan sanada ochiladi.`,
      next: prev,
      newlyAchievements: [],
    };
  }
  const reqLevel = getSkinMinLevel(skin);
  const pLevel = getPlayerLevelProgress(next.playerXp ?? 0).level;
  if (!next.isCreator && pLevel < reqLevel) {
    return { ok: false, errorUz: `Daraja yetarli emas! Kamida ${reqLevel}-daraja kerak.`, next: prev, newlyAchievements: [] };
  }
  if (!next.isCreator && next.spikeyCoins < skin.price) {
    return { ok: false, errorUz: 'Spikey Coins yetarli emas!', next: prev, newlyAchievements: [] };
  }
  const txId = `buy_skin_${skinId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const cost = next.isCreator ? 0 : skin.price;
  next.spikeyCoins = Math.max(0, next.spikeyCoins - cost);
  grantSkinCount(next, skinId, 1);
  next.equippedSkin = skinId;
  appendTx(next, txId, 'spend', -cost, `Skin xarid qilindi: ${skin.name}`);
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
  if (web.isZaiLimited && !isZaiItemAvailableNow(web, now)) {
    return {
      ok: false,
      errorUz: `Ushbu ZAI to‘r (${web.releaseDateLabel ?? ''}) faqat belgilangan sanada ochiladi.`,
      next: prev,
      newlyAchievements: [],
    };
  }
  const pLevel = getPlayerLevelProgress(next.playerXp ?? 0).level;
  if (!next.isCreator && pLevel < web.minPlayerLevel) {
    return { ok: false, errorUz: `Daraja yetarli emas! Kamida ${web.minPlayerLevel}-daraja kerak.`, next: prev, newlyAchievements: [] };
  }
  if (!next.isCreator && next.spikeyCoins < web.price) {
    return { ok: false, errorUz: 'Spikey Coins yetarli emas!', next: prev, newlyAchievements: [] };
  }
  const txId = `buy_web_${webId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const cost = next.isCreator ? 0 : web.price;
  next.spikeyCoins = Math.max(0, next.spikeyCoins - cost);
  next.ownedWebDesigns = { ...(next.ownedWebDesigns ?? { classic_white: 1 }) };
  next.ownedWebDesigns[webId] = (next.ownedWebDesigns[webId] ?? 0) + 1;
  next.equippedWebDesign = webId;
  appendTx(next, txId, 'spend', -cost, `To‘r dizayni xarid qilindi: ${web.name}`);
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
  const sellPrice = web.sellPrice || Math.round(web.price * 0.4);
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
  if (def.isZaiLimited && !isZaiCaseAvailableNow(def, now)) {
    return {
      ok: false,
      errorUz: `${def.nameEn} faqat belgilangan ZAI sanasida sotuvda bo‘ladi!`,
      next: prev,
    };
  }
  const pLevel = getPlayerLevelProgress(next.playerXp ?? 0).level;
  if (!next.isCreator && def.minPlayerLevel && pLevel < def.minPlayerLevel) {
    return { ok: false, errorUz: `Kamida ${def.minPlayerLevel}-daraja kerak!`, next: prev };
  }
  if (!next.isCreator && next.spikeyCoins < def.price) {
    return { ok: false, errorUz: 'Spikey Coins yetarli emas!', next: prev };
  }
  const txId = `buy_case_${caseType}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const cost = next.isCreator ? 0 : def.price;
  next.spikeyCoins = Math.max(0, next.spikeyCoins - cost);
  next.ownedCases[caseType] = (next.ownedCases[caseType] ?? 0) + 1;
  appendTx(next, txId, 'spend', -cost, `Keys xarid qilindi: ${def.nameUz}`);
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
  addPlayerXp(next, 20);

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
    addPlayerXp(next, Math.round(def.xpBonus * 0.5));
  }

  appendTx(next, txId, 'earn', def.coins ?? 0, `Kunlik sovg‘a (${dayNum}-kun): ${def.labelUz}`);
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, reward: def, next, newlyAchievements };
}

function applySlotReward(
  next: EconomyData,
  slot: {
    coins?: number;
    caseType?: CaseType;
    skinId?: string;
    webDesignId?: string;
    avatarId?: string;
    profileFrameId?: string;
    specialItemId?: string;
  }
): void {
  if (slot.coins) next.spikeyCoins += slot.coins;
  if (slot.caseType) next.ownedCases[slot.caseType] = (next.ownedCases[slot.caseType] ?? 0) + 1;
  if (slot.skinId) grantSkinCount(next, slot.skinId, 1);
  if (slot.webDesignId) {
    next.ownedWebDesigns = { ...(next.ownedWebDesigns ?? { classic_white: 1 }) };
    next.ownedWebDesigns[slot.webDesignId] = (next.ownedWebDesigns[slot.webDesignId] ?? 0) + 1;
  }
  if (slot.avatarId) {
    const list = next.unlockedAvatars ?? [];
    if (!list.includes(slot.avatarId)) next.unlockedAvatars = [...list, slot.avatarId];
  }
  if (slot.profileFrameId) {
    const list = next.unlockedProfileFrames ?? ['frame_winter_steel'];
    if (!list.includes(slot.profileFrameId)) next.unlockedProfileFrames = [...list, slot.profileFrameId];
  }
  if (slot.specialItemId) {
    next.specialItems[slot.specialItemId] = (next.specialItems[slot.specialItemId] ?? 0) + 1;
  }
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
  applySlotReward(next, def);

  appendTx(next, txId, 'earn', def.coins ?? 0, `Sezon Pass ${level}-daraja: ${def.labelUz}`);
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, labelUz: def.labelUz, next, newlyAchievements };
}

export function claimBonusSeasonPassLevelAction(
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
  const claimedBonus = next.claimedBonusSeasonLevels ?? [];
  if (claimedBonus.includes(level)) {
    return { ok: false, errorUz: 'Bu bonus daraja sovg‘asi allaqachon olingan.', next: prev, newlyAchievements: [] };
  }

  const rewards = buildSeasonPassLevels(cal.month);
  const def = rewards.find((r) => r.level === level);
  if (!def) {
    return { ok: false, errorUz: 'Daraja topilmadi.', next: prev, newlyAchievements: [] };
  }

  const txId = `season_bonus_${cal.monthKey}_lvl${level}`;
  if (next.processedTxIds.includes(txId)) {
    return { ok: false, errorUz: 'Takroriy urinish bloklandi.', next: prev, newlyAchievements: [] };
  }

  next.claimedBonusSeasonLevels = [...claimedBonus, level];
  applySlotReward(next, def.bonus);

  appendTx(next, txId, 'earn', def.bonus.coins ?? 0, `Sezon Pass Bonus ${level}-daraja: ${def.bonus.labelUz}`);
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, labelUz: def.bonus.labelUz, next, newlyAchievements };
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
  addPlayerXp(next, Math.max(1, Math.round(def.rewardXp * 0.65)));
  appendTx(next, txId, 'earn', def.rewardCoins, `Topshiriq bajarildi: ${def.titleUz}`);
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, next, newlyAchievements };
}

export function buySeasonPassLevelAction(
  prev: EconomyData,
  cal = getLiveCalendarInfo()
): {
  ok: boolean;
  errorUz?: string;
  newLevel?: number;
  cost?: number;
  next: EconomyData;
  newlyAchievements: string[];
} {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  const curLevel = getSeasonLevelFromXp(next.seasonXp);
  if (curLevel >= MAX_SEASON_LEVEL) {
    return {
      ok: false,
      errorUz: `Sezon Pass maksimal ${MAX_SEASON_LEVEL}-darajaga yetgan.`,
      next: prev,
      newlyAchievements: [],
    };
  }
  const cost = next.isCreator ? 0 : getSeasonLevelSkipCost(curLevel);
  if (!next.isCreator && next.spikeyCoins < cost) {
    return {
      ok: false,
      errorUz: `Spikey Coins yetarli emas! (${cost.toLocaleString()} kerak)`,
      next: prev,
      newlyAchievements: [],
    };
  }
  const newLevel = curLevel + 1;
  next.spikeyCoins = Math.max(0, next.spikeyCoins - cost);
  next.seasonXp = Math.max(next.seasonXp, getXpForLevel(newLevel));
  const txId = `buy_season_lvl_${cal.monthKey}_${newLevel}_${Date.now()}`;
  appendTx(next, txId, 'spend', -cost, `Sezon Pass +1 Daraja (${newLevel}-LVL)`);
  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, newLevel, cost, next, newlyAchievements };
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
  addPlayerXp(next, 75);
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

export function deductFriendGiftAction(
  prev: EconomyData,
  input: { coins: number; skinId?: string; webDesignId?: string; recipientName: string },
  cal = getLiveCalendarInfo()
): { ok: boolean; errorUz?: string; next: EconomyData } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  if (next.isCreator) {
    return { ok: true, next };
  }
  const coins = Math.max(0, Math.floor(input.coins || 0));
  if (coins > next.spikeyCoins) {
    return { ok: false, errorUz: 'Spikey Coins yetarli emas!', next: prev };
  }
  if (input.skinId) {
    if (input.skinId === 'classic') {
      return { ok: false, errorUz: 'Boshlang‘ich skinni yuborib bo‘lmaydi.', next: prev };
    }
    const qty = next.ownedSkins[input.skinId] ?? 0;
    if (qty <= 0) {
      return { ok: false, errorUz: 'Sizda bu skin mavjud emas.', next: prev };
    }
    next.ownedSkins[input.skinId] = qty - 1;
    if (next.ownedSkins[input.skinId] <= 0) {
      delete next.ownedSkins[input.skinId];
      if (next.equippedSkin === input.skinId) next.equippedSkin = 'classic';
    }
  }
  if (input.webDesignId) {
    if (input.webDesignId === 'classic_white') {
      return { ok: false, errorUz: 'Boshlang‘ich to‘rni yuborib bo‘lmaydi.', next: prev };
    }
    next.ownedWebDesigns = { ...(next.ownedWebDesigns ?? { classic_white: 1 }) };
    const qty = next.ownedWebDesigns[input.webDesignId] ?? 0;
    if (qty <= 0) {
      return { ok: false, errorUz: 'Sizda bu to‘r dizayni mavjud emas.', next: prev };
    }
    next.ownedWebDesigns[input.webDesignId] = qty - 1;
    if (next.ownedWebDesigns[input.webDesignId] <= 0) {
      delete next.ownedWebDesigns[input.webDesignId];
      if (next.equippedWebDesign === input.webDesignId) next.equippedWebDesign = 'classic_white';
    }
  }
  if (coins > 0) {
    next.spikeyCoins -= coins;
  }
  const txId = `gift_send_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  appendTx(next, txId, 'trade', -coins, `Do‘stga sovg‘a → ${input.recipientName}`);
  return { ok: true, next };
}

export function applyServerGiftsAction(
  prev: EconomyData,
  gifts: {
    giftId: string;
    fromNickname: string;
    fromIsAdmin?: boolean;
    coins: number;
    skinId?: string;
    webDesignId?: string;
    caseType?: string;
    caseQty?: number;
    createdAt?: string;
  }[],
  cal = getLiveCalendarInfo()
): { next: EconomyData; appliedCount: number; newlyAchievements: string[] } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  let appliedCount = 0;

  for (const g of gifts) {
    const txId = `server_gift_${g.giftId}`;
    if (next.processedTxIds.includes(txId)) continue;

    const coins = Math.max(0, Math.floor(g.coins || 0));
    if (coins > 0 && !next.isCreator) {
      next.spikeyCoins += coins;
    }
    const validSkinId =
      g.skinId && ALL_SKINS.some((s) => s.id === g.skinId) ? g.skinId : undefined;
    if (validSkinId) {
      grantSkinCount(next, validSkinId, 1);
    }
    const validWebId =
      g.webDesignId && ALL_WEB_DESIGNS.some((w) => w.id === g.webDesignId)
        ? g.webDesignId
        : undefined;
    if (validWebId) {
      next.ownedWebDesigns = { ...(next.ownedWebDesigns ?? { classic_white: 1 }) };
      next.ownedWebDesigns[validWebId] = (next.ownedWebDesigns[validWebId] ?? 0) + 1;
    }
    let validCaseDef: (typeof CASE_MAP)[CaseType] | undefined;
    let validCaseQty = 0;
    if (g.caseType && Object.prototype.hasOwnProperty.call(CASE_MAP, g.caseType)) {
      validCaseDef = CASE_MAP[g.caseType as CaseType];
      validCaseQty = Math.max(1, Math.min(50, Math.floor(g.caseQty || 1)));
      next.ownedCases[validCaseDef.type] = (next.ownedCases[validCaseDef.type] ?? 0) + validCaseQty;
    }

    const isFromAdmin = Boolean(g.fromIsAdmin || g.giftId.startsWith('admin_gift_'));
    if (isFromAdmin && !next.isCreator) {
      const existingGifts = next.ownerGiftsReceived ?? [];
      if (!existingGifts.some((rec) => rec.giftId === g.giftId)) {
        const record: OwnerGiftRecord = {
          giftId: g.giftId,
          coins,
          skinId: validSkinId,
          webDesignId: validWebId,
          caseType: validCaseDef?.type,
          caseQty: validCaseDef && validCaseQty > 0 ? validCaseQty : undefined,
          receivedAt: g.createdAt || new Date().toISOString(),
        };
        next.ownerGiftsReceived = [record, ...existingGifts].slice(0, 120);
      }
    }

    const parts: string[] = [];
    if (coins > 0) parts.push(`+${coins.toLocaleString()} tanga`);
    if (validSkinId) parts.push(getSkinById(validSkinId).name);
    if (validWebId) parts.push(getWebDesignById(validWebId).name);
    if (validCaseDef && validCaseQty > 0) parts.push(`${validCaseQty}× ${validCaseDef.nameUz}`);
    appendTx(next, txId, 'earn', coins, `${g.fromNickname} sovg‘asi: ${parts.join(', ')}`);
    appliedCount += 1;
  }

  const newlyAchievements = appliedCount > 0 ? evaluateEconomyAchievements(next) : [];
  return { next, appliedCount, newlyAchievements };
}
