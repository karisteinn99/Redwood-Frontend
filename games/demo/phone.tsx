import type { Player } from '@shared/party-types';

import type { DemoAction, DemoPlayerView } from './definition';

export function DemoPhone({
  view,
  send,
}: {
  view: DemoPlayerView;
  players?: Player[];
  send: (action: DemoAction) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-white/40">Your secret number</p>
      <p className="mt-1 text-4xl font-bold">{view.secret}</p>
      <p className="mt-8 text-white/50">
        {view.counter} / {view.target}
      </p>
      <button
        onClick={() => send({ type: 'tap' })}
        className="mt-8 w-full max-w-xs rounded-xl bg-blue-600 py-4 text-xl font-bold transition hover:bg-blue-500"
      >
        Tap
      </button>
    </div>
  );
}
