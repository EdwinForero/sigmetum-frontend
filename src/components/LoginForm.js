import React, { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ButtonPrincipal from './ButtonPrincipal';
import api from '../services/api';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginErrorKey, setLoginErrorKey] = useState(null);
  const { t } = useTranslation();
  const id = useId();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const data = await api.post('/log', { username, password });
      localStorage.setItem('token', data.token);
      navigate('/cargar-archivos');
    } catch (error) {
      setLoginErrorKey(error.status === 429 ? 'login.tooManyAttemptsLabel' : 'login.unauthorizedLabel');
    }
  };

  return (
    <div className="bg-[#F9FBFA] p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
      <h2 className="text-2xl font-bold text-left text-[#15B659] tracking-tight px-4 pb-3 pt-5">
        {t('login.title')}
      </h2>
      <form
        className="flex flex-col"
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >
        <div className="mb-4 px-4">
          <label htmlFor={`${id}-user`} className="block text-[#111418] text-base font-medium mb-2">
            {t('login.userLable')}
          </label>
          <input
            id={`${id}-user`}
            type="text"
            placeholder={t('login.userPlaceholder')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input w-full h-12 px-3 border border-[#15B659] rounded-lg placeholder:text-[#99BBA8] text-[#0C1811] focus:outline-none"
          />
        </div>
        <div className="mb-4 px-4">
          <label htmlFor={`${id}-password`} className="block text-[#0C1811] text-base font-medium mb-2">
            {t('login.passwordLable')}
          </label>
          <div className="flex space-x-4 w-full border border-[#15B659] rounded-lg">
            <input
              id={`${id}-password`}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input w-full rounded-lg h-12 px-3 placeholder:text-[#99BBA8] bg-[#F9FBFA] text-[#0C1811] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[#15B659] px-2"
            >
              {showPassword ? t('login.passwordHideButton') : t('login.passwordShowButton')}
            </button>
          </div>
        </div>
        {loginErrorKey && (
          <div className="flex justify-center px-4 mb-4">
            <span role="alert" className="text-[#15B659] px-2">{t(loginErrorKey)}</span>
          </div>
        )}
        <div className="flex justify-center px-4">
          <ButtonPrincipal text={t('login.logInButton')} />
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
