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
import validateRecipientEmail, {
  EMAIL_MAX_LENGTH,
  RECIPIENTS_MAX,
  RECIPIENTS_MIN,
  normalizeEmail,
} from '../utilities/validateRecipientEmail';

const FIELD_ERRORS = {
  required: 'form.errors.required',
  email: 'form.errors.email',
  duplicate: 'contactRecipients.errors.duplicate',
};

const HINT_CLASS = 'mt-stack-xs text-sm text-moss';

const ContactRecipientsManager = () => {
  const { t } = useTranslation();
  const { notifySuccess, notifyError } = useToast();
  const headingId = useId();
  const errorId = useId();
  const loadErrorId = useId();
  const maxHintId = useId();
  const loadingHintId = useId();
  const lastHintId = useId();
  const inputRef = useRef(null);
  const headingRef = useRef(null);
  const removing = useRef(false);
  const requestRef = useRef(0);
  const [email, setEmail] = useState('');
  const [recipients, setRecipients] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [announceField, setAnnounceField] = useState(true);
  const [focusRequest, setFocusRequest] = useState(0);
  const { dialog, showDialog, closeDialog } = useDialog();

  const listReady = !isLoadingList && !isError;
  const atMax = recipients.length >= RECIPIENTS_MAX;
  const atMin = recipients.length <= RECIPIENTS_MIN;

  useEffect(() => { fetchRecipients(); }, []);

  // El botón que abrió la confirmación se desmonta o se desactiva: el foco pasa al título de la sección, no a body.
  useEffect(() => {
    if (focusRequest > 0) headingRef.current?.focus();
  }, [focusRequest]);

  const fetchRecipients = async () => {
    // Solo la última petición escribe: una respuesta vieja que llega tarde no pisa la lista nueva.
    const request = (requestRef.current += 1);
    const isCurrent = () => request === requestRef.current;
    setIsLoadingList(true);
    setIsError(false);
    try {
      const data = await api.getAuth('/list-recipients');
      // Si no es una lista, filter lanza y se muestra el error de carga (no una lista vacía).
      const list = data.filter((item) => typeof item?.email === 'string');
      if (isCurrent()) setRecipients(list);
    } catch {
      if (isCurrent()) setIsError(true);
    } finally {
      if (isCurrent()) setIsLoadingList(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setFieldError(null);
  };

  const rejectField = (key) => {
    // Con Enter el foco ya está en el campo y nadie leería el error: se anuncia. Con el clic, el foco vuelve al campo y lo lee aria-describedby.
    setAnnounceField(document.activeElement === inputRef.current);
    setFieldError(key);
    inputRef.current?.focus();
  };

  const handleAdd = async (event) => {
    event?.preventDefault();
    if (!listReady || recipients.length >= RECIPIENTS_MAX) return;
    const problem = validateRecipientEmail(email, recipients);
    if (problem) {
      rejectField(problem);
      return;
    }
    setFieldError(null);
    setBusy('add');
    try {
      await api.postAuth('/add-recipient', { email: email.trim() });
      notifySuccess(t('contactRecipients.successAdded'));
      setEmail('');
      fetchRecipients();
    } catch {
      notifyError(t('contactRecipients.errorAdd'));
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async (address) => {
    // El diálogo sigue pulsable en su animación de salida con el onConfirm antiguo: `busy` de ese cierre está desfasado.
    if (removing.current) return;
    removing.current = true;
    closeDialog();
    setBusy('remove');
    try {
      await api.deleteAuth('/delete-recipient', { email: address });
      notifySuccess(t('contactRecipients.successRemoved'));
      fetchRecipients();
    } catch {
      notifyError(t('contactRecipients.errorRemove'));
    } finally {
      removing.current = false;
      setBusy(null);
      setFocusRequest((current) => current + 1);
    }
  };

  const askRemoveConfirmation = (address) => {
    showDialog(
      t('dialogAdvice.confirmDeleteTitle'),
      <>
        {t('contactRecipients.confirmDelete')}
        {'\n'}
        <strong className="font-bold">{address}</strong>
      </>,
      { onConfirm: () => handleRemove(address) }
    );
  };

  let describedBy;
  if (atMax) describedBy = maxHintId;
  else if (isLoadingList) describedBy = loadingHintId;
  else if (isError) describedBy = loadErrorId;

  const renderList = () => {
    if (isError) {
      return (
        <div>
          <InlineError id={loadErrorId}>{t('contactRecipients.errorLoad')}</InlineError>
          <ButtonAlternative text={t('feedback.retry')} onClick={fetchRecipients} />
        </div>
      );
    }
    if (recipients.length === 0) {
      if (isLoadingList) return null;
      return <p className="text-base text-ink">{t('contactRecipients.empty')}</p>;
    }
    return (
      <>
        <ul aria-label={t('contactRecipients.listLabel')} className="rounded-xl border border-brand-dark px-3 py-1">
          {recipients.map((item) => (
            <li key={normalizeEmail(item.email)} className="flex min-h-12 items-center justify-between gap-2 text-ink">
              <span className="min-w-0 break-all text-base font-normal">{item.email}</span>
              <ButtonPrincipal
                icon="close"
                className="shrink-0"
                ariaLabel={t('contactRecipients.removeRecipient', { name: item.email })}
                disabled={busy !== null}
                inactive={atMin}
                aria-describedby={atMin ? lastHintId : undefined}
                onClick={() => askRemoveConfirmation(item.email)}
              />
            </li>
          ))}
        </ul>
        {atMin && <p id={lastHintId} className={HINT_CLASS}>{t('contactRecipients.lastRecipient')}</p>}
      </>
    );
  };

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className="focus-heading py-4 text-[32px] font-bold leading-tight text-brand-deep"
        >
          {t('contactRecipients.title')}
        </h1>
        <InfoButton
          topic={t('contactRecipients.title')}
          tooltipText={t('contactRecipients.tooltip', { max: RECIPIENTS_MAX })}
        />
        {!isError && !isLoadingList && (
          <p className="text-sm text-moss">
            {t('contactRecipients.counter', { count: recipients.length, max: RECIPIENTS_MAX })}
          </p>
        )}
      </div>

      <div>
        <form noValidate onSubmit={handleAdd} className="flex flex-wrap items-end gap-stack">
          <div className="min-w-0 flex-1 basis-64">
            <TextInput
              label={t('contactRecipients.label')}
              type="email"
              maxLength={EMAIL_MAX_LENGTH}
              value={email}
              onChange={handleEmailChange}
              invalid={!!fieldError}
              describedBy={fieldError ? errorId : undefined}
              inputRef={inputRef}
            />
          </div>
          <ButtonPrincipal
            text={t('contactRecipients.add')}
            type="submit"
            className="mb-stack-sm"
            loading={busy === 'add'}
            disabled={busy === 'remove'}
            inactive={atMax || !listReady}
            aria-describedby={describedBy}
          />
        </form>
        {fieldError && <InlineError id={errorId} announce={announceField}>{t(FIELD_ERRORS[fieldError])}</InlineError>}
        {isLoadingList && <p id={loadingHintId} className={HINT_CLASS}>{t('contactRecipients.loadingHint')}</p>}
        {atMax && <p id={maxHintId} className={HINT_CLASS}>{t('contactRecipients.maxReached', { max: RECIPIENTS_MAX })}</p>}
      </div>

      <div className="mt-2">
        <LoadSpinner inline label={isLoadingList ? t('contactRecipients.loading') : ''} />
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

export default ContactRecipientsManager;
