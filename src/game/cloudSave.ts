import { User } from 'firebase/auth';
import {
  FieldValue,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from '../firebase';
import { createInitialSaveData, normalizeSaveData } from './storage';
import { SaveData, SpiderColorId, UserProfileData } from './types';

const VALID_SPIDER_COLORS: SpiderColorId[] = [
  'classic',
  'emerald',
  'cobalt',
  'amethyst',
  'crimson',
];

function clampInt(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.floor(val)));
}

function sanitizeSpiderColor(val: unknown): SpiderColorId {
  return VALID_SPIDER_COLORS.includes(val as SpiderColorId)
    ? (val as SpiderColorId)
    : 'classic';
}

function sanitizeSavePayload(uid: string, save: SaveData) {
  const normalized = normalizeSaveData(save);
  const validStageId = /^[0-9]+-(1|2|Boss)$/.test(normalized.currentStageId)
    ? normalized.currentStageId
    : '1-1';

  const unlockedStageIds = normalized.unlockedStageIds
    .filter((id) => typeof id === 'string' && id.length > 0 && id.length <= 24)
    .slice(0, 20);
  if (unlockedStageIds.length === 0) unlockedStageIds.push('1-1');

  const stageProgress: Record<
    string,
    { completed: boolean; crystals: boolean[]; bestScore: number; bestTimeSec: number }
  > = {};
  for (const [k, v] of Object.entries(normalized.stageProgress).slice(0, 20)) {
    if (!v || typeof v !== 'object') continue;
    stageProgress[k.slice(0, 24)] = {
      completed: Boolean(v.completed),
      crystals: [0, 1, 2].map((idx) => Boolean(v.crystals?.[idx])),
      bestScore: clampInt(v.bestScore ?? 0, 0, 100000000),
      bestTimeSec: clampInt(v.bestTimeSec ?? 0, 0, 999999),
    };
  }

  return {
    ownerId: uid.slice(0, 128),
    hasStarted: Boolean(normalized.hasStarted),
    currentStageId: validStageId,
    unlockedStageIds,
    unlockedAbilities: {
      webShot: true,
      doubleJump: Boolean(normalized.unlockedAbilities.doubleJump),
      webTrap: Boolean(normalized.unlockedAbilities.webTrap),
      wallClimb: Boolean(normalized.unlockedAbilities.wallClimb),
      webSwing: true,
      spiderDash: true,
      magicWeb: Boolean(normalized.unlockedAbilities.magicWeb),
    },
    activeSpecial: normalized.activeSpecial === 'magicWeb' ? 'magicWeb' : 'webTrap',
    totalCoins: clampInt(normalized.totalCoins, 0, 10000000),
    totalScore: clampInt(normalized.totalScore, 0, 100000000),
    lives: clampInt(normalized.lives, 0, 99),
    stageProgress,
    unlockedAchievements: normalized.unlockedAchievements
      .filter((a) => typeof a === 'string' && a.length <= 64)
      .slice(0, 20),
    bossesDefeated: normalized.bossesDefeated
      .filter((b) => typeof b === 'string' && b.length <= 64)
      .slice(0, 10),
    enemiesDefeatedTotal: clampInt(normalized.enemiesDefeatedTotal, 0, 10000000),
    secretsFoundTotal: clampInt(normalized.secretsFoundTotal, 0, 10000),
  };
}

export async function syncUserProfile(user: User): Promise<UserProfileData> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  const email = (user.email ?? '').slice(0, 200);
  const displayName = (user.displayName ?? email.split('@')[0] ?? 'Spikey Player').slice(0, 120);
  const photoURL = (user.photoURL ?? '').slice(0, 500);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!snap.exists()) {
    try {
      await setDoc(ref, {
        uid: user.uid,
        displayName,
        email,
        photoURL,
        nickname: '',
        spiderColor: 'classic',
        profileCompleted: false,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return {
      uid: user.uid,
      displayName,
      email,
      photoURL,
      nickname: '',
      spiderColor: 'classic',
      profileCompleted: false,
    };
  }

  const existing = snap.data() as Partial<UserProfileData>;
  const nickname =
    typeof existing.nickname === 'string' ? existing.nickname.trim().slice(0, 24) : '';
  const spiderColor = sanitizeSpiderColor(existing.spiderColor);
  const profileCompleted = Boolean(existing.profileCompleted) && nickname.length >= 2;

  try {
    await updateDoc(ref, {
      displayName,
      email,
      photoURL,
      nickname,
      spiderColor,
      profileCompleted,
      lastLoginAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  return {
    uid: user.uid,
    displayName,
    email,
    photoURL,
    nickname,
    spiderColor,
    profileCompleted,
  };
}

export async function saveInGameProfile(
  user: User,
  input: { nickname: string; spiderColor: SpiderColorId }
): Promise<UserProfileData> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  const email = (user.email ?? '').slice(0, 200);
  const displayName = (user.displayName ?? email.split('@')[0] ?? 'Spikey Player').slice(0, 120);
  const photoURL = (user.photoURL ?? '').slice(0, 500);
  const nickname = input.nickname.trim().slice(0, 24);
  const spiderColor = sanitizeSpiderColor(input.spiderColor);

  try {
    await updateDoc(ref, {
      displayName,
      email,
      photoURL,
      nickname,
      spiderColor,
      profileCompleted: true,
      lastVerifiedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  return {
    uid: user.uid,
    displayName,
    email,
    photoURL,
    nickname,
    spiderColor,
    profileCompleted: true,
  };
}

export async function loadCloudSave(uid: string): Promise<SaveData> {
  const path = `userSaves/${uid}`;
  const ref = doc(db, 'userSaves', uid);
  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!snap.exists()) {
    const initial = createInitialSaveData();
    const payload = sanitizeSavePayload(uid, initial);
    try {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return initial;
  }

  const data = snap.data() as Partial<SaveData>;
  return normalizeSaveData(data);
}

export async function saveCloudProgress(uid: string, save: SaveData): Promise<void> {
  const path = `userSaves/${uid}`;
  const ref = doc(db, 'userSaves', uid);
  const payload = sanitizeSavePayload(uid, save);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!snap.exists()) {
    try {
      await setDoc(ref, {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return;
  }

  const updateFields: Record<string, unknown | FieldValue> = {
    hasStarted: payload.hasStarted,
    currentStageId: payload.currentStageId,
    unlockedStageIds: payload.unlockedStageIds,
    unlockedAbilities: payload.unlockedAbilities,
    activeSpecial: payload.activeSpecial,
    totalCoins: payload.totalCoins,
    totalScore: payload.totalScore,
    lives: payload.lives,
    stageProgress: payload.stageProgress,
    unlockedAchievements: payload.unlockedAchievements,
    bossesDefeated: payload.bossesDefeated,
    enemiesDefeatedTotal: payload.enemiesDefeatedTotal,
    secretsFoundTotal: payload.secretsFoundTotal,
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(ref, updateFields);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function mergeTrialSaveToCloud(
  uid: string,
  trialSave: SaveData
): Promise<SaveData> {
  const cloud = await loadCloudSave(uid);
  const merged = structuredClone(cloud);

  merged.hasStarted = merged.hasStarted || trialSave.hasStarted;
  merged.totalCoins += trialSave.totalCoins;
  merged.totalScore += trialSave.totalScore;
  merged.enemiesDefeatedTotal += trialSave.enemiesDefeatedTotal;
  merged.secretsFoundTotal += trialSave.secretsFoundTotal;

  for (const id of trialSave.unlockedStageIds) {
    if (!merged.unlockedStageIds.includes(id)) {
      merged.unlockedStageIds.push(id);
    }
  }

  for (const [stageId, tProg] of Object.entries(trialSave.stageProgress)) {
    const cProg = merged.stageProgress[stageId];
    const crystals = [0, 1, 2].map(
      (i) => Boolean(cProg?.crystals[i]) || Boolean(tProg.crystals[i])
    );
    merged.stageProgress[stageId] = {
      completed: Boolean(cProg?.completed) || Boolean(tProg.completed),
      crystals,
      bestScore: Math.max(cProg?.bestScore ?? 0, tProg.bestScore),
      bestTimeSec:
        cProg?.bestTimeSec && tProg.bestTimeSec
          ? Math.min(cProg.bestTimeSec, tProg.bestTimeSec)
          : cProg?.bestTimeSec || tProg.bestTimeSec,
    };
  }

  if (merged.stageProgress['1-2']?.completed && !merged.unlockedStageIds.includes('1-Boss')) {
    merged.unlockedStageIds.push('1-Boss');
    merged.currentStageId = '1-Boss';
  } else if (merged.stageProgress['1-1']?.completed && !merged.unlockedStageIds.includes('1-2')) {
    merged.unlockedStageIds.push('1-2');
    if (merged.currentStageId === '1-1') merged.currentStageId = '1-2';
  }

  for (const ach of trialSave.unlockedAchievements) {
    if (!merged.unlockedAchievements.includes(ach)) {
      merged.unlockedAchievements.push(ach);
    }
  }
  merged.unlockedAbilities = {
    ...merged.unlockedAbilities,
    doubleJump: merged.unlockedAbilities.doubleJump || trialSave.unlockedAbilities.doubleJump,
  };

  await saveCloudProgress(uid, merged);
  return merged;
}

export async function resetCloudSave(uid: string): Promise<SaveData> {
  const path = `userSaves/${uid}`;
  const ref = doc(db, 'userSaves', uid);
  const fresh = createInitialSaveData();
  const payload = sanitizeSavePayload(uid, fresh);

  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }

  try {
    await setDoc(ref, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return fresh;
}
