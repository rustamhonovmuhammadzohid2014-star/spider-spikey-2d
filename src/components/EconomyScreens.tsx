import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Award,
  Box,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  Crown,
  Eye,
  FastForward,
  Flame,
  Gift,
  HelpCircle,
  Lock,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Target,
  X,
  Zap,
} from 'lucide-react';
import { audio } from '../game/audio';
import { ALL_CASES, CASE_MAP, CaseDef, CaseSpinResult, getCasePoolItems } from '../game/cases';
import {
  ALL_MISSIONS,
  DAILY_REWARDS_30,
  DailyRewardDef,
  ECONOMY_ACHIEVEMENTS,
  SPECIAL_ITEMS_META,
  canSellSkin,
  canSellWebDesign,
  getEffectiveStreakStatus,
  getPlayerLevelProgress,
} from '../game/economy';
import { TranslationKey, tr } from '../game/i18n';
import {
  NpcTradeOffer,
  generateNpcTradeOffers,
} from '../game/localPersistence';
import {
  HOLIDAY_CALENDAR,
  LiveCalendarInfo,
  MAX_SEASON_LEVEL,
  buildSeasonPassLevels,
  getSeasonLevelFromXp,
  getSeasonLevelSkipCost,
  getXpForLevel,
} from '../game/seasons';
import {
  ALL_SKINS,
  RARITY_META,
  SKIN_CATEGORY_LABELS,
  SkinDef,
  getSkinById,
  getSkinMinLevel,
  skinMatchesCategory,
} from '../game/skins';
import {
  ACHIEVEMENTS,
  CaseType,
  EconomyData,
  LeaderboardEntry,
  Rarity,
  SaveData,
  SkinCategory,
  SpikeyAnimState,
} from '../game/types';
import {
  ALL_WEB_COLOR_IDS,
  ALL_WEB_DESIGNS,
  WEB_COLORS_META,
  WebColorId,
  WebDesignDef,
  getWebDesignById,
} from '../game/webDesigns';
import {
  ANNUAL_ZAI_EVENTS,
  getAnnualZaiEventStatus,
  getNextAnnualZaiEventStatus,
  isAnyZaiCollectionActiveNow,
  isZaiCaseAvailableNow,
  isZaiItemAvailableNow,
} from '../game/zaiCollection';
import { AvatarBadge } from './AvatarBadge';
import { SkinPreviewCanvas, WebDesignPreviewCanvas } from './SkinPreviewCanvas';

interface ScreenHeaderProps {
  titleUz: string;
  subtitleUz: string;
  spikeyCoins: number;
  isCreator?: boolean;
  calendar: LiveCalendarInfo;
  lang?: string | null;
  onBack: () => void;
  rightExtra?: React.ReactNode;
}

const ScreenShellHeader: React.FC<ScreenHeaderProps> = ({
  titleUz,
  subtitleUz,
  spikeyCoins,
  isCreator = false,
  calendar,
  lang,
  onBack,
  rightExtra,
}) => (
  <header className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          audio.playSfx('menuClick');
          onBack();
        }}
        className="pixel-btn bg-slate-800 hover:bg-slate-700 px-3 py-2 font-pixel text-xs text-slate-100 flex items-center gap-1.5 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{tr(lang, 'back')}</span>
      </button>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-pixel text-xl sm:text-2xl text-white">{titleUz}</h2>
          <span
            className="text-[10px] font-pixel px-2 py-0.5 border border-slate-700 bg-slate-900/90"
            style={{ color: calendar.season.accentColor }}
          >
            {calendar.bannerLine2}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{subtitleUz}</p>
      </div>
    </div>

    <div className="flex items-center gap-2.5 ml-auto">
      {rightExtra}
      <div
        className="pixel-panel px-3.5 py-2 border-amber-400/60 bg-slate-950/90 flex items-center gap-2"
        title={tr(lang, 'spikeyCoins')}
      >
        <Coins className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex flex-col leading-none">
          <span className="font-pixel text-[8px] text-amber-300/80">{tr(lang, 'spikeyCoins')}</span>
          <span className="font-mono-num text-sm font-bold text-amber-300">
            {isCreator ? '∞' : spikeyCoins.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  </header>
);

// Reusable Confirmation Modal for Selling Eligible Skins
const SellConfirmModal: React.FC<{
  skin: SkinDef;
  sellPrice: number;
  lang?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ skin, sellPrice, lang, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
    <div className="pixel-panel w-full max-w-sm p-6 border-amber-400/75 bg-slate-950 flex flex-col gap-4 text-center">
      <div className="font-pixel text-sm text-amber-300 leading-snug">
        {tr(lang, 'confirmSellTitle')}
      </div>
      <div className="flex flex-col items-center gap-2">
        <SkinPreviewCanvas skinId={skin.id} size="md" anim="idle" />
        <div className="font-pixel text-xs text-white">{skin.name}</div>
        <span className={`text-[10px] font-pixel px-2 py-0.5 ${RARITY_META[skin.rarity].badgeClass}`}>
          {tr(lang, `rarity_${skin.rarity}` as TranslationKey)}
        </span>
      </div>
      <div className="bg-slate-900/90 border border-slate-800 p-3 text-xs text-slate-300">
        {tr(lang, 'sell')}:{' '}
        <strong className="text-amber-400 font-mono-num">+{sellPrice.toLocaleString()} {tr(lang, 'spikeyCoins')}</strong>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => {
            audio.playSfx('menuClick');
            onCancel();
          }}
          className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2.5 font-pixel text-xs text-slate-200 cursor-pointer"
        >
          {tr(lang, 'cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="pixel-btn bg-amber-600 hover:bg-amber-500 py-2.5 font-pixel text-xs text-white cursor-pointer"
        >
          {tr(lang, 'confirmSellYes')}
        </button>
      </div>
    </div>
  </div>
);

function formatCountdownToMidnight(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const sec = Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatLevelSkipCost(cost: number): string {
  if (!Number.isFinite(cost) || cost <= 0) return '0';
  if (cost < 1_000_000_000) return cost.toLocaleString();
  if (cost < 1_000_000_000_000) return `${(cost / 1_000_000_000).toFixed(2)}B`;
  if (cost < 1e15) return `${(cost / 1e12).toFixed(2)}T`;
  return cost.toExponential(2);
}

// ===================================================
// 1. SEASON PASS (103 LEVELS · DUAL TRACK XP ONLY)
// ===================================================
export const SeasonPassScreen: React.FC<{
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  lang?: string | null;
  onClaimLevel: (level: number) => void;
  onClaimBonusLevel: (level: number) => void;
  onBuyNextLevel?: () => void;
  onBack: () => void;
}> = ({ economy, calendar, lang, onClaimLevel, onClaimBonusLevel, onBuyNextLevel, onBack }) => {
  const levels = useMemo(() => buildSeasonPassLevels(calendar.month), [calendar.month]);
  const curLevel = getSeasonLevelFromXp(economy.seasonXp);
  const curFloorXp = getXpForLevel(curLevel);
  const nextCeilXp = curLevel >= MAX_SEASON_LEVEL ? curFloorXp : getXpForLevel(curLevel + 1);
  const span = Math.max(1, nextCeilXp - curFloorXp);
  const pct =
    curLevel >= MAX_SEASON_LEVEL
      ? 100
      : Math.min(100, Math.round(((economy.seasonXp - curFloorXp) / span) * 100));
  const nextLevelCost = curLevel < MAX_SEASON_LEVEL ? getSeasonLevelSkipCost(curLevel) : 0;
  const canBuyNextLevel =
    Boolean(onBuyNextLevel) &&
    curLevel < MAX_SEASON_LEVEL &&
    (Boolean(economy.isCreator) || economy.spikeyCoins >= nextLevelCost);

  const nextUnclaimed = levels.find(
    (l) => l.level <= curLevel && !economy.claimedSeasonLevels.includes(l.level)
  );
  const claimedBonusList = economy.claimedBonusSeasonLevels ?? [];
  const nextBonusUnclaimed = levels.find(
    (l) => l.level <= curLevel && !claimedBonusList.includes(l.level)
  );
  const nextMilestone = levels.find((l) => l.level > curLevel) ?? levels[levels.length - 1];
  const featuredSkin = getSkinById(calendar.season.featuredSkinId);
  const mythicSkin = getSkinById(calendar.season.mythicSkinId);

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz={`${tr(lang, 'seasonPass')} — ${MAX_SEASON_LEVEL}`}
          subtitleUz={`${calendar.bannerLine1} · ${tr(lang, 'seasonPassXpOnlySub')}`}
          spikeyCoins={economy.spikeyCoins}
          isCreator={economy.isCreator}
          calendar={calendar}
          lang={lang}
          onBack={onBack}
        />

        {/* Hero Season Status & Featured Skins */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 pixel-panel p-5 flex flex-col justify-between gap-4 border-sky-400/50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-pixel text-xs" style={{ color: calendar.season.accentColor }}>
                  {calendar.bannerLine1}
                </div>
                <div className="font-pixel text-2xl text-white mt-1">
                  SEZON DARAJASI: {curLevel} / {MAX_SEASON_LEVEL}
                </div>
              </div>
              <div className="text-right font-mono-num text-xs">
                <div className="text-slate-400">Sezon XP</div>
                <div className="text-base font-bold text-sky-300">
                  {economy.seasonXp.toLocaleString()} XP
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono-num">
                <span>LVL {curLevel}</span>
                <span>
                  {curLevel >= MAX_SEASON_LEVEL
                    ? `${MAX_SEASON_LEVEL}/${MAX_SEASON_LEVEL} MAX`
                    : `${economy.seasonXp - curFloorXp} / ${span} XP → LVL ${curLevel + 1}`}
                </span>
              </div>
              <div className="h-4 w-full bg-slate-900 border border-slate-700 overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: calendar.season.accentColor,
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3">
              <div className="text-xs">
                <span className="text-slate-400">
                  {nextUnclaimed ? `${tr(lang, 'standardTrackLabel')}: ` : 'Next: '}
                </span>
                <strong className="text-amber-300">
                  {nextUnclaimed
                    ? `LVL ${nextUnclaimed.level} · ${nextUnclaimed.labelUz}`
                    : `LVL ${nextMilestone.level} · ${nextMilestone.labelUz}`}
                </strong>
              </div>
              <div className="flex flex-wrap gap-2">
                {nextUnclaimed && (
                  <button
                    type="button"
                    onClick={() => onClaimLevel(nextUnclaimed.level)}
                    className="pixel-btn bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 font-pixel text-[10px] text-white cursor-pointer"
                  >
                    {tr(lang, 'claimNow')} (LVL {nextUnclaimed.level})
                  </button>
                )}
                {nextBonusUnclaimed && (
                  <button
                    type="button"
                    onClick={() => onClaimBonusLevel(nextBonusUnclaimed.level)}
                    className="pixel-btn bg-amber-500 hover:bg-amber-400 border-amber-200 px-3.5 py-2 font-pixel text-[10px] text-slate-950 font-bold cursor-pointer"
                  >
                    {tr(lang, 'claimBonusBtn')} (LVL {nextBonusUnclaimed.level})
                  </button>
                )}
                {onBuyNextLevel && curLevel < MAX_SEASON_LEVEL && (
                  <button
                    type="button"
                    disabled={!canBuyNextLevel}
                    onClick={onBuyNextLevel}
                    className={`pixel-btn px-3.5 py-2 font-pixel text-[10px] flex items-center gap-1.5 ${
                      canBuyNextLevel
                        ? 'bg-sky-600 hover:bg-sky-500 border-sky-300 text-white cursor-pointer'
                        : 'bg-slate-900 border-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-300" />
                    <span>
                      {tr(lang, 'buySeasonTierBtn', {
                        coins: economy.isCreator ? '0' : formatLevelSkipCost(nextLevelCost),
                      })}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pixel-panel p-4 flex flex-col justify-between gap-3 border-rose-500/60">
            <div className="font-pixel text-xs text-amber-300 flex items-center gap-1.5">
              <Crown className="w-4 h-4" />
              <span>{tr(lang, 'seasonPass')} EXCLUSIVES</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-900/80 border border-slate-800 p-2 flex flex-col items-center text-center gap-1.5">
                <SkinPreviewCanvas skinId={featuredSkin.id} size="sm" />
                <div className="text-[10px] font-pixel text-sky-300">LVL 40</div>
                <div className="text-[11px] text-white font-medium truncate w-full">
                  {featuredSkin.name}
                </div>
              </div>
              <div className="bg-rose-950/35 border border-rose-500/60 p-2 flex flex-col items-center text-center gap-1.5">
                <SkinPreviewCanvas skinId={mythicSkin.id} size="sm" />
                <div className="text-[10px] font-pixel text-rose-400">LVL 103 MAX</div>
                <div className="text-[11px] text-white font-medium truncate w-full">
                  {mythicSkin.name}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">{tr(lang, 'seasonPassXpOnlySub')}</p>
          </div>
        </div>

        {/* 103-Level Dual Track Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {levels.map((lvl) => {
            const unlocked = curLevel >= lvl.level;
            const claimedStd = economy.claimedSeasonLevels.includes(lvl.level);
            const canClaimStd = unlocked && !claimedStd;
            const claimedBonus = claimedBonusList.includes(lvl.level);
            const canClaimBonus = unlocked && !claimedBonus;

            return (
              <div
                key={lvl.level}
                className={`pixel-panel p-3 flex flex-col justify-between gap-2.5 ${
                  lvl.level === MAX_SEASON_LEVEL || lvl.level === 50
                    ? 'border-rose-500 bg-rose-950/25'
                    : canClaimStd || canClaimBonus
                    ? 'border-emerald-400 bg-emerald-950/20'
                    : lvl.highlight
                    ? 'border-amber-500/60'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5">
                  <span className="font-pixel text-white">LVL {lvl.level}</span>
                  <span className="font-mono-num text-[10px] text-slate-400">
                    {lvl.xpRequiredCumulative} XP
                  </span>
                </div>

                {/* Standard Track Slot */}
                <div className="bg-slate-900/75 border border-slate-800 p-2 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[9px] font-pixel text-sky-300">
                    <span>{tr(lang, 'standardTrackLabel')}</span>
                    {claimedStd ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : !unlocked ? (
                      <Lock className="w-3 h-3 text-slate-500" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-amber-300" />
                    )}
                  </div>
                  <div className="flex items-center justify-center py-1">
                    {lvl.skinId ? (
                      <SkinPreviewCanvas skinId={lvl.skinId} size="sm" />
                    ) : lvl.rewardKind === 'coins' ? (
                      <Coins className="w-6 h-6 text-amber-400" />
                    ) : lvl.rewardKind === 'case' ? (
                      <Box className="w-6 h-6 text-purple-400" />
                    ) : (
                      <Gift className="w-6 h-6 text-sky-400" />
                    )}
                  </div>
                  <div className="text-[10px] font-medium text-center text-slate-200 leading-tight min-h-[26px] flex items-center justify-center">
                    {lvl.labelUz}
                  </div>
                  <button
                    type="button"
                    disabled={!canClaimStd}
                    onClick={() => onClaimLevel(lvl.level)}
                    className={`pixel-btn w-full py-1.5 font-pixel text-[9px] ${
                      canClaimStd
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                        : claimedStd
                        ? 'bg-slate-800 text-emerald-400 cursor-default'
                        : 'bg-slate-950 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {claimedStd ? tr(lang, 'claimedTag') : canClaimStd ? tr(lang, 'claimTag') : tr(lang, 'locked')}
                  </button>
                </div>

                {/* Bonus Track Slot (XP Only) */}
                <div className="bg-amber-950/20 border border-amber-500/40 p-2 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[9px] font-pixel text-amber-300">
                    <span>{tr(lang, 'bonusTrackLabel')}</span>
                    {claimedBonus ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : !unlocked ? (
                      <Lock className="w-3 h-3 text-slate-500" />
                    ) : (
                      <Crown className="w-3 h-3 text-amber-300" />
                    )}
                  </div>
                  <div className="flex items-center justify-center py-1">
                    {lvl.bonus.webDesignId ? (
                      <WebDesignPreviewCanvas webDesignId={lvl.bonus.webDesignId} size="sm" quality="high" />
                    ) : lvl.bonus.avatarId ? (
                      <AvatarBadge avatarId={lvl.bonus.avatarId} size="sm" />
                    ) : lvl.bonus.skinId ? (
                      <SkinPreviewCanvas skinId={lvl.bonus.skinId} size="sm" />
                    ) : lvl.bonus.rewardKind === 'case' ? (
                      <Box className="w-6 h-6 text-amber-300" />
                    ) : lvl.bonus.rewardKind === 'coins' ? (
                      <Coins className="w-6 h-6 text-amber-400" />
                    ) : (
                      <Award className="w-6 h-6 text-cyan-300" />
                    )}
                  </div>
                  <div className="text-[10px] font-medium text-center text-amber-100 leading-tight min-h-[26px] flex items-center justify-center">
                    {lvl.bonus.labelUz}
                  </div>
                  <button
                    type="button"
                    disabled={!canClaimBonus}
                    onClick={() => onClaimBonusLevel(lvl.level)}
                    className={`pixel-btn w-full py-1.5 font-pixel text-[9px] ${
                      canClaimBonus
                        ? 'bg-amber-500 hover:bg-amber-400 border-amber-200 text-slate-950 font-bold cursor-pointer'
                        : claimedBonus
                        ? 'bg-slate-800 text-emerald-400 cursor-default'
                        : 'bg-slate-950 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {claimedBonus
                      ? tr(lang, 'claimedTag')
                      : canClaimBonus
                      ? tr(lang, 'claimBonusBtn')
                      : tr(lang, 'locked')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ===================================================
// 2. DAILY LOGIN REWARDS (30 DAYS) SCREEN
// ===================================================
export const DailyRewardsScreen: React.FC<{
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  lang?: string | null;
  onClaimDaily: () => { ok: boolean; reward?: DailyRewardDef; errorUz?: string };
  onBack: () => void;
}> = ({ economy, calendar, lang, onClaimDaily, onBack }) => {
  const [countdown, setCountdown] = useState(formatCountdownToMidnight);
  const [claimedPopup, setClaimedPopup] = useState<DailyRewardDef | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setCountdown(formatCountdownToMidnight()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const status = getEffectiveStreakStatus(economy, calendar);
  const nextReward =
    DAILY_REWARDS_30.find((d) => d.day === status.nextDayNumber) ?? DAILY_REWARDS_30[0];

  const handleClaim = () => {
    const res = onClaimDaily();
    if (res.ok && res.reward) {
      setErrMsg(null);
      setClaimedPopup(res.reward);
    } else if (res.errorUz) {
      setErrMsg(res.errorUz);
    }
  };

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz={`${tr(lang, 'dailyRewards')} — 30`}
          subtitleUz="30-Day Streak Rewards · Mythic & Special Gifts"
          spikeyCoins={economy.spikeyCoins}
          isCreator={economy.isCreator}
          calendar={calendar}
          lang={lang}
          onBack={onBack}
        />

        {/* Streak & Claim Banner */}
        <div className="pixel-panel p-5 flex flex-wrap items-center justify-between gap-4 border-emerald-400/55">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-pixel">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>{tr(lang, 'streakDays', { days: status.effectiveStreak })}</span>
            </div>
            <div className="text-sm text-slate-200">
              {nextReward.day}: <strong className="text-amber-300">{nextReward.labelUz}</strong>
            </div>
            {status.missedReset && (
              <p className="text-xs text-rose-300">
                Streak reset to 0 after missed day (prior gifts preserved).
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-slate-400">
              <div className="flex items-center justify-end gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{tr(lang, 'dailyResetIn')}</span>
              </div>
              <div className="font-mono-num text-sm text-sky-300 font-bold">{countdown}</div>
            </div>
            <button
              type="button"
              disabled={!status.canClaimToday}
              onClick={handleClaim}
              className={`pixel-btn px-5 py-3 font-pixel text-xs flex items-center gap-2 ${
                status.canClaimToday
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>
                {status.canClaimToday
                  ? tr(lang, 'claimDayBtn', { day: status.nextDayNumber })
                  : tr(lang, 'claimedTodayBtn')}
              </span>
            </button>
          </div>
        </div>

        {errMsg && (
          <div className="border border-rose-500/60 bg-rose-950/50 px-4 py-2 text-xs text-rose-200">
            {errMsg}
          </div>
        )}

        {/* 30-Day Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {DAILY_REWARDS_30.map((d) => {
            const isClaimed =
              d.day <= status.effectiveStreak || economy.claimedDailyDays.includes(d.day);
            const isTodayTarget = status.canClaimToday && d.day === status.nextDayNumber;
            return (
              <div
                key={d.day}
                className={`pixel-panel p-3 flex flex-col items-center text-center gap-2 ${
                  d.milestone === 'day30'
                    ? 'border-rose-500 bg-rose-950/30'
                    : d.milestone
                    ? 'border-amber-400 bg-amber-950/25'
                    : isTodayTarget
                    ? 'border-emerald-400 bg-emerald-950/30'
                    : isClaimed
                    ? 'border-slate-700 opacity-75'
                    : 'border-slate-800'
                }`}
              >
                <div className="w-full flex items-center justify-between text-[10px] font-pixel">
                  <span className={d.milestone ? 'text-amber-300' : 'text-slate-300'}>
                    {d.day}-KUN
                  </span>
                  {isClaimed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isTodayTarget ? (
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300 animate-spin" />
                  ) : null}
                </div>

                {d.skinId ? (
                  <SkinPreviewCanvas skinId={d.skinId} size="sm" />
                ) : d.kind === 'mythicBundle' ? (
                  <div className="w-14 h-12 bg-rose-950/70 border border-rose-500 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-rose-400" />
                  </div>
                ) : d.kind === 'case' ? (
                  <div className="w-14 h-12 bg-slate-900 border border-slate-700 flex items-center justify-center">
                    <Box
                      className="w-6 h-6"
                      style={{ color: CASE_MAP[d.caseType ?? 'common'].color }}
                    />
                  </div>
                ) : (
                  <div className="w-14 h-12 bg-slate-900 border border-slate-700 flex items-center justify-center">
                    <Coins className="w-6 h-6 text-amber-400" />
                  </div>
                )}

                <div className="text-[11px] font-medium text-slate-100 leading-tight min-h-[28px] flex items-center justify-center">
                  {d.labelUz}
                </div>

                {d.milestone && (
                  <span className="text-[9px] font-pixel text-amber-300">
                    {d.milestone === 'day30'
                      ? 'MIFIK MUKOFOT'
                      : d.milestone === 'day20'
                      ? 'KATTA SOVG‘A'
                      : 'MAXSUS SOVG‘A'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Animated Reward Claim Popup */}
      {claimedPopup && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="pixel-panel w-full max-w-sm p-6 border-emerald-400 bg-slate-950 text-center flex flex-col items-center gap-4">
            <Sparkles className="w-10 h-10 text-amber-400 animate-bounce" />
            <div className="font-pixel text-xs text-emerald-300">
              {claimedPopup.day}-KUN SOVG‘ASI OLINDI!
            </div>
            {claimedPopup.skinId && (
              <SkinPreviewCanvas skinId={claimedPopup.skinId} size="lg" anim="victory" />
            )}
            <div className="font-pixel text-lg text-white">{claimedPopup.labelUz}</div>
            {claimedPopup.xpBonus && (
              <div className="text-xs text-sky-300 font-mono-num">
                +{claimedPopup.xpBonus} Sezon XP qo‘shildi!
              </div>
            )}
            <button
              type="button"
              onClick={() => setClaimedPopup(null)}
              className="pixel-btn w-full bg-emerald-600 hover:bg-emerald-500 py-2.5 font-pixel text-xs text-white cursor-pointer"
            >
              {tr(lang, 'awesomeBtn')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================================================
// 3. PREMIUM MARKETPLACE: FEATURED, SKINS, 27 WEBS, CASES, LIMITED, ZAI, SEASONAL
// ===================================================
export type MarketSectionTab =
  | 'featured'
  | 'skins'
  | 'webs'
  | 'cases'
  | 'limited'
  | 'zai'
  | 'seasonal'
  | 'schedule';

export const MarketplaceScreen: React.FC<{
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  effectiveNow?: Date;
  lang?: string | null;
  initialTab?: MarketSectionTab;
  onBuySkin: (skinId: string) => void;
  onEquipSkin: (skinId: string) => void;
  onSellSkin: (skinId: string) => void;
  onBuyWebDesign: (webId: string) => void;
  onEquipWebDesign: (webId: string) => void;
  onSellWebDesign: (webId: string) => void;
  onBuyCase?: (caseType: CaseType) => void;
  onOpenEventsScreen?: () => void;
  onBack: () => void;
}> = ({
  economy,
  calendar,
  effectiveNow = new Date(),
  lang,
  initialTab = 'featured',
  onBuySkin,
  onEquipSkin,
  onSellSkin,
  onBuyWebDesign,
  onEquipWebDesign,
  onSellWebDesign,
  onBuyCase,
  onOpenEventsScreen,
  onBack,
}) => {
  const [marketTab, setMarketTab] = useState<MarketSectionTab>(initialTab);
  const [category, setCategory] = useState<SkinCategory>('all');
  const [rarityFilter, setRarityFilter] = useState<'all' | Rarity>('all');
  const [webColorFilter, setWebColorFilter] = useState<'all' | WebColorId>('all');
  const [webRarityFilter, setWebRarityFilter] = useState<'all' | Rarity>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rarity' | 'price_asc' | 'price_desc' | 'level' | 'newest'>('rarity');
  const [sellTarget, setSellTarget] = useState<SkinDef | null>(null);
  const [sellWebTarget, setSellWebTarget] = useState<WebDesignDef | null>(null);
  const [previewPose, setPreviewPose] = useState<SpikeyAnimState>('idle');
  const [previewTarget, setPreviewTarget] = useState<
    | { kind: 'skin'; item: SkinDef }
    | { kind: 'web'; item: WebDesignDef }
    | null
  >(null);
  const [confirmBuy, setConfirmBuy] = useState<
    | { kind: 'skin'; item: SkinDef }
    | { kind: 'web'; item: WebDesignDef }
    | { kind: 'case'; item: CaseDef }
    | null
  >(null);

  useEffect(() => {
    setMarketTab(initialTab);
  }, [initialTab]);

  const playerLvl = getPlayerLevelProgress(economy.playerXp ?? 0).level;
  const queryNorm = searchQuery.trim().toLowerCase();

  const categories: SkinCategory[] = [
    'all',
    'web',
    'neon',
    'fire',
    'ice',
    'shadow',
    'legendary',
    'mythic',
    'seasonal',
    'zai',
    'limited',
  ];

  const raritiesList: ('all' | Rarity)[] = [
    'all',
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
    'mythic',
    'limited',
  ];

  const sortSkinsList = useMemo(
    () => (list: SkinDef[]) => {
      const copy = [...list];
      copy.sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'level') return getSkinMinLevel(a) - getSkinMinLevel(b);
        if (sortBy === 'newest') return (b.isZaiLimited ? 1 : 0) - (a.isZaiLimited ? 1 : 0);
        return RARITY_META[b.rarity].rank - RARITY_META[a.rarity].rank;
      });
      return copy;
    },
    [sortBy]
  );

  const sortWebsList = useMemo(
    () => (list: WebDesignDef[]) => {
      const copy = [...list];
      copy.sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'level') return a.minPlayerLevel - b.minPlayerLevel;
        if (sortBy === 'newest') return (b.isZaiLimited ? 1 : 0) - (a.isZaiLimited ? 1 : 0);
        return RARITY_META[b.rarity].rank - RARITY_META[a.rarity].rank;
      });
      return copy;
    },
    [sortBy]
  );

  const zaiCollectionOpen = isAnyZaiCollectionActiveNow(effectiveNow);
  const nextZaiStatus = useMemo(
    () => getNextAnnualZaiEventStatus(effectiveNow),
    [effectiveNow]
  );

  const visibleSkins = useMemo(() => {
    const filtered = ALL_SKINS.filter((s) => {
      if (s.isZaiLimited && !isZaiItemAvailableNow(s, effectiveNow)) return false;
      if (!skinMatchesCategory(s, category)) return false;
      if (rarityFilter !== 'all' && s.rarity !== rarityFilter) return false;
      if (queryNorm && !`${s.name} ${s.descriptionUz} ${s.rarity}`.toLowerCase().includes(queryNorm)) {
        return false;
      }
      return true;
    });
    return sortSkinsList(filtered);
  }, [category, rarityFilter, queryNorm, sortSkinsList, effectiveNow]);

  const limitedSkins = useMemo(
    () =>
      sortSkinsList(
        ALL_SKINS.filter(
          (s) =>
            (!s.isZaiLimited || isZaiItemAvailableNow(s, effectiveNow)) &&
            (s.rarity === 'limited' || s.rarity === 'legendary' || s.rarity === 'mythic' || s.isZaiLimited) &&
            (!queryNorm || `${s.name} ${s.descriptionUz}`.toLowerCase().includes(queryNorm))
        )
      ),
    [queryNorm, sortSkinsList, effectiveNow]
  );

  const seasonalSkins = useMemo(
    () =>
      sortSkinsList(
        ALL_SKINS.filter(
          (s) =>
            (!s.isZaiLimited || isZaiItemAvailableNow(s, effectiveNow)) &&
            (s.category === 'seasonal' || s.isZaiLimited) &&
            (!queryNorm || `${s.name} ${s.descriptionUz}`.toLowerCase().includes(queryNorm))
        )
      ),
    [queryNorm, sortSkinsList, effectiveNow]
  );

  const visibleWebs = useMemo(() => {
    const filtered = ALL_WEB_DESIGNS.filter(
      (w) =>
        (!w.isZaiLimited || isZaiItemAvailableNow(w, effectiveNow)) &&
        (webColorFilter === 'all' || w.colorId === webColorFilter) &&
        (webRarityFilter === 'all' || w.rarity === webRarityFilter) &&
        (!queryNorm || `${w.name} ${w.descriptionUz} ${w.rarity}`.toLowerCase().includes(queryNorm))
    );
    return sortWebsList(filtered);
  }, [webColorFilter, webRarityFilter, queryNorm, sortWebsList, effectiveNow]);

  const zaiSkins = useMemo(
    () =>
      sortSkinsList(
        ALL_SKINS.filter(
          (s) =>
            s.isZaiLimited &&
            isZaiItemAvailableNow(s, effectiveNow) &&
            (!queryNorm || `${s.name} ${s.descriptionUz}`.toLowerCase().includes(queryNorm))
        )
      ),
    [queryNorm, sortSkinsList, effectiveNow]
  );
  const zaiWebs = useMemo(
    () =>
      sortWebsList(
        ALL_WEB_DESIGNS.filter(
          (w) =>
            w.isZaiLimited &&
            isZaiItemAvailableNow(w, effectiveNow) &&
            (!queryNorm || `${w.name} ${w.descriptionUz}`.toLowerCase().includes(queryNorm))
        )
      ),
    [queryNorm, sortWebsList, effectiveNow]
  );

  const visibleCases = useMemo(
    () =>
      ALL_CASES.filter(
        (c) =>
          (!c.isZaiLimited || isZaiCaseAvailableNow(c, effectiveNow)) &&
          (!queryNorm || `${c.nameEn} ${c.descriptionUz}`.toLowerCase().includes(queryNorm))
      ),
    [queryNorm, effectiveNow]
  );

  const featuredSkin = getSkinById(calendar.season.featuredSkinId);
  const spotlightWeb =
    ALL_WEB_DESIGNS.find((w) => w.isZaiLimited && isZaiItemAvailableNow(w, effectiveNow)) ??
    ALL_WEB_DESIGNS.find((w) => !w.isZaiLimited && w.marketPurchasable && w.rarity === 'epic') ??
    ALL_WEB_DESIGNS[1];

  const renderSkinCard = (skin: SkinDef) => {
    const qty = economy.ownedSkins[skin.id] ?? 0;
    const owned = qty > 0;
    const equipped = economy.equippedSkin === skin.id;
    const rarity = RARITY_META[skin.rarity];
    const sellCheck = canSellSkin(economy, skin.id);
    const reqLvl = getSkinMinLevel(skin);
    const levelOk = playerLvl >= reqLvl;
    const eventOpen = !skin.isZaiLimited || isZaiItemAvailableNow(skin, effectiveNow);
    const canAfford = Boolean(economy.isCreator) || economy.spikeyCoins >= skin.price;
    const canBuyNow = skin.marketPurchasable && levelOk && eventOpen && canAfford;

    return (
      <div
        key={skin.id}
        className={`pixel-panel p-4 flex flex-col justify-between gap-3 transition-transform hover:-translate-y-0.5 ${rarity.borderClass} ${rarity.bgClass}`}
      >
        <div className="flex items-start gap-3">
          <SkinPreviewCanvas skinId={skin.id} size="md" anim={equipped ? 'victory' : 'walk'} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <span className={`text-[9px] font-pixel px-1.5 py-0.5 ${rarity.badgeClass}`}>
                {rarity.labelUz}
              </span>
              <span
                className={`text-[9px] font-pixel px-1.5 py-0.5 border ${
                  levelOk
                    ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30'
                    : 'border-rose-500/50 text-rose-300 bg-rose-950/40'
                }`}
              >
                LVL {reqLvl}
              </span>
              {owned && (
                <span className="font-mono-num text-[11px] text-emerald-300 font-bold">×{qty}</span>
              )}
            </div>
            <h3 className="font-pixel text-sm text-white mt-1.5 truncate">{skin.name}</h3>
            <p className="text-xs text-slate-300 mt-1 line-clamp-2">{skin.descriptionUz}</p>
            {skin.releaseDateLabel && (
              <div className="text-[10px] font-pixel text-amber-300 mt-1">
                {tr(lang, 'releaseDate')}: {skin.releaseDateLabel}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
          {skin.marketPurchasable ? (
            <div className="flex items-center gap-1 font-mono-num text-xs font-bold text-amber-300">
              <Coins className="w-3.5 h-3.5" />
              <span>{skin.price.toLocaleString()}</span>
            </div>
          ) : (
            <span className="text-[10px] font-pixel text-purple-300">{tr(lang, 'seasonDropTag')}</span>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                setPreviewPose('idle');
                setPreviewTarget({ kind: 'skin', item: skin });
              }}
              title={tr(lang, 'preview')}
              className="pixel-btn min-h-[34px] bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-200 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {owned && (
              <button
                type="button"
                disabled={equipped}
                onClick={() => onEquipSkin(skin.id)}
                className={`pixel-btn min-h-[34px] px-2.5 py-1.5 font-pixel text-[10px] ${
                  equipped
                    ? 'bg-emerald-700 text-white cursor-default'
                    : 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer'
                }`}
              >
                {equipped ? tr(lang, 'equipped') : tr(lang, 'equip')}
              </button>
            )}

            {skin.marketPurchasable && (
              <button
                type="button"
                disabled={!canBuyNow}
                onClick={() => {
                  audio.playSfx('menuClick');
                  setConfirmBuy({ kind: 'skin', item: skin });
                }}
                className={`pixel-btn min-h-[34px] px-2.5 py-1.5 font-pixel text-[10px] flex items-center gap-1 ${
                  canBuyNow
                    ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                    : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                }`}
              >
                {!eventOpen || !levelOk ? <Lock className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                <span>
                  {!eventOpen
                    ? tr(lang, 'eventClosed')
                    : !levelOk
                    ? `LVL ${reqLvl}`
                    : owned
                    ? '+1'
                    : tr(lang, 'buy')}
                </span>
              </button>
            )}

            {owned && sellCheck.eligible && (
              <button
                type="button"
                onClick={() => {
                  audio.playSfx('menuClick');
                  setSellTarget(skin);
                }}
                className="pixel-btn min-h-[34px] bg-rose-900/80 hover:bg-rose-800 px-2.5 py-1.5 font-pixel text-[10px] text-rose-100 cursor-pointer"
              >
                {tr(lang, 'sell')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz={tr(lang, 'market')}
          subtitleUz={`${tr(lang, 'playerLevel', { level: playerLvl })} · ${ALL_SKINS.length} ${tr(lang, 'tabSkins')} · ${ALL_WEB_DESIGNS.length} ${tr(lang, 'tabWebDesigns')}`}
          spikeyCoins={economy.spikeyCoins}
          isCreator={economy.isCreator}
          calendar={calendar}
          lang={lang}
          onBack={onBack}
        />

        {/* Featured Hero Spotlight Banner */}
        <div className="pixel-panel border-amber-400/75 bg-gradient-to-r from-[#09182e] via-[#13112b] to-[#230b19] p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <SkinPreviewCanvas skinId={featuredSkin.id} size="lg" anim="victory" />
            <WebDesignPreviewCanvas webDesignId={spotlightWeb.id} size="md" quality="ultra" />
            <div className="space-y-1">
              <div className="font-pixel text-[10px] text-amber-300 tracking-wider">
                {tr(lang, 'marketHeroTag')} · {calendar.bannerLine1}
              </div>
              <h3 className="font-pixel text-base sm:text-lg text-white">
                {featuredSkin.name} &amp; {spotlightWeb.name}
              </h3>
              <p className="text-xs text-slate-300 max-w-lg line-clamp-2">
                {featuredSkin.descriptionUz}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                setPreviewPose('victory');
                setPreviewTarget({ kind: 'skin', item: featuredSkin });
              }}
              className="pixel-btn min-h-[40px] px-4 py-2 bg-sky-600 hover:bg-sky-500 border-sky-300 text-white font-pixel text-[10px] cursor-pointer"
            >
              {tr(lang, 'preview')}
            </button>
            <button
              type="button"
              onClick={() => setMarketTab('zai')}
              className="pixel-btn min-h-[40px] px-4 py-2 bg-amber-500 hover:bg-amber-400 border-amber-200 text-slate-950 font-pixel text-[10px] font-bold cursor-pointer"
            >
              {tr(lang, 'tabZaiLimited')}
            </button>
          </div>
        </div>

        {/* 7+ Premium Market Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {(
            [
              { id: 'featured', label: tr(lang, 'tabFeatured') },
              { id: 'skins', label: tr(lang, 'tabSkins') },
              { id: 'webs', label: `${tr(lang, 'tabWebDesigns')} (${ALL_WEB_DESIGNS.length})` },
              { id: 'cases', label: tr(lang, 'tabCases') },
              { id: 'limited', label: tr(lang, 'tabLimited') },
              { id: 'zai', label: tr(lang, 'tabZaiLimited') },
              { id: 'seasonal', label: tr(lang, 'tabSeasonal') },
              { id: 'schedule', label: tr(lang, 'tabEventSchedule') },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                setMarketTab(tab.id);
              }}
              className={`pixel-btn min-h-[40px] px-3.5 py-2 font-pixel text-[10px] sm:text-xs cursor-pointer ${
                marketTab === tab.id
                  ? tab.id === 'zai'
                    ? 'bg-amber-500 border-amber-200 text-slate-950 font-bold'
                    : 'bg-sky-600 border-sky-300 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls (shown on catalog tabs) */}
        {marketTab !== 'schedule' && (
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-950/75 border border-slate-800 p-3">
            <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 min-h-[42px]">
              <Search className="w-4 h-4 text-sky-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr(lang, 'marketSearchPlaceholder')}
                className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="pixel-btn min-h-[42px] bg-slate-900 border-slate-700 px-3 py-2 text-xs text-slate-100 cursor-pointer"
            >
              <option value="rarity">{tr(lang, 'sortRarityLabel')}</option>
              <option value="price_asc">{tr(lang, 'sortPriceAsc')}</option>
              <option value="price_desc">{tr(lang, 'sortPriceDesc')}</option>
              <option value="level">{tr(lang, 'sortLevelLabel')}</option>
              <option value="newest">{tr(lang, 'sortNewestLabel')}</option>
            </select>
          </div>
        )}

        {/* TAB 0: FEATURED CURATED GRID */}
        {marketTab === 'featured' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-pixel text-xs text-sky-300 mb-3">
                {tr(lang, 'tabSkins')} · {tr(lang, 'marketHeroTag')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortSkinsList(
                  ALL_SKINS.filter(
                    (s) =>
                      s.marketPurchasable &&
                      (!s.isZaiLimited || isZaiItemAvailableNow(s, effectiveNow)) &&
                      (s.rarity === 'epic' || s.rarity === 'legendary' || s.isZaiLimited)
                  ).slice(0, 6)
                ).map(renderSkinCard)}
              </div>
            </div>
            <div>
              <h3 className="font-pixel text-xs text-cyan-300 mb-3">
                {tr(lang, 'tabWebDesigns')} · {tr(lang, 'marketHeroTag')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortWebsList(
                  ALL_WEB_DESIGNS.filter(
                    (w) => w.marketPurchasable && (!w.isZaiLimited || isZaiItemAvailableNow(w, effectiveNow))
                  ).slice(0, 6)
                ).map((web) => {
                  const qty = economy.ownedWebDesigns?.[web.id] ?? 0;
                  const owned = qty > 0;
                  const equipped = (economy.equippedWebDesign ?? 'classic_white') === web.id;
                  const rarity = RARITY_META[web.rarity];
                  const levelOk = playerLvl >= web.minPlayerLevel;
                  const eventOpen = !web.isZaiLimited || isZaiItemAvailableNow(web, effectiveNow);
                  const canBuyNow =
                    web.marketPurchasable &&
                    levelOk &&
                    eventOpen &&
                    (Boolean(economy.isCreator) || economy.spikeyCoins >= web.price);
                  return (
                    <div key={web.id} className={`pixel-panel p-4 flex flex-col justify-between gap-3 ${rarity.borderClass} ${rarity.bgClass}`}>
                      <div className="flex items-start gap-3">
                        <WebDesignPreviewCanvas webDesignId={web.id} size="md" quality="high" />
                        <div className="flex-1 min-w-0">
                          <span className={`text-[9px] font-pixel px-1.5 py-0.5 ${rarity.badgeClass}`}>
                            {rarity.labelUz}
                          </span>
                          <h4 className="font-pixel text-xs text-white mt-1.5 truncate">{web.name}</h4>
                          <p className="text-xs text-slate-300 mt-1 line-clamp-2">{web.descriptionUz}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                        <span className="font-mono-num text-xs font-bold text-amber-300 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" /> {web.price.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewTarget({ kind: 'web', item: web })}
                            className="pixel-btn bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-200 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {owned && (
                            <button
                              type="button"
                              disabled={equipped}
                              onClick={() => onEquipWebDesign(web.id)}
                              className={`pixel-btn px-2.5 py-1.5 font-pixel text-[10px] ${
                                equipped ? 'bg-emerald-700 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
                              }`}
                            >
                              {equipped ? tr(lang, 'equipped') : tr(lang, 'equip')}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={!canBuyNow}
                            onClick={() => setConfirmBuy({ kind: 'web', item: web })}
                            className={`pixel-btn px-2.5 py-1.5 font-pixel text-[10px] ${
                              canBuyNow ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer' : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {!eventOpen ? tr(lang, 'eventClosed') : !levelOk ? `LVL ${web.minPlayerLevel}` : tr(lang, 'buy')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: SKINS */}
        {marketTab === 'skins' && (
          <>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    audio.playSfx('menuClick');
                    setCategory(cat);
                  }}
                  className={`pixel-btn px-3 py-1.5 font-pixel text-[10px] cursor-pointer ${
                    category === cat
                      ? 'bg-sky-600 text-white border-sky-300'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {SKIN_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {raritiesList.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRarityFilter(r)}
                  className={`pixel-btn px-2.5 py-1 font-pixel text-[9px] cursor-pointer ${
                    rarityFilter === r ? 'bg-purple-700 border-purple-300 text-white' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {r === 'all' ? tr(lang, 'allRarities') : tr(lang, `rarity_${r}`)}
                </button>
              ))}
            </div>

            {category === 'zai' && !zaiCollectionOpen ? (
              <div className="pixel-panel border-amber-400/60 bg-slate-950/90 p-6 flex flex-col items-center text-center gap-3">
                <Lock className="w-8 h-8 text-amber-400" />
                <div className="font-pixel text-sm text-amber-300">{tr(lang, 'zaiVaultLockedTitle')}</div>
                <p className="text-xs text-slate-300 max-w-xl">{tr(lang, 'zaiVaultLockedDesc')}</p>
                <div className="font-mono-num text-xs text-rose-300 font-bold">
                  {tr(lang, 'zaiNextDropLabel')}: {nextZaiStatus.event.dateLabel} · {nextZaiStatus.countdownText}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleSkins.map(renderSkinCard)}
              </div>
            )}
          </>
        )}

        {/* TAB 2: WEB DESIGNS (27 CUSTOM SILK PATTERNS) */}
        {marketTab === 'webs' && (
          <>
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setWebColorFilter('all')}
                  className={`pixel-btn px-2.5 py-1 font-pixel text-[9px] cursor-pointer ${
                    webColorFilter === 'all' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-300'
                  }`}
                >
                  {tr(lang, 'allColors')}
                </button>
                {ALL_WEB_COLOR_IDS.map((cid) => {
                  const meta = WEB_COLORS_META[cid];
                  return (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => {
                        audio.playSfx('menuClick');
                        setWebColorFilter(cid);
                      }}
                      className={`pixel-btn px-2.5 py-1 font-pixel text-[9px] flex items-center gap-1.5 cursor-pointer ${
                        webColorFilter === cid
                          ? 'bg-cyan-700 border-cyan-300 text-white'
                          : 'bg-slate-900 text-slate-300'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 inline-block border border-white/40"
                        style={{ backgroundColor: meta.swatchHex }}
                      />
                      <span>{meta.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {raritiesList.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setWebRarityFilter(r)}
                    className={`pixel-btn px-2.5 py-1 font-pixel text-[9px] cursor-pointer ${
                      webRarityFilter === r
                        ? 'bg-purple-700 border-purple-300 text-white'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {r === 'all' ? tr(lang, 'allRarities') : tr(lang, `rarity_${r}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleWebs.map((web) => {
                const qty = economy.ownedWebDesigns?.[web.id] ?? 0;
                const owned = qty > 0;
                const equipped = (economy.equippedWebDesign ?? 'classic_white') === web.id;
                const rarity = RARITY_META[web.rarity];
                const sellCheck = canSellWebDesign(economy, web.id);
                const levelOk = playerLvl >= web.minPlayerLevel;
                const eventOpen = !web.isZaiLimited || isZaiItemAvailableNow(web, effectiveNow);
                const canAfford = Boolean(economy.isCreator) || economy.spikeyCoins >= web.price;
                const canBuyNow = web.marketPurchasable && levelOk && eventOpen && canAfford;

                return (
                  <div
                    key={web.id}
                    className={`pixel-panel p-4 flex flex-col justify-between gap-3 ${rarity.borderClass} ${rarity.bgClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <WebDesignPreviewCanvas webDesignId={web.id} size="md" quality="high" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <span className={`text-[9px] font-pixel px-1.5 py-0.5 ${rarity.badgeClass}`}>
                            {rarity.labelUz}
                          </span>
                          <span
                            className={`text-[9px] font-pixel px-1.5 py-0.5 border ${
                              levelOk
                                ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30'
                                : 'border-rose-500/50 text-rose-300 bg-rose-950/40'
                            }`}
                          >
                            LVL {web.minPlayerLevel}
                          </span>
                          {owned && (
                            <span className="font-mono-num text-[11px] text-emerald-300 font-bold">
                              ×{qty}
                            </span>
                          )}
                        </div>
                        <h3 className="font-pixel text-sm text-white mt-1.5 truncate">{web.name}</h3>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">{web.descriptionUz}</p>
                        {web.releaseDateLabel && (
                          <div className="text-[10px] font-pixel text-amber-300 mt-1">
                            {tr(lang, 'releaseDate')}: {web.releaseDateLabel}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      {web.marketPurchasable ? (
                        <div className="flex items-center gap-1 font-mono-num text-xs font-bold text-amber-300">
                          <Coins className="w-3.5 h-3.5" />
                          <span>{web.price.toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-pixel text-cyan-300">{tr(lang, 'starterSilkTag')}</span>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSfx('menuClick');
                            setPreviewTarget({ kind: 'web', item: web });
                          }}
                          title={tr(lang, 'preview')}
                          className="pixel-btn bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-200 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {owned && (
                          <button
                            type="button"
                            disabled={equipped}
                            onClick={() => onEquipWebDesign(web.id)}
                            className={`pixel-btn px-2.5 py-1.5 font-pixel text-[10px] ${
                              equipped
                                ? 'bg-emerald-700 text-white cursor-default'
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
                            }`}
                          >
                            {equipped ? tr(lang, 'equipped') : tr(lang, 'equip')}
                          </button>
                        )}

                        {web.marketPurchasable && (
                          <button
                            type="button"
                            disabled={!canBuyNow}
                            onClick={() => {
                              audio.playSfx('menuClick');
                              setConfirmBuy({ kind: 'web', item: web });
                            }}
                            className={`pixel-btn px-2.5 py-1.5 font-pixel text-[10px] flex items-center gap-1 ${
                              canBuyNow
                                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                                : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {!eventOpen || !levelOk ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <ShoppingBag className="w-3 h-3" />
                            )}
                            <span>
                              {!eventOpen
                                ? tr(lang, 'eventClosed')
                                : !levelOk
                                ? `LVL ${web.minPlayerLevel}`
                                : owned
                                ? '+1'
                                : tr(lang, 'buy')}
                            </span>
                          </button>
                        )}

                        {owned && sellCheck.eligible && (
                          <button
                            type="button"
                            onClick={() => {
                              audio.playSfx('menuClick');
                              setSellWebTarget(web);
                            }}
                            className="pixel-btn bg-rose-900/80 hover:bg-rose-800 px-2.5 py-1.5 font-pixel text-[10px] text-rose-100 cursor-pointer"
                          >
                            {tr(lang, 'sell')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* TAB 3: CASES DIRECT SHOP */}
        {marketTab === 'cases' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleCases.map((c) => {
              const ownedCount = economy.ownedCases[c.type] ?? 0;
              const reqLvl = c.minPlayerLevel ?? 1;
              const levelOk = playerLvl >= reqLvl;
              const eventOpen = !c.isZaiLimited || isZaiCaseAvailableNow(c, effectiveNow);
              const canBuy = levelOk && eventOpen && (Boolean(economy.isCreator) || economy.spikeyCoins >= c.price);
              return (
                <div key={c.type} className={`pixel-panel p-4 flex flex-col justify-between gap-3 ${c.badgeClass}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 border-2 flex items-center justify-center bg-slate-950/90" style={{ borderColor: c.color }}>
                        <Box className="w-6 h-6" style={{ color: c.color }} />
                      </div>
                      <div>
                        <div className="font-pixel text-sm text-white">
                          {tr(lang, `case_name_${c.type}` as TranslationKey)}
                        </div>
                        <div className="font-mono-num text-xs text-amber-300 font-bold mt-0.5">
                          {c.price.toLocaleString()} 💰 · LVL {reqLvl}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono-num text-xs bg-slate-950 border border-slate-700 px-2 py-1 text-emerald-300">
                      ×{ownedCount}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{c.descriptionUz}</p>
                  <button
                    type="button"
                    disabled={!canBuy || !onBuyCase}
                    onClick={() => setConfirmBuy({ kind: 'case', item: c })}
                    className={`pixel-btn w-full py-2.5 font-pixel text-[10px] ${
                      canBuy && onBuyCase ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer' : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {!eventOpen ? tr(lang, 'eventClosed') : !levelOk ? `LVL ${reqLvl}` : `${tr(lang, 'buy')} (${c.price.toLocaleString()})`}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: LIMITED / LEGENDARY / MYTHIC SKINS */}
        {marketTab === 'limited' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {limitedSkins.map(renderSkinCard)}
          </div>
        )}

        {/* TAB 5: SEASONAL SKINS */}
        {marketTab === 'seasonal' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {seasonalSkins.map(renderSkinCard)}
          </div>
        )}

        {/* TAB 6: ZAI LIMITED LUXURY SHOWCASE */}
        {marketTab === 'zai' && (
          <div className="flex flex-col gap-5">
            <div className="pixel-panel border-amber-400 bg-gradient-to-r from-[#12060d] via-[#1c0f05] to-[#081524] p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-pixel text-xs text-amber-300 flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  <span>ZAI LIMITED EDITION · EXCLUSIVE SKINS &amp; WEB DESIGNS</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  12 Monthly ZAI themes (1st–7th) &amp; 3 Annual Holiday Drops (June 10, August 23, September 9).
                </p>
              </div>
              {onOpenEventsScreen && (
                <button
                  type="button"
                  onClick={onOpenEventsScreen}
                  className="pixel-btn bg-[#dc2626] hover:bg-[#ef4444] border-[#ff7b89] text-white px-4 py-2 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{tr(lang, 'events')}</span>
                </button>
              )}
            </div>

            {!zaiCollectionOpen ? (
              <div className="pixel-panel border-amber-400/70 bg-slate-950/95 p-6 sm:p-8 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 border-2 border-amber-400/70 bg-amber-950/35 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-amber-300" />
                </div>
                <h3 className="font-pixel text-base sm:text-lg text-amber-300">
                  {tr(lang, 'zaiVaultLockedTitle')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {tr(lang, 'zaiVaultLockedDesc')}
                </p>
                <div className="pixel-panel border-rose-500/50 bg-rose-950/25 px-5 py-3 flex flex-wrap items-center justify-center gap-3 text-xs">
                  <span className="font-pixel text-rose-300">{tr(lang, 'zaiNextDropLabel')}:</span>
                  <span className="font-pixel text-white">{nextZaiStatus.event.title} ({nextZaiStatus.event.dateLabel})</span>
                  <span className="font-mono-num text-amber-300 font-bold">{nextZaiStatus.countdownText}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setMarketTab('schedule')}
                    className="pixel-btn bg-slate-800 hover:bg-slate-700 border-slate-600 px-4 py-2 font-pixel text-[10px] text-white cursor-pointer"
                  >
                    {tr(lang, 'tabEventSchedule')}
                  </button>
                  {onOpenEventsScreen && (
                    <button
                      type="button"
                      onClick={onOpenEventsScreen}
                      className="pixel-btn bg-[#dc2626] hover:bg-[#ef4444] border-[#ff7b89] px-4 py-2 font-pixel text-[10px] text-white cursor-pointer"
                    >
                      {tr(lang, 'events')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {zaiSkins.length > 0 && (
                  <div>
                    <h3 className="font-pixel text-xs text-amber-300 mb-3">
                      ZAI LIMITED SKINS ({zaiSkins.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {zaiSkins.map(renderSkinCard)}
                    </div>
                  </div>
                )}

                {zaiWebs.length > 0 && (
                  <div>
                    <h3 className="font-pixel text-xs text-cyan-300 mb-3">
                      ZAI LIMITED WEB DESIGNS ({zaiWebs.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {zaiWebs.map((web) => {
                        const qty = economy.ownedWebDesigns?.[web.id] ?? 0;
                        const owned = qty > 0;
                        const equipped = (economy.equippedWebDesign ?? 'classic_white') === web.id;
                        const levelOk = playerLvl >= web.minPlayerLevel;
                        const eventOpen = !web.isZaiLimited || isZaiItemAvailableNow(web, effectiveNow);
                        const canAfford = Boolean(economy.isCreator) || economy.spikeyCoins >= web.price;
                        const canBuyNow = levelOk && eventOpen && canAfford;
                        return (
                          <div
                            key={web.id}
                            className="pixel-panel p-4 border-cyan-400/75 bg-gradient-to-br from-slate-950 via-cyan-950/25 to-amber-950/20 flex flex-col justify-between gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <WebDesignPreviewCanvas webDesignId={web.id} size="md" quality="ultra" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-pixel text-[9px] px-1.5 py-0.5 bg-cyan-500 text-slate-950 font-bold">
                                    ZAI WEB
                                  </span>
                                  <span className="font-pixel text-[9px] text-cyan-200">
                                    {web.releaseDateLabel} · LVL {web.minPlayerLevel}
                                  </span>
                                </div>
                                <div className="font-pixel text-xs text-white mt-1.5 truncate">{web.name}</div>
                                <p className="text-xs text-slate-300 mt-1 line-clamp-2">{web.descriptionUz}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                              <span className="font-mono-num text-xs font-bold text-amber-300 flex items-center gap-1">
                                <Coins className="w-3.5 h-3.5" /> {web.price.toLocaleString()}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewTarget({ kind: 'web', item: web })}
                                  className="pixel-btn bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-200 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                {owned && (
                                  <button
                                    type="button"
                                    disabled={equipped}
                                    onClick={() => onEquipWebDesign(web.id)}
                                    className={`pixel-btn px-2.5 py-1.5 font-pixel text-[10px] ${
                                      equipped ? 'bg-emerald-700 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
                                    }`}
                                  >
                                    {equipped ? tr(lang, 'equipped') : tr(lang, 'equip')}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={!canBuyNow}
                                  onClick={() => setConfirmBuy({ kind: 'web', item: web })}
                                  className={`pixel-btn px-2.5 py-1.5 font-pixel text-[10px] ${
                                    canBuyNow
                                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer'
                                      : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  {!eventOpen
                                    ? tr(lang, 'eventClosed')
                                    : !levelOk
                                    ? `LVL ${web.minPlayerLevel}`
                                    : tr(lang, 'buy')}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 7: EVENT SCHEDULE OVERVIEW */}
        {marketTab === 'schedule' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ANNUAL_ZAI_EVENTS.map((ev) => {
                const st = getAnnualZaiEventStatus(ev, effectiveNow);
                return (
                  <div
                    key={ev.id}
                    className={`pixel-panel p-4 flex flex-col gap-3 ${
                      st.isActive ? 'zai-gold-banner border-amber-400' : 'border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-pixel text-amber-300 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {ev.dateLabel}
                      </span>
                      <span className="font-pixel text-[9px] text-rose-300">
                        {st.isActive ? tr(lang, 'activeNow') : st.countdownText}
                      </span>
                    </div>
                    <h3 className="font-pixel text-sm text-white">{ev.title}</h3>
                    <p className="text-xs text-slate-300">{ev.descriptionEn}</p>
                    <div className="flex items-center justify-center gap-3">
                      <SkinPreviewCanvas skinId={ev.exclusiveSkinId} size="sm" />
                      <WebDesignPreviewCanvas webDesignId={ev.exclusiveWebId} size="sm" quality="high" />
                    </div>
                  </div>
                );
              })}
            </div>
            {onOpenEventsScreen && (
              <button
                type="button"
                onClick={onOpenEventsScreen}
                className="pixel-btn self-start bg-[#dc2626] hover:bg-[#ef4444] border-[#ff7b89] px-5 py-2.5 font-pixel text-xs text-white cursor-pointer"
              >
                {tr(lang, 'viewUpcomingZaiEvent')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Purchase Confirmation Modal */}
      {confirmBuy && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="pixel-panel w-full max-w-sm p-6 border-amber-400 bg-slate-950 flex flex-col items-center text-center gap-4">
            <div className="font-pixel text-xs text-amber-300">{tr(lang, 'confirmPurchaseTitle')}</div>
            {confirmBuy.kind === 'skin' ? (
              <SkinPreviewCanvas skinId={confirmBuy.item.id} size="lg" anim="victory" />
            ) : confirmBuy.kind === 'web' ? (
              <WebDesignPreviewCanvas webDesignId={confirmBuy.item.id} size="lg" quality="ultra" />
            ) : (
              <div className="w-20 h-20 border-2 flex items-center justify-center bg-slate-900" style={{ borderColor: confirmBuy.item.color }}>
                <Box className="w-10 h-10" style={{ color: confirmBuy.item.color }} />
              </div>
            )}
            <div className="font-pixel text-sm text-white">
              {confirmBuy.kind === 'case' ? confirmBuy.item.nameEn : confirmBuy.item.name}
            </div>
            <div className="bg-slate-900 border border-slate-800 px-4 py-2 font-mono-num text-sm font-bold text-amber-300">
              {confirmBuy.item.price.toLocaleString()} {tr(lang, 'spikeyCoins')}
            </div>
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setConfirmBuy(null)}
                className="pixel-btn min-h-[42px] bg-slate-800 hover:bg-slate-700 font-pixel text-[10px] text-slate-200 cursor-pointer"
              >
                {tr(lang, 'cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmBuy.kind === 'skin') onBuySkin(confirmBuy.item.id);
                  else if (confirmBuy.kind === 'web') onBuyWebDesign(confirmBuy.item.id);
                  else if (onBuyCase) onBuyCase(confirmBuy.item.type);
                  setConfirmBuy(null);
                }}
                className="pixel-btn min-h-[42px] bg-amber-500 hover:bg-amber-400 border-amber-200 font-pixel text-[10px] text-slate-950 font-bold cursor-pointer"
              >
                {tr(lang, 'confirmPurchaseBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {sellTarget && (
        <SellConfirmModal
          skin={sellTarget}
          sellPrice={RARITY_META[sellTarget.rarity].sellPrice}
          lang={lang}
          onConfirm={() => {
            onSellSkin(sellTarget.id);
            setSellTarget(null);
          }}
          onCancel={() => setSellTarget(null)}
        />
      )}

      {sellWebTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="pixel-panel w-full max-w-sm p-6 border-amber-400/75 bg-slate-950 flex flex-col gap-4 text-center">
            <div className="font-pixel text-sm text-amber-300">{sellWebTarget.name}</div>
            <div className="flex justify-center">
              <WebDesignPreviewCanvas webDesignId={sellWebTarget.id} size="lg" quality="ultra" />
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3 text-xs text-slate-300">
              {tr(lang, 'sell')}:{' '}
              <strong className="text-amber-400 font-mono-num">
                +{(sellWebTarget.sellPrice || Math.round(sellWebTarget.price * 0.4)).toLocaleString()} Coins
              </strong>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSellWebTarget(null)}
                className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2.5 font-pixel text-xs text-slate-200 cursor-pointer"
              >
                {tr(lang, 'cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onSellWebDesign(sellWebTarget.id);
                  setSellWebTarget(null);
                }}
                className="pixel-btn bg-amber-600 hover:bg-amber-500 py-2.5 font-pixel text-xs text-white cursor-pointer"
              >
                {tr(lang, 'sell')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Angle Pose Inspector Modal */}
      {previewTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="pixel-panel w-full max-w-md p-6 border-cyan-400/80 bg-slate-950 flex flex-col items-center text-center gap-4">
            <div className="w-full flex items-center justify-between">
              <span className="font-pixel text-xs text-cyan-300">{tr(lang, 'preview')}</span>
              <button
                type="button"
                onClick={() => setPreviewTarget(null)}
                className="pixel-btn bg-slate-800 p-1.5 text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {previewTarget.kind === 'skin' ? (
              <>
                <div className="flex items-center justify-center gap-3">
                  <SkinPreviewCanvas skinId={previewTarget.item.id} size="lg" anim={previewPose} />
                  <WebDesignPreviewCanvas webDesignId={economy.equippedWebDesign ?? 'classic_white'} size="md" quality="ultra" />
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {(
                    [
                      { anim: 'idle' as const, label: tr(lang, 'previewPoseIdle') },
                      { anim: 'run' as const, label: tr(lang, 'previewPoseRun') },
                      { anim: 'attack' as const, label: tr(lang, 'previewPoseAttack') },
                      { anim: 'victory' as const, label: tr(lang, 'previewPoseVictory') },
                    ]
                  ).map((p) => (
                    <button
                      key={p.anim}
                      type="button"
                      onClick={() => setPreviewPose(p.anim)}
                      className={`pixel-btn px-2.5 py-1 font-pixel text-[9px] cursor-pointer ${
                        previewPose === p.anim
                          ? 'bg-cyan-600 border-cyan-300 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <WebDesignPreviewCanvas webDesignId={previewTarget.item.id} size="lg" quality="ultra" />
            )}
            <h3 className="font-pixel text-lg text-white">{previewTarget.item.name}</h3>
            <p className="text-xs text-slate-300">{previewTarget.item.descriptionUz}</p>
            <div className="font-mono-num text-xs text-amber-300">
              {RARITY_META[previewTarget.item.rarity].labelUz} · LVL{' '}
              {previewTarget.kind === 'skin'
                ? getSkinMinLevel(previewTarget.item)
                : previewTarget.item.minPlayerLevel}
            </div>
            <button
              type="button"
              onClick={() => setPreviewTarget(null)}
              className="pixel-btn w-full min-h-[42px] bg-sky-600 hover:bg-sky-500 py-2.5 font-pixel text-xs text-white cursor-pointer"
            >
              {tr(lang, 'close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================================================
// 4. COMPLETE CASE SYSTEM + SKIP ANIMATION + ODDS INFO MODAL
// ===================================================
export const CasesScreen: React.FC<{
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  effectiveNow?: Date;
  lang?: string | null;
  initialCaseToSpin?: CaseType | null;
  onBuyCase: (caseType: CaseType) => void;
  onOpenCase: (caseType: CaseType) => { ok: boolean; spinResult?: CaseSpinResult; errorUz?: string };
  onEquipSkin: (skinId: string) => void;
  onSellSkin: (skinId: string) => void;
  onBack: () => void;
}> = ({
  economy,
  calendar,
  effectiveNow = new Date(),
  lang,
  initialCaseToSpin,
  onBuyCase,
  onOpenCase,
  onEquipSkin,
  onSellSkin,
  onBack,
}) => {
  const [spinningCase, setSpinningCase] = useState<CaseType | null>(null);
  const [spinResult, setSpinResult] = useState<CaseSpinResult | null>(null);
  const [spinOffsetPx, setSpinOffsetPx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [oddsModalCase, setOddsModalCase] = useState<CaseDef | null>(null);
  const autoSpunRef = useRef<CaseType | null>(null);
  const timersRef = useRef<number[]>([]);
  const targetOffsetRef = useRef<number>(0);

  const playerLvl = getPlayerLevelProgress(economy.playerXp ?? 0).level;
  const SLOT_WIDTH = 108;

  const clearSpinTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => () => clearSpinTimers(), []);

  const finishSpinReveal = (result: CaseSpinResult | null) => {
    clearSpinTimers();
    setSpinOffsetPx(targetOffsetRef.current);
    setIsAnimating(false);
    setRevealModalOpen(true);
    if (result?.winningSkin.rarity === 'mythic' || result?.winningSkin.rarity === 'limited') {
      audio.playSfx('mythicFanfare');
    } else {
      audio.playSfx('caseReveal');
    }
  };

  const startSpin = (caseType: CaseType) => {
    if (isAnimating) return;
    const res = onOpenCase(caseType);
    if (!res.ok || !res.spinResult) {
      setErrorMsg(res.errorUz ?? 'Keys ochishda xatolik yuz berdi.');
      return;
    }

    clearSpinTimers();
    setErrorMsg(null);
    setSpinningCase(caseType);
    setSpinResult(res.spinResult);
    setRevealModalOpen(false);
    setSpinOffsetPx(0);
    setIsAnimating(true);

    const centerJitter = (Math.random() - 0.5) * 32;
    const targetOffset = res.spinResult.winningIndex * SLOT_WIDTH + SLOT_WIDTH / 2 + centerJitter;
    targetOffsetRef.current = targetOffset;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setSpinOffsetPx(targetOffset);
      });
    });

    const tickTimes = [120, 240, 360, 490, 640, 810, 1000, 1220, 1480, 1780, 2120, 2500, 2940, 3420];
    tickTimes.forEach((ms) => {
      timersRef.current.push(window.setTimeout(() => audio.playSfx('reelTick'), ms));
    });

    timersRef.current.push(
      window.setTimeout(() => {
        finishSpinReveal(res.spinResult ?? null);
      }, 4200)
    );
  };

  useEffect(() => {
    if (initialCaseToSpin && autoSpunRef.current !== initialCaseToSpin) {
      autoSpunRef.current = initialCaseToSpin;
      if ((economy.ownedCases[initialCaseToSpin] ?? 0) > 0) {
        startSpin(initialCaseToSpin);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCaseToSpin]);

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz={tr(lang, 'cases')}
          subtitleUz={`RNG + ${tr(lang, 'probabilityInfo')}`}
          spikeyCoins={economy.spikeyCoins}
          isCreator={economy.isCreator}
          calendar={calendar}
          lang={lang}
          onBack={onBack}
        />

        {errorMsg && (
          <div className="border border-rose-500/70 bg-rose-950/60 px-4 py-2 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Active Roulette Spinner Box with Instant Skip Animation Button */}
        {spinResult && spinningCase && (
          <div className="pixel-panel p-5 border-sky-400/70 bg-slate-950/95 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-pixel text-sky-300">
                {tr(lang, `case_name_${spinningCase}` as TranslationKey)}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  {isAnimating ? tr(lang, 'spinningText') : spinResult.winningSkin.name}
                </span>
                {isAnimating && (
                  <button
                    type="button"
                    onClick={() => finishSpinReveal(spinResult)}
                    className="pixel-btn bg-amber-600 hover:bg-amber-500 border-amber-300 text-slate-950 font-bold px-3 py-1 font-pixel text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'skipAnimation')}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative w-full h-32 overflow-hidden border-2 border-slate-700 bg-slate-900/90 flex items-center">
              <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-amber-400 z-20 shadow-[0_0_12px_rgba(251,191,36,0.9)]" />
              <div
                className="flex items-center gap-2 pl-[50%]"
                style={{
                  transform: `translateX(-${spinOffsetPx}px)`,
                  transition: isAnimating
                    ? 'transform 4.1s cubic-bezier(0.08, 0.88, 0.14, 1)'
                    : 'none',
                }}
              >
                {spinResult.reel.map((item, idx) => {
                  const rar = RARITY_META[item.rarity];
                  return (
                    <div
                      key={idx}
                      style={{ width: '100px' }}
                      className={`shrink-0 h-24 border-2 p-1.5 flex flex-col items-center justify-between ${rar.borderClass} ${rar.bgClass}`}
                    >
                      <SkinPreviewCanvas skinId={item.id} size="sm" anim="idle" />
                      <div className="text-[9px] font-pixel text-white truncate w-full text-center">
                        {item.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* All Cases Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_CASES.filter(
            (c) =>
              !c.isZaiLimited ||
              isZaiCaseAvailableNow(c, effectiveNow) ||
              (economy.ownedCases[c.type] ?? 0) > 0
          ).map((c) => {
            const ownedCount = economy.ownedCases[c.type] ?? 0;
            const reqLvl = c.minPlayerLevel ?? 1;
            const levelOk = playerLvl >= reqLvl;
            const eventOpen = !c.isZaiLimited || isZaiCaseAvailableNow(c, effectiveNow);
            const evStatus = c.eventId ? getAnnualZaiEventStatus(c.eventId, effectiveNow) : null;
            const canBuy = levelOk && eventOpen && (Boolean(economy.isCreator) || economy.spikeyCoins >= c.price);

            return (
              <div
                key={c.type}
                className={`pixel-panel p-4 flex flex-col justify-between gap-3 ${c.badgeClass}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 border-2 flex items-center justify-center bg-slate-950/90 shrink-0"
                      style={{ borderColor: c.color }}
                    >
                      <Box className="w-6 h-6" style={{ color: c.color }} />
                    </div>
                    <div>
                      <h3 className="font-pixel text-sm text-white">
                        {tr(lang, `case_name_${c.type}` as TranslationKey)}
                      </h3>
                      <div className="flex items-center gap-2 font-mono-num text-xs text-amber-300 font-bold mt-0.5">
                        <span className="flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          {c.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-pixel text-slate-300">LVL {reqLvl}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSfx('menuClick');
                        setOddsModalCase(c);
                      }}
                      title={tr(lang, 'probabilityInfo')}
                      className="pixel-btn bg-slate-900 hover:bg-slate-800 border-slate-700 p-1.5 text-sky-300 cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    <span className="font-mono-num text-xs bg-slate-950/90 border border-slate-700 px-2 py-1 text-emerald-300 font-bold">
                      ×{ownedCount}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300">{c.descriptionUz}</p>

                {evStatus && (
                  <div className="bg-black/60 border border-slate-700 px-2.5 py-1.5 flex items-center justify-between text-[10px] font-pixel">
                    <span className={evStatus.isActive ? 'text-amber-300' : 'text-rose-300'}>
                      {evStatus.isActive ? tr(lang, 'activeNow') : evStatus.event.dateLabel}
                    </span>
                    <span className="font-mono-num text-slate-200">{evStatus.countdownText}</span>
                  </div>
                )}

                <div className="bg-slate-950/80 border border-slate-800 p-2.5 flex flex-col gap-1">
                  {c.drops.map((d) => {
                    const rm = RARITY_META[d.rarity];
                    return (
                      <div key={d.rarity} className="flex items-center justify-between text-[11px]">
                        <span style={{ color: rm.color }} className="font-medium">
                          {rm.labelUz}
                        </span>
                        <span className="font-mono-num text-slate-200 font-bold">
                          {d.probability}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={!canBuy || isAnimating}
                    onClick={() => onBuyCase(c.type)}
                    className={`pixel-btn py-2 font-pixel text-[10px] ${
                      canBuy && !isAnimating
                        ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer'
                        : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {!eventOpen
                      ? tr(lang, 'eventClosed')
                      : !levelOk
                      ? `LVL ${reqLvl}`
                      : `${tr(lang, 'buy')} (${c.price.toLocaleString()})`}
                  </button>
                  <button
                    type="button"
                    disabled={ownedCount <= 0 || isAnimating}
                    onClick={() => startSpin(c.type)}
                    className={`pixel-btn py-2 font-pixel text-[10px] ${
                      ownedCount > 0 && !isAnimating
                        ? 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer'
                        : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {tr(lang, 'openCase')} (×{ownedCount})
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Probability & Pool Info Modal */}
      {oddsModalCase && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="pixel-panel w-full max-w-xl max-h-[88vh] overflow-y-auto p-5 border-sky-400/80 bg-slate-950 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="font-pixel text-xs text-sky-300">{tr(lang, 'oddsModalTitle')}</div>
                <h3 className="font-pixel text-lg text-white mt-0.5">
                  {tr(lang, `case_name_${oddsModalCase.type}` as TranslationKey)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOddsModalCase(null)}
                className="pixel-btn bg-slate-800 p-1.5 text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300">{tr(lang, 'oddsGuarantee')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {oddsModalCase.drops.map((d) => (
                <div
                  key={d.rarity}
                  className="bg-slate-900 border border-slate-800 p-2.5 flex items-center justify-between text-xs"
                >
                  <span style={{ color: RARITY_META[d.rarity].color }} className="font-pixel text-[10px]">
                    {RARITY_META[d.rarity].labelUz}
                  </span>
                  <span className="font-mono-num font-bold text-white">{d.probability}%</span>
                </div>
              ))}
            </div>
            <div>
              <div className="font-pixel text-[10px] text-amber-300 mb-2">{tr(lang, 'poolPreview')}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {getCasePoolItems(oddsModalCase.type).map((item) => (
                  <div
                    key={item.id}
                    className={`border p-2 flex flex-col items-center text-center gap-1 ${
                      RARITY_META[item.rarity].borderClass
                    } ${RARITY_META[item.rarity].bgClass}`}
                  >
                    <SkinPreviewCanvas skinId={item.id} size="sm" anim="idle" />
                    <div className="font-pixel text-[9px] text-white truncate w-full">{item.name}</div>
                    <span className="text-[8px] font-pixel" style={{ color: RARITY_META[item.rarity].color }}>
                      {RARITY_META[item.rarity].labelUz}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Case Reveal Celebration Modal */}
      {revealModalOpen && spinResult && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div
            className={`pixel-panel w-full max-w-md p-6 text-center flex flex-col items-center gap-4 ${
              RARITY_META[spinResult.winningSkin.rarity].borderClass
            } bg-slate-950`}
          >
            <div className="font-pixel text-xs text-amber-300">
              {spinResult.winningSkin.rarity === 'mythic'
                ? tr(lang, 'mythicJackpot')
                : spinResult.isNewSkin
                ? tr(lang, 'newSkinUnlocked')
                : tr(lang, 'caseReward')}
            </div>
            <SkinPreviewCanvas skinId={spinResult.winningSkin.id} size="lg" anim="victory" />
            <div>
              <span
                className={`text-[10px] font-pixel px-2 py-0.5 ${
                  RARITY_META[spinResult.winningSkin.rarity].badgeClass
                }`}
              >
                {RARITY_META[spinResult.winningSkin.rarity].labelUz}
              </span>
              <h3 className="font-pixel text-xl text-white mt-2">
                {spinResult.winningSkin.name}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {spinResult.winningSkin.descriptionUz}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full pt-2">
              <button
                type="button"
                onClick={() => {
                  onEquipSkin(spinResult.winningSkin.id);
                  setRevealModalOpen(false);
                }}
                className="pixel-btn bg-sky-600 hover:bg-sky-500 py-2 font-pixel text-[10px] text-white cursor-pointer"
              >
                {tr(lang, 'equip')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (canSellSkin(economy, spinResult.winningSkin.id).eligible) {
                    onSellSkin(spinResult.winningSkin.id);
                    setRevealModalOpen(false);
                  }
                }}
                disabled={!canSellSkin(economy, spinResult.winningSkin.id).eligible}
                className="pixel-btn bg-amber-600 hover:bg-amber-500 disabled:opacity-40 py-2 font-pixel text-[10px] text-white cursor-pointer"
              >
                {tr(lang, 'sell')} (+{RARITY_META[spinResult.winningSkin.rarity].sellPrice})
              </button>
              <button
                type="button"
                onClick={() => setRevealModalOpen(false)}
                className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2 font-pixel text-[10px] text-slate-200 cursor-pointer"
              >
                {tr(lang, 'close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================================================
// 5. PLAYER INVENTORY SCREEN (SKINS + WEB DESIGNS + CASES)
// ===================================================
export const InventoryScreen: React.FC<{
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  lang?: string | null;
  onEquipSkin: (skinId: string) => void;
  onSellSkin: (skinId: string) => void;
  onEquipWebDesign: (webId: string) => void;
  onSellWebDesign: (webId: string) => void;
  onOpenCaseFromInventory: (caseType: CaseType) => void;
  onUseSpecialItem: (itemId: string) => void;
  onBack: () => void;
}> = ({
  economy,
  calendar,
  lang,
  onEquipSkin,
  onSellSkin,
  onEquipWebDesign,
  onSellWebDesign,
  onOpenCaseFromInventory,
  onUseSpecialItem,
  onBack,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'skins' | 'webs' | 'cases' | 'coins' | 'special' | 'seasonal'>('all');
  const [sortBy, setSortBy] = useState<'rarity' | 'qty'>('rarity');
  const [sellTarget, setSellTarget] = useState<SkinDef | null>(null);
  const [sellWebTarget, setSellWebTarget] = useState<WebDesignDef | null>(null);

  const ownedSkinItems = useMemo(() => {
    const arr = Object.entries(economy.ownedSkins)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ skin: getSkinById(id), qty }));
    arr.sort((a, b) =>
      sortBy === 'rarity'
        ? RARITY_META[b.skin.rarity].rank - RARITY_META[a.skin.rarity].rank
        : b.qty - a.qty
    );
    return arr;
  }, [economy.ownedSkins, sortBy]);

  const ownedWebItems = useMemo(() => {
    const map = economy.ownedWebDesigns ?? { classic_white: 1 };
    const arr = Object.entries(map)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ web: getWebDesignById(id), qty }));
    arr.sort((a, b) =>
      sortBy === 'rarity'
        ? RARITY_META[b.web.rarity].rank - RARITY_META[a.web.rarity].rank
        : b.qty - a.qty
    );
    return arr;
  }, [economy.ownedWebDesigns, sortBy]);

  const ownedCasesList = ALL_CASES.filter((c) => (economy.ownedCases[c.type] ?? 0) > 0);
  const ownedSpecials = Object.entries(economy.specialItems).filter(([, qty]) => qty > 0);
  const seasonalSkins = ownedSkinItems.filter((x) => x.skin.category === 'seasonal' || x.skin.isZaiLimited);

  const tabs: { id: typeof filterTab; labelUz: string }[] = [
    { id: 'all', labelUz: tr(lang, 'allFilter') },
    { id: 'skins', labelUz: tr(lang, 'tabSkins') },
    { id: 'webs', labelUz: tr(lang, 'tabWebDesigns') },
    { id: 'cases', labelUz: tr(lang, 'cases') },
    { id: 'coins', labelUz: tr(lang, 'spikeyCoins') },
    { id: 'special', labelUz: tr(lang, 'specialFilter') },
    { id: 'seasonal', labelUz: tr(lang, 'seasonZaiFilter') },
  ];

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz={tr(lang, 'inventory')}
          subtitleUz={`${tr(lang, 'tabSkins')}, ${tr(lang, 'tabWebDesigns')}, ${tr(lang, 'cases')} & ${tr(lang, 'spikeyCoins')}`}
          spikeyCoins={economy.spikeyCoins}
          isCreator={economy.isCreator}
          calendar={calendar}
          lang={lang}
          onBack={onBack}
          rightExtra={
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rarity' | 'qty')}
              className="pixel-btn bg-slate-900 px-3 py-2 text-xs text-slate-200"
            >
              <option value="rarity">{tr(lang, 'sortRarity')}</option>
              <option value="qty">{tr(lang, 'sortQty')}</option>
            </select>
          }
        />

        {/* Inventory Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                setFilterTab(t.id);
              }}
              className={`pixel-btn px-3 py-2 font-pixel text-[10px] cursor-pointer ${
                filterTab === t.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              {t.labelUz}
            </button>
          ))}
        </div>

        {(filterTab === 'all' || filterTab === 'coins') && (
          <div className="pixel-panel p-4 border-amber-400/60 bg-amber-950/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-amber-400" />
              <div>
                <div className="font-pixel text-sm text-amber-300">{tr(lang, 'spikeyCoins')}</div>
                <p className="text-xs text-slate-300">
                  {tr(lang, 'coinsWalletDesc')}
                </p>
              </div>
            </div>
            <div className="font-mono-num text-2xl font-bold text-amber-300">
              {economy.isCreator ? '∞' : economy.spikeyCoins.toLocaleString()}
            </div>
          </div>
        )}

        {(filterTab === 'all' || filterTab === 'cases' || filterTab === 'seasonal') &&
          ownedCasesList.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="font-pixel text-xs text-purple-300 flex items-center gap-1.5">
                <Box className="w-4 h-4" />
                <span>{tr(lang, 'cases')} ({ownedCasesList.reduce((a, c) => a + (economy.ownedCases[c.type] ?? 0), 0)})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ownedCasesList
                  .filter((c) => filterTab !== 'seasonal' || c.type === 'seasonal' || c.isZaiLimited)
                  .map((c) => (
                    <div key={c.type} className={`pixel-panel p-3 flex flex-col justify-between gap-2.5 ${c.badgeClass}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-pixel text-xs text-white">
                          {tr(lang, `case_name_${c.type}` as TranslationKey)}
                        </span>
                        <span className="font-mono-num text-xs text-emerald-300 font-bold">
                          ×{economy.ownedCases[c.type]}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenCaseFromInventory(c.type)}
                        className="pixel-btn w-full bg-sky-600 hover:bg-sky-500 py-2 font-pixel text-[10px] text-white cursor-pointer"
                      >
                        {tr(lang, 'openCase')}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {(filterTab === 'all' || filterTab === 'special' || filterTab === 'seasonal') &&
          ownedSpecials.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="font-pixel text-xs text-sky-300 flex items-center gap-1.5">
                <Package className="w-4 h-4" />
                <span>{tr(lang, 'specialItemsTitle')}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ownedSpecials.map(([id, qty]) => {
                  const meta = SPECIAL_ITEMS_META[id];
                  if (!meta) return null;
                  return (
                    <div key={id} className="pixel-panel p-3.5 flex flex-col justify-between gap-2.5 border-sky-500/40">
                      <div className="flex items-center justify-between">
                        <span className="font-pixel text-xs text-white">{meta.nameUz}</span>
                        <span className="font-mono-num text-xs text-amber-300 font-bold">×{qty}</span>
                      </div>
                      <p className="text-xs text-slate-300">{meta.descriptionUz}</p>
                      <button
                        type="button"
                        onClick={() => onUseSpecialItem(id)}
                        className="pixel-btn bg-emerald-600 hover:bg-emerald-500 py-1.5 font-pixel text-[10px] text-white cursor-pointer"
                      >
                        {tr(lang, 'useItemBtn')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Owned Web Designs Section */}
        {(filterTab === 'all' || filterTab === 'webs') && (
          <div className="flex flex-col gap-3">
            <h3 className="font-pixel text-xs text-cyan-300">
              {tr(lang, 'tabWebDesigns')} ({ownedWebItems.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {ownedWebItems.map(({ web, qty }) => {
                const rm = RARITY_META[web.rarity];
                const equipped = (economy.equippedWebDesign ?? 'classic_white') === web.id;
                const sellCheck = canSellWebDesign(economy, web.id);
                return (
                  <div key={web.id} className={`pixel-panel p-3.5 flex flex-col justify-between gap-3 ${rm.borderClass} ${rm.bgClass}`}>
                    <div className="flex items-start gap-3">
                      <WebDesignPreviewCanvas webDesignId={web.id} size="md" quality="high" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[9px] font-pixel px-1.5 py-0.5 ${rm.badgeClass}`}>
                            {rm.labelUz}
                          </span>
                          <span className="font-mono-num text-xs text-slate-200 font-bold">×{qty}</span>
                        </div>
                        <div className="font-pixel text-xs text-white mt-1.5 truncate">{web.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {tr(lang, 'sellForCoins', { price: sellCheck.price.toLocaleString() })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={equipped}
                        onClick={() => onEquipWebDesign(web.id)}
                        className={`pixel-btn flex-1 py-1.5 font-pixel text-[10px] ${
                          equipped
                            ? 'bg-emerald-700 text-white cursor-default'
                            : 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer'
                        }`}
                      >
                        {equipped ? tr(lang, 'equipped') : tr(lang, 'equip')}
                      </button>
                      <button
                        type="button"
                        disabled={!sellCheck.eligible}
                        title={sellCheck.reasonUz ?? tr(lang, 'sell')}
                        onClick={() => setSellWebTarget(web)}
                        className={`pixel-btn px-3 py-1.5 font-pixel text-[10px] ${
                          sellCheck.eligible
                            ? 'bg-rose-800 hover:bg-rose-700 text-white cursor-pointer'
                            : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {tr(lang, 'sell')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Owned Skins Section */}
        {(filterTab === 'all' || filterTab === 'skins' || filterTab === 'seasonal') && (
          <div className="flex flex-col gap-3">
            <h3 className="font-pixel text-xs text-emerald-300">
              {tr(lang, 'tabSkins')} ({(filterTab === 'seasonal' ? seasonalSkins : ownedSkinItems).length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(filterTab === 'seasonal' ? seasonalSkins : ownedSkinItems).map(({ skin, qty }) => {
                const rm = RARITY_META[skin.rarity];
                const equipped = economy.equippedSkin === skin.id;
                const sellCheck = canSellSkin(economy, skin.id);
                return (
                  <div key={skin.id} className={`pixel-panel p-3.5 flex flex-col justify-between gap-3 ${rm.borderClass} ${rm.bgClass}`}>
                    <div className="flex items-start gap-3">
                      <SkinPreviewCanvas skinId={skin.id} size="md" anim={equipped ? 'victory' : 'idle'} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[9px] font-pixel px-1.5 py-0.5 ${rm.badgeClass}`}>
                            {rm.labelUz}
                          </span>
                          <span className="font-mono-num text-xs text-slate-200 font-bold">×{qty}</span>
                        </div>
                        <div className="font-pixel text-xs text-white mt-1.5 truncate">{skin.name}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {tr(lang, 'sellForCoins', { price: rm.sellPrice.toLocaleString() })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={equipped}
                        onClick={() => onEquipSkin(skin.id)}
                        className={`pixel-btn flex-1 py-1.5 font-pixel text-[10px] ${
                          equipped
                            ? 'bg-emerald-700 text-white cursor-default'
                            : 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer'
                        }`}
                      >
                        {equipped ? tr(lang, 'equipped') : tr(lang, 'equip')}
                      </button>
                      <button
                        type="button"
                        disabled={!sellCheck.eligible}
                        title={sellCheck.reasonUz ?? tr(lang, 'sell')}
                        onClick={() => setSellTarget(skin)}
                        className={`pixel-btn px-3 py-1.5 font-pixel text-[10px] ${
                          sellCheck.eligible
                            ? 'bg-rose-800 hover:bg-rose-700 text-white cursor-pointer'
                            : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {tr(lang, 'sell')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {sellTarget && (
        <SellConfirmModal
          skin={sellTarget}
          sellPrice={RARITY_META[sellTarget.rarity].sellPrice}
          lang={lang}
          onConfirm={() => {
            onSellSkin(sellTarget.id);
            setSellTarget(null);
          }}
          onCancel={() => setSellTarget(null)}
        />
      )}

      {sellWebTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="pixel-panel w-full max-w-sm p-6 border-amber-400/75 bg-slate-950 flex flex-col gap-4 text-center">
            <div className="font-pixel text-sm text-amber-300">{sellWebTarget.name}</div>
            <div className="flex justify-center">
              <WebDesignPreviewCanvas webDesignId={sellWebTarget.id} size="lg" quality="ultra" />
            </div>
            <div className="bg-slate-900/90 border border-slate-800 p-3 text-xs text-slate-300">
              {tr(lang, 'sell')}:{' '}
              <strong className="text-amber-400 font-mono-num">
                +{(sellWebTarget.sellPrice || Math.round(sellWebTarget.price * 0.4)).toLocaleString()} Coins
              </strong>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSellWebTarget(null)}
                className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2.5 font-pixel text-xs text-slate-200 cursor-pointer"
              >
                {tr(lang, 'cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onSellWebDesign(sellWebTarget.id);
                  setSellWebTarget(null);
                }}
                className="pixel-btn bg-amber-600 hover:bg-amber-500 py-2.5 font-pixel text-xs text-white cursor-pointer"
              >
                {tr(lang, 'sell')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================================================
// 6. MISSIONS, HOLIDAY EVENTS & TRANSACTIONS SCREEN
// ===================================================
export const MissionsScreen: React.FC<{
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  lang?: string | null;
  onClaimMission: (missionId: string) => void;
  onClaimHolidayGift: () => void;
  onBuySkin: (skinId: string) => void;
  onBack: () => void;
}> = ({ economy, calendar, lang, onClaimMission, onClaimHolidayGift, onBuySkin, onBack }) => {
  const [tab, setTab] = useState<'missions' | 'holiday' | 'history'>('missions');
  const [countdown, setCountdown] = useState(formatCountdownToMidnight);

  useEffect(() => {
    const id = window.setInterval(() => setCountdown(formatCountdownToMidnight()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const giftClaimed = economy.holidayClaimedIds.includes(`gift_${calendar.monthKey}`);
  const featuredHolidaySkin = getSkinById(calendar.season.featuredSkinId);

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz={tr(lang, 'missionsTitle')}
          subtitleUz={`${calendar.bannerLine1} · ${tr(lang, 'spikeyCoins')} & XP`}
          spikeyCoins={economy.spikeyCoins}
          isCreator={economy.isCreator}
          calendar={calendar}
          lang={lang}
          onBack={onBack}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('missions')}
            className={`pixel-btn px-4 py-2 font-pixel text-xs cursor-pointer ${
              tab === 'missions' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-300'
            }`}
          >
            {tr(lang, 'missions')}
          </button>
          <button
            type="button"
            onClick={() => setTab('holiday')}
            className={`pixel-btn px-4 py-2 font-pixel text-xs cursor-pointer ${
              tab === 'holiday' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-300'
            }`}
          >
            {tr(lang, 'holidayEventsTitle')}
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`pixel-btn px-4 py-2 font-pixel text-xs cursor-pointer ${
              tab === 'history' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-300'
            }`}
          >
            {tr(lang, 'transactionHistoryTitle')}
          </button>
        </div>

        {tab === 'missions' && (
          <div className="flex flex-col gap-5">
            {(['daily', 'weekly', 'seasonal'] as const).map((period) => {
              const list = ALL_MISSIONS.filter((m) => m.period === period);
              const heading =
                period === 'daily'
                  ? tr(lang, 'dailyMissionsHeading', { time: countdown })
                  : period === 'weekly'
                  ? tr(lang, 'weeklyMissionsHeading')
                  : `${calendar.bannerLine1} · ${tr(lang, 'seasonMissionsHeading')}`;
              return (
                <div key={period} className="flex flex-col gap-3">
                  <div className="font-pixel text-xs text-sky-300 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    <span>{heading}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {list.map((m) => {
                      const val = economy.missionProgress[`${m.period}:${m.metric}`] ?? 0;
                      const pct = Math.min(100, Math.round((val / m.target) * 100));
                      const claimed = economy.claimedMissions.includes(m.id);
                      const ready = val >= m.target && !claimed;
                      const diffClass =
                        m.difficulty === 'expert'
                          ? 'bg-rose-950 border-rose-400 text-rose-300'
                          : m.difficulty === 'hard'
                          ? 'bg-amber-950 border-amber-400 text-amber-300'
                          : m.difficulty === 'medium'
                          ? 'bg-sky-950 border-sky-400 text-sky-300'
                          : 'bg-emerald-950 border-emerald-400 text-emerald-300';
                      return (
                        <div
                          key={m.id}
                          className={`pixel-panel p-4 flex flex-col gap-2.5 ${
                            ready ? 'border-emerald-400 bg-emerald-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`font-pixel text-[8px] px-1.5 py-0.5 border ${diffClass}`}>
                                  {tr(lang, `difficulty_${m.difficulty}` as TranslationKey)}
                                </span>
                                <span className="font-pixel text-xs text-white">{m.titleUz}</span>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">{m.descriptionUz}</p>
                            </div>
                            <span className="font-mono-num text-xs text-amber-300 font-bold shrink-0">
                              +{m.rewardCoins} 💰 · +{m.rewardXp} XP
                            </span>
                          </div>
                          <div>
                            <div className="flex justify-between text-[11px] font-mono-num text-slate-400 mb-1">
                              <span>{tr(lang, 'progressLabel')}</span>
                              <span>
                                {Math.min(val, m.target)} / {m.target}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-900 border border-slate-700 overflow-hidden">
                              <div
                                className="h-full bg-sky-500 transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={!ready}
                            onClick={() => onClaimMission(m.id)}
                            className={`pixel-btn w-full py-2 font-pixel text-[10px] ${
                              ready
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                                : claimed
                                ? 'bg-slate-800 text-emerald-400'
                                : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {claimed
                              ? tr(lang, 'rewardClaimedTag')
                              : ready
                              ? tr(lang, 'claimRewardBtn')
                              : tr(lang, 'inProgressTag')}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'holiday' && (
          <div className="flex flex-col gap-5">
            {/* Active Monthly Holiday Event Card */}
            <div className="pixel-panel p-5 border-amber-400/75 bg-gradient-to-br from-amber-950/25 to-slate-950 flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <SkinPreviewCanvas skinId={featuredHolidaySkin.id} size="lg" anim="victory" />
                <div className="flex flex-col gap-1.5">
                  <span className="font-pixel text-[10px] text-amber-300">
                    {tr(lang, 'holidayEventsTitle')} · {calendar.bannerLine2}
                  </span>
                  <h3 className="font-pixel text-xl text-white">
                    {calendar.season.eventTitleUz}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-lg">
                    {calendar.season.eventDescUz}
                  </p>
                  <div className="text-xs text-emerald-300 font-mono-num">
                    +{calendar.season.eventGiftCoins} {tr(lang, 'coinsLabel')} + 1×{' '}
                    {tr(lang, (`case_name_${calendar.season.eventGiftCase}`) as TranslationKey)} + 150 XP
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full md:w-56 shrink-0">
                <button
                  type="button"
                  disabled={giftClaimed}
                  onClick={onClaimHolidayGift}
                  className={`pixel-btn py-3 font-pixel text-xs ${
                    giftClaimed
                      ? 'bg-slate-800 text-emerald-400 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                  }`}
                >
                  {giftClaimed ? tr(lang, 'claimedTag') : tr(lang, 'claimNow')}
                </button>
                {!(economy.ownedSkins[featuredHolidaySkin.id] > 0) &&
                  featuredHolidaySkin.marketPurchasable && (
                    <button
                      type="button"
                      disabled={!economy.isCreator && economy.spikeyCoins < featuredHolidaySkin.price}
                      onClick={() => onBuySkin(featuredHolidaySkin.id)}
                      className="pixel-btn bg-amber-600 hover:bg-amber-500 disabled:opacity-45 py-2 font-pixel text-[10px] text-white cursor-pointer"
                    >
                      {tr(lang, 'market')}: {featuredHolidaySkin.price.toLocaleString()} 💰
                    </button>
                  )}
              </div>
            </div>

            {/* Yearly Holiday Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {HOLIDAY_CALENDAR.map((h) => {
                const isActive = h.month === calendar.month;
                return (
                  <div
                    key={h.id}
                    className={`pixel-panel p-4 flex flex-col gap-2 ${
                      isActive ? 'border-emerald-400' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-pixel text-amber-300">{h.titleUz}</span>
                      <span className="text-[10px] text-slate-400">{h.dateWindowUz}</span>
                    </div>
                    <p className="text-xs text-slate-300">{h.descriptionUz}</p>
                    <div className="text-[11px] font-mono-num text-sky-300">
                      +{h.giftCoins} 💰 + {tr(lang, (`case_name_${h.giftCase}`) as TranslationKey)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="pixel-panel p-4 flex flex-col gap-2">
            <div className="font-pixel text-xs text-slate-300 pb-2 border-b border-slate-800">
              {tr(lang, 'transactionHistoryTitle')}
            </div>
            {economy.transactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                {tr(lang, 'noTransactions')}
              </p>
            ) : (
              economy.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between text-xs py-2 border-b border-slate-900 last:border-b-0"
                >
                  <div>
                    <div className="text-slate-100">{tx.labelUz}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span
                    className={`font-mono-num font-bold ${
                      tx.amount > 0
                        ? 'text-emerald-400'
                        : tx.amount < 0
                        ? 'text-rose-400'
                        : 'text-sky-300'
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount === 0 ? 'BUYUM' : tx.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ===================================================
// 7. EXPANDED ACHIEVEMENTS SCREEN
// ===================================================
export const AchievementsScreen: React.FC<{
  saveData: SaveData;
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  lang?: string | null;
  onBack: () => void;
}> = ({ saveData, economy, calendar, lang, onBack }) => {
  const combined = [...ACHIEVEMENTS, ...ECONOMY_ACHIEVEMENTS];
  const unlockedSet = new Set([
    ...saveData.unlockedAchievements,
    ...economy.unlockedEconomyAchievements,
  ]);

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz={`${tr(lang, 'achievements')} (${unlockedSet.size}/${combined.length})`}
          subtitleUz={tr(lang, 'achievementsSubtitle')}
          spikeyCoins={economy.spikeyCoins}
          isCreator={economy.isCreator}
          calendar={calendar}
          lang={lang}
          onBack={onBack}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {combined.map((ach) => {
            const unlocked = unlockedSet.has(ach.id);
            return (
              <div
                key={ach.id}
                className={`pixel-panel p-4 flex items-start gap-3 ${
                  unlocked ? 'border-amber-400/70 bg-amber-950/15' : 'border-slate-800 opacity-60'
                }`}
              >
                <Award
                  className={`w-6 h-6 shrink-0 mt-0.5 ${
                    unlocked ? 'text-amber-400' : 'text-slate-600'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-pixel text-xs text-white truncate">{ach.title}</span>
                    {unlocked && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{ach.description}</p>
                  {(ach.rewardCoins || ach.rewardXp) && (
                    <div className="text-[11px] font-mono-num text-amber-300 mt-1.5">
                      Mukofot: {ach.rewardCoins ? `+${ach.rewardCoins} 💰 ` : ''}
                      {ach.rewardXp ? `+${ach.rewardXp} XP` : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ===================================================
// 8. LOCAL PROFILES & AI RIVALS LEADERBOARD SCREEN
// ===================================================
export const LeaderboardScreen: React.FC<{
  entries: LeaderboardEntry[];
  loading: boolean;
  currentUid: string | null;
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  lang?: string | null;
  onRefresh: () => void;
  onStartTradeWith: (entry: LeaderboardEntry) => void;
  onBack: () => void;
}> = ({
  entries,
  loading,
  currentUid,
  economy,
  calendar,
  lang,
  onRefresh,
  onStartTradeWith,
  onBack,
}) => {
  const [sortKey, setSortKey] = useState<
    'totalCoins' | 'playerLevel' | 'seasonLevel' | 'skinsCount' | 'bossesDefeatedCount' | 'achievementsCount'
  >('totalCoins');

  const sorted = useMemo(
    () => [...entries].sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0)),
    [entries, sortKey]
  );

  const tabs: { key: typeof sortKey; labelUz: string }[] = [
    { key: 'totalCoins', labelUz: tr(lang, 'spikeyCoins') },
    { key: 'playerLevel', labelUz: tr(lang, 'playerLevel', { level: '' }).trim() },
    { key: 'seasonLevel', labelUz: tr(lang, 'seasonPass') },
    { key: 'skinsCount', labelUz: tr(lang, 'tabSkins') },
    { key: 'bossesDefeatedCount', labelUz: 'BOSS' },
    { key: 'achievementsCount', labelUz: tr(lang, 'achievements') },
  ];

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz={tr(lang, 'leaderboard')}
          subtitleUz={tr(lang, 'leaderboardSubtitle')}
          spikeyCoins={economy.spikeyCoins}
          isCreator={economy.isCreator}
          calendar={calendar}
          lang={lang}
          onBack={onBack}
          rightExtra={
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 px-3 py-2 font-pixel text-[10px] text-sky-300 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{tr(lang, 'refreshBtn')}</span>
            </button>
          }
        />

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSortKey(t.key)}
              className={`pixel-btn px-3 py-2 font-pixel text-[10px] cursor-pointer ${
                sortKey === t.key ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-300'
              }`}
            >
              {t.labelUz}
            </button>
          ))}
        </div>

        <div className="pixel-panel divide-y divide-slate-800">
          {sorted.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              {loading ? tr(lang, 'loadingText') : tr(lang, 'leaderboardEmpty')}
            </div>
          ) : (
            sorted.map((entry, idx) => {
              const isMe = entry.uid === currentUid;
              return (
                <div
                  key={entry.uid}
                  className={`p-3.5 flex flex-wrap items-center justify-between gap-3 ${
                    isMe ? 'bg-sky-950/35' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`font-pixel text-sm w-8 text-center ${
                        idx === 0
                          ? 'text-amber-300'
                          : idx === 1
                          ? 'text-slate-200'
                          : idx === 2
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <AvatarBadge
                      avatarId={entry.avatarId}
                      profileFrameId={entry.profileFrame}
                      size="sm"
                    />
                    <SkinPreviewCanvas skinId={entry.equippedSkin} size="sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-pixel text-xs text-white truncate">{entry.nickname}</span>
                        {isMe && <span className="font-pixel text-[9px] text-sky-400">{tr(lang, 'youTag')}</span>}
                        <span
                          className={`font-pixel text-[8px] px-1.5 py-0.5 border ${
                            entry.isAiRival
                              ? 'border-amber-500/40 text-amber-300 bg-amber-950/30'
                              : 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30'
                          }`}
                        >
                          {entry.isAiRival ? tr(lang, 'aiRivalTag') : tr(lang, 'localPlayerTag')}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono-num text-slate-400 mt-0.5">
                        LVL {entry.playerLevel ?? 1} · S-LVL {entry.seasonLevel} · {entry.skinsCount} skin · {entry.bossesDefeatedCount} boss · {entry.achievementsCount} ach
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono-num">
                      <div className="text-xs text-amber-300 font-bold">
                        {sortKey === 'totalCoins' && isMe && economy.isCreator
                          ? '∞'
                          : (entry[sortKey] ?? 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {tabs.find((x) => x.key === sortKey)?.labelUz}
                      </div>
                    </div>
                    {!isMe && (
                      <button
                        type="button"
                        onClick={() => onStartTradeWith(entry)}
                        className="pixel-btn bg-purple-700 hover:bg-purple-600 px-2.5 py-1.5 font-pixel text-[10px] text-white cursor-pointer"
                      >
                        {tr(lang, 'tradeBtn')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// ===================================================
// 9. OFFLINE NPC SKIN EXCHANGE SCREEN (FIREBASE-FREE)
// ===================================================
export const TradingScreen: React.FC<{
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  lang?: string | null;
  onSwapNpcOffer: (offer: NpcTradeOffer) => { ok: boolean; errorUz?: string };
  onBack: () => void;
}> = ({ economy, calendar, lang, onSwapNpcOffer, onBack }) => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const offers = useMemo(() => {
    const seededCal: LiveCalendarInfo = {
      ...calendar,
      day: calendar.day + refreshTick,
    };
    return generateNpcTradeOffers(economy, seededCal);
  }, [economy, calendar, refreshTick]);

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz={tr(lang, 'trading')}
          subtitleUz={tr(lang, 'tradingSubtitle')}
          spikeyCoins={economy.spikeyCoins}
          isCreator={economy.isCreator}
          calendar={calendar}
          lang={lang}
          onBack={onBack}
          rightExtra={
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                setRefreshTick((t) => t + 1);
                setStatusMsg(null);
              }}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 px-3 py-2 font-pixel text-[10px] text-sky-300 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{tr(lang, 'refreshBtn')}</span>
            </button>
          }
        />

        {statusMsg && (
          <div
            className={`pixel-panel px-4 py-3 text-xs font-semibold ${
              statusMsg.ok
                ? 'border-emerald-400 bg-emerald-950/50 text-emerald-200'
                : 'border-rose-400 bg-rose-950/50 text-rose-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="font-pixel text-xs text-purple-300 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            <span>{tr(lang, 'npcExchangeHeading')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => {
            const reqSkin = getSkinById(offer.requestedSkinId);
            const rewSkin = getSkinById(offer.rewardSkinId);
            const ownedReq = economy.ownedSkins[offer.requestedSkinId] ?? 0;
            const keepOneEquipped = economy.equippedSkin === offer.requestedSkinId && ownedReq <= 1;
            const hasSkin = reqSkin.tradable && ownedReq > 0 && !keepOneEquipped;
            const hasCoins = Boolean(economy.isCreator) || offer.coinFee <= 0 || economy.spikeyCoins >= offer.coinFee;
            const canSwap = hasSkin && hasCoins;

            return (
              <div
                key={offer.id}
                className="pixel-panel p-4 border-purple-500/50 bg-slate-950/90 flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <AvatarBadge avatarId={offer.npcAvatarId} size="xs" />
                    <span className="font-pixel text-xs text-white">{offer.npcName}</span>
                  </div>
                  <span className="font-mono-num text-[11px] text-emerald-300">
                    {offer.coinFee > 0
                      ? `-${offer.coinFee.toLocaleString()} 💰`
                      : `+${offer.bonusCoins.toLocaleString()} 💰`}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 bg-slate-900/80 border border-slate-800 p-2.5 flex flex-col items-center text-center gap-1.5">
                    <span className="font-pixel text-[9px] text-rose-300">{tr(lang, 'yourSkin')}</span>
                    <SkinPreviewCanvas skinId={reqSkin.id} size="sm" />
                    <div className="font-pixel text-[10px] text-white truncate w-full">{reqSkin.name}</div>
                    <span className="font-mono-num text-[10px] text-slate-400">
                      ×{ownedReq} {keepOneEquipped ? '(Equipped)' : ''}
                    </span>
                  </div>

                  <ArrowLeftRight className="w-5 h-5 text-purple-300 shrink-0" />

                  <div className="flex-1 bg-slate-900/80 border border-emerald-500/40 p-2.5 flex flex-col items-center text-center gap-1.5">
                    <span className="font-pixel text-[9px] text-emerald-300">{tr(lang, 'requestedSkin')}</span>
                    <SkinPreviewCanvas skinId={rewSkin.id} size="sm" anim="victory" />
                    <div className="font-pixel text-[10px] text-white truncate w-full">{rewSkin.name}</div>
                    <span className="font-pixel text-[9px]" style={{ color: RARITY_META[rewSkin.rarity].color }}>
                      {RARITY_META[rewSkin.rarity].labelUz}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canSwap}
                  onClick={() => {
                    const res = onSwapNpcOffer(offer);
                    if (res.ok) {
                      audio.playSfx('purchase');
                      setStatusMsg({ ok: true, text: tr(lang, 'swapCompletedMsg') });
                    } else {
                      audio.playSfx('hit');
                      setStatusMsg({ ok: false, text: res.errorUz ?? 'Swap unavailable.' });
                    }
                  }}
                  className={`pixel-btn min-h-[42px] w-full py-2.5 font-pixel text-xs ${
                    canSwap
                      ? 'bg-purple-600 hover:bg-purple-500 border-purple-300 text-white cursor-pointer'
                      : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {canSwap ? tr(lang, 'swapNowBtn') : hasSkin ? tr(lang, 'spikeyCoins') : tr(lang, 'noTradableSkins')}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ===================================================
// 11. OWNERS GIFT VAULT (NORMAL ACCOUNTS ONLY)
// ===================================================
export const OwnersGiftScreen: React.FC<{
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  lang?: string | null;
  onEquipSkin: (skinId: string) => void;
  onEquipWebDesign: (webId: string) => void;
  onOpenCases: () => void;
  onCheckGifts: () => Promise<void>;
  onBack: () => void;
}> = ({
  economy,
  calendar,
  lang,
  onEquipSkin,
  onEquipWebDesign,
  onOpenCases,
  onCheckGifts,
  onBack,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const gifts = useMemo(() => economy.ownerGiftsReceived ?? [], [economy.ownerGiftsReceived]);

  const totalAdminCoins = useMemo(
    () => gifts.reduce((sum, g) => sum + Math.max(0, g.coins || 0), 0),
    [gifts]
  );

  const adminSkins = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of gifts) {
      if (g.skinId && ALL_SKINS.some((s) => s.id === g.skinId)) {
        counts.set(g.skinId, (counts.get(g.skinId) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).map(([skinId, giftQty]) => ({
      skin: getSkinById(skinId),
      giftQty,
      ownedQty: economy.ownedSkins[skinId] ?? 0,
    }));
  }, [gifts, economy.ownedSkins]);

  const adminWebs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of gifts) {
      if (g.webDesignId && ALL_WEB_DESIGNS.some((w) => w.id === g.webDesignId)) {
        counts.set(g.webDesignId, (counts.get(g.webDesignId) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).map(([webId, giftQty]) => ({
      web: getWebDesignById(webId),
      giftQty,
      ownedQty: economy.ownedWebDesigns?.[webId] ?? 0,
    }));
  }, [gifts, economy.ownedWebDesigns]);

  const adminCases = useMemo(() => {
    const counts = new Map<CaseType, number>();
    for (const g of gifts) {
      if (g.caseType && Object.prototype.hasOwnProperty.call(CASE_MAP, g.caseType)) {
        counts.set(g.caseType, (counts.get(g.caseType) ?? 0) + (g.caseQty ?? 1));
      }
    }
    return Array.from(counts.entries()).map(([caseType, giftQty]) => ({
      def: CASE_MAP[caseType],
      giftQty,
      ownedQty: economy.ownedCases[caseType] ?? 0,
    }));
  }, [gifts, economy.ownedCases]);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    audio.playSfx('menuClick');
    try {
      await onCheckGifts();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz={tr(lang, 'ownersGiftTitle')}
          subtitleUz={tr(lang, 'ownersGiftSubtitle')}
          spikeyCoins={economy.spikeyCoins}
          isCreator={economy.isCreator}
          calendar={calendar}
          lang={lang}
          onBack={onBack}
          rightExtra={
            <button
              type="button"
              disabled={refreshing}
              onClick={() => void handleRefresh()}
              className="pixel-btn min-h-[40px] bg-amber-500/90 hover:bg-amber-400 border-amber-200 px-3.5 py-2 font-pixel text-[10px] text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{tr(lang, 'checkGiftsBtn')}</span>
            </button>
          }
        />

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="pixel-panel p-4 bg-gradient-to-br from-amber-950/50 to-slate-950 border-amber-400/70 flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-500/20 border border-amber-400/60 flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="font-pixel text-[9px] text-amber-300">
                {tr(lang, 'ownersGiftTotalCoins')}
              </div>
              <div className="font-mono-num text-xl font-bold text-white truncate">
                +{totalAdminCoins.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="pixel-panel p-4 bg-slate-950/90 border-sky-500/50 flex items-center gap-3">
            <div className="w-11 h-11 bg-sky-500/20 border border-sky-400/60 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="font-pixel text-[9px] text-sky-300">
                {tr(lang, 'ownersGiftSkinsTitle')}
              </div>
              <div className="font-mono-num text-xl font-bold text-white">
                {adminSkins.length}
              </div>
            </div>
          </div>

          <div className="pixel-panel p-4 bg-slate-950/90 border-cyan-500/50 flex items-center gap-3">
            <div className="w-11 h-11 bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center shrink-0">
              <Zap className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <div className="font-pixel text-[9px] text-cyan-300">
                {tr(lang, 'ownersGiftWebsTitle')}
              </div>
              <div className="font-mono-num text-xl font-bold text-white">
                {adminWebs.length}
              </div>
            </div>
          </div>

          <div className="pixel-panel p-4 bg-slate-950/90 border-purple-500/50 flex items-center gap-3">
            <div className="w-11 h-11 bg-purple-500/20 border border-purple-400/60 flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <div className="font-pixel text-[9px] text-purple-300">
                {tr(lang, 'ownersGiftCasesTitle')}
              </div>
              <div className="font-mono-num text-xl font-bold text-white">
                {adminCases.reduce((a, b) => a + b.giftQty, 0)}
              </div>
            </div>
          </div>
        </div>

        {gifts.length === 0 ? (
          <div className="pixel-panel p-8 bg-slate-950/90 border-slate-800 text-center flex flex-col items-center gap-3">
            <Crown className="w-10 h-10 text-amber-300/70" />
            <div className="font-pixel text-sm text-white">{tr(lang, 'ownersGiftTitle')}</div>
            <p className="text-xs text-slate-400 max-w-md">{tr(lang, 'ownersGiftEmpty')}</p>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="pixel-btn mt-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel text-[10px] font-bold cursor-pointer"
            >
              {tr(lang, 'checkGiftsBtn')}
            </button>
          </div>
        ) : (
          <>
            {/* Admin Spider Skins */}
            <section className="pixel-panel p-4 bg-slate-950/90 border-sky-500/45 space-y-3">
              <div className="font-pixel text-xs text-sky-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>
                  {tr(lang, 'ownersGiftSkinsTitle')} ({adminSkins.length})
                </span>
              </div>
              {adminSkins.length === 0 ? (
                <div className="text-xs text-slate-500 py-3">—</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {adminSkins.map(({ skin, giftQty, ownedQty }) => {
                    const isEquipped = economy.equippedSkin === skin.id;
                    const meta = RARITY_META[skin.rarity];
                    return (
                      <div
                        key={skin.id}
                        className="bg-slate-900/90 border p-3 flex flex-col items-center text-center gap-2"
                        style={{ borderColor: isEquipped ? '#34d399' : meta.color }}
                      >
                        <SkinPreviewCanvas skinId={skin.id} size="md" anim="idle" />
                        <div className="font-pixel text-xs text-white truncate w-full">
                          {skin.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span
                            className={`font-pixel px-1.5 py-0.5 ${meta.badgeClass}`}
                          >
                            {meta.labelUz}
                          </span>
                          <span className="font-mono-num text-slate-400">
                            ×{Math.max(giftQty, ownedQty)}
                          </span>
                        </div>
                        {ownedQty > 0 && (
                          <button
                            type="button"
                            disabled={isEquipped}
                            onClick={() => {
                              audio.playSfx('menuClick');
                              onEquipSkin(skin.id);
                            }}
                            className={`pixel-btn w-full py-1.5 font-pixel text-[9px] ${
                              isEquipped
                                ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 cursor-default'
                                : 'bg-sky-600 hover:bg-sky-500 border-sky-300 text-white cursor-pointer'
                            }`}
                          >
                            {isEquipped ? tr(lang, 'equipped') : tr(lang, 'equip')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Admin Web Skins */}
            <section className="pixel-panel p-4 bg-slate-950/90 border-cyan-500/45 space-y-3">
              <div className="font-pixel text-xs text-cyan-300 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>
                  {tr(lang, 'ownersGiftWebsTitle')} ({adminWebs.length})
                </span>
              </div>
              {adminWebs.length === 0 ? (
                <div className="text-xs text-slate-500 py-3">—</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {adminWebs.map(({ web, giftQty, ownedQty }) => {
                    const isEquipped = (economy.equippedWebDesign ?? 'classic_white') === web.id;
                    const meta = RARITY_META[web.rarity];
                    return (
                      <div
                        key={web.id}
                        className="bg-slate-900/90 border p-3 flex flex-col items-center text-center gap-2"
                        style={{ borderColor: isEquipped ? '#34d399' : meta.color }}
                      >
                        <WebDesignPreviewCanvas webDesignId={web.id} size="md" quality="high" />
                        <div className="font-pixel text-xs text-white truncate w-full">
                          {web.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className={`font-pixel px-1.5 py-0.5 ${meta.badgeClass}`}>
                            {meta.labelUz}
                          </span>
                          <span className="font-mono-num text-slate-400">
                            ×{Math.max(giftQty, ownedQty)}
                          </span>
                        </div>
                        {ownedQty > 0 && (
                          <button
                            type="button"
                            disabled={isEquipped}
                            onClick={() => {
                              audio.playSfx('menuClick');
                              onEquipWebDesign(web.id);
                            }}
                            className={`pixel-btn w-full py-1.5 font-pixel text-[9px] ${
                              isEquipped
                                ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 cursor-default'
                                : 'bg-cyan-600 hover:bg-cyan-500 border-cyan-300 text-white cursor-pointer'
                            }`}
                          >
                            {isEquipped ? tr(lang, 'equipped') : tr(lang, 'equip')}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Admin Cases (if any) */}
            {adminCases.length > 0 && (
              <section className="pixel-panel p-4 bg-slate-950/90 border-purple-500/45 space-y-3">
                <div className="font-pixel text-xs text-purple-300 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Box className="w-4 h-4" />
                    <span>{tr(lang, 'ownersGiftCasesTitle')}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      audio.playSfx('menuClick');
                      onOpenCases();
                    }}
                    className="pixel-btn px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-pixel text-[9px] cursor-pointer"
                  >
                    {tr(lang, 'cases')} →
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {adminCases.map(({ def, giftQty }) => (
                    <div
                      key={def.type}
                      className="bg-slate-900/90 border border-purple-500/40 p-3 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-pixel text-[11px] text-white truncate">
                          {def.nameUz}
                        </div>
                        <div className="font-mono-num text-[10px] text-purple-300">
                          Admin ×{giftQty}
                        </div>
                      </div>
                      <Box className="w-5 h-5 text-purple-300 shrink-0" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Admin Gift History Log */}
            <section className="pixel-panel p-4 bg-slate-950/90 border-amber-500/40 space-y-3">
              <div className="font-pixel text-xs text-amber-300 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <span>
                  {tr(lang, 'ownersGiftHistoryTitle')} ({gifts.length})
                </span>
              </div>
              <div className="space-y-2">
                {gifts.map((g) => {
                  const skin = g.skinId ? getSkinById(g.skinId) : null;
                  const web = g.webDesignId ? getWebDesignById(g.webDesignId) : null;
                  const caseDef = g.caseType ? CASE_MAP[g.caseType] : null;
                  return (
                    <div
                      key={g.giftId}
                      className="bg-slate-900/85 border border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        {g.coins > 0 && (
                          <div className="px-2.5 py-1.5 bg-amber-950/50 border border-amber-500/50 flex items-center gap-1.5 font-mono-num text-xs text-amber-300 font-bold">
                            <Coins className="w-3.5 h-3.5" />
                            <span>+{g.coins.toLocaleString()}</span>
                          </div>
                        )}
                        {skin && (
                          <div className="flex items-center gap-2 bg-slate-950 border border-sky-500/40 px-2 py-1">
                            <SkinPreviewCanvas skinId={skin.id} size="sm" staticFrame />
                            <span className="font-pixel text-[10px] text-sky-200">{skin.name}</span>
                          </div>
                        )}
                        {web && (
                          <div className="flex items-center gap-2 bg-slate-950 border border-cyan-500/40 px-2 py-1">
                            <WebDesignPreviewCanvas webDesignId={web.id} size="sm" staticFrame />
                            <span className="font-pixel text-[10px] text-cyan-200">{web.name}</span>
                          </div>
                        )}
                        {caseDef && (
                          <div className="px-2.5 py-1.5 bg-purple-950/50 border border-purple-500/50 flex items-center gap-1.5 text-xs text-purple-200 font-pixel text-[10px]">
                            <Box className="w-3.5 h-3.5" />
                            <span>
                              {g.caseQty ?? 1}× {caseDef.nameUz}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="font-mono-num text-[10px] text-slate-500">
                        {new Date(g.receivedAt).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
