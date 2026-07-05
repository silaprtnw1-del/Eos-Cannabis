/**
 * Design system constants for PHANNAPHA GACP Farm Manager
 * Premium Modern Farm: Dark Mode + Glassmorphism + Neon Accents
 *
 * All design tokens are centralized here. Screens import from this
 * single source of truth instead of duplicating magic values.
 */
import { StyleSheet, TextStyle } from 'react-native';

// ─── Color Palette ──────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  bg: '#0a0a0c',
  card: 'rgba(20, 20, 24, 0.6)',
  cardSolid: 'rgba(20, 20, 24, 0.8)',
  inputBg: 'rgba(255, 255, 255, 0.02)',

  // Borders
  border: 'rgba(255, 255, 255, 0.05)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.03)',

  // Accent colors
  accent: '#00ff88',         // Primary green glow
  accentDim: 'rgba(0, 255, 136, 0.1)',
  accentBorder: 'rgba(0, 255, 136, 0.2)',
  info: '#00d2ff',           // Water/electrical blue
  infoDim: 'rgba(0, 210, 255, 0.1)',
  infoBorder: 'rgba(0, 210, 255, 0.2)',
  warning: '#ffaa00',        // Warning orange
  warningDim: 'rgba(255, 170, 0, 0.05)',
  danger: '#ff3366',         // Danger/alert red
  dangerDim: 'rgba(255, 51, 102, 0.05)',
  dangerBorder: 'rgba(255, 51, 102, 0.1)',

  // Text
  text: '#ffffff',
  textMuted: '#8a8a93',
  textOnAccent: '#0a0a0c',
} as const;

// ─── Spacing Scale ──────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

// ─── Border Radius Scale ────────────────────────────────────────────────────

export const radius = {
  sm: 4,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 50,
} as const;

// ─── Typography Scale ───────────────────────────────────────────────────────

export const fontSize = {
  xs: 9,
  sm: 10,
  body: 12,
  md: 13,
  lg: 14,
  xl: 16,
  xxl: 24,
  display: 50,
} as const;

export const fontWeight: {
  readonly normal: TextStyle['fontWeight'];
  readonly semibold: TextStyle['fontWeight'];
  readonly bold: TextStyle['fontWeight'];
  readonly extrabold: TextStyle['fontWeight'];
  readonly black: TextStyle['fontWeight'];
} = {
  normal: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

// ─── Common Styles ──────────────────────────────────────────────────────────
// Shared styles that were previously copy-pasted across all 6 screen files.

export const commonStyles = StyleSheet.create({
  /** Glassmorphism card container */
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },

  /** Section title inside a card */
  cardTitle: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.lg,
  },

  /** Label above form inputs */
  inputLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },

  /** Wrapping container for a text input */
  inputContainer: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },

  /** Full-width text input styling */
  textInputFull: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.normal,
  },

  /** Primary submit button */
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center' as const,
    marginTop: spacing.sm,
  },

  /** Submit button label */
  submitBtnText: {
    color: colors.textOnAccent,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
    letterSpacing: 0.5,
  },

  /** Sub-tab bar row */
  tabRow: {
    flexDirection: 'row' as const,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: spacing.lg,
  },

  /** Individual tab button */
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderRadius: radius.md,
  },

  /** Active tab button */
  tabBtnActive: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },

  /** Tab button label */
  tabBtnText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  /** Active tab button label */
  tabBtnTextActive: {
    color: colors.accent,
  },
});
