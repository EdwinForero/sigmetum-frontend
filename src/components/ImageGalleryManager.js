import { React, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import InfoButton from './InfoButton';
import TextInput from './TextInput';
import LoadSpinner from './LoadSpinner';
import DialogAdvice from './DialogAdvice';
import ButtonPrincipal from './ButtonPrincipal';
import ButtonAlternative from './ButtonAlternative';
import api from '../services/api';
import useDialog from '../hooks/useDialog';

const ImageGalleryManager = () => {
  const { t } = useTranslation();
  const [imageTitle, setImageTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const { dialog, showDialog, closeDialog } = useDialog();

  useEffect(() => { fetchImageUrls(); }, []);

  const fetchImageUrls = async () => {
    setIsError(false);
    try {
      const data = await api.get('/list-images');
      if (data) {
        setImages(data.filter((image) => image.fileName.trim() !== ''));
      }
    } catch {
      setIsError(true);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setImageFile(selectedFile);
  };

  const handleImageUpload = async () => {
    if (!imageFile || !imageTitle) {
      showDialog(t('dialogAdvice.adviceTitle'), t('dialogAdvice.adviceNoImageData'));
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('title', imageTitle);
      await api.postFormAuth('/upload-image', formData);
      showDialog(t('dialogAdvice.successTitle'), t('dialogAdvice.successUploadImage'));
      fetchImageUrls();
    } catch {
      showDialog(t('dialogAdvice.errorTitle'), t('dialogAdvice.errorUploadImage'));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteImage = async (imageKey) => {
    setIsLoading(true);
    try {
      await api.deleteAuth('/delete-image', { imageKey });
      showDialog(t('dialogAdvice.successTitle'), t('dialogAdvice.successDeleteImage'));
      fetchImageUrls();
    } catch {
      showDialog(t('dialogAdvice.errorTitle'), t('dialogAdvice.errorDeleteImage'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderList = () => {
    if (isLoading) {
      return (
        <div className="flex bg-[#F9FBFA] justify-center items-center min-h-[100px]">
          <LoadSpinner />
        </div>
      );
    }
    if (isError) {
      return <p className="text-[#0C1811] text-base">{t('dialogAdvice.errorLoadData')}</p>;
    }
    if (images.length === 0) {
      return <p className="text-[#0C1811] text-lg font-semibold">{t('contentManagement.noImagesFoundPlaceholder')}</p>;
    }
    return images.map((image) => (
      <div key={image.fileName} className="flex items-center justify-between text-[#0C1811] mb-2">
        <p>{image.fileName}</p>
        <button className="text-[#15B659] cursor-pointer" onClick={() => deleteImage(image.fileName)}>
          <span className="material-symbols-outlined text-3xl mx-auto">delete</span>
        </button>
      </div>
    ));
  };

  return (
    <div className="flex min-w-72 flex-col gap-3 mx-auto">
      <div className="flex gap-3 flex-wrap items-center">
        <h3 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">
          {t('contentManagement.galleryManagementTitle')}
        </h3>
        <InfoButton tooltipText={t('contentManagement.galleryManagementTooltip')} />
      </div>

      <div className="flex flex-wrap justify-start items-center w-full space-x-4">
        <TextInput
          placeholderText={t('contentManagement.galleryManagementPlaceholder')}
          value={imageTitle}
          onChange={(e) => setImageTitle(e.target.value)}
        />
        <input
          type="file"
          accept="image/jpeg, image/png, image/gif, image/webp"
          onChange={handleFileChange}
          className="hidden"
          id="imageFileInput"
        />
        <ButtonAlternative
          text={t('contentManagement.selectImageButton')}
          onClick={() => document.getElementById('imageFileInput').click()}
        />
        <ButtonPrincipal className="mx-2" icon="add" onClick={handleImageUpload} />
      </div>

      <div className="mt-4">
        <div className="mt-2 max-h-40 overflow-y-auto bg-[#F9FBFA] p-2 rounded">
          {renderList()}
        </div>
      </div>

      <AnimatePresence>
        {dialog.visible && (
          <DialogAdvice dialogTitle={dialog.title} dialogMessage={dialog.message} onClose={closeDialog} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ImageGalleryManager;
