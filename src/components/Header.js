import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import LanguageSwitcher from './LanguageSwitcher';
import ASSETS, { assetUrl } from '../config/assets';

const Header = () => {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-2 border-b-2 border-brand bg-surface px-2 sm:px-4">
      <Link to="/" aria-label="SIGMETUM-A" className="focus-ring flex min-h-11 shrink-0 items-center gap-2 rounded-lg sm:gap-4">
        <img src={assetUrl(ASSETS.LOGO)} alt="" className="h-8 sm:h-12 mix-blend-multiply" />
        <p className="whitespace-nowrap text-base font-bold text-ink sm:text-xl">
          SIGMET<span className="text-red-500">U</span><span className="text-blue-500">M</span>-<span className="text-[#15B659]">A</span>
        </p>
      </Link>
      <LanguageSwitcher />
      <div className="flex h-full flex-1 items-center justify-end">
        <Navbar />
      </div>
    </header>
  );
};

export default Header;
