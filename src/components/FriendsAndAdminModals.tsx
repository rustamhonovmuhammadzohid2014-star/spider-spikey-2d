import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Crown,
  Gift,
  KeyRound,
  RefreshCw,
  Search,
  Send,
  Shield,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { audio } from '../game/audio';
import { ALL_CASES } from '../game/cases';
import { tr } from '../game/i18n';
import { LiveCalendarInfo } from '../game/seasons';
import { ALL_SKINS, RARITY_META, getSkinById } from '../game/skins';
import {
  AdminManagedAccount,
  PublicAccountView,
  SocialSnapshot,
  creatorLoginApi,
  fetchAdminAccountsApi,
  fetchMySocialApi,
  hasSocialToken,
  lookupAccountByIdApi,
  respondFriendRequestApi,
  sendAdminGiftApi,
  sendFriendGiftApi,
  sendFriendRequestApi,
} from '../game/socialApi';
import { EconomyData, UserProfileData } from '../game/types';
import { ALL_WEB_DESIGNS, getWebDesignById } from '../game/webDesigns';
import { AvatarBadge } from './AvatarBadge';
import { SkinPreviewCanvas, WebDesignPreviewCanvas } from './SkinPreviewCanvas';

export interface CreatorLoginResult {
  account: {
    uid: string;
    accountId: string;
    nickname: string;
    avatarId: string;
    isCreator: boolean;
  };
  social?: SocialSnapshot;
}

interface CreatorKeyModalProps {
  lang?: string | null;
  subtitleOverride?: string;
  onSuccess: (result: CreatorLoginResult) => void;
  onOpenNormalAccount: () => void;
  onClose: () => void;
}

export const CreatorKeyModal: React.FC<CreatorKeyModalProps> = ({
  lang,
  subtitleOverride,
  onSuccess,
  onOpenNormalAccount,
  onClose,
}) => {
  const [keyInput, setKeyInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorText(null);
    try {
      const res = await creatorLoginApi(keyInput);
      if (res.ok && res.account) {
        audio.playSfx('mythicFanfare');
        onSuccess({ account: res.account, social: res.social });
      } else {
        audio.playSfx('hit');
        setErrorText(tr(lang, 'creatorKeyTryAgain'));
      }
    } catch {
      audio.playSfx('hit');
      setErrorText(tr(lang, 'creatorKeyTryAgain'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="pixel-panel w-full max-w-md bg-slate-950 border-amber-400/85 p-6 flex flex-col gap-4 shadow-[0_0_45px_rgba(251,191,36,0.28)]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Crown className="w-5 h-5 text-amber-300" />
            <h2 className="font-pixel text-sm sm:text-base text-amber-300">
              {tr(lang, 'creatorKeyTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              audio.playSfx('menuClick');
              onClose();
            }}
            aria-label={tr(lang, 'close')}
            className="pixel-btn bg-slate-800 hover:bg-slate-700 p-1.5 text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          {subtitleOverride || tr(lang, 'creatorKeyDesc')}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border-2 border-slate-700 focus-within:border-amber-400 px-3">
            <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
            <input
              type="password"
              value={keyInput}
              autoFocus
              onChange={(e) => {
                setKeyInput(e.target.value);
                if (errorText) setErrorText(null);
              }}
              placeholder={tr(lang, 'creatorKeyPlaceholder')}
              className="w-full min-h-[44px] bg-transparent text-sm text-white outline-none"
            />
          </div>

          {errorText && (
            <div className="bg-rose-950/75 border border-rose-500/80 p-3 flex flex-col gap-2.5">
              <div className="font-pixel text-xs text-rose-300">{errorText}</div>
              <button
                type="button"
                onClick={() => {
                  audio.playSfx('menuClick');
                  onOpenNormalAccount();
                }}
                className="pixel-btn min-h-[40px] w-full bg-emerald-600 hover:bg-emerald-500 border-emerald-300 text-slate-950 font-pixel text-[10px] font-bold cursor-pointer"
              >
                {tr(lang, 'openNormalAccountBtn')}
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                onClose();
              }}
              className="pixel-btn min-h-[44px] bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200 font-pixel text-[10px] cursor-pointer"
            >
              {tr(lang, 'cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting || !keyInput.trim()}
              className="pixel-btn min-h-[44px] bg-amber-500 hover:bg-amber-400 disabled:opacity-50 border-amber-200 text-slate-950 font-pixel text-xs font-bold cursor-pointer"
            >
              {submitting ? '...' : tr(lang, 'creatorKeySubmit')}
            </button>
          </div>

          {!errorText && (
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                onOpenNormalAccount();
              }}
              className="pixel-btn min-h-[38px] w-full bg-slate-900 hover:bg-slate-800 border-emerald-500/50 text-emerald-300 font-pixel text-[10px] cursor-pointer"
            >
              {tr(lang, 'openNormalAccountBtn')}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

interface FriendsScreenProps {
  lang?: string | null;
  profile: UserProfileData;
  economy: EconomyData;
  calendar: LiveCalendarInfo;
  social: SocialSnapshot | null;
  onSocialUpdated: (next: SocialSnapshot) => void;
  onRetrySync: () => Promise<void>;
  onClaimGifts?: () => Promise<void>;
  onDeductGift: (payload: {
    coins: number;
    skinId?: string;
    webDesignId?: string;
    recipientName: string;
  }) => boolean;
  onNotify: (msg: string) => void;
  onBack: () => void;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = ({
  lang,
  profile,
  economy,
  calendar,
  social,
  onSocialUpdated,
  onRetrySync,
  onClaimGifts,
  onDeductGift,
  onNotify,
  onBack,
}) => {
  const [showAccountId, setShowAccountId] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<PublicAccountView | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  const [giftTarget, setGiftTarget] = useState<PublicAccountView | null>(null);
  const [giftCoins, setGiftCoins] = useState('0');
  const [giftSkinId, setGiftSkinId] = useState('');
  const [giftWebId, setGiftWebId] = useState('');
  const [sendingGift, setSendingGift] = useState(false);
  const [giftError, setGiftError] = useState<string | null>(null);

  const ensureAuthenticated = useCallback(async () => {
    if (!hasSocialToken()) {
      await onRetrySync();
    }
  }, [onRetrySync]);

  // Fast 3-second polling inside Friends screen so friend requests & gifts appear promptly
  useEffect(() => {
    let active = true;
    const poll = async () => {
      if (!active) return;
      if (!hasSocialToken()) {
        await onRetrySync();
      } else {
        const me = await fetchMySocialApi();
        if (active && me.ok && me.social) {
          onSocialUpdated(me.social);
        }
        if (active && onClaimGifts) {
          await onClaimGifts();
        }
      }
    };
    void poll();
    const timer = window.setInterval(() => {
      void poll();
    }, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [onRetrySync, onSocialUpdated, onClaimGifts]);

  const transferableSkins = useMemo(() => {
    return ALL_SKINS.filter((s) => {
      if (s.id === 'classic') return false;
      if (economy.isCreator) return true;
      return (economy.ownedSkins[s.id] ?? 0) > 0;
    });
  }, [economy.isCreator, economy.ownedSkins]);

  const transferableWebs = useMemo(() => {
    return ALL_WEB_DESIGNS.filter((w) => {
      if (w.id === 'classic_white') return false;
      if (economy.isCreator) return true;
      return (economy.ownedWebDesigns?.[w.id] ?? 0) > 0;
    });
  }, [economy.isCreator, economy.ownedWebDesigns]);

  const handleCopyId = async () => {
    if (!profile.accountId) return;
    try {
      await navigator.clipboard?.writeText(profile.accountId);
      setCopiedId(true);
      audio.playSfx('coin');
      onNotify(tr(lang, 'accountIdCopied'));
      window.setTimeout(() => setCopiedId(false), 2200);
    } catch {
      setCopiedId(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchId.trim();
    if (!trimmed) return;
    setSearching(true);
    setLookupError(null);
    setLookupResult(null);
    try {
      await ensureAuthenticated();
      let res = await lookupAccountByIdApi(trimmed);
      if (!res.ok && (res.error === 'UNAUTHORIZED' || res.error === 'INVALID_SESSION')) {
        await onRetrySync();
        res = await lookupAccountByIdApi(trimmed);
      }
      if (res.ok && res.account) {
        audio.playSfx('menuClick');
        setLookupResult(res.account);
      } else {
        audio.playSfx('hit');
        setLookupError(tr(lang, 'accountNotFound'));
      }
    } catch {
      audio.playSfx('hit');
      setLookupError(tr(lang, 'accountNotFound'));
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (targetAccountId: string) => {
    if (busyAction) return;
    setBusyAction(true);
    try {
      await ensureAuthenticated();
      const res = await sendFriendRequestApi(targetAccountId);
      if (res.ok && res.social) {
        audio.playSfx('purchase');
        onSocialUpdated(res.social);
        onNotify(tr(lang, 'friendRequestSent'));
        if (lookupResult && lookupResult.accountId === targetAccountId) {
          setLookupResult({
            ...lookupResult,
            relationship: res.autoAccepted || res.alreadyFriends ? 'friend' : 'outgoing',
          });
        }
      } else {
        audio.playSfx('hit');
        if (res.error) onNotify(res.error);
      }
    } finally {
      setBusyAction(false);
    }
  };

  const handleRespondRequest = async (fromAccountId: string, action: 'accept' | 'decline') => {
    if (busyAction) return;
    setBusyAction(true);
    try {
      await ensureAuthenticated();
      const res = await respondFriendRequestApi(fromAccountId, action);
      if (res.ok && res.social) {
        audio.playSfx(action === 'accept' ? 'purchase' : 'menuClick');
        onSocialUpdated(res.social);
        if (lookupResult && lookupResult.accountId === fromAccountId) {
          setLookupResult({
            ...lookupResult,
            relationship: action === 'accept' ? 'friend' : 'none',
          });
        }
      }
    } finally {
      setBusyAction(false);
    }
  };

  const handleSendGiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftTarget || sendingGift) return;
    setGiftError(null);

    const parsedCoins = Math.max(0, Math.floor(Number(giftCoins) || 0));
    const chosenSkin = giftSkinId.trim() || undefined;
    const chosenWeb = giftWebId.trim() || undefined;

    if (parsedCoins <= 0 && !chosenSkin && !chosenWeb) {
      setGiftError('Enter coins or select a skin / web design.');
      return;
    }
    if (!economy.isCreator && parsedCoins > economy.spikeyCoins) {
      setGiftError(tr(lang, 'spikeyCoins'));
      return;
    }

    setSendingGift(true);
    try {
      await ensureAuthenticated();
      const res = await sendFriendGiftApi({
        toAccountId: giftTarget.accountId,
        coins: parsedCoins,
        skinId: chosenSkin,
        webDesignId: chosenWeb,
      });
      if (res.ok) {
        const okDeduct = onDeductGift({
          coins: parsedCoins,
          skinId: chosenSkin,
          webDesignId: chosenWeb,
          recipientName: giftTarget.nickname,
        });
        if (okDeduct) {
          audio.playSfx('purchase');
          onNotify(tr(lang, 'giftSentSuccess', { name: giftTarget.nickname }));
          setGiftTarget(null);
          setGiftCoins('0');
          setGiftSkinId('');
          setGiftWebId('');
        }
      } else {
        audio.playSfx('hit');
        setGiftError(res.error ?? 'Failed to send gift.');
      }
    } catch {
      audio.playSfx('hit');
      setGiftError('Network error.');
    } finally {
      setSendingGift(false);
    }
  };

  const incoming = social?.incomingRequests ?? [];
  const outgoing = social?.outgoingRequests ?? [];
  const friends = social?.friends ?? [];

  return (
    <div className="w-full flex-1 min-h-0 bg-[#070b14] text-slate-100 overflow-y-auto p-4 sm:p-7">
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        {/* Header */}
        <header className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                onBack();
              }}
              className="pixel-btn min-h-[42px] bg-slate-800 hover:bg-slate-700 px-3 py-2 font-pixel text-xs text-slate-100 flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{tr(lang, 'back')}</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-pixel text-xl sm:text-2xl text-white">
                  {tr(lang, 'friendsTitle')}
                </h2>
                <span
                  className="text-[10px] font-pixel px-2 py-0.5 border border-slate-700 bg-slate-900/90"
                  style={{ color: calendar.season.accentColor }}
                >
                  {calendar.bannerLine2}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{profile.nickname}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                void onRetrySync();
              }}
              className="pixel-btn min-h-[40px] bg-slate-800 hover:bg-slate-700 px-3 py-2 font-pixel text-[10px] text-sky-300 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{tr(lang, 'refreshBtn')}</span>
            </button>

            <div className="pixel-panel px-3.5 py-2 border-amber-400/60 bg-slate-950/90 flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col leading-none">
                <span className="font-pixel text-[8px] text-amber-300/80">
                  {tr(lang, 'spikeyCoins')}
                </span>
                <span className="font-mono-num text-sm font-bold text-amber-300">
                  {economy.isCreator ? '∞' : economy.spikeyCoins.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Shareable Account ID Card + Button */}
        <div className="pixel-panel p-4 bg-slate-950/90 border-sky-500/50 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <div className="font-pixel text-xs text-white">{profile.nickname}</div>
              <div className="text-xs text-slate-400 mt-0.5 font-mono-num">
                {showAccountId
                  ? profile.accountId || '...'
                  : tr(lang, 'accountIdBtn')}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                setShowAccountId((v) => !v);
                if (!profile.accountId) void onRetrySync();
              }}
              className="pixel-btn min-h-[42px] px-4 py-2 bg-sky-600 hover:bg-sky-500 border-sky-300 text-white font-pixel text-[10px] cursor-pointer"
            >
              {tr(lang, 'accountIdBtn')}
            </button>

            {showAccountId && profile.accountId && (
              <div className="flex items-center gap-2 bg-slate-900 border border-sky-400/70 px-3 py-2">
                <span className="font-mono-num font-bold text-sm text-sky-300 tracking-wider">
                  {profile.accountId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="pixel-btn px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Player by Account ID */}
        <div className="pixel-panel p-4 bg-slate-950/90 border-slate-700 space-y-3">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
            <div className="flex-1 flex items-center gap-2 bg-slate-900 border border-slate-700 focus-within:border-sky-400 px-3 min-h-[44px]">
              <Search className="w-4 h-4 text-sky-400 shrink-0" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder={tr(lang, 'searchByIdPlaceholder')}
                className="w-full bg-transparent text-sm text-white outline-none uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !searchId.trim()}
              className="pixel-btn min-h-[44px] px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 border-emerald-300 text-white font-pixel text-xs cursor-pointer"
            >
              {searching ? '...' : tr(lang, 'lookupBtn')}
            </button>
          </form>

          {lookupError && (
            <div className="bg-rose-950/60 border border-rose-500/60 px-3.5 py-2.5 text-xs text-rose-200">
              {lookupError}
            </div>
          )}

          {lookupResult && (
            <div className="bg-slate-900/90 border border-sky-500/50 p-3.5 flex flex-wrap items-center justify-between gap-3">
              {lookupResult.isAdmin ? (
                /* STRICT ADMIN PRIVACY MASK: ONLY "Admin" name, no avatar/stats/details */
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 border border-amber-400/70 bg-amber-950/40 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <div className="font-pixel text-sm text-amber-300">Admin</div>
                    <div className="text-[11px] text-slate-400">{tr(lang, 'adminMaskedNote')}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <AvatarBadge avatarId={lookupResult.avatarId || 'av_classic_spikey'} size="sm" />
                  <div>
                    <div className="font-pixel text-sm text-white">{lookupResult.nickname}</div>
                    <div className="font-mono-num text-[11px] text-slate-400">
                      {lookupResult.accountId}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {lookupResult.relationship === 'none' && (
                  <button
                    type="button"
                    disabled={busyAction}
                    onClick={() => handleSendRequest(lookupResult.accountId)}
                    className="pixel-btn min-h-[40px] px-4 py-2 bg-sky-600 hover:bg-sky-500 border-sky-300 text-white font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'sendFriendRequestBtn')}</span>
                  </button>
                )}
                {lookupResult.relationship === 'outgoing' && (
                  <span className="px-3 py-1.5 border border-amber-500/50 bg-amber-950/40 font-pixel text-[10px] text-amber-300">
                    {tr(lang, 'pendingTag')}
                  </span>
                )}
                {lookupResult.relationship === 'incoming' && (
                  <>
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() => handleRespondRequest(lookupResult.accountId, 'accept')}
                      className="pixel-btn min-h-[40px] px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-pixel text-[10px] cursor-pointer"
                    >
                      {tr(lang, 'acceptBtn')}
                    </button>
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() => handleRespondRequest(lookupResult.accountId, 'decline')}
                      className="pixel-btn min-h-[40px] px-3 py-2 bg-rose-800 hover:bg-rose-700 text-white font-pixel text-[10px] cursor-pointer"
                    >
                      {tr(lang, 'declineBtn')}
                    </button>
                  </>
                )}
                {lookupResult.relationship === 'friend' && (
                  <span className="px-3 py-1.5 border border-emerald-500/50 bg-emerald-950/40 font-pixel text-[10px] text-emerald-300 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    {tr(lang, 'friendsTag')}
                  </span>
                )}
                {lookupResult.relationship === 'self' && (
                  <span className="px-3 py-1.5 border border-sky-500/50 bg-sky-950/40 font-pixel text-[10px] text-sky-300">
                    {tr(lang, 'youTag')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Incoming Friend Requests */}
        {incoming.length > 0 && (
          <div className="pixel-panel p-4 bg-slate-950/90 border-amber-400/60 space-y-3">
            <div className="font-pixel text-xs text-amber-300 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>
                {tr(lang, 'incomingRequestsTitle')} ({incoming.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {incoming.map((req) => (
                <div
                  key={req.accountId}
                  className="bg-slate-900/90 border border-slate-700 p-3 flex items-center justify-between gap-3"
                >
                  {req.isAdmin ? (
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-5 h-5 text-amber-300" />
                      <span className="font-pixel text-xs text-amber-300">Admin</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarBadge avatarId={req.avatarId || 'av_classic_spikey'} size="xs" />
                      <div className="min-w-0">
                        <div className="font-pixel text-xs text-white truncate">{req.nickname}</div>
                        <div className="font-mono-num text-[10px] text-slate-400">
                          {req.accountId}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() => handleRespondRequest(req.accountId, 'accept')}
                      className="pixel-btn min-h-[40px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-pixel text-[10px] cursor-pointer"
                    >
                      {tr(lang, 'acceptBtn')}
                    </button>
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() => handleRespondRequest(req.accountId, 'decline')}
                      className="pixel-btn min-h-[40px] px-3 py-1.5 bg-rose-800 hover:bg-rose-700 text-white font-pixel text-[10px] cursor-pointer"
                    >
                      {tr(lang, 'declineBtn')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outgoing Sent Friend Requests */}
        {outgoing.length > 0 && (
          <div className="pixel-panel p-4 bg-slate-950/90 border-sky-500/40 space-y-3">
            <div className="font-pixel text-xs text-sky-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {tr(lang, 'outgoingRequestsTitle')} ({outgoing.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {outgoing.map((req) => (
                <div
                  key={req.accountId}
                  className="bg-slate-900/90 border border-slate-700 p-3 flex items-center justify-between gap-3"
                >
                  {req.isAdmin ? (
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-5 h-5 text-amber-300" />
                      <span className="font-pixel text-xs text-amber-300">Admin</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarBadge avatarId={req.avatarId || 'av_classic_spikey'} size="xs" />
                      <div className="min-w-0">
                        <div className="font-pixel text-xs text-white truncate">{req.nickname}</div>
                        <div className="font-mono-num text-[10px] text-slate-400">
                          {req.accountId}
                        </div>
                      </div>
                    </div>
                  )}
                  <span className="px-2.5 py-1 border border-amber-500/50 bg-amber-950/40 font-pixel text-[9px] text-amber-300 shrink-0">
                    {tr(lang, 'pendingTag')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accepted Friends List + Send Gift */}
        <div className="pixel-panel p-4 bg-slate-950/90 border-slate-700 space-y-3">
          <div className="font-pixel text-xs text-emerald-300 flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>
              {tr(lang, 'friendsListTitle')} ({friends.length})
            </span>
          </div>

          {friends.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">{tr(lang, 'noFriendsYet')}</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {friends.map((fr) => (
                <div
                  key={fr.accountId}
                  className="bg-slate-900/90 border border-emerald-500/40 p-3.5 flex items-center justify-between gap-3"
                >
                  {fr.isAdmin ? (
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-5 h-5 text-amber-300" />
                      <span className="font-pixel text-xs text-amber-300">Admin</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarBadge avatarId={fr.avatarId || 'av_classic_spikey'} size="sm" />
                      <div className="min-w-0">
                        <div className="font-pixel text-xs text-white truncate">{fr.nickname}</div>
                        <div className="font-mono-num text-[10px] text-slate-400">
                          {fr.accountId}
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      audio.playSfx('menuClick');
                      setGiftTarget(fr);
                      setGiftCoins('0');
                      setGiftSkinId('');
                      setGiftWebId('');
                      setGiftError(null);
                    }}
                    className="pixel-btn min-h-[40px] px-3 py-2 bg-purple-600 hover:bg-purple-500 border-purple-300 text-white font-pixel text-[10px] flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'sendGiftBtn')}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Friend Gift Dispatch Modal */}
      {giftTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <form
            onSubmit={handleSendGiftSubmit}
            className="pixel-panel w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-950 border-purple-400/80 p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-purple-300" />
                <h3 className="font-pixel text-xs sm:text-sm text-white">
                  {tr(lang, 'sendGiftBtn')} → {giftTarget.nickname}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setGiftTarget(null)}
                className="pixel-btn bg-slate-800 p-1.5 text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block space-y-1">
                <span className="font-pixel text-[10px] text-amber-300">
                  {tr(lang, 'giftCoinsLabel')} (
                  {economy.isCreator ? '∞' : economy.spikeyCoins.toLocaleString()})
                </span>
                <input
                  type="number"
                  min={0}
                  max={economy.isCreator ? undefined : economy.spikeyCoins}
                  value={giftCoins}
                  onChange={(e) => setGiftCoins(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-900 border border-slate-700 px-3 py-2 font-mono-num text-white outline-none"
                />
              </label>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-[10px] text-sky-300">
                    {tr(lang, 'giftSkinLabel')}
                  </span>
                  {giftSkinId && (
                    <button
                      type="button"
                      onClick={() => setGiftSkinId('')}
                      className="text-[10px] text-rose-300 hover:text-rose-200 cursor-pointer"
                    >
                      {tr(lang, 'noneOption')}
                    </button>
                  )}
                </div>
                {transferableSkins.length > 0 && (
                  <div className="max-h-40 overflow-y-auto grid grid-cols-3 gap-1.5 bg-slate-900/70 border border-slate-800 p-1.5">
                    {transferableSkins.map((s) => {
                      const active = giftSkinId === s.id;
                      const meta = RARITY_META[s.rarity];
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setGiftSkinId(active ? '' : s.id)}
                          className={`p-1.5 border flex flex-col items-center text-center gap-1 cursor-pointer transition-colors ${
                            active
                              ? 'bg-sky-950/75 border-sky-400'
                              : 'bg-slate-950/90 border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <SkinPreviewCanvas skinId={s.id} size="sm" staticFrame={!active} />
                          <span className="font-pixel text-[8px] text-white truncate w-full">
                            {s.name}
                          </span>
                          <span className="text-[8px]" style={{ color: meta.color }}>
                            {!economy.isCreator ? `×${economy.ownedSkins[s.id] ?? 0}` : s.rarity}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-[10px] text-cyan-300">
                    {tr(lang, 'giftWebLabel')}
                  </span>
                  {giftWebId && (
                    <button
                      type="button"
                      onClick={() => setGiftWebId('')}
                      className="text-[10px] text-rose-300 hover:text-rose-200 cursor-pointer"
                    >
                      {tr(lang, 'noneOption')}
                    </button>
                  )}
                </div>
                {transferableWebs.length > 0 && (
                  <div className="max-h-36 overflow-y-auto grid grid-cols-3 gap-1.5 bg-slate-900/70 border border-slate-800 p-1.5">
                    {transferableWebs.map((w) => {
                      const active = giftWebId === w.id;
                      const meta = RARITY_META[w.rarity];
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setGiftWebId(active ? '' : w.id)}
                          className={`p-1.5 border flex flex-col items-center text-center gap-1 cursor-pointer transition-colors ${
                            active
                              ? 'bg-cyan-950/75 border-cyan-400'
                              : 'bg-slate-950/90 border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <WebDesignPreviewCanvas webDesignId={w.id} size="sm" staticFrame={!active} />
                          <span className="font-pixel text-[8px] text-white truncate w-full">
                            {w.name}
                          </span>
                          <span className="text-[8px]" style={{ color: meta.color }}>
                            {!economy.isCreator
                              ? `×${economy.ownedWebDesigns?.[w.id] ?? 0}`
                              : w.rarity}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {transferableSkins.length === 0 && transferableWebs.length === 0 && (
                <div className="bg-slate-900/90 border border-slate-700 px-3 py-2 text-[11px] text-slate-400">
                  {tr(lang, 'noExtraSkinsNote')}
                </div>
              )}
            </div>

            {giftError && (
              <div className="bg-rose-950/70 border border-rose-500/70 px-3 py-2 text-xs text-rose-200">
                {giftError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setGiftTarget(null)}
                className="pixel-btn min-h-[42px] bg-slate-800 hover:bg-slate-700 font-pixel text-[10px] text-slate-200 cursor-pointer"
              >
                {tr(lang, 'cancel')}
              </button>
              <button
                type="submit"
                disabled={sendingGift}
                className="pixel-btn min-h-[42px] bg-purple-600 hover:bg-purple-500 border-purple-300 font-pixel text-[10px] text-white cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingGift ? '...' : tr(lang, 'adminDispatchBtn')}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

interface AdminSidePanelProps {
  lang?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNotify: (msg: string) => void;
  onSocialUpdated?: (next: SocialSnapshot) => void;
}

export const AdminSidePanel: React.FC<AdminSidePanelProps> = ({
  lang,
  open: controlledOpen,
  onOpenChange,
  onNotify,
  onSocialUpdated,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (next: boolean) => {
      if (onOpenChange) onOpenChange(next);
      else setInternalOpen(next);
    },
    [onOpenChange]
  );

  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<AdminManagedAccount[]>([]);
  const [adminAccountId, setAdminAccountId] = useState('SPK-ADMIN1');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [coinsAmount, setCoinsAmount] = useState('10000');
  const [selectedSkin, setSelectedSkin] = useState('');
  const [selectedWeb, setSelectedWeb] = useState('');
  const [skinFilter, setSkinFilter] = useState('');
  const [webFilter, setWebFilter] = useState('');
  const [selectedCase, setSelectedCase] = useState('');
  const [caseQty, setCaseQty] = useState('1');
  const [sending, setSending] = useState(false);
  const [reauthKey, setReauthKey] = useState('');
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(!hasSocialToken());

  const loadAccounts = useCallback(async () => {
    if (!hasSocialToken()) {
      setNeedsAuth(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchAdminAccountsApi();
      if (res.ok && res.accounts) {
        setNeedsAuth(false);
        setAccounts(res.accounts);
        if (res.adminAccountId) setAdminAccountId(res.adminAccountId);
      } else if (res.error === 'UNAUTHORIZED' || res.error === 'CREATOR_ONLY' || res.error === 'INVALID_SESSION') {
        setNeedsAuth(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void loadAccounts();
    }
  }, [isOpen, loadAccounts]);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.accountId.toLowerCase().includes(q) ||
        a.nickname.toLowerCase().includes(q) ||
        a.uid.toLowerCase().includes(q)
    );
  }, [accounts, searchQuery]);

  const filteredAdminSkins = useMemo(() => {
    const q = skinFilter.trim().toLowerCase();
    if (!q) return ALL_SKINS;
    return ALL_SKINS.filter(
      (s) => s.name.toLowerCase().includes(q) || s.rarity.toLowerCase().includes(q)
    );
  }, [skinFilter]);

  const filteredAdminWebs = useMemo(() => {
    const q = webFilter.trim().toLowerCase();
    if (!q) return ALL_WEB_DESIGNS;
    return ALL_WEB_DESIGNS.filter(
      (w) => w.name.toLowerCase().includes(q) || w.rarity.toLowerCase().includes(q)
    );
  }, [webFilter]);

  const handleReauth = async (e: React.FormEvent) => {
    e.preventDefault();
    setReauthError(null);
    const res = await creatorLoginApi(reauthKey);
    if (res.ok) {
      audio.playSfx('checkpoint');
      setNeedsAuth(false);
      setReauthKey('');
      if (res.social && onSocialUpdated) onSocialUpdated(res.social);
      void loadAccounts();
    } else {
      audio.playSfx('hit');
      setReauthError(tr(lang, 'creatorKeyTryAgain'));
    }
  };

  const handleFriendPlayer = async (acc: AdminManagedAccount) => {
    if (acc.incomingRequestToAdmin) {
      const res = await respondFriendRequestApi(acc.accountId, 'accept');
      if (res.ok) {
        audio.playSfx('purchase');
        if (res.social && onSocialUpdated) onSocialUpdated(res.social);
        void loadAccounts();
      }
      return;
    }
    const res = await sendFriendRequestApi(acc.accountId);
    if (res.ok) {
      audio.playSfx('purchase');
      if (res.social && onSocialUpdated) onSocialUpdated(res.social);
      onNotify(tr(lang, 'friendRequestSent'));
      void loadAccounts();
    }
  };

  const handleDispatch = async (acc: AdminManagedAccount) => {
    if (sending) return;
    const coins = Math.max(0, Math.floor(Number(coinsAmount) || 0));
    const skinId = selectedSkin || undefined;
    const webDesignId = selectedWeb || undefined;
    const caseType = selectedCase || undefined;
    const parsedCaseQty = caseType ? Math.max(1, Math.min(50, Math.floor(Number(caseQty) || 1))) : undefined;
    if (coins <= 0 && !skinId && !webDesignId && !caseType) return;

    setSending(true);
    try {
      const res = await sendAdminGiftApi({
        toAccountId: acc.accountId,
        coins,
        skinId,
        webDesignId,
        caseType,
        caseQty: parsedCaseQty,
      });
      if (res.ok) {
        audio.playSfx('purchase');
        onNotify(tr(lang, 'adminSentSuccess', { name: acc.nickname }));
        setSelectedSkin('');
        setSelectedWeb('');
        setSelectedCase('');
        setCaseQty('1');
      } else {
        audio.playSfx('hit');
        onNotify(res.error ?? 'Error');
      }
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          audio.playSfx('menuClick');
          setOpen(true);
        }}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 pixel-btn bg-amber-500 hover:bg-amber-400 border-amber-200 text-slate-950 px-2.5 py-4 font-pixel text-[10px] font-bold flex flex-col items-center gap-1.5 shadow-[0_0_24px_rgba(251,191,36,0.45)] cursor-pointer"
        title={tr(lang, 'ownerPanelTitle')}
      >
        <ChevronLeft className="w-4 h-4" />
        <Crown className="w-4 h-4" />
        <span className="[writing-mode:vertical-rl]">OWNER</span>
      </button>
    );
  }

  return (
    <aside className="fixed right-0 top-0 bottom-0 z-40 w-[340px] sm:w-[430px] max-w-[96vw] bg-slate-950/95 border-l-2 border-amber-400/80 flex flex-col shadow-[-8px_0_32px_rgba(0,0,0,0.8)]">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2 bg-gradient-to-r from-amber-950/50 to-slate-950">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-pixel text-xs sm:text-sm text-amber-300 truncate">
              {tr(lang, 'ownerPanelTitle')}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-mono-num">
            Admin · {adminAccountId} · {accounts.length} acc
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void loadAccounts()}
            className="pixel-btn p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 cursor-pointer"
            title={tr(lang, 'refreshBtn')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="pixel-btn p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            aria-label={tr(lang, 'close')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
        <div className="bg-slate-900/90 border border-amber-500/35 p-2.5 text-[11px] text-amber-200/90 leading-snug">
          {tr(lang, 'ownerPanelSubtitle')}
        </div>

        {/* Search by ID or Nickname */}
        {!needsAuth && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 focus-within:border-amber-400 px-2.5 min-h-[40px]">
            <Search className="w-4 h-4 text-amber-300 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr(lang, 'ownerSearchPlaceholder')}
              className="w-full bg-transparent text-xs text-white outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {needsAuth ? (
          <form onSubmit={handleReauth} className="pixel-panel p-3 bg-slate-900 border-amber-400/60 space-y-2.5">
            <div className="font-pixel text-[10px] text-amber-300">{tr(lang, 'creatorKeyTitle')}</div>
            <input
              type="password"
              value={reauthKey}
              onChange={(e) => setReauthKey(e.target.value)}
              placeholder={tr(lang, 'creatorKeyPlaceholder')}
              className="w-full min-h-[38px] bg-slate-950 border border-slate-700 px-2.5 text-xs text-white outline-none"
            />
            {reauthError && <div className="text-rose-400 text-[11px]">{reauthError}</div>}
            <button
              type="submit"
              className="pixel-btn w-full min-h-[38px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel text-[10px] font-bold cursor-pointer"
            >
              {tr(lang, 'creatorKeySubmit')}
            </button>
          </form>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-center text-slate-400 py-8">{tr(lang, 'noOtherPlayersSynced')}</div>
        ) : (
          filteredAccounts.map((acc) => {
            const expanded = selectedUid === acc.uid;
            return (
              <div
                key={acc.uid}
                className={`pixel-panel p-3 space-y-2.5 ${
                  acc.isFriendWithAdmin ? 'border-emerald-500/50 bg-slate-900/90' : 'border-slate-700 bg-slate-900/75'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <AvatarBadge avatarId={acc.avatarId || 'av_classic_spikey'} size="xs" />
                    <div className="min-w-0">
                      <div className="font-pixel text-[11px] text-white truncate">{acc.nickname}</div>
                      <div className="font-mono-num text-[10px] text-sky-300">{acc.accountId}</div>
                    </div>
                  </div>
                  <span
                    className={`font-pixel text-[8px] px-1.5 py-0.5 border shrink-0 ${
                      acc.isFriendWithAdmin
                        ? 'border-emerald-500/60 text-emerald-300 bg-emerald-950/40'
                        : acc.pendingRequestFromAdmin || acc.incomingRequestToAdmin
                        ? 'border-amber-500/60 text-amber-300 bg-amber-950/40'
                        : 'border-slate-600 text-slate-400 bg-slate-950'
                    }`}
                  >
                    {acc.isFriendWithAdmin
                      ? tr(lang, 'friendsTag')
                      : acc.pendingRequestFromAdmin || acc.incomingRequestToAdmin
                      ? tr(lang, 'pendingTag')
                      : tr(lang, 'notFriendsTag')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUid(expanded ? null : acc.uid)}
                    className="pixel-btn min-h-[36px] py-1.5 bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-pixel text-[9px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>{tr(lang, 'sendGiftBtn')}</span>
                  </button>

                  {!acc.isFriendWithAdmin ? (
                    <button
                      type="button"
                      disabled={acc.pendingRequestFromAdmin}
                      onClick={() => void handleFriendPlayer(acc)}
                      className={`pixel-btn min-h-[36px] py-1.5 font-pixel text-[9px] flex items-center justify-center gap-1 ${
                        acc.pendingRequestFromAdmin
                          ? 'bg-slate-800 text-amber-300 cursor-default'
                          : acc.incomingRequestToAdmin
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                          : 'bg-sky-700 hover:bg-sky-600 text-white cursor-pointer'
                      }`}
                    >
                      <UserPlus className="w-3 h-3" />
                      <span className="truncate">
                        {acc.pendingRequestFromAdmin
                          ? tr(lang, 'pendingTag')
                          : acc.incomingRequestToAdmin
                          ? tr(lang, 'acceptBtn')
                          : tr(lang, 'sendFriendRequestBtn')}
                      </span>
                    </button>
                  ) : (
                    <div className="min-h-[36px] border border-emerald-500/40 bg-emerald-950/30 flex items-center justify-center gap-1 text-[9px] font-pixel text-emerald-300">
                      <UserCheck className="w-3 h-3" />
                      <span>{tr(lang, 'friendsTag')}</span>
                    </div>
                  )}
                </div>

                {expanded && (
                  <div className="pt-2.5 border-t border-slate-800 space-y-2.5">
                    <div className="space-y-1">
                      <span className="font-pixel text-[9px] text-amber-300 block">
                        {tr(lang, 'adminSendCoinsLabel')}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={coinsAmount}
                        onChange={(e) => setCoinsAmount(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full min-h-[36px] bg-slate-950 border border-slate-700 px-2 font-mono-num text-xs text-white outline-none"
                      />
                      <div className="grid grid-cols-3 gap-1.5">
                        {[10000, 100000, 1000000].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setCoinsAmount(String(amt))}
                            className="pixel-btn py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-mono-num text-amber-300 cursor-pointer"
                          >
                            +{amt >= 1000000 ? '1M' : `${amt / 1000}K`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visual Spider Skin Picker with Images */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-pixel text-[9px] text-sky-300">
                          {tr(lang, 'adminSendSkinLabel')}
                        </span>
                        {selectedSkin && (
                          <button
                            type="button"
                            onClick={() => setSelectedSkin('')}
                            className="text-[10px] text-rose-300 hover:text-rose-200 cursor-pointer"
                          >
                            {tr(lang, 'noneOption')} ✕
                          </button>
                        )}
                      </div>

                      {selectedSkin && (
                        <div className="bg-sky-950/50 border border-sky-400/70 p-2 flex items-center gap-2.5">
                          <SkinPreviewCanvas skinId={selectedSkin} size="sm" anim="idle" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[9px] font-pixel text-sky-300">
                              {tr(lang, 'selectedPreviewLabel')}
                            </div>
                            <div className="font-pixel text-[11px] text-white truncate">
                              {getSkinById(selectedSkin).name}
                            </div>
                          </div>
                        </div>
                      )}

                      <input
                        type="text"
                        value={skinFilter}
                        onChange={(e) => setSkinFilter(e.target.value)}
                        placeholder={tr(lang, 'filterSkinsPlaceholder')}
                        className="w-full min-h-[30px] bg-slate-950 border border-slate-700 px-2 text-[11px] text-white outline-none"
                      />

                      <div className="max-h-44 overflow-y-auto grid grid-cols-3 gap-1.5 bg-slate-950/90 border border-slate-800 p-1.5">
                        {filteredAdminSkins.map((s) => {
                          const active = selectedSkin === s.id;
                          const meta = RARITY_META[s.rarity];
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelectedSkin(active ? '' : s.id)}
                              className={`p-1 border flex flex-col items-center text-center gap-1 cursor-pointer ${
                                active
                                  ? 'bg-sky-950/80 border-sky-400'
                                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-600'
                              }`}
                            >
                              <SkinPreviewCanvas skinId={s.id} size="sm" staticFrame={!active} />
                              <span className="font-pixel text-[8px] text-white truncate w-full">
                                {s.name}
                              </span>
                              <span className="text-[8px]" style={{ color: meta.color }}>
                                {s.rarity.toUpperCase()}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Visual Web Skin Picker with Images */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-pixel text-[9px] text-cyan-300">
                          {tr(lang, 'adminSendWebLabel')}
                        </span>
                        {selectedWeb && (
                          <button
                            type="button"
                            onClick={() => setSelectedWeb('')}
                            className="text-[10px] text-rose-300 hover:text-rose-200 cursor-pointer"
                          >
                            {tr(lang, 'noneOption')} ✕
                          </button>
                        )}
                      </div>

                      {selectedWeb && (
                        <div className="bg-cyan-950/50 border border-cyan-400/70 p-2 flex items-center gap-2.5">
                          <WebDesignPreviewCanvas webDesignId={selectedWeb} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[9px] font-pixel text-cyan-300">
                              {tr(lang, 'selectedPreviewLabel')}
                            </div>
                            <div className="font-pixel text-[11px] text-white truncate">
                              {getWebDesignById(selectedWeb).name}
                            </div>
                          </div>
                        </div>
                      )}

                      <input
                        type="text"
                        value={webFilter}
                        onChange={(e) => setWebFilter(e.target.value)}
                        placeholder={tr(lang, 'filterWebsPlaceholder')}
                        className="w-full min-h-[30px] bg-slate-950 border border-slate-700 px-2 text-[11px] text-white outline-none"
                      />

                      <div className="max-h-40 overflow-y-auto grid grid-cols-3 gap-1.5 bg-slate-950/90 border border-slate-800 p-1.5">
                        {filteredAdminWebs.map((w) => {
                          const active = selectedWeb === w.id;
                          const meta = RARITY_META[w.rarity];
                          return (
                            <button
                              key={w.id}
                              type="button"
                              onClick={() => setSelectedWeb(active ? '' : w.id)}
                              className={`p-1 border flex flex-col items-center text-center gap-1 cursor-pointer ${
                                active
                                  ? 'bg-cyan-950/80 border-cyan-400'
                                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-600'
                              }`}
                            >
                              <WebDesignPreviewCanvas webDesignId={w.id} size="sm" staticFrame={!active} />
                              <span className="font-pixel text-[8px] text-white truncate w-full">
                                {w.name}
                              </span>
                              <span className="text-[8px]" style={{ color: meta.color }}>
                                {w.rarity.toUpperCase()}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <label className="col-span-2 block space-y-1">
                        <span className="font-pixel text-[9px] text-purple-300 flex items-center gap-1">
                          <Box className="w-3 h-3" />
                          <span>{tr(lang, 'ownerSendCaseLabel')}</span>
                        </span>
                        <select
                          value={selectedCase}
                          onChange={(e) => setSelectedCase(e.target.value)}
                          className="w-full min-h-[36px] bg-slate-950 border border-slate-700 px-2 text-xs text-white outline-none"
                        >
                          <option value="">{tr(lang, 'noneOption')}</option>
                          {ALL_CASES.map((c) => (
                            <option key={c.type} value={c.type}>
                              {c.nameEn}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block space-y-1">
                        <span className="font-pixel text-[9px] text-purple-300 block">
                          {tr(lang, 'ownerCaseQtyLabel')}
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={caseQty}
                          onChange={(e) => setCaseQty(e.target.value)}
                          className="w-full min-h-[36px] bg-slate-950 border border-slate-700 px-2 font-mono-num text-xs text-white outline-none"
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      disabled={sending}
                      onClick={() => void handleDispatch(acc)}
                      className="pixel-btn w-full min-h-[38px] bg-emerald-600 hover:bg-emerald-500 text-white font-pixel text-[10px] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sending ? '...' : tr(lang, 'adminDispatchBtn')}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
