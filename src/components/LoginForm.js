import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ButtonPrincipal from './ButtonPrincipal';
import ButtonAlternative from './ButtonAlternative';
import QrCode from './QrCode';
import formatSecret from '../utilities/formatSecret';
import useCognitoLogin from '../hooks/useCognitoLogin';

const FIELD_CLASS = 'focus-ring block w-full h-12 px-3 rounded-lg border-2 border-[#4B644A] bg-white text-[#0C1811]';

// Campo con su etiqueta: el span con id da el nombre accesible (aria-labelledby) y evita avisos de jsx-a11y.
// Ningún campo lleva `name`: el autocompletado funciona con `autoComplete` y nada puede viajar en una URL.
const Field = ({ id, label, inputRef, describedBy, ...props }) => (
  <label htmlFor={id} className="block px-4 mb-4">
    <span id={`${id}-label`} className="block mb-1 font-bold text-[#0C1811]">{label}</span>
    <input
      id={id}
      ref={inputRef}
      aria-labelledby={`${id}-label`}
      aria-describedby={describedBy}
      required
      className={FIELD_CLASS}
      {...props}
    />
  </label>
);

// Campo de contraseña con botón de mostrar u ocultar. El botón va fuera de la <label> (un <button> no puede ir dentro).
// Es el mismo <input> (mismo tipo de elemento, posición y sin `key`): solo cambia `type`, así se conservan valor y selección.
// Siempre sin corrector, sin mayúscula automática y sin autocorrección: con type="text" el corrector del navegador podría enviar el texto.
const PasswordField = ({ id, label, inputRef, describedBy, visible, onToggle, toggleLabel, ...props }) => (
  <div className="relative px-4 mb-4">
    <label htmlFor={id} className="block">
      <span id={`${id}-label`} className="block mb-1 font-bold text-[#0C1811]">{label}</span>
      <input
        id={id}
        ref={inputRef}
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        required
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        className={`${FIELD_CLASS} pr-12`}
        {...props}
        type={visible ? 'text' : 'password'}
      />
    </label>
    <button
      type="button"
      aria-label={toggleLabel}
      aria-pressed={visible}
      onClick={onToggle}
      className="focus-ring absolute bottom-0 right-4 flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg text-[#4B644A]"
    >
      <span className="material-symbols-outlined" aria-hidden="true">{visible ? 'visibility_off' : 'visibility'}</span>
    </button>
  </div>
);

const LoginForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useCognitoLogin({ onAuthenticated: () => navigate('/cargar-archivos', { replace: true }) });
  const { step, busy, error } = login;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [code, setCode] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  // Visibilidad de cada contraseña por id de campo; todas vuelven a ocultas al enviar (sin temporizador ni onBlur).
  const [shown, setShown] = useState({});

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const codeRef = useRef(null);
  const titleRef = useRef(null);
  const previousStep = useRef('credentials');

  // Foco: al cambiar de paso, al título del reto (o al correo si se vuelve a credenciales); tras un error, a un campo.
  useEffect(() => {
    const changed = previousStep.current !== step;
    previousStep.current = step;
    if (changed) {
      (step === 'credentials' ? emailRef : titleRef).current?.focus();
    } else if (error) {
      // En credenciales, con un campo vacío el foco va al primero vacío (el valor se lee del DOM: el estado ya se vació).
      const credentialsField = emailRef.current?.value ? passwordRef : emailRef;
      const field = { credentials: credentialsField, newPassword: newPasswordRef, mfaSetup: codeRef, totp: codeRef }[step];
      field.current?.focus();
    }
  }, [step, error]);

  useEffect(() => {
    setCopyStatus('');
  }, [step]);

  const errorId = 'login-error';
  const describedBy = error ? errorId : undefined;
  // aria-invalid solo con errores de validación; con "campos obligatorios", solo en los campos vacíos.
  const VALIDATION_KEYS = ['login.requiredFields', 'login.passwordPolicyError', 'login.passwordMismatch', 'login.codeFormatError'];
  const invalidFor = (value) =>
    error && VALIDATION_KEYS.includes(error.key) && (error.key !== 'login.requiredFields' || !value) ? 'true' : undefined;
  const retrying = step === 'mfaSetup' && Boolean(login.retry);

  // Alternar deja el foco en el botón (Safari y Firefox en macOS no enfocan un botón al pulsarlo con el ratón).
  const toggleShown = (id) => (event) => {
    setShown((current) => ({ ...current, [id]: !current[id] }));
    event.currentTarget.focus();
  };
  const passwordProps = (id, toggleLabelKey) => ({
    id,
    visible: Boolean(shown[id]),
    onToggle: toggleShown(id),
    toggleLabel: t(toggleLabelKey),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShown({});
    if (step === 'credentials') {
      try {
        await login.signIn(email, password);
      } finally {
        setPassword('');
        setShown({});
      }
    } else if (step === 'newPassword') {
      try {
        await login.submitNewPassword(newPassword, confirmation);
      } finally {
        setNewPassword('');
        setConfirmation('');
        setShown({});
      }
    } else {
      try {
        await (step === 'mfaSetup' ? login.confirmMfaSetup(code) : login.submitTotp(code));
      } finally {
        setCode('');
        setShown({});
      }
    }
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(login.secret);
      setCopyStatus('login.copied');
    } catch {
      setCopyStatus('login.copyFailed');
    }
  };

  const titles = { newPassword: 'login.newPasswordTitle', mfaSetup: 'login.mfaSetupTitle', totp: 'login.totpTitle' };
  const buttons = { credentials: 'login.logInButton', newPassword: 'login.continueButton', mfaSetup: 'login.verifyButton', totp: 'login.verifyButton' };
  const canCopy = step === 'mfaSetup' && !retrying && Boolean(navigator.clipboard?.writeText);

  const codeField = (
    <Field
      id="login-code"
      label={t('login.codeLabel')}
      inputRef={codeRef}
      describedBy={describedBy}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={7}
      aria-invalid={invalidFor(code)}
      value={code}
      onChange={(event) => setCode(event.target.value)}
    />
  );

  return (
    <div className="bg-[#F9FBFA] p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
      <h1 className="text-2xl font-bold text-left text-[#0C1811] tracking-tight px-4 pb-3 pt-5">
        {t('login.title')}
      </h1>
      {step !== 'credentials' && (
        <h2
          key={step}
          ref={titleRef}
          tabIndex={-1}
          className="focus-heading text-xl font-bold text-left text-[#0C1811] px-4 pb-3"
        >
          {t(titles[step])}
        </h2>
      )}
      {step === 'mfaSetup' && !retrying && (
        <>
          <p className="px-4 mb-4 text-[#0C1811]">{t('login.mfaSetupHelp')}</p>
          {login.mfaSetupAgain && <p className="px-4 mb-4 font-bold text-[#0C1811]">{t('login.mfaSetupAgain')}</p>}
          <p className="px-4 mb-1 font-bold text-[#0C1811]">{t('login.secretLabel')}</p>
          <p className="px-4 mb-4 text-[#0C1811]"><code>{formatSecret(login.secret)}</code></p>
          {canCopy && (
            <div className="flex justify-center px-4 mb-4">
              <ButtonAlternative text={t('login.copyButton')} onClick={copySecret} />
            </div>
          )}
          {login.otpUri && (
            <div className="flex justify-center px-4 mb-4">
              <QrCode value={login.otpUri} label={t('login.qrLabel')} />
            </div>
          )}
        </>
      )}
      <form noValidate method="post" onSubmit={handleSubmit}>
        {error && (
          <p key={error.seq} id={errorId} role="alert" className="px-4 mb-4 font-bold text-[#0C1811]">
            {t(error.key)}
          </p>
        )}

        {step === 'credentials' && (
          <>
            <p className="px-4 mb-4 text-[#0C1811]">{t('login.allRequired')}</p>
            <Field
              id="login-email"
              label={t('login.emailLabel')}
              inputRef={emailRef}
              describedBy={describedBy}
              type="email"
              autoComplete="username"
              maxLength={254}
              aria-invalid={invalidFor(email)}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <PasswordField
              {...passwordProps('login-password', 'login.showPassword')}
              label={t('login.passwordLabel')}
              inputRef={passwordRef}
              describedBy={describedBy}
              autoComplete="current-password"
              maxLength={256}
              aria-invalid={invalidFor(password)}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </>
        )}

        {step === 'newPassword' && (
          <>
            <p id="login-password-policy" className="px-4 mb-4 text-[#0C1811]">{t('login.passwordPolicy')}</p>
            <Field
              id="login-username"
              label={t('login.emailLabel')}
              type="email"
              autoComplete="username"
              readOnly
              value={email}
            />
            <PasswordField
              {...passwordProps('login-new-password', 'login.showNewPassword')}
              label={t('login.newPasswordLabel')}
              inputRef={newPasswordRef}
              describedBy={[describedBy, 'login-password-policy'].filter(Boolean).join(' ')}
              autoComplete="new-password"
              maxLength={256}
              aria-invalid={invalidFor(newPassword)}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <PasswordField
              {...passwordProps('login-confirm-password', 'login.showConfirmPassword')}
              label={t('login.confirmPasswordLabel')}
              describedBy={[describedBy, 'login-password-policy'].filter(Boolean).join(' ')}
              autoComplete="new-password"
              maxLength={256}
              aria-invalid={invalidFor(confirmation)}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </>
        )}

        {step === 'mfaSetup' && !retrying && codeField}

        {step === 'totp' && codeField}

        <div className="flex justify-center px-4">
          <ButtonPrincipal type="submit" disabled={busy} text={t(retrying ? 'login.retryButton' : buttons[step])} />
        </div>
      </form>

      <p role="status" className="px-4 mt-4 text-[#0C1811]">{busy ? t('login.loading') : copyStatus && t(copyStatus)}</p>
    </div>
  );
};

export default LoginForm;
