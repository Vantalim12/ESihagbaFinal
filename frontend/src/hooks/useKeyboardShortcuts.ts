import { useEffect, useCallback, useState } from 'react';

interface ShortcutMap {
  [key: string]: string;
}

const SECTION_SHORTCUTS: ShortcutMap = {
  '1': 'dashboard',
  '2': 'analytics',
  '3': 'budget',
  '4': 'transactions',
  '5': 'wallets',
  '6': 'barangays',
  '7': 'approvals',
  '8': 'walletrecovery',
  '9': 'audit',
};

interface UseKeyboardShortcutsOptions {
  onNavigate: (section: string) => void;
  onRefresh?: () => void;
}

export function useKeyboardShortcuts({ onNavigate, onRefresh }: UseKeyboardShortcutsOptions) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (SECTION_SHORTCUTS[event.key] && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        onNavigate(SECTION_SHORTCUTS[event.key]);
        return;
      }

      if (event.key === 'r' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        onRefresh?.();
        return;
      }

      if (event.key === '?' || (event.key === '/' && event.shiftKey)) {
        event.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      if (event.key === 'Escape' && showHelp) {
        event.preventDefault();
        setShowHelp(false);
      }
    },
    [onNavigate, onRefresh, showHelp]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { showHelp, setShowHelp, shortcuts: SECTION_SHORTCUTS };
}
