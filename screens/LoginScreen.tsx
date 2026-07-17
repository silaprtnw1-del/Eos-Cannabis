import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../supabase';
import { colors, spacing, radius, fontSize, fontWeight } from '../src/constants/theme';
import { useTranslation } from '../src/constants/i18n';
import { sanitizeAuthError } from '../src/constants/errors';
import type { Session } from '../src/types';

interface LoginScreenProps {
  isTh: boolean;
  onLoginSuccess: (session: Session, role: string, fullName: string) => void;
}

export default function LoginScreen({ isTh, onLoginSuccess }: LoginScreenProps) {
  const { t } = useTranslation(isTh);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const passwordInputRef = useRef<TextInput>(null);

  const handleSignIn = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      Alert.alert(t('login_fill_fields'));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) throw error;
      if (data.session) {
        await fetchUserRoleAndProceed(data.session);
      }
    } catch (e: any) {
      Alert.alert(t('login_auth_error'), sanitizeAuthError(e, isTh));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoleAndProceed = async (session: Session) => {
    try {
      const { user } = session;
      const { data: profile, error } = await supabase
        .from('users')
        .select('role, fullname')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        // RLS denied or row missing — refuse rather than trust client-supplied metadata.
        await supabase.auth.signOut();
        Alert.alert(
          t('login_auth_error'),
          isTh
            ? 'ไม่พบบัญชีพนักงานในระบบ กรุณาติดต่อผู้ดูแล'
            : 'Operator profile not found. Contact an administrator.'
        );
        return;
      }

      onLoginSuccess(session, profile.role, profile.fullname);
    } catch (err) {
      await supabase.auth.signOut();
      Alert.alert(t('login_auth_error'), sanitizeAuthError(err, isTh));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.glassCard} accessibilityRole="none">
          <Text style={styles.brandTitle} accessibilityRole="header">APN CANNABIS</Text>
          <Text style={styles.brandSubtitle}>{t('login_brand')}</Text>

          <Text style={styles.formTitle}>{t('login_title')}</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('login_email_label')}</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="username"
              placeholder="email@apn-farm.com"
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              blurOnSubmit={false}
              accessibilityLabel={t('login_email_label')}
              accessibilityHint="Enter your employee email address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('login_password_label')}</Text>
            <TextInput
              ref={passwordInputRef}
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              accessibilityLabel={t('login_password_label')}
              accessibilityHint="Enter your password"
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSignIn}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={t('login_submit')}
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textOnAccent} />
            ) : (
              <Text style={styles.submitBtnText}>{t('login_submit')}</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.noteText}>{t('login_restricted')}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  glassCard: {
    backgroundColor: colors.cardSolid,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  brandTitle: {
    color: colors.accent,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.black,
    letterSpacing: 2,
    textAlign: 'center',
  },
  brandSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
    fontWeight: fontWeight.semibold,
    textTransform: 'uppercase',
  },
  formTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
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
    fontSize: 15,
    fontWeight: fontWeight.extrabold,
  },
  noteText: {
    color: colors.textMuted,
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 15,
  },
});
