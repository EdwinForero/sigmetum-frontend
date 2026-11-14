import { React, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import InfoButton from './InfoButton';
import TextInput from './TextInput';
import InlineError from './InlineError';
import LoadSpinner from './LoadSpinner';
import DialogAdvice from './DialogAdvice';
import ButtonPrincipal from './ButtonPrincipal';
import ButtonAlternative from './ButtonAlternative';
import api from '../services/api';
import useDialog from '../hooks/useDialog';
import { useToast } from '../hooks/useToast';
import { H1_TOOL } from '../utilities/contentStyles';
import isSafeImageUrl from '../utilities/isSafeImageUrl';

const INVALID_TITLE = /[/\\,':&#?%"]|\.\.|\p{Cc}/u;

// La URL es prefirmada y caduca a la hora: si falla (o no es segura, S7), se oculta el img y se conserva la caja.
const Thumbnail = ({ url }) => {
  const [failed, setFailed] = useState(false);
  if (failed || !isSafeImageUrl(url)) {
    return <span aria-hidden="true" className="h-12 w-12 shrink-0 rounded-lg border border-sage" />;
  }
  return (
    // onError no es una interacción: la regla lo confunde con un manejador de ratón o teclado.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <img
      src={url}
      alt=""
      width={48}
      height={48}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-12 w-12 shrink-0 rounded-lg border border-sage object-cover"
    />
  );
};

const ImageGalleryManager = () => {
  const { t } = useTranslation();
  const { notifySuccess, notifyError } = useToast();
  const headingId = useId();
  const titleErrorId = useId();
  const fileErrorId = useId();
  const selectButtonId = useId();
  const titleInputRef = useRef(null);
  const headingRef = useRef(null);
  const [imageTitle, setImageTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [images, setImages] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(null);
  // { field: 'title' | 'file', key } con la clave de traducción del mensaje.
  const [fieldError, setFieldError] = useState(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const { dialog, showDialog, closeDialog } = useDialog();

  useEffect(() => { fetchImageUrls(); }, []);

  // El botón que abrió la confirmación se desmonta al borrar: el foco pasa al título de la sección, no a body.
  useEffect(() => {
    if (focusRequest > 0) headingRef.current?.focus();
  }, [focusRequest]);

  const fetchImageUrls = async () => {
    setIsLoadingList(true);
    setIsError(false);
    try {
      const data = await api.get('/list-images');
      if (data) {
        setImages(data.filter((image) => image.fileName.trim() !== ''));
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleTitleChange = (e) => {
    setImageTitle(e.target.value);
    if (fieldError?.field === 'title') setFieldError(null);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setImageFile(selectedFile);
      if (fieldError?.field === 'file') setFieldError(null);
    }
  };

  const rejectField = (field, key) => {
    setFieldError({ field, key });
    if (field === 'title') titleInputRef.current?.focus();
    else document.getElementById(selectButtonId)?.focus();
  };

  const handleImageUpload = async () => {
    if (!imageTitle.trim()) {
      rejectField('title', 'contentManagement.imageTitleRequired');
      return;
    }
    if (INVALID_TITLE.test(imageTitle)) {
      rejectField('title', 'dialogAdvice.adviceInvalidImageTitle');
      return;
    }
    if (!imageFile) {
      rejectField('file', 'contentManagement.imageFileRequired');
      return;
    }
    setFieldError(null);
    setBusy('add');
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('title', imageTitle);
      await api.postFormAuth('/upload-image', formData);
      notifySuccess(t('dialogAdvice.successUploadImage'));
      fetchImageUrls();
    } catch {
      notifyError(t('dialogAdvice.errorUploadImage'));
    } finally {
      setBusy(null);
    }
  };

  const deleteImage = async (imageKey) => {
    closeDialog();
    setBusy('delete');
    try {
      await api.deleteAuth('/delete-image', { imageKey });
      notifySuccess(t('dialogAdvice.successDeleteImage'));
      fetchImageUrls();
      setFocusRequest((current) => current + 1);
    } catch {
      notifyError(t('dialogAdvice.errorDeleteImage'));
      setFocusRequest((current) => current + 1);
    } finally {
      setBusy(null);
    }
  };

  const askDeleteConfirmation = (imageKey) => {
    showDialog(
      t('dialogAdvice.confirmDeleteTitle'),
      t('dialogAdvice.confirmDeleteImage', { name: imageKey }),
      { onConfirm: () => deleteImage(imageKey) }
    );
  };

  const renderList = () => {
    if (isError) {
      return (
        <div>
          <InlineError>{t('dialogAdvice.errorLoadData')}</InlineError>
          <ButtonAlternative text={t('feedback.retry')} onClick={fetchImageUrls} />
        </div>
      );
    }
    if (images.length === 0) {
      if (isLoadingList) return null;
      return <p className="text-base text-ink">{t('contentManagement.noImagesFoundPlaceholder')}</p>;
    }
    return (
      <ul aria-label={t('contentManagement.imagesListLabel')} className="rounded-xl border border-brand-dark px-3 py-1">
        {images.map((image) => (
          <li key={image.fileName} className="flex min-h-12 items-center justify-between gap-2 text-ink">
            <span className="flex min-w-0 items-center gap-3">
              <Thumbnail key={image.url} url={image.url} />
              <span className="min-w-0 break-words text-base font-normal">{image.fileName}</span>
            </span>
            <ButtonPrincipal
              icon="delete"
              ariaLabel={t('contentManagement.deleteImage', { name: image.fileName })}
              disabled={busy !== null}
              onClick={() => askDeleteConfirmation(image.fileName)}
            />
          </li>
        ))}
      </ul>
    );
  };

  const fileError = fieldError?.field === 'file' ? fieldError : null;
  const titleError = fieldError?.field === 'title' ? fieldError : null;

  return (
    <div className="flex min-w-0 flex-col gap-stack">
      <div className="flex flex-wrap items-center gap-3">
        <h1
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className={`focus-heading ${H1_TOOL}`}
        >
          {t('contentManagement.galleryManagementTitle')}
        </h1>
        <InfoButton
          topic={t('contentManagement.galleryManagementTitle')}
          tooltipText={t('contentManagement.galleryManagementTooltip')}
        />
      </div>

      <div>
        <TextInput
          label={t('contentManagement.galleryManagementPlaceholder')}
          value={imageTitle}
          onChange={handleTitleChange}
          invalid={!!titleError}
          describedBy={titleError ? titleErrorId : undefined}
          inputRef={titleInputRef}
        />
        {titleError && <InlineError id={titleErrorId}>{t(titleError.key)}</InlineError>}
      </div>

      <div>
        <input
          type="file"
          accept="image/jpeg, image/png, image/gif, image/webp"
          onChange={handleFileChange}
          className="hidden"
          id="imageFileInput"
          tabIndex={-1}
          aria-hidden="true"
        />
        <div className="flex flex-wrap items-center gap-3">
          <ButtonAlternative
            id={selectButtonId}
            text={t('contentManagement.selectImageButton')}
            onClick={() => document.getElementById('imageFileInput').click()}
            aria-invalid={fileError ? true : undefined}
            aria-describedby={fileError ? fileErrorId : undefined}
          />
          <span className="min-w-0 break-words text-ink">
            {imageFile ? imageFile.name : t('contentManagement.noImageSelected')}
          </span>
        </div>
        {fileError && <InlineError id={fileErrorId}>{t(fileError.key)}</InlineError>}
      </div>

      <div>
        <ButtonPrincipal
          text={t('contentManagement.addImageButton')}
          onClick={handleImageUpload}
          loading={busy === 'add'}
          disabled={busy === 'delete'}
        />
      </div>

      <div className="mt-2">
        <LoadSpinner inline label={isLoadingList ? t('contentManagement.loadingImages') : ''} />
        {renderList()}
      </div>

      <AnimatePresence>
        {dialog.visible && (
          <DialogAdvice
            variant="warning"
            dialogTitle={dialog.title}
            dialogMessage={dialog.message}
            showActions
            confirmText={t('dialogAdvice.deleteButton')}
            onConfirm={dialog.onConfirm}
            onClose={closeDialog}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageGalleryManager;
