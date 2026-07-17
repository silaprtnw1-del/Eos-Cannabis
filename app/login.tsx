import { View } from 'react-native';
import { Redirect } from 'expo-router';

import LoginScreen from '../screens/LoginScreen';
import { useAuthStore } from '../src/stores/authStore';
import { useIsTh } from '../src/stores/i18nStore';
import { colors } from '../src/constants/theme';

export default function LoginRoute() {
  const session = useAuthStore((s) => s.session);
  const isTh = useIsTh();

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LoginScreen isTh={isTh} onLoginSuccess={() => { /* auth store listener handles it */ }} />
    </View>
  );
}
