/**
 * MinimalChat Design System v1.0
 * 
 * Complete design tokens for the MinimalChat interface.
 * All values match the exact specifications from the design system.
 */

// Grid & Spacing
export const grid = {
  baseSpacing: 8,
  radius: {
    small: 6,
    medium: 12,
    large: 20,
  },
} as const

// Typography
export const typography = {
  fontFamily: "Inter, 'Helvetica Neue', Arial, sans-serif",
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    display: 28,
  },
  fontWeights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.1,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const

// Theme Colors
export const lightTheme = {
  background: '#FFFFFF',
  surface: '#F7F7F7',
  card: '#FFFFFF',
  primary: '#000000',
  secondary: '#666666',
  border: '#E5E5E5',
  inputBackground: '#F0F0F0',
  userMessage: '#EDEDED',
  botMessage: '#FFFFFF',
} as const

export const darkTheme = {
  background: '#0C0C0C',
  surface: '#161616',
  card: '#1F1F1F',
  primary: '#FFFFFF',
  secondary: '#A3A3A3',
  border: '#2A2A2A',
  inputBackground: '#1A1A1A',
  userMessage: '#262626',
  botMessage: '#1A1A1A',
} as const

// Layout
export const layout = {
  appContainer: {
    maxWidth: 900,
    paddingX: 24,
    paddingY: 32,
    gap: 24,
  },
  header: {
    height: 70,
    paddingX: 24,
    justify: 'space-between' as const,
    align: 'center' as const,
  },
  messageList: {
    padding: 20,
    gap: 16,
    maxHeight: 'calc(100vh - 180px)',
    scrollBehavior: 'smooth' as const,
  },
  sidebar: {
    width: 260,
    background: 'surface',
    padding: 20,
    gap: 18,
  },
} as const

// Component Specs
export const components = {
  message: {
    user: {
      background: 'userMessage',
      padding: 14,
      radius: 12,
      maxWidthPercent: 75,
      alignment: 'flex-end' as const,
      textColor: 'primary',
    },
    bot: {
      background: 'botMessage',
      padding: 14,
      radius: 12,
      maxWidthPercent: 75,
      alignment: 'flex-start' as const,
      textColor: 'primary',
    },
  },
  inputBar: {
    height: 56,
    padding: 12,
    radius: 14,
    background: 'inputBackground',
    border: 'border',
    gap: 12,
  },
  textField: {
    fontSize: 'md',
    placeholderColor: 'secondary',
    focusBorderColor: '#4C8DFF',
  },
  sendButton: {
    size: 42,
    radius: '50%',
    icon: 'arrow-up' as const,
    background: 'primary',
    iconColor: 'background',
  },
  chatHeader: {
    title: {
      fontSize: 'lg',
      weight: 'semibold' as const,
    },
    subtitle: {
      fontSize: 'sm',
      color: 'secondary',
    },
  },
  typingIndicator: {
    dots: 3,
    dotSize: 6,
    animation: 'pulse' as const,
  },
} as const

// Helper function to get theme-aware color
export function getThemeColor(colorKey: keyof typeof lightTheme, isDark: boolean): string {
  return isDark ? darkTheme[colorKey] : lightTheme[colorKey]
}

// Helper function to convert px values to rem (for Tailwind compatibility)
export function pxToRem(px: number): string {
  return `${px / 16}rem`
}

// Export complete design system as single object
export const designSystem = {
  name: 'MinimalChat',
  version: '1.0',
  grid,
  typography,
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  layout,
  components,
} as const

export type DesignSystem = typeof designSystem
export type ThemeColors = typeof lightTheme | typeof darkTheme
