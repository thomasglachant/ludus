import './language-switcher.css';
import { useId } from 'react';
import type { LanguageCode } from '@/domain/types';
import { useGameStore } from '@/state/game-store-context';
import { useUiStore } from '@/state/ui-store-context';
import { RadioGroup, RadioGroupIndicator, RadioGroupItem } from '@/ui/shared/primitives/RadioGroup';

const languageOptions: Array<{
  codeKey: string;
  labelKey: string;
  value: LanguageCode;
}> = [
  {
    codeKey: 'options.englishCode',
    labelKey: 'options.english',
    value: 'en',
  },
  {
    codeKey: 'options.frenchCode',
    labelKey: 'options.french',
    value: 'fr',
  },
];

export function LanguageSwitcher() {
  const { language, t } = useUiStore();
  const { changeLanguage, isLoading } = useGameStore();
  const labelId = useId();

  const handleChange = (nextLanguage: LanguageCode) => {
    void changeLanguage(nextLanguage);
  };

  return (
    <section className="language-switcher">
      <h2 id={labelId}>{t('options.language')}</h2>
      <RadioGroup
        aria-labelledby={labelId}
        className="language-switcher__choices"
        value={language}
        onValueChange={(nextLanguage) => {
          if (nextLanguage === 'en' || nextLanguage === 'fr') {
            handleChange(nextLanguage);
          }
        }}
      >
        {languageOptions.map((option) => {
          const optionId = `${labelId}-${option.value}`;

          return (
            <label className="language-switcher__option" htmlFor={optionId} key={option.value}>
              <RadioGroupItem
                className="language-switcher__radio"
                disabled={isLoading}
                id={optionId}
                value={option.value}
              >
                <RadioGroupIndicator className="language-switcher__indicator" />
              </RadioGroupItem>
              <span className="language-switcher__copy">
                <strong>{t(option.labelKey)}</strong>
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </section>
  );
}
