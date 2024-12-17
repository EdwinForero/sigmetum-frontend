import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ButtonPrincipal from '../components/ButtonPrincipal';
import SpeciesCard from '../components/SpeciesCard';
import { downloadXLSX } from '../utilities/CSVfunctions';
import { useTranslation } from 'react-i18next';
import Pagination from '../components/Pagination';
import ImageCarousel from '../components/ImageCarrousel';
import ScrollIndicator from '../components/ScrollIndicator';

const Explore = ({ 
  data, 
  filteredSpecies, 
  selectedSpecies
 }) => {
  
  const { t } = useTranslation();
  const [uniqueSpecies, setUniqueSpecies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [pageDirection, setPageDirection] = useState(0);

  useEffect(() => {
    const speciesArray = filteredSpecies
      .map((item) => item["Especies Características"])
      .flat()
      .filter((species) => species && String(species).trim() !== "");
  
    const uniqueSpeciesSet = new Set(speciesArray);
  
    let processedSpecies;

    if (selectedSpecies && selectedSpecies.size > 0) {
      processedSpecies = Array.from(uniqueSpeciesSet).filter((species) =>
        selectedSpecies.has(species)
      );
    } else {
      processedSpecies = [...uniqueSpeciesSet];
    }

    const sortedSpecies = processedSpecies.sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  
    setUniqueSpecies(sortedSpecies);
    setCurrentPage(1);
  }, [filteredSpecies, selectedSpecies]);

  useEffect(() => {
    const calculateItemsPerPage = () => {
      const screenWidth = window.innerWidth;

      if (screenWidth >= 1280) {
        setItemsPerPage(24);
      } else if (screenWidth >= 1024) {
        setItemsPerPage(16);
      } else if (screenWidth >= 768) {
        setItemsPerPage(12);
      } else {
        setItemsPerPage(7);
      }
    };

    calculateItemsPerPage();
    window.addEventListener("resize", calculateItemsPerPage);

    return () => {
      window.removeEventListener("resize", calculateItemsPerPage);
    };
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = uniqueSpecies.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(uniqueSpecies.length / itemsPerPage);

  const handlePageChange = (direction) => {
    setPageDirection(direction === "next" ? 1 : -1);
    if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <>
      {currentItems.length === 0 ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <p className="text-[#0C1811] text-lg font-semibold">
            {t('explore.noDataFoundPlaceholder')}
          </p>
        </div>
      ) : (
        <div className="min-h-screen gap-1 px-2 flex flex-1 py-5">
          <div className="layout-content-container flex flex-col flex-1 whitespace-nowrap">
            <div className="flex items-center gap-4 px-4">
              <ButtonPrincipal
                onClick={() => {
                  downloadXLSX(filteredSpecies);
                }}
                text={t('explore.downloadExcelButton')}
              />
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
            
            <div className="relative min-h-[700px]">
              <AnimatePresence initial={false} custom={pageDirection}>
                <motion.div
                  key={currentPage}
                  custom={pageDirection}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="absolute top-0 left-0 w-full grid gap-4 px-4 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 py-4"
                >
                  {currentItems.map((species, index) => (
                    <SpeciesCard
                      key={index}
                      data={data}
                      species={{
                        ...filteredSpecies,
                        "Especies Características": species,
                      }}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <ScrollIndicator/>
        </div>
      )}
      <motion.h2 
        className="text-[#15B659] text-center my-4 tracking-light text-2xl sm:text-4xl font-bold leading-tight"
        >
          {t('explore.vegetationCaroselTitle')}
      </motion.h2>
      <div className="relative overflow-hidden w-full h-[300px] my-4 flex justify-center items-center">
        <ImageCarousel/>
      </div>
    </>
  );
};

export default Explore;