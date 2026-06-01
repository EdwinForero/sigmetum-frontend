import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import DialogAdvice from '../components/DialogAdvice';
import LoadSpinner from '../components/LoadSpinner';
import api from '../services/api';

const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp < Date.now() / 1000;
  } catch {
    return true;
  }
};

const ProtectedRoute = ({ element }) => {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setIsAuthenticated(false); return; }

      try {
        await api.getAuth('/auth');
        if (isTokenExpired(token)) {
          setShowDialog(true);
        } else {
          setIsAuthenticated(true);
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  const handleCloseDialog = () => {
    setShowDialog(false);
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) return <LoadSpinner />;

  if (showDialog) {
    return (
      <DialogAdvice
        onClose={handleCloseDialog}
        dialogTitle={t('tokenExpiration.title')}
        dialogMessage={t('tokenExpiration.content')}
      />
    );
  }

  return isAuthenticated ? element : <Navigate to="/login" />;
};

export default ProtectedRoute;
