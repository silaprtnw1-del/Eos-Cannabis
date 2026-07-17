import PlantDirectoryScreen from '../../screens/PlantDirectoryScreen';
import { useAuthStore } from '../../src/stores/authStore';
import { useIsTh } from '../../src/stores/i18nStore';

export default function PlantsRoute() {
  const isTh = useIsTh();
  const session = useAuthStore((s) => s.session);
  const userRole = useAuthStore((s) => s.userRole);
  if (!session) return null;
  return (
    <PlantDirectoryScreen isTh={isTh} operatorId={session.user.id} userRole={userRole} />
  );
}
