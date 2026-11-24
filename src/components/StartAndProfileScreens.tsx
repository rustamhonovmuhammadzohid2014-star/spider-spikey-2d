import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Crown,
  Download,
  Globe,
  ImagePlus,
  Lock,
  Package,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  User,
  Users,
} from 'lucide-react';
import { audio } from '../game/audio';
import { getLanguageDef, tr } from '../game/i18n';
import {
  BUILTIN_AVATARS,
  NicknameErrorCode,
  PROFILE_FRAMES,
  getBuiltInAvatarById,
  loadAllLocalProfiles,
  resizeAvatarImageFile,
  validateNickname,
} from '../game/localPersistence';
import { drawSeasonalMenuScene } from '../game/sprites';
import {
  EconomyData,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  SaveData,
  UserProfileData,
} from '../game/types';
import { AvatarBadge } from './AvatarBadge';
import { CreatorKeyModal, CreatorLoginResult } from './FriendsAndAdminModals';
import { SkinPreviewCanvas } from './SkinPreviewCanvas';

function mapNicknameError(lang: string | null | undefined, code?: NicknameErrorCode): string {
  switch (code) {
    case 'empty':
      return tr(lang, 'nicknameErrorEmpty');
    case 'too_short':
    case 'too_long':
      return tr(lang, 'nicknameErrorLength');
    case 'invalid_chars':
      return tr(lang, 'nicknameErrorInvalid');
    case 'inappropriate':
      return tr(lang, 'nicknameErrorProfane');
    case 'duplicate':
      return tr(lang, 'nicknameErrorDuplicate');
    default:
      return '';
  }
}

interface WinterStartScreenProps {
  lang: string | null;
  activeProfile: UserProfileData | null;
  economy: EconomyData;
  onContinue: () => void;
  onOpenLanguage: () => void;
}

export const WinterStartScreen: React.FC<WinterStartScreenProps> = ({
  lang,
  activeProfile,
  economy,
  onContinue,
  onOpenLanguage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const langDef = getLanguageDef(lang);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        // Always launch in Winter Theme (Month 1 snowy wonderland)
        drawSeasonalMenuScene(ctx, 1, t * 22, t, economy.equippedSkin || 'classic');
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [economy.equippedSkin]);

  return (
    <div className="relative w-full h-screen min-h-[580px] overflow-hidden bg-[#06101f] flex flex-col justify-between">
      <canvas
        ref={canvasRef}
        width={LOGICAL_WIDTH}
        height={LOGICAL_HEIGHT}
        className="pixelated absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#040914]/75 via-[#071529]/45 to-[#030711]/92" />

      {/* Top Strip: Winter Edition Badge + Quick Language Switcher */}
      <div className="relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-8 pt-5 flex items-center justify-between gap-3">
        <div className="pixel-panel px-3 py-2 bg-slate-950/85 border-sky-400/55 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-300" />
          <span className="font-pixel text-[10px] sm:text-xs text-sky-200 tracking-wider">
            {tr(lang, 'winterTheme')} · ZAI LIMITED
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            audio.playSfx('menuClick');
            onOpenLanguage();
          }}
          className="pixel-btn min-h-[44px] px-3.5 py-2 bg-slate-950/85 hover:bg-slate-800 border-slate-600 text-slate-100 font-pixel text-[10px] sm:text-xs flex items-center gap-2 cursor-pointer"
        >
          <Globe className="w-4 h-4 text-sky-400" />
          <span>{langDef.flag}</span>
          <span>{langDef.nativeName}</span>
        </button>
      </div>

      {/* Center Hero Title & Continue Action */}
      <div className="relative z-10 max-w-3xl w-full mx-auto px-4 flex flex-col items-center text-center gap-5 my-auto">
        <div className="pixel-panel p-2 bg-slate-950/80 border-sky-400/60 shadow-[0_0_40px_rgba(56,189,248,0.28)]">
          <SkinPreviewCanvas
            skinId={economy.equippedSkin || 'classic'}
            size="lg"
            anim="idle"
            className="border-0"
          />
        </div>

        <div className="space-y-2.5">
          <div className="font-pixel text-[10px] sm:text-xs text-amber-300 tracking-[0.25em] drop-shadow">
            WINTER SNOW EDITION · ULTIMATE MASTER UPDATE
          </div>
          <h1 className="font-pixel text-3xl sm:text-5xl md:text-6xl text-white tracking-wider drop-shadow-[0_4px_0_#0c4a6e]">
            SPIDER <span className="text-sky-300">SPIKEY</span>
          </h1>
          <p className="text-xs sm:text-sm text-sky-100/90 max-w-xl mx-auto leading-relaxed">
            {tr(lang, 'winterContinueSub')}
          </p>
        </div>

        {activeProfile && (
          <div className="pixel-panel px-4 py-2.5 bg-slate-950/90 border-emerald-400/60 flex items-center gap-3">
            <AvatarBadge
              avatarId={activeProfile.isCreator ? 'av_classic_spikey' : activeProfile.avatarId}
              customAvatarDataUrl={activeProfile.isCreator ? null : activeProfile.customAvatarDataUrl}
              profileFrameId={economy.equippedProfileFrame || activeProfile.profileFrame}
              size="sm"
            />
            <div className="text-left">
              <div className="font-pixel text-[10px] text-emerald-300 flex items-center gap-1.5">
                <span>{tr(lang, 'returningHeroWelcome', { name: activeProfile.nickname })}</span>
                {activeProfile.isCreator && (
                  <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[8px] font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{tr(lang, 'creatorVipBadge')}</span>
                  </span>
                )}
              </div>
              <div className="font-mono-num text-xs text-slate-300 mt-0.5">
                {activeProfile.isCreator ? (
                  <span className="text-amber-300">{tr(lang, 'adminPasswordRequiredMsg')}</span>
                ) : (
                  <>
                    {tr(lang, 'playerLevel', { level: economy.playerLevel ?? 1 })} ·{' '}
                    {economy.spikeyCoins.toLocaleString()} {tr(lang, 'spikeyCoins')}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            audio.playSfx('menuClick');
            onContinue();
          }}
          className="pixel-btn min-h-[54px] px-10 sm:px-14 py-4 bg-gradient-to-r from-sky-500 via-cyan-500 to-sky-400 hover:from-sky-400 hover:to-cyan-300 border-white text-slate-950 font-pixel text-sm sm:text-lg tracking-wider flex items-center gap-3 shadow-[0_0_32px_rgba(56,189,248,0.55)] cursor-pointer transition-transform active:translate-y-0.5"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>{tr(lang, 'continueBtn')}</span>
        </button>
      </div>

      {/* Bottom Footer */}
      <div className="relative z-10 px-4 pb-5 text-center text-[11px] text-slate-300/80">
        {tr(lang, 'localDeviceNotice')}
      </div>
    </div>
  );
};

interface LocalAccountSetupScreenProps {
  lang: string | null;
  onCreateAccount: (payload: {
    nickname: string;
    avatarId: string;
    customAvatarDataUrl: string | null;
  }) => { migratedLegacy: boolean };
  onCreatorLogin?: (result: CreatorLoginResult) => void;
  onFinishSetup?: (target: 'CASES' | 'TITLE_MENU') => void;
  onBackToLanguage: () => void;
}

export const LocalAccountSetupScreen: React.FC<LocalAccountSetupScreenProps> = ({
  lang,
  onCreateAccount,
  onCreatorLogin,
  onFinishSetup,
  onBackToLanguage,
}) => {
  const [nickname, setNickname] = useState('');
  const [touched, setTouched] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [starterCelebration, setStarterCelebration] = useState<{
    migratedLegacy: boolean;
  } | null>(null);
  const nicknameInputRef = useRef<HTMLInputElement | null>(null);

  const existingProfiles = loadAllLocalProfiles();
  const validation = validateNickname(nickname, existingProfiles);
  const errorMsg = touched && !validation.valid ? mapNicknameError(lang, validation.error) : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!validation.valid) {
      audio.playSfx('hit');
      return;
    }
    audio.playSfx('checkpoint');
    const result = onCreateAccount({
      nickname: validation.normalized,
      avatarId: 'av_classic_spikey',
      customAvatarDataUrl: null,
    });
    setStarterCelebration({ migratedLegacy: result.migratedLegacy });
  };

  if (starterCelebration) {
    return (
      <div className="min-h-screen bg-[#060b16] flex items-center justify-center p-4">
        <div className="pixel-panel max-w-lg w-full bg-slate-950/95 border-amber-400 p-6 sm:p-8 text-center flex flex-col items-center gap-5 shadow-[0_0_45px_rgba(251,191,36,0.28)]">
          <div className="flex items-center gap-3">
            <AvatarBadge
              avatarId="av_classic_spikey"
              customAvatarDataUrl={null}
              profileFrameId="frame_winter_steel"
              size="lg"
            />
            <div className="flex flex-col items-center gap-1 pixel-panel px-4 py-3 bg-amber-950/40 border-amber-400/80">
              <Package className="w-8 h-8 text-amber-300 animate-bounce" />
              <span className="font-mono-num font-bold text-lg text-amber-300">+2</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-pixel text-lg sm:text-xl text-amber-300">
              {tr(lang, 'starterWelcomeTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {tr(lang, 'starterWelcomeDesc')}
            </p>
            {starterCelebration.migratedLegacy && (
              <div className="text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-500/40 px-3 py-2">
                {tr(lang, 'backupSuccessMsg')}
              </div>
            )}
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                if (onFinishSetup) {
                  onFinishSetup('CASES');
                } else {
                  window.dispatchEvent(new CustomEvent('spikey:enter-after-account', { detail: { target: 'CASES' } }));
                }
              }}
              className="flex-1 pixel-btn min-h-[46px] px-4 py-3 bg-amber-500 hover:bg-amber-400 border-amber-300 text-slate-950 font-pixel text-xs cursor-pointer"
            >
              {tr(lang, 'openStarterCasesBtn')}
            </button>
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                if (onFinishSetup) {
                  onFinishSetup('TITLE_MENU');
                } else {
                  window.dispatchEvent(new CustomEvent('spikey:enter-after-account', { detail: { target: 'TITLE_MENU' } }));
                }
              }}
              className="flex-1 pixel-btn min-h-[46px] px-4 py-3 bg-sky-600 hover:bg-sky-500 border-sky-300 text-white font-pixel text-xs cursor-pointer"
            >
              {tr(lang, 'startAdventureBtn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b16] text-slate-100 flex items-center justify-center p-4">
      <div className="pixel-panel max-w-2xl w-full bg-slate-950/95 border-sky-400/65 p-5 sm:p-7 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <h1 className="font-pixel text-base sm:text-lg text-white">
                {tr(lang, 'createAccountTitle')}
              </h1>
              <p className="text-xs text-slate-400 mt-1">{tr(lang, 'createAccountDesc')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onCreatorLogin && (
              <button
                type="button"
                onClick={() => {
                  audio.playSfx('menuClick');
                  setShowCreatorModal(true);
                }}
                className="pixel-btn min-h-[44px] px-3.5 py-2 bg-amber-500 hover:bg-amber-400 border-amber-200 text-slate-950 font-pixel text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{tr(lang, 'creatorAccountBtn')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                onBackToLanguage();
              }}
              className="pixel-btn min-h-[44px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{tr(lang, 'back')}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Nickname + Default Classic Spikey Preview Row (No Starter Skin Picker) */}
          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start bg-slate-900/70 border border-slate-800 p-4">
            <AvatarBadge
              avatarId="av_classic_spikey"
              customAvatarDataUrl={null}
              profileFrameId="frame_winter_steel"
              size="lg"
            />
            <div className="flex-1 w-full space-y-2">
              <label className="block font-pixel text-[11px] text-sky-300">
                {tr(lang, 'nicknameLabel')}
              </label>
              <input
                ref={nicknameInputRef}
                type="text"
                value={nickname}
                maxLength={18}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (!touched) setTouched(true);
                }}
                placeholder="SpikeyHero"
                className="w-full min-h-[44px] bg-slate-950 border-2 border-slate-700 focus:border-sky-400 px-3 py-2 text-sm text-white outline-none"
              />
              {errorMsg ? (
                <div className="text-xs text-rose-400 font-semibold">{errorMsg}</div>
              ) : (
                <div className="text-[11px] text-slate-400">
                  {validation.valid ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> {validation.normalized}
                    </span>
                  ) : (
                    tr(lang, 'nicknameErrorLength')
                  )}
                </div>
              )}

              <div className="pt-1 text-[11px] text-sky-300/85">
                {tr(lang, 'starterClassicOnlyNote')}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 flex items-start gap-2.5 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>{tr(lang, 'localDeviceNotice')}</span>
          </div>

          <button
            type="submit"
            className="pixel-btn min-h-[50px] w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 border-emerald-200 text-slate-950 font-pixel text-sm cursor-pointer"
          >
            {tr(lang, 'createAccountBtn')}
          </button>
        </form>
      </div>

      {showCreatorModal && onCreatorLogin && (
        <CreatorKeyModal
          lang={lang}
          onSuccess={(result) => {
            setShowCreatorModal(false);
            onCreatorLogin(result);
          }}
          onOpenNormalAccount={() => {
            setShowCreatorModal(false);
            window.setTimeout(() => nicknameInputRef.current?.focus(), 60);
          }}
          onClose={() => setShowCreatorModal(false)}
        />
      )}
    </div>
  );
};

interface ProfileScreenProps {
  lang: string | null;
  profile: UserProfileData;
  saveData: SaveData;
  economy: EconomyData;
  onUpdateProfile: (patch: Partial<UserProfileData>) => void;
  onEquipFrame: (frameId: string) => void;
  onExportBackup: () => void;
  onImportBackup: (rawText: string) => { ok: boolean; message: string };
  onSwitchProfile: (uid: string) => void;
  onCreateNewProfile: () => void;
  onCreatorLogin?: (result: CreatorLoginResult) => void;
  onResetSave: () => void;
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  lang,
  profile,
  saveData,
  economy,
  onUpdateProfile,
  onEquipFrame,
  onExportBackup,
  onImportBackup,
  onSwitchProfile,
  onCreateNewProfile,
  onCreatorLogin,
  onResetSave,
  onBack,
}) => {
  const [nickInput, setNickInput] = useState(profile?.nickname ?? '');
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement | null>(null);
  const backupFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setNickInput(profile?.nickname ?? '');
  }, [profile?.uid, profile?.nickname]);

  const allProfiles = loadAllLocalProfiles();
  const nickValidation = validateNickname(nickInput ?? '', allProfiles, profile.uid);
  const unlockedAvatars = new Set([
    ...BUILTIN_AVATARS.filter((a) => !a.unlockSeasonLevel).map((a) => a.id),
    ...(economy.unlockedAvatars ?? []),
  ]);
  const unlockedFrames = new Set(economy.unlockedProfileFrames ?? ['frame_winter_steel']);

  const handleSaveNickname = () => {
    if (!nickValidation.valid) {
      setStatusMsg({ ok: false, text: mapNicknameError(lang, nickValidation.error) });
      return;
    }
    onUpdateProfile({ nickname: nickValidation.normalized });
    audio.playSfx('checkpoint');
    setStatusMsg({ ok: true, text: tr(lang, 'save') + ' ✓' });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeAvatarImageFile(file, 128);
      onUpdateProfile({ customAvatarDataUrl: dataUrl });
      audio.playSfx('coin');
      setStatusMsg({ ok: true, text: tr(lang, 'customAvatarSelected') });
    } catch {
      setStatusMsg({ ok: false, text: tr(lang, 'backupInvalidMsg') });
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = onImportBackup(text);
    setStatusMsg({ ok: res.ok, text: res.message });
    if (res.ok) audio.playSfx('checkpoint');
    else audio.playSfx('hit');
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#060b16] text-slate-100 p-4 sm:p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="pixel-panel px-5 py-4 bg-slate-950/90 border-sky-400/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-sky-400" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-pixel text-base sm:text-lg text-white">
                  {tr(lang, 'profileTitle')}
                </h1>
                {(profile.isCreator || economy.isCreator) && (
                  <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-pixel text-[9px] font-bold">
                    {tr(lang, 'creatorVipBadge')}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                <span>
                  {profile.nickname} · {tr(lang, 'playerLevel', { level: economy.playerLevel ?? 1 })}
                </span>
                {profile.accountId && !profile.isCreator && (
                  <span className="font-mono-num text-[11px] px-1.5 py-0.5 bg-slate-900 border border-sky-500/40 text-sky-300">
                    ID: {profile.accountId}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              audio.playSfx('menuClick');
              onBack();
            }}
            className="pixel-btn min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-pixel text-xs flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{tr(lang, 'back')}</span>
          </button>
        </div>

        {statusMsg && (
          <div
            className={`pixel-panel px-4 py-3 text-xs font-semibold ${
              statusMsg.ok
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                : 'bg-rose-950/80 border-rose-400 text-rose-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Identity & Stats Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 pixel-panel p-5 bg-slate-950/90 border-slate-700 space-y-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <AvatarBadge
                avatarId={profile.avatarId}
                customAvatarDataUrl={profile.customAvatarDataUrl}
                profileFrameId={economy.equippedProfileFrame || profile.profileFrame}
                size="lg"
              />
              <div className="flex-1 w-full space-y-3">
                <label className="block font-pixel text-[11px] text-sky-300">
                  {tr(lang, 'nicknameLabel')}
                </label>
                {profile.isCreator ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value="Admin"
                        readOnly
                        disabled
                        className="flex-1 min-h-[44px] bg-slate-900/60 border-2 border-amber-500/40 px-3 py-2 text-sm text-amber-300 font-bold outline-none cursor-not-allowed"
                      />
                      <span className="min-h-[44px] px-3 border border-amber-500/50 bg-amber-950/40 text-amber-300 flex items-center gap-1 font-pixel text-[10px]">
                        <Lock className="w-3.5 h-3.5" />
                        <span>LOCKED</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-300/80">
                      {tr(lang, 'adminLockedNameNote')}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={nickInput}
                      maxLength={18}
                      onChange={(e) => setNickInput(e.target.value)}
                      className="flex-1 min-h-[44px] bg-slate-900 border-2 border-slate-700 focus:border-sky-400 px-3 py-2 text-sm text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveNickname}
                      className="pixel-btn min-h-[44px] px-4 py-2 bg-sky-600 hover:bg-sky-500 border-sky-300 text-white font-pixel text-xs cursor-pointer"
                    >
                      {tr(lang, 'save')}
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <input
                    ref={avatarFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    className="pixel-btn min-h-[42px] px-3 py-2 bg-slate-800 hover:bg-slate-700 border-slate-600 text-sky-300 font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'uploadAvatarBtn')}</span>
                  </button>
                  {profile.customAvatarDataUrl && (
                    <button
                      type="button"
                      onClick={() => onUpdateProfile({ customAvatarDataUrl: null })}
                      className="pixel-btn min-h-[42px] px-3 py-2 bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 text-xs cursor-pointer"
                    >
                      {tr(lang, 'removeCustomAvatar')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Built-in & Unlockable Avatars */}
            <div className="space-y-2">
              <div className="font-pixel text-[11px] text-slate-300">
                {tr(lang, 'chooseAvatarLabel')}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {BUILTIN_AVATARS.map((av) => {
                  const unlocked = unlockedAvatars.has(av.id);
                  const active = !profile.customAvatarDataUrl && profile.avatarId === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => {
                        if (!unlocked) return;
                        audio.playSfx('menuClick');
                        onUpdateProfile({ customAvatarDataUrl: null, avatarId: av.id });
                      }}
                      className={`pixel-btn p-2 flex flex-col items-center gap-1 text-center ${
                        !unlocked
                          ? 'bg-slate-950 border-slate-800 opacity-45 cursor-not-allowed'
                          : active
                          ? 'bg-sky-900/60 border-sky-300 text-white cursor-pointer'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 cursor-pointer'
                      }`}
                    >
                      <AvatarBadge avatarId={av.id} size="sm" />
                      <span className="text-[10px] truncate w-full">{av.name}</span>
                      {!unlocked && av.unlockSeasonLevel && (
                        <span className="text-[9px] text-amber-300">
                          SP Lvl {av.unlockSeasonLevel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Profile Frames */}
            <div className="space-y-2">
              <div className="font-pixel text-[11px] text-slate-300">
                {tr(lang, 'profileFrameLabel')}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {PROFILE_FRAMES.map((fr) => {
                  const unlocked = unlockedFrames.has(fr.id);
                  const active = (economy.equippedProfileFrame || profile.profileFrame) === fr.id;
                  return (
                    <button
                      key={fr.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => {
                        if (!unlocked) return;
                        audio.playSfx('menuClick');
                        onEquipFrame(fr.id);
                        onUpdateProfile({ profileFrame: fr.id });
                      }}
                      className={`pixel-btn p-2.5 text-center text-[10px] font-pixel ${
                        !unlocked
                          ? 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                          : active
                          ? 'bg-slate-900 text-white cursor-pointer'
                          : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300 cursor-pointer'
                      }`}
                      style={{
                        borderColor: unlocked ? fr.borderHex : undefined,
                      }}
                    >
                      <div>{fr.name}</div>
                      {!unlocked && <div className="text-[9px] text-amber-400 mt-1">{tr(lang, 'locked')}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats + Backup + Profiles Column */}
          <div className="space-y-5">
            <div className="pixel-panel p-4 bg-slate-950/90 border-slate-700 space-y-2.5">
              <div className="font-pixel text-xs text-amber-300">STATISTICS</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2.5 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{tr(lang, 'spikeyCoins')}</div>
                  <div className="font-mono-num font-bold text-amber-300">
                    {economy.isCreator ? '∞' : economy.spikeyCoins.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-900 p-2.5 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">XP / LVL</div>
                  <div className="font-mono-num font-bold text-sky-300">
                    Lv.{economy.playerLevel ?? 1} ({(economy.playerXp ?? 0).toLocaleString()})
                  </div>
                </div>
                <div className="bg-slate-900 p-2.5 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{tr(lang, 'tabSkins')}</div>
                  <div className="font-mono-num font-bold text-emerald-300">
                    {Object.values(economy.ownedSkins).filter((q) => q > 0).length}
                  </div>
                </div>
                <div className="bg-slate-900 p-2.5 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{tr(lang, 'tabWebDesigns')}</div>
                  <div className="font-mono-num font-bold text-cyan-300">
                    {Object.values(economy.ownedWebDesigns ?? {}).filter((q) => q > 0).length}
                  </div>
                </div>
                <div className="bg-slate-900 p-2.5 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{tr(lang, 'cases')}</div>
                  <div className="font-mono-num font-bold text-purple-300">
                    {economy.casesOpenedTotal}
                  </div>
                </div>
                <div className="bg-slate-900 p-2.5 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">BOSSES</div>
                  <div className="font-mono-num font-bold text-rose-300">
                    {saveData.bossesDefeated.length}/5
                  </div>
                </div>
              </div>
            </div>

            {/* Portable JSON Backup */}
            <div className="pixel-panel p-4 bg-slate-950/90 border-sky-500/40 space-y-3">
              <div className="flex items-start gap-2 text-xs text-slate-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{tr(lang, 'localDeviceNotice')}</span>
              </div>
              <input
                ref={backupFileRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => {
                  audio.playSfx('menuClick');
                  onExportBackup();
                  setStatusMsg({ ok: true, text: tr(lang, 'backupExportedMsg') });
                }}
                className="pixel-btn min-h-[44px] w-full px-3 py-2.5 bg-sky-600 hover:bg-sky-500 border-sky-300 text-white font-pixel text-[10px] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{tr(lang, 'exportBackupBtn')}</span>
              </button>
              <button
                type="button"
                onClick={() => backupFileRef.current?.click()}
                className="pixel-btn min-h-[44px] w-full px-3 py-2.5 bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100 font-pixel text-[10px] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{tr(lang, 'importBackupBtn')}</span>
              </button>
            </div>

            {/* Local Profiles Switcher & Reset */}
            <div className="pixel-panel p-4 bg-slate-950/90 border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-pixel text-[10px] text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-400" />
                  {tr(lang, 'switchProfileBtn')}
                </span>
                <div className="flex items-center gap-1.5">
                  {onCreatorLogin && !profile.isCreator && (
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSfx('menuClick');
                        setShowCreatorModal(true);
                      }}
                      className="pixel-btn px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 border-amber-200 text-slate-950 font-pixel text-[9px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Crown className="w-3 h-3" />
                      <span>VIP</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      audio.playSfx('menuClick');
                      onCreateNewProfile();
                    }}
                    className="pixel-btn px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 border-emerald-300 text-white font-pixel text-[9px] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{tr(lang, 'newProfileBtn')}</span>
                  </button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {allProfiles.map((p) => {
                  const isCurrent = p.uid === profile.uid;
                  const av = getBuiltInAvatarById(p.avatarId);
                  return (
                    <button
                      key={p.uid}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => {
                        audio.playSfx('menuClick');
                        if (p.isCreator) {
                          setShowCreatorModal(true);
                        } else {
                          onSwitchProfile(p.uid);
                        }
                      }}
                      className={`w-full px-3 py-2 border text-left text-xs flex items-center justify-between ${
                        isCurrent
                          ? 'bg-sky-950/70 border-sky-400 text-white cursor-default'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300 cursor-pointer'
                      }`}
                    >
                      <span className="truncate font-semibold flex items-center gap-1.5">
                        {p.isCreator && <Lock className="w-3 h-3 text-amber-300 shrink-0" />}
                        <span>{p.nickname}</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {isCurrent ? tr(lang, 'youTag') : p.isCreator ? 'PASSWORD' : av.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800">
                {!confirmReset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmReset(true)}
                    className="pixel-btn min-h-[42px] w-full px-3 py-2 bg-rose-950/70 hover:bg-rose-900 border-rose-700 text-rose-200 font-pixel text-[10px] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'resetSave')}</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onResetSave();
                        setConfirmReset(false);
                      }}
                      className="flex-1 pixel-btn min-h-[42px] bg-rose-600 hover:bg-rose-500 border-rose-300 text-white font-pixel text-[10px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{tr(lang, 'confirmReset')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="pixel-btn min-h-[42px] px-3 bg-slate-800 text-slate-200 font-pixel text-[10px] cursor-pointer"
                    >
                      {tr(lang, 'cancel')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showCreatorModal && onCreatorLogin && (
        <CreatorKeyModal
          lang={lang}
          onSuccess={(result) => {
            setShowCreatorModal(false);
            onCreatorLogin(result);
          }}
          onOpenNormalAccount={() => {
            setShowCreatorModal(false);
            onCreateNewProfile();
          }}
          onClose={() => setShowCreatorModal(false)}
        />
      )}
    </div>
  );
};
