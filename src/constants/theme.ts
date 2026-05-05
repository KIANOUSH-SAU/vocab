// Design System v2 — Iris Violet + Warm Cream
// Source of truth: .claude/DESIGN-SYSTEM.md

export const colors = {
  // Primary — Iris Violet
  iris: '#7C5CFC',
  irisDark: '#6340E8',
  irisDeeper: '#5B3FD4',
  irisLight: '#A78BFA',
  irisSoft: '#F0ECFF',
  irisWash: '#E8E0FF',

  // Semantic
  mint: '#2DD4A8',
  mintSoft: '#ECFDF5',
  mintText: '#059669',
  coral: '#FB7185',
  coralSoft: '#FFF1F2',
  coralText: '#E11D48',
  amber: '#FBBF24',
  amberSoft: '#FFFBEB',
  amberText: '#D97706',
  sky: '#38BDF8',
  skySoft: '#E0F2FE',

  // Neutrals — Zinc (Warm)
  ink: '#18181B',
  inkMid: '#3F3F46',
  ink2: '#71717A',
  inkLight: '#A1A1AA',
  border: '#E4E4E7',
  borderSoft: '#F4F4F5',
  bg: '#FAFAF8',
  card: '#FFFFFF',

  // Mapped aliases (backward compat for transition)
  background: '#FAFAF8',
  surface: '#FFFFFF',
  elevated: '#FFFFFF',
  textPrimary: '#18181B',
  textSecondary: '#71717A',
  textMuted: '#A1A1AA',
  success: '#2DD4A8',
  error: '#FB7185',
  warning: '#FBBF24',

} as const

export const spacing = {
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
} as const

export const radii = {
  '2xs': 6,
  xs: 8,
  sm: 12,
  md: 14,
  card: 20,
  lg: 20,
  xl: 24,
  sheet: 24,
  pill: 100,
  circle: 9999,
} as const

export const fonts = {
  serif: 'DMSerifDisplay_400Regular',
  sans: 'SpaceGrotesk_400Regular',
  sansMedium: 'SpaceGrotesk_500Medium',
  sansSemiBold: 'SpaceGrotesk_600SemiBold',
  sansBold: 'SpaceGrotesk_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const

export const typography = {
  // Display — DM Serif Display
  displayXL: { fontFamily: fonts.serif, fontSize: 32, letterSpacing: -1, lineHeight: 37 },
  displayL: { fontFamily: fonts.serif, fontSize: 28, letterSpacing: -0.5, lineHeight: 34 },
  displayM: { fontFamily: fonts.serif, fontSize: 22, letterSpacing: -0.5, lineHeight: 28 },

  // Headings — Space Grotesk
  headingL: { fontFamily: fonts.sansBold, fontSize: 18, letterSpacing: -0.3, lineHeight: 23 },
  headingM: { fontFamily: fonts.sansSemiBold, fontSize: 16, letterSpacing: -0.2, lineHeight: 22 },

  // Body — Space Grotesk
  body: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23 },
  bodySmall: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21 },
  caption: { fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 18 },
  captionSmall: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17 },

  // Mono — JetBrains Mono
  mono: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 17 },
  monoSmall: { fontFamily: fonts.monoMedium, fontSize: 12, lineHeight: 16 },

  // Special
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.5, lineHeight: 13 },
  badge: { fontFamily: fonts.sansSemiBold, fontSize: 12, lineHeight: 12 },

  // Legacy aliases
  wordTitle: { fontSize: 42, fontWeight: '700' as const, letterSpacing: -1 },
  heading1: { fontSize: 28, fontWeight: '700' as const },
  heading2: { fontSize: 22, fontWeight: '600' as const },
  heading3: { fontSize: 18, fontWeight: '600' as const },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const },
  small: { fontSize: 14, fontWeight: '400' as const },
  smallMedium: { fontSize: 14, fontWeight: '500' as const },
} as const

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 60,
    elevation: 12,
  },
  iris: {
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 8,
  },
  button: {
    shadowColor: '#18181B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 12,
  },
  tabBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
  },
} as const

export const springConfigs = {
  snappy: { damping: 15, stiffness: 150 },
  bouncy: { damping: 12, stiffness: 180, mass: 0.8 },
  gentle: { damping: 20, stiffness: 100 },
  quick: { damping: 20, stiffness: 200 },
} as const
