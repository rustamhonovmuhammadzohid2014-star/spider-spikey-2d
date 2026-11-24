import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Keyboard,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Video,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { audio } from '../game/audio';
import { tr } from '../game/i18n';
import { drawSpikey, drawStylizedWeb } from '../game/sprites';
import { DEFAULT_KEYBINDINGS, formatKeyCode } from '../game/storage';
import { KeyBindings } from '../game/types';

type VideoChapter = 0 | 1 | 2 | 3 | 4 | 5;

interface TutorialModalProps {
  lang?: string | null;
  skinId: string;
  webDesignId: string;
  keyBindings?: KeyBindings;
  onComplete: () => void;
  onSkip: () => void;
}

function drawKeyCap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  active: boolean,
  accent = '#38bdf8'
) {
  ctx.fillStyle = active ? accent : '#0f172a';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = active ? '#ffffff' : accent;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = active ? '#050811' : '#f8fafc';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2 + 0.5);
  ctx.textBaseline = 'alphabetic';
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  lang,
  skinId,
  webDesignId,
  keyBindings = DEFAULT_KEYBINDINGS,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<VideoChapter>(0);
  const [playing, setPlaying] = useState(true);
  const [voiceOn, setVoiceOn] = useState(false);
  const [resetSeq, setResetSeq] = useState(0);
  const [activeBtnId, setActiveBtnId] = useState<string>('move');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simTimeRef = useRef(0);

  const kb = useMemo(
    () => ({
      left: formatKeyCode(keyBindings.left),
      right: formatKeyCode(keyBindings.right),
      up: formatKeyCode(keyBindings.up),
      down: formatKeyCode(keyBindings.down),
      jump: formatKeyCode(keyBindings.jump),
      sprint: formatKeyCode(keyBindings.sprint),
      webAttack: formatKeyCode(keyBindings.webAttack),
      special: formatKeyCode(keyBindings.special),
      interact: formatKeyCode(keyBindings.interact),
      webSwing: formatKeyCode(keyBindings.webSwing),
    }),
    [keyBindings]
  );

  const chapters = useMemo(
    () => [
      {
        id: 0 as VideoChapter,
        tab: tr(lang, 'tutTabMoveTitle'),
        title: tr(lang, 'tutMoveVideoTitle', kb),
        desc: tr(lang, 'tutMoveVideoDesc', kb),
        btnDefault: 'move',
      },
      {
        id: 1 as VideoChapter,
        tab: tr(lang, 'tutTabJumpDashTitle'),
        title: tr(lang, 'tutJumpDashVideoTitle', kb),
        desc: tr(lang, 'tutJumpDashVideoDesc', kb),
        btnDefault: 'jump',
      },
      {
        id: 2 as VideoChapter,
        tab: tr(lang, 'tutTabAttackTitle'),
        title: tr(lang, 'tutAttackVideoTitle', kb),
        desc: tr(lang, 'tutAttackVideoDesc', kb),
        btnDefault: 'web',
      },
      {
        id: 3 as VideoChapter,
        tab: tr(lang, 'tutTabSpecialTitle'),
        title: tr(lang, 'tutSpecialVideoTitle', kb),
        desc: tr(lang, 'tutSpecialVideoDesc', kb),
        btnDefault: 'special',
      },
      {
        id: 4 as VideoChapter,
        tab: tr(lang, 'tutTabVideo', { n: 5 }),
        title: tr(lang, 'tutHouseVideoTitle', kb),
        desc: tr(lang, 'tutHouseVideoDesc', kb),
        btnDefault: 'house',
      },
      {
        id: 5 as VideoChapter,
        tab: tr(lang, 'tutTabPauseTitle'),
        title: tr(lang, 'tutSwingPauseVideoTitle', kb),
        desc: tr(lang, 'tutSwingPauseVideoDesc', kb),
        btnDefault: 'swing',
      },
    ],
    [lang, kb]
  );

  const buttonDirectory = useMemo(
    () => [
      {
        id: 'move',
        chapter: 0 as VideoChapter,
        keys: `${kb.left} / ${kb.right}`,
        desc: tr(lang, 'tutBtnMoveDesc'),
        accent: 'border-sky-500/70 text-sky-300',
      },
      {
        id: 'climb',
        chapter: 0 as VideoChapter,
        keys: `${kb.up} / ${kb.down}`,
        desc: tr(lang, 'tutBtnClimbDesc'),
        accent: 'border-emerald-500/70 text-emerald-300',
      },
      {
        id: 'jump',
        chapter: 1 as VideoChapter,
        keys: `${kb.jump} ×2`,
        desc: tr(lang, 'tutBtnJumpDesc'),
        accent: 'border-cyan-500/70 text-cyan-300',
      },
      {
        id: 'dash',
        chapter: 1 as VideoChapter,
        keys: kb.sprint,
        desc: tr(lang, 'tutBtnDashDesc'),
        accent: 'border-rose-500/70 text-rose-300',
      },
      {
        id: 'web',
        chapter: 2 as VideoChapter,
        keys: `${kb.webAttack} / CLICK`,
        desc: tr(lang, 'tutBtnWebDesc'),
        accent: 'border-sky-400/70 text-sky-200',
      },
      {
        id: 'special',
        chapter: 3 as VideoChapter,
        keys: kb.special,
        desc: tr(lang, 'tutBtnSpecialDesc'),
        accent: 'border-purple-500/70 text-purple-300',
      },
      {
        id: 'swap',
        chapter: 3 as VideoChapter,
        keys: 'C',
        desc: tr(lang, 'tutBtnSwapDesc'),
        accent: 'border-amber-500/70 text-amber-300',
      },
      {
        id: 'house',
        chapter: 4 as VideoChapter,
        keys: kb.interact,
        desc: tr(lang, 'tutBtnHouseDesc'),
        accent: 'border-cyan-400/70 text-cyan-200',
      },
      {
        id: 'swing',
        chapter: 5 as VideoChapter,
        keys: kb.webSwing,
        desc: tr(lang, 'tutBtnSwingDesc'),
        accent: 'border-amber-400/70 text-amber-300',
      },
      {
        id: 'pause',
        chapter: 5 as VideoChapter,
        keys: 'P / ESC',
        desc: tr(lang, 'tutBtnPauseDesc'),
        accent: 'border-slate-500/70 text-slate-200',
      },
    ],
    [kb, lang]
  );

  useEffect(() => {
    simTimeRef.current = 0;
  }, [step, resetSeq]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!voiceOn) return;
    const utter = new SpeechSynthesisUtterance(chapters[step].desc);
    if (lang) utter.lang = lang;
    utter.rate = 0.98;
    window.speechSynthesis.speak(utter);
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [voiceOn, step, lang, chapters]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (playing) {
        simTimeRef.current = (simTimeRef.current + dt) % 6.0;
      }

      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        const W = 420;
        const H = 210;
        const t = simTimeRef.current;

        // Shared Winter Cavern backdrop
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#071122');
        grad.addColorStop(1, '#122944');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Snowflakes
        for (let i = 0; i < 20; i++) {
          const sx = (i * 31 + t * 14) % W;
          const sy = (i * 41 + t * 22) % (H - 30);
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
        }

        // Ceiling & floor stone blocks
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, 16);
        ctx.fillRect(0, H - 28, W, 28);
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(0, H - 28, W, 3);

        if (step === 0) {
          // VIDEO 1: Walk Left/Right (A/D) + Climb Wall (W/S)
          // Climbable mossy crystal wall tower on right
          ctx.fillStyle = '#14532d';
          ctx.fillRect(320, 40, 32, H - 68);
          ctx.fillStyle = '#34d399';
          for (let wy = 46; wy < H - 32; wy += 14) {
            ctx.fillRect(318, wy, 36, 4);
          }
          // Upper platform ledge
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(320, 40, 88, 12);
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(320, 40, 88, 3);

          let spX = 72;
          let spY = H - 34;
          let dir: 1 | -1 = 1;
          let anim: 'walk' | 'run' | 'idle' = 'run';
          let activeK: 'right' | 'up' | 'down' | 'left' = 'right';

          if (t < 2.0) {
            const p = t / 2.0;
            spX = 68 + p * 238;
            spY = H - 34;
            dir = 1;
            anim = 'run';
            activeK = 'right';
          } else if (t < 3.6) {
            const p = (t - 2.0) / 1.6;
            spX = 310;
            spY = H - 34 - p * (H - 72);
            dir = 1;
            anim = 'walk';
            activeK = 'up';
          } else if (t < 4.7) {
            const p = (t - 3.6) / 1.1;
            spX = 310;
            spY = 38 + p * (H - 72);
            dir = -1;
            anim = 'walk';
            activeK = 'down';
          } else {
            const p = (t - 4.7) / 1.3;
            spX = 306 - p * 238;
            spY = H - 34;
            dir = -1;
            anim = 'walk';
            activeK = 'left';
          }

          drawSpikey(ctx, spX, spY, dir, anim, t, [], 0, skinId);
          drawKeyCap(ctx, 16, 26, 24, 20, kb.left, activeK === 'left', '#38bdf8');
          drawKeyCap(ctx, 44, 26, 24, 20, kb.right, activeK === 'right', '#38bdf8');
          drawKeyCap(ctx, 74, 26, 24, 20, kb.up, activeK === 'up', '#34d399');
          drawKeyCap(ctx, 102, 26, 24, 20, kb.down, activeK === 'down', '#34d399');
        } else if (step === 1) {
          // VIDEO 2: Jump & Double Jump (SPACE x2) + Spider Dash (SHIFT)
          // Spikes hazard + high step pillar
          ctx.fillStyle = '#f43f5e';
          for (let sx = 128; sx < 176; sx += 8) {
            ctx.beginPath();
            ctx.moveTo(sx, H - 28);
            ctx.lineTo(sx + 4, H - 39);
            ctx.lineTo(sx + 8, H - 28);
            ctx.fill();
          }
          // High ice platform
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(205, 106, 95, 12);
          ctx.fillStyle = '#7dd3fc';
          ctx.fillRect(205, 106, 95, 3);

          let spX = 64;
          let spY = H - 34;
          let anim: 'run' | 'jump' | 'doubleJump' = 'run';
          let jumpPulse = false;
          let dashPulse = false;

          if (t < 0.7) {
            spX = 50 + (t / 0.7) * 58;
            anim = 'run';
          } else if (t < 1.8) {
            const p = (t - 0.7) / 1.1;
            spX = 108 + p * 60;
            spY = H - 34 - Math.sin(p * Math.PI * 0.75) * 48;
            anim = 'jump';
            jumpPulse = t < 1.1;
          } else if (t < 3.2) {
            const p = (t - 1.8) / 1.4;
            spX = 168 + p * 68;
            spY = H - 78 - Math.sin(p * Math.PI * 0.85) * 46;
            if (p > 0.65) spY = Math.min(100, spY);
            anim = 'doubleJump';
            jumpPulse = t < 2.25;
            if (p < 0.5) {
              ctx.strokeStyle = '#22d3ee';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.ellipse(spX, spY + 8, 14 + p * 18, 5, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
          } else if (t < 4.7) {
            const p = (t - 3.2) / 1.5;
            spX = 236 + Math.min(1, p * 1.15) * 145;
            spY = 100 + Math.max(0, (p - 0.5) * 2) * (H - 134);
            dashPulse = p < 0.65;
            anim = 'run';
            if (dashPulse) {
              for (let ghost = 1; ghost <= 3; ghost++) {
                ctx.globalAlpha = 0.35 - ghost * 0.08;
                drawSpikey(ctx, spX - ghost * 14, spY, 1, 'run', t, [], 0, skinId);
              }
              ctx.globalAlpha = 1;
            }
          } else {
            spX = 381;
            spY = H - 34;
            anim = 'run';
          }

          drawSpikey(ctx, spX, spY, 1, anim, t, [], 0, skinId);
          drawKeyCap(ctx, 16, 26, 52, 20, `${kb.jump} ×2`, jumpPulse, '#22d3ee');
          drawKeyCap(ctx, 74, 26, 46, 20, kb.sprint, dashPulse, '#f43f5e');
        } else if (step === 2) {
          // VIDEO 3: Web Shot (J) + Mouse/Tap Aiming (Click)
          const spX = 76;
          const spY = H - 34;
          const groundHit = t >= 1.1 && t < 2.7;
          const airHit = t >= 4.2 && t < 5.7;

          // Beetle on floor
          const bx = 265;
          const by = H - 36;
          ctx.fillStyle = groundHit ? '#60a5fa' : '#ef4444';
          ctx.fillRect(bx - 9, by - 6, 18, 12);
          ctx.fillStyle = '#fde047';
          ctx.fillRect(bx - 6, by - 4, 3, 3);

          // Bat in air
          const batX = 325;
          const batY = 74 + Math.sin(t * 5) * 5;
          ctx.fillStyle = airHit ? '#38bdf8' : '#a855f7';
          ctx.fillRect(batX - 8, batY - 4, 16, 8);
          ctx.fillRect(batX - 14, batY - 8, 6, 4);
          ctx.fillRect(batX + 8, batY - 8, 6, 4);

          // Straight shot via J key (t = 0.5..1.2)
          const jActive = t >= 0.4 && t <= 1.2;
          if (t >= 0.5 && t <= 1.2) {
            const p = (t - 0.5) / 0.7;
            const projX = spX + 12 + p * (bx - spX - 18);
            ctx.fillStyle = '#e0f2fe';
            ctx.fillRect(projX - 6, spY - 5, 12, 4);
          }

          // Aimed click shot (t = 2.8..4.3)
          const clickActive = t >= 3.2 && t <= 3.7;
          if (t >= 2.8 && t <= 4.3) {
            const aimP = Math.min(1, (t - 2.8) / 0.6);
            const curX = 210 + aimP * (batX - 210);
            const curY = 140 + aimP * (batY - 140);
            // Pixel crosshair
            ctx.strokeStyle = clickActive ? '#fbbf24' : '#38bdf8';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(curX - 7, curY - 7, 14, 14);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(curX - 1, curY - 1, 2, 2);

            if (t >= 3.4) {
              const p2 = Math.min(1, (t - 3.4) / 0.8);
              const px = spX + p2 * (batX - spX);
              const py = spY - 6 + p2 * (batY - (spY - 6));
              ctx.strokeStyle = '#7dd3fc';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(spX + 6, spY - 6);
              ctx.lineTo(px, py);
              ctx.stroke();
            }
          }

          drawSpikey(ctx, spX, spY, 1, jActive || clickActive ? 'webShoot' : 'idle', t, [], 0, skinId);
          drawKeyCap(ctx, 16, 26, 26, 20, kb.webAttack, jActive, '#38bdf8');
          drawKeyCap(ctx, 48, 26, 52, 20, 'CLICK/TAP', clickActive, '#fbbf24');
        } else if (step === 3) {
          // VIDEO 4: Special (K) + Swap Special (C)
          const spX = 185;
          const spY = H - 34;
          const kActive = (t >= 0.5 && t <= 1.2) || (t >= 3.6 && t <= 4.4);
          const cActive = t >= 2.3 && t <= 3.0;
          const activeMode = t < 2.5 ? 'WEB TRAP' : 'MAGIC WEB';

          // Web Trap deployed on ground (t = 0.6..2.4)
          if (t >= 0.6 && t <= 2.4) {
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 2;
            ctx.strokeRect(spX - 28, H - 32, 56, 4);
            ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
            ctx.fillRect(spX - 28, H - 36, 56, 8);
          }

          // Enemy walking into trap / hit by magic wave
          const ex = t < 1.2 ? 320 - t * 90 : t < 2.5 ? 212 : 310;
          ctx.fillStyle = t >= 3.8 && t <= 4.8 ? '#e879f9' : '#f43f5e';
          ctx.fillRect(ex - 9, H - 40, 18, 12);

          // Magic Web radial shockwave (t = 3.7..5.2)
          if (t >= 3.7 && t <= 5.2) {
            const p = (t - 3.7) / 1.5;
            ctx.strokeStyle = '#d946ef';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(spX, spY - 6, 14 + p * 125, 0, Math.PI * 2);
            ctx.stroke();
          }

          drawSpikey(ctx, spX, spY, 1, kActive ? 'attack' : 'idle', t, [], 0, skinId);
          drawKeyCap(ctx, 16, 26, 26, 20, kb.special, kActive, '#c084fc');
          drawKeyCap(ctx, 48, 26, 24, 20, 'C', cActive, '#fbbf24');
          drawKeyCap(ctx, 78, 26, 88, 20, activeMode, cActive, '#a855f7');
        } else if (step === 4) {
          // VIDEO 5: Adaptive Spider House (E)
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(156, 42, 16, H - 70);
          ctx.fillStyle = '#334155';
          ctx.fillRect(156, 42, 3, H - 70);

          const leftProg = Math.min(1, Math.max(0, (t - 0.5) / 1.1));
          if (leftProg > 0) {
            const smallAnchors = Array.from({ length: 8 }, (_, i) => {
              const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
              return { x: 80 + Math.cos(a) * 44, y: 138 + Math.sin(a) * 30 };
            });
            drawStylizedWeb(ctx, 80, 138, smallAnchors, [6, 12, 18], webDesignId, t, 'high', leftProg, true);
          }
          drawSpikey(ctx, 80, H - 34, 1, t < 0.7 ? 'idle' : 'walk', t, [], 0, skinId);

          const rightProg = Math.min(1, Math.max(0, (t - 2.1) / 1.2));
          if (rightProg > 0) {
            const bigAnchors = Array.from({ length: 8 }, (_, i) => {
              const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
              return { x: 294 + Math.cos(a) * 102, y: 118 + Math.sin(a) * 72 };
            });
            drawStylizedWeb(ctx, 294, 118, bigAnchors, [10, 22, 34, 46], webDesignId, t, 'ultra', rightProg, true);
          }
          drawSpikey(ctx, 294, H - 34, -1, t > 2.6 ? 'victory' : 'idle', t, [], 0, skinId);

          const pressingE = (t >= 0.3 && t <= 1.1) || (t >= 1.9 && t <= 2.7);
          drawKeyCap(ctx, 16, 26, 26, 20, kb.interact, pressingE, '#38bdf8');
          const buildPct = Math.round((t < 1.8 ? leftProg : rightProg) * 100);
          drawKeyCap(ctx, 48, 26, 72, 20, `SILK ${buildPct}%`, buildPct > 0 && buildPct < 100, '#7dd3fc');
        } else {
          // VIDEO 6: Web Swing (Q) & Pause (P / ESC)
          ctx.fillStyle = '#070a12';
          ctx.fillRect(130, H - 28, 155, 28);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(195, 16, 26, 22);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(205, 36, 6, 6);

          let spX = 76;
          let spY = H - 34;
          let attached = false;
          let anim: 'run' | 'jump' | 'victory' = 'run';

          if (t < 0.9) {
            spX = 48 + t * 68;
            spY = H - 34;
          } else if (t < 3.6) {
            attached = true;
            const swingProg = (t - 0.9) / 2.7;
            const ang = -0.82 + swingProg * 1.64;
            spX = 208 + Math.sin(ang) * 98;
            spY = 39 + Math.cos(ang) * 98;
            anim = 'jump';
          } else {
            const relT = Math.min(1, (t - 3.6) / 1.1);
            spX = 282 + relT * 74;
            spY = H - 34 - Math.sin(relT * Math.PI) * 34;
            anim = relT >= 0.95 ? 'victory' : 'jump';
          }

          if (attached) {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(208, 39);
            ctx.lineTo(spX, spY);
            ctx.stroke();
          }

          drawSpikey(ctx, spX, spY, 1, anim, t, [], 0, skinId);

          const qActive = (t >= 0.85 && t <= 1.35) || (t >= 3.45 && t <= 3.95);
          const pActive = t >= 4.8 && t <= 5.6;
          drawKeyCap(ctx, 16, 26, 26, 20, kb.webSwing, qActive, '#fbbf24');
          drawKeyCap(ctx, 48, 26, 56, 20, 'P / ESC', pActive, '#94a3b8');

          if (pActive) {
            ctx.fillStyle = 'rgba(5, 8, 17, 0.72)';
            ctx.fillRect(0, 0, W, H);
            drawKeyCap(ctx, W / 2 - 48, H / 2 - 14, 96, 28, 'PAUSED', true, '#fbbf24');
          }
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [step, playing, resetSeq, skinId, webDesignId, kb]);

  const currentChapter = chapters[step];

  return (
    <div className="fixed inset-0 z-50 bg-black/88 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="pixel-panel w-full max-w-4xl max-h-[94vh] bg-[#0b1322] border-sky-400/75 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-800 bg-slate-950/95 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Video className="w-5 h-5 text-sky-400 shrink-0" />
            <div className="min-w-0">
              <h2 className="font-pixel text-xs sm:text-base text-white truncate">
                {tr(lang, 'tutorialTitle')}
              </h2>
              <p className="text-[10px] sm:text-xs text-sky-300/90 truncate">
                {tr(lang, 'tutAllButtonsBadge')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              audio.playSfx('menuClick');
              onSkip();
            }}
            aria-label={tr(lang, 'close')}
            className="pixel-btn min-w-[40px] min-h-[40px] bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 flex flex-col gap-3.5">
          {/* Chapter Video Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {chapters.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  audio.playSfx('menuClick');
                  setStep(ch.id);
                  setActiveBtnId(ch.btnDefault);
                  setPlaying(true);
                }}
                className={`pixel-btn px-2.5 py-2 font-pixel text-[9px] sm:text-[10px] cursor-pointer ${
                  step === ch.id
                    ? 'bg-sky-600 border-sky-300 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {ch.id + 1}. {ch.tab}
              </button>
            ))}
          </div>

          {/* Animated Pixel Video Viewport + Current Chapter Description */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5 items-stretch">
            <div className="lg:col-span-3 relative border-2 border-slate-700 bg-black overflow-hidden">
              <canvas
                ref={canvasRef}
                width={420}
                height={210}
                className="pixelated w-full h-48 sm:h-56 object-contain"
              />
              <div className="absolute top-2 right-2 bg-black/80 border border-slate-700 px-2 py-0.5 font-mono-num text-[10px] text-sky-300">
                {playing ? tr(lang, 'tutLiveDemo') : tr(lang, 'tutPaused')} · {step + 1}/{chapters.length}
              </div>
            </div>

            <div className="lg:col-span-2 bg-slate-900/95 border border-slate-800 p-3.5 flex flex-col justify-between gap-3">
              <div>
                <div className="font-pixel text-xs sm:text-sm text-sky-300 leading-snug">
                  {currentChapter.title}
                </div>
                <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed">
                  {currentChapter.desc}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    audio.playSfx('menuClick');
                    setPlaying((p) => !p);
                  }}
                  className="pixel-btn min-h-[40px] bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer"
                >
                  {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{playing ? tr(lang, 'tutPause') : tr(lang, 'tutPlay')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audio.playSfx('menuClick');
                    setResetSeq((n) => n + 1);
                    setPlaying(true);
                  }}
                  className="pixel-btn min-h-[40px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{tr(lang, 'tutReplay')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audio.playSfx('menuClick');
                    setVoiceOn((v) => !v);
                  }}
                  aria-label="Toggle voice narration"
                  className={`pixel-btn min-h-[40px] px-3 py-1.5 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer ${
                    voiceOn
                      ? 'bg-emerald-700 border-emerald-400 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {voiceOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Complete All-Buttons Interactive Cheat Sheet */}
          <div className="bg-slate-950/90 border border-slate-800 p-3 space-y-2.5">
            <div className="flex items-center gap-2 text-[10px] font-pixel text-amber-300">
              <Keyboard className="w-4 h-4 shrink-0" />
              <span>{tr(lang, 'tutDirectoryTitle')}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {buttonDirectory.map((btn) => {
                const selected = activeBtnId === btn.id || (step === btn.chapter && activeBtnId === '');
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => {
                      audio.playSfx('menuClick');
                      setActiveBtnId(btn.id);
                      setStep(btn.chapter);
                      setResetSeq((n) => n + 1);
                      setPlaying(true);
                    }}
                    className={`pixel-btn p-2 text-left flex flex-col justify-between gap-1 cursor-pointer transition-colors ${
                      selected
                        ? 'bg-sky-950/85 border-sky-300'
                        : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700'
                    }`}
                  >
                    <span className={`font-mono-num font-bold text-[11px] border px-1.5 py-0.5 self-start bg-slate-950 ${btn.accent}`}>
                      {btn.keys}
                    </span>
                    <span className="text-[11px] text-slate-200 leading-tight font-medium">
                      {btn.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-800 bg-slate-950/95 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              audio.playSfx('menuClick');
              onSkip();
            }}
            className="pixel-btn min-h-[42px] bg-slate-900 hover:bg-slate-800 text-slate-300 px-3.5 py-2 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>{tr(lang, 'tutSkip')}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => {
                audio.playSfx('menuClick');
                const prev = Math.max(0, step - 1) as VideoChapter;
                setStep(prev);
                setActiveBtnId(chapters[prev].btnDefault);
                setPlaying(true);
              }}
              className={`pixel-btn min-h-[42px] px-3.5 py-2 font-pixel text-[10px] flex items-center gap-1 ${
                step === 0
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-100 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{tr(lang, 'tutPrevBtn')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                if (step < chapters.length - 1) {
                  const next = (step + 1) as VideoChapter;
                  setStep(next);
                  setActiveBtnId(chapters[next].btnDefault);
                  setPlaying(true);
                } else {
                  onComplete();
                }
              }}
              className="pixel-btn min-h-[42px] bg-sky-600 hover:bg-sky-500 border-sky-300 text-white px-5 py-2 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer"
            >
              <span>
                {step < chapters.length - 1
                  ? tr(lang, 'tutNext')
                  : tr(lang, 'tutEnterGameBtn')}
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
