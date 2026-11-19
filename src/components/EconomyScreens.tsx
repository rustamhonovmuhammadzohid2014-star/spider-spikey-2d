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
import { tr } from '../game/i18n';
import {
  HOLIDAY_CALENDAR,
  LiveCalendarInfo,
  buildSeasonPassLevels,
  getSeasonLevelFromXp,
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
  TradeOffer,
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
  isZaiEventWindowOpen,
} from '../game/zaiCollection';
import { SkinPreviewCanvas, WebDesignPreviewCanvas } from './SkinPreviewCanvas';

interface ScreenHeaderProps {
  titleUz: string;
  subtitleUz: string;
  spikeyCoins: number;
  calendar: LiveCalendarInfo;
  onBack: () => void;
  rightExtra?: React.ReactNode;
}

const ScreenShellHeader: React.FC<ScreenHeaderProps> = ({
  titleUz,
  subtitleUz,
  spikeyCoins,
  calendar,
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
        <span>ORQAGA</span>
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
        title="Spikey Coins balansi"
      >
        <Coins className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex flex-col leading-none">
          <span className="font-pixel text-[8px] text-amber-300/80">SPIKEY COINS</span>
          <span className="font-mono-num text-sm font-bold text-amber-300">
            {spikeyCoins.toLocaleString()}
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
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ skin, sellPrice, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
    <div className="pixel-panel w-full max-w-sm p-6 border-amber-400/75 bg-slate-950 flex flex-col gap-4 text-center">
      <div className="font-pixel text-sm text-amber-300 leading-snug">
        HAQIQATAN HAM SOTMOQCHIMISIZ?
      </div>
      <div className="flex flex-col items-center gap-2">
        <SkinPreviewCanvas skinId={skin.id} size="md" anim="idle" />
        <div className="font-pixel text-xs text-white">{skin.name}</div>
        <span className={`text-[10px] font-pixel px-2 py-0.5 ${RARITY_META[skin.rarity].badgeClass}`}>
          {RARITY_META[skin.rarity].labelUz}
        </span>
      </div>
      <div className="bg-slate-900/90 border border-slate-800 p-3 text-xs text-slate-300">
        Sotish narxi:{' '}
        <strong className="text-amber-400 font-mono-num">+{sellPrice.toLocaleString()} Spikey Coins</strong>
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
          BEKOR QILISH
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="pixel-btn bg-amber-600 hover:bg-amber-500 py-2.5 font-pixel text-xs text-white cursor-pointer"
        >
          HA, SOTISH
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

// ===================================================
// 1. SEASON PASS (50 LEVELS) SCREEN
// ===================================================
export const SeasonPassScreen: React.FC<{
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  onClaimLevel: (level: number) => void;
  onBack: () => void;
}> = ({ economy, calendar, onClaimLevel, onBack }) => {
  const levels = useMemo(() => buildSeasonPassLevels(calendar.month), [calendar.month]);
  const curLevel = getSeasonLevelFromXp(economy.seasonXp);
  const curFloorXp = getXpForLevel(curLevel);
  const nextCeilXp = curLevel >= 50 ? curFloorXp : getXpForLevel(curLevel + 1);
  const span = Math.max(1, nextCeilXp - curFloorXp);
  const pct = curLevel >= 50 ? 100 : Math.min(100, Math.round(((economy.seasonXp - curFloorXp) / span) * 100));

  const nextUnclaimed = levels.find(
    (l) => l.level <= curLevel && !economy.claimedSeasonLevels.includes(l.level)
  );
  const nextMilestone = levels.find((l) => l.level > curLevel) ?? levels[levels.length - 1];
  const featuredSkin = getSkinById(calendar.season.featuredSkinId);
  const mythicSkin = getSkinById(calendar.season.mythicSkinId);

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz="SEZON PASS — 50 DARAJA"
          subtitleUz={`${calendar.bannerLine1} · ${calendar.season.subtitleUz}`}
          spikeyCoins={economy.spikeyCoins}
          calendar={calendar}
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
                  SEZON DARAJASI: {curLevel} / 50
                </div>
              </div>
              <div className="text-right font-mono-num text-xs">
                <div className="text-slate-400">Jami Sezon XP</div>
                <div className="text-base font-bold text-sky-300">
                  {economy.seasonXp.toLocaleString()} XP
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono-num">
                <span>{curLevel}-daraja</span>
                <span>
                  {curLevel >= 50
                    ? 'MAKSIMAL DARAJA ZABT ETILDI!'
                    : `${economy.seasonXp - curFloorXp} / ${span} XP (${curLevel + 1}-darajagacha)`}
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
                  {nextUnclaimed ? 'Olishga tayyor mukofot:' : 'Keyingi mukofot:'}{' '}
                </span>
                <strong className="text-amber-300">
                  {nextUnclaimed
                    ? `${nextUnclaimed.level}-daraja · ${nextUnclaimed.labelUz}`
                    : `${nextMilestone.level}-daraja · ${nextMilestone.labelUz}`}
                </strong>
              </div>
              {nextUnclaimed && (
                <button
                  type="button"
                  onClick={() => onClaimLevel(nextUnclaimed.level)}
                  className="pixel-btn bg-emerald-600 hover:bg-emerald-500 px-4 py-2 font-pixel text-xs text-white animate-pulse cursor-pointer"
                >
                  HOZIR OLISH ({nextUnclaimed.level}-DARAJA)
                </button>
              )}
            </div>
          </div>

          <div className="pixel-panel p-4 flex flex-col justify-between gap-3 border-rose-500/60">
            <div className="font-pixel text-xs text-amber-300 flex items-center gap-1.5">
              <Crown className="w-4 h-4" />
              <span>OYNING EKSKLYUZIV SKINLARI</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-900/80 border border-slate-800 p-2 flex flex-col items-center text-center gap-1.5">
                <SkinPreviewCanvas skinId={featuredSkin.id} size="sm" />
                <div className="text-[10px] font-pixel text-sky-300">40-DARAJA</div>
                <div className="text-[11px] text-white font-medium truncate w-full">
                  {featuredSkin.name}
                </div>
              </div>
              <div className="bg-rose-950/35 border border-rose-500/60 p-2 flex flex-col items-center text-center gap-1.5">
                <SkinPreviewCanvas skinId={mythicSkin.id} size="sm" />
                <div className="text-[10px] font-pixel text-rose-400">50-DARAJA MIFIK</div>
                <div className="text-[11px] text-white font-medium truncate w-full">
                  {mythicSkin.name}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Topshiriqlar, bosqichlar, bosslar va kristallar orqali Sezon XP yig‘ing!
            </p>
          </div>
        </div>

        {/* 50-Level Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {levels.map((lvl) => {
            const unlocked = curLevel >= lvl.level;
            const claimed = economy.claimedSeasonLevels.includes(lvl.level);
            const canClaim = unlocked && !claimed;
            return (
              <div
                key={lvl.level}
                className={`pixel-panel p-3 flex flex-col justify-between gap-2.5 ${
                  lvl.level === 50
                    ? 'border-rose-500 bg-rose-950/25'
                    : canClaim
                    ? 'border-emerald-400 bg-emerald-950/25'
                    : claimed
                    ? 'border-slate-700 opacity-75'
                    : lvl.highlight
                    ? 'border-amber-500/60'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-pixel text-white">LVL {lvl.level}</span>
                  {claimed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : !unlocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                </div>

                {lvl.skinId ? (
                  <div className="flex justify-center">
                    <SkinPreviewCanvas skinId={lvl.skinId} size="sm" />
                  </div>
                ) : (
                  <div className="h-12 flex items-center justify-center bg-slate-900/70 border border-slate-800">
                    {lvl.rewardKind === 'coins' ? (
                      <Coins className="w-6 h-6 text-amber-400" />
                    ) : lvl.rewardKind === 'case' ? (
                      <Box className="w-6 h-6 text-purple-400" />
                    ) : (
                      <Gift className="w-6 h-6 text-sky-400" />
                    )}
                  </div>
                )}

                <div className="text-[11px] font-medium text-center text-slate-200 leading-tight min-h-[28px] flex items-center justify-center">
                  {lvl.labelUz}
                </div>

                <button
                  type="button"
                  disabled={!canClaim}
                  onClick={() => onClaimLevel(lvl.level)}
                  className={`pixel-btn w-full py-1.5 font-pixel text-[10px] ${
                    canClaim
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : claimed
                      ? 'bg-slate-800 text-emerald-400 cursor-default'
                      : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {claimed ? 'OLINGAN' : canClaim ? 'OLISH' : `${lvl.xpRequiredCumulative} XP`}
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
// 2. DAILY LOGIN REWARDS (30 DAYS) SCREEN
// ===================================================
export const DailyRewardsScreen: React.FC<{
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  onClaimDaily: () => { ok: boolean; reward?: DailyRewardDef; errorUz?: string };
  onBack: () => void;
}> = ({ economy, calendar, onClaimDaily, onBack }) => {
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
          titleUz="KUNLIK SOVG‘ALAR — 30 KUN"
          subtitleUz="Har kuni o‘yinga kiring va 10, 20, 30-kunlarda Maxsus va MIFIK sovg‘alarni qo‘lga kiriting!"
          spikeyCoins={economy.spikeyCoins}
          calendar={calendar}
          onBack={onBack}
        />

        {/* Streak & Claim Banner */}
        <div className="pixel-panel p-5 flex flex-wrap items-center justify-between gap-4 border-emerald-400/55">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-emerald-300 font-pixel">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>KETMA-KET KIRISH SERIYASI: {status.effectiveStreak} KUN</span>
            </div>
            <div className="text-sm text-slate-200">
              Keyingi sovg‘a ({nextReward.day}-kun):{' '}
              <strong className="text-amber-300">{nextReward.labelUz}</strong>
            </div>
            {status.missedReset && (
              <p className="text-xs text-rose-300">
                Bir kun o‘tkazib yuborilgani uchun seriya 0 dan boshlandi, ammo oldingi olingan sovg‘alaringiz saqlanib qoldi!
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs text-slate-400">
              <div className="flex items-center justify-end gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Yangi kunigacha:</span>
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
                  ? `${status.nextDayNumber}-KUN SOVG‘ASINI OLISH`
                  : 'BUGUNGI OLINGAN'}
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
              AJOYIB!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ===================================================
// 3. MARKETPLACE: SKINS + 27 WEB DESIGNS + ZAI LIMITED + SCHEDULE
// ===================================================
export const MarketplaceScreen: React.FC<{
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  effectiveNow?: Date;
  lang?: string | null;
  initialTab?: 'skins' | 'webs' | 'zai' | 'schedule';
  onBuySkin: (skinId: string) => void;
  onEquipSkin: (skinId: string) => void;
  onSellSkin: (skinId: string) => void;
  onBuyWebDesign: (webId: string) => void;
  onEquipWebDesign: (webId: string) => void;
  onSellWebDesign: (webId: string) => void;
  onOpenEventsScreen?: () => void;
  onBack: () => void;
}> = ({
  economy,
  calendar,
  effectiveNow = new Date(),
  lang,
  initialTab = 'skins',
  onBuySkin,
  onEquipSkin,
  onSellSkin,
  onBuyWebDesign,
  onEquipWebDesign,
  onSellWebDesign,
  onOpenEventsScreen,
  onBack,
}) => {
  const [marketTab, setMarketTab] = useState<'skins' | 'webs' | 'zai' | 'schedule'>(initialTab);
  const [category, setCategory] = useState<SkinCategory>('all');
  const [webColorFilter, setWebColorFilter] = useState<'all' | WebColorId>('all');
  const [webRarityFilter, setWebRarityFilter] = useState<'all' | Rarity>('all');
  const [sellTarget, setSellTarget] = useState<SkinDef | null>(null);
  const [sellWebTarget, setSellWebTarget] = useState<WebDesignDef | null>(null);
  const [previewTarget, setPreviewTarget] = useState<
    | { kind: 'skin'; item: SkinDef }
    | { kind: 'web'; item: WebDesignDef }
    | null
  >(null);

  useEffect(() => {
    setMarketTab(initialTab);
  }, [initialTab]);

  const playerLvl = getPlayerLevelProgress(economy.playerXp ?? 0).level;

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

  const visibleSkins = useMemo(
    () => ALL_SKINS.filter((s) => skinMatchesCategory(s, category)),
    [category]
  );

  const visibleWebs = useMemo(
    () =>
      ALL_WEB_DESIGNS.filter(
        (w) =>
          (webColorFilter === 'all' || w.colorId === webColorFilter) &&
          (webRarityFilter === 'all' || w.rarity === webRarityFilter)
      ),
    [webColorFilter, webRarityFilter]
  );

  const zaiSkins = useMemo(() => ALL_SKINS.filter((s) => s.isZaiLimited), []);
  const zaiWebs = useMemo(() => ALL_WEB_DESIGNS.filter((w) => w.isZaiLimited), []);

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz={tr(lang, 'market')}
          subtitleUz={`${tr(lang, 'playerLevel', { level: playerLvl })} · Skins, 27 Web Designs & ZAI Limited`}
          spikeyCoins={economy.spikeyCoins}
          calendar={calendar}
          onBack={onBack}
        />

        {/* Top 4 Marketplace Section Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
          {(
            [
              { id: 'skins', label: tr(lang, 'tabSkins') },
              { id: 'webs', label: `${tr(lang, 'tabWebDesigns')} (${ALL_WEB_DESIGNS.length})` },
              { id: 'zai', label: tr(lang, 'tabZaiLimited') },
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
              className={`pixel-btn px-4 py-2 font-pixel text-xs cursor-pointer ${
                marketTab === tab.id
                  ? tab.id === 'zai'
                    ? 'bg-amber-600 border-amber-300 text-slate-950 font-bold'
                    : 'bg-sky-600 border-sky-300 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleSkins.map((skin) => {
                const qty = economy.ownedSkins[skin.id] ?? 0;
                const owned = qty > 0;
                const equipped = economy.equippedSkin === skin.id;
                const rarity = RARITY_META[skin.rarity];
                const sellCheck = canSellSkin(economy, skin.id);
                const reqLvl = getSkinMinLevel(skin);
                const levelOk = playerLvl >= reqLvl;
                const eventOpen = !skin.eventId || isZaiEventWindowOpen(skin.eventId, effectiveNow);
                const canAfford = economy.spikeyCoins >= skin.price;
                const canBuyNow = skin.marketPurchasable && levelOk && eventOpen && canAfford;

                return (
                  <div
                    key={skin.id}
                    className={`pixel-panel p-4 flex flex-col justify-between gap-3 ${rarity.borderClass} ${rarity.bgClass}`}
                  >
                    <div className="flex items-start gap-3">
                      <SkinPreviewCanvas
                        skinId={skin.id}
                        size="md"
                        anim={equipped ? 'victory' : 'walk'}
                      />
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
                            <span className="font-mono-num text-[11px] text-emerald-300 font-bold">
                              ×{qty}
                            </span>
                          )}
                        </div>
                        <h3 className="font-pixel text-sm text-white mt-1.5 truncate">
                          {skin.name}
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                          {skin.descriptionUz}
                        </p>
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
                        <span className="text-[10px] font-pixel text-purple-300">SEASON / DROP</span>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSfx('menuClick');
                            setPreviewTarget({ kind: 'skin', item: skin });
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
                            onClick={() => onEquipSkin(skin.id)}
                            className={`pixel-btn px-2.5 py-1.5 font-pixel text-[10px] ${
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
                            onClick={() => onBuySkin(skin.id)}
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
                const eventOpen = !web.eventId || isZaiEventWindowOpen(web.eventId, effectiveNow);
                const canAfford = economy.spikeyCoins >= web.price;
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
                        <span className="text-[10px] font-pixel text-cyan-300">STARTER SILK</span>
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
                            onClick={() => onBuyWebDesign(web.id)}
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

        {/* TAB 3: ZAI LIMITED LUXURY SHOWCASE */}
        {marketTab === 'zai' && (
          <div className="flex flex-col gap-5">
            <div className="pixel-panel border-amber-400 bg-gradient-to-r from-[#12060d] via-[#1c0f05] to-[#081524] p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-pixel text-xs text-amber-300 flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  <span>ZAI LIMITED EDITION · EXCLUSIVE SKINS & WEB DESIGNS</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  12 Monthly ZAI themes & 3 Annual Holiday Drops (June 10, August 23, September 9).
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

            <div>
              <h3 className="font-pixel text-xs text-amber-300 mb-3">
                ZAI LIMITED SKINS ({zaiSkins.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {zaiSkins.map((skin) => {
                  const qty = economy.ownedSkins[skin.id] ?? 0;
                  const owned = qty > 0;
                  const equipped = economy.equippedSkin === skin.id;
                  const reqLvl = getSkinMinLevel(skin);
                  const levelOk = playerLvl >= reqLvl;
                  const eventOpen = !skin.eventId || isZaiEventWindowOpen(skin.eventId, effectiveNow);
                  const canAfford = economy.spikeyCoins >= skin.price;
                  const canBuyNow = levelOk && eventOpen && canAfford;
                  return (
                    <div
                      key={skin.id}
                      className="pixel-panel p-4 border-amber-400/80 bg-gradient-to-br from-slate-950 via-amber-950/25 to-cyan-950/25 flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <SkinPreviewCanvas skinId={skin.id} size="md" anim={equipped ? 'victory' : 'idle'} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-pixel text-[9px] px-1.5 py-0.5 bg-amber-500 text-slate-950 font-bold">
                              ZAI LIMITED
                            </span>
                            <span className="font-pixel text-[9px] text-amber-200">
                              {skin.releaseDateLabel} · LVL {reqLvl}
                            </span>
                          </div>
                          <div className="font-pixel text-xs text-white mt-1.5 truncate">{skin.name}</div>
                          <p className="text-xs text-slate-300 mt-1 line-clamp-2">{skin.descriptionUz}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                        <span className="font-mono-num text-xs font-bold text-amber-300 flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" /> {skin.price.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewTarget({ kind: 'skin', item: skin })}
                            className="pixel-btn bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-200 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {owned && (
                            <button
                              type="button"
                              disabled={equipped}
                              onClick={() => onEquipSkin(skin.id)}
                              className={`pixel-btn px-2.5 py-1.5 font-pixel text-[10px] ${
                                equipped ? 'bg-emerald-700 text-white' : 'bg-sky-600 hover:bg-sky-500 text-white cursor-pointer'
                              }`}
                            >
                              {equipped ? tr(lang, 'equipped') : tr(lang, 'equip')}
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={!canBuyNow}
                            onClick={() => onBuySkin(skin.id)}
                            className={`pixel-btn px-2.5 py-1.5 font-pixel text-[10px] ${
                              canBuyNow
                                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer'
                                : 'bg-slate-900 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {!eventOpen
                              ? tr(lang, 'eventClosed')
                              : !levelOk
                              ? `LVL ${reqLvl}`
                              : tr(lang, 'buy')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

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
                  const eventOpen = !web.eventId || isZaiEventWindowOpen(web.eventId, effectiveNow);
                  const canAfford = economy.spikeyCoins >= web.price;
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
                            onClick={() => onBuyWebDesign(web.id)}
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
          </div>
        )}

        {/* TAB 4: EVENT SCHEDULE OVERVIEW */}
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

      {sellTarget && (
        <SellConfirmModal
          skin={sellTarget}
          sellPrice={RARITY_META[sellTarget.rarity].sellPrice}
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
                +{(sellWebTarget.sellPrice || Math.round(sellWebTarget.price * 0.5)).toLocaleString()} Coins
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
              <SkinPreviewCanvas skinId={previewTarget.item.id} size="lg" anim="victory" />
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
              className="pixel-btn w-full bg-sky-600 hover:bg-sky-500 py-2.5 font-pixel text-xs text-white cursor-pointer"
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
          subtitleUz="Standard, Seasonal & ZAI Limited Cases · Strict RNG + Odds Inspector"
          spikeyCoins={economy.spikeyCoins}
          calendar={calendar}
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
                {CASE_MAP[spinningCase].nameUz}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">
                  {isAnimating ? 'Spinning...' : spinResult.winningSkin.name}
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
          {ALL_CASES.map((c) => {
            const ownedCount = economy.ownedCases[c.type] ?? 0;
            const reqLvl = c.minPlayerLevel ?? 1;
            const levelOk = playerLvl >= reqLvl;
            const eventOpen = !c.eventId || isZaiEventWindowOpen(c.eventId, effectiveNow);
            const evStatus = c.eventId ? getAnnualZaiEventStatus(c.eventId, effectiveNow) : null;
            const canBuy = levelOk && eventOpen && economy.spikeyCoins >= c.price;

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
                      <h3 className="font-pixel text-sm text-white">{c.nameUz}</h3>
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
                <h3 className="font-pixel text-lg text-white mt-0.5">{oddsModalCase.nameUz}</h3>
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
                ? 'MYTHIC JACKPOT!'
                : spinResult.isNewSkin
                ? 'NEW SKIN UNLOCKED!'
                : 'CASE REWARD!'}
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
    { id: 'all', labelUz: 'ALL' },
    { id: 'skins', labelUz: tr(lang, 'tabSkins') },
    { id: 'webs', labelUz: tr(lang, 'tabWebDesigns') },
    { id: 'cases', labelUz: tr(lang, 'cases') },
    { id: 'coins', labelUz: tr(lang, 'spikeyCoins') },
    { id: 'special', labelUz: 'SPECIAL' },
    { id: 'seasonal', labelUz: 'SEASON / ZAI' },
  ];

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz={tr(lang, 'inventory')}
          subtitleUz="Skins, 27 Web Designs, Cases & Spikey Coins"
          spikeyCoins={economy.spikeyCoins}
          calendar={calendar}
          onBack={onBack}
          rightExtra={
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rarity' | 'qty')}
              className="pixel-btn bg-slate-900 px-3 py-2 text-xs text-slate-200"
            >
              <option value="rarity">Sort: Rarity</option>
              <option value="qty">Sort: Quantity</option>
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
                  Stages, daily login, missions, skins & web designs wallet.
                </p>
              </div>
            </div>
            <div className="font-mono-num text-2xl font-bold text-amber-300">
              {economy.spikeyCoins.toLocaleString()}
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
                        <span className="font-pixel text-xs text-white">{c.nameUz}</span>
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
                <span>SPECIAL ITEMS</span>
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
                        USE ITEM
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
                          Sell: {sellCheck.price.toLocaleString()} coins
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
                          Sell: {rm.sellPrice.toLocaleString()} coins
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
                +{(sellWebTarget.sellPrice || Math.round(sellWebTarget.price * 0.5)).toLocaleString()} Coins
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
  onClaimMission: (missionId: string) => void;
  onClaimHolidayGift: () => void;
  onBuySkin: (skinId: string) => void;
  onBack: () => void;
}> = ({ economy, calendar, onClaimMission, onClaimHolidayGift, onBuySkin, onBack }) => {
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
          titleUz="TOPSHIRIQLAR VA BAYRAM TADBIRLARI"
          subtitleUz="Kunlik, haftalik va sezon topshiriqlarini bajarib Spikey Coins hamda Sezon XP oling"
          spikeyCoins={economy.spikeyCoins}
          calendar={calendar}
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
            TOPSHIRIQLAR
          </button>
          <button
            type="button"
            onClick={() => setTab('holiday')}
            className={`pixel-btn px-4 py-2 font-pixel text-xs cursor-pointer ${
              tab === 'holiday' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-300'
            }`}
          >
            BAYRAM TADBIRLARI
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`pixel-btn px-4 py-2 font-pixel text-xs cursor-pointer ${
              tab === 'history' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-300'
            }`}
          >
            TRANZAKSIYALAR TARIXI
          </button>
        </div>

        {tab === 'missions' && (
          <div className="flex flex-col gap-5">
            {(['daily', 'weekly', 'seasonal'] as const).map((period) => {
              const list = ALL_MISSIONS.filter((m) => m.period === period);
              const heading =
                period === 'daily'
                  ? `KUNLIK TOPSHIRIQLAR (Yangilanish: ${countdown})`
                  : period === 'weekly'
                  ? 'HAFTALIK TOPSHIRIQLAR'
                  : `${calendar.bannerLine1} TOPSHIRIQLARI`;
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
                      return (
                        <div
                          key={m.id}
                          className={`pixel-panel p-4 flex flex-col gap-2.5 ${
                            ready ? 'border-emerald-400 bg-emerald-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-pixel text-xs text-white">{m.titleUz}</div>
                              <p className="text-xs text-slate-400 mt-1">{m.descriptionUz}</p>
                            </div>
                            <span className="font-mono-num text-xs text-amber-300 font-bold shrink-0">
                              +{m.rewardCoins} 💰 · +{m.rewardXp} XP
                            </span>
                          </div>
                          <div>
                            <div className="flex justify-between text-[11px] font-mono-num text-slate-400 mb-1">
                              <span>Jarayon</span>
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
                            {claimed ? 'MUKOFOT OLINGAN' : ready ? 'MUKOFOTNI OLISH' : 'BAJARILMOQDA'}
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
                    FAOL BAYRAM TADBIRI · {calendar.bannerLine2}
                  </span>
                  <h3 className="font-pixel text-xl text-white">
                    {calendar.season.eventTitleUz}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-lg">
                    {calendar.season.eventDescUz}
                  </p>
                  <div className="text-xs text-emerald-300 font-mono-num">
                    Bepul bayram sovg‘asi: +{calendar.season.eventGiftCoins} Tanga + 1×{' '}
                    {CASE_MAP[calendar.season.eventGiftCase].nameUz} + 150 XP
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
                  {giftClaimed ? 'BAYRAM SOVG‘ASI OLINGAN' : 'BEPUL SOVG‘ANI OLISH'}
                </button>
                {!(economy.ownedSkins[featuredHolidaySkin.id] > 0) &&
                  featuredHolidaySkin.marketPurchasable && (
                    <button
                      type="button"
                      disabled={economy.spikeyCoins < featuredHolidaySkin.price}
                      onClick={() => onBuySkin(featuredHolidaySkin.id)}
                      className="pixel-btn bg-amber-600 hover:bg-amber-500 disabled:opacity-45 py-2 font-pixel text-[10px] text-white cursor-pointer"
                    >
                      BAYRAM DO‘KONI: {featuredHolidaySkin.price.toLocaleString()} 💰
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
                      Sovg‘a: {h.giftCoins} Tanga + {CASE_MAP[h.giftCase].nameUz}
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
              SO‘NGGI 40 TA TRANZAKSIYA
            </div>
            {economy.transactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Hali tranzaksiyalar mavjud emas.
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
  onBack: () => void;
}> = ({ saveData, economy, calendar, onBack }) => {
  const combined = [...ACHIEVEMENTS, ...ECONOMY_ACHIEVEMENTS];
  const unlockedSet = new Set([
    ...saveData.unlockedAchievements,
    ...economy.unlockedEconomyAchievements,
  ]);

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-6xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz={`YUTUQLAR (${unlockedSet.size}/${combined.length})`}
          subtitleUz="Kampaniya, Sezon Pass, Keyslar, Mifik skinlar va Savdo yutuqlari"
          spikeyCoins={economy.spikeyCoins}
          calendar={calendar}
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
// 8. GLOBAL FIRESTORE LEADERBOARD SCREEN
// ===================================================
export const LeaderboardScreen: React.FC<{
  entries: LeaderboardEntry[];
  loading: boolean;
  currentUid: string | null;
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  onRefresh: () => void;
  onStartTradeWith: (entry: LeaderboardEntry) => void;
  onBack: () => void;
}> = ({
  entries,
  loading,
  currentUid,
  economy,
  calendar,
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
    { key: 'totalCoins', labelUz: 'SPIKEY COINS' },
    { key: 'playerLevel', labelUz: 'PLAYER LVL' },
    { key: 'seasonLevel', labelUz: 'SEZON DARAJASI' },
    { key: 'skinsCount', labelUz: 'SKINLAR SONI' },
    { key: 'bossesDefeatedCount', labelUz: 'BOSSLAR' },
    { key: 'achievementsCount', labelUz: 'YUTUQLAR' },
  ];

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz="GLOBAL REYTING JADVALI"
          subtitleUz="Firebase bulutidagi haqiqiy o‘yinchilar natijalari"
          spikeyCoins={economy.spikeyCoins}
          calendar={calendar}
          onBack={onBack}
          rightExtra={
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 px-3 py-2 font-pixel text-[10px] text-sky-300 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>YANGILASH</span>
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
              {loading
                ? 'Reyting ma’lumotlari yuklanmoqda...'
                : 'Hozircha reytingda o‘yinchilar ko‘rinmadi. Yangilash tugmasini bosing.'}
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
                    <SkinPreviewCanvas skinId={entry.equippedSkin} size="sm" />
                    <div className="min-w-0">
                      <div className="font-pixel text-xs text-white truncate">
                        {entry.nickname} {isMe && <span className="text-sky-400">(SIZ)</span>}
                      </div>
                      <div className="text-[11px] font-mono-num text-slate-400 mt-0.5">
                        LVL {entry.playerLevel ?? 1} · S-LVL {entry.seasonLevel} · {entry.skinsCount} skin · {entry.bossesDefeatedCount} boss · {entry.achievementsCount} ach
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono-num">
                      <div className="text-xs text-amber-300 font-bold">
                        {(entry[sortKey] ?? 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {tabs.find((x) => x.key === sortKey)?.labelUz}
                      </div>
                    </div>
                    {!isMe && currentUid && (
                      <button
                        type="button"
                        onClick={() => onStartTradeWith(entry)}
                        className="pixel-btn bg-purple-700 hover:bg-purple-600 px-2.5 py-1.5 font-pixel text-[10px] text-white cursor-pointer"
                      >
                        SAVDO
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
// 9. REAL FIREBASE PLAYER-TO-PLAYER TRADING SCREEN
// ===================================================
export const TradingScreen: React.FC<{
  isTrialMode: boolean;
  currentUid: string | null;
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  players: LeaderboardEntry[];
  trades: TradeOffer[];
  initialPartnerUid?: string | null;
  onCreateTrade: (recipient: LeaderboardEntry, offeredSkinId: string, requestedSkinId: string) => Promise<void>;
  onAcceptTrade: (trade: TradeOffer) => Promise<void>;
  onRejectTrade: (trade: TradeOffer) => Promise<void>;
  onCancelTrade: (trade: TradeOffer) => Promise<void>;
  onConnectGmail: () => void;
  onBack: () => void;
}> = ({
  isTrialMode,
  currentUid,
  economy,
  calendar,
  players,
  trades,
  initialPartnerUid,
  onCreateTrade,
  onAcceptTrade,
  onRejectTrade,
  onCancelTrade,
  onConnectGmail,
  onBack,
}) => {
  const otherPlayers = useMemo(
    () => players.filter((p) => p.uid !== currentUid),
    [players, currentUid]
  );

  const tradableOwned = useMemo(
    () =>
      Object.entries(economy.ownedSkins)
        .filter(([id, qty]) => {
          if (qty <= 0) return false;
          const s = getSkinById(id);
          if (!s.tradable) return false;
          if (economy.equippedSkin === id && qty <= 1) return false;
          return true;
        })
        .map(([id]) => getSkinById(id)),
    [economy.ownedSkins, economy.equippedSkin]
  );

  const requestableSkins = useMemo(() => ALL_SKINS.filter((s) => s.tradable), []);

  const [partnerUid, setPartnerUid] = useState(initialPartnerUid ?? otherPlayers[0]?.uid ?? '');
  const [offeredSkinId, setOfferedSkinId] = useState(tradableOwned[0]?.id ?? '');
  const [requestedSkinId, setRequestedSkinId] = useState(requestableSkins[0]?.id ?? 'blue_neon');
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (initialPartnerUid) setPartnerUid(initialPartnerUid);
    else if (!partnerUid && otherPlayers[0]) setPartnerUid(otherPlayers[0].uid);
  }, [initialPartnerUid, otherPlayers, partnerUid]);

  useEffect(() => {
    if (!offeredSkinId && tradableOwned[0]) setOfferedSkinId(tradableOwned[0].id);
  }, [offeredSkinId, tradableOwned]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const recipient = otherPlayers.find((p) => p.uid === partnerUid);
    if (!recipient || !offeredSkinId || !requestedSkinId) return;
    setBusy(true);
    setStatusMsg(null);
    try {
      await onCreateTrade(recipient, offeredSkinId, requestedSkinId);
      setStatusMsg({ ok: true, text: `${recipient.nickname} ga savdo taklifi yuborildi!` });
    } catch (err) {
      setStatusMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Savdo taklifini yuborishda xato.',
      });
    } finally {
      setBusy(false);
    }
  };

  const incoming = trades.filter((t) => t.recipientUid === currentUid && t.status === 'pending');
  const outgoing = trades.filter((t) => t.senderUid === currentUid);

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        <ScreenShellHeader
          titleUz="O‘YINCHILAR O‘RTASIDA SAVDO (TRADE)"
          subtitleUz="Firebase buluti orqali xavfsiz skin almashish"
          spikeyCoins={economy.spikeyCoins}
          calendar={calendar}
          onBack={onBack}
        />

        {isTrialMode || !currentUid ? (
          <div className="pixel-panel p-6 border-amber-400/70 text-center flex flex-col items-center gap-3">
            <ArrowLeftRight className="w-8 h-8 text-amber-300" />
            <div className="font-pixel text-sm text-white">SAVDO UCHUN GMAIL AKKAUNT KERAK</div>
            <p className="text-xs text-slate-300 max-w-md">
              Bepul sinov rejimida boshqa o‘yinchilar bilan skin almashib bo‘lmaydi. Real Firebase savdo tizimini ochish uchun Gmail akkauntingizni ulang.
            </p>
            <button
              type="button"
              onClick={onConnectGmail}
              className="pixel-btn bg-sky-600 hover:bg-sky-500 px-5 py-2.5 font-pixel text-xs text-white cursor-pointer"
            >
              CONNECT YOUR GMAIL
            </button>
          </div>
        ) : (
          <>
            {/* New Trade Offer Form */}
            <form onSubmit={handleSend} className="pixel-panel p-5 flex flex-col gap-4 border-purple-500/60">
              <div className="font-pixel text-xs text-purple-300 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4" />
                <span>YANGI SAVDO TAKLIFI YUBORISH</span>
              </div>

              {tradableOwned.length === 0 ? (
                <p className="text-xs text-amber-300">
                  Sizda savdoga qo‘yish uchun bo‘sh (kiyilmagan va almashtiriladigan) skin yo‘q. Avval Marketdan yoki Keyslardan skin oling!
                </p>
              ) : otherPlayers.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Hozircha reytingda boshqa o‘yinchilar ro‘yxati bo‘sh. Boshqa o‘yinchi tizimga kirganidan keyin bu yerda paydo bo‘ladi.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400">O‘yinchini tanlang:</span>
                    <select
                      value={partnerUid}
                      onChange={(e) => setPartnerUid(e.target.value)}
                      className="pixel-btn bg-slate-900 px-3 py-2 text-white"
                    >
                      {otherPlayers.map((p) => (
                        <option key={p.uid} value={p.uid}>
                          {p.nickname} ({p.skinsCount} skin)
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400">Siz beradigan skin:</span>
                    <select
                      value={offeredSkinId}
                      onChange={(e) => setOfferedSkinId(e.target.value)}
                      className="pixel-btn bg-slate-900 px-3 py-2 text-white"
                    >
                      {tradableOwned.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({RARITY_META[s.rarity].labelUz})
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400">Siz so‘raydigan skin:</span>
                    <select
                      value={requestedSkinId}
                      onChange={(e) => setRequestedSkinId(e.target.value)}
                      className="pixel-btn bg-slate-900 px-3 py-2 text-white"
                    >
                      {requestableSkins.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({RARITY_META[s.rarity].labelUz})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {statusMsg && (
                <div
                  className={`px-3 py-2 text-xs border ${
                    statusMsg.ok
                      ? 'border-emerald-500/60 bg-emerald-950/40 text-emerald-200'
                      : 'border-rose-500/60 bg-rose-950/40 text-rose-200'
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={busy || tradableOwned.length === 0 || otherPlayers.length === 0}
                className="pixel-btn self-start bg-purple-600 hover:bg-purple-500 disabled:opacity-45 px-5 py-2.5 font-pixel text-xs text-white cursor-pointer"
              >
                {busy ? 'YUBORILMOQDA...' : 'SAVDO TAKLIFINI YUBORISH'}
              </button>
            </form>

            {/* Incoming Trade Offers */}
            <div className="flex flex-col gap-3">
              <h3 className="font-pixel text-xs text-emerald-300">
                KIRUVCHI SAVDO TAKLIFLARI ({incoming.length})
              </h3>
              {incoming.length === 0 ? (
                <div className="pixel-panel p-4 text-xs text-slate-400">
                  Hozircha kiruvchi savdo takliflari yo‘q.
                </div>
              ) : (
                incoming.map((t) => {
                  const offSkin = getSkinById(t.offeredSkinId);
                  const reqSkin = getSkinById(t.requestedSkinId);
                  return (
                    <div
                      key={t.tradeId}
                      className="pixel-panel p-4 flex flex-wrap items-center justify-between gap-4 border-emerald-500/50"
                    >
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <SkinPreviewCanvas skinId={offSkin.id} size="sm" />
                          <div>
                            <div className="text-slate-400">{t.senderNickname} beradi:</div>
                            <div className="font-pixel text-emerald-300">{offSkin.name}</div>
                          </div>
                        </div>
                        <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                        <div className="flex items-center gap-2">
                          <SkinPreviewCanvas skinId={reqSkin.id} size="sm" />
                          <div>
                            <div className="text-slate-400">Sizdan so‘raydi:</div>
                            <div className="font-pixel text-amber-300">{reqSkin.name}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            setStatusMsg(null);
                            try {
                              await onAcceptTrade(t);
                              setStatusMsg({ ok: true, text: 'Savdo muvaffaqiyatli amalga oshirildi!' });
                            } catch (err) {
                              setStatusMsg({
                                ok: false,
                                text: err instanceof Error ? err.message : 'Qabul qilishda xato.',
                              });
                            } finally {
                              setBusy(false);
                            }
                          }}
                          className="pixel-btn bg-emerald-600 hover:bg-emerald-500 px-3 py-2 font-pixel text-[10px] text-white cursor-pointer"
                        >
                          QABUL QILISH
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            await onRejectTrade(t);
                            setBusy(false);
                          }}
                          className="pixel-btn bg-rose-800 hover:bg-rose-700 px-3 py-2 font-pixel text-[10px] text-white cursor-pointer"
                        >
                          RAD ETISH
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Outgoing Trade Offers */}
            <div className="flex flex-col gap-3">
              <h3 className="font-pixel text-xs text-sky-300">
                YUBORILGAN SAVDOLAR ({outgoing.length})
              </h3>
              {outgoing.length === 0 ? (
                <div className="pixel-panel p-4 text-xs text-slate-400">
                  Siz yuborgan savdo takliflari yo‘q.
                </div>
              ) : (
                outgoing.map((t) => (
                  <div
                    key={t.tradeId}
                    className="pixel-panel p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="text-slate-400">Kimga:</span>{' '}
                      <strong className="text-white">{t.recipientNickname}</strong> ·{' '}
                      <span className="text-sky-300">{getSkinById(t.offeredSkinId).name}</span> ⇄{' '}
                      <span className="text-amber-300">{getSkinById(t.requestedSkinId).name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-pixel text-[10px] px-2 py-1 ${
                          t.status === 'completed' || t.status === 'accepted'
                            ? 'bg-emerald-900/70 text-emerald-300'
                            : t.status === 'pending'
                            ? 'bg-amber-900/70 text-amber-300'
                            : 'bg-rose-900/70 text-rose-300'
                        }`}
                      >
                        {t.status === 'pending'
                          ? 'KUTILMOQDA'
                          : t.status === 'completed' || t.status === 'accepted'
                          ? 'YAKUNLANDI'
                          : t.status === 'rejected'
                          ? 'RAD ETILGAN'
                          : 'BEKOR QILINGAN'}
                      </span>
                      {t.status === 'pending' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            setBusy(true);
                            await onCancelTrade(t);
                            setBusy(false);
                          }}
                          className="pixel-btn bg-slate-800 hover:bg-rose-900 px-2.5 py-1 font-pixel text-[10px] text-slate-200 cursor-pointer"
                        >
                          BEKOR QILISH
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
