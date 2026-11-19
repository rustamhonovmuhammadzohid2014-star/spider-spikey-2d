import React from 'react';
import { Pause, Heart, Coins, Gem, Shield, Sparkles } from 'lucide-react';
import { tr } from '../game/i18n';
import {
  ABILITY_META,
  AbilityId,
  HudSnapshot,
  WORLD_THEMES,
} from '../game/types';

export type VirtualButtonKey =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'jump'
  | 'sprint'
  | 'webAttack'
  | 'special'
  | 'interact'
  | 'webSwing'
  | 'webNet';

interface HUDProps {
  hud: HudSnapshot;
  lang?: string | null;
  showTouchControls: boolean;
  onPause: () => void;
  onToggleSpecial: () => void;
  onVirtualButton: (key: VirtualButtonKey, active: boolean) => void;
}

export const HUD: React.FC<HUDProps> = ({
  hud,
  lang,
  showTouchControls,
  onPause,
  onToggleSpecial,
  onVirtualButton,
}) => {
  const theme = WORLD_THEMES[hud.worldId];

  const abilitySlots: { id: AbilityId; cd: number }[] = [
    { id: 'webShot', cd: hud.cooldowns.webShot },
    { id: hud.activeSpecial, cd: hud.activeSpecial === 'magicWeb' ? hud.cooldowns.magicWeb : hud.cooldowns.webTrap },
    { id: 'spiderDash', cd: hud.cooldowns.spiderDash },
    { id: 'webSwing', cd: 0 },
  ];

  const bindTouch = (key: VirtualButtonKey) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      onVirtualButton(key, true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      onVirtualButton(key, false);
    },
    onPointerCancel: () => onVirtualButton(key, false),
  });

  const totalSpikeyCoins = (hud.spikeyCoinsTotal ?? 0) + hud.coins;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-4">
      {/* YUQORI PANEL HUD */}
      <div className="flex items-start justify-between gap-3">
        {/* Chap yuqori: Yuraklar, Jonlar va Dunyo/Bosqich */}
        <div className="pointer-events-auto pixel-panel px-3 py-2 flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1" aria-label={`Sog‘liq ${hud.hp} / ${hud.maxHp}`}>
              {Array.from({ length: hud.maxHp }).map((_, i) => {
                const filled = i < hud.hp;
                return (
                  <Heart
                    key={i}
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-150 ${
                      filled
                        ? 'text-red-500 fill-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.55)]'
                        : 'text-slate-600 fill-slate-800'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="font-mono-num text-xs sm:text-sm font-bold text-slate-200">
              JONLAR ×{hud.lives}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-300">
            <span className="font-pixel text-sky-400 whitespace-nowrap">{hud.stageId}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate max-w-[160px] sm:max-w-none">{theme.name} — {hud.stageName}</span>
          </div>
        </div>

        {/* Markaziy yuqori: Qobiliyatlar sovishi */}
        <div className="hidden md:flex items-center gap-2 pointer-events-auto pixel-panel px-2.5 py-1.5">
          {abilitySlots.map(({ id, cd }) => {
            const unlocked = hud.unlockedAbilities[id];
            const meta = ABILITY_META[id];
            const isSpecialSlot = id === 'webTrap' || id === 'magicWeb';
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (isSpecialSlot) onToggleSpecial();
                }}
                title={`${meta.name} (${meta.keyHint})`}
                disabled={!unlocked}
                className={`relative px-2 py-1 border text-left transition-colors ${
                  unlocked
                    ? 'border-slate-600 bg-slate-800/80 hover:border-sky-400'
                    : 'border-slate-800 bg-slate-900/60 opacity-40 cursor-not-allowed'
                }`}
              >
                <div
                  className="absolute inset-x-0 bottom-0 bg-sky-400/25 transition-all"
                  style={{ height: `${Math.min(100, Math.max(0, cd * 100))}%` }}
                />
                <div className="relative flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 shrink-0"
                    style={{ backgroundColor: unlocked ? meta.color : '#475569' }}
                  />
                  <span className="font-pixel text-[10px] text-slate-100 whitespace-nowrap">
                    {meta.name}
                  </span>
                  <span className="font-mono-num text-[10px] text-slate-400">
                    {meta.keyHint}
                  </span>
                </div>
              </button>
            );
          })}
          <div
            title={tr(lang, 'tutHouseDesc')}
            className={`relative px-2 py-1 border text-left ${
              hud.spiderHouseProgress !== null && hud.spiderHouseProgress !== undefined
                ? 'border-sky-400 bg-sky-950/70'
                : 'border-slate-600 bg-slate-800/80'
            }`}
          >
            <div className="relative flex items-center gap-1.5">
              <span className="w-2 h-2 shrink-0 bg-sky-200" />
              <span className="font-pixel text-[10px] text-slate-100 whitespace-nowrap">
                {hud.spiderHouseProgress !== null && hud.spiderHouseProgress !== undefined
                  ? `${tr(lang, 'houseWeavingHud')} ${Math.round(hud.spiderHouseProgress * 100)}%`
                  : hud.webAttached
                  ? tr(lang, 'webAttachedHud')
                  : tr(lang, 'webReadyHud')}
              </span>
              <span className="font-mono-num text-[10px] text-slate-400">E / Q</span>
            </div>
          </div>
        </div>

        {/* O‘ng yuqori: Spikey Coins, Bosqich tangasi, Kristallar, Ball va Pauza */}
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="pixel-panel px-3 py-2 flex items-center gap-3 text-xs sm:text-sm">
            <div
              className="flex items-center gap-1.5 font-mono-num font-bold text-amber-300"
              title="Spikey Coins balansi (+bosqichdagi tangalar)"
            >
              <Coins className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{totalSpikeyCoins.toLocaleString()}</span>
              {hud.coins > 0 && (
                <span className="text-[10px] text-emerald-300">(+{hud.coins})</span>
              )}
            </div>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <div className="flex items-center gap-1" aria-label="Sehrli Kristallar">
              {hud.crystalsCollected.map((got, idx) => (
                <Gem
                  key={idx}
                  className={`w-4 h-4 ${
                    got
                      ? 'text-purple-400 fill-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.7)]'
                      : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
            <span className="hidden sm:inline text-slate-600" aria-hidden="true">·</span>
            <span className="hidden sm:inline font-mono-num font-bold text-slate-100">
              {hud.score.toString().padStart(5, '0')}
            </span>
          </div>

          <button
            type="button"
            onClick={onPause}
            aria-label="O‘yinni to‘xtatish"
            className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-100 p-2.5 sm:px-3 sm:py-2.5 flex items-center gap-1.5"
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline font-pixel text-[10px]">PAUZA</span>
          </button>
        </div>
      </div>

      {/* MARKAZIY XABARLAR VA MASLAHATLAR */}
      <div className="flex flex-col items-center gap-2 my-auto pointer-events-none">
        {hud.bannerText && (
          <div className="pixel-panel px-4 py-2 bg-slate-950/90 border-sky-400/60 text-center max-w-xl">
            <p className="font-pixel text-xs sm:text-sm text-sky-300 tracking-wide">
              {hud.bannerText}
            </p>
          </div>
        )}
        {hud.promptHint && (
          <div className="pixel-panel px-3 py-1 bg-slate-950/90 border-amber-400/70">
            <span className="font-pixel text-[11px] text-amber-300">{hud.promptHint}</span>
          </div>
        )}
      </div>

      {/* PASTKI QISM: BOSS JONI VA MOBIL BOSHQARUV */}
      <div className="flex flex-col gap-3">
        {hud.boss && hud.boss.active && (
          <div className="mx-auto w-full max-w-lg pixel-panel px-4 py-2 bg-slate-950/90 border-rose-500/70">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-pixel text-rose-400 tracking-wide">
                {hud.boss.name}
              </span>
              <span className="font-mono-num text-slate-300">
                Bosqich {hud.boss.phase} · {hud.boss.hp}/{hud.boss.maxHp}
              </span>
            </div>
            <div className="h-3 w-full bg-slate-900 border border-slate-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-150"
                style={{ width: `${Math.max(0, (hud.boss.hp / hud.boss.maxHp) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {showTouchControls && (
          <div className="pointer-events-auto flex items-end justify-between gap-3 pb-1 select-none touch-none">
            {/* Chap / O‘ng + Tepaga / Pastga tirmashish */}
            <div className="flex items-end gap-2">
              <button
                type="button"
                aria-label="Chapga yurish"
                {...bindTouch('left')}
                className="pixel-btn w-13 h-13 bg-slate-900/80 active:bg-sky-500/40 text-slate-100 font-pixel text-lg flex items-center justify-center"
              >
                ◀
              </button>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  aria-label="Yuqoriga chiqish"
                  {...bindTouch('up')}
                  className="pixel-btn w-12 h-11 bg-emerald-950/80 active:bg-emerald-500/40 text-emerald-300 font-pixel text-xs flex items-center justify-center"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="Pastga tushish"
                  {...bindTouch('down')}
                  className="pixel-btn w-12 h-11 bg-slate-900/80 active:bg-emerald-500/40 text-slate-300 font-pixel text-xs flex items-center justify-center"
                >
                  ▼
                </button>
              </div>
              <button
                type="button"
                aria-label="O‘ngga yurish"
                {...bindTouch('right')}
                className="pixel-btn w-13 h-13 bg-slate-900/80 active:bg-sky-500/40 text-slate-100 font-pixel text-lg flex items-center justify-center"
              >
                ▶
              </button>
            </div>

            {/* Harakat tugmalari: To‘r, Uchish, Shiddat, Maxsus, O‘q, Sakrash */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                aria-label="5 yo‘nalishli to‘r to‘qish"
                {...bindTouch('webNet')}
                className="pixel-btn w-13 h-12 bg-slate-800/90 active:bg-slate-400/40 text-slate-100 font-pixel text-[9px] flex flex-col items-center justify-center"
              >
                <span>TO‘R</span>
                <span className="text-[8px] opacity-75">E</span>
              </button>
              <button
                type="button"
                aria-label="To‘rda uchish"
                {...bindTouch('webSwing')}
                className="pixel-btn w-13 h-12 bg-amber-950/85 active:bg-amber-500/40 text-amber-300 font-pixel text-[9px] flex flex-col items-center justify-center"
              >
                <span>UCHISH</span>
                <span className="text-[8px] opacity-75">Q</span>
              </button>
              <button
                type="button"
                aria-label="O‘rgimchak shiddati"
                {...bindTouch('sprint')}
                className="pixel-btn w-13 h-12 bg-pink-950/85 active:bg-pink-500/40 text-pink-300 font-pixel text-[8px] flex flex-col items-center justify-center"
              >
                <span>SHIDDAT</span>
                <span className="text-[8px] opacity-75">SHIFT</span>
              </button>
              <button
                type="button"
                aria-label="Maxsus qobiliyat"
                {...bindTouch('special')}
                className="pixel-btn w-13 h-13 bg-purple-950/85 active:bg-purple-500/40 text-purple-300 font-pixel text-[9px] flex flex-col items-center justify-center"
              >
                <Sparkles className="w-3.5 h-3.5 mb-0.5" />
                <span>MAXSUS</span>
              </button>
              <button
                type="button"
                aria-label="To‘r otish"
                {...bindTouch('webAttack')}
                className="pixel-btn w-13 h-13 bg-sky-950/85 active:bg-sky-500/40 text-sky-300 font-pixel text-[9px] flex flex-col items-center justify-center"
              >
                <Shield className="w-3.5 h-3.5 mb-0.5" />
                <span>TO‘R</span>
              </button>
              <button
                type="button"
                aria-label="Sakrash"
                {...bindTouch('jump')}
                className="pixel-btn w-13 h-13 bg-rose-950/85 active:bg-rose-500/40 text-rose-200 font-pixel text-[9px] flex items-center justify-center"
              >
                SAKRASH
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
