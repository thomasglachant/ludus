import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AppModal } from './AppModal';

interface OptionsModalProps {
  onBack?(): void;
  onClose(): void;
}

export function OptionsModal({ onBack, onClose }: OptionsModalProps) {
  return (
    <AppModal
      size="md"
      testId="options-modal"
      titleKey="options.title"
      onBack={onBack}
      onClose={onClose}
    >
      <div className="settings-panel">
        <LanguageSwitcher />
      </div>
    </AppModal>
  );
}
