import { React } from 'react';
import FileUpload from '../components/FileUpload.js';
import { useTranslation } from 'react-i18next';
import { H1_TOOL, PROSE } from '../utilities/contentStyles';

const FilesUpload = () => {
  const { t } = useTranslation();

  return (
    <div className="page-container pt-stack pb-stack-lg animate-page-fade motion-reduce:animate-none">
      <h1 className={`mb-stack-lg ${H1_TOOL}`}>
        {t('uploadFiles.title')}
      </h1>
      <div className="max-w-3xl">
        <p className={PROSE}>
          {t('uploadFiles.description')}
        </p>
        <div className="py-stack">
          <FileUpload />
        </div>
      </div>
    </div>
  );
};

export default FilesUpload;
