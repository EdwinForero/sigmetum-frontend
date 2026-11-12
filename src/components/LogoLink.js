import React from 'react';
import { useTranslation } from 'react-i18next';

// Logo institucional con enlace externo: nombre accesible por el `alt` y aviso de pestaña nueva solo para lectores de pantalla.
const LogoLink = ({ href, src, alt }) => {
  const { t } = useTranslation();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring inline-flex h-16 w-32 items-center justify-center rounded-lg bg-surface p-2"
    >
      <img
        src={src}
        alt={alt}
        width={128}
        height={64}
        loading="lazy"
        className="h-full w-full object-contain mix-blend-multiply"
      />
      <span className="sr-only">{t('a11y.opensInNewTab')}</span>
    </a>
  );
};

export default LogoLink;
