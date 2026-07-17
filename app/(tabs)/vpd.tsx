import VpdCalculatorScreen from '../../screens/VpdCalculatorScreen';
import { useIsTh } from '../../src/stores/i18nStore';

export default function VpdRoute() {
  const isTh = useIsTh();
  return <VpdCalculatorScreen isTh={isTh} />;
}
