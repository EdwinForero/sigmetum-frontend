import { useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ButtonPrincipal from './ButtonPrincipal';
import useDialogFocus from '../hooks/useDialogFocus';
import api from '../services/api';

const itemBase =
  'focus-ring-inset flex h-full w-full flex-col items-center justify-center gap-0.5 px-0.5 text-center text-xs leading-tight break-words hyphens-auto text-ink hover:bg-brand md:min-h-[72px] md:rounded-lg md:text-sm';
const itemInactive = 'font-medium border-transparent';
const itemActive = 'bg-brand font-bold border-ink border-t-4 md:border-t-0 md:border-l-4';

const NavItem = ({ icon, label, children }) => (
  <>
    <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
    <span>{label}</span>
    {children}
  </>
);

const Sidebar = ({ exploreData, menuOptions, showLogout = false }) => {
  const { t } = useTranslation();
  const [activeComponent, setActiveComponent] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const panelId = useId();
  const location = useLocation();

  const exclusions = {
    '/explorar': ['dataManagement', 'uploadFiles', 'dataManagementFilter', 'contentManagement'],
    '/cargar-archivos': ['filter', 'dataManagementFilter'],
    '/administrar-datos': ['filter'],
    '/administrar-contenido': ['filter', 'dataManagementFilter'],
  };

  const path = location.pathname.replace(/\/+$/, '') || '/';

  const filteredMenuOptions = menuOptions.filter((option) => {
    const excludedOptions = exclusions[path] || [];
    if (excludedOptions.includes(option.id)) return false;
    if (path === '/explorar' && option.id === 'filter' && !exploreData) return false;
    return true;
  });

  const close = () => setIsOpen(false);
  const dialogRef = useDialogFocus(isOpen, close);

  const handleOpen = (optionId) => {
    setActiveComponent(optionId);
    setIsOpen(true);
  };

  const handleLogout = () => {
    setLoggingOut(true);
    api.logout();
  };

  const panelOptions = filteredMenuOptions.filter((option) => option.component);

  return (
    <>
      <nav
        aria-label={t('privateNav.label')}
        className="fixed inset-x-0 bottom-0 z-40 h-nav border-t-2 border-brand bg-surface md:inset-x-auto md:bottom-0 md:left-0 md:top-16 md:h-auto md:w-28 md:border-r-2 md:border-t-0 md:p-2"
      >
        <ul className="flex h-full md:flex-col md:gap-1">
          {filteredMenuOptions.map((option) => (
            <li key={option.id} className="h-full min-w-0 flex-1 md:h-auto md:flex-none">
              {option.link ? (
                <NavLink
                  to={option.link}
                  end
                  className={({ isActive }) => `${itemBase} ${isActive ? itemActive : itemInactive}`}
                >
                  <NavItem icon={option.icon} label={option.name} />
                </NavLink>
              ) : (
                <button
                  type="button"
                  aria-expanded={isOpen && activeComponent === option.id}
                  aria-controls={panelId}
                  onClick={() => handleOpen(option.id)}
                  className={`${itemBase} ${itemInactive}`}
                >
                  <NavItem icon={option.icon} label={option.name} />
                </button>
              )}
            </li>
          ))}
          {showLogout && (
            <li className="h-full min-w-0 flex-1 md:h-auto md:flex-none">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className={`${itemBase} ${itemInactive} disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <NavItem icon="logout" label={t('login.logOutButton')} />
              </button>
            </li>
          )}
        </ul>
      </nav>

      {isOpen && <div className="fixed inset-0 z-[60] bg-ink bg-opacity-70" onClick={close} aria-hidden="true" />}

      <div
        id={panelId}
        ref={dialogRef}
        hidden={!isOpen}
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? 'true' : undefined}
        aria-label={isOpen ? t('privateNav.filters') : undefined}
        tabIndex={-1}
        className="fixed inset-y-0 left-0 z-[60] w-full max-w-sm overflow-y-auto bg-surface py-4"
      >
        <div className="flex justify-end px-2">
          <ButtonPrincipal icon="close" ariaLabel={t('iconButton.close')} onClick={close} />
        </div>
        <div className="min-h-full px-4 pb-6">
          {panelOptions.map((option) => (
            <div key={option.id} hidden={option.id !== activeComponent}>
              {option.component}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
