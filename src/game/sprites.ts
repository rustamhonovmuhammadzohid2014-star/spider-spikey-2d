import { getSkinById } from './skins';
import { SEASONS_12 } from './seasons';
import {
  BossType,
  EnemyType,
  GraphicsQuality,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  STAGE_BACKGROUNDS,
  SeasonMonth,
  SpikeyAnimState,
  StageVisualProfile,
  TILE_SIZE,
  TileKind,
  WORLD_THEMES,
  WorldId,
} from './types';
import { WebDesignDef, getWebDesignById } from './webDesigns';

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function hashCoords(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function drawFernCluster(
  ctx: CanvasRenderingContext2D,
  cx: number,
  by: number,
  scale: number,
  darkCol: string,
  midCol: string,
  lightCol: string
) {
  const s = Math.max(1, scale);
  px(ctx, cx - 5 * s, by - 4 * s, 10 * s, 4 * s, darkCol);
  px(ctx, cx - 7 * s, by - 6 * s, 4 * s, 3 * s, midCol);
  px(ctx, cx + 3 * s, by - 6 * s, 4 * s, 3 * s, midCol);
  px(ctx, cx - 3 * s, by - 8 * s, 6 * s, 6 * s, midCol);
  px(ctx, cx - 2 * s, by - 11 * s, 4 * s, 5 * s, lightCol);
  px(ctx, cx - 1 * s, by - 13 * s, 2 * s, 3 * s, lightCol);
  px(ctx, cx - 5 * s, by - 5 * s, 2 * s, 2 * s, lightCol);
  px(ctx, cx + 4 * s, by - 5 * s, 2 * s, 2 * s, lightCol);
}

function getStageVisual(worldId: WorldId, stageId?: string): StageVisualProfile {
  if (stageId && STAGE_BACKGROUNDS[stageId]) {
    return STAGE_BACKGROUNDS[stageId];
  }
  const fallbackId = `${worldId}-1`;
  return STAGE_BACKGROUNDS[fallbackId] ?? STAGE_BACKGROUNDS['1-1'];
}

export function drawParallaxBackground(
  ctx: CanvasRenderingContext2D,
  worldId: WorldId,
  camX: number,
  time: number,
  stageId?: string
) {
  const visual = getStageVisual(worldId, stageId);
  const motif = visual.motif;

  // 16-bit stepped sky bands unique per stage
  const bands = 16;
  const bandH = Math.ceil(LOGICAL_HEIGHT / bands);
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    ctx.fillStyle = lerpHex(visual.skyTop, visual.skyBottom, t);
    ctx.fillRect(0, i * bandH, LOGICAL_WIDTH, bandH + 1);
  }

  // World-specific celestial / atmospheric backdrop layer
  px(ctx, 0, 0, 128, LOGICAL_HEIGHT, visual.mistRgba);
  px(ctx, 0, 24, 62, LOGICAL_HEIGHT - 24, visual.mistRgba);

  if (worldId === 1) {
    // Woodland sunlit clouds, canopy dappled rays, or twilight firefly moon
    if (motif === 'twilightCanopy') {
      const mx = Math.round(375 - camX * 0.03);
      px(ctx, mx - 13, 25, 26, 26, '#c084fc');
      px(ctx, mx - 10, 28, 20, 20, '#faf5ff');
      px(ctx, mx - 6, 31, 4, 4, '#e9d5ff');
      for (let s = 0; s < 16; s++) {
        const sx = (s * 41 + 17) % LOGICAL_WIDTH;
        const sy = 8 + ((s * 29) % 68);
        if (Math.sin(time * 3 + s) > 0) px(ctx, sx, sy, 2, 2, '#d8b4fe');
      }
    } else {
      for (let i = 0; i < 4; i++) {
        const sx =
          ((((i * 135 - camX * 0.04) % (LOGICAL_WIDTH + 80)) + LOGICAL_WIDTH + 80) %
            (LOGICAL_WIDTH + 80)) -
          40;
        px(ctx, sx, 10 + (i % 2) * 10, 26, 12, motif === 'mushroomSpires' ? '#fde68a' : '#bae6fd');
        px(ctx, sx + 5, 5 + (i % 2) * 10, 16, 15, motif === 'mushroomSpires' ? '#fef3c7' : '#e0f2fe');
      }
      // Diagonal sunlit canopy beams
      for (let b = 0; b < 3; b++) {
        const bx =
          ((((b * 165 + 40 - camX * 0.06) % (LOGICAL_WIDTH + 90)) + LOGICAL_WIDTH + 90) %
            (LOGICAL_WIDTH + 90)) -
          45;
        ctx.fillStyle =
          motif === 'mushroomSpires' ? 'rgba(254, 240, 138, 0.09)' : 'rgba(186, 230, 253, 0.08)';
        for (let step = 0; step < 12; step++) {
          ctx.fillRect(Math.round(bx + step * 3), step * 22, 18, 22);
        }
      }
    }
  } else if (worldId === 2) {
    // Subterranean Vaulted Cavern Ceiling & Hanging Crystal Stalactites
    const vaultOff = -(camX * 0.08) % 96;
    for (let x = vaultOff - 96; x < LOGICAL_WIDTH + 96; x += 96) {
      px(ctx, x, 0, 96, 10, '#070b17');
      px(ctx, x + 12, 10, 14, 26, '#131d36');
      px(ctx, x + 15, 36, 8, 12, '#1e2c4f');
      px(ctx, x + 18, 48, 2, 7, motif === 'magmaForge' ? '#fb923c' : '#22d3ee');
      px(ctx, x + 56, 10, 18, 20, '#131d36');
      px(ctx, x + 61, 30, 8, 10, motif === 'indigoAbyss' ? '#a855f7' : '#38bdf8');
    }
    // Twinkling subterranean mineral sparkles
    for (let i = 0; i < 18; i++) {
      const gx = (i * 37 + 13) % LOGICAL_WIDTH;
      const gy = 20 + ((i * 53) % 160);
      if (Math.sin(time * 2.6 + i) > 0.25) {
        px(ctx, gx, gy, 2, 2, motif === 'magmaForge' ? '#fdba74' : '#67e8f9');
      }
    }
  } else if (worldId === 3) {
    // Blazing Desert Sun Halo + Horizontal Heat Haze Bands
    const sunX = Math.round(362 - camX * 0.02);
    const sunCol = motif === 'sandstormArena' ? '#fb7185' : '#fde047';
    px(ctx, sunX - 24, 16, 48, 48, 'rgba(253, 224, 71, 0.16)');
    px(ctx, sunX - 18, 22, 36, 36, sunCol);
    px(ctx, sunX - 12, 28, 24, 24, motif === 'sandstormArena' ? '#fdba74' : '#fef08a');
    if (motif === 'torchTemple') {
      // Sunbeams through broken temple ceiling slabs
      for (let b = 0; b < 3; b++) {
        const bx = (((b * 155 + 24 - camX * 0.05) % 540) + 540) % 540 - 30;
        ctx.fillStyle = 'rgba(253, 224, 71, 0.09)';
        for (let step = 0; step < 12; step++) {
          ctx.fillRect(Math.round(bx + step * 2), step * 22, 16, 22);
        }
      }
    }
  } else if (worldId === 4) {
    // Frozen Kingdom: Boreal Moon + Shimmering Northern Aurora / Blizzard Mist
    const moonX = Math.round(378 - camX * 0.03);
    px(ctx, moonX - 14, 22, 28, 28, 'rgba(224, 242, 254, 0.2)');
    px(ctx, moonX - 10, 26, 20, 20, '#e0f2fe');
    px(ctx, moonX - 6, 30, 12, 12, '#ffffff');
    if (motif === 'auroraGlacier' || motif === 'alpinePeaks') {
      for (let x = 0; x < LOGICAL_WIDTH; x += 4) {
        const wave = Math.sin(x * 0.04 + time * 1.3) * 10 + Math.cos(x * 0.02 - time) * 5;
        const y = 34 + wave;
        px(ctx, x, y, 4, 16, motif === 'auroraGlacier' ? 'rgba(52, 211, 153, 0.28)' : 'rgba(125, 211, 252, 0.16)');
        px(ctx, x, y + 4, 4, 8, 'rgba(34, 211, 238, 0.24)');
      }
    }
  } else {
    // Shadow Castle: Blood-Eclipse Moon + Storm Lightning Flashes + Ash Stars
    const moonX = Math.round(372 - camX * 0.025);
    const moonY = 38;
    const ringCol =
      motif === 'eclipseThrone' ? '#f43f5e' : motif === 'arcaneSanctum' ? '#38bdf8' : '#a855f7';
    px(ctx, moonX - 17, moonY - 17, 34, 34, 'rgba(168, 85, 247, 0.14)');
    px(ctx, moonX - 13, moonY - 13, 26, 26, ringCol);
    px(ctx, moonX - 15, moonY - 9, 30, 18, ringCol);
    px(ctx, moonX - 8, moonY - 8, 16, 16, '#0d0414');
    if (motif === 'stormRamparts' && Math.sin(time * 2.7) > 0.94) {
      ctx.fillStyle = 'rgba(240, 171, 252, 0.16)';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      // Distant forked lightning bolt
      px(ctx, 180, 0, 2, 42, '#f5d0fe');
      px(ctx, 176, 42, 6, 2, '#f5d0fe');
      px(ctx, 174, 44, 2, 34, '#e879f9');
    }
  }

  // Far parallax layer (0.14x) — distinct architecture per World & Stage
  const farOffset = -(camX * 0.14) % 96;
  for (let x = farOffset - 96; x < LOGICAL_WIDTH + 96; x += 96) {
    if (worldId === 1) {
      if (motif === 'mushroomSpires') {
        px(ctx, x + 18, 114, 14, 156, visual.farColor);
        px(ctx, x + 4, 94, 42, 22, '#7d4a69');
        px(ctx, x + 10, 88, 30, 8, '#9d6285');
        px(ctx, x + 15, 92, 4, 4, '#fef08a');
        px(ctx, x + 31, 95, 4, 4, '#fef08a');
        px(ctx, x + 68, 0, 12, LOGICAL_HEIGHT, visual.farColor);
      } else {
        px(ctx, x + 8, 0, 14, LOGICAL_HEIGHT, visual.farColor);
        px(ctx, x + 10, 0, 5, LOGICAL_HEIGHT, motif === 'twilightCanopy' ? '#6b557a' : '#d1bc9d');
        px(ctx, x + 52, 0, 18, LOGICAL_HEIGHT, motif === 'twilightCanopy' ? '#3b2e4d' : '#a3896b');
        px(ctx, x + 54, 0, 6, LOGICAL_HEIGHT, motif === 'twilightCanopy' ? '#4d3b66' : '#baa182');
        px(ctx, x, 12, 42, 36, motif === 'twilightCanopy' ? '#294d42' : '#5ca844');
        px(ctx, x + 44, 24, 48, 40, motif === 'twilightCanopy' ? '#1f3b35' : '#4c9438');
      }
    } else if (worldId === 2) {
      // Subterranean Cathedral Stalagmites + Glowing Geode Veins
      px(ctx, x + 8, 96, 26, 174, visual.farColor);
      px(ctx, x + 14, 78, 14, 20, visual.farColor);
      px(ctx, x + 18, 64, 6, 16, motif === 'magmaForge' ? '#ea580c' : visual.accentColor);
      px(ctx, x + 52, 118, 32, 152, visual.farColor);
      px(ctx, x + 60, 102, 16, 18, visual.farColor);
      px(ctx, x + 66, 90, 4, 14, '#7dd3fc');
    } else if (worldId === 3) {
      // Distant Stepped Sandstone Pyramids & Broken Obelisks
      for (let r = 0; r < 52; r += 4) {
        px(ctx, x + 48 - r, 134 + r, r * 2, 4, visual.farColor);
        px(ctx, x + 48 - r, 134 + r, 6, 4, '#c27446');
      }
      if (motif === 'sandstormArena' || motif === 'torchTemple') {
        px(ctx, x + 8, 96, 12, 174, visual.farColor);
        px(ctx, x + 10, 86, 8, 10, '#c27446');
      }
    } else if (worldId === 4) {
      // Jagged Alpine Glacier Mountain Peaks with Sunlit Snow Caps
      for (let r = 0; r < 64; r += 4) {
        px(ctx, x + 48 - r * 0.72, 112 + r, r * 1.44, 4, visual.farColor);
        if (r < 22) {
          px(
            ctx,
            x + 48 - r * 0.65,
            112 + r,
            r * 0.9,
            4,
            motif === 'auroraGlacier' ? '#6ee7b7' : '#e0f2fe'
          );
        }
      }
    } else {
      // Towering Gothic Castle Curtain Wall & Pointed Spires
      px(ctx, x + 10, 102, 26, 168, visual.farColor);
      px(ctx, x + 15, 80, 16, 22, visual.farColor);
      px(ctx, x + 19, 62, 8, 18, visual.farColor);
      px(ctx, x + 22, 48, 2, 14, visual.accentColor);
      // Battlement merlons
      px(ctx, x + 42, 134, 46, 136, visual.farColor);
      px(ctx, x + 44, 126, 10, 8, visual.farColor);
      px(ctx, x + 62, 126, 10, 8, visual.farColor);
      px(ctx, x + 78, 126, 10, 8, visual.farColor);
      // Glowing slit window
      px(ctx, x + 20, 96, 6, 16, motif === 'eclipseThrone' ? '#f43f5e' : '#a855f7');
    }
  }

  // Mid parallax layer (0.32x) — strong world-distinct landmarks
  const midOffset = -(camX * 0.32) % 128;
  for (let x = midOffset - 128; x < LOGICAL_WIDTH + 128; x += 128) {
    if (worldId === 1) {
      const sway = Math.round(Math.sin(time * 1.6 + x * 0.02) * 1.5);
      px(ctx, x + 24, 0, 22, LOGICAL_HEIGHT, visual.midColor);
      px(ctx, x + 26, 0, 7, LOGICAL_HEIGHT, motif === 'twilightCanopy' ? '#574359' : '#87674b');
      px(ctx, x + 40, 0, 6, LOGICAL_HEIGHT, '#2b1f26');
      for (let b = 0; b < 6; b++) {
        px(ctx, x + 42 + b * 6, 98 - b * 7, 10, 10, visual.midColor);
        px(ctx, x + 42 + b * 6, 98 - b * 7, 4, 4, '#87674b');
      }
      px(ctx, x + 92, 0, 14, LOGICAL_HEIGHT, visual.midColor);
      if (motif === 'mushroomSpires') {
        px(ctx, x + 76, 120, 42, 14, '#a21caf');
        px(ctx, x + 82, 114, 30, 8, '#f472b6');
        px(ctx, x + 88, 117, 4, 4, '#fef08a');
        px(ctx, x + 102, 118, 4, 4, '#fef08a');
      }
      const canopyDark = motif === 'twilightCanopy' ? '#193d35' : '#2b6b22';
      const canopyMid = motif === 'twilightCanopy' ? '#2c6b5a' : '#4ba834';
      const canopyLight = motif === 'twilightCanopy' ? '#5eead4' : visual.accentColor;
      px(ctx, x + 6 + sway, 16, 48, 28, canopyDark);
      px(ctx, x + 10 + sway, 12, 38, 22, canopyMid);
      px(ctx, x + 16 + sway, 14, 22, 12, canopyLight);
      px(ctx, x + 66 - sway, 38, 52, 30, canopyDark);
      px(ctx, x + 72 - sway, 34, 40, 24, canopyMid);
      px(ctx, x + 78 - sway, 36, 20, 12, canopyLight);
      // Hanging forest vine
      px(ctx, x + 60, 0, 2, 74 + sway * 2, '#2d6a24');
    } else if (worldId === 2) {
      // Mid Cavern Stone Arches + Giant Glowing Crystal Clusters
      px(ctx, x + 18, 0, 22, LOGICAL_HEIGHT, visual.midColor);
      px(ctx, x + 20, 0, 5, LOGICAL_HEIGHT, '#475569');
      px(ctx, x + 38, 22, 54, 14, visual.midColor);
      px(ctx, x + 92, 0, 18, LOGICAL_HEIGHT, visual.midColor);
      // Giant faceted crystal outcrop on pillar
      const gemA = motif === 'indigoAbyss' ? '#9333ea' : motif === 'magmaForge' ? '#ea580c' : '#0284c7';
      px(ctx, x + 32, 152, 16, 42, gemA);
      px(ctx, x + 36, 142, 8, 24, visual.accentColor);
      px(ctx, x + 46, 166, 10, 28, '#bae6fd');
      // Hanging glow vine
      px(ctx, x + 64, 36, 2, 48, '#164e63');
      px(ctx, x + 63, 84, 4, 4, visual.accentColor);
    } else if (worldId === 3) {
      // Desert Temple Colonnade + Palm Tree Silhouettes + Flickering Torches
      px(ctx, x + 16, 118, 20, 152, visual.midColor);
      px(ctx, x + 18, 118, 6, 152, '#c27446');
      px(ctx, x + 12, 112, 28, 8, '#d97706');
      px(ctx, x + 82, 146, 20, 124, visual.midColor);
      px(ctx, x + 78, 140, 28, 8, '#d97706');
      // Palm tree trunk & curved fronds
      px(ctx, x + 56, 138, 6, 132, '#451a03');
      px(ctx, x + 42, 132, 34, 6, '#3f6212');
      px(ctx, x + 36, 138, 12, 5, '#4d7c0f');
      px(ctx, x + 70, 138, 12, 5, '#4d7c0f');
      if (motif === 'torchTemple' || motif === 'sandstormArena') {
        const flicker = Math.sin(time * 12 + x) > 0 ? 1 : 0;
        px(ctx, x + 36, 146, 6, 12, '#78350f');
        px(ctx, x + 35, 138 - flicker, 8, 8, '#f97316');
        px(ctx, x + 37, 140 - flicker, 4, 4, '#fef08a');
      }
    } else if (worldId === 4) {
      // Frozen Ice Spires & Snow-laden Boreal Pine Trees
      px(ctx, x + 22, 128, 24, 142, motif === 'auroraGlacier' ? '#2dd4bf' : '#38bdf8');
      px(ctx, x + 26, 128, 8, 142, '#e0f2fe');
      px(ctx, x + 28, 114, 12, 14, '#ffffff');
      // Layered frosted pine tree
      px(ctx, x + 86, 206, 8, 64, '#334155');
      for (let tier = 0; tier < 3; tier++) {
        const ty = 138 + tier * 24;
        const tw = 24 + tier * 10;
        px(ctx, x + 90 - tw / 2, ty, tw, 22, '#1e4e68');
        px(ctx, x + 90 - tw / 2 + 2, ty, tw - 4, 6, '#f8fafc');
      }
    } else {
      // Shadow Castle: Vaulted Gothic Pillars + Stained-Glass Rose Windows + Chains
      px(ctx, x + 12, 112, 42, 158, visual.midColor);
      px(ctx, x + 14, 112, 5, 158, '#4c1d95');
      // Pointed gothic stained-glass window
      px(ctx, x + 25, 146, 16, 30, '#090412');
      px(ctx, x + 29, 138, 8, 10, '#090412');
      px(ctx, x + 27, 148, 12, 24, motif === 'eclipseThrone' ? '#be123c' : '#7e22ce');
      px(ctx, x + 31, 142, 4, 28, visual.accentColor);
      // Hanging iron chains from top
      px(ctx, x + 80, 0, 2, 130, '#475569');
      px(ctx, x + 78, 128, 6, 10, '#334155');
      px(ctx, x + 96, 154, 24, 116, visual.midColor);
    }
  }

  // Near understory silhouettes (0.52x)
  const nearOffset = -(camX * 0.52) % 96;
  for (let x = nearOffset - 96; x < LOGICAL_WIDTH + 96; x += 96) {
    if (worldId === 1) {
      drawFernCluster(ctx, x + 24, 270, 2, '#1c4a19', visual.nearColor, visual.accentColor);
      drawFernCluster(ctx, x + 74, 270, 2, '#193f16', '#2e7324', '#58b837');
    } else if (worldId === 2) {
      // Glowing bottom geode spikes
      px(ctx, x + 18, 244, 10, 26, '#1e293b');
      px(ctx, x + 20, 236, 6, 16, visual.accentColor);
      px(ctx, x + 64, 250, 8, 20, '#312e81');
      px(ctx, x + 66, 244, 4, 10, '#22d3ee');
    } else if (worldId === 3) {
      // Desert rolling dunes & cactus silhouettes
      px(ctx, x + 4, 256, 88, 14, '#5c3018');
      px(ctx, x + 16, 250, 52, 8, '#7c3f20');
      px(ctx, x + 74, 236, 5, 24, '#365314');
      px(ctx, x + 69, 244, 5, 4, '#4d7c0f');
      px(ctx, x + 79, 241, 5, 4, '#4d7c0f');
    } else if (worldId === 4) {
      // Drifting foreground snow banks & ice shards
      px(ctx, x + 8, 254, 44, 16, '#bae6fd');
      px(ctx, x + 14, 250, 32, 8, '#f0f9ff');
      px(ctx, x + 66, 248, 8, 22, '#38bdf8');
    } else {
      // Cursed iron fence pickets & shadow braziers
      for (let p = 0; p < 3; p++) {
        px(ctx, x + 18 + p * 14, 246, 3, 24, '#3b0764');
        px(ctx, x + 17 + p * 14, 242, 5, 4, visual.accentColor);
      }
    }
  }
}

export function drawTile(
  ctx: CanvasRenderingContext2D,
  kind: TileKind,
  wx: number,
  wy: number,
  worldId: WorldId,
  time: number,
  aboveEmpty: boolean,
  belowEmpty = false
) {
  const theme = WORLD_THEMES[worldId];
  const x = Math.round(wx);
  const y = Math.round(wy);
  const h = hashCoords(x / TILE_SIZE, y / TILE_SIZE);
  const outline = worldId === 1 || worldId === 3 ? '#1a0f0a' : '#090d1a';

  if (kind === 1 || kind === 6) {
    if (worldId === 1) {
      // WORLD 1: Organic Bark & Loam Soil with Whorled Roots & Emerald Moss
      px(ctx, x, y, TILE_SIZE, TILE_SIZE, '#5e351e');
      px(ctx, x, y + 3, 10, 3, '#734427');
      px(ctx, x + (h > 0.5 ? 2 : 0), y + 7, 12, 2, '#472614');
      px(ctx, x + 4, y + 11, 9, 3, '#734427');
      if (h > 0.6) px(ctx, x + 12, y + 6, 3, 8, '#3d2010');

      if (aboveEmpty) {
        px(ctx, x, y, TILE_SIZE, 1, outline);
        px(ctx, x, y + 1, TILE_SIZE, 3, '#4da833');
        px(ctx, x, y + 1, TILE_SIZE, 1, '#82e64b');
        px(ctx, x + 2, y + 4, 4, 2, '#3a8424');
        px(ctx, x + 10, y + 4, 5, 3, '#3a8424');
        if (h > 0.48) {
          drawFernCluster(ctx, x + 8, y + 1, 1, '#1a4718', '#388c2c', '#7ce04b');
        } else if (h < 0.24) {
          px(ctx, x + 3, y - 3, 2, 3, '#5cc93c');
          px(ctx, x + 11, y - 3, 3, 3, '#f472b6');
        }
      }
      if (belowEmpty && h > 0.45) {
        px(ctx, x + 3, y + 16, 2, 4, '#3d2010');
        px(ctx, x + 11, y + 16, 2, 6, '#2d5a20');
      }
    } else if (worldId === 2) {
      // WORLD 2: Faceted Dark Basalt Rock with Glowing Cyan/Violet Crystal Geodes
      px(ctx, x, y, TILE_SIZE, TILE_SIZE, '#1f2842');
      px(ctx, x, y, 8, 8, '#283454');
      px(ctx, x + 8, y + 8, 8, 8, '#283454');
      px(ctx, x + 1, y + 9, 6, 6, '#151b2e');
      px(ctx, x + 9, y + 1, 6, 6, '#151b2e');
      // Crystal mineral vein embedded inside rock
      if (h > 0.52) {
        px(ctx, x + 4, y + 5, 3, 3, '#0891b2');
        px(ctx, x + 5, y + 6, 2, 2, '#67e8f9');
      } else if (h < 0.25) {
        px(ctx, x + 10, y + 10, 3, 2, '#7c3aed');
        px(ctx, x + 11, y + 10, 1, 1, '#e879f9');
      }

      if (aboveEmpty) {
        px(ctx, x, y, TILE_SIZE, 1, outline);
        px(ctx, x, y + 1, TILE_SIZE, 3, '#334155');
        px(ctx, x + 1, y + 1, 14, 1, '#38bdf8');
        if (h > 0.62) {
          px(ctx, x + 5, y - 5, 4, 5, '#0891b2');
          px(ctx, x + 6, y - 7, 2, 4, '#67e8f9');
        }
      }
      if (belowEmpty && h > 0.4) {
        px(ctx, x + 4, y + 16, 4, 4, '#283454');
        px(ctx, x + 5, y + 20, 2, 3, '#22d3ee');
      }
    } else if (worldId === 3) {
      // WORLD 3: Carved Pharaoh Sandstone Ashlar Bricks with Hieroglyphs & Sand Crest
      px(ctx, x, y, TILE_SIZE, TILE_SIZE, '#8c4c24');
      // 2x2 carved sandstone block pattern
      px(ctx, x, y + 7, TILE_SIZE, 1, '#542910');
      px(ctx, x + 7, y, 1, 7, '#542910');
      px(ctx, x + 14, y + 8, 1, 8, '#542910');
      px(ctx, x + 1, y + 1, 5, 2, '#b06533');
      px(ctx, x + 9, y + 9, 4, 2, '#b06533');
      // Ancient diamond carving on select sandstone blocks
      if (h > 0.55) {
        px(ctx, x + 3, y + 10, 3, 3, '#fbbf24');
        px(ctx, x + 4, y + 11, 1, 1, '#542910');
      }

      if (aboveEmpty) {
        px(ctx, x, y, TILE_SIZE, 1, outline);
        px(ctx, x, y + 1, TILE_SIZE, 3, '#f59e0b');
        px(ctx, x, y + 1, TILE_SIZE, 1, '#fde68a');
        px(ctx, x + 3, y + 4, 5, 2, '#d97706');
        if (h > 0.72) {
          px(ctx, x + 6, y - 4, 3, 4, '#4d7c0f');
          px(ctx, x + 4, y - 2, 2, 2, '#84cc16');
        }
      }
      if (belowEmpty && h > 0.5) {
        px(ctx, x + 2, y + 16, 4, 2, '#b45309');
        px(ctx, x + 10, y + 16, 4, 2, '#b45309');
      }
    } else if (worldId === 4) {
      // WORLD 4: Chiseled Glacial Ice-Stone with Diagonal Frost Facets & Snow Drifts
      px(ctx, x, y, TILE_SIZE, TILE_SIZE, '#2d5c80');
      px(ctx, x + 1, y + 1, 6, 14, '#38729c');
      px(ctx, x + 8, y + 2, 7, 6, '#4888b8');
      px(ctx, x + 3, y + 3, 2, 8, '#7dd3fc');
      px(ctx, x + 10, y + 10, 4, 4, '#1e4261');

      if (aboveEmpty) {
        px(ctx, x, y, TILE_SIZE, 1, outline);
        px(ctx, x, y + 1, TILE_SIZE, 4, '#e0f2fe');
        px(ctx, x, y + 1, TILE_SIZE, 2, '#ffffff');
        px(ctx, x + 1, y + 5, 5, 2, '#bae6fd');
        px(ctx, x + 9, y + 5, 6, 2, '#bae6fd');
        if (h > 0.58) {
          px(ctx, x + 3, y - 2, 4, 2, '#ffffff');
          px(ctx, x + 10, y - 1, 3, 1, '#bae6fd');
        }
      }
      if (belowEmpty) {
        // Hanging crystal icicles underneath snow & ice blocks
        px(ctx, x + 2, y + 16, 3, 4, '#7dd3fc');
        px(ctx, x + 3, y + 20, 1, 3, '#e0f2fe');
        px(ctx, x + 10, y + 16, 3, 5, '#38bdf8');
        px(ctx, x + 11, y + 21, 1, 3, '#ffffff');
      }
    } else {
      // WORLD 5: Dark Gothic Obsidian Citadel Bricks with Glowing Runic Sigils & Iron Trim
      px(ctx, x, y, TILE_SIZE, TILE_SIZE, '#1b1129');
      px(ctx, x, y + 7, TILE_SIZE, 1, '#0b0612');
      px(ctx, x + 8, y, 1, 7, '#0b0612');
      px(ctx, x + 2, y + 8, 1, 8, '#0b0612');
      px(ctx, x + 1, y + 1, 6, 2, '#2d1c45');
      px(ctx, x + 4, y + 9, 10, 2, '#2d1c45');
      if (h > 0.62) {
        // Etched glowing violet-crimson rune inside stone
        px(ctx, x + 10, y + 3, 4, 1, '#c084fc');
        px(ctx, x + 11, y + 2, 2, 3, '#f43f5e');
      }

      if (aboveEmpty) {
        px(ctx, x, y, TILE_SIZE, 1, outline);
        px(ctx, x, y + 1, TILE_SIZE, 3, '#581c87');
        px(ctx, x, y + 1, TILE_SIZE, 1, '#c084fc');
        if (h > 0.66) {
          // Miniature iron battlement spike / gothic candle
          px(ctx, x + 6, y - 4, 3, 4, '#3b0764');
          px(ctx, x + 7, y - 6, 1, 2, '#f43f5e');
        }
      }
      if (belowEmpty && h > 0.5) {
        px(ctx, x + 7, y + 16, 2, 5, '#334155');
        px(ctx, x + 6, y + 21, 4, 2, '#9333ea');
      }
    }

    if (kind === 6) {
      const pulse = Math.sin(time * 3 + x) > 0.7;
      if (pulse) {
        px(ctx, x + 7, y + 7, 2, 2, 'rgba(255,255,255,0.25)');
      }
    }
  } else if (kind === 2) {
    // Distinct One-Way Platforms per World!
    px(ctx, x, y, TILE_SIZE, 1, outline);
    if (worldId === 1) {
      // Wooden branch plank with bark knots & hanging leaves
      px(ctx, x, y + 1, TILE_SIZE, 5, '#6e4226');
      px(ctx, x, y + 1, TILE_SIZE, 2, '#966039');
      px(ctx, x + 3, y + 3, 5, 1, '#472713');
      if (h > 0.52) drawFernCluster(ctx, x + 8, y + 1, 1, '#1a4718', '#388c2c', '#7ce04b');
    } else if (worldId === 2) {
      // Faceted glowing amethyst/cyan geode slab
      px(ctx, x, y + 1, TILE_SIZE, 5, '#1e3a5f');
      px(ctx, x, y + 1, TILE_SIZE, 2, '#22d3ee');
      px(ctx, x + 2, y + 6, 4, 2, '#0891b2');
      px(ctx, x + 10, y + 6, 4, 3, '#6366f1');
    } else if (worldId === 3) {
      // Carved golden sandstone temple cornice
      px(ctx, x, y + 1, TILE_SIZE, 5, '#9a4f23');
      px(ctx, x, y + 1, TILE_SIZE, 2, '#fbbf24');
      px(ctx, x + 4, y + 3, 2, 2, '#fef08a');
      px(ctx, x + 10, y + 3, 2, 2, '#fef08a');
    } else if (worldId === 4) {
      // Sculpted glacial ice bridge with icicle teeth
      px(ctx, x, y + 1, TILE_SIZE, 4, '#38bdf8');
      px(ctx, x, y + 1, TILE_SIZE, 2, '#f0f9ff');
      px(ctx, x + 3, y + 5, 2, 3, '#7dd3fc');
      px(ctx, x + 11, y + 5, 2, 4, '#bae6fd');
    } else {
      // Wrought-iron gothic grate catwalk with arcane rivets
      px(ctx, x, y + 1, TILE_SIZE, 5, '#271a38');
      px(ctx, x, y + 1, TILE_SIZE, 2, '#9333ea');
      px(ctx, x + 3, y + 3, 2, 2, '#f43f5e');
      px(ctx, x + 11, y + 3, 2, 2, '#f43f5e');
    }
    px(ctx, x, y + 6, TILE_SIZE, 1, outline);
  } else if (kind === 3) {
    // World-Specific Spikes
    const topCol =
      worldId === 1
        ? '#bef264'
        : worldId === 2
        ? '#22d3ee'
        : worldId === 3
        ? '#fde047'
        : worldId === 4
        ? '#e0f2fe'
        : '#f43f5e';
    const baseCol =
      worldId === 1
        ? '#65a30d'
        : worldId === 2
        ? '#4f46e5'
        : worldId === 3
        ? '#b45309'
        : worldId === 4
        ? '#0284c7'
        : '#4c1d95';
    for (let i = 0; i < 2; i++) {
      const sx = x + i * 8;
      px(ctx, sx, y + 11, 8, 5, outline);
      px(ctx, sx + 1, y + 12, 6, 4, baseCol);
      px(ctx, sx + 2, y + 7, 4, 5, topCol);
      px(ctx, sx + 3, y + 3, 2, 5, '#ffffff');
    }
  } else if (kind === 4) {
    // Slippery Ice Block
    px(ctx, x, y, TILE_SIZE, TILE_SIZE, '#0ea5e9');
    px(ctx, x, y, TILE_SIZE, 1, outline);
    px(ctx, x, y + 1, TILE_SIZE, 4, '#f0f9ff');
    px(ctx, x + 2, y + 6, 5, 4, '#7dd3fc');
    px(ctx, x + 9, y + 10, 5, 3, '#bae6fd');
    px(ctx, x + 4, y + 12, 3, 2, '#ffffff');
  } else if (kind === 5) {
    // World-Specific Climbable Walls!
    px(ctx, x, y, TILE_SIZE, TILE_SIZE, theme.midColor);
    if (worldId === 1) {
      // Braided green jungle vines & leaves
      px(ctx, x + 3, y, 2, TILE_SIZE, '#166534');
      px(ctx, x + 11, y, 2, TILE_SIZE, '#166534');
      px(ctx, x + 4, y + 2, 8, 2, '#4ade80');
      px(ctx, x + 4, y + 10, 8, 2, '#4ade80');
      px(ctx, x + 1, y + 5, 3, 3, '#86efac');
      px(ctx, x + 12, y + 12, 3, 3, '#86efac');
    } else if (worldId === 2) {
      // Glowing crystal-chain cavern ladder
      px(ctx, x + 2, y, 3, TILE_SIZE, '#1e293b');
      px(ctx, x + 11, y, 3, TILE_SIZE, '#1e293b');
      px(ctx, x + 3, y + 2, 10, 2, '#22d3ee');
      px(ctx, x + 3, y + 10, 10, 2, '#a855f7');
    } else if (worldId === 3) {
      // Desert rope ladder
      px(ctx, x + 2, y, 2, TILE_SIZE, '#b45309');
      px(ctx, x + 12, y, 2, TILE_SIZE, '#b45309');
      px(ctx, x + 3, y + 3, 10, 2, '#fbbf24');
      px(ctx, x + 3, y + 11, 10, 2, '#fbbf24');
    } else if (worldId === 4) {
      // Frost-pick & frozen silver trellis
      px(ctx, x + 2, y, 3, TILE_SIZE, '#7dd3fc');
      px(ctx, x + 11, y, 3, TILE_SIZE, '#7dd3fc');
      px(ctx, x + 4, y + 3, 8, 2, '#ffffff');
      px(ctx, x + 4, y + 11, 8, 2, '#e0f2fe');
    } else {
      // Forged iron shadow-chains with runic links
      px(ctx, x + 2, y, 3, TILE_SIZE, '#475569');
      px(ctx, x + 11, y, 3, TILE_SIZE, '#475569');
      px(ctx, x + 4, y + 3, 8, 2, '#c084fc');
      px(ctx, x + 4, y + 11, 8, 2, '#f43f5e');
    }
  } else if (kind === 7) {
    // World-Specific Bounce Pads!
    if (worldId === 1) {
      px(ctx, x + 4, y + 7, 8, 9, outline);
      px(ctx, x + 5, y + 8, 6, 8, '#fde68a');
      px(ctx, x, y + 1, 16, 8, outline);
      px(ctx, x + 1, y + 2, 14, 6, '#ef4444');
      px(ctx, x + 3, y + 1, 10, 2, '#f87171');
      px(ctx, x + 3, y + 4, 2, 2, '#ffffff');
      px(ctx, x + 10, y + 3, 3, 2, '#ffffff');
    } else if (worldId === 2) {
      // Glowing cyan cave-spore crystal spring
      px(ctx, x + 4, y + 8, 8, 8, outline);
      px(ctx, x + 5, y + 9, 6, 7, '#312e81');
      px(ctx, x, y + 2, 16, 7, outline);
      px(ctx, x + 1, y + 3, 14, 5, '#06b6d4');
      px(ctx, x + 3, y + 2, 10, 2, '#67e8f9');
    } else if (worldId === 3) {
      // Ancient brass & ruby desert spring drum
      px(ctx, x + 2, y + 8, 12, 8, outline);
      px(ctx, x + 3, y + 9, 10, 6, '#92400e');
      px(ctx, x, y + 3, 16, 6, outline);
      px(ctx, x + 1, y + 4, 14, 4, '#f59e0b');
      px(ctx, x + 5, y + 3, 6, 3, '#ef4444');
    } else if (worldId === 4) {
      // Snow-capped frost-crystal spring pad
      px(ctx, x + 3, y + 8, 10, 8, outline);
      px(ctx, x + 4, y + 9, 8, 6, '#0284c7');
      px(ctx, x, y + 2, 16, 7, outline);
      px(ctx, x + 1, y + 3, 14, 5, '#38bdf8');
      px(ctx, x + 2, y + 2, 12, 2, '#ffffff');
    } else {
      // Arcane violet-crimson rune glyph pad
      const bob = Math.sin(time * 6 + x) > 0 ? -1 : 0;
      px(ctx, x + 2, y + 9, 12, 7, outline);
      px(ctx, x + 3, y + 10, 10, 5, '#3b0764');
      px(ctx, x, y + 3 + bob, 16, 6, outline);
      px(ctx, x + 1, y + 4 + bob, 14, 4, '#a855f7');
      px(ctx, x + 5, y + 4 + bob, 6, 2, '#f43f5e');
    }
  } else if (kind === 8) {
    // World-Specific Crumble Tiles
    px(ctx, x, y, TILE_SIZE, 7, outline);
    const body =
      worldId === 1
        ? '#78350f'
        : worldId === 2
        ? '#334155'
        : worldId === 3
        ? '#b45309'
        : worldId === 4
        ? '#7dd3fc'
        : '#3b0764';
    const crack = worldId === 5 ? '#f43f5e' : worldId === 4 ? '#ffffff' : '#1e293b';
    px(ctx, x + 1, y + 1, TILE_SIZE - 2, 5, body);
    px(ctx, x + 4, y + 2, 2, 3, crack);
    px(ctx, x + 10, y + 2, 2, 3, crack);
  } else if (kind === 9) {
    const wave = Math.sin(time * 5 + x * 0.25) * 1.5;
    const bodyCol = worldId === 5 ? '#7e22ce' : worldId === 3 ? '#d97706' : '#0284c7';
    const topCol = worldId === 5 ? '#e879f9' : worldId === 3 ? '#fde047' : '#7dd3fc';
    px(ctx, x, y + 4, TILE_SIZE, TILE_SIZE - 4, bodyCol);
    px(ctx, x, y + 3 + wave, TILE_SIZE, 2, topCol);
  }
}

// Screenshot-faithful cute fuzzy jumping spider (Salticidae) + 30+ Marketplace, Mythic & Seasonal Skins
export function drawSpikey(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: 1 | -1,
  anim: SpikeyAnimState,
  animTime: number,
  scarfTrail: { x: number; y: number }[],
  invulnTimer: number,
  skinId: string = 'classic'
) {
  if (invulnTimer > 0 && Math.floor(invulnTimer * 18) % 2 === 0 && anim !== 'death') {
    return;
  }

  const skin = getSkinById(skinId);
  const style = skin.accentStyle;
  let bodyDark = skin.bodyDark;
  let bodyMid = skin.bodyMid;
  let bodyTop = skin.bodyTop;
  let furTuft = skin.furTuft;
  const eyeGlint = skin.eyeGlint;

  // Dynamic hue cycling for Rainbow Web Spikey
  if (style === 'rainbow') {
    const rainbowCols = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#a855f7'];
    const idx = Math.floor(animTime * 4) % rainbowCols.length;
    bodyTop = rainbowCols[idx];
    bodyMid = rainbowCols[(idx + 2) % rainbowCols.length];
    furTuft = rainbowCols[(idx + 4) % rainbowCols.length];
  }

  ctx.save();
  const cx = Math.round(x);
  const cy = Math.round(y);

  // Subtle trailing silk/aura wisps behind Spikey
  for (let i = scarfTrail.length - 1; i >= 0; i--) {
    const node = scarfTrail[i];
    const size = Math.max(1, 3 - Math.floor(i / 2));
    ctx.globalAlpha = 0.42 - i * 0.06;
    px(ctx, node.x - size / 2, node.y - size / 2, size, size, skin.particleColor);
  }
  ctx.globalAlpha = 1;

  let bobY = 0;
  let scaleX = 1;
  let scaleY = 1;
  let rotAngle = 0;

  switch (anim) {
    case 'idle':
      bobY = Math.sin(animTime * 4) > 0.35 ? -0.8 : 0;
      break;
    case 'walk':
      bobY = Math.abs(Math.sin(animTime * 12)) * -1.4;
      break;
    case 'run':
      bobY = Math.abs(Math.sin(animTime * 20)) * -1.8;
      break;
    case 'jump':
      scaleY = 1.12;
      scaleX = 0.92;
      break;
    case 'doubleJump':
      rotAngle = animTime * 14 * facing;
      break;
    case 'fall':
      scaleY = 1.07;
      break;
    case 'land':
      scaleY = 0.82;
      scaleX = 1.15;
      bobY = 2;
      break;
    case 'attack':
    case 'webShoot':
      bobY = -1;
      scaleX = 1.1;
      break;
    case 'hurt':
      bobY = -2;
      rotAngle = -0.22 * facing;
      break;
    case 'death':
      bobY = 3;
      rotAngle = Math.min(Math.PI, animTime * 6);
      break;
    case 'victory':
      bobY = Math.abs(Math.sin(animTime * 8)) * -4;
      break;
  }

  ctx.translate(cx, cy + bobY);
  if (rotAngle !== 0) ctx.rotate(rotAngle);
  ctx.scale(scaleX, scaleY);

  // Cosmic orbiting planetary ring behind body
  if (style === 'cosmic') {
    const orbX = Math.cos(animTime * 3.5) * 12;
    const orbY = Math.sin(animTime * 3.5) * 3 - 1;
    if (Math.sin(animTime * 3.5) < 0) {
      px(ctx, orbX - 2, orbY - 2, 4, 4, '#fde047');
      px(ctx, orbX - 1, orbY - 1, 2, 2, '#ffffff');
    }
  } else if (style === 'darkMatter') {
    const pulse = Math.sin(animTime * 7) * 1.5;
    ctx.globalAlpha = 0.35;
    px(ctx, -10 - pulse, -9 - pulse, 20 + pulse * 2, 18 + pulse * 2, '#9f1239');
    ctx.globalAlpha = 1;
  }

  const outline = style === 'neon' ? bodyTop : '#09060b';
  const speed = anim === 'run' ? 22 : anim === 'walk' ? 13 : anim === 'victory' ? 12 : 3;

  // Eight compact tucked fuzzy jumping-spider legs with striped joint bands
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 4; i++) {
      const phase = animTime * speed + i * 1.4 + (side === 1 ? Math.PI : 0);
      let lift = 0;
      let reach = 0;

      if (anim === 'walk' || anim === 'run') {
        lift = Math.sin(phase) * 2.2;
        reach = Math.cos(phase) * 1.8;
      } else if (anim === 'jump' || anim === 'doubleJump') {
        lift = 2.2;
        reach = -1.2;
      } else if (anim === 'fall') {
        lift = -2.4 + Math.sin(phase) * 0.8;
        reach = 1.2;
      } else if (anim === 'victory') {
        lift = i < 2 ? -3.5 + Math.sin(phase) * 1.8 : 0;
      } else if (anim === 'hurt' || anim === 'death') {
        lift = Math.sin(animTime * 25 + i) * 2.5;
      } else if ((anim === 'attack' || anim === 'webShoot') && side === facing && i === 0) {
        reach = 3.5;
        lift = -1.8;
      } else {
        lift = Math.sin(animTime * 2.8 + i) * 0.4;
      }

      const rootX = side * 4;
      const rootY = 1 + (i - 1.5) * 0.9;
      const kneeX = side * (7.2 + (i % 2) * 1.2) + reach * 0.5 * side;
      const kneeY = rootY - 2.2 - lift * 0.55;
      const footX = side * (9 + (i % 2)) + reach * side;
      const footY = 5.5 - Math.max(0, lift);

      px(ctx, Math.min(rootX, kneeX) - 0.5, Math.min(rootY, kneeY) - 0.5, Math.abs(kneeX - rootX) + 3, 3, outline);
      px(ctx, Math.min(rootX, kneeX), Math.min(rootY, kneeY), Math.abs(kneeX - rootX) + 2, 2, bodyMid);
      px(ctx, footX - 1.5, Math.min(kneeY, footY) - 0.5, 3, Math.abs(footY - kneeY) + 3, outline);
      px(ctx, footX - 1, Math.min(kneeY, footY), 2, Math.abs(footY - kneeY) + 2, bodyDark);
      px(ctx, kneeX - 0.5, kneeY - 0.5, 2, 1, furTuft);
    }
  }

  // Plump fuzzy abdomen behind cephalothorax
  const abOffset = -facing * 3;
  px(ctx, abOffset - 6, -6, 12, 11, outline);
  px(ctx, abOffset - 5, -5, 10, 9, bodyDark);
  px(ctx, abOffset - 4, -6, 8, 8, bodyMid);
  px(ctx, abOffset - 2, -5, 4, 2, furTuft);

  // Broad rounded-square fuzzy head / cephalothorax
  px(ctx, -6, -6, 12, 11, outline);
  px(ctx, -5, -5, 10, 9, bodyMid);
  px(ctx, -4, -6, 8, 8, bodyTop);
  px(ctx, -3, -6, 2, 1, furTuft);
  px(ctx, 1, -6, 2, 1, furTuft);
  px(ctx, -1, -5, 2, 1, furTuft);

  // Unique Skin Visual Accessories & Effects
  if (style === 'galaxy') {
    // Twinkling Milky Way stars on carapace
    if (Math.sin(animTime * 6) > -0.2) px(ctx, -3, -5, 1, 1, '#ffffff');
    if (Math.cos(animTime * 5) > -0.2) px(ctx, 2, -4, 1, 1, '#fde047');
    px(ctx, abOffset - 2, -4, 2, 2, '#e879f9');
    px(ctx, -2, -9, 4, 3, '#c084fc');
    px(ctx, -1, -10, 2, 2, '#fde047');
  } else if (style === 'fire') {
    const fl = Math.sin(animTime * 16) > 0 ? 1 : 0;
    px(ctx, -4, -8 - fl, 2, 3 + fl, '#f97316');
    px(ctx, -1, -10 + fl, 3, 4, '#facc15');
    px(ctx, 2, -8 - fl, 2, 3 + fl, '#ef4444');
  } else if (style === 'ice') {
    px(ctx, -4, -9, 2, 3, '#bae6fd');
    px(ctx, -1, -11, 2, 5, '#ffffff');
    px(ctx, 2, -9, 2, 3, '#7dd3fc');
  } else if (style === 'crystal') {
    px(ctx, -3, -10, 2, 4, '#67e8f9');
    px(ctx, 0, -11, 2, 5, '#f0abfc');
    px(ctx, 3, -9, 2, 3, '#a5f3fc');
  } else if (style === 'golden' || style === 'crown') {
    px(ctx, -4, -9, 8, 3, '#fbbf24');
    px(ctx, -4, -11, 2, 2, '#fde047');
    px(ctx, -1, -11, 2, 2, '#fde047');
    px(ctx, 2, -11, 2, 2, '#fde047');
    px(ctx, -1, -8, 2, 1, '#38bdf8');
  } else if (style === 'santa') {
    // Red Santa hat with white fluffy rim & pom-pom
    px(ctx, -5, -7, 10, 2, '#ffffff');
    px(ctx, -4, -10, 7, 3, '#dc2626');
    px(ctx, -2, -12, 4, 2, '#dc2626');
    px(ctx, 2, -11, 3, 3, '#ffffff');
  } else if (style === 'pumpkin') {
    // Halloween green pumpkin stem + glowing ridge
    px(ctx, -1, -9, 2, 3, '#16a34a');
    px(ctx, -4, -7, 8, 1, '#fdba74');
  } else if (style === 'hearts') {
    const hb = Math.sin(animTime * 6) > 0 ? 0 : -1;
    px(ctx, -3, -9 + hb, 2, 2, '#f472b6');
    px(ctx, 1, -9 + hb, 2, 2, '#f472b6');
    px(ctx, -2, -8 + hb, 4, 2, '#ec4899');
  } else if (style === 'navruz') {
    // Spring tulip crest
    px(ctx, -1, -8, 2, 2, '#16a34a');
    px(ctx, -3, -10, 2, 2, '#f43f5e');
    px(ctx, 1, -10, 2, 2, '#f43f5e');
    px(ctx, -1, -11, 2, 3, '#fde047');
  } else if (style === 'autumn') {
    px(ctx, -3, -8, 3, 2, '#f59e0b');
    px(ctx, 0, -9, 3, 2, '#ef4444');
  } else if (style === 'auroraCrown') {
    // Mythic Season Crown
    px(ctx, -5, -9, 10, 3, '#f43f5e');
    px(ctx, -5, -12, 2, 3, '#38bdf8');
    px(ctx, -1, -13, 2, 4, '#fde047');
    px(ctx, 3, -12, 2, 3, '#38bdf8');
  } else if (style === 'shadow') {
    px(ctx, -5, -7, 2, 2, '#a855f7');
    px(ctx, 3, -7, 2, 2, '#a855f7');
  }

  // Cute fuzzy front pedipalps / chelicerae below eyes
  const eyeShift = facing * 1;
  px(ctx, eyeShift - 3, 2, 2, 2, furTuft);
  px(ctx, eyeShift + 1, 2, 2, 2, furTuft);
  px(ctx, eyeShift - 1, 2, 2, 2, '#9d6b7a');

  // Four glossy dark jumping-spider eyes with crisp white gleam
  const blink = anim === 'idle' && Math.sin(animTime * 2.1) > 0.96;
  if (anim === 'hurt' || anim === 'death') {
    px(ctx, eyeShift - 3, -3, 2, 1, eyeGlint);
    px(ctx, eyeShift - 2, -2, 2, 1, '#ffffff');
    px(ctx, eyeShift + 2, -3, 2, 1, eyeGlint);
    px(ctx, eyeShift + 1, -2, 2, 1, '#ffffff');
  } else if (blink) {
    px(ctx, eyeShift - 3, -1, 3, 1, '#09090b');
    px(ctx, eyeShift + 1, -1, 3, 1, '#09090b');
  } else {
    px(ctx, eyeShift - 4, -3, 3, 3, '#050508');
    px(ctx, eyeShift + 1, -3, 3, 3, '#050508');
    px(ctx, eyeShift - 3, -3, 1, 1, '#ffffff');
    px(ctx, eyeShift + 2, -3, 1, 1, '#ffffff');
    px(ctx, eyeShift - 2, -1, 1, 1, eyeGlint);
    px(ctx, eyeShift + 3, -1, 1, 1, eyeGlint);
    px(ctx, eyeShift - 6, -3, 2, 2, '#050508');
    px(ctx, eyeShift + 4, -3, 2, 2, '#050508');
    px(ctx, eyeShift - 6, -3, 1, 1, '#e2e8f0');
    px(ctx, eyeShift + 4, -3, 1, 1, '#e2e8f0');
  }

  // Front pass of cosmic orbiting planet
  if (style === 'cosmic' && Math.sin(animTime * 3.5) >= 0) {
    const orbX = Math.cos(animTime * 3.5) * 12;
    const orbY = Math.sin(animTime * 3.5) * 3 - 1;
    px(ctx, orbX - 2, orbY - 2, 4, 4, '#38bdf8');
    px(ctx, orbX - 1, orbY - 1, 2, 2, '#ffffff');
  }

  ctx.restore();
}

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  type: EnemyType,
  x: number,
  y: number,
  facing: 1 | -1,
  time: number,
  hitFlash: number,
  isAttacking: boolean,
  slowed: boolean
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (facing === -1) ctx.scale(-1, 1);

  const flash = hitFlash > 0;
  const tint = (col: string) => (flash ? '#ffffff' : slowed ? '#a5f3fc' : col);
  const out = '#09070d';

  switch (type) {
    case 'miniSlime': {
      const squash = Math.sin(time * 8) * 1.4;
      // Crisp outline + 3-tone gel body + glossy bubble highlight
      px(ctx, -7, -5 + squash, 14, 12 - squash, out);
      px(ctx, -5, -7 + squash, 10, 3, out);
      px(ctx, -6, -4 + squash, 12, 10 - squash, tint('#15803d'));
      px(ctx, -5, -5 + squash, 10, 8 - squash, tint('#22c55e'));
      px(ctx, -4, -6 + squash, 8, 3, tint('#4ade80'));
      px(ctx, -3, -5 + squash, 2, 2, '#bbf7d0'); // specular shine
      // Expressive angry brows & eyes
      px(ctx, -3, -2 + squash, 2, 3, '#052e16');
      px(ctx, 2, -2 + squash, 2, 3, '#052e16');
      px(ctx, -3, -2 + squash, 1, 1, '#ffffff');
      px(ctx, 2, -2 + squash, 1, 1, '#ffffff');
      break;
    }
    case 'angryBeetle': {
      const scuttle = Math.sin(time * 18) * 1.5;
      // Horned armored shell with dark outline & glowing mandibles
      px(ctx, -8, -6, 16, 11, out);
      px(ctx, -6, -8, 12, 4, out);
      px(ctx, -7, -5, 14, 9, tint(isAttacking ? '#b91c1c' : '#92400e'));
      px(ctx, -6, -7, 12, 5, tint(isAttacking ? '#ef4444' : '#d97706'));
      px(ctx, -4, -6, 7, 2, tint('#fbbf24')); // rim shine
      px(ctx, -1, -6, 1, 9, out); // wing seam
      // Rhino horn + mandibles
      px(ctx, 6, -5, 5, 3, out);
      px(ctx, 8, -7, 3, 3, out);
      px(ctx, 6, -4, 4, 2, tint('#fde68a'));
      px(ctx, 8, -6, 2, 2, tint('#fef08a'));
      // Fierce eye
      px(ctx, 2, -3, 3, 2, out);
      px(ctx, 3, -3, 2, 2, isAttacking ? '#fef08a' : '#ef4444');
      // Articulated legs
      px(ctx, -6, 4 + scuttle, 2, 3, out);
      px(ctx, -1, 4 - scuttle, 2, 3, out);
      px(ctx, 4, 4 + scuttle, 2, 3, out);
      break;
    }
    case 'flyingBat': {
      const flap = Math.sin(time * 16) * 4;
      // Wing membranes with crisp bone ribs
      px(ctx, -12, -4 + flap, 9, 6, out);
      px(ctx, 3, -4 + flap, 9, 6, out);
      px(ctx, -11, -3 + flap, 7, 4, tint('#581c87'));
      px(ctx, 4, -3 + flap, 7, 4, tint('#581c87'));
      px(ctx, -10, -3 + flap, 6, 1, tint('#a855f7'));
      px(ctx, 4, -3 + flap, 6, 1, tint('#a855f7'));
      // Body + pointed ears + fangs
      px(ctx, -5, -6, 10, 11, out);
      px(ctx, -4, -8, 3, 3, out);
      px(ctx, 1, -8, 3, 3, out);
      px(ctx, -4, -5, 8, 9, tint('#7e22ce'));
      px(ctx, -3, -7, 2, 3, tint('#a855f7'));
      px(ctx, 1, -7, 2, 3, tint('#a855f7'));
      px(ctx, -2, -2, 2, 2, '#fbbf24');
      px(ctx, 1, -2, 2, 2, '#fbbf24');
      px(ctx, -2, 2, 1, 2, '#ffffff');
      px(ctx, 1, 2, 1, 2, '#ffffff');
      break;
    }
    case 'poisonMushroom': {
      const puff = isAttacking ? 2 : Math.sin(time * 5) * 0.8;
      // Outlined stalk + spotted purple cap + toxic spore aura
      px(ctx, -5, -1, 10, 9, out);
      px(ctx, -4, 0, 8, 7, tint('#e2e8f0'));
      px(ctx, -2, 1, 5, 5, tint('#cbd5e1'));
      px(ctx, -9 - puff, -8 - puff, 18 + puff * 2, 10 + puff, out);
      px(ctx, -8 - puff, -7 - puff, 16 + puff * 2, 8 + puff, tint('#7e22ce'));
      px(ctx, -6 - puff, -7 - puff, 12 + puff * 2, 4, tint('#a855f7'));
      px(ctx, -5, -6, 3, 3, '#f0abfc');
      px(ctx, 2, -5, 3, 2, '#f0abfc');
      px(ctx, -2, 2, 2, 2, '#ef4444');
      px(ctx, 2, 2, 2, 2, '#ef4444');
      break;
    }
    case 'skeletonSpider': {
      const step = Math.sin(time * 22) * 2;
      for (const s of [-1, 1]) {
        px(ctx, s * 5 - 1, -2 + step * s, 6, 3, out);
        px(ctx, s * 6, -1 + step * s, 4, 2, tint('#e2e8f0'));
        px(ctx, s * 8 - 1, 1 - step * s, 4, 6, out);
        px(ctx, s * 8, 2 - step * s, 2, 5, tint('#94a3b8'));
      }
      // Skull carapace + cracked brow + toxic emerald eye sockets
      px(ctx, -7, -6, 14, 11, out);
      px(ctx, -6, -5, 12, 9, tint('#cbd5e1'));
      px(ctx, -5, -5, 10, 4, tint('#f8fafc'));
      px(ctx, -4, -3, 3, 3, out);
      px(ctx, 1, -3, 3, 3, out);
      px(ctx, -3, -2, 2, 2, '#22c55e');
      px(ctx, 2, -2, 2, 2, '#22c55e');
      px(ctx, -2, 2, 4, 2, out);
      px(ctx, -2, 2, 1, 2, '#f8fafc');
      px(ctx, 1, 2, 1, 2, '#f8fafc');
      break;
    }
    case 'shadowGhost': {
      const floatY = Math.sin(time * 5) * 3;
      ctx.globalAlpha = 0.88;
      // Spectral hooded cloak + trailing wisps + piercing crimson eyes
      px(ctx, -7, -9 + floatY, 14, 15, out);
      px(ctx, -5, -11 + floatY, 10, 4, out);
      px(ctx, -6, -8 + floatY, 12, 13, tint('#3b0764'));
      px(ctx, -4, -10 + floatY, 8, 5, tint('#581c87'));
      px(ctx, -3, -9 + floatY, 6, 2, tint('#9333ea'));
      px(ctx, -6, 5 + floatY, 3, 3, tint('#3b0764'));
      px(ctx, -1, 6 + floatY, 3, 4, tint('#581c87'));
      px(ctx, 3, 5 + floatY, 3, 3, tint('#3b0764'));
      px(ctx, -1, -5 + floatY, 6, 3, '#050508');
      px(ctx, 0, -5 + floatY, 2, 2, '#f43f5e');
      px(ctx, 3, -5 + floatY, 2, 2, '#f43f5e');
      break;
    }
    case 'giantScorpion': {
      const scuttle = Math.sin(time * 12) * 1.5;
      // Armored segmented desert carapace + glowing venom stinger + pincers
      px(ctx, -10, -4, 18, 11, out);
      px(ctx, -8, -6, 14, 5, out);
      px(ctx, -9, -3, 16, 9, tint('#92400e'));
      px(ctx, -7, -5, 12, 5, tint('#d97706'));
      px(ctx, -5, -5, 8, 2, tint('#fbbf24'));
      // Tail arching over
      px(ctx, -11, -11, 6, 9, out);
      px(ctx, -9, -15, 8, 6, out);
      px(ctx, -10, -10, 4, 8, tint('#b45309'));
      px(ctx, -8, -14, 6, 4, tint('#d97706'));
      px(ctx, -2, -14, 5, 3, isAttacking ? '#ef4444' : '#fde047');
      // Claw
      px(ctx, 6, -5, 8, 7, out);
      px(ctx, 7, -4, 6, 5, tint('#f59e0b'));
      px(ctx, 10, -4, 3, 2, '#fde68a');
      px(ctx, 4, -2, 2, 2, '#ef4444');
      // Legs
      px(ctx, -6, 6 + scuttle, 2, 3, out);
      px(ctx, -1, 6 - scuttle, 2, 3, out);
      px(ctx, 4, 6 + scuttle, 2, 3, out);
      break;
    }
  }

  ctx.restore();
}

export function drawBoss(
  ctx: CanvasRenderingContext2D,
  type: BossType,
  x: number,
  y: number,
  facing: 1 | -1,
  time: number,
  phase: number,
  hitFlash: number,
  warningActive: boolean
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (facing === -1) ctx.scale(-1, 1);

  const flash = hitFlash > 0;
  const t = (c: string) => (flash ? '#ffffff' : c);
  const pulse = warningActive && Math.floor(time * 16) % 2 === 0;
  const out = '#09070d';

  switch (type) {
    case 'mushroomKing': {
      const bounce = Math.sin(time * 5) * 1.5;
      // Outlined Stalk + Giant Royal Spotted Cap + Jeweled Crown
      px(ctx, -13, -5 + bounce, 26, 26, out);
      px(ctx, -12, -4 + bounce, 24, 24, t('#f1f5f9'));
      px(ctx, -10, 0 + bounce, 20, 18, t('#cbd5e1'));
      px(ctx, -23, -23 + bounce, 46, 20, out);
      px(ctx, -19, -27 + bounce, 38, 7, out);
      px(ctx, -22, -22 + bounce, 44, 18, t(phase >= 2 ? '#be123c' : '#7e22ce'));
      px(ctx, -18, -26 + bounce, 36, 7, t(phase >= 2 ? '#e11d48' : '#a855f7'));
      px(ctx, -14, -18 + bounce, 6, 5, '#fef08a');
      px(ctx, 6, -20 + bounce, 7, 5, '#fef08a');
      px(ctx, -2, -14 + bounce, 5, 4, '#fef08a');
      px(ctx, -9, -33 + bounce, 18, 8, out);
      px(ctx, -8, -32 + bounce, 16, 6, '#fbbf24');
      px(ctx, -8, -35 + bounce, 3, 3, '#fde047');
      px(ctx, -1, -36 + bounce, 3, 4, '#fde047');
      px(ctx, 5, -35 + bounce, 3, 3, '#fde047');
      px(ctx, -1, -32 + bounce, 3, 3, '#38bdf8'); // crown gem
      px(ctx, -8, 1 + bounce, 6, 6, out);
      px(ctx, 3, 1 + bounce, 6, 6, out);
      px(ctx, -7, 2 + bounce, 4, 4, pulse ? '#fde047' : '#ef4444');
      px(ctx, 4, 2 + bounce, 4, 4, pulse ? '#fde047' : '#ef4444');
      break;
    }
    case 'caveDestroyer': {
      const hover = Math.sin(time * 4) * 2;
      px(ctx, -19, -23 + hover, 38, 38, out);
      px(ctx, -15, -27 + hover, 30, 8, out);
      px(ctx, -18, -22 + hover, 36, 36, t('#334155'));
      px(ctx, -14, -26 + hover, 28, 8, t('#475569'));
      px(ctx, -6, -8 + hover, 12, 12, pulse ? '#f43f5e' : '#22d3ee');
      px(ctx, -3, -5 + hover, 6, 6, '#ffffff');
      px(ctx, -25, -25 + hover, 10, 16, out);
      px(ctx, 15, -25 + hover, 10, 16, out);
      px(ctx, -24, -24 + hover, 8, 14, t('#6366f1'));
      px(ctx, 16, -24 + hover, 8, 14, t('#6366f1'));
      px(ctx, -27, 1 + hover, 12, 16, out);
      px(ctx, 15, 1 + hover, 12, 16, out);
      px(ctx, -26, 2 + hover, 10, 14, t('#1e293b'));
      px(ctx, 16, 2 + hover, 10, 14, t('#1e293b'));
      px(ctx, -8, -18 + hover, 16, 4, '#09090b');
      px(ctx, -5, -17 + hover, 4, 2, '#f43f5e');
      px(ctx, 2, -17 + hover, 4, 2, '#f43f5e');
      break;
    }
    case 'desertScorpion': {
      const scuttle = Math.sin(time * 10) * 2;
      px(ctx, -19, -9, 36, 22, out);
      px(ctx, -15, -13, 28, 8, out);
      px(ctx, -18, -8, 34, 20, t('#b45309'));
      px(ctx, -14, -12, 26, 6, t('#f59e0b'));
      px(ctx, -10, -11, 18, 2, t('#fde68a'));
      px(ctx, -23, -25, 10, 20, out);
      px(ctx, -19, -33, 16, 10, out);
      px(ctx, -22, -24, 8, 18, t('#92400e'));
      px(ctx, -18, -32, 14, 8, t('#d97706'));
      px(ctx, -4, -32, 10, 6, pulse ? '#ef4444' : '#fde047');
      px(ctx, 13, -11, 16, 12, out);
      px(ctx, 14, -10, 14, 10, t('#fbbf24'));
      px(ctx, 20, -14, 8, 4, t('#fde68a'));
      px(ctx, 8, -4, 4, 3, '#ef4444');
      for (let i = -2; i <= 1; i++) {
        px(ctx, i * 8 - 1, 12 + (i % 2 === 0 ? scuttle : -scuttle), 6, 9, out);
        px(ctx, i * 8, 12 + (i % 2 === 0 ? scuttle : -scuttle), 4, 8, '#78350f');
      }
      break;
    }
    case 'iceDragon': {
      const wingY = Math.sin(time * 8) * 6;
      px(ctx, -25, -23 + wingY, 20, 18, out);
      px(ctx, -29, -27 + wingY, 12, 12, out);
      px(ctx, -24, -22 + wingY, 18, 16, t('#0284c7'));
      px(ctx, -28, -26 + wingY, 10, 10, t('#38bdf8'));
      px(ctx, -15, -13, 28, 28, out);
      px(ctx, -14, -12, 26, 26, t('#0ea5e9'));
      px(ctx, -10, -4, 18, 16, t('#bae6fd'));
      px(ctx, 5, -25, 20, 16, out);
      px(ctx, 6, -24, 18, 14, t('#38bdf8'));
      px(ctx, 4, -30, 5, 8, '#e0f2fe');
      px(ctx, 12, -30, 5, 8, '#e0f2fe');
      px(ctx, 16, -20, 4, 3, pulse ? '#fde047' : '#ef4444');
      px(ctx, -27, 3, 16, 10, out);
      px(ctx, -26, 4, 14, 8, t('#0284c7'));
      break;
    }
    case 'shadowSpiderKing': {
      const pulseAura = Math.sin(time * 8) * 2;
      for (const side of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          const swing = Math.sin(time * 10 + i * 1.3) * 3;
          px(ctx, side * 14, -7 + i * 4, side * 13, 6, out);
          px(ctx, side * 14, -6 + i * 4, side * 12, 4, t('#1e1b4b'));
          px(ctx, side * 24 - 1, -5 + i * 5 + swing, 6, 16, out);
          px(ctx, side * 24, -4 + i * 5 + swing, 4, 14, t('#4338ca'));
        }
      }
      px(ctx, -19, -19, 38, 32, out);
      px(ctx, -15, -23, 30, 8, out);
      px(ctx, -18, -18, 36, 30, t('#090710'));
      px(ctx, -14, -22, 28, 8, t('#2e1065'));
      px(ctx, -6, -35 + pulseAura * 0.5, 12, 14, out);
      px(ctx, -5, -34 + pulseAura * 0.5, 10, 12, '#a855f7');
      px(ctx, -2, -32 + pulseAura * 0.5, 4, 8, '#f0abfc');
      px(ctx, -9, -10, 4, 4, pulse ? '#ffffff' : '#f43f5e');
      px(ctx, -2, -12, 4, 4, pulse ? '#ffffff' : '#f43f5e');
      px(ctx, 5, -10, 4, 4, pulse ? '#ffffff' : '#f43f5e');
      break;
    }
  }

  if (warningActive) {
    px(ctx, -2, -42, 4, 7, '#ef4444');
    px(ctx, -2, -33, 4, 3, '#ef4444');
  }

  ctx.restore();
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r1 = (pa >> 16) & 255;
  const g1 = (pa >> 8) & 255;
  const b1 = pa & 255;
  const r2 = (pb >> 16) & 255;
  const g2 = (pb >> 8) & 255;
  const b2 = pb & 255;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${bl})`;
}

export function resolveWebStrokeColor(
  design: WebDesignDef,
  time: number,
  indexOffset = 0,
  secondary = false
): string {
  if (design.animMode === 'rainbow') {
    const hue = Math.floor((time * 95 + indexOffset * 28 + (secondary ? 60 : 0)) % 360);
    return `hsl(${hue}, 92%, ${secondary ? 74 : 62}%)`;
  }
  if (design.animMode === 'neon') {
    const pulse = Math.sin(time * 7 + indexOffset) > 0;
    return pulse ? (secondary ? design.secondaryHex : design.primaryHex) : (secondary ? design.primaryHex : design.secondaryHex);
  }
  if (design.animMode === 'galaxy') {
    const hue = 225 + Math.sin(time * 2.5 + indexOffset) * 35;
    return secondary ? design.secondaryHex : `hsl(${Math.round(hue)}, 88%, 70%)`;
  }
  if (design.animMode === 'zai') {
    const shift = Math.sin(time * 4 + indexOffset) > 0.25;
    return shift ? '#fbbf24' : (secondary ? design.secondaryHex : design.primaryHex);
  }
  return secondary ? design.secondaryHex : design.primaryHex;
}

export function drawStylizedWeb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  anchors: { x: number; y: number }[],
  ringRadii: number[],
  webDesignId: string,
  time: number,
  quality: GraphicsQuality = 'high',
  buildProgress = 1,
  isHouse = false
): void {
  if (anchors.length < 3) return;
  const design = getWebDesignById(webDesignId);
  const prog = Math.max(0.05, Math.min(1, buildProgress));
  const showGlow = quality === 'high' || quality === 'ultra';

  ctx.save();
  if (showGlow) {
    ctx.shadowColor = design.primaryHex;
    ctx.shadowBlur = quality === 'ultra' ? 7 : 4;
  }

  // Radial anchor lines
  ctx.lineWidth = 1;
  anchors.forEach((a, i) => {
    const ax = Math.round(cx + (a.x - cx) * prog);
    const ay = Math.round(cy + (a.y - cy) * prog);
    ctx.strokeStyle = resolveWebStrokeColor(design, time, i, false);
    ctx.globalAlpha = isHouse ? 0.88 : 0.78;
    ctx.beginPath();
    ctx.moveTo(Math.round(cx), Math.round(cy));
    ctx.lineTo(ax, ay);
    ctx.stroke();

    if (prog > 0.7) {
      ctx.fillStyle = resolveWebStrokeColor(design, time, i, true);
      ctx.fillRect(ax - 1, ay - 1, 2, 2);
    }
  });

  // Concentric spider web rings (partial during construction animation)
  const visibleRings = Math.max(1, Math.ceil(ringRadii.length * prog));
  for (let ri = 0; ri < visibleRings; ri++) {
    const r = ringRadii[ri];
    ctx.strokeStyle = resolveWebStrokeColor(design, time, ri * 2, ri % 2 === 1);
    ctx.globalAlpha = (isHouse ? 0.85 : 0.72) * (0.65 + prog * 0.35);
    ctx.beginPath();
    for (let i = 0; i <= anchors.length; i++) {
      const a = anchors[i % anchors.length];
      const ang = Math.atan2(a.y - cy, a.x - cx);
      const wx = Math.round(cx + Math.cos(ang) * r);
      const wy = Math.round(cy + Math.sin(ang) * r);
      if (i === 0) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    }
    ctx.stroke();
  }

  // Sparkling prism / star / snow nodes on high+ quality
  if (quality !== 'low' && prog >= 0.85) {
    const nodeCount = quality === 'ultra' ? anchors.length : Math.min(4, anchors.length);
    for (let i = 0; i < nodeCount; i++) {
      const a = anchors[i];
      const ang = Math.atan2(a.y - cy, a.x - cx);
      const r = ringRadii[ringRadii.length - 1] ?? 18;
      const nx = Math.round(cx + Math.cos(ang) * (r * 0.72));
      const ny = Math.round(cy + Math.sin(ang) * (r * 0.72));
      if (Math.sin(time * 5 + i * 1.9) > 0.1) {
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = resolveWebStrokeColor(design, time, i + 3, true);
        ctx.fillRect(nx - 1, ny - 1, 2, 2);
      }
    }
  }

  ctx.restore();
}

// ===================================================
// WINTER WONDERLAND & 12-MONTH LIVE SEASONAL MENU SCENERY
// ===================================================
export function drawSeasonalMenuScene(
  ctx: CanvasRenderingContext2D,
  monthOrWinter: SeasonMonth | 'winter',
  camX: number,
  time: number,
  skinId: string = 'classic',
  webDesignId: string = 'classic_white',
  quality: GraphicsQuality = 'high'
) {
  const isWinterMode = monthOrWinter === 'winter';
  const month: SeasonMonth = isWinterMode ? 12 : monthOrWinter;
  const season = SEASONS_12[month];
  const skin = getSkinById(skinId);

  if (isWinterMode) {
    // Crisp Midnight Frost Sky
    const bands = 16;
    const bandH = Math.ceil(LOGICAL_HEIGHT / bands);
    for (let i = 0; i < bands; i++) {
      ctx.fillStyle = lerpHex('#060f20', '#1c4066', i / (bands - 1));
      ctx.fillRect(0, i * bandH, LOGICAL_WIDTH, bandH + 1);
    }

    // Distant twinkle stars
    const starCount = quality === 'low' ? 12 : quality === 'ultra' ? 36 : 24;
    for (let i = 0; i < starCount; i++) {
      const sx = (i * 67 + 19) % LOGICAL_WIDTH;
      const sy = (i * 43 + 7) % 120;
      const tw = 0.35 + Math.abs(Math.sin(time * 2.2 + i)) * 0.65;
      ctx.globalAlpha = tw;
      px(ctx, sx, sy, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1, i % 4 === 0 ? '#67e8f9' : '#f8fafc');
    }
    ctx.globalAlpha = 1;

    // Moon with icy halo
    if (quality !== 'low') {
      ctx.fillStyle = 'rgba(103, 232, 249, 0.14)';
      ctx.fillRect(364, 18, 38, 38);
    }
    px(ctx, 370, 24, 26, 26, '#f8fafc');
    px(ctx, 375, 29, 16, 16, '#e0f2fe');

    // Far frozen jagged alpine peaks with snow caps
    const farOff = -(camX * 0.1) % 160;
    for (let x = farOff - 160; x < LOGICAL_WIDTH + 160; x += 160) {
      for (let h = 0; h < 66; h += 4) {
        const w = h * 1.45;
        px(ctx, x + 65 - w / 2, 128 + h, w, 4, '#183654');
        if (h < 22) {
          px(ctx, x + 65 - w / 2, 128 + h, w, 4, '#e0f2fe');
        }
      }
      for (let h = 0; h < 50; h += 4) {
        const w = h * 1.3;
        px(ctx, x + 132 - w / 2, 146 + h, w, 4, '#142d47');
        if (h < 16) {
          px(ctx, x + 132 - w / 2, 146 + h, w, 4, '#bae6fd');
        }
      }
    }

    // Midground Snow-Covered Pine Trees & Twinkling Icy Lights
    const midOff = -(camX * 0.22) % 120;
    for (let x = midOff - 120; x < LOGICAL_WIDTH + 120; x += 120) {
      // Tall snowy pine
      px(ctx, x + 36, 198, 8, 28, '#3b2416');
      for (let t = 0; t < 4; t++) {
        const w = 14 + t * 11;
        const py = 128 + t * 18;
        px(ctx, x + 40 - w / 2, py, w, 18, '#0f3d33');
        px(ctx, x + 40 - w / 2, py, w, 4, '#f1f5f9'); // snow ledge on bough
      }
      // Small snowy pine
      px(ctx, x + 92, 206, 6, 20, '#3b2416');
      for (let t = 0; t < 3; t++) {
        const w = 10 + t * 9;
        const py = 158 + t * 16;
        px(ctx, x + 95 - w / 2, py, w, 16, '#134e4a');
        px(ctx, x + 95 - w / 2, py, w, 3, '#e0f2fe');
      }
      // Twinkling icy festive lights
      const blink = Math.floor(time * 2.8) % 3;
      px(ctx, x + 32, 152, 3, 3, blink === 0 ? '#67e8f9' : '#bae6fd');
      px(ctx, x + 46, 170, 3, 3, blink === 1 ? '#fbbf24' : '#38bdf8');
      px(ctx, x + 93, 180, 3, 3, blink === 2 ? '#f8fafc' : '#67e8f9');
    }

    // Snowy ground strip
    for (let gx = 0; gx < LOGICAL_WIDTH; gx += TILE_SIZE) {
      px(ctx, gx, 14 * TILE_SIZE, TILE_SIZE, 5, '#f8fafc');
      px(ctx, gx + 2, 14 * TILE_SIZE + 5, TILE_SIZE - 4, 2, '#bae6fd');
      px(ctx, gx, 14 * TILE_SIZE + 7, TILE_SIZE, 36, '#1e3a5f');
      px(ctx, gx + 4, 14 * TILE_SIZE + 12, 5, 4, '#38bdf8');
    }

    // Frozen Spider Web Styled After Player's Equipped Web Design
    const wx = 330;
    const wy = 154;
    const webAnchors = [
      { x: 330, y: 0 },
      { x: 452, y: 80 },
      { x: 392, y: 14 * TILE_SIZE },
      { x: 266, y: 14 * TILE_SIZE },
      { x: 204, y: 92 },
    ];
    drawStylizedWeb(ctx, wx, wy, webAnchors, [9, 18, 27, 37], webDesignId, time, quality, 1, false);

    // Animated Spikey showcasing Equipped Skin
    const spX = 128;
    const hop = Math.max(0, Math.sin(time * 2.4)) * 10;
    const spY = 14 * TILE_SIZE - 6 - hop;
    const trail = Array.from({ length: 5 }, (_, i) => ({
      x: spX - 4 - i * 3,
      y: spY + 1 + Math.sin(time * 7 + i) * 1.2,
    }));
    drawSpikey(ctx, spX, spY, 1, hop > 2 ? 'jump' : 'walk', time, trail, 0, skinId);

    // Falling Winter Snowflakes
    const snowCount = quality === 'low' ? 16 : quality === 'medium' ? 28 : quality === 'ultra' ? 56 : 40;
    for (let i = 0; i < snowCount; i++) {
      const fx = ((i * 31 + Math.sin(time * 1.4 + i) * 16 + time * 10) % LOGICAL_WIDTH + LOGICAL_WIDTH) % LOGICAL_WIDTH;
      const fy = (i * 23 + time * (18 + (i % 4) * 6)) % (14 * TILE_SIZE);
      ctx.globalAlpha = 0.55 + Math.sin(time * 3 + i) * 0.35;
      px(ctx, fx, fy, i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2, i % 3 === 0 ? '#bae6fd' : '#ffffff');
    }
    ctx.globalAlpha = 1;
    return;
  }

  // Sky bands
  const bands = 16;
  const bandH = Math.ceil(LOGICAL_HEIGHT / bands);
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = lerpHex(season.skyTop, season.skyBottom, i / (bands - 1));
    ctx.fillRect(0, i * bandH, LOGICAL_WIDTH, bandH + 1);
  }

  // Far parallax landmarks per season
  const farOff = -(camX * 0.14) % 120;
  for (let x = farOff - 120; x < LOGICAL_WIDTH + 120; x += 120) {
    if (month === 1) {
      px(ctx, x + 18, 96, 36, 174, season.farColor);
      px(ctx, x + 28, 72, 16, 24, '#38bdf8');
      px(ctx, x + 33, 56, 6, 16, '#e0f2fe');
      px(ctx, x + 78, 128, 24, 142, season.midColor);
    } else if (month === 2) {
      px(ctx, x + 22, 108, 28, 162, season.farColor);
      px(ctx, x + 70, 126, 32, 144, season.midColor);
      px(ctx, x + 30, 84, 5, 5, '#f472b6');
      px(ctx, x + 37, 84, 5, 5, '#f472b6');
      px(ctx, x + 32, 88, 8, 5, '#ec4899');
    } else if (month === 3 || month === 4 || month === 5) {
      px(ctx, x + 10, 140, 80, 130, season.farColor);
      px(ctx, x + 42, 114, 12, 156, '#5b3a29');
      px(ctx, x + 26, 92, 44, 28, month === 4 ? '#f9a8d4' : '#22c55e');
      if (month === 3) {
        px(ctx, x + 34, 96, 6, 6, '#fde047');
        px(ctx, x + 52, 102, 6, 6, '#f43f5e');
      }
    } else if (month === 6 || month === 7) {
      if (month === 6) {
        px(ctx, x + 10, 170, 100, 30, '#0369a1');
        px(ctx, x + 28, 148, 64, 24, season.farColor);
      } else {
        for (let r = 0; r < 46; r += 4) {
          px(ctx, x + 56 - r, 132 + r, r * 2, 4, season.farColor);
        }
      }
      px(ctx, x + 78, 122, 6, 120, '#451a03');
      px(ctx, x + 64, 116, 34, 6, '#15803d');
    } else if (month === 8) {
      px(ctx, x + 8, 84, 28, 186, '#1e1b4b');
      px(ctx, x + 44, 64, 34, 206, '#312e81');
      px(ctx, x + 84, 106, 26, 164, '#1e1b4b');
      px(ctx, x + 10, 84, 24, 2, '#22d3ee');
      px(ctx, x + 46, 64, 30, 2, '#f43f5e');
      px(ctx, x + 54, 84, 12, 6, '#fde047');
    } else if (month === 9) {
      px(ctx, x + 12, 88, 42, 182, '#334155');
      px(ctx, x + 16, 98, 34, 6, '#fbbf24');
      px(ctx, x + 16, 118, 34, 6, '#60a5fa');
      px(ctx, x + 74, 112, 26, 158, '#475569');
    } else if (month === 10) {
      px(ctx, x + 16, 94, 32, 176, '#1f0c33');
      px(ctx, x + 26, 70, 12, 24, '#2e1065');
      px(ctx, x + 30, 82, 4, 10, '#f97316');
      px(ctx, x + 76, 206, 16, 14, '#ea580c');
      px(ctx, x + 83, 202, 2, 4, '#22c55e');
      px(ctx, x + 79, 210, 3, 3, '#fde047');
      px(ctx, x + 86, 210, 3, 3, '#fde047');
    } else if (month === 11) {
      px(ctx, x + 28, 134, 12, 136, '#451a03');
      px(ctx, x + 10, 96, 48, 42, '#b45309');
      px(ctx, x + 18, 104, 32, 24, '#f59e0b');
      px(ctx, x + 80, 148, 10, 122, '#451a03');
      px(ctx, x + 66, 118, 38, 34, '#d97706');
    } else {
      px(ctx, x + 46, 208, 8, 22, '#451a03');
      for (let t = 0; t < 4; t++) {
        const w = 16 + t * 12;
        px(ctx, x + 50 - w / 2, 124 + t * 20, w, 20, '#14532d');
      }
      px(ctx, x + 47, 116, 6, 6, '#fde047');
      const blink = Math.floor(time * 3) % 2 === 0;
      px(ctx, x + 42, 152, 3, 3, blink ? '#ef4444' : '#38bdf8');
      px(ctx, x + 56, 168, 3, 3, blink ? '#fde047' : '#ef4444');
      px(ctx, x + 26, 210, 14, 12, '#ef4444');
      px(ctx, x + 32, 210, 2, 12, '#fde047');
      px(ctx, x + 64, 212, 12, 10, '#38bdf8');
      px(ctx, x + 69, 212, 2, 10, '#ffffff');
    }
  }

  if (month === 6 || month === 7 || month === 3 || month === 5) {
    px(ctx, 370, 24, 28, 28, '#fde047');
    px(ctx, 375, 29, 18, 18, '#fef9c3');
  } else if (month === 10 || month === 12 || month === 1) {
    px(ctx, 370, 24, 26, 26, '#f8fafc');
    px(ctx, 374, 28, 18, 18, '#e2e8f0');
  }

  for (let gx = 0; gx < LOGICAL_WIDTH; gx += TILE_SIZE) {
    px(ctx, gx, 14 * TILE_SIZE, TILE_SIZE, 4, season.groundTop);
    px(ctx, gx, 14 * TILE_SIZE + 4, TILE_SIZE, 36, season.groundBody);
    px(ctx, gx + 4, 14 * TILE_SIZE + 9, 5, 4, season.farColor);
  }

  const wx = 310;
  const wy = 158;
  const webAnchors = [
    { x: 310, y: 0 },
    { x: 430, y: 84 },
    { x: 368, y: 14 * TILE_SIZE },
    { x: 252, y: 14 * TILE_SIZE },
    { x: 185, y: 98 },
  ];
  drawStylizedWeb(
    ctx,
    wx,
    wy,
    webAnchors,
    [9, 18, 27, 36],
    webDesignId || (skin.id !== 'classic' ? 'classic_white' : 'classic_white'),
    time,
    quality,
    1,
    false
  );

  const spX = 118;
  const hop = Math.max(0, Math.sin(time * 2.4)) * 11;
  const spY = 14 * TILE_SIZE - 6 - hop;
  const trail = Array.from({ length: 5 }, (_, i) => ({
    x: spX - 4 - i * 3,
    y: spY + 1 + Math.sin(time * 7 + i) * 1.2,
  }));
  drawSpikey(ctx, spX, spY, 1, hop > 2 ? 'jump' : 'walk', time, trail, 0, skinId);

  const pCount = quality === 'low' ? 12 : quality === 'ultra' ? 32 : 24;
  for (let i = 0; i < pCount; i++) {
    const downParticle = month === 1 || month === 4 || month === 11 || month === 12;
    const fx = downParticle
      ? ((i * 39 + Math.sin(time * 1.5 + i) * 14 + time * 8) % LOGICAL_WIDTH + LOGICAL_WIDTH) % LOGICAL_WIDTH
      : ((i * 53 + time * (11 + (i % 4) * 3)) % LOGICAL_WIDTH);
    const fy = downParticle
      ? ((i * 29 + time * (22 + (i % 3) * 8)) % (14 * TILE_SIZE))
      : 40 + ((i * 33) % 165) + Math.sin(time * 2.3 + i) * 7;

    ctx.globalAlpha = 0.5 + Math.sin(time * 4 + i) * 0.35;
    const col = i % 3 === 0 ? season.secondaryParticleColor : season.particleColor;
    if (month === 2) {
      px(ctx, fx, fy, 2, 2, col);
      px(ctx, fx + 2, fy, 2, 2, col);
      px(ctx, fx + 1, fy + 2, 2, 1, col);
    } else {
      px(ctx, fx, fy, i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2, col);
    }
  }
  ctx.globalAlpha = 1;
}
