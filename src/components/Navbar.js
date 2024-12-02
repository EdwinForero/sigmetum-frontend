import React, { useState, useEffect, useRef } from 'react';
import ButtonPrincipal from './ButtonPrincipal';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => setShowDropdown(!showDropdown);
  const closeDropdown = () => setShowDropdown(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        closeDropdown();
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const menuItems = [
    { label: t('navbar.homeOption'), path: '/' },
    { label: t('navbar.exploreOption'), path: '/explorar' },
    { label: t('navbar.aboutUsOption'), path: '/sobre-nosotros' },
  ];

  return (
    <nav className="flex justify-end h-full items-center relative">
      <ul className="hidden md:flex h-full w-full">
        {menuItems.map((item) => (
          <li
            key={item.path}
            className={`flex-[2] h-full font-bold ${
              location.pathname === item.path
                ? 'bg-[#15B659] text-[#F9FBFA]'
                : 'text-[#0C1811] hover:bg-gray-200'
            }`}
          >
            <Link
              to={item.path}
              className="flex items-center justify-center h-full w-full text-center px-6"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <ButtonPrincipal
        icon="Menu"
        onClick={toggleDropdown}
        className="block md:hidden"
      />

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-20 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        >
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeDropdown}
              className={`block px-4 py-2 font-bold ${
                location.pathname === item.path
                  ? 'bg-[#15B659] text-[#F9FBFA]'
                  : 'text-[#0C1811] hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;