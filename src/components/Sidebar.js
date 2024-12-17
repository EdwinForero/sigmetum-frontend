import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ButtonPrincipal from './ButtonPrincipal';

const Sidebar = ({ 
  exploreData, 
  menuOptions 
}) => {
  const [activeComponent, setActiveComponent] = useState(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const location = useLocation();

  const exclusions = {
    '/explorar': ['dataManagement', 'uploadFiles', 'dataManagementFilter', 'dataConfiguration'],
    '/cargar-archivos': ['filter', 'dataManagementFilter'],
    '/administrar-datos': ['filter'],
    '/configurar-datos': ['filter', 'dataManagementFilter'],
  };

  const filteredMenuOptions = menuOptions.filter(option => {
    const excludedOptions = exclusions[location.pathname] || [];
    if (excludedOptions.includes(option.id)) return false;
    if (location.pathname === '/explorar' && option.id === 'filter' && !exploreData) return false;
    return true;
  });

  const handleButtonClick = (optionId) => {
      setActiveComponent(optionId);
      setIsOverlayVisible(true);
  };

  const handleOverlayClick = () => {
    setIsOverlayVisible(false);
  };

  return (
    <div className="relative flex bg-[#F9FBFA]">
      <AnimatePresence>
        {isOverlayVisible && (
          <motion.div
            className="fixed inset-0 bg-[#0C1811] z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleOverlayClick}
          />
        )}
      </AnimatePresence>

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
                key={option.id}
                onClick={() => handleButtonClick(option.id)}
                icon={option.icon}
              />
            )
          ))}
        </nav>
      </aside>

      <motion.div
        className="fixed top-0 left-0 z-30 overflow-y-auto max-w-full h-full bg-[#F9FBFA]"
        initial={{ x: '-100%' }}
        animate={{ x: isOverlayVisible ? 0 : '-100%' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className='flex'>
          <div className="px-4 py-6 min-h-full overflow-y-auto">
            {menuOptions.find((option) => option.id === activeComponent)?.component}
          </div>
          <ButtonPrincipal icon="Close" onClick={handleOverlayClick} className="m-2"/>
        </div>
      </motion.div>
    </div>
  );
};

export default Sidebar;