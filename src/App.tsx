import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AchievementsScreen,
  CasesScreen,
  DailyRewardsScreen,
  InventoryScreen,
  LeaderboardScreen,
  MarketSectionTab,
  MarketplaceScreen,
  MissionsScreen,
  OwnersGiftScreen,
  SeasonPassScreen,
  TradingScreen,
} from './components/EconomyScreens';
import { Chapter2Canvas } from './components/Chapter2Canvas';
import {
  Chapter2GameOverModal,
  Chapter2SectorClearModal,
  Chapter2VictoryScreen,
} from './components/Chapter2Modals';
import { GameCanvas } from './components/GameCanvas';
import {
  AdminSidePanel,
  CreatorKeyModal,
  CreatorLoginResult,
  FriendsScreen,
} from './components/FriendsAndAdminModals';
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
  WorldSelectScreen,
} from './components/Menus';
import { SeasonalLoadingOverlay } from './components/SkinPreviewCanvas';
import {
  LocalAccountSetupScreen,
  ProfileScreen,
  WinterStartScreen,
} from './components/StartAndProfileScreens';
import { TutorialModal } from './components/TutorialModal';
import {
  ZaiEventPromoModal,
  ZaiEventsScreen,
  ZaiWarningBanner,
} from './components/ZaiEventAnnouncement';
import { audio } from './game/audio';
import {
  ALL_MISSIONS,
  ECONOMY_ACHIEVEMENTS,
  applyGameplayRewards,
  applyServerGiftsAction,
  buyCaseAction,
  buySeasonPassLevelAction,
  buySkinAction,
  buyWebDesignAction,
  claimBonusSeasonPassLevelAction,
  claimDailyRewardAction,
  claimHolidayGiftAction,
  claimMissionAction,
  claimSeasonPassLevelAction,
  createInitialEconomyData,
  deductFriendGiftAction,
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
import { LanguageCode, isRtlLanguage, normalizeLangCode, tr } from './game/i18n';
import {
  CHAPTER2_SECTOR_MAP,
  CHAPTER2_SECTORS,
  getNextChapter2SectorId,
} from './game/chapter2Levels';
import { ALL_STAGES, STAGE_MAP, getNextStageId } from './game/levels';
import {
  buildLocalLeaderboard,
  clearProfileProgressKeepIdentity,
  createLocalProfileWithMigration,
  executeNpcSkinSwap,
  exportSaveBackupJson,
  getActiveLocalProfile,
  importSaveBackupJson,
  loadAllLocalProfiles,
  loadCustomAvatarFromIdb,
  mirrorBackupToIdb,
  setActiveProfileId,
  updateLocalProfile,
  upsertCreatorLocalProfile,
} from './game/localPersistence';
import {
  SocialSnapshot,
  claimPendingGiftsApi,
  clearSocialSession,
  fetchMySocialApi,
  getSocialSessionUid,
  hasSocialToken,
  registerOrSyncAccountApi,
} from './game/socialApi';
import {
  buildSeasonPassLevels,
  getLiveCalendarInfo,
  getSeasonLevelFromXp,
} from './game/seasons';
import {
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
  Chapter2ClearSummary,
  EconomyData,
  GameSettings,
  LeaderboardEntry,
  ModalTab,
  SaveData,
  ScreenState,
  StageClearSummary,
  UserProfileData,
} from './game/types';
import {
  AnnualZaiEventId,
  ZaiEventSimMode,
  getActiveOrWarningZaiAnnouncement,
  getEffectiveEventClock,
} from './game/zaiCollection';

type BootPhase = 'WINTER_START' | 'LANGUAGE' | 'CREATE_ACCOUNT' | 'READY';

export default function App() {
  const [calendar, setCalendar] = useState(() => getLiveCalendarInfo());
  const [realNow, setRealNow] = useState<Date>(() => new Date());

  const [initialBootstrap] = useState(() => {
    const cal = getLiveCalendarInfo();
    const prof = getActiveLocalProfile();
    const loadedSettings = loadSettings();
    const save = prof ? loadSaveData(prof.uid) : createInitialSaveData();
    const econ = prof
      ? loadLocalEconomy(prof.uid, cal)
      : createInitialEconomyData('local', 0, 'classic', cal);
    save.totalCoins = econ.spikeyCoins;
    if (!loadedSettings.language && econ.selectedLanguage) {
      loadedSettings.language = econ.selectedLanguage;
    }
    return { prof, save, econ, loadedSettings };
  });

  const [bootPhase, setBootPhase] = useState<BootPhase>('WINTER_START');
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(
    initialBootstrap.prof
  );
  const [saveData, setSaveData] = useState<SaveData>(initialBootstrap.save);
  const [economy, setEconomy] = useState<EconomyData>(initialBootstrap.econ);
  const [settings, setSettings] = useState<GameSettings>(
    initialBootstrap.loadedSettings
  );

  const [screen, setScreen] = useState<ScreenState>('TITLE_MENU');
  const [modal, setModal] = useState<ModalTab>('NONE');
  const [activeStageId, setActiveStageId] = useState<string>(
    initialBootstrap.save.currentStageId || '1-1'
  );
  const [activeChapter2SectorId, setActiveChapter2SectorId] = useState<string>(
    initialBootstrap.save.chapter2CurrentSectorId || 'C2-1'
  );
  const [restartNonce, setRestartNonce] = useState(0);
  const [clearSummary, setClearSummary] = useState<StageClearSummary | null>(null);
  const [ch2ClearSummary, setCh2ClearSummary] = useState<Chapter2ClearSummary | null>(null);
  const [gameOverStats, setGameOverStats] = useState({ score: 0, coins: 0 });
  const [ch2GameOverStats, setCh2GameOverStats] = useState({ score: 0, coins: 0 });
  const [achievementToast, setAchievementToast] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() =>
    buildLocalLeaderboard(
      initialBootstrap.prof,
      initialBootstrap.save,
      initialBootstrap.econ,
      calendar
    )
  );
  const [pendingCaseToSpin, setPendingCaseToSpin] = useState<CaseType | null>(null);
  const [loadingStageLabel, setLoadingStageLabel] = useState<string | null>(null);

  const [simMode, setSimMode] = useState<ZaiEventSimMode>('live');
  const [simTargetEventId, setSimTargetEventId] =
    useState<AnnualZaiEventId>('zai_summer');
  const [simAnchorRealMs, setSimAnchorRealMs] = useState<number>(() => Date.now());
  const [promoEventId, setPromoEventId] = useState<AnnualZaiEventId | null>(null);
  const [marketInitialTab, setMarketInitialTab] =
    useState<MarketSectionTab>('featured');
  const [showLangSelector, setShowLangSelector] = useState(false);
  const [lastStageXpEarned, setLastStageXpEarned] = useState(0);
  const [socialState, setSocialState] = useState<SocialSnapshot | null>(null);
  const [ownerPanelOpen, setOwnerPanelOpen] = useState(false);
  const [pendingWinterCreatorAuth, setPendingWinterCreatorAuth] = useState(false);

  const latestEconomyRef = useRef<EconomyData>(economy);
  latestEconomyRef.current = economy;
  const latestSaveRef = useRef<SaveData>(saveData);
  latestSaveRef.current = saveData;
  const latestProfileRef = useRef<UserProfileData | null>(userProfile);
  latestProfileRef.current = userProfile;
  const loadingTimerRef = useRef<number | null>(null);
  const prevZaiPhaseRef = useRef<string>('none');
  const tutorialCheckedRef = useRef(false);

  // Hydrate custom avatar from IndexedDB for active profile on mount
  useEffect(() => {
    const uid = initialBootstrap.prof?.uid;
    if (!uid) return;
    let active = true;
    void loadCustomAvatarFromIdb(uid).then((dataUrl) => {
      if (!active || !dataUrl) return;
      setUserProfile((prev) => {
        if (!prev || prev.uid !== uid) return prev;
        if (prev.customAvatarDataUrl === dataUrl) return prev;
        return { ...prev, customAvatarDataUrl: dataUrl };
      });
    });
    return () => {
      active = false;
    };
  }, [initialBootstrap.prof?.uid]);

  // Listen for fallback custom event if triggered from LocalAccountSetupScreen
  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<{ target?: 'CASES' | 'TITLE_MENU' }>).detail;
      const target = detail?.target === 'CASES' ? 'CASES' : 'TITLE_MENU';
      setBootPhase('READY');
      setScreen(target);
    };
    window.addEventListener('spikey:enter-after-account', handler);
    return () => window.removeEventListener('spikey:enter-after-account', handler);
  }, []);

  // Live 1-second clock + calendar rollover check
  useEffect(() => {
    const secId = window.setInterval(() => {
      setRealNow(new Date());
    }, 1000);
    const calId = window.setInterval(() => {
      const next = getLiveCalendarInfo();
      setCalendar((prev) =>
        prev.dateKey === next.dateKey && prev.monthKey === next.monthKey ? prev : next
      );
    }, 60_000);
    return () => {
      window.clearInterval(secId);
      window.clearInterval(calId);
    };
  }, []);

  const showToast = useCallback((text: string) => {
    setAchievementToast(text);
    window.setTimeout(() => {
      setAchievementToast((prev) => (prev === text ? null : prev));
    }, 3400);
  }, []);

  const refreshLeaderboard = useCallback(
    (
      prof = latestProfileRef.current,
      save = latestSaveRef.current,
      econ = latestEconomyRef.current
    ) => {
      setLeaderboard(buildLocalLeaderboard(prof, save, econ, getLiveCalendarInfo()));
    },
    []
  );

  // Centralized local Economy + Save + IndexedDB mirror commit
  const commitEconomy = useCallback(
    (nextEcon: EconomyData, newlyEconomyAch: string[] = []) => {
      latestEconomyRef.current = nextEcon;
      setEconomy(nextEcon);

      const storageId = latestProfileRef.current?.uid ?? 'local';
      persistLocalEconomy(nextEcon, storageId);

      const updatedSave = structuredClone(latestSaveRef.current);
      if (updatedSave.totalCoins !== nextEcon.spikeyCoins) {
        updatedSave.totalCoins = nextEcon.spikeyCoins;
        latestSaveRef.current = updatedSave;
        setSaveData(updatedSave);
        persistSaveData(updatedSave, storageId);
      }

      if (latestProfileRef.current) {
        void mirrorBackupToIdb({
          profile: latestProfileRef.current,
          saveData: updatedSave,
          economy: nextEcon,
          updatedAt: new Date().toISOString(),
        });
      }

      if (newlyEconomyAch.length > 0) {
        const ach = ECONOMY_ACHIEVEMENTS.find((a) => a.id === newlyEconomyAch[0]);
        if (ach) {
          audio.playSfx('chest');
          showToast(
            tr(settings.language, 'toastAchievementUnlocked', { title: ach.title })
          );
        }
      }
    },
    [settings.language, showToast]
  );

  // Sync audio volumes with settings
  useEffect(() => {
    audio.setVolumes(settings.musicVolume, settings.sfxVolume);
  }, [settings.musicVolume, settings.sfxVolume]);

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

  // Auto-open interactive video tutorial on every entry into the game
  useEffect(() => {
    if (
      bootPhase === 'READY' &&
      settings.language &&
      screen === 'TITLE_MENU' &&
      modal === 'NONE' &&
      !tutorialCheckedRef.current
    ) {
      tutorialCheckedRef.current = true;
      setModal('TUTORIAL');
    }
  }, [bootPhase, settings.language, screen, modal]);

  // Seasonal & Menu music management
  useEffect(() => {
    if (bootPhase !== 'READY') return;
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
      screen === 'FRIENDS' ||
      screen === 'OWNERS_GIFT' ||
      screen === 'EVENTS' ||
      screen === 'PROFILE';

    if (isMenuOrEconomyScreen) {
      audio.playMusic(calendar.season.musicTrack);
    } else if (screen === 'CAMPAIGN_VICTORY') {
      audio.playMusic('victory');
    } else if (screen === 'CHAPTER2_VICTORY') {
      audio.playMusic('ch2Victory');
    }
  }, [screen, bootPhase, calendar.season.musicTrack]);

  const claimAndApplyServerGifts = useCallback(async () => {
    if (!hasSocialToken()) return;
    try {
      const res = await claimPendingGiftsApi();
      if (res.ok && res.gifts && res.gifts.length > 0) {
        const applied = applyServerGiftsAction(
          latestEconomyRef.current,
          res.gifts,
          getLiveCalendarInfo()
        );
        if (applied.appliedCount > 0) {
          audio.playSfx('mythicFanfare');
          commitEconomy(applied.next, applied.newlyAchievements);
          showToast(
            tr(settings.language, 'claimedGiftsToast', {
              count: applied.appliedCount,
            })
          );
        }
      }
    } catch {
      // Ignore transient offline errors
    }
  }, [commitEconomy, settings.language, showToast]);

  const syncSocialProfile = useCallback(async () => {
    const prof = latestProfileRef.current;
    if (!prof || !prof.profileCompleted) return;
    try {
      if (prof.isCreator) {
        if (hasSocialToken() && getSocialSessionUid() === prof.uid) {
          const me = await fetchMySocialApi();
          if (me.ok && me.social) {
            setSocialState(me.social);
          }
          await claimAndApplyServerGifts();
        }
        return;
      }

      const reg = await registerOrSyncAccountApi({
        uid: prof.uid,
        nickname: prof.nickname,
        avatarId: prof.avatarId,
        existingAccountId: prof.accountId,
      });
      if (reg.ok && reg.account) {
        if (prof.accountId !== reg.account.accountId) {
          const updated = updateLocalProfile(prof.uid, {
            accountId: reg.account.accountId,
          });
          if (updated) {
            latestProfileRef.current = updated;
            setUserProfile(updated);
          }
        }
        if (reg.social) {
          setSocialState(reg.social);
        }
        await claimAndApplyServerGifts();
      }
    } catch {
      // Offline / transient network errors are non-fatal
    }
  }, [claimAndApplyServerGifts]);

  useEffect(() => {
    if (bootPhase !== 'READY' || !userProfile?.uid) return;
    void syncSocialProfile();
  }, [bootPhase, userProfile?.uid, userProfile?.nickname, userProfile?.avatarId, syncSocialProfile]);

  useEffect(() => {
    if (bootPhase !== 'READY' || screen === 'PLAYING') return;
    const id = window.setInterval(() => {
      if (!hasSocialToken()) return;
      void fetchMySocialApi().then((me) => {
        if (me.ok && me.social) setSocialState(me.social);
      });
      void claimAndApplyServerGifts();
    }, 8000);
    return () => window.clearInterval(id);
  }, [bootPhase, screen, claimAndApplyServerGifts]);

  const triggerSeasonalLoading = useCallback((label: string, ms = 700) => {
    if (loadingTimerRef.current) {
      window.clearTimeout(loadingTimerRef.current);
    }
    setLoadingStageLabel(label);
    loadingTimerRef.current = window.setTimeout(() => {
      setLoadingStageLabel(null);
      loadingTimerRef.current = null;
    }, ms);
  }, []);

  const updateSave = useCallback(
    (
      updater: (draft: SaveData) => void,
      achContext?: { noDamageClear?: boolean; stageCrystalsAll?: boolean }
    ) => {
      const storageId = latestProfileRef.current?.uid ?? 'local';
      setSaveData((prev) => {
        const next = structuredClone(prev);
        updater(next);
        next.totalCoins = latestEconomyRef.current.spikeyCoins;
        const newly = evaluateAchievements(next, achContext);
        persistSaveData(next, storageId);
        latestSaveRef.current = next;
        if (latestProfileRef.current) {
          void mirrorBackupToIdb({
            profile: latestProfileRef.current,
            saveData: next,
            economy: latestEconomyRef.current,
            updatedAt: new Date().toISOString(),
          });
        }
        if (newly.length > 0) {
          const first = ACHIEVEMENTS.find((a) => a.id === newly[0]);
          if (first) {
            showToast(
              tr(settings.language, 'toastAchievementUnlocked', {
                title: first.title,
              })
            );
          }
        }
        return next;
      });
    },
    [settings.language, showToast]
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
        latestEconomyRef.current = updatedEcon;
        setEconomy(updatedEcon);
        if (latestProfileRef.current?.uid) {
          persistLocalEconomy(updatedEcon, latestProfileRef.current.uid);
        }
      }

      if (bootPhase === 'LANGUAGE') {
        setBootPhase('CREATE_ACCOUNT');
      }
    },
    [settings, bootPhase]
  );

  const finishTutorial = useCallback(() => {
    setModal('NONE');
    if (!settings.tutorialWatched) {
      handleUpdateSettings({ ...settings, tutorialWatched: true });
    }
  }, [settings, handleUpdateSettings]);

  const handleResetSave = useCallback(() => {
    const prof = latestProfileRef.current;
    if (!prof) return;
    const { saveData: freshSave, economy: freshEcon } =
      clearProfileProgressKeepIdentity(prof, getLiveCalendarInfo());
    freshEcon.selectedLanguage = settings.language || 'en';
    persistLocalEconomy(freshEcon, prof.uid);
    latestSaveRef.current = freshSave;
    latestEconomyRef.current = freshEcon;
    setSaveData(freshSave);
    setEconomy(freshEcon);
    setActiveStageId('1-1');
    refreshLeaderboard(prof, freshSave, freshEcon);
    showToast(tr(settings.language, 'resetSave') + ' ✓');
  }, [settings.language, refreshLeaderboard, showToast]);

  const handleWinterContinue = useCallback(() => {
    audio.unlock();
    const active = getActiveLocalProfile();
    if (active && active.profileCompleted) {
      // ALWAYS require Creator password when entering the Admin account (even for the owner!)
      if (active.isCreator) {
        clearSocialSession();
        setPendingWinterCreatorAuth(true);
        return;
      }
      const calNow = getLiveCalendarInfo();
      const loadedSave = loadSaveData(active.uid);
      const loadedEcon = loadLocalEconomy(active.uid, calNow);
      loadedSave.totalCoins = loadedEcon.spikeyCoins;
      setUserProfile(active);
      setSaveData(loadedSave);
      setEconomy(loadedEcon);
      latestProfileRef.current = active;
      latestSaveRef.current = loadedSave;
      latestEconomyRef.current = loadedEcon;
      setActiveStageId(loadedSave.currentStageId || '1-1');
      if (!settings.language) {
        const resolvedLang = loadedEcon.selectedLanguage || 'en';
        const nextSet = { ...settings, language: resolvedLang };
        setSettings(nextSet);
        persistSettings(nextSet);
      }
      tutorialCheckedRef.current = false;
      setBootPhase('READY');
      setScreen('TITLE_MENU');
      triggerSeasonalLoading(calNow.bannerLine1, 650);
    } else {
      setBootPhase('LANGUAGE');
    }
  }, [settings, triggerSeasonalLoading]);

  const handleCreateLocalAccount = useCallback(
    (payload: {
      nickname: string;
      avatarId: string;
      customAvatarDataUrl: string | null;
    }) => {
      const calNow = getLiveCalendarInfo();
      const langCode = settings.language || 'en';
      const result = createLocalProfileWithMigration(
        {
          nickname: payload.nickname,
          avatarId: payload.avatarId,
          customAvatarDataUrl: payload.customAvatarDataUrl,
          language: langCode,
        },
        calNow
      );
      setUserProfile(result.profile);
      setSaveData(result.saveData);
      setEconomy(result.economy);
      latestProfileRef.current = result.profile;
      latestSaveRef.current = result.saveData;
      latestEconomyRef.current = result.economy;
      setActiveStageId(result.saveData.currentStageId || '1-1');
      refreshLeaderboard(result.profile, result.saveData, result.economy);
      return { migratedLegacy: result.migratedLegacy };
    },
    [settings.language, refreshLeaderboard]
  );

  const handleUpdateProfile = useCallback(
    (patch: Partial<UserProfileData>) => {
      const cur = latestProfileRef.current;
      if (!cur) return;
      const safePatch: Partial<
        Pick<
          UserProfileData,
          'nickname' | 'avatarId' | 'customAvatarDataUrl' | 'profileFrame' | 'spiderColor'
        >
      > = {};
      if (!cur.isCreator && patch.nickname !== undefined) safePatch.nickname = patch.nickname;
      if (patch.avatarId !== undefined) safePatch.avatarId = patch.avatarId;
      if (patch.customAvatarDataUrl !== undefined) {
        safePatch.customAvatarDataUrl = patch.customAvatarDataUrl;
      }
      if (patch.profileFrame !== undefined) safePatch.profileFrame = patch.profileFrame;
      if (patch.spiderColor !== undefined) safePatch.spiderColor = patch.spiderColor;

      const updated = updateLocalProfile(cur.uid, safePatch);
      if (!updated) return;
      setUserProfile(updated);
      latestProfileRef.current = updated;
      refreshLeaderboard(updated, latestSaveRef.current, latestEconomyRef.current);
    },
    [refreshLeaderboard]
  );

  const handleCreatorLogin = useCallback(
    (result: CreatorLoginResult) => {
      const calNow = getLiveCalendarInfo();
      const langCode = settings.language || 'en';
      const vip = upsertCreatorLocalProfile(result.account.accountId, calNow);
      if (langCode && vip.economy.selectedLanguage !== langCode) {
        vip.economy.selectedLanguage = langCode;
        persistLocalEconomy(vip.economy, vip.profile.uid);
      }
      setUserProfile(vip.profile);
      setSaveData(vip.saveData);
      setEconomy(vip.economy);
      latestProfileRef.current = vip.profile;
      latestSaveRef.current = vip.saveData;
      latestEconomyRef.current = vip.economy;
      setSocialState(result.social ?? null);
      setActiveStageId(vip.saveData.currentStageId || '1-1');
      refreshLeaderboard(vip.profile, vip.saveData, vip.economy);
      tutorialCheckedRef.current = false;
      setBootPhase('READY');
      setScreen('TITLE_MENU');
      triggerSeasonalLoading(calNow.bannerLine1, 650);
      showToast('Admin VIP ✓');
    },
    [settings.language, refreshLeaderboard, triggerSeasonalLoading, showToast]
  );

  const handleSwitchProfile = useCallback(
    (uid: string) => {
      const all = loadAllLocalProfiles();
      const found = all.find((p) => p.uid === uid);
      if (!found || found.isCreator) return;
      clearSocialSession();
      setOwnerPanelOpen(false);
      setSocialState(null);
      setActiveProfileId(uid);
      const calNow = getLiveCalendarInfo();
      const nextSave = loadSaveData(uid);
      const nextEcon = loadLocalEconomy(uid, calNow);
      nextSave.totalCoins = nextEcon.spikeyCoins;
      setUserProfile(found);
      setSaveData(nextSave);
      setEconomy(nextEcon);
      latestProfileRef.current = found;
      latestSaveRef.current = nextSave;
      latestEconomyRef.current = nextEcon;
      setActiveStageId(nextSave.currentStageId || '1-1');
      void loadCustomAvatarFromIdb(uid).then((dataUrl) => {
        if (!dataUrl) return;
        setUserProfile((prev) =>
          prev && prev.uid === uid ? { ...prev, customAvatarDataUrl: dataUrl } : prev
        );
      });
      refreshLeaderboard(found, nextSave, nextEcon);
      tutorialCheckedRef.current = false;
      setScreen('TITLE_MENU');
      showToast(tr(settings.language, 'returningHeroWelcome', { name: found.nickname }));
    },
    [refreshLeaderboard, settings.language, showToast]
  );

  const handleExportBackup = useCallback(() => {
    const prof = latestProfileRef.current;
    if (!prof) return;
    const json = exportSaveBackupJson({
      profile: prof,
      saveData: latestSaveRef.current,
      economy: latestEconomyRef.current,
      settings,
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spider-spikey-backup-${calendar.dateKey}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [settings, calendar.dateKey]);

  const handleImportBackup = useCallback(
    (rawText: string): { ok: boolean; message: string } => {
      const res = importSaveBackupJson(rawText, getLiveCalendarInfo());
      if (!res.ok) {
        return { ok: false, message: tr(settings.language, 'backupInvalidMsg') };
      }
      setUserProfile(res.profile);
      setSaveData(res.saveData);
      setEconomy(res.economy);
      setSettings(res.settings);
      latestProfileRef.current = res.profile;
      latestSaveRef.current = res.saveData;
      latestEconomyRef.current = res.economy;
      setActiveStageId(res.saveData.currentStageId || '1-1');
      refreshLeaderboard(res.profile, res.saveData, res.economy);
      return {
        ok: true,
        message: tr(res.settings.language ?? settings.language, 'backupSuccessMsg'),
      };
    },
    [settings.language, refreshLeaderboard]
  );

  const launchStage = useCallback(
    (stageId: string) => {
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
      setRestartNonce((n) => n + 1);
      setScreen('PLAYING');
      triggerSeasonalLoading(`${stage.id} · ${stage.name}`, 750);
    },
    [updateSave, triggerSeasonalLoading]
  );

  const handlePlay = useCallback(() => {
    launchStage('1-1');
  }, [launchStage]);

  const handleContinue = useCallback(() => {
    const target = saveData.currentStageId || '1-1';
    launchStage(target);
  }, [launchStage, saveData.currentStageId]);

  const handleStageClear = useCallback(
    (summary: StageClearSummary) => {
      const nextId = getNextStageId(summary.stageId);
      const stageCrystalsAll = summary.crystalsCollected.every(Boolean);
      const calNow = getLiveCalendarInfo();

      const { next: nextEcon, newlyAchievements, xpEarned } = applyGameplayRewards(
        latestEconomyRef.current,
        {
          txId: `clear_${summary.stageId}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 5)}`,
          coinsEarned: summary.coinsEarned,
          crystalsFound: summary.crystalsCollected.filter(Boolean).length,
          enemiesDefeated: summary.enemiesDefeatedCount ?? 0,
          bossDefeated: summary.isBossStage,
          stageCompleted: true,
          housesBuiltCount: summary.housesBuiltCount ?? 0,
          webSwingsCount: summary.webSwingsCount ?? 0,
          secretsFoundCount: summary.secretsFoundCount ?? 0,
          noDamage: summary.noDamageBonus,
          timeSec: summary.timeSec,
          allCrystals: stageCrystalsAll,
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
            (i) =>
              Boolean(prevProg?.crystals[i]) ||
              Boolean(summary.crystalsCollected[i])
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

          if (nextId) {
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

      if (summary.isFinalBoss) {
        updateSave((s) => {
          s.chapter2Unlocked = true;
          if (!s.chapter2UnlockedSectors || s.chapter2UnlockedSectors.length === 0) {
            s.chapter2UnlockedSectors = ['C2-1'];
          }
        });
        setScreen('CAMPAIGN_VICTORY');
      } else {
        setClearSummary({ ...summary, nextStageId: nextId });
        setScreen('STAGE_CLEAR');
      }
    },
    [updateSave, commitEconomy]
  );

  const launchChapter2Sector = useCallback(
    (sectorId: string) => {
      audio.unlock();
      const sector = CHAPTER2_SECTOR_MAP[sectorId] ?? CHAPTER2_SECTORS[0];
      updateSave((s) => {
        s.chapter2Unlocked = true;
        s.chapter2CurrentSectorId = sector.id;
        if (!s.chapter2UnlockedSectors) s.chapter2UnlockedSectors = ['C2-1'];
        if (!s.chapter2UnlockedSectors.includes(sector.id)) {
          s.chapter2UnlockedSectors.push(sector.id);
        }
        if (s.lives <= 0) s.lives = 5;
      });
      setActiveChapter2SectorId(sector.id);
      setCh2ClearSummary(null);
      setRestartNonce((n) => n + 1);
      setScreen('CHAPTER2_PLAYING');
      triggerSeasonalLoading(`CH2 · ${sector.id} · ${sector.name}`, 700);
    },
    [updateSave, triggerSeasonalLoading]
  );

  const handleChapter2SectorClear = useCallback(
    (summary: Chapter2ClearSummary) => {
      const nextId = getNextChapter2SectorId(summary.sectorId);
      const calNow = getLiveCalendarInfo();

      const { next: nextEcon, newlyAchievements } = applyGameplayRewards(
        latestEconomyRef.current,
        {
          txId: `ch2_clear_${summary.sectorId}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 5)}`,
          coinsEarned: summary.coinsEarned,
          crystalsFound: summary.stars,
          enemiesDefeated: summary.enemiesDefeatedCount,
          bossDefeated: summary.isBossSector,
          stageCompleted: true,
          noDamage: summary.noDamageBonus,
          timeSec: summary.timeSec,
        },
        calNow
      );
      commitEconomy(nextEcon, newlyAchievements);

      updateSave((s) => {
        s.chapter2Unlocked = true;
        s.totalCoins = nextEcon.spikeyCoins;
        s.totalScore += summary.scoreEarned;
        if (!s.chapter2Progress) s.chapter2Progress = {};
        const prev = s.chapter2Progress[summary.sectorId];
        s.chapter2Progress[summary.sectorId] = {
          completed: true,
          bestScore: Math.max(prev?.bestScore ?? 0, summary.scoreEarned),
          bestTimeSec: prev?.bestTimeSec
            ? Math.min(prev.bestTimeSec, summary.timeSec)
            : summary.timeSec,
          stars: Math.max(prev?.stars ?? 0, summary.stars),
        };
        if (!s.chapter2UnlockedSectors) s.chapter2UnlockedSectors = ['C2-1'];
        if (nextId && !s.chapter2UnlockedSectors.includes(nextId)) {
          s.chapter2UnlockedSectors.push(nextId);
        }
        if (nextId) {
          s.chapter2CurrentSectorId = nextId;
        }
      });

      if (summary.isFinalChapter2Boss) {
        setScreen('CHAPTER2_VICTORY');
      } else {
        setCh2ClearSummary({ ...summary, nextSectorId: nextId });
        setScreen('CHAPTER2_CLEAR');
      }
    },
    [updateSave, commitEconomy]
  );

  const handleChapter2GameOver = useCallback(
    (score: number, coins: number) => {
      if (coins > 0) {
        const { next, newlyAchievements } = applyGameplayRewards(
          latestEconomyRef.current,
          {
            txId: `ch2_gameover_${activeChapter2SectorId}_${Date.now()}`,
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
      setCh2GameOverStats({ score, coins });
      setScreen('CHAPTER2_GAME_OVER');
    },
    [activeChapter2SectorId, commitEconomy]
  );

  const handleChapter2PauseToggle = useCallback(() => {
    setScreen((prev) => {
      if (prev === 'CHAPTER2_PLAYING') return 'CHAPTER2_PAUSED';
      if (prev === 'CHAPTER2_PAUSED') return 'CHAPTER2_PLAYING';
      return prev;
    });
  }, []);

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

  // Main menu badge counters (Standard + Bonus Season Pass tracks, Daily Reward, Missions)
  const seasonClaimReadyCount = useMemo(() => {
    const curLvl = getSeasonLevelFromXp(economy.seasonXp);
    const lvls = buildSeasonPassLevels(calendar.month);
    const claimedBonus = economy.claimedBonusSeasonLevels ?? [];
    return lvls.filter(
      (l) =>
        l.level <= curLvl &&
        (!economy.claimedSeasonLevels.includes(l.level) ||
          !claimedBonus.includes(l.level))
    ).length;
  }, [
    economy.seasonXp,
    economy.claimedSeasonLevels,
    economy.claimedBonusSeasonLevels,
    calendar.month,
  ]);

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

  const uiLang = settings.language || economy.selectedLanguage || 'en';

  // Phase 1: Winter Start Screen ("CONTINUE")
  if (bootPhase === 'WINTER_START') {
    return (
      <div
        className="relative w-screen h-screen overflow-hidden bg-[#06101f]"
        dir={isRtlLanguage(uiLang) ? 'rtl' : 'ltr'}
      >
        <WinterStartScreen
          lang={uiLang}
          activeProfile={userProfile}
          economy={economy}
          onContinue={handleWinterContinue}
          onOpenLanguage={() => setShowLangSelector(true)}
        />
        {showLangSelector && (
          <LanguageSelector
            currentLanguage={
              settings.language ? normalizeLangCode(settings.language) : null
            }
            isFirstLaunchGate={false}
            onSelectLanguage={handleSelectLanguage}
            onClose={() => setShowLangSelector(false)}
          />
        )}
        {pendingWinterCreatorAuth && (
          <CreatorKeyModal
            lang={uiLang}
            subtitleOverride={tr(uiLang, 'adminPasswordRequiredMsg')}
            onSuccess={(result) => {
              setPendingWinterCreatorAuth(false);
              handleCreatorLogin(result);
            }}
            onOpenNormalAccount={() => {
              setPendingWinterCreatorAuth(false);
              const normalProfiles = loadAllLocalProfiles().filter((p) => !p.isCreator);
              if (normalProfiles.length > 0) {
                const chosen = normalProfiles[0];
                const calNow = getLiveCalendarInfo();
                const nextSave = loadSaveData(chosen.uid);
                const nextEcon = loadLocalEconomy(chosen.uid, calNow);
                nextSave.totalCoins = nextEcon.spikeyCoins;
                setActiveProfileId(chosen.uid);
                setUserProfile(chosen);
                setSaveData(nextSave);
                setEconomy(nextEcon);
                latestProfileRef.current = chosen;
                latestSaveRef.current = nextSave;
                latestEconomyRef.current = nextEcon;
                setActiveStageId(nextSave.currentStageId || '1-1');
                setBootPhase('READY');
                setScreen('TITLE_MENU');
                triggerSeasonalLoading(calNow.bannerLine1, 650);
              } else {
                setBootPhase(settings.language ? 'CREATE_ACCOUNT' : 'LANGUAGE');
              }
            }}
            onClose={() => setPendingWinterCreatorAuth(false)}
          />
        )}
      </div>
    );
  }

  // Phase 2: First-Launch 38-Language Selection Screen
  if (bootPhase === 'LANGUAGE') {
    return (
      <div className="relative w-screen h-screen overflow-hidden bg-[#050811]">
        <LanguageSelector
          currentLanguage={
            settings.language ? normalizeLangCode(settings.language) : null
          }
          isFirstLaunchGate={true}
          onSelectLanguage={handleSelectLanguage}
        />
      </div>
    );
  }

  // Phase 3: Local Account Setup Screen (Nickname + Avatar + Auto-Migration + 2 Free Common Cases)
  if (bootPhase === 'CREATE_ACCOUNT' || !userProfile) {
    return (
      <div
        className="relative w-screen h-screen overflow-y-auto bg-[#060b16]"
        dir={isRtlLanguage(uiLang) ? 'rtl' : 'ltr'}
      >
        <LocalAccountSetupScreen
          lang={uiLang}
          onCreateAccount={handleCreateLocalAccount}
          onCreatorLogin={handleCreatorLogin}
          onFinishSetup={(target) => {
            tutorialCheckedRef.current = false;
            setBootPhase('READY');
            setScreen(target);
            triggerSeasonalLoading(calendar.bannerLine1, 700);
          }}
          onBackToLanguage={() => {
            if (userProfile) {
              setBootPhase('READY');
              setScreen('PROFILE');
            } else {
              setBootPhase('LANGUAGE');
            }
          }}
        />
      </div>
    );
  }

  const currentStage = STAGE_MAP[activeStageId] ?? ALL_STAGES[0];
  const currentCh2Sector =
    CHAPTER2_SECTOR_MAP[activeChapter2SectorId] ?? CHAPTER2_SECTORS[0];
  const inGameView =
    screen === 'PLAYING' ||
    screen === 'PAUSED' ||
    screen === 'STAGE_CLEAR' ||
    screen === 'GAME_OVER';
  const inChapter2View =
    screen === 'CHAPTER2_PLAYING' ||
    screen === 'CHAPTER2_PAUSED' ||
    screen === 'CHAPTER2_CLEAR' ||
    screen === 'CHAPTER2_GAME_OVER';

  const alertDismissed =
    (settings.dismissedZaiAlertKey ?? null) === zaiAnnouncement.eventInstanceKey;
  const reopenZaiAlert =
    zaiAnnouncement.phase !== 'none'
      ? {
          active: alertDismissed || settings.notificationsEnabled === false,
          isRelease: zaiAnnouncement.phase === 'active_now',
          label: tr(
            uiLang,
            zaiAnnouncement.phase === 'active_now'
              ? 'activeNow'
              : 'reopenEventAlert'
          ),
          onClick: () =>
            handleUpdateSettings({
              ...settings,
              dismissedZaiAlertKey: null,
              notificationsEnabled: true,
            }),
        }
      : null;

  return (
    <div
      className={`flex flex-col relative w-screen h-screen overflow-hidden bg-[#090d16] ${
        settings.reducedMotion ? 'reduce-motion' : ''
      } ${settings.highContrastHud ? 'high-contrast-hud' : ''}`}
      dir={isRtlLanguage(uiLang) ? 'rtl' : 'ltr'}
    >
      {screen !== 'CAMPAIGN_VICTORY' &&
        screen !== 'CHAPTER2_VICTORY' &&
        !inChapter2View && (
          <ZaiWarningBanner
            snapshot={zaiAnnouncement}
            lang={uiLang}
            compactGameplay={inGameView && screen === 'PLAYING'}
            dismissed={alertDismissed}
            notificationsEnabled={settings.notificationsEnabled !== false}
            onDismiss={() =>
              handleUpdateSettings({
                ...settings,
                dismissedZaiAlertKey: zaiAnnouncement.eventInstanceKey,
              })
            }
            onReopen={() =>
              handleUpdateSettings({
                ...settings,
                dismissedZaiAlertKey: null,
                notificationsEnabled: true,
              })
            }
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
          lang={uiLang}
          menuThemeMode={settings.menuThemeMode}
          graphicsQuality={settings.graphicsQuality}
          reopenZaiAlert={reopenZaiAlert}
          profile={userProfile}
          incomingTradesCount={0}
          pendingFriendRequestsCount={socialState?.incomingRequests.length ?? 0}
          dailyClaimReady={dailyClaimReady}
          seasonClaimReadyCount={seasonClaimReadyCount}
          missionsClaimReadyCount={missionsClaimReadyCount}
          onToggleSeasonTheme={() =>
            handleUpdateSettings({
              ...settings,
              menuThemeMode:
                settings.menuThemeMode === 'winter' ? 'live' : 'winter',
            })
          }
          onOpenLanguage={() => setShowLangSelector(true)}
          onOpenTutorial={() => setModal('TUTORIAL')}
          onOpenOwnerPanel={
            userProfile.isCreator ? () => setOwnerPanelOpen(true) : undefined
          }
          onPlay={handlePlay}
          onContinue={handleContinue}
          onEnterChapter2={() =>
            launchChapter2Sector(saveData.chapter2CurrentSectorId || 'C2-1')
          }
          onNavigateScreen={(target) => {
            if (target === 'MARKETPLACE') setMarketInitialTab('featured');
            setScreen(target);
            if (target === 'LEADERBOARD') {
              refreshLeaderboard();
            }
            if (target === 'FRIENDS') {
              void syncSocialProfile();
            }
          }}
          onOpenModal={(tab) => setModal(tab)}
        />
      )}

      {screen === 'WORLD_SELECT' && (
        <WorldSelectScreen
          saveData={saveData}
          isCreator={Boolean(userProfile.isCreator || economy.isCreator)}
          lang={uiLang}
          onSelectStage={launchStage}
          onSelectChapter2Sector={launchChapter2Sector}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'PROFILE' && (
        <ProfileScreen
          lang={uiLang}
          profile={userProfile}
          saveData={saveData}
          economy={economy}
          onUpdateProfile={handleUpdateProfile}
          onEquipFrame={(frameId) => {
            const nextEcon: EconomyData = {
              ...economy,
              equippedProfileFrame: frameId,
            };
            commitEconomy(nextEcon);
          }}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          onSwitchProfile={handleSwitchProfile}
          onCreateNewProfile={() => setBootPhase('CREATE_ACCOUNT')}
          onCreatorLogin={handleCreatorLogin}
          onResetSave={handleResetSave}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'SEASON_PASS' && (
        <SeasonPassScreen
          economy={economy}
          calendar={calendar}
          lang={uiLang}
          onClaimLevel={(lvl) => {
            const res = claimSeasonPassLevelAction(economy, lvl, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(`${lvl} · ${res.labelUz}`);
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onClaimBonusLevel={(lvl) => {
            const res = claimBonusSeasonPassLevelAction(
              economy,
              lvl,
              calendar
            );
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(`BONUS ${lvl} · ${res.labelUz}`);
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onBuyNextLevel={() => {
            const res = buySeasonPassLevelAction(economy, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(`LVL ${res.newLevel} (-${res.cost?.toLocaleString()} 💰)`);
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
          lang={uiLang}
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
          key={marketInitialTab}
          economy={economy}
          calendar={calendar}
          effectiveNow={effectiveNow}
          lang={uiLang}
          initialTab={marketInitialTab}
          onBuySkin={(skinId) => {
            const res = buySkinAction(economy, skinId, calendar, effectiveNow);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(tr(uiLang, 'toastSkinBought'));
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
              showToast(
                tr(uiLang, 'toastSoldCoins', {
                  amount: res.soldPrice.toLocaleString(),
                })
              );
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onBuyWebDesign={(webId) => {
            const res = buyWebDesignAction(
              economy,
              webId,
              calendar,
              effectiveNow
            );
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(tr(uiLang, 'toastWebBought'));
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
              showToast(
                tr(uiLang, 'toastSoldCoins', {
                  amount: res.soldPrice.toLocaleString(),
                })
              );
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onBuyCase={(caseType) => {
            const res = buyCaseAction(
              economy,
              caseType,
              calendar,
              effectiveNow
            );
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next);
              showToast(tr(uiLang, 'toastCaseBought'));
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
          lang={uiLang}
          initialCaseToSpin={pendingCaseToSpin}
          onBuyCase={(caseType) => {
            const res = buyCaseAction(
              economy,
              caseType,
              calendar,
              effectiveNow
            );
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next);
              showToast(tr(uiLang, 'toastCaseBought'));
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
              showToast(tr(uiLang, 'toastSkinEquipped'));
            }
          }}
          onSellSkin={(skinId) => {
            const res = sellSkinAction(economy, skinId, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(
                tr(uiLang, 'toastSoldCoins', {
                  amount: res.soldPrice.toLocaleString(),
                })
              );
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
          lang={uiLang}
          onEquipSkin={(skinId) => {
            const res = equipSkinAction(economy, skinId, calendar);
            if (res.ok) {
              audio.playSfx('menuClick');
              commitEconomy(res.next);
              showToast(tr(uiLang, 'toastSkinEquipped'));
            }
          }}
          onSellSkin={(skinId) => {
            const res = sellSkinAction(economy, skinId, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(
                tr(uiLang, 'toastSoldCoins', {
                  amount: res.soldPrice.toLocaleString(),
                })
              );
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onEquipWebDesign={(webId) => {
            const res = equipWebDesignAction(economy, webId, calendar);
            if (res.ok) {
              audio.playSfx('menuClick');
              commitEconomy(res.next);
              showToast(tr(uiLang, 'toastWebEquipped'));
            }
          }}
          onSellWebDesign={(webId) => {
            const res = sellWebDesignAction(economy, webId, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(
                tr(uiLang, 'toastSoldCoins', {
                  amount: res.soldPrice.toLocaleString(),
                })
              );
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
          lang={uiLang}
          onClaimMission={(missionId) => {
            const res = claimMissionAction(economy, missionId, calendar);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(tr(uiLang, 'toastMissionClaimed'));
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onClaimHolidayGift={() => {
            const res = claimHolidayGiftAction(economy, calendar);
            if (res.ok) {
              audio.playSfx('mythicFanfare');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(
                `${calendar.season.eventTitleUz} — ${tr(
                  uiLang,
                  'rewardClaimedTag'
                )}`
              );
            } else if (res.errorUz) {
              showToast(res.errorUz);
            }
          }}
          onBuySkin={(skinId) => {
            const res = buySkinAction(economy, skinId, calendar, effectiveNow);
            if (res.ok) {
              audio.playSfx('purchase');
              commitEconomy(res.next, res.newlyAchievements);
              showToast(tr(uiLang, 'toastSkinBought'));
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
          lang={uiLang}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'LEADERBOARD' && (
        <LeaderboardScreen
          entries={leaderboard}
          loading={false}
          currentUid={userProfile.uid}
          economy={economy}
          calendar={calendar}
          lang={uiLang}
          onRefresh={() => refreshLeaderboard()}
          onStartTradeWith={() => setScreen('TRADING')}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'TRADING' && (
        <TradingScreen
          economy={economy}
          calendar={calendar}
          lang={uiLang}
          onSwapNpcOffer={(offer) => {
            const res = executeNpcSkinSwap(economy, offer, calendar);
            if (res.ok) {
              commitEconomy(res.next, res.newlyAchievements);
              showToast(tr(uiLang, 'swapCompletedMsg'));
            }
            return { ok: res.ok, errorUz: res.errorUz };
          }}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'EVENTS' && (
        <ZaiEventsScreen
          effectiveNow={effectiveNow}
          simMode={simMode}
          simTargetEventId={simTargetEventId}
          lang={uiLang}
          onChangeSimMode={(mode, targetEventId) => {
            setSimMode(mode);
            setSimTargetEventId(targetEventId);
            setSimAnchorRealMs(Date.now());
            handleUpdateSettings({
              ...settings,
              dismissedZaiAlertKey: null,
              notificationsEnabled: true,
            });
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

      {screen === 'FRIENDS' && (
        <FriendsScreen
          lang={uiLang}
          profile={userProfile}
          economy={economy}
          calendar={calendar}
          social={socialState}
          onSocialUpdated={(nextSocial) => setSocialState(nextSocial)}
          onRetrySync={syncSocialProfile}
          onClaimGifts={claimAndApplyServerGifts}
          onDeductGift={(payload) => {
            const res = deductFriendGiftAction(
              latestEconomyRef.current,
              payload,
              getLiveCalendarInfo()
            );
            if (res.ok) {
              commitEconomy(res.next);
              return true;
            }
            if (res.errorUz) showToast(res.errorUz);
            return false;
          }}
          onNotify={(msg) => showToast(msg)}
          onBack={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'OWNERS_GIFT' && !userProfile.isCreator && (
        <OwnersGiftScreen
          economy={economy}
          calendar={calendar}
          lang={uiLang}
          onEquipSkin={(skinId) => {
            const res = equipSkinAction(economy, skinId, calendar);
            if (res.ok) {
              audio.playSfx('menuClick');
              commitEconomy(res.next);
              showToast(tr(uiLang, 'toastSkinEquipped'));
            }
          }}
          onEquipWebDesign={(webId) => {
            const res = equipWebDesignAction(economy, webId, calendar);
            if (res.ok) {
              audio.playSfx('menuClick');
              commitEconomy(res.next);
            }
          }}
          onOpenCases={() => setScreen('CASES')}
          onCheckGifts={syncSocialProfile}
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
            isCreator={economy.isCreator}
            paused={
              screen !== 'PLAYING' ||
              modal !== 'NONE' ||
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

      {screen === 'PAUSED' && modal === 'NONE' && (
        <PauseModal
          stageName={`${currentStage.id} · ${currentStage.name}`}
          lang={uiLang}
          onResume={() => setScreen('PLAYING')}
          onRestart={() => launchStage(currentStage.id)}
          onSettings={() => setModal('SETTINGS')}
          onQuit={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'STAGE_CLEAR' && clearSummary && (
        <StageClearModal
          summary={clearSummary}
          lang={uiLang}
          xpEarned={lastStageXpEarned}
          onNextStage={() => {
            if (clearSummary.nextStageId) launchStage(clearSummary.nextStageId);
          }}
          onReplay={() => launchStage(clearSummary.stageId)}
          onWorldSelect={() => setScreen('WORLD_SELECT')}
        />
      )}

      {screen === 'GAME_OVER' && (
        <GameOverModal
          score={gameOverStats.score}
          coins={gameOverStats.coins}
          lang={uiLang}
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
          lang={uiLang}
          onAcceptChapter2={(rating) => {
            updateSave((s) => {
              s.chapter2Unlocked = true;
              s.chapter1Survey = {
                rating,
                acceptedChapter2: true,
                answeredAt: new Date().toISOString(),
              };
            });
            launchChapter2Sector('C2-1');
          }}
          onDeclineChapter2={(rating) => {
            updateSave((s) => {
              s.chapter2Unlocked = true;
              s.chapter1Survey = {
                rating,
                acceptedChapter2: false,
                answeredAt: new Date().toISOString(),
              };
            });
          }}
          onPlayAgain={() => launchStage('1-1')}
          onWorldSelect={() => setScreen('WORLD_SELECT')}
          onMenu={() => setScreen('TITLE_MENU')}
        />
      )}

      {inChapter2View && (
        <div className="flex-1 min-h-0 relative">
          <Chapter2Canvas
            sector={currentCh2Sector}
            lives={saveData.lives}
            settings={settings}
            equippedSkin={economy.equippedSkin}
            equippedWebDesign={economy.equippedWebDesign ?? 'classic_white'}
            spikeyCoinsTotal={economy.spikeyCoins}
            isCreator={economy.isCreator}
            paused={
              screen !== 'CHAPTER2_PLAYING' ||
              modal !== 'NONE' ||
              Boolean(loadingStageLabel) ||
              showLangSelector
            }
            restartNonce={restartNonce}
            onPauseToggle={handleChapter2PauseToggle}
            onSectorClear={handleChapter2SectorClear}
            onGameOver={handleChapter2GameOver}
          />
        </div>
      )}

      {screen === 'CHAPTER2_PAUSED' && modal === 'NONE' && (
        <PauseModal
          stageName={`CH2 · ${currentCh2Sector.id} · ${currentCh2Sector.name}`}
          lang={uiLang}
          onResume={() => setScreen('CHAPTER2_PLAYING')}
          onRestart={() => launchChapter2Sector(currentCh2Sector.id)}
          onSettings={() => setModal('SETTINGS')}
          onQuit={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'CHAPTER2_CLEAR' && ch2ClearSummary && (
        <Chapter2SectorClearModal
          summary={ch2ClearSummary}
          onNextSector={() => {
            if (ch2ClearSummary.nextSectorId) {
              launchChapter2Sector(ch2ClearSummary.nextSectorId);
            }
          }}
          onReplay={() => launchChapter2Sector(ch2ClearSummary.sectorId)}
          onMenu={() => setScreen('TITLE_MENU')}
        />
      )}

      {screen === 'CHAPTER2_GAME_OVER' && (
        <Chapter2GameOverModal
          score={ch2GameOverStats.score}
          coins={ch2GameOverStats.coins}
          onRetry={() => {
            updateSave((s) => {
              s.lives = 5;
            });
            launchChapter2Sector(currentCh2Sector.id);
          }}
          onMenu={() => {
            updateSave((s) => {
              s.lives = 5;
            });
            setScreen('TITLE_MENU');
          }}
        />
      )}

      {screen === 'CHAPTER2_VICTORY' && (
        <Chapter2VictoryScreen
          saveData={saveData}
          onPlayAgain={() => launchChapter2Sector('C2-1')}
          onMenu={() => setScreen('TITLE_MENU')}
        />
      )}

      {modal === 'SETTINGS' && (
        <SettingsModal
          settings={settings}
          lang={uiLang}
          onUpdateSettings={handleUpdateSettings}
          onOpenLanguage={() => setShowLangSelector(true)}
          onOpenTutorial={() => setModal('TUTORIAL')}
          onOpenProfile={() => {
            setModal('NONE');
            setScreen('PROFILE');
          }}
          onResetSave={handleResetSave}
          onClose={() => setModal('NONE')}
        />
      )}

      {modal === 'ACHIEVEMENTS' && (
        <AchievementsModal
          saveData={saveData}
          lang={uiLang}
          onClose={() => setModal('NONE')}
        />
      )}

      {modal === 'CREDITS' && (
        <CreditsModal lang={uiLang} onClose={() => setModal('NONE')} />
      )}

      {modal === 'TUTORIAL' && (
        <TutorialModal
          lang={uiLang}
          skinId={economy.equippedSkin}
          webDesignId={economy.equippedWebDesign ?? 'classic_white'}
          keyBindings={settings.keyBindings}
          onComplete={finishTutorial}
          onSkip={finishTutorial}
        />
      )}

      {promoEventId && (
        <ZaiEventPromoModal
          eventId={promoEventId}
          effectiveNow={effectiveNow}
          lang={uiLang}
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
          currentLanguage={
            settings.language ? normalizeLangCode(settings.language) : null
          }
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

      {userProfile.isCreator &&
        economy.isCreator &&
        screen !== 'PLAYING' &&
        screen !== 'CHAPTER2_PLAYING' && (
        <AdminSidePanel
          lang={uiLang}
          open={ownerPanelOpen}
          onOpenChange={setOwnerPanelOpen}
          onNotify={(msg) => showToast(msg)}
          onSocialUpdated={(nextSocial) => setSocialState(nextSocial)}
        />
      )}

      {achievementToast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 pixel-panel px-4 py-2.5 border-amber-400/80 bg-slate-950/95 pointer-events-none">
          <span className="font-pixel text-xs text-amber-300">
            {achievementToast}
          </span>
        </div>
      )}
    </div>
  );
}
