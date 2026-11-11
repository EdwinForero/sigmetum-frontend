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

const FIELD_ERRORS = {
  empty: 'dialogAdvice.adviceEmptyValues',
  duplicate: 'dialogAdvice.adviceDuplicatedTerm',
};

const TermsManager = () => {
  const { t } = useTranslation();
  const { notifySuccess, notifyError } = useToast();
  const headingId = useId();
  const errorId = useId();
  const inputRef = useRef(null);
  const headingRef = useRef(null);
  const [term, setTerm] = useState('');
  const [terms, setTerms] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const { dialog, showDialog, closeDialog } = useDialog();

  useEffect(() => { fetchTerms(); }, []);

  // El botón que abrió la confirmación se desmonta al borrar: el foco pasa al título de la sección, no a body.
  useEffect(() => {
    if (focusRequest > 0) headingRef.current?.focus();
  }, [focusRequest]);

  const fetchTerms = async () => {
    setIsLoadingList(true);
    setIsError(false);
    try {
      const data = await api.get('/list-terms');
      setTerms(data);
    } catch {
      setIsError(true);
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleTermChange = (e) => {
    setTerm(e.target.value);
    setFieldError(null);
  };

  const rejectField = (key) => {
    setFieldError(key);
    inputRef.current?.focus();
  };

  const handleAddTerm = async () => {
    if (!term.trim()) {
      rejectField('empty');
      return;
    }
    const isDuplicate = terms.some((item) => item.term.toLowerCase() === term.trim().toLowerCase());
    if (isDuplicate) {
      rejectField('duplicate');
      return;
    }
    setFieldError(null);
    setBusy('add');
    try {
      await api.postAuth('/upload-term', { term });
      notifySuccess(t('dialogAdvice.successUploadTerm'));
      setTerm('');
      fetchTerms();
    } catch {
      notifyError(t('dialogAdvice.errorUploadTerm'));
    } finally {
      setBusy(null);
    }
  };

  const handleDeleteTerm = async (termToDelete) => {
    closeDialog();
    setBusy('delete');
    try {
      await api.deleteAuth('/delete-term', { term: termToDelete });
      notifySuccess(t('dialogAdvice.successDeleteTerm'));
      fetchTerms();
      setFocusRequest((current) => current + 1);
    } catch {
      notifyError(t('dialogAdvice.errorDeleteTerm'));
      setFocusRequest((current) => current + 1);
    } finally {
      setBusy(null);
    }
  };

  const askDeleteConfirmation = (termToDelete) => {
    showDialog(
      t('dialogAdvice.confirmDeleteTitle'),
      t('dialogAdvice.confirmDeleteTerm', { name: termToDelete }),
      { onConfirm: () => handleDeleteTerm(termToDelete) }
    );
  };

  const renderList = () => {
    if (isError) {
      return (
        <div>
          <InlineError>{t('dialogAdvice.errorLoadData')}</InlineError>
          <ButtonAlternative text={t('feedback.retry')} onClick={fetchTerms} />
        </div>
      );
    }
    if (terms.length === 0) {
      if (isLoadingList) return null;
      return <p className="text-base text-ink">{t('contentManagement.noTermsFoundPlaceholder')}</p>;
    }
    return (
      <ul aria-label={t('contentManagement.termsListLabel')} className="rounded-xl border border-brand-dark px-3 py-1">
        {[...terms]
          .sort((a, b) => a.term.localeCompare(b.term))
          .map((item) => (
            <li key={item.term} className="flex min-h-12 items-center justify-between gap-2 text-ink">
              <span className="min-w-0 break-words">{item.term}</span>
              <ButtonPrincipal
                icon="delete"
                ariaLabel={t('contentManagement.deleteTerm', { name: item.term })}
                disabled={busy !== null}
                onClick={() => askDeleteConfirmation(item.term)}
              />
            </li>
          ))}
      </ul>
    );
  };

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className="focus-heading text-lg font-bold leading-tight tracking-[-0.015em] text-ink"
        >
          {t('contentManagement.noLatinTermsTitle')}
        </h2>
        <InfoButton tooltipText={t('contentManagement.noLatinTermsTooltip')} />
      </div>

      <div>
        <TextInput
          label={t('contentManagement.noLatinTermsPlaceholder')}
          value={term}
          onChange={handleTermChange}
          invalid={!!fieldError}
          describedBy={fieldError ? errorId : undefined}
          inputRef={inputRef}
        />
        {fieldError && <InlineError id={errorId}>{t(FIELD_ERRORS[fieldError])}</InlineError>}
        <ButtonPrincipal
          text={t('contentManagement.addTermButton')}
          onClick={handleAddTerm}
          loading={busy === 'add'}
          disabled={busy === 'delete'}
        />
      </div>

      <div className="mt-2">
        <LoadSpinner inline label={isLoadingList ? t('contentManagement.loadingTerms') : ''} />
        {renderList()}
      </div>

      <AnimatePresence>
        {dialog.visible && (
          <DialogAdvice
            dialogTitle={dialog.title}
            dialogMessage={dialog.message}
            showActions
            confirmText={t('dialogAdvice.deleteButton')}
            onConfirm={dialog.onConfirm}
            onClose={closeDialog}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default TermsManager;
