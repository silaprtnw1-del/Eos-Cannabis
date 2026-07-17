import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useI18nStore } from '../../stores/i18nStore';
import { useConnectionStore } from '../../stores/connectionStore';
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/theme';

export function AppHeader() {
  const userRole = useAuthStore((s) => s.userRole);
  const userFullName = useAuthStore((s) => s.userFullName);
  const signOut = useAuthStore((s) => s.signOut);
  const isTh = useI18nStore((s) => s.isTh);
  const toggleLang = useI18nStore((s) => s.toggle);
  const dbStatus = useConnectionStore((s) => s.status);

  const statusColor =
    dbStatus === 'connected' ? colors.accent : dbStatus === 'error' ? colors.danger : colors.warning;

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>P</Text>
        </View>
        <View>
          <Text style={styles.titleText}>PHANNAPHA</Text>
          <Text style={styles.subtitleText}>
            {userFullName} ({userRole})
          </Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.langToggle} onPress={toggleLang}>
          <Text style={styles.langToggleText}>{isTh ? 'EN' : 'TH'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <Text style={styles.logoutBtnText}>🚪</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(10, 10, 12, 0.8)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    color: colors.textOnAccent,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.extrabold,
  },
  titleText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  subtitleText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: spacing.sm,
    alignSelf: 'center',
  },
  langToggle: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langToggleText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: fontWeight.bold,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtnText: { fontSize: 14 },
});
