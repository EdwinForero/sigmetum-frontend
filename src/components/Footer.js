import  React  from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {

    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();
    
    return (
            <div className="flex min-w-screen flex-1 flex-col">
                <footer className="flex flex-col gap-6 px-5 py-10 text-center">
                <div className="flex flex-wrap items-center justify-center gap-6 md:flex-row md:justify-around">
                    <Link to="/" className="text-[#FFFFFF] text-base font-normal leading-normal min-w-40 hover:underline">
                        {t('footer.homeOption')}
                    </Link>
                    <Link to="/explorar" className="text-[#FFFFFF] text-base font-normal leading-normal min-w-40 hover:underline">
                        {t('footer.exploreOption')}
                    </Link>
                    <Link to="/sobre-nosotros" className="text-[#FFFFFF] text-base font-normal leading-normal min-w-40 hover:underline">
                        {t('footer.aboutUsOption')}
                    </Link>
                    <Link to="/cookies" className="text-[#FFFFFF] text-base font-normal leading-normal min-w-40 hover:underline">
                        {t('footer.cookies')}
                    </Link>
                </div>
                
                </footer>
                <p className="text-[#FFFFFF] text-base text-center font-normal leading-normal mb-2">&copy; {t('footer.copyright', {currentYear})}</p>
            </div>
    );
  };
  
  export default Footer;