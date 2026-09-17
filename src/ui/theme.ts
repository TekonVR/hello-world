/**
 * One accent colour, dark by default, no mascots (section 12).
 *
 * The palette is deliberately small. Nothing in the app is red: a student who
 * misses a sprint should not be shown an alarm colour for it.
 */

export const colours = {
  bg: '#0C0F14',
  surface: '#141A22',
  surfaceHigh: '#1C242F',
  line: '#26313D',
  text: '#F2F6FA',
  textDim: '#93A1B2',
  textFaint: '#5D6B7C',
  accent: '#6EE7A8',
  accentInk: '#06281A',
  amber: '#F6C560',
  /** Used only for the subject map's untouched tiles. */
  grey: '#2B3541',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 40, fontWeight: '700' as const, letterSpacing: -1 },
  title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.4 },
  heading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  small: { fontSize: 13, fontWeight: '400' as const },
  tiny: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.6 },
} as const;
