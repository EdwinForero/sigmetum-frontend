import {React, useState} from 'react';
import FileUpload from '../components/FileUpload.js';
import LoadSpinner from '../components/LoadSpinner.js';
import { useTranslation } from 'react-i18next';

const FilesUpload = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleOnLoad = (state) => {
    setIsLoading(state);
  }

    return (
      <div className="bg-[#F9FBFA] min-h-screen layout-container flex h-full grow flex-col px-2">
        <div className="flex w-full flex-wrap justify-between gap-3 py-4">
          <div className="flex min-w-72 flex-col gap-3">
            <h2 className="text-[#15B659] tracking-light text-[32px] font-bold leading-tight">
              {t('uploadFiles.title')}
            </h2>
          </div>
        </div>
        <p className="text-[#14281D] text-base text-justify sm:text-lg text-center">
            {t('uploadFiles.description')}
        </p>
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5 max-w-[960px] flex-1">
            <div className="flex flex-col p-4">
              <FileUpload onLoad={handleOnLoad}/>
            </div>
          </div>
        </div>
        {isLoading && (<LoadSpinner/>)}
      </div>
    );
};

export default FilesUpload;