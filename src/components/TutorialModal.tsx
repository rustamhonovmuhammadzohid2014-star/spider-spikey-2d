import React, { useEffect, useRef, useState } from 'react';
import { ChevronRight, Pause, Play, RotateCcw, SkipForward, Video, X } from 'lucide-react';
import { audio } from '../game/audio';
import { tr } from '../game/i18n';
import { drawSpikey, drawStylizedWeb } from '../game/sprites';

interface TutorialModalProps {
  lang?: string | null;
  skinId: string;
  webDesignId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  lang,
  skinId,
  webDesignId,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [playing, setPlaying] = useState(true);
  const [resetSeq, setResetSeq] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simTimeRef = useRef(0);

  useEffect(() => {
    simTimeRef.current = 0;
  }, [step, resetSeq]);

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
        const W = 380;
        const H = 190;
        const t = simTimeRef.current;

        // Winter Cavern Stage Backdrop
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#071122');
        grad.addColorStop(1, '#132a46');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Ceiling & floor stone blocks
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, W, 16);
        ctx.fillRect(0, H - 28, W, 28);
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(0, H - 28, W, 3);

        if (step === 0) {
          // Intro overview: Winter snow + glowing Spider House & Web Swing preview
          for (let i = 0; i < 18; i++) {
            const sx = (i * 29 + t * 14) % W;
            const sy = (i * 37 + t * 24) % (H - 32);
            ctx.fillStyle = '#e0f2fe';
            ctx.fillRect(Math.round(sx), Math.round(sy), 2, 2);
          }

          const anchors = Array.from({ length: 8 }, (_, i) => {
            const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
            return { x: 110 + Math.cos(a) * 58, y: 120 + Math.sin(a) * 44 };
          });
          drawStylizedWeb(ctx, 110, 120, anchors, [8, 16, 24, 32], webDesignId, t, 'high', 1, true);
          drawSpikey(ctx, 110, H - 34, 1, 'idle', t, [], 0, skinId);

          // Swinging Spikey on right
          const ang = Math.sin(t * 2.2) * 0.75;
          const ax = 275;
          const ay = 16;
          const len = 82;
          const sx = ax + Math.sin(ang) * len;
          const sy = ay + Math.cos(ang) * len;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(sx, sy);
          ctx.stroke();
          drawSpikey(ctx, sx, sy, Math.cos(t * 2.2) >= 0 ? 1 : -1, 'jump', t, [], 0, skinId);
        } else if (step === 1) {
          // Video 1: Adaptive Spider House (Left = Small Nook, Right = Large Cavern)
          // Narrow Nook wall divider
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(148, 42, 16, H - 70);
          ctx.fillStyle = '#334155';
          ctx.fillRect(148, 42, 3, H - 70);

          // Left small space (x=14..148)
          const leftProg = Math.min(1, Math.max(0, (t - 0.5) / 0.8));
          if (leftProg > 0) {
            const smallAnchors = Array.from({ length: 8 }, (_, i) => {
              const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
              return { x: 76 + Math.cos(a) * 42, y: 132 + Math.sin(a) * 28 };
            });
            drawStylizedWeb(ctx, 76, 132, smallAnchors, [6, 12, 18], webDesignId, t, 'high', leftProg, true);
          }
          drawSpikey(ctx, 76, H - 34, 1, t < 0.7 ? 'idle' : 'walk', t, [], 0, skinId);

          // Right large cavern (x=164..365)
          const rightProg = Math.min(1, Math.max(0, (t - 1.8) / 1.0));
          if (rightProg > 0) {
            const bigAnchors = Array.from({ length: 8 }, (_, i) => {
              const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
              return { x: 268 + Math.cos(a) * 92, y: 112 + Math.sin(a) * 68 };
            });
            drawStylizedWeb(ctx, 268, 112, bigAnchors, [10, 20, 30, 40], webDesignId, t, 'ultra', rightProg, true);
          }
          drawSpikey(ctx, 268, H - 34, -1, t > 2.0 ? 'victory' : 'idle', t, [], 0, skinId);

          // Animated Keycap E & Cursor Indicator
          const pressingE = (t >= 0.3 && t <= 0.9) || (t >= 1.6 && t <= 2.2);
          ctx.fillStyle = pressingE ? '#38bdf8' : '#0f172a';
          ctx.fillRect(172, 26, 26, 22);
          ctx.strokeStyle = '#7dd3fc';
          ctx.strokeRect(172, 26, 26, 22);
          ctx.fillStyle = pressingE ? '#0f172a' : '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('E', 185, 41);

          // Animated pixel pointer cursor clicking E
          const curX = 192 + Math.sin(t * 2) * 5;
          const curY = 44 + (pressingE ? 3 : 0);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(curX), Math.round(curY), 5, 7);
          ctx.fillRect(Math.round(curX + 5), Math.round(curY + 4), 3, 3);
        } else {
          // Video 2: Q Web Shoot -> Swing -> Release + Wall LOS check
          // Pit gap between Left ledge (0..120) and Right ledge (250..380)
          ctx.fillStyle = '#090d16';
          ctx.fillRect(120, H - 28, 130, 28);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(175, 16, 24, 24); // Overhead stone anchor block

          // Gold anchor ring
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(184, 38, 6, 6);

          let spX = 72;
          let spY = H - 34;
          let attached = false;

          if (t < 1.0) {
            spX = 50 + t * 55;
            spY = H - 34;
          } else if (t < 3.4) {
            attached = true;
            const swingProg = (t - 1.0) / 2.4;
            const ang = -0.78 + swingProg * 1.56;
            spX = 187 + Math.sin(ang) * 92;
            spY = 41 + Math.cos(ang) * 92;
          } else {
            const relT = Math.min(1, (t - 3.4) / 1.2);
            spX = 250 + relT * 65;
            spY = H - 34 - Math.sin(relT * Math.PI) * 32;
          }

          if (attached) {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(187, 41);
            ctx.lineTo(spX, spY);
            ctx.stroke();
          }

          drawSpikey(ctx, spX, spY, 1, attached ? 'jump' : 'run', t, [], 0, skinId);

          // Glowing Q keycap indicator
          const qActive = (t >= 0.9 && t <= 1.4) || (t >= 3.2 && t <= 3.7);
          ctx.fillStyle = qActive ? '#fbbf24' : '#0f172a';
          ctx.fillRect(18, 26, 26, 22);
          ctx.strokeStyle = '#fbbf24';
          ctx.strokeRect(18, 26, 26, 22);
          ctx.fillStyle = qActive ? '#0f172a' : '#fef08a';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('Q', 31, 41);
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [step, playing, resetSeq, skinId, webDesignId]);

  const titles = [
    tr(lang, 'tutIntroTitle'),
    tr(lang, 'tutHouseTitle'),
    tr(lang, 'tutWebTitle'),
  ];
  const descs = [
    tr(lang, 'tutIntroDesc'),
    tr(lang, 'tutHouseDesc'),
    tr(lang, 'tutWebDesc'),
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="pixel-panel w-full max-w-2xl bg-[#0b1322] border-sky-400/75 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Video className="w-4 h-4 text-sky-400" />
            <h2 className="font-pixel text-sm sm:text-base text-white">
              {tr(lang, 'tutorialTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              audio.playSfx('menuClick');
              onSkip();
            }}
            className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="px-5 pt-3 flex flex-wrap gap-2">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                setStep(idx as 0 | 1 | 2);
              }}
              className={`pixel-btn px-3 py-1.5 font-pixel text-[10px] cursor-pointer ${
                step === idx
                  ? 'bg-sky-600 border-sky-300 text-white'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}
            >
              {idx === 0 ? 'INTRO' : `VIDEO ${idx}`}
            </button>
          ))}
        </div>

        {/* Video Viewport */}
        <div className="p-5 flex flex-col gap-3">
          <div className="relative border-2 border-slate-700 bg-black overflow-hidden">
            <canvas
              ref={canvasRef}
              width={380}
              height={190}
              className="pixelated w-full h-52 sm:h-64 object-contain"
            />
            <div className="absolute top-2 right-2 bg-black/75 border border-slate-700 px-2 py-0.5 font-mono-num text-[10px] text-sky-300">
              {playing ? 'LIVE DEMO' : 'PAUSED'}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-3.5">
            <div className="font-pixel text-xs sm:text-sm text-sky-300">{titles[step]}</div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">{descs[step]}</p>
          </div>
        </div>

        {/* Video Controls */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                setPlaying((p) => !p);
              }}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer"
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
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{tr(lang, 'tutReplay')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                onSkip();
              }}
              className="pixel-btn bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-2 font-pixel text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>{tr(lang, 'tutSkip')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                if (step < 2) {
                  setStep((s) => (s + 1) as 0 | 1 | 2);
                } else {
                  onComplete();
                }
              }}
              className="pixel-btn bg-sky-600 hover:bg-sky-500 border-sky-400 text-white px-4 py-2 font-pixel text-[10px] flex items-center gap-1 cursor-pointer"
            >
              <span>{step < 2 ? tr(lang, 'tutNext') : tr(lang, 'langContinue')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
