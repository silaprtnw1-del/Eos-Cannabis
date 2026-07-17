import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight, commonStyles } from '../../src/constants/theme';
import { useTranslation } from '../../src/constants/i18n';
import { GlassCard, EmptyState, ErrorState, PillSelector } from '../../src/components/ui';
import { useRooms, useCreateRoom, useSoftDeleteRoom, useCreateActionLog } from '../../src/hooks';
import { canPerform } from '../../src/lib/permissions';
import type { Room, UserRole } from '../../src/types';

interface RoomsTabProps {
  isTh: boolean;
  operatorId: string;
  userRole: UserRole;
}

export default function RoomsTab({ isTh, operatorId, userRole }: RoomsTabProps) {
  const { t } = useTranslation(isTh);
  const roomsQuery = useRooms();
  const createRoom = useCreateRoom();
  const softDeleteRoom = useSoftDeleteRoom();
  const createActionLog = useCreateActionLog();
  const rooms = roomsQuery.data ?? [];

  const [newRoomName, setNewRoomName] = useState<string>('');
  const [newRoomType, setNewRoomType] = useState<Room['type']>('CLONING');
  const [creatingRoom, setCreatingRoom] = useState<boolean>(false);

  const handleCreateRoom = async () => {
    if (!canPerform(userRole, 'room:create')) {
      Alert.alert(t('error'), t('permission_denied'));
      return;
    }
    if (!newRoomName.trim()) {
      Alert.alert(t('login_fill_fields'));
      return;
    }

    setCreatingRoom(true);
    try {
      await createRoom.mutateAsync({
        name: newRoomName.trim(),
        type: newRoomType,
      });

      Alert.alert(t('confirm'), t('plant_room_created'));
      setNewRoomName('');
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setCreatingRoom(false);
    }
  };

  // Soft-delete grow room (is_active = false)
  const handleSoftDeleteRoom = async (roomId: string) => {
    if (!canPerform(userRole, 'room:delete')) {
      Alert.alert(t('error'), t('plant_unauthorized'));
      return;
    }

    Alert.alert(
      isTh ? 'ยืนยันการลบห้องปลูก' : 'Confirm Delete Grow Room',
      isTh ? 'คุณต้องการลบห้องนี้ใช่หรือไม่? (การลบจะเป็นแบบ Soft Delete เพื่อเก็บข้อมูลตาม GACP)' : 'Are you sure you want to delete this room? (Uses soft-delete to comply with GACP)',
      [
        { text: isTh ? 'ยกเลิก' : 'Cancel', style: 'cancel' },
        {
          text: isTh ? 'ยืนยัน' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await softDeleteRoom.mutateAsync(roomId);

              // No DB trigger covers room deletion (verified in Step 0) —
              // this manual audit log insert is the only record of it.
              await createActionLog.mutateAsync({
                actiontype: 'DELETE_ROOM',
                operatorid: operatorId,
                targettype: 'ROOM',
                targetid: roomId,
                details: { deleted_room_id: roomId },
              });

              Alert.alert(t('confirm'), isTh ? 'ลบห้องปลูกสำเร็จ' : 'Grow room deleted successfully');
            } catch (e: any) {
              Alert.alert(t('error'), e.message);
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <GlassCard title={t('plant_add_room')}>
        <View style={commonStyles.inputContainer}>
          <Text style={commonStyles.inputLabel}>{t('plant_new_room_name')}</Text>
          <TextInput
            style={commonStyles.textInputFull}
            value={newRoomName}
            onChangeText={setNewRoomName}
            placeholder="e.g. Flower Room 2"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={t('plant_new_room_name')}
          />
        </View>

        <PillSelector
          label={t('plant_room_type')}
          wrap
          options={(['CLONING', 'VEG', 'FLOWER', 'DRYING', 'CURING', 'PACKAGING'] as const).map((tType) => ({
            value: tType,
            label: tType,
          }))}
          selectedValue={newRoomType}
          onChange={(v) => setNewRoomType(v as Room['type'])}
        />

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleCreateRoom}
          disabled={creatingRoom}
          accessibilityRole="button"
          accessibilityLabel={t('plant_submit_room')}
        >
          <Text style={styles.submitBtnText}>
            {creatingRoom ? t('loading') : t('plant_submit_room')}
          </Text>
        </TouchableOpacity>
      </GlassCard>

      <GlassCard title={isTh ? '📍 รายชื่อห้องปลูกที่ใช้งานอยู่' : '📍 Active Grow Rooms'}>
        {roomsQuery.isError ? (
          <ErrorState message={(roomsQuery.error as Error)?.message} onRetry={() => roomsQuery.refetch()} />
        ) : rooms.length === 0 ? (
          <EmptyState title={t('empty_list')} />
        ) : (
          rooms.map((room) => (
            <View key={room.id} style={styles.roomRow}>
              <View>
                <Text style={styles.roomNameText}>{room.name}</Text>
                <Text style={styles.roomTypeText}>{room.type}</Text>
              </View>
              {canPerform(userRole, 'room:delete') && (
                <TouchableOpacity
                  style={styles.roomDeleteBtn}
                  onPress={() => handleSoftDeleteRoom(room.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete room ${room.name}`}
                >
                  <Text style={styles.roomDeleteText}>🗑️</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
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
  roomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  roomNameText: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  roomTypeText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  roomDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomDeleteText: {
    fontSize: 16,
  },
});
