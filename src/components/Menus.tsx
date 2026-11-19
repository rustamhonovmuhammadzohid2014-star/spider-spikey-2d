import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Award,
  BookOpen,
  Box,
  Calendar,
  ChevronRight,
  Coins,
  Crown,
  Gem,
  Gift,
  Globe,
  Lock,
  LogOut,
  Mail,
  Maximize,
  Minimize,
  Package,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Trophy,
  Volume2,
  X,
} from 'lucide-react';
import { audio } from '../game/audio';
import { getPlayerLevelProgress } from '../game/economy';
import { getLanguageDef, tr } from '../game/i18n';
import { ALL_STAGES, STAGE_MAP } from '../game/levels';
import { LiveCalendarInfo, getSeasonLevelFromXp } from '../game/seasons';
import { getSkinById } from '../game/skins';
import { drawSeasonalMenuScene } from '../game/sprites';
import { formatKeyCode } from '../game/storage';
import {
  ABILITY_META,
  ACHIEVEMENTS,
  EconomyData,
  GameSettings,
  GraphicsQuality,
  KeyBindings,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  MenuThemeMode,
  ModalTab,
  ResolutionScale,
  SaveData,
  ScreenState,
  SeasonMonth,
  StageClearSummary,
  TouchMode,
  WORLD_THEMES,
  WorldId,
} from '../game/types';
import { getWebDesignById } from '../game/webDesigns';
import { SkinPreviewCanvas, WebDesignPreviewCanvas } from './SkinPreviewCanvas';

// Dinamik 16-bit Qish / Sezonli bosh menyu foni
export const MenuBackdropCanvas: React.FC<{
  month: SeasonMonth;
  themeMode?: MenuThemeMode;
  equippedSkin?: string;
  equippedWebDesign?: string;
  graphicsQuality?: GraphicsQuality;
}> = ({
  month,
  themeMode = 'winter',
  equippedSkin = 'classic',
  equippedWebDesign = 'classic_white',
  graphicsQuality = 'high',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        const camX = (t * 16) % 480;
        drawSeasonalMenuScene(
          ctx,
          themeMode === 'winter' ? 'winter' : month,
          camX,
          t,
          equippedSkin,
          equippedWebDesign,
          graphicsQuality
        );
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [month, themeMode, equippedSkin, equippedWebDesign, graphicsQuality]);

  return (
    <canvas
      ref={canvasRef}
      width={LOGICAL_WIDTH}
      height={LOGICAL_HEIGHT}
      className="pixelated absolute inset-0 w-full h-full object-cover opacity-85"
    />
  );
};

interface MainMenuProps {
  saveData: SaveData;
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  lang?: string | null;
  menuThemeMode?: MenuThemeMode;
  graphicsQuality?: GraphicsQuality;
  reopenZaiAlert?: {
    active: boolean;
    isRelease: boolean;
    label: string;
    onClick: () => void;
  } | null;
  isTrialMode?: boolean;
  nickname?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  incomingTradesCount?: number;
  dailyClaimReady?: boolean;
  seasonClaimReadyCount?: number;
  missionsClaimReadyCount?: number;
  onToggleSeasonTheme?: () => void;
  onOpenLanguage?: () => void;
  onOpenTutorial?: () => void;
  onConnectGmail?: () => void;
  onSignOut?: () => void;
  onPlay: () => void;
  onContinue: () => void;
  onNavigateScreen: (screen: ScreenState) => void;
  onOpenModal: (tab: ModalTab) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  economy,
  calendar,
  lang,
  menuThemeMode = 'winter',
  graphicsQuality = 'high',
  reopenZaiAlert,
  isTrialMode = false,
  nickname,
  userEmail,
  userName,
  incomingTradesCount = 0,
  dailyClaimReady = false,
  seasonClaimReadyCount = 0,
  missionsClaimReadyCount = 0,
  onToggleSeasonTheme,
  onOpenLanguage,
  onOpenTutorial,
  onConnectGmail,
  onSignOut,
  onPlay,
  onContinue,
  onNavigateScreen,
  onOpenModal,
}) => {
  const click = (fn: () => void) => () => {
    audio.unlock();
    audio.playSfx('menuClick');
    fn();
  };

  const hover = () => {
    audio.unlock();
    audio.playSfx('menuHover');
  };

  const crystalsFound = Object.values(saveData.stageProgress).reduce(
    (acc, p) => acc + p.crystals.filter(Boolean).length,
    0
  );
  const seasonLevel = getSeasonLevelFromXp(economy.seasonXp);
  const ownedCasesTotal = Object.values(economy.ownedCases).reduce((a, b) => a + b, 0);
  const levelInfo = getPlayerLevelProgress(economy.playerXp ?? 0);
  const langDef = getLanguageDef(lang);
  const eqSkin = getSkinById(economy.equippedSkin);
  const eqWeb = getWebDesignById(economy.equippedWebDesign);

  return (
    <div
      className="relative flex-1 w-full flex flex-col justify-between overflow-y-auto overflow-x-hidden"
      style={{ backgroundColor: menuThemeMode === 'winter' ? '#081326' : calendar.season.skyTop }}
    >
      <MenuBackdropCanvas
        month={calendar.month}
        themeMode={menuThemeMode}
        equippedSkin={economy.equippedSkin}
        equippedWebDesign={economy.equippedWebDesign ?? 'classic_white'}
        graphicsQuality={graphicsQuality}
      />
      <div className="fixed inset-0 bg-gradient-to-r from-[#070b14]/92 via-[#070b14]/65 to-[#070b14]/25 pointer-events-none" />

      {/* Top Header: Season Theme Switcher, Language, Player Level XP, Coins Wallet */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-3.5 text-xs text-slate-200">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex flex-col gap-0.5">
            <span
              className="font-pixel text-[11px] sm:text-xs tracking-wider"
              style={{ color: menuThemeMode === 'winter' ? '#67e8f9' : calendar.season.accentColor }}
            >
              {menuThemeMode === 'winter' ? `❄ ${tr(lang, 'winterTheme')} · ${calendar.bannerLine1}` : calendar.bannerLine1}
            </span>
            <span className="font-pixel text-[10px] text-slate-300">
              {calendar.bannerLine2} · {calendar.season.subtitleUz}
            </span>
          </div>

          {onToggleSeasonTheme && (
            <button
              type="button"
              onClick={click(onToggleSeasonTheme)}
              title={tr(lang, 'switchSeasonPrompt')}
              className={`pixel-btn px-2.5 py-1.5 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer ${
                menuThemeMode === 'winter'
                  ? 'bg-cyan-950/90 border-cyan-400/70 text-cyan-200 hover:bg-cyan-900/90'
                  : 'bg-amber-950/90 border-amber-400/70 text-amber-200 hover:bg-amber-900/90'
              }`}
            >
              {menuThemeMode === 'winter' ? (
                <Snowflake className="w-3.5 h-3.5 text-cyan-300" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>{menuThemeMode === 'winter' ? tr(lang, 'winterTheme') : tr(lang, 'liveSeason')}</span>
            </button>
          )}

          {onOpenLanguage && (
            <button
              type="button"
              onClick={click(onOpenLanguage)}
              className="pixel-btn bg-slate-900/90 hover:bg-slate-800 border-slate-700 px-2.5 py-1.5 font-pixel text-[10px] text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>{langDef.flag} {langDef.code.toUpperCase()}</span>
            </button>
          )}

          {reopenZaiAlert?.active && (
            <button
              type="button"
              onClick={click(reopenZaiAlert.onClick)}
              className={`pixel-btn px-2.5 py-1.5 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer ${
                reopenZaiAlert.isRelease
                  ? 'bg-amber-600/90 border-amber-300 text-slate-950 font-bold'
                  : 'bg-[#7f1d1d]/90 border-[#ff4d6d] text-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{reopenZaiAlert.label}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 font-mono-num">
          {/* Player Level + XP bar */}
          <div className="pixel-panel px-2.5 py-1 border-sky-400/50 bg-slate-950/90 flex items-center gap-2">
            <div className="flex flex-col leading-none min-w-[84px]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-pixel text-[9px] text-sky-300">
                  {tr(lang, 'playerLevel', { level: levelInfo.level })}
                </span>
                <span className="text-[9px] text-slate-400">
                  {levelInfo.currentLevelXp}/{levelInfo.nextLevelXp} XP
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 mt-1 overflow-hidden">
                <div
                  className="h-full bg-sky-400"
                  style={{ width: `${Math.round(levelInfo.ratio * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <span className="text-purple-300 hidden md:inline">{crystalsFound}/30 💎</span>
          <span className="text-sky-300 hidden md:inline">S-LVL {seasonLevel}</span>

          {/* Persistent SPIKEY COINS wallet */}
          <div
            className="pixel-panel px-3 py-1.5 border-amber-400/70 bg-slate-950/90 flex items-center gap-2"
            title={tr(lang, 'spikeyCoins')}
          >
            <Coins className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="font-pixel text-[8px] text-amber-300/80">{tr(lang, 'spikeyCoins')}</span>
              <span className="font-mono-num text-xs sm:text-sm font-bold text-amber-300">
                {economy.spikeyCoins.toLocaleString()}
              </span>
            </div>
          </div>

          {isTrialMode ? (
            <>
              <span className="text-amber-300 text-[11px]">BEPUL SINOV (1-2)</span>
              {onConnectGmail && (
                <button
                  type="button"
                  onClick={click(onConnectGmail)}
                  className="pixel-btn bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-[11px] text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Mail className="w-3 h-3" />
                  <span>GMAIL ULASH</span>
                </button>
              )}
            </>
          ) : (
            <>
              {(nickname || userEmail) && (
                <span className="text-emerald-300 truncate max-w-[140px]" title={userEmail ?? ''}>
                  {nickname || userName || userEmail}
                </span>
              )}
              {onSignOut && (
                <button
                  type="button"
                  onClick={click(onSignOut)}
                  className="pixel-btn bg-slate-900/85 hover:bg-rose-950/85 px-2.5 py-1.5 text-[11px] text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>CHIQISH</span>
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Main Content Area: Title, Active Loadout & Navigation */}
      <main className="relative z-10 flex-1 flex items-center px-5 sm:px-10 py-2">
        <div className="max-w-4xl w-full flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h1 className="font-pixel text-3xl sm:text-5xl text-white tracking-tight leading-none drop-shadow-[0_4px_0_#0f172a]">
                SPIDER <span style={{ color: menuThemeMode === 'winter' ? '#67e8f9' : calendar.season.accentColor }}>SPIKEY</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                5 Dunyo · 15 Bosqich · Q To‘rda Uchish · E O‘rgimchak Uyi · ZAI Limited Edition!
              </p>
            </div>

            {/* Active Skin & Active Web Design Showcase */}
            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <div className="pixel-panel px-2.5 py-1.5 bg-slate-950/85 border-slate-700 flex items-center gap-2">
                <SkinPreviewCanvas skinId={eqSkin.id} size="sm" anim="idle" />
                <div className="text-[10px] leading-tight">
                  <div className="font-pixel text-slate-400 text-[8px]">{tr(lang, 'equippedSkinLabel')}</div>
                  <div className="font-pixel text-white truncate max-w-[92px]">{eqSkin.name}</div>
                </div>
              </div>
              <div className="pixel-panel px-2.5 py-1.5 bg-slate-950/85 border-cyan-500/40 flex items-center gap-2">
                <WebDesignPreviewCanvas webDesignId={eqWeb.id} size="sm" quality={graphicsQuality} />
                <div className="text-[10px] leading-tight">
                  <div className="font-pixel text-cyan-300 text-[8px]">{tr(lang, 'equippedWebLabel')}</div>
                  <div className="font-pixel text-white truncate max-w-[92px]">{eqWeb.name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Play + Feature Grid */}
          <nav className="grid grid-cols-1 sm:grid-cols-4 gap-2.5" aria-label="Main Menu">
            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(onPlay)}
              className="sm:col-span-2 pixel-btn bg-sky-600 hover:bg-sky-500 text-white px-5 py-3 font-pixel text-sm flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Play className="w-4 h-4 fill-current" />
                {tr(lang, 'play')}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => onNavigateScreen('WORLD_SELECT'))}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-100 px-4 py-3 font-pixel text-xs flex items-center justify-between cursor-pointer"
            >
              <span>{tr(lang, 'worlds')} / {tr(lang, 'levels')}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => {
                if (onOpenTutorial) onOpenTutorial();
                else onOpenModal('TUTORIAL');
              })}
              className="pixel-btn bg-cyan-800/85 hover:bg-cyan-700 border-cyan-400/70 text-white px-4 py-3 font-pixel text-xs flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-cyan-200" />
                {tr(lang, 'tutorial')}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-200" />
            </button>

            <button
              type="button"
              disabled={!saveData.hasStarted}
              onMouseEnter={hover}
              onClick={click(onContinue)}
              className={`sm:col-span-4 pixel-btn px-5 py-2 font-pixel text-xs flex items-center justify-between ${
                saveData.hasStarted
                  ? 'bg-slate-800/95 hover:bg-slate-700 text-slate-100 cursor-pointer'
                  : 'bg-slate-900/70 text-slate-500 opacity-55 cursor-not-allowed'
              }`}
            >
              <span>{tr(lang, 'continueBtn')}</span>
              <span className="font-mono-num text-[11px] text-sky-400">
                {saveData.hasStarted ? `${saveData.currentStageId}` : '---'}
              </span>
            </button>

            {/* Economy & Season & ZAI Navigation */}
            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => onNavigateScreen('SEASON_PASS'))}
              className="pixel-btn bg-slate-900/90 hover:bg-slate-800 border-sky-500/40 text-slate-100 px-3.5 py-2.5 font-pixel text-[11px] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-sky-400" />
                {tr(lang, 'seasonPass')}
              </span>
              {seasonClaimReadyCount > 0 && (
                <span className="bg-emerald-600 text-white px-1.5 py-0.5 text-[9px] font-mono-num">
                  +{seasonClaimReadyCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => onNavigateScreen('DAILY_REWARDS'))}
              className="pixel-btn bg-slate-900/90 hover:bg-slate-800 border-emerald-500/40 text-slate-100 px-3.5 py-2.5 font-pixel text-[11px] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Gift className="w-3.5 h-3.5 text-emerald-400" />
                {tr(lang, 'dailyRewards')}
              </span>
              {dailyClaimReady && (
                <span className="bg-emerald-600 text-white px-1.5 py-0.5 text-[9px] font-pixel animate-pulse">
                  !
                </span>
              )}
            </button>

            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => onNavigateScreen('MARKETPLACE'))}
              className="pixel-btn bg-slate-900/90 hover:bg-slate-800 border-amber-500/40 text-slate-100 px-3.5 py-2.5 font-pixel text-[11px] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                {tr(lang, 'market')}
              </span>
            </button>

            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => onNavigateScreen('CASES'))}
              className="pixel-btn bg-slate-900/90 hover:bg-slate-800 border-purple-500/40 text-slate-100 px-3.5 py-2.5 font-pixel text-[11px] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Box className="w-3.5 h-3.5 text-purple-400" />
                {tr(lang, 'cases')}
              </span>
              {ownedCasesTotal > 0 && (
                <span className="bg-purple-600 text-white px-1.5 py-0.5 text-[9px] font-mono-num">
                  ×{ownedCasesTotal}
                </span>
              )}
            </button>

            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => onNavigateScreen('INVENTORY'))}
              className="pixel-btn bg-slate-900/90 hover:bg-slate-800 text-slate-100 px-3.5 py-2.5 font-pixel text-[11px] flex items-center gap-2 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              <span>{tr(lang, 'inventory')}</span>
            </button>

            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => onNavigateScreen('MISSIONS'))}
              className="pixel-btn bg-slate-900/90 hover:bg-slate-800 text-slate-100 px-3.5 py-2.5 font-pixel text-[11px] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-rose-400" />
                {tr(lang, 'missions')}
              </span>
              {missionsClaimReadyCount > 0 && (
                <span className="bg-amber-600 text-white px-1.5 py-0.5 text-[9px] font-mono-num">
                  +{missionsClaimReadyCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => onNavigateScreen('EVENTS'))}
              className="pixel-btn bg-gradient-to-r from-[#2c0912] to-[#1a0c2e] hover:brightness-110 border-[#ff4d6d]/80 text-rose-100 px-3.5 py-2.5 font-pixel text-[11px] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#ff5c77]" />
                {tr(lang, 'events')}
              </span>
              <Sparkles className="w-3 h-3 text-amber-300" />
            </button>

            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => onNavigateScreen('ACHIEVEMENTS'))}
              className="pixel-btn bg-slate-900/90 hover:bg-slate-800 text-slate-100 px-3.5 py-2.5 font-pixel text-[11px] flex items-center gap-2 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>{tr(lang, 'achievements')}</span>
            </button>

            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => onNavigateScreen('LEADERBOARD'))}
              className="pixel-btn bg-slate-900/90 hover:bg-slate-800 text-slate-100 px-3.5 py-2.5 font-pixel text-[11px] flex items-center gap-2 cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span>{tr(lang, 'leaderboard')}</span>
            </button>

            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => onNavigateScreen('TRADING'))}
              className="pixel-btn bg-slate-900/90 hover:bg-slate-800 text-slate-100 px-3.5 py-2.5 font-pixel text-[11px] flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <ArrowLeftRight className="w-3.5 h-3.5 text-purple-300" />
                {tr(lang, 'trading')}
              </span>
              {incomingTradesCount > 0 && (
                <span className="bg-emerald-600 text-white px-1.5 py-0.5 text-[9px] font-mono-num">
                  {incomingTradesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => onOpenModal('SETTINGS'))}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-100 px-3.5 py-2.5 font-pixel text-[11px] flex items-center gap-2 cursor-pointer"
            >
              <SettingsIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>{tr(lang, 'settings')}</span>
            </button>

            <button
              type="button"
              onMouseEnter={hover}
              onClick={click(() => onOpenModal('CREDITS'))}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-100 px-3.5 py-2.5 font-pixel text-[11px] text-left cursor-pointer"
            >
              {tr(lang, 'credits')}
            </button>
          </nav>
        </div>
      </main>

      <footer className="relative z-10 px-6 py-2 text-[11px] text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>W/A/S/D · Space ×2 · Shift · J · K · Q Web-Swing · E Spider House · C Swap</span>
      </footer>
    </div>
  );
};

interface WorldSelectProps {
  saveData: SaveData;
  lang?: string | null;
  isTrialMode?: boolean;
  onRequireGmail?: () => void;
  onSelectStage: (stageId: string) => void;
  onBack: () => void;
}

export const WorldSelectScreen: React.FC<WorldSelectProps> = ({
  saveData,
  lang,
  isTrialMode = false,
  onRequireGmail,
  onSelectStage,
  onBack,
}) => {
  const worldIds: WorldId[] = [1, 2, 3, 4, 5];

  return (
    <div className="w-full flex-1 bg-[#090d16] text-slate-100 flex flex-col overflow-y-auto p-5 sm:p-8">
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="font-pixel text-2xl sm:text-3xl text-white">
              {tr(lang, 'worlds')} / {tr(lang, 'levels')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {isTrialMode
                ? 'Bepul sinov: 1-1 va 1-2 darajalar ochiq · Qolgan bosqichlar uchun Gmail ulang'
                : '5 Dunyo · 15 ta Bosqich · Istalgan ochilgan bosqichni tanlang'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              audio.playSfx('menuClick');
              onBack();
            }}
            className="pixel-btn bg-slate-800 hover:bg-slate-700 px-4 py-2 font-pixel text-xs text-slate-100 cursor-pointer"
          >
            {tr(lang, 'back')}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {worldIds.map((wid) => {
            const theme = WORLD_THEMES[wid];
            const stages = ALL_STAGES.filter((s) => s.worldId === wid);
            return (
              <div
                key={wid}
                className="pixel-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="min-w-[200px]">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="font-pixel" style={{ color: theme.accentColor }}>
                      WORLD {wid}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{theme.subtitle}</span>
                  </div>
                  <h3 className="font-pixel text-lg text-white mt-0.5">{theme.name}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                  {stages.map((st) => {
                    const trialAllowed = !isTrialMode || st.id === '1-1' || st.id === '1-2';
                    const unlocked = trialAllowed && saveData.unlockedStageIds.includes(st.id);
                    const prog = saveData.stageProgress[st.id];
                    const crystals = prog?.crystals ?? [false, false, false];
                    return (
                      <button
                        key={st.id}
                        type="button"
                        disabled={!unlocked && !(isTrialMode && !trialAllowed)}
                        onClick={() => {
                          audio.unlock();
                          audio.playSfx('menuClick');
                          if (isTrialMode && !trialAllowed) {
                            onRequireGmail?.();
                            return;
                          }
                          if (unlocked) onSelectStage(st.id);
                        }}
                        className={`pixel-btn p-3 text-left flex flex-col justify-between gap-2 ${
                          unlocked
                            ? st.isBossStage
                              ? 'bg-rose-950/55 hover:bg-rose-900/60 border-rose-700/70 cursor-pointer'
                              : 'bg-slate-800/90 hover:bg-slate-700/90 cursor-pointer'
                            : isTrialMode && !trialAllowed
                            ? 'bg-slate-900/70 border-amber-500/40 hover:border-sky-400/70 opacity-80 cursor-pointer'
                            : 'bg-slate-900/60 opacity-45 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-pixel text-xs text-sky-300">
                            {st.isBossStage ? `${wid}-BOSS` : st.id}
                          </span>
                          {!unlocked ? (
                            <span className="flex items-center gap-1 text-[10px] text-amber-300">
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                              {isTrialMode && !trialAllowed ? 'Gmail' : null}
                            </span>
                          ) : prog?.completed ? (
                            <span className="font-pixel text-[10px] text-emerald-400">OK</span>
                          ) : null}
                        </div>
                        <div className="text-xs font-medium text-slate-200 truncate">
                          {st.name}
                        </div>
                        {!st.isBossStage ? (
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <div className="flex items-center gap-1">
                              {crystals.map((c, idx) => (
                                <Gem
                                  key={idx}
                                  className={`w-3.5 h-3.5 ${
                                    c ? 'text-purple-400 fill-purple-400' : 'text-slate-600'
                                  }`}
                                />
                              ))}
                            </div>
                            {prog?.bestTimeSec ? (
                              <span className="font-mono-num">{prog.bestTimeSec}s</span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-[11px] text-rose-300 truncate">
                            {st.bossName}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface SettingsModalProps {
  settings: GameSettings;
  lang?: string | null;
  onUpdateSettings: (next: GameSettings) => void;
  onOpenLanguage?: () => void;
  onOpenTutorial?: () => void;
  onResetSave: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  lang,
  onUpdateSettings,
  onOpenLanguage,
  onOpenTutorial,
  onResetSave,
  onClose,
}) => {
  const [rebindingKey, setRebindingKey] = useState<keyof KeyBindings | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [confirmReset, setConfirmReset] = useState(false);

  const langDef = getLanguageDef(lang ?? settings.language);

  useEffect(() => {
    if (!rebindingKey) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.code === 'Escape') {
        setRebindingKey(null);
        return;
      }
      onUpdateSettings({
        ...settings,
        keyBindings: {
          ...settings.keyBindings,
          [rebindingKey]: e.code,
        },
      });
      setRebindingKey(null);
      audio.playSfx('menuClick');
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [rebindingKey, settings, onUpdateSettings]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const controlLabels: { key: keyof KeyBindings; label: string }[] = [
    { key: 'left', label: 'Left' },
    { key: 'right', label: 'Right' },
    { key: 'up', label: 'Up / Climb' },
    { key: 'down', label: 'Down' },
    { key: 'jump', label: 'Jump / Double Jump' },
    { key: 'sprint', label: 'Sprint / Dash' },
    { key: 'webAttack', label: 'Web Bolt Attack' },
    { key: 'special', label: 'Special Ability (C Swap)' },
    { key: 'interact', label: 'Spider House / Shrine (E)' },
    { key: 'webSwing', label: 'Toggle Web-Swing (Q)' },
    { key: 'webNet', label: '5-Way Web Burst' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="pixel-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <SettingsIcon className="w-5 h-5 text-sky-400" />
            <h2 className="font-pixel text-xl text-white">{tr(lang, 'settingsTitle')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tr(lang, 'close')}
            className="pixel-btn bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Audio Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Volume2 className="w-3.5 h-3.5 text-sky-400" /> {tr(lang, 'musicVolume')}
              </span>
              <span className="font-mono-num text-sky-400">
                {Math.round(settings.musicVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.musicVolume * 100)}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  musicVolume: Number(e.target.value) / 100,
                })
              }
              className="accent-sky-400"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" /> {tr(lang, 'sfxVolume')}
              </span>
              <span className="font-mono-num text-amber-400">
                {Math.round(settings.sfxVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.sfxVolume * 100)}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  sfxVolume: Number(e.target.value) / 100,
                })
              }
              className="accent-amber-400"
            />
          </label>
        </div>

        {/* Display, Graphics Quality, Touch, Language & Tutorial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 border-t border-slate-800 pt-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400">{tr(lang, 'graphicsQuality')}</span>
            <select
              value={settings.graphicsQuality ?? 'high'}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  graphicsQuality: e.target.value as GraphicsQuality,
                })
              }
              className="pixel-btn bg-slate-800 px-3 py-2 text-xs text-slate-100"
            >
              <option value="low">{tr(lang, 'qualityLow')}</option>
              <option value="medium">{tr(lang, 'qualityMedium')}</option>
              <option value="high">{tr(lang, 'qualityHigh')}</option>
              <option value="ultra">{tr(lang, 'qualityUltra')}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400">{tr(lang, 'resolutionScale')}</span>
            <select
              value={settings.resolutionScale}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  resolutionScale: e.target.value as ResolutionScale,
                })
              }
              className="pixel-btn bg-slate-800 px-3 py-2 text-xs text-slate-100"
            >
              <option value="auto">Auto Crisp</option>
              <option value="2x">2× (960×540)</option>
              <option value="3x">3× (1440×810)</option>
              <option value="native">1× (480×270)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400">{tr(lang, 'touchControls')}</span>
            <select
              value={settings.touchMode}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  touchMode: e.target.value as TouchMode,
                })
              }
              className="pixel-btn bg-slate-800 px-3 py-2 text-xs text-slate-100"
            >
              <option value="auto">Auto</option>
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-slate-400">{tr(lang, 'fullScreenBtn')}</span>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs text-slate-100 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              <span>{tr(lang, 'fullScreenBtn')}</span>
            </button>
          </div>
        </div>

        {/* Language Switcher + Tutorial Replay */}
        {(onOpenLanguage || onOpenTutorial) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-800 pt-4">
            {onOpenLanguage && (
              <button
                type="button"
                onClick={() => {
                  audio.playSfx('menuClick');
                  onClose();
                  onOpenLanguage();
                }}
                className="pixel-btn bg-slate-900 hover:bg-slate-800 border-sky-500/40 px-3.5 py-2.5 text-xs text-slate-100 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-400" />
                  <span>{tr(lang, 'langButton')}</span>
                </span>
                <span className="font-pixel text-[10px] text-sky-300">
                  {langDef.flag} {langDef.nativeName}
                </span>
              </button>
            )}
            {onOpenTutorial && (
              <button
                type="button"
                onClick={() => {
                  audio.playSfx('menuClick');
                  onClose();
                  onOpenTutorial();
                }}
                className="pixel-btn bg-cyan-950/70 hover:bg-cyan-900/70 border-cyan-400/50 px-3.5 py-2.5 text-xs text-cyan-100 flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-300" />
                  <span>{tr(lang, 'tutReplayFromMenu')}</span>
                </span>
                <ChevronRight className="w-4 h-4 text-cyan-300" />
              </button>
            )}
          </div>
        )}

        {/* Key Bindings */}
        <div className="border-t border-slate-800 pt-4 flex flex-col gap-2">
          <span className="font-pixel text-xs text-slate-300">{tr(lang, 'controlsRebind')}</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {controlLabels.map(({ key, label }) => {
              const listening = rebindingKey === key;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between bg-slate-900/80 border border-slate-800 px-3 py-2 text-xs"
                >
                  <span className="text-slate-300">{label}</span>
                  <button
                    type="button"
                    onClick={() => setRebindingKey(key)}
                    className={`pixel-btn px-2.5 py-1 font-mono-num text-[11px] cursor-pointer ${
                      listening
                        ? 'bg-sky-600 text-white border-sky-300'
                        : 'bg-slate-800 text-sky-300'
                    }`}
                  >
                    {listening ? '...' : formatKeyCode(settings.keyBindings[key])}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reset Save & Close */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between gap-3">
          {confirmReset ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-400">{tr(lang, 'confirmReset')}</span>
              <button
                type="button"
                onClick={() => {
                  onResetSave();
                  setConfirmReset(false);
                }}
                className="pixel-btn bg-rose-700 hover:bg-rose-600 px-3 py-1.5 text-xs text-white cursor-pointer"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="pixel-btn bg-slate-800 px-3 py-1.5 text-xs text-slate-300 cursor-pointer"
              >
                {tr(lang, 'cancel')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="pixel-btn bg-slate-900 hover:bg-rose-950/60 px-3 py-2 text-xs text-rose-400 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{tr(lang, 'resetSave')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="pixel-btn bg-sky-600 hover:bg-sky-500 px-5 py-2 font-pixel text-xs text-white cursor-pointer"
          >
            {tr(lang, 'save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AchievementsModal: React.FC<{
  saveData: SaveData;
  lang?: string | null;
  onClose: () => void;
}> = ({ saveData, lang, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
    <div className="pixel-panel w-full max-w-2xl max-h-[88vh] overflow-y-auto p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="font-pixel text-xl text-white">
            {tr(lang, 'achievements')} ({saveData.unlockedAchievements.length}/{ACHIEVEMENTS.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="pixel-btn bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((ach) => {
          const unlocked = saveData.unlockedAchievements.includes(ach.id);
          return (
            <div
              key={ach.id}
              className={`border p-3 flex items-start gap-3 ${
                unlocked
                  ? 'border-amber-500/50 bg-slate-900/90'
                  : 'border-slate-800 bg-slate-950/70 opacity-55'
              }`}
            >
              <Award
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  unlocked ? 'text-amber-400' : 'text-slate-600'
                }`}
              />
              <div>
                <div className="font-pixel text-xs text-white">{ach.title}</div>
                <p className="text-xs text-slate-400 mt-1">{ach.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export const CreditsModal: React.FC<{
  lang?: string | null;
  onClose: () => void;
}> = ({ lang, onClose }) => (
  <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
    <div className="pixel-panel w-full max-w-lg p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="font-pixel text-xl text-white">{tr(lang, 'credits')}</h2>
        <button
          type="button"
          onClick={onClose}
          className="pixel-btn bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-col gap-3 text-sm text-slate-300">
        <p className="font-pixel text-sky-400">SPIDER SPIKEY — WINTER & ZAI LIMITED EDITION</p>
        <p>
          5 worlds, 15 levels, adaptive E Spider House shelters, toggle Q web-swing physics, 27 Web Designs, Player XP Levels 1-100, and ZAI Limited Events!
        </p>
        <div className="border-t border-slate-800 pt-3 text-xs text-slate-400 flex flex-col gap-1.5">
          <span>Engine · 60Hz AABB + Raycasted Rope & Spider House Physics</span>
          <span>Graphics · 480×270 Pixel Canvas · 12 Live Seasons + Winter Wonderland</span>
          <span>Audio · Multi-channel Web Audio Chiptune Synthesizer</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="pixel-btn bg-sky-600 hover:bg-sky-500 px-5 py-2 font-pixel text-xs text-white self-end cursor-pointer"
      >
        {tr(lang, 'close')}
      </button>
    </div>
  </div>
);

export const PauseModal: React.FC<{
  stageName: string;
  lang?: string | null;
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onQuit: () => void;
}> = ({ stageName, lang, onResume, onRestart, onSettings, onQuit }) => (
  <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
    <div className="pixel-panel w-full max-w-sm p-6 flex flex-col gap-4 text-center">
      <div>
        <h2 className="font-pixel text-2xl text-white">{tr(lang, 'pauseTitle')}</h2>
        <p className="text-xs text-slate-400 mt-1">{stageName}</p>
      </div>
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onResume}
          className="pixel-btn bg-sky-600 hover:bg-sky-500 py-3 font-pixel text-xs text-white cursor-pointer"
        >
          {tr(lang, 'resume')}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2.5 font-pixel text-xs text-slate-100 cursor-pointer"
        >
          {tr(lang, 'restartStage')}
        </button>
        <button
          type="button"
          onClick={onSettings}
          className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2.5 font-pixel text-xs text-slate-100 cursor-pointer"
        >
          {tr(lang, 'settings')}
        </button>
        <button
          type="button"
          onClick={onQuit}
          className="pixel-btn bg-slate-900 hover:bg-rose-950/60 py-2.5 font-pixel text-xs text-rose-300 cursor-pointer"
        >
          {tr(lang, 'mainMenu')}
        </button>
      </div>
    </div>
  </div>
);

export const StageClearModal: React.FC<{
  summary: StageClearSummary;
  lang?: string | null;
  xpEarned?: number;
  onNextStage: () => void;
  onReplay: () => void;
  onWorldSelect: () => void;
}> = ({ summary, lang, xpEarned = 0, onNextStage, onReplay, onWorldSelect }) => {
  const nextStage = summary.nextStageId ? STAGE_MAP[summary.nextStageId] : null;
  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
      <div className="pixel-panel w-full max-w-md p-6 flex flex-col gap-5">
        <div className="text-center border-b border-slate-800 pb-3">
          <div className="font-pixel text-xs text-emerald-400">
            {tr(lang, 'stageClear')}
          </div>
          <h2 className="font-pixel text-2xl text-white mt-1">{summary.stageName}</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-3 flex items-center justify-between">
            <span className="text-slate-400">{tr(lang, 'spikeyCoins')}</span>
            <span className="font-mono-num font-bold text-amber-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> +{summary.coinsEarned}
            </span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 flex items-center justify-between">
            <span className="text-slate-400">XP</span>
            <span className="font-mono-num font-bold text-cyan-300">+{xpEarned} XP</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-3 flex items-center justify-between">
            <span className="text-slate-400">Time / Score</span>
            <span className="font-mono-num font-bold text-white">
              {summary.timeSec}s · +{summary.scoreEarned}
            </span>
          </div>
          {!summary.isBossStage && (
            <div className="bg-slate-900/80 border border-slate-800 p-3 flex items-center justify-between">
              <span className="text-slate-400">Crystals</span>
              <div className="flex items-center gap-1">
                {summary.crystalsCollected.map((got, idx) => (
                  <Gem
                    key={idx}
                    className={`w-4 h-4 ${
                      got ? 'text-purple-400 fill-purple-400' : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {summary.noDamageBonus && (
          <div className="text-center text-xs text-amber-300 font-pixel">
            NO DAMAGE BONUS +500!
          </div>
        )}

        {summary.newlyUnlockedAbility && (
          <div className="border border-sky-500/60 bg-sky-950/40 p-3">
            <div className="font-pixel text-xs text-sky-300">
              {ABILITY_META[summary.newlyUnlockedAbility].name.toUpperCase()}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {ABILITY_META[summary.newlyUnlockedAbility].description}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {nextStage && (
            <button
              type="button"
              onClick={onNextStage}
              className="pixel-btn bg-sky-600 hover:bg-sky-500 py-3 font-pixel text-xs text-white cursor-pointer"
            >
              {tr(lang, 'nextStage')}: {nextStage.id} · {nextStage.name}
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onReplay}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2.5 font-pixel text-[11px] text-slate-200 cursor-pointer"
            >
              {tr(lang, 'tryAgain')}
            </button>
            <button
              type="button"
              onClick={onWorldSelect}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2.5 font-pixel text-[11px] text-slate-200 cursor-pointer"
            >
              {tr(lang, 'worlds')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const GameOverModal: React.FC<{
  score: number;
  coins: number;
  lang?: string | null;
  onRetry: () => void;
  onWorldSelect: () => void;
  onMenu: () => void;
}> = ({ score, coins, lang, onRetry, onWorldSelect, onMenu }) => (
  <div className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-4">
    <div className="pixel-panel w-full max-w-sm p-6 flex flex-col gap-5 text-center border-rose-500/60">
      <div>
        <h2 className="font-pixel text-3xl text-rose-500">{tr(lang, 'gameOver')}</h2>
        <p className="text-xs text-slate-400 mt-1.5">
          Spikey barcha jonlarini yo‘qotdi, lekin Weboria sizga muhtoj!
        </p>
      </div>
      <div className="flex justify-center gap-6 text-xs font-mono-num">
        <span className="text-slate-300">Score: {score}</span>
        <span className="text-amber-400">Spikey Coins: +{coins}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onRetry}
          className="pixel-btn bg-rose-600 hover:bg-rose-500 py-3 font-pixel text-xs text-white cursor-pointer"
        >
          {tr(lang, 'tryAgain')}
        </button>
        <button
          type="button"
          onClick={onWorldSelect}
          className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2.5 font-pixel text-xs text-slate-200 cursor-pointer"
        >
          {tr(lang, 'worlds')}
        </button>
        <button
          type="button"
          onClick={onMenu}
          className="pixel-btn bg-slate-900 hover:bg-slate-800 py-2.5 font-pixel text-xs text-slate-400 cursor-pointer"
        >
          {tr(lang, 'mainMenu')}
        </button>
      </div>
    </div>
  </div>
);

export const CampaignVictoryScreen: React.FC<{
  saveData: SaveData;
  lang?: string | null;
  onPlayAgain: () => void;
  onWorldSelect: () => void;
  onMenu: () => void;
}> = ({ saveData, lang, onPlayAgain, onWorldSelect, onMenu }) => {
  const totalCrystals = Object.values(saveData.stageProgress).reduce(
    (acc, p) => acc + p.crystals.filter(Boolean).length,
    0
  );

  return (
    <div className="w-full h-full bg-[#080614] flex items-center justify-center p-6">
      <div className="pixel-panel w-full max-w-lg p-7 flex flex-col gap-5 text-center border-purple-500/70">
        <div className="flex flex-col items-center gap-2">
          <Trophy className="w-10 h-10 text-amber-400" />
          <div className="font-pixel text-xs text-purple-300">O‘RGIMCHAK KRISTALLI QUTQARILDI!</div>
          <h2 className="font-pixel text-3xl text-white">{tr(lang, 'victoryTitle')}</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Jasur Spikey Soya O‘rgimchak Qirolini mag‘lub etib, barcha besh dunyoga tinchlik olib keldi.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 p-3">
            <div className="text-slate-400">Score</div>
            <div className="font-mono-num font-bold text-white text-base mt-0.5">
              {saveData.totalScore}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3">
            <div className="text-slate-400">Crystals</div>
            <div className="font-mono-num font-bold text-purple-300 text-base mt-0.5">
              {totalCrystals}/30
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3">
            <div className="text-slate-400">{tr(lang, 'spikeyCoins')}</div>
            <div className="font-mono-num font-bold text-amber-400 text-base mt-0.5">
              {saveData.totalCoins.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onPlayAgain}
            className="pixel-btn bg-sky-600 hover:bg-sky-500 py-3 font-pixel text-xs text-white cursor-pointer"
          >
            {tr(lang, 'tryAgain')}
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onWorldSelect}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2.5 font-pixel text-xs text-slate-200 cursor-pointer"
            >
              {tr(lang, 'worlds')}
            </button>
            <button
              type="button"
              onClick={onMenu}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2.5 font-pixel text-xs text-slate-200 cursor-pointer"
            >
              {tr(lang, 'mainMenu')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TrialGateModal: React.FC<{
  summary: StageClearSummary | null;
  lang?: string | null;
  onConnectGmail: () => void;
  onReplay: () => void;
  onMenu: () => void;
}> = ({ summary, lang, onConnectGmail, onReplay, onMenu }) => (
  <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
    <div className="pixel-panel w-full max-w-md p-6 flex flex-col gap-5 border-amber-400/70 text-center">
      <div className="flex flex-col items-center gap-2 border-b border-slate-800 pb-4">
        <Mail className="w-8 h-8 text-sky-400" />
        <div className="font-pixel text-[11px] text-amber-300">
          FREE TRIAL (2/2 STAGES)
        </div>
        <h2 className="font-pixel text-xl sm:text-2xl text-white leading-snug">
          {tr(lang, 'trialGateHeading')}
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          {tr(lang, 'trialGateBody')}
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-slate-900/80 border border-slate-800 p-2.5">
            <div className="text-slate-400">Coins</div>
            <div className="font-mono-num font-bold text-amber-400">+{summary.coinsEarned}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2.5">
            <div className="text-slate-400">Score</div>
            <div className="font-mono-num font-bold text-white">+{summary.scoreEarned}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2.5">
            <div className="text-slate-400">Time</div>
            <div className="font-mono-num font-bold text-sky-300">{summary.timeSec}s</div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onConnectGmail}
          className="pixel-btn w-full bg-sky-600 hover:bg-sky-500 py-3.5 font-pixel text-xs text-white flex items-center justify-center gap-2 cursor-pointer"
        >
          <Mail className="w-4 h-4" />
          <span>CONNECT YOUR GMAIL</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onReplay}
            className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2.5 font-pixel text-[11px] text-slate-200 cursor-pointer"
          >
            1-2 REPLAY
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="pixel-btn bg-slate-900 hover:bg-slate-800 py-2.5 font-pixel text-[11px] text-slate-300 cursor-pointer"
          >
            {tr(lang, 'mainMenu')}
          </button>
        </div>
      </div>
    </div>
  </div>
);
