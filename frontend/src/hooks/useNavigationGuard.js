import { useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { useDirtyTracker } from '../context/DirtyTrackerContext';

export function useNavigationGuard(pageKey) {
  const { isDirty, setDirty } = useDirtyTracker();
  const [showModal, setShowModal] = useState(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => (
      isDirty(pageKey) && currentLocation.pathname !== nextLocation.pathname
    )
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowModal(true);
    }
  }, [blocker.state]);

  const confirmLeave = () => {
    setDirty(pageKey, false);
    setShowModal(false);
    blocker.proceed?.();
  };

  const cancelLeave = () => {
    setShowModal(false);
    blocker.reset?.();
  };

  return {
    showLeaveModal: showModal,
    confirmLeave,
    cancelLeave,
  };
}
