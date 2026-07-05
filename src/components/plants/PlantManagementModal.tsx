import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight, commonStyles } from '../../constants/theme';
import { RoomSelector } from './RoomSelector';
import { StageSelector } from './StageSelector';
import type { Plant, Room, PlantStage } from '../../types';

interface PlantManagementModalProps {
  visible: boolean;
  plant: Plant | null;
  rooms: Room[];
  targetRoom: string;
  targetStage: PlantStage;
  onRoomChange: (room: string) => void;
  onStageChange: (stage: PlantStage) => void;
  onClose: () => void;
  onTransfer: () => Promise<void>;
  onArchive?: () => Promise<void>;
  updating?: boolean;
  isTh: boolean;
  userRole?: string;
}

export function PlantManagementModal({
  visible,
  plant,
  rooms,
  targetRoom,
  targetStage,
  onRoomChange,
  onStageChange,
  onClose,
  onTransfer,
  onArchive,
  updating = false,
  isTh,
  userRole,
}: PlantManagementModalProps) {
  if (!plant) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {isTh ? '🔎 รายละเอียด & ย้ายตำแหน่งพืช' : '🔎 Traceability & Plant Transfer'}
          </Text>

          {/* Plant Telemetry Info Box */}
          <View style={styles.telemetryBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Plant ID:</Text>
              <Text style={styles.infoValueId}>{plant.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{isTh ? 'สายพันธุ์:' : 'Strain:'}</Text>
              <Text style={styles.infoValue}>{plant.strainname}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{isTh ? 'ห้องปัจจุบัน:' : 'Current Room:'}</Text>
              <Text style={[styles.infoValue, { color: colors.info }]}>{plant.roomname}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{isTh ? 'ระยะเติบโตปัจจุบัน:' : 'Current Stage:'}</Text>
              <Text style={[styles.infoValue, { color: colors.accent }]}>{plant.stage}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{isTh ? 'วันที่ปลูก:' : 'Planted Date:'}</Text>
              <Text style={styles.infoValue}>
                {new Date(plant.plantedat).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Input Controls */}
          <View style={styles.formContainer}>
            <StageSelector
              label={isTh ? 'ระยะปลูกใหม่ (Target Stage)' : 'Target Stage'}
              selectedStage={targetStage}
              onStageChange={onStageChange}
            />

            <RoomSelector
              label={isTh ? 'เลือกห้องปลายทาง (Target Room)' : 'Target Room'}
              rooms={rooms}
              selectedRoom={targetRoom}
              onRoomChange={onRoomChange}
              emptyLabel={isTh ? '⚠️ ไม่มีห้องในระบบ' : '⚠️ No rooms found'}
            />
          </View>

          {/* Actions */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              disabled={updating}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <Text style={styles.closeBtnText}>{isTh ? 'ปิด' : 'Cancel'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={onTransfer}
              disabled={updating}
              accessibilityRole="button"
              accessibilityLabel="Confirm transfer"
            >
              {updating ? (
                <ActivityIndicator size="small" color={colors.textOnAccent} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isTh ? '💾 ยืนยันการย้าย' : '💾 Confirm Transfer'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
          {userRole === 'ADMIN' && onArchive && (
            <TouchableOpacity
              style={styles.archiveBtn}
              onPress={onArchive}
              disabled={updating}
              accessibilityRole="button"
              accessibilityLabel="Archive plant"
            >
              <Text style={styles.archiveBtnText}>
                {isTh ? '🗑️ เก็บถาวรต้นไม้ (Soft Delete)' : '🗑️ Archive Plant (Soft Delete)'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.cardSolid,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    width: '100%',
    maxHeight: '90%',
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  telemetryBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  infoValue: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  infoValueId: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    fontFamily: 'monospace',
  },
  formContainer: {
    marginBottom: spacing.xxl,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  closeBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  closeBtnText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: colors.textOnAccent,
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
  },
  archiveBtn: {
    paddingVertical: spacing.lg,
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  archiveBtnText: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});
