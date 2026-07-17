import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing } from '../src/constants/theme';
import { useTranslation } from '../src/constants/i18n';
import { SubTabBar } from '../src/components/ui';
import DirectoryTab from './plants/DirectoryTab';
import RegisterTab from './plants/RegisterTab';
import ImportTab from './plants/ImportTab';
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
          <DirectoryTab isTh={isTh} operatorId={operatorId} userRole={userRole} />
        ) : activeTab === 'register' ? (
          <RegisterTab isTh={isTh} operatorId={operatorId} />
        ) : activeTab === 'import' ? (
          <ImportTab isTh={isTh} operatorId={operatorId} />
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
  },
});
