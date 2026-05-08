import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createEmptyTrackShowsAppDataSnapshot, type TrackShowsAppDataSnapshot } from "../helpers/cloudSyncData";
import { loadTrackShowsState, saveTrackShowsState } from "../lib/trackShowsState";

const SAVE_DEBOUNCE_MS = 180;

interface UseTrackShowsStateResult {
  error: string | null;
  isLoading: boolean;
  isSaving: boolean;
  refresh: () => Promise<void>;
  state: TrackShowsAppDataSnapshot;
  setState: Dispatch<SetStateAction<TrackShowsAppDataSnapshot>>;
}

function getSerializedState(snapshot: TrackShowsAppDataSnapshot): string {
  return JSON.stringify(snapshot);
}

export function useTrackShowsState(): UseTrackShowsStateResult {
  const initialSnapshot = createEmptyTrackShowsAppDataSnapshot();
  const [state, setState] = useState<TrackShowsAppDataSnapshot>(() => initialSnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const serializedStateRef = useRef<string>(getSerializedState(initialSnapshot));
  const saveTimerRef = useRef<number | null>(null);

  function clearSaveTimer(): void {
    if (saveTimerRef.current === null) {
      return;
    }

    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
  }

  function applyLoadedState(nextState: TrackShowsAppDataSnapshot): void {
    setState(nextState);
    serializedStateRef.current = getSerializedState(nextState);
    setError(null);
  }

  function reportLoadError(loadError: unknown): void {
    console.error(loadError);
    setError(loadError instanceof Error ? loadError.message : "Could not load tracked show data.");
  }

  async function loadState(shouldIgnoreUpdates: () => boolean): Promise<void> {
    try {
      const nextState = await loadTrackShowsState();

      if (shouldIgnoreUpdates()) {
        return;
      }

      applyLoadedState(nextState);
    } catch (loadError) {
      if (!shouldIgnoreUpdates()) {
        reportLoadError(loadError);
      }
    } finally {
      if (!shouldIgnoreUpdates()) {
        setIsLoading(false);
        hydratedRef.current = true;
      }
    }
  }

  async function persistState(nextState: TrackShowsAppDataSnapshot, serializedState: string): Promise<void> {
    setIsSaving(true);

    try {
      const savedState = await saveTrackShowsState(nextState);
      const savedSerializedState = getSerializedState(savedState);

      serializedStateRef.current = savedSerializedState;
      setError(null);

      if (savedSerializedState !== serializedState) {
        setState(savedState);
      }
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : "Could not save tracked show data.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    void loadState(() => cancelled);

    return () => {
      cancelled = true;
      clearSaveTimer();
    };
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) {
      return undefined;
    }

    const serializedState = getSerializedState(state);

    if (serializedState === serializedStateRef.current) {
      return undefined;
    }

    clearSaveTimer();

    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void persistState(state, serializedState);
    }, SAVE_DEBOUNCE_MS);

    return clearSaveTimer;
  }, [state]);

  function refresh(): Promise<void> {
    setIsLoading(true);
    return loadState(() => false);
  }

  return {
    error,
    isLoading,
    isSaving,
    refresh,
    state,
    setState,
  };
}
