import { useRouter } from 'expo-router';
import DashboardScreen from '../../screens/DashboardScreen';
import { useIsTh } from '../../src/stores/i18nStore';
import type { ScreenName } from '../../src/types';

export default function DashboardRoute() {
  const isTh = useIsTh();
  const router = useRouter();

  const navigateByScreenName = (screen: ScreenName) => {
    switch (screen) {
      case 'nutrients':
        router.push('/(tabs)/nutrients');
        break;
      case 'plants_directory':
        router.push('/(tabs)/plants');
        break;
      case 'logs':
        router.push('/(tabs)/logs');
        break;
      case 'vpd':
        router.push('/(tabs)/vpd');
        break;
      case 'users':
        router.push('/(tabs)/users');
        break;
      case 'dashboard':
      default:
        router.push('/(tabs)');
    }
  };

  return <DashboardScreen isTh={isTh} onNavigate={navigateByScreenName} />;
}
