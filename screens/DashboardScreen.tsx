import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight } from '../src/constants/theme';
import { useTranslation } from '../src/constants/i18n';
import { GlassCard, ErrorState, PillSelector } from '../src/components/ui';
import { EnvironmentChart } from '../src/components/EnvironmentChart';
import type { ScreenName } from '../src/types';
import { useDashboardStats, useLatestClimates, useHistoricalClimates } from '../src/hooks';

const TREND_UNITS: Record<'tempc' | 'humidityrh' | 'vpd', string> = {
  tempc: '°C',
  humidityrh: '%',
  vpd: 'kPa',
};
const TREND_COLORS: Record<'tempc' | 'humidityrh' | 'vpd', string> = {
  tempc: colors.warning,
  humidityrh: colors.info,
  vpd: colors.accent,
};

interface DashboardScreenProps {
  isTh: boolean;
  onNavigate: (screen: ScreenName) => void;
}

export default function DashboardScreen({ isTh, onNavigate }: DashboardScreenProps) {
  const { t } = useTranslation(isTh);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const stats = useDashboardStats();
  const climatesQuery = useLatestClimates();
  const climates = climatesQuery.data ?? [];
  const loading = stats.loading || climatesQuery.isLoading;
  const error = stats.error || (climatesQuery.error ? climatesQuery.error.message : '');

  const [trendMetric, setTrendMetric] = useState<'tempc' | 'humidityrh' | 'vpd'>('vpd');
  const [trendHours, setTrendHours] = useState<number>(24);
  const trendRoom = climates[0]?.roomname ?? '';
  const historyQuery = useHistoricalClimates(trendRoom, trendHours);

  const { cloneCount, vegCount, flowerCount, complianceRate, totalTasks, completedTasks } = stats;

  const refetchAll = useCallback(() => {
    stats.refetch();
    climatesQuery.refetch();
    historyQuery.refetch();
  }, [stats, climatesQuery, historyQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refetchAll();
    setRefreshing(false);
  }, [refetchAll]);

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <ErrorState
          message={error}
          onRetry={refetchAll}
          retryLabel={t('retry')}
        />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      {/* 4 Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('dash_clones')}</Text>
          <Text style={[styles.summaryValue, { color: colors.info }]}>{cloneCount}</Text>
          <Text style={styles.summarySub}>Dome A/B</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('dash_veg')}</Text>
          <Text style={[styles.summaryValue, { color: colors.accent }]}>{vegCount}</Text>
          <Text style={styles.summarySub}>Veg Room B</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('dash_flower')}</Text>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>{flowerCount}</Text>
          <Text style={styles.summarySub}>Flower Room 1</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('dash_gacp_rate')}</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: complianceRate >= 80 ? colors.accent : colors.warning },
            ]}
          >
            {complianceRate}%
          </Text>
          <Text style={styles.summarySub}>
            {completedTasks}/{totalTasks} {t('dash_tasks_cleared')}
          </Text>
        </View>
      </View>

      {/* Compliance Donut / Progress Card using GlassCard */}
      <GlassCard title={t('dash_compliance_title')}>
        <View style={styles.complianceRow}>
          <View style={styles.progressCircleContainer}>
            <View
              style={[
                styles.progressCircle,
                { borderColor: complianceRate >= 80 ? colors.accent : colors.warning },
              ]}
            >
              <Text style={styles.progressText}>{complianceRate}%</Text>
            </View>
          </View>
          <View style={styles.complianceDetails}>
            <Text style={styles.complianceDesc}>
              {complianceRate >= 80 ? t('dash_compliant') : t('dash_remaining')}
            </Text>
            <TouchableOpacity
              style={styles.checklistLink}
              onPress={() => onNavigate('logs')}
              accessibilityRole="button"
              accessibilityLabel={t('dash_open_checklist')}
            >
              <Text style={styles.checklistLinkText}>{t('dash_open_checklist')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GlassCard>

      {/* Climate Widgets using GlassCard */}
      <GlassCard title={t('dash_climate_title')}>
        {loading && !refreshing ? (
          <ActivityIndicator size="small" color={colors.accent} style={styles.loader} />
        ) : climates.length === 0 ? (
          <Text style={styles.emptyText}>{t('empty_list')}</Text>
        ) : (
          climates.map((c) => (
            <View key={c.roomname} style={styles.climateRow}>
              <View style={styles.roomNameCol}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        c.vpd >= 0.8 && c.vpd <= 1.2 ? colors.accent : colors.warning,
                    },
                  ]}
                />
                <Text style={styles.roomName}>{c.roomname}</Text>
              </View>
              <View style={styles.climateValues}>
                <Text style={styles.climateValText}>
                  {c.tempc.toFixed(1)}°C | {c.humidityrh.toFixed(1)}% RH
                </Text>
                <Text
                  style={[
                    styles.vpdBadge,
                    {
                      color: c.vpd >= 0.8 && c.vpd <= 1.2 ? colors.accent : colors.warning,
                    },
                  ]}
                >
                  {c.vpd.toFixed(2)} kPa
                </Text>
              </View>
            </View>
          ))
        )}
      </GlassCard>

      {/* Environment Trend Chart */}
      <GlassCard title={t('dash_trend_title')}>
        <PillSelector
          options={[
            { value: 'tempc', label: t('dash_trend_temp') },
            { value: 'humidityrh', label: t('dash_trend_rh') },
            { value: 'vpd', label: t('dash_trend_vpd') },
          ]}
          selectedValue={trendMetric}
          onChange={(v) => setTrendMetric(v as typeof trendMetric)}
        />
        <PillSelector
          options={[
            { value: '6', label: t('dash_trend_6h') },
            { value: '24', label: t('dash_trend_24h') },
            { value: '168', label: t('dash_trend_7d') },
          ]}
          selectedValue={String(trendHours)}
          onChange={(v) => setTrendHours(Number(v))}
        />
        {historyQuery.isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={styles.loader} />
        ) : (
          <EnvironmentChart
            data={historyQuery.data ?? []}
            metric={trendMetric}
            unit={TREND_UNITS[trendMetric]}
            color={TREND_COLORS[trendMetric]}
            decimals={trendMetric === 'humidityrh' ? 0 : trendMetric === 'vpd' ? 2 : 1}
          />
        )}
      </GlassCard>

      {/* Main GACP Quick Action Shortcuts */}
      <View style={styles.shortcutGrid}>
        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => onNavigate('nutrients')}
          accessibilityRole="button"
          accessibilityLabel={t('dash_nutrients_shortcut')}
        >
          <Text style={styles.shortcutIcon}>🧪</Text>
          <Text style={styles.shortcutTitle}>{t('dash_nutrients_shortcut')}</Text>
          <Text style={styles.shortcutDesc}>Log Feed and pH/EC Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutBtn}
          onPress={() => onNavigate('plants_directory')}
          accessibilityRole="button"
          accessibilityLabel={t('dash_plants_shortcut')}
        >
          <Text style={styles.shortcutIcon}>🏷️</Text>
          <Text style={styles.shortcutTitle}>{t('dash_plants_shortcut')}</Text>
          <Text style={styles.shortcutDesc}>QR Code Plant Directory</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.xxl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.extrabold,
    marginVertical: spacing.xs,
    fontFamily: 'monospace',
  },
  summarySub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  progressCircleContainer: {
    marginRight: spacing.xl,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
  },
  complianceDetails: {
    flex: 1,
  },
  complianceDesc: {
    color: colors.text,
    fontSize: fontSize.md,
    lineHeight: 18,
    marginBottom: 6,
  },
  checklistLink: {
    alignSelf: 'flex-start',
  },
  checklistLinkText: {
    color: colors.accent,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  climateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  roomNameCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  roomName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  climateValues: {
    alignItems: 'flex-end',
  },
  climateValText: {
    color: colors.text,
    fontSize: fontSize.body,
    fontFamily: 'monospace',
  },
  vpdBadge: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  shortcutGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shortcutBtn: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  shortcutIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  shortcutTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  shortcutDesc: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  loader: {
    marginVertical: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
});
