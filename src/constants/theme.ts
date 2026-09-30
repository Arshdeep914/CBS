import '@/global.css';

/**
 * CBS brand palette. `primary` is sampled from the CBS logo red.
 * Every screen reads colors through `useTheme()` so light and dark mode stay in sync.
 */
export const Colors = {
  light: {
    background: '#F6F4F1',
    surface: '#FFFFFF',
    surfaceMuted: '#EFECE8',
    border: '#E4DFD8',
    text: '#1B1A19',
    textSecondary: '#6B655E',
    textMuted: '#9A938B',
    primary: '#D9161C',
    primaryPressed: '#B51116',
    primarySoft: '#FCE9E9',
    onPrimary: '#FFFFFF',
    danger: '#C0262D',
    warning: '#A15C00',
    warningSoft: '#FFF1DB',
    success: '#1F8A3E',
    successSoft: '#E3F4E8',
  },
  dark: {
    background: '#121110',
    surface: '#1C1B19',
    surfaceMuted: '#262422',
    border: '#322F2C',
    text: '#F5F2EE',
    textSecondary: '#ADA69E',
    textMuted: '#7D776F',
    primary: '#E8363C',
    primaryPressed: '#C8272D',
    primarySoft: '#3A1718',
    onPrimary: '#FFFFFF',
    danger: '#FF6B6F',
    warning: '#F2A93B',
    warningSoft: '#372713',
    success: '#4CC26B',
    successSoft: '#15301D',
  },
} as const;

export type ThemeColors = (typeof Colors)['light'] | (typeof Colors)['dark'];
export type ThemeColor = keyof typeof Colors.light;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Keeps forms readable on tablets and web instead of stretching edge to edge. */
export const MaxFormWidth = 440;
