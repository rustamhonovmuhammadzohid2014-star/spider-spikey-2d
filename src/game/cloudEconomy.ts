import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { OperationType, db, handleFirestoreError } from '../firebase';
import {
  createInitialEconomyData,
  evaluateEconomyAchievements,
  grantSkinCount,
  normalizeEconomyData,
} from './economy';
import { getLiveCalendarInfo, getSeasonLevelFromXp } from './seasons';
import { getSkinById } from './skins';
import {
  EconomyData,
  LeaderboardEntry,
  SaveData,
  TradeOffer,
  UserProfileData,
} from './types';

function clampInt(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.max(min, Math.min(max, Math.floor(val)));
}

function sanitizeEconomyPayload(uid: string, econ: EconomyData) {
  const cal = getLiveCalendarInfo();
  const n = normalizeEconomyData(econ, uid, cal);

  const ownedSkins: Record<string, number> = {};
  for (const [k, v] of Object.entries(n.ownedSkins).slice(0, 140)) {
    if (typeof v === 'number' && v > 0 && /^[a-zA-Z0-9_\-]{1,48}$/.test(k)) {
      ownedSkins[k] = clampInt(v, 1, 999);
    }
  }
  if (!ownedSkins.classic) ownedSkins.classic = 1;

  const ownedWebDesigns: Record<string, number> = {};
  for (const [k, v] of Object.entries(n.ownedWebDesigns ?? { classic_white: 1 }).slice(0, 60)) {
    if (typeof v === 'number' && v > 0 && /^[a-zA-Z0-9_\-]{1,48}$/.test(k)) {
      ownedWebDesigns[k] = clampInt(v, 1, 999);
    }
  }
  if (!ownedWebDesigns.classic_white) ownedWebDesigns.classic_white = 1;

  const ownedCases: Record<string, number> = {
    common: clampInt(n.ownedCases.common ?? 0, 0, 999),
    uncommon: clampInt(n.ownedCases.uncommon ?? 0, 0, 999),
    rare: clampInt(n.ownedCases.rare ?? 0, 0, 999),
    epic: clampInt(n.ownedCases.epic ?? 0, 0, 999),
    legendary: clampInt(n.ownedCases.legendary ?? 0, 0, 999),
    mythic: clampInt(n.ownedCases.mythic ?? 0, 0, 999),
    seasonal: clampInt(n.ownedCases.seasonal ?? 0, 0, 999),
    zai_monthly: clampInt(n.ownedCases.zai_monthly ?? 0, 0, 999),
    zai_summer: clampInt(n.ownedCases.zai_summer ?? 0, 0, 999),
    zai_starfall: clampInt(n.ownedCases.zai_starfall ?? 0, 0, 999),
    zai_shadow: clampInt(n.ownedCases.zai_shadow ?? 0, 0, 999),
  };

  const specialItems: Record<string, number> = {};
  for (const [k, v] of Object.entries(n.specialItems).slice(0, 30)) {
    if (/^[a-zA-Z0-9_\-]{1,40}$/.test(k)) {
      specialItems[k] = clampInt(Number(v ?? 0), 0, 999);
    }
  }

  const missionProgress: Record<string, number> = {};
  for (const [k, v] of Object.entries(n.missionProgress).slice(0, 40)) {
    missionProgress[k.slice(0, 48)] = clampInt(Number(v ?? 0), 0, 1000000);
  }

  const equippedWebDesign =
    typeof n.equippedWebDesign === 'string' && /^[a-zA-Z0-9_\-]{1,48}$/.test(n.equippedWebDesign)
      ? n.equippedWebDesign
      : 'classic_white';

  const selectedLanguage =
    typeof n.selectedLanguage === 'string' && /^[a-zA-Z\-]{2,12}$/.test(n.selectedLanguage)
      ? n.selectedLanguage
      : 'en';

  return {
    ownerId: uid.slice(0, 128),
    spikeyCoins: clampInt(n.spikeyCoins, 0, 50000000),
    equippedSkin: /^[a-zA-Z0-9_\-]{1,48}$/.test(n.equippedSkin) ? n.equippedSkin : 'classic',
    ownedSkins,
    equippedWebDesign,
    ownedWebDesigns,
    playerXp: clampInt(n.playerXp ?? 0, 0, 10000000),
    playerLevel: clampInt(n.playerLevel ?? 1, 1, 100),
    selectedLanguage,
    ownedCases,
    specialItems,
    seasonMonthKey: /^[0-9]{4}-[0-9]{2}$/.test(n.seasonMonthKey) ? n.seasonMonthKey : cal.monthKey,
    seasonXp: clampInt(n.seasonXp, 0, 1000000),
    claimedSeasonLevels: n.claimedSeasonLevels.filter((x) => Number.isInteger(x)).slice(0, 50),
    dailyStreak: clampInt(n.dailyStreak, 0, 30),
    claimedDailyDays: n.claimedDailyDays.filter((x) => Number.isInteger(x)).slice(0, 30),
    lastDailyClaimDate: String(n.lastDailyClaimDate ?? '').slice(0, 12),
    dailyMissionDate: String(n.dailyMissionDate ?? cal.dateKey).slice(0, 12),
    weeklyMissionKey: String(n.weeklyMissionKey ?? cal.weekKey).slice(0, 12),
    missionProgress,
    claimedMissions: n.claimedMissions.filter((x) => typeof x === 'string').slice(0, 40),
    holidayClaimedIds: n.holidayClaimedIds.filter((x) => typeof x === 'string').slice(0, 40),
    casesOpenedTotal: clampInt(n.casesOpenedTotal, 0, 1000000),
    mythicsFoundTotal: clampInt(n.mythicsFoundTotal, 0, 100000),
    skinsSoldTotal: clampInt(n.skinsSoldTotal, 0, 1000000),
    tradesCompletedTotal: clampInt(n.tradesCompletedTotal, 0, 100000),
    unlockedEconomyAchievements: n.unlockedEconomyAchievements
      .filter((x) => typeof x === 'string')
      .slice(0, 30),
    transactions: n.transactions.slice(0, 40),
    processedTxIds: n.processedTxIds.filter((x) => typeof x === 'string').slice(-120),
  };
}

export async function loadCloudEconomy(
  uid: string,
  saveData: SaveData,
  profile: UserProfileData
): Promise<EconomyData> {
  const path = `userEconomy/${uid}`;
  const ref = doc(db, 'userEconomy', uid);
  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const cal = getLiveCalendarInfo();
  if (!snap.exists()) {
    const initial = createInitialEconomyData(
      uid,
      saveData.totalCoins,
      profile.spiderColor,
      cal
    );
    const payload = sanitizeEconomyPayload(uid, initial);
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

  const data = snap.data() as Partial<EconomyData>;
  const normalized = normalizeEconomyData(data, uid, cal);
  // Keep unified Spikey Coins synced if saveData had higher coins (e.g. trial merge)
  if (saveData.totalCoins > normalized.spikeyCoins && normalized.transactions.length === 0) {
    normalized.spikeyCoins = saveData.totalCoins;
  }
  return normalized;
}

export async function saveCloudEconomy(uid: string, economy: EconomyData): Promise<void> {
  const path = `userEconomy/${uid}`;
  const ref = doc(db, 'userEconomy', uid);
  const payload = sanitizeEconomyPayload(uid, economy);

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

  try {
    await updateDoc(ref, {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function syncLeaderboardEntry(
  uid: string,
  profile: UserProfileData,
  saveData: SaveData,
  economy: EconomyData
): Promise<void> {
  const path = `leaderboard/${uid}`;
  const ref = doc(db, 'leaderboard', uid);
  const cal = getLiveCalendarInfo();

  const skinsCount = Object.values(economy.ownedSkins).filter((qty) => qty > 0).length;
  const achievementsCount =
    saveData.unlockedAchievements.length + economy.unlockedEconomyAchievements.length;

  const entryPayload = {
    uid: uid.slice(0, 128),
    isPublic: true,
    nickname: (profile.nickname || profile.displayName || 'Spikey').trim().slice(0, 24) || 'Spikey',
    equippedSkin: /^[a-zA-Z0-9_\-]{1,48}$/.test(economy.equippedSkin) ? economy.equippedSkin : 'classic',
    seasonLevel: clampInt(getSeasonLevelFromXp(economy.seasonXp), 1, 50),
    playerLevel: clampInt(economy.playerLevel ?? 1, 1, 100),
    seasonMonthKey: cal.monthKey,
    totalCoins: clampInt(economy.spikeyCoins, 0, 50000000),
    skinsCount: clampInt(skinsCount, 0, 200),
    bossesDefeatedCount: clampInt(saveData.bossesDefeated.length, 0, 10),
    achievementsCount: clampInt(achievementsCount, 0, 60),
    updatedAt: serverTimestamp(),
  };

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  if (!snap.exists()) {
    try {
      await setDoc(ref, entryPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
    return;
  }

  try {
    await updateDoc(ref, {
      nickname: entryPayload.nickname,
      equippedSkin: entryPayload.equippedSkin,
      seasonLevel: entryPayload.seasonLevel,
      playerLevel: entryPayload.playerLevel,
      seasonMonthKey: entryPayload.seasonMonthKey,
      totalCoins: entryPayload.totalCoins,
      skinsCount: entryPayload.skinsCount,
      bossesDefeatedCount: entryPayload.bossesDefeatedCount,
      achievementsCount: entryPayload.achievementsCount,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fetchLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const path = 'leaderboard';
  try {
    const q = query(
      collection(db, 'leaderboard'),
      where('isPublic', '==', true),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as LeaderboardEntry)
      .sort((a, b) => (b.totalCoins ?? 0) - (a.totalCoins ?? 0));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToUserTrades(
  uid: string,
  onChange: (trades: TradeOffer[]) => void,
  onError?: (err: unknown) => void
): () => void {
  const sentMap = new Map<string, TradeOffer>();
  const recvMap = new Map<string, TradeOffer>();

  const emit = () => {
    const merged = new Map<string, TradeOffer>();
    for (const [k, v] of sentMap) merged.set(k, v);
    for (const [k, v] of recvMap) merged.set(k, v);
    onChange(Array.from(merged.values()));
  };

  const qSent = query(collection(db, 'trades'), where('senderUid', '==', uid));
  const qRecv = query(collection(db, 'trades'), where('recipientUid', '==', uid));

  const unsub1 = onSnapshot(
    qSent,
    (snap) => {
      sentMap.clear();
      snap.forEach((docSnap) => {
        sentMap.set(docSnap.id, docSnap.data() as TradeOffer);
      });
      emit();
    },
    (err) => {
      if (onError) onError(err);
    }
  );

  const unsub2 = onSnapshot(
    qRecv,
    (snap) => {
      recvMap.clear();
      snap.forEach((docSnap) => {
        recvMap.set(docSnap.id, docSnap.data() as TradeOffer);
      });
      emit();
    },
    (err) => {
      if (onError) onError(err);
    }
  );

  return () => {
    unsub1();
    unsub2();
  };
}

export async function createTradeOffer(
  senderUid: string,
  senderNickname: string,
  recipient: LeaderboardEntry,
  offeredSkinId: string,
  requestedSkinId: string,
  prevEconomy: EconomyData
): Promise<EconomyData> {
  const tradeId = `tr_${senderUid.slice(0, 8)}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `trades/${tradeId}`;
  const cal = getLiveCalendarInfo();
  const nextEcon = normalizeEconomyData(structuredClone(prevEconomy), senderUid, cal);

  const qty = nextEcon.ownedSkins[offeredSkinId] ?? 0;
  const skinMeta = getSkinById(offeredSkinId);
  if (qty <= 0 || !skinMeta.tradable) {
    throw new Error('Bu skin savdo uchun yaroqsiz.');
  }
  if (nextEcon.equippedSkin === offeredSkinId && qty <= 1) {
    throw new Error('Kiyilgan yagona skinni savdoga qo‘yib bo‘lmaydi. Avval boshqa skin kiying.');
  }

  // Deduct offered skin into escrow
  nextEcon.ownedSkins[offeredSkinId] = qty - 1;
  if (nextEcon.ownedSkins[offeredSkinId] <= 0) delete nextEcon.ownedSkins[offeredSkinId];

  nextEcon.transactions = [
    {
      id: `escrow_${tradeId}`,
      kind: 'trade' as const,
      amount: 0,
      labelUz: `Savdo taklifi yuborildi (${skinMeta.name} → ${recipient.nickname})`,
      timestamp: new Date().toISOString(),
    },
    ...nextEcon.transactions,
  ].slice(0, 40);

  await saveCloudEconomy(senderUid, nextEcon);

  try {
    await setDoc(doc(db, 'trades', tradeId), {
      tradeId,
      senderUid,
      senderNickname: senderNickname.slice(0, 24) || 'Spikey',
      recipientUid: recipient.uid,
      recipientNickname: recipient.nickname.slice(0, 24) || 'Player',
      offeredSkinId,
      requestedSkinId,
      senderConfirmed: true,
      recipientConfirmed: false,
      senderSettled: false,
      recipientSettled: false,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  return nextEcon;
}

export async function cancelTradeOffer(trade: TradeOffer, uid: string, prevEconomy: EconomyData): Promise<EconomyData> {
  const path = `trades/${trade.tradeId}`;
  try {
    await updateDoc(doc(db, 'trades', trade.tradeId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  const cal = getLiveCalendarInfo();
  const next = normalizeEconomyData(structuredClone(prevEconomy), uid, cal);
  const txId = `refund_${trade.tradeId}`;
  if (!next.processedTxIds.includes(txId)) {
    next.processedTxIds.push(txId);
    grantSkinCount(next, trade.offeredSkinId, 1);
    next.transactions = [
      {
        id: txId,
        kind: 'trade' as const,
        amount: 0,
        labelUz: `Savdo bekor qilindi — ${getSkinById(trade.offeredSkinId).name} qaytarildi`,
        timestamp: new Date().toISOString(),
      },
      ...next.transactions,
    ].slice(0, 40);
    await saveCloudEconomy(uid, next);
  }
  return next;
}

export async function rejectTradeOffer(trade: TradeOffer): Promise<void> {
  const path = `trades/${trade.tradeId}`;
  try {
    await updateDoc(doc(db, 'trades', trade.tradeId), {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function acceptTradeOffer(
  trade: TradeOffer,
  recipientUid: string,
  prevEconomy: EconomyData
): Promise<EconomyData> {
  const cal = getLiveCalendarInfo();
  const next = normalizeEconomyData(structuredClone(prevEconomy), recipientUid, cal);

  const reqQty = next.ownedSkins[trade.requestedSkinId] ?? 0;
  const reqSkin = getSkinById(trade.requestedSkinId);
  if (reqQty <= 0 || !reqSkin.tradable) {
    throw new Error(`Sizda so‘ralgan skin (${reqSkin.name}) mavjud emas!`);
  }
  if (next.equippedSkin === trade.requestedSkinId && reqQty <= 1) {
    throw new Error('Kiyilgan yagona skinni almashishdan oldin boshqa skin kiying.');
  }

  const tradeRef = doc(db, 'trades', trade.tradeId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(tradeRef);
      if (!snap.exists()) throw new Error('Savdo taklifi topilmadi.');
      const cur = snap.data() as TradeOffer;
      if (cur.status !== 'pending') {
        throw new Error('Ushbu savdo allaqachon yakunlangan.');
      }
      tx.update(tradeRef, {
        status: 'accepted',
        recipientConfirmed: true,
        recipientSettled: true,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('PERMISSION_DENIED')) {
      handleFirestoreError(error, OperationType.UPDATE, `trades/${trade.tradeId}`);
    }
    throw error;
  }

  // Execute recipient's swap on their own economy doc
  const txId = `accept_trade_${trade.tradeId}`;
  if (!next.processedTxIds.includes(txId)) {
    next.processedTxIds.push(txId);
    next.ownedSkins[trade.requestedSkinId] = reqQty - 1;
    if (next.ownedSkins[trade.requestedSkinId] <= 0) delete next.ownedSkins[trade.requestedSkinId];
    grantSkinCount(next, trade.offeredSkinId, 1);
    next.tradesCompletedTotal += 1;
    next.transactions = [
      {
        id: txId,
        kind: 'trade' as const,
        amount: 0,
        labelUz: `Savdo muvaffaqiyatli! ${getSkinById(trade.offeredSkinId).name} olindi`,
        timestamp: new Date().toISOString(),
      },
      ...next.transactions,
    ].slice(0, 40);
    evaluateEconomyAchievements(next);
    await saveCloudEconomy(recipientUid, next);
  }

  return next;
}

/**
 * Automatically settles accepted or rejected/cancelled trades for the sender.
 */
export async function settleSenderTrades(
  trades: TradeOffer[],
  senderUid: string,
  prevEconomy: EconomyData
): Promise<{ next: EconomyData; changed: boolean }> {
  const cal = getLiveCalendarInfo();
  const next = normalizeEconomyData(structuredClone(prevEconomy), senderUid, cal);
  let changed = false;

  for (const t of trades) {
    if (t.senderUid !== senderUid) continue;

    if (t.status === 'accepted' && !t.senderSettled) {
      const txId = `settle_accept_${t.tradeId}`;
      if (!next.processedTxIds.includes(txId)) {
        next.processedTxIds.push(txId);
        grantSkinCount(next, t.requestedSkinId, 1);
        next.tradesCompletedTotal += 1;
        next.transactions = [
          {
            id: txId,
            kind: 'trade' as const,
            amount: 0,
            labelUz: `Savdo tasdiqlandi! ${getSkinById(t.requestedSkinId).name} olindi`,
            timestamp: new Date().toISOString(),
          },
          ...next.transactions,
        ].slice(0, 40);
        evaluateEconomyAchievements(next);
        changed = true;
      }
      await updateDoc(doc(db, 'trades', t.tradeId), {
        status: 'completed',
        senderSettled: true,
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    } else if (t.status === 'rejected') {
      const txId = `refund_${t.tradeId}`;
      if (!next.processedTxIds.includes(txId)) {
        next.processedTxIds.push(txId);
        grantSkinCount(next, t.offeredSkinId, 1);
        next.transactions = [
          {
            id: txId,
            kind: 'trade' as const,
            amount: 0,
            labelUz: `Savdo rad etildi — ${getSkinById(t.offeredSkinId).name} qaytarildi`,
            timestamp: new Date().toISOString(),
          },
          ...next.transactions,
        ].slice(0, 40);
        changed = true;
      }
    }
  }

  if (changed) {
    await saveCloudEconomy(senderUid, next);
  }
  return { next, changed };
}
