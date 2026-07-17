import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing } from '../src/constants/theme';
import { useTranslation } from '../src/constants/i18n';
import { SubTabBar } from '../src/components/ui';
import DirectoryTab from './plants/DirectoryTab';
import InventoryTab from './plants/InventoryTab';
import RegisterTab from './plants/RegisterTab';
import MotherPlantsTab from './plants/MotherPlantsTab';
import RoomsTab from './plants/RoomsTab';
import type { UserRole } from '../src/types';

interface PlantDirectoryScreenProps {
  isTh: boolean;
  operatorId: string;
  userRole: UserRole;
}

export default function PlantDirectoryScreen({ isTh, operatorId, userRole }: PlantDirectoryScreenProps) {
  const { t } = useTranslation(isTh);
  const [activeTab, setActiveTab] = useState<string>('directory');

  const directoryTabs = [
    { key: 'directory', label: t('tab_plants') },
    { key: 'inventory', label: t('tab_inventory') },
    { key: 'register', label: t('plant_register_clones') },
    { key: 'mothers', label: t('tab_mother_plants') },
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
          <DirectoryTab isTh={isTh} operatorId={operatorId} userRole={userRole} />
        ) : activeTab === 'inventory' ? (
          <InventoryTab isTh={isTh} operatorId={operatorId} userRole={userRole} />
        ) : activeTab === 'register' ? (
          <RegisterTab isTh={isTh} operatorId={operatorId} userRole={userRole} />
        ) : activeTab === 'mothers' ? (
          <MotherPlantsTab isTh={isTh} operatorId={operatorId} userRole={userRole} />
        ) : (
          <RoomsTab isTh={isTh} operatorId={operatorId} userRole={userRole} />
        )}
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
    paddingHorizontal: spacing.lg,
  },
});
