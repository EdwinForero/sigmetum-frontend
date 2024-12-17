import { React } from 'react';
import { useTranslation } from 'react-i18next';

const DataConfiguration = () => {

  const { t } = useTranslation();
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

    return (
      <div className="w-full max-w-screen px-2">
        <div className="layout-content-container flex flex-col w-full max-w-screen mx-auto">
          <div className="flex w-full flex-wrap justify-between gap-3 py-4">
            <div className="flex min-w-72 flex-col gap-3">
              <h2 className="text-[#15B659] tracking-light text-[32px] font-bold leading-tight">
                {t('dataConfiguration.title')}
              </h2>
            </div>
          </div>
        </div>
      </div>
    )
};

export default DataConfiguration;