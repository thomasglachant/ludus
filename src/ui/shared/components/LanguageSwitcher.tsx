import './language-switcher.css';
import type { LanguageCode } from '@/domain/types';
import { useGameStore } from '@/state/game-store-context';
import { useUiStore } from '@/state/ui-store-context';
import { SegmentedControl } from '@/ui/shared/ludus/SegmentedControl';

export function LanguageSwitcher() {
  const { language, t } = useUiStore();
  const { changeLanguage, isLoading } = useGameStore();

  const handleChange = (nextLanguage: LanguageCode) => {
    void changeLanguage(nextLanguage);
  };

  return (
    <div className="language-switcher">
      <p>{t('options.language')}</p>
      <SegmentedControl
        ariaLabel={t('options.language')}
        className="language-switcher__choices"
        items={[
          {
            disabled: isLoading,
            label: (
              <>
                <span aria-hidden="true" className="language-switcher__flag">
                  🇬🇧
                </span>
                <strong>{t('options.english')}</strong>
              </>
            ),
            value: 'en',
          },
          {
            disabled: isLoading,
            label: (
              <>
                <span aria-hidden="true" className="language-switcher__flag">
                  🇫🇷
                </span>
                <strong>{t('options.french')}</strong>
              </>
            ),
            value: 'fr',
          },
        ]}
        value={language}
        onValueChange={handleChange}
      />
    </div>
  );
}
