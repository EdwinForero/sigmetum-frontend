import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ButtonPrincipal from './ButtonPrincipal';
import { startLogin } from '../services/session';

const LoginForm = () => {
  const [hasError, setHasError] = useState(false);
  const { t } = useTranslation();

  const handleLogin = () => {
    setHasError(false);
    startLogin().catch(() => setHasError(true));
  };

  return (
    <div className="bg-[#F9FBFA] p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
      <h2 className="text-2xl font-bold text-left text-[#15B659] tracking-tight px-4 pb-3 pt-5">
        {t('login.title')}
      </h2>
      {hasError && (
        <div className="flex justify-center px-4 mb-4">
          <span role="alert" className="text-[#15B659] px-2">{t('login.startError')}</span>
        </div>
      )}
      <div className="flex justify-center px-4">
        <ButtonPrincipal text={t('login.logInButton')} onClick={handleLogin} />
      </div>
    </div>
  );
};

export default LoginForm;
