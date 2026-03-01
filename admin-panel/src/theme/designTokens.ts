/**
 * Design Tokens - NRE Enterprise Design System
 * Centralized design tokens for consistent UI/UX
 */

export const designTokens = {
  // ═══════════════════════════════════════════════════════════
  // COLORS
  // ═══════════════════════════════════════════════════════════
  colors: {
    // Primary Brand
    primary: {
      50: '#E0F7F8',
      100: '#B3EBED',
      200: '#80DCDF',
      300: '#4DCAD0',
      400: '#26B3BB',
      500: '#008B94', // Main primary
      600: '#006B73', // Primary dark
      700: '#004D55',
      800: '#003238',
      900: '#001A1E',
    },
    // Semantic Colors
    success: {
      light: '#D1FAE5',
      main: '#10B981',
      dark: '#059669',
    },
    warning: {
      light: '#FEF3C7',
      main: '#F59E0B',
      dark: '#D97706',
    },
    error: {
      light: '#FEE2E2',
      main: '#EF4444',
      dark: '#DC2626',
    },
    info: {
      light: '#DBEAFE',
      main: '#3B82F6',
      dark: '#2563EB',
    },
    // Neutral Colors
    gray: {
      25: '#FCFCFD',
      50: '#F9FAFB',
      100: '#F2F4F7',
      200: '#E4E7EC',
      300: '#D0D5DC',
      400: '#98A2B3',
      500: '#667085',
      600: '#475467',
      700: '#344054',
      800: '#1D2939',
      900: '#101828',
    },
    // Background
    bg: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC',
      tertiary: '#F2F4F7',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // TYPOGRAPHY
  // ═══════════════════════════════════════════════════════════
  typography: {
    fontFamily: {
      primary: "'Plus Jakarta Sans', Inter, system-ui, sans-serif",
      heading: "'DM Serif Display', serif",
      mono: "'JetBrains Mono', monospace",
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      none: 1,
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // SPACING
  // ═══════════════════════════════════════════════════════════
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  // ═══════════════════════════════════════════════════════════
  // BORDER RADIUS
  // ═══════════════════════════════════════════════════════════
  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    full: '9999px',
  },

  // ═══════════════════════════════════════════════════════════
  // SHADOWS
  // ═══════════════════════════════════════════════════════════
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    // Glass effect shadows
    glass: '0 8px 32px rgba(0, 139, 148, 0.06)',
    glow: '0 0 24px rgba(0, 139, 148, 0.3)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  // ═══════════════════════════════════════════════════════════
  // BREAKPOINTS (Responsive)
  // ═══════════════════════════════════════════════════════════
  breakpoints: {
    xs: '320px',   // Small phones
    sm: '480px',   // Large phones
    md: '768px',   // Tablets
    lg: '992px',   // Small laptops
    xl: '1280px',  // Desktops
    '2xl': '1536px', // Large screens
  },

  // ═══════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // Z-INDEX SCALE
  // ═══════════════════════════════════════════════════════════
  zIndex: {
    hide: -1,
    base: 0,
    dropdown: 100,
    sticky: 200,
    overlay: 300,
    modal: 400,
    popover: 500,
    toast: 600,
    tooltip: 700,
  },

  // ═══════════════════════════════════════════════════════════
  // COMPONENT SPECIFIC
  // ═══════════════════════════════════════════════════════════
  components: {
    // Glass morphism effects
    glass: {
      card: 'rgba(255, 255, 255, 0.65)',
      navbar: 'rgba(255, 255, 255, 0.72)',
      sidebar: 'rgba(255, 255, 255, 0.78)',
      surface: 'rgba(255, 255, 255, 0.55)',
      blur: '16px',
      saturate: '180%',
    },
    // Touch targets (accessibility)
    touchTarget: {
      min: '44px',
      comfortable: '48px',
    },
    // Layout
    container: {
      maxWidth: '1440px',
      padding: '24px',
    },
    // Sidebar
    sidebar: {
      width: '220px',
      collapsedWidth: '80px',
    },
    // Header
    header: {
      height: '64px',
    },
  },
} as const;

// Type exports
export type DesignTokens = typeof designTokens;
export type ColorTokens = typeof designTokens.colors;
export type SpacingTokens = typeof designTokens.spacing;
export type ShadowTokens = typeof designTokens.shadows;

export default designTokens;
