import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import LanguageSwitcher from './LanguageSwitcher';
import ASSETS, { assetUrl } from '../config/assets';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  // La sombra separa la cabecera del contenido solo cuando este pasa por debajo.
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 flex h-16 items-center gap-2 bg-surface px-stack-sm transition-shadow motion-reduce:transition-none min-[360px]:px-gutter ${
        scrolled ? 'shadow-md' : ''
      }`}
    >
      <Link to="/" aria-label="SIGMETUM-A" className="focus-ring flex min-h-11 shrink-0 items-center gap-2 rounded-lg sm:gap-4">
        <img
          src={assetUrl(ASSETS.LOGO)}
          alt=""
          width={48}
          height={48}
          className="h-8 w-auto sm:h-12 mix-blend-multiply"
        />
        {/* Bajo 360 px solo queda el logo: el nombre sigue en el aria-label del enlace. */}
        <p className="whitespace-nowrap text-base font-bold text-ink max-[359px]:sr-only sm:text-xl">
          SIGMET<span className="text-red-500">U</span><span className="text-blue-500">M</span>-<span className="text-brand">A</span>
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
