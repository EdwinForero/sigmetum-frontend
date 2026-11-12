import React, { useState, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import ButtonPrincipal from "./ButtonPrincipal";
import ButtonAlternative from "./ButtonAlternative";
import Switch from "./Switch";

const COOKIE_MAX_AGE = 31536000;

const setCookie = (name, value) => {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
};

const CookieBanner = ({ aboveBottomBar = false }) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState({
    all: false,
    advertising: false,
    advertisingTracking: false,
    functionality: false,
    personalization: false,
    security: false
  });

  useEffect(() => {
    const cookieConsent = document.cookie.includes("cookieConsent=accepted");

    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setCookie("cookieConsent", "accepted");
    setCookie("cookiePreferences", JSON.stringify(cookiePreferences));
    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const newPreferences = {
      all: true,
      advertising: true,
      advertisingTracking: true,
      functionality: true,
      personalization: true,
      security: true,
    };

    setCookie("cookieConsent", "accepted");
    setCookie("cookiePreferences", JSON.stringify(newPreferences));

    setIsVisible(false);
  };

  const handleModalToggle = () => {
    setIsModalOpen((prev) => !prev);
  };

  const handlePreferenceChange = (key) => {
    if (key === "all") {
      const newState = !cookiePreferences.all;
      setCookiePreferences({
        all: newState,
        advertising: newState,
        advertisingTracking: newState,
        functionality: newState,
        personalization: newState,
        security: newState,
      });
    } else {
      const updatedPreferences = {
        ...cookiePreferences,
        [key]: !cookiePreferences[key],
      };
  
      const allActive = Object.keys(updatedPreferences)
        .filter((k) => k !== "all")
        .every((k) => updatedPreferences[k]);
  
      setCookiePreferences({
        ...updatedPreferences,
        all: allActive,
      });
    }
  };

  if (!isVisible) return null;

  return (
    <>
      <section
        aria-label={t("cookies.banner.title")}
        className={`sticky z-40 ${aboveBottomBar ? "bottom-nav md:bottom-0" : "bottom-0"} border-t border-moss bg-surface text-ink p-3 sm:p-4 shadow-lg flex flex-col gap-2 sm:gap-4 lg:flex-row lg:justify-between lg:items-center`}
      >
        <div className="flex flex-col text-center lg:text-left sm:mb-2">
          <div className="flex items-center justify-center gap-2 lg:justify-start">
            <span className="material-symbols-outlined text-moss" aria-hidden="true">info</span>
            <h2 className="text-sm font-bold sm:text-base">{t("cookies.banner.title")}</h2>
          </div>
          <p className="text-xs sm:text-sm">
            <Trans
              i18nKey="cookies.banner.description"
              components={{
                a: (
                  <a
                    href="/cookies"
                    rel="noopener noreferrer"
                    className="underline"
                  />
                ),
              }}
            />
          </p>
        </div>

        <div className="flex gap-2 justify-center lg:justify-end">
          <ButtonPrincipal
            text={t("cookies.banner.acceptAllButton")}
            onClick={handleAcceptAll}
            className="!px-3 !text-sm sm:!px-5 sm:!text-base"
          />
          <ButtonAlternative
            text={t("cookies.banner.cookiesConfigurationButton")}
            onClick={handleModalToggle}
            className="!px-3 !text-sm sm:!px-5 sm:!text-base"
          />
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 bg-ink/70 flex items-center justify-center z-50">
          <div className="bg-surface text-ink p-6 rounded-md shadow-lg max-w-lg w-full">
            <h2 className="text-lg font-bold mb-4">
              {t("cookies.modal.title")}
            </h2>
            <p className="text-sm text-ink mb-4">
              {t("cookies.modal.description")}
            </p>
            <div className="space-y-4">
              {Object.entries(cookiePreferences).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between border-b border-sage py-2"
                >
                  <span className="text-sm text-ink">{t(`cookies.modal.categories.${key}`, key)}</span>
                  <Switch
                    checked={value}
                    onChange={() => handlePreferenceChange(key)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <ButtonAlternative text={t("cookies.modal.cancelButton")} onClick={handleModalToggle} />
              <ButtonPrincipal
                text={t("cookies.modal.applyButton")}
                onClick={() => {
                  handleAccept();
                  handleModalToggle();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieBanner;