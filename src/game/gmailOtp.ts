interface PendingOtpChallenge {
  hash: string;
  email: string;
  expiresAt: number;
  attemptsLeft: number;
}

let activeOtpChallenge: PendingOtpChallenge | null = null;

function generateSixDigitCode(): string {
  const buf = new Uint32Array(1);
  window.crypto.getRandomValues(buf);
  const num = (buf[0] % 900000) + 100000;
  return String(num);
}

async function hashOtp(email: string, code: string): Promise<string> {
  const payload = new TextEncoder().encode(`${email.trim().toLowerCase()}::${code.trim()}`);
  const digest = await window.crypto.subtle.digest('SHA-256', payload);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function encodeBase64UrlUtf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function encodeMimeSubject(subject: string): string {
  const bytes = new TextEncoder().encode(subject);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

export async function sendGmailVerificationCode(
  toEmail: string,
  accessToken: string
): Promise<void> {
  const cleanEmail = toEmail.trim().replace(/[\r\n]/g, '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('INVALID_EMAIL');
  }
  const code = generateSixDigitCode();
  const hash = await hashOtp(cleanEmail, code);

  const subject = `Spider Spikey — Verification Code: ${code}`;
  const body = [
    `Assalomu alaykum!`,
    ``,
    `Spider Spikey o‘yiniga kirish uchun 6 xonali tasdiqlash kodingiz:`,
    ``,
    `    ${code}`,
    ``,
    `Ushbu kodni "PLS ENTER VERIFICATION CODE" oynasiga kiriting.`,
    `Kod 10 daqiqa davomida amal qiladi. Agar bu so‘rovni siz yubormagan bo‘lsangiz, xatni e’tiborsiz qoldiring.`,
  ].join('\r\n');

  const rawMime = [
    `To: ${cleanEmail}`,
    `Subject: ${encodeMimeSubject(subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: 8bit`,
    ``,
    body,
  ].join('\r\n');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodeBase64UrlUtf8(rawMime),
    }),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('GMAIL_TOKEN_EXPIRED');
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(errText || `Gmail API error (${res.status})`);
  }

  activeOtpChallenge = {
    hash,
    email: cleanEmail.toLowerCase(),
    expiresAt: Date.now() + 10 * 60 * 1000,
    attemptsLeft: 5,
  };
}

export async function verifyGmailCode(
  email: string,
  inputCode: string
): Promise<
  | { ok: true }
  | { ok: false; reason: 'NO_CODE' | 'EXPIRED' | 'TOO_MANY_ATTEMPTS' | 'MISMATCH'; attemptsLeft: number }
> {
  if (!activeOtpChallenge || activeOtpChallenge.email !== email.trim().toLowerCase()) {
    return { ok: false, reason: 'NO_CODE', attemptsLeft: 0 };
  }
  if (Date.now() > activeOtpChallenge.expiresAt) {
    activeOtpChallenge = null;
    return { ok: false, reason: 'EXPIRED', attemptsLeft: 0 };
  }
  if (activeOtpChallenge.attemptsLeft <= 0) {
    return { ok: false, reason: 'TOO_MANY_ATTEMPTS', attemptsLeft: 0 };
  }

  const candidateHash = await hashOtp(email, inputCode.replace(/\D/g, ''));
  if (candidateHash === activeOtpChallenge.hash) {
    activeOtpChallenge = null;
    return { ok: true };
  }

  activeOtpChallenge.attemptsLeft -= 1;
  return {
    ok: false,
    reason: activeOtpChallenge.attemptsLeft <= 0 ? 'TOO_MANY_ATTEMPTS' : 'MISMATCH',
    attemptsLeft: activeOtpChallenge.attemptsLeft,
  };
}

export function clearPendingOtp(): void {
  activeOtpChallenge = null;
}
