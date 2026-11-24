import {
  BuiltInAvatarDef,
  CaseType,
  EconomyData,
  GameSettings,
  LeaderboardEntry,
  ProfileFrameDef,
  SaveData,
  SpiderColorId,
  UserProfileData,
} from './types';
import {
  LiveCalendarInfo,
  getLiveCalendarInfo,
  getSeasonLevelFromXp,
} from './seasons';
import { ALL_SKINS, RARITY_META, getSkinById, starterColorToSkinId } from './skins';
import {
  ALL_MISSIONS,
  createCreatorVipEconomyData,
  createInitialEconomyData,
  evaluateEconomyAchievements,
  grantSkinCount,
  normalizeEconomyData,
  persistLocalEconomy,
} from './economy';
import {
  DEFAULT_SETTINGS,
  createInitialSaveData,
  normalizeSaveData,
  persistSaveData,
  persistSettings,
} from './storage';

const PROFILES_LIST_KEY = 'spider_spikey_local_profiles_v1';
const ACTIVE_PROFILE_ID_KEY = 'spider_spikey_active_profile_v1';
const SAVE_KEY_PREFIX = 'spider_spikey_save_v2_';
const ECONOMY_KEY_PREFIX = 'spider_spikey_economy_v1_';
const IDB_NAME = 'spider_spikey_local_db';
const IDB_STORE_AVATARS = 'avatars';
const IDB_STORE_BACKUPS = 'backups';

export const BUILTIN_AVATARS: BuiltInAvatarDef[] = [
  {
    id: 'av_classic_spikey',
    name: 'Classic Spikey',
    category: 'classic',
    skinId: 'classic',
    bgGradient: 'linear-gradient(135deg,#0f2942,#1e3a5f)',
    borderHex: '#38bdf8',
  },
  {
    id: 'av_emerald_spikey',
    name: 'Emerald Scout',
    category: 'classic',
    skinId: 'emerald',
    bgGradient: 'linear-gradient(135deg,#064e3b,#15803d)',
    borderHex: '#34d399',
  },
  {
    id: 'av_cobalt_frost',
    name: 'Winter Cobalt',
    category: 'classic',
    skinId: 'cobalt',
    bgGradient: 'linear-gradient(135deg,#0c4a6e,#1d4ed8)',
    borderHex: '#60a5fa',
  },
  {
    id: 'av_amethyst_king',
    name: 'Amethyst Silk',
    category: 'classic',
    skinId: 'amethyst',
    bgGradient: 'linear-gradient(135deg,#3b0764,#6d28d9)',
    borderHex: '#c084fc',
  },
  {
    id: 'av_crimson_spark',
    name: 'Crimson Fang',
    category: 'classic',
    skinId: 'crimson',
    bgGradient: 'linear-gradient(135deg,#4c0519,#be123c)',
    borderHex: '#fb7185',
  },
  {
    id: 'av_neon_cyber',
    name: 'Cyber Web',
    category: 'character',
    skinId: 'blue_neon',
    bgGradient: 'linear-gradient(135deg,#082f49,#0e7490)',
    borderHex: '#22d3ee',
  },
  {
    id: 'av_shadow_ninja',
    name: 'Shadow Ninja',
    category: 'character',
    skinId: 'shadow_walker',
    bgGradient: 'linear-gradient(135deg,#09090b,#312e81)',
    borderHex: '#818cf8',
  },
  {
    id: 'av_flame_blaze',
    name: 'Solar Blaze',
    category: 'character',
    skinId: 'flame_spikey',
    bgGradient: 'linear-gradient(135deg,#451a03,#ea580c)',
    borderHex: '#fb923c',
  },
  {
    id: 'av_winter_frost_king',
    name: 'Frost Monarch',
    category: 'seasonal',
    skinId: 'frost_king_jan',
    bgGradient: 'linear-gradient(135deg,#082f49,#0284c7)',
    borderHex: '#bae6fd',
  },
  {
    id: 'av_santa_holiday',
    name: 'Santa Spikey',
    category: 'seasonal',
    skinId: 'santa_spikey_dec',
    bgGradient: 'linear-gradient(135deg,#450a0a,#b91c1c)',
    borderHex: '#fde047',
  },
  {
    id: 'av_zai_crystal_crown',
    name: 'ZAI Ice Sovereign',
    category: 'zai',
    skinId: 'zai_dec_xmas',
    bgGradient: 'linear-gradient(135deg,#1e1b4b,#0369a1)',
    borderHex: '#38bdf8',
    unlockSeasonLevel: 12,
  },
  {
    id: 'av_aurora_mythic',
    name: 'Aurora Crown',
    category: 'zai',
    skinId: 'mythic_aurora_crown',
    bgGradient: 'linear-gradient(135deg,#170a2e,#be123c)',
    borderHex: '#fbbf24',
    unlockSeasonLevel: 35,
  },
];

export const PROFILE_FRAMES: ProfileFrameDef[] = [
  {
    id: 'frame_winter_steel',
    name: 'Winter Frost Steel',
    borderHex: '#38bdf8',
    glowRgba: 'rgba(56, 189, 248, 0.35)',
  },
  {
    id: 'frame_emerald_silk',
    name: 'Emerald Silk Frame',
    borderHex: '#34d399',
    glowRgba: 'rgba(52, 211, 153, 0.38)',
  },
  {
    id: 'frame_amethyst_prism',
    name: 'Amethyst Prism Frame',
    borderHex: '#c084fc',
    glowRgba: 'rgba(192, 132, 252, 0.42)',
  },
  {
    id: 'frame_gold_monarch',
    name: 'Imperial Gold Frame',
    borderHex: '#fbbf24',
    glowRgba: 'rgba(251, 191, 36, 0.48)',
  },
  {
    id: 'frame_zai_neon',
    name: 'ZAI Neon Frame',
    borderHex: '#f43f5e',
    glowRgba: 'rgba(244, 63, 94, 0.52)',
  },
];

export function getBuiltInAvatarById(id?: string | null): BuiltInAvatarDef {
  return BUILTIN_AVATARS.find((a) => a.id === id) ?? BUILTIN_AVATARS[0];
}

export function getProfileFrameById(id?: string | null): ProfileFrameDef {
  return PROFILE_FRAMES.find((f) => f.id === id) ?? PROFILE_FRAMES[0];
}

const BLOCKED_NICKNAME_WORDS = [
  'admin',
  'moderator',
  'system',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'whore',
  'nigger',
  'faggot',
  'cunt',
  'slut',
  'jalab',
  'qotoq',
  'suka',
  'blyat',
  'hui',
  'pizda',
  'eblan',
  'pidor',
];

export type NicknameErrorCode =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'invalid_chars'
  | 'inappropriate'
  | 'duplicate';

export function validateNickname(
  rawName: string | undefined | null,
  existingProfiles: UserProfileData[] = [],
  currentUid?: string
): { valid: boolean; normalized: string; error?: NicknameErrorCode } {
  const safeRaw = typeof rawName === 'string' ? rawName : '';
  const normalized = safeRaw.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return { valid: false, normalized: '', error: 'empty' };
  }
  if (normalized.length < 3) {
    return { valid: false, normalized, error: 'too_short' };
  }
  if (normalized.length > 18) {
    return { valid: false, normalized, error: 'too_long' };
  }
  if (!/^[\p{L}\p{N}_\- ]+$/u.test(normalized)) {
    return { valid: false, normalized, error: 'invalid_chars' };
  }
  const lowerCompact = normalized.toLowerCase().replace(/[\s_-]+/g, '');
  if (BLOCKED_NICKNAME_WORDS.some((w) => lowerCompact.includes(w))) {
    return { valid: false, normalized, error: 'inappropriate' };
  }
  const duplicate = existingProfiles.some(
    (p) =>
      Boolean(p) &&
      typeof p.nickname === 'string' &&
      p.uid !== currentUid &&
      p.nickname.trim().toLowerCase() === normalized.toLowerCase()
  );
  if (duplicate) {
    return { valid: false, normalized, error: 'duplicate' };
  }
  return { valid: true, normalized };
}

function getDefaultStarterColor(): SpiderColorId {
  return 'classic';
}

export function loadAllLocalProfiles(): UserProfileData[] {
  try {
    const raw = localStorage.getItem(PROFILES_LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is UserProfileData =>
        Boolean(item && typeof item.uid === 'string' && typeof item.nickname === 'string')
    );
  } catch {
    return [];
  }
}

export function saveAllLocalProfiles(profiles: UserProfileData[]): void {
  try {
    localStorage.setItem(PROFILES_LIST_KEY, JSON.stringify(profiles));
  } catch {
    // ignore storage quota errors
  }
}

export function getActiveProfileId(): string | null {
  try {
    const id = localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
    return id && id.length > 0 ? id : null;
  } catch {
    return null;
  }
}

export function setActiveProfileId(uid: string | null): void {
  try {
    if (uid) {
      localStorage.setItem(ACTIVE_PROFILE_ID_KEY, uid);
    } else {
      localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
    }
  } catch {
    // ignore
  }
}

export function getActiveLocalProfile(): UserProfileData | null {
  const all = loadAllLocalProfiles();
  if (all.length === 0) return null;
  const activeId = getActiveProfileId();
  if (activeId) {
    const found = all.find((p) => p.uid === activeId);
    if (found) return found;
  }
  return all[0];
}

function collectLegacyBrowserProgress(cal: LiveCalendarInfo): {
  foundLegacy: boolean;
  mergedSave: SaveData;
  mergedEconomy: Partial<EconomyData>;
} {
  let mergedSave = createInitialSaveData();
  let foundLegacy = false;
  const bestEcon: Partial<EconomyData> = {
    ownedSkins: { classic: 1 },
    ownedWebDesigns: { classic_white: 1 },
    ownedCases: {
      common: 0,
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
    specialItems: { xp_boost: 0, lucky_clover: 0, season_token: 0 },
    unlockedEconomyAchievements: [],
    claimedSeasonLevels: [],
    claimedBonusSeasonLevels: [],
    claimedDailyDays: [],
    claimedMissions: [],
    holidayClaimedIds: [],
    unlockedAvatars: [],
    unlockedProfileFrames: ['frame_winter_steel'],
  };

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith(SAVE_KEY_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = normalizeSaveData(JSON.parse(raw) as Partial<SaveData>);
        foundLegacy = true;
        mergedSave.hasStarted = mergedSave.hasStarted || parsed.hasStarted;
        if (parsed.unlockedStageIds.length > mergedSave.unlockedStageIds.length) {
          mergedSave.currentStageId = parsed.currentStageId;
        }
        const unlockedSet = new Set([
          ...mergedSave.unlockedStageIds,
          ...parsed.unlockedStageIds,
        ]);
        mergedSave.unlockedStageIds = Array.from(unlockedSet);
        for (const [ab, val] of Object.entries(parsed.unlockedAbilities)) {
          if (val) mergedSave.unlockedAbilities[ab as keyof SaveData['unlockedAbilities']] = true;
        }
        mergedSave.totalCoins = Math.max(mergedSave.totalCoins, parsed.totalCoins);
        mergedSave.totalScore = Math.max(mergedSave.totalScore, parsed.totalScore);
        mergedSave.lives = Math.max(mergedSave.lives, parsed.lives);
        mergedSave.enemiesDefeatedTotal = Math.max(
          mergedSave.enemiesDefeatedTotal,
          parsed.enemiesDefeatedTotal
        );
        mergedSave.secretsFoundTotal = Math.max(
          mergedSave.secretsFoundTotal,
          parsed.secretsFoundTotal
        );
        mergedSave.bossesDefeated = Array.from(
          new Set([...mergedSave.bossesDefeated, ...parsed.bossesDefeated])
        );
        mergedSave.unlockedAchievements = Array.from(
          new Set([...mergedSave.unlockedAchievements, ...parsed.unlockedAchievements])
        );
        for (const [sid, prog] of Object.entries(parsed.stageProgress)) {
          const prev = mergedSave.stageProgress[sid];
          if (!prev) {
            mergedSave.stageProgress[sid] = prog;
          } else {
            mergedSave.stageProgress[sid] = {
              completed: prev.completed || prog.completed,
              crystals: [
                Boolean(prev.crystals[0] || prog.crystals[0]),
                Boolean(prev.crystals[1] || prog.crystals[1]),
                Boolean(prev.crystals[2] || prog.crystals[2]),
              ],
              bestScore: Math.max(prev.bestScore, prog.bestScore),
              bestTimeSec:
                prev.bestTimeSec > 0 && prog.bestTimeSec > 0
                  ? Math.min(prev.bestTimeSec, prog.bestTimeSec)
                  : Math.max(prev.bestTimeSec, prog.bestTimeSec),
            };
          }
        }
      }

      if (key.startsWith(ECONOMY_KEY_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = normalizeEconomyData(JSON.parse(raw) as Partial<EconomyData>, 'legacy', cal);
        foundLegacy = true;
        bestEcon.spikeyCoins = Math.max(bestEcon.spikeyCoins ?? 0, parsed.spikeyCoins);
        bestEcon.seasonXp = Math.max(bestEcon.seasonXp ?? 0, parsed.seasonXp);
        bestEcon.playerXp = Math.max(bestEcon.playerXp ?? 0, parsed.playerXp ?? 0);
        bestEcon.dailyStreak = Math.max(bestEcon.dailyStreak ?? 0, parsed.dailyStreak);
        bestEcon.casesOpenedTotal = Math.max(
          bestEcon.casesOpenedTotal ?? 0,
          parsed.casesOpenedTotal
        );
        bestEcon.mythicsFoundTotal = Math.max(
          bestEcon.mythicsFoundTotal ?? 0,
          parsed.mythicsFoundTotal
        );
        bestEcon.skinsSoldTotal = Math.max(bestEcon.skinsSoldTotal ?? 0, parsed.skinsSoldTotal);
        bestEcon.tradesCompletedTotal = Math.max(
          bestEcon.tradesCompletedTotal ?? 0,
          parsed.tradesCompletedTotal
        );
        if (parsed.lastDailyClaimDate && (!bestEcon.lastDailyClaimDate || parsed.lastDailyClaimDate > bestEcon.lastDailyClaimDate)) {
          bestEcon.lastDailyClaimDate = parsed.lastDailyClaimDate;
        }
        if (parsed.equippedSkin && parsed.equippedSkin !== 'classic') {
          bestEcon.equippedSkin = parsed.equippedSkin;
        }
        if (parsed.equippedWebDesign && parsed.equippedWebDesign !== 'classic_white') {
          bestEcon.equippedWebDesign = parsed.equippedWebDesign;
        }
        for (const [k, qty] of Object.entries(parsed.ownedSkins)) {
          bestEcon.ownedSkins![k] = Math.max(bestEcon.ownedSkins![k] ?? 0, qty);
        }
        for (const [k, qty] of Object.entries(parsed.ownedWebDesigns ?? {})) {
          bestEcon.ownedWebDesigns![k] = Math.max(bestEcon.ownedWebDesigns![k] ?? 0, qty);
        }
        for (const [k, qty] of Object.entries(parsed.ownedCases)) {
          const ct = k as CaseType;
          bestEcon.ownedCases![ct] = Math.max(bestEcon.ownedCases![ct] ?? 0, qty);
        }
        for (const [k, qty] of Object.entries(parsed.specialItems)) {
          bestEcon.specialItems![k] = Math.max(bestEcon.specialItems![k] ?? 0, qty);
        }
        bestEcon.unlockedEconomyAchievements = Array.from(
          new Set([
            ...(bestEcon.unlockedEconomyAchievements ?? []),
            ...parsed.unlockedEconomyAchievements,
          ])
        );
        bestEcon.claimedSeasonLevels = Array.from(
          new Set([...(bestEcon.claimedSeasonLevels ?? []), ...parsed.claimedSeasonLevels])
        );
        bestEcon.claimedBonusSeasonLevels = Array.from(
          new Set([
            ...(bestEcon.claimedBonusSeasonLevels ?? []),
            ...(parsed.claimedBonusSeasonLevels ?? []),
          ])
        );
        bestEcon.claimedDailyDays = Array.from(
          new Set([...(bestEcon.claimedDailyDays ?? []), ...parsed.claimedDailyDays])
        );
        bestEcon.holidayClaimedIds = Array.from(
          new Set([...(bestEcon.holidayClaimedIds ?? []), ...parsed.holidayClaimedIds])
        );
      }
    }
  } catch {
    // ignore corrupted legacy keys
  }

  return { foundLegacy, mergedSave, mergedEconomy: bestEcon };
}

export function createLocalProfileWithMigration(
  input: {
    nickname: string;
    avatarId: string;
    customAvatarDataUrl?: string | null;
    language?: string | null;
  },
  cal: LiveCalendarInfo = getLiveCalendarInfo()
): {
  profile: UserProfileData;
  saveData: SaveData;
  economy: EconomyData;
  migratedLegacy: boolean;
} {
  const existing = loadAllLocalProfiles();
  const uid = `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const spiderColor = getDefaultStarterColor();
  const starterAvatarId = 'av_classic_spikey';
  const nowIso = new Date().toISOString();

  const shouldMigrateLegacy = existing.length === 0;
  const legacy = shouldMigrateLegacy
    ? collectLegacyBrowserProgress(cal)
    : { foundLegacy: false, mergedSave: createInitialSaveData(), mergedEconomy: {} };

  const starterSkin = starterColorToSkinId(spiderColor);
  const baseEconomy = createInitialEconomyData(uid, 0, spiderColor, cal);

  let economy: EconomyData;
  if (legacy.foundLegacy) {
    economy = normalizeEconomyData(
      {
        ...baseEconomy,
        ...legacy.mergedEconomy,
        ownerId: uid,
        ownedSkins: {
          ...baseEconomy.ownedSkins,
          ...(legacy.mergedEconomy.ownedSkins ?? {}),
          [starterSkin]: Math.max(1, legacy.mergedEconomy.ownedSkins?.[starterSkin] ?? 1),
        },
        ownedCases: {
          ...baseEconomy.ownedCases,
          ...(legacy.mergedEconomy.ownedCases ?? {}),
          // Auto-migrate + grant 2 Free Common Cases for first local profile welcome!
          common: Math.max(0, legacy.mergedEconomy.ownedCases?.common ?? 0) + 2,
        },
      },
      uid,
      cal
    );
  } else {
    // Fresh profile receives ONLY Classic Spikey skin + Classic White web + 2 Free Common Cases
    economy = normalizeEconomyData(
      {
        ...baseEconomy,
        ownedCases: {
          ...baseEconomy.ownedCases,
          common: 2,
        },
      },
      uid,
      cal
    );
  }

  economy.selectedLanguage = input.language || economy.selectedLanguage || 'en';
  economy.transactions = [
    {
      id: `starter_2_cases_${uid}`,
      kind: 'case' as const,
      amount: 0,
      labelUz: 'Yangi profil sovg‘asi: +2 Oddiy Keys',
      timestamp: nowIso,
    },
    ...economy.transactions,
  ].slice(0, 40);

  const profile: UserProfileData = {
    uid,
    nickname: input.nickname.trim(),
    avatarId: starterAvatarId,
    customAvatarDataUrl: null,
    profileFrame: 'frame_winter_steel',
    spiderColor,
    starterCasesGranted: true,
    createdAt: nowIso,
    updatedAt: nowIso,
    profileCompleted: true,
  };

  const nextProfiles = [...existing, profile];
  saveAllLocalProfiles(nextProfiles);
  setActiveProfileId(uid);

  const saveData = legacy.foundLegacy ? legacy.mergedSave : createInitialSaveData();
  persistSaveData(saveData, uid);
  persistLocalEconomy(economy, uid);

  if (profile.customAvatarDataUrl) {
    void saveCustomAvatarToIdb(uid, profile.customAvatarDataUrl);
  }
  void mirrorBackupToIdb({
    profile,
    saveData,
    economy,
    updatedAt: nowIso,
  });

  return {
    profile,
    saveData,
    economy,
    migratedLegacy: legacy.foundLegacy,
  };
}

export function updateLocalProfile(
  uid: string,
  patch: Partial<
    Pick<
      UserProfileData,
      'nickname' | 'avatarId' | 'customAvatarDataUrl' | 'profileFrame' | 'spiderColor' | 'accountId'
    >
  >
): UserProfileData | null {
  const profiles = loadAllLocalProfiles();
  const idx = profiles.findIndex((p) => p.uid === uid);
  if (idx < 0) return null;
  const isAdmin = Boolean(profiles[idx].isCreator || uid === 'creator_admin');
  const cleanPatch: Partial<UserProfileData> = {};
  if (!isAdmin && patch.nickname !== undefined) cleanPatch.nickname = patch.nickname;
  if (isAdmin) cleanPatch.nickname = 'Admin';
  if (patch.avatarId !== undefined) cleanPatch.avatarId = patch.avatarId;
  if (patch.customAvatarDataUrl !== undefined) {
    cleanPatch.customAvatarDataUrl = patch.customAvatarDataUrl;
  }
  if (patch.profileFrame !== undefined) cleanPatch.profileFrame = patch.profileFrame;
  if (patch.spiderColor !== undefined) cleanPatch.spiderColor = patch.spiderColor;
  if (patch.accountId !== undefined) cleanPatch.accountId = patch.accountId;

  const updated: UserProfileData = {
    ...profiles[idx],
    ...cleanPatch,
    updatedAt: new Date().toISOString(),
  };
  profiles[idx] = updated;
  saveAllLocalProfiles(profiles);
  if (patch.customAvatarDataUrl !== undefined) {
    void saveCustomAvatarToIdb(uid, patch.customAvatarDataUrl ?? null);
  }
  return updated;
}

export function createCreatorVipSaveData(): SaveData {
  const base = createInitialSaveData();
  return {
    ...base,
    hasStarted: true,
    unlockedStageIds: [
      '1-1', '1-2', '1-Boss',
      '2-1', '2-2', '2-Boss',
      '3-1', '3-2', '3-Boss',
      '4-1', '4-2', '4-Boss',
      '5-1', '5-2', '5-Boss',
    ],
    unlockedAbilities: {
      webShot: true,
      doubleJump: true,
      webTrap: true,
      wallClimb: true,
      webSwing: true,
      spiderDash: true,
      magicWeb: true,
    },
    lives: 99,
  };
}

export function upsertCreatorLocalProfile(
  accountId: string,
  cal: LiveCalendarInfo = getLiveCalendarInfo()
): { profile: UserProfileData; saveData: SaveData; economy: EconomyData } {
  const nowIso = new Date().toISOString();
  const uid = 'creator_admin';
  const existing = loadAllLocalProfiles().filter((p) => p.uid !== uid);
  const profile: UserProfileData = {
    uid,
    accountId: accountId || 'SPK-ADMIN1',
    isCreator: true,
    nickname: 'Admin',
    avatarId: 'av_aurora_mythic',
    customAvatarDataUrl: null,
    profileFrame: 'frame_zai_neon',
    spiderColor: 'classic',
    starterCasesGranted: true,
    createdAt: nowIso,
    updatedAt: nowIso,
    profileCompleted: true,
  };
  saveAllLocalProfiles([profile, ...existing]);
  setActiveProfileId(uid);

  const saveData = createCreatorVipSaveData();
  const economy = createCreatorVipEconomyData(cal);
  persistSaveData(saveData, uid);
  persistLocalEconomy(economy, uid);
  return { profile, saveData, economy };
}

// ===================================================
// IndexedDB Mirror & Custom Avatar Storage
// ===================================================
function openLocalDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE_AVATARS)) {
          db.createObjectStore(IDB_STORE_AVATARS, { keyPath: 'uid' });
        }
        if (!db.objectStoreNames.contains(IDB_STORE_BACKUPS)) {
          db.createObjectStore(IDB_STORE_BACKUPS, { keyPath: 'uid' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveCustomAvatarToIdb(uid: string, dataUrl: string | null): Promise<void> {
  const db = await openLocalDb();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE_AVATARS, 'readwrite');
    const store = tx.objectStore(IDB_STORE_AVATARS);
    if (dataUrl) {
      store.put({ uid, dataUrl, updatedAt: new Date().toISOString() });
    } else {
      store.delete(uid);
    }
  } catch {
    // ignore idb errors
  }
}

export async function loadCustomAvatarFromIdb(uid: string): Promise<string | null> {
  const db = await openLocalDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE_AVATARS, 'readonly');
      const req = tx.objectStore(IDB_STORE_AVATARS).get(uid);
      req.onsuccess = () => resolve((req.result as { dataUrl?: string } | undefined)?.dataUrl ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function mirrorBackupToIdb(payload: {
  profile: UserProfileData;
  saveData: SaveData;
  economy: EconomyData;
  updatedAt: string;
}): Promise<void> {
  const db = await openLocalDb();
  if (!db) return;
  try {
    const tx = db.transaction(IDB_STORE_BACKUPS, 'readwrite');
    tx.objectStore(IDB_STORE_BACKUPS).put({
      uid: payload.profile.uid,
      ...payload,
    });
  } catch {
    // ignore
  }
}

export function resizeAvatarImageFile(file: File, maxSize = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Invalid image file type'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unavailable'));
          return;
        }
        const side = Math.min(img.width, img.height);
        const sx = Math.floor((img.width - side) / 2);
        const sy = Math.floor((img.height - side) / 2);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize);
        resolve(canvas.toDataURL('image/png', 0.9));
      };
      img.onerror = () => reject(new Error('Image decode error'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
}

// ===================================================
// JSON Backup Export & Import with Validation
// ===================================================
export interface SpiderSpikeyBackupFile {
  format: 'spider-spikey-backup';
  version: 2;
  exportedAt: string;
  checksum: string;
  profile: UserProfileData;
  saveData: SaveData;
  economy: EconomyData;
  settings: GameSettings;
}

function computeSimpleChecksum(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function exportSaveBackupJson(input: {
  profile: UserProfileData;
  saveData: SaveData;
  economy: EconomyData;
  settings: GameSettings;
}): string {
  const core = {
    format: 'spider-spikey-backup' as const,
    version: 2 as const,
    exportedAt: new Date().toISOString(),
    profile: input.profile,
    saveData: input.saveData,
    economy: input.economy,
    settings: input.settings,
  };
  const checksum = computeSimpleChecksum(JSON.stringify(core));
  const payload: SpiderSpikeyBackupFile = {
    ...core,
    checksum,
  };
  return JSON.stringify(payload, null, 2);
}

export function importSaveBackupJson(
  rawText: string,
  cal: LiveCalendarInfo = getLiveCalendarInfo()
):
  | {
      ok: true;
      profile: UserProfileData;
      saveData: SaveData;
      economy: EconomyData;
      settings: GameSettings;
    }
  | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(rawText) as Partial<SpiderSpikeyBackupFile>;
    if (
      !parsed ||
      parsed.format !== 'spider-spikey-backup' ||
      parsed.version !== 2 ||
      !parsed.profile ||
      !parsed.saveData ||
      !parsed.economy
    ) {
      return { ok: false, error: 'Invalid backup file format.' };
    }
    const checkTarget = {
      format: parsed.format,
      version: parsed.version,
      exportedAt: parsed.exportedAt,
      profile: parsed.profile,
      saveData: parsed.saveData,
      economy: parsed.economy,
      settings: parsed.settings,
    };
    const expected = computeSimpleChecksum(JSON.stringify(checkTarget));
    if (parsed.checksum && parsed.checksum !== expected) {
      return { ok: false, error: 'Backup checksum verification failed.' };
    }
    const nickCheck = validateNickname(parsed.profile.nickname || 'Spikey');
    const cleanUid = parsed.profile.uid || `local_${Date.now().toString(36)}`;
    const profile: UserProfileData = {
      uid: cleanUid,
      nickname: nickCheck.valid ? nickCheck.normalized : 'SpikeyHero',
      avatarId: parsed.profile.avatarId || 'av_classic_spikey',
      customAvatarDataUrl: parsed.profile.customAvatarDataUrl ?? null,
      profileFrame: parsed.profile.profileFrame || 'frame_winter_steel',
      spiderColor: parsed.profile.spiderColor || 'classic',
      starterCasesGranted: true,
      createdAt: parsed.profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profileCompleted: true,
    };
    const saveData = normalizeSaveData(parsed.saveData);
    const economy = normalizeEconomyData(parsed.economy, cleanUid, cal);
    const settings: GameSettings = {
      ...DEFAULT_SETTINGS,
      ...(parsed.settings ?? {}),
      keyBindings: {
        ...DEFAULT_SETTINGS.keyBindings,
        ...(parsed.settings?.keyBindings ?? {}),
      },
    };

    const existing = loadAllLocalProfiles();
    const idx = existing.findIndex((p) => p.uid === cleanUid);
    if (idx >= 0) {
      existing[idx] = profile;
    } else {
      existing.push(profile);
    }
    saveAllLocalProfiles(existing);
    setActiveProfileId(cleanUid);
    persistSaveData(saveData, cleanUid);
    persistLocalEconomy(economy, cleanUid);
    persistSettings(settings);
    if (profile.customAvatarDataUrl) {
      void saveCustomAvatarToIdb(cleanUid, profile.customAvatarDataUrl);
    }
    void mirrorBackupToIdb({
      profile,
      saveData,
      economy,
      updatedAt: new Date().toISOString(),
    });

    return { ok: true, profile, saveData, economy, settings };
  } catch {
    return { ok: false, error: 'Corrupted JSON backup file.' };
  }
}

// ===================================================
// Offline Local Rivals Leaderboard
// ===================================================
interface RivalSeed {
  uid: string;
  nickname: string;
  avatarId: string;
  profileFrame: string;
  equippedSkin: string;
  seasonLevelOffset: number;
  baseCoins: number;
  skinsCount: number;
  bossesDefeatedCount: number;
  achievementsCount: number;
  playerLevel: number;
}

const AI_RIVALS: RivalSeed[] = [
  {
    uid: 'rival_frostfang',
    nickname: 'FrostFang_AI',
    avatarId: 'av_winter_frost_king',
    profileFrame: 'frame_zai_neon',
    equippedSkin: 'zai_dec_xmas',
    seasonLevelOffset: 18,
    baseCoins: 14500,
    skinsCount: 24,
    bossesDefeatedCount: 5,
    achievementsCount: 19,
    playerLevel: 28,
  },
  {
    uid: 'rival_silkblade',
    nickname: 'SilkBlade_Pro',
    avatarId: 'av_shadow_ninja',
    profileFrame: 'frame_gold_monarch',
    equippedSkin: 'mythic_aurora_crown',
    seasonLevelOffset: 12,
    baseCoins: 9800,
    skinsCount: 18,
    bossesDefeatedCount: 4,
    achievementsCount: 15,
    playerLevel: 21,
  },
  {
    uid: 'rival_emerald_weaver',
    nickname: 'EmeraldWeaver',
    avatarId: 'av_emerald_spikey',
    profileFrame: 'frame_emerald_silk',
    equippedSkin: 'emerald',
    seasonLevelOffset: 6,
    baseCoins: 5200,
    skinsCount: 12,
    bossesDefeatedCount: 3,
    achievementsCount: 11,
    playerLevel: 14,
  },
  {
    uid: 'rival_neon_spinner',
    nickname: 'NeonSpinner',
    avatarId: 'av_neon_cyber',
    profileFrame: 'frame_amethyst_prism',
    equippedSkin: 'blue_neon',
    seasonLevelOffset: 2,
    baseCoins: 2400,
    skinsCount: 7,
    bossesDefeatedCount: 2,
    achievementsCount: 7,
    playerLevel: 8,
  },
  {
    uid: 'rival_snow_cub',
    nickname: 'SnowSilk_Junior',
    avatarId: 'av_cobalt_frost',
    profileFrame: 'frame_winter_steel',
    equippedSkin: 'cobalt',
    seasonLevelOffset: 0,
    baseCoins: 750,
    skinsCount: 3,
    bossesDefeatedCount: 1,
    achievementsCount: 3,
    playerLevel: 3,
  },
];

export function buildLocalLeaderboard(
  activeProfile: UserProfileData | null,
  activeSave: SaveData,
  activeEconomy: EconomyData,
  cal: LiveCalendarInfo = getLiveCalendarInfo()
): LeaderboardEntry[] {
  const localProfiles = loadAllLocalProfiles();
  const entries: LeaderboardEntry[] = [];

  for (const p of localProfiles) {
    const isCurrent = activeProfile?.uid === p.uid;
    let econ: EconomyData;
    let save: SaveData;
    if (isCurrent) {
      econ = activeEconomy;
      save = activeSave;
    } else {
      try {
        const rawE = localStorage.getItem(`${ECONOMY_KEY_PREFIX}${p.uid}`);
        econ = rawE
          ? normalizeEconomyData(JSON.parse(rawE) as Partial<EconomyData>, p.uid, cal)
          : createInitialEconomyData(p.uid, 0, p.spiderColor, cal);
        const rawS = localStorage.getItem(`${SAVE_KEY_PREFIX}${p.uid}`);
        save = rawS ? normalizeSaveData(JSON.parse(rawS) as Partial<SaveData>) : createInitialSaveData();
      } catch {
        econ = createInitialEconomyData(p.uid, 0, p.spiderColor, cal);
        save = createInitialSaveData();
      }
    }

    entries.push({
      uid: p.uid,
      isPublic: true,
      isAiRival: false,
      nickname: p.nickname,
      avatarId: p.avatarId,
      profileFrame: econ.equippedProfileFrame || p.profileFrame || 'frame_winter_steel',
      equippedSkin: econ.equippedSkin,
      seasonLevel: getSeasonLevelFromXp(econ.seasonXp),
      seasonMonthKey: econ.seasonMonthKey,
      totalCoins: econ.spikeyCoins,
      skinsCount: Object.values(econ.ownedSkins).filter((q) => q > 0).length,
      bossesDefeatedCount: save.bossesDefeated.length,
      achievementsCount: save.unlockedAchievements.length + econ.unlockedEconomyAchievements.length,
      playerLevel: econ.playerLevel ?? 1,
    });
  }

  for (const r of AI_RIVALS) {
    entries.push({
      uid: r.uid,
      isPublic: true,
      isAiRival: true,
      nickname: r.nickname,
      avatarId: r.avatarId,
      profileFrame: r.profileFrame,
      equippedSkin: r.equippedSkin,
      seasonLevel: Math.min(50, Math.max(1, cal.day + r.seasonLevelOffset)),
      seasonMonthKey: cal.monthKey,
      totalCoins: r.baseCoins,
      skinsCount: r.skinsCount,
      bossesDefeatedCount: r.bossesDefeatedCount,
      achievementsCount: r.achievementsCount,
      playerLevel: r.playerLevel,
    });
  }

  return entries;
}

// ===================================================
// Offline NPC Skin Exchange
// ===================================================
export interface NpcTradeOffer {
  id: string;
  npcName: string;
  npcAvatarId: string;
  requestedSkinId: string;
  rewardSkinId: string;
  bonusCoins: number;
  coinFee: number;
}

export function generateNpcTradeOffers(
  economy: EconomyData,
  cal: LiveCalendarInfo = getLiveCalendarInfo()
): NpcTradeOffer[] {
  const tradablePool = ALL_SKINS.filter(
    (s) => s.tradable && !s.isZaiLimited && s.rarity !== 'mythic'
  );
  const ownedTradeable = Object.entries(economy.ownedSkins)
    .filter(([sid, qty]) => {
      const skin = getSkinById(sid);
      const keepOneEquipped = economy.equippedSkin === sid ? qty > 1 : qty > 0;
      return skin.tradable && keepOneEquipped;
    })
    .map(([sid]) => getSkinById(sid));

  const offers: NpcTradeOffer[] = [];
  const npcCatalog = [
    { name: 'Archmage Weaver', avatar: 'av_amethyst_king' },
    { name: 'Frost Merchant', avatar: 'av_winter_frost_king' },
    { name: 'Emerald Collector', avatar: 'av_emerald_spikey' },
    { name: 'Neon Broker', avatar: 'av_neon_cyber' },
  ];

  // Prioritize offers matching skins the player actually holds duplicates/tradables of!
  for (let i = 0; i < 4; i++) {
    const npc = npcCatalog[i];
    const reqSkin =
      ownedTradeable[i % Math.max(1, ownedTradeable.length)] ??
      tradablePool[(cal.day + i * 3) % tradablePool.length];
    const desiredRarityCandidates = tradablePool.filter(
      (s) => s.id !== reqSkin.id && !(economy.ownedSkins[s.id] > 0)
    );
    const rewardPool = desiredRarityCandidates.length > 0 ? desiredRarityCandidates : tradablePool;
    const rewardSkin = rewardPool[(cal.day + i * 5 + cal.month) % rewardPool.length];

    const reqVal = RARITY_META[reqSkin.rarity].sellPrice;
    const rewVal = RARITY_META[rewardSkin.rarity].sellPrice;
    const diff = rewVal - reqVal;

    offers.push({
      id: `npc_offer_${cal.dateKey}_${i}`,
      npcName: npc.name,
      npcAvatarId: npc.avatar,
      requestedSkinId: reqSkin.id,
      rewardSkinId: rewardSkin.id,
      bonusCoins: diff < 0 ? Math.min(400, Math.abs(diff)) : 50,
      coinFee: diff > 250 ? Math.min(900, Math.round(diff * 0.6)) : 0,
    });
  }

  return offers;
}

export function executeNpcSkinSwap(
  prev: EconomyData,
  offer: NpcTradeOffer,
  cal: LiveCalendarInfo = getLiveCalendarInfo()
): { ok: boolean; errorUz?: string; next: EconomyData; newlyAchievements: string[] } {
  const next = normalizeEconomyData(structuredClone(prev), prev.ownerId, cal);
  const ownedQty = next.ownedSkins[offer.requestedSkinId] ?? 0;
  const reqSkin = getSkinById(offer.requestedSkinId);
  if (!reqSkin.tradable || ownedQty <= 0) {
    return {
      ok: false,
      errorUz: `Sizda "${reqSkin.name}" skini yo‘q.`,
      next: prev,
      newlyAchievements: [],
    };
  }
  if (next.equippedSkin === offer.requestedSkinId && ownedQty <= 1) {
    return {
      ok: false,
      errorUz: 'Kiyilgan yagona skinni almashtirib bo‘lmaydi.',
      next: prev,
      newlyAchievements: [],
    };
  }
  if (!next.isCreator && offer.coinFee > 0 && next.spikeyCoins < offer.coinFee) {
    return {
      ok: false,
      errorUz: 'Almashish uchun Spikey Coins yetarli emas.',
      next: prev,
      newlyAchievements: [],
    };
  }

  next.ownedSkins[offer.requestedSkinId] = ownedQty - 1;
  if (next.ownedSkins[offer.requestedSkinId] <= 0) {
    delete next.ownedSkins[offer.requestedSkinId];
  }
  grantSkinCount(next, offer.rewardSkinId, 1);
  if (!next.isCreator && offer.coinFee > 0) next.spikeyCoins -= offer.coinFee;
  if (!next.isCreator && offer.bonusCoins > 0) next.spikeyCoins += offer.bonusCoins;
  next.tradesCompletedTotal += 1;
  next.seasonXp += 75;
  next.missionProgress['weekly:trades_completed'] =
    (next.missionProgress['weekly:trades_completed'] ?? 0) + 1;
  next.missionProgress['seasonal:trades_completed'] =
    (next.missionProgress['seasonal:trades_completed'] ?? 0) + 1;

  const txId = `npc_swap_${offer.id}_${Date.now()}`;
  const rewSkin = getSkinById(offer.rewardSkinId);
  next.transactions = [
    {
      id: txId,
      kind: 'trade' as const,
      amount: offer.bonusCoins - offer.coinFee,
      labelUz: `NPC Almashuv: ${reqSkin.name} → ${rewSkin.name}`,
      timestamp: new Date().toISOString(),
    },
    ...next.transactions,
  ].slice(0, 40);

  const newlyAchievements = evaluateEconomyAchievements(next);
  return { ok: true, next, newlyAchievements };
}

export function clearProfileProgressKeepIdentity(
  profile: UserProfileData,
  cal: LiveCalendarInfo = getLiveCalendarInfo()
): { saveData: SaveData; economy: EconomyData } {
  const saveData = createInitialSaveData();
  const baseEcon = createInitialEconomyData(profile.uid, 0, profile.spiderColor, cal);
  baseEcon.ownedCases.common = 2;
  const economy = normalizeEconomyData(baseEcon, profile.uid, cal);
  persistSaveData(saveData, profile.uid);
  persistLocalEconomy(economy, profile.uid);
  return { saveData, economy };
}

// Keep unused import reference check satisfied cleanly if needed by callers
export function isMissionPeriodValid(period: string): boolean {
  return ALL_MISSIONS.some((m) => m.period === period);
}
