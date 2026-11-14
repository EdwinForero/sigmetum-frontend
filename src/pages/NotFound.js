import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BUTTON_PRINCIPAL_CLASS } from '../components/ButtonPrincipal.js';
import Reveal from '../components/Reveal.js';
import { PAGE, H1, PROSE } from '../utilities/contentStyles.js';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <Reveal className={`${PAGE} text-center`}>
      <h1 className={H1}>404</h1>
      <p className={`${PROSE} mx-auto mt-stack-lg`}>{t('notFound.content')}</p>
      <Link to="/" className={`${BUTTON_PRINCIPAL_CLASS} mt-stack-lg`}>{t('notFound.returnButton')}</Link>
    </Reveal>
  );
};

export default NotFound;
