import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Compass,
  Crosshair,
  RotateCcw,
  Shield,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from 'lucide-react';
import { audio } from '../game/audio';
import { CHAPTER2_SECTOR_MAP } from '../game/chapter2Levels';
import { Chapter2ClearSummary, SaveData } from '../game/types';

export const Chapter2SurveyModal: React.FC<{
  onAcceptChapter2: (rating: 'awesome' | 'challenging' | 'hard') => void;
  onDeclineChapter2: (rating: 'awesome' | 'challenging' | 'hard') => void;
}> = ({ onAcceptChapter2, onDeclineChapter2 }) => {
  const [rating, setRating] = useState<'awesome' | 'challenging' | 'hard'>('awesome');

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/88 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ch2-survey-title"
    >
      <div className="pixel-panel w-full max-w-xl bg-[#070b18] border-cyan-400/70 p-6 sm:p-7 flex flex-col gap-5">
        <div className="flex flex-col gap-2 text-center border-b border-slate-800 pb-4">
          <div className="text-xs font-medium tracking-wide text-cyan-300">
            Campaign Complete · Endgame Survey
          </div>
          <h2
            id="ch2-survey-title"
            className="font-pixel text-2xl sm:text-3xl text-white leading-snug"
            style={{ textWrap: 'balance' }}
          >
            Do you want to proceed to Chapter 2?
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Chapter 2 opens an all-new Astral Void mode that plays completely differently from Chapter 1.
          </p>
        </div>

        {/* Quick 1-tap Endgame Survey */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-slate-300">
            Quick Survey · How was your Chapter 1 adventure?
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'awesome' as const, label: 'Awesome!' },
              { id: 'challenging' as const, label: 'Challenging' },
              { id: 'hard' as const, label: 'Very Hard' },
            ].map((opt) => {
              const active = rating === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    audio.playSfx('menuClick');
                    setRating(opt.id);
                  }}
                  className={`pixel-btn px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-cyan-600 border-cyan-300 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {active && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* What makes Chapter 2 completely different */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 flex flex-col gap-3">
          <div className="text-xs font-semibold text-cyan-300">
            Chapter 2: Astral Void · Completely New Experience
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <Compass className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>360° Top-Down Zero-G Cosmic Arena</span>
            </div>
            <div className="flex items-start gap-2">
              <Crosshair className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Free Aim Bolts, Phase Blink & Pylon Slingshot</span>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-fuchsia-400 shrink-0 mt-0.5" />
              <span>Solar Lasers, Wormholes & Cyber-Widow Boss</span>
            </div>
          </div>
        </div>

        {/* Yes / No English Choice */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              audio.unlock();
              audio.playSfx('mythicFanfare');
              onAcceptChapter2(rating);
            }}
            className="flex-1 pixel-btn min-h-[46px] bg-cyan-500 hover:bg-cyan-400 border-cyan-200 px-5 py-3 font-pixel text-xs text-slate-950 font-bold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <span>Yes, Enter Chapter 2</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => {
              audio.playSfx('menuClick');
              onDeclineChapter2(rating);
            }}
            className="pixel-btn min-h-[46px] bg-slate-800 hover:bg-slate-700 border-slate-600 px-5 py-3 font-pixel text-xs text-slate-200 cursor-pointer whitespace-nowrap"
          >
            No, Stay Here
          </button>
        </div>
      </div>
    </div>
  );
};

export const Chapter2SectorClearModal: React.FC<{
  summary: Chapter2ClearSummary;
  onNextSector: () => void;
  onReplay: () => void;
  onMenu: () => void;
}> = ({ summary, onNextSector, onReplay, onMenu }) => {
  const nextSec = summary.nextSectorId
    ? CHAPTER2_SECTOR_MAP[summary.nextSectorId]
    : null;

  return (
    <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center p-4">
      <div className="pixel-panel w-full max-w-md bg-[#060b18] border-cyan-400/70 p-6 flex flex-col gap-5">
        <div className="text-center border-b border-slate-800 pb-3">
          <div className="text-xs font-medium text-cyan-300">
            Chapter 2 · Sector Cleared
          </div>
          <h2 className="font-pixel text-2xl text-white mt-1">{summary.sectorName}</h2>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {[1, 2, 3].map((idx) => (
              <Star
                key={idx}
                className={`w-5 h-5 ${
                  idx <= summary.stars
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 p-3 flex items-center justify-between">
            <span className="text-slate-400">Spikey Coins</span>
            <span className="font-mono-num font-bold text-amber-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> +{summary.coinsEarned}
            </span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3 flex items-center justify-between">
            <span className="text-slate-400">Time · Score</span>
            <span className="font-mono-num font-bold text-white">
              {summary.timeSec}s · {summary.scoreEarned}
            </span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3 flex items-center justify-between">
            <span className="text-slate-400">Enemies</span>
            <span className="font-mono-num font-bold text-cyan-300">
              {summary.enemiesDefeatedCount}
            </span>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3 flex items-center justify-between">
            <span className="text-slate-400">No Damage</span>
            <span className="font-mono-num font-bold text-emerald-300">
              {summary.noDamageBonus ? 'YES' : 'NO'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {nextSec && (
            <button
              type="button"
              onClick={onNextSector}
              className="pixel-btn bg-cyan-500 hover:bg-cyan-400 py-3 font-pixel text-xs text-slate-950 font-bold cursor-pointer"
            >
              Next Sector: {nextSec.id} · {nextSec.name}
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onReplay}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2.5 font-pixel text-[11px] text-slate-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>
            <button
              type="button"
              onClick={onMenu}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 py-2.5 font-pixel text-[11px] text-slate-200 cursor-pointer"
            >
              Main Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Chapter2GameOverModal: React.FC<{
  score: number;
  coins: number;
  onRetry: () => void;
  onMenu: () => void;
}> = ({ score, coins, onRetry, onMenu }) => (
  <div className="fixed inset-0 z-40 bg-black/85 flex items-center justify-center p-4">
    <div className="pixel-panel w-full max-w-sm bg-[#0b0714] border-rose-500/70 p-6 flex flex-col gap-5 text-center">
      <div>
        <div className="text-xs text-rose-300 mb-1">Chapter 2 · Astral Void</div>
        <h2 className="font-pixel text-2xl text-rose-400">HULL CRITICAL</h2>
      </div>
      <div className="flex justify-center gap-6 text-xs font-mono-num">
        <span className="text-slate-300">Score: {score}</span>
        <span className="text-amber-400">Coins: +{coins}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onRetry}
          className="pixel-btn bg-rose-600 hover:bg-rose-500 py-3 font-pixel text-xs text-white cursor-pointer"
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={onMenu}
          className="pixel-btn bg-slate-900 hover:bg-slate-800 py-2.5 font-pixel text-xs text-slate-300 cursor-pointer"
        >
          Main Menu
        </button>
      </div>
    </div>
  </div>
);

export const Chapter2VictoryScreen: React.FC<{
  saveData: SaveData;
  onPlayAgain: () => void;
  onMenu: () => void;
}> = ({ saveData, onPlayAgain, onMenu }) => {
  const sectorsDone = Object.values(saveData.chapter2Progress ?? {}).filter(
    (p) => p.completed
  ).length;
  const totalStars = Object.values(saveData.chapter2Progress ?? {}).reduce(
    (acc, p) => acc + (p.stars ?? 0),
    0
  );

  return (
    <div className="w-full h-full bg-[#040814] flex items-center justify-center p-6">
      <div className="pixel-panel w-full max-w-lg bg-[#070d1f] border-cyan-400/70 p-7 flex flex-col gap-5 text-center">
        <div className="flex flex-col items-center gap-2">
          <Trophy className="w-11 h-11 text-cyan-300" />
          <div className="text-xs font-medium text-cyan-300">
            Chapter 2 Complete · Chronos Cyber-Widow Defeated
          </div>
          <h2 className="font-pixel text-2xl sm:text-3xl text-white">
            ASTRAL VOID MASTERED!
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            You conquered every 360° Cosmic Arena sector and shattered the Chronos Cyber-Widow core.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 text-xs">
          <div className="bg-slate-900/90 border border-slate-800 p-3">
            <div className="text-slate-400">Sectors</div>
            <div className="font-mono-num font-bold text-cyan-300 text-base mt-0.5">
              {sectorsDone}/5
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3">
            <div className="text-slate-400">Stars</div>
            <div className="font-mono-num font-bold text-amber-300 text-base mt-0.5">
              {totalStars}/15
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3">
            <div className="text-slate-400">Total Score</div>
            <div className="font-mono-num font-bold text-white text-base mt-0.5">
              {saveData.totalScore.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 pixel-btn bg-cyan-500 hover:bg-cyan-400 py-3 font-pixel text-xs text-slate-950 font-bold cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            <span>Replay Chapter 2</span>
          </button>
          <button
            type="button"
            onClick={onMenu}
            className="flex-1 pixel-btn bg-slate-800 hover:bg-slate-700 py-3 font-pixel text-xs text-slate-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
