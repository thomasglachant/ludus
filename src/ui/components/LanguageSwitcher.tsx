import { Languages } from 'lucide-react';
import type { LanguageCode } from '../../domain/types';
import { useGameStore } from '../../state/game-store';
import { useUiStore } from '../../state/ui-store';

export function LanguageSwitcher() {
  const { language, t } = useUiStore();
  const { changeLanguage, isLoading } = useGameStore();

  const handleChange = (nextLanguage: LanguageCode) => {
    void changeLanguage(nextLanguage);
  };

  return (
    <div className="language-switcher" aria-label={t('options.language')}>
      <Languages aria-hidden="true" size={18} />
      <div className="segmented-control">
        <button
          className={language === 'en' ? 'is-selected' : ''}
          disabled={isLoading}
          type="button"
          onClick={() => handleChange('en')}
        >
          {t('options.english')}
        </button>
        <button
          className={language === 'fr' ? 'is-selected' : ''}
          disabled={isLoading}
          type="button"
          onClick={() => handleChange('fr')}
        >
          {t('options.french')}
        </button>
      </div>
    </div>
  );
}
