import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '../supabase';
import { colors, spacing, radius, fontSize, fontWeight } from '../src/constants/theme';
import { useTranslation } from '../src/constants/i18n';
import { GlassCard, ErrorState } from '../src/components/ui';
import type { ClimateMetric, ScreenName } from '../src/types';

interface DashboardScreenProps {
  isTh: boolean;
  onNavigate: (screen: ScreenName) => void;
}

export default function DashboardScreen({ isTh, onNavigate }: DashboardScreenProps) {
  const { t } = useTranslation(isTh);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Count states from plants table
  const [cloneCount, setCloneCount] = useState<number>(0);
  const [vegCount, setVegCount] = useState<number>(0);
  const [flowerCount, setFlowerCount] = useState<number>(0);

  // Compliance Rate of today
  const [complianceRate, setComplianceRate] = useState<number>(0);
  const [totalTasks, setTotalTasks] = useState<number>(5);
  const [completedTasks, setCompletedTasks] = useState<number>(0);

  // Climate data
  const [climates, setClimates] = useState<ClimateMetric[]>([]);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    }
    setError('');
    try {
      // 1. Fetch plants counts by stage
      const { data: plants, error: plantsError } = await supabase
        .from('plants')
        .select('stage');

      if (plantsError) throw plantsError;

      let clones = 0;
      let vegs = 0;
      let flowers = 0;

      (plants || []).forEach((p) => {
        if (p.stage === 'CLONE') clones++;
        else if (p.stage === 'VEG') vegs++;
        else if (p.stage === 'FLOWER') flowers++;
      });

      setCloneCount(clones);
      setVegCount(vegs);
      setFlowerCount(flowers);

      // 2. Fetch today's GACP Compliance Checklist (using lowercase checkdate)
      const today = new Date().toISOString().split('T')[0];
      const { data: checklist, error: checkError } = await supabase
        .from('gacp_compliance_checklists')
        .select('tasks')
        .eq('checkdate', today)
        .maybeSingle();

      if (checkError) throw checkError;

      if (checklist && checklist.tasks) {
        const tasksObj = checklist.tasks as Record<string, boolean>;
        const keys = Object.keys(tasksObj);
        const completed = keys.filter((k) => tasksObj[k]).length;
        setTotalTasks(keys.length || 5);
        setCompletedTasks(completed);
        setComplianceRate(keys.length > 0 ? Math.round((completed / keys.length) * 100) : 0);
      } else {
        setComplianceRate(0);
        setCompletedTasks(0);
        setTotalTasks(5);
      }

      // 3. Fetch latest environmental log for Cloning, Veg, Flower rooms (using lowercase columns)
      const { data: envLogs, error: envError } = await supabase
        .from('environmental_logs')
        .select('roomname, tempc, humidityrh, vpd')
        .order('recordedat', { ascending: false });

      if (envError) throw envError;

      // Group by roomname and get the most recent one
      const latestRooms: Record<string, ClimateMetric> = {};
      (envLogs || []).forEach((log) => {
        if (!latestRooms[log.roomname]) {
          latestRooms[log.roomname] = {
            roomname: log.roomname,
            tempc: log.tempc,
            humidityrh: log.humidityrh,
            vpd: log.vpd || 0,
          };
        }
      });

      setClimates(Object.values(latestRooms));
    } catch (e: any) {
      console.warn('Dashboard Fetch Error:', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (error && !refreshing) {
    return (
      <View style={styles.errorContainer}>
        <ErrorState
          message={error}
          onRetry={() => fetchDashboardData(false)}
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
