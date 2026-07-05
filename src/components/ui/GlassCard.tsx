/**
 * GlassCard – Reusable glassmorphism container
 *
 * Replaces the identically-styled card `View` that was copy-pasted
 * in every screen file. Supports a `solid` variant for higher-opacity
 * backgrounds and an optional section title.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight } from '../../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  /** Optional section title rendered above children */
  title?: string;
  /** Additional styles merged onto the outer View */
  style?: ViewStyle;
  /** `default` = translucent, `solid` = higher opacity */
  variant?: 'default' | 'solid';
}

export function GlassCard({ children, title, style, variant = 'default' }: GlassCardProps) {
  return (
    <View
      style={[
        styles.card,
        variant === 'solid' && styles.cardSolid,
        style,
      ]}
    >
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  cardSolid: {
    backgroundColor: colors.cardSolid,
  },
  title: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.lg,
  },
});
