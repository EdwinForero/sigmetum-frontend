import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import LoadSpinner from './LoadSpinner';

const ProtectedRoute = ({ element, ...rest }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const BASE_URL = process.env.VITE_BASE_URL || 'http://sigmetum-backend.eu-west-3.elasticbeanstalk.com';

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
      const authValid = await fetchProtectedData();
      setIsAuthenticated(authValid);
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <LoadSpinner/>;
  }

  return isAuthenticated ? element : <Navigate to="/login" />;
};

export default ProtectedRoute;