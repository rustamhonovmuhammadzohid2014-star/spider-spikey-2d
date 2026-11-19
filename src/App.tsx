import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { AuthGate, AuthGateStep } from './components/AuthGate';
import {
  AchievementsScreen,
  CasesScreen,
  DailyRewardsScreen,
  InventoryScreen,
  LeaderboardScreen,
  MarketplaceScreen,
  MissionsScreen,
  SeasonPassScreen,
  TradingScreen,
} from './components/EconomyScreens';
import { GameCanvas } from './components/GameCanvas';
import { LanguageSelector } from './components/LanguageSelector';
import {
  AchievementsModal,
  CampaignVictoryScreen,
  CreditsModal,
  GameOverModal,
  MainMenu,
  PauseModal,
  SettingsModal,
  StageClearModal,
  TrialGateModal,
  WorldSelectScreen,
} from './components/Menus';
import { SeasonalLoadingOverlay } from './components/SkinPreviewCanvas';
import { TutorialModal } from './components/TutorialModal';
import {
  ZaiEventPromoModal,
  ZaiEventsScreen,
  ZaiWarningBanner,
} from './components/ZaiEventAnnouncement';
import {
  auth,
  clearGmailAccessToken,
  getGmailAccessToken,
  googleProvider,
  setGmailAccessToken,
} from './firebase';
import { audio } from './game/audio';
import {
  acceptTradeOffer,
  cancelTradeOffer,
  createTradeOffer,
  fetchLeaderboardEntries,
  loadCloudEconomy,
  rejectTradeOffer,
  saveCloudEconomy,
  settleSenderTrades,
  subscribeToUserTrades,
  syncLeaderboardEntry,
} from './game/cloudEconomy';
import {
  loadCloudSave,
  mergeTrialSaveToCloud,
  resetCloudSave,
  saveCloudProgress,
  saveInGameProfile,
  syncUserProfile,
} from './game/cloudSave';
import {
  ALL_MISSIONS,
  ECONOMY_ACHIEVEMENTS,
  applyGameplayRewards,
  buyCaseAction,
  buySkinAction,
  buyWebDesignAction,
  claimDailyRewardAction,
  claimHolidayGiftAction,
  claimMissionAction,
  claimSeasonPassLevelAction,
  createInitialEconomyData,
  equipSkinAction,
  equipWebDesignAction,
  getEffectiveStreakStatus,
  loadLocalEconomy,
  openOwnedCaseAction,
  persistLocalEconomy,
  sellSkinAction,
  sellWebDesignAction,
  useSpecialItemAction,
} from './game/economy';
import {
  clearPendingOtp,
  sendGmailVerificationCode,
  verifyGmailCode,
} from './game/gmailOtp';
import { LanguageCode, isRtlLanguage, normalizeLangCode, tr } from './game/i18n';
import { ALL_STAGES, STAGE_MAP, getNextStageId } from './game/levels';
import {
  buildSeasonPassLevels,
  getLiveCalendarInfo,
  getSeasonLevelFromXp,
} from './game/seasons';
import {
  clearSaveData,
  createInitialSaveData,
  evaluateAchievements,
  loadSaveData,
  loadSettings,
  persistSaveData,
  persistSettings,
} from './game/storage';
import {
  ACHIEVEMENTS,
  CaseType,
  EconomyData,
  GameSettings,
  LeaderboardEntry,
  ModalTab,
  SaveData,
  ScreenState,
  SpiderColorId,
  StageClearSummary,
  TradeOffer,
  UserProfileData,
} from './game/types';
import {
  AnnualZaiEventId,
  ZaiEventSimMode,
  getActiveOrWarningZaiAnnouncement,
  getEffectiveEventClock,
} from './game/zaiCollection';

export default function App() {
  const [calendar, setCalendar] = useState(() => getLiveCalendarInfo());
  const [realNow, setRealNow] = useState<Date>(() => new Date());
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);

  const [gmailVerified, setGmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTargetEmail, setOtpTargetEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [isTrialMode, setIsTrialMode] = useState(false);
  const [trialGateOpen, setTrialGateOpen] = useState(false);
  const [cloudError, setCloudError] = useState<Error | null>(null);

  const [saveData, setSaveData] = useState<SaveData>(() => createInitialSaveData());
  const [economy, setEconomy] = useState<EconomyData>(() => createInitialEconomyData());
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [screen, setScreen] = useState<ScreenState>('TITLE_MENU');
  const [modal, setModal] = useState<ModalTab>('NONE');
  const [activeStageId, setActiveStageId] = useState<string>('1-1');
  const [restartNonce, setRestartNonce] = useState(0);
  const [clearSummary, setClearSummary] = useState<StageClearSummary | null>(null);
  const [gameOverStats, setGameOverStats] = useState({ score: 0, coins: 0 });
  const [achievementToast, setAchievementToast] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [trades, setTrades] = useState<TradeOffer[]>([]);
  const [tradePartnerUid, setTradePartnerUid] = useState<string | null>(null);
  const [pendingCaseToSpin, setPendingCaseToSpin] = useState<CaseType | null>(null);
  const [loadingStageLabel, setLoadingStageLabel] = useState<string | null>(null);

  const [simMode, setSimMode] = useState<ZaiEventSimMode>('live');
  const [simTargetEventId, setSimTargetEventId] = useState<AnnualZaiEventId>('zai_summer');
  const [simAnchorRealMs, setSimAnchorRealMs] = useState<number>(() => Date.now());
  const [dismissedAlertKey, setDismissedAlertKey] = useState<string | null>(null);
  const [promoEventId, setPromoEventId] = useState<AnnualZaiEventId | null>(null);
  const [marketInitialTab, setMarketInitialTab] = useState<'skins' | 'webs' | 'zai' | 'schedule'>('skins');
  const [showLangSelector, setShowLangSelector] = useState(false);
  const [lastStageXpEarned, setLastStageXpEarned] = useState(0);

  const saveDirtyRef = useRef(false);
  const pendingTrialSaveRef = useRef<SaveData | null>(null);
  const pendingTrialCoinsRef = useRef<number>(0);
  const latestEconomyRef = useRef<EconomyData>(economy);
  latestEconomyRef.current = economy;
  const latestSaveRef = useRef<SaveData>(saveData);
  latestSaveRef.current = saveData;
  const latestProfileRef = useRef<UserProfileData | null>(userProfile);
  latestProfileRef.current = userProfile;
  const loadingTimerRef = useRef<number | null>(null);
  const prevZaiPhaseRef = useRef<string>('none');
  const tutorialCheckedRef = useRef(false);

  // Live 1-second clock + calendar rollover check
  useEffect(() => {
    const secId = window.setInterval(() => {
      setRealNow(new Date());
    }, 1000);
    const calId = window.setInterval(() => {
      const next = getLiveCalendarInfo();
      setCalendar((prev) => (prev.dateKey === next.dateKey && prev.monthKey === next.monthKey ? prev : next));
    }, 60_000);
    return () => {
      window.clearInterval(secId);
      window.clearInterval(calId);
    };
  }, []);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const showToast = useCallback((text: string) => {
    setAchievementToast(text);
    window.setTimeout(() => {
      setAchievementToast((prev) => (prev === text ? null : prev));
    }, 3400);
  }, []);

  const refreshLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const rows = await fetchLeaderboardEntries();
      setLeaderboard(rows);
    } catch {
      // ignore non-fatal leaderboard fetch errors
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Centralized Economy commit: updates state, unifies SaveData.totalCoins, persists local & Firestore + Leaderboard
  const commitEconomy = useCallback(
    (nextEcon: EconomyData, newlyEconomyAch: string[] = []) => {
      latestEconomyRef.current = nextEcon;
      setEconomy(nextEcon);

      const storageId = isTrialMode ? 'trial' : firebaseUser?.uid;
      persistLocalEconomy(nextEcon, storageId);

      // Keep SaveData.totalCoins strictly unified with Spikey Coins
      const updatedSave = structuredClone(latestSaveRef.current);
      if (updatedSave.totalCoins !== nextEcon.spikeyCoins) {
        updatedSave.totalCoins = nextEcon.spikeyCoins;
        latestSaveRef.current = updatedSave;
        setSaveData(updatedSave);
        persistSaveData(updatedSave, storageId);
        if (!isTrialMode && firebaseUser?.uid && gmailVerified && latestProfileRef.current?.profileCompleted) {
          saveDirtyRef.current = true;
        }
      }

      if (newlyEconomyAch.length > 0) {
        const ach = ECONOMY_ACHIEVEMENTS.find((a) => a.id === newlyEconomyAch[0]);
        if (ach) {
          audio.playSfx('chest');
          showToast(`Yangi Yutuq: ${ach.title}!`);
        }
      }

      if (!isTrialMode && firebaseUser?.uid && gmailVerified && latestProfileRef.current?.profileCompleted) {
        const uid = firebaseUser.uid;
        const prof = latestProfileRef.current;
        void saveCloudEconomy(uid, nextEcon).catch((err) => {
          setCloudError(err instanceof Error ? err : new Error(String(err)));
        });
        void syncLeaderboardEntry(uid, prof, updatedSave, nextEcon).catch(() => {});
      }
    },
    [firebaseUser?.uid, gmailVerified, isTrialMode, showToast]
  );

  // Firebase Auth listener + profile/save/economy bootstrap
  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!active) return;

      if (!user) {
        clearGmailAccessToken();
        clearPendingOtp();
        saveDirtyRef.current = false;
        setFirebaseUser(null);
        setUserProfile(null);
        setGmailVerified(false);
        setOtpSent(false);
        setOtpTargetEmail(null);
        setResendCooldown(0);
        setTrades([]);
        setAuthChecking(false);
        return;
      }

      if (!user.emailVerified) {
        await signOut(auth).catch(() => {});
        if (!active) return;
        clearGmailAccessToken();
        setFirebaseUser(null);
        setUserProfile(null);
        setGmailVerified(false);
        setAuthError('Google akkauntingiz tasdiqlanmagan. Tasdiqlangan Google akkaunt bilan kiring.');
        setAuthChecking(false);
        return;
      }

      setAuthChecking(true);
      setAuthError(null);

      try {
        const profile = await syncUserProfile(user);
        const cloud = await loadCloudSave(user.uid);
        const cloudEcon = await loadCloudEconomy(user.uid, cloud, profile);
        cloud.totalCoins = cloudEcon.spikeyCoins;
        if (!active) return;
        saveDirtyRef.current = false;
        persistSaveData(cloud, user.uid);
        persistLocalEconomy(cloudEcon, user.uid);
        setFirebaseUser(user);
        setUserProfile(profile);
        setSaveData(cloud);
        setEconomy(cloudEcon);
        latestEconomyRef.current = cloudEcon;
        latestSaveRef.current = cloud;
        setActiveStageId(cloud.currentStageId || '1-1');
        setIsTrialMode(false);
        setTrialGateOpen(false);
      } catch (err) {
        if (!active) return;
        setCloudError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (active) setAuthChecking(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Subscribe to real-time Firestore player trades & leaderboard when verified
  useEffect(() => {
    if (isTrialMode || !firebaseUser?.uid || !gmailVerified || !userProfile?.profileCompleted) {
      return;
    }
    const uid = firebaseUser.uid;
    void syncLeaderboardEntry(uid, userProfile, latestSaveRef.current, latestEconomyRef.current).catch(() => {});
    void refreshLeaderboard();

    const unsub = subscribeToUserTrades(uid, (nextTrades) => {
      setTrades(nextTrades);
      void settleSenderTrades(nextTrades, uid, latestEconomyRef.current)
        .then(({ next, changed }) => {
          if (changed) {
            commitEconomy(next);
            showToast('Savdo holati yangilandi — inventaringizga qo‘shildi!');
          }
        })
        .catch(() => {});
    });

    return () => unsub();
  }, [
    isTrialMode,
    firebaseUser?.uid,
    gmailVerified,
    userProfile,
    refreshLeaderboard,
    commitEconomy,
    showToast,
  ]);

  // Persist campaign save changes to Cloud Firestore for verified accounts (never in trial mode)
  useEffect(() => {
    if (isTrialMode || !saveDirtyRef.current || !firebaseUser || !gmailVerified || !userProfile?.profileCompleted) {
      return;
    }
    saveDirtyRef.current = false;
    void saveCloudProgress(firebaseUser.uid, saveData).catch((err) => {
      setCloudError(err instanceof Error ? err : new Error(String(err)));
    });
  }, [saveData, firebaseUser, isTrialMode, gmailVerified, userProfile?.profileCompleted]);

  // Sync audio volumes with settings
  useEffect(() => {
    audio.setVolumes(settings.musicVolume, settings.sfxVolume);
  }, [settings.musicVolume, settings.sfxVolume]);

  const canPlayFullOrTrial =
    isTrialMode || (Boolean(firebaseUser) && gmailVerified && Boolean(userProfile?.profileCompleted));

  // Effective ZAI announcement state (Live calendar or Events Preview Simulator)
  const effectiveNow = useMemo(
    () => getEffectiveEventClock(simMode, simTargetEventId, simAnchorRealMs, realNow),
    [simMode, simTargetEventId, simAnchorRealMs, realNow]
  );
  const zaiAnnouncement = useMemo(
    () => getActiveOrWarningZaiAnnouncement(effectiveNow),
    [effectiveNow]
  );

  // One-time release chime when countdown transitions into AVAILABLE NOW!
  useEffect(() => {
    const prevPhase = prevZaiPhaseRef.current;
    const nextPhase = zaiAnnouncement.phase;
    prevZaiPhaseRef.current = nextPhase;
    if (nextPhase === 'active_now' && prevPhase !== 'active_now') {
      const chimeKey = `zai_release_chime_${zaiAnnouncement.eventInstanceKey}`;
      if (simMode !== 'live') {
        audio.playSfx('zaiRelease');
      } else {
        try {
          if (!localStorage.getItem(chimeKey)) {
            localStorage.setItem(chimeKey, '1');
            audio.playSfx('zaiRelease');
          }
        } catch {
          audio.playSfx('zaiRelease');
        }
      }
    }
  }, [zaiAnnouncement.phase, zaiAnnouncement.eventInstanceKey, simMode]);

  // Auto-open interactive tutorial once on first entry to Main Menu
  useEffect(() => {
    if (
      !authChecking &&
      canPlayFullOrTrial &&
      settings.language &&
      !settings.tutorialWatched &&
      screen === 'TITLE_MENU' &&
      modal === 'NONE' &&
      !tutorialCheckedRef.current
    ) {
      tutorialCheckedRef.current = true;
      setModal('TUTORIAL');
    }
  }, [authChecking, canPlayFullOrTrial, settings.language, settings.tutorialWatched, screen, modal]);

  // Seasonal & Menu music management
  useEffect(() => {
    if (authChecking || !canPlayFullOrTrial) return;
    const isMenuOrEconomyScreen =
      screen === 'TITLE_MENU' ||
      screen === 'WORLD_SELECT' ||
      screen === 'SEASON_PASS' ||
      screen === 'DAILY_REWARDS' ||
      screen === 'MARKETPLACE' ||
      screen === 'CASES' ||
      screen === 'INVENTORY' ||
      screen === 'MISSIONS' ||
      screen === 'ACHIEVEMENTS' ||
      screen === 'LEADERBOARD' ||
      screen === 'TRADING' ||
      screen === 'EVENTS';

    if (isMenuOrEconomyScreen) {
      audio.playMusic(calendar.season.musicTrack);
    } else if (screen === 'CAMPAIGN_VICTORY') {
      audio.playMusic('victory');
    }
  }, [screen, authChecking, canPlayFullOrTrial, calendar.season.musicTrack]);

  const triggerSeasonalLoading = useCallback((label: string, ms = 750) => {
    if (loadingTimerRef.current) {
      window.clearTimeout(loadingTimerRef.current);
    }
    setLoadingStageLabel(label);
    loadingTimerRef.current = window.setTimeout(() => {
      setLoadingStageLabel(null);
      loadingTimerRef.current = null;
    }, ms);
  }, []);

  const obtainFreshGmailToken = useCallback(async (user: User): Promise<string | null> => {
    const existing = getGmailAccessToken();
    if (existing) return existing;
    const result = await reauthenticateWithPopup(user, googleProvider);
    const oauthCred = GoogleAuthProvider.credentialFromResult(result);
    const fresh = oauthCred?.accessToken ?? null;
    setGmailAccessToken(fresh);
    return fresh;
  }, []);

  const handleGoogleSignIn = useCallback(async (enteredEmail?: string) => {
    audio.unlock();
    const cleanEntered = (enteredEmail ?? '').trim();
    if (cleanEntered && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEntered)) {
      setAuthError('Iltimos, to‘g‘ri Gmail manzilini kiriting (masalan: name@gmail.com).');
      return;
    }

    setAuthBusy(true);
    setAuthError(null);
    setAuthInfo(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.send');
      provider.setCustomParameters(
        cleanEntered
          ? { prompt: 'select_account', login_hint: cleanEntered }
          : { prompt: 'select_account' }
      );

      const cred = await signInWithPopup(auth, provider);
      if (!cred.user.emailVerified) {
        await signOut(auth).catch(() => {});
        setAuthError('Google akkauntingiz tasdiqlanmagan. Boshqa Google akkaunt tanlang.');
        return;
      }

      const oauthCred = GoogleAuthProvider.credentialFromResult(cred);
      const token = oauthCred?.accessToken ?? null;
      setGmailAccessToken(token);
      setGmailVerified(false);
      setIsTrialMode(false);
      setTrialGateOpen(false);

      const targetEmail = cleanEntered || cred.user.email || '';
      setOtpTargetEmail(targetEmail || null);

      if (!token || !targetEmail) {
        setOtpSent(false);
        setAuthError('Gmail yuborish ruxsati olinmadi. Kod yuborish tugmasini bosing.');
        return;
      }

      await sendGmailVerificationCode(targetEmail, token);
      setOtpSent(true);
      setResendCooldown(30);
      setAuthInfo(`6 xonali tasdiqlash kodi ${targetEmail} Gmail pochtangizga yuborildi!`);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: string }).code)
          : '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError('Google kirish oynasi yopildi. Davom etish uchun qayta bosing.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Brauzer kirish oynasini blokladi. Pop-up ruxsatini yoqing.');
      } else if (code === 'auth/network-request-failed') {
        setAuthError('Internet aloqasi xatosi. Qayta urinib ko‘ring.');
      } else if (err instanceof Error && err.message === 'GMAIL_TOKEN_EXPIRED') {
        setOtpSent(false);
        setAuthError('Gmail ga xat yuborish ruxsati berilmadi. Qayta tasdiqlang.');
      } else {
        setAuthError('Gmail ga kod yuborishda xatolik yuz berdi. Qayta urinib ko‘ring.');
      }
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const handleConfirmSendCode = useCallback(
    async (overrideEmail?: string) => {
      if (!firebaseUser) return;
      const targetEmail = (overrideEmail?.trim() || otpTargetEmail || firebaseUser.email || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
        setAuthError('Iltimos, to‘g‘ri Gmail manzilini kiriting.');
        return;
      }

      setAuthBusy(true);
      setAuthError(null);
      setAuthInfo(null);

      try {
        let token = await obtainFreshGmailToken(firebaseUser);
        if (!token) {
          setAuthError('Gmail yuborish ruxsati olinmadi. Qayta urinib ko‘ring.');
          return;
        }

        try {
          await sendGmailVerificationCode(targetEmail, token);
        } catch (err) {
          if (err instanceof Error && err.message === 'GMAIL_TOKEN_EXPIRED') {
            clearGmailAccessToken();
            token = await obtainFreshGmailToken(firebaseUser);
            if (!token) throw new Error('Token refresh failed');
            await sendGmailVerificationCode(targetEmail, token);
          } else {
            throw err;
          }
        }

        setOtpTargetEmail(targetEmail);
        setOtpSent(true);
        setResendCooldown(30);
        setAuthInfo(`6 xonali tasdiqlash kodi ${targetEmail} Gmail pochtangizga yuborildi!`);
      } catch (err: unknown) {
        const code =
          typeof err === 'object' && err !== null && 'code' in err
            ? String((err as { code?: string }).code)
            : '';
        if (code === 'auth/popup-closed-by-user') {
          setAuthError('Gmail ruxsati oynasi yopildi. Kod yuborish uchun ruxsat bering.');
        } else {
          setAuthError('Gmail ga kod yuborishda xatolik. Gmail ruxsatini tasdiqlab qayta urinib ko‘ring.');
        }
      } finally {
        setAuthBusy(false);
      }
    },
    [firebaseUser, otpTargetEmail, obtainFreshGmailToken]
  );

  const applyPendingTrialMerge = useCallback(async (uid: string, profile: UserProfileData) => {
    const pendingSave = pendingTrialSaveRef.current;
    const trialBonusCoins = pendingTrialCoinsRef.current;
    pendingTrialSaveRef.current = null;
    pendingTrialCoinsRef.current = 0;

    let mergedSave = latestSaveRef.current;
    if (pendingSave) {
      mergedSave = await mergeTrialSaveToCloud(uid, pendingSave);
    }

    const cloudEcon = await loadCloudEconomy(uid, mergedSave, profile);
    if (trialBonusCoins > 0) {
      cloudEcon.spikeyCoins += trialBonusCoins;
      await saveCloudEconomy(uid, cloudEcon);
    }
    mergedSave.totalCoins = cloudEcon.spikeyCoins;
    saveDirtyRef.current = false;
    persistSaveData(mergedSave, uid);
    persistLocalEconomy(cloudEcon, uid);
    setSaveData(mergedSave);
    setEconomy(cloudEcon);
    latestEconomyRef.current = cloudEcon;
    latestSaveRef.current = mergedSave;
    setActiveStageId(mergedSave.currentStageId || '1-1');
  }, []);

  const handleVerifyCode = useCallback(
    async (code: string) => {
      if (!firebaseUser) return;
      const targetEmail = (otpTargetEmail || firebaseUser.email || '').trim();
      if (!targetEmail) return;
      setAuthBusy(true);
      setAuthError(null);
      setAuthInfo(null);

      try {
        const res = await verifyGmailCode(targetEmail, code);
        if (!res.ok) {
          if (res.reason === 'EXPIRED') {
            setAuthError('Kod muddati tugagan. "Kodni qayta yuborish" tugmasini bosing.');
          } else if (res.reason === 'TOO_MANY_ATTEMPTS') {
            setAuthError('Juda ko‘p noto‘g‘ri urinish. Yangi kod yuboring.');
          } else if (res.reason === 'NO_CODE') {
            setAuthError('Tasdiqlash kodi topilmadi. Avval Gmail ga kod yuboring.');
          } else {
            setAuthError(`Kod noto‘g‘ri (${res.attemptsLeft} ta urinish qoldi).`);
          }
          return;
        }

        setGmailVerified(true);
        setAuthInfo(null);
        setAuthError(null);
        if (userProfile?.profileCompleted) {
          await applyPendingTrialMerge(firebaseUser.uid, userProfile);
          setScreen('TITLE_MENU');
          triggerSeasonalLoading(calendar.bannerLine1, 800);
        }
      } catch (err) {
        setCloudError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setAuthBusy(false);
      }
    },
    [firebaseUser, otpTargetEmail, userProfile, applyPendingTrialMerge, triggerSeasonalLoading, calendar.bannerLine1]
  );

  const handleCreateProfile = useCallback(
    async (nickname: string, spiderColor: SpiderColorId) => {
      if (!firebaseUser) return;
      setAuthBusy(true);
      setAuthError(null);
      try {
        const savedProfile = await saveInGameProfile(firebaseUser, {
          nickname,
          spiderColor,
        });
        setUserProfile(savedProfile);
        await applyPendingTrialMerge(firebaseUser.uid, savedProfile);
        setScreen('TITLE_MENU');
        triggerSeasonalLoading(calendar.bannerLine1, 850);
      } catch (err) {
        setCloudError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setAuthBusy(false);
      }
    },
    [firebaseUser, applyPendingTrialMerge, triggerSeasonalLoading, calendar.bannerLine1]
  );

  const handleTryForFree = useCallback(() => {
    audio.unlock();
    const cal = getLiveCalendarInfo();
    const trialSave = loadSaveData('trial');
    const trialEcon = loadLocalEconomy('trial', cal);
    trialSave.totalCoins = trialEcon.spikeyCoins;
    setIsTrialMode(true);
    setTrialGateOpen(false);
    setAuthError(null);
    setAuthInfo(null);
    setSaveData(trialSave);
    setEconomy(trialEcon);
    latestSaveRef.current = trialSave;
    latestEconomyRef.current = trialEcon;
    setActiveStageId(trialSave.currentStageId === '1-2' ? '1-2' : '1-1');
    setScreen('TITLE_MENU');
  }, []);

  const handleConnectGmailFromTrial = useCallback(() => {
    if (isTrialMode) {
      if (saveData.hasStarted) {
        pendingTrialSaveRef.current = structuredClone(saveData);
      }
      pendingTrialCoinsRef.current = economy.spikeyCoins;
    }
    setTrialGateOpen(false);
    setIsTrialMode(false);
    setScreen('TITLE_MENU');
    setModal('NONE');
    void handleGoogleSignIn();
  }, [isTrialMode, saveData, economy.spikeyCoins, handleGoogleSignIn]);

  const handleSignOut = useCallback(async () => {
    saveDirtyRef.current = false;
    clearGmailAccessToken();
    clearPendingOtp();
    setGmailVerified(false);
    setOtpSent(false);
    setOtpTargetEmail(null);
    setIsTrialMode(false);
    setTrialGateOpen(false);
    setTrades([]);
    setScreen('TITLE_MENU');
    setModal('NONE');
    await signOut(auth);
  }, []);

  const updateSave = useCallback(
    (updater: (draft: SaveData) => void, achContext?: { noDamageClear?: boolean; stageCrystalsAll?: boolean }) => {
      const storageId = isTrialMode ? 'trial' : firebaseUser?.uid;
      setSaveData((prev) => {
        const next = structuredClone(prev);
        updater(next);
        next.totalCoins = latestEconomyRef.current.spikeyCoins;
        const newly = evaluateAchievements(next, achContext);
        persistSaveData(next, storageId);
        latestSaveRef.current = next;
        if (!isTrialMode && firebaseUser?.uid && gmailVerified && latestProfileRef.current?.profileCompleted) {
          saveDirtyRef.current = true;
        }
        if (newly.length > 0) {
          const first = ACHIEVEMENTS.find((a) => a.id === newly[0]);
          if (first) {
            showToast(`Yutuq ochildi: ${first.title}`);
          }
        }
        return next;
      });
    },
    [firebaseUser?.uid, gmailVerified, isTrialMode, showToast]
  );

  const handleUpdateSettings = useCallback((next: GameSettings) => {
    setSettings(next);
    persistSettings(next);
  }, []);

  const handleSelectLanguage = useCallback(
    (code: LanguageCode) => {
      const nextSettings: GameSettings = { ...settings, language: code };
      setSettings(nextSettings);
      persistSettings(nextSettings);
      setShowLangSelector(false);
      if (latestEconomyRef.current.selectedLanguage !== code) {
        const updatedEcon: EconomyData = {
          ...latestEconomyRef.current,
          selectedLanguage: code,
        };
        if (canPlayFullOrTrial) {
          commitEconomy(updatedEcon);
        } else {
          latestEconomyRef.current = updatedEcon;
          setEconomy(updatedEcon);
        }
      }
    },
    [settings, canPlayFullOrTrial, commitEconomy]
  );

  const finishTutorial = useCallback(() => {
    setModal('NONE');
    if (!settings.tutorialWatched) {
      handleUpdateSettings({ ...settings, tutorialWatched: true });
    }
  }, [settings, handleUpdateSettings]);

  const handleResetSave = useCallback(() => {
    const uid = isTrialMode ? 'trial' : firebaseUser?.uid;
    saveDirtyRef.current = false;
    const fresh = clearSaveData(uid);
    fresh.totalCoins = latestEconomyRef.current.spikeyCoins;
    setSaveData(fresh);
    latestSaveRef.current = fresh;
    setActiveStageId('1-1');
    if (!isTrialMode && firebaseUser?.uid) {
      void resetCloudSave(firebaseUser.uid).catch((err) => {
        setCloudError(err instanceof Error ? err : new Error(String(err)));
      });
    }
  }, [firebaseUser?.uid, isTrialMode]);

  const launchStage = useCallback(
    (stageId: string) => {
      if (isTrialMode && stageId !== '1-1' && stageId !== '1-2') {
        setClearSummary(null);
        setTrialGateOpen(true);
        return;
      }

      audio.unlock();
      const stage = STAGE_MAP[stageId] ?? ALL_STAGES[0];
      updateSave((s) => {
        s.hasStarted = true;
        s.currentStageId = stage.id;
        s.unlockedAbilities.webShot = true;
        s.unlockedAbilities.webSwing = true;
        s.unlockedAbilities.spiderDash = true;
        if (s.lives <= 0) s.lives = 5;
        if (stage.worldId >= 2) {
          s.unlockedAbilities.doubleJump = true;
          s.unlockedAbilities.webTrap = true;
        }
        if (stage.worldId >= 3) s.unlockedAbilities.wallClimb = true;
      });
      setActiveStageId(stage.id);
      setClearSummary(null);
      setTrialGateOpen(false);
      setRestartNonce((n) => n + 1);
      setScreen('PLAYING');
      triggerSeasonalLoading(`${stage.id} · ${stage.name}`, 750);
    },
    [isTrialMode, updateSave, triggerSeasonalLoading]
  );

  const handlePlay = useCallback(() => {
    launchStage('1-1');
  }, [launchStage]);

  const handleContinue = useCallback(() => {
    const target =
      isTrialMode && saveData.currentStageId !== '1-1' && saveData.currentStageId !== '1-2'
        ? '1-2'
        : saveData.currentStageId || '1-1';
    launchStage(target);
  }, [isTrialMode, launchStage, saveData.currentStageId]);

  const handleStageClear = useCallback(
    (summary: StageClearSummary) => {
      const nextId = getNextStageId(summary.stageId);
      const stageCrystalsAll = summary.crystalsCollected.every(Boolean);
      const isTrialCap = isTrialMode && summary.stageId === '1-2';
      const calNow = getLiveCalendarInfo();

      const { next: nextEcon, newlyAchievements, xpEarned } = applyGameplayRewards(
        latestEconomyRef.current,
        {
          txId: `clear_${summary.stageId}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          coinsEarned: summary.coinsEarned,
          crystalsFound: summary.crystalsCollected.filter(Boolean).length,
          enemiesDefeated: summary.enemiesDefeatedCount ?? 0,
          bossDefeated: summary.isBossStage,
          stageCompleted: true,
        },
        calNow
      );

      setLastStageXpEarned(xpEarned);
      commitEconomy(nextEcon, newlyAchievements);

      updateSave(
        (s) => {
          s.totalCoins = nextEcon.spikeyCoins;
          s.totalScore += summary.scoreEarned;
          const prevProg = s.stageProgress[summary.stageId];
          const mergedCrystals = [0, 1, 2].map(
            (i) => Boolean(prevProg?.crystals[i]) || Boolean(summary.crystalsCollected[i])
          );
          s.stageProgress[summary.stageId] = {
            completed: true,
            crystals: mergedCrystals,
            bestScore: Math.max(prevProg?.bestScore ?? 0, summary.scoreEarned),
            bestTimeSec: prevProg?.bestTimeSec
              ? Math.min(prevProg.bestTimeSec, summary.timeSec)
              : summary.timeSec,
          };

          if (summary.newlyUnlockedAbility) {
            s.unlockedAbilities[summary.newlyUnlockedAbility] = true;
          }
          if (summary.stageId === '1-Boss') s.unlockedAbilities.webTrap = true;
          if (summary.stageId === '2-Boss') s.unlockedAbilities.wallClimb = true;
          if (summary.stageId === '3-Boss') s.unlockedAbilities.webSwing = true;
          if (summary.stageId === '4-Boss') s.unlockedAbilities.spiderDash = true;
          if (summary.stageId === '5-Boss') s.unlockedAbilities.magicWeb = true;

          // Bepul sinovda faqat 1-1 va 1-2 darajalar ochiq
          if (nextId && (!isTrialMode || nextId === '1-2')) {
            if (!s.unlockedStageIds.includes(nextId)) {
              s.unlockedStageIds.push(nextId);
            }
            s.currentStageId = nextId;
          }
        },
        {
          noDamageClear: summary.noDamageBonus,
          stageCrystalsAll,
        }
      );

      if (isTrialCap) {
        setClearSummary({ ...summary, nextStageId: null });
        setTrialGateOpen(true);
        return;
      }

      if (summary.isFinalBoss) {
        setScreen('CAMPAIGN_VICTORY');
      } else {
        setClearSummary({ ...summary, nextStageId: nextId });
        setScreen('STAGE_CLEAR');
      }
    },
    [isTrialMode, updateSave, commitEconomy]
  );

  const handleGameOver = useCallback(
    (score: number, coins: number) => {
      if (coins > 0) {
        const { next, newlyAchievements } = applyGameplayRewards(
          latestEconomyRef.current,
          {
            txId: `gameover_${activeStageId}_${Date.now()}`,
            coinsEarned: coins,
            crystalsFound: 0,
            enemiesDefeated: 0,
            bossDefeated: false,
            stageCompleted: false,
          },
          getLiveCalendarInfo()
        );
        commitEconomy(next, newlyAchievements);
      }
      setGameOverStats({ score, coins });
      setScreen('GAME_OVER');
    },
    [activeStageId, commitEconomy]
  );

  const handlePauseToggle = useCallback(() => {
    setScreen((prev) => {
      if (prev === 'PLAYING') return 'PAUSED';
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, []);

  // Badge hisoblagichlar bosh menyu uchun
  const seasonClaimReadyCount = useMemo(() => {
    const curLvl = getSeasonLevelFromXp(economy.seasonXp);
    const lvls = buildSeasonPassLevels(calendar.month);
    return lvls.filter((l) => l.level <= curLvl && !economy.claimedSeasonLevels.includes(l.level)).length;
  }, [economy.seasonXp, economy.claimedSeasonLevels, calendar.month]);

  const dailyClaimReady = useMemo(
    () => getEffectiveStreakStatus(economy, calendar).canClaimToday,
    [economy, calendar]
  );

  const missionsClaimReadyCount = useMemo(
    () =>
      ALL_MISSIONS.filter(
        (m) =>
          (economy.missionProgress[`${m.period}:${m.metric}`] ?? 0) >= m.target &&
          !economy.claimedMissions.includes(m.id)
      ).length,
    [economy.missionProgress, economy.claimedMissions]
  );

  const incomingTradesCount = useMemo(
    () => trades.filter((t) => t.recipientUid === firebaseUser?.uid && t.status === 'pending').length,
    [trades, firebaseUser?.uid]
  );

  if (cloudError) {
    throw cloudError;
  }

  // First-Launch Language Gate BEFORE Login & Main Menu
  if (!settings.language) {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#050811]">
        <LanguageSelector
          currentLanguage={settings.language ? normalizeLangCode(settings.language) : null}
          isFirstLaunchGate={true}
          onSelectLanguage={handleSelectLanguage}
        />
      </div>
    );
  }

  // AuthGate: Bepul sinov tanlanguncha yoki Google + Gmail 6-xonali OTP + O‘yin profili yakunlanguncha
  if (authChecking || !canPlayFullOrTrial) {
    let authStep: AuthGateStep = 'SIGN_IN';
    if (firebaseUser) {
      if (!gmailVerified) {
        authStep = otpSent ? 'ENTER_OTP' : 'CONFIRM_GMAIL_SEND';
      } else if (!userProfile?.profileCompleted) {
        authStep = 'CREATE_PROFILE';
      }
    }

    return (
      <div
        className="relative w-screen h-screen overflow-hidden bg-[#0a1a17]"
        dir={isRtlLanguage(settings.language) ? 'rtl' : 'ltr'}
      >
        <AuthGate
          step={authStep}
          loading={authChecking}
          busy={authBusy}
          email={otpTargetEmail ?? firebaseUser?.email ?? null}
          suggestedNickname={firebaseUser?.displayName ?? ''}
          resendCooldown={resendCooldown}
          error={authError}
          infoMessage={authInfo}
          lang={settings.language}
          onOpenLanguage={() => setShowLangSelector(true)}
          onGoogleSignIn={handleGoogleSignIn}
          onTryForFree={handleTryForFree}
          onConfirmSendCode={handleConfirmSendCode}
          onVerifyCode={handleVerifyCode}
          onResendCode={() => void handleConfirmSendCode()}
          onSwitchAccount={handleSignOut}
          onCreateProfile={handleCreateProfile}
        />
        {showLangSelector && (
          <LanguageSelector
            currentLanguage={settings.language ? normalizeLangCode(settings.language) : null}
            isFirstLaunchGate={false}
            onSelectLanguage={handleSelectLanguage}
            onClose={() => setShowLangSelector(false)}
          />
        )}
      </div>
    );
  }

  const currentStage = STAGE_MAP[activeStageId] ?? ALL_STAGES[0];
  const inGameView =
    screen === 'PLAYING' ||
    screen === 'PAUSED' ||
    screen === 'STAGE_CLEAR' ||
    screen === 'GAME_OVER';

  const alertDismissed = dismissedAlertKey === zaiAnnouncement.eventInstanceKey;
  const reopenZaiAlert =
    zaiAnnouncement.phase !== 'none'
      ? {
          active: alertDismissed,
          isRelease: zaiAnnouncement.phase === 'active_now',
          label: tr(
            settings.language,
            zaiAnnouncement.phase === 'active_now' ? 'activeNow' : 'reopenEventAlert'
          ),
          onClick: () => setDismissedAlertKey(null),
        }
      : null;

  return (
    <div
      className="flex flex-col relative w-screen h-screen overflow-hidden bg-[#090d16]"
      dir={isRtlLanguage(settings.language) ? 'rtl' : 'ltr'}
    >
      {screen !== 'CAMPAIGN_VICTORY' && (
        <ZaiWarningBanner
          snapshot={zaiAnnouncement}
          lang={settings.language}
          compactGameplay={inGameView && screen === 'PLAYING'}
          dismissed={alertDismissed}
          onDismiss={() => setDismissedAlertKey(zaiAnnouncement.eventInstanceKey)}
          onViewEvent={(evId) => setPromoEventId(evId)}
          onExploreCollection={() => {
            setMarketInitialTab('zai');
            setScreen('MARKETPLACE');
          }}
        />
      )}

      {screen === 'TITLE_MENU' && (
        <MainMenu
          saveData={saveData}
          economy={economy}
          calendar={calendar}
          lang={settings.language}
          menuThemeMode={settings.menuThemeMode}
          graphicsQuality={settings.graphicsQuality}
          reopenZaiAlert={reopenZaiAlert}
          isTrialMode={isTrialMode}
          nickname={userProfile?.nickname}
          userEmail={firebaseUser?.email ?? null}
          userName={firebaseUser?.displayName ?? null}
          incomingTradesCount={incomingTradesCount}
          dailyClaimReady={dailyClaimReady}
          seasonClaimReadyCount={seasonClaimReadyCount}
          missionsClaimReadyCount={missionsClaimReadyCount}
          onToggleSeasonTheme={() =>
            handleUpdateSettings({
              ...settings,
              menuThemeMode: settings.menuThemeMode === 'winter' ? 'live' : 'winter',
            })
          }
          onOpenLanguage={() => setShowLangSelector(true)}
          onOpenTutorial={() => setModal('TUTORIAL')}
          onConnectGmail={handleConnectGmailFromTrial}
          onSignOut={handleSignOut}
          onPlay={handlePlay}
          onContinue={handleContinue}
          onNavigateScreen={(target) => {
            if (target === 'MARKETPLACE') setMarketInitialTab('skins');
            setScreen(target);
            if (target === 'LEADERBOARD' || target === 'TRADING') {
              void refreshLeaderboard();
            }
          }}
          onOpenModal={(tab) => setModal(tab)}
        />
      )}

      {screen === 'WORLD_SELECT' && (
        <WorldSelectScreen
          saveData={saveData}
          lang={settings.language}
          isTrialMode={isTrialMode}
          onRequireGmail={() => {
            setClearSummary(null);
            setTrialGateOpen(true);
          }}
          onSelectStage={launchStage}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'SEASON_PASS' && (
        <SeasonPassScreen
          economy={economy}
          calendar={calendar}
          onClaimLevel={(lvl) => {
            const res = claimSeasonPassLevelAction(economy, lvl, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(`${lvl}-daraja sovg‘asi olindi: ${res.labelUz}`);
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'DAILY_REWARDS' && (
        <DailyRewardsScreen
          economy={economy}
          calendar={calendar}
          onClaimDaily={() => {
            const res = claimDailyRewardAction(economy, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
            }
            return res;
          }}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'MARKETPLACE' && (
        <MarketplaceScreen
          economy={economy}
          calendar={calendar}
          effectiveNow={effectiveNow}
          lang={settings.language}
          initialTab={marketInitialTab}
          onBuySkin={(skinId) => {
            const res = buySkinAction(economy, skinId, calendar, effectiveNow);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast('Skin muvaffaqiyatli sotib olindi va kiyildi!');
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onEquipSkin={(skinId) => {
            const res = equipSkinAction(economy, skinId, calendar);
            if (res.ok) {
              audio.playSfx('menuClick');
              commitEconomy(res.next);
            }
          }}
          onSellSkin={(skinId) => {
            const res = sellSkinAction(economy, skinId, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(`Skin sotildi: +${res.soldPrice.toLocaleString()} Spikey Coins!`);
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onBuyWebDesign={(webId) => {
            const res = buyWebDesignAction(economy, webId, calendar, effectiveNow);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast('To‘r dizayni sotib olindi va taqildi!');
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onEquipWebDesign={(webId) => {
            const res = equipWebDesignAction(economy, webId, calendar);
            if (res.ok) {
              audio.playSfx('menuClick');
              commitEconomy(res.next);
            }
          }}
          onSellWebDesign={(webId) => {
            const res = sellWebDesignAction(economy, webId, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(`To‘r sotildi: +${res.soldPrice.toLocaleString()} Spikey Coins!`);
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onOpenEventsScreen={() => setScreen('EVENTS')}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'CASES' && (
        <CasesScreen
          economy={economy}
          calendar={calendar}
          effectiveNow={effectiveNow}
          lang={settings.language}
          initialCaseToSpin={pendingCaseToSpin}
          onBuyCase={(caseType) => {
            const res = buyCaseAction(economy, caseType, calendar, effectiveNow);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next);
              showToast('Keys xarid qilindi!');
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onOpenCase={(caseType) => {
            const res = openOwnedCaseAction(economy, caseType, calendar);
            if (res.ok) {
              commitEconomy(res.next, res.newlyAchievements);
            }
            return res;
          }}
          onEquipSkin={(skinId) => {
            const res = equipSkinAction(economy, skinId, calendar);
            if (res.ok) {
              audio.playSfx('menuClick');
              commitEconomy(res.next);
              showToast('Yangi skin kiyildi!');
            }
          }}
          onSellSkin={(skinId) => {
            const res = sellSkinAction(economy, skinId, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(`Skin sotildi: +${res.soldPrice.toLocaleString()} Spikey Coins!`);
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onBack={() => {
            setPendingCaseToSpin(null);
            setScreen('TITLE_MENU');
          }}
        />
      )}

      {screen === 'INVENTORY' && (
        <InventoryScreen
          economy={economy}
          calendar={calendar}
          lang={settings.language}
          onEquipSkin={(skinId) => {
            const res = equipSkinAction(economy, skinId, calendar);
            if (res.ok) {
              audio.playSfx('menuClick');
              commitEconomy(res.next);
              showToast('Skin kiyildi!');
            }
          }}
          onSellSkin={(skinId) => {
            const res = sellSkinAction(economy, skinId, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(`Skin sotildi: +${res.soldPrice.toLocaleString()} Spikey Coins!`);
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onEquipWebDesign={(webId) => {
            const res = equipWebDesignAction(economy, webId, calendar);
            if (res.ok) {
              audio.playSfx('menuClick');
              commitEconomy(res.next);
              showToast('To‘r dizayni taqildi!');
            }
          }}
          onSellWebDesign={(webId) => {
            const res = sellWebDesignAction(economy, webId, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(`To‘r sotildi: +${res.soldPrice.toLocaleString()} Spikey Coins!`);
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onOpenCaseFromInventory={(caseType) => {
            setPendingCaseToSpin(caseType);
            setScreen('CASES');
          }}
          onUseSpecialItem={(itemId) => {
            const res = useSpecialItemAction(economy, itemId, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              if (res.labelUz) showToast(res.labelUz);
            }
          }}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'MISSIONS' && (
        <MissionsScreen
          economy={economy}
          calendar={calendar}
          onClaimMission={(missionId) => {
            const res = claimMissionAction(economy, missionId, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast('Topshiriq mukofoti olindi!');
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onClaimHolidayGift={() => {
            const res = claimHolidayGiftAction(economy, calendar);
            if (res.ok) {
              audio.playSfx('mythicFanfare');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(`${calendar.season.eventTitleUz} sovg‘asi olindi!`);
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onBuySkin={(skinId) => {
            const res = buySkinAction(economy, skinId, calendar, effectiveNow);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast('Bayram skini xarid qilindi!');
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'ACHIEVEMENTS' && (
        <AchievementsScreen
          saveData={saveData}
          economy={economy}
          calendar={calendar}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'LEADERBOARD' && (
        <LeaderboardScreen
          entries={leaderboard}
          loading={leaderboardLoading}
          currentUid={isTrialMode ? null : firebaseUser?.uid ?? null}
          economy={economy}
          calendar={calendar}
          onRefresh={() => void refreshLeaderboard()}
          onStartTradeWith={(entry) => {
            setTradePartnerUid(entry.uid);
            setScreen('TRADING');
          }}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'TRADING' && (
        <TradingScreen
          isTrialMode={isTrialMode}
          currentUid={isTrialMode ? null : firebaseUser?.uid ?? null}
          economy={economy}
          calendar={calendar}
          players={leaderboard}
          trades={trades}
          initialPartnerUid={tradePartnerUid}
          onCreateTrade={async (recipient, offeredSkinId, requestedSkinId) => {
            if (!firebaseUser || !userProfile) return;
            const nextEcon = await createTradeOffer(
              firebaseUser.uid,
              userProfile.nickname || userProfile.displayName,
              recipient,
              offeredSkinId,
              requestedSkinId,
              latestEconomyRef.current
            );
            commitEconomy(nextEcon);
          }}
          onAcceptTrade={async (trade) => {
            if (!firebaseUser) return;
            const nextEcon = await acceptTradeOffer(
              trade,
              firebaseUser.uid,
              latestEconomyRef.current
            );
            commitEconomy(nextEcon);
          }}
          onRejectTrade={async (trade) => {
            await rejectTradeOffer(trade);
          }}
          onCancelTrade={async (trade) => {
            if (!firebaseUser) return;
            const nextEcon = await cancelTradeOffer(
              trade,
              firebaseUser.uid,
              latestEconomyRef.current
            );
            commitEconomy(nextEcon);
          }}
          onConnectGmail={handleConnectGmailFromTrial}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'EVENTS' && (
        <ZaiEventsScreen
          effectiveNow={effectiveNow}
          simMode={simMode}
          simTargetEventId={simTargetEventId}
          lang={settings.language}
          onChangeSimMode={(mode, targetEventId) => {
            setSimMode(mode);
            setSimTargetEventId(targetEventId);
            setSimAnchorRealMs(Date.now());
            setDismissedAlertKey(null);
          }}
          onOpenPromo={(eventId) => setPromoEventId(eventId)}
          onOpenMarketZai={() => {
            setMarketInitialTab('zai');
            setScreen('MARKETPLACE');
          }}
          onOpenCases={() => setScreen('CASES')}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {inGameView && (
        <div className="flex-1 min-h-0 relative">
          <GameCanvas
            stage={currentStage}
            saveData={saveData}
            settings={settings}
            equippedSkin={economy.equippedSkin}
            equippedWebDesign={economy.equippedWebDesign ?? 'classic_white'}
            spikeyCoinsTotal={economy.spikeyCoins}
            paused={
              screen !== 'PLAYING' ||
              modal !== 'NONE' ||
              trialGateOpen ||
              Boolean(loadingStageLabel) ||
              Boolean(promoEventId) ||
              showLangSelector
            }
            restartNonce={restartNonce}
            onPauseToggle={handlePauseToggle}
            onStageClear={handleStageClear}
            onGameOver={handleGameOver}
            onSaveProgress={(fn) => updateSave(fn)}
          />
        </div>
      )}

      {screen === 'PAUSED' && modal === 'NONE' && !trialGateOpen && (
        <PauseModal
          stageName={`${currentStage.id} · ${currentStage.name}`}
          onResume={() => setScreen('PLAYING')}
          onRestart={() => launchStage(currentStage.id)}
          onSettings={() => setModal('SETTINGS')}
          onQuit={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'STAGE_CLEAR' && clearSummary && !trialGateOpen && (
        <StageClearModal
          summary={clearSummary}
          lang={settings.language}
          xpEarned={lastStageXpEarned}
          onNextStage={() => {
            if (clearSummary.nextStageId) launchStage(clearSummary.nextStageId);
          }}
          onReplay={() => launchStage(clearSummary.stageId)}
          onWorldSelect={() => setScreen('WORLD_SELECT')}
        />
      )}

      {trialGateOpen && (
        <TrialGateModal
          summary={clearSummary}
          onConnectGmail={handleConnectGmailFromTrial}
          onReplay={() => {
            setTrialGateOpen(false);
            launchStage('1-2');
          }}
          onMenu={() => {
            setTrialGateOpen(false);
            setScreen('TITLE_MENU');
          }}
        />
      )}

      {screen === 'GAME_OVER' && (
        <GameOverModal
          score={gameOverStats.score}
          coins={gameOverStats.coins}
          onRetry={() => {
            updateSave((s) => {
              s.lives = 5;
            });
            launchStage(currentStage.id);
          }}
          onWorldSelect={() => {
            updateSave((s) => {
              s.lives = 5;
            });
            setScreen('WORLD_SELECT');
          }}
          onMenu={() => {
            updateSave((s) => {
              s.lives = 5;
            });
            setScreen('TITLE_MENU');
          }}
        />
      )}

      {screen === 'CAMPAIGN_VICTORY' && (
        <CampaignVictoryScreen
          saveData={saveData}
          onPlayAgain={() => launchStage('1-1')}
          onWorldSelect={() => setScreen('WORLD_SELECT')}
          onMenu={() => setScreen('TITLE_MENU')}
        />
      )}

      {modal === 'SETTINGS' && (
        <SettingsModal
          settings={settings}
          lang={settings.language}
          onUpdateSettings={handleUpdateSettings}
          onOpenLanguage={() => setShowLangSelector(true)}
          onOpenTutorial={() => setModal('TUTORIAL')}
          onResetSave={handleResetSave}
          onClose={() => setModal('NONE')}
        />
      )}

      {modal === 'ACHIEVEMENTS' && (
        <AchievementsModal saveData={saveData} onClose={() => setModal('NONE')} />
      )}

      {modal === 'CREDITS' && <CreditsModal onClose={() => setModal('NONE')} />}

      {modal === 'TUTORIAL' && (
        <TutorialModal
          lang={settings.language}
          skinId={economy.equippedSkin}
          webDesignId={economy.equippedWebDesign ?? 'classic_white'}
          onComplete={finishTutorial}
          onSkip={finishTutorial}
        />
      )}

      {promoEventId && (
        <ZaiEventPromoModal
          eventId={promoEventId}
          effectiveNow={effectiveNow}
          lang={settings.language}
          onClose={() => setPromoEventId(null)}
          onExploreCollection={() => {
            setPromoEventId(null);
            setMarketInitialTab('zai');
            setScreen('MARKETPLACE');
          }}
        />
      )}

      {showLangSelector && (
        <LanguageSelector
          currentLanguage={settings.language ? normalizeLangCode(settings.language) : null}
          isFirstLaunchGate={false}
          onSelectLanguage={handleSelectLanguage}
          onClose={() => setShowLangSelector(false)}
        />
      )}

      {loadingStageLabel && (
        <SeasonalLoadingOverlay
          calendar={calendar}
          skinId={economy.equippedSkin}
          stageLabel={loadingStageLabel}
        />
      )}

      {achievementToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pixel-panel px-4 py-2.5 border-amber-400/80 bg-slate-950/95 pointer-events-none">
          <span className="font-pixel text-xs text-amber-300">{achievementToast}</span>
        </div>
      )}
    </div>
  );
}
