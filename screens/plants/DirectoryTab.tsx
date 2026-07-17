import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import * as Print from 'expo-print';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jsQR from 'jsqr';
// @ts-ignore
import jpeg from 'jpeg-js';
import { File } from 'expo-file-system';
import { colors, spacing, radius, fontSize, fontWeight } from '../../src/constants/theme';
import { useTranslation } from '../../src/constants/i18n';
import { EmptyState, ErrorState } from '../../src/components/ui';
import { StageSelector, PrintLabelModal, QRScannerModal, PlantManagementModal } from '../../src/components/plants';
import { usePlants, useRooms, useTransferPlant, useArchivePlant, useCreateActionLog } from '../../src/hooks';
import { canPerform } from '../../src/lib/permissions';
import type { Plant, PlantStage, UserRole } from '../../src/types';

interface DirectoryTabProps {
  isTh: boolean;
  operatorId: string;
  userRole: UserRole;
}

export default function DirectoryTab({ isTh, operatorId, userRole }: DirectoryTabProps) {
  const { t } = useTranslation(isTh);

  const plantsQuery = usePlants();
  const roomsQuery = useRooms();
  const transferPlant = useTransferPlant();
  const archivePlant = useArchivePlant();
  const createActionLog = useCreateActionLog();

  const plants = plantsQuery.data ?? [];
  const rooms = roomsQuery.data ?? [];
  const loading = plantsQuery.isLoading || roomsQuery.isLoading;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<PlantStage | 'ALL'>('ALL');

  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [printModalVisible, setPrintModalVisible] = useState<boolean>(false);
  const [manageModalVisible, setManageModalVisible] = useState<boolean>(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const [targetRoom, setTargetRoom] = useState<string>('');
  const [targetStage, setTargetStage] = useState<PlantStage>('CLONE');
  const [updatingPlant, setUpdatingPlant] = useState<boolean>(false);
  const [printing, setPrinting] = useState<boolean>(false);
  const [scanningGallery, setScanningGallery] = useState<boolean>(false);

  // Perform plant transfer (location & stage change)
  const handleTransfer = async () => {
    if (!selectedPlant) return;
    if (!canPerform(userRole, 'plant:transfer')) {
      Alert.alert(t('error'), t('plant_unauthorized'));
      return;
    }

    setUpdatingPlant(true);
    try {
      await transferPlant.mutateAsync({
        plantId: selectedPlant.id,
        updates: { roomname: targetRoom, stage: targetStage },
      });

      // No DB trigger covers plant transfers (verified in Step 0) — this
      // manual audit log insert is the only record of it.
      await createActionLog.mutateAsync({
        actiontype: 'TRANSFER_PLANT',
        operatorid: operatorId,
        targettype: 'PLANT',
        targetid: selectedPlant.id,
        plantid: selectedPlant.id,
        details: {
          from_room: selectedPlant.roomname,
          to_room: targetRoom,
          from_stage: selectedPlant.stage,
          to_stage: targetStage,
        },
      });

      Alert.alert(t('confirm'), t('plant_transferred'));
      setManageModalVisible(false);
      setSelectedPlant(null);
    } catch (e: any) {
      Alert.alert(t('error'), e.message);
    } finally {
      setUpdatingPlant(false);
    }
  };

  // Archive/Soft-delete plant entry (GACP audit trail friendly)
  const handleArchivePlant = async () => {
    if (!selectedPlant) return;
    if (!canPerform(userRole, 'plant:archive')) {
      Alert.alert(t('error'), t('plant_unauthorized'));
      return;
    }

    const doArchive = async (archivereason: string | null) => {
      setUpdatingPlant(true);
      try {
        await archivePlant.mutateAsync({ plantId: selectedPlant.id, archivereason });

        // No DB trigger covers plant archiving (verified in Step 0) —
        // this manual audit log insert is the only record of it.
        await createActionLog.mutateAsync({
          actiontype: 'ARCHIVE_PLANT',
          operatorid: operatorId,
          targettype: 'PLANT',
          targetid: selectedPlant.id,
          plantid: selectedPlant.id,
          details: {
            previous_stage: selectedPlant.stage,
            previous_room: selectedPlant.roomname,
            archive_reason: archivereason,
          },
        });

        Alert.alert(t('confirm'), isTh ? 'เก็บถาวรต้นไม้สำเร็จ' : 'Plant archived successfully');
        setManageModalVisible(false);
        setSelectedPlant(null);
      } catch (e: any) {
        Alert.alert(t('error'), e.message);
      } finally {
        setUpdatingPlant(false);
      }
    };

    // Only CLONE-stage archiving can be a "failed clone" — this is the only
    // signal used to compute per-mother clone success rate.
    if (selectedPlant.stage === 'CLONE') {
      Alert.alert(
        isTh ? 'ยืนยันการเก็บถาวรต้นไม้' : 'Confirm Archive Plant',
        isTh ? 'กิ่งชำนี้ไม่รอด หรือเก็บถาวรด้วยเหตุผลอื่น?' : 'Was this clone a failure, or archiving for another reason?',
        [
          { text: isTh ? 'ยกเลิก' : 'Cancel', style: 'cancel' },
          { text: t('plant_archive_failed_clone'), style: 'destructive', onPress: () => doArchive('FAILED_CLONE') },
          { text: t('plant_archive_other'), style: 'destructive', onPress: () => doArchive(null) },
        ]
      );
      return;
    }

    Alert.alert(
      isTh ? 'ยืนยันการเก็บถาวรต้นไม้' : 'Confirm Archive Plant',
      isTh ? 'คุณต้องการย้ายต้นไม้นี้ไปยังการเก็บถาวร (Soft Delete) ใช่หรือไม่?' : 'Are you sure you want to move this plant to archives? (Soft Delete)',
      [
        { text: isTh ? 'ยกเลิก' : 'Cancel', style: 'cancel' },
        { text: isTh ? 'ยืนยัน' : 'Archive', style: 'destructive', onPress: () => doArchive(null) },
      ]
    );
  };

  // Simulated Label print triggering (uses expo-print internally)
  const triggerPrintSim = async () => {
    if (!selectedPlant) return;
    setPrinting(true);
    try {
      const htmlContent = `
        <html>
          <body style="font-family: monospace; text-align: center; padding: 20px;">
            <h2>APN CANNABIS CO.</h2>
            <hr />
            <h3>${selectedPlant.id}</h3>
            <p>Strain: ${selectedPlant.strainname}</p>
            <p>Planted: ${new Date(selectedPlant.plantedat).toLocaleDateString()}</p>
          </body>
        </html>
      `;
      await Print.printAsync({ html: htmlContent });
      Alert.alert(t('confirm'), `${t('plant_print_simulated')} ${selectedPlant.id}`);
      setPrintModalVisible(false);
    } catch (e) {
      Alert.alert(t('error'), t('plant_print_failed'));
    } finally {
      setPrinting(false);
    }
  };

  // QR Scanning handling
  const handleQRScanned = (scannedId: string) => {
    setScannerVisible(false);
    const found = plants.find(p => p.id === scannedId);
    if (found) {
      setSelectedPlant(found);
      setTargetRoom(found.roomname);
      setTargetStage(found.stage);
      setManageModalVisible(true);
    } else {
      Alert.alert(
        isTh ? 'ไม่พบรหัสพืชในระบบ' : 'Plant ID not found',
        isTh ? `ไม่พบรหัสพืช "${scannedId}" ในบัญชีฟาร์มปัจจุบัน` : `Plant ID "${scannedId}" does not exist in the farm registry.`
      );
    }
  };

  // Gallery Picker & QR Decoder: 100% OFFLINE using expo-file-system, jpeg-js & jsqr
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const imageUri = result.assets[0].uri;
      setScanningGallery(true);

      // 1. Resize/compress image first to optimize CPU processing time for decoding
      // A small width of 400px is perfect for QR code detection and decodes very fast
      const manipResult = await manipulateAsync(
        imageUri,
        [{ resize: { width: 400 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      // 2. Read the compressed image file directly as binary bytes (no base64 overhead!)
      const file = new File(manipResult.uri);
      const rawBuffer = await file.bytes();

      // 3. Decode JPEG binary buffer to raw RGBA pixel data
      const rawImageData = jpeg.decode(rawBuffer, { useTArray: true });

      // 5. Scan using jsQR
      const clampedData = new Uint8ClampedArray(rawImageData.data);
      const code = jsQR(
        clampedData,
        rawImageData.width,
        rawImageData.height
      );

      setScanningGallery(false);

      if (code && code.data) {
        handleQRScanned(code.data);
      } else {
        Alert.alert(
          isTh ? 'ไม่พบรหัส QR Code' : 'No QR Code Found',
          isTh
            ? 'ไม่พบข้อมูล QR Code ในรูปภาพที่เลือก กรุณาลองใช้รูปอื่นที่ชัดเจนและมีบาร์โค้ดอยู่ในภาพ'
            : 'Could not detect any QR code in the selected image. Please try another clearer photo.'
        );
      }
    } catch (e: any) {
      setScanningGallery(false);
      Alert.alert(
        isTh ? 'การประมวลผลล้มเหลว' : 'Processing Failed',
        isTh
          ? 'เกิดข้อผิดพลาดในการอ่านไฟล์รูปภาพ กรุณาลองใหม่อีกครั้ง หรือใช้การสแกนด้วยกล้องจริง'
          : 'An error occurred while reading the image file. Please try again or use live camera scanning.'
      );
      console.warn('Offline image QR scan error:', e);
    }
  };

  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      const matchesSearch =
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.strainname.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = stageFilter === 'ALL' || p.stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [plants, searchQuery, stageFilter]);

  return (
    <View style={styles.directoryContainer}>
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('plant_search_placeholder')}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Search plants input"
          />
        </View>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => setScannerVisible(true)}
          accessibilityRole="button"
          accessibilityLabel={t('plant_scan_btn')}
        >
          <Text style={styles.scanBtnText}>📷</Text>
        </TouchableOpacity>
      </View>

      <StageSelector
        selectedStage={stageFilter as PlantStage}
        onStageChange={(stg) => setStageFilter(stg as PlantStage | 'ALL')}
        stages={['CLONE', 'VEG', 'FLOWER', 'HARVESTED'] as const}
      />

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.loadingIndicator} />
      ) : plantsQuery.isError || roomsQuery.isError ? (
        <ErrorState
          message={((plantsQuery.error || roomsQuery.error) as Error)?.message}
          onRetry={() => {
            plantsQuery.refetch();
            roomsQuery.refetch();
          }}
        />
      ) : filteredPlants.length === 0 ? (
        <EmptyState title={t('empty_list')} />
      ) : (
        <FlatList
          data={filteredPlants}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.plantList}
          renderItem={({ item }) => (
            <View style={styles.plantCard}>
              <View style={styles.plantCardHeader}>
                <Text style={styles.plantId}>{item.id}</Text>
                <View style={styles.plantActions}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => {
                      setSelectedPlant(item);
                      setTargetRoom(item.roomname);
                      setTargetStage(item.stage);
                      setManageModalVisible(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Manage plant"
                  >
                    <Text style={styles.actionIconText}>⚙️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => {
                      setSelectedPlant(item);
                      setPrintModalVisible(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Print plant label"
                  >
                    <Text style={styles.actionIconText}>🖨️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.plantCardBody}>
                <View style={styles.plantCardRow}>
                  <Text style={styles.plantLabel}>{t('plant_strain')}:</Text>
                  <Text style={styles.plantVal} numberOfLines={1}>{item.strainname}</Text>
                </View>
                <View style={styles.plantCardRow}>
                  <Text style={styles.plantLabel}>{t('plant_room')}:</Text>
                  <Text style={[styles.plantVal, { color: colors.info }]}>{item.roomname}</Text>
                </View>
                <View style={styles.plantCardRow}>
                  <Text style={styles.plantLabel}>{t('plant_planted_date')}:</Text>
                  <Text style={styles.plantVal}>{new Date(item.plantedat).toLocaleDateString()}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      <QRScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleQRScanned}
        onPickFromGallery={handlePickImage}
        isTh={isTh}
        scanning={scanningGallery}
      />

      <PrintLabelModal
        visible={printModalVisible}
        plant={selectedPlant}
        onClose={() => {
          setPrintModalVisible(false);
          setSelectedPlant(null);
        }}
        onPrint={triggerPrintSim}
        printing={printing}
      />

      <PlantManagementModal
        visible={manageModalVisible}
        plant={selectedPlant}
        rooms={rooms}
        targetRoom={targetRoom}
        targetStage={targetStage}
        onRoomChange={setTargetRoom}
        onStageChange={setTargetStage}
        onClose={() => {
          setManageModalVisible(false);
          setSelectedPlant(null);
        }}
        onTransfer={handleTransfer}
        onArchive={handleArchivePlant}
        updating={updatingPlant}
        isTh={isTh}
        userRole={userRole}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  directoryContainer: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInputWrapper: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchInput: {
    color: colors.text,
    fontSize: fontSize.lg,
  },
  scanBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.lg,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBtnText: {
    fontSize: 20,
  },
  loadingIndicator: {
    marginVertical: spacing.xxl,
  },
  plantList: {
    paddingBottom: 40,
  },
  plantCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  plantCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  plantId: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    fontFamily: 'monospace',
  },
  plantActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionIconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconText: {
    fontSize: 16,
  },
  plantCardBody: {},
  plantCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  plantLabel: {
    color: colors.textMuted,
    fontSize: fontSize.body,
  },
  plantVal: {
    color: colors.text,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
});
