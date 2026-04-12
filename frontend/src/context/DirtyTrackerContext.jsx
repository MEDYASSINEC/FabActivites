import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const PAGE_KEYS = ['frequentations', 'occupations', 'projets', 'settings'];

const initialDirtyPages = PAGE_KEYS.reduce((acc, key) => {
  acc[key] = false;
  return acc;
}, {});

const DirtyTrackerContext = createContext(null);

export function DirtyTrackerProvider({ children }) {
  const [dirtyPages, setDirtyPages] = useState(initialDirtyPages);

  const setDirty = useCallback((pageKey, isDirty) => {
    if (!PAGE_KEYS.includes(pageKey)) {
      console.warn(`DirtyTracker: invalid pageKey "${pageKey}"`);
      return;
    }

    setDirtyPages((prev) => {
      if (prev[pageKey] === isDirty) return prev;
      return { ...prev, [pageKey]: Boolean(isDirty) };
    });
  }, []);

  const isDirty = useCallback((pageKey) => Boolean(dirtyPages[pageKey]), [dirtyPages]);

  const isAnyDirty = useCallback(() => Object.values(dirtyPages).some(Boolean), [dirtyPages]);

  const value = useMemo(() => ({
    dirtyPages,
    setDirty,
    isDirty,
    isAnyDirty,
  }), [dirtyPages, isDirty, isAnyDirty, setDirty]);

  return (
    <DirtyTrackerContext.Provider value={value}>
      {children}
    </DirtyTrackerContext.Provider>
  );
}

export function useDirtyTracker() {
  const context = useContext(DirtyTrackerContext);
  if (!context) {
    throw new Error('useDirtyTracker must be used within a DirtyTrackerProvider');
  }
  return context;
}
