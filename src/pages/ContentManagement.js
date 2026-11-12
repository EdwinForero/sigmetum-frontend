import { React } from 'react';
import { useTranslation } from 'react-i18next';
import TermsManager from '../components/TermsManager';
import ImageGalleryManager from '../components/ImageGalleryManager';

const ContentManagement = () => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-5 pb-6">
      <h1 className="py-4 text-[32px] font-bold leading-tight text-brand-deep">
        {t('contentManagement.title')}
      </h1>
      <p className="text-left text-base text-ink sm:text-lg">
        {t('contentManagement.description')}
      </p>
      <div className="grid gap-6 py-4 lg:grid-cols-2">
        <TermsManager />
        <ImageGalleryManager />
      </div>
    </div>
  );
};

export default ContentManagement;
