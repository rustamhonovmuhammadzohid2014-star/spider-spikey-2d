import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Coins, Heart, Pause, Shield, Sparkles, Star, Zap } from 'lucide-react';
import { audio } from '../game/audio';
import { Chapter2Engine, Chapter2Input } from '../game/chapter2Engine';
import {
  Chapter2ClearSummary,
  Chapter2HudSnapshot,
  Chapter2SectorDef,
  GameSettings,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
} from '../game/types';

interface Chapter2CanvasProps {
  sector: Chapter2SectorDef;
  lives: number;
  settings: GameSettings;
  equippedSkin: string;
  equippedWebDesign: string;
  spikeyCoinsTotal: number;
  isCreator?: boolean;
  paused: boolean;
  restartNonce: number;
  onPauseToggle: () => void;
  onSectorClear: (summary: Chapter2ClearSummary) => void;
  onGameOver: (score: number, coins: number) => void;
}

export const Chapter2Canvas: React.FC<Chapter2CanvasProps> = ({
  sector,
  lives,
  settings,
  equippedSkin,
  equippedWebDesign,
  spikeyCoinsTotal,
  isCreator = false,
  paused,
  restartNonce,
  onPauseToggle,
  onSectorClear,
  onGameOver,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Chapter2Engine | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const keysHeld = useRef<Set<string>>(new Set());
  const pointerDownRef = useRef(false);
  const aimLogicalRef = useRef<{ x: number; y: number } | null>(null);
  const touchHeld = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false,
    blink: false,
    sanctuary: false,
    supernova: false,
    tether: false,
  });
  const prevEdge = useRef({
    blink: false,
    sanctuary: false,
    supernova: false,
    tether: false,
  });

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [hud, setHud] = useState<Chapter2HudSnapshot>({
    sectorId: sector.id,
    sectorName: sector.name,
    hp: 5,
    maxHp: 5,
    energy: 100,
    maxEnergy: 100,
    lives,
    wave: 1,
    totalWaves: sector.totalWaves,
    enemiesRemaining: 0,
    coresCollected: 0,
    coresTotal: sector.isBossSector ? 0 : 3,
    coins: 0,
    spikeyCoinsTotal,
    score: 0,
    combo: 1,
    elapsedSec: 0,
    cooldowns: { blink: 0, sanctuary: 0, supernova: 0, tether: 0 },
    boss: null,
    bannerText: sector.tutorialHint,
    isCreator,
  });

  useEffect(() => {
    const checkTouch = () => {
      const hasTouch =
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        window.matchMedia('(pointer: coarse)').matches;
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
    window.addEventListener('resize', checkTouch);
    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  useEffect(() => {
    keysHeld.current.clear();
    pointerDownRef.current = false;
    prevEdge.current = { blink: false, sanctuary: false, supernova: false, tether: false };

    const engine = new Chapter2Engine(
      sector,
      lives,
      {
        onHudUpdate: (snap) => setHud({ ...snap, spikeyCoinsTotal, isCreator }),
        onSectorClear: (sum) => onSectorClear(sum),
        onGameOver: (sc, co) => onGameOver(sc, co),
      },
      equippedSkin,
      equippedWebDesign,
      settings.graphicsQuality ?? 'high',
      spikeyCoinsTotal,
      isCreator,
      settings.screenShake !== false
    );
    engineRef.current = engine;
    return () => {
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sector.id, restartNonce]);

  useEffect(() => {
    engineRef.current?.updateCosmetics(
      equippedSkin,
      equippedWebDesign,
      settings.graphicsQuality ?? 'high',
      spikeyCoinsTotal,
      isCreator,
      settings.screenShake !== false
    );
  }, [equippedSkin, equippedWebDesign, settings.graphicsQuality, spikeyCoinsTotal, isCreator, settings.screenShake]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      audio.unlock();
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        onPauseToggle();
        return;
      }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      keysHeld.current.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.current.delete(e.code);
    };
    const onBlur = () => {
      keysHeld.current.clear();
      pointerDownRef.current = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [onPauseToggle]);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let acc = 0;
    const STEP = 1 / 60;

    const buildInput = (engine: Chapter2Engine): Chapter2Input => {
      const kb = settingsRef.current.keyBindings;
      const held = keysHeld.current;
      const th = touchHeld.current;

      const blink = held.has(kb.jump) || held.has(kb.sprint) || held.has('ShiftRight') || th.blink;
      const sanctuary = held.has(kb.webNet) || held.has(kb.interact) || th.sanctuary;
      const supernova = held.has(kb.special) || th.supernova;
      const tether = held.has(kb.webSwing) || th.tether;

      const cam = engine.getCameraOrigin();
      const aimLogical = aimLogicalRef.current;

      const res: Chapter2Input = {
        up: held.has(kb.up) || held.has('ArrowUp') || th.up,
        down: held.has(kb.down) || held.has('ArrowDown') || th.down,
        left: held.has(kb.left) || held.has('ArrowLeft') || th.left,
        right: held.has(kb.right) || held.has('ArrowRight') || th.right,
        shoot: held.has(kb.webAttack) || pointerDownRef.current || th.shoot,
        blinkPressed: blink && !prevEdge.current.blink,
        sanctuaryPressed: sanctuary && !prevEdge.current.sanctuary,
        supernovaPressed: supernova && !prevEdge.current.supernova,
        tetherPressed: tether && !prevEdge.current.tether,
        aimWorldX: aimLogical ? aimLogical.x + cam.camX : null,
        aimWorldY: aimLogical ? aimLogical.y + cam.camY : null,
      };
      prevEdge.current = { blink, sanctuary, supernova, tether };
      return res;
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;
      const engine = engineRef.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (engine && ctx) {
        if (!pausedRef.current) {
          acc += dt;
          while (acc >= STEP) {
            engine.step(STEP, buildInput(engine));
            acc -= STEP;
          }
        }
        engine.render(ctx);
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const updatePointerPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const logicalAspect = LOGICAL_WIDTH / LOGICAL_HEIGHT;
    const rectAspect = rect.width / rect.height;
    let drawW = rect.width;
    let drawH = rect.height;
    let offX = 0;
    let offY = 0;
    if (settingsRef.current.resolutionScale === 'auto') {
      if (rectAspect > logicalAspect) {
        drawW = rect.height * logicalAspect;
        offX = (rect.width - drawW) / 2;
      } else {
        drawH = rect.width / logicalAspect;
        offY = (rect.height - drawH) / 2;
      }
    }
    const lx = ((e.clientX - rect.left - offX) / drawW) * LOGICAL_WIDTH;
    const ly = ((e.clientY - rect.top - offY) / drawH) * LOGICAL_HEIGHT;
    if (lx >= 0 && lx <= LOGICAL_WIDTH && ly >= 0 && ly <= LOGICAL_HEIGHT) {
      aimLogicalRef.current = { x: lx, y: ly };
    }
  }, []);

  const bindTouch = (key: keyof typeof touchHeld.current) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      audio.unlock();
      e.currentTarget.setPointerCapture(e.pointerId);
      touchHeld.current[key] = true;
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      touchHeld.current[key] = false;
    },
    onPointerCancel: () => {
      touchHeld.current[key] = false;
    },
  });

  const showTouch =
    settings.touchMode === 'on' || (settings.touchMode === 'auto' && isTouchDevice);

  const totalSpikeyCoins = hud.spikeyCoinsTotal + hud.coins;

  return (
    <div className="relative w-full h-full bg-[#03060f] flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={LOGICAL_WIDTH}
        height={LOGICAL_HEIGHT}
        onPointerMove={updatePointerPos}
        onPointerDown={(e) => {
          audio.unlock();
          updatePointerPos(e);
          if (e.button === 0) pointerDownRef.current = true;
        }}
        onPointerUp={() => {
          pointerDownRef.current = false;
        }}
        onPointerLeave={() => {
          pointerDownRef.current = false;
        }}
        className="pixelated block w-full h-full object-contain cursor-crosshair"
      />

      {/* Chapter 2 Astral Void Top-Down HUD */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Chapter 2 Shield / HP & Energy */}
          <div className="pointer-events-auto pixel-panel px-3 py-2 bg-slate-950/90 border-cyan-500/60 flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: hud.maxHp }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${
                      i < hud.hp
                        ? 'text-cyan-400 fill-cyan-400'
                        : 'text-slate-700 fill-slate-900'
                    }`}
                  />
                ))}
              </div>
              <span className="text-slate-500" aria-hidden="true">·</span>
              <span className="font-mono-num text-xs font-bold text-slate-200">
                ×{hud.lives}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <div className="w-24 h-2 bg-slate-900 border border-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-sky-300 transition-all"
                  style={{ width: `${Math.round((hud.energy / hud.maxEnergy) * 100)}%` }}
                />
              </div>
              <span className="font-mono-num text-[10px] text-cyan-200">{hud.energy}</span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="font-pixel text-cyan-300 whitespace-nowrap">CH2 · {hud.sectorId}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[140px] sm:max-w-none">{hud.sectorName}</span>
            </div>
          </div>

          {/* Center: Chapter 2 Wave, Cores & Ability Cooldowns */}
          <div className="hidden md:flex items-center gap-2 pointer-events-auto pixel-panel px-3 py-1.5 bg-slate-950/90 border-cyan-500/40">
            <div className="text-[11px] font-mono-num text-slate-200 px-2 border-r border-slate-800">
              Wave {hud.wave}/{hud.totalWaves}
              {hud.coresTotal > 0 ? ` · Cores ${hud.coresCollected}/${hud.coresTotal}` : ''}
            </div>
            {[
              { label: 'Blink', key: 'SPACE', cd: hud.cooldowns.blink },
              { label: 'Shield', key: 'E', cd: hud.cooldowns.sanctuary },
              { label: 'Nova', key: 'K', cd: hud.cooldowns.supernova },
              { label: 'Tether', key: 'Q', cd: hud.cooldowns.tether },
            ].map((ab) => (
              <div
                key={ab.label}
                className="relative px-2 py-1 border border-slate-700 bg-slate-900/90 text-[10px]"
              >
                <div
                  className="absolute inset-x-0 bottom-0 bg-cyan-400/25"
                  style={{ height: `${Math.round(ab.cd * 100)}%` }}
                />
                <span className="relative font-pixel text-cyan-200 whitespace-nowrap">
                  {ab.label} ({ab.key})
                </span>
              </div>
            ))}
          </div>

          {/* Right: Coins, Combo, Score, Pause */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="pixel-panel px-3 py-2 bg-slate-950/90 border-cyan-500/50 flex items-center gap-2.5 text-xs">
              <div className="flex items-center gap-1 font-mono-num font-bold text-amber-300">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>{hud.isCreator ? '∞' : totalSpikeyCoins.toLocaleString()}</span>
              </div>
              {hud.combo > 1 && (
                <>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="font-pixel text-[10px] text-emerald-300">×{hud.combo}</span>
                </>
              )}
              <span className="hidden sm:inline text-slate-600" aria-hidden="true">·</span>
              <span className="hidden sm:inline font-mono-num font-bold text-white">
                {hud.score.toString().padStart(5, '0')}
              </span>
            </div>
            <button
              type="button"
              onClick={onPauseToggle}
              aria-label="Pause"
              className="pixel-btn bg-slate-900 hover:bg-slate-800 border-cyan-500/50 text-cyan-200 p-2.5 flex items-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Banner */}
        <div className="flex flex-col items-center my-auto pointer-events-none">
          {hud.bannerText && (
            <div className="pixel-panel px-4 py-2 bg-slate-950/90 border-cyan-400/70 text-center max-w-xl">
              <p className="font-pixel text-xs text-cyan-200">{hud.bannerText}</p>
            </div>
          )}
        </div>

        {/* Bottom: Cyber-Widow Boss Bar + Mobile 360° Controls */}
        <div className="flex flex-col gap-2">
          {hud.boss && hud.boss.active && (
            <div className="mx-auto w-full max-w-lg pixel-panel px-4 py-2 bg-slate-950/90 border-rose-500/70">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-pixel text-rose-400">{hud.boss.name}</span>
                <span className="font-mono-num text-slate-300">
                  Phase {hud.boss.phase} · {hud.boss.hp}/{hud.boss.maxHp}
                </span>
              </div>
              <div className="h-3 w-full bg-slate-900 border border-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-fuchsia-400 transition-all"
                  style={{ width: `${Math.max(0, (hud.boss.hp / hud.boss.maxHp) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {showTouch && (
            <div className="pointer-events-auto flex items-end justify-between gap-2 pb-1 select-none touch-none">
              <div className="grid grid-cols-3 gap-1">
                <div />
                <button type="button" {...bindTouch('up')} className="pixel-btn w-11 h-11 bg-slate-900/85 text-cyan-200 font-pixel">▲</button>
                <div />
                <button type="button" {...bindTouch('left')} className="pixel-btn w-11 h-11 bg-slate-900/85 text-cyan-200 font-pixel">◀</button>
                <button type="button" {...bindTouch('down')} className="pixel-btn w-11 h-11 bg-slate-900/85 text-cyan-200 font-pixel">▼</button>
                <button type="button" {...bindTouch('right')} className="pixel-btn w-11 h-11 bg-slate-900/85 text-cyan-200 font-pixel">▶</button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" {...bindTouch('sanctuary')} className="pixel-btn px-3 py-2.5 bg-cyan-950/90 text-cyan-200 font-pixel text-[9px] flex items-center gap-1"><Shield className="w-3 h-3" />E</button>
                <button type="button" {...bindTouch('supernova')} className="pixel-btn px-3 py-2.5 bg-fuchsia-950/90 text-fuchsia-200 font-pixel text-[9px] flex items-center gap-1"><Sparkles className="w-3 h-3" />K</button>
                <button type="button" {...bindTouch('blink')} className="pixel-btn px-3 py-2.5 bg-amber-950/90 text-amber-200 font-pixel text-[9px] flex items-center gap-1"><Star className="w-3 h-3" />BLINK</button>
                <button type="button" {...bindTouch('shoot')} className="pixel-btn px-3 py-2.5 bg-sky-700/90 text-white font-pixel text-[9px]">FIRE</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
