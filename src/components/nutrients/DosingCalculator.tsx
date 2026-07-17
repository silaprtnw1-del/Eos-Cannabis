import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight, commonStyles } from '../../constants/theme';
import { useTranslation } from '../../constants/i18n';
import { GlassCard, StepperInput } from '../ui';
import { RoomDropdown } from '../plants';
import type { Batch, Room } from '../../types';

const FACTORS: Record<string, number> = { core: 19, grow: 32, bloom: 32, calmag: 57 };

interface DosingCalculatorProps {
  isTh: boolean;
  batches: Batch[];
  rooms: Room[];
  loadingBatches: boolean;
  selectedBatchId: string;
  onSelectBatch: (id: string) => void;
  roomName: string;
  onRoomChange: (name: string) => void;
  waterVolumeInput: string;
  parsedWaterVolume: number;
  onWaterVolumeChange: (val: string) => void;
  targetPpmInput: string;
  parsedTargetPpm: number;
  onTargetPpmChange: (val: string) => void;
  phInInput: string;
  parsedPhIn: number;
  onPhInChange: (val: string) => void;
  activeFerts: Record<string, boolean>;
  onToggleFert: (fert: string) => void;
  doses: Record<string, { ml: number; mlPerGal: number }>;
  calMagWarning: boolean;
}

export function DosingCalculator({
  isTh,
  batches,
  rooms,
  loadingBatches,
  selectedBatchId,
  onSelectBatch,
  roomName,
  onRoomChange,
  waterVolumeInput,
  parsedWaterVolume,
  onWaterVolumeChange,
  targetPpmInput,
  parsedTargetPpm,
  onTargetPpmChange,
  phInInput,
  parsedPhIn,
  onPhInChange,
  activeFerts,
  onToggleFert,
  doses,
  calMagWarning,
}: DosingCalculatorProps) {
  const { t } = useTranslation(isTh);

  return (
    <>
      {/* Batch and Room Input */}
      <GlassCard title={t('nutri_batches_rooms')}>
        {loadingBatches ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 10 }} />
        ) : (
          <View style={styles.batchSelectorContainer}>
            <Text style={styles.inputLabel}>{t('nutri_active_batch')}</Text>
            <View style={styles.batchList}>
              {batches.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.batchBtn, selectedBatchId === b.id && styles.batchBtnActive]}
                  onPress={() => onSelectBatch(b.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Batch ${b.name}`}
                >
                  <Text style={[styles.batchBtnText, selectedBatchId === b.id && styles.batchBtnTextActive]}>
                    {b.name}
                  </Text>
                  <Text style={styles.batchBtnSub}>{b.id}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <RoomDropdown
          label={t('nutri_grow_room')}
          rooms={rooms}
          selectedRoom={roomName}
          onRoomChange={onRoomChange}
          isTh={isTh}
        />
      </GlassCard>

      {/* Smart Dosing Setup using StepperInputs inside GlassCard */}
      <GlassCard title={t('nutri_irrigation_target')}>
        {/* Water Volume (Liters) */}
        <StepperInput
          label={t('nutri_water_volume_label')}
          value={parsedWaterVolume}
          step={50}
          stepLabel="50L"
          min={0}
          onValueChange={(val) => onWaterVolumeChange(val.toString())}
          showTextInput
          textInputValue={waterVolumeInput}
          onTextInputChange={onWaterVolumeChange}
        />

        {/* Target PPM */}
        <StepperInput
          label={t('nutri_target_ppm')}
          value={parsedTargetPpm}
          step={100}
          stepLabel="100"
          min={0}
          onValueChange={(val) => onTargetPpmChange(val.toString())}
          showTextInput
          textInputValue={targetPpmInput}
          onTextInputChange={onTargetPpmChange}
        />

        {/* pH In */}
        <StepperInput
          label={t('nutri_ph_in_label')}
          value={parsedPhIn}
          step={0.1}
          stepLabel="0.1"
          min={0}
          max={14}
          onValueChange={(val) => onPhInChange(val.toFixed(1))}
          showTextInput
          textInputValue={phInInput}
          onTextInputChange={onPhInChange}
        />

        {/* Active Fertilizers Checkboxes */}
        <Text style={styles.subCardTitle}>{t('nutri_active_ferts')}</Text>
        <View style={styles.fertilizerToggleRow}>
          {Object.keys(FACTORS).map((fert) => (
            <TouchableOpacity
              key={fert}
              style={[styles.fertCheckboxBtn, activeFerts[fert] && styles.fertCheckboxBtnActive]}
              onPress={() => onToggleFert(fert)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: activeFerts[fert] }}
              accessibilityLabel={fert.toUpperCase()}
            >
              <Text style={[styles.fertCheckboxText, activeFerts[fert] && styles.fertCheckboxTextActive]}>
                {fert.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>

      {/* Dosing Results Cards */}
      <View style={styles.resultCard}>
        <Text style={commonStyles.cardTitle}>{t('nutri_dosing_result')}</Text>

        {Object.entries(doses).map(([fert, values]) => {
          if (activeFerts[fert]) {
            return (
              <View key={fert} style={styles.resultRow}>
                <Text style={styles.resultName}>{fert.toUpperCase()} (Factor {FACTORS[fert]})</Text>
                <Text style={styles.resultAmount}>
                  {values.ml.toFixed(1)} <Text style={styles.resultUnitText}>mL</Text>
                  <Text style={styles.mlPerGalText}> ({values.mlPerGal.toFixed(1)} ml/gal)</Text>
                </Text>
              </View>
            );
          }
          return null;
        })}

        {/* CalMag Safety Warning Box */}
        {calMagWarning && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>{t('nutri_calmag_warn_title')}</Text>
            <Text style={styles.warningDesc}>{t('nutri_calmag_warn_desc')}</Text>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  subCardTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  batchSelectorContainer: {
    marginBottom: spacing.lg,
  },
  batchList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
  inputLabel: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    marginBottom: 6,
  },
  fertilizerToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fertCheckboxBtn: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  fertCheckboxBtnActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  fertCheckboxText: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  fertCheckboxTextActive: {
    color: colors.accent,
  },
  resultCard: {
    backgroundColor: colors.cardSolid,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  resultName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  resultAmount: {
    color: colors.accent,
    fontFamily: 'monospace',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  resultUnitText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  mlPerGalText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: 'normal',
  },
  warningBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.warningDim,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  warningTitle: {
    color: colors.warning,
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    marginBottom: 4,
  },
  warningDesc: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 18,
  },
});
