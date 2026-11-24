import { ALL_SKINS, RARITY_META, SkinDef } from './skins';
import { CaseType, Rarity } from './types';

export interface CaseDropChance {
  rarity: Rarity;
  probability: number; // 0..100
  seasonalOnly?: boolean;
  zaiOnly?: boolean;
  eventId?: string;
}

export interface CaseDef {
  type: CaseType;
  nameUz: string;
  nameEn: string;
  price: number;
  minPlayerLevel?: number;
  isZaiLimited?: boolean;
  eventId?: 'zai_summer' | 'zai_starfall' | 'zai_shadow';
  color: string;
  badgeClass: string;
  descriptionUz: string;
  drops: CaseDropChance[];
}

export const ALL_CASES: CaseDef[] = [
  {
    type: 'common',
    nameUz: 'ODDIY KEYS',
    nameEn: 'COMMON CASE',
    price: 10000,
    minPlayerLevel: 1,
    color: '#94a3b8',
    badgeClass: 'border-slate-500 bg-slate-900/80',
    descriptionUz: 'Boshlang‘ich o‘yinchilar uchun hamyonbop keys.',
    drops: [
      { rarity: 'common', probability: 75 },
      { rarity: 'uncommon', probability: 20 },
      { rarity: 'rare', probability: 4 },
      { rarity: 'epic', probability: 1 },
    ],
  },
  {
    type: 'uncommon',
    nameUz: 'NOYOBROQ KEYS',
    nameEn: 'UNCOMMON CASE',
    price: 20000,
    minPlayerLevel: 2,
    color: '#4ade80',
    badgeClass: 'border-emerald-500/80 bg-emerald-950/35',
    descriptionUz: 'Neon va noyobroq skinlar tushish imkoniyati yuqoriroq.',
    drops: [
      { rarity: 'common', probability: 50 },
      { rarity: 'uncommon', probability: 35 },
      { rarity: 'rare', probability: 13 },
      { rarity: 'epic', probability: 2 },
    ],
  },
  {
    type: 'rare',
    nameUz: 'NODIR KEYS',
    nameEn: 'RARE CASE',
    price: 35000,
    minPlayerLevel: 3,
    color: '#38bdf8',
    badgeClass: 'border-sky-400/80 bg-sky-950/40',
    descriptionUz: 'Oddiy va Noyobroq skinlar bilan birga Epik topish imkoniyati!',
    drops: [
      { rarity: 'common', probability: 40 },
      { rarity: 'uncommon', probability: 40 },
      { rarity: 'rare', probability: 17 },
      { rarity: 'epic', probability: 3 },
    ],
  },
  {
    type: 'epic',
    nameUz: 'EPIK KEYS',
    nameEn: 'EPIC CASE',
    price: 60000,
    minPlayerLevel: 5,
    color: '#c084fc',
    badgeClass: 'border-purple-400/85 bg-purple-950/45',
    descriptionUz: 'Afsonaviy skinlarga yo‘l ochuvchi kuchli kolleksiya keysi.',
    drops: [
      { rarity: 'common', probability: 40 },
      { rarity: 'uncommon', probability: 40 },
      { rarity: 'rare', probability: 18 },
      { rarity: 'legendary', probability: 2 },
    ],
  },
  {
    type: 'legendary',
    nameUz: 'AFSONAVIY KEYS',
    nameEn: 'LEGENDARY CASE',
    price: 90000,
    minPlayerLevel: 8,
    color: '#fbbf24',
    badgeClass: 'border-amber-400 bg-amber-950/40',
    descriptionUz: 'Kuchli Epik va Afsonaviy kolleksiyalar sandig‘i.',
    drops: [
      { rarity: 'epic', probability: 50 },
      { rarity: 'legendary', probability: 47 },
      { rarity: 'mythic', probability: 3 },
    ],
  },
  {
    type: 'mythic',
    nameUz: 'MIFIK KEYS',
    nameEn: 'MYTHIC CASE',
    price: 140000,
    minPlayerLevel: 12,
    color: '#f43f5e',
    badgeClass: 'border-rose-500 bg-gradient-to-br from-rose-950/60 to-fuchsia-950/60',
    descriptionUz: '99% Afsonaviy, qat’iy 1% MIFIK! Haqiqiy omad sinovi.',
    drops: [
      { rarity: 'legendary', probability: 99 },
      { rarity: 'mythic', probability: 1 },
    ],
  },
  {
    type: 'seasonal',
    nameUz: 'SEZON KEYSI',
    nameEn: 'SEASONAL CASE',
    price: 48000,
    minPlayerLevel: 3,
    color: '#e879f9',
    badgeClass: 'border-fuchsia-400 bg-fuchsia-950/40',
    descriptionUz: '12 oylik eksklyuziv sezon skinlari va 0.2% Mifik sezon toji!',
    drops: [
      { rarity: 'common', probability: 55, seasonalOnly: true },
      { rarity: 'uncommon', probability: 30, seasonalOnly: true },
      { rarity: 'rare', probability: 12, seasonalOnly: true },
      { rarity: 'epic', probability: 2.8, seasonalOnly: true },
      { rarity: 'mythic', probability: 0.2, seasonalOnly: true },
    ],
  },
  {
    type: 'zai_monthly',
    nameUz: 'ZAI OYLIK KEYSI',
    nameEn: 'ZAI MONTHLY CASE',
    price: 110000,
    minPlayerLevel: 6,
    isZaiLimited: true,
    color: '#fbbf24',
    badgeClass: 'border-amber-300 bg-gradient-to-br from-slate-950 via-amber-950/40 to-cyan-950/40',
    descriptionUz: 'Har oyning 1–7 sanalarida ochiladigan ZAI LIMITED kristal skinlari keysi!',
    drops: [
      { rarity: 'epic', probability: 45 },
      { rarity: 'legendary', probability: 35 },
      { rarity: 'limited', probability: 19, zaiOnly: true },
      { rarity: 'mythic', probability: 1 },
    ],
  },
  {
    type: 'zai_summer',
    nameUz: 'ZAI SUMMER CASE',
    nameEn: 'ZAI SUMMER CASE',
    price: 125000,
    minPlayerLevel: 8,
    isZaiLimited: true,
    eventId: 'zai_summer',
    color: '#06b6d4',
    badgeClass: 'border-cyan-300 bg-gradient-to-br from-slate-950 via-cyan-950/50 to-amber-950/40',
    descriptionUz: 'Har yili 10-Iyunda ochiladigan yozgi ZAI LIMITED bayram keysi!',
    drops: [
      { rarity: 'rare', probability: 35 },
      { rarity: 'epic', probability: 35 },
      { rarity: 'legendary', probability: 20 },
      { rarity: 'limited', probability: 9, zaiOnly: true, eventId: 'zai_summer' },
      { rarity: 'mythic', probability: 1 },
    ],
  },
  {
    type: 'zai_starfall',
    nameUz: 'ZAI STARFALL CASE',
    nameEn: 'ZAI STARFALL CASE',
    price: 135000,
    minPlayerLevel: 8,
    isZaiLimited: true,
    eventId: 'zai_starfall',
    color: '#c084fc',
    badgeClass: 'border-purple-300 bg-gradient-to-br from-slate-950 via-purple-950/50 to-sky-950/40',
    descriptionUz: 'Har yili 23-Avgustda ochiladigan yulduzli ZAI LIMITED bayram keysi!',
    drops: [
      { rarity: 'rare', probability: 30 },
      { rarity: 'epic', probability: 38 },
      { rarity: 'legendary', probability: 22 },
      { rarity: 'limited', probability: 9, zaiOnly: true, eventId: 'zai_starfall' },
      { rarity: 'mythic', probability: 1 },
    ],
  },
  {
    type: 'zai_shadow',
    nameUz: 'ZAI SHADOW CASE',
    nameEn: 'ZAI SHADOW CASE',
    price: 145000,
    minPlayerLevel: 9,
    isZaiLimited: true,
    eventId: 'zai_shadow',
    color: '#fbbf24',
    badgeClass: 'border-amber-400 bg-gradient-to-br from-slate-950 via-indigo-950/60 to-amber-950/40',
    descriptionUz: 'Har yili 9-Sentyabrda ochiladigan Soya ZAI LIMITED bayram keysi!',
    drops: [
      { rarity: 'epic', probability: 42 },
      { rarity: 'legendary', probability: 42 },
      { rarity: 'limited', probability: 14, zaiOnly: true, eventId: 'zai_shadow' },
      { rarity: 'mythic', probability: 2 },
    ],
  },
];

export const CASE_MAP: Record<CaseType, CaseDef> = ALL_CASES.reduce(
  (acc, c) => {
    acc[c.type] = c;
    return acc;
  },
  {} as Record<CaseType, CaseDef>
);

function cryptoRandomFloat(): number {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return arr[0] / 4294967296;
  }
  return Math.random();
}

function getPoolForDrop(
  rarity: Rarity,
  seasonalOnly?: boolean,
  zaiOnly?: boolean,
  eventId?: string
): SkinDef[] {
  if (zaiOnly) {
    if (eventId) {
      const evPool = ALL_SKINS.filter((s) => s.isZaiLimited && s.eventId === eventId);
      const zaiMonthly = ALL_SKINS.filter((s) => s.isZaiLimited && !s.eventId);
      const combined = [...evPool, ...zaiMonthly.slice(0, 4)];
      if (combined.length > 0) return combined;
    }
    const zaiPool = ALL_SKINS.filter((s) => s.isZaiLimited);
    if (zaiPool.length > 0) return zaiPool;
  }
  if (seasonalOnly) {
    const seasonalPool = ALL_SKINS.filter((s) => s.category === 'seasonal' && s.rarity === rarity);
    if (seasonalPool.length > 0) return seasonalPool;
    const anySeasonal = ALL_SKINS.filter((s) => s.category === 'seasonal');
    if (anySeasonal.length > 0) return anySeasonal;
  }
  const exact = ALL_SKINS.filter((s) => s.rarity === rarity && s.id !== 'classic' && !s.isZaiLimited);
  if (exact.length > 0) return exact;
  return ALL_SKINS.filter((s) => s.rarity === rarity && !s.isZaiLimited);
}

export function getCasePoolItems(caseType: CaseType): SkinDef[] {
  const def = CASE_MAP[caseType];
  const seen = new Set<string>();
  const out: SkinDef[] = [];
  for (const d of def.drops) {
    const sub = getPoolForDrop(d.rarity, d.seasonalOnly, d.zaiOnly, d.eventId);
    for (const s of sub) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        out.push(s);
      }
    }
  }
  return out;
}

/**
 * Pure, honest probability roll calculated BEFORE roulette animation begins.
 * Zero hidden pity boosts, zero rigged odds.
 */
export function rollCaseOutcome(caseType: CaseType): SkinDef {
  const def = CASE_MAP[caseType];
  const roll = cryptoRandomFloat() * 100;
  let cumulative = 0;
  let chosenDrop = def.drops[0];

  for (const drop of def.drops) {
    cumulative += drop.probability;
    if (roll < cumulative) {
      chosenDrop = drop;
      break;
    }
  }

  const pool = getPoolForDrop(
    chosenDrop.rarity,
    chosenDrop.seasonalOnly,
    chosenDrop.zaiOnly,
    chosenDrop.eventId
  );
  const idx = Math.floor(cryptoRandomFloat() * pool.length);
  return pool[idx] ?? ALL_SKINS[0];
}

export interface CaseSpinResult {
  winningSkin: SkinDef;
  reel: SkinDef[];
  winningIndex: number;
  isNewSkin: boolean;
}

/**
 * Builds a 45-slot horizontal roulette strip with the pre-determined winning skin
 * placed strictly at index 36 so animation always lands accurately on the true roll.
 */
export function buildCaseRouletteReel(caseType: CaseType, winningSkin: SkinDef): { reel: SkinDef[]; winningIndex: number } {
  const def = CASE_MAP[caseType];
  const isSeasonal = caseType === 'seasonal';
  const reel: SkinDef[] = [];
  const totalSlots = 45;
  const winningIndex = 36;

  // Weighted visual pool for realistic roulette reel diversity
  const visualPool: SkinDef[] = [];
  for (const d of def.drops) {
    const sub = getPoolForDrop(d.rarity, isSeasonal || d.seasonalOnly, d.zaiOnly, d.eventId);
    const weight = Math.max(1, Math.round(d.probability / 4));
    for (let w = 0; w < weight; w++) {
      visualPool.push(sub[w % sub.length]);
    }
  }

  for (let i = 0; i < totalSlots; i++) {
    if (i === winningIndex) {
      reel.push(winningSkin);
    } else {
      const idx = Math.floor(cryptoRandomFloat() * visualPool.length);
      reel.push(visualPool[idx] ?? ALL_SKINS[1]);
    }
  }

  return { reel, winningIndex };
}

export function getSkinRarityLabelUz(rarity: Rarity): string {
  return RARITY_META[rarity].labelUz;
}
