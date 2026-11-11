import { React } from 'react';
import FileUpload from '../components/FileUpload.js';
import { useTranslation } from 'react-i18next';

const FilesUpload = () => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-3xl px-2 pb-6">
      <h1 className="py-4 text-[32px] font-bold leading-tight text-brand-deep">
        {t('uploadFiles.title')}
      </h1>
      <p className="text-left text-base text-ink sm:text-lg">
        {t('uploadFiles.description')}
      </p>
      <div className="py-5">
        <FileUpload />
      </div>
    </div>
  );
};

export default FilesUpload;
