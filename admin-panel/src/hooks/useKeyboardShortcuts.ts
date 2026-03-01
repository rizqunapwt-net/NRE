import { useEffect } from 'react';

export interface ShortcutConfig {
  /** Keyboard shortcut (e.g., 'Ctrl+K', 'Cmd+S') */
  keys: string;
  /** Callback function */
  action: (event: KeyboardEvent) => void;
  /** Description for help modal */
  description?: string;
  /** Category for grouping */
  category?: string;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
  /** Only trigger when input/textarea is NOT focused */
  ignoreWhenTyping?: boolean;
}

/**
 * Hook for managing keyboard shortcuts
 */
export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const pressedKey = event.key.toLowerCase();
      
      // Build key combination string
      const modifiers = {
        ctrl: event.ctrlKey,
        cmd: event.metaKey,
        shift: event.shiftKey,
        alt: event.altKey,
      };

      shortcuts.forEach((shortcut) => {
        const shortcutKeys = shortcut.keys.toLowerCase().split('+').map(k => k.trim());
        const shortcutModifiers = {
          ctrl: shortcutKeys.includes('ctrl'),
          cmd: shortcutKeys.includes('cmd') || shortcutKeys.includes('meta'),
          shift: shortcutKeys.includes('shift'),
          alt: shortcutKeys.includes('alt'),
        };

        // Check if modifiers match
        const modifiersMatch =
          modifiers.ctrl === shortcutModifiers.ctrl &&
          modifiers.cmd === shortcutModifiers.cmd &&
          modifiers.shift === shortcutModifiers.shift &&
          modifiers.alt === shortcutModifiers.alt;

        // Get the main key (last in combination)
        const mainKey = shortcutKeys[shortcutKeys.length - 1];

        // Check if main key matches
        const keyMatches = pressedKey === mainKey;

        // Check if we should ignore when typing
        const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName);
        const shouldIgnore = shortcut.ignoreWhenTyping && isTyping;

        if (modifiersMatch && keyMatches && !shouldIgnore) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          shortcut.action(event);
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

/**
 * Hook for global search shortcut (Cmd/Ctrl + K)
 */
export const useSearchShortcut = (onSearch: () => void) => {
  useKeyboardShortcuts([
    {
      keys: 'Cmd+K',
      action: (e) => {
        e.preventDefault();
        onSearch();
      },
      preventDefault: true,
      ignoreWhenTyping: false,
    },
    {
      keys: 'Ctrl+K',
      action: (e) => {
        e.preventDefault();
        onSearch();
      },
      preventDefault: true,
      ignoreWhenTyping: false,
    },
  ]);
};

/**
 * Hook for save shortcut (Cmd/Ctrl + S)
 */
export const useSaveShortcut = (onSave: () => void) => {
  useKeyboardShortcuts([
    {
      keys: 'Cmd+S',
      action: (e) => {
        e.preventDefault();
        onSave();
      },
      preventDefault: true,
      ignoreWhenTyping: true,
    },
    {
      keys: 'Ctrl+S',
      action: (e) => {
        e.preventDefault();
        onSave();
      },
      preventDefault: true,
      ignoreWhenTyping: true,
    },
  ]);
};

/**
 * Hook for escape key
 */
export const useEscapeKey = (onEscape: () => void) => {
  useKeyboardShortcuts([
    {
      keys: 'Escape',
      action: onEscape,
      ignoreWhenTyping: false,
    },
  ]);
};

/**
 * Hook for help shortcut (?)
 */
export const useHelpShortcut = (onHelp: () => void) => {
  useKeyboardShortcuts([
    {
      keys: '?',
      action: (e) => {
        e.preventDefault();
        onHelp();
      },
      preventDefault: true,
      ignoreWhenTyping: true,
    },
  ]);
};

/**
 * Default shortcuts info for help modal
 */
export const defaultShortcuts: ShortcutConfig[] = [
  {
    keys: 'Cmd+K / Ctrl+K',
    action: () => {},
    description: 'Buka pencarian',
    category: 'Global',
  },
  {
    keys: 'Cmd+S / Ctrl+S',
    action: () => {},
    description: 'Simpan perubahan',
    category: 'Global',
  },
  {
    keys: '?',
    action: () => {},
    description: 'Tampilkan bantuan shortcuts',
    category: 'Global',
  },
  {
    keys: 'Escape',
    action: () => {},
    description: 'Tutup modal/drawer',
    category: 'Global',
  },
];

export default useKeyboardShortcuts;
