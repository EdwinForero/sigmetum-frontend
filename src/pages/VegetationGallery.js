import { React, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const VegetationGallery = () => {
  const { t } = useTranslation();
  const [imageUrls, setImageUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    api.get('/list-images')
      .then((data) => {
        if (data.urls) {
          setImageUrls(data.urls.filter((image) => image.fileName.trim() !== ''));
        }
      })
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const renderContent = () => {
    if (isLoading) return null;
    if (isError) {
      return (
        <p className="text-center text-[#0C1811] text-lg font-semibold mt-8">
          {t('dialogAdvice.errorLoadData')}
        </p>
      );
    }
    if (imageUrls.length === 0) {
      return (
        <p className="text-center text-[#0C1811] text-lg font-semibold mt-8">
          {t('gallery.noDataFoundPlaceholder', 'No hay datos disponibles.')}
        </p>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 mx-auto">
        {imageUrls.map((image) => (
          <div
            key={image.fileName}
            className="relative flex items-center justify-center overflow-hidden w-[300px] h-[300px] mx-auto group"
          >
            <img
              src={image.url}
              alt={image.fileName}
              className="w-full h-full object-cover rounded-lg transition-opacity"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-[#0C1811] bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
              <p className="text-[#F9FBFA] text-xl font-bold">
                {image.fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <h2 className="text-[#15B659] tracking-light text-2xl sm:text-4xl font-bold leading-tight text-center mt-12 mb-8">
        {t('gallery.title')}
      </h2>
      {renderContent()}
    </>
  );
};

export default VegetationGallery;
