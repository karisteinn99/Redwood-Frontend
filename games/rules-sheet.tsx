import type { CSSProperties, ReactNode } from 'react';

// The "How to play" sheet every game shares. At Home (picking a game, Up
// next) it wears Home's wood; inside a game it wears that game's colours.
export type RulesTheme = 'home' | 'game';

export interface RulesPalette {
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentInk: string;
  danger: string;
}

const HOME: RulesPalette = {
  surface: 'var(--home-surface)',
  border: 'var(--home-brass)',
  text: 'var(--home-text)',
  muted: 'var(--home-text-muted)',
  accent: 'var(--home-gold)',
  accentInk: 'var(--home-bg)',
  danger: 'var(--home-ember)',
};

export function RulesSheet({
  title,
  theme = 'game',
  palette,
  onClose,
  children,
}: {
  title: string;
  theme?: RulesTheme;
  palette: RulesPalette;
  onClose: () => void;
  children: ReactNode;
}) {
  const p = theme === 'home' ? HOME : palette;
  const vars = {
    '--r-surface': p.surface,
    '--r-border': p.border,
    '--r-text': p.text,
    '--r-muted': p.muted,
    '--r-accent': p.accent,
    '--r-accent-ink': p.accentInk,
    '--r-danger': p.danger,
  } as CSSProperties;
  const home = theme === 'home';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6"
      style={vars}
      onClick={onClose}
    >
      <div
        className={`relative flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl border bg-[var(--r-surface)] text-[var(--r-text)] ${
          home ? 'border-2 shadow-[0_24px_60px_rgba(0,0,0,0.6)]' : ''
        } border-[var(--r-border)]`}
        onClick={(e) => e.stopPropagation()}
      >
        {home && (
          <div
            className="home-wall pointer-events-none absolute inset-0 opacity-90 [--plank:96px]"
            aria-hidden="true"
          />
        )}
        <div className="relative flex shrink-0 items-center justify-between px-6 pt-6 pb-2">
          <p
            className={
              home
                ? 'font-[family-name:var(--font-display)] text-[22px] leading-tight font-bold'
                : 'text-xl font-bold'
            }
          >
            {title}
          </p>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 rounded-full p-2 text-2xl leading-none text-[var(--r-muted)] hover:text-[var(--r-text)]"
          >
            ✕
          </button>
        </div>
        <div className="relative space-y-5 overflow-y-auto px-6 pb-6 text-[var(--r-muted)] [&_section>p:first-child]:font-medium [&_section>p:first-child]:text-[var(--r-text)]">
          {children}
        </div>
      </div>
    </div>
  );
}
