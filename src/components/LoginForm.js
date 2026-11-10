import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ButtonPrincipal from './ButtonPrincipal';
import ButtonAlternative from './ButtonAlternative';
import useCognitoLogin from '../hooks/useCognitoLogin';

const FIELD_CLASS = 'focus-ring w-full h-12 px-3 rounded-lg border-2 border-[#4B644A] bg-white text-[#0C1811]';

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step === 'credentials') {
      try {
        await login.signIn(email, password);
      } finally {
        setPassword('');
      }
    } else if (step === 'newPassword') {
      try {
        await login.submitNewPassword(newPassword, confirmation);
      } finally {
        setNewPassword('');
        setConfirmation('');
      }
    } else {
      try {
        await (step === 'mfaSetup' ? login.confirmMfaSetup(code) : login.submitTotp(code));
      } finally {
        setCode('');
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
          className="focus-ring text-xl font-bold text-left text-[#0C1811] px-4 pb-3"
        >
          {t(titles[step])}
        </h2>
      )}
      {step === 'mfaSetup' && !retrying && (
        <>
          <p className="px-4 mb-4 text-[#0C1811]">{t('login.mfaSetupHelp')}</p>
          {login.mfaSetupAgain && <p className="px-4 mb-4 font-bold text-[#0C1811]">{t('login.mfaSetupAgain')}</p>}
          <p className="px-4 font-bold text-[#0C1811]">{t('login.secretLabel')}</p>
          <p className="px-4 mb-4 text-[#0C1811]"><code className="break-all">{login.secret}</code></p>
          {canCopy && (
            <div className="flex justify-center px-4 mb-4">
              <ButtonAlternative text={t('login.copyButton')} onClick={copySecret} />
            </div>
          )}
          <p className="px-4 font-bold text-[#0C1811]">{t('login.otpUriLabel')}</p>
          <p className="px-4 mb-4 text-[#0C1811]"><code className="break-all">{login.otpUri}</code></p>
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
            <Field
              id="login-password"
              label={t('login.passwordLabel')}
              inputRef={passwordRef}
              describedBy={describedBy}
              type="password"
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
            <Field
              id="login-new-password"
              label={t('login.newPasswordLabel')}
              inputRef={newPasswordRef}
              describedBy={[describedBy, 'login-password-policy'].filter(Boolean).join(' ')}
              type="password"
              autoComplete="new-password"
              maxLength={256}
              aria-invalid={invalidFor(newPassword)}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <Field
              id="login-confirm-password"
              label={t('login.confirmPasswordLabel')}
              describedBy={[describedBy, 'login-password-policy'].filter(Boolean).join(' ')}
              type="password"
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
