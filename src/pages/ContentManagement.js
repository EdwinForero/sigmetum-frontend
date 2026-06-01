import { React } from 'react';
import { useTranslation } from 'react-i18next';
import TermsManager from '../components/TermsManager';
import ImageGalleryManager from '../components/ImageGalleryManager';

const ContentManagement = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-[#F9FBFA] min-h-screen layout-container flex h-full grow flex-col px-2">
      <div className="flex w-full flex-wrap justify-between gap-3 py-4">
        <div className="flex min-w-72 flex-col gap-3">
          <h2 className="text-[#15B659] tracking-light text-[32px] font-bold leading-tight">
            {t('contentManagement.title')}
          </h2>
        </div>
      </div>
      <p className="text-[#14281D] text-base text-justify sm:text-lg text-center">
        {t('contentManagement.description')}
      </p>
      <div className="layout-content-container flex flex-col w-full max-w-screen mx-auto">
        <div className="flex w-full flex-wrap gap-3 py-4">
          <TermsManager />
          <ImageGalleryManager />
        </div>
      </div>
    </div>
  );
};

export default ContentManagement;
