import { audio } from './audio';
import {
  drawBoss,
  drawEnemy,
  drawParallaxBackground,
  drawSpikey,
  drawStylizedWeb,
  drawTile,
  resolveWebStrokeColor,
} from './sprites';
import { getSkinById } from './skins';
import { getWebDesignById } from './webDesigns';
import {
  ABILITY_META,
  AbilityId,
  BossType,
  EnemyType,
  GraphicsQuality,
  HudSnapshot,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  SaveData,
  SpecialAbilityId,
  SpikeyAnimState,
  StageClearSummary,
  StageDef,
  TILE_SIZE,
  TileKind,
  WORLD_THEMES,
} from './types';

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  sprint: boolean;
  webAttack: boolean;
  special: boolean;
  interact: boolean;
  webSwing: boolean;
  webNet: boolean;
  // Edge flags consumed per fixed step
  jumpPressed: boolean;
  sprintPressed: boolean;
  webAttackPressed: boolean;
  specialPressed: boolean;
  interactPressed: boolean;
  webSwingPressed: boolean;
  webNetPressed: boolean;
}

interface MovingPlatformRuntime {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
  speed: number;
  t: number;
}

interface CrumbleTileRuntime {
  tx: number;
  ty: number;
  state: 'solid' | 'shaking' | 'gone';
  timer: number;
}

interface EnemyRuntime {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  originX: number;
  originY: number;
  patrolDist: number;
  grounded: boolean;
  aiTimer: number;
  attackTimer: number;
  isAttacking: boolean;
  hitFlash: number;
  slowTimer: number;
  dead: boolean;
}

interface BossRuntime {
  type: BossType;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  phase: 1 | 2 | 3;
  state: 'idle' | 'warn' | 'attack' | 'recover' | 'defeated';
  stateTimer: number;
  patternIndex: number;
  hitFlash: number;
  slowTimer: number;
  defeatTimer: number;
}

interface ProjectileRuntime {
  fromPlayer: boolean;
  kind: 'web' | 'poison' | 'crystal' | 'stinger' | 'ice' | 'shadow';
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  damage: number;
  life: number;
  color: string;
}

interface WebTrapRuntime {
  x: number;
  y: number;
  r: number;
  life: number;
  tickTimer: number;
}

interface CraftedWebRuntime {
  cx: number;
  cy: number;
  hw: number;
  hh: number;
  radius: number;
  walkableY: number;
  anchors: { x: number; y: number }[];
  buildProgress: number;
  charms: { x: number; y: number; color: string }[];
}

interface CollectibleRuntime {
  kind: 'coin' | 'crystal' | 'heart' | 'chest';
  x: number;
  y: number;
  crystalIndex?: number;
  secret?: boolean;
  collected: boolean;
  bobOffset: number;
}

interface CrateRuntime {
  x: number;
  y: number;
  w: number;
  h: number;
  loot: 'coin' | 'heart' | 'none';
  broken: boolean;
}

interface ShrineRuntime {
  ability: AbilityId;
  x: number;
  y: number;
  title: string;
  description: string;
  activated: boolean;
}

interface FallingRockRuntime {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vy: number;
  state: 'idle' | 'warn' | 'falling' | 'reset';
  timer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity?: number;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onStageClear: (summary: StageClearSummary) => void;
  onGameOver: (score: number, coins: number) => void;
  onSaveProgress: (updater: (save: SaveData) => void) => void;
}

export class GameEngine {
  private stage: StageDef;
  private tiles: TileKind[][];
  private save: SaveData;
  private callbacks: EngineCallbacks;

  private time = 0;
  private elapsedSec = 0;
  private finished = false;
  private stageCleared = false;

  // Player state
  private px: number;
  private py: number;
  private pvx = 0;
  private pvy = 0;
  private readonly pw = 12;
  private readonly ph = 12;
  private facing: 1 | -1 = 1;
  private hp = 4;
  private maxHp = 4;
  private lives = 5;
  private grounded = false;
  private onIce = false;
  private onWall: -1 | 0 | 1 = 0;
  private onClimbable = false;
  private climbing = false;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private doubleJumpUsed = false;
  private landAnimTimer = 0;
  private attackAnimTimer = 0;
  private invulnTimer = 0;
  private dashTimer = 0;
  private dashCooldown = 0;
  private webCooldown = 0;
  private trapCooldown = 0;
  private magicCooldown = 0;
  private hurtTimer = 0;
  private deathTimer = 0;
  private victoryTimer = 0;
  private portalCooldown = 0;
  private tookDamageInStage = false;
  private animState: SpikeyAnimState = 'idle';
  private animTime = 0;
  private scarfTrail: { x: number; y: number }[] = [];

  // Swinging & Crafted Web state
  private swingAnchor: { x: number; y: number } | null = null;
  private swingLength = 48;
  private swingAngle = 0;
  private swingAngVel = 0;
  private webClimbing = false;
  private webRegrabCooldown = 0;
  private holdingDown = false;

  // Checkpoints & respawns
  private respawnX: number;
  private respawnY: number;
  private activatedCheckpoints: Set<number> = new Set();

  // Camera
  private camX = 0;
  private camY = 0;
  private shakeTimer = 0;
  private shakeIntensity = 0;

  // Entities
  private movingPlatforms: MovingPlatformRuntime[] = [];
  private crumbleTiles: Map<string, CrumbleTileRuntime> = new Map();
  private enemies: EnemyRuntime[] = [];
  private boss: BossRuntime | null = null;
  private projectiles: ProjectileRuntime[] = [];
  private webTraps: WebTrapRuntime[] = [];
  private craftedWebs: CraftedWebRuntime[] = [];
  private collectibles: CollectibleRuntime[] = [];
  private crates: CrateRuntime[] = [];
  private shrines: ShrineRuntime[] = [];
  private fallingRocks: FallingRockRuntime[] = [];
  private particles: Particle[] = [];
  private ambientParticles: AmbientParticle[] = [];
  private floatingTexts: FloatingText[] = [];
  private revealedSecrets: Set<string> = new Set();

  // Session tallies
  private coinsEarned = 0;
  private crystalsCollected: boolean[] = [false, false, false];
  private scoreEarned = 0;
  private enemiesDefeatedInStage = 0;
  private newlyUnlockedAbility: AbilityId | null = null;
  private bannerText: string | null = null;
  private bannerTimer = 0;
  private promptHint: string | null = null;
  private nextEntityId = 1;
  private hudSyncCounter = 0;
  private magicWaveRadius = 0;
  private magicWaveCenter: { x: number; y: number } | null = null;
  private equippedSkinId = 'classic';
  private equippedWebDesignId = 'classic_white';
  private graphicsQuality: GraphicsQuality = 'high';

  constructor(
    stage: StageDef,
    save: SaveData,
    callbacks: EngineCallbacks,
    equippedSkinId = 'classic',
    equippedWebDesignId = 'classic_white',
    graphicsQuality: GraphicsQuality = 'high'
  ) {
    this.stage = stage;
    this.save = structuredClone(save);
    this.callbacks = callbacks;
    this.equippedSkinId = equippedSkinId || 'classic';
    this.equippedWebDesignId = equippedWebDesignId || 'classic_white';
    this.graphicsQuality = graphicsQuality || 'high';

    // Clone tiles so secret false walls or breakable changes don't mutate template
    this.tiles = stage.tiles.map((row) => [...row]);

    this.px = stage.spawn.x;
    this.py = stage.spawn.y;
    this.respawnX = stage.spawn.x;
    this.respawnY = stage.spawn.y;
    this.lives = Math.max(1, save.lives);

    for (let i = 0; i < 6; i++) {
      this.scarfTrail.push({ x: this.px, y: this.py });
    }

    this.initStageEntities();
    this.initAmbientParticles();
    this.updateCamera(1);

    if (stage.tutorialHint) {
      this.showBanner(stage.tutorialHint, 4.2);
    }

    // Start stage music
    const theme = WORLD_THEMES[stage.worldId];
    audio.playMusic(stage.isBossStage ? 'boss' : theme.musicKey);
    this.emitHud();
  }

  private initStageEntities(): void {
    // Moving platforms
    this.movingPlatforms = this.stage.movingPlatforms.map((mp) => ({
      baseX: mp.x,
      baseY: mp.y,
      x: mp.x,
      y: mp.y,
      prevX: mp.x,
      prevY: mp.y,
      w: mp.w,
      h: 8,
      dx: mp.dx,
      dy: mp.dy,
      speed: mp.speed,
      t: 0,
    }));

    // Crumble tiles
    for (let ty = 0; ty < this.stage.heightTiles; ty++) {
      for (let tx = 0; tx < this.stage.widthTiles; tx++) {
        if (this.tiles[ty][tx] === 8) {
          this.crumbleTiles.set(`${tx},${ty}`, {
            tx,
            ty,
            state: 'solid',
            timer: 0,
          });
        }
      }
    }

    // Enemies
    this.enemies = this.stage.enemies.map((e) => {
      const stats = this.getEnemyBaseStats(e.type);
      return {
        id: this.nextEntityId++,
        type: e.type,
        x: e.x,
        y: e.y,
        vx: 0,
        vy: 0,
        w: stats.w,
        h: stats.h,
        hp: stats.hp,
        maxHp: stats.hp,
        facing: -1,
        originX: e.x,
        originY: e.y,
        patrolDist: e.patrolDist ?? 48,
        grounded: false,
        aiTimer: Math.random() * 1.5,
        attackTimer: 0,
        isAttacking: false,
        hitFlash: 0,
        slowTimer: 0,
        dead: false,
      };
    });

    // Boss
    if (this.stage.isBossStage && this.stage.bossType) {
      const bossHpMap: Record<BossType, number> = {
        mushroomKing: 18,
        caveDestroyer: 24,
        desertScorpion: 28,
        iceDragon: 34,
        shadowSpiderKing: 42,
      };
      const maxHp = bossHpMap[this.stage.bossType];
      this.boss = {
        type: this.stage.bossType,
        name: this.stage.bossName ?? 'Guardian Boss',
        x: 22 * TILE_SIZE,
        y: this.stage.bossType === 'iceDragon' || this.stage.bossType === 'caveDestroyer' ? 9 * TILE_SIZE : 14 * TILE_SIZE,
        vx: 0,
        vy: 0,
        w: 36,
        h: 36,
        hp: maxHp,
        maxHp,
        facing: -1,
        phase: 1,
        state: 'idle',
        stateTimer: 1.3,
        patternIndex: 0,
        hitFlash: 0,
        slowTimer: 0,
        defeatTimer: 0,
      };
    }

    // Collectibles
    this.collectibles = this.stage.collectibles.map((c, idx) => ({
      ...c,
      collected: false,
      bobOffset: idx * 0.7,
    }));

    // Crates
    this.crates = this.stage.crates.map((cr) => ({
      x: cr.x,
      y: cr.y,
      w: 14,
      h: 14,
      loot: cr.loot,
      broken: false,
    }));

    // Shrines
    this.shrines = this.stage.shrines.map((sh) => ({
      ...sh,
      activated: this.save.unlockedAbilities[sh.ability],
    }));

    // Falling Rocks
    this.fallingRocks = this.stage.fallingRocks.map((fr) => ({
      originX: fr.x,
      originY: fr.y,
      x: fr.x,
      y: fr.y,
      vy: 0,
      state: 'idle',
      timer: 0,
    }));
  }

  private getEnemyBaseStats(type: EnemyType): { w: number; h: number; hp: number } {
    switch (type) {
      case 'miniSlime':
        return { w: 12, h: 10, hp: 2 };
      case 'angryBeetle':
        return { w: 14, h: 10, hp: 3 };
      case 'flyingBat':
        return { w: 14, h: 10, hp: 2 };
      case 'poisonMushroom':
        return { w: 14, h: 14, hp: 3 };
      case 'skeletonSpider':
        return { w: 14, h: 10, hp: 3 };
      case 'shadowGhost':
        return { w: 12, h: 14, hp: 4 };
      case 'giantScorpion':
        return { w: 18, h: 14, hp: 5 };
    }
  }

  private initAmbientParticles(): void {
    const theme = WORLD_THEMES[this.stage.worldId];
    const count = theme.particleType === 'snow' || theme.particleType === 'sand' ? 36 : 22;
    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        x: Math.random() * LOGICAL_WIDTH,
        y: Math.random() * LOGICAL_HEIGHT,
        vx: theme.particleType === 'sand' ? -70 - Math.random() * 50 : (Math.random() - 0.5) * 18,
        vy:
          theme.particleType === 'embers'
            ? -18 - Math.random() * 20
            : theme.particleType === 'snow'
            ? 24 + Math.random() * 22
            : 10 + Math.random() * 14,
        size: theme.particleType === 'leaves' ? 2 : 1,
        alpha: 0.35 + Math.random() * 0.55,
      });
    }
  }

  public setActiveSpecial(special: SpecialAbilityId): void {
    if (this.save.unlockedAbilities[special]) {
      this.save.activeSpecial = special;
      this.callbacks.onSaveProgress((s) => {
        s.activeSpecial = special;
      });
      this.emitHud();
    }
  }

  public updateCosmetics(
    skinId: string,
    webDesignId: string,
    quality: GraphicsQuality
  ): void {
    this.equippedSkinId = skinId || 'classic';
    this.equippedWebDesignId = webDesignId || 'classic_white';
    this.graphicsQuality = quality || 'high';
  }

  public shootWebAtLogicalPoint(lx: number, ly: number): void {
    if (this.finished || this.stageCleared || this.deathTimer > 0) return;
    if (!this.save.unlockedAbilities.webSwing) return;

    if (this.swingAnchor) {
      const tangentSpeed = this.swingAngVel * this.swingLength;
      this.pvx = Math.cos(this.swingAngle) * tangentSpeed * 1.18 + this.facing * 35;
      this.pvy = Math.min(-195, -Math.abs(Math.sin(this.swingAngle) * tangentSpeed) - 110);
      this.swingAnchor = null;
      this.doubleJumpUsed = false;
      audio.playSfx('jump');
      this.spawnBurst(this.px, this.py, '#ffffff', 6, 55);
      this.emitHud();
      return;
    }

    const wx = lx + this.camX;
    const wy = ly + this.camY;
    const anchor = this.findAimedSwingAnchor(wx, wy) ?? this.findOrCreateSwingAnchor();
    if (!anchor) {
      this.addFloatingText(this.px, this.py - 16, 'TO‘R ILINISH JOYI YO‘Q', '#fca5a5');
      this.spawnBurst(this.px, this.py - 10, '#94a3b8', 4, 40);
      return;
    }
    this.attachWebToAnchor(anchor);
  }

  public toggleSpecial(): void {
    if (this.save.unlockedAbilities.webTrap && this.save.unlockedAbilities.magicWeb) {
      const next: SpecialAbilityId = this.save.activeSpecial === 'webTrap' ? 'magicWeb' : 'webTrap';
      this.setActiveSpecial(next);
      this.showBanner(`Maxsus qobiliyat: ${ABILITY_META[next].name}`, 1.6);
    }
  }

  private showBanner(text: string, duration = 2.5): void {
    this.bannerText = text;
    this.bannerTimer = duration;
  }

  private addShake(intensity: number, duration: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  private spawnBurst(x: number, y: number, color: string, count = 8, speed = 80): void {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const sp = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 20,
        size: Math.random() > 0.5 ? 2 : 1,
        color,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        gravity: 220,
      });
    }
  }

  private addFloatingText(x: number, y: number, text: string, color = '#fde047'): void {
    this.floatingTexts.push({ x, y, text, color, life: 0.95 });
  }

  public step(dt: number, input: InputState): void {
    if (this.finished) return;

    this.time += dt;
    if (!this.stageCleared) {
      this.elapsedSec += dt;
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.bannerText = null;
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) this.shakeIntensity = 0;
    }

    if (this.magicWaveRadius > 0) {
      this.magicWaveRadius += 280 * dt;
      if (this.magicWaveRadius > 110) {
        this.magicWaveRadius = 0;
        this.magicWaveCenter = null;
      }
    }

    // Handle Stage Clear Victory animation delay
    if (this.stageCleared) {
      this.victoryTimer += dt;
      this.animState = 'victory';
      this.animTime += dt;
      this.updateParticles(dt);
      this.updateFloatingTexts(dt);
      if (this.victoryTimer >= 1.35) {
        this.completeStage();
      }
      return;
    }

    // Handle Death sequence
    if (this.deathTimer > 0) {
      this.deathTimer -= dt;
      this.animState = 'death';
      this.animTime += dt;
      this.pvy += 600 * dt;
      this.py += this.pvy * dt;
      this.updateParticles(dt);
      if (this.deathTimer <= 0) {
        this.handleRespawnOrGameOver();
      }
      return;
    }

    // Cooldowns
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.webCooldown = Math.max(0, this.webCooldown - dt);
    this.trapCooldown = Math.max(0, this.trapCooldown - dt);
    this.magicCooldown = Math.max(0, this.magicCooldown - dt);
    this.portalCooldown = Math.max(0, this.portalCooldown - dt);
    this.landAnimTimer = Math.max(0, this.landAnimTimer - dt);
    this.attackAnimTimer = Math.max(0, this.attackAnimTimer - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.webRegrabCooldown = Math.max(0, this.webRegrabCooldown - dt);
    this.holdingDown = input.down;

    // Update Moving Platforms & Crumble tiles first
    this.updateMovingPlatforms(dt);
    this.updateCrumbleTiles(dt);

    // Advance Adaptive Spider House build animations
    for (const house of this.craftedWebs) {
      if (house.buildProgress < 1) {
        house.buildProgress = Math.min(1, house.buildProgress + dt / 0.55);
      }
    }

    // Player Movement & Abilities
    this.updatePlayer(dt, input);

    // Entities & Hazards
    this.updateFallingRocks(dt);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updateProjectiles(dt);
    this.updateWebTraps(dt);
    this.updateCollectiblesAndInteractions(input);
    this.updateParticles(dt);
    this.updateAmbientParticles(dt);
    this.updateFloatingTexts(dt);

    this.updateScarfTrail();
    this.updateCamera(dt);

    this.hudSyncCounter++;
    if (this.hudSyncCounter % 3 === 0) {
      this.emitHud();
    }
  }

  private updateMovingPlatforms(dt: number): void {
    for (const mp of this.movingPlatforms) {
      mp.prevX = mp.x;
      mp.prevY = mp.y;
      const dist = Math.hypot(mp.dx, mp.dy);
      if (dist > 0) {
        mp.t += (mp.speed * dt) / dist;
        const factor = (1 - Math.cos(mp.t * Math.PI)) * 0.5;
        mp.x = mp.baseX + mp.dx * factor;
        mp.y = mp.baseY + mp.dy * factor;
      }
    }
  }

  private updateCrumbleTiles(dt: number): void {
    for (const ct of this.crumbleTiles.values()) {
      if (ct.state === 'shaking') {
        ct.timer -= dt;
        if (ct.timer <= 0) {
          ct.state = 'gone';
          ct.timer = 2.6; // respawns after 2.6s
          this.spawnBurst(ct.tx * TILE_SIZE + 8, ct.ty * TILE_SIZE + 4, '#94a3b8', 6, 40);
        }
      } else if (ct.state === 'gone') {
        ct.timer -= dt;
        if (ct.timer <= 0) {
          ct.state = 'solid';
        }
      }
    }
  }

  private updatePlayer(dt: number, input: InputState): void {
    const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (moveDir !== 0 && this.dashTimer <= 0 && !this.swingAnchor) {
      this.facing = moveDir > 0 ? 1 : -1;
    }

    // Check nearby interactive prompts
    this.promptHint = null;
    let nearUnactivatedShrine = false;
    for (const sh of this.shrines) {
      if (!sh.activated && Math.hypot(this.px - sh.x, this.py - sh.y) < 26) {
        this.promptHint = `E bosing · ${sh.title.replace(' Unlocked!', '')}`;
        nearUnactivatedShrine = true;
      }
    }
    if (!this.promptHint && this.save.unlockedAbilities.webSwing && !this.swingAnchor) {
      const anchor = this.findNearestSwingAnchor();
      if (anchor) {
        this.promptHint = 'Q · To‘r Uchish';
      }
    }

    // Handle Free-Anywhere Web Swing attach / detach (Q) with strict Wall LOS
    if (this.save.unlockedAbilities.webSwing) {
      if (this.swingAnchor) {
        if (input.jumpPressed || input.webSwingPressed) {
          const tangentSpeed = this.swingAngVel * this.swingLength;
          this.pvx = Math.cos(this.swingAngle) * tangentSpeed * 1.2 + moveDir * 45;
          this.pvy = Math.min(-215, -Math.abs(Math.sin(this.swingAngle) * tangentSpeed) - 125);
          this.swingAnchor = null;
          this.doubleJumpUsed = false;
          audio.playSfx('jump');
          this.spawnBurst(this.px, this.py, '#ffffff', 6, 55);
          return;
        }
        // Reel rope up/down with W/S
        if (input.up) this.swingLength = Math.max(22, this.swingLength - 65 * dt);
        if (input.down) this.swingLength = Math.min(92, this.swingLength + 65 * dt);

        const gravTorque = -(820 / Math.max(24, this.swingLength)) * Math.sin(this.swingAngle);
        const pumpTorque = moveDir * 9.0;
        this.swingAngVel += (gravTorque + pumpTorque) * dt;
        this.swingAngVel *= 0.994;
        const nextAngle = Math.max(-1.42, Math.min(1.42, this.swingAngle + this.swingAngVel * dt));

        const candX = this.swingAnchor.x + Math.sin(nextAngle) * this.swingLength;
        const candY = this.swingAnchor.y + Math.cos(nextAngle) * this.swingLength;
        const hitCorner = [
          [candX - 5, candY - 5],
          [candX + 5, candY - 5],
          [candX - 5, candY + 5],
          [candX + 5, candY + 5],
        ].some(([hx, hy]) =>
          this.isSolidTile(this.getTile(Math.floor(hx / TILE_SIZE), Math.floor(hy / TILE_SIZE)))
        );
        if (!hitCorner) {
          this.swingAngle = nextAngle;
          this.px = candX;
          this.py = candY;
        } else {
          this.swingAngVel *= -0.35;
        }

        const maxW = this.stage.widthTiles * TILE_SIZE - TILE_SIZE;
        this.px = Math.max(TILE_SIZE + 6, Math.min(maxW - 6, this.px));
        this.pvx = 0;
        this.pvy = 0;
        this.animState = 'jump';
        this.animTime += dt;
        return;
      } else if (input.webSwingPressed) {
        const anchor = this.findOrCreateSwingAnchor();
        if (!anchor) {
          this.addFloatingText(this.px, this.py - 16, 'YUQORIDA JOY YO‘Q', '#fca5a5');
          this.spawnBurst(this.px, this.py - 8, '#94a3b8', 4, 45);
        } else {
          this.attachWebToAnchor(anchor);
          return;
        }
      }
    }

    // Adaptive Spider House Builder (E): weaves glowing shelter sized to open space!
    if (input.webNetPressed && !nearUnactivatedShrine) {
      this.buildAdaptiveSpiderHouse();
    }

    // Spider Dash
    if (
      input.sprintPressed &&
      this.save.unlockedAbilities.spiderDash &&
      this.dashCooldown <= 0 &&
      this.dashTimer <= 0
    ) {
      this.dashTimer = 0.17;
      this.dashCooldown = 0.85;
      this.pvx = this.facing * 310;
      this.pvy = 0;
      this.climbing = false;
      audio.playSfx('dash');
      this.addShake(1.5, 0.1);
      this.spawnBurst(this.px, this.py, '#f43f5e', 10, 90);
    }

    // Web Shot (J)
    if (input.webAttackPressed && this.webCooldown <= 0) {
      const design = getWebDesignById(this.equippedWebDesignId);
      this.webCooldown = 0.24;
      this.attackAnimTimer = 0.16;
      this.projectiles.push({
        fromPlayer: true,
        kind: 'web',
        x: this.px + this.facing * 8,
        y: this.py - 1,
        vx: this.facing * 290,
        vy: 0,
        r: 4,
        damage: 1,
        life: 1.1,
        color: resolveWebStrokeColor(design, this.time, 0, false),
      });
      audio.playSfx('webShoot');
    }

    // Special Ability (K): Web Trap or Magic Web
    if (input.specialPressed) {
      if (this.save.activeSpecial === 'magicWeb' && this.save.unlockedAbilities.magicWeb) {
        if (this.magicCooldown <= 0) {
          this.magicCooldown = 2.8;
          this.attackAnimTimer = 0.25;
          this.magicWaveRadius = 8;
          this.magicWaveCenter = { x: this.px, y: this.py };
          audio.playSfx('magicWeb');
          this.addShake(3.2, 0.22);
          this.spawnBurst(this.px, this.py, '#c084fc', 18, 150);
          // Fire 8-way magic silk bolts + immediate AoE damage
          for (let i = 0; i < 8; i++) {
            const ang = (Math.PI * 2 * i) / 8;
            this.projectiles.push({
              fromPlayer: true,
              kind: 'web',
              x: this.px,
              y: this.py,
              vx: Math.cos(ang) * 230,
              vy: Math.sin(ang) * 230,
              r: 5,
              damage: 2,
              life: 0.65,
              color: '#c084fc',
            });
          }
          // Immediate shockwave damage to nearby enemies/boss
          for (const e of this.enemies) {
            if (!e.dead && Math.hypot(e.x - this.px, e.y - this.py) < 95) {
              this.damageEnemy(e, 3, Math.sign(e.x - this.px) * 110);
            }
          }
          if (this.boss && this.boss.state !== 'defeated' && Math.hypot(this.boss.x - this.px, this.boss.y - this.py) < 105) {
            this.damageBoss(3);
          }
        }
      } else if (this.save.unlockedAbilities.webTrap) {
        if (this.trapCooldown <= 0) {
          this.trapCooldown = 3.2;
          this.attackAnimTimer = 0.2;
          this.webTraps.push({
            x: this.px + this.facing * 10,
            y: this.py + 3,
            r: 22,
            life: 6.0,
            tickTimer: 0.2,
          });
          audio.playSfx('webTrap');
          this.spawnBurst(this.px + this.facing * 10, this.py + 3, '#a855f7', 10, 65);
        }
      }
    }

    // Engage Web Climbing when inside a Crafted Web and pressing Up/Down
    const insideWeb = this.isInsideCraftedWeb();
    if (
      insideWeb &&
      this.webRegrabCooldown <= 0 &&
      this.dashTimer <= 0 &&
      (input.up || (input.down && !this.grounded))
    ) {
      this.webClimbing = true;
      this.climbing = false;
    }

    // Horizontal & Vertical velocity calculation
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.pvy = 0;
      this.webClimbing = false;
      if (Math.random() > 0.3) {
        this.particles.push({
          x: this.px,
          y: this.py,
          vx: 0,
          vy: 0,
          size: 4,
          color: 'rgba(244, 63, 94, 0.55)',
          life: 0.14,
          maxLife: 0.14,
        });
      }
    } else if (this.webClimbing && insideWeb) {
      // 4-way climbing & walking inside the crafted spider web
      this.pvx = moveDir * 92;
      const climbDir = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      this.pvy = climbDir * 92;
      this.doubleJumpUsed = false;
      if (input.down && this.grounded) {
        this.webClimbing = false;
      }
    } else if (this.climbing && this.save.unlockedAbilities.wallClimb && this.onClimbable) {
      // Wall Climb state
      this.pvx = moveDir * 70;
      const climbDir = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      this.pvy = climbDir * 95;
      this.doubleJumpUsed = false;

      if (!this.onClimbable || (!input.up && !input.down && this.grounded)) {
        this.climbing = false;
      }
    } else {
      this.webClimbing = false;
      // Standard horizontal run / walk / ice physics
      const maxSpeed = input.sprint ? 168 : 116;
      const targetVx = moveDir * maxSpeed;
      const accel = this.grounded ? (this.onIce ? 260 : 980) : 640;
      const decel = this.grounded ? (this.onIce ? 95 : 1120) : 340;

      if (moveDir !== 0) {
        if (this.pvx < targetVx) {
          this.pvx = Math.min(targetVx, this.pvx + accel * dt);
        } else if (this.pvx > targetVx) {
          this.pvx = Math.max(targetVx, this.pvx - accel * dt);
        }
      } else {
        if (this.pvx > 0) this.pvx = Math.max(0, this.pvx - decel * dt);
        if (this.pvx < 0) this.pvx = Math.min(0, this.pvx + decel * dt);
      }

      // Gravity & Wall Slide
      let gravity = 820;
      if (this.onWall !== 0 && !this.grounded && this.pvy > 0 && moveDir === this.onWall) {
        // Wall sliding!
        this.pvy = Math.min(this.pvy + 220 * dt, 58);
        if (Math.random() > 0.65) {
          this.particles.push({
            x: this.px + this.onWall * 6,
            y: this.py,
            vx: -this.onWall * 15,
            vy: -10,
            size: 1,
            color: '#cbd5e1',
            life: 0.2,
            maxLife: 0.2,
          });
        }
      } else {
        this.pvy = Math.min(340, this.pvy + gravity * dt);
      }

      // Variable jump cut when releasing SPACE while rising
      if (!input.jump && this.pvy < -110) {
        this.pvy *= 0.62;
      }
    }

    // Start climbing if touching climbable wall and pressing UP
    if (this.onClimbable && this.save.unlockedAbilities.wallClimb && (input.up || (input.down && !this.grounded))) {
      this.climbing = true;
      this.pvy = 0;
    }

    // Coyote time & Jump buffer
    if (this.grounded) {
      this.coyoteTimer = 0.11;
      this.doubleJumpUsed = false;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (input.jumpPressed) {
      this.jumpBufferTimer = 0.12;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    // Jump execution
    if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0 || this.climbing || this.webClimbing) {
        this.pvy = -285;
        this.grounded = false;
        this.climbing = false;
        if (this.webClimbing) {
          this.webClimbing = false;
          this.webRegrabCooldown = 0.18;
        }
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        audio.playSfx('jump');
        this.spawnBurst(this.px, this.py + 5, '#e2e8f0', 5, 45);
      } else if (this.onWall !== 0) {
        // Wall Jump!
        this.pvy = -275;
        this.pvx = -this.onWall * 165;
        this.facing = (-this.onWall) as 1 | -1;
        this.jumpBufferTimer = 0;
        audio.playSfx('jump');
        this.spawnBurst(this.px + this.onWall * 6, this.py, '#bae6fd', 6, 60);
      } else if (this.save.unlockedAbilities.doubleJump && !this.doubleJumpUsed) {
        // Double Jump!
        this.pvy = -265;
        this.doubleJumpUsed = true;
        this.jumpBufferTimer = 0;
        this.animTime = 0;
        audio.playSfx('doubleJump');
        this.spawnBurst(this.px, this.py + 4, '#38bdf8', 8, 65);
      }
    }

    // Apply movement with axis-separated swept AABB tile collision
    const wasGrounded = this.grounded;
    this.moveAndCollidePlayer(dt);

    if (!wasGrounded && this.grounded && this.pvy >= 0) {
      this.landAnimTimer = 0.12;
      audio.playSfx('land');
      this.spawnBurst(this.px, this.py + 6, '#94a3b8', 4, 35);
    }

    // Determine Spikey Animation State (all 12 states!)
    this.animTime += dt;
    if (this.hurtTimer > 0) {
      this.animState = 'hurt';
    } else if (this.attackAnimTimer > 0) {
      this.animState = this.webCooldown > 0.1 ? 'webShoot' : 'attack';
    } else if (this.webClimbing) {
      this.animState = Math.abs(this.pvx) > 8 || Math.abs(this.pvy) > 8 ? 'walk' : 'idle';
    } else if (!this.grounded) {
      if (this.pvy < 0) {
        this.animState = this.doubleJumpUsed ? 'doubleJump' : 'jump';
      } else {
        this.animState = 'fall';
      }
    } else if (this.landAnimTimer > 0) {
      this.animState = 'land';
    } else if (Math.abs(this.pvx) > 132) {
      this.animState = 'run';
    } else if (Math.abs(this.pvx) > 12) {
      this.animState = 'walk';
    } else {
      this.animState = 'idle';
    }
  }

  private moveAndCollidePlayer(dt: number): void {
    // Horizontal move
    this.px += this.pvx * dt;
    this.onWall = 0;
    this.onClimbable = false;

    const minTy = Math.floor((this.py - this.ph / 2 + 1) / TILE_SIZE);
    const maxTy = Math.floor((this.py + this.ph / 2 - 1) / TILE_SIZE);

    if (this.pvx > 0) {
      const rightTx = Math.floor((this.px + this.pw / 2) / TILE_SIZE);
      for (let ty = minTy; ty <= maxTy; ty++) {
        const t = this.getTile(rightTx, ty);
        if (t === 5) this.onClimbable = true;
        if (t === 6) this.revealSecretWall(rightTx, ty);
        if (this.isSolidTile(t)) {
          this.px = rightTx * TILE_SIZE - this.pw / 2 - 0.01;
          this.pvx = 0;
          this.onWall = 1;
          break;
        }
      }
    } else if (this.pvx < 0) {
      const leftTx = Math.floor((this.px - this.pw / 2) / TILE_SIZE);
      for (let ty = minTy; ty <= maxTy; ty++) {
        const t = this.getTile(leftTx, ty);
        if (t === 5) this.onClimbable = true;
        if (t === 6) this.revealSecretWall(leftTx, ty);
        if (this.isSolidTile(t)) {
          this.px = (leftTx + 1) * TILE_SIZE + this.pw / 2 + 0.01;
          this.pvx = 0;
          this.onWall = -1;
          break;
        }
      }
    }

    // Check overlapping climbable tiles even when stationary
    const centerTx = Math.floor(this.px / TILE_SIZE);
    const centerTy = Math.floor(this.py / TILE_SIZE);
    if (
      this.getTile(centerTx, centerTy) === 5 ||
      this.getTile(centerTx - 1, centerTy) === 5 ||
      this.getTile(centerTx + 1, centerTy) === 5
    ) {
      this.onClimbable = true;
    }

    // Vertical move
    const prevBottom = this.py + this.ph / 2;
    this.py += this.pvy * dt;
    this.grounded = false;
    this.onIce = false;

    const minTx = Math.floor((this.px - this.pw / 2 + 1) / TILE_SIZE);
    const maxTx = Math.floor((this.px + this.pw / 2 - 1) / TILE_SIZE);

    if (this.pvy >= 0) {
      const bottomTy = Math.floor((this.py + this.ph / 2) / TILE_SIZE);
      for (let tx = minTx; tx <= maxTx; tx++) {
        const t = this.getTile(tx, bottomTy);
        if (t === 6) this.revealSecretWall(tx, bottomTy);
        if (t === 7) {
          // Bouncy mushroom!
          this.py = bottomTy * TILE_SIZE - this.ph / 2 - 0.01;
          this.pvy = -375;
          this.doubleJumpUsed = false;
          audio.playSfx('bounce');
          this.spawnBurst(this.px, bottomTy * TILE_SIZE, '#ef4444', 8, 75);
          return;
        }
        const isOneWay = t === 2 || (t === 8 && this.isCrumbleSolid(tx, bottomTy));
        const oneWayHit = isOneWay && prevBottom <= bottomTy * TILE_SIZE + 5;
        if (this.isSolidTile(t) || oneWayHit) {
          this.py = bottomTy * TILE_SIZE - this.ph / 2 - 0.01;
          this.pvy = 0;
          this.grounded = true;
          if (t === 4) this.onIce = true;
          if (t === 8) {
            const ct = this.crumbleTiles.get(`${tx},${bottomTy}`);
            if (ct && ct.state === 'solid') {
              ct.state = 'shaking';
              ct.timer = 0.55;
            }
          }
          break;
        }
      }
    } else if (this.pvy < 0) {
      const topTy = Math.floor((this.py - this.ph / 2) / TILE_SIZE);
      for (let tx = minTx; tx <= maxTx; tx++) {
        const t = this.getTile(tx, topTy);
        if (t === 6) this.revealSecretWall(tx, topTy);
        if (this.isSolidTile(t)) {
          this.py = (topTy + 1) * TILE_SIZE + this.ph / 2 + 0.01;
          this.pvy = 0;
          break;
        }
      }
    }

    // Moving platform riding & Crafted Web top-surface walking
    if (this.pvy >= 0 && !this.webClimbing) {
      for (const mp of this.movingPlatforms) {
        const withinX = this.px + this.pw / 2 > mp.x && this.px - this.pw / 2 < mp.x + mp.w;
        const landedOnTop =
          prevBottom <= mp.prevY + 6 && this.py + this.ph / 2 >= mp.y - 1;
        if (withinX && landedOnTop) {
          this.py = mp.y - this.ph / 2 - 0.01;
          this.px += mp.x - mp.prevX;
          this.pvy = 0;
          this.grounded = true;
          break;
        }
      }

      if (!this.grounded && !this.holdingDown && this.webRegrabCooldown <= 0) {
        for (const w of this.craftedWebs) {
          const withinX = Math.abs(this.px - w.cx) <= w.hw + 2;
          const landedOnWeb =
            prevBottom <= w.walkableY + 6 && this.py + this.ph / 2 >= w.walkableY - 1;
          if (withinX && landedOnWeb) {
            this.py = w.walkableY - this.ph / 2 - 0.01;
            this.pvy = 0;
            this.grounded = true;
            break;
          }
        }
      }
    }

    // Check hazards: Spikes (3) and World 3/5 Water/Acid (9)
    const pLeft = Math.floor((this.px - 4) / TILE_SIZE);
    const pRight = Math.floor((this.px + 4) / TILE_SIZE);
    const pTop = Math.floor((this.py - 4) / TILE_SIZE);
    const pBot = Math.floor((this.py + 5) / TILE_SIZE);

    for (let ty = pTop; ty <= pBot; ty++) {
      for (let tx = pLeft; tx <= pRight; tx++) {
        const t = this.getTile(tx, ty);
        if (t === 3) {
          this.damagePlayer(1, this.px < tx * TILE_SIZE + 8 ? -140 : 140, -210);
          return;
        }
        if (t === 9 && (this.stage.worldId === 3 || this.stage.worldId === 5)) {
          this.damagePlayer(1, 0, -290);
          return;
        }
      }
    }

    // Keep inside world horizontal bounds
    const maxW = this.stage.widthTiles * TILE_SIZE - TILE_SIZE;
    this.px = Math.max(TILE_SIZE + 6, Math.min(maxW - 6, this.px));
    if (this.py > this.stage.heightTiles * TILE_SIZE + 24) {
      this.damagePlayer(4, 0, 0);
    }
  }

  private getTile(tx: number, ty: number): TileKind {
    if (ty < 0 || ty >= this.stage.heightTiles || tx < 0 || tx >= this.stage.widthTiles) {
      return 1;
    }
    return this.tiles[ty][tx];
  }

  private isSolidTile(t: TileKind): boolean {
    return t === 1 || t === 4;
  }

  private isCrumbleSolid(tx: number, ty: number): boolean {
    const ct = this.crumbleTiles.get(`${tx},${ty}`);
    return !ct || ct.state !== 'gone';
  }

  private revealSecretWall(tx: number, ty: number): void {
    const key = `${tx},${ty}`;
    if (this.revealedSecrets.has(key)) return;
    // Clear connected secret wall column/cluster
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = tx + dx;
        const ny = ty + dy;
        if (this.getTile(nx, ny) === 6) {
          this.tiles[ny][nx] = 0;
          this.revealedSecrets.add(`${nx},${ny}`);
          this.spawnBurst(nx * TILE_SIZE + 8, ny * TILE_SIZE + 8, '#fde047', 6, 65);
        }
      }
    }
    this.addFloatingText(this.px, this.py - 16, 'YASHIRIN YO‘L!', '#fde047');
    audio.playSfx('checkpoint');
    this.callbacks.onSaveProgress((s) => {
      s.secretsFoundTotal += 1;
    });
  }

  private hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const dist = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(2, Math.floor(dist / 4));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const sx = x1 + (x2 - x1) * t;
      const sy = y1 + (y2 - y1) * t;
      const tx = Math.floor(sx / TILE_SIZE);
      const ty = Math.floor(sy / TILE_SIZE);
      if (this.isSolidTile(this.getTile(tx, ty))) {
        return false;
      }
    }
    return true;
  }

  private attachWebToAnchor(anchor: { x: number; y: number }): void {
    const design = getWebDesignById(this.equippedWebDesignId);
    this.swingAnchor = anchor;
    const dx = this.px - anchor.x;
    const dy = Math.max(16, this.py - anchor.y);
    this.swingLength = Math.max(
      26,
      Math.min(86, Math.hypot(dx, dy) - (this.grounded ? 10 : 0))
    );
    this.swingAngle = Math.atan2(dx, dy);
    let initAngVel = (this.pvx / this.swingLength) * 0.95;
    if (Math.abs(initAngVel) < 2.4) {
      initAngVel = this.facing * 3.0;
    }
    this.swingAngVel = initAngVel;
    this.climbing = false;
    this.webClimbing = false;
    this.grounded = false;
    audio.playSfx('webSwing');
    this.spawnBurst(anchor.x, anchor.y, resolveWebStrokeColor(design, this.time, 0, false), 8, 60);
    this.emitHud();
  }

  private findNearestSwingAnchor(): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let bestDist = 112;
    for (const a of this.stage.swingAnchors) {
      const d = Math.hypot(this.px - a.x, this.py - a.y);
      if (d < bestDist && this.py >= a.y - 8 && this.hasLineOfSight(this.px, this.py - 4, a.x, a.y)) {
        best = a;
        bestDist = d;
      }
    }
    return best;
  }

  private findAimedSwingAnchor(wx: number, wy: number): { x: number; y: number } | null {
    const dx = wx - this.px;
    const dy = wy - (this.py - 4);
    const len = Math.hypot(dx, dy);
    if (len < 12) return null;
    const ux = dx / len;
    const uy = dy / len;
    if (uy > 0.2) return null; // Must aim upward or level
    for (let d = 14; d <= Math.min(148, len + 24); d += 4) {
      const rx = this.px + ux * d;
      const ry = this.py - 4 + uy * d;
      if (ry < 8) break;
      const t = this.getTile(Math.floor(rx / TILE_SIZE), Math.floor(ry / TILE_SIZE));
      if (this.isSolidTile(t) || t === 2) {
        return { x: rx, y: ry };
      }
    }
    return null;
  }

  private findOrCreateSwingAnchor(): { x: number; y: number } | null {
    const fixed = this.findNearestSwingAnchor();
    if (fixed) return fixed;

    // Check built Spider House roofs as valid attachment anchors
    for (const w of this.craftedWebs) {
      const ay = w.cy - w.hh * 0.5;
      const d = Math.hypot(this.px - w.cx, this.py - ay);
      if (d <= 120 && ay < this.py - 10 && this.hasLineOfSight(this.px, this.py - 4, w.cx, ay)) {
        return { x: w.cx, y: ay };
      }
    }

    // Raycast upward hemisphere biased toward facing direction; never passes through solid walls
    const dirs = [
      { dx: this.facing * 0.52, dy: -0.85 },
      { dx: this.facing * 0.25, dy: -0.97 },
      { dx: 0, dy: -1.0 },
      { dx: -this.facing * 0.35, dy: -0.94 },
      { dx: this.facing * 0.78, dy: -0.62 },
    ];
    for (const dir of dirs) {
      for (let dist = 16; dist <= 148; dist += 4) {
        const rx = this.px + dir.dx * dist;
        const ry = this.py - 4 + dir.dy * dist;
        if (ry <= 12) break;
        const tx = Math.floor(rx / TILE_SIZE);
        const ty = Math.floor(ry / TILE_SIZE);
        const tile = this.getTile(tx, ty);
        if (this.isSolidTile(tile) || tile === 2) {
          return { x: rx, y: ry };
        }
      }
    }

    return null;
  }

  private isInsideCraftedWeb(): boolean {
    for (const w of this.craftedWebs) {
      if (
        Math.abs(this.px - w.cx) <= w.hw + 4 &&
        Math.abs(this.py - w.cy) <= w.hh + 8
      ) {
        return true;
      }
    }
    return false;
  }

  private probeClearance(cx: number, cy: number, dx: number, dy: number, maxDist: number): number {
    for (let d = 4; d <= maxDist; d += 4) {
      const rx = cx + dx * d;
      const ry = cy + dy * d;
      const t = this.getTile(Math.floor(rx / TILE_SIZE), Math.floor(ry / TILE_SIZE));
      if (this.isSolidTile(t)) {
        return d - 4;
      }
    }
    return maxDist;
  }

  private buildAdaptiveSpiderHouse(): void {
    const startX = this.px;
    const probeBaseY = this.grounded ? this.py - 12 : this.py;

    const leftFree = this.probeClearance(startX, probeBaseY, -1, 0, 115);
    const rightFree = this.probeClearance(startX, probeBaseY, 1, 0, 115);
    const upFree = this.probeClearance(startX, probeBaseY, 0, -1, 115);
    const downFree = this.probeClearance(startX, probeBaseY, 0, 1, 115);

    const minHorizontal = Math.min(leftFree, rightFree);
    const minVertical = Math.min(upFree, downFree);

    // Center slightly away from adjacent walls if one side is tight
    const shiftX = Math.max(-14, Math.min(14, (rightFree - leftFree) * 0.25));
    const cx = startX + shiftX;
    const cy = Math.max(28, probeBaseY);

    // Adaptive house size scaled to available cavern/corner space with hard max cap
    const hw = Math.max(15, Math.min(38, Math.floor(14 + (leftFree + rightFree) * 0.14)));
    const hh = Math.max(12, Math.min(26, Math.floor(11 + (upFree + downFree) * 0.09)));

    // Ensure minimum clearance and prevent overlapping solid tiles inside core
    if (minHorizontal < 10 && leftFree + rightFree < 28) {
      this.addFloatingText(this.px, this.py - 16, 'JOY TOR!', '#fca5a5');
      return;
    }

    // Prevent overlapping crates, shrines, portals, collectibles, enemies, boss, or existing houses
    for (const existing of this.craftedWebs) {
      if (Math.abs(existing.cx - cx) < hw + existing.hw - 6 && Math.abs(existing.cy - cy) < hh + existing.hh - 4) {
        this.addFloatingText(this.px, this.py - 16, 'UY BU YERDA MAVJUD!', '#fde68a');
        return;
      }
    }
    const overlapsObj = (ox: number, oy: number, pad: number) =>
      Math.abs(ox - cx) < hw + pad && Math.abs(oy - cy) < hh + pad;

    if (
      this.crates.some((c) => !c.broken && overlapsObj(c.x, c.y, 6)) ||
      this.shrines.some((s) => overlapsObj(s.x, s.y, 10)) ||
      this.collectibles.some((c) => !c.collected && overlapsObj(c.x, c.y, 4)) ||
      this.enemies.some((e) => !e.dead && overlapsObj(e.x, e.y, 8)) ||
      (this.boss && this.boss.state !== 'defeated' && overlapsObj(this.boss.x, this.boss.y, 16)) ||
      (!this.stage.isBossStage && overlapsObj(this.stage.exit.x, this.stage.exit.y, 10))
    ) {
      this.addFloatingText(this.px, this.py - 16, 'OBYEKT BILAN TO‘QNASHDI!', '#fca5a5');
      return;
    }

    this.attackAnimTimer = 0.2;
    const walkableY = cy - Math.round(hh * 0.35);

    // 8 natural silk anchor cables stretching dynamically out to cavern boundaries (up to 115px in wide rooms!)
    const anchors: { x: number; y: number }[] = [];
    const spokeCount = 8;
    for (let i = 0; i < spokeCount; i++) {
      const ang = (Math.PI * 2 * i) / spokeCount - Math.PI / 2;
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      let endX = cx + cos * Math.min(115, hw * 2.2);
      let endY = cy + sin * Math.min(115, hh * 2.4);
      for (let d = 14; d <= 115; d += 4) {
        const rx = cx + cos * d;
        const ry = cy + sin * d;
        const tile = this.getTile(Math.floor(rx / TILE_SIZE), Math.floor(ry / TILE_SIZE));
        if (this.isSolidTile(tile) || tile === 2) {
          endX = rx;
          endY = ry;
          break;
        }
      }
      anchors.push({ x: endX, y: endY });
    }

    const design = getWebDesignById(this.equippedWebDesignId);
    const charms = [
      { x: cx - hw * 0.62, y: cy - hh * 0.2, color: design.primaryHex },
      { x: cx + hw * 0.62, y: cy - hh * 0.2, color: design.secondaryHex },
      { x: cx, y: cy - hh * 0.72, color: '#fde047' },
    ];

    if (this.craftedWebs.length >= 4) {
      this.craftedWebs.shift();
    }
    this.craftedWebs.push({
      cx,
      cy,
      hw,
      hh,
      radius: Math.round((hw + hh) * 0.5),
      walkableY,
      anchors,
      buildProgress: 0.05,
      charms,
    });

    if (!this.grounded && this.webRegrabCooldown <= 0) {
      this.webClimbing = true;
      this.climbing = false;
      this.pvy = 0;
      this.pvx *= 0.4;
      this.doubleJumpUsed = false;
    }

    audio.playSfx('houseWeave');
    this.spawnBurst(cx, cy, resolveWebStrokeColor(design, this.time, 0, false), 14, 65);
    if (minVertical > 0) {
      this.addFloatingText(cx, cy - hh - 8, 'O‘RGIMCHAK UYI!', design.secondaryHex);
    }
  }

  private updateFallingRocks(dt: number): void {
    for (const r of this.fallingRocks) {
      if (r.state === 'idle') {
        if (Math.abs(this.px - r.x) < 28 && this.py > r.y && this.py - r.y < 180) {
          r.state = 'warn';
          r.timer = 0.45;
        }
      } else if (r.state === 'warn') {
        r.timer -= dt;
        if (r.timer <= 0) {
          r.state = 'falling';
          r.vy = 40;
        }
      } else if (r.state === 'falling') {
        r.vy = Math.min(340, r.vy + 680 * dt);
        r.y += r.vy * dt;
        if (Math.hypot(this.px - r.x, this.py - r.y) < 12) {
          this.damagePlayer(1, 0, -180);
          r.state = 'reset';
          r.timer = 2.8;
          this.spawnBurst(r.x, r.y, '#94a3b8', 8, 70);
        } else {
          const ty = Math.floor((r.y + 6) / TILE_SIZE);
          const tx = Math.floor(r.x / TILE_SIZE);
          if (this.isSolidTile(this.getTile(tx, ty))) {
            r.state = 'reset';
            r.timer = 2.8;
            this.spawnBurst(r.x, r.y, '#64748b', 8, 70);
          }
        }
      } else if (r.state === 'reset') {
        r.timer -= dt;
        if (r.timer <= 0) {
          r.x = r.originX;
          r.y = r.originY;
          r.vy = 0;
          r.state = 'idle';
        }
      }
    }
  }

  private updateEnemies(dt: number): void {
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.slowTimer = Math.max(0, e.slowTimer - dt);
      e.aiTimer += dt;
      const spdMult = e.slowTimer > 0 ? 0.35 : 1;
      const distX = this.px - e.x;
      const distY = this.py - e.y;
      const dist = Math.hypot(distX, distY);

      switch (e.type) {
        case 'miniSlime': {
          e.vy = Math.min(280, e.vy + 760 * dt);
          if (e.grounded && e.aiTimer > 1.2) {
            e.aiTimer = 0;
            const dir = dist < 130 ? (distX >= 0 ? 1 : -1) : e.x > e.originX ? -1 : 1;
            e.facing = dir;
            e.vx = dir * 68 * spdMult;
            e.vy = -195;
            e.grounded = false;
          }
          if (e.grounded) e.vx *= 0.8;
          break;
        }
        case 'angryBeetle': {
          e.vy = Math.min(280, e.vy + 760 * dt);
          if (!e.isAttacking && Math.abs(distY) < 20 && Math.abs(distX) < 120) {
            e.facing = distX >= 0 ? 1 : -1;
            e.isAttacking = true;
            e.attackTimer = 0.45;
            e.vx = 0;
          } else if (e.isAttacking) {
            e.attackTimer -= dt;
            if (e.attackTimer > 0) {
              e.vx = 0; // warning windup
            } else if (e.attackTimer > -0.85) {
              e.vx = e.facing * 145 * spdMult;
            } else {
              e.isAttacking = false;
            }
          } else {
            e.vx = e.facing * 42 * spdMult;
            if (Math.abs(e.x - e.originX) > e.patrolDist) {
              e.facing = e.x > e.originX ? -1 : 1;
            }
          }
          break;
        }
        case 'flyingBat': {
          if (dist < 130 && e.attackTimer <= 0) {
            e.isAttacking = true;
            e.attackTimer = 1.6;
            const ang = Math.atan2(distY, distX);
            e.vx = Math.cos(ang) * 95 * spdMult;
            e.vy = Math.sin(ang) * 95 * spdMult;
            e.facing = distX >= 0 ? 1 : -1;
          } else if (e.isAttacking) {
            e.attackTimer -= dt;
            if (e.attackTimer < 0.7) {
              // Return toward ceiling origin
              e.vx = (e.originX - e.x) * 1.4 * spdMult;
              e.vy = (e.originY - e.y) * 1.4 * spdMult;
            }
            if (e.attackTimer <= 0) {
              e.isAttacking = false;
            }
          } else {
            e.vx = e.facing * 52 * spdMult;
            e.vy = Math.sin(this.time * 4 + e.id) * 24;
            if (Math.abs(e.x - e.originX) > e.patrolDist) {
              e.facing = e.x > e.originX ? -1 : 1;
            }
          }
          break;
        }
        case 'poisonMushroom': {
          e.vy = Math.min(280, e.vy + 760 * dt);
          e.vx = e.facing * 24 * spdMult;
          if (Math.abs(e.x - e.originX) > e.patrolDist) {
            e.facing = e.x > e.originX ? -1 : 1;
          }
          if (dist < 140 && e.aiTimer > 2.2) {
            e.aiTimer = 0;
            e.isAttacking = true;
            e.attackTimer = 0.35;
            for (const angle of [-0.6, 0, 0.6]) {
              this.projectiles.push({
                fromPlayer: false,
                kind: 'poison',
                x: e.x,
                y: e.y - 6,
                vx: Math.sin(angle) * 60,
                vy: -95,
                r: 4,
                damage: 1,
                life: 1.8,
                color: '#c084fc',
              });
            }
          }
          if (e.attackTimer > 0) {
            e.attackTimer -= dt;
            if (e.attackTimer <= 0) e.isAttacking = false;
          }
          break;
        }
        case 'skeletonSpider': {
          e.vy = Math.min(280, e.vy + 760 * dt);
          if (dist < 150) {
            e.facing = distX >= 0 ? 1 : -1;
            e.vx = e.facing * 92 * spdMult;
            if (e.grounded && e.aiTimer > 1.1) {
              e.aiTimer = 0;
              e.vy = -175;
            }
          } else {
            e.vx = e.facing * 65 * spdMult;
            if (Math.abs(e.x - e.originX) > e.patrolDist) {
              e.facing = e.x > e.originX ? -1 : 1;
            }
          }
          break;
        }
        case 'shadowGhost': {
          // Phases gently toward player when within range
          if (dist < 170) {
            const ang = Math.atan2(distY, distX);
            e.vx = Math.cos(ang) * 48 * spdMult;
            e.vy = Math.sin(ang) * 48 * spdMult;
            e.facing = distX >= 0 ? 1 : -1;
            e.isAttacking = dist < 55;
          } else {
            e.vx = e.facing * 32 * spdMult;
            e.vy = Math.sin(this.time * 3 + e.id) * 18;
            if (Math.abs(e.x - e.originX) > e.patrolDist) {
              e.facing = e.x > e.originX ? -1 : 1;
            }
          }
          e.x += e.vx * dt;
          e.y += e.vy * dt;
          // Ghost skips tile collision!
          if (Math.abs(this.px - e.x) < 10 && Math.abs(this.py - e.y) < 11) {
            this.damagePlayer(1, distX >= 0 ? 130 : -130, -170);
          }
          continue;
        }
        case 'giantScorpion': {
          e.vy = Math.min(280, e.vy + 760 * dt);
          e.facing = distX >= 0 ? 1 : -1;
          if (dist < 160 && e.aiTimer > 1.8) {
            e.aiTimer = 0;
            e.isAttacking = true;
            e.attackTimer = 0.4;
            this.projectiles.push({
              fromPlayer: false,
              kind: 'stinger',
              x: e.x + e.facing * 8,
              y: e.y - 8,
              vx: e.facing * 145,
              vy: -15,
              r: 4,
              damage: 1,
              life: 1.8,
              color: '#fbbf24',
            });
          } else {
            e.vx = e.facing * (dist < 120 ? 52 : 34) * spdMult;
            if (Math.abs(e.x - e.originX) > e.patrolDist && dist > 140) {
              e.facing = e.x > e.originX ? -1 : 1;
            }
          }
          if (e.attackTimer > 0) {
            e.attackTimer -= dt;
            if (e.attackTimer <= 0) e.isAttacking = false;
          }
          break;
        }
      }

      this.moveEnemyWithCollision(e, dt);

      // Player contact damage (or stomping weak enemies from above? Let's keep Web Shot & Magic Web primary, and contact damages player unless dashing!)
      if (
        Math.abs(this.px - e.x) < (this.pw + e.w) * 0.45 &&
        Math.abs(this.py - e.y) < (this.ph + e.h) * 0.45
      ) {
        if (this.dashTimer > 0) {
          this.damageEnemy(e, 2, this.facing * 120);
        } else {
          this.damagePlayer(1, this.px >= e.x ? 140 : -140, -185);
        }
      }
    }
  }

  private moveEnemyWithCollision(e: EnemyRuntime, dt: number): void {
    e.x += e.vx * dt;
    const minTy = Math.floor((e.y - e.h / 2 + 1) / TILE_SIZE);
    const maxTy = Math.floor((e.y + e.h / 2 - 1) / TILE_SIZE);
    if (e.vx > 0) {
      const tx = Math.floor((e.x + e.w / 2) / TILE_SIZE);
      for (let ty = minTy; ty <= maxTy; ty++) {
        if (this.isSolidTile(this.getTile(tx, ty))) {
          e.x = tx * TILE_SIZE - e.w / 2 - 0.01;
          e.vx = 0;
          e.facing = -1;
          break;
        }
      }
    } else if (e.vx < 0) {
      const tx = Math.floor((e.x - e.w / 2) / TILE_SIZE);
      for (let ty = minTy; ty <= maxTy; ty++) {
        if (this.isSolidTile(this.getTile(tx, ty))) {
          e.x = (tx + 1) * TILE_SIZE + e.w / 2 + 0.01;
          e.vx = 0;
          e.facing = 1;
          break;
        }
      }
    }

    e.y += e.vy * dt;
    e.grounded = false;
    const minTx = Math.floor((e.x - e.w / 2 + 1) / TILE_SIZE);
    const maxTx = Math.floor((e.x + e.w / 2 - 1) / TILE_SIZE);
    if (e.vy >= 0) {
      const ty = Math.floor((e.y + e.h / 2) / TILE_SIZE);
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (this.isSolidTile(this.getTile(tx, ty))) {
          e.y = ty * TILE_SIZE - e.h / 2 - 0.01;
          e.vy = 0;
          e.grounded = true;
          break;
        }
      }
    } else {
      const ty = Math.floor((e.y - e.h / 2) / TILE_SIZE);
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (this.isSolidTile(this.getTile(tx, ty))) {
          e.y = (ty + 1) * TILE_SIZE + e.h / 2 + 0.01;
          e.vy = 0;
          break;
        }
      }
    }
  }

  private damageEnemy(e: EnemyRuntime, dmg: number, knockVx = 0): void {
    if (e.dead) return;
    e.hp -= dmg;
    e.hitFlash = 0.14;
    e.vx += knockVx;
    audio.playSfx('hit');
    this.spawnBurst(e.x, e.y, '#38bdf8', 5, 65);
    this.addFloatingText(e.x, e.y - 10, `-${dmg}`, '#bae6fd');

    if (e.hp <= 0) {
      e.dead = true;
      this.enemiesDefeatedInStage += 1;
      this.scoreEarned += 100;
      audio.playSfx('enemyDefeat');
      this.spawnBurst(e.x, e.y, '#fbbf24', 12, 95);
      this.callbacks.onSaveProgress((s) => {
        s.enemiesDefeatedTotal += 1;
      });
    }
  }

  private updateBoss(dt: number): void {
    const b = this.boss;
    if (!b) return;
    b.hitFlash = Math.max(0, b.hitFlash - dt);
    b.slowTimer = Math.max(0, b.slowTimer - dt);

    if (b.state === 'defeated') {
      b.defeatTimer -= dt;
      if (Math.random() > 0.5) {
        this.spawnBurst(
          b.x + (Math.random() - 0.5) * 28,
          b.y + (Math.random() - 0.5) * 28,
          '#fde047',
          5,
          90
        );
      }
      if (b.defeatTimer <= 0) {
        // Boss completely vanquished -> Stage Clear!
        this.triggerStageClear();
      }
      return;
    }

    // Phase escalation
    const hpRatio = b.hp / b.maxHp;
    const newPhase: 1 | 2 | 3 = hpRatio <= 0.3 ? 3 : hpRatio <= 0.6 ? 2 : 1;
    if (newPhase !== b.phase) {
      b.phase = newPhase;
      this.showBanner(`${b.name} — ${newPhase}-Bosqich!`, 2.2);
      this.addShake(3, 0.25);
      audio.playSfx('bossWarn');
    }

    const spd = (b.slowTimer > 0 ? 0.55 : 1) * (1 + (b.phase - 1) * 0.22);
    b.facing = this.px >= b.x ? 1 : -1;
    b.stateTimer -= dt * spd;

    if (b.state === 'idle') {
      // Gentle movement while preparing next attack
      if (b.type === 'caveDestroyer' || b.type === 'iceDragon') {
        b.y = (8.5 + Math.sin(this.time * 2.5) * 1.5) * TILE_SIZE;
        b.x += Math.cos(this.time * 1.8) * 35 * dt * spd;
      } else {
        b.vx = b.facing * 26 * spd;
        b.vy = Math.min(280, b.vy + 760 * dt);
        this.moveBossGround(b, dt);
      }

      if (b.stateTimer <= 0) {
        b.state = 'warn';
        b.stateTimer = 0.55;
        audio.playSfx('bossWarn');
      }
    } else if (b.state === 'warn') {
      b.vx = 0;
      if (b.type !== 'caveDestroyer' && b.type !== 'iceDragon') {
        b.vy = Math.min(280, b.vy + 760 * dt);
        this.moveBossGround(b, dt);
      }
      if (b.stateTimer <= 0) {
        b.state = 'attack';
        b.stateTimer = 1.05;
        this.executeBossAttack(b);
      }
    } else if (b.state === 'attack') {
      if (b.type === 'caveDestroyer' || b.type === 'iceDragon') {
        b.x += b.vx * dt * spd;
        b.y += b.vy * dt * spd;
        b.x = Math.max(3 * TILE_SIZE, Math.min(28 * TILE_SIZE, b.x));
        b.y = Math.max(4 * TILE_SIZE, Math.min(13.5 * TILE_SIZE, b.y));
      } else {
        b.vy = Math.min(280, b.vy + 760 * dt);
        this.moveBossGround(b, dt);
      }
      if (b.stateTimer <= 0) {
        b.state = 'recover';
        b.stateTimer = b.phase === 3 ? 0.6 : 0.95;
        b.patternIndex = (b.patternIndex + 1) % 3;
      }
    } else if (b.state === 'recover') {
      b.vx *= 0.85;
      if (b.type !== 'caveDestroyer' && b.type !== 'iceDragon') {
        b.vy = Math.min(280, b.vy + 760 * dt);
        this.moveBossGround(b, dt);
      }
      if (b.stateTimer <= 0) {
        b.state = 'idle';
        b.stateTimer = 0.85;
      }
    }

    // Contact collision with Boss
    if (
      Math.abs(this.px - b.x) < (this.pw + b.w) * 0.44 &&
      Math.abs(this.py - b.y) < (this.ph + b.h) * 0.44
    ) {
      this.damagePlayer(1, this.px >= b.x ? 160 : -160, -210);
    }
  }

  private moveBossGround(b: BossRuntime, dt: number): void {
    b.x += b.vx * dt;
    b.x = Math.max(3 * TILE_SIZE, Math.min(29 * TILE_SIZE, b.x));
    b.y += b.vy * dt;
    if (b.y >= 14.5 * TILE_SIZE) {
      b.y = 14.5 * TILE_SIZE;
      b.vy = 0;
    }
  }

  private executeBossAttack(b: BossRuntime): void {
    const dir = b.facing;
    if (b.type === 'mushroomKing') {
      if (b.patternIndex === 0) {
        // Leap Slam + shockwave spores
        b.vx = dir * 130;
        b.vy = -260;
        for (const s of [-1, 1]) {
          this.projectiles.push({
            fromPlayer: false,
            kind: 'poison',
            x: b.x,
            y: 15 * TILE_SIZE,
            vx: s * 135,
            vy: 0,
            r: 5,
            damage: 1,
            life: 2.0,
            color: '#e879f9',
          });
        }
      } else if (b.patternIndex === 1) {
        // Arcing spore barrage
        const count = b.phase >= 2 ? 5 : 3;
        for (let i = 0; i < count; i++) {
          const vx = (i - (count - 1) / 2) * 55;
          this.projectiles.push({
            fromPlayer: false,
            kind: 'poison',
            x: b.x,
            y: b.y - 16,
            vx,
            vy: -195,
            r: 4,
            damage: 1,
            life: 2.4,
            color: '#c084fc',
          });
        }
      } else {
        // Charge dash
        b.vx = dir * 185;
      }
    } else if (b.type === 'caveDestroyer') {
      if (b.patternIndex === 0) {
        // 5-way Crystal Laser Fan
        const count = b.phase >= 2 ? 5 : 3;
        for (let i = 0; i < count; i++) {
          const ang = Math.atan2(this.py - b.y, this.px - b.x) + (i - (count - 1) / 2) * 0.28;
          this.projectiles.push({
            fromPlayer: false,
            kind: 'crystal',
            x: b.x,
            y: b.y,
            vx: Math.cos(ang) * 165,
            vy: Math.sin(ang) * 165,
            r: 5,
            damage: 1,
            life: 2.2,
            color: '#22d3ee',
          });
        }
      } else if (b.patternIndex === 1) {
        // Falling Crystal Shards across arena
        for (let i = 0; i < 4 + b.phase; i++) {
          this.projectiles.push({
            fromPlayer: false,
            kind: 'crystal',
            x: (4 + Math.random() * 24) * TILE_SIZE,
            y: 2 * TILE_SIZE,
            vx: 0,
            vy: 145,
            r: 5,
            damage: 1,
            life: 2.5,
            color: '#818cf8',
          });
        }
      } else {
        // Swoop dash
        const ang = Math.atan2(this.py - b.y, this.px - b.x);
        b.vx = Math.cos(ang) * 195;
        b.vy = Math.sin(ang) * 145;
      }
    } else if (b.type === 'desertScorpion') {
      if (b.patternIndex === 0) {
        // High-speed pincer charge
        b.vx = dir * 215;
      } else if (b.patternIndex === 1) {
        // Venom stinger fan
        const count = b.phase >= 2 ? 4 : 3;
        for (let i = 0; i < count; i++) {
          const ang = Math.atan2(this.py - b.y, this.px - b.x) + (i - (count - 1) / 2) * 0.22;
          this.projectiles.push({
            fromPlayer: false,
            kind: 'stinger',
            x: b.x,
            y: b.y - 16,
            vx: Math.cos(ang) * 175,
            vy: Math.sin(ang) * 175,
            r: 4,
            damage: 1,
            life: 2.2,
            color: '#fde047',
          });
        }
      } else {
        // Sand shockwave leap
        b.vx = dir * 120;
        b.vy = -220;
      }
    } else if (b.type === 'iceDragon') {
      if (b.patternIndex === 0) {
        // Frost Breath Stream
        for (let i = 0; i < 4 + b.phase; i++) {
          const ang = Math.atan2(this.py - b.y, this.px - b.x) + (i - 2) * 0.14;
          this.projectiles.push({
            fromPlayer: false,
            kind: 'ice',
            x: b.x + dir * 14,
            y: b.y - 10,
            vx: Math.cos(ang) * 170,
            vy: Math.sin(ang) * 170,
            r: 5,
            damage: 1,
            life: 2.3,
            color: '#7dd3fc',
          });
        }
      } else if (b.patternIndex === 1) {
        // Dive-bomb swoop
        const ang = Math.atan2(this.py - b.y, this.px - b.x);
        b.vx = Math.cos(ang) * 225;
        b.vy = Math.sin(ang) * 165;
      } else {
        // Icicle rain
        for (let i = 0; i < 5 + b.phase; i++) {
          this.projectiles.push({
            fromPlayer: false,
            kind: 'ice',
            x: (3 + i * 4.5) * TILE_SIZE,
            y: 2 * TILE_SIZE,
            vx: 0,
            vy: 155,
            r: 4,
            damage: 1,
            life: 2.4,
            color: '#e0f2fe',
          });
        }
      }
    } else if (b.type === 'shadowSpiderKing') {
      if (b.patternIndex === 0) {
        // Teleport + Shadow Ring Barrage
        b.x = (this.px < 16 * TILE_SIZE ? 24 : 7) * TILE_SIZE;
        this.spawnBurst(b.x, b.y, '#a855f7', 14, 100);
        const count = 6 + b.phase * 2;
        for (let i = 0; i < count; i++) {
          const ang = (Math.PI * 2 * i) / count;
          this.projectiles.push({
            fromPlayer: false,
            kind: 'shadow',
            x: b.x,
            y: b.y - 6,
            vx: Math.cos(ang) * 145,
            vy: Math.sin(ang) * 145,
            r: 5,
            damage: 1,
            life: 2.5,
            color: '#f43f5e',
          });
        }
      } else if (b.patternIndex === 1) {
        // Ferocious Arachnid Lunge
        b.vx = dir * 240;
        b.vy = -170;
      } else {
        // Targeted Spider Crystal Bolts
        for (let i = -1; i <= 1; i++) {
          const ang = Math.atan2(this.py - b.y, this.px - b.x) + i * 0.25;
          this.projectiles.push({
            fromPlayer: false,
            kind: 'shadow',
            x: b.x,
            y: b.y - 12,
            vx: Math.cos(ang) * 185,
            vy: Math.sin(ang) * 185,
            r: 5,
            damage: 1,
            life: 2.4,
            color: '#c084fc',
          });
        }
      }
    }
  }

  private damageBoss(dmg: number): void {
    const b = this.boss;
    if (!b || b.state === 'defeated') return;
    b.hp = Math.max(0, b.hp - dmg);
    b.hitFlash = 0.14;
    audio.playSfx('hit');
    this.spawnBurst(b.x, b.y, '#38bdf8', 7, 80);
    this.addFloatingText(b.x, b.y - 24, `-${dmg}`, '#fde047');

    if (b.hp <= 0) {
      b.state = 'defeated';
      b.defeatTimer = 1.65;
      this.scoreEarned += 1000;
      this.addShake(5, 0.55);
      audio.playSfx('bossDefeat');
      this.showBanner(`${b.name} Mag‘lub Etildi!`, 2.2);
      this.callbacks.onSaveProgress((s) => {
        if (!s.bossesDefeated.includes(b.type)) {
          s.bossesDefeated.push(b.type);
        }
      });
    }
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      if (pr.kind === 'poison') {
        pr.vy += 260 * dt;
      }
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      const tx = Math.floor(pr.x / TILE_SIZE);
      const ty = Math.floor(pr.y / TILE_SIZE);
      const tile = this.getTile(tx, ty);
      if (pr.fromPlayer && tile === 6) {
        this.revealSecretWall(tx, ty);
      }

      if (pr.life <= 0 || this.isSolidTile(tile)) {
        this.spawnBurst(pr.x, pr.y, pr.color, 4, 45);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (pr.fromPlayer) {
        let hit = false;
        // Hit crates
        for (const cr of this.crates) {
          if (!cr.broken && Math.abs(pr.x - cr.x) < 10 && Math.abs(pr.y - cr.y) < 10) {
            this.breakCrate(cr);
            hit = true;
            break;
          }
        }
        // Hit enemies
        if (!hit) {
          for (const e of this.enemies) {
            if (!e.dead && Math.abs(pr.x - e.x) < e.w * 0.65 && Math.abs(pr.y - e.y) < e.h * 0.65) {
              e.slowTimer = 1.5;
              this.damageEnemy(e, pr.damage, Math.sign(pr.vx) * 60);
              hit = true;
              break;
            }
          }
        }
        // Hit boss
        if (!hit && this.boss && this.boss.state !== 'defeated') {
          if (
            Math.abs(pr.x - this.boss.x) < this.boss.w * 0.58 &&
            Math.abs(pr.y - this.boss.y) < this.boss.h * 0.58
          ) {
            this.boss.slowTimer = 1.0;
            this.damageBoss(pr.damage);
            hit = true;
          }
        }
        if (hit) {
          this.projectiles.splice(i, 1);
        }
      } else {
        // Enemy projectile hitting Spikey (Dash grants brief graze immunity!)
        if (
          this.dashTimer <= 0 &&
          Math.abs(pr.x - this.px) < 7 + pr.r &&
          Math.abs(pr.y - this.py) < 7 + pr.r
        ) {
          this.damagePlayer(pr.damage, Math.sign(pr.vx || 1) * 120, -165);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private updateWebTraps(dt: number): void {
    for (let i = this.webTraps.length - 1; i >= 0; i--) {
      const wt = this.webTraps[i];
      wt.life -= dt;
      wt.tickTimer -= dt;
      if (wt.life <= 0) {
        this.webTraps.splice(i, 1);
        continue;
      }
      for (const e of this.enemies) {
        if (!e.dead && Math.hypot(e.x - wt.x, e.y - wt.y) < wt.r) {
          e.slowTimer = 0.6;
          if (wt.tickTimer <= 0) {
            this.damageEnemy(e, 1, 0);
          }
        }
      }
      if (this.boss && this.boss.state !== 'defeated' && Math.hypot(this.boss.x - wt.x, this.boss.y - wt.y) < wt.r + 12) {
        this.boss.slowTimer = 0.6;
        if (wt.tickTimer <= 0) {
          this.damageBoss(1);
        }
      }
      if (wt.tickTimer <= 0) {
        wt.tickTimer = 0.75;
      }
    }
  }

  private breakCrate(cr: CrateRuntime): void {
    if (cr.broken) return;
    cr.broken = true;
    audio.playSfx('hit');
    this.spawnBurst(cr.x, cr.y, '#d97706', 10, 85);
    if (cr.loot === 'coin') {
      this.collectibles.push({
        kind: 'coin',
        x: cr.x,
        y: cr.y - 4,
        collected: false,
        bobOffset: 0,
      });
    } else if (cr.loot === 'heart') {
      this.collectibles.push({
        kind: 'heart',
        x: cr.x,
        y: cr.y - 4,
        collected: false,
        bobOffset: 0,
      });
    }
  }

  private updateCollectiblesAndInteractions(input: InputState): void {
    // Collectibles
    for (const c of this.collectibles) {
      if (c.collected) continue;
      if (Math.hypot(this.px - c.x, this.py - c.y) < 15) {
        c.collected = true;
        if (c.kind === 'coin') {
          this.coinsEarned += 1;
          this.scoreEarned += 25;
          audio.playSfx('coin');
          this.spawnBurst(c.x, c.y, '#fbbf24', 6, 55);
          this.addFloatingText(c.x, c.y - 8, '+25', '#fde047');
        } else if (c.kind === 'crystal') {
          const idx = c.crystalIndex ?? 0;
          this.crystalsCollected[idx] = true;
          this.scoreEarned += 250;
          audio.playSfx('crystal');
          this.spawnBurst(c.x, c.y, '#c084fc', 14, 95);
          this.addFloatingText(c.x, c.y - 10, 'KRISTALL!', '#e879f9');
        } else if (c.kind === 'heart') {
          this.hp = Math.min(this.maxHp, this.hp + 1);
          audio.playSfx('checkpoint');
          this.spawnBurst(c.x, c.y, '#ef4444', 8, 65);
          this.addFloatingText(c.x, c.y - 10, '+1 JON', '#fda4af');
        } else if (c.kind === 'chest') {
          this.coinsEarned += 10;
          this.scoreEarned += 300;
          audio.playSfx('chest');
          this.spawnBurst(c.x, c.y, '#fde047', 16, 110);
          this.addFloatingText(c.x, c.y - 12, 'XAZINA +10 TANGA!', '#fde047');
          this.callbacks.onSaveProgress((s) => {
            s.secretsFoundTotal += 1;
          });
        }
      }
    }

    // Checkpoints
    this.stage.checkpoints.forEach((cp, idx) => {
      if (!this.activatedCheckpoints.has(idx) && Math.hypot(this.px - cp.x, this.py - cp.y) < 18) {
        this.activatedCheckpoints.add(idx);
        this.respawnX = cp.x;
        this.respawnY = cp.y;
        audio.playSfx('checkpoint');
        this.spawnBurst(cp.x, cp.y - 6, '#38bdf8', 12, 80);
        this.addFloatingText(cp.x, cp.y - 14, 'NAZORAT NUQTASI!', '#7dd3fc');
      }
    });

    // Ability Shrines (activate on E or touching if first visit!)
    for (const sh of this.shrines) {
      if (!sh.activated && Math.hypot(this.px - sh.x, this.py - sh.y) < 20) {
        if (input.interactPressed || Math.hypot(this.px - sh.x, this.py - sh.y) < 12) {
          sh.activated = true;
          this.save.unlockedAbilities[sh.ability] = true;
          if (sh.ability === 'magicWeb') {
            this.save.activeSpecial = 'magicWeb';
          }
          this.newlyUnlockedAbility = sh.ability;
          this.scoreEarned += 350;
          audio.playSfx('shrine');
          this.addShake(2.5, 0.25);
          this.spawnBurst(sh.x, sh.y - 8, ABILITY_META[sh.ability].color, 20, 120);
          this.showBanner(`${sh.title} ${sh.description}`, 4.0);
          this.callbacks.onSaveProgress((s) => {
            s.unlockedAbilities[sh.ability] = true;
            if (sh.ability === 'magicWeb') s.activeSpecial = 'magicWeb';
          });
        }
      }
    }

    // Shadow Portals
    if (this.portalCooldown <= 0) {
      for (const p of this.stage.portals) {
        if (Math.hypot(this.px - p.ax, this.py - p.ay) < 14) {
          this.px = p.bx;
          this.py = p.by;
          this.portalCooldown = 1.0;
          audio.playSfx('magicWeb');
          this.spawnBurst(p.bx, p.by, '#c084fc', 12, 80);
          break;
        } else if (Math.hypot(this.px - p.bx, this.py - p.by) < 14) {
          this.px = p.ax;
          this.py = p.ay;
          this.portalCooldown = 1.0;
          audio.playSfx('magicWeb');
          this.spawnBurst(p.ax, p.ay, '#c084fc', 12, 80);
          break;
        }
      }
    }

    // Exit Web Portal (on standard non-boss levels)
    if (
      !this.stage.isBossStage &&
      Math.hypot(this.px - this.stage.exit.x, this.py - this.stage.exit.y) < 18
    ) {
      this.triggerStageClear();
    }
  }

  private damagePlayer(amount: number, knockVx: number, knockVy: number): void {
    if (this.invulnTimer > 0 || this.deathTimer > 0 || this.stageCleared) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnTimer = 1.15;
    this.hurtTimer = 0.28;
    this.tookDamageInStage = true;
    this.swingAnchor = null;
    this.climbing = false;
    this.pvx = knockVx;
    this.pvy = knockVy;
    this.addShake(3.2, 0.2);
    audio.playSfx('playerHurt');
    this.spawnBurst(this.px, this.py, '#ef4444', 10, 85);

    if (this.hp <= 0) {
      this.deathTimer = 0.95;
      this.pvy = -210;
      this.pvx = 0;
    }
    this.emitHud();
  }

  private handleRespawnOrGameOver(): void {
    this.lives -= 1;
    this.callbacks.onSaveProgress((s) => {
      s.lives = Math.max(0, this.lives);
    });

    if (this.lives <= 0) {
      this.finished = true;
      audio.playMusic('gameOver');
      this.callbacks.onGameOver(this.scoreEarned, this.coinsEarned);
      return;
    }

    // Respawn cleanly at last checkpoint or stage start
    this.hp = this.maxHp;
    this.px = this.respawnX;
    this.py = this.respawnY;
    this.pvx = 0;
    this.pvy = 0;
    this.invulnTimer = 1.4;
    this.swingAnchor = null;
    this.climbing = false;
    this.emitHud();
  }

  private triggerStageClear(): void {
    if (this.stageCleared) return;
    this.stageCleared = true;
    this.victoryTimer = 0;
    this.pvx = 0;
    this.pvy = 0;
    audio.playMusic('victory');
    this.spawnBurst(this.px, this.py - 8, '#fde047', 18, 110);

    // World Boss progression ability unlock!
    if (this.stage.id === '1-Boss' && !this.save.unlockedAbilities.webTrap) {
      this.newlyUnlockedAbility = 'webTrap';
    }
  }

  private completeStage(): void {
    if (this.finished) return;
    this.finished = true;

    const noDamageBonus = !this.tookDamageInStage;
    const bonus = (noDamageBonus ? 500 : 0) + (this.crystalsCollected.every(Boolean) ? 300 : 0);
    const totalStageScore = this.scoreEarned + bonus;

    this.callbacks.onStageClear({
      stageId: this.stage.id,
      stageName: this.stage.name,
      worldId: this.stage.worldId,
      isBossStage: this.stage.isBossStage,
      isFinalBoss: this.stage.id === '5-Boss',
      coinsEarned: this.coinsEarned,
      crystalsCollected: [...this.crystalsCollected],
      scoreEarned: totalStageScore,
      timeSec: Math.round(this.elapsedSec),
      noDamageBonus,
      newlyUnlockedAbility: this.newlyUnlockedAbility,
      nextStageId: null, // resolved by App
      enemiesDefeatedCount: this.enemiesDefeatedInStage,
      bossType: this.stage.bossType,
    });
  }

  private updateScarfTrail(): void {
    this.scarfTrail[0] = { x: this.px - this.facing * 2, y: this.py + 1 };
    for (let i = 1; i < this.scarfTrail.length; i++) {
      const prev = this.scarfTrail[i - 1];
      const cur = this.scarfTrail[i];
      cur.x += (prev.x - this.facing * 3 - cur.x) * 0.42;
      cur.y += (prev.y + Math.sin(this.time * 10 + i) * 0.6 - cur.y) * 0.42;
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      if (p.gravity) p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private updateAmbientParticles(dt: number): void {
    for (const ap of this.ambientParticles) {
      ap.x += ap.vx * dt;
      ap.y += ap.vy * dt;
      if (ap.x < 0) ap.x += LOGICAL_WIDTH;
      if (ap.x >= LOGICAL_WIDTH) ap.x -= LOGICAL_WIDTH;
      if (ap.y < 0) ap.y += LOGICAL_HEIGHT;
      if (ap.y >= LOGICAL_HEIGHT) ap.y -= LOGICAL_HEIGHT;
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= 18 * dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  private updateCamera(dt: number): void {
    const worldW = this.stage.widthTiles * TILE_SIZE;
    const worldH = this.stage.heightTiles * TILE_SIZE;
    const targetX = this.px + this.facing * 28 - LOGICAL_WIDTH / 2;
    const targetY = this.py - LOGICAL_HEIGHT * 0.56;

    const clampedX = Math.max(0, Math.min(Math.max(0, worldW - LOGICAL_WIDTH), targetX));
    const clampedY = Math.max(0, Math.min(Math.max(0, worldH - LOGICAL_HEIGHT), targetY));

    const lerp = Math.min(1, dt * 8.5);
    this.camX += (clampedX - this.camX) * lerp;
    this.camY += (clampedY - this.camY) * lerp;
  }

  private emitHud(): void {
    const activeBuild = this.craftedWebs.find((w) => w.buildProgress < 1);
    this.callbacks.onHudUpdate({
      hp: this.hp,
      maxHp: this.maxHp,
      lives: this.lives,
      coins: this.coinsEarned,
      crystalsCollected: [...this.crystalsCollected],
      score: this.scoreEarned,
      worldId: this.stage.worldId,
      stageId: this.stage.id,
      stageName: this.stage.name,
      activeSpecial: this.save.activeSpecial,
      unlockedAbilities: { ...this.save.unlockedAbilities },
      cooldowns: {
        webShot: this.webCooldown / 0.24,
        webTrap: this.trapCooldown / 3.2,
        spiderDash: this.dashCooldown / 0.85,
        magicWeb: this.magicCooldown / 2.8,
      },
      boss: this.boss
        ? {
            active: this.boss.state !== 'defeated',
            name: this.boss.name,
            hp: this.boss.hp,
            maxHp: this.boss.maxHp,
            phase: this.boss.phase,
          }
        : null,
      bannerText: this.bannerText,
      promptHint: this.promptHint,
      elapsedSec: Math.floor(this.elapsedSec),
      webAttached: Boolean(this.swingAnchor),
      spiderHouseProgress: activeBuild ? activeBuild.buildProgress : null,
    });
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.imageSmoothingEnabled = false;

    const shakeX = this.shakeTimer > 0 ? Math.round((Math.random() - 0.5) * 2 * this.shakeIntensity) : 0;
    const shakeY = this.shakeTimer > 0 ? Math.round((Math.random() - 0.5) * 2 * this.shakeIntensity) : 0;
    const cx = Math.round(this.camX) + shakeX;
    const cy = Math.round(this.camY) + shakeY;

    // 1. Unique Per-Stage Parallax World Background
    drawParallaxBackground(ctx, this.stage.worldId, cx, this.time, this.stage.id);

    ctx.save();
    ctx.translate(-cx, -cy);

    // 2. Visible Tiles
    const startTx = Math.max(0, Math.floor(cx / TILE_SIZE));
    const endTx = Math.min(this.stage.widthTiles - 1, Math.ceil((cx + LOGICAL_WIDTH) / TILE_SIZE));
    const startTy = Math.max(0, Math.floor(cy / TILE_SIZE));
    const endTy = Math.min(this.stage.heightTiles - 1, Math.ceil((cy + LOGICAL_HEIGHT) / TILE_SIZE));

    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const t = this.tiles[ty][tx];
        if (t === 0) continue;
        if (t === 8) {
          const ct = this.crumbleTiles.get(`${tx},${ty}`);
          if (ct && ct.state === 'gone') continue;
          const jitter = ct && ct.state === 'shaking' ? Math.sin(this.time * 50) * 1.5 : 0;
          drawTile(ctx, t, tx * TILE_SIZE + jitter, ty * TILE_SIZE, this.stage.worldId, this.time, false, false);
          continue;
        }
        const aboveEmpty = ty > 0 ? this.tiles[ty - 1][tx] === 0 : true;
        const belowEmpty = ty + 1 < this.stage.heightTiles ? this.tiles[ty + 1][tx] === 0 : false;
        drawTile(ctx, t, tx * TILE_SIZE, ty * TILE_SIZE, this.stage.worldId, this.time, aboveEmpty, belowEmpty);
      }
    }

    // 3. Moving Platforms (world-specific geometry & trim)
    const theme = WORLD_THEMES[this.stage.worldId];
    const outline = this.stage.worldId === 1 || this.stage.worldId === 3 ? '#1a0f0a' : '#090d1a';
    for (const mp of this.movingPlatforms) {
      const mx = Math.round(mp.x);
      const my = Math.round(mp.y);
      ctx.fillStyle = outline;
      ctx.fillRect(mx - 1, my - 1, mp.w + 2, mp.h + 2);
      ctx.fillStyle = theme.groundBody;
      ctx.fillRect(mx, my, mp.w, mp.h);
      ctx.fillStyle = theme.groundTop;
      ctx.fillRect(mx, my, mp.w, 3);
      if (this.stage.worldId === 1) {
        ctx.fillStyle = '#82e64b';
        ctx.fillRect(mx + 2, my - 1, Math.max(4, mp.w - 4), 2);
      } else if (this.stage.worldId === 2) {
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(mx + 4, my + mp.h, 4, 2);
        ctx.fillRect(mx + mp.w - 8, my + mp.h, 4, 2);
      } else if (this.stage.worldId === 3) {
        ctx.fillStyle = '#fde047';
        ctx.fillRect(mx + 3, my + 3, 4, 2);
        ctx.fillRect(mx + mp.w - 7, my + 3, 4, 2);
      } else if (this.stage.worldId === 4) {
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(mx + 3, my + mp.h, 2, 3);
        ctx.fillRect(mx + mp.w - 5, my + mp.h, 2, 4);
      } else {
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(mx + 4, my + 3, 3, 2);
        ctx.fillRect(mx + mp.w - 7, my + 3, 3, 2);
      }
    }

    // 4. Swing Anchors & Active Web Tether
    for (const a of this.stage.swingAnchors) {
      ctx.fillStyle = '#090d1a';
      ctx.fillRect(Math.round(a.x - 5), Math.round(a.y - 5), 10, 10);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(Math.round(a.x - 4), Math.round(a.y - 4), 8, 8);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(Math.round(a.x - 2), Math.round(a.y - 2), 4, 4);
    }
    const equippedSkin = getSkinById(this.equippedSkinId);
    const equippedWeb = getWebDesignById(this.equippedWebDesignId);

    if (this.swingAnchor) {
      const ropeCol = resolveWebStrokeColor(equippedWeb, this.time, 0, false);
      const glowCol = resolveWebStrokeColor(equippedWeb, this.time, 1, true);
      ctx.fillStyle = glowCol;
      ctx.fillRect(Math.round(this.swingAnchor.x - 3), Math.round(this.swingAnchor.y - 3), 6, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(this.swingAnchor.x - 1), Math.round(this.swingAnchor.y - 1), 2, 2);

      if (this.graphicsQuality === 'high' || this.graphicsQuality === 'ultra') {
        ctx.save();
        ctx.strokeStyle = glowCol;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(Math.round(this.swingAnchor.x), Math.round(this.swingAnchor.y));
        ctx.lineTo(Math.round(this.px), Math.round(this.py));
        ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = ropeCol;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(this.swingAnchor.x), Math.round(this.swingAnchor.y));
      ctx.lineTo(Math.round(this.px), Math.round(this.py));
      ctx.stroke();
    }

    // 4b. Adaptive Spider House Shelters (E)
    for (const house of this.craftedWebs) {
      const rMid = Math.round((house.hw + house.hh) * 0.5);
      const rings = [
        Math.max(4, Math.round(rMid * 0.25)),
        Math.max(8, Math.round(rMid * 0.5)),
        Math.max(12, Math.round(rMid * 0.78)),
        rMid,
      ];
      drawStylizedWeb(
        ctx,
        house.cx,
        house.cy,
        house.anchors,
        rings,
        this.equippedWebDesignId,
        this.time,
        this.graphicsQuality,
        house.buildProgress,
        true
      );

      // Arched spider-silk canopy roof & shelter doorway veil
      const roofCol = resolveWebStrokeColor(equippedWeb, this.time, 2, false);
      const trimCol = resolveWebStrokeColor(equippedWeb, this.time, 3, true);
      const p = house.buildProgress;
      ctx.save();
      ctx.globalAlpha = 0.85 * p;
      ctx.strokeStyle = roofCol;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.round(house.cx - house.hw * p), Math.round(house.walkableY + 4));
      ctx.quadraticCurveTo(
        Math.round(house.cx),
        Math.round(house.cy - house.hh * 1.15 * p),
        Math.round(house.cx + house.hw * p),
        Math.round(house.walkableY + 4)
      );
      ctx.stroke();

      // Walkable silk floor truss
      ctx.strokeStyle = trimCol;
      ctx.beginPath();
      ctx.moveTo(Math.round(house.cx - house.hw + 2), Math.round(house.walkableY));
      ctx.lineTo(Math.round(house.cx + house.hw - 2), Math.round(house.walkableY));
      ctx.stroke();

      // Pixel-art glowing shelter charms / lanterns
      if (p >= 0.75) {
        for (let ci = 0; ci < house.charms.length; ci++) {
          const ch = house.charms[ci];
          const flicker = 0.7 + Math.sin(this.time * 5 + ci) * 0.3;
          ctx.globalAlpha = flicker;
          ctx.fillStyle = ch.color;
          ctx.fillRect(Math.round(ch.x - 1), Math.round(ch.y - 1), 3, 3);
        }
      }

      // Live weaving progress bar above house during construction
      if (p < 1) {
        const bw = 28;
        const bx = Math.round(house.cx - bw / 2);
        const by = Math.round(house.cy - house.hh - 10);
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
        ctx.fillStyle = roofCol;
        ctx.fillRect(bx, by, Math.round(bw * p), 3);
      }
      ctx.restore();
    }

    // 5. Shadow Portals
    for (const p of this.stage.portals) {
      for (const [x, y] of [
        [p.ax, p.ay],
        [p.bx, p.by],
      ]) {
        const pulse = Math.sin(this.time * 6) * 2;
        ctx.fillStyle = '#581c87';
        ctx.fillRect(Math.round(x - 7), Math.round(y - 11), 14, 22);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(Math.round(x - 4 - pulse * 0.4), Math.round(y - 8), 8 + pulse * 0.8, 16);
      }
    }

    // 6. Checkpoints & Exotic Orchid Ability Shrines & Exit Portal
    this.stage.checkpoints.forEach((cp, idx) => {
      const lit = this.activatedCheckpoints.has(idx);
      ctx.fillStyle = '#475569';
      ctx.fillRect(Math.round(cp.x - 1), Math.round(cp.y - 10), 2, 16);
      ctx.fillStyle = lit ? '#38bdf8' : '#334155';
      ctx.fillRect(Math.round(cp.x - 4), Math.round(cp.y - 14), 8, 6);
      if (lit) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fillRect(Math.round(cp.x - 8), Math.round(cp.y - 18), 16, 14);
      }
    });

    for (const sh of this.shrines) {
      const bob = Math.sin(this.time * 3.5) * 1.5;
      const sx = Math.round(sh.x);
      const sy = Math.round(sh.y);
      // Stem with crisp outline
      ctx.fillStyle = '#143d16';
      ctx.fillRect(sx - 2, sy - 6, 4, 14);
      ctx.fillStyle = '#388e3c';
      ctx.fillRect(sx - 1, sy - 5, 2, 13);
      // Orchid blossom petals (white/orchid-pink when active, muted when claimed)
      const by = Math.round(sy - 10 + bob);
      const petalOuter = sh.activated ? '#475569' : '#d946ef';
      const petalInner = sh.activated ? '#64748b' : '#fae8ff';
      ctx.fillStyle = '#1f102e';
      ctx.fillRect(sx - 8, by - 4, 16, 8);
      ctx.fillRect(sx - 5, by - 7, 10, 12);
      ctx.fillStyle = petalOuter;
      ctx.fillRect(sx - 7, by - 3, 14, 6);
      ctx.fillRect(sx - 4, by - 6, 8, 10);
      ctx.fillStyle = petalInner;
      ctx.fillRect(sx - 5, by - 2, 10, 4);
      ctx.fillRect(sx - 3, by - 5, 6, 7);
      if (!sh.activated) {
        ctx.fillStyle = '#fde047';
        ctx.fillRect(sx - 1, by - 1, 2, 3);
      }
    }

    if (!this.stage.isBossStage) {
      const ex = this.stage.exit.x;
      const ey = this.stage.exit.y;
      const pulse = Math.sin(this.time * 5) * 2;
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(Math.round(ex - 9), Math.round(ey - 16), 18, 24);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(Math.round(ex - 6), Math.round(ey - 13 + pulse * 0.5), 12, 18);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(Math.round(ex - 2), Math.round(ey - 9), 4, 10);
    }

    // 7. Crates & Collectibles
    for (const cr of this.crates) {
      if (cr.broken) continue;
      ctx.fillStyle = '#92400e';
      ctx.fillRect(Math.round(cr.x - 7), Math.round(cr.y - 7), 14, 14);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(Math.round(cr.x - 5), Math.round(cr.y - 5), 10, 10);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(Math.round(cr.x - 5), Math.round(cr.y - 1), 10, 2);
    }

    for (const c of this.collectibles) {
      if (c.collected) continue;
      const bob = Math.sin(this.time * 4 + c.bobOffset) * 2;
      const x = Math.round(c.x);
      const y = Math.round(c.y + bob);
      if (c.kind === 'coin') {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x - 3, y - 4, 6, 8);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(x - 1, y - 2, 2, 4);
      } else if (c.kind === 'crystal') {
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(x - 4, y - 5, 8, 10);
        ctx.fillStyle = '#f0abfc';
        ctx.fillRect(x - 2, y - 7, 4, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 1, y - 3, 2, 4);
      } else if (c.kind === 'heart') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x - 4, y - 3, 8, 5);
        ctx.fillRect(x - 2, y + 2, 4, 2);
        ctx.fillStyle = '#fecaca';
        ctx.fillRect(x - 3, y - 2, 2, 2);
      } else if (c.kind === 'chest') {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x - 7, y - 5, 14, 10);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(x - 7, y - 1, 14, 2);
        ctx.fillRect(x - 2, y - 2, 4, 4);
      }
    }

    // 8. Web Traps
    for (const wt of this.webTraps) {
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.85)';
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(wt.x - wt.r), Math.round(wt.y - 4), wt.r * 2, 8);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.28)';
      ctx.fillRect(Math.round(wt.x - wt.r), Math.round(wt.y - 4), wt.r * 2, 8);
    }

    // 9. Magic Web Wave
    if (this.magicWaveCenter && this.magicWaveRadius > 0) {
      ctx.strokeStyle = '#e879f9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.magicWaveCenter.x, this.magicWaveCenter.y, this.magicWaveRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 10. Falling Rocks
    for (const r of this.fallingRocks) {
      if (r.state === 'reset') continue;
      const jx = r.state === 'warn' ? Math.sin(this.time * 40) * 1.5 : 0;
      ctx.fillStyle = '#64748b';
      ctx.fillRect(Math.round(r.x - 5 + jx), Math.round(r.y - 6), 10, 10);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(Math.round(r.x - 3 + jx), Math.round(r.y + 4), 6, 4);
    }

    // 11. Enemies & Boss
    for (const e of this.enemies) {
      if (e.dead) continue;
      drawEnemy(ctx, e.type, e.x, e.y, e.facing, this.time, e.hitFlash, e.isAttacking, e.slowTimer > 0);
    }
    if (this.boss && (this.boss.state !== 'defeated' || Math.floor(this.time * 16) % 2 === 0)) {
      drawBoss(
        ctx,
        this.boss.type,
        this.boss.x,
        this.boss.y,
        this.boss.facing,
        this.time,
        this.boss.phase,
        this.boss.hitFlash,
        this.boss.state === 'warn'
      );
    }

    // 12. Spikey!
    drawSpikey(
      ctx,
      this.px,
      this.py,
      this.facing,
      this.animState,
      this.animTime,
      this.scarfTrail,
      this.invulnTimer,
      this.equippedSkinId
    );

    // Subtle soft aura around Spikey matching equipped skin
    const glowGrad = ctx.createRadialGradient(this.px, this.py - 2, 2, this.px, this.py - 2, 26);
    glowGrad.addColorStop(0, equippedSkin.glowRgba);
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(this.px - 26, this.py - 28, 52, 52);

    // 13. Projectiles & Particles & Floating Texts
    for (const pr of this.projectiles) {
      ctx.fillStyle = pr.color;
      ctx.fillRect(Math.round(pr.x - pr.r), Math.round(pr.y - pr.r), pr.r * 2, pr.r * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(pr.x - 1), Math.round(pr.y - 1), 2, 2);
    }

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;

    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    for (const ft of this.floatingTexts) {
      ctx.globalAlpha = Math.min(1, ft.life * 1.5);
      ctx.fillStyle = '#090d16';
      ctx.fillText(ft.text, Math.round(ft.x) + 1, Math.round(ft.y) + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // 14. Screen-space Atmospheric Weather & Fireflies
    const ptType = theme.particleType;
    for (const ap of this.ambientParticles) {
      ctx.globalAlpha = ap.alpha;
      ctx.fillStyle =
        ptType === 'leaves'
          ? '#86efac'
          : ptType === 'caveDust'
          ? '#67e8f9'
          : ptType === 'sand'
          ? '#fde68a'
          : ptType === 'snow'
          ? '#f8fafc'
          : '#f43f5e';
      ctx.fillRect(Math.round(ap.x), Math.round(ap.y), ap.size, ap.size);
    }
    ctx.globalAlpha = 1;
  }
}
