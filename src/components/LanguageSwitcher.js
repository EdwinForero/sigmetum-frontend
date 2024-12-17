import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ButtonAlternative from './ButtonAlternative';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [dropdownOptions, setDropdownOptions] = useState([]);
  const initialLanguage = i18n.language.startsWith('en') ? 'EN' : 'ES';
  const [language, setLanguage] = useState(initialLanguage);

  useEffect(() => {
    setDropdownOptions([
      {label: t('language.spanish'), value: "ES"},
      {label: t('language.english'), value: "EN"}
    ]);
  }, [t]);

  const changeLanguage = (selectedOption) => {
    const langCode = selectedOption.label.includes(t('language.spanish')) ? "es" : "en";
    setLanguage(selectedOption.value);
    i18n.changeLanguage(langCode);
  };

  const getButtonText = (selectedOption) => {
    if (selectedOption) {
      return selectedOption.value;
    }
  };

  return (
    <ButtonAlternative
      text={dropdownOptions.find((selectedOption) => selectedOption.value === language)}
      dropdownOptions={dropdownOptions}
      onOptionSelect={changeLanguage}
      getButtonText={getButtonText}
      className={"mx-2"}
    />
  );
};

export default LanguageSwitcher;