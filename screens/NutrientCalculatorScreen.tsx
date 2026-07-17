import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight, commonStyles } from '../src/constants/theme';
import { useTranslation } from '../src/constants/i18n';
import { GlassCard, StepperInput } from '../src/components/ui';
import { RoomDropdown } from '../src/components/plants';
import { useBatches, useRooms, useCreateCultivationLog } from '../src/hooks';


interface NutrientCalculatorScreenProps {
  isTh: boolean;
  operatorId: string;
}

const GAL_TO_L = 3.78541;
const FACTORS: Record<string, number> = { core: 19, grow: 32, bloom: 32, calmag: 57 };

export default function NutrientCalculatorScreen({ isTh, operatorId }: NutrientCalculatorScreenProps) {
  const { t } = useTranslation(isTh);
  const batchesQuery = useBatches();
  const roomsQuery = useRooms();
  const createLog = useCreateCultivationLog();
  const batches = batchesQuery.data ?? [];
  const rooms = roomsQuery.data ?? [];
  const loadingBatches = batchesQuery.isLoading;
  const loadingRooms = roomsQuery.isLoading;
  const loadError = batchesQuery.error
    ? batchesQuery.error.message
    : roomsQuery.error
    ? roomsQuery.error.message
    : '';

  // Form Inputs - Single state string values to avoid paired state drift
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [roomName, setRoomName] = useState<string>('');
  const [waterVolumeInput, setWaterVolumeInput] = useState<string>('200');
  const [targetPpmInput, setTargetPpmInput] = useState<string>('1500');
  const [phInInput, setPhInInput] = useState<string>('5.9');

  // Active Fert Toggles
  const [activeFerts, setActiveFerts] = useState<Record<string, boolean>>({
    core: true,
    grow: false,
    bloom: true,
    calmag: false,
  });

  // Runoff Inputs
  const [runoffVolume, setRunoffVolume] = useState<string>('');
  const [phOut, setPhOut] = useState<string>('');
  const [ecOut, setEcOut] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string>('');
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-select first batch/room once loaded
  useEffect(() => {
    if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  useEffect(() => {
    if (rooms.length > 0 && !roomName) {
      setRoomName(rooms[0].name);
    }
  }, [rooms, roomName]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Parse numeric values from input strings safely
  const parsedWaterVolume = useMemo(() => parseFloat(waterVolumeInput) || 0, [waterVolumeInput]);
  const parsedTargetPpm = useMemo(() => parseInt(targetPpmInput, 10) || 0, [targetPpmInput]);
  const parsedPhIn = useMemo(() => parseFloat(phInInput) || 0, [phInInput]);

  // Derived dosing calculations - useMemo prevents calculations running unnecessarily
  const calculations = useMemo(() => {
    const gallons = parsedWaterVolume / GAL_TO_L;
    const doses: Record<string, { ml: number; mlPerGal: number }> = {};
    let calMagWarning = false;

    Object.entries(FACTORS).forEach(([fert, factor]) => {
      if (activeFerts[fert]) {
        const mlPerGal = (factor * parsedTargetPpm) / 1500;
        const totalMl = mlPerGal * gallons;
        doses[fert] = {
          ml: parseFloat(totalMl.toFixed(2)) || 0,
          mlPerGal: parseFloat(mlPerGal.toFixed(2)) || 0,
        };

        if (fert === 'calmag' && mlPerGal > 5.0) {
          calMagWarning = true;
        }
      } else {
        doses[fert] = { ml: 0, mlPerGal: 0 };
      }
    });

    const currentEcIn = parsedTargetPpm / 500; // Hanna scale conversion

    // Runoff alerts validation
    const parsedPhOutVal = parseFloat(phOut);
    const parsedEcOutVal = parseFloat(ecOut);
    let runoffAlert = false;

    if (!isNaN(parsedPhOutVal) && (parsedPhOutVal < 5.5 || parsedPhOutVal > 6.5)) {
      runoffAlert = true;
    }
    if (!isNaN(parsedEcOutVal) && (parsedEcOutVal - currentEcIn > 1.0)) {
      runoffAlert = true;
    }

    return {
      gallons,
      doses,
      currentEcIn,
      calMagWarning,
      runoffAlert,
    };
  }, [parsedWaterVolume, parsedTargetPpm, activeFerts, phOut, ecOut]);

  const handleSaveLog = async () => {
    setSaveStatus('Saving...');
    try {
      const nutrientsFeed = {
        activeNutrients: {
          core: {
            ml: calculations.doses.core.ml,
            mlPerGal: calculations.doses.core.mlPerGal,
            factor: FACTORS.core,
            ppm: activeFerts.core ? parsedTargetPpm : 0,
          },
          grow: {
            ml: calculations.doses.grow.ml,
            mlPerGal: calculations.doses.grow.mlPerGal,
            factor: FACTORS.grow,
            ppm: activeFerts.grow ? parsedTargetPpm : 0,
          },
          bloom: {
            ml: calculations.doses.bloom.ml,
            mlPerGal: calculations.doses.bloom.mlPerGal,
            factor: FACTORS.bloom,
            ppm: activeFerts.bloom ? parsedTargetPpm : 0,
          },
          calmag: {
            ml: calculations.doses.calmag.ml,
            mlPerGal: calculations.doses.calmag.mlPerGal,
            factor: FACTORS.calmag,
            ppm: activeFerts.calmag ? parsedTargetPpm : 0,
            warning: calculations.calMagWarning ? 'CalMag bypass warning: High ml/gal rate' : null,
          },
        },
      };

      const { queued } = await createLog.mutateAsync({
        batchid: selectedBatchId,
        roomname: roomName,
        watervolume: parsedWaterVolume,
        waterunit: 'liters',
        phin: parsedPhIn,
        ecin: calculations.currentEcIn,
        runoffvolume: runoffVolume ? parseFloat(runoffVolume) : null,
        phout: phOut ? parseFloat(phOut) : null,
        ecout: ecOut ? parseFloat(ecOut) : null,
        nutrientsfeed: nutrientsFeed,
        operatorid: operatorId,
        notes: notes || null,
      });

      setSaveStatus(
        queued ? (isTh ? '📥 บันทึกในเครื่อง — จะซิงค์เมื่อออนไลน์' : '📥 Saved locally — will sync when online') : t('saved_success')
      );

      // Clear input fields
      setRunoffVolume('');
      setPhOut('');
      setEcOut('');
      setNotes('');
    } catch (e: any) {
      setSaveStatus(`${t('saved_failed')}: ${e.message}`);
      console.warn('Nutrients log error:', e.message);
    } finally {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    }
  };

  const toggleFert = useCallback((fert: string) => {
    setActiveFerts((prev) => ({ ...prev, [fert]: !prev[fert] }));
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {loadError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{loadError}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                batchesQuery.refetch();
                roomsQuery.refetch();
              }}
              accessibilityRole="button"
              accessibilityLabel={t('retry')}
            >
              <Text style={styles.retryBtnText}>{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

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
                    onPress={() => setSelectedBatchId(b.id)}
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
            onRoomChange={setRoomName}
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
            onValueChange={(val) => {
              setWaterVolumeInput(val.toString());
            }}
            showTextInput
            textInputValue={waterVolumeInput}
            onTextInputChange={setWaterVolumeInput}
          />

          {/* Target PPM */}
          <StepperInput
            label={t('nutri_target_ppm')}
            value={parsedTargetPpm}
            step={100}
            stepLabel="100"
            min={0}
            onValueChange={(val) => {
              setTargetPpmInput(val.toString());
            }}
            showTextInput
            textInputValue={targetPpmInput}
            onTextInputChange={setTargetPpmInput}
          />

          {/* pH In */}
          <StepperInput
            label={t('nutri_ph_in_label')}
            value={parsedPhIn}
            step={0.1}
            stepLabel="0.1"
            min={0}
            max={14}
            onValueChange={(val) => {
              setPhInInput(val.toFixed(1));
            }}
            showTextInput
            textInputValue={phInInput}
            onTextInputChange={setPhInInput}
          />

          {/* Active Fertilizers Checkboxes */}
          <Text style={styles.subCardTitle}>{t('nutri_active_ferts')}</Text>
          <View style={styles.fertilizerToggleRow}>
            {Object.keys(FACTORS).map((fert) => (
              <TouchableOpacity
                key={fert}
                style={[styles.fertCheckboxBtn, activeFerts[fert] && styles.fertCheckboxBtnActive]}
                onPress={() => toggleFert(fert)}
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

          {Object.entries(calculations.doses).map(([fert, values]) => {
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
          {calculations.calMagWarning && (
            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>{t('nutri_calmag_warn_title')}</Text>
              <Text style={styles.warningDesc}>{t('nutri_calmag_warn_desc')}</Text>
            </View>
          )}
        </View>

        {/* Runoff Input Panel */}
        <GlassCard title={t('nutri_runoff_panel')}>
          <View style={commonStyles.inputContainer}>
            <Text style={commonStyles.inputLabel}>{t('nutri_runoff_vol')}</Text>
            <TextInput
              style={commonStyles.textInputFull}
              keyboardType="decimal-pad"
              value={runoffVolume}
              onChangeText={setRunoffVolume}
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
              onChangeText={setPhOut}
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
              onChangeText={setEcOut}
              placeholder="e.g. 3.2"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={t('nutri_ec_out_label')}
            />
          </View>

          {/* Runoff pH Alert Limit box */}
          {calculations.runoffAlert && (
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
              onChangeText={setNotes}
              placeholder="Notes..."
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={t('nutri_notes')}
            />
          </View>

          {/* Save log button */}
          <TouchableOpacity
            style={styles.logBtn}
            onPress={handleSaveLog}
            accessibilityRole="button"
            accessibilityLabel={t('nutri_save_btn')}
          >
            <Text style={styles.logBtnText}>
              {saveStatus ? saveStatus : t('nutri_save_btn')}
            </Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    paddingBottom: 40,
  },
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
  errorBanner: {
    backgroundColor: colors.dangerDim,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  retryBtnText: {
    color: colors.textOnAccent,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
});
