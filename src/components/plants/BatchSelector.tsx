import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight } from '../../constants/theme';
import type { Batch } from '../../types';

interface BatchSelectorProps {
  label: string;
  batches: Batch[];
  selectedBatchId: string;
  onBatchChange: (batchId: string) => void;
}

export function BatchSelector({
  label,
  batches,
  selectedBatchId,
  onBatchChange,
}: BatchSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.batchList}>
        {batches.map((b) => (
          <TouchableOpacity
            key={b.id}
            style={[
              styles.batchBtn,
              selectedBatchId === b.id && styles.batchBtnActive,
            ]}
            onPress={() => onBatchChange(b.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedBatchId === b.id }}
            accessibilityLabel={`Batch ${b.name}`}
          >
            <Text
              style={[
                styles.batchBtnText,
                selectedBatchId === b.id && styles.batchBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {b.name}
            </Text>
            <Text style={styles.batchBtnSub}>{b.id}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  batchList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  batchBtn: {
    flex: 1,
    minWidth: 120,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 10,
    alignItems: 'center',
  },
  batchBtnActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  batchBtnText: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  batchBtnTextActive: {
    color: colors.accent,
  },
  batchBtnSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
});
