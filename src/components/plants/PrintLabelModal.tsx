import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, radius, spacing, fontSize, fontWeight } from '../../constants/theme';
import type { Plant } from '../../types';

interface PrintLabelModalProps {
  visible: boolean;
  plant: Plant | null;
  onClose: () => void;
  onPrint: () => Promise<void>;
  printing?: boolean;
}

export function PrintLabelModal({
  visible,
  plant,
  onClose,
  onPrint,
  printing = false,
}: PrintLabelModalProps) {
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
          <Text style={styles.modalTitle}>🖨️ Print Plant Label</Text>
          
          <View style={styles.previewContainer}>
            {/* Label Layout simulation */}
            <View style={styles.labelCard}>
              <View style={styles.labelHeader}>
                <Text style={styles.brandName}>APN CANNABIS CO.</Text>
                <Text style={styles.complianceText}>GACP Certified</Text>
              </View>
              <View style={styles.labelBody}>
                <View style={styles.qrWrapper}>
                  <QRCode
                    value={plant.id}
                    size={70}
                    color="#000"
                    backgroundColor="#fff"
                  />
                </View>
                <View style={styles.plantDetails}>
                  <Text style={styles.plantIdText}>{plant.id}</Text>
                  <Text style={styles.strainText} numberOfLines={1}>
                    {plant.strainname}
                  </Text>
                  <Text style={styles.dateText}>
                    Planted: {new Date(plant.plantedat).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.previewInfo}>
              Standard Thermal Label (40mm × 25mm)
            </Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              disabled={printing}
              accessibilityRole="button"
              accessibilityLabel="Cancel label print"
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.printBtn}
              onPress={onPrint}
              disabled={printing}
              accessibilityRole="button"
              accessibilityLabel="Confirm and print label"
            >
              {printing ? (
                <ActivityIndicator size="small" color={colors.textOnAccent} />
              ) : (
                <Text style={styles.printBtnText}>Send to Printer</Text>
              )}
            </TouchableOpacity>
          </View>
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
    maxWidth: 360,
    alignItems: 'center',
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xl,
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    width: '100%',
  },
  labelCard: {
    width: 240,
    height: 150,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: spacing.md,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  labelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.8,
    borderBottomColor: '#000',
    paddingBottom: 4,
  },
  brandName: {
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
  },
  complianceText: {
    color: '#000',
    fontSize: 8,
  },
  labelBody: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginTop: spacing.sm,
  },
  qrWrapper: {
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 2,
    backgroundColor: '#fff',
  },
  plantDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  plantIdText: {
    color: '#000000',
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
  strainText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  dateText: {
    color: '#555555',
    fontSize: 8,
  },
  previewInfo: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.md,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
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
  printBtn: {
    flex: 1,
    paddingVertical: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  printBtnText: {
    color: colors.textOnAccent,
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
  },
});
