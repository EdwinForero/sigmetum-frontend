import React, { useState, useEffect, useRef } from 'react';
import ButtonPrincipal from './ButtonPrincipal';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

const BUTTON_ID = 'navbar-menu-button';
const PANEL_ID = 'navbar-menu-panel';

const Navbar = () => {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setShowDropdown((current) => !current);
  const closeDropdown = () => setShowDropdown(false);

  useEffect(() => {
    if (!showDropdown) return undefined;

    const handleClickOutside = (event) => {
      const button = document.getElementById(BUTTON_ID);
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) && !button?.contains(event.target)) {
        closeDropdown();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      closeDropdown();
      document.getElementById(BUTTON_ID)?.focus();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDropdown]);

  const menuItems = [
    { label: t('navbar.homeOption'), path: '/' },
    { label: t('navbar.exploreOption'), path: '/explorar' },
    { label: t('navbar.galleryOption'), path: '/galeria' },
    { label: t('navbar.aboutUsOption'), path: '/sobre-nosotros' },
  ];

  const desktopClass = ({ isActive }) =>
    `focus-ring-inset flex h-full w-full items-center justify-center px-6 text-center font-bold text-ink ${
      isActive ? 'bg-brand' : 'hover:bg-brand'
    }`;
  const panelClass = ({ isActive }) =>
    `focus-ring-inset flex min-h-11 items-center px-4 py-2 font-bold text-ink ${
      isActive ? 'bg-brand' : 'hover:bg-brand'
    }`;

  return (
    <nav aria-label={t('navbar.label')} className="relative flex h-full items-center justify-end">
      <ul className="hidden h-full w-full md:flex">
        {menuItems.map((item) => (
          <li key={item.path} className="h-full flex-[2]">
            <NavLink to={item.path} end className={desktopClass}>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <ButtonPrincipal
        id={BUTTON_ID}
        icon="menu"
        ariaLabel={t('iconButton.menu')}
        onClick={toggleDropdown}
        aria-expanded={showDropdown}
        aria-controls={PANEL_ID}
        className="md:hidden"
      />

      {showDropdown && (
        <div
          id={PANEL_ID}
          ref={dropdownRef}
          className="absolute right-0 top-full w-56 max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-sage bg-surface shadow-lg"
        >
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path} end onClick={closeDropdown} className={panelClass}>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
