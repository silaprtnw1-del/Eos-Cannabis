import React, { useState } from 'react';
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
} from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight, commonStyles } from '../src/constants/theme';
import { useTranslation } from '../src/constants/i18n';
import { GlassCard, EmptyState } from '../src/components/ui';
import { sanitizeAuthError } from '../src/constants/errors';
import { useUsers, useRegisterOperator, useSetUserActive, useCreateActionLog } from '../src/hooks';
import type { UserRole } from '../src/types';

interface UserManagementScreenProps {
  isTh: boolean;
  operatorId: string;
}

export default function UserManagementScreen({ isTh, operatorId }: UserManagementScreenProps) {
  const { t } = useTranslation(isTh);
  const usersQuery = useUsers();
  const registerOperator = useRegisterOperator();
  const setUserActive = useSetUserActive();
  const createActionLog = useCreateActionLog();
  const usersList = usersQuery.data ?? [];
  const loading = usersQuery.isLoading;

  // Form states for creating new staff
  const [newFullName, setNewFullName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('OPERATOR');
  const [registering, setRegistering] = useState<boolean>(false);

  const handleRegisterUser = async () => {
    const trimmedEmail = newEmail.trim();
    const trimmedFullName = newFullName.trim();
    const trimmedPhone = newPhone.trim();

    if (!trimmedEmail || !newPassword.trim() || !trimmedFullName || !trimmedPhone) {
      Alert.alert(isTh ? 'กรุณากรอกข้อมูลให้ครบถ้วน' : 'Please fill all fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(isTh ? 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters');
      return;
    }

    setRegistering(true);
    try {
      await registerOperator.mutateAsync({
        email: trimmedEmail,
        password: newPassword,
        fullName: trimmedFullName,
        role: newRole,
        phone: trimmedPhone,
      });

      Alert.alert(
        isTh ? 'ลงทะเบียนสำเร็จ' : 'Registration Successful',
        isTh
          ? `ลงทะเบียนพนักงาน ${trimmedFullName} เรียบร้อยแล้ว`
          : `Operator ${trimmedFullName} registered successfully.`
      );

      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewPhone('');
      setNewRole('OPERATOR');
    } catch (e: any) {
      Alert.alert(
        isTh ? 'การลงทะเบียนล้มเหลว' : 'Registration Failed',
        sanitizeAuthError(e, isTh)
      );
    } finally {
      setRegistering(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    if (userId === operatorId) {
      Alert.alert(
        isTh ? 'ข้อผิดพลาด' : 'Error',
        isTh ? 'คุณไม่สามารถปิดใช้งานบัญชีของตนเองได้' : 'You cannot deactivate your own account.'
      );
      return;
    }

    Alert.alert(
      isTh ? 'ยืนยันการเปลี่ยนสถานะ' : 'Confirm Status Change',
      isTh
        ? `คุณต้องการ ${currentActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'} บัญชีผู้ใช้นี้ใช่หรือไม่?`
        : `Are you sure you want to ${currentActive ? 'deactivate' : 'activate'} this user account?`,
      [
        { text: isTh ? 'ยกเลิก' : 'Cancel', style: 'cancel' },
        {
          text: isTh ? 'ยืนยัน' : 'Confirm',
          onPress: async () => {
            try {
              await setUserActive.mutateAsync({ userId, isActive: !currentActive });

              // No DB trigger covers user status changes (verified in Step 0)
              // — this manual audit log insert is the only record of it.
              await createActionLog.mutateAsync({
                actiontype: currentActive ? 'DEACTIVATE_USER' : 'ACTIVATE_USER',
                operatorid: operatorId,
                targettype: 'USER',
                targetid: userId,
                details: { status: !currentActive },
              });

              Alert.alert(t('confirm'), isTh ? 'เปลี่ยนสถานะผู้ใช้สำเร็จ' : 'User status updated successfully.');
            } catch (e: any) {
              Alert.alert(
                t('error'),
                isTh ? 'ไม่สามารถเปลี่ยนสถานะผู้ใช้ได้' : 'Failed to update user status.'
              );
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Register Form */}
        <GlassCard title={isTh ? '👥 ลงทะเบียนผู้ปฏิบัติงานใหม่' : '👥 Register New Operator'}>
          <View style={commonStyles.inputContainer}>
            <Text style={commonStyles.inputLabel}>{isTh ? 'ชื่อ-นามสกุล' : 'Full Name'}</Text>
            <TextInput
              style={commonStyles.textInputFull}
              value={newFullName}
              onChangeText={setNewFullName}
              placeholder="e.g. Sila Somdee"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Full name"
            />
          </View>

          <View style={commonStyles.inputContainer}>
            <Text style={commonStyles.inputLabel}>{isTh ? 'อีเมล' : 'Email Address'}</Text>
            <TextInput
              style={commonStyles.textInputFull}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="operator@apn-farm.com"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Email Address"
            />
          </View>

          <View style={commonStyles.inputContainer}>
            <Text style={commonStyles.inputLabel}>{isTh ? 'เบอร์โทรศัพท์ (ไม่ซ้ำ)' : 'Phone Number (Unique)'}</Text>
            <TextInput
              style={commonStyles.textInputFull}
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
              placeholder="0812345678"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Phone Number"
            />
          </View>

          <View style={commonStyles.inputContainer}>
            <Text style={commonStyles.inputLabel}>{isTh ? 'รหัสผ่าน' : 'Password'}</Text>
            <TextInput
              style={commonStyles.textInputFull}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="Minimum 6 characters"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Password"
            />
          </View>

          <View style={styles.inputContainerCompact}>
            <Text style={commonStyles.inputLabel}>{isTh ? 'บทบาทหน้าที่' : 'Role'}</Text>
            <View style={styles.roleGrid}>
              {(['OPERATOR', 'SUPERVISOR', 'ADMIN'] as const).map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleBtn, newRole === r && styles.roleBtnActive]}
                  onPress={() => setNewRole(r)}
                  accessibilityRole="button"
                  accessibilityLabel={`Role ${r}`}
                >
                  <Text style={[styles.roleBtnText, newRole === r && styles.roleBtnTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleRegisterUser}
            disabled={registering}
            accessibilityRole="button"
            accessibilityLabel="Register operator"
          >
            <Text style={styles.submitBtnText}>
              {registering ? (isTh ? 'กำลังบันทึก...' : 'Registering...') : (isTh ? '💾 ลงทะเบียนพนักงาน' : '💾 Register Operator')}
            </Text>
          </TouchableOpacity>
        </GlassCard>

        <View style={{ height: 20 }} />

        {/* Users List */}
        <GlassCard title={isTh ? '📋 รายชื่อพนักงานทั้งหมด' : '📋 All Registered Staff'}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginVertical: 20 }} />
          ) : usersList.length === 0 ? (
            <EmptyState title={t('empty_list')} />
          ) : (
            usersList.map((usr) => (
              <View key={usr.id} style={styles.userRow}>
                <View style={styles.userInfo}>
                  <View style={styles.userNameRow}>
                    <View style={[styles.statusDot, usr.isactive ? styles.statusActive : styles.statusInactive]} />
                    <Text style={styles.userFullNameText}>{usr.fullname}</Text>
                  </View>
                  <Text style={styles.userDetailText}>{usr.username}</Text>
                  {usr.phone && <Text style={styles.userDetailText}>📞 {usr.phone}</Text>}
                  <Text style={styles.userRoleTag}>{usr.role}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, usr.isactive ? styles.actionBtnDeactivate : styles.actionBtnActivate]}
                  onPress={() => handleToggleUserStatus(usr.id, usr.isactive)}
                  accessibilityRole="button"
                  accessibilityLabel={`Toggle status for ${usr.fullname}`}
                >
                  <Text style={[styles.actionBtnText, usr.isactive ? styles.actionTextDeactivate : styles.actionTextActivate]}>
                    {usr.isactive ? (isTh ? 'ปิดใช้งาน' : 'Deactivate') : (isTh ? 'เปิดใช้งาน' : 'Activate')}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  inputContainerCompact: {
    marginBottom: spacing.lg,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  roleBtn: {
    flex: 1,
    minWidth: 90,
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
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  roleBtnTextActive: {
    color: colors.accent,
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submitBtnText: {
    color: colors.textOnAccent,
    fontSize: fontSize.md,
    fontWeight: fontWeight.extrabold,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  userInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: colors.accent, // neon green
  },
  statusInactive: {
    backgroundColor: colors.danger, // red
  },
  userFullNameText: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  userDetailText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  userRoleTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.sm,
    color: colors.text,
    fontSize: 10,
    fontWeight: fontWeight.bold,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 6,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  actionBtnDeactivate: {
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderColor: colors.dangerBorder,
  },
  actionBtnActivate: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderColor: colors.accent,
  },
  actionBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  actionTextDeactivate: {
    color: colors.danger,
  },
  actionTextActivate: {
    color: colors.accent,
  },
});
