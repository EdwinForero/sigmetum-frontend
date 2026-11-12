import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import ButtonPrincipal from '../components/ButtonPrincipal';
import EmptyState from '../components/EmptyState';
import GalleryViewer from '../components/GalleryViewer';
import LoadSpinner from '../components/LoadSpinner';
import photoName from '../utilities/photoName';
import isSafeImageUrl from '../utilities/isSafeImageUrl';

const SKELETON_CELLS = 6;

// Columnas por ancho: 1 bajo 640 px, 2 desde 640, 3 desde 1024 y 4 desde 1280.
const columnCount = (width) => {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
};

// Bloques contiguos: la columna c recibe los elementos [c * perColumn, (c + 1) * perColumn).
// El orden del DOM es el de los datos y la columna de una foto no cambia al cargar otras.
const toColumns = (items, columns) => {
  const perColumn = Math.ceil(items.length / columns);
  return Array.from({ length: columns }, (_, c) => items.slice(c * perColumn, (c + 1) * perColumn)).filter(
    (column) => column.length > 0
  );
};

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
  const [columns, setColumns] = useState(() => columnCount(window.innerWidth));
  const [viewerIndex, setViewerIndex] = useState(null);
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

  useEffect(() => {
    const handleResize = () => {
      const next = columnCount(window.innerWidth);
      if (next === columnsRef.current) return;
      // Al cambiar de columna las fotos se remontan: se guarda cuál tenía el foco para devolvérselo.
      focusedPhotoRef.current = document.activeElement?.dataset?.photo ?? null;
      columnsRef.current = next;
      setColumns(next);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="mt-stack-xl flex gap-stack-lg">
          {toColumns(Array.from({ length: SKELETON_CELLS }), columns).map((column, c) => (
            <div key={c} className="flex min-w-0 flex-1 flex-col gap-stack-lg">
              {column.map((_, i) => (
                <div key={i} aria-hidden="true" className="aspect-[4/3] w-full rounded-lg bg-sage-soft" />
              ))}
            </div>
          ))}
        </div>
      );
    }
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
    const perColumn = Math.ceil(images.length / columns);
    return (
      <div className="mt-stack-xl flex gap-stack-lg">
        {toColumns(images, columns).map((column, c) => (
          <ul key={c} className="flex min-w-0 flex-1 flex-col gap-stack-lg">
            {column.map((image, i) => {
              const name = photoName(image.fileName);
              const index = c * perColumn + i;
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
                      className={`focus-ring block w-full cursor-pointer rounded-lg bg-sage-soft ${safe ? '' : 'aspect-[4/3]'}`}
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
    <div className="page-container pt-stack-xl md:pt-section pb-section">
      <h1 className="text-4xl md:text-5xl font-bold leading-tight text-brand-deep">{t('gallery.title')}</h1>
      <LoadSpinner inline label={isLoading ? t('gallery.loading') : undefined} />
      {renderContent()}
      {viewerIndex !== null && (
        <GalleryViewer images={images} index={viewerIndex} onIndexChange={setViewerIndex} onClose={closeViewer} />
      )}
    </div>
  );
};

export default VegetationGallery;
