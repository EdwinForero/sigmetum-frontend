import React, { useState, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import ButtonPrincipal from "./ButtonPrincipal";
import ButtonAlternative from "./ButtonAlternative";
import Switch from "./Switch";

const CookieBanner = () => {
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
    document.cookie = "cookieConsent=accepted; path=/; max-age=31536000";
    document.cookie = `cookiePreferences=${JSON.stringify(cookiePreferences)}; path=/; max-age=31536000`;
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

    document.cookie = "cookieConsent=accepted; path=/; max-age=31536000";
    document.cookie = `cookiePreferences=${JSON.stringify(newPreferences)}; path=/; max-age=31536000`;

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
      <div className="fixed bottom-0 left-0 w-full bg-gray-800 text-[#F9FBFA] p-4 shadow-lg z-50 flex flex-col sm:gap-4 lg:flex-row lg:justify-between lg:items-center">
        <div className="flex flex-col text-center lg:text-left sm:mb-2">
          <h3 className="font-bold">{t("cookies.banner.title")}</h3>
          <p className="text-sm">
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

        <div className="flex gap-2 sm:justify-center lg:justify-end">
          <ButtonPrincipal
            text={t("cookies.banner.acceptAllButton")}
            onClick={handleAcceptAll}
          />
          <ButtonAlternative
            text={t("cookies.banner.cookiesConfigurationButton")}
            onClick={handleModalToggle}
          />
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#F9FBFA] p-6 rounded-md shadow-lg max-w-lg w-full">
            <h2 className="text-lg font-bold mb-4">
              {t("cookies.modal.title")}
            </h2>
            <p className="text-sm text-[#0C1811] mb-4">
              {t("cookies.modal.description")}
            </p>
            <div className="space-y-4">
              {Object.entries(cookiePreferences).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between border-b border-[#99BBA8] py-2"
                >
                  <span className="text-sm text-[#0C1811]">{t(`cookies.modal.categories.${key}`, key)}</span>
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