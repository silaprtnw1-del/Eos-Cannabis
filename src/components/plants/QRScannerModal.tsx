import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, radius, spacing, fontSize, fontWeight, commonStyles } from '../../constants/theme';

interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (plantId: string) => void;
  onPickFromGallery?: () => Promise<void>;
  isTh: boolean;
  scanning?: boolean;
}

export function QRScannerModal({
  visible,
  onClose,
  onScanned,
  onPickFromGallery,
  isTh,
  scanning = false,
}: QRScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [simulatorInput, setSimulatorInput] = useState<string>('');

  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const handleSimulateScan = () => {
    const target = simulatorInput.trim();
    if (!target) {
      Alert.alert(isTh ? 'กรุณากรอกรหัสพืช' : 'Please enter a plant ID');
      return;
    }
    onScanned(target);
    setSimulatorInput('');
  };

  const renderCameraView = () => {
    if (!permission) {
      // Camera permissions are still loading.
      return <View style={styles.loadingContainer}><Text style={styles.infoText}>Loading camera...</Text></View>;
    }

    if (!permission.granted) {
      // Camera permissions are not granted yet.
      return (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            {isTh
              ? 'เราต้องการสิทธิ์เข้าถึงกล้องถ่ายภาพของคุณเพื่อสแกน QR Code'
              : 'We need your permission to show the camera for QR code scanning'}
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>
              {isTh ? 'อนุญาตสิทธิ์กล้อง' : 'Grant Permission'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.cameraWrapper}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={({ data }) => {
            if (data) {
              onScanned(data);
            }
          }}
          children={null}
        />
        <View style={styles.overlayScanner}>
          <View style={styles.scannerCutout} />
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isTh ? '📷 สแกนบาร์โค้ด / QR Code' : '📷 Barcode & QR Code Scanner'}
          </Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>{isTh ? 'ปิด' : 'Close'}</Text>
          </TouchableOpacity>
        </View>

        {/* Scanner View */}
        <View style={styles.scannerContainer}>
          {renderCameraView()}
        </View>

        {/* Actions & Simulator fallback */}
        <View style={styles.footer}>
          {onPickFromGallery && (
            <TouchableOpacity
              style={styles.galleryBtn}
              onPress={onPickFromGallery}
              disabled={scanning}
              accessibilityRole="button"
              accessibilityLabel={isTh ? 'เลือกรูปภาพจากคลัง' : 'Pick Image from Gallery'}
            >
              {scanning ? (
                <ActivityIndicator size="small" color={colors.info} />
              ) : (
                <Text style={styles.galleryBtnText}>
                  {isTh ? '🖼️ เลือกรูปภาพจากคลัง' : '🖼️ Pick Image from Gallery'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Simulator Panel (crucial for emulators / Termux test runs) */}
          <View style={styles.simPanel}>
            <Text style={styles.simTitle}>
              {isTh ? '💻 เครื่องจำลองการสแกน (Emulator Fallback)' : '💻 Scan Simulator (Emulator Fallback)'}
            </Text>
            <View style={styles.simRow}>
              <TextInput
                style={styles.simInput}
                value={simulatorInput}
                onChangeText={setSimulatorInput}
                placeholder="e.g. APN-SBC-4F8A"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.simBtn} onPress={handleSimulateScan}>
                <Text style={styles.simBtnText}>{isTh ? 'ส่ง' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  closeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
  },
  closeBtnText: {
    color: colors.accent,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: fontSize.lg,
  },
  permissionContainer: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  permissionText: {
    color: '#fff',
    fontSize: fontSize.lg,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  permissionBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
  },
  permissionBtnText: {
    color: colors.textOnAccent,
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlayScanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerCutout: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: 'transparent',
    borderRadius: radius.lg,
  },
  footer: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  galleryBtn: {
    backgroundColor: colors.infoDim,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  galleryBtnText: {
    color: colors.info,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  simPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  simTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  simRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  simInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
  },
  simBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  simBtnText: {
    color: colors.textOnAccent,
    fontSize: fontSize.body,
    fontWeight: fontWeight.extrabold,
  },
});
