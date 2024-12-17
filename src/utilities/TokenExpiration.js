import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { useTranslation } from 'react-i18next';
import DialogAdvice from '../components/DialogAdvice';

const isTokenExpired = (token) => {
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    console.error('Error al decodificar el token:', error);
    return true;
  }
};

const useTokenExpirationHandler = (token) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (token && isTokenExpired(token)) {
      setShowDialog(true);
    }
  }, [token]);

  const handleCloseDialog = () => {
    setShowDialog(false);
    navigate('/login');
  };

  return (
    <>
      {showDialog && (
        <DialogAdvice
          onClose={handleCloseDialog}
          dialogTitle={t('tokenExpiration.title')}
          dialogMessage={t('tokenExpiration.content')}
        />
      )}
    </>
  );
};

export default useTokenExpirationHandler;