import React, { useRef, useState } from 'react';
import ButtonAlternative from './ButtonAlternative';
import ButtonPrincipal from './ButtonPrincipal';
import DialogAdvice from './DialogAdvice';
import InfoButton from './InfoButton';
import InlineError from './InlineError';
import LoadSpinner from './LoadSpinner';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'motion/react';
import api from '../services/api';
import useDialog from '../hooks/useDialog';
import { useToast } from '../hooks/useToast';

const ERROR_UPLOAD = 'dialogAdvice.errorUploadMessage';
const ERROR_DRAFT_NOT_FOUND = 'dialogAdvice.errorDraftNotFound';

function normalizeFileName(fileName) {
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = fileName.substring(0, lastDotIndex);
  const extension = fileName.substring(lastDotIndex);

  const normalizedFileName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9-_]/g, '');

  return normalizedFileName + extension;
}

const FileUploadForm = () => {
  const { t } = useTranslation();
  const { notifySuccess } = useToast();
  // entries: [{ id, file, status: 'pending' | 'uploading' | 'decision' | 'done' | 'error', errorKey }]
  const [entries, setEntries] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [cardError, setCardError] = useState(null);
  const { dialog, showDialog, closeDialog } = useDialog();
  const nextId = useRef(0);
  // Evita un segundo envío antes de que React pinte `uploading`.
  const uploadingRef = useRef(false);

  const updateEntry = (id, patch) => {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  };

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);

    const newEntries = selectedFiles
      .filter(
        (newFile) => !entries.some(
          (existing) => existing.file.name === newFile.name && existing.file.size === newFile.size
        )
      )
      .map((file) => {
        nextId.current += 1;
        return { id: nextId.current, file, status: 'pending', errorKey: null };
      });

    setEntries((prevEntries) => [...prevEntries, ...newEntries]);
    setCardError(null);

    event.target.value = '';
  };

  const askDecision = (entry, draft) => {
    updateEntry(entry.id, { status: 'decision' });
    const emptyFieldSummary = draft.emptyFields
      .map((field) => t('dialogAdvice.rowEmpty', { rowIndex: field.rowIndex }))
      .join(', ');

    return new Promise((resolve) => {
      showDialog(
        t('dialogAdvice.adviceTitle'),
        t('dialogAdvice.fieldsMissingMessage', { filename: entry.file.name }),
        {
          details: { title: t('dialogAdvice.emptyFieldsSummary'), content: emptyFieldSummary },
          onConfirm: () => resolve(true),
          onCancel: () => resolve(false),
        }
      );
    });
  };

  // Sube un archivo y devuelve su estado final; `stop` corta la cola (el resto queda pendiente).
  const uploadEntry = async (entry) => {
    const normalizedFileName = normalizeFileName(entry.file.name);
    const formData = new FormData();
    formData.append('file', new File([entry.file], normalizedFileName));

    try {
      let draft;
      try {
        await api.postFormAuth('/upload', formData);
      } catch (error) {
        if (error.status === 401) return { status: 'pending', stop: true };
        if (error.status === 400 && Array.isArray(error.data?.emptyFields)) {
          draft = error.data;
        } else if (error.type === 'http') {
          return { status: 'error', errorKey: ERROR_UPLOAD, stop: true };
        } else {
          throw error;
        }
      }

      if (!draft) return { status: 'done' };

      const { draftKey } = draft;
      const confirmed = await askDecision(entry, draft);
      closeDialog();

      if (confirmed) {
        try {
          await api.postAuth('/upload/confirm', { confirmed: true, draftKey });
        } catch (error) {
          if (error.status === 401) return { status: 'pending', stop: true };
          if (error.status === 404) return { status: 'error', errorKey: ERROR_DRAFT_NOT_FOUND, stop: true };
          throw error;
        }
        return { status: 'done' };
      }

      try {
        await api.postAuth('/upload/confirm', { confirmed: false, draftKey });
      } catch (error) {
        if (error.status === 401) return { status: 'pending', stop: true };
        if (error.type === 'network') throw error;
        return {
          status: 'error',
          errorKey: error.status === 404 ? ERROR_DRAFT_NOT_FOUND : ERROR_UPLOAD,
          stop: true,
        };
      }
      return { status: 'pending', stop: true };
    } catch {
      return { status: 'error', errorKey: ERROR_UPLOAD, stop: true };
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (uploadingRef.current) return;

    const queue = entries.filter((entry) => entry.status !== 'done');
    if (queue.length === 0) return;

    uploadingRef.current = true;
    setUploading(true);
    setCardError(null);
    setProgress({ completed: 0, total: queue.length });
    let allFilesUploadedSuccessfully = true;
    let completed = 0;

    try {
      for (const entry of queue) {
        updateEntry(entry.id, { status: 'uploading', errorKey: null });
        const result = await uploadEntry(entry);
        updateEntry(entry.id, { status: result.status, errorKey: result.errorKey ?? null });

        if (result.status === 'done') {
          completed += 1;
          setProgress({ completed, total: queue.length });
        }
        if (result.errorKey) setCardError(result.errorKey);
        if (result.stop) {
          allFilesUploadedSuccessfully = false;
          break;
        }
      }
    } finally {
      uploadingRef.current = false;
      setUploading(false);
    }

    if (allFilesUploadedSuccessfully) {
      notifySuccess(t('dialogAdvice.successUploadMessage'));
      setEntries([]);
    }
  };

  const handleRemoveFile = (idToRemove) => {
    setEntries((prevEntries) => prevEntries.filter((entry) => entry.id !== idToRemove));
    setCardError(null);
  };

  const pendingCount = entries.filter((entry) => entry.status !== 'done').length;
  const progressText = t('uploadFiles.progress', {
    current: Math.min(progress.completed + 1, progress.total),
    total: progress.total,
  });

  // El motivo del error se muestra una sola vez, en el InlineError de la tarjeta.
  const statusText = (entry) => t(`uploadFiles.fileStatus.${entry.status}`);

  return (
    <>
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-brand-dark p-4">

          <input
            type="file"
            multiple
            accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileSelect}
            className="hidden"
            id="fileInput"
            tabIndex={-1}
            aria-hidden="true"
          />

          <div className="flex flex-wrap items-center justify-center gap-2">
            <ButtonAlternative
              text={t('uploadFiles.fileUploadForm.selectFilesButton')}
              disabled={uploading}
              onClick={() => document.getElementById('fileInput').click()}
            />
            <InfoButton
              tooltipText={t('uploadFiles.fileUploadForm.selectFilesButtonTooltip')}
            />
          </div>

          {entries.length === 0 ? (
            <p className="text-center text-ink">{t('uploadFiles.fileUploadForm.noFilesSelected')}</p>
          ) : (
            <ul
              aria-label={t('uploadFiles.fileUploadForm.filesListLabel')}
              aria-busy={uploading || undefined}
              className="w-full"
            >
              {entries.map((entry) => (
                <li key={entry.id} className="flex min-h-12 items-center justify-between gap-2 text-ink">
                  <div className="flex min-w-0 flex-col">
                    <span className="break-words">{entry.file.name}</span>
                    <span className={`text-sm ${entry.status === 'error' ? 'font-bold text-danger' : 'text-ink-soft'}`}>
                      {statusText(entry)}
                    </span>
                  </div>
                  <ButtonPrincipal
                    icon="delete"
                    ariaLabel={t('uploadFiles.fileUploadForm.removeFile', { name: entry.file.name })}
                    disabled={uploading}
                    onClick={() => handleRemoveFile(entry.id)}
                  />
                </li>
              ))}
            </ul>
          )}

          {uploading && (
            <div
              role="progressbar"
              aria-label={progressText}
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.completed}
              aria-valuetext={progressText}
              className="h-3 w-full overflow-hidden rounded-full border border-brand-dark bg-surface"
            >
              <div
                className="h-full bg-brand-dark"
                style={{ width: `${progress.total ? (progress.completed / progress.total) * 100 : 0}%` }}
              />
            </div>
          )}

          <LoadSpinner inline label={uploading ? progressText : ''} />

          {cardError && <InlineError>{t(cardError)}</InlineError>}
        </div>

        <div className="flex justify-center px-4 py-3">
          {pendingCount > 0 && (
            <ButtonPrincipal
              type="submit"
              text={t('uploadFiles.fileUploadForm.uploadFilesButton', { count: pendingCount })}
              loading={uploading}
            />
          )}
        </div>
      </form>

      <AnimatePresence>
        {dialog.visible && (
          <DialogAdvice
            dialogTitle={dialog.title}
            dialogMessage={dialog.message}
            dialogDetails={dialog.details}
            onConfirm={dialog.onConfirm}
            onClose={() => {
              dialog.onCancel?.();
              closeDialog();
            }}
            showActions={!!dialog.onConfirm}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default FileUploadForm;
