/**
 * ErrorState – API / connection error display
 *
 * Replaces the dangerous pattern of silently falling back to mock data
 * when a fetch fails. Shows an explicit error message and optional
 * retry action so operators know something went wrong.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';

interface ErrorStateProps {
  /** Optional error description */
  message?: string;
  /** Callback for the retry button */
  onRetry?: () => void;
  /** Custom retry button label (default: "Retry") */
  retryLabel?: string;
}

export function ErrorState({ message, onRetry, retryLabel = 'Retry' }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Connection Error</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {onRetry && (
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
        >
          <Text style={styles.retryText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
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
    color: colors.danger,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  message: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  retryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryText: {
    color: colors.accent,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
