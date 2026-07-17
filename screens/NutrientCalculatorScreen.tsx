import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '../src/constants/theme';
import { useTranslation } from '../src/constants/i18n';
import { DosingCalculator, RunoffPanel } from '../src/components/nutrients';
import { useBatches, useRooms, useCreateCultivationLog } from '../src/hooks';
import { calculateDosing, FACTORS } from '../src/domain/nutrientDosing';

interface NutrientCalculatorScreenProps {
  isTh: boolean;
  operatorId: string;
}

export default function NutrientCalculatorScreen({ isTh, operatorId }: NutrientCalculatorScreenProps) {
  const { t } = useTranslation(isTh);
  const batchesQuery = useBatches();
  const roomsQuery = useRooms();
  const createLog = useCreateCultivationLog();
  const batches = batchesQuery.data ?? [];
  const rooms = roomsQuery.data ?? [];
  const loadingBatches = batchesQuery.isLoading;
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
  const calculations = useMemo(
    () => calculateDosing(parsedWaterVolume, parsedTargetPpm, activeFerts, phOut, ecOut),
    [parsedWaterVolume, parsedTargetPpm, activeFerts, phOut, ecOut]
  );

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

        <DosingCalculator
          isTh={isTh}
          batches={batches}
          rooms={rooms}
          loadingBatches={loadingBatches}
          selectedBatchId={selectedBatchId}
          onSelectBatch={setSelectedBatchId}
          roomName={roomName}
          onRoomChange={setRoomName}
          waterVolumeInput={waterVolumeInput}
          parsedWaterVolume={parsedWaterVolume}
          onWaterVolumeChange={setWaterVolumeInput}
          targetPpmInput={targetPpmInput}
          parsedTargetPpm={parsedTargetPpm}
          onTargetPpmChange={setTargetPpmInput}
          phInInput={phInInput}
          parsedPhIn={parsedPhIn}
          onPhInChange={setPhInInput}
          activeFerts={activeFerts}
          onToggleFert={toggleFert}
          doses={calculations.doses}
          calMagWarning={calculations.calMagWarning}
        />

        <RunoffPanel
          isTh={isTh}
          runoffVolume={runoffVolume}
          onRunoffVolumeChange={setRunoffVolume}
          phOut={phOut}
          onPhOutChange={setPhOut}
          ecOut={ecOut}
          onEcOutChange={setEcOut}
          notes={notes}
          onNotesChange={setNotes}
          runoffAlert={calculations.runoffAlert}
          saveStatus={saveStatus}
          onSave={handleSaveLog}
        />
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
