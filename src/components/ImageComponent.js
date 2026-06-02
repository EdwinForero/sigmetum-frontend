import { React, useState, useEffect } from 'react';
import api from '../services/api';

const ImageComponent = ({ imageKey, directUrl, isBackground = false, className = '', children }) => {
  const [imageUrl, setImageUrl] = useState(directUrl || '');

  useEffect(() => {
    if (directUrl) {
      setImageUrl(directUrl);
      return;
    }
    if (!imageKey) return;
    api.get(`/get-image?imageKey=${imageKey}`)
      .then((data) => setImageUrl(data.imageUrl))
      .catch((error) => console.error('Error fetching image:', error));
  }, [imageKey, directUrl]);

  if (isBackground) {
    return (
      <div
        className={`${className} relative`}
        style={{
          backgroundImage: `linear-gradient(rgba(12, 24, 17, 0.7), rgba(12, 24, 17, 0.7)), url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
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
