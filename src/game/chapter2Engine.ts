import { audio } from './audio';
import { getSkinById } from './skins';
import { getWebDesignById } from './webDesigns';
import {
  Chapter2ClearSummary,
  Chapter2EnemyKind,
  Chapter2HudSnapshot,
  Chapter2SectorDef,
  GraphicsQuality,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
} from './types';

export interface Chapter2Input {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  blinkPressed: boolean;
  sanctuaryPressed: boolean;
  supernovaPressed: boolean;
  tetherPressed: boolean;
  aimWorldX: number | null;
  aimWorldY: number | null;
}

interface Ch2Enemy {
  id: number;
  kind: Chapter2EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  maxHp: number;
  timer: number;
  chargeDirX: number;
  chargeDirY: number;
  charging: boolean;
  hitFlash: number;
  slowTimer: number;
  dead: boolean;
}

interface Ch2Projectile {
  fromPlayer: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  damage: number;
  life: number;
  color: string;
  pierce?: number;
}

interface Ch2Sanctuary {
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  angle: number;
}

interface Ch2CorePickup {
  kind: 'core' | 'coin' | 'heal';
  x: number;
  y: number;
  collected: boolean;
  pulse: number;
}

interface Ch2Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Ch2Afterimage {
  x: number;
  y: number;
  angle: number;
  life: number;
}

interface Ch2Boss {
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
  state: 'orbit' | 'laserSweep' | 'droneRing' | 'dash' | 'defeated';
  timer: number;
  laserAngle: number;
  hitFlash: number;
  defeatTimer: number;
}

export interface Chapter2Callbacks {
  onHudUpdate: (hud: Chapter2HudSnapshot) => void;
  onSectorClear: (summary: Chapter2ClearSummary) => void;
  onGameOver: (score: number, coins: number) => void;
}

export class Chapter2Engine {
  private sector: Chapter2SectorDef;
  private callbacks: Chapter2Callbacks;
  private skinId: string;
  private webDesignId: string;
  private quality: GraphicsQuality;
  private screenShakeEnabled: boolean;
  private spikeyCoinsTotal: number;
  private isCreator: boolean;

  // Player top-down 360 state
  private px: number;
  private py: number;
  private pvx = 0;
  private pvy = 0;
  private aimAngle = 0;
  private walkCycle = 0;
  private hp = 5;
  private maxHp = 5;
  private energy = 100;
  private maxEnergy = 100;
  private lives = 3;
  private invulnTimer = 0;
  private blinkTimer = 0;
  private blinkCooldown = 0;
  private shootCooldown = 0;
  private sanctuaryCooldown = 0;
  private supernovaCooldown = 0;
  private tetherCooldown = 0;
  private warpCooldown = 0;

  private activeTether: {
    x: number;
    y: number;
    angle: number;
    radius: number;
    angVel: number;
    timer: number;
  } | null = null;

  // Progression & Stats
  private wave = 1;
  private waveDelayTimer = 0;
  private enemiesDefeated = 0;
  private coresCollected = 0;
  private coresTotal = 0;
  private coinsEarned = 0;
  private scoreEarned = 0;
  private combo = 1;
  private comboTimer = 0;
  private tookDamage = false;
  private elapsedSec = 0;
  private time = 0;

  private bannerText: string | null = null;
  private bannerTimer = 0;
  private shakeTimer = 0;
  private shakeMag = 0;

  private nextEnemyId = 1;
  private enemies: Ch2Enemy[] = [];
  private projectiles: Ch2Projectile[] = [];
  private sanctuaries: Ch2Sanctuary[] = [];
  private pickups: Ch2CorePickup[] = [];
  private particles: Ch2Particle[] = [];
  private afterimages: Ch2Afterimage[] = [];
  private supernovaWaves: { x: number; y: number; r: number; maxR: number; life: number }[] = [];
  private stars: { x: number; y: number; size: number; speed: number; alpha: number }[] = [];
  private boss: Ch2Boss | null = null;

  private camX = 0;
  private camY = 0;
  private cleared = false;
  private clearTimer = 0;
  private finished = false;
  private hudThrottle = 0;

  constructor(
    sector: Chapter2SectorDef,
    lives: number,
    callbacks: Chapter2Callbacks,
    skinId: string,
    webDesignId: string,
    quality: GraphicsQuality,
    spikeyCoinsTotal: number,
    isCreator: boolean,
    screenShakeEnabled = true
  ) {
    this.sector = sector;
    this.lives = Math.max(1, Math.min(5, lives || 3));
    this.callbacks = callbacks;
    this.skinId = skinId;
    this.webDesignId = webDesignId;
    this.quality = quality;
    this.spikeyCoinsTotal = spikeyCoinsTotal;
    this.isCreator = isCreator;
    this.screenShakeEnabled = screenShakeEnabled;

    this.px = sector.arenaWidth * 0.5;
    this.py = sector.arenaHeight * 0.78;
    if (sector.hazardKind === 'gravityWell') {
      this.px = 140;
      this.py = sector.arenaHeight * 0.5;
    }

    const starCount = quality === 'low' ? 40 : quality === 'medium' ? 75 : 120;
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * sector.arenaWidth,
        y: Math.random() * sector.arenaHeight,
        size: Math.random() < 0.25 ? 2 : 1,
        speed: 4 + Math.random() * 14,
        alpha: 0.25 + Math.random() * 0.65,
      });
    }

    // Spawn sector Star Cores
    if (!sector.isBossSector) {
      const corePositions = [
        { x: sector.arenaWidth * 0.2, y: sector.arenaHeight * 0.24 },
        { x: sector.arenaWidth * 0.8, y: sector.arenaHeight * 0.24 },
        { x: sector.arenaWidth * 0.5, y: sector.arenaHeight * 0.16 },
      ];
      for (const pos of corePositions) {
        this.pickups.push({ kind: 'core', x: pos.x, y: pos.y, collected: false, pulse: Math.random() * 6 });
      }
      this.coresTotal = corePositions.length;
    }

    if (sector.isBossSector) {
      this.boss = {
        name: sector.bossName || 'CHRONOS CYBER-WIDOW',
        x: sector.arenaWidth * 0.5,
        y: sector.arenaHeight * 0.26,
        vx: 55,
        vy: 0,
        r: 22,
        hp: 95,
        maxHp: 95,
        phase: 1,
        state: 'orbit',
        timer: 2.2,
        laserAngle: Math.PI / 2,
        hitFlash: 0,
        defeatTimer: 0,
      };
      audio.playMusic('ch2Boss');
    } else {
      this.spawnWave(1);
      audio.playMusic('ch2Arena');
    }

    this.showBanner(sector.tutorialHint, 4.4);
    this.updateCamera(1);
    this.emitHud();
  }

  public updateCosmetics(
    skinId: string,
    webDesignId: string,
    quality: GraphicsQuality,
    spikeyCoinsTotal: number,
    isCreator: boolean,
    screenShakeEnabled: boolean
  ): void {
    this.skinId = skinId;
    this.webDesignId = webDesignId;
    this.quality = quality;
    this.spikeyCoinsTotal = spikeyCoinsTotal;
    this.isCreator = isCreator;
    this.screenShakeEnabled = screenShakeEnabled;
  }

  public getCameraOrigin(): { camX: number; camY: number } {
    return { camX: this.camX, camY: this.camY };
  }

  private showBanner(text: string, duration = 2.6): void {
    this.bannerText = text;
    this.bannerTimer = duration;
  }

  private spawnBurst(x: number, y: number, color: string, count: number, speed: number): void {
    const cap = this.quality === 'low' ? Math.ceil(count * 0.5) : count;
    for (let i = 0; i < cap; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = speed * (0.35 + Math.random() * 0.85);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        size: 1.5 + Math.random() * 2,
        color,
        life: 0.25 + Math.random() * 0.35,
        maxLife: 0.6,
      });
    }
  }

  private spawnWave(waveNum: number): void {
    const count = 4 + waveNum * 2 + this.sector.sectorNumber;
    const kinds: Chapter2EnemyKind[] =
      this.sector.sectorNumber === 1
        ? ['voidDrone', 'sawBot']
        : this.sector.sectorNumber === 2
        ? ['voidDrone', 'sawBot', 'riftTurret']
        : this.sector.sectorNumber === 3
        ? ['voidDrone', 'voidStalker', 'riftTurret']
        : ['sawBot', 'voidStalker', 'eliteSentinel', 'riftTurret'];

    for (let i = 0; i < count; i++) {
      const kind = kinds[i % kinds.length];
      let sx = 60 + Math.random() * (this.sector.arenaWidth - 120);
      let sy = 60 + Math.random() * (this.sector.arenaHeight - 120);
      if (Math.hypot(sx - this.px, sy - this.py) < 120) {
        sx = this.px < this.sector.arenaWidth * 0.5 ? this.sector.arenaWidth - 80 : 80;
        sy = this.py < this.sector.arenaHeight * 0.5 ? this.sector.arenaHeight - 80 : 80;
      }
      const baseHp =
        kind === 'eliteSentinel'
          ? 8
          : kind === 'riftTurret'
          ? 6
          : kind === 'voidStalker'
          ? 5
          : kind === 'sawBot'
          ? 4
          : 3;

      this.enemies.push({
        id: this.nextEnemyId++,
        kind,
        x: sx,
        y: sy,
        vx: 0,
        vy: 0,
        r: kind === 'eliteSentinel' ? 12 : kind === 'riftTurret' ? 11 : 9,
        hp: baseHp,
        maxHp: baseHp,
        timer: 0.6 + Math.random() * 1.4,
        chargeDirX: 0,
        chargeDirY: 0,
        charging: false,
        hitFlash: 0,
        slowTimer: 0,
        dead: false,
      });
      this.spawnBurst(sx, sy, this.sector.accentColor, 8, 55);
    }
    this.showBanner(`WAVE ${waveNum} / ${this.sector.totalWaves}`, 1.8);
  }

  public step(dt: number, input: Chapter2Input): void {
    if (this.finished) return;
    this.time += dt;

    if (this.cleared) {
      this.clearTimer += dt;
      this.updateEffects(dt);
      if (this.clearTimer >= 1.25) {
        this.finishSector();
      }
      return;
    }

    this.elapsedSec += dt;
    this.energy = Math.min(this.maxEnergy, this.energy + dt * 14);
    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.blinkTimer = Math.max(0, this.blinkTimer - dt);
    this.blinkCooldown = Math.max(0, this.blinkCooldown - dt);
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    this.sanctuaryCooldown = Math.max(0, this.sanctuaryCooldown - dt);
    this.supernovaCooldown = Math.max(0, this.supernovaCooldown - dt);
    this.tetherCooldown = Math.max(0, this.tetherCooldown - dt);
    this.warpCooldown = Math.max(0, this.warpCooldown - dt);
    this.shakeTimer = Math.max(0, this.shakeTimer - dt);

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
    }
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.bannerText = null;
    }

    // Aim calculation
    if (input.aimWorldX !== null && input.aimWorldY !== null) {
      this.aimAngle = Math.atan2(input.aimWorldY - this.py, input.aimWorldX - this.px);
    } else {
      const target = this.findClosestTarget();
      if (target) {
        this.aimAngle = Math.atan2(target.y - this.py, target.x - this.px);
      }
    }

    // Q Tether Slingshot
    if (input.tetherPressed && this.tetherCooldown <= 0) {
      if (this.activeTether) {
        this.activeTether = null;
      } else {
        let bestPylon: { x: number; y: number } | null = null;
        let bestDist = 230;
        for (const p of this.sector.pylons) {
          const d = Math.hypot(p.x - this.px, p.y - this.py);
          if (d < bestDist) {
            bestDist = d;
            bestPylon = p;
          }
        }
        if (bestPylon) {
          const angle = Math.atan2(this.py - bestPylon.y, this.px - bestPylon.x);
          this.activeTether = {
            x: bestPylon.x,
            y: bestPylon.y,
            angle,
            radius: Math.max(42, Math.min(140, bestDist)),
            angVel: 4.2,
            timer: 1.4,
          };
          this.tetherCooldown = 2.0;
          audio.playSfx('webSwing');
          this.spawnBurst(bestPylon.x, bestPylon.y, '#38bdf8', 10, 75);
        }
      }
    }

    // SPACE / SHIFT Phase Blink
    if (input.blinkPressed && this.blinkCooldown <= 0 && this.energy >= 20) {
      let dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      let dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      if (dx === 0 && dy === 0) {
        dx = Math.cos(this.aimAngle);
        dy = Math.sin(this.aimAngle);
      } else {
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;
      }
      this.activeTether = null;
      this.pvx = dx * 390;
      this.pvy = dy * 390;
      this.blinkTimer = 0.2;
      this.invulnTimer = Math.max(this.invulnTimer, 0.26);
      this.blinkCooldown = 1.1;
      this.energy -= 20;
      audio.playSfx('phaseBlink');
      this.spawnBurst(this.px, this.py, '#38bdf8', 12, 95);
    }

    // E Astral Web Sanctuary
    if (input.sanctuaryPressed && this.sanctuaryCooldown <= 0 && this.energy >= 35) {
      this.energy -= 35;
      this.sanctuaryCooldown = 5.5;
      if (this.sanctuaries.length >= 2) this.sanctuaries.shift();
      this.sanctuaries.push({
        x: this.px,
        y: this.py,
        radius: 56,
        life: 6.5,
        maxLife: 6.5,
        angle: 0,
      });
      audio.playSfx('turretPlace');
      this.spawnBurst(this.px, this.py, '#22d3ee', 14, 70);
    }

    // K Supernova Web Burst
    if (input.supernovaPressed && this.supernovaCooldown <= 0 && this.energy >= 45) {
      this.energy -= 45;
      this.supernovaCooldown = 4.5;
      this.supernovaWaves.push({ x: this.px, y: this.py, r: 10, maxR: 135, life: 0.35 });
      audio.playSfx('empBurst');
      this.addShake(4.2, 0.25);

      // Clear enemy bullets + blast enemies inside blast radius
      this.projectiles = this.projectiles.filter(
        (pr) => pr.fromPlayer || Math.hypot(pr.x - this.px, pr.y - this.py) > 135
      );
      for (const e of this.enemies) {
        if (!e.dead && Math.hypot(e.x - this.px, e.y - this.py) <= 135) {
          this.damageEnemy(e, 5);
        }
      }
      if (this.boss && this.boss.state !== 'defeated') {
        if (Math.hypot(this.boss.x - this.px, this.boss.y - this.py) <= 145) {
          this.damageBoss(6);
        }
      }
    }

    // Shoot 360 Plasma Silk Bolts
    if (input.shoot && this.shootCooldown <= 0) {
      this.shootCooldown = 0.14;
      const webDesign = getWebDesignById(this.webDesignId);
      const bx = this.px + Math.cos(this.aimAngle) * 10;
      const by = this.py + Math.sin(this.aimAngle) * 10;
      this.projectiles.push({
        fromPlayer: true,
        kind: undefined as never,
        x: bx,
        y: by,
        vx: Math.cos(this.aimAngle) * 320,
        vy: Math.sin(this.aimAngle) * 320,
        r: 3.5,
        damage: 1,
        life: 1.25,
        color: webDesign.primaryHex,
      } as Ch2Projectile);
      audio.playSfx('laserShot');
    }

    // Movement Physics
    if (this.activeTether) {
      const t = this.activeTether;
      t.timer -= dt;
      t.angle += t.angVel * dt;
      this.px = t.x + Math.cos(t.angle) * t.radius;
      this.py = t.y + Math.sin(t.angle) * t.radius;
      this.pvx = -Math.sin(t.angle) * t.angVel * t.radius;
      this.pvy = Math.cos(t.angle) * t.angVel * t.radius;
      this.walkCycle += dt * 16;
      if (t.timer <= 0) this.activeTether = null;
    } else if (this.blinkTimer > 0) {
      this.px += this.pvx * dt;
      this.py += this.pvy * dt;
      this.afterimages.push({ x: this.px, y: this.py, angle: this.aimAngle, life: 0.22 });
    } else {
      let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      if (mx !== 0 || my !== 0) {
        const l = Math.hypot(mx, my);
        mx /= l;
        my /= l;
        this.walkCycle += dt * 14;
      }
      const accel = 980;
      this.pvx += mx * accel * dt;
      this.pvy += my * accel * dt;

      // Gravity well pull
      if (this.sector.gravityWells) {
        for (const gw of this.sector.gravityWells) {
          const dx = gw.x - this.px;
          const dy = gw.y - this.py;
          const d = Math.hypot(dx, dy);
          if (d > 8 && d < gw.radius) {
            const pull = (1 - d / gw.radius) * gw.strength;
            this.pvx += (dx / d) * pull * dt;
            this.pvy += (dy / d) * pull * dt;
          }
          if (d < 16 && this.invulnTimer <= 0) {
            this.damagePlayer(1);
            this.pvx = -(dx / Math.max(1, d)) * 240;
            this.pvy = -(dy / Math.max(1, d)) * 240;
          }
        }
      }

      const damping = Math.pow(0.002, dt);
      this.pvx *= damping;
      this.pvy *= damping;
      const spd = Math.hypot(this.pvx, this.pvy);
      if (spd > 168) {
        this.pvx = (this.pvx / spd) * 168;
        this.pvy = (this.pvy / spd) * 168;
      }

      this.px += this.pvx * dt;
      this.py += this.pvy * dt;
    }

    this.resolveArenaBoundsAndWalls();

    // Warp Pads
    if (this.sector.warpPairs && this.warpCooldown <= 0) {
      for (const wp of this.sector.warpPairs) {
        if (Math.hypot(this.px - wp.ax, this.py - wp.ay) < 16) {
          this.px = wp.bx;
          this.py = wp.by;
          this.warpCooldown = 1.2;
          audio.playSfx('phaseBlink');
          this.spawnBurst(wp.bx, wp.by, '#a78bfa', 14, 90);
          break;
        }
        if (Math.hypot(this.px - wp.bx, this.py - wp.by) < 16) {
          this.px = wp.ax;
          this.py = wp.ay;
          this.warpCooldown = 1.2;
          audio.playSfx('phaseBlink');
          this.spawnBurst(wp.ax, wp.ay, '#a78bfa', 14, 90);
          break;
        }
      }
    }

    // Rotating Solar Lasers hazard (Sector 2-2)
    if (this.sector.hazardKind === 'rotatingLasers' && this.invulnTimer <= 0 && this.blinkTimer <= 0) {
      const cx = this.sector.arenaWidth * 0.5;
      const cy = this.sector.arenaHeight * 0.5;
      const beamAng = this.time * 0.72;
      for (let b = 0; b < 2; b++) {
        const a = beamAng + b * Math.PI;
        const bx = Math.cos(a);
        const by = Math.sin(a);
        const relX = this.px - cx;
        const relY = this.py - cy;
        const proj = relX * bx + relY * by;
        if (proj > 14 && proj < 240) {
          const perp = Math.abs(relX * -by + relY * bx);
          if (perp < 8) {
            this.damagePlayer(1);
            break;
          }
        }
      }
    }

    // Update Sanctuaries
    for (let i = this.sanctuaries.length - 1; i >= 0; i--) {
      const s = this.sanctuaries[i];
      s.life -= dt;
      s.angle += dt * 1.4;
      if (Math.hypot(this.px - s.x, this.py - s.y) < s.radius) {
        this.energy = Math.min(this.maxEnergy, this.energy + dt * 22);
      }
      if (s.life <= 0) this.sanctuaries.splice(i, 1);
    }

    // Update Pickups
    for (const p of this.pickups) {
      if (p.collected) continue;
      p.pulse += dt * 4;
      if (Math.hypot(this.px - p.x, this.py - p.y) < 18) {
        p.collected = true;
        if (p.kind === 'core') {
          this.coresCollected += 1;
          this.scoreEarned += 300;
          this.coinsEarned += 40;
          audio.playSfx('crystal');
          this.spawnBurst(p.x, p.y, '#38bdf8', 12, 85);
        } else if (p.kind === 'coin') {
          this.coinsEarned += 15;
          this.scoreEarned += 50;
          audio.playSfx('coin');
        } else if (p.kind === 'heal') {
          this.hp = Math.min(this.maxHp, this.hp + 1);
          audio.playSfx('checkpoint');
        }
      }
    }

    // Update Enemies & Boss
    this.updateEnemies(dt);
    if (this.boss) this.updateBoss(dt);
    this.updateProjectiles(dt);
    this.updateEffects(dt);

    // Check Wave Clear / Sector Clear
    if (!this.sector.isBossSector) {
      const aliveCount = this.enemies.filter((e) => !e.dead).length;
      if (aliveCount === 0 && this.waveDelayTimer <= 0) {
        if (this.wave < this.sector.totalWaves) {
          this.waveDelayTimer = 1.4;
        } else if (this.coresCollected >= this.coresTotal) {
          this.triggerClear();
        } else {
          this.showBanner('Collect the remaining Star Cores!', 2.0);
        }
      }
      if (this.waveDelayTimer > 0) {
        this.waveDelayTimer -= dt;
        if (this.waveDelayTimer <= 0) {
          this.wave += 1;
          this.spawnWave(this.wave);
        }
      }
    }

    this.updateCamera(dt);
    this.hudThrottle += dt;
    if (this.hudThrottle >= 0.08) {
      this.hudThrottle = 0;
      this.emitHud();
    }
  }

  private resolveArenaBoundsAndWalls(): void {
    const r = 9;
    this.px = Math.max(18 + r, Math.min(this.sector.arenaWidth - 18 - r, this.px));
    this.py = Math.max(18 + r, Math.min(this.sector.arenaHeight - 18 - r, this.py));
    if (this.sector.walls) {
      for (const w of this.sector.walls) {
        const cx = Math.max(w.x, Math.min(this.px, w.x + w.w));
        const cy = Math.max(w.y, Math.min(this.py, w.y + w.h));
        const dx = this.px - cx;
        const dy = this.py - cy;
        const dist = Math.hypot(dx, dy);
        if (dist < r && dist > 0.001) {
          this.px = cx + (dx / dist) * r;
          this.py = cy + (dy / dist) * r;
        }
      }
    }
  }

  private findClosestTarget(): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let bestDist = Infinity;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - this.px, e.y - this.py);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    if (this.boss && this.boss.state !== 'defeated') {
      const d = Math.hypot(this.boss.x - this.px, this.boss.y - this.py);
      if (d < bestDist) best = this.boss;
    }
    return best;
  }

  private updateEnemies(dt: number): void {
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.slowTimer = Math.max(0, e.slowTimer - dt);

      // Slow inside player's Web Sanctuary
      let insideSanctuary = false;
      for (const s of this.sanctuaries) {
        if (Math.hypot(e.x - s.x, e.y - s.y) < s.radius) {
          insideSanctuary = true;
          break;
        }
      }
      const speedMult = insideSanctuary || e.slowTimer > 0 ? 0.45 : 1;

      const dx = this.px - e.x;
      const dy = this.py - e.y;
      const dist = Math.max(1, Math.hypot(dx, dy));

      if (e.kind === 'voidDrone') {
        const ang = Math.atan2(dy, dx);
        const targetDist = 115;
        const radial = dist > targetDist ? 58 : -35;
        e.vx = (Math.cos(ang) * radial - Math.sin(ang) * 48) * speedMult;
        e.vy = (Math.sin(ang) * radial + Math.cos(ang) * 48) * speedMult;
        e.timer -= dt * speedMult;
        if (e.timer <= 0) {
          e.timer = 1.9;
          this.projectiles.push({
            fromPlayer: false,
            x: e.x,
            y: e.y,
            vx: (dx / dist) * 145,
            vy: (dy / dist) * 145,
            r: 3.5,
            damage: 1,
            life: 2.2,
            color: '#f43f5e',
          });
        }
      } else if (e.kind === 'sawBot') {
        e.timer -= dt;
        if (!e.charging) {
          e.vx = (dx / dist) * 58 * speedMult;
          e.vy = (dy / dist) * 58 * speedMult;
          if (e.timer <= 0 && dist < 190) {
            e.charging = true;
            e.chargeDirX = dx / dist;
            e.chargeDirY = dy / dist;
            e.timer = 0.65;
          }
        } else {
          e.vx = e.chargeDirX * 195 * speedMult;
          e.vy = e.chargeDirY * 195 * speedMult;
          if (e.timer <= 0) {
            e.charging = false;
            e.timer = 1.6;
          }
        }
      } else if (e.kind === 'riftTurret') {
        e.vx = 0;
        e.vy = 0;
        e.timer -= dt * speedMult;
        if (e.timer <= 0) {
          e.timer = 2.0;
          const baseAng = this.time * 0.8;
          for (let k = 0; k < 4; k++) {
            const a = baseAng + (k * Math.PI) / 2;
            this.projectiles.push({
              fromPlayer: false,
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * 130,
              vy: Math.sin(a) * 130,
              r: 3.5,
              damage: 1,
              life: 2.4,
              color: '#a78bfa',
            });
          }
        }
      } else if (e.kind === 'voidStalker') {
        e.timer -= dt * speedMult;
        e.vx = (dx / dist) * 92 * speedMult;
        e.vy = (dy / dist) * 92 * speedMult;
        if (e.timer <= 0) {
          e.timer = 2.8;
          e.x = Math.max(36, Math.min(this.sector.arenaWidth - 36, this.px + (Math.random() - 0.5) * 150));
          e.y = Math.max(36, Math.min(this.sector.arenaHeight - 36, this.py + (Math.random() - 0.5) * 150));
          this.spawnBurst(e.x, e.y, '#c084fc', 8, 60);
        }
      } else if (e.kind === 'eliteSentinel') {
        e.vx = (dx / dist) * 54 * speedMult;
        e.vy = (dy / dist) * 54 * speedMult;
        e.timer -= dt * speedMult;
        if (e.timer <= 0) {
          e.timer = 1.75;
          const base = Math.atan2(dy, dx);
          for (let s = -1; s <= 1; s++) {
            const a = base + s * 0.25;
            this.projectiles.push({
              fromPlayer: false,
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * 165,
              vy: Math.sin(a) * 165,
              r: 4,
              damage: 1,
              life: 2.4,
              color: '#e879f9',
            });
          }
        }
      }

      e.x = Math.max(24, Math.min(this.sector.arenaWidth - 24, e.x + e.vx * dt));
      e.y = Math.max(24, Math.min(this.sector.arenaHeight - 24, e.y + e.vy * dt));

      // Tether collision bonus damage or contact hurt
      if (Math.hypot(e.x - this.px, e.y - this.py) < e.r + 8) {
        if (this.activeTether || this.blinkTimer > 0) {
          this.damageEnemy(e, 2);
        } else if (this.invulnTimer <= 0) {
          this.damagePlayer(1);
        }
      }
    }
  }

  private damageEnemy(e: Ch2Enemy, dmg: number): void {
    if (e.dead) return;
    e.hp -= dmg;
    e.hitFlash = 0.12;
    audio.playSfx('hit');
    if (e.hp <= 0) {
      e.dead = true;
      this.enemiesDefeated += 1;
      this.combo = Math.min(12, this.combo + 1);
      this.comboTimer = 3.5;
      this.scoreEarned += 120 * this.combo;
      this.coinsEarned += 18;
      audio.playSfx('enemyDefeat');
      this.spawnBurst(e.x, e.y, this.sector.accentColor, 12, 95);
      if (Math.random() < 0.35) {
        this.pickups.push({ kind: 'coin', x: e.x, y: e.y, collected: false, pulse: 0 });
      } else if (Math.random() < 0.14 && this.hp < this.maxHp) {
        this.pickups.push({ kind: 'heal', x: e.x, y: e.y, collected: false, pulse: 0 });
      }
    }
  }

  private updateBoss(dt: number): void {
    const b = this.boss;
    if (!b) return;
    b.hitFlash = Math.max(0, b.hitFlash - dt);

    if (b.state === 'defeated') {
      b.defeatTimer -= dt;
      if (Math.random() < 0.45) {
        this.spawnBurst(
          b.x + (Math.random() - 0.5) * 40,
          b.y + (Math.random() - 0.5) * 40,
          '#f43f5e',
          6,
          90
        );
      }
      if (b.defeatTimer <= 0) {
        this.triggerClear();
      }
      return;
    }

    const ratio = b.hp / b.maxHp;
    b.phase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;

    b.timer -= dt;
    if (b.state === 'orbit') {
      const targetX = this.sector.arenaWidth * 0.5 + Math.cos(this.time * 1.1) * 190;
      const targetY = this.sector.arenaHeight * 0.32 + Math.sin(this.time * 1.6) * 85;
      b.x += (targetX - b.x) * Math.min(1, dt * 2.8);
      b.y += (targetY - b.y) * Math.min(1, dt * 2.8);
      if (b.timer <= 0) {
        const roll = Math.random();
        if (roll < 0.4) {
          b.state = 'laserSweep';
          b.laserAngle = Math.atan2(this.py - b.y, this.px - b.x) - 0.7;
          b.timer = 2.1;
        } else if (roll < 0.75) {
          b.state = 'droneRing';
          b.timer = 1.6;
          const ringCount = 8 + b.phase * 3;
          for (let i = 0; i < ringCount; i++) {
            const a = (Math.PI * 2 * i) / ringCount;
            this.projectiles.push({
              fromPlayer: false,
              x: b.x,
              y: b.y,
              vx: Math.cos(a) * 145,
              vy: Math.sin(a) * 145,
              r: 4,
              damage: 1,
              life: 2.6,
              color: '#fb7185',
            });
          }
          if (this.enemies.filter((e) => !e.dead).length < 3) {
            this.enemies.push({
              id: this.nextEnemyId++,
              kind: 'voidDrone',
              x: b.x + (Math.random() > 0.5 ? 60 : -60),
              y: b.y + 30,
              vx: 0,
              vy: 0,
              r: 9,
              hp: 3,
              maxHp: 3,
              timer: 1.0,
              chargeDirX: 0,
              chargeDirY: 0,
              charging: false,
              hitFlash: 0,
              slowTimer: 0,
              dead: false,
            });
          }
        } else {
          b.state = 'dash';
          const ang = Math.atan2(this.py - b.y, this.px - b.x);
          b.vx = Math.cos(ang) * (185 + b.phase * 35);
          b.vy = Math.sin(ang) * (185 + b.phase * 35);
          b.timer = 1.0;
        }
      }
    } else if (b.state === 'laserSweep') {
      b.laserAngle += dt * (0.68 + b.phase * 0.16);
      if (this.invulnTimer <= 0 && this.blinkTimer <= 0) {
        const bx = Math.cos(b.laserAngle);
        const by = Math.sin(b.laserAngle);
        const rx = this.px - b.x;
        const ry = this.py - b.y;
        const proj = rx * bx + ry * by;
        if (proj > 12 && proj < 360) {
          const perp = Math.abs(rx * -by + ry * bx);
          if (perp < 8) this.damagePlayer(1);
        }
      }
      if (b.timer <= 0) {
        b.state = 'orbit';
        b.timer = 1.9 - b.phase * 0.25;
      }
    } else if (b.state === 'droneRing') {
      if (b.timer <= 0) {
        b.state = 'orbit';
        b.timer = 1.6;
      }
    } else if (b.state === 'dash') {
      b.x = Math.max(40, Math.min(this.sector.arenaWidth - 40, b.x + b.vx * dt));
      b.y = Math.max(40, Math.min(this.sector.arenaHeight - 40, b.y + b.vy * dt));
      if (b.timer <= 0) {
        b.state = 'orbit';
        b.timer = 1.6;
      }
    }

    if (Math.hypot(this.px - b.x, this.py - b.y) < b.r + 9 && this.invulnTimer <= 0 && this.blinkTimer <= 0) {
      this.damagePlayer(1);
    }
  }

  private damageBoss(dmg: number): void {
    const b = this.boss;
    if (!b || b.state === 'defeated') return;
    b.hp = Math.max(0, b.hp - dmg);
    b.hitFlash = 0.1;
    audio.playSfx('hit');
    if (b.hp <= 0) {
      b.state = 'defeated';
      b.defeatTimer = 1.6;
      this.scoreEarned += 2500;
      this.coinsEarned += 450;
      audio.playSfx('bossDefeat');
      this.addShake(5.5, 0.5);
      this.showBanner(`${b.name} DESTROYED!`, 2.5);
    }
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      if (
        pr.life <= 0 ||
        pr.x < 14 ||
        pr.x > this.sector.arenaWidth - 14 ||
        pr.y < 14 ||
        pr.y > this.sector.arenaHeight - 14
      ) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (
        this.sector.walls?.some(
          (w) => pr.x >= w.x && pr.x <= w.x + w.w && pr.y >= w.y && pr.y <= w.y + w.h
        )
      ) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (pr.fromPlayer) {
        let hit = false;
        for (const e of this.enemies) {
          if (!e.dead && Math.hypot(pr.x - e.x, pr.y - e.y) < e.r + pr.r) {
            this.damageEnemy(e, pr.damage);
            hit = true;
            break;
          }
        }
        if (!hit && this.boss && this.boss.state !== 'defeated') {
          if (Math.hypot(pr.x - this.boss.x, pr.y - this.boss.y) < this.boss.r + pr.r) {
            this.damageBoss(pr.damage);
            hit = true;
          }
        }
        if (hit) this.projectiles.splice(i, 1);
      } else {
        // Blocked by Web Sanctuary dome!
        let blocked = false;
        for (const s of this.sanctuaries) {
          const d = Math.hypot(pr.x - s.x, pr.y - s.y);
          if (d < s.radius && d > s.radius - 10) {
            this.spawnBurst(pr.x, pr.y, '#22d3ee', 4, 45);
            blocked = true;
            break;
          }
        }
        if (blocked) {
          this.projectiles.splice(i, 1);
          continue;
        }
        if (
          this.invulnTimer <= 0 &&
          this.blinkTimer <= 0 &&
          Math.hypot(pr.x - this.px, pr.y - this.py) < 8 + pr.r
        ) {
          this.damagePlayer(pr.damage);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private damagePlayer(amount: number): void {
    if (this.invulnTimer > 0 || this.cleared || this.finished) return;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnTimer = 1.05;
    this.tookDamage = true;
    this.combo = 1;
    this.addShake(3.5, 0.22);
    audio.playSfx('playerHurt');
    this.spawnBurst(this.px, this.py, '#ef4444', 10, 85);

    if (this.hp <= 0) {
      this.lives -= 1;
      if (this.lives <= 0) {
        this.finished = true;
        audio.playMusic('gameOver');
        this.callbacks.onGameOver(this.scoreEarned, this.coinsEarned);
        return;
      }
      this.hp = this.maxHp;
      this.energy = this.maxEnergy;
      this.invulnTimer = 1.6;
      this.spawnBurst(this.px, this.py, '#38bdf8', 16, 110);
    }
    this.emitHud();
  }

  private triggerClear(): void {
    if (this.cleared) return;
    this.cleared = true;
    this.clearTimer = 0;
    audio.playMusic(this.sector.isBossSector ? 'ch2Victory' : 'victory');
    this.spawnBurst(this.px, this.py, '#fde047', 22, 120);
  }

  private finishSector(): void {
    if (this.finished) return;
    this.finished = true;
    const noDamageBonus = !this.tookDamage;
    const bonusCoins = 120 + this.sector.sectorNumber * 50 + (noDamageBonus ? 150 : 0);
    const totalCoins = this.coinsEarned + bonusCoins;
    const totalScore = this.scoreEarned + (noDamageBonus ? 800 : 0);
    const stars = noDamageBonus ? 3 : this.elapsedSec <= 90 ? 2 : 1;

    this.callbacks.onSectorClear({
      sectorId: this.sector.id,
      sectorName: this.sector.name,
      isBossSector: this.sector.isBossSector,
      isFinalChapter2Boss: this.sector.id === 'C2-5',
      coinsEarned: totalCoins,
      scoreEarned: totalScore,
      timeSec: Math.round(this.elapsedSec),
      stars,
      noDamageBonus,
      enemiesDefeatedCount: this.enemiesDefeated,
      nextSectorId: null,
    });
  }

  private addShake(mag: number, dur: number): void {
    if (!this.screenShakeEnabled) return;
    this.shakeMag = Math.max(this.shakeMag, mag);
    this.shakeTimer = Math.max(this.shakeTimer, dur);
  }

  private updateEffects(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      this.afterimages[i].life -= dt;
      if (this.afterimages[i].life <= 0) this.afterimages.splice(i, 1);
    }
    for (let i = this.supernovaWaves.length - 1; i >= 0; i--) {
      const sw = this.supernovaWaves[i];
      sw.life -= dt;
      sw.r += (sw.maxR - sw.r) * Math.min(1, dt * 12);
      if (sw.life <= 0) this.supernovaWaves.splice(i, 1);
    }
    for (const st of this.stars) {
      st.y += st.speed * dt;
      if (st.y > this.sector.arenaHeight) st.y = 0;
    }
  }

  private updateCamera(dt: number): void {
    const targetX = Math.max(
      0,
      Math.min(this.sector.arenaWidth - LOGICAL_WIDTH, this.px - LOGICAL_WIDTH / 2)
    );
    const targetY = Math.max(
      0,
      Math.min(this.sector.arenaHeight - LOGICAL_HEIGHT, this.py - LOGICAL_HEIGHT / 2)
    );
    const lerp = Math.min(1, dt * 8);
    this.camX += (targetX - this.camX) * lerp;
    this.camY += (targetY - this.camY) * lerp;
  }

  private emitHud(): void {
    this.callbacks.onHudUpdate({
      sectorId: this.sector.id,
      sectorName: this.sector.name,
      hp: this.hp,
      maxHp: this.maxHp,
      energy: Math.round(this.energy),
      maxEnergy: this.maxEnergy,
      lives: this.lives,
      wave: this.wave,
      totalWaves: this.sector.totalWaves,
      enemiesRemaining: this.enemies.filter((e) => !e.dead).length,
      coresCollected: this.coresCollected,
      coresTotal: this.coresTotal,
      coins: this.coinsEarned,
      spikeyCoinsTotal: this.spikeyCoinsTotal,
      score: this.scoreEarned,
      combo: this.combo,
      elapsedSec: Math.round(this.elapsedSec),
      cooldowns: {
        blink: Math.min(1, this.blinkCooldown / 1.1),
        sanctuary: Math.min(1, this.sanctuaryCooldown / 5.5),
        supernova: Math.min(1, this.supernovaCooldown / 4.5),
        tether: Math.min(1, this.tetherCooldown / 2.0),
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
      isCreator: this.isCreator,
    });
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.imageSmoothingEnabled = false;
    const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeMag * 2 : 0;
    const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * this.shakeMag * 2 : 0;

    // Deep cosmic nebula gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
    grad.addColorStop(0, this.sector.bgPrimary);
    grad.addColorStop(1, this.sector.bgSecondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    ctx.save();
    ctx.translate(Math.round(-this.camX + shakeX), Math.round(-this.camY + shakeY));

    // Parallax starfield
    for (const s of this.stars) {
      ctx.fillStyle = `rgba(226, 232, 240, ${s.alpha})`;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.size, s.size);
    }

    // Cosmic hex/square grid floor
    ctx.strokeStyle = this.sector.gridColor;
    ctx.lineWidth = 1;
    const step = 32;
    for (let x = 16; x < this.sector.arenaWidth; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.lineTo(x, this.sector.arenaHeight - 16);
      ctx.stroke();
    }
    for (let y = 16; y < this.sector.arenaHeight; y += step) {
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(this.sector.arenaWidth - 16, y);
      ctx.stroke();
    }

    // Arena outer energy border
    ctx.strokeStyle = this.sector.accentColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, this.sector.arenaWidth - 32, this.sector.arenaHeight - 32);

    // Gravity wells
    if (this.sector.gravityWells) {
      for (const gw of this.sector.gravityWells) {
        ctx.strokeStyle = 'rgba(232, 121, 249, 0.35)';
        ctx.beginPath();
        ctx.arc(gw.x, gw.y, gw.radius * (0.7 + 0.15 * Math.sin(this.time * 3)), 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#090214';
        ctx.beginPath();
        ctx.arc(gw.x, gw.y, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e879f9';
        ctx.stroke();
      }
    }

    // Rotating Solar Lasers
    if (this.sector.hazardKind === 'rotatingLasers') {
      const cx = this.sector.arenaWidth * 0.5;
      const cy = this.sector.arenaHeight * 0.5;
      const beamAng = this.time * 0.72;
      for (let b = 0; b < 2; b++) {
        const a = beamAng + b * Math.PI;
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.35)';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * 240, cy + Math.sin(a) * 240);
        ctx.stroke();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * 240, cy + Math.sin(a) * 240);
        ctx.stroke();
      }
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Walls
    if (this.sector.walls) {
      for (const w of this.sector.walls) {
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.strokeStyle = this.sector.accentColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(w.x, w.y, w.w, w.h);
      }
    }

    // Warp Pads
    if (this.sector.warpPairs) {
      for (const wp of this.sector.warpPairs) {
        for (const pt of [
          { x: wp.ax, y: wp.ay },
          { x: wp.bx, y: wp.by },
        ]) {
          ctx.strokeStyle = '#a78bfa';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 12 + Math.sin(this.time * 5) * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(139, 92, 246, 0.35)';
          ctx.fill();
        }
      }
    }

    // Tether Pylons
    for (const p of this.sector.pylons) {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    }

    // Sanctuaries
    const webDesign = getWebDesignById(this.webDesignId);
    for (const s of this.sanctuaries) {
      const alpha = Math.max(0.2, s.life / s.maxLife);
      ctx.strokeStyle = webDesign.primaryHex;
      ctx.globalAlpha = alpha * 0.85;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = s.angle + (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + Math.cos(a) * s.radius, s.y + Math.sin(a) * s.radius);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Active Tether Beam
    if (this.activeTether) {
      ctx.strokeStyle = webDesign.secondaryHex;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.activeTether.x, this.activeTether.y);
      ctx.lineTo(this.px, this.py);
      ctx.stroke();
    }

    // Pickups
    for (const p of this.pickups) {
      if (p.collected) continue;
      const bob = Math.sin(p.pulse) * 2;
      if (p.kind === 'core') {
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - 7 + bob);
        ctx.lineTo(p.x + 6, p.y + bob);
        ctx.lineTo(p.x, p.y + 7 + bob);
        ctx.lineTo(p.x - 6, p.y + bob);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#e0f2fe';
        ctx.stroke();
      } else if (p.kind === 'coin') {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(p.x, p.y + bob, 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(p.x - 4, p.y - 3 + bob, 8, 6);
      }
    }

    // Enemies
    for (const e of this.enemies) {
      if (e.dead) continue;
      ctx.fillStyle =
        e.hitFlash > 0
          ? '#ffffff'
          : e.kind === 'sawBot'
          ? '#fb923c'
          : e.kind === 'riftTurret'
          ? '#a78bfa'
          : e.kind === 'voidStalker'
          ? '#c084fc'
          : e.kind === 'eliteSentinel'
          ? '#e879f9'
          : '#38bdf8';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Enemy core eye
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(e.x - 2, e.y - 2, 4, 4);
    }

    // Boss: Chronos Cyber-Widow
    if (this.boss && this.boss.state !== 'defeated') {
      const b = this.boss;
      if (b.state === 'laserSweep') {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.45)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + Math.cos(b.laserAngle) * 360, b.y + Math.sin(b.laserAngle) * 360);
        ctx.stroke();
        ctx.strokeStyle = '#fff1f2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + Math.cos(b.laserAngle) * 360, b.y + Math.sin(b.laserAngle) * 360);
        ctx.stroke();
      }
      // 8 Cyber Legs
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 2;
      for (let side of [-1, 1]) {
        for (let l = 0; l < 4; l++) {
          const ang = (l - 1.5) * 0.42 + (side === -1 ? Math.PI : 0);
          const wave = Math.sin(this.time * 8 + l) * 3;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x + Math.cos(ang) * (b.r + 14), b.y + Math.sin(ang) * (b.r + 10) + wave);
          ctx.stroke();
        }
      }
      ctx.fillStyle = b.hitFlash > 0 ? '#ffffff' : '#881337';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    // Supernova rings
    for (const sw of this.supernovaWaves) {
      ctx.strokeStyle = webDesign.primaryHex;
      ctx.lineWidth = 3;
      ctx.globalAlpha = Math.max(0, sw.life / 0.35);
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Blink afterimages
    const skin = getSkinById(this.skinId);
    for (const ai of this.afterimages) {
      ctx.globalAlpha = Math.max(0, ai.life * 2.5);
      ctx.fillStyle = skin.eyeGlint;
      ctx.beginPath();
      ctx.arc(ai.x, ai.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Top-Down 8-Legged Spikey Spider Avatar (using equipped skin!)
    if (this.invulnTimer <= 0 || Math.floor(this.time * 16) % 2 === 0) {
      ctx.save();
      ctx.translate(this.px, this.py);
      ctx.rotate(this.aimAngle);
      ctx.strokeStyle = skin.bodyDark;
      ctx.lineWidth = 1.6;
      for (const side of [-1, 1]) {
        for (let l = 0; l < 4; l++) {
          const swing = Math.sin(this.walkCycle + l * 1.4) * 2.2;
          const baseY = (l - 1.5) * 3.5;
          ctx.beginPath();
          ctx.moveTo(0, baseY);
          ctx.lineTo(swing, baseY + side * 6);
          ctx.lineTo(swing * 0.5 - 2, baseY + side * 10);
          ctx.stroke();
        }
      }
      ctx.fillStyle = skin.bodyMid;
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = skin.bodyTop;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      // Glowing cyber eyes facing aim direction
      ctx.fillStyle = skin.eyeGlint;
      ctx.fillRect(3, -3.5, 3, 2.2);
      ctx.fillRect(3, 1.3, 3, 2.2);
      ctx.restore();
    }

    // Projectiles
    for (const pr of this.projectiles) {
      ctx.fillStyle = pr.color;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.ceil(p.size), Math.ceil(p.size));
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  }
}
