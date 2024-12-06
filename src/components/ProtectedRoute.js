import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import DialogAdvice from '../components/DialogAdvice';
import LoadSpinner from '../components/LoadSpinner';
import { useTranslation } from 'react-i18next';

const isTokenExpired = (
  token
) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return true;
  }
};

const ProtectedRoute = ({ element }) => {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

  const fetchProtectedData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const response = await fetch(`${BASE_URL}/auth`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const authValid = await fetchProtectedData();
      setIsAuthenticated(authValid);

      if (isAuthenticated && isTokenExpired(token)) {
        setShowDialog(true);
        return;
      }
    };

    checkAuth();
  }, []);

  const handleCloseDialog = () => {
    setShowDialog(false);
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return <LoadSpinner />;
  }

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