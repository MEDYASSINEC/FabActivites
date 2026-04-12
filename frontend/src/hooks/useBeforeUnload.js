import { useEffect } from 'react';
import { useDirtyTracker } from '../context/DirtyTrackerContext';

export function useBeforeUnload(pageKey) {
  const { isDirty } = useDirtyTracker();
  const dirty = isDirty(pageKey);

  useEffect(() => {
    const handler = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}
