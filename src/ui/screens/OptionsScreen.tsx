import { ArrowLeft } from 'lucide-react';
import { useUiStore } from '../../state/ui-store';
import { ActionButton } from '../components/ActionButton';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ScreenShell } from '../layout/ScreenShell';

export function OptionsScreen() {
  const { navigate, t } = useUiStore();

  return (
    <ScreenShell titleKey="options.title">
      <div className="settings-panel">
        <h2>{t('options.language')}</h2>
        <LanguageSwitcher />
      </div>
      <div className="form-actions">
        <ActionButton
          icon={<ArrowLeft aria-hidden="true" size={18} />}
          label={t('common.back')}
          onClick={() => navigate('mainMenu')}
        />
      </div>
    </ScreenShell>
  );
}
