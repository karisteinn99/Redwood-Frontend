import { HomeWallBackdrop } from './home-wall-backdrop';

// What a phone shows while it reconnects to its seat (a refresh, a reopened
// tab): just the wall, with three soft dots that only appear if it takes a
// moment, so a quick reload looks like nothing happened.
export function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center" role="status" aria-label="Loading">
      <HomeWallBackdrop />
      <div className="animate-loading-dots flex gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2.5 w-2.5 rounded-full bg-[var(--home-text-muted)]" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}
