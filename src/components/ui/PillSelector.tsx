/**
 * PillSelector – Reusable toggle-button group
 *
 * Replaces the near-identical inline "row of toggle buttons" pattern
 * duplicated across RegisterTab (mode/source/mother pickers) and RoomsTab
 * (room type grid).
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight, commonStyles } from '../../constants/theme';

export interface PillOption {
  value: string;
  label: string;
}

interface PillSelectorProps {
  label?: string;
  options: PillOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  /** Allow buttons to wrap to multiple lines instead of sharing one row (default: false) */
  wrap?: boolean;
}

export function PillSelector({ label, options, selectedValue, onChange, wrap = false }: PillSelectorProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={commonStyles.inputLabel}>{label}</Text>}
      <View style={[styles.row, wrap && styles.rowWrap]}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.pill, selectedValue === opt.value && styles.pillActive]}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedValue === opt.value }}
            accessibilityLabel={opt.label}
          >
            <Text
              style={[styles.pillText, selectedValue === opt.value && styles.pillTextActive]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowWrap: {
    flexWrap: 'wrap',
  },
  pill: {
    flex: 1,
    minWidth: 90,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  pillText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  pillTextActive: {
    color: colors.accent,
  },
});
