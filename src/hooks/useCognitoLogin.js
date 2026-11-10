import { useEffect, useRef, useState } from 'react';
import api, { isRetryableAuthError } from '../services/api';
import { meetsPasswordPolicy } from '../utilities/passwordPolicy';

// Máquina de estados del acceso con Cognito: credentials | newPassword | mfaSetup | totp.
// No toca tokens (los guarda api) ni mantiene la contraseña: la reciben los manejadores y no se conserva.
// La Session del reto y USER_ID_FOR_SRP viven en refs (no se pintan); el secreto TOTP, en estado porque se muestra.
// `retry` recuerda el paso pendiente cuando un fallo reintentable llega con la contraseña o el código ya aceptados:
// 'associate' (repetir AssociateSoftwareToken) o 'respond' (repetir solo la respuesta MFA_SETUP, sin volver a verificar).

const CREDENTIAL_CODES = ['NotAuthorizedException', 'UserNotFoundException', 'PasswordResetRequiredException', 'UserNotConfirmedException'];
const CODE_REJECTED = ['CodeMismatchException', 'ExpiredCodeException', 'EnableSoftwareTokenMFAException'];
const TOTP_FORMAT = /^\d{6}$/;

// Quita los espacios (un código pegado como "123 456") y valida el formato; devuelve el código limpio o null.
const cleanCode = (code) => {
  const clean = code.replace(/\s/g, '');
  return TOTP_FORMAT.test(clean) ? clean : null;
};

const useCognitoLogin = ({ onAuthenticated }) => {
  const [step, setStep] = useState('credentials');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [secret, setSecret] = useState('');
  const [otpUri, setOtpUri] = useState('');
  const [mfaSetupAgain, setMfaSetupAgain] = useState(false);
  const [retry, setRetryState] = useState(null);

  const busyRef = useRef(false);
  const mountedRef = useRef(false);
  const sessionRef = useRef(null);
  const userIdRef = useRef(null);
  const emailRef = useRef('');
  const errorSeqRef = useRef(0);
  const secretIssuedRef = useRef(false);
  const retryRef = useRef(null);
  const codeRejectedRef = useRef(false);
  const onAuthenticatedRef = useRef(onAuthenticated);

  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
  });

  // StrictMode ejecuta el efecto, la limpieza y el efecto otra vez: la bandera se vuelve a poner a true.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      sessionRef.current = null;
      userIdRef.current = null;
    };
  }, []);

  // Solo actualiza el estado si el componente sigue montado.
  const ifMounted = (update) => {
    if (mountedRef.current) update();
  };

  const fail = (key) => {
    errorSeqRef.current += 1;
    const seq = errorSeqRef.current;
    ifMounted(() => setError({ key, seq }));
  };

  const setRetry = (value) => {
    retryRef.current = value;
    ifMounted(() => setRetryState(value));
  };

  const backToCredentials = (key) => {
    sessionRef.current = null;
    userIdRef.current = null;
    setRetry(null);
    ifMounted(() => {
      setSecret('');
      setOtpUri('');
      setStep('credentials');
    });
    fail(key);
  };

  const startMfaSetup = async () => {
    const { secretCode, session } = await api.associateSoftwareToken(sessionRef.current);
    if (!secretCode) throw Object.assign(new Error('missing_secret'), { type: 'invalid_response' });
    sessionRef.current = session;
    const uri = `otpauth://totp/SIGMETUM-A:${encodeURIComponent(emailRef.current)}?secret=${encodeURIComponent(secretCode)}&issuer=SIGMETUM-A`;
    const repeated = secretIssuedRef.current;
    secretIssuedRef.current = true;
    ifMounted(() => {
      setSecret(secretCode);
      setOtpUri(uri);
      setMfaSetupAgain(repeated);
      setStep('mfaSetup');
    });
  };

  // Pide el secreto TOTP. Si falla de forma reintentable, la contraseña nueva ya está guardada en Cognito:
  // se pasa al paso mfaSetup (sin secreto) con el reintento pendiente, para repetir solo esta llamada.
  const associate = async () => {
    setRetry('associate');
    try {
      await startMfaSetup();
      setRetry(null);
    } catch (e) {
      handleChallengeError(e);
      if (e.type !== 'config' && isRetryableAuthError(e)) {
        ifMounted(() => {
          setSecret('');
          setOtpUri('');
          setStep('mfaSetup');
        });
      }
    }
  };

  const handleResult = async (result) => {
    setRetry(null);
    if (result.done) {
      sessionRef.current = null;
      userIdRef.current = null;
      ifMounted(() => {
        setSecret('');
        setOtpUri('');
      });
      if (mountedRef.current) onAuthenticatedRef.current();
      return;
    }
    sessionRef.current = result.session;
    if (result.username) userIdRef.current = result.username;
    if (result.challenge === 'NEW_PASSWORD_REQUIRED') ifMounted(() => setStep('newPassword'));
    else if (result.challenge === 'SOFTWARE_TOKEN_MFA') ifMounted(() => setStep('totp'));
    else if (result.challenge === 'MFA_SETUP') await associate();
    else backToCredentials('login.startError');
  };

  // Errores de un reto: se queda en el paso o vuelve a credenciales según el caso.
  const handleChallengeError = (e) => {
    if (e.type === 'cognito' && CODE_REJECTED.includes(e.code)) {
      codeRejectedRef.current = true;
      setRetry(null);
      fail('login.codeError');
    } else if (e.type === 'cognito' && e.code === 'InvalidPasswordException') {
      fail('login.passwordRejected');
    } else if (e.type !== 'config' && isRetryableAuthError(e)) {
      fail('login.serviceUnavailable');
    } else if (e.type === 'cognito' && e.code === 'NotAuthorizedException') {
      backToCredentials(codeRejectedRef.current ? 'login.codeSessionLost' : 'login.sessionExpired');
    } else {
      backToCredentials('login.startError');
    }
  };

  const handleSignInError = (e) => {
    if (e.type === 'config') fail('login.startError');
    else if (isRetryableAuthError(e)) fail('login.serviceUnavailable');
    else if (e.type === 'cognito' && CREDENTIAL_CODES.includes(e.code)) fail('login.credentialsError');
    else fail('login.startError');
  };

  // busyRef impide el doble envío aunque dos eventos lleguen en el mismo tick (disabled aún no se habría pintado).
  const run = async (task, onError) => {
    if (busyRef.current) return;
    busyRef.current = true;
    ifMounted(() => {
      setBusy(true);
      setError(null);
    });
    try {
      await task();
    } catch (e) {
      onError(e);
    } finally {
      busyRef.current = false;
      ifMounted(() => setBusy(false));
    }
  };

  const signIn = (email, password) => {
    const username = email.trim();
    if (!username || !password) {
      fail('login.requiredFields');
      return Promise.resolve();
    }
    return run(async () => {
      emailRef.current = username;
      codeRejectedRef.current = false;
      await handleResult(await api.signIn(username, password));
    }, handleSignInError);
  };

  const submitNewPassword = (password, confirmation) => {
    if (!password || !confirmation) {
      fail('login.requiredFields');
      return Promise.resolve();
    }
    if (!meetsPasswordPolicy(password)) {
      fail('login.passwordPolicyError');
      return Promise.resolve();
    }
    if (password !== confirmation) {
      fail('login.passwordMismatch');
      return Promise.resolve();
    }
    return run(async () => {
      await handleResult(
        await api.respondToChallenge('NEW_PASSWORD_REQUIRED', sessionRef.current, {
          USERNAME: userIdRef.current,
          NEW_PASSWORD: password,
        })
      );
    }, handleChallengeError);
  };

  const confirmMfaSetup = (rawCode) => {
    if (retryRef.current === 'associate') return run(associate, handleChallengeError);
    const code = cleanCode(rawCode);
    // Con el código ya verificado, el reintento solo repite la respuesta del reto: no hace falta otro código.
    if (retryRef.current !== 'respond' && !code) {
      fail(rawCode ? 'login.codeFormatError' : 'login.requiredFields');
      return Promise.resolve();
    }
    return run(async () => {
      if (retryRef.current !== 'respond') {
        const verified = await api.verifySoftwareToken(sessionRef.current, code);
        if (verified.session) sessionRef.current = verified.session;
        if (!verified.ok) {
          codeRejectedRef.current = true;
          fail('login.codeError');
          return;
        }
        setRetry('respond');
      }
      await handleResult(await api.respondToChallenge('MFA_SETUP', sessionRef.current, { USERNAME: userIdRef.current }));
    }, handleChallengeError);
  };

  const submitTotp = (rawCode) => {
    const code = cleanCode(rawCode);
    if (!code) {
      fail(rawCode ? 'login.codeFormatError' : 'login.requiredFields');
      return Promise.resolve();
    }
    return run(async () => {
      await handleResult(
        await api.respondToChallenge('SOFTWARE_TOKEN_MFA', sessionRef.current, {
          USERNAME: userIdRef.current,
          SOFTWARE_TOKEN_MFA_CODE: code,
        })
      );
    }, handleChallengeError);
  };

  return { step, busy, error, secret, otpUri, mfaSetupAgain, retry, signIn, submitNewPassword, confirmMfaSetup, submitTotp };
};

export default useCognitoLogin;
