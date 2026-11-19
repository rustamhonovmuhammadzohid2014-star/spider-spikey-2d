export const LOGICAL_WIDTH = 480;
export const LOGICAL_HEIGHT = 270;
export const TILE_SIZE = 16;

export type ScreenState =
  | 'TITLE_MENU'
  | 'WORLD_SELECT'
  | 'PLAYING'
  | 'PAUSED'
  | 'STAGE_CLEAR'
  | 'GAME_OVER'
  | 'CAMPAIGN_VICTORY'
  | 'SEASON_PASS'
  | 'DAILY_REWARDS'
  | 'MARKETPLACE'
  | 'CASES'
  | 'INVENTORY'
  | 'MISSIONS'
  | 'ACHIEVEMENTS'
  | 'LEADERBOARD'
  | 'TRADING'
  | 'EVENTS';

export type ModalTab = 'NONE' | 'SETTINGS' | 'ACHIEVEMENTS' | 'CREDITS' | 'TUTORIAL';

export type WorldId = 1 | 2 | 3 | 4 | 5;

export type Rarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'
  | 'limited';

export type SkinCategory =
  | 'all'
  | 'web'
  | 'neon'
  | 'fire'
  | 'ice'
  | 'shadow'
  | 'legendary'
  | 'mythic'
  | 'seasonal'
  | 'zai'
  | 'limited';

export type CaseType =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'
  | 'seasonal'
  | 'zai_monthly'
  | 'zai_summer'
  | 'zai_starfall'
  | 'zai_shadow';

export type SeasonMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';
export type MenuThemeMode = 'winter' | 'live';

export type AbilityId =
  | 'webShot'
  | 'doubleJump'
  | 'webTrap'
  | 'wallClimb'
  | 'webSwing'
  | 'spiderDash'
  | 'magicWeb';

export type SpecialAbilityId = 'webTrap' | 'magicWeb';

export type SpikeyAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'doubleJump'
  | 'fall'
  | 'land'
  | 'attack'
  | 'webShoot'
  | 'hurt'
  | 'death'
  | 'victory';

export type EnemyType =
  | 'miniSlime'
  | 'angryBeetle'
  | 'flyingBat'
  | 'poisonMushroom'
  | 'skeletonSpider'
  | 'shadowGhost'
  | 'giantScorpion';

export type BossType =
  | 'mushroomKing'
  | 'caveDestroyer'
  | 'desertScorpion'
  | 'iceDragon'
  | 'shadowSpiderKing';

export type TileKind =
  | 0 // empty
  | 1 // solid ground
  | 2 // one-way platform
  | 3 // spike hazard
  | 4 // ice slippery solid
  | 5 // climbable wall (moss / crystal wall)
  | 6 // false secret wall (solid visually until touched/hit)
  | 7 // bouncy mushroom pad
  | 8 // disappearing crumble tile
  | 9; // water / decorative hazard stream

export interface KeyBindings {
  left: string;
  right: string;
  up: string;
  down: string;
  jump: string;
  sprint: string;
  webAttack: string;
  special: string;
  interact: string;
  webSwing: string;
  webNet: string;
}

export type ResolutionScale = 'auto' | '2x' | '3x' | 'native';
export type TouchMode = 'auto' | 'on' | 'off';

export interface GameSettings {
  language: string | null;
  musicVolume: number; // 0..1
  sfxVolume: number; // 0..1
  graphicsQuality: GraphicsQuality;
  menuThemeMode: MenuThemeMode;
  resolutionScale: ResolutionScale;
  touchMode: TouchMode;
  tutorialWatched?: boolean;
  keyBindings: KeyBindings;
}

export interface StageProgress {
  completed: boolean;
  crystals: boolean[]; // 3 crystals per stage
  bestScore: number;
  bestTimeSec: number;
}

export interface SaveData {
  hasStarted: boolean;
  currentStageId: string;
  unlockedStageIds: string[];
  unlockedAbilities: Record<AbilityId, boolean>;
  activeSpecial: SpecialAbilityId;
  totalCoins: number;
  totalScore: number;
  lives: number;
  stageProgress: Record<string, StageProgress>;
  unlockedAchievements: string[];
  bossesDefeated: BossType[];
  enemiesDefeatedTotal: number;
  secretsFoundTotal: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins?: number;
  rewardXp?: number;
  category?: 'campaign' | 'economy';
}

export type SpiderColorId = 'classic' | 'emerald' | 'cobalt' | 'amethyst' | 'crimson';

export const SPIDER_COLOR_META: Record<
  SpiderColorId,
  {
    name: string;
    labelUz: string;
    bodyDark: string;
    bodyMid: string;
    bodyTop: string;
    furTuft: string;
    eyeGlint: string;
    glowRgba: string;
  }
> = {
  classic: {
    name: 'Classic Web Spikey',
    labelUz: 'Tabiiy O‘rmon',
    bodyDark: '#1d151b',
    bodyMid: '#2d2229',
    bodyTop: '#42333d',
    furTuft: '#a896a4',
    eyeGlint: '#38bdf8',
    glowRgba: 'rgba(186, 230, 253, 0.14)',
  },
  emerald: {
    name: 'Zumrad O‘rgimchak',
    labelUz: 'Zumrad Yashil',
    bodyDark: '#13211b',
    bodyMid: '#1f362b',
    bodyTop: '#2e5240',
    furTuft: '#6ee7b7',
    eyeGlint: '#34d399',
    glowRgba: 'rgba(52, 211, 153, 0.16)',
  },
  cobalt: {
    name: 'Moviy Muz',
    labelUz: 'Moviy Kobal’t',
    bodyDark: '#131b2e',
    bodyMid: '#1e2c4a',
    bodyTop: '#2d4370',
    furTuft: '#7dd3fc',
    eyeGlint: '#38bdf8',
    glowRgba: 'rgba(56, 189, 248, 0.18)',
  },
  amethyst: {
    name: 'Binafsha Qirol',
    labelUz: 'Binafsha Qirol',
    bodyDark: '#1d132b',
    bodyMid: '#2e1e45',
    bodyTop: '#452e66',
    furTuft: '#d8b4fe',
    eyeGlint: '#c084fc',
    glowRgba: 'rgba(192, 132, 252, 0.18)',
  },
  crimson: {
    name: 'Qizil Alanga',
    labelUz: 'Qizil Alanga',
    bodyDark: '#261217',
    bodyMid: '#3d1d24',
    bodyTop: '#592934',
    furTuft: '#fda4af',
    eyeGlint: '#fb7185',
    glowRgba: 'rgba(244, 63, 94, 0.18)',
  },
};

export interface UserProfileData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  nickname: string;
  spiderColor: SpiderColorId;
  profileCompleted: boolean;
}

export interface EconomyTransaction {
  id: string;
  kind: 'earn' | 'spend' | 'sell' | 'case' | 'trade';
  amount: number;
  labelUz: string;
  timestamp: string;
}

export interface EconomyData {
  ownerId: string;
  spikeyCoins: number;
  equippedSkin: string;
  ownedSkins: Record<string, number>;
  ownedCases: Record<CaseType, number>;
  specialItems: Record<string, number>;
  seasonMonthKey: string;
  seasonXp: number;
  claimedSeasonLevels: number[];
  dailyStreak: number;
  claimedDailyDays: number[];
  lastDailyClaimDate: string;
  dailyMissionDate: string;
  weeklyMissionKey: string;
  missionProgress: Record<string, number>;
  claimedMissions: string[];
  holidayClaimedIds: string[];
  casesOpenedTotal: number;
  mythicsFoundTotal: number;
  skinsSoldTotal: number;
  tradesCompletedTotal: number;
  unlockedEconomyAchievements: string[];
  transactions: EconomyTransaction[];
  processedTxIds: string[];
  playerXp?: number;
  playerLevel?: number;
  equippedWebDesign?: string;
  ownedWebDesigns?: Record<string, number>;
  selectedLanguage?: string;
}

export interface LeaderboardEntry {
  uid: string;
  isPublic: boolean;
  nickname: string;
  equippedSkin: string;
  seasonLevel: number;
  seasonMonthKey: string;
  totalCoins: number;
  skinsCount: number;
  bossesDefeatedCount: number;
  achievementsCount: number;
  playerLevel?: number;
}

export type TradeStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'completed';

export interface TradeOffer {
  tradeId: string;
  senderUid: string;
  senderNickname: string;
  recipientUid: string;
  recipientNickname: string;
  offeredSkinId: string;
  requestedSkinId: string;
  senderConfirmed: boolean;
  recipientConfirmed: boolean;
  senderSettled: boolean;
  recipientSettled: boolean;
  status: TradeStatus;
}

export type StageMotif =
  | 'sunlitGrove'
  | 'mushroomSpires'
  | 'twilightCanopy'
  | 'crystalHollow'
  | 'indigoAbyss'
  | 'magmaForge'
  | 'sunlitDunes'
  | 'torchTemple'
  | 'sandstormArena'
  | 'alpinePeaks'
  | 'auroraGlacier'
  | 'blizzardSummit'
  | 'stormRamparts'
  | 'arcaneSanctum'
  | 'eclipseThrone';

export interface StageVisualProfile {
  stageId: string;
  skyTop: string;
  skyBottom: string;
  mistRgba: string;
  farColor: string;
  midColor: string;
  nearColor: string;
  accentColor: string;
  motif: StageMotif;
}

export const STAGE_BACKGROUNDS: Record<string, StageVisualProfile> = {
  '1-1': {
    stageId: '1-1',
    skyTop: '#247d6b',
    skyBottom: '#6ce3c2',
    mistRgba: 'rgba(130, 255, 224, 0.24)',
    farColor: '#b8a082',
    midColor: '#694e38',
    nearColor: '#38842a',
    accentColor: '#82d945',
    motif: 'sunlitGrove',
  },
  '1-2': {
    stageId: '1-2',
    skyTop: '#1d544c',
    skyBottom: '#b8d97c',
    mistRgba: 'rgba(253, 224, 71, 0.18)',
    farColor: '#8f7e56',
    midColor: '#543f2d',
    nearColor: '#407d27',
    accentColor: '#f472b6',
    motif: 'mushroomSpires',
  },
  '1-Boss': {
    stageId: '1-Boss',
    skyTop: '#162138',
    skyBottom: '#3c7a69',
    mistRgba: 'rgba(192, 132, 252, 0.20)',
    farColor: '#4c3e5e',
    midColor: '#3b2b3d',
    nearColor: '#244f2c',
    accentColor: '#c084fc',
    motif: 'twilightCanopy',
  },
  '2-1': {
    stageId: '2-1',
    skyTop: '#0b1426',
    skyBottom: '#1c4257',
    mistRgba: 'rgba(34, 211, 238, 0.17)',
    farColor: '#1a2742',
    midColor: '#253559',
    nearColor: '#164e63',
    accentColor: '#22d3ee',
    motif: 'crystalHollow',
  },
  '2-2': {
    stageId: '2-2',
    skyTop: '#090d24',
    skyBottom: '#2d235e',
    mistRgba: 'rgba(167, 139, 250, 0.18)',
    farColor: '#1d1940',
    midColor: '#2b2459',
    nearColor: '#3b2478',
    accentColor: '#c084fc',
    motif: 'indigoAbyss',
  },
  '2-Boss': {
    stageId: '2-Boss',
    skyTop: '#140c1c',
    skyBottom: '#422238',
    mistRgba: 'rgba(251, 146, 60, 0.18)',
    farColor: '#261830',
    midColor: '#38223d',
    nearColor: '#0e7490',
    accentColor: '#fb923c',
    motif: 'magmaForge',
  },
  '3-1': {
    stageId: '3-1',
    skyTop: '#54261f',
    skyBottom: '#e08e45',
    mistRgba: 'rgba(253, 224, 71, 0.22)',
    farColor: '#8c492b',
    midColor: '#a65c32',
    nearColor: '#6b3b1e',
    accentColor: '#fde047',
    motif: 'sunlitDunes',
  },
  '3-2': {
    stageId: '3-2',
    skyTop: '#291512',
    skyBottom: '#7c3f23',
    mistRgba: 'rgba(251, 146, 60, 0.22)',
    farColor: '#452319',
    midColor: '#5c3020',
    nearColor: '#3b1e14',
    accentColor: '#fbbf24',
    motif: 'torchTemple',
  },
  '3-Boss': {
    stageId: '3-Boss',
    skyTop: '#3d1016',
    skyBottom: '#d96b27',
    mistRgba: 'rgba(244, 63, 94, 0.20)',
    farColor: '#5e221b',
    midColor: '#7a2f22',
    nearColor: '#451a14',
    accentColor: '#f97316',
    motif: 'sandstormArena',
  },
  '4-1': {
    stageId: '4-1',
    skyTop: '#102b42',
    skyBottom: '#57a4c4',
    mistRgba: 'rgba(186, 230, 253, 0.24)',
    farColor: '#225275',
    midColor: '#2c648c',
    nearColor: '#214c6b',
    accentColor: '#e0f2fe',
    motif: 'alpinePeaks',
  },
  '4-2': {
    stageId: '4-2',
    skyTop: '#081b2e',
    skyBottom: '#1c5e69',
    mistRgba: 'rgba(52, 211, 153, 0.22)',
    farColor: '#123b54',
    midColor: '#1b4f69',
    nearColor: '#0e7490',
    accentColor: '#34d399',
    motif: 'auroraGlacier',
  },
  '4-Boss': {
    stageId: '4-Boss',
    skyTop: '#091529',
    skyBottom: '#2d5180',
    mistRgba: 'rgba(147, 197, 253, 0.24)',
    farColor: '#162d4d',
    midColor: '#203f66',
    nearColor: '#132740',
    accentColor: '#bae6fd',
    motif: 'blizzardSummit',
  },
  '5-1': {
    stageId: '5-1',
    skyTop: '#12081f',
    skyBottom: '#431a61',
    mistRgba: 'rgba(217, 70, 239, 0.16)',
    farColor: '#231036',
    midColor: '#2e1645',
    nearColor: '#1f1030',
    accentColor: '#c084fc',
    motif: 'stormRamparts',
  },
  '5-2': {
    stageId: '5-2',
    skyTop: '#0b0417',
    skyBottom: '#2b1054',
    mistRgba: 'rgba(168, 85, 247, 0.22)',
    farColor: '#180a33',
    midColor: '#24114a',
    nearColor: '#14082b',
    accentColor: '#38bdf8',
    motif: 'arcaneSanctum',
  },
  '5-Boss': {
    stageId: '5-Boss',
    skyTop: '#17030b',
    skyBottom: '#59112b',
    mistRgba: 'rgba(244, 63, 94, 0.24)',
    farColor: '#2b0918',
    midColor: '#3b0e24',
    nearColor: '#1f0613',
    accentColor: '#f43f5e',
    motif: 'eclipseThrone',
  },
};

export interface WorldTheme {
  id: WorldId;
  name: string;
  subtitle: string;
  skyTop: string;
  skyBottom: string;
  farColor: string;
  midColor: string;
  nearColor: string;
  groundTop: string;
  groundBody: string;
  accentColor: string;
  glowColor: string;
  particleType: 'leaves' | 'caveDust' | 'sand' | 'snow' | 'embers';
  musicKey: 'world1' | 'world2' | 'world3' | 'world4' | 'world5';
}

export interface MovingPlatformDef {
  x: number;
  y: number;
  w: number;
  dx: number;
  dy: number;
  speed: number;
}

export interface SwingAnchorDef {
  x: number;
  y: number;
}

export interface PortalPairDef {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

export interface EnemySpawnDef {
  type: EnemyType;
  x: number;
  y: number;
  patrolDist?: number;
}

export interface CollectibleDef {
  kind: 'coin' | 'crystal' | 'heart' | 'chest';
  x: number;
  y: number;
  crystalIndex?: number;
  secret?: boolean;
}

export interface ShrineDef {
  ability: AbilityId;
  x: number;
  y: number;
  title: string;
  description: string;
}

export interface CrateDef {
  x: number;
  y: number;
  loot: 'coin' | 'heart' | 'none';
}

export interface FallingRockDef {
  x: number;
  y: number;
}

export interface StageDef {
  id: string;
  worldId: WorldId;
  stageNumber: number; // 1, 2, or 3 (3 = boss)
  name: string;
  isBossStage: boolean;
  bossType?: BossType;
  bossName?: string;
  widthTiles: number;
  heightTiles: number;
  tiles: TileKind[][];
  spawn: { x: number; y: number };
  exit: { x: number; y: number };
  checkpoints: { x: number; y: number }[];
  movingPlatforms: MovingPlatformDef[];
  swingAnchors: SwingAnchorDef[];
  portals: PortalPairDef[];
  enemies: EnemySpawnDef[];
  collectibles: CollectibleDef[];
  crates: CrateDef[];
  shrines: ShrineDef[];
  fallingRocks: FallingRockDef[];
  tutorialHint?: string;
}

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  lives: number;
  coins: number;
  spikeyCoinsTotal?: number;
  crystalsCollected: boolean[];
  score: number;
  worldId: WorldId;
  stageId: string;
  stageName: string;
  activeSpecial: SpecialAbilityId;
  unlockedAbilities: Record<AbilityId, boolean>;
  cooldowns: {
    webShot: number;
    webTrap: number;
    spiderDash: number;
    magicWeb: number;
  };
  boss: {
    active: boolean;
    name: string;
    hp: number;
    maxHp: number;
    phase: number;
  } | null;
  bannerText: string | null;
  promptHint: string | null;
  elapsedSec: number;
  webAttached?: boolean;
  spiderHouseProgress?: number | null;
}

export interface StageClearSummary {
  stageId: string;
  stageName: string;
  worldId: WorldId;
  isBossStage: boolean;
  isFinalBoss: boolean;
  coinsEarned: number;
  crystalsCollected: boolean[];
  scoreEarned: number;
  timeSec: number;
  noDamageBonus: boolean;
  newlyUnlockedAbility: AbilityId | null;
  nextStageId: string | null;
  enemiesDefeatedCount?: number;
  bossType?: BossType;
  playerXpEarned?: number;
}

export const ABILITY_META: Record<
  AbilityId,
  { name: string; keyHint: string; description: string; color: string }
> = {
  webShot: {
    name: 'To‘r O‘qi',
    keyHint: 'J',
    description: 'Dushmanlarga zarar yetkazuvchi va sekinlashtiruvchi yopishqoq to‘r otadi.',
    color: '#38BDF8',
  },
  doubleJump: {
    name: 'Qo‘sh Sakrash',
    keyHint: 'SPACE ×2',
    description: 'Havoda yana bir marta sakrab baland qoyalarga chiqing.',
    color: '#22D3EE',
  },
  webTrap: {
    name: 'To‘r Tuzog‘i',
    keyHint: 'K',
    description: 'Yerga dushmanlarni sekinlashtiruvchi porloq tuzoq qo‘yadi.',
    color: '#A855F7',
  },
  wallClimb: {
    name: 'Devorga Chiqish',
    keyHint: 'W / UP',
    description: 'Moxli, kristalli va toshli devorlarga tirmashib chiqing.',
    color: '#4ADE80',
  },
  webSwing: {
    name: 'To‘r Uchish',
    keyHint: 'Q',
    description: 'Tepaga ipak to‘r otib havoda tebraning va uching.',
    color: '#FBBF24',
  },
  spiderDash: {
    name: 'O‘rgimchak Shiddati',
    keyHint: 'SHIFT',
    description: 'Shamol, tuzoq va tor oraliqlardan chaqmoqdek o‘ting.',
    color: '#F43F5E',
  },
  magicWeb: {
    name: 'Sehrli To‘r',
    keyHint: 'K',
    description: 'Atrofdagi barcha dushmanlarga zarba beruvchi kuchli to‘r to‘lqini.',
    color: '#C084FC',
  },
};

export const WORLD_THEMES: Record<WorldId, WorldTheme> = {
  1: {
    id: 1,
    name: 'Qo‘ziqorin O‘rmoni',
    subtitle: 'Zumrad Shoxlar va Quyosh Nuri',
    skyTop: '#247d6b',
    skyBottom: '#6ce3c2',
    farColor: '#8d7458',
    midColor: '#5c4632',
    nearColor: '#37732c',
    groundTop: '#4da833',
    groundBody: '#693d24',
    accentColor: '#7be04a',
    glowColor: '#b7f783',
    particleType: 'leaves',
    musicKey: 'world1',
  },
  2: {
    id: 2,
    name: 'Zulmat G‘ori',
    subtitle: 'Yer Osti Kristall Tublari',
    skyTop: '#0b1426',
    skyBottom: '#1c4257',
    farColor: '#1a2742',
    midColor: '#253559',
    nearColor: '#2d3f6b',
    groundTop: '#38bdf8',
    groundBody: '#272f4a',
    accentColor: '#818cf8',
    glowColor: '#22d3ee',
    particleType: 'caveDust',
    musicKey: 'world2',
  },
  3: {
    id: 3,
    name: 'Sahro Xarobalari',
    subtitle: 'Qumtosh va Qadimiy Maqbaralar',
    skyTop: '#54261f',
    skyBottom: '#cc7943',
    farColor: '#7a4028',
    midColor: '#96512e',
    nearColor: '#5c341d',
    groundTop: '#fbbf24',
    groundBody: '#8a4c24',
    accentColor: '#fbbf24',
    glowColor: '#fde047',
    particleType: 'sand',
    musicKey: 'world3',
  },
  4: {
    id: 4,
    name: 'Muz Qirolligi',
    subtitle: 'Muz Cho‘qqilari va Qorli Vodiy',
    skyTop: '#102b42',
    skyBottom: '#418db0',
    farColor: '#1f496b',
    midColor: '#295b80',
    nearColor: '#204561',
    groundTop: '#e0f2fe',
    groundBody: '#3b6d91',
    accentColor: '#38bdf8',
    glowColor: '#bae6fd',
    particleType: 'snow',
    musicKey: 'world4',
  },
  5: {
    id: 5,
    name: 'Soya Qal’asi',
    subtitle: 'O‘rgimchak Kristallining Qora Qal’asi',
    skyTop: '#12081f',
    skyBottom: '#3e1957',
    farColor: '#231036',
    midColor: '#2e1645',
    nearColor: '#1f1030',
    groundTop: '#c084fc',
    groundBody: '#221833',
    accentColor: '#c084fc',
    glowColor: '#f43f5e',
    particleType: 'embers',
    musicKey: 'world5',
  },
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_steps',
    title: 'Weboria Sayohatchisi',
    description: 'Qo‘ziqorin O‘rmonidagi ilk bosqichni yakunlang.',
    icon: 'compass',
    rewardCoins: 100,
    rewardXp: 80,
    category: 'campaign',
  },
  {
    id: 'crystal_hunter',
    title: 'Kristall Izlovchi',
    description: 'Bitta bosqichda barcha 3 ta Sehrli Kristallni yig‘ing.',
    icon: 'gem',
    rewardCoins: 150,
    rewardXp: 100,
    category: 'campaign',
  },
  {
    id: 'secret_finder',
    title: 'Ipak Izlash Ustasi',
    description: 'Ilk yashirin xona yoki xazina sandig‘ini toping.',
    icon: 'key',
    rewardCoins: 120,
    rewardXp: 80,
    category: 'campaign',
  },
  {
    id: 'coin_collector',
    title: 'Oltin Xazinachi',
    description: 'Sayohatingiz davomida 100 ta Spikey Coins yig‘ing.',
    icon: 'coins',
    rewardCoins: 100,
    rewardXp: 70,
    category: 'campaign',
  },
  {
    id: 'arachnid_arsenal',
    title: 'To‘liq Qobiliyatlar',
    description: 'Barcha 7 ta o‘rgimchak qobiliyatini oching.',
    icon: 'zap',
    rewardCoins: 300,
    rewardXp: 150,
    category: 'campaign',
  },
  {
    id: 'slayer_50',
    title: 'Jasur Himoyachi',
    description: 'Weboria bo‘ylab 50 ta soya dushmanini mag‘lub eting.',
    icon: 'sword',
    rewardCoins: 250,
    rewardXp: 140,
    category: 'campaign',
  },
  {
    id: 'boss_1',
    title: 'O‘rmon Chempioni',
    description: '1-dunyodagi Bahaybat Qo‘ziqorin Qirolini yenging.',
    icon: 'crown',
    rewardCoins: 200,
    rewardXp: 120,
    category: 'campaign',
  },
  {
    id: 'boss_2',
    title: 'G‘or Fathchisi',
    description: '2-dunyodagi G‘or Vayronkorini parchalang.',
    icon: 'shield',
    rewardCoins: 300,
    rewardXp: 150,
    category: 'campaign',
  },
  {
    id: 'boss_3',
    title: 'Sahro Qahramoni',
    description: '3-dunyodagi Sahro Chayonini mag‘lub eting.',
    icon: 'flame',
    rewardCoins: 400,
    rewardXp: 180,
    category: 'campaign',
  },
  {
    id: 'boss_4',
    title: 'Muz Yoruvchi',
    description: '4-dunyodagi Muz Ajdahosini yenging.',
    icon: 'snowflake',
    rewardCoins: 500,
    rewardXp: 220,
    category: 'campaign',
  },
  {
    id: 'untouchable',
    title: 'Soya Chaqqonligi',
    description: 'Istalgan bosqichni birorta ham zarar olmay o‘ting.',
    icon: 'sparkles',
    rewardCoins: 250,
    rewardXp: 150,
    category: 'campaign',
  },
  {
    id: 'savior_weboria',
    title: 'Weboria Qutqaruvchisi',
    description: 'Soya O‘rgimchak Qirolini yengib Kristallni qutqaring.',
    icon: 'trophy',
    rewardCoins: 1000,
    rewardXp: 400,
    category: 'campaign',
  },
];
