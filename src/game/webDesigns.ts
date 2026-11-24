import { Rarity } from './types';
import { ANNUAL_ZAI_EVENTS, ZAI_MONTHLY_THEMES } from './zaiCollection';

export type WebColorId =
  | 'white'
  | 'blue'
  | 'ice_blue'
  | 'purple'
  | 'red'
  | 'green'
  | 'gold'
  | 'rainbow'
  | 'neon'
  | 'black'
  | 'crystal'
  | 'galaxy';

export type WebAnimMode =
  | 'solid'
  | 'pulse'
  | 'shimmer'
  | 'rainbow'
  | 'neon'
  | 'crystal'
  | 'galaxy'
  | 'zai';

export interface WebColorMeta {
  id: WebColorId;
  labelEn: string;
  swatchHex: string;
}

export const WEB_COLORS_META: Record<WebColorId, WebColorMeta> = {
  white: { id: 'white', labelEn: 'White', swatchHex: '#f8fafc' },
  blue: { id: 'blue', labelEn: 'Blue', swatchHex: '#3b82f6' },
  ice_blue: { id: 'ice_blue', labelEn: 'Ice Blue', swatchHex: '#67e8f9' },
  purple: { id: 'purple', labelEn: 'Purple', swatchHex: '#a855f7' },
  red: { id: 'red', labelEn: 'Red', swatchHex: '#f43f5e' },
  green: { id: 'green', labelEn: 'Green', swatchHex: '#22c55e' },
  gold: { id: 'gold', labelEn: 'Gold', swatchHex: '#fbbf24' },
  rainbow: { id: 'rainbow', labelEn: 'Rainbow', swatchHex: '#ec4899' },
  neon: { id: 'neon', labelEn: 'Neon', swatchHex: '#22d3ee' },
  black: { id: 'black', labelEn: 'Black', swatchHex: '#1e1b4b' },
  crystal: { id: 'crystal', labelEn: 'Crystal', swatchHex: '#a5f3fc' },
  galaxy: { id: 'galaxy', labelEn: 'Galaxy', swatchHex: '#818cf8' },
};

export const ALL_WEB_COLOR_IDS: WebColorId[] = [
  'white',
  'blue',
  'ice_blue',
  'purple',
  'red',
  'green',
  'gold',
  'rainbow',
  'neon',
  'black',
  'crystal',
  'galaxy',
];

export interface WebDesignDef {
  id: string;
  name: string;
  descriptionUz: string;
  colorId: WebColorId;
  rarity: Rarity;
  price: number;
  sellPrice: number;
  minPlayerLevel: number;
  primaryHex: string;
  secondaryHex: string;
  glowRgba: string;
  animMode: WebAnimMode;
  marketPurchasable: boolean;
  tradable: boolean;
  isZaiLimited?: boolean;
  seasonalMonth?: number;
  releaseDateLabel?: string;
  eventId?: string;
}

const BASE_WEB_DESIGNS: WebDesignDef[] = [
  {
    id: 'classic_white',
    name: 'Classic Silk Web',
    descriptionUz: 'Asl oq ipak tolali to‘r dizayni — har bir o‘rgimchak uchun abadiy klassika.',
    colorId: 'white',
    rarity: 'common',
    price: 0,
    sellPrice: 0,
    minPlayerLevel: 1,
    primaryHex: '#f8fafc',
    secondaryHex: '#cbd5e1',
    glowRgba: 'rgba(248, 250, 252, 0.25)',
    animMode: 'solid',
    marketPurchasable: false,
    tradable: false,
  },
  {
    id: 'azure_strand',
    name: 'Azure Silk Strand',
    descriptionUz: 'Tiniq moviy ipak tolalari va yumshoq osmon shu’lasi.',
    colorId: 'blue',
    rarity: 'common',
    price: 10000,
    sellPrice: 3500,
    minPlayerLevel: 1,
    primaryHex: '#3b82f6',
    secondaryHex: '#93c5fd',
    glowRgba: 'rgba(59, 130, 246, 0.30)',
    animMode: 'solid',
    marketPurchasable: true,
    tradable: true,
  },
  {
    id: 'emerald_vine_web',
    name: 'Emerald Vine Web',
    descriptionUz: 'O‘rmon barglariday yashil tabiiy ipak naqshi.',
    colorId: 'green',
    rarity: 'common',
    price: 10500,
    sellPrice: 3700,
    minPlayerLevel: 1,
    primaryHex: '#22c55e',
    secondaryHex: '#86efac',
    glowRgba: 'rgba(34, 197, 94, 0.28)',
    animMode: 'pulse',
    marketPurchasable: true,
    tradable: true,
  },
  {
    id: 'frost_ice_blue',
    name: 'Winter Frost Web',
    descriptionUz: 'Muzlagan qor kristallari bilan bezalgan muz-moviy to‘r.',
    colorId: 'ice_blue',
    rarity: 'uncommon',
    price: 18500,
    sellPrice: 6500,
    minPlayerLevel: 2,
    primaryHex: '#67e8f9',
    secondaryHex: '#e0f2fe',
    glowRgba: 'rgba(103, 232, 249, 0.36)',
    animMode: 'shimmer',
    marketPurchasable: true,
    tradable: true,
  },
  {
    id: 'crimson_fang_web',
    name: 'Crimson Fang Web',
    descriptionUz: 'Alanga rangli jangovar qizil to‘r.',
    colorId: 'red',
    rarity: 'uncommon',
    price: 21000,
    sellPrice: 7400,
    minPlayerLevel: 2,
    primaryHex: '#f43f5e',
    secondaryHex: '#fda4af',
    glowRgba: 'rgba(244, 63, 94, 0.36)',
    animMode: 'pulse',
    marketPurchasable: true,
    tradable: true,
  },
  {
    id: 'obsidian_shadow_web',
    name: 'Obsidian Shadow Web',
    descriptionUz: 'Qop-qora zulmat iplari va sirli binafsha hoshiya.',
    colorId: 'black',
    rarity: 'rare',
    price: 33000,
    sellPrice: 12000,
    minPlayerLevel: 4,
    primaryHex: '#1e1b4b',
    secondaryHex: '#6366f1',
    glowRgba: 'rgba(99, 102, 241, 0.36)',
    animMode: 'pulse',
    marketPurchasable: true,
    tradable: true,
  },
  {
    id: 'amethyst_royal_web',
    name: 'Amethyst Royal Web',
    descriptionUz: 'Binafsha qirollik nurlari bilan tovlanuvchi naqshli to‘r.',
    colorId: 'purple',
    rarity: 'rare',
    price: 38000,
    sellPrice: 13500,
    minPlayerLevel: 4,
    primaryHex: '#a855f7',
    secondaryHex: '#e9d5ff',
    glowRgba: 'rgba(168, 85, 247, 0.40)',
    animMode: 'shimmer',
    marketPurchasable: true,
    tradable: true,
  },
  {
    id: 'cyber_neon_web',
    name: 'Cyber Neon Web',
    descriptionUz: 'Elektro-neon chiziqlar bilan chaqnab turuvchi kiber to‘r.',
    colorId: 'neon',
    rarity: 'epic',
    price: 56000,
    sellPrice: 20000,
    minPlayerLevel: 6,
    primaryHex: '#22d3ee',
    secondaryHex: '#f472b6',
    glowRgba: 'rgba(34, 211, 238, 0.50)',
    animMode: 'neon',
    marketPurchasable: true,
    tradable: true,
  },
  {
    id: 'prism_crystal_web',
    name: 'Prism Crystal Web',
    descriptionUz: 'Olmos qirralaridek porlovchi shaffof kristall tolalar.',
    colorId: 'crystal',
    rarity: 'epic',
    price: 65000,
    sellPrice: 23000,
    minPlayerLevel: 7,
    primaryHex: '#a5f3fc',
    secondaryHex: '#ffffff',
    glowRgba: 'rgba(165, 243, 252, 0.52)',
    animMode: 'crystal',
    marketPurchasable: true,
    tradable: true,
  },
  {
    id: 'imperial_gold_web',
    name: 'Imperial Gold Web',
    descriptionUz: 'Sof oltin iplardan to‘qilgan afsonaviy qirollik to‘ri.',
    colorId: 'gold',
    rarity: 'legendary',
    price: 86000,
    sellPrice: 32000,
    minPlayerLevel: 10,
    primaryHex: '#fbbf24',
    secondaryHex: '#fef08a',
    glowRgba: 'rgba(251, 191, 36, 0.55)',
    animMode: 'shimmer',
    marketPurchasable: true,
    tradable: true,
  },
  {
    id: 'rainbow_aurora_web',
    name: 'Rainbow Aurora Web',
    descriptionUz: 'Yettti xil kamalak rangida uzluksiz tovlanuvchi afsonaviy to‘r.',
    colorId: 'rainbow',
    rarity: 'legendary',
    price: 95000,
    sellPrice: 35000,
    minPlayerLevel: 12,
    primaryHex: '#ec4899',
    secondaryHex: '#38bdf8',
    glowRgba: 'rgba(236, 72, 153, 0.55)',
    animMode: 'rainbow',
    marketPurchasable: true,
    tradable: true,
  },
  {
    id: 'cosmic_galaxy_web',
    name: 'Cosmic Galaxy Web',
    descriptionUz: 'Yulduzlar va tumanliklar bilan nurlanuvchi Mifik galaktika to‘ri!',
    colorId: 'galaxy',
    rarity: 'mythic',
    price: 125000,
    sellPrice: 46000,
    minPlayerLevel: 15,
    primaryHex: '#818cf8',
    secondaryHex: '#f472b6',
    glowRgba: 'rgba(129, 140, 248, 0.62)',
    animMode: 'galaxy',
    marketPurchasable: true,
    tradable: true,
  },
];

const ZAI_MONTHLY_WEB_COLOR_MAP: Record<number, WebColorId> = {
  1: 'ice_blue',
  2: 'red',
  3: 'green',
  4: 'rainbow',
  5: 'green',
  6: 'blue',
  7: 'gold',
  8: 'galaxy',
  9: 'black',
  10: 'purple',
  11: 'gold',
  12: 'crystal',
};

const ZAI_MONTHLY_WEB_DESIGNS: WebDesignDef[] = Object.values(ZAI_MONTHLY_THEMES).map((theme) => ({
  id: theme.webId,
  name: `ZAI ${theme.nameEn} Web`,
  descriptionUz: `ZAI LIMITED (${theme.releaseDateLabel}) — ${theme.nameUz} eksklyuziv ipak dizayni.`,
  colorId: ZAI_MONTHLY_WEB_COLOR_MAP[theme.month] ?? 'crystal',
  rarity: 'limited',
  price: 105000,
  sellPrice: 38000,
  minPlayerLevel: 8,
  primaryHex: theme.primaryHex,
  secondaryHex: theme.secondaryHex,
  glowRgba: theme.glowRgba,
  animMode: 'zai',
  marketPurchasable: true,
  tradable: true,
  isZaiLimited: true,
  seasonalMonth: theme.month,
  releaseDateLabel: theme.releaseDateLabel,
}));

const ZAI_EVENT_COLOR_MAP: Record<string, WebColorId> = {
  zai_summer: 'ice_blue',
  zai_starfall: 'galaxy',
  zai_shadow: 'black',
};

const ZAI_EVENT_WEB_DESIGNS: WebDesignDef[] = ANNUAL_ZAI_EVENTS.map((ev) => ({
  id: ev.exclusiveWebId,
  name: `${ev.title.replace(' CASE', '')} Web`,
  descriptionUz: `ZAI LIMITED yillik bayram (${ev.dateLabel}) kolleksiyasi to‘ri.`,
  colorId: ZAI_EVENT_COLOR_MAP[ev.id] ?? 'gold',
  rarity: 'limited',
  price: 130000,
  sellPrice: 46000,
  minPlayerLevel: 10,
  primaryHex: ev.accentHex,
  secondaryHex: ev.secondaryHex,
  glowRgba: 'rgba(251, 191, 36, 0.60)',
  animMode: 'zai',
  marketPurchasable: true,
  tradable: true,
  isZaiLimited: true,
  releaseDateLabel: ev.dateLabel,
  eventId: ev.id,
}));

export const ALL_WEB_DESIGNS: WebDesignDef[] = [
  ...BASE_WEB_DESIGNS,
  ...ZAI_MONTHLY_WEB_DESIGNS,
  ...ZAI_EVENT_WEB_DESIGNS,
];

export function getWebDesignById(id: string | undefined | null): WebDesignDef {
  if (!id) return ALL_WEB_DESIGNS[0];
  return ALL_WEB_DESIGNS.find((w) => w.id === id) ?? ALL_WEB_DESIGNS[0];
}
