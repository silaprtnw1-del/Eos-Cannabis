import SopLogsScreen from '../../screens/SopLogsScreen';
import { useAuthStore } from '../../src/stores/authStore';
import { useIsTh } from '../../src/stores/i18nStore';

export default function LogsRoute() {
  const isTh = useIsTh();
  const session = useAuthStore((s) => s.session);
  const userRole = useAuthStore((s) => s.userRole);
  if (!session) return null;
  return <SopLogsScreen isTh={isTh} operatorId={session.user.id} userRole={userRole} />;
}
