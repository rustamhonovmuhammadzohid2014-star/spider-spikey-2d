import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  Play,
  RefreshCw,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { getLanguageDef, tr } from '../game/i18n';
import { getLiveCalendarInfo } from '../game/seasons';
import { drawParallaxBackground, drawSpikey, drawTile } from '../game/sprites';
import {
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  SPIDER_COLOR_META,
  SpiderColorId,
  TILE_SIZE,
} from '../game/types';

export type AuthGateStep =
  | 'SIGN_IN'
  | 'CONFIRM_GMAIL_SEND'
  | 'ENTER_OTP'
  | 'CREATE_PROFILE';

interface AuthGateProps {
  step: AuthGateStep;
  loading: boolean;
  busy: boolean;
  email: string | null;
  suggestedNickname?: string;
  resendCooldown: number;
  error: string | null;
  infoMessage: string | null;
  lang?: string | null;
  onOpenLanguage?: () => void;
  onGoogleSignIn: (enteredEmail?: string) => void;
  onTryForFree: () => void;
  onConfirmSendCode: (enteredEmail?: string) => void;
  onVerifyCode: (code: string) => void;
  onResendCode: () => void;
  onSwitchAccount: () => void;
  onCreateProfile: (nickname: string, spiderColor: SpiderColorId) => void;
}

// Custom Spider-themed 16-bit Pixel Forest Backdrop Canvas for Auth/Gmail Screen
export const SpiderAuthBackdropCanvas: React.FC<{ spiderColor?: SpiderColorId }> = ({
  spiderColor = 'classic',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        const camX = (t * 10) % 480;
        drawParallaxBackground(ctx, 1, camX, t, '1-1');

        // Sunlit canopy rays cutting diagonally across spider forest
        for (let b = 0; b < 3; b++) {
          const rx = 50 + b * 145 + Math.sin(t * 0.4 + b) * 6;
          ctx.fillStyle = 'rgba(167, 243, 208, 0.08)';
          for (let s = 0; s < 10; s++) {
            ctx.fillRect(Math.round(rx + s * 4), s * 24, 24, 24);
          }
        }

        // Giant gnarled right-side tree branch + mossy left ledge (inspired by screenshot)
        for (let tx = 0; tx < 30; tx++) {
          drawTile(ctx, 1, tx * TILE_SIZE, 14 * TILE_SIZE, 1, t, true);
          drawTile(ctx, 1, tx * TILE_SIZE, 15 * TILE_SIZE, 1, t, false);
          drawTile(ctx, 1, tx * TILE_SIZE, 16 * TILE_SIZE, 1, t, false);
        }
        // High branch platforms left & right for spider web anchors
        for (let tx = 0; tx < 4; tx++) {
          drawTile(ctx, 1, tx * TILE_SIZE, 4 * TILE_SIZE, 1, t, true);
          drawTile(ctx, 1, tx * TILE_SIZE, 5 * TILE_SIZE, 1, t, false);
        }
        for (let tx = 24; tx < 30; tx++) {
          drawTile(ctx, 2, tx * TILE_SIZE, 8 * TILE_SIZE, 1, t, true);
        }

        // Giant glistening 5-way spider web spanning center-left & right canopy
        const webs = [
          {
            wx: 120,
            wy: 132,
            anchors: [
              { x: 48, y: 80 },
              { x: 145, y: 0 },
              { x: 230, y: 74 },
              { x: 185, y: 14 * TILE_SIZE },
              { x: 42, y: 14 * TILE_SIZE },
            ],
            rings: [8, 16, 25, 34, 44],
          },
          {
            wx: 365,
            wy: 112,
            anchors: [
              { x: 290, y: 38 },
              { x: 385, y: 0 },
              { x: 472, y: 42 },
              { x: 416, y: 14 * TILE_SIZE },
              { x: 312, y: 14 * TILE_SIZE },
            ],
            rings: [7, 14, 22, 30],
          },
        ];

        for (const w of webs) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
          ctx.lineWidth = 1;
          for (const a of w.anchors) {
            ctx.beginPath();
            ctx.moveTo(w.wx, w.wy);
            ctx.lineTo(a.x, a.y);
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(a.x - 1, a.y - 1, 2, 2);
          }
          for (const r of w.rings) {
            ctx.beginPath();
            for (let i = 0; i <= w.anchors.length; i++) {
              const a = w.anchors[i % w.anchors.length];
              const ang = Math.atan2(a.y - w.wy, a.x - w.wx);
              const rx = Math.round(w.wx + Math.cos(ang) * r);
              const ry = Math.round(w.wy + Math.sin(ang) * r);
              if (i === 0) ctx.moveTo(rx, ry);
              else ctx.lineTo(rx, ry);
            }
            ctx.stroke();
          }
        }

        // Exotic Orchid Blossom on right branch
        const orbY = 7 * TILE_SIZE + Math.sin(t * 2.3) * 1.4;
        ctx.fillStyle = '#143d16';
        ctx.fillRect(424, Math.round(orbY), 3, 16);
        ctx.fillStyle = '#d946ef';
        ctx.fillRect(417, Math.round(orbY - 4), 16, 8);
        ctx.fillStyle = '#fae8ff';
        ctx.fillRect(420, Math.round(orbY - 6), 10, 10);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(424, Math.round(orbY - 2), 2, 3);

        // Animated Spikey rappelling on silk strand + second Spikey perched on main web
        const rappelY = 64 + Math.sin(t * 1.6) * 16;
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.moveTo(365, 0);
        ctx.lineTo(365, Math.round(rappelY));
        ctx.stroke();
        drawSpikey(ctx, 365, rappelY, -1, 'idle', t, [], 0, spiderColor);

        const perchX = 102 + Math.sin(t * 1.1) * 14;
        const perchY = 148 + Math.cos(t * 1.1) * 4;
        drawSpikey(
          ctx,
          perchX,
          perchY,
          Math.cos(t * 1.1) >= 0 ? 1 : -1,
          'walk',
          t,
          [],
          0,
          spiderColor
        );

        // Glowing golden-emerald fireflies
        for (let i = 0; i < 22; i++) {
          const fx = ((i * 47 + t * (9 + (i % 5) * 2.5)) % LOGICAL_WIDTH);
          const fy = 40 + ((i * 31) % 175) + Math.sin(t * 2.2 + i) * 6;
          ctx.globalAlpha = 0.35 + Math.sin(t * 4.2 + i) * 0.35;
          ctx.fillStyle = i % 3 === 0 ? '#fde047' : '#86efac';
          ctx.fillRect(Math.round(fx), Math.round(fy), 2, 2);
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [spiderColor]);

  return (
    <canvas
      ref={canvasRef}
      width={LOGICAL_WIDTH}
      height={LOGICAL_HEIGHT}
      className="pixelated absolute inset-0 w-full h-full object-cover opacity-90"
    />
  );
};

// Live animated mini pixel spider preview for the in-game account creation screen
const SpiderPreviewCanvas: React.FC<{ spiderColor: SpiderColorId }> = ({ spiderColor }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const ctx = ref.current?.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 56, 48);
        // Subtle silk strand beneath feet
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(4, 34, 48, 1);
        drawSpikey(ctx, 28, 25, 1, 'idle', t, [], 0, spiderColor);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [spiderColor]);

  return (
    <canvas
      ref={ref}
      width={56}
      height={48}
      className="pixelated w-20 h-16 bg-[#071311] border border-emerald-500/40 shrink-0"
    />
  );
};

export const AuthGate: React.FC<AuthGateProps> = ({
  step,
  loading,
  busy,
  email,
  suggestedNickname = '',
  resendCooldown,
  error,
  infoMessage,
  lang,
  onOpenLanguage,
  onGoogleSignIn,
  onTryForFree,
  onConfirmSendCode,
  onVerifyCode,
  onResendCode,
  onSwitchAccount,
  onCreateProfile,
}) => {
  const [gmailInput, setGmailInput] = useState(email ?? '');
  const [otpInput, setOtpInput] = useState('');
  const [nickname, setNickname] = useState(suggestedNickname);
  const [spiderColor, setSpiderColor] = useState<SpiderColorId>('classic');
  const calendar = getLiveCalendarInfo();
  const langDef = getLanguageDef(lang);

  useEffect(() => {
    if (email && !gmailInput) {
      setGmailInput(email);
    }
  }, [email, gmailInput]);

  useEffect(() => {
    if (step === 'ENTER_OTP') {
      setOtpInput('');
    }
  }, [step]);

  useEffect(() => {
    if (suggestedNickname && !nickname) {
      setNickname(suggestedNickname.slice(0, 24));
    }
  }, [suggestedNickname, nickname]);

  const spiderColors: SpiderColorId[] = ['classic', 'emerald', 'cobalt', 'amethyst', 'crimson'];

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#0a1a17] p-4 sm:p-8">
      <SpiderAuthBackdropCanvas spiderColor={spiderColor} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#071412]/55 via-[#091c18]/40 to-[#050e0c]/85 pointer-events-none" />

      <div className="relative z-10 pixel-panel w-full max-w-md p-6 sm:p-7 flex flex-col gap-5 border-emerald-400/50 bg-[#0a1815]/92 backdrop-blur-sm shadow-2xl">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-pixel text-[11px] text-emerald-300 tracking-wider">
              WEBORIA CHRONICLES
            </span>
            <div className="flex items-center gap-2">
              <span
                className="font-pixel text-[9px]"
                style={{ color: calendar.season.accentColor }}
              >
                {calendar.bannerLine2}
              </span>
              {onOpenLanguage && (
                <button
                  type="button"
                  onClick={onOpenLanguage}
                  className="pixel-btn bg-slate-900 hover:bg-slate-800 border-emerald-500/40 px-2 py-1 text-[10px] font-pixel text-sky-300 flex items-center gap-1 cursor-pointer"
                >
                  <Globe className="w-3 h-3" />
                  <span>{langDef.flag} {langDef.code.toUpperCase()}</span>
                </button>
              )}
            </div>
          </div>
          <h1 className="font-pixel text-3xl sm:text-4xl text-white leading-none drop-shadow-[0_3px_0_#06100e]">
            SPIDER <span className="text-sky-400">SPIKEY</span>
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-6 text-xs text-emerald-300 border-t border-emerald-950/90">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Akkaunt holati tekshirilmoqda...</span>
          </div>
        ) : step === 'SIGN_IN' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onGoogleSignIn(gmailInput.trim());
            }}
            className="border-t border-emerald-950/90 pt-4 flex flex-col gap-3"
          >
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {tr(lang, 'authSubtitle')}
            </p>

            <label className="flex flex-col gap-1 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <Mail className="w-3.5 h-3.5" />
                <span>{tr(lang, 'gmailLabel')}</span>
              </span>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={gmailInput}
                onChange={(e) => setGmailInput(e.target.value)}
                className="bg-slate-950/90 border border-emerald-500/40 focus:border-sky-400 outline-none px-3.5 py-2.5 text-sm text-white"
              />
            </label>

            <button
              type="submit"
              disabled={busy}
              className="pixel-btn w-full bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 px-5 py-3.5 font-pixel text-xs flex items-center justify-center gap-3 cursor-pointer"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
              )}
              <span>{busy ? '...' : tr(lang, 'googleSignInBtn')}</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={onTryForFree}
              className="pixel-btn w-full bg-emerald-900/75 hover:bg-emerald-800/80 border-emerald-500/60 text-emerald-100 px-5 py-3 font-pixel text-xs flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-emerald-300" />
              <span>{tr(lang, 'freeTrialBtn')}</span>
            </button>
            <p className="text-[11px] text-center text-slate-400">
              {tr(lang, 'trialGateBody')}
            </p>
          </form>
        ) : step === 'CONFIRM_GMAIL_SEND' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onConfirmSendCode(gmailInput.trim() || email || '');
            }}
            className="border-t border-emerald-950/90 pt-4 flex flex-col gap-3.5"
          >
            <div className="flex items-start gap-2.5 bg-slate-900/80 border border-slate-800 p-3">
              <Mail className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-200 leading-relaxed">
                <div className="font-semibold text-white">Gmail tasdiqlash kodi</div>
                <p className="text-slate-300 mt-1">
                  Gmail pochtangizga 6 xonali tasdiqlash kodini yuborish uchun manzilni tekshiring:
                </p>
              </div>
            </div>

            <input
              type="email"
              required
              placeholder="example@gmail.com"
              value={gmailInput || email || ''}
              onChange={(e) => setGmailInput(e.target.value)}
              className="bg-slate-950/90 border border-emerald-500/40 focus:border-sky-400 outline-none px-3.5 py-2.5 text-sm text-white"
            />

            <button
              type="submit"
              disabled={busy}
              className="pixel-btn w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-60 text-white px-5 py-3 font-pixel text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>{busy ? 'YUBORILMOQDA...' : 'GMAIL GA 6 XONALI KOD YUBORISH'}</span>
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={onSwitchAccount}
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4 self-center cursor-pointer"
            >
              Boshqa Google akkaunt tanlash
            </button>
          </form>
        ) : step === 'ENTER_OTP' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (otpInput.replace(/\D/g, '').length === 6) {
                onVerifyCode(otpInput.replace(/\D/g, ''));
              }
            }}
            className="border-t border-emerald-950/90 pt-4 flex flex-col gap-3.5"
          >
            <div className="flex flex-col gap-1">
              <div className="font-pixel text-sm sm:text-base text-amber-300 tracking-wide">
                PLS ENTER VERIFICATION CODE
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <span className="text-emerald-300 font-semibold break-all">{email}</span> Gmail pochtangizga haqiqiy 6 xonali kod yuborildi. Xatni ochib kodni kiriting:
              </p>
            </div>

            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-sky-400 shrink-0" />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                placeholder="000000"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-slate-950/90 border border-emerald-500/50 focus:border-sky-400 outline-none px-4 py-2.5 text-center font-mono-num text-xl tracking-[0.45em] text-white"
              />
            </div>

            <button
              type="submit"
              disabled={busy || otpInput.length !== 6}
              className="pixel-btn w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white px-5 py-3 font-pixel text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>KODNI TASDIQLASH</span>
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <button
                type="button"
                disabled={busy || resendCooldown > 0}
                onClick={onResendCode}
                className="flex items-center gap-1.5 hover:text-sky-300 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {resendCooldown > 0
                    ? `Qayta yuborish (${resendCooldown}s)`
                    : 'Kodni qayta yuborish'}
                </span>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={onSwitchAccount}
                className="hover:text-slate-200 underline underline-offset-4 cursor-pointer"
              >
                Boshqa Gmail kiritish
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (nickname.trim().length >= 2) {
                onCreateProfile(nickname.trim(), spiderColor);
              }
            }}
            className="border-t border-emerald-950/90 pt-4 flex flex-col gap-3.5"
          >
            <div className="flex items-center gap-3">
              <SpiderPreviewCanvas spiderColor={spiderColor} />
              <div className="text-xs text-slate-300 leading-relaxed">
                <div className="font-pixel text-xs text-emerald-300 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>O‘YIN PROFILINI YARATING</span>
                </div>
                <p className="text-slate-400 mt-1">
                  Gmail tasdiqlandi! Endi Spikey taxallusingiz va o‘rgimchak rangini tanlang.
                </p>
              </div>
            </div>

            <label className="flex flex-col gap-1 text-xs text-slate-300">
              <span>O‘yinchi taxallusi (Nickname)</span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={24}
                placeholder="Masalan: SpikeyPro"
                value={nickname}
                onChange={(e) => setNickname(e.target.value.slice(0, 24))}
                className="bg-slate-950/90 border border-slate-700 focus:border-sky-400 outline-none px-3 py-2 text-sm text-white"
              />
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-300">
                O‘rgimchak rangi: <strong className="text-sky-300">{SPIDER_COLOR_META[spiderColor].labelUz}</strong>
              </span>
              <div className="grid grid-cols-5 gap-2">
                {spiderColors.map((cid) => {
                  const meta = SPIDER_COLOR_META[cid];
                  const active = spiderColor === cid;
                  return (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => setSpiderColor(cid)}
                      title={meta.labelUz}
                      className={`pixel-btn p-2 flex flex-col items-center gap-1 cursor-pointer ${
                        active
                          ? 'bg-slate-800 border-sky-400'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <span
                        className="w-5 h-5 border border-black"
                        style={{ backgroundColor: meta.bodyTop }}
                      />
                      <span className="w-5 h-1.5" style={{ backgroundColor: meta.furTuft }} />
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || nickname.trim().length < 2}
              className="pixel-btn w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-3 font-pixel text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>AKKAUNTNI YARATISH VA O‘YNASH</span>
            </button>
          </form>
        )}

        {infoMessage && (
          <div className="border border-emerald-500/60 bg-emerald-950/60 px-3 py-2 text-xs text-emerald-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {error && (
          <div className="border border-rose-500/60 bg-rose-950/60 px-3 py-2.5 text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Gmail 6 xonali kodi orqali haqiqiylik tekshiriladi va yutuqlar bulutda saqlanadi.
          </span>
        </div>
      </div>
    </div>
  );
};
