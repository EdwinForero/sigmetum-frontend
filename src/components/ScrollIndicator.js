import React from 'react';
import { useTranslation } from 'react-i18next';
import UseAtBottom from '../utilities/UseAtBottom';

const ScrollIndicator = () => {
  const { t } = useTranslation();
  const isAtBottom = UseAtBottom();

  const handleScrollDown = () => {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    !isAtBottom && (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <button
          onClick={handleScrollDown}
          aria-label={t('iconButton.scrollDown')}
          className="focus-ring flex flex-col items-center animate-bounce cursor-pointer"
        >
        <span className="material-symbols-outlined text-3xl text-[#15B659] mx-auto" aria-hidden="true">arrow_circle_down</span>
        </button>
      </div>
    )
  );
};

export default ScrollIndicator;