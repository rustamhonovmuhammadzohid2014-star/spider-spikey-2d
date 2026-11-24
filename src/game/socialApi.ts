export interface PublicAccountView {
  accountId: string;
  nickname: string;
  isAdmin: boolean;
  avatarId: string | null;
  relationship: 'self' | 'friend' | 'outgoing' | 'incoming' | 'none';
}

export interface SocialSnapshot {
  friends: PublicAccountView[];
  incomingRequests: PublicAccountView[];
  outgoingRequests: PublicAccountView[];
  pendingGiftsCount: number;
}

export interface ServerGiftItem {
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

export interface AdminManagedAccount {
  uid: string;
  accountId: string;
  nickname: string;
  avatarId: string;
  isFriendWithAdmin: boolean;
  pendingRequestFromAdmin: boolean;
  incomingRequestToAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

// Held strictly in JS/React memory (never stored in localStorage/sessionStorage)
let memorySessionToken: string | null = null;
let memorySessionUid: string | null = null;

export function getSocialSessionUid(): string | null {
  return memorySessionUid;
}

export function hasSocialToken(): boolean {
  return Boolean(memorySessionToken);
}

export function clearSocialSession(): void {
  memorySessionToken = null;
  memorySessionUid = null;
}

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };
  if (requireAuth && memorySessionToken) {
    headers.Authorization = `Bearer ${memorySessionToken}`;
  }
  const res = await fetch(url, { ...options, headers });
  let data: unknown = {};
  try {
    data = await res.json();
  } catch {
    data = { ok: false, error: 'INVALID_RESPONSE' };
  }
  return { status: res.status, data: data as T };
}

export async function registerOrSyncAccountApi(input: {
  uid: string;
  nickname: string;
  avatarId: string;
  existingAccountId?: string;
}): Promise<{
  ok: boolean;
  account?: { uid: string; accountId: string; nickname: string; avatarId: string; isCreator: boolean };
  social?: SocialSnapshot;
  error?: string;
}> {
  const { data } = await apiFetch<{
    ok: boolean;
    token?: string;
    account?: { uid: string; accountId: string; nickname: string; avatarId: string; isCreator: boolean };
    social?: SocialSnapshot;
    error?: string;
  }>(
    '/api/accounts/register',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    false
  );
  if (data.ok && data.token && data.account) {
    memorySessionToken = data.token;
    memorySessionUid = data.account.uid;
  }
  return data;
}

export async function creatorLoginApi(key: string): Promise<{
  ok: boolean;
  account?: { uid: string; accountId: string; nickname: string; avatarId: string; isCreator: boolean };
  social?: SocialSnapshot;
  error?: string;
}> {
  const { data } = await apiFetch<{
    ok: boolean;
    token?: string;
    account?: { uid: string; accountId: string; nickname: string; avatarId: string; isCreator: boolean };
    social?: SocialSnapshot;
    error?: string;
  }>(
    '/api/creator/login',
    {
      method: 'POST',
      body: JSON.stringify({ key }),
    },
    false
  );
  if (data.ok && data.token && data.account) {
    memorySessionToken = data.token;
    memorySessionUid = data.account.uid;
  }
  return data;
}

export async function fetchMySocialApi(): Promise<{
  ok: boolean;
  account?: { uid: string; accountId: string; nickname: string; avatarId: string | null; isCreator: boolean };
  social?: SocialSnapshot;
  error?: string;
}> {
  const { data } = await apiFetch<{
    ok: boolean;
    account?: { uid: string; accountId: string; nickname: string; avatarId: string | null; isCreator: boolean };
    social?: SocialSnapshot;
    error?: string;
  }>('/api/accounts/me');
  return data;
}

export async function lookupAccountByIdApi(id: string): Promise<{
  ok: boolean;
  account?: PublicAccountView;
  error?: string;
}> {
  const { data } = await apiFetch<{
    ok: boolean;
    account?: PublicAccountView;
    error?: string;
  }>(`/api/accounts/lookup?id=${encodeURIComponent(id.trim())}`);
  return data;
}

export async function sendFriendRequestApi(targetAccountId: string): Promise<{
  ok: boolean;
  autoAccepted?: boolean;
  alreadyFriends?: boolean;
  social?: SocialSnapshot;
  error?: string;
}> {
  const { data } = await apiFetch<{
    ok: boolean;
    autoAccepted?: boolean;
    alreadyFriends?: boolean;
    social?: SocialSnapshot;
    error?: string;
  }>('/api/friends/request', {
    method: 'POST',
    body: JSON.stringify({ targetAccountId }),
  });
  return data;
}

export async function respondFriendRequestApi(
  fromAccountId: string,
  action: 'accept' | 'decline'
): Promise<{ ok: boolean; social?: SocialSnapshot; error?: string }> {
  const { data } = await apiFetch<{
    ok: boolean;
    social?: SocialSnapshot;
    error?: string;
  }>('/api/friends/respond', {
    method: 'POST',
    body: JSON.stringify({ fromAccountId, action }),
  });
  return data;
}

export async function sendFriendGiftApi(input: {
  toAccountId: string;
  coins?: number;
  skinId?: string;
  webDesignId?: string;
}): Promise<{ ok: boolean; gift?: ServerGiftItem; error?: string }> {
  const { data } = await apiFetch<{
    ok: boolean;
    gift?: ServerGiftItem;
    error?: string;
  }>('/api/gifts/send', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data;
}

export async function claimPendingGiftsApi(): Promise<{
  ok: boolean;
  gifts?: ServerGiftItem[];
  error?: string;
}> {
  const { data } = await apiFetch<{
    ok: boolean;
    gifts?: ServerGiftItem[];
    error?: string;
  }>('/api/gifts/claim', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  return data;
}

export async function fetchAdminAccountsApi(): Promise<{
  ok: boolean;
  adminAccountId?: string;
  accounts?: AdminManagedAccount[];
  error?: string;
}> {
  const { data } = await apiFetch<{
    ok: boolean;
    adminAccountId?: string;
    accounts?: AdminManagedAccount[];
    error?: string;
  }>('/api/admin/accounts');
  return data;
}

export async function sendAdminGiftApi(input: {
  toAccountId: string;
  coins?: number;
  skinId?: string;
  webDesignId?: string;
  caseType?: string;
  caseQty?: number;
}): Promise<{ ok: boolean; gift?: ServerGiftItem; error?: string }> {
  const { data } = await apiFetch<{
    ok: boolean;
    gift?: ServerGiftItem;
    error?: string;
  }>('/api/admin/send', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data;
}
