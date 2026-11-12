import React, { useEffect, useId } from 'react';
import { useTranslation } from 'react-i18next';
import useDialogFocus from '../hooks/useDialogFocus';
import photoName from '../utilities/photoName';
import isSafeImageUrl from '../utilities/isSafeImageUrl';

const BUTTON = 'focus-ring absolute flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-surface text-ink';

// Visor a pantalla completa. Se monta solo cuando está abierto (la galería lo pinta con `index !== null`).
const GalleryViewer = ({ images, index, onIndexChange, onClose }) => {
  const { t } = useTranslation();
  const titleId = useId();
  const dialogRef = useDialogFocus(true, onClose);
  const total = images.length;
  const name = photoName(images[index]?.fileName);

  // Flechas izquierda y derecha, cíclicas: los botones nunca se deshabilitan.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return;
      if (event.key === 'ArrowLeft') onIndexChange((index - 1 + total) % total);
      else if (event.key === 'ArrowRight') onIndexChange((index + 1) % total);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [index, total, onIndexChange]);

  // El diálogo es modal: el body no se desplaza detrás (A6); se restaura al cerrar o desmontar.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-ink/95">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex h-full w-full flex-col items-center justify-start gap-stack px-gutter pt-stack md:px-section-lg"
      >
        <div aria-live="polite" aria-atomic="true" className="w-full px-section text-center">
          <h2 id={titleId} className="line-clamp-2 text-xl font-bold text-surface">{name}</h2>
          <p className="text-base text-surface">{t('gallery.viewer.counter', { current: index + 1, total })}</p>
        </div>

        <div className="h-[calc(100dvh-10rem)] w-full">
          {isSafeImageUrl(images[index]?.url) && (
            <img src={images[index].url} alt={name} className="h-full w-full object-contain" />
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={t('iconButton.close')}
          className={`${BUTTON} right-gutter top-stack`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
        <button
          type="button"
          onClick={() => onIndexChange((index - 1 + total) % total)}
          aria-label={t('iconButton.previousPhoto')}
          className={`${BUTTON} bottom-stack left-gutter md:bottom-auto md:left-stack md:top-1/2 md:-translate-y-1/2`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">arrow_back_ios_new</span>
        </button>
        <button
          type="button"
          onClick={() => onIndexChange((index + 1) % total)}
          aria-label={t('iconButton.nextPhoto')}
          className={`${BUTTON} bottom-stack right-gutter md:bottom-auto md:right-stack md:top-1/2 md:-translate-y-1/2`}
        >
          <span className="material-symbols-outlined" aria-hidden="true">arrow_forward_ios</span>
        </button>
      </div>
    </div>
  );
};

export default GalleryViewer;
