// Переключатель тем: Light / Dark / OTP Brand.
// Встраивается в хедер ShowcaseComponent.
import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../context/ThemeContext';

const themes: { id: Theme; label: string; icon: string }[] = [
  { id: 'light', label: 'Светлая', icon: '☀️' },
  { id: 'dark',  label: 'Тёмная',  icon: '🌙' },
  { id: 'otp',   label: 'OTP',     icon: '🟠' },
];

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const current = themes.find((t) => t.id === theme) ?? themes[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
        style={{
          backgroundColor: 'rgba(255,255,255,0.18)',
          border: '1px solid rgba(255,255,255,0.26)',
          backdropFilter: 'blur(10px)',
          color: 'var(--color-accent-text)',
        }}
        aria-label="Сменить тему"
        title="Сменить тему"
      >
        <span>{current.icon}</span>
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Закрытие по клику на фон */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 rounded-2xl shadow-xl z-50 overflow-hidden py-1 min-w-[130px]"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-surface) 92%, transparent)',
              border: '1px solid var(--color-border)',
              backdropFilter: 'blur(14px)',
            }}
          >
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-all hover:opacity-80"
                style={{
                  backgroundColor: theme === t.id ? 'var(--color-accent-light)' : 'transparent',
                  color: theme === t.id ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  fontWeight: theme === t.id ? 600 : 400,
                }}
              >
                <span>{t.icon}</span>
                {t.label}
                {theme === t.id && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
