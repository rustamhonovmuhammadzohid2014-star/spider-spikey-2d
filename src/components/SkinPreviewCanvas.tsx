import React, { useEffect, useRef } from 'react';
import { LiveCalendarInfo } from '../game/seasons';
import { getSkinById } from '../game/skins';
import { drawSeasonalMenuScene, drawSpikey, drawStylizedWeb } from '../game/sprites';
import { GraphicsQuality, LOGICAL_HEIGHT, LOGICAL_WIDTH, SpikeyAnimState } from '../game/types';
import { getWebDesignById } from '../game/webDesigns';

interface SkinPreviewCanvasProps {
  skinId: string;
  size?: 'sm' | 'md' | 'lg';
  anim?: SpikeyAnimState;
  staticFrame?: boolean;
  className?: string;
}

export const SkinPreviewCanvas: React.FC<SkinPreviewCanvasProps> = ({
  skinId,
  size = 'md',
  anim = 'idle',
  staticFrame = false,
  className = '',
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const skin = getSkinById(skinId);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const t = staticFrame ? 0.35 : (now - start) / 1000;
      const ctx = ref.current?.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 56, 48);

        // Soft glowing aura behind Spikey matching skin rarity/colors
        const grad = ctx.createRadialGradient(28, 24, 2, 28, 24, 24);
        grad.addColorStop(0, skin.glowRgba);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 56, 48);

        // Silk thread beneath feet
        ctx.fillStyle = skin.webColor;
        ctx.globalAlpha = 0.45;
        ctx.fillRect(6, 34, 44, 1);
        ctx.globalAlpha = 1;

        const facing: 1 | -1 = staticFrame ? 1 : Math.sin(t * 0.9) > -0.75 ? 1 : -1;
        drawSpikey(ctx, 28, 25, facing, anim, t, [], 0, skinId);
      }
      if (!staticFrame) {
        raf = requestAnimationFrame(draw);
      }
    };

    if (staticFrame) {
      draw(start);
      return;
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [skinId, anim, staticFrame, skin.glowRgba, skin.webColor]);

  const sizeClass =
    size === 'sm' ? 'w-14 h-12' : size === 'lg' ? 'w-28 h-24' : 'w-20 h-16';

  return (
    <canvas
      ref={ref}
      width={56}
      height={48}
      className={`pixelated bg-slate-950/90 border border-slate-800 shrink-0 ${sizeClass} ${className}`}
    />
  );
};

interface WebDesignPreviewCanvasProps {
  webDesignId: string;
  size?: 'sm' | 'md' | 'lg';
  quality?: GraphicsQuality;
  staticFrame?: boolean;
  className?: string;
}

export const WebDesignPreviewCanvas: React.FC<WebDesignPreviewCanvasProps> = ({
  webDesignId,
  size = 'md',
  quality = 'high',
  staticFrame = false,
  className = '',
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const design = getWebDesignById(webDesignId);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const t = staticFrame ? 0.5 : (now - start) / 1000;
      const ctx = ref.current?.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 72, 56);

        const grad = ctx.createRadialGradient(36, 28, 2, 36, 28, 30);
        grad.addColorStop(0, `${design.primaryHex}33`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 72, 56);

        const anchors = Array.from({ length: 8 }, (_, i) => {
          const ang = (Math.PI * 2 * i) / 8 - Math.PI / 2;
          return {
            x: 36 + Math.cos(ang) * 32,
            y: 28 + Math.sin(ang) * 24,
          };
        });
        drawStylizedWeb(ctx, 36, 28, anchors, [6, 12, 18, 24], webDesignId, t, quality, 1, true);
      }
      if (!staticFrame) {
        raf = requestAnimationFrame(draw);
      }
    };

    if (staticFrame) {
      draw(start);
      return;
    }
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [webDesignId, quality, staticFrame, design.primaryHex]);

  const sizeClass =
    size === 'sm' ? 'w-14 h-12' : size === 'lg' ? 'w-28 h-24' : 'w-20 h-16';

  return (
    <canvas
      ref={ref}
      width={72}
      height={56}
      className={`pixelated bg-slate-950/90 border border-slate-800 shrink-0 ${sizeClass} ${className}`}
    />
  );
};

interface SeasonalLoadingOverlayProps {
  calendar: LiveCalendarInfo;
  skinId: string;
  stageLabel?: string;
}

export const SeasonalLoadingOverlay: React.FC<SeasonalLoadingOverlayProps> = ({
  calendar,
  skinId,
  stageLabel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        drawSeasonalMenuScene(ctx, calendar.month, t * 26, t, skinId);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [calendar.month, skinId]);

  return (
    <div className="fixed inset-0 z-50 bg-[#050912] flex flex-col items-center justify-center p-6">
      <canvas
        ref={canvasRef}
        width={LOGICAL_WIDTH}
        height={LOGICAL_HEIGHT}
        className="pixelated absolute inset-0 w-full h-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/85" />
      <div className="relative z-10 pixel-panel max-w-md w-full p-6 text-center flex flex-col items-center gap-4 border-sky-400/70 bg-slate-950/92">
        <span className="font-pixel text-[11px] text-amber-300 tracking-wider">
          {calendar.bannerLine1}
        </span>
        <h2 className="font-pixel text-2xl text-white">
          {stageLabel || calendar.bannerLine2}
        </h2>
        <SkinPreviewCanvas skinId={skinId} size="lg" anim="run" />
        <p className="text-xs text-slate-300 leading-relaxed">
          {calendar.season.loadingTaglineUz}
        </p>
        <div className="w-full h-2.5 bg-slate-900 border border-slate-700 overflow-hidden">
          <div
            className="h-full animate-pulse"
            style={{
              width: '100%',
              backgroundColor: calendar.season.accentColor,
            }}
          />
        </div>
      </div>
    </div>
  );
};
