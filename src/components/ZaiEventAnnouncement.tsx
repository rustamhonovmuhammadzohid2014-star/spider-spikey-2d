import React, { useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Calendar,
  Crown,
  Flame,
  HelpCircle,
  Radio,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { audio } from '../game/audio';
import { tr } from '../game/i18n';
import { SEASONS_12 } from '../game/seasons';
import { getSkinById, RARITY_META } from '../game/skins';
import { SeasonMonth } from '../game/types';
import { getWebDesignById } from '../game/webDesigns';
import {
  ANNUAL_ZAI_EVENTS,
  AnnualZaiEventDef,
  AnnualZaiEventId,
  ZAI_MONTHLY_THEMES,
  ZaiAnnouncementSnapshot,
  ZaiEventSimMode,
  getAnnualZaiEventStatus,
} from '../game/zaiCollection';
import { SkinPreviewCanvas, WebDesignPreviewCanvas } from './SkinPreviewCanvas';

// ===================================================
// 1. ULTRA RED NEON WARNING & GOLD RELEASE BANNER
// ===================================================
interface ZaiWarningBannerProps {
  snapshot: ZaiAnnouncementSnapshot;
  lang?: string | null;
  compactGameplay?: boolean;
  dismissed: boolean;
  onDismiss: () => void;
  onViewEvent: (eventId: AnnualZaiEventId) => void;
  onExploreCollection: () => void;
}

export const ZaiWarningBanner: React.FC<ZaiWarningBannerProps> = ({
  snapshot,
  lang,
  compactGameplay = false,
  dismissed,
  onDismiss,
  onViewEvent,
  onExploreCollection,
}) => {
  const { phase, status, daysLeftCeil } = snapshot;
  if (phase === 'none' || dismissed) return null;

  const isRelease = phase === 'active_now';
  const isFinalHour = phase === 'warning_1h';
  const isFinalDay = phase === 'warning_24h';

  const headline = isRelease
    ? tr(lang, 'zaiAvailableNowText', { event: status.event.title })
    : isFinalHour
    ? tr(lang, 'zaiLessThan1hText', { event: status.event.title })
    : isFinalDay
    ? tr(lang, 'zaiFinal24hText', { event: status.event.title })
    : tr(lang, 'zaiWarningBannerText', { days: daysLeftCeil });

  // Compact Non-Intrusive Gameplay Strip (leaves hearts, coins, pause & controls clear)
  if (compactGameplay) {
    return (
      <div className="pointer-events-none fixed top-1.5 inset-x-0 z-30 flex justify-center px-2">
        <div
          className={`pointer-events-auto relative overflow-hidden px-3 py-1 border-2 flex items-center gap-2.5 max-w-2xl ${
            isRelease
              ? 'zai-gold-banner bg-gradient-to-r from-[#240a04]/95 via-[#3f090b]/95 to-[#291703]/95 border-amber-400'
              : 'zai-neon-banner bg-gradient-to-r from-[#120306]/95 via-[#2a040c]/95 to-[#120306]/95 border-[#ff2b4a]'
          }`}
        >
          <AlertTriangle
            className={`w-3.5 h-3.5 shrink-0 ${
              isRelease ? 'text-amber-300' : 'text-[#ff3b5c] animate-pulse'
            }`}
          />
          <span
            className={`font-pixel text-[10px] truncate max-w-[230px] sm:max-w-xs ${
              isRelease ? 'text-amber-200' : 'text-rose-100'
            }`}
          >
            {headline}
          </span>
          {!isRelease ? (
            <span className="font-mono-num text-[11px] font-bold text-[#ff7b89] whitespace-nowrap">
              {status.countdownText}
            </span>
          ) : (
            <span className="font-pixel text-[9px] text-amber-300 whitespace-nowrap">
              {tr(lang, 'activeNow')}
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              audio.playSfx('menuClick');
              if (isRelease) onExploreCollection();
              else onViewEvent(status.event.id);
            }}
            className={`pixel-btn px-2 py-0.5 font-pixel text-[9px] cursor-pointer ${
              isRelease
                ? 'bg-amber-500 text-slate-950 border-amber-200'
                : 'bg-[#dc2626] text-white border-[#ff7b89]'
            }`}
          >
            {isRelease ? tr(lang, 'exploreCollection') : tr(lang, 'preview')}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss alert"
            className="text-slate-300 hover:text-white p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Full Roblox-Style Ultra Red Neon Warning / Gold+Red Release Banner for Menus & Shops
  return (
    <div className="relative z-30 w-full px-3 pt-2.5 sm:px-5 shrink-0">
      <div
        className={`relative overflow-hidden border-2 px-4 py-2.5 sm:px-5 sm:py-3 ${
          isRelease
            ? 'zai-gold-banner bg-gradient-to-r from-[#1d0606] via-[#3a0a0a] to-[#261603] border-amber-400'
            : 'zai-neon-banner bg-gradient-to-r from-[#0b0204] via-[#2b030c] to-[#0b0204] border-[#ff2b4a]'
        }`}
      >
        {/* Subtle Red Ambient Glow + Moving Electric Edge Sweep */}
        <div
          className="pointer-events-none absolute inset-y-0 w-40 zai-electric-sweep"
          style={{
            background: isRelease
              ? 'linear-gradient(90deg, transparent, rgba(251, 191, 36, 0.25), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255, 43, 74, 0.28), transparent)',
          }}
        />
        {/* Moving Neon Spark Particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60">
          {[12, 27, 46, 68, 84, 93].map((leftPct, i) => (
            <span
              key={i}
              className="absolute w-1 h-1 animate-ping"
              style={{
                left: `${leftPct}%`,
                top: i % 2 === 0 ? '20%' : '72%',
                backgroundColor: isRelease ? '#fde047' : '#ff3b5c',
                animationDuration: `${1.8 + (i % 3) * 0.6}s`,
              }}
            />
          ))}
        </div>

        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Left: Flashing Warning Beacon + Animated Neon Headline */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 border-2 flex items-center justify-center shrink-0 ${
                isRelease
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-[#ff2b4a]/20 border-[#ff4d6d] text-[#ff4d6d]'
              }`}
            >
              {isRelease ? (
                <Crown className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`font-pixel text-[10px] px-1.5 py-0.5 border ${
                    isRelease
                      ? 'bg-amber-500/25 border-amber-400 text-amber-200'
                      : 'bg-red-950/90 border-[#ff4d6d] text-[#ff8fa3]'
                  }`}
                >
                  {isRelease
                    ? status.event.title
                    : isFinalHour
                    ? 'CRITICAL ALERT'
                    : isFinalDay
                    ? 'FINAL 24H'
                    : tr(lang, 'zaiDaysLeftBadge', { days: daysLeftCeil })}
                </span>
                <span className="font-mono-num text-[10px] text-slate-300">
                  {status.event.dateLabel} · {status.event.title}
                </span>
              </div>
              <div
                className={`zai-float-text font-pixel text-xs sm:text-sm mt-1 truncate ${
                  isRelease
                    ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.75)]'
                    : 'text-white drop-shadow-[0_0_8px_rgba(255,43,74,0.85)]'
                }`}
              >
                {headline}
              </div>
            </div>
          </div>

          {/* Center: Live DD : HH : MM : SS Countdown Blocks OR Gold AVAILABLE NOW */}
          {!isRelease ? (
            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { val: status.countdownParts.days, lbl: tr(lang, 'daysShort') },
                { val: status.countdownParts.hours, lbl: tr(lang, 'hoursShort') },
                { val: status.countdownParts.minutes, lbl: tr(lang, 'minutesShort') },
                { val: status.countdownParts.seconds, lbl: tr(lang, 'secondsShort') },
              ].map((unit, idx) => (
                <React.Fragment key={unit.lbl}>
                  <div className="bg-black/85 border border-[#ff2b4a]/80 px-2 py-1 text-center min-w-[46px]">
                    <div className="font-mono-num text-sm font-extrabold text-[#ff5c77] leading-none">
                      {unit.val}
                    </div>
                    <div className="font-pixel text-[7px] text-slate-400 mt-0.5">{unit.lbl}</div>
                  </div>
                  {idx < 3 && (
                    <span className="font-mono-num font-bold text-[#ff4d6d] text-xs">:</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="px-4 py-1.5 bg-gradient-to-r from-amber-500/25 via-red-600/25 to-amber-500/25 border border-amber-400 font-pixel text-xs sm:text-sm text-amber-200 tracking-wider">
              {tr(lang, 'simAvailableNow')}
            </div>
          )}

          {/* Right: Action CTA & Dismiss */}
          <div className="flex items-center gap-2 shrink-0">
            {isRelease ? (
              <button
                type="button"
                onClick={() => {
                  audio.playSfx('menuClick');
                  onExploreCollection();
                }}
                className="pixel-btn bg-gradient-to-r from-amber-500 to-red-600 hover:brightness-110 border-amber-300 text-slate-950 font-extrabold px-3.5 py-2 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{tr(lang, 'exploreCollection')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  audio.playSfx('menuClick');
                  onViewEvent(status.event.id);
                }}
                className="pixel-btn bg-[#dc2626] hover:bg-[#ef4444] border-[#ff8fa3] text-white px-3.5 py-2 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{tr(lang, 'viewUpcomingZaiEvent')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                onDismiss();
              }}
              aria-label="Dismiss announcement"
              className="pixel-btn bg-slate-950/90 hover:bg-slate-800 border-slate-700 text-slate-300 p-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================================
// 2. ROBLOX-STYLE FULL-SCREEN ZAI EVENT PROMO MODAL
// ===================================================
interface ZaiEventPromoModalProps {
  eventId: AnnualZaiEventId;
  effectiveNow: Date;
  lang?: string | null;
  onClose: () => void;
  onExploreCollection: () => void;
}

export const ZaiEventPromoModal: React.FC<ZaiEventPromoModalProps> = ({
  eventId,
  effectiveNow,
  lang,
  onClose,
  onExploreCollection,
}) => {
  const status = getAnnualZaiEventStatus(eventId, effectiveNow);
  const { event } = status;
  const exclusiveSkin = getSkinById(event.exclusiveSkinId);
  const exclusiveWeb = getWebDesignById(event.exclusiveWebId);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        const W = 480;
        const H = 270;
        ctx.clearRect(0, 0, W, H);
        // Dark obsidian gradient
        const g = ctx.createRadialGradient(W / 2, H / 2, 12, W / 2, H / 2, 260);
        g.addColorStop(0, status.isActive ? 'rgba(251, 191, 36, 0.22)' : 'rgba(239, 68, 68, 0.25)');
        g.addColorStop(1, 'rgba(6, 3, 8, 0.96)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);

        // Animated crimson/gold corner spider webs
        ctx.strokeStyle = status.isActive ? 'rgba(251,191,36,0.22)' : 'rgba(255,43,74,0.24)';
        ctx.lineWidth = 1;
        for (const [cx, cy] of [
          [0, 0],
          [W, 0],
          [0, H],
          [W, H],
        ]) {
          for (let r = 24; r <= 120; r += 24) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
          }
          for (let a = 0; a < 8; a++) {
            const ang = (Math.PI * 2 * a) / 8 + Math.sin(t * 0.4) * 0.05;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(ang) * 140, cy + Math.sin(ang) * 140);
            ctx.stroke();
          }
        }

        // Drifting neon particles
        for (let i = 0; i < 28; i++) {
          const px = ((i * 53 + t * (14 + (i % 4) * 5)) % W);
          const py = ((i * 37 + Math.sin(t * 2 + i) * 12) % H);
          ctx.fillStyle = status.isActive && i % 2 === 0 ? '#fde047' : '#ff3b5c';
          ctx.globalAlpha = 0.45 + Math.sin(t * 4 + i) * 0.35;
          ctx.fillRect(Math.round(px), Math.round(py), 2, 2);
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [status.isActive]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-6">
      <div
        className={`relative pixel-panel w-full max-w-4xl max-h-[92vh] overflow-y-auto border-2 ${
          status.isActive ? 'zai-gold-banner border-amber-400' : 'zai-neon-banner border-[#ff2b4a]'
        } bg-[#090408]`}
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={270}
          className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-80"
        />

        <div className="relative z-10 p-5 sm:p-7 flex flex-col gap-5">
          {/* Header Crest */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-pixel text-[10px] px-2 py-0.5 bg-[#ff2b4a]/25 border border-[#ff4d6d] text-[#ff8fa3]">
                  ZAI LIMITED EDITION
                </span>
                <span className="font-pixel text-[10px] px-2 py-0.5 bg-slate-900/90 border border-slate-700 text-amber-300">
                  {status.isActive ? tr(lang, 'simAvailableNow') : tr(lang, 'zaiComingSoon')}
                </span>
                <span className="font-mono-num text-xs text-slate-300">
                  {event.dateLabel} · {status.year}
                </span>
              </div>
              <h2 className="font-pixel text-2xl sm:text-4xl text-white mt-2 drop-shadow-[0_0_12px_rgba(255,43,74,0.75)]">
                {event.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {tr(lang, 'zaiEventPromoSub')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                onClose();
              }}
              className="pixel-btn bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200 p-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live Countdown Strip inside Promo */}
          <div className="bg-black/80 border border-[#ff2b4a]/60 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-200 max-w-md">{event.descriptionEn}</div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[10px] text-amber-300">
                {status.isActive ? tr(lang, 'endsIn') : tr(lang, 'startsIn')}:
              </span>
              <span className="font-mono-num text-lg sm:text-xl font-bold text-[#ff5c77]">
                {status.countdownText}
              </span>
            </div>
          </div>

          {/* Showcase Trio: Exclusive Skin + Exclusive Web Design + Mystery Teaser */}
          <div>
            <div className="font-pixel text-xs text-amber-300 mb-2.5 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tr(lang, 'rarityBreakdown')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Featured Skin */}
              <div className="pixel-panel bg-slate-950/90 border-amber-500/60 p-3.5 flex flex-col items-center text-center gap-2.5">
                <span
                  className={`font-pixel text-[9px] px-2 py-0.5 ${RARITY_META[exclusiveSkin.rarity].badgeClass}`}
                >
                  {RARITY_META[exclusiveSkin.rarity].labelUz}
                </span>
                <SkinPreviewCanvas skinId={exclusiveSkin.id} size="lg" anim="run" />
                <div className="font-pixel text-xs text-white">{exclusiveSkin.name}</div>
                <div className="text-[11px] text-slate-400">{exclusiveSkin.descriptionUz}</div>
              </div>

              {/* Featured Web Design */}
              <div className="pixel-panel bg-slate-950/90 border-[#ff2b4a]/60 p-3.5 flex flex-col items-center text-center gap-2.5">
                <span className="font-pixel text-[9px] px-2 py-0.5 border border-rose-400 text-rose-200 bg-rose-950/50">
                  LIMITED WEB DESIGN
                </span>
                <WebDesignPreviewCanvas webDesignId={exclusiveWeb.id} size="lg" quality="ultra" />
                <div className="font-pixel text-xs text-white">{exclusiveWeb.name}</div>
                <div className="text-[11px] text-slate-400">{exclusiveWeb.descriptionUz}</div>
              </div>

              {/* Mystery Silhouette Teaser */}
              <div className="pixel-panel bg-slate-950/90 border-purple-500/50 p-3.5 flex flex-col items-center justify-center text-center gap-2.5">
                <span className="font-pixel text-[9px] px-2 py-0.5 border border-purple-400 text-purple-200 bg-purple-950/50">
                  SECRET CASE DROP
                </span>
                <div className="w-28 h-24 bg-[#070914] border border-purple-500/40 flex flex-col items-center justify-center">
                  <HelpCircle className="w-10 h-10 text-purple-400 animate-pulse" />
                  <span className="font-pixel text-[10px] text-purple-300 mt-1">???</span>
                </div>
                <div className="font-pixel text-xs text-white">{tr(lang, 'mysteryItem')}</div>
                <div className="text-[11px] text-slate-400">{tr(lang, 'mysteryTeaserDesc')}</div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/90">
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                onClose();
              }}
              className="pixel-btn bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-2.5 font-pixel text-xs cursor-pointer"
            >
              {tr(lang, 'back')}
            </button>
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                onExploreCollection();
              }}
              className={`pixel-btn px-6 py-2.5 font-pixel text-xs flex items-center gap-2 cursor-pointer ${
                status.isActive
                  ? 'bg-gradient-to-r from-amber-500 to-red-600 border-amber-300 text-slate-950 font-extrabold'
                  : 'bg-[#dc2626] hover:bg-[#ef4444] border-[#ff7b89] text-white'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>{tr(lang, 'exploreCollection')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===================================================
// 3. ZAI EVENTS HUB + EVENT PREVIEW SIMULATOR + 12 SEASONS
// ===================================================
interface ZaiEventsScreenProps {
  effectiveNow: Date;
  simMode: ZaiEventSimMode;
  simTargetEventId: AnnualZaiEventId;
  lang?: string | null;
  onChangeSimMode: (mode: ZaiEventSimMode, targetEventId: AnnualZaiEventId) => void;
  onOpenPromo: (eventId: AnnualZaiEventId) => void;
  onOpenMarketZai: () => void;
  onOpenCases: () => void;
  onBack: () => void;
}

export const ZaiEventsScreen: React.FC<ZaiEventsScreenProps> = ({
  effectiveNow,
  simMode,
  simTargetEventId,
  lang,
  onChangeSimMode,
  onOpenPromo,
  onOpenMarketZai,
  onOpenCases,
  onBack,
}) => {
  const simOptions: { id: ZaiEventSimMode; label: string }[] = [
    { id: 'live', label: tr(lang, 'simLiveClock') },
    { id: 'warning_7d', label: tr(lang, 'sim7Days') },
    { id: 'warning_24h', label: tr(lang, 'sim24Hours') },
    { id: 'warning_1h', label: tr(lang, 'sim1Hour') },
    { id: 'active_now', label: tr(lang, 'simAvailableNow') },
  ];

  return (
    <div className="w-full h-full overflow-y-auto bg-[#070b14] text-slate-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-pixel text-[10px] text-rose-400 tracking-wider">
              SPIDER SPIKEY · ZAI LIMITED & LIVE CALENDAR
            </div>
            <h1 className="font-pixel text-2xl sm:text-3xl text-white mt-0.5">
              {tr(lang, 'events')}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                onOpenMarketZai();
              }}
              className="pixel-btn bg-amber-600/85 hover:bg-amber-500 border-amber-300 text-slate-950 font-bold px-3.5 py-2 font-pixel text-[10px] cursor-pointer"
            >
              {tr(lang, 'tabZaiLimited')}
            </button>
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                onOpenCases();
              }}
              className="pixel-btn bg-purple-700 hover:bg-purple-600 border-purple-400 text-white px-3.5 py-2 font-pixel text-[10px] cursor-pointer"
            >
              {tr(lang, 'cases')}
            </button>
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                onBack();
              }}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 font-pixel text-[10px] cursor-pointer"
            >
              {tr(lang, 'back')}
            </button>
          </div>
        </div>

        {/* Event Preview Simulator Control Panel */}
        <div className="pixel-panel border-[#ff2b4a]/70 bg-gradient-to-r from-[#140409] via-[#1b0811] to-[#110a1a] p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#ff4d6d]" />
              <span className="font-pixel text-xs text-rose-200">
                {tr(lang, 'zaiSimulatorLabel')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {ANNUAL_ZAI_EVENTS.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => {
                    audio.playSfx('menuClick');
                    onChangeSimMode(simMode === 'live' ? 'warning_7d' : simMode, ev.id);
                  }}
                  className={`pixel-btn px-2.5 py-1 font-pixel text-[9px] cursor-pointer ${
                    simTargetEventId === ev.id
                      ? 'bg-rose-700 border-rose-300 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  {ev.dateLabel}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {simOptions.map((opt) => {
              const active = simMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    audio.playSfx('menuClick');
                    onChangeSimMode(opt.id, simTargetEventId);
                  }}
                  className={`pixel-btn px-3 py-1.5 font-pixel text-[10px] cursor-pointer ${
                    active
                      ? opt.id === 'active_now'
                        ? 'bg-amber-500 border-amber-200 text-slate-950 font-bold'
                        : 'bg-[#dc2626] border-[#ff8fa3] text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Annual ZAI Limited Events (June 10, August 23, September 9) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ANNUAL_ZAI_EVENTS.map((ev: AnnualZaiEventDef) => {
            const st = getAnnualZaiEventStatus(ev, effectiveNow);
            return (
              <div
                key={ev.id}
                className={`pixel-panel p-4 flex flex-col gap-3 ${
                  st.isActive
                    ? 'zai-gold-banner bg-gradient-to-b from-[#231204] to-[#0b0c16] border-amber-400'
                    : 'bg-[#0e1424] border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-pixel text-[10px] text-amber-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {ev.dateLabel}
                  </span>
                  <span
                    className={`font-pixel text-[9px] px-2 py-0.5 border ${
                      st.isActive
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    {st.isActive ? tr(lang, 'activeNow') : tr(lang, 'zaiComingSoon')}
                  </span>
                </div>

                <h3 className="font-pixel text-sm text-white">{ev.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed flex-1">{ev.descriptionEn}</p>

                <div className="flex items-center justify-center gap-3 py-1">
                  <SkinPreviewCanvas skinId={ev.exclusiveSkinId} size="md" anim="idle" />
                  <WebDesignPreviewCanvas webDesignId={ev.exclusiveWebId} size="md" quality="high" />
                </div>

                <div className="bg-slate-950/90 border border-slate-800 px-3 py-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-pixel text-[9px]">
                    {st.isActive ? tr(lang, 'endsIn') : tr(lang, 'startsIn')}
                  </span>
                  <span className="font-mono-num font-bold text-rose-300">{st.countdownText}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    audio.playSfx('menuClick');
                    onOpenPromo(ev.id);
                  }}
                  className="pixel-btn w-full bg-[#dc2626] hover:bg-[#ef4444] border-[#ff7b89] text-white py-2 font-pixel text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{tr(lang, 'viewUpcomingZaiEvent')}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* 12 Monthly ZAI Limited Themes & Live Seasons */}
        <div className="pixel-panel bg-slate-950/90 border-slate-800 p-4">
          <div className="font-pixel text-xs text-sky-300 mb-3">
            12-MONTH LIVE SEASONS & MONTHLY ZAI THEMES
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as SeasonMonth[]).map((m) => {
              const zai = ZAI_MONTHLY_THEMES[m];
              const sea = SEASONS_12[m];
              return (
                <div
                  key={m}
                  className="border border-slate-800 bg-slate-900/80 p-2.5 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-[9px] font-pixel">
                    <span style={{ color: zai.primaryHex }}>{zai.themeCode}</span>
                    <span className="text-slate-400">{zai.releaseDateLabel}</span>
                  </div>
                  <div className="font-pixel text-[10px] text-white truncate">{zai.nameEn}</div>
                  <div className="text-[10px] text-slate-400 truncate">{sea.seasonTitleUz}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
