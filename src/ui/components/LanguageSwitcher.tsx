import type { LanguageCode } from '../../domain/types';
import { useGameStore } from '../../state/game-store-context';
import { useUiStore } from '../../state/ui-store-context';

export function LanguageSwitcher() {
  const { language, t } = useUiStore();
  const { changeLanguage, isLoading } = useGameStore();

  const handleChange = (nextLanguage: LanguageCode) => {
    void changeLanguage(nextLanguage);
  };

  return (
    <div className="language-switcher">
      <p>{t('options.language')}</p>
      <div className="language-switcher__choices" aria-label={t('options.language')}>
        <button
          aria-label={t('options.english')}
          className={language === 'en' ? 'is-selected' : ''}
          disabled={isLoading}
          type="button"
          onClick={() => handleChange('en')}
        >
          <span aria-hidden="true">{t('options.englishCode')}</span>
          <strong>{t('options.english')}</strong>
        </button>
        <button
          aria-label={t('options.french')}
          className={language === 'fr' ? 'is-selected' : ''}
          disabled={isLoading}
          type="button"
          onClick={() => handleChange('fr')}
        >
          <span aria-hidden="true">{t('options.frenchCode')}</span>
          <strong>{t('options.french')}</strong>
        </button>
      </div>
    </div>
  );
}
