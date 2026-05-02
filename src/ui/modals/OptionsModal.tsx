import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AppModal } from './AppModal';

interface OptionsModalProps {
  isActive?: boolean;
  onBack?(): void;
  onClose(): void;
}

export function OptionsModal({ isActive, onBack, onClose }: OptionsModalProps) {
  return (
    <AppModal
      isActive={isActive}
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
