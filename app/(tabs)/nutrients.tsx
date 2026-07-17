import NutrientCalculatorScreen from '../../screens/NutrientCalculatorScreen';
import { useAuthStore } from '../../src/stores/authStore';
import { useIsTh } from '../../src/stores/i18nStore';

export default function NutrientsRoute() {
  const isTh = useIsTh();
  const session = useAuthStore((s) => s.session);
  if (!session) return null;
  return <NutrientCalculatorScreen isTh={isTh} operatorId={session.user.id} />;
}
