import { React, useState, useEffect } from 'react';
import api from '../services/api';

const ImageComponent = ({ imageKey, directUrl, isBackground = false, className = '', alt = '', width, height, loading, children }) => {
  const [imageUrl, setImageUrl] = useState(directUrl || '');

  useEffect(() => {
    if (directUrl) {
      setImageUrl(directUrl);
      return;
    }
    if (!imageKey) return;
    api.get(`/get-image?imageKey=${encodeURIComponent(imageKey)}`)
      .then((data) => setImageUrl(data.imageUrl))
      .catch((error) => console.error('Error fetching image:', error));
  }, [imageKey, directUrl]);

  if (isBackground) {
    return (
      <div
        className={`${className} relative`}
        style={{
          // `ink` (#0C1811) al 70 %: un estilo en línea no admite clases.
          backgroundImage: `linear-gradient(rgba(12, 24, 17, 0.7), rgba(12, 24, 17, 0.7)), url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {children}
      </div>
    );
  }

  return <img src={imageUrl} alt={alt} width={width} height={height} loading={loading} className={className} />;
};

export default ImageComponent;
