import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab } from '../types';

interface HistoryState {
  tab?: ActiveTab;
  modal?: string | null;
  timestamp?: number;
  isRoot?: boolean;
}

export function useMobileBackHandler() {
  const {
    activeTab,
    setActiveTab,
    selectedOrderForModal,
    setSelectedOrderForModal,
    selectedOrderForPrint,
    setSelectedOrderForPrint,
    selectedDeviceForHistory,
    setSelectedDeviceForHistory,
    isDonateOpen,
    setIsDonateOpen,
    isGoogleDriveOpen,
    setIsGoogleDriveOpen,
    isBackupModalOpen,
    setIsBackupModalOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
  } = useApp();

  const [exitToastVisible, setExitToastVisible] = useState(false);
  const exitToastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastBackPressTimeRef = useRef<number>(0);

  // Keep live references to avoid stale closure issues in popstate
  const stateRef = useRef({
    activeTab,
    selectedOrderForModal,
    selectedOrderForPrint,
    selectedDeviceForHistory,
    isDonateOpen,
    isGoogleDriveOpen,
    isBackupModalOpen,
    isAuthModalOpen,
  });

  useEffect(() => {
    stateRef.current = {
      activeTab,
      selectedOrderForModal,
      selectedOrderForPrint,
      selectedDeviceForHistory,
      isDonateOpen,
      isGoogleDriveOpen,
      isBackupModalOpen,
      isAuthModalOpen,
    };
  }, [
    activeTab,
    selectedOrderForModal,
    selectedOrderForPrint,
    selectedDeviceForHistory,
    isDonateOpen,
    isGoogleDriveOpen,
    isBackupModalOpen,
    isAuthModalOpen,
  ]);

  // Track currently active modal identifier
  const getActiveModalName = (): string | null => {
    if (selectedOrderForModal) return 'orderDetail';
    if (selectedOrderForPrint) return 'orderPrint';
    if (selectedDeviceForHistory) return 'deviceHistory';
    if (isAuthModalOpen) return 'auth';
    if (isGoogleDriveOpen) return 'googleDrive';
    if (isBackupModalOpen) return 'backup';
    if (isDonateOpen) return 'donate';
    return null;
  };

  const closeActiveModal = (): boolean => {
    const s = stateRef.current;
    if (s.selectedOrderForModal) {
      setSelectedOrderForModal(null);
      return true;
    }
    if (s.selectedOrderForPrint) {
      setSelectedOrderForPrint(null);
      return true;
    }
    if (s.selectedDeviceForHistory) {
      setSelectedDeviceForHistory(null);
      return true;
    }
    if (s.isAuthModalOpen) {
      setIsAuthModalOpen(false);
      return true;
    }
    if (s.isGoogleDriveOpen) {
      setIsGoogleDriveOpen(false);
      return true;
    }
    if (s.isBackupModalOpen) {
      setIsBackupModalOpen(false);
      return true;
    }
    if (s.isDonateOpen) {
      setIsDonateOpen(false);
      return true;
    }
    return false;
  };

  // Flag to avoid recursive history push when popstate is triggered
  const isHandlingPopState = useRef(false);

  // Initialize history state on mount
  useEffect(() => {
    // Replace initial state with root
    const initialState: HistoryState = {
      tab: 'ordenes',
      modal: null,
      timestamp: Date.now(),
      isRoot: true,
    };
    try {
      window.history.replaceState(initialState, '', window.location.href);
      // Push an extra layer so the first back gesture is always capturable
      window.history.pushState(
        { tab: 'ordenes', modal: null, timestamp: Date.now() + 1 },
        '',
        window.location.href
      );
    } catch {
      // Ignore if iframe/sandbox blocks history manipulation
    }
  }, []);

  // Sync Tab changes to history
  const prevTabRef = useRef<ActiveTab>(activeTab);
  useEffect(() => {
    if (isHandlingPopState.current) return;

    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab;
      try {
        const state: HistoryState = {
          tab: activeTab,
          modal: getActiveModalName(),
          timestamp: Date.now(),
        };
        window.history.pushState(state, '', window.location.href);
      } catch {
        // Safe fallback
      }
    }
  }, [activeTab]);

  // Sync Modal opens to history
  const prevModalRef = useRef<string | null>(null);
  useEffect(() => {
    if (isHandlingPopState.current) return;

    const currentModal = getActiveModalName();
    if (currentModal && currentModal !== prevModalRef.current) {
      prevModalRef.current = currentModal;
      try {
        const state: HistoryState = {
          tab: activeTab,
          modal: currentModal,
          timestamp: Date.now(),
        };
        window.history.pushState(state, '', window.location.href);
      } catch {
        // Safe fallback
      }
    } else if (!currentModal) {
      prevModalRef.current = null;
    }
  }, [
    selectedOrderForModal,
    selectedOrderForPrint,
    selectedDeviceForHistory,
    isDonateOpen,
    isGoogleDriveOpen,
    isBackupModalOpen,
    isAuthModalOpen,
    activeTab,
  ]);

  // Listen to popstate (Android physical back button or swipe-to-back gesture)
  useEffect(() => {
    const handlePopState = (_event: PopStateEvent) => {
      isHandlingPopState.current = true;

      // 1. If any modal is open, close the modal first
      if (closeActiveModal()) {
        // Re-push a history cushion so future back presses continue working smoothly
        try {
          window.history.pushState(
            { tab: stateRef.current.activeTab, modal: null, timestamp: Date.now() },
            '',
            window.location.href
          );
        } catch {}
        setTimeout(() => {
          isHandlingPopState.current = false;
        }, 80);
        return;
      }

      // 2. If user is in a sub-section / other tab, return to main 'ordenes' tab
      if (stateRef.current.activeTab !== 'ordenes') {
        setActiveTab('ordenes');
        try {
          window.history.pushState(
            { tab: 'ordenes', modal: null, timestamp: Date.now() },
            '',
            window.location.href
          );
        } catch {}
        setTimeout(() => {
          isHandlingPopState.current = false;
        }, 80);
        return;
      }

      // 3. User is already on the root 'ordenes' view with no modals open:
      // Standard Android "double back to exit" pattern
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2500) {
        // User confirmed exit by pressing back twice in 2.5s
        setExitToastVisible(false);
        // Let the browser handle exiting or closing
      } else {
        // First back press on root: show toast and prevent accidental closing
        lastBackPressTimeRef.current = now;
        setExitToastVisible(true);
        if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
        exitToastTimerRef.current = setTimeout(() => {
          setExitToastVisible(false);
        }, 2500);

        // Keep the app alive by pushing current state back
        try {
          window.history.pushState(
            { tab: 'ordenes', modal: null, timestamp: Date.now(), isRoot: true },
            '',
            window.location.href
          );
        } catch {}
      }

      setTimeout(() => {
        isHandlingPopState.current = false;
      }, 80);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitToastTimerRef.current) clearTimeout(exitToastTimerRef.current);
    };
  }, [setActiveTab]);

  return { exitToastVisible };
}
