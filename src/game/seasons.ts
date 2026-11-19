import { ALL_SKINS } from './skins';
import { CaseType, SeasonMonth } from './types';

export type SeasonParticleKind =
  | 'snow'
  | 'hearts'
  | 'navruzPetals'
  | 'cherryBlossom'
  | 'leaves'
  | 'sunSparkles'
  | 'sandShimmer'
  | 'neonSparks'
  | 'magicPages'
  | 'ghostWisps'
  | 'goldLeaves'
  | 'holidayLights';

export interface SeasonConfig {
  month: SeasonMonth;
  monthNameUz: string;
  seasonTitleUz: string;
  subtitleUz: string;
  loadingTaglineUz: string;
  skyTop: string;
  skyBottom: string;
  farColor: string;
  midColor: string;
  groundTop: string;
  groundBody: string;
  accentColor: string;
  particleColor: string;
  secondaryParticleColor: string;
  particleKind: SeasonParticleKind;
  musicTrack:
    | 'seasonWinter'
    | 'seasonLove'
    | 'seasonSpring'
    | 'seasonSummer'
    | 'seasonNeon'
    | 'seasonAutumn'
    | 'seasonHalloween'
    | 'seasonHoliday';
  featuredSkinId: string;
  mythicSkinId: string;
  eventTitleUz: string;
  eventDescUz: string;
  eventGiftCoins: number;
  eventGiftCase: CaseType;
}

export const SEASONS_12: Record<SeasonMonth, SeasonConfig> = {
  1: {
    month: 1,
    monthNameUz: 'YANVAR',
    seasonTitleUz: "QISH MO'JIZASI",
    subtitleUz: 'Qorli o‘rmonlar, muzlagan ko‘llar va muz qal’alari',
    loadingTaglineUz: 'Muz qal’alari va qor zarralari tayyorlanmoqda...',
    skyTop: '#0f2942',
    skyBottom: '#67b7dc',
    farColor: '#1f4e73',
    midColor: '#2d6894',
    groundTop: '#e0f2fe',
    groundBody: '#38bdf8',
    accentColor: '#7dd3fc',
    particleColor: '#ffffff',
    secondaryParticleColor: '#bae6fd',
    particleKind: 'snow',
    musicTrack: 'seasonWinter',
    featuredSkinId: 'frost_king_jan',
    mythicSkinId: 'mythic_aurora_crown',
    eventTitleUz: 'YANGI YIL QOR SOVG‘ASI',
    eventDescUz: 'Yanvar muz mo‘jizasi bayramida bepul sovg‘a va qishki topshiriqlar!',
    eventGiftCoins: 350,
    eventGiftCase: 'seasonal',
  },
  2: {
    month: 2,
    monthNameUz: 'FEVRAL',
    seasonTitleUz: "SEVGI VA DO'STLIK",
    subtitleUz: 'Pushti-binafsha muhit, yurak bezaklari va do‘stlik sovg‘alari',
    loadingTaglineUz: 'Do‘stlik va yurak bezaklari yuklanmoqda...',
    skyTop: '#3b0764',
    skyBottom: '#db2777',
    farColor: '#581c87',
    midColor: '#701a75',
    groundTop: '#f472b6',
    groundBody: '#831843',
    accentColor: '#fbcfe8',
    particleColor: '#f472b6',
    secondaryParticleColor: '#e879f9',
    particleKind: 'hearts',
    musicTrack: 'seasonLove',
    featuredSkinId: 'heart_cupid_feb',
    mythicSkinId: 'mythic_aurora_crown',
    eventTitleUz: 'DO‘STLIK BAYRAMI',
    eventDescUz: 'Savdo va do‘stlik oyida maxsus yurak skini va sovg‘alar!',
    eventGiftCoins: 300,
    eventGiftCase: 'uncommon',
  },
  3: {
    month: 3,
    monthNameUz: 'MART',
    seasonTitleUz: "NAVRO'Z BAYRAMI",
    subtitleUz: 'Bahor manzaralari, gullar va milliy Navro‘z bezaklari',
    loadingTaglineUz: 'Bahor gullari va Navro‘z bayrami uyg‘onmoqda...',
    skyTop: '#065f46',
    skyBottom: '#4ade80',
    farColor: '#047857',
    midColor: '#15803d',
    groundTop: '#84cc16',
    groundBody: '#713f12',
    accentColor: '#fde047',
    particleColor: '#fde047',
    secondaryParticleColor: '#f472b6',
    particleKind: 'navruzPetals',
    musicTrack: 'seasonSpring',
    featuredSkinId: 'navruz_spring_mar',
    mythicSkinId: 'mythic_aurora_crown',
    eventTitleUz: "NAVRO'Z SAYLI",
    eventDescUz: 'Navro‘z ayyomi munosabati bilan bepul bayram keysi va tangalar!',
    eventGiftCoins: 500,
    eventGiftCase: 'seasonal',
  },
  4: {
    month: 4,
    monthNameUz: 'APREL',
    seasonTitleUz: 'BAHOR GULLARI',
    subtitleUz: 'Olcha gullari, rang-barang chechaklar va kapalaklar',
    loadingTaglineUz: 'Sakura gullari va kapalaklar uchmoqda...',
    skyTop: '#1d4ed8',
    skyBottom: '#f9a8d4',
    farColor: '#4c1d95',
    midColor: '#be185d',
    groundTop: '#4ade80',
    groundBody: '#5b3a29',
    accentColor: '#f9a8d4',
    particleColor: '#fbcfe8',
    secondaryParticleColor: '#fde047',
    particleKind: 'cherryBlossom',
    musicTrack: 'seasonSpring',
    featuredSkinId: 'sakura_bloom_apr',
    mythicSkinId: 'mythic_aurora_crown',
    eventTitleUz: 'GULLAR FESTIVALI',
    eventDescUz: 'Bahor gullari mavsumida maxsus mukofotlar va skinlar!',
    eventGiftCoins: 300,
    eventGiftCase: 'rare',
  },
  5: {
    month: 5,
    monthNameUz: 'MAY',
    seasonTitleUz: "TABIAT UYG'ONISHI",
    subtitleUz: 'Yam-yashil o‘rmonlar, zilol daryolar va tabiat ruhi',
    loadingTaglineUz: 'Yashil o‘rmon va daryo to‘lqinlari jonlanmoqda...',
    skyTop: '#064e3b',
    skyBottom: '#34d399',
    farColor: '#065f46',
    midColor: '#166534',
    groundTop: '#22c55e',
    groundBody: '#4d2c19',
    accentColor: '#a7f3d0',
    particleColor: '#86efac',
    secondaryParticleColor: '#38bdf8',
    particleKind: 'leaves',
    musicTrack: 'seasonSpring',
    featuredSkinId: 'emerald_river_may',
    mythicSkinId: 'mythic_aurora_crown',
    eventTitleUz: 'TABIAT HAFTALIGI',
    eventDescUz: 'O‘rmon va daryo xazinalarini to‘plab Sezon XP yig‘ing!',
    eventGiftCoins: 300,
    eventGiftCase: 'uncommon',
  },
  6: {
    month: 6,
    monthNameUz: 'IYUN',
    seasonTitleUz: 'YOZGI SARGUZASHT',
    subtitleUz: 'Quyoshli plyajlar, tropik orollar va yozgi skinlar',
    loadingTaglineUz: 'Tropik orol va quyosh nurlari tayyorlanmoqda...',
    skyTop: '#0284c7',
    skyBottom: '#fde047',
    farColor: '#0369a1',
    midColor: '#0d9488',
    groundTop: '#facc15',
    groundBody: '#b45309',
    accentColor: '#22d3ee',
    particleColor: '#fde047',
    secondaryParticleColor: '#67e8f9',
    particleKind: 'sunSparkles',
    musicTrack: 'seasonSummer',
    featuredSkinId: 'tropical_sun_jun',
    mythicSkinId: 'mythic_aurora_crown',
    eventTitleUz: 'PLYAJ SARGUZASHTI',
    eventDescUz: 'Yozning ilk oyida tropik sovg‘alar va oltin mukofotlar!',
    eventGiftCoins: 350,
    eventGiftCase: 'rare',
  },
  7: {
    month: 7,
    monthNameUz: 'IYUL',
    seasonTitleUz: 'ISSIQ YOZ',
    subtitleUz: 'Sahro manzarasi, palma daraxtlari va oltin sovg‘alar',
    loadingTaglineUz: 'Oltin sahro va palma vohasi yuklanmoqda...',
    skyTop: '#7c2d12',
    skyBottom: '#fbbf24',
    farColor: '#9a3412',
    midColor: '#b45309',
    groundTop: '#fbbf24',
    groundBody: '#78350f',
    accentColor: '#38bdf8',
    particleColor: '#fde68a',
    secondaryParticleColor: '#fb923c',
    particleKind: 'sandShimmer',
    musicTrack: 'seasonSummer',
    featuredSkinId: 'desert_gold_jul',
    mythicSkinId: 'mythic_aurora_crown',
    eventTitleUz: 'SAHRO OLTINI',
    eventDescUz: 'Iyul quyoshida qo‘shimcha Spikey Coins va Sezon Keysi!',
    eventGiftCoins: 400,
    eventGiftCase: 'seasonal',
  },
  8: {
    month: 8,
    monthNameUz: 'AVGUST',
    seasonTitleUz: 'NEON YOZ',
    subtitleUz: 'Neon chiroqlar, kiberpank bezaklar va maxsus neon keyslar',
    loadingTaglineUz: 'Kiberpank neon shahri ishga tushmoqda...',
    skyTop: '#09092b',
    skyBottom: '#7e22ce',
    farColor: '#1e1b4b',
    midColor: '#312e81',
    groundTop: '#22d3ee',
    groundBody: '#1e1b4b',
    accentColor: '#f472b6',
    particleColor: '#22d3ee',
    secondaryParticleColor: '#f43f5e',
    particleKind: 'neonSparks',
    musicTrack: 'seasonNeon',
    featuredSkinId: 'neon_pulse_aug',
    mythicSkinId: 'mythic_aurora_crown',
    eventTitleUz: 'NEON KIBER KECHASI',
    eventDescUz: 'Avgust kiberpank oyida Neon skinlar va maxsus keyslar!',
    eventGiftCoins: 450,
    eventGiftCase: 'epic',
  },
  9: {
    month: 9,
    monthNameUz: 'SENTABR',
    seasonTitleUz: 'BILIM VA SARGUZASHT',
    subtitleUz: 'Sehrli kutubxonalar, maktab bezaklari va kuz boshlanishi',
    loadingTaglineUz: 'Sehrli kutubxona sahifalari ochilmoqda...',
    skyTop: '#1e293b',
    skyBottom: '#f59e0b',
    farColor: '#334155',
    midColor: '#475569',
    groundTop: '#d97706',
    groundBody: '#451a03',
    accentColor: '#60a5fa',
    particleColor: '#fde047',
    secondaryParticleColor: '#93c5fd',
    particleKind: 'magicPages',
    musicTrack: 'seasonAutumn',
    featuredSkinId: 'arcane_scholar_sep',
    mythicSkinId: 'mythic_aurora_crown',
    eventTitleUz: 'BILIM VA SEHR',
    eventDescUz: 'Yangi o‘quv va sarguzasht oyida bepul bilim xazinasi!',
    eventGiftCoins: 350,
    eventGiftCase: 'rare',
  },
  10: {
    month: 10,
    monthNameUz: 'OKTABR',
    seasonTitleUz: 'HALLOWEEN',
    subtitleUz: 'Arvohli o‘rmon, qovoqlar, arvohlar va qorong‘u qal’alar',
    loadingTaglineUz: 'Qovoq chiroqlari va Halloween kechasi boshlanmoqda...',
    skyTop: '#0d0417',
    skyBottom: '#7c2d12',
    farColor: '#1f0c33',
    midColor: '#3b0764',
    groundTop: '#f97316',
    groundBody: '#1e1029',
    accentColor: '#c084fc',
    particleColor: '#fb923c',
    secondaryParticleColor: '#c084fc',
    particleKind: 'ghostWisps',
    musicTrack: 'seasonHalloween',
    featuredSkinId: 'pumpkin_ghost_oct',
    mythicSkinId: 'mythic_aurora_crown',
    eventTitleUz: 'HALLOWEEN KECHASI',
    eventDescUz: 'Qovoq chiroqlari va arvohlar bayramida bepul bayram keysi!',
    eventGiftCoins: 500,
    eventGiftCase: 'seasonal',
  },
  11: {
    month: 11,
    monthNameUz: 'NOYABR',
    seasonTitleUz: 'OLTIN KUZ',
    subtitleUz: 'Oltin va sariq barglar, kuzgi o‘rmon va oltin skinlar',
    loadingTaglineUz: 'Oltin kuz barglari va xazina shamoli esmoqda...',
    skyTop: '#2c1306',
    skyBottom: '#d97706',
    farColor: '#4a210a',
    midColor: '#6e3211',
    groundTop: '#f59e0b',
    groundBody: '#451a03',
    accentColor: '#fde047',
    particleColor: '#fbbf24',
    secondaryParticleColor: '#f97316',
    particleKind: 'goldLeaves',
    musicTrack: 'seasonAutumn',
    featuredSkinId: 'golden_autumn_nov',
    mythicSkinId: 'mythic_aurora_crown',
    eventTitleUz: 'OLTIN XAZON BAYRAMI',
    eventDescUz: 'Noyabr — Oltin Kuz festivalida bepul sovg‘a va maxsus bayram do‘koni!',
    eventGiftCoins: 450,
    eventGiftCase: 'seasonal',
  },
  12: {
    month: 12,
    monthNameUz: 'DEKABR',
    seasonTitleUz: 'YANGI YIL',
    subtitleUz: 'Archalar, qor, bayram chiroqlari, sovg‘alar va Santa Spikey',
    loadingTaglineUz: 'Yangi Yil archasi va Santa Spikey sovg‘alari yuklanmoqda...',
    skyTop: '#081b33',
    skyBottom: '#166534',
    farColor: '#0f2e4d',
    midColor: '#14532d',
    groundTop: '#f8fafc',
    groundBody: '#1e3a5f',
    accentColor: '#ef4444',
    particleColor: '#ffffff',
    secondaryParticleColor: '#fde047',
    particleKind: 'holidayLights',
    musicTrack: 'seasonHoliday',
    featuredSkinId: 'santa_spikey_dec',
    mythicSkinId: 'mythic_aurora_crown',
    eventTitleUz: 'YANGI YIL BAYRAMI',
    eventDescUz: 'Santa Spikey va Afsonaviy bayram keysi bilan Yangi Yilni kutib oling!',
    eventGiftCoins: 600,
    eventGiftCase: 'legendary',
  },
};

export interface LiveCalendarInfo {
  year: number;
  month: SeasonMonth;
  day: number;
  monthKey: string;
  dateKey: string;
  weekKey: string;
  season: SeasonConfig;
  bannerLine1: string;
  bannerLine2: string;
}

export function getLiveCalendarInfo(now = new Date()): LiveCalendarInfo {
  const year = now.getFullYear();
  const month = (now.getMonth() + 1) as SeasonMonth;
  const day = now.getDate();
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  const dateKey = `${monthKey}-${String(day).padStart(2, '0')}`;

  // Simple ISO-like week index for weekly mission resets
  const startOfYear = new Date(year, 0, 1);
  const diffDays = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.max(1, Math.ceil((diffDays + startOfYear.getDay() + 1) / 7));
  const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`;

  const season = SEASONS_12[month];
  return {
    year,
    month,
    day,
    monthKey,
    dateKey,
    weekKey,
    season,
    bannerLine1: `HOZIRGI SEZON: ${season.seasonTitleUz}`,
    bannerLine2: `${year}-YIL ${season.monthNameUz}`,
  };
}

// ===================================================
// 50-LEVEL SEASON PASS
// ===================================================
export type SeasonRewardKind = 'coins' | 'case' | 'skin' | 'special';

export interface SeasonPassLevelDef {
  level: number;
  xpRequiredCumulative: number;
  rewardKind: SeasonRewardKind;
  coins?: number;
  caseType?: CaseType;
  skinId?: string;
  specialItemId?: string;
  labelUz: string;
  highlight?: boolean;
}

export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let l = 2; l <= level; l++) {
    total += 100 + (l - 2) * 20;
  }
  return total;
}

export function getSeasonLevelFromXp(xp: number): number {
  let lvl = 1;
  for (let l = 2; l <= 50; l++) {
    if (xp >= getXpForLevel(l)) {
      lvl = l;
    } else {
      break;
    }
  }
  return lvl;
}

export function buildSeasonPassLevels(month: SeasonMonth): SeasonPassLevelDef[] {
  const season = SEASONS_12[month];
  const randomPool = ALL_SKINS.filter((s) => s.rarity === 'uncommon' || s.rarity === 'rare');
  const commonSkins = ALL_SKINS.filter((s) => s.rarity === 'common' || s.rarity === 'uncommon');
  const fallbackPick = (idx: number) => randomPool[idx % randomPool.length].id;

  const levels: SeasonPassLevelDef[] = [];
  for (let level = 1; level <= 50; level++) {
    const xpRequiredCumulative = getXpForLevel(level);
    let def: SeasonPassLevelDef;

    if (level === 1) {
      def = { level, xpRequiredCumulative, rewardKind: 'coins', coins: 100, labelUz: '100 Spikey Coins' };
    } else if (level === 2) {
      def = { level, xpRequiredCumulative, rewardKind: 'case', caseType: 'common', labelUz: 'Oddiy Keys' };
    } else if (level === 3) {
      def = { level, xpRequiredCumulative, rewardKind: 'coins', coins: 150, labelUz: '150 Spikey Coins' };
    } else if (level === 4) {
      def = {
        level,
        xpRequiredCumulative,
        rewardKind: 'skin',
        skinId: commonSkins[month % commonSkins.length].id,
        labelUz: 'Tasodifiy Skin',
      };
    } else if (level === 5) {
      def = { level, xpRequiredCumulative, rewardKind: 'case', caseType: 'uncommon', labelUz: 'Noyobroq Keys', highlight: true };
    } else if (level === 10) {
      def = { level, xpRequiredCumulative, rewardKind: 'case', caseType: 'rare', labelUz: 'Nodir Keys', highlight: true };
    } else if (level === 15) {
      def = { level, xpRequiredCumulative, rewardKind: 'coins', coins: 500, labelUz: '500 Spikey Coins', highlight: true };
    } else if (level === 20) {
      def = { level, xpRequiredCumulative, rewardKind: 'case', caseType: 'epic', labelUz: 'Epik Keys', highlight: true };
    } else if (level === 25) {
      def = {
        level,
        xpRequiredCumulative,
        rewardKind: 'skin',
        skinId: fallbackPick(month + 3),
        labelUz: 'Eksklyuziv Skin',
        highlight: true,
      };
    } else if (level === 30) {
      def = { level, xpRequiredCumulative, rewardKind: 'case', caseType: 'legendary', labelUz: 'Afsonaviy Keys', highlight: true };
    } else if (level === 40) {
      def = {
        level,
        xpRequiredCumulative,
        rewardKind: 'skin',
        skinId: season.featuredSkinId,
        labelUz: 'Nodir Sezon Skini',
        highlight: true,
      };
    } else if (level === 50) {
      def = {
        level,
        xpRequiredCumulative,
        rewardKind: 'skin',
        skinId: season.mythicSkinId,
        labelUz: 'MIFIK SEZON SKINI',
        highlight: true,
      };
    } else if (level % 7 === 0) {
      def = {
        level,
        xpRequiredCumulative,
        rewardKind: 'case',
        caseType: 'seasonal',
        labelUz: 'Sezon Keysi',
      };
    } else if (level % 6 === 0) {
      def = {
        level,
        xpRequiredCumulative,
        rewardKind: 'case',
        caseType: level >= 35 ? 'rare' : 'uncommon',
        labelUz: level >= 35 ? 'Nodir Keys' : 'Noyobroq Keys',
      };
    } else if (level % 5 === 0) {
      def = {
        level,
        xpRequiredCumulative,
        rewardKind: 'coins',
        coins: 400 + level * 15,
        labelUz: `${400 + level * 15} Spikey Coins`,
      };
    } else if (level % 4 === 0) {
      def = {
        level,
        xpRequiredCumulative,
        rewardKind: 'special',
        specialItemId: level % 8 === 0 ? 'lucky_clover' : 'xp_boost',
        labelUz: level % 8 === 0 ? 'Omad Nishoni' : 'Sezon XP Kuchaytirgich',
      };
    } else {
      const amount = 150 + level * 12;
      def = {
        level,
        xpRequiredCumulative,
        rewardKind: 'coins',
        coins: amount,
        labelUz: `${amount} Spikey Coins`,
      };
    }
    levels.push(def);
  }
  return levels;
}

export interface HolidayScheduleDef {
  id: string;
  titleUz: string;
  dateWindowUz: string;
  descriptionUz: string;
  month: SeasonMonth;
  skinId: string;
  giftCoins: number;
  giftCase: CaseType;
}

export const HOLIDAY_CALENDAR: HolidayScheduleDef[] = [
  {
    id: 'holiday_navruz',
    titleUz: "NAVRO'Z BAYRAMI",
    dateWindowUz: 'Mart (19–25 Mart)',
    descriptionUz: 'Bahor tengkunligi, sumalak va milliy Navro‘z sovg‘alari!',
    month: 3,
    skinId: 'navruz_spring_mar',
    giftCoins: 500,
    giftCase: 'seasonal',
  },
  {
    id: 'holiday_halloween',
    titleUz: 'HALLOWEEN TADBIR',
    dateWindowUz: 'Oktabr (25–31 Oktabr)',
    descriptionUz: 'Qovoqlar, arvohlar va qorong‘u qal’a keyslari bayrami!',
    month: 10,
    skinId: 'pumpkin_ghost_oct',
    giftCoins: 500,
    giftCase: 'seasonal',
  },
  {
    id: 'holiday_newyear',
    titleUz: 'YANGI YIL BAYRAMI',
    dateWindowUz: 'Dekabr – Yanvar',
    descriptionUz: 'Santa Spikey, archalar va Afsonaviy Yangi Yil keysi!',
    month: 12,
    skinId: 'santa_spikey_dec',
    giftCoins: 600,
    giftCase: 'legendary',
  },
];
