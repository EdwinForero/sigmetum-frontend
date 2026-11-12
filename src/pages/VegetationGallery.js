import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import ButtonPrincipal from '../components/ButtonPrincipal';
import EmptyState from '../components/EmptyState';
import GalleryViewer from '../components/GalleryViewer';
import LoadSpinner from '../components/LoadSpinner';
import photoName from '../utilities/photoName';
import isSafeImageUrl from '../utilities/isSafeImageUrl';
import { galleryColumns, splitInColumns } from '../utilities/galleryLayout';

const SKELETON_CELLS = 6;

// Clave por foto: el nombre del archivo, con sufijo por ocurrencia solo en los repetidos.
const photoKeys = (images) => {
  const seen = new Map();
  return images.map(({ fileName }) => {
    const count = seen.get(fileName) ?? 0;
    seen.set(fileName, count + 1);
    return count === 0 ? fileName : `${fileName}#${count + 1}`;
  });
};

const VegetationGallery = () => {
  const { t } = useTranslation();
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [columns, setColumns] = useState(1);
  const [viewerIndex, setViewerIndex] = useState(null);
  const gridRef = useRef(null);
  const requestRef = useRef(0);
  const columnsRef = useRef(columns);
  const photoRefs = useRef(new Map());
  const focusedPhotoRef = useRef(null);
  const openedPhotoRef = useRef(null);

  const loadImages = useCallback(() => {
    const request = (requestRef.current += 1);
    const isCurrent = () => request === requestRef.current;
    setIsLoading(true);
    setIsError(false);
    api.get('/list-images')
      .then((data) => {
        if (isCurrent() && data) setImages(data.filter((image) => image.fileName.trim() !== ''));
      })
      .catch(() => {
        if (isCurrent()) setIsError(true);
      })
      .finally(() => {
        if (isCurrent()) setIsLoading(false);
      });
  }, []);

  // Al desmontar se invalida la petición en curso: su respuesta se ignora.
  useEffect(() => {
    loadImages();
    return () => {
      requestRef.current += 1;
    };
  }, [loadImages]);

  // Las columnas salen del ancho de la rejilla (a sangre, sin el tope de .page-container), no del de la ventana.
  const measureColumns = useCallback(() => {
    const next = galleryColumns(gridRef.current?.clientWidth ?? 0);
    if (next === columnsRef.current) return;
    // Al cambiar de columna las fotos se remontan: se guarda cuál tenía el foco para devolvérselo.
    focusedPhotoRef.current = document.activeElement?.dataset?.photo ?? null;
    columnsRef.current = next;
    setColumns(next);
  }, []);

  // Se mide antes de pintar para que la primera imagen ya salga con sus columnas.
  useLayoutEffect(() => {
    measureColumns();
  }, [measureColumns]);

  useEffect(() => {
    window.addEventListener('resize', measureColumns);
    return () => window.removeEventListener('resize', measureColumns);
  }, [measureColumns]);

  useEffect(() => {
    const key = focusedPhotoRef.current;
    focusedPhotoRef.current = null;
    if (key) photoRefs.current.get(key)?.focus({ preventScroll: true });
  }, [columns]);

  // useEffect y no useLayoutEffect: tiene que ejecutarse después de la limpieza de useDialogFocus,
  // que devuelve el foco al botón que abrió el visor (y, si ya no existe, al main).
  useEffect(() => {
    if (viewerIndex !== null) return;
    const key = openedPhotoRef.current;
    openedPhotoRef.current = null;
    if (key) photoRefs.current.get(key)?.focus();
  }, [viewerIndex]);

  const keys = useMemo(() => photoKeys(images), [images]);

  const openViewer = (index) => {
    openedPhotoRef.current = keys[index];
    setViewerIndex(index);
  };

  const closeViewer = useCallback(() => setViewerIndex(null), []);

  // Estados de error y vacío: van dentro de .page-container, como el título.
  const renderNotice = () => {
    if (isLoading) return null;
    if (isError) {
      return (
        <EmptyState
          role="alert"
          title={t('gallery.errorTitle')}
          action={<ButtonPrincipal onClick={loadImages} text={t('feedback.retry')} />}
        >
          {t('gallery.errorCause')}
        </EmptyState>
      );
    }
    if (images.length === 0) {
      return (
        <EmptyState title={t('gallery.emptyTitle')}>{t('gallery.noDataFoundPlaceholder')}</EmptyState>
      );
    }
    return null;
  };

  // Pistas fijas con minmax(0, 1fr): con pocas fotos nada se estira por encima del máximo de celda.
  const gridProps = {
    className: 'mt-stack-xl grid gap-x-stack-md',
    style: { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` },
  };

  const renderGrid = () => {
    if (isLoading) {
      return (
        <div {...gridProps}>
          {splitInColumns(Array.from({ length: SKELETON_CELLS }), columns).map((column, c) => (
            <div key={c} className="flex flex-col gap-stack">
              {column.items.map((_, i) => (
                <div key={i} aria-hidden="true" className="aspect-[4/3] w-full rounded-lg bg-sage-soft" />
              ))}
            </div>
          ))}
        </div>
      );
    }
    if (isError || images.length === 0) return null;
    return (
      <div {...gridProps}>
        {splitInColumns(images, columns).map((column, c) => (
          <ul key={c} className="flex flex-col gap-stack">
            {column.items.map((image, i) => {
              const name = photoName(image.fileName);
              const index = column.start + i;
              const key = keys[index];
              const safe = isSafeImageUrl(image.url);
              return (
                <li key={key}>
                  <figure>
                    <button
                      type="button"
                      data-photo={key}
                      ref={(element) => {
                        if (element) photoRefs.current.set(key, element);
                        else photoRefs.current.delete(key);
                      }}
                      onClick={() => openViewer(index)}
                      aria-label={t('gallery.openPhoto', { name })}
                      className={`focus-ring group relative block w-full cursor-pointer overflow-hidden rounded-lg bg-sage-soft ${safe ? '' : 'aspect-[4/3]'}`}
                    >
                      {safe && (
                        <img
                          src={image.url}
                          alt={name}
                          width={4}
                          height={3}
                          loading="lazy"
                          className="block h-auto w-full rounded-lg"
                        />
                      )}
                      {/* Velo decorativo: repite el nombre del pie al pasar el ratón o con el foco; no es la vía accesible. */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-ink/70 p-stack-sm text-center text-sm font-bold text-surface opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none motion-reduce:duration-0"
                      >
                        <span className="line-clamp-3">{name}</span>
                      </span>
                    </button>
                    <figcaption className="mt-stack-sm line-clamp-2 text-sm text-ink">{name}</figcaption>
                  </figure>
                </li>
              );
            })}
          </ul>
        ))}
      </div>
    );
  };

  return (
    <div className="pt-stack-xl md:pt-section pb-section">
      <div className="page-container">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight text-brand-deep">{t('gallery.title')}</h1>
        <LoadSpinner inline label={isLoading ? t('gallery.loading') : undefined} />
        {renderNotice()}
      </div>
      {/* La rejilla sale de .page-container: llena el viewport menos el margen lateral. Siempre montada: se mide. */}
      <div className="px-gutter md:px-gutter-md lg:px-gutter-lg">
        <div ref={gridRef}>{renderGrid()}</div>
      </div>
      {viewerIndex !== null && (
        <GalleryViewer images={images} index={viewerIndex} onIndexChange={setViewerIndex} onClose={closeViewer} />
      )}
    </div>
  );
};

export default VegetationGallery;
