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
        password: password,
      });

      if (error) throw error;
      if (data.session) {
        await fetchUserRoleAndProceed(data.session);
      }
    } catch (e: any) {
      Alert.alert(t('login_auth_error'), e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    handleSignIn();
  };

  const fetchUserRoleAndProceed = async (session: Session) => {
    try {
      const { user } = session;
      let { data: profile, error } = await supabase
        .from('users')
        .select('role, fullname')
        .eq('id', user.id)
        .single();
      
      if (error || !profile) {
        profile = {
          role: user.user_metadata?.role || 'OPERATOR',
          fullname: user.user_metadata?.fullName || 'Operator',
        };
      }

      onLoginSuccess(session, profile.role, profile.fullname);
    } catch (err) {
      onLoginSuccess(session, 'OPERATOR', 'Operator');
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
          <Text style={styles.brandSubtitle}>
            {t('login_brand')}
          </Text>

          <Text style={styles.formTitle}>
            {isSignUp ? (isTh ? 'ลงทะเบียนผู้ใช้งาน' : 'Register Account') : t('login_title')}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('login_email_label')}</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="email@apn-farm.com"
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
              onSubmitEditing={() => {
                if (isSignUp) {
                  fullNameInputRef.current?.focus();
                } else {
                  passwordInputRef.current?.focus();
                }
              }}
              blurOnSubmit={false}
              accessibilityLabel={t('login_email_label')}
              accessibilityHint="Enter your employee email address"
            />
          </View>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{isTh ? 'ชื่อ-นามสกุล' : 'Full Name'}</Text>
              <TextInput
                ref={fullNameInputRef}
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder={isTh ? 'สมชาย ใจดี' : 'John Doe'}
                placeholderTextColor={colors.textMuted}
                returnKeyType="next"
                onSubmitEditing={() => phoneInputRef.current?.focus()}
                blurOnSubmit={false}
                accessibilityLabel="Full name input"
              />
            </View>
          )}

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{isTh ? 'เบอร์โทรศัพท์ (ไม่ซ้ำ)' : 'Phone Number (Unique)'}</Text>
              <TextInput
                ref={phoneInputRef}
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="0812345678"
                placeholderTextColor={colors.textMuted}
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                blurOnSubmit={false}
                accessibilityLabel="Phone number input"
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('login_password_label')}</Text>
            <TextInput
              ref={passwordInputRef}
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              accessibilityLabel={t('login_password_label')}
              accessibilityHint="Enter your password"
            />
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? 'Register' : t('login_submit')}
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.textOnAccent} />
            ) : (
              <Text style={styles.submitBtnText}>
                {isSignUp ? (isTh ? 'ลงทะเบียน' : 'Register') : t('login_submit')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Toggle login signup mode"
          >
            <Text style={styles.toggleBtnText}>
              {isSignUp
                ? (isTh ? 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ' : 'Already have an account? Sign In')
                : (isTh ? 'ลงทะเบียนผู้ใช้ใหม่ (Sign Up)' : 'Create New Account (Sign Up)')}
            </Text>
          </TouchableOpacity>

          <Text style={styles.noteText}>
            {t('login_restricted')}
          </Text>
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
  toggleBtn: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  toggleBtnText: {
    color: colors.accent,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});
