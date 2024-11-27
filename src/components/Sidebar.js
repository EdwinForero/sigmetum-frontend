import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ButtonPrincipal from './ButtonPrincipal';

const Sidebar = ({ exploreData, menuOptions }) => {
  const [activeComponent, setActiveComponent] = useState(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const location = useLocation();

  const exclusions = {
    '/explorar': ['administrarDatos', 'cargarArchivos', 'dataManagementFilter'],
    '/cargar-archivos': ['filtro', 'dataManagementFilter'],
    '/administrar-datos': ['filtro'],
  };

  const filteredMenuOptions = menuOptions.filter(option => {
    const excludedOptions = exclusions[location.pathname] || [];
    if (excludedOptions.includes(option.id)) return false;
    if (location.pathname === '/explorar' && option.id === 'filtro' && !exploreData) return false;
    return true;
  });

  const handleButtonClick = (optionId) => {
    if (activeComponent === optionId) {
      setIsOverlayVisible(!isOverlayVisible);
    } else {
      setActiveComponent(optionId);
      setIsOverlayVisible(true);
    }
  };

  useEffect(() => {
    setActiveComponent(null);
    setIsOverlayVisible(false);
  }, [location.pathname]);

  const handleOverlayClick = () => {
    setIsOverlayVisible(false);
  };

  return (
    <div className="relative flex bg-[#F9FBFA]">
      {isOverlayVisible && (
        <div
          className="fixed inset-0 bg-[#0C1811] bg-opacity-70 z-10"
          onClick={handleOverlayClick}
        />
      )}

      <aside className="bg-[#F9FBFA] flex flex-col p-5 w-1/4 z-20 h-full">
        <nav className="mb-4 flex flex-col gap-2 w-full">
          {filteredMenuOptions.map((option) => (
            option.link ? (
              <Link to={option.link} key={option.id}>
                <ButtonPrincipal
                  className={`${location.pathname === option.link ? 'bg-[#15B659] text-[#F9FBFA]' : ''}`}
                  icon={option.icon}
                />
              </Link>
            ) : (
              <ButtonPrincipal
                className={`${activeComponent === option.id ? 'bg-[#15B659] text-[#F9FBFA]' : ''}`}
                key={option.id}
                onClick={() => handleButtonClick(option.id)}
                icon={option.icon}
              />
            )
          ))}
        </nav>
      </aside>

      <div
        className={`fixed top-0 left-0 z-30 overflow-y-auto transition-transform transform duration-300 max-w-full h-full ${
          isOverlayVisible ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-6 min-h-full overflow-y-auto bg-[#F9FBFA]">
          {menuOptions.find((option) => option.id === activeComponent)?.component}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;