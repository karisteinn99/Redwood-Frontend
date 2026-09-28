import type { Player } from '@shared/party-types';

import type { DemoTvView } from './definition';

export function DemoTv({ view }: { view: DemoTvView; players?: Player[] }) {
  return (
    <div className="flex flex-col items-center">
      <p className="text-sm tracking-widest text-white/40 uppercase">Tap Demo</p>
      <p className="mt-4 text-8xl font-bold">
        {view.counter}
        <span className="text-white/30"> / {view.target}</span>
      </p>
    </div>
  );
}
