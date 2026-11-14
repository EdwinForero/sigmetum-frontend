import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import Reveal from '../components/Reveal.js';
import { PAGE, PROSE, H1, H2, H3, BULLETS, RULED, RULED_SECTION } from '../utilities/contentStyles.js';

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
const TYPES = ['typeFirstParty', 'typeThirdParty'];
const USES = ['useNavigation', 'useSettings', 'useAnalytics', 'useTraffic', 'useAdvertising'];

const Cookies = () => {
  const { t } = useTranslation();

  return (
    <article className={PAGE}>
      <div className={PROSE}>
        <h1 className={H1}>{t('cookies.title')}</h1>

        <div className={`mt-stack-lg ${RULED}`}>
          <Reveal as="section" className={RULED_SECTION}>
            <h2 className={H2}>{t('cookies.subtitleAboutCookies')}</h2>
            <div className="mt-stack-lg space-y-stack">
              <p>{t('cookies.descriptionAboutCookies')}</p>
              <p>{t('cookies.descriptionAboutCookiesNote')}</p>
            </div>
          </Reveal>

          <Reveal as="section" className={RULED_SECTION}>
            <h2 className={H2}>{t('cookies.subtitleAboutPixel')}</h2>
            <div className="mt-stack-lg space-y-stack">
              <p>{t('cookies.descriptionAboutPixel')}</p>
              <p>{t('cookies.descriptionAboutPixelMoreInfo')}</p>
            </div>
          </Reveal>

          <Reveal as="section" className={RULED_SECTION}>
            <h2 className={H2}>{t('cookies.subtitleTypeCookies')}</h2>
            <ul className={`mt-stack-lg ${BULLETS}`}>
              {TYPES.map((type) => (
                <li key={type}>
                  <Trans
                    i18nKey={`cookies.${type}`}
                    components={{ strong: <strong className="font-bold" /> }}
                  />
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal as="section" className={RULED_SECTION}>
            <h2 className={H2}>{t('cookies.subtitleCookiesUse')}</h2>
            <div className="mt-stack-lg space-y-stack">
              <p>{t('cookies.usesIntro')}</p>
              <ul className={BULLETS}>
                {USES.map((use) => (
                  <li key={use}>{t(`cookies.${use}`)}</li>
                ))}
              </ul>
              <p>{t('cookies.usesClosing')}</p>
            </div>
          </Reveal>

          <Reveal as="section" className={RULED_SECTION}>
            <h2 className={H2}>{t('cookies.subtitleCookiesCategories')}</h2>
            <ul role="list" className="mt-stack-lg space-y-stack-xl">
              {CATEGORIES.map((category) => (
                <li key={category}>
                  <h3 className={H3}>{t(`cookies.subtitle${category}CookiesCategory`)}</h3>
                  <p className="mt-stack">{t(`cookies.description${category}CookiesCategory`)}</p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal as="section" className={RULED_SECTION}>
            <h2 className={H2}>{t('cookies.subtitleCookiesManagement')}</h2>
            <div className="mt-stack-lg space-y-stack">
              <p>{t('cookies.descriptionCookiesManagement')}</p>
              <p>{t('cookies.descriptionCookiesManagementBrowser')}</p>
            </div>

            <h3 className={`${H3} mt-stack-xl`}>{t('cookies.moreInfoTitle')}</h3>
            <ul role="list" className="mt-stack">
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
          </Reveal>
        </div>
      </div>
    </article>
  );
};

export default Cookies;
