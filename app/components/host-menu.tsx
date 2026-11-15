'use client';

import { useState } from 'react';

export interface HostMenuItem {
  label: string;
  onClick: () => void;
  // Ends something for everyone: asks once more before doing it.
  confirm?: string;
}

// In a game, the host's extra controls live behind one small button in the
// corner, so the host's screen is laid out exactly like everyone else's.
// Nothing here pushes the game's own layout around.
export function HostMenu({ items }: { items: HostMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  if (items.length === 0) return null;
  const close = () => {
    setOpen(false);
    setConfirming(null);
  };
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Host options"
        className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/40 bg-black/25 text-white/80 backdrop-blur-sm"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-[2px]" onClick={close}>
          <div
            className="animate-home-fade mb-[max(1.5rem,env(safe-area-inset-bottom))] w-full max-w-xs space-y-3 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-xs tracking-[0.2em] text-white/60 uppercase">Host</p>
            {items.map((it) => (
              <button
                key={it.label}
                onClick={() => {
                  if (it.confirm && confirming !== it.label) return setConfirming(it.label);
                  it.onClick();
                  close();
                }}
                className={`w-full rounded-xl py-4 text-lg font-bold transition ${
                  confirming === it.label ? 'bg-[#b2492f] text-white' : 'bg-[#1d2036] text-white hover:bg-[#262a46]'
                }`}
              >
                {confirming === it.label ? it.confirm : it.label}
              </button>
            ))}
            <button onClick={close} className="w-full py-3 text-white/70">
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
