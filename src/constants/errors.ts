/**
 * Map Supabase auth errors to friendly Thai/English strings.
 * Raw error.message often leaks schema/RLS internals and is not safe
 * to surface to end users.
 */

export interface LocalizedMessage {
  th: string;
  en: string;
}

const AUTH_ERROR_MAP: Record<string, LocalizedMessage> = {
  'Invalid login credentials': {
    th: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    en: 'Invalid email or password.',
  },
  'Email not confirmed': {
    th: 'อีเมลยังไม่ได้รับการยืนยัน กรุณาติดต่อผู้ดูแล',
    en: 'Email not confirmed. Contact an administrator.',
  },
  'User already registered': {
    th: 'อีเมลนี้ลงทะเบียนแล้ว',
    en: 'This email is already registered.',
  },
  'Password should be at least 6 characters': {
    th: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร',
    en: 'Password must be at least 6 characters.',
  },
};

const GENERIC_AUTH_ERROR: LocalizedMessage = {
  th: 'ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้ง',
  en: 'Unable to sign in. Please try again.',
};

export function sanitizeAuthError(err: unknown, isTh: boolean): string {
  const raw = (err as any)?.message ?? '';
  for (const key of Object.keys(AUTH_ERROR_MAP)) {
    if (raw.includes(key)) {
      return isTh ? AUTH_ERROR_MAP[key].th : AUTH_ERROR_MAP[key].en;
    }
  }
  return isTh ? GENERIC_AUTH_ERROR.th : GENERIC_AUTH_ERROR.en;
}
