import { useEffect, useId, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ButtonPrincipal from './ButtonPrincipal';
import useDialogFocus from '../hooks/useDialogFocus';
import api from '../services/api';
import { normalizePath } from '../config/routes';

const itemBase =
  'focus-ring-inset flex h-full w-full flex-col items-center justify-center gap-0.5 px-0 text-center text-[11px] leading-tight min-[360px]:px-0.5 min-[360px]:text-xs break-words hyphens-auto text-ink hover:bg-brand md:min-h-[72px] md:rounded-lg md:text-sm';
const itemInactive = 'font-normal border-transparent';
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

  const path = normalizePath(location.pathname);

  // En /explore solo van las opciones que abren un panel (sin `link`); en el resto, solo los enlaces.
  const filteredMenuOptions = menuOptions.filter((option) => {
    if (path === '/explore') return !option.link && (option.id !== 'filter' || Boolean(exploreData));
    return Boolean(option.link);
  });

  const close = () => setIsOpen(false);
  const dialogRef = useDialogFocus(isOpen, close);

  // El diálogo es modal: el body no se desplaza detrás (A6); se restaura al cerrar o desmontar.
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const handleOpen = (optionId) => {
    setActiveComponent(optionId);
    setIsOpen(true);
  };

  const handleLogout = () => {
    setLoggingOut(true);
    api.logout();
  };

  const panelOptions = filteredMenuOptions.filter((option) => option.component);
  const activeOption = panelOptions.find((option) => option.id === activeComponent);

  return (
    <>
      <nav
        aria-label={t('privateNav.label')}
        className="fixed inset-x-0 bottom-0 z-40 h-nav border-t-2 border-brand bg-surface md:sticky md:inset-x-auto md:bottom-auto md:top-16 md:h-[calc(100dvh-4rem)] md:w-28 md:shrink-0 md:self-start md:overflow-y-auto md:border-r-2 md:border-t-0 md:p-2"
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
                className={`${itemBase} ${itemInactive} disabled:cursor-not-allowed disabled:border-2 disabled:border-dashed disabled:border-moss disabled:text-moss disabled:hover:bg-transparent`}
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
        aria-labelledby={isOpen ? activeOption?.titleId : undefined}
        aria-label={isOpen && !activeOption?.titleId ? t('privateNav.filters') : undefined}
        tabIndex={-1}
        className="fixed inset-y-0 left-0 z-[60] w-full max-w-sm overflow-y-auto bg-surface py-4"
      >
        <div className="flex justify-end px-2">
          <ButtonPrincipal icon="close" ariaLabel={t('iconButton.close')} onClick={close} />
        </div>
        <div className="overscroll-contain px-4 pb-6">
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
