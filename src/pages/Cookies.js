import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import ScrollIndicator from '../components/ScrollIndicator';

const Cookies = () => {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col bg-[#F9FBFA] overflow-x-hidden">

        <h1 className="text-[#15B659] tracking-light text-6xl font-bold leading-tight my-4 text-center my-2">
          {t('cookies.title')}
        </h1>

        <div className="max-w-screen-lg mx-auto px-4">
        <div className="my-10">

            <h2 className="text-[#15B659] tracking-light text-2xl sm:text-4xl font-bold leading-tight my-2">
                {t('cookies.subtitleAboutCookies')}
            </h2>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                {t('cookies.descriptionAboutCookies')}
            </p>

            <h2 className="text-[#15B659] tracking-light text-2xl sm:text-4xl font-bold leading-tight my-2 mt-10">
                {t('cookies.subtitleAboutPixel')}
            </h2>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                <Trans
                i18nKey="cookies.descriptionAboutPixel"
                components={{
                    a: (
                    <a
                        href="https://ico.org.uk/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                    />
                    ),
                }}
                />
            </p>

          </div>

          <div className="border-t-2 border-[#4B644A] my-4"></div>

          <div className="my-10">

            <h2 className="text-[#15B659] tracking-light text-2xl sm:text-4xl font-bold leading-tight text-center my-2">
                {t('cookies.subtitleTypeCookies')}
            </h2>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                <Trans
                i18nKey="cookies.descriptionTypeCookies"
                components={{ strong: <strong className="font-bold" /> }}
                />
            </p>

            <h2 className="text-[#15B659] tracking-light text-2xl sm:text-4xl font-bold leading-tight text-center my-2 mt-10">
                {t('cookies.subtitleCookiesUse')}
            </h2>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                {t('cookies.descriptionCookiesUse')}
            </p>

          </div>

          <div className="border-t-2 border-[#4B644A] my-4"></div>
        
        <div className="my-10">

            <h2 className="text-[#15B659] tracking-light text-2xl sm:text-4xl font-bold leading-tight text-center my-2">
                {t('cookies.subtitleCookiesCategories')}
            </h2>

            <h3 className="text-[#15B659] tracking-light text-xl sm:text-3xl font-bold leading-tight my-2 mt-10">
                {t('cookies.subtitleFirstCookiesCategory')}
            </h3>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2 ">
                {t('cookies.descriptionFirstCookiesCategory')}
            </p>

            <h3 className="text-[#15B659] tracking-light text-xl sm:text-3xl font-bold leading-tight my-2 mt-10">
                {t('cookies.subtitleSecondCookiesCategory')}
            </h3>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                {t('cookies.descriptionSecondCookiesCategory')}
            </p>

            <h3 className="text-[#15B659] tracking-light text-xl sm:text-3xl font-bold leading-tight my-2 mt-10">
                {t('cookies.subtitleThirdCookiesCategory')}
            </h3>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                {t('cookies.descriptionThirdCookiesCategory')}
            </p>

            <h3 className="text-[#15B659] tracking-light text-xl sm:text-3xl font-bold leading-tight my-2 mt-10">
                {t('cookies.subtitleFourthCookiesCategory')}
            </h3>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                {t('cookies.descriptionFourthCookiesCategory')}
            </p>
        </div>

          <div className="border-t-2 border-[#4B644A] my-4"></div>

          <div className="my-10">

            <h2 className="text-[#15B659] tracking-light text-2xl sm:text-4xl font-bold leading-tight text-center my-2">
                {t('cookies.subtitleCookiesManagement')}
            </h2>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                <Trans
                i18nKey="cookies.descriptionCookiesManagement"
                components={{
                    a: (
                    <a
                        href="https://www.aboutcookies.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                    />
                    ),
                }}
                />
            </p>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                <Trans
                i18nKey="cookies.browserChrome"
                components={{
                    a: (
                    <a
                        href="https://support.google.com/chrome/answer/95647"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                    />
                    ),
                }}
                />
            </p>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                <Trans
                i18nKey="cookies.browserInternetExplorer"
                components={{
                    a: (
                    <a
                        href="https://support.microsoft.com/en-gb/help/17442/windows-internet-explorer-delete-manage-cookies"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                    />
                    ),
                }}
                />
            </p>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                <Trans
                i18nKey="cookies.browserSafari"
                components={{
                    a: (
                    <a
                        href="https://support.apple.com/en-hk/guide/safari/sfri11471/mac"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                    />
                    ),
                }}
                />
            </p>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                <Trans
                i18nKey="cookies.browserMicrosoftEdge"
                components={{
                    a: (
                    <a
                        href="https://support.microsoft.com/en-gb/microsoft-edge/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                    />
                    ),
                }}
                />
            </p>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                <Trans
                i18nKey="cookies.browserFirefox"
                components={{
                    a: (
                    <a
                        href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop?redirectslug=enable-and-disable-cookies-website-preferences&redirectlocale=en-US"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                    />
                    ),
                }}
                />
            </p>

            <p className="text-[#14281D] text-base text-justify sm:text-lg text-center whitespace-pre-line my-2">
                <Trans
                i18nKey="cookies.browserOpera"
                components={{
                    a: (
                    <a
                        href="https://help.opera.com/en/latest/web-preferences/#cookies"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                    />
                    ),
                }}
                />
            </p>
          </div>
          </div>
        <ScrollIndicator />
    </div>
  );
};

export default Cookies;