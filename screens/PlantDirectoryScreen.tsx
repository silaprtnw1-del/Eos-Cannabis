import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as Print from 'expo-print';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jsQR from 'jsqr';
// @ts-ignore
import jpeg from 'jpeg-js';
import { File } from 'expo-file-system';
import { colors, spacing, radius, fontSize, fontWeight, commonStyles } from '../src/constants/theme';
import { useTranslation } from '../src/constants/i18n';
import { GlassCard, SubTabBar, EmptyState } from '../src/components/ui';
import {
  StageSelector,
  RoomSelector,
  BatchSelector,
  PrintLabelModal,
  QRScannerModal,
  PlantManagementModal,
} from '../src/components/plants';
import {
  usePlants,
  useRooms,
  useBatches,
  useRegisterClones,
  useTransferPlant,
  useArchivePlant,
  useCreateRoom,
  useSoftDeleteRoom,
  useCreateActionLog,
} from '../src/hooks';
import type { Plant, Room, PlantStage, UserRole } from '../src/types';


interface PlantDirectoryScreenProps {
  isTh: boolean;
  operatorId: string;
  userRole: UserRole;
}

export default function PlantDirectoryScreen({ isTh, operatorId, userRole }: PlantDirectoryScreenProps) {
  const { t } = useTranslation(isTh);
  const [activeTab, setActiveTab] = useState<string>('directory');

  const plantsQuery = usePlants();
  const roomsQuery = useRooms();
  const batchesQuery = useBatches();
  const registerClones = useRegisterClones();
  const transferPlant = useTransferPlant();
  const archivePlant = useArchivePlant();
  const createRoom = useCreateRoom();
  const softDeleteRoom = useSoftDeleteRoom();
  const createActionLog = useCreateActionLog();

  const plants = plantsQuery.data ?? [];
  const rooms = roomsQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const loading = plantsQuery.isLoading || roomsQuery.isLoading || batchesQuery.isLoading;

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<PlantStage | 'ALL'>('ALL');

  // Modals Visibility
  const [scannerVisible, setScannerVisible] = useState<boolean>(false);
  const [printModalVisible, setPrintModalVisible] = useState<boolean>(false);
  const [manageModalVisible, setManageModalVisible] = useState<boolean>(false);

  // Selected entities for modals
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  // Transfer Form States
  const [targetRoom, setTargetRoom] = useState<string>('');
  const [targetStage, setTargetStage] = useState<PlantStage>('CLONE');
  const [updatingPlant, setUpdatingPlant] = useState<boolean>(false);

  // Registration Form States
  const [strainName, setStrainName] = useState<string>('');
  const [strainAcronym, setStrainAcronym] = useState<string>('');
  const [cloneQty, setCloneQty] = useState<string>('50');
  const [initialRoom, setInitialRoom] = useState<string>('');
  const [registering, setRegistering] = useState<boolean>(false);

  // Import Form States
  const [selectedImportBatchId, setSelectedImportBatchId] = useState<string>('');
  const [importQty, setImportQty] = useState<string>('24');
  const [importRoom, setImportRoom] = useState<string>('');
  const [importing, setImporting] = useState<boolean>(false);

  // New Room Form States
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [newRoomType, setNewRoomType] = useState<Room['type']>('CLONING');
  const [creatingRoom, setCreatingRoom] = useState<boolean>(false);

  const [printing, setPrinting] = useState<boolean>(false);
  const [scanningGallery, setScanningGallery] = useState<boolean>(false);

  // Auto-select first room/batch once loaded
  useEffect(() => {
    if (rooms.length > 0) {
      if (!initialRoom) setInitialRoom(rooms[0].name);
      if (!importRoom) setImportRoom(rooms[0].name);
      if (!targetRoom) setTargetRoom(rooms[0].name);
    }
  }, [rooms, initialRoom, importRoom, targetRoom]);

  useEffect(() => {
    if (batches.length > 0 && !selectedImportBatchId) {
      setSelectedImportBatchId(batches[0].id);
    }
  }, [batches, selectedImportBatchId]);

  // Plant registration (clones)
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

  // Import Plants
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

  // Create Room
  const handleCreateRoom = async () => {
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

  // Perform plant transfer (location & stage change)
  const handleTransfer = async () => {
    if (!selectedPlant) return;
    if (userRole !== 'ADMIN' && userRole !== 'SUPERVISOR') {
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
    if (userRole !== 'ADMIN') {
      Alert.alert(t('error'), t('plant_unauthorized'));
      return;
    }

    Alert.alert(
      isTh ? 'ยืนยันการเก็บถาวรต้นไม้' : 'Confirm Archive Plant',
      isTh ? 'คุณต้องการย้ายต้นไม้นี้ไปยังการเก็บถาวร (Soft Delete) ใช่หรือไม่?' : 'Are you sure you want to move this plant to archives? (Soft Delete)',
      [
        { text: isTh ? 'ยกเลิก' : 'Cancel', style: 'cancel' },
        {
          text: isTh ? 'ยืนยัน' : 'Archive',
          style: 'destructive',
          onPress: async () => {
            setUpdatingPlant(true);
            try {
              await archivePlant.mutateAsync(selectedPlant.id);

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
          }
        }
      ]
    );
  };

  // Soft-delete grow room (is_active = false)
  const handleSoftDeleteRoom = async (roomId: string) => {
    if (userRole !== 'ADMIN') {
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
    // Find plant by scanned ID
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

  // Filter and search plants
  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      const matchesSearch =
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.strainname.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStage = stageFilter === 'ALL' || p.stage === stageFilter;

      return matchesSearch && matchesStage;
    });
  }, [plants, searchQuery, stageFilter]);

  const directoryTabs = [
    { key: 'directory', label: t('tab_plants') },
    { key: 'register', label: t('plant_register_clones') },
    { key: 'import', label: t('plant_import_plants') },
    { key: 'rooms', label: t('plant_add_room') },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <View style={styles.container}>
        <SubTabBar tabs={directoryTabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'directory' ? (
          <View style={styles.directoryContainer}>
            {/* Search and Scan Row */}
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

            {/* Stage filter buttons */}
            <StageSelector
              selectedStage={stageFilter as PlantStage}
              onStageChange={(stg) => setStageFilter(stg as PlantStage | 'ALL')}
              stages={['CLONE', 'VEG', 'FLOWER', 'HARVESTED'] as const}
            />

            {loading ? (
              <ActivityIndicator size="large" color={colors.accent} style={{ marginVertical: 30 }} />
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
          </View>
        ) : activeTab === 'register' ? (
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
        ) : activeTab === 'import' ? (
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
        ) : (
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

              <View style={styles.inputContainerCompact}>
                <Text style={commonStyles.inputLabel}>{t('plant_room_type')}</Text>
                <View style={styles.roomTypeGrid}>
                  {(['CLONING', 'VEG', 'FLOWER', 'DRYING', 'CURING', 'PACKAGING'] as const).map(tType => (
                    <TouchableOpacity
                      key={tType}
                      style={[styles.typeBtn, newRoomType === tType && styles.typeBtnActive]}
                      onPress={() => setNewRoomType(tType)}
                      accessibilityRole="button"
                      accessibilityLabel={`Room type ${tType}`}
                    >
                      <Text style={[styles.typeBtnText, newRoomType === tType && styles.typeBtnTextActive]}>
                        {tType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

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

            <View style={{ height: 20 }} />

            <GlassCard title={isTh ? '📍 รายชื่อห้องปลูกที่ใช้งานอยู่' : '📍 Active Grow Rooms'}>
              {rooms.length === 0 ? (
                <EmptyState title={t('empty_list')} />
              ) : (
                rooms.map((room) => (
                  <View key={room.id} style={styles.roomRow}>
                    <View>
                      <Text style={styles.roomNameText}>{room.name}</Text>
                      <Text style={styles.roomTypeText}>{room.type}</Text>
                    </View>
                    {userRole === 'ADMIN' && (
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
        )}

        {/* Reusable Modals */}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  directoryContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 40,
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
    paddingBottom: 8,
    marginBottom: 8,
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
  inputContainerCompact: {
    marginBottom: spacing.lg,
  },
  roomTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  typeBtn: {
    flex: 1,
    minWidth: 90,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  typeBtnText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  typeBtnTextActive: {
    color: colors.accent,
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
