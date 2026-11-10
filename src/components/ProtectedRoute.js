import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ButtonPrincipal from './ButtonPrincipal';
import LoadSpinner from './LoadSpinner';
import api from '../services/api';
import { getAccessToken, logout } from '../services/session';

// 'checking' | 'ok' | 'denied' | 'unavailable'
const ProtectedRoute = ({ element }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState('checking');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const checkAuth = async () => {
      if (!getAccessToken()) { setStatus('denied'); return; }

      try {
        await api.getAuth('/auth');
        if (active) setStatus('ok');
      } catch (error) {
        if (active) setStatus(error.type === 'http' && error.status === 401 ? 'denied' : 'unavailable');
      }
    };
    checkAuth();
    return () => { active = false; };
  }, [attempt]);

  if (status === 'checking') return <LoadSpinner />;

  if (status === 'unavailable') {
    return (
      <div role="alert" className="p-6 text-[#0C1811]">
        <h1 className="text-2xl font-bold">{t('login.title')}</h1>
        <p>{t('login.serviceUnavailable')}</p>
        <ButtonPrincipal
          text={t('login.retryButton')}
          onClick={() => { setStatus('checking'); setAttempt((n) => n + 1); }}
        />
      </div>
    );
  }

  if (status === 'denied') return <Navigate to="/login" replace />;

  return (
    <>
      <div className="flex justify-end p-4">
        <ButtonPrincipal text={t('login.logOutButton')} onClick={logout} />
      </div>
      {element}
    </>
  );
};

export default ProtectedRoute;
