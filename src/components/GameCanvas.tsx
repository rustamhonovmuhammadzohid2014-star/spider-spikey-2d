import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameEngine, InputState } from '../game/engine';
import { audio } from '../game/audio';
import {
  GameSettings,
  HudSnapshot,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  SaveData,
  StageClearSummary,
  StageDef,
} from '../game/types';
import { HUD, VirtualButtonKey } from './HUD';

interface GameCanvasProps {
  stage: StageDef;
  saveData: SaveData;
  settings: GameSettings;
  equippedSkin?: string;
  equippedWebDesign?: string;
  spikeyCoinsTotal?: number;
  paused: boolean;
  restartNonce: number;
  onPauseToggle: () => void;
  onStageClear: (summary: StageClearSummary) => void;
  onGameOver: (score: number, coins: number) => void;
  onSaveProgress: (updater: (save: SaveData) => void) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  stage,
  saveData,
  settings,
  equippedSkin = 'classic',
  equippedWebDesign = 'classic_white',
  spikeyCoinsTotal = 0,
  paused,
  restartNonce,
  onPauseToggle,
  onStageClear,
  onGameOver,
  onSaveProgress,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const keysHeld = useRef<Set<string>>(new Set());
  const virtualHeld = useRef<Record<VirtualButtonKey, boolean>>({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    sprint: false,
    webAttack: false,
    special: false,
    interact: false,
    webSwing: false,
    webNet: false,
  });

  const prevEdge = useRef({
    jump: false,
    sprint: false,
    webAttack: false,
    special: false,
    interact: false,
    webSwing: false,
    webNet: false,
  });

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const [hud, setHud] = useState<HudSnapshot>({
    hp: 4,
    maxHp: 4,
    lives: saveData.lives,
    coins: 0,
    spikeyCoinsTotal,
    crystalsCollected: [false, false, false],
    score: 0,
    worldId: stage.worldId,
    stageId: stage.id,
    stageName: stage.name,
    activeSpecial: saveData.activeSpecial,
    unlockedAbilities: saveData.unlockedAbilities,
    cooldowns: { webShot: 0, webTrap: 0, spiderDash: 0, magicWeb: 0 },
    boss: null,
    bannerText: stage.tutorialHint ?? null,
    promptHint: null,
    elapsedSec: 0,
    webAttached: false,
    spiderHouseProgress: null,
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

  // Initialize / Re-initialize GameEngine when stage or restartNonce changes
  useEffect(() => {
    keysHeld.current.clear();
    prevEdge.current = {
      jump: false,
      sprint: false,
      webAttack: false,
      special: false,
      interact: false,
      webSwing: false,
      webNet: false,
    };

    const engine = new GameEngine(
      stage,
      saveData,
      {
        onHudUpdate: (snapshot) => setHud({ ...snapshot, spikeyCoinsTotal }),
        onStageClear: (summary) => onStageClear(summary),
        onGameOver: (score, coins) => onGameOver(score, coins),
        onSaveProgress: (updater) => onSaveProgress(updater),
      },
      equippedSkin,
      equippedWebDesign,
      settings.graphicsQuality ?? 'high'
    );
    engineRef.current = engine;

    return () => {
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage.id, restartNonce]);

  useEffect(() => {
    engineRef.current?.updateCosmetics(
      equippedSkin,
      equippedWebDesign,
      settings.graphicsQuality ?? 'high'
    );
  }, [equippedSkin, equippedWebDesign, settings.graphicsQuality]);

  // Keyboard Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      audio.unlock();
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        onPauseToggle();
        return;
      }
      if (e.code === 'KeyC' && !e.repeat) {
        engineRef.current?.toggleSpecial();
        return;
      }
      if (
        ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)
      ) {
        e.preventDefault();
      }
      keysHeld.current.add(e.code);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysHeld.current.delete(e.code);
    };

    const onBlur = () => {
      keysHeld.current.clear();
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

  // Fixed-Timestep 60Hz Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    const STEP = 1 / 60;

    const buildInput = (): InputState => {
      const kb = settingsRef.current.keyBindings;
      const held = keysHeld.current;
      const v = virtualHeld.current;

      const left = held.has(kb.left) || held.has('ArrowLeft') || v.left;
      const right = held.has(kb.right) || held.has('ArrowRight') || v.right;
      const up = held.has(kb.up) || held.has('ArrowUp') || v.up;
      const down = held.has(kb.down) || held.has('ArrowDown') || v.down;
      const jump = held.has(kb.jump) || v.jump;
      const sprint = held.has(kb.sprint) || held.has('ShiftRight') || v.sprint;
      const webAttack = held.has(kb.webAttack) || v.webAttack;
      const special = held.has(kb.special) || v.special;
      const interact = held.has(kb.interact) || v.interact;
      const webSwing = held.has(kb.webSwing) || v.webSwing;
      const webNet = held.has(kb.webNet) || v.webNet;

      const state: InputState = {
        left,
        right,
        up,
        down,
        jump,
        sprint,
        webAttack,
        special,
        interact,
        webSwing,
        webNet,
        jumpPressed: jump && !prevEdge.current.jump,
        sprintPressed: sprint && !prevEdge.current.sprint,
        webAttackPressed: webAttack && !prevEdge.current.webAttack,
        specialPressed: special && !prevEdge.current.special,
        interactPressed: interact && !prevEdge.current.interact,
        webSwingPressed: webSwing && !prevEdge.current.webSwing,
        webNetPressed: webNet && !prevEdge.current.webNet,
      };

      prevEdge.current = { jump, sprint, webAttack, special, interact, webSwing, webNet };
      return state;
    };

    const loop = (now: number) => {
      const frameDt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
      lastTime = now;

      const engine = engineRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (engine && ctx) {
        if (!pausedRef.current) {
          accumulator += frameDt;
          while (accumulator >= STEP) {
            const input = buildInput();
            engine.step(STEP, input);
            accumulator -= STEP;
          }
        }
        engine.render(ctx);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleVirtualButton = useCallback((key: VirtualButtonKey, active: boolean) => {
    audio.unlock();
    virtualHeld.current[key] = active;
  }, []);

  const handleToggleSpecial = useCallback(() => {
    engineRef.current?.toggleSpecial();
  }, []);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pausedRef.current || e.button === 2) return;
    audio.unlock();
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    // Account for object-fit: contain letterboxing
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
      engine.shootWebAtLogicalPoint(lx, ly);
    }
  }, []);

  const showTouch =
    settings.touchMode === 'on' || (settings.touchMode === 'auto' && isTouchDevice);

  const canvasStyle: React.CSSProperties =
    settings.resolutionScale === 'native'
      ? { width: LOGICAL_WIDTH, height: LOGICAL_HEIGHT }
      : settings.resolutionScale === '2x'
      ? { width: LOGICAL_WIDTH * 2, height: LOGICAL_HEIGHT * 2, maxWidth: '100%', maxHeight: '100%' }
      : settings.resolutionScale === '3x'
      ? { width: LOGICAL_WIDTH * 3, height: LOGICAL_HEIGHT * 3, maxWidth: '100%', maxHeight: '100%' }
      : { width: '100%', height: '100%', objectFit: 'contain' };

  return (
    <div className="relative w-full h-full bg-[#060911] flex items-center justify-center overflow-hidden">
      <canvas
        ref={canvasRef}
        width={LOGICAL_WIDTH}
        height={LOGICAL_HEIGHT}
        onPointerDown={handleCanvasPointerDown}
        className="pixelated block cursor-crosshair"
        style={canvasStyle}
      />
      <HUD
        hud={hud}
        lang={settings.language}
        showTouchControls={showTouch}
        onPause={onPauseToggle}
        onToggleSpecial={handleToggleSpecial}
        onVirtualButton={handleVirtualButton}
      />
    </div>
  );
};
