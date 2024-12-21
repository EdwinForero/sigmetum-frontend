import { React, useState, useEffect } from 'react';

const ImageComponent = ({ imageKey, isBackground = false, className = '', children }) => {
  const [imageUrl, setImageUrl] = useState('');
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

  const fetchImage = async (imageKey) => {
    try {
      const response = await fetch(`${BASE_URL}/get-image?imageKey=${imageKey}`);
      const data = await response.json();
      setImageUrl(data.imageUrl);
    } catch (error) {
      console.error('Error fetching image:', error);
    }
  };

  useEffect(() => {
    if (imageKey) {
      fetchImage(imageKey);
    }
  }, [imageKey]);

  if (isBackground) {
    return (
        <div
        className={`${className} relative`}
        style={{
          backgroundImage: `linear-gradient(rgba(12, 24, 17, 0.7), rgba(12, 24, 17, 0.7)), url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '95vh',
        }}
      >
        {children}
      </div>
    );
  }

  return <img src={imageUrl} alt="Imagen" className={className} />;
};

export default ImageComponent;