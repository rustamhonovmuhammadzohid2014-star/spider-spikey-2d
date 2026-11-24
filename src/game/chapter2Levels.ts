import { Chapter2SectorDef } from './types';

export const CHAPTER2_SECTORS: Chapter2SectorDef[] = [
  {
    id: 'C2-1',
    sectorNumber: 1,
    name: 'Orbital Silk Dock',
    subtitle: 'Zero-G Starport · 360° Drone Ambush',
    arenaWidth: 720,
    arenaHeight: 460,
    bgPrimary: '#040b18',
    bgSecondary: '#0c1f3a',
    gridColor: 'rgba(56, 189, 248, 0.14)',
    accentColor: '#38bdf8',
    hazardKind: 'none',
    totalWaves: 3,
    isBossSector: false,
    pylons: [
      { x: 220, y: 150 },
      { x: 500, y: 150 },
      { x: 220, y: 310 },
      { x: 500, y: 310 },
    ],
    tutorialHint:
      'CHAPTER 2: 360° Top-Down Astral Arena! WASD Move · Mouse/J Shoot · Q Pylon Tether · E Web Sanctuary · SPACE Phase Blink',
  },
  {
    id: 'C2-2',
    sectorNumber: 2,
    name: 'Solar Plasma Core',
    subtitle: 'Rotating Laser Sweeps · Saw-Bot Swarm',
    arenaWidth: 760,
    arenaHeight: 500,
    bgPrimary: '#160904',
    bgSecondary: '#361508',
    gridColor: 'rgba(251, 146, 60, 0.15)',
    accentColor: '#fb923c',
    hazardKind: 'rotatingLasers',
    totalWaves: 3,
    isBossSector: false,
    pylons: [
      { x: 180, y: 140 },
      { x: 580, y: 140 },
      { x: 180, y: 360 },
      { x: 580, y: 360 },
    ],
    tutorialHint:
      'Watch the rotating Solar Plasma Beams! Phase Blink (SPACE/SHIFT) cleanly passes through laser sweeps.',
  },
  {
    id: 'C2-3',
    sectorNumber: 3,
    name: 'Quantum Rift Maze',
    subtitle: 'Warp Wormholes & Rift Turret Bastion',
    arenaWidth: 820,
    arenaHeight: 520,
    bgPrimary: '#06081c',
    bgSecondary: '#161b47',
    gridColor: 'rgba(167, 139, 250, 0.15)',
    accentColor: '#a78bfa',
    hazardKind: 'warpMaze',
    totalWaves: 4,
    isBossSector: false,
    pylons: [
      { x: 410, y: 120 },
      { x: 410, y: 400 },
      { x: 160, y: 260 },
      { x: 660, y: 260 },
    ],
    walls: [
      { x: 250, y: 110, w: 28, h: 140 },
      { x: 542, y: 110, w: 28, h: 140 },
      { x: 250, y: 270, w: 28, h: 140 },
      { x: 542, y: 270, w: 28, h: 140 },
    ],
    warpPairs: [
      { ax: 110, ay: 110, bx: 710, by: 410 },
      { ax: 710, ay: 110, bx: 110, by: 410 },
    ],
    tutorialHint:
      'Step onto Neon Wormhole Pads to flank Rift Turrets behind energy walls!',
  },
  {
    id: 'C2-4',
    sectorNumber: 4,
    name: 'Gravity Singularity',
    subtitle: 'Black Hole Pull Wells & Elite Sentinels',
    arenaWidth: 820,
    arenaHeight: 540,
    bgPrimary: '#0a0416',
    bgSecondary: '#220b38',
    gridColor: 'rgba(232, 121, 249, 0.15)',
    accentColor: '#e879f9',
    hazardKind: 'gravityWell',
    totalWaves: 4,
    isBossSector: false,
    pylons: [
      { x: 170, y: 130 },
      { x: 650, y: 130 },
      { x: 170, y: 410 },
      { x: 650, y: 410 },
    ],
    gravityWells: [
      { x: 410, y: 270, radius: 170, strength: 135 },
    ],
    tutorialHint:
      'The Central Singularity pulls everything inward—use Q Tether Pylons or Phase Blink to escape!',
  },
  {
    id: 'C2-5',
    sectorNumber: 5,
    name: 'Chronos Cyber-Widow',
    subtitle: 'Chapter 2 Final Boss · Overdrive Core',
    arenaWidth: 760,
    arenaHeight: 500,
    bgPrimary: '#13020d',
    bgSecondary: '#310823',
    gridColor: 'rgba(244, 63, 94, 0.17)',
    accentColor: '#f43f5e',
    hazardKind: 'cyberBoss',
    totalWaves: 1,
    isBossSector: true,
    bossName: 'CHRONOS CYBER-WIDOW',
    pylons: [
      { x: 160, y: 130 },
      { x: 600, y: 130 },
      { x: 160, y: 370 },
      { x: 600, y: 370 },
    ],
    tutorialHint:
      'FINAL SECTOR: Defeat the 3-Phase Chronos Cyber-Widow using Web Sanctuaries (E) & Supernova Bursts (K)!',
  },
];

export const CHAPTER2_SECTOR_MAP: Record<string, Chapter2SectorDef> = Object.fromEntries(
  CHAPTER2_SECTORS.map((s) => [s.id, s])
);

export function getNextChapter2SectorId(currentId: string): string | null {
  const idx = CHAPTER2_SECTORS.findIndex((s) => s.id === currentId);
  if (idx === -1 || idx + 1 >= CHAPTER2_SECTORS.length) return null;
  return CHAPTER2_SECTORS[idx + 1].id;
}
