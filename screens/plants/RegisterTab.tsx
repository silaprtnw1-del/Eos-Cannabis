import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { colors, spacing, radius, fontWeight, commonStyles } from '../../src/constants/theme';
import { useTranslation } from '../../src/constants/i18n';
import { GlassCard } from '../../src/components/ui';
import { RoomSelector } from '../../src/components/plants';
import { useRooms, useRegisterClones, useCreateActionLog } from '../../src/hooks';

interface RegisterTabProps {
  isTh: boolean;
  operatorId: string;
}

export default function RegisterTab({ isTh, operatorId }: RegisterTabProps) {
  const { t } = useTranslation(isTh);
  const roomsQuery = useRooms();
  const registerClones = useRegisterClones();
  const createActionLog = useCreateActionLog();
  const rooms = roomsQuery.data ?? [];

  const [strainName, setStrainName] = useState<string>('');
  const [strainAcronym, setStrainAcronym] = useState<string>('');
  const [cloneQty, setCloneQty] = useState<string>('50');
  const [initialRoom, setInitialRoom] = useState<string>('');
  const [registering, setRegistering] = useState<boolean>(false);

  useEffect(() => {
    if (rooms.length > 0 && !initialRoom) setInitialRoom(rooms[0].name);
  }, [rooms, initialRoom]);

  const handleRegisterClones = async () => {
    if (!strainName.trim() || !strainAcronym.trim() || !cloneQty.trim()) {
      Alert.alert(t('login_fill_fields'));
      return;
    }

    setRegistering(true);
    try {
      const qty = parseInt(cloneQty, 10);

      await registerClones.mutateAsync({
        strainname: strainName.trim(),
        strainAcronym: strainAcronym.trim(),
        roomname: initialRoom,
        batchid: null,
        stage: 'CLONE',
        count: qty,
      });

      // Log action for GACP audit trail — no DB trigger covers REGISTER_CLONES
      await createActionLog.mutateAsync({
        actiontype: 'REGISTER_CLONES',
        operatorid: operatorId,
        targettype: 'BATCH',
        targetid: 'NEW_CLONES',
        details: { count: qty, strain: strainName, room: initialRoom },
      });

      Alert.alert(t('confirm'), t('plant_registered'));
      setStrainName('');
      setStrainAcronym('');
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setRegistering(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <GlassCard title={t('plant_register_clones')}>
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

        <RoomSelector
          label={t('plant_initial_room')}
          rooms={rooms}
          selectedRoom={initialRoom}
          onRoomChange={setInitialRoom}
          emptyLabel={isTh ? '⚠️ ไม่มีห้องในระบบ' : '⚠️ No rooms found'}
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleRegisterClones}
          disabled={registering}
          accessibilityRole="button"
          accessibilityLabel={t('plant_submit_register')}
        >
          <Text style={styles.submitBtnText}>
            {registering ? t('loading') : t('plant_submit_register')}
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
