import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight } from '../../constants/theme';
import type { PlantStage } from '../../types';

interface StageSelectorProps {
  label?: string;
  selectedStage: PlantStage;
  onStageChange: (stage: PlantStage) => void;
  stages?: readonly PlantStage[];
}

const DEFAULT_STAGES: readonly PlantStage[] = ['CLONE', 'VEG', 'FLOWER', 'HARVESTED', 'ARCHIVED'];

export function StageSelector({
  label,
  selectedStage,
  onStageChange,
  stages = DEFAULT_STAGES,
}: StageSelectorProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={styles.stageButtonRow}>
        {stages.map((stg) => (
          <TouchableOpacity
            key={stg}
            style={[styles.stageBtn, selectedStage === stg && styles.stageBtnActive]}
            onPress={() => onStageChange(stg)}
            accessibilityRole="button"
            accessibilityState={{ selected: selectedStage === stg }}
            accessibilityLabel={`Stage ${stg}`}
          >
            <Text style={[styles.stageBtnText, selectedStage === stg && styles.stageBtnTextActive]}>
              {stg}
            </Text>
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
  stageButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  stageBtn: {
    flex: 1,
    minWidth: 70,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  stageBtnActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  stageBtnText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  stageBtnTextActive: {
    color: colors.accent,
  },
});
