import React, { useMemo, useState } from 'react';
import { Check, Globe, Search, X } from 'lucide-react';
import { audio } from '../game/audio';
import { LANGUAGES, LanguageCode, normalizeLangCode, tr } from '../game/i18n';

interface LanguageSelectorProps {
  currentLanguage: LanguageCode | null;
  isFirstLaunchGate: boolean;
  onSelectLanguage: (code: LanguageCode) => void;
  onClose?: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  isFirstLaunchGate,
  onSelectLanguage,
  onClose,
}) => {
  const [selected, setSelected] = useState<LanguageCode>(normalizeLangCode(currentLanguage ?? 'en'));
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.nativeName.toLowerCase().includes(q) ||
        l.englishName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#050811]/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      dir="ltr"
    >
      <div className="pixel-panel w-full max-w-4xl max-h-[90vh] bg-[#0c1424] border-sky-400/70 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 pixel-panel bg-sky-900/60 border-sky-400 flex items-center justify-center">
              <Globe className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h2 className="font-pixel text-base sm:text-xl text-white">
                {tr(selected, 'langSelectTitle')}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {tr(selected, 'langSelectSubtitle')}
              </p>
            </div>
          </div>

          {!isFirstLaunchGate && onClose && (
            <button
              type="button"
              onClick={() => {
                audio.playSfx('menuClick');
                onClose();
              }}
              className="pixel-btn bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/70 flex items-center gap-2.5">
          <Search className="w-4 h-4 text-sky-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr(selected, 'langSearchPlaceholder')}
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 outline-none"
          />
          <span className="font-mono-num text-[11px] text-slate-400 whitespace-nowrap">
            {filtered.length} / {LANGUAGES.length}
          </span>
        </div>

        {/* 38 Languages Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {filtered.map((lang) => {
            const active = selected === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  audio.playSfx('menuHover');
                  setSelected(lang.code);
                }}
                onDoubleClick={() => {
                  audio.playSfx('menuClick');
                  onSelectLanguage(lang.code);
                }}
                className={`pixel-btn p-2.5 text-left flex items-center gap-2.5 cursor-pointer ${
                  active
                    ? 'bg-sky-900/75 border-sky-400 text-white'
                    : 'bg-slate-900/85 border-slate-700 hover:border-sky-500/60 text-slate-200'
                }`}
              >
                <span className="text-xl leading-none shrink-0">{lang.flag}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">{lang.nativeName}</div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                    <span>{lang.englishName}</span>
                    {lang.rtl && (
                      <span className="text-[9px] text-amber-300 font-pixel">RTL</span>
                    )}
                  </div>
                </div>
                {active && <Check className="w-3.5 h-3.5 text-sky-300 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Footer Confirm */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-300 flex items-center gap-2">
            <span>{LANGUAGES.find((l) => l.code === selected)?.flag}</span>
            <strong className="text-sky-300">
              {LANGUAGES.find((l) => l.code === selected)?.nativeName}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => {
              audio.playSfx('menuClick');
              onSelectLanguage(selected);
            }}
            className="pixel-btn bg-sky-600 hover:bg-sky-500 border-sky-400 text-white px-6 py-2.5 font-pixel text-xs cursor-pointer"
          >
            {tr(selected, 'langContinue')}
          </button>
        </div>
      </div>
    </div>
  );
};
