import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { colors, spacing, radius, fontSize, fontWeight, commonStyles } from '../src/constants/theme';
import { useTranslation } from '../src/constants/i18n';
import { GlassCard, SubTabBar, EmptyState } from '../src/components/ui';
import { useChecklistsHistory, useCultivationLogs, useUpsertChecklist } from '../src/hooks';
import type { UserRole } from '../src/types';

interface SopLogsScreenProps {
  isTh: boolean;
  operatorId: string;
  userRole: UserRole;
}

export default function SopLogsScreen({ isTh, operatorId, userRole }: SopLogsScreenProps) {
  const { t } = useTranslation(isTh);
  const [activeTab, setActiveTab] = useState<string>('checklist');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const checklistsQuery = useChecklistsHistory(15);
  const logsQuery = useCultivationLogs(15);
  const upsertChecklist = useUpsertChecklist();
  const checklistsHistory = checklistsQuery.data ?? [];
  const irrigationLogs = logsQuery.data ?? [];
  const loading = checklistsQuery.isLoading || logsQuery.isLoading;

  // Daily Tasks
  const [tasks, setTasks] = useState<Record<string, boolean>>({
    hygiene_sanitized: false,
    hygiene_clothing: false,
    pest_inspected: false,
    tools_sterilized_30m: false,
    burped_curing_jars: false,
  });

  const taskLabels: Record<string, { th: string; en: string }> = {
    hygiene_sanitized: { th: 'ทำความสะอาดโต๊ะทริมและโต๊ะชำเรียบร้อย', en: 'Table & Trimming desks sanitized' },
    hygiene_clothing: { th: 'พนักงานทุกคนสวมหน้ากากและชุดฆ่าเชื้อใหม่', en: 'Staff wearing new masks & sterile suits' },
    pest_inspected: { th: 'เดินตรวจสแกนหาจุดแมลงศัตรูพืชและราแป้ง', en: 'Inspected for pests & powdery mildew' },
    tools_sterilized_30m: { th: 'ฆ่าเชื้อกรรไกรทริมและอุปกรณ์ทุก 30 นาที', en: 'Sterilized shears and tools every 30 mins' },
    burped_curing_jars: { th: 'เปิดฝาระบายแรงดันถังบ่มดอก (Burping)', en: 'Burped curing jars & logged pressure' },
  };

  // Critical Incident States
  const [hasPestIncident, setHasPestIncident] = useState<boolean>(false);
  const [incidentDetails, setIncidentDetails] = useState<string>('');
  const [correctiveAction, setCorrectiveAction] = useState<string>('');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([checklistsQuery.refetch(), logsQuery.refetch()]);
    setRefreshing(false);
  }, [checklistsQuery, logsQuery]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleToggleTask = (taskKey: string) => {
    setTasks(prev => ({ ...prev, [taskKey]: !prev[taskKey] }));
  };

  const handleSaveChecklist = async () => {
    setSaveStatus('Saving...');
    try {
      const today = new Date().toISOString().split('T')[0];

      const { queued } = await upsertChecklist.mutateAsync({
        checkdate: today,
        operatorid: operatorId,
        tasks: tasks,
        haspestincident: hasPestIncident,
        incidentdetails: hasPestIncident ? incidentDetails : null,
        correctiveaction: hasPestIncident ? correctiveAction : null,
      });

      setSaveStatus(
        queued ? (isTh ? '📥 บันทึกในเครื่อง — จะซิงค์เมื่อออนไลน์' : '📥 Saved locally — will sync when online') : t('saved_success')
      );
    } catch (e: any) {
      setSaveStatus(t('saved_failed'));
      console.warn('Save checklist error:', e.message);
    } finally {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setSaveStatus(''), 3000);
    }
  };


  const handleExportCSV = async () => {
    if (checklistsHistory.length === 0) {
      Alert.alert(
        t('sop_export_csv'),
        isTh ? 'ไม่มีบันทึกให้ส่งออก' : 'No records to export.'
      );
      return;
    }

    try {
      const escapeCsv = (val: string | number | null | undefined) => {
        const s = String(val ?? '');
        if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };

      const header = 'Date,Operator,Tasks Completed,Total Tasks,Incident Alert,Details,Action Taken';
      const rows = checklistsHistory.map((log) => {
        const completed = Object.values(log.tasks).filter(Boolean).length;
        const total = Object.keys(log.tasks).length;
        return [
          log.checkdate,
          operatorId,
          completed,
          total,
          log.haspestincident ? 'YES' : 'NO',
          log.incidentdetails || '',
          log.correctiveaction || '',
        ].map(escapeCsv).join(',');
      });
      const csv = [header, ...rows].join('\n');

      const filename = `gacp_checklists_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(
          t('sop_export_csv'),
          isTh ? 'อุปกรณ์นี้ไม่รองรับการแชร์ไฟล์' : 'Sharing is not available on this device.'
        );
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: isTh ? 'ส่งออก CSV การตรวจสอบ GACP' : 'Export GACP Checklist CSV',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (e: any) {
      console.warn('CSV export failed:', e);
      Alert.alert(
        t('sop_export_csv'),
        isTh ? 'ไม่สามารถส่งออก CSV ได้' : 'Failed to export CSV.'
      );
    }
  };

  const tabs = [
    { key: 'checklist', label: t('sop_daily_checklist') },
    { key: 'history', label: t('sop_compliance_history') },
  ];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <View style={styles.container}>
        <SubTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'checklist' ? (
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            {/* Daily Checklist Tasks Card */}
            <GlassCard title={t('sop_tasks_checklist')}>
              {Object.keys(tasks).map(taskKey => {
                const label = taskLabels[taskKey];
                const checked = tasks[taskKey];
                return (
                  <TouchableOpacity
                    key={taskKey}
                    style={[styles.taskItem, checked && styles.taskCompleted]}
                    onPress={() => handleToggleTask(taskKey)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    accessibilityLabel={isTh ? label.th : label.en}
                  >
                    <View style={styles.checkboxContainer}>
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <View style={styles.checkboxInner} />}
                      </View>
                      <Text style={[styles.taskText, checked && styles.taskTextCompleted]}>
                        {isTh ? label.th : label.en}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </GlassCard>

            {/* Critical Incident Report */}
            <GlassCard title={t('sop_critical_controls')}>
              <TouchableOpacity
                style={[styles.incidentCheckbox, hasPestIncident && styles.incidentCheckboxActive]}
                onPress={() => setHasPestIncident(!hasPestIncident)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: hasPestIncident }}
                accessibilityLabel={t('sop_pest_alert')}
              >
                <View style={[styles.checkbox, hasPestIncident && styles.checkboxAlertChecked]}>
                  {hasPestIncident && <View style={[styles.checkboxInner, { backgroundColor: colors.danger }]} />}
                </View>
                <Text style={[styles.taskText, hasPestIncident && { color: colors.danger, fontWeight: fontWeight.bold }]}>
                  {t('sop_pest_alert')}
                </Text>
              </TouchableOpacity>

              {hasPestIncident && (
                <View style={styles.incidentInputs}>
                  <View style={commonStyles.inputContainer}>
                    <Text style={commonStyles.inputLabel}>{t('sop_pest_desc')}</Text>
                    <TextInput
                      style={commonStyles.textInputFull}
                      value={incidentDetails}
                      onChangeText={setIncidentDetails}
                      placeholder="Details..."
                      placeholderTextColor={colors.textMuted}
                      accessibilityLabel={t('sop_pest_desc')}
                    />
                  </View>

                  <View style={commonStyles.inputContainer}>
                    <Text style={commonStyles.inputLabel}>{t('sop_corrective')}</Text>
                    <TextInput
                      style={commonStyles.textInputFull}
                      value={correctiveAction}
                      onChangeText={setCorrectiveAction}
                      placeholder="Corrective Action..."
                      placeholderTextColor={colors.textMuted}
                      accessibilityLabel={t('sop_corrective')}
                    />
                  </View>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveChecklist}
                accessibilityRole="button"
                accessibilityLabel={t('sop_submit_gacp')}
              >
                <Text style={styles.submitBtnText}>
                  {saveStatus ? saveStatus : t('sop_submit_gacp')}
                </Text>
              </TouchableOpacity>
            </GlassCard>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
              />
            }
          >
            {/* Export compliance logs button */}
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={handleExportCSV}
              accessibilityRole="button"
              accessibilityLabel={t('sop_export_csv')}
            >
              <Text style={styles.exportBtnText}>{t('sop_export_csv')}</Text>
            </TouchableOpacity>

            {loading && !refreshing ? (
              <ActivityIndicator size="large" color={colors.accent} style={{ marginVertical: 30 }} />
            ) : checklistsHistory.length === 0 && irrigationLogs.length === 0 ? (
              <EmptyState title={t('empty_list')} />
            ) : (
              <View>
                {/* Hygiene checklists history */}
                <GlassCard title={t('sop_hygiene_trail')}>
                  {checklistsHistory.map(log => {
                    const done = Object.values(log.tasks).filter(Boolean).length;
                    const total = Object.keys(log.tasks).length;
                    return (
                      <View key={log.id} style={styles.logItem}>
                        <View style={styles.logRowHeader}>
                          <Text style={styles.logDate}>{log.checkdate}</Text>
                          <Text style={[styles.logRate, { color: done === total ? colors.accent : colors.warning }]}>
                            {Math.round((done / total) * 100)}% Pass ({done}/{total})
                          </Text>
                        </View>
                        {log.haspestincident && (
                          <View style={styles.incidentRow}>
                            <Text style={styles.incidentAlertText}>
                              ⚠️ {isTh ? 'พบปัญหา:' : 'Incident:'} {log.incidentdetails}
                            </Text>
                            <Text style={styles.correctiveText}>
                              ➡️ {isTh ? 'แก้ไข:' : 'Action:'} {log.correctiveaction}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </GlassCard>

                {/* Feed logs history */}
                <GlassCard title={t('sop_irri_runoff_logs')}>
                  {irrigationLogs.map(log => (
                    <View key={log.id} style={styles.logItem}>
                      <View style={styles.logRowHeader}>
                        <Text style={styles.logDate}>
                          {new Date(log.logdate).toLocaleDateString()}
                        </Text>
                        <Text style={styles.roomName}>{log.roomname}</Text>
                      </View>
                      <View style={styles.irrigationStats}>
                        <Text style={styles.statLine}>Feed: {log.watervolume}L | EC In: {log.ecin.toFixed(1)} | pH In: {log.phin.toFixed(1)}</Text>
                        {log.phout && (
                          <Text style={[
                            styles.statLine, 
                            { color: log.phout < 5.5 || log.phout > 6.5 ? colors.danger : colors.textMuted },
                          ]}>
                            Runoff: {log.phout.toFixed(1)} pH Out | {log.ecout?.toFixed(1)} EC Out
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </GlassCard>
              </View>
            )}
          </ScrollView>
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
  scrollContainer: {
    paddingBottom: 40,
  },
  taskItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  taskCompleted: {
    backgroundColor: 'rgba(0, 255, 136, 0.02)',
    borderColor: 'rgba(0, 255, 136, 0.1)',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.textMuted,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: colors.accent,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  taskText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.normal,
    flex: 1,
  },
  taskTextCompleted: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  incidentCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    padding: 14,
    marginBottom: spacing.md,
  },
  incidentCheckboxActive: {
    backgroundColor: 'rgba(255, 51, 102, 0.08)',
    borderColor: colors.danger,
  },
  checkboxAlertChecked: {
    borderColor: colors.danger,
  },
  incidentInputs: {
    marginTop: spacing.sm,
  },
  inputContainerCompact: {
    marginBottom: spacing.lg,
  },
  submitBtn: {
    backgroundColor: colors.accentDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitBtnText: {
    color: colors.accent,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  exportBtn: {
    backgroundColor: colors.infoDim,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.info,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  exportBtnText: {
    color: colors.info,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  logItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingVertical: spacing.md,
  },
  logRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logDate: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  logRate: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  roomName: {
    color: colors.info,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  incidentRow: {
    marginTop: 6,
    backgroundColor: colors.dangerDim,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  incidentAlertText: {
    color: colors.danger,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
  },
  correctiveText: {
    color: colors.text,
    fontSize: fontSize.body,
    marginTop: 2,
  },
  irrigationStats: {
    marginTop: 2,
  },
  statLine: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  roleBtn: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  roleBtnText: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  roleBtnTextActive: {
    color: colors.accent,
  },
});
