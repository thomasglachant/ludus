import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { AppModal } from './AppModal';

interface OptionsModalProps {
  onClose(): void;
}

export function OptionsModal({ onClose }: OptionsModalProps) {
  return (
    <AppModal testId="options-modal" titleKey="options.title" onClose={onClose}>
      <div className="settings-panel">
        <LanguageSwitcher />
      </div>
    </AppModal>
  );
}
