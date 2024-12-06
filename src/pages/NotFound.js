import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ButtonPrincipal from '../components/ButtonPrincipal';

const NotFound = () => {
  
  const { t } = useTranslation();

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-[#f9f8fc] group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <div className="px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <h1 className="text-[#15B659] tracking-light text-4xl font-bold leading-tight px-4 text-center pb-3 pt-6">404</h1>
            <p className="text-[#0C1811] text-base font-normal leading-normal pb-3 pt-1 px-4 text-center">{t('notFound.content')}</p>
            <div className="flex px-4 py-3 justify-center">
            <Link to="/">
                <ButtonPrincipal text={t('notFound.returnButton')}/>
            </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;