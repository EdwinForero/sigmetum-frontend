import React, { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BUTTON_INACTIVE_CLASS, BUTTON_PRINCIPAL_CLASS } from './ButtonPrincipal';
import InlineError from './InlineError';
import TextInput from './TextInput';
import api from '../services/api';
import useToast from '../hooks/useToast';
import validateContact, { MESSAGE_MIN_LENGTH } from '../utilities/validateContact';

const FIELDS = ['username', 'email', 'subject', 'message'];
const NO_TOUCHED = { username: false, email: false, subject: false, message: false };

// Cada fallo de validación se explica en la lista de ayuda con su frase propia (sin concatenar frases).
const missingKey = (field, error) =>
  ({
    username: 'home.contactForm.missingName',
    email: error.key === 'form.errors.email' ? 'home.contactForm.invalidEmail' : 'home.contactForm.missingEmail',
    subject: 'home.contactForm.missingSubject',
    message: 'home.contactForm.shortMessage',
  })[field];

const ContactForm = ({ onLoad, onSent }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [touched, setTouched] = useState(NO_TOUCHED);
  // Campos pintados por un envío inválido: sin role (los lee el foco y el resumen) hasta que se editan.
  const [silent, setSilent] = useState(NO_TOUCHED);
  const [summaryCount, setSummaryCount] = useState(0);
  const sending = useRef(false);
  // La ref corta el doble envío al instante; el estado pone los campos en solo lectura mientras dura la petición.
  const [isSending, setIsSending] = useState(false);
  const { t } = useTranslation();
  const id = useId();
  const helpId = `${id}-help`;
  const { notifySuccess } = useToast();
  const [formError, setFormError] = useState(null);
  const refs = {
    username: useRef(null),
    email: useRef(null),
    subject: useRef(null),
    message: useRef(null),
  };

  const errors = validateContact({ username, email, subject, message });
  const isValid = Object.keys(errors).length === 0;
  const errorText = (field) =>
    touched[field] && errors[field] ? t(errors[field].key, { count: errors[field].count }) : undefined;
  const touch = (field) => () => setTouched((current) => ({ ...current, [field]: true }));
  const edit = (field, setter) => (e) => {
    setter(e.target.value);
    setSilent((current) => (current[field] ? { ...current, [field]: false } : current));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending.current) return;
    if (!isValid) {
      setTouched({ username: true, email: true, subject: true, message: true });
      setSilent({ username: true, email: true, subject: true, message: true });
      setSummaryCount(Object.keys(errors).length);
      refs[FIELDS.find((field) => errors[field])].current?.focus();
      return;
    }
    sending.current = true;
    setIsSending(true);
    onLoad(true);
    setFormError(null);
    try {
      await api.post('/send-email', { username, email, subject, message });
      notifySuccess(t('dialogAdvice.successEmailMessage'));
      setUsername('');
      setEmail('');
      setSubject('');
      setMessage('');
      setTouched(NO_TOUCHED);
      setSilent(NO_TOUCHED);
      setSummaryCount(0);
      onSent?.();
    } catch (error) {
      const messageKey =
        error.status === 429
          ? 'dialogAdvice.errorEmailRateLimit'
          : error.status === 400
            ? 'dialogAdvice.errorEmailInvalid'
            : 'dialogAdvice.errorEmailMessage';
      setFormError(messageKey);
    } finally {
      sending.current = false;
      setIsSending(false);
      onLoad(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col">
      <p className="text-base text-ink">{t('home.contactForm.allRequired')}</p>

      <TextInput
        id={`${id}-name`}
        label={t('home.contactForm.nameLabel')}
        placeholderText={t('home.contactForm.namePlaceholder')}
        hint={t('home.contactForm.nameHint')}
        error={errorText('username')}
        announceError={!silent.username}
        inputRef={refs.username}
        autoComplete="name"
        maxLength={100}
        required
        readOnly={isSending}
        value={username}
        onChange={edit('username', setUsername)}
        onBlur={touch('username')}
      />

      <TextInput
        id={`${id}-email`}
        label={t('home.contactForm.emailLabel')}
        placeholderText={t('home.contactForm.emailPlaceholder')}
        hint={t('home.contactForm.emailHint')}
        error={errorText('email')}
        announceError={!silent.email}
        inputRef={refs.email}
        type="email"
        autoComplete="email"
        maxLength={254}
        required
        readOnly={isSending}
        value={email}
        onChange={edit('email', setEmail)}
        onBlur={touch('email')}
      />

      <TextInput
        id={`${id}-subject`}
        label={t('home.contactForm.subjectLabel')}
        placeholderText={t('home.contactForm.subjectPlaceholder')}
        hint={t('home.contactForm.subjectHint')}
        error={errorText('subject')}
        announceError={!silent.subject}
        inputRef={refs.subject}
        maxLength={150}
        required
        readOnly={isSending}
        value={subject}
        onChange={edit('subject', setSubject)}
        onBlur={touch('subject')}
      />

      <TextInput
        id={`${id}-message`}
        label={t('home.contactForm.messageLabel')}
        placeholderText={t('home.contactForm.messagePlaceholder')}
        hint={t('home.contactForm.messageHint', { min: MESSAGE_MIN_LENGTH })}
        error={errorText('message')}
        announceError={!silent.message}
        inputRef={refs.message}
        multiline
        maxLength={2000}
        required
        readOnly={isSending}
        value={message}
        onChange={edit('message', setMessage)}
        onBlur={touch('message')}
      />

      <p role="status" className="sr-only">
        {!isValid && summaryCount > 0 ? t('home.contactForm.errorSummary', { count: summaryCount }) : ''}
      </p>

      {formError && <InlineError>{t(formError)}</InlineError>}

      {!isValid && (
        <div id={helpId} className="mt-stack-sm text-sm text-ink">
          <p className="font-bold">{t('home.contactForm.submitHelpTitle')}</p>
          <ul className="mt-stack-xs list-disc pl-stack-lg">
            {FIELDS.filter((field) => errors[field]).map((field) => (
              <li key={field}>{t(missingKey(field, errors[field]), { min: MESSAGE_MIN_LENGTH })}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-stack flex justify-center">
        <button
          type="submit"
          aria-disabled={!isValid || undefined}
          aria-describedby={isValid ? undefined : helpId}
          className={isValid ? `${BUTTON_PRINCIPAL_CLASS} cursor-pointer` : BUTTON_INACTIVE_CLASS}
        >
          <span>{t('home.contactForm.sendButton')}</span>
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
