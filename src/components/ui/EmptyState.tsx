/**
 * EmptyState – Placeholder for empty lists and views
 *
 * Displays an emoji icon, a title, and an optional description when
 * a data query returns zero results.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, fontWeight } from '../../constants/theme';

interface EmptyStateProps {
  /** Emoji or single character icon (default: 📭) */
  icon?: string;
  /** Primary message */
  title: string;
  /** Secondary explanation */
  description?: string;
}

export function EmptyState({ icon = '📭', title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
});
