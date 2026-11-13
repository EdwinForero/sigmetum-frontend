import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BUTTON_PRINCIPAL_CLASS } from '../components/ButtonPrincipal.js';
import Reveal from '../components/Reveal.js';

const NotFound = () => {
  const { t } = useTranslation();

  return (
    <Reveal className="page-container py-section text-center">
      <h1 className="text-4xl md:text-5xl font-bold leading-tight text-brand-deep">404</h1>
      <p className="mx-auto mt-stack max-w-prose text-ink">{t('notFound.content')}</p>
      <Link to="/" className={`${BUTTON_PRINCIPAL_CLASS} mt-stack-lg`}>{t('notFound.returnButton')}</Link>
    </Reveal>
  );
};

export default NotFound;
