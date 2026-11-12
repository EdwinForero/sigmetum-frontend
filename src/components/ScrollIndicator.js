import React from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from 'motion/react';

// Flecha del hero de Home: lleva (y enfoca) la sección `targetId`. Va en el flujo (sin fixed ni rebote).
const ScrollIndicator = ({ targetId }) => {
  const { t } = useTranslation();
  const reducedMotion = useReducedMotion();

  const handleScrollDown = () => {
    const target = document.getElementById(targetId);
    target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    // El destino lleva tabIndex -1: con el foco allí, el siguiente Tab continúa desde esa sección.
    target?.focus({ preventScroll: true });
  };

  return (
    <button
      onClick={handleScrollDown}
      aria-label={t('iconButton.scrollDown')}
      className="focus-ring inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl"
    >
      <span className="material-symbols-outlined text-3xl text-surface" aria-hidden="true">arrow_circle_down</span>
    </button>
  );
};

export default ScrollIndicator;
