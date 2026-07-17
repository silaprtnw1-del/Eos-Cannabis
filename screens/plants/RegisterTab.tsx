import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { colors, spacing, radius, fontWeight, commonStyles } from '../../src/constants/theme';
import { useTranslation } from '../../src/constants/i18n';
import { GlassCard } from '../../src/components/ui';
import { RoomSelector, BatchSelector } from '../../src/components/plants';
import {
  useRooms,
  useBatches,
  useRegisterClones,
  useCreateBatch,
  useCreateActionLog,
  useMotherPlants,
} from '../../src/hooks';
import { canPerform } from '../../src/lib/permissions';
import { generateBatchId } from '../../src/domain/batchId';
import type { UserRole, PlantSource } from '../../src/types';

interface RegisterTabProps {
  isTh: boolean;
  operatorId: string;
  userRole: UserRole;
}

type RegisterMode = 'NEW_BATCH' | 'EXISTING_BATCH';

export default function RegisterTab({ isTh, operatorId, userRole }: RegisterTabProps) {
  const { t } = useTranslation(isTh);
  const roomsQuery = useRooms();
  const batchesQuery = useBatches();
  const mothersQuery = useMotherPlants();
  const registerClones = useRegisterClones();
  const createBatch = useCreateBatch();
  const createActionLog = useCreateActionLog();
  const rooms = roomsQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const mothers = mothersQuery.data ?? [];

  const [mode, setMode] = useState<RegisterMode>('NEW_BATCH');
  const [room, setRoom] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // New batch fields
  const [strainName, setStrainName] = useState<string>('');
  const [strainAcronym, setStrainAcronym] = useState<string>('');
  const [cloneQty, setCloneQty] = useState<string>('50');
  const [source, setSource] = useState<PlantSource>('PURCHASED_CLONE');
  const [motherId, setMotherId] = useState<string>('');

  // Existing batch fields
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [importQty, setImportQty] = useState<string>('24');

  useEffect(() => {
    if (rooms.length > 0 && !room) setRoom(rooms[0].name);
  }, [rooms, room]);

  useEffect(() => {
    if (batches.length > 0 && !selectedBatchId) setSelectedBatchId(batches[0].id);
  }, [batches, selectedBatchId]);

  const matchingMothers = mothers.filter(
    (m) => m.strainname.trim().toLowerCase() === strainName.trim().toLowerCase()
  );

  const handleRegisterNewBatch = async () => {
    if (!canPerform(userRole, 'plant:register') || !canPerform(userRole, 'batch:create')) {
      Alert.alert(t('error'), t('permission_denied'));
      return;
    }
    if (!strainName.trim() || !strainAcronym.trim() || !cloneQty.trim()) {
      Alert.alert(t('login_fill_fields'));
      return;
    }

    setSubmitting(true);
    try {
      const qty = parseInt(cloneQty, 10);
      const batchId = generateBatchId(strainAcronym.trim());

      await createBatch.mutateAsync({
        id: batchId,
        name: strainName.trim(),
        strainname: strainName.trim(),
      });

      await registerClones.mutateAsync({
        strainname: strainName.trim(),
        strainAcronym: strainAcronym.trim(),
        roomname: room,
        batchid: batchId,
        stage: 'CLONE',
        count: qty,
        source,
        motherid: motherId || null,
      });

      // Log action for GACP audit trail — no DB trigger covers REGISTER_CLONES
      await createActionLog.mutateAsync({
        actiontype: 'REGISTER_CLONES',
        operatorid: operatorId,
        targettype: 'BATCH',
        targetid: batchId,
        details: { count: qty, strain: strainName, room, source, batch: batchId, mother: motherId || null },
      });

      Alert.alert(t('confirm'), t('plant_registered'));
      setStrainName('');
      setStrainAcronym('');
      setMotherId('');
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImportExisting = async () => {
    if (!canPerform(userRole, 'plant:register')) {
      Alert.alert(t('error'), t('permission_denied'));
      return;
    }
    if (!selectedBatchId || !importQty.trim()) {
      Alert.alert(t('login_fill_fields'));
      return;
    }

    setSubmitting(true);
    try {
      const qty = parseInt(importQty, 10);
      const selectedBatch = batches.find((b) => b.id === selectedBatchId);
      if (!selectedBatch) throw new Error('Invalid Batch Selection');

      const acronym = selectedBatch.strainname.substring(0, 3).toUpperCase();

      await registerClones.mutateAsync({
        strainname: selectedBatch.strainname,
        strainAcronym: acronym,
        roomname: room,
        batchid: selectedBatchId,
        stage: 'VEG',
        count: qty,
      });

      // No DB trigger covers IMPORT_PLANTS
      await createActionLog.mutateAsync({
        actiontype: 'IMPORT_PLANTS',
        operatorid: operatorId,
        targettype: 'BATCH',
        targetid: selectedBatchId,
        details: { count: qty, batch: selectedBatchId, room },
      });

      Alert.alert(t('confirm'), t('plant_import_success'));
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <GlassCard title={mode === 'NEW_BATCH' ? t('plant_register_clones') : t('plant_import_plants')}>
        <View style={commonStyles.inputContainer}>
          <View style={styles.sourceRow}>
            <TouchableOpacity
              style={[styles.sourceBtn, mode === 'NEW_BATCH' && styles.sourceBtnActive]}
              onPress={() => setMode('NEW_BATCH')}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'NEW_BATCH' }}
              accessibilityLabel={t('plant_mode_new_batch')}
            >
              <Text style={[styles.sourceBtnText, mode === 'NEW_BATCH' && styles.sourceBtnTextActive]}>
                {t('plant_mode_new_batch')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sourceBtn, mode === 'EXISTING_BATCH' && styles.sourceBtnActive]}
              onPress={() => setMode('EXISTING_BATCH')}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'EXISTING_BATCH' }}
              accessibilityLabel={t('plant_mode_existing_batch')}
            >
              <Text style={[styles.sourceBtnText, mode === 'EXISTING_BATCH' && styles.sourceBtnTextActive]}>
                {t('plant_mode_existing_batch')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {mode === 'NEW_BATCH' ? (
          <>
            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>{t('plant_strain_name')}</Text>
              <TextInput
                style={commonStyles.textInputFull}
                value={strainName}
                onChangeText={setStrainName}
                placeholder={t('plant_strain_placeholder')}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel={t('plant_strain_name')}
              />
            </View>

            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>{t('plant_strain_acronym')}</Text>
              <TextInput
                style={commonStyles.textInputFull}
                value={strainAcronym}
                onChangeText={setStrainAcronym}
                placeholder={t('plant_acronym_placeholder')}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                maxLength={4}
                accessibilityLabel={t('plant_strain_acronym')}
              />
            </View>

            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>{t('plant_clone_qty')}</Text>
              <TextInput
                style={commonStyles.textInputFull}
                keyboardType="numeric"
                value={cloneQty}
                onChangeText={setCloneQty}
                placeholder="50"
                placeholderTextColor={colors.textMuted}
                accessibilityLabel={t('plant_clone_qty')}
              />
            </View>

            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>{t('plant_source')}</Text>
              <View style={styles.sourceRow}>
                <TouchableOpacity
                  style={[styles.sourceBtn, source === 'PURCHASED_CLONE' && styles.sourceBtnActive]}
                  onPress={() => setSource('PURCHASED_CLONE')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: source === 'PURCHASED_CLONE' }}
                  accessibilityLabel={t('plant_source_purchased_clone')}
                >
                  <Text style={[styles.sourceBtnText, source === 'PURCHASED_CLONE' && styles.sourceBtnTextActive]}>
                    {t('plant_source_purchased_clone')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sourceBtn, source === 'SEED_GROWN' && styles.sourceBtnActive]}
                  onPress={() => setSource('SEED_GROWN')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: source === 'SEED_GROWN' }}
                  accessibilityLabel={t('plant_source_seed_grown')}
                >
                  <Text style={[styles.sourceBtnText, source === 'SEED_GROWN' && styles.sourceBtnTextActive]}>
                    {t('plant_source_seed_grown')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>{t('mother_select_optional')}</Text>
              <View style={[styles.sourceRow, styles.motherRowWrap]}>
                <TouchableOpacity
                  style={[styles.sourceBtn, motherId === '' && styles.sourceBtnActive]}
                  onPress={() => setMotherId('')}
                  accessibilityRole="button"
                  accessibilityState={{ selected: motherId === '' }}
                  accessibilityLabel={t('mother_no_mother')}
                >
                  <Text style={[styles.sourceBtnText, motherId === '' && styles.sourceBtnTextActive]}>
                    {t('mother_no_mother')}
                  </Text>
                </TouchableOpacity>
                {matchingMothers.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.sourceBtn, motherId === m.id && styles.sourceBtnActive]}
                    onPress={() => setMotherId(m.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: motherId === m.id }}
                    accessibilityLabel={`Mother ${m.id}`}
                  >
                    <Text style={[styles.sourceBtnText, motherId === m.id && styles.sourceBtnTextActive]} numberOfLines={1}>
                      {m.id}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            <BatchSelector
              label={t('plant_import_from')}
              batches={batches}
              selectedBatchId={selectedBatchId}
              onBatchChange={setSelectedBatchId}
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
          </>
        )}

        <RoomSelector
          label={t('plant_initial_room')}
          rooms={rooms}
          selectedRoom={room}
          onRoomChange={setRoom}
          emptyLabel={isTh ? '⚠️ ไม่มีห้องในระบบ' : '⚠️ No rooms found'}
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={mode === 'NEW_BATCH' ? handleRegisterNewBatch : handleImportExisting}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel={mode === 'NEW_BATCH' ? t('plant_submit_register') : t('plant_submit_import')}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? t('loading') : mode === 'NEW_BATCH' ? t('plant_submit_register') : t('plant_submit_import')}
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
  sourceRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  motherRowWrap: {
    flexWrap: 'wrap',
  },
  sourceBtn: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sourceBtnActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  sourceBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: fontWeight.bold,
  },
  sourceBtnTextActive: {
    color: colors.accent,
  },
});
