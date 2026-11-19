import {
  AbilityId,
  BossType,
  GameSettings,
  KeyBindings,
  SaveData,
} from './types';

const SAVE_KEY_PREFIX = 'spider_spikey_save_v2_';
const SETTINGS_KEY = 'spider_spikey_settings_v1';

function getSaveKey(uid?: string): string {
  return uid ? `${SAVE_KEY_PREFIX}${uid}` : `${SAVE_KEY_PREFIX}local`;
}

export const DEFAULT_KEYBINDINGS: KeyBindings = {
  left: 'KeyA',
  right: 'KeyD',
  up: 'KeyW',
  down: 'KeyS',
  jump: 'Space',
  sprint: 'ShiftLeft',
  webAttack: 'KeyJ',
  special: 'KeyK',
  interact: 'KeyE',
  webSwing: 'KeyQ',
  webNet: 'KeyE',
};

export const DEFAULT_SETTINGS: GameSettings = {
  language: null,
  musicVolume: 0.45,
  sfxVolume: 0.65,
  graphicsQuality: 'high',
  menuThemeMode: 'winter',
  resolutionScale: 'auto',
  touchMode: 'auto',
  tutorialWatched: false,
  keyBindings: { ...DEFAULT_KEYBINDINGS },
};

export function createInitialSaveData(): SaveData {
  return {
    hasStarted: false,
    currentStageId: '1-1',
    unlockedStageIds: ['1-1'],
    unlockedAbilities: {
      webShot: true,
      doubleJump: false,
      webTrap: false,
      wallClimb: false,
      webSwing: true,
      spiderDash: true,
      magicWeb: false,
    },
    activeSpecial: 'webTrap',
    totalCoins: 0,
    totalScore: 0,
    lives: 5,
    stageProgress: {},
    unlockedAchievements: [],
    bossesDefeated: [],
    enemiesDefeatedTotal: 0,
    secretsFoundTotal: 0,
  };
}

export function normalizeSaveData(parsed?: Partial<SaveData> | null): SaveData {
  const base = createInitialSaveData();
  if (!parsed) return base;
  return {
    ...base,
    ...parsed,
    unlockedAbilities: {
      ...base.unlockedAbilities,
      ...(parsed.unlockedAbilities ?? {}),
      webShot: true,
      webSwing: true,
      spiderDash: true,
    },
    stageProgress: parsed.stageProgress ?? {},
    unlockedStageIds:
      Array.isArray(parsed.unlockedStageIds) && parsed.unlockedStageIds.length > 0
        ? parsed.unlockedStageIds
        : ['1-1'],
    unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
      ? parsed.unlockedAchievements
      : [],
    bossesDefeated: Array.isArray(parsed.bossesDefeated)
      ? parsed.bossesDefeated
      : [],
  };
}

export function loadSaveData(uid?: string): SaveData {
  try {
    const raw = localStorage.getItem(getSaveKey(uid));
    if (!raw) return createInitialSaveData();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return normalizeSaveData(parsed);
  } catch {
    return createInitialSaveData();
  }
}

export function persistSaveData(data: SaveData, uid?: string): void {
  try {
    localStorage.setItem(getSaveKey(uid), JSON.stringify(data));
  } catch {
    // ignore storage quota errors
  }
}

export function clearSaveData(uid?: string): SaveData {
  const fresh = createInitialSaveData();
  persistSaveData(fresh, uid);
  return fresh;
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS, keyBindings: { ...DEFAULT_KEYBINDINGS } };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    const savedKb = parsed.keyBindings as Partial<KeyBindings> | undefined;
    const migratedKb: KeyBindings = savedKb?.webSwing
      ? {
          ...DEFAULT_KEYBINDINGS,
          ...savedKb,
        }
      : {
          ...DEFAULT_KEYBINDINGS,
          ...(savedKb ?? {}),
          webSwing: 'KeyQ',
          webNet: 'KeyE',
          interact: 'KeyE',
        };
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      language: typeof parsed.language === 'string' && parsed.language.length > 0 ? parsed.language : null,
      graphicsQuality: parsed.graphicsQuality ?? 'high',
      menuThemeMode: parsed.menuThemeMode ?? 'winter',
      tutorialWatched: Boolean(parsed.tutorialWatched),
      keyBindings: migratedKb,
    };
  } catch {
    return { ...DEFAULT_SETTINGS, keyBindings: { ...DEFAULT_KEYBINDINGS } };
  }
}

export function persistSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage quota errors
  }
}

export function evaluateAchievements(save: SaveData, context?: { noDamageClear?: boolean; stageCrystalsAll?: boolean }): string[] {
  const newlyUnlocked: string[] = [];
  const grant = (id: string) => {
    if (!save.unlockedAchievements.includes(id)) {
      save.unlockedAchievements.push(id);
      newlyUnlocked.push(id);
    }
  };

  if (Object.values(save.stageProgress).some((p) => p.completed)) {
    grant('first_steps');
  }
  if (
    context?.stageCrystalsAll ||
    Object.values(save.stageProgress).some((p) => p.crystals.filter(Boolean).length >= 3)
  ) {
    grant('crystal_hunter');
  }
  if (save.secretsFoundTotal > 0) {
    grant('secret_finder');
  }
  if (save.totalCoins >= 100) {
    grant('coin_collector');
  }
  const allAbilities: AbilityId[] = [
    'webShot',
    'doubleJump',
    'webTrap',
    'wallClimb',
    'webSwing',
    'spiderDash',
    'magicWeb',
  ];
  if (allAbilities.every((a) => save.unlockedAbilities[a])) {
    grant('arachnid_arsenal');
  }
  if (save.enemiesDefeatedTotal >= 50) {
    grant('slayer_50');
  }
  const bossMap: Record<BossType, string> = {
    mushroomKing: 'boss_1',
    caveDestroyer: 'boss_2',
    desertScorpion: 'boss_3',
    iceDragon: 'boss_4',
    shadowSpiderKing: 'savior_weboria',
  };
  for (const b of save.bossesDefeated) {
    if (bossMap[b]) grant(bossMap[b]);
  }
  if (context?.noDamageClear) {
    grant('untouchable');
  }

  return newlyUnlocked;
}

export function formatKeyCode(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code === 'Space') return 'SPACE';
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'SHIFT';
  if (code === 'ArrowLeft') return 'LEFT';
  if (code === 'ArrowRight') return 'RIGHT';
  if (code === 'ArrowUp') return 'UP';
  if (code === 'ArrowDown') return 'DOWN';
  return code.toUpperCase();
}
