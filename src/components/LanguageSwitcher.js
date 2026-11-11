import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const id = useId();
  const language = i18n.resolvedLanguage === 'en' ? 'en' : 'es';

  return (
    <div className="mx-1 shrink-0 sm:mx-2">
      <label htmlFor={id} className="sr-only">{t('language.label')}</label>
      <select
        id={id}
        value={language}
        onChange={(event) => i18n.changeLanguage(event.target.value)}
        className="focus-ring h-11 rounded-lg border-2 border-brand-dark bg-surface px-2 text-base font-bold text-ink"
      >
        <option value="es" lang="es">{t('language.spanish')}</option>
        <option value="en" lang="en">{t('language.english')}</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;
