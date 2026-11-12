import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LogoLink from './LogoLink';
import { assetUrl } from '../config/assets';
import { UNIVERSITIES } from '../config/institutions';

const H2 = 'text-xl font-bold leading-tight text-surface';
const linkClass = 'focus-ring inline-flex min-h-11 items-center rounded-lg text-base font-normal leading-normal text-surface hover:underline';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ink text-surface">
      <div className="page-container py-section grid gap-stack-xl md:grid-cols-[2fr_1fr_1fr]">
        <section>
          <h2 className={H2}>{t('footer.institutionsTitle')}</h2>
          {/* Una sola placa clara para los cinco logos: sobre bg-ink cinco chips sueltos serían ruido. */}
          <div className="mt-stack rounded-xl bg-surface p-stack">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] justify-items-center gap-stack">
              {UNIVERSITIES.map(({ id, url, asset }) => (
                <LogoLink key={id} href={url} src={assetUrl(asset)} alt={t(`institutions.${id}`)} />
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className={H2}>{t('footer.contactTitle')}</h2>
          <p className="mt-stack text-base text-surface whitespace-pre-line">{t('home.locationContent')}</p>
          <Link to="/#contacto" className={`${linkClass} mt-stack-sm underline`}>{t('footer.contactFormLink')}</Link>
        </section>

        <div>
          <h2 className={H2}>{t('footer.linksTitle')}</h2>
          <ul className="mt-stack grid grid-cols-2 gap-x-stack md:grid-cols-1">
            <li><Link to="/" className={linkClass}>{t('footer.homeOption')}</Link></li>
            <li><Link to="/explorar" className={linkClass}>{t('footer.exploreOption')}</Link></li>
            <li><Link to="/galeria" className={linkClass}>{t('footer.galleryOption')}</Link></li>
            <li><Link to="/sobre-nosotros" className={linkClass}>{t('footer.aboutUsOption')}</Link></li>
            <li><Link to="/cookies" className={linkClass}>{t('footer.cookies')}</Link></li>
          </ul>
        </div>

        <div className="flex flex-col gap-stack-sm border-t border-moss pt-stack sm:flex-row sm:items-center md:col-span-3">
          <p className="text-base leading-normal">&copy; {t('footer.copyright', { currentYear })}</p>
          <details>
            <summary className="focus-ring list-item font-bold min-h-11 cursor-pointer px-stack-sm py-2.5">V 1.0.0</summary>
            <p className="rounded-lg bg-surface p-stack-sm text-ink">{t('ee')}</p>
          </details>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
