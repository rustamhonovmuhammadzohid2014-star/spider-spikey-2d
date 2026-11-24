import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';

interface ServerGiftItem {
  giftId: string;
  fromAccountId: string;
  fromNickname: string;
  fromIsAdmin: boolean;
  coins: number;
  skinId?: string;
  webDesignId?: string;
  caseType?: string;
  caseQty?: number;
  createdAt: string;
}

interface ServerAccount {
  uid: string;
  accountId: string;
  nickname: string;
  avatarId: string;
  isCreator: boolean;
  friends: string[]; // array of friend uids
  incomingRequests: string[]; // array of sender uids
  outgoingRequests: string[]; // array of recipient uids
  pendingGifts: ServerGiftItem[];
  createdAt: string;
  updatedAt: string;
}

interface PersistedSocialState {
  hmacSecret: string;
  accounts: Record<string, ServerAccount>;
}

interface AuthSession {
  uid: string;
  isCreator: boolean;
}

type AuthenticatedRequest = Request & { auth?: AuthSession };

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'social_state.json');
const ADMIN_UID = 'creator_admin';
const ADMIN_ACCOUNT_ID = 'SPK-ADMIN1';
const CREATOR_SALT = 'spikey-zai-salt-v1';
const EXPECTED_CREATOR_SCRYPT_HEX =
  '0d1705a76e735c4375f19f08e5e82ec5a784bffdfb847d0bd244f9e9dd2719ce';

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function createSeededState(): PersistedSocialState {
  const now = new Date().toISOString();
  return {
    hmacSecret: crypto.randomBytes(32).toString('hex'),
    accounts: {
      [ADMIN_UID]: {
        uid: ADMIN_UID,
        accountId: ADMIN_ACCOUNT_ID,
        nickname: 'Admin',
        avatarId: 'av_aurora_mythic',
        isCreator: true,
        friends: [],
        incomingRequests: [],
        outgoingRequests: [],
        pendingGifts: [],
        createdAt: now,
        updatedAt: now,
      },
    },
  };
}

function loadState(): PersistedSocialState {
  ensureDataDir();
  if (!fs.existsSync(STATE_FILE)) {
    const initial = createSeededState();
    saveState(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<PersistedSocialState>;
    const base = createSeededState();
    const state: PersistedSocialState = {
      hmacSecret:
        typeof parsed.hmacSecret === 'string' && parsed.hmacSecret.length >= 32
          ? parsed.hmacSecret
          : base.hmacSecret,
      accounts: parsed.accounts && typeof parsed.accounts === 'object' ? parsed.accounts : {},
    };
    if (!state.accounts[ADMIN_UID]) {
      state.accounts[ADMIN_UID] = base.accounts[ADMIN_UID];
    } else {
      state.accounts[ADMIN_UID].isCreator = true;
      state.accounts[ADMIN_UID].nickname = 'Admin';
      state.accounts[ADMIN_UID].accountId = ADMIN_ACCOUNT_ID;
    }
    return state;
  } catch {
    const fallback = createSeededState();
    saveState(fallback);
    return fallback;
  }
}

function saveState(state: PersistedSocialState): void {
  ensureDataDir();
  const tmpFile = `${STATE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmpFile, STATE_FILE);
}

let socialState = loadState();

function signToken(payload: AuthSession): string {
  const body = {
    uid: payload.uid,
    isCreator: payload.isCreator,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 14, // 14 days
  };
  const encoded = Buffer.from(JSON.stringify(body), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', socialState.hmacSecret)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): AuthSession | null {
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) return null;
  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac('sha256', socialState.hmacSecret)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as {
      uid?: string;
      isCreator?: boolean;
      exp?: number;
    };
    if (!parsed.uid || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    const account = socialState.accounts[parsed.uid];
    if (!account) return null;
    return {
      uid: account.uid,
      isCreator: Boolean(account.isCreator && parsed.isCreator),
    };
  } catch {
    return null;
  }
}

function verifyCreatorKey(candidate: string): boolean {
  if (typeof candidate !== 'string') return false;
  const trimmed = candidate.trim();
  if (!trimmed || trimmed.length > 128) return false;

  const envOverride = (process.env.CREATOR_KEY || '').trim();
  if (envOverride.length > 0) {
    const a = Buffer.from(trimmed, 'utf8');
    const b = Buffer.from(envOverride, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  const derived = crypto.scryptSync(trimmed, CREATOR_SALT, 32);
  const expected = Buffer.from(EXPECTED_CREATOR_SCRYPT_HEX, 'hex');
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

function generateUniqueAccountId(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 25; attempt++) {
    let code = 'SPK-';
    for (let i = 0; i < 6; i++) {
      code += alphabet[crypto.randomInt(0, alphabet.length)];
    }
    const exists = Object.values(socialState.accounts).some((a) => a.accountId === code);
    if (!exists) return code;
  }
  return `SPK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function findAccountByAccountId(accountId: string): ServerAccount | undefined {
  const clean = accountId.trim().toUpperCase().replace(/\s+/g, '');
  if (!clean) return undefined;
  const normalizedWithPrefix = clean.startsWith('SPK-') ? clean : `SPK-${clean}`;
  return Object.values(socialState.accounts).find((a) => {
    const candidate = a.accountId.toUpperCase();
    return candidate === clean || candidate === normalizedWithPrefix;
  });
}

function sanitizePublicAccountView(
  target: ServerAccount,
  viewer: ServerAccount
): {
  accountId: string;
  nickname: string;
  isAdmin: boolean;
  avatarId: string | null;
  relationship: 'self' | 'friend' | 'outgoing' | 'incoming' | 'none';
} {
  let relationship: 'self' | 'friend' | 'outgoing' | 'incoming' | 'none' = 'none';
  if (target.uid === viewer.uid) relationship = 'self';
  else if (viewer.friends.includes(target.uid)) relationship = 'friend';
  else if (viewer.outgoingRequests.includes(target.uid)) relationship = 'outgoing';
  else if (viewer.incomingRequests.includes(target.uid)) relationship = 'incoming';

  if (target.isCreator) {
    return {
      accountId: target.accountId,
      nickname: 'Admin',
      isAdmin: true,
      avatarId: null,
      relationship,
    };
  }
  return {
    accountId: target.accountId,
    nickname: target.nickname,
    isAdmin: false,
    avatarId: target.avatarId,
    relationship,
  };
}

function buildSocialSnapshot(uid: string) {
  const viewer = socialState.accounts[uid];
  if (!viewer) {
    return {
      friends: [],
      incomingRequests: [],
      outgoingRequests: [],
      pendingGiftsCount: 0,
    };
  }

  const friends = viewer.friends
    .map((fUid) => socialState.accounts[fUid])
    .filter((f): f is ServerAccount => Boolean(f))
    .map((f) => sanitizePublicAccountView(f, viewer));

  const incomingRequests = viewer.incomingRequests
    .map((sUid) => socialState.accounts[sUid])
    .filter((s): s is ServerAccount => Boolean(s))
    .map((s) => sanitizePublicAccountView(s, viewer));

  const outgoingRequests = viewer.outgoingRequests
    .map((rUid) => socialState.accounts[rUid])
    .filter((r): r is ServerAccount => Boolean(r))
    .map((r) => sanitizePublicAccountView(r, viewer));

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    pendingGiftsCount: viewer.pendingGifts.length,
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  if (!match) {
    res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    return;
  }
  const session = verifyToken(match[1]);
  if (!session) {
    res.status(401).json({ ok: false, error: 'INVALID_SESSION' });
    return;
  }
  req.auth = session;
  next();
}

function requireCreator(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.auth?.isCreator || req.auth.uid !== ADMIN_UID) {
    res.status(403).json({ ok: false, error: 'CREATOR_ONLY' });
    return;
  }
  next();
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, accountsCount: Object.keys(socialState.accounts).length });
  });

  // Register or refresh a regular local player profile and receive a server accountId + Bearer token
  app.post('/api/accounts/register', (req, res) => {
    const body = (req.body ?? {}) as {
      uid?: unknown;
      nickname?: unknown;
      avatarId?: unknown;
      existingAccountId?: unknown;
    };
    const rawUid = typeof body.uid === 'string' ? body.uid.trim() : '';
    const rawNickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
    const rawAvatarId =
      typeof body.avatarId === 'string' && body.avatarId.trim().length > 0
        ? body.avatarId.trim().slice(0, 64)
        : 'av_classic_spikey';

    if (!rawUid || rawUid.length > 96 || rawUid === ADMIN_UID) {
      res.status(400).json({ ok: false, error: 'INVALID_UID' });
      return;
    }
    if (!rawNickname || rawNickname.length < 2 || rawNickname.length > 24) {
      res.status(400).json({ ok: false, error: 'INVALID_NICKNAME' });
      return;
    }
    if (rawNickname.toLowerCase() === 'admin') {
      res.status(400).json({ ok: false, error: 'RESERVED_NICKNAME' });
      return;
    }

    const now = new Date().toISOString();
    let acc = socialState.accounts[rawUid];
    if (!acc) {
      let accountId =
        typeof body.existingAccountId === 'string' &&
        /^SPK-[A-Z0-9]{4,12}$/.test(body.existingAccountId.trim().toUpperCase())
          ? body.existingAccountId.trim().toUpperCase()
          : '';
      if (!accountId || findAccountByAccountId(accountId) || accountId === ADMIN_ACCOUNT_ID) {
        accountId = generateUniqueAccountId();
      }
      acc = {
        uid: rawUid,
        accountId,
        nickname: rawNickname,
        avatarId: rawAvatarId,
        isCreator: false,
        friends: [],
        incomingRequests: [],
        outgoingRequests: [],
        pendingGifts: [],
        createdAt: now,
        updatedAt: now,
      };
      socialState.accounts[rawUid] = acc;
    } else {
      acc.nickname = rawNickname;
      acc.avatarId = rawAvatarId;
      acc.isCreator = false;
      acc.updatedAt = now;
    }
    saveState(socialState);

    const token = signToken({ uid: acc.uid, isCreator: false });
    res.json({
      ok: true,
      token,
      account: {
        uid: acc.uid,
        accountId: acc.accountId,
        nickname: acc.nickname,
        avatarId: acc.avatarId,
        isCreator: false,
      },
      social: buildSocialSnapshot(acc.uid),
    });
  });

  // Strict server-side Creator key verification -> instant Admin VIP session
  app.post('/api/creator/login', (req, res) => {
    const body = (req.body ?? {}) as { key?: unknown };
    const candidate = typeof body.key === 'string' ? body.key : '';
    if (!verifyCreatorKey(candidate)) {
      res.status(401).json({ ok: false, error: 'INVALID_CREATOR_KEY' });
      return;
    }

    const admin = socialState.accounts[ADMIN_UID];
    admin.updatedAt = new Date().toISOString();
    saveState(socialState);

    const token = signToken({ uid: ADMIN_UID, isCreator: true });
    res.json({
      ok: true,
      token,
      account: {
        uid: ADMIN_UID,
        accountId: admin.accountId,
        nickname: 'Admin',
        avatarId: admin.avatarId,
        isCreator: true,
      },
      social: buildSocialSnapshot(ADMIN_UID),
    });
  });

  app.get('/api/accounts/me', requireAuth, (req: AuthenticatedRequest, res) => {
    const uid = req.auth!.uid;
    const acc = socialState.accounts[uid];
    if (!acc) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND' });
      return;
    }
    res.json({
      ok: true,
      account: {
        uid: acc.uid,
        accountId: acc.accountId,
        nickname: acc.isCreator ? 'Admin' : acc.nickname,
        avatarId: acc.isCreator ? null : acc.avatarId,
        isCreator: acc.isCreator,
      },
      social: buildSocialSnapshot(uid),
    });
  });

  // Lookup player by shareable Account ID — STRICTLY hides Admin details
  app.get('/api/accounts/lookup', requireAuth, (req: AuthenticatedRequest, res) => {
    const idParam = typeof req.query.id === 'string' ? req.query.id.trim().toUpperCase() : '';
    if (!idParam) {
      res.status(400).json({ ok: false, error: 'MISSING_ID' });
      return;
    }
    const viewer = socialState.accounts[req.auth!.uid];
    const target = findAccountByAccountId(idParam);
    if (!target || !viewer) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND' });
      return;
    }
    res.json({
      ok: true,
      account: sanitizePublicAccountView(target, viewer),
    });
  });

  // Send friend request ("zayavka") by Account ID
  app.post('/api/friends/request', requireAuth, (req: AuthenticatedRequest, res) => {
    const body = (req.body ?? {}) as { targetAccountId?: unknown };
    const targetId =
      typeof body.targetAccountId === 'string' ? body.targetAccountId.trim().toUpperCase() : '';
    if (!targetId) {
      res.status(400).json({ ok: false, error: 'MISSING_TARGET_ID' });
      return;
    }
    const sender = socialState.accounts[req.auth!.uid];
    const target = findAccountByAccountId(targetId);
    if (!sender || !target) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND' });
      return;
    }
    if (sender.uid === target.uid) {
      res.status(400).json({ ok: false, error: 'CANNOT_ADD_SELF' });
      return;
    }
    if (sender.friends.includes(target.uid)) {
      res.json({ ok: true, autoAccepted: false, alreadyFriends: true, social: buildSocialSnapshot(sender.uid) });
      return;
    }

    // If target already requested sender, auto-accept mutual friendship
    if (sender.incomingRequests.includes(target.uid)) {
      sender.incomingRequests = sender.incomingRequests.filter((u) => u !== target.uid);
      target.outgoingRequests = target.outgoingRequests.filter((u) => u !== sender.uid);
      if (!sender.friends.includes(target.uid)) sender.friends.push(target.uid);
      if (!target.friends.includes(sender.uid)) target.friends.push(sender.uid);
      saveState(socialState);
      res.json({ ok: true, autoAccepted: true, social: buildSocialSnapshot(sender.uid) });
      return;
    }

    if (!sender.outgoingRequests.includes(target.uid)) {
      sender.outgoingRequests.push(target.uid);
    }
    if (!target.incomingRequests.includes(sender.uid)) {
      target.incomingRequests.push(sender.uid);
    }
    saveState(socialState);
    res.json({ ok: true, autoAccepted: false, social: buildSocialSnapshot(sender.uid) });
  });

  // Accept or decline incoming friend request
  app.post('/api/friends/respond', requireAuth, (req: AuthenticatedRequest, res) => {
    const body = (req.body ?? {}) as { fromAccountId?: unknown; action?: unknown };
    const fromId =
      typeof body.fromAccountId === 'string' ? body.fromAccountId.trim().toUpperCase() : '';
    const action = body.action === 'accept' ? 'accept' : body.action === 'decline' ? 'decline' : '';
    if (!fromId || !action) {
      res.status(400).json({ ok: false, error: 'INVALID_PARAMS' });
      return;
    }
    const viewer = socialState.accounts[req.auth!.uid];
    const sender = findAccountByAccountId(fromId);
    if (!viewer || !sender) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND' });
      return;
    }
    if (!viewer.incomingRequests.includes(sender.uid)) {
      res.status(404).json({ ok: false, error: 'REQUEST_NOT_FOUND' });
      return;
    }

    viewer.incomingRequests = viewer.incomingRequests.filter((u) => u !== sender.uid);
    sender.outgoingRequests = sender.outgoingRequests.filter((u) => u !== viewer.uid);

    if (action === 'accept') {
      if (!viewer.friends.includes(sender.uid)) viewer.friends.push(sender.uid);
      if (!sender.friends.includes(viewer.uid)) sender.friends.push(viewer.uid);
    }

    saveState(socialState);
    res.json({ ok: true, social: buildSocialSnapshot(viewer.uid) });
  });

  // Regular friend gift sending (coins + skins + web designs) — MUST be accepted friends
  app.post('/api/gifts/send', requireAuth, (req: AuthenticatedRequest, res) => {
    const body = (req.body ?? {}) as {
      toAccountId?: unknown;
      coins?: unknown;
      skinId?: unknown;
      webDesignId?: unknown;
    };
    const toId = typeof body.toAccountId === 'string' ? body.toAccountId.trim().toUpperCase() : '';
    const parsedCoinsInput =
      typeof body.coins === 'number'
        ? body.coins
        : typeof body.coins === 'string' && body.coins.trim()
        ? Number(body.coins.trim())
        : 0;
    const coins =
      Number.isFinite(parsedCoinsInput) && parsedCoinsInput > 0
        ? Math.floor(parsedCoinsInput)
        : 0;
    const skinId = typeof body.skinId === 'string' && body.skinId.trim() ? body.skinId.trim().slice(0, 64) : undefined;
    const webDesignId =
      typeof body.webDesignId === 'string' && body.webDesignId.trim()
        ? body.webDesignId.trim().slice(0, 64)
        : undefined;

    if (!toId || (coins <= 0 && !skinId && !webDesignId)) {
      res.status(400).json({ ok: false, error: 'INVALID_GIFT' });
      return;
    }

    const sender = socialState.accounts[req.auth!.uid];
    const target = findAccountByAccountId(toId);
    if (!sender || !target) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND' });
      return;
    }
    if (!sender.friends.includes(target.uid)) {
      res.status(403).json({ ok: false, error: 'FRIENDSHIP_REQUIRED' });
      return;
    }

    const gift: ServerGiftItem = {
      giftId: `gift_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      fromAccountId: sender.accountId,
      fromNickname: sender.isCreator ? 'Admin' : sender.nickname,
      fromIsAdmin: sender.isCreator,
      coins,
      skinId,
      webDesignId,
      createdAt: new Date().toISOString(),
    };

    target.pendingGifts.push(gift);
    saveState(socialState);
    res.json({ ok: true, gift });
  });

  // Atomically claim all pending gifts for current user
  app.post('/api/gifts/claim', requireAuth, (req: AuthenticatedRequest, res) => {
    const viewer = socialState.accounts[req.auth!.uid];
    if (!viewer) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND' });
      return;
    }
    const gifts = [...viewer.pendingGifts];
    if (gifts.length > 0) {
      viewer.pendingGifts = [];
      saveState(socialState);
    }
    res.json({ ok: true, gifts });
  });

  // Creator Admin endpoint: list all synced accounts with friend status relative to Admin
  app.get('/api/admin/accounts', requireAuth, requireCreator, (_req, res) => {
    const admin = socialState.accounts[ADMIN_UID];
    const accounts = Object.values(socialState.accounts)
      .filter((a) => !a.isCreator)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((a) => ({
        uid: a.uid,
        accountId: a.accountId,
        nickname: a.nickname,
        avatarId: a.avatarId,
        isFriendWithAdmin: admin.friends.includes(a.uid),
        pendingRequestFromAdmin: admin.outgoingRequests.includes(a.uid),
        incomingRequestToAdmin: admin.incomingRequests.includes(a.uid),
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }));
    res.json({ ok: true, adminAccountId: admin.accountId, accounts });
  });

  // Creator Owner endpoint: send coins, spider skins, web designs, or ANY cases to ANY account
  app.post('/api/admin/send', requireAuth, requireCreator, (req: AuthenticatedRequest, res) => {
    const body = (req.body ?? {}) as {
      toAccountId?: unknown;
      coins?: unknown;
      skinId?: unknown;
      webDesignId?: unknown;
      caseType?: unknown;
      caseQty?: unknown;
    };
    const toId = typeof body.toAccountId === 'string' ? body.toAccountId.trim().toUpperCase() : '';
    const parsedCoinsInput =
      typeof body.coins === 'number'
        ? body.coins
        : typeof body.coins === 'string' && body.coins.trim()
        ? Number(body.coins.trim())
        : 0;
    const coins =
      Number.isFinite(parsedCoinsInput) && parsedCoinsInput > 0
        ? Math.floor(parsedCoinsInput)
        : 0;
    const skinId = typeof body.skinId === 'string' && body.skinId.trim() ? body.skinId.trim().slice(0, 64) : undefined;
    const webDesignId =
      typeof body.webDesignId === 'string' && body.webDesignId.trim()
        ? body.webDesignId.trim().slice(0, 64)
        : undefined;
    const caseType =
      typeof body.caseType === 'string' && body.caseType.trim()
        ? body.caseType.trim().slice(0, 64)
        : undefined;
    const caseQtyRaw =
      typeof body.caseQty === 'number' && Number.isFinite(body.caseQty) ? Math.floor(body.caseQty) : 1;
    const caseQty = caseType ? Math.max(1, Math.min(50, caseQtyRaw)) : undefined;

    if (!toId || (coins <= 0 && !skinId && !webDesignId && !caseType)) {
      res.status(400).json({ ok: false, error: 'INVALID_GIFT' });
      return;
    }

    const admin = socialState.accounts[ADMIN_UID];
    const target = findAccountByAccountId(toId);
    if (!target || target.isCreator) {
      res.status(404).json({ ok: false, error: 'NOT_FOUND' });
      return;
    }

    const gift: ServerGiftItem = {
      giftId: `admin_gift_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      fromAccountId: admin.accountId,
      fromNickname: 'Admin',
      fromIsAdmin: true,
      coins,
      skinId,
      webDesignId,
      caseType,
      caseQty,
      createdAt: new Date().toISOString(),
    };
    target.pendingGifts.push(gift);
    saveState(socialState);
    res.json({ ok: true, gift });
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Spider Spikey server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
