import React from 'react';
import { useTranslation, Trans } from 'react-i18next';

const H2 = 'text-2xl md:text-4xl font-bold leading-tight text-brand-deep';
const H3 = 'mt-stack-xl text-xl md:text-3xl font-bold leading-tight text-brand-deep';
const P = 'mt-stack max-w-prose text-base md:text-lg text-ink-soft whitespace-pre-line';
const BLOCK = 'mt-section border-t border-moss pt-section';

// Enlaces externos de «Más información»: fuera de los párrafos, cada uno con su objetivo de 44 px.
const MORE_INFO = [
  { key: 'linkIco', href: 'https://ico.org.uk/' },
  { key: 'linkAboutCookies', href: 'https://www.aboutcookies.org' },
  { key: 'browserChrome', href: 'https://support.google.com/chrome/answer/95647' },
  { key: 'browserInternetExplorer', href: 'https://support.microsoft.com/en-gb/help/17442/windows-internet-explorer-delete-manage-cookies' },
  { key: 'browserSafari', href: 'https://support.apple.com/en-hk/guide/safari/sfri11471/mac' },
  { key: 'browserMicrosoftEdge', href: 'https://support.microsoft.com/en-gb/microsoft-edge/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd' },
  { key: 'browserFirefox', href: 'https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop?redirectslug=enable-and-disable-cookies-website-preferences&redirectlocale=en-US' },
  { key: 'browserOpera', href: 'https://help.opera.com/en/latest/web-preferences/#cookies' },
];

const CATEGORIES = ['First', 'Second', 'Third', 'Fourth'];

const Cookies = () => {
  const { t } = useTranslation();

  return (
    <article className="page-container pt-stack-xl md:pt-section pb-section">
      <h1 className="text-4xl md:text-5xl font-bold leading-tight text-brand-deep">
        {t('cookies.title')}
      </h1>

      <section className="mt-stack-xl">
        <h2 className={H2}>{t('cookies.subtitleAboutCookies')}</h2>
        <p className={P}>{t('cookies.descriptionAboutCookies')}</p>

        <h2 className={`${H2} mt-stack-xl`}>{t('cookies.subtitleAboutPixel')}</h2>
        <p className={P}>{t('cookies.descriptionAboutPixel')}</p>
      </section>

      <section className={BLOCK}>
        <h2 className={H2}>{t('cookies.subtitleTypeCookies')}</h2>
        <p className={P}>
          <Trans
            i18nKey="cookies.descriptionTypeCookies"
            components={{ strong: <strong className="font-bold" /> }}
          />
        </p>

        <h2 className={`${H2} mt-stack-xl`}>{t('cookies.subtitleCookiesUse')}</h2>
        <p className={P}>{t('cookies.descriptionCookiesUse')}</p>
      </section>

      <section className={BLOCK}>
        <h2 className={H2}>{t('cookies.subtitleCookiesCategories')}</h2>
        {CATEGORIES.map((category) => (
          <React.Fragment key={category}>
            <h3 className={H3}>{t(`cookies.subtitle${category}CookiesCategory`)}</h3>
            <p className={P}>{t(`cookies.description${category}CookiesCategory`)}</p>
          </React.Fragment>
        ))}
      </section>

      <section className={BLOCK}>
        <h2 className={H2}>{t('cookies.subtitleCookiesManagement')}</h2>
        <p className={P}>{t('cookies.descriptionCookiesManagement')}</p>

        <h3 className={H3}>{t('cookies.moreInfoTitle')}</h3>
        <ul className="mt-stack">
          {MORE_INFO.map(({ key, href }) => (
            <li key={key}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring inline-flex min-h-11 items-center gap-stack-sm text-brand-deep underline"
              >
                <span>{t(`cookies.${key}`)}</span>
                <span className="material-symbols-outlined" aria-hidden="true">open_in_new</span>
                <span className="sr-only">{t('a11y.opensInNewTab')}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
};

export default Cookies;
