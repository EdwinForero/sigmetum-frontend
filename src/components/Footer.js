import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const linkClass = 'focus-ring inline-flex min-h-11 items-center px-2 text-base font-normal leading-normal text-white hover:underline';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="flex flex-col gap-4 bg-ink px-5 py-8 text-center text-white">
      <div className="flex flex-wrap items-center justify-center gap-4 md:justify-around">
        <Link to="/" className={linkClass}>{t('footer.homeOption')}</Link>
        <Link to="/explorar" className={linkClass}>{t('footer.exploreOption')}</Link>
        <Link to="/sobre-nosotros" className={linkClass}>{t('footer.aboutUsOption')}</Link>
        <Link to="/cookies" className={linkClass}>{t('footer.cookies')}</Link>
      </div>
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <p className="text-base leading-normal">&copy; {t('footer.copyright', { currentYear })}</p>
        <details className="text-center">
          <summary className="focus-ring list-item min-h-11 cursor-pointer px-2 py-2.5">V 1.0.0</summary>
          <p className="rounded bg-surface p-2 text-ink">{t('ee')}</p>
        </details>
      </div>
    </footer>
  );
};

export default Footer;
