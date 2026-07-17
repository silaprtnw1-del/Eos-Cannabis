import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { colors, spacing, radius, fontWeight, fontSize, commonStyles } from '../../src/constants/theme';
import { useTranslation } from '../../src/constants/i18n';
import { GlassCard } from '../../src/components/ui';
import { RoomSelector } from '../../src/components/plants';
import { useRooms, useMotherPlants, useCreateMotherPlant, useAllPlants, useCreateActionLog } from '../../src/hooks';
import { canPerform } from '../../src/lib/permissions';
import { generateMotherId } from '../../src/domain/motherId';
import { computeMotherStats } from '../../src/domain/motherStats';
import type { UserRole } from '../../src/types';

interface MotherPlantsTabProps {
  isTh: boolean;
  operatorId: string;
  userRole: UserRole;
}

export default function MotherPlantsTab({ isTh, operatorId, userRole }: MotherPlantsTabProps) {
  const { t } = useTranslation(isTh);
  const roomsQuery = useRooms();
  const mothersQuery = useMotherPlants();
  const allPlantsQuery = useAllPlants();
  const createMother = useCreateMotherPlant();
  const createActionLog = useCreateActionLog();
  const rooms = roomsQuery.data ?? [];
  const mothers = mothersQuery.data ?? [];
  const allPlants = allPlantsQuery.data ?? [];

  const [room, setRoom] = useState<string>('');
  const [strainName, setStrainName] = useState<string>('');
  const [strainAcronym, setStrainAcronym] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (rooms.length > 0 && !room) setRoom(rooms[0].name);
  }, [rooms, room]);

  const stats = computeMotherStats(allPlants);
  const statsByMotherId = new Map(stats.map((s) => [s.motherid, s]));

  const handleRegisterMother = async () => {
    if (!canPerform(userRole, 'mother:create')) {
      Alert.alert(t('error'), t('permission_denied'));
      return;
    }
    if (!strainName.trim() || !strainAcronym.trim()) {
      Alert.alert(t('login_fill_fields'));
      return;
    }

    setSubmitting(true);
    try {
      const motherId = generateMotherId(strainAcronym.trim());

      await createMother.mutateAsync({
        id: motherId,
        strainname: strainName.trim(),
        roomname: room,
        notes: notes.trim() || null,
      });

      // No DB trigger covers REGISTER_MOTHER — matches REGISTER_CLONES pattern
      await createActionLog.mutateAsync({
        actiontype: 'REGISTER_MOTHER',
        operatorid: operatorId,
        targettype: 'MOTHER_PLANT',
        targetid: motherId,
        details: { strain: strainName, room, mother: motherId },
      });

      Alert.alert(t('confirm'), t('mother_registered'));
      setStrainName('');
      setStrainAcronym('');
      setNotes('');
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <GlassCard title={t('mother_register_title')}>
        <View style={commonStyles.inputContainer}>
          <Text style={commonStyles.inputLabel}>{t('mother_strain_name')}</Text>
          <TextInput
            style={commonStyles.textInputFull}
            value={strainName}
            onChangeText={setStrainName}
            placeholder={t('plant_strain_placeholder')}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t('mother_strain_name')}
          />
        </View>

        <View style={commonStyles.inputContainer}>
          <Text style={commonStyles.inputLabel}>{t('mother_strain_acronym')}</Text>
          <TextInput
            style={commonStyles.textInputFull}
            value={strainAcronym}
            onChangeText={setStrainAcronym}
            placeholder={t('plant_acronym_placeholder')}
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            maxLength={4}
            accessibilityLabel={t('mother_strain_acronym')}
          />
        </View>

        <RoomSelector
          label={t('plant_initial_room')}
          rooms={rooms}
          selectedRoom={room}
          onRoomChange={setRoom}
          emptyLabel={isTh ? '⚠️ ไม่มีห้องในระบบ' : '⚠️ No rooms found'}
        />

        <View style={commonStyles.inputContainer}>
          <Text style={commonStyles.inputLabel}>{t('mother_notes')}</Text>
          <TextInput
            style={commonStyles.textInputFull}
            value={notes}
            onChangeText={setNotes}
            placeholder={t('mother_notes_placeholder')}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t('mother_notes')}
          />
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleRegisterMother}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel={t('mother_submit_register')}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? t('loading') : t('mother_submit_register')}
          </Text>
        </TouchableOpacity>
      </GlassCard>

      <GlassCard title={t('tab_mother_plants')}>
        {mothers.length === 0 ? (
          <Text style={styles.emptyText}>{t('no_data')}</Text>
        ) : (
          mothers.map((m) => {
            const s = statsByMotherId.get(m.id);
            return (
              <View key={m.id} style={styles.motherRow}>
                <Text style={styles.motherName} numberOfLines={1}>{m.strainname}</Text>
                <Text style={styles.motherSub}>{m.id} · {m.roomname}</Text>
                <View style={styles.motherStatsRow}>
                  <Text style={styles.motherStatText}>
                    {t('mother_stats_total_clones')}: {s?.totalClones ?? 0}
                  </Text>
                  <Text style={styles.motherStatText}>
                    {t('mother_stats_failed')}: {s?.failedClones ?? 0}
                  </Text>
                  <Text style={styles.motherStatText}>
                    {t('mother_stats_success_rate')}: {s ? Math.round(s.successRate * 100) : 0}%
                  </Text>
                </View>
              </View>
            );
          })
        )}
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
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.body,
  },
  motherRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  motherName: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  motherSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  motherStatsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  motherStatText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
});
