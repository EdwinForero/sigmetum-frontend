import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import LanguageSwitcher from './LanguageSwitcher';
import ASSETS, { assetUrl } from '../config/assets';

const Header = () => {
  useEffect(() => {
    const linkTag = document.querySelector("link[rel='icon']");
    if (linkTag) linkTag.href = assetUrl(ASSETS.LOGO);
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full bg-[#F9FBFA] border-b-2 border-[#15B659] flex items-center justify-between h-16 z-50">
      <Link to="/">
        <div className="flex items-center gap-4">
          <img src={assetUrl(ASSETS.LOGO)} alt="Logo" className="max-h-14 ml-4 mix-blend-multiply" />
          <p className="font-bold text-[#0C1811] text-base sm:text-xl">
            SIGMET<span className="text-red-500">U</span><span className="text-blue-500">M</span>-<span className="text-[#15B659]">A</span>
          </p>
        </div>
      </Link>
      <div className="mx-6">
        <LanguageSwitcher />
      </div>
      <div className="flex flex-1 h-full justify-end gap-8 items-center">
        <Navbar />
      </div>
    </header>
  );
};

export default Header;
