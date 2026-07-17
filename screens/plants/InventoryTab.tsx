import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '../../src/constants/theme';
import { useTranslation } from '../../src/constants/i18n';
import { EmptyState, ErrorState } from '../../src/components/ui';
import { usePlants } from '../../src/hooks';
import { groupPlantsByStrain } from '../../src/domain/strainInventory';
import type { UserRole } from '../../src/types';

interface InventoryTabProps {
  isTh: boolean;
  operatorId: string;
  userRole: UserRole;
}

export default function InventoryTab({ isTh }: InventoryTabProps) {
  const { t } = useTranslation(isTh);
  const plantsQuery = usePlants();
  const plants = plantsQuery.data ?? [];
  const loading = plantsQuery.isLoading;

  const [searchQuery, setSearchQuery] = useState<string>('');

  const inventory = useMemo(() => groupPlantsByStrain(plants), [plants]);

  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventory;
    const q = searchQuery.toLowerCase();
    return inventory.filter((row) => row.strainname.toLowerCase().includes(q));
  }, [inventory, searchQuery]);

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('inv_search_placeholder')}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Search strain inventory input"
          />
        </View>
      </View>

      {!loading && inventory.length > 0 && (
        <Text style={styles.summaryText}>
          {t('inv_strain_count_label')}: {filteredInventory.length}
        </Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.loadingIndicator} />
      ) : plantsQuery.isError ? (
        <ErrorState message={(plantsQuery.error as Error)?.message} onRetry={() => plantsQuery.refetch()} />
      ) : inventory.length === 0 ? (
        <EmptyState icon="🌱" title={t('inv_empty_farm')} />
      ) : filteredInventory.length === 0 ? (
        <EmptyState title={t('inv_no_match')} />
      ) : (
        <FlatList
          data={filteredInventory}
          keyExtractor={(item) => item.strainname}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.strainCard}>
              <View style={styles.strainCardHeader}>
                <Text style={styles.strainName} numberOfLines={1}>
                  {item.strainname}
                </Text>
                <Text style={styles.strainTotal}>{item.liveTotal}</Text>
              </View>
              <View style={styles.stageRow}>
                <View style={styles.stagePill}>
                  <Text style={[styles.stageValue, { color: colors.info }]}>{item.cloneCount}</Text>
                  <Text style={styles.stageLabel}>{t('plant_clone')}</Text>
                </View>
                <View style={styles.stagePill}>
                  <Text style={[styles.stageValue, { color: colors.accent }]}>{item.vegCount}</Text>
                  <Text style={styles.stageLabel}>{t('plant_veg')}</Text>
                </View>
                <View style={styles.stagePill}>
                  <Text style={[styles.stageValue, { color: colors.warning }]}>{item.flowerCount}</Text>
                  <Text style={styles.stageLabel}>{t('plant_flower')}</Text>
                </View>
                <View style={styles.stagePill}>
                  <Text style={[styles.stageValue, { color: colors.textMuted }]}>{item.harvestedCount}</Text>
                  <Text style={styles.stageLabel}>{t('plant_harvested')}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  summaryText: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.md,
  },
  loadingIndicator: {
    marginVertical: spacing.xxl,
  },
  list: {
    paddingBottom: 40,
  },
  strainCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  strainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: 8,
    marginBottom: 8,
  },
  strainName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginRight: spacing.sm,
  },
  strainTotal: {
    color: colors.accent,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
  },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stagePill: {
    flex: 1,
    alignItems: 'center',
  },
  stageValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  stageLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
