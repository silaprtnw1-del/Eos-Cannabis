import { Redirect } from 'expo-router';
import UserManagementScreen from '../../screens/UserManagementScreen';
import { useAuthStore } from '../../src/stores/authStore';
import { useIsTh } from '../../src/stores/i18nStore';

export default function UsersRoute() {
  const isTh = useIsTh();
  const session = useAuthStore((s) => s.session);
  const userRole = useAuthStore((s) => s.userRole);
  if (!session) return null;
  if (userRole !== 'ADMIN') return <Redirect href="/(tabs)" />;
  return <UserManagementScreen isTh={isTh} operatorId={session.user.id} />;
}
