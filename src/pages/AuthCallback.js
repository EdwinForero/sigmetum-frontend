import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ButtonPrincipal from '../components/ButtonPrincipal';
import api from '../services/api';
import { startLogin, takePkce } from '../services/session';

const AuthCallback = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);
  // El código de autorización solo se puede canjear una vez (y StrictMode ejecuta el efecto dos veces).
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const code = searchParams.get('code');
    const returnedState = searchParams.get('state');
    const returnedError = searchParams.get('error');
    // El código y el state no deben quedarse en la barra de direcciones ni en el historial: se quitan ya,
    // antes de validar o canjear (así no se navega al callback si el usuario sale mientras el canje está en vuelo).
    navigate('/auth/callback', { replace: true });
    const { verifier, state } = takePkce();
    if (returnedError || !code || !verifier || !state || returnedState !== state) {
      setHasError(true);
      return;
    }
    api
      .exchangeCode(code, verifier)
      .then(() => navigate('/cargar-archivos', { replace: true }))
      .catch(() => setHasError(true));
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#99BBA8]">
      <div className="bg-[#F9FBFA] p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h1 className="text-2xl font-bold text-left text-[#15B659] tracking-tight px-4 pb-3 pt-5">
          {t('login.title')}
        </h1>
        {hasError ? (
          <>
            <p role="alert" className="px-4 mb-4 text-[#0C1811]">{t('login.callbackError')}</p>
            <div className="flex justify-center px-4">
              <ButtonPrincipal text={t('login.retryButton')} onClick={() => startLogin().catch(() => setHasError(true))} />
            </div>
          </>
        ) : (
          <p role="status" className="px-4 text-[#0C1811]">{t('login.callbackLoading')}</p>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
