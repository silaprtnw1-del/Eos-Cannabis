import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight, commonStyles } from '../../constants/theme';
import { useTranslation } from '../../constants/i18n';
import { GlassCard } from '../ui';

interface RunoffPanelProps {
  isTh: boolean;
  runoffVolume: string;
  onRunoffVolumeChange: (val: string) => void;
  phOut: string;
  onPhOutChange: (val: string) => void;
  ecOut: string;
  onEcOutChange: (val: string) => void;
  notes: string;
  onNotesChange: (val: string) => void;
  runoffAlert: boolean;
  saveStatus: string;
  onSave: () => void;
}

export function RunoffPanel({
  isTh,
  runoffVolume,
  onRunoffVolumeChange,
  phOut,
  onPhOutChange,
  ecOut,
  onEcOutChange,
  notes,
  onNotesChange,
  runoffAlert,
  saveStatus,
  onSave,
}: RunoffPanelProps) {
  const { t } = useTranslation(isTh);

  return (
    <GlassCard title={t('nutri_runoff_panel')}>
      <View style={commonStyles.inputContainer}>
        <Text style={commonStyles.inputLabel}>{t('nutri_runoff_vol')}</Text>
        <TextInput
          style={commonStyles.textInputFull}
          keyboardType="decimal-pad"
          value={runoffVolume}
          onChangeText={onRunoffVolumeChange}
          placeholder="e.g. 35.0"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('nutri_runoff_vol')}
        />
      </View>

      <View style={commonStyles.inputContainer}>
        <Text style={commonStyles.inputLabel}>{t('nutri_ph_out_label')}</Text>
        <TextInput
          style={commonStyles.textInputFull}
          keyboardType="decimal-pad"
          value={phOut}
          onChangeText={onPhOutChange}
          placeholder="e.g. 6.1"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('nutri_ph_out_label')}
        />
      </View>

      <View style={commonStyles.inputContainer}>
        <Text style={commonStyles.inputLabel}>{t('nutri_ec_out_label')}</Text>
        <TextInput
          style={commonStyles.textInputFull}
          keyboardType="decimal-pad"
          value={ecOut}
          onChangeText={onEcOutChange}
          placeholder="e.g. 3.2"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('nutri_ec_out_label')}
        />
      </View>

      {/* Runoff pH Alert Limit box */}
      {runoffAlert && (
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>{t('nutri_runoff_alert_title')}</Text>
          <Text style={styles.alertDesc}>{t('nutri_runoff_alert_desc')}</Text>
        </View>
      )}

      <View style={commonStyles.inputContainer}>
        <Text style={commonStyles.inputLabel}>{t('nutri_notes')}</Text>
        <TextInput
          style={[commonStyles.textInputFull, { height: 80, textAlignVertical: 'top' }]}
          multiline
          numberOfLines={3}
          value={notes}
          onChangeText={onNotesChange}
          placeholder="Notes..."
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('nutri_notes')}
        />
      </View>

      {/* Save log button */}
      <TouchableOpacity
        style={styles.logBtn}
        onPress={onSave}
        accessibilityRole="button"
        accessibilityLabel={t('nutri_save_btn')}
      >
        <Text style={styles.logBtnText}>
          {saveStatus ? saveStatus : t('nutri_save_btn')}
        </Text>
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  alertBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.dangerDim,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alertTitle: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
    marginBottom: 4,
  },
  alertDesc: {
    color: colors.text,
    fontSize: fontSize.body,
    lineHeight: 18,
  },
  logBtn: {
    backgroundColor: colors.accentDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  logBtnText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: fontWeight.bold,
  },
});
