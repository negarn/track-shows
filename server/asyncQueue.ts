export type AsyncActionQueueRef = {
  current: Promise<void>;
};

export function createAsyncActionQueueRef(): AsyncActionQueueRef {
  return {
    current: Promise.resolve()
  };
}

export function queueAsyncAction<T>(queueRef: AsyncActionQueueRef, action: () => Promise<T>) {
  const queuedAction = queueRef.current.then(action, action);
  queueRef.current = queuedAction.then(
    () => undefined,
    () => undefined
  );
  return queuedAction;
}
