import { useUiStore } from '@/state/ui-store-context';
import { NewGameModal } from './NewGameModal';

export function NewGameScreen() {
  const { navigate } = useUiStore();

  return (
    <NewGameModal
      onClose={() => {
        navigate('mainMenu');
      }}
    />
  );
}
