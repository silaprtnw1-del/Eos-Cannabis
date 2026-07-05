import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, fontSize, fontWeight } from '../../constants/theme';
import type { Room } from '../../types';

interface RoomDropdownProps {
  label: string;
  rooms: Room[];
  selectedRoom: string;
  onRoomChange: (roomName: string) => void;
  isTh: boolean;
}

export function RoomDropdown({
  label,
  rooms,
  selectedRoom,
  onRoomChange,
  isTh,
}: RoomDropdownProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (roomName: string) => {
    onRoomChange(roomName);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.inputLabel}>{label}</Text>
      
      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedRoom || (isTh ? 'เลือกห้องปลูก' : 'Select Grow Room')}`}
      >
        <Text style={styles.triggerText}>
          {selectedRoom ? `📍 ${selectedRoom}` : (isTh ? '📍 เลือกห้องปลูก' : '📍 Select Grow Room')}
        </Text>
        <Text style={styles.triggerChevron}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isTh ? '📍 เลือกห้อง/โซนปลูก' : '📍 Select Grow Room / Zone'}
              </Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>{isTh ? 'ปิด' : 'Close'}</Text>
              </TouchableOpacity>
            </View>

            {rooms.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {isTh ? '⚠️ ไม่มีห้องในระบบ กรุณาสร้างห้องปลูกก่อน' : '⚠️ No rooms found. Register a room first.'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={rooms}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = item.name === selectedRoom;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.roomItem,
                        isSelected && styles.roomItemActive,
                      ]}
                      onPress={() => handleSelect(item.name)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={item.name}
                    >
                      <View>
                        <Text
                          style={[
                            styles.roomName,
                            isSelected && styles.roomNameActive,
                          ]}
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.roomType}>{item.type}</Text>
                      </View>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
                contentContainerStyle={styles.listContent}
              />
            )}
            <SafeAreaView />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  triggerText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  triggerChevron: {
    color: colors.textMuted,
    fontSize: fontSize.body,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardSolid,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: '60%',
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  closeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
  },
  closeBtnText: {
    color: colors.accent,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  roomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  roomItemActive: {
    backgroundColor: colors.accentDim,
    borderBottomColor: 'transparent',
  },
  roomName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  roomNameActive: {
    color: colors.accent,
  },
  roomType: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  checkmark: {
    color: colors.accent,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
  },
  emptyContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.warning,
    fontSize: fontSize.body,
    textAlign: 'center',
  },
});
