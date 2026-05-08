import type { JSX } from "react";

interface WeekNavigationProps {
  nextDisabled?: boolean;
  nextLabel?: string;
  onNextWeek: () => void;
  onPreviousWeek: () => void;
  previousDisabled?: boolean;
  previousLabel?: string;
}

export function WeekNavigation({
  onPreviousWeek,
  onNextWeek,
  previousLabel = "Previous week",
  nextLabel = "Next week",
  previousDisabled = false,
  nextDisabled = false,
}: WeekNavigationProps): JSX.Element {
  return (
    <div className="flex items-center justify-center gap-4 px-2 pb-1">
      <button
        type="button"
        onClick={onPreviousWeek}
        disabled={previousDisabled}
        className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition enabled:hover:border-ember-300/30 enabled:hover:bg-ember-300/10 disabled:cursor-default disabled:opacity-60"
        aria-label={previousLabel}
      >
        <ChevronLeft />
      </button>

      <button
        type="button"
        onClick={onNextWeek}
        disabled={nextDisabled}
        className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition enabled:hover:border-ember-300/30 enabled:hover:bg-ember-300/10 disabled:cursor-default disabled:opacity-60"
        aria-label={nextLabel}
      >
        <ChevronRight />
      </button>
    </div>
  );
}

function ChevronLeft(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRight(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
