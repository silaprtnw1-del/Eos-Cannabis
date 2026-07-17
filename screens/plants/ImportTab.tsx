import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { colors, spacing, radius, fontWeight, commonStyles } from '../../src/constants/theme';
import { useTranslation } from '../../src/constants/i18n';
import { GlassCard } from '../../src/components/ui';
import { RoomSelector, BatchSelector } from '../../src/components/plants';
import { useRooms, useBatches, useRegisterClones, useCreateActionLog } from '../../src/hooks';

interface ImportTabProps {
  isTh: boolean;
  operatorId: string;
}

export default function ImportTab({ isTh, operatorId }: ImportTabProps) {
  const { t } = useTranslation(isTh);
  const roomsQuery = useRooms();
  const batchesQuery = useBatches();
  const registerClones = useRegisterClones();
  const createActionLog = useCreateActionLog();
  const rooms = roomsQuery.data ?? [];
  const batches = batchesQuery.data ?? [];

  const [selectedImportBatchId, setSelectedImportBatchId] = useState<string>('');
  const [importQty, setImportQty] = useState<string>('24');
  const [importRoom, setImportRoom] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);

  useEffect(() => {
    if (rooms.length > 0 && !importRoom) setImportRoom(rooms[0].name);
  }, [rooms, importRoom]);

  useEffect(() => {
    if (batches.length > 0 && !selectedImportBatchId) {
      setSelectedImportBatchId(batches[0].id);
    }
  }, [batches, selectedImportBatchId]);

  const handleImportPlants = async () => {
    if (!selectedImportBatchId || !importQty.trim()) {
      Alert.alert(t('login_fill_fields'));
      return;
    }

    setImporting(true);
    try {
      const qty = parseInt(importQty, 10);
      const selectedBatch = batches.find(b => b.id === selectedImportBatchId);
      if (!selectedBatch) throw new Error('Invalid Batch Selection');

      const acronym = selectedBatch.strainname.substring(0, 3).toUpperCase();

      await registerClones.mutateAsync({
        strainname: selectedBatch.strainname,
        strainAcronym: acronym,
        roomname: importRoom,
        batchid: selectedImportBatchId,
        stage: 'VEG',
        count: qty,
      });

      // No DB trigger covers IMPORT_PLANTS
      await createActionLog.mutateAsync({
        actiontype: 'IMPORT_PLANTS',
        operatorid: operatorId,
        targettype: 'BATCH',
        targetid: selectedImportBatchId,
        details: { count: qty, batch: selectedImportBatchId, room: importRoom },
      });

      Alert.alert(t('confirm'), t('plant_import_success'));
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <GlassCard title={t('plant_import_plants')}>
        <BatchSelector
          label={t('plant_import_from')}
          batches={batches}
          selectedBatchId={selectedImportBatchId}
          onBatchChange={setSelectedImportBatchId}
        />

        <View style={commonStyles.inputContainer}>
          <Text style={commonStyles.inputLabel}>{t('plant_import_qty')}</Text>
          <TextInput
            style={commonStyles.textInputFull}
            keyboardType="numeric"
            value={importQty}
            onChangeText={setImportQty}
            placeholder="24"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t('plant_import_qty')}
          />
        </View>

        <RoomSelector
          label={t('plant_initial_room')}
          rooms={rooms}
          selectedRoom={importRoom}
          onRoomChange={setImportRoom}
          emptyLabel={isTh ? '⚠️ ไม่มีห้องในระบบ' : '⚠️ No rooms found'}
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleImportPlants}
          disabled={importing}
          accessibilityRole="button"
          accessibilityLabel={t('plant_submit_import')}
        >
          <Text style={styles.submitBtnText}>
            {importing ? t('loading') : t('plant_submit_import')}
          </Text>
        </TouchableOpacity>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 40,
  },
  submitBtn: {
    backgroundColor: colors.accentDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitBtnText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: fontWeight.bold,
  },
});
