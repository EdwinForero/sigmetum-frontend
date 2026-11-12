import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ButtonPrincipal from '../components/ButtonPrincipal';
import ButtonAlternative from '../components/ButtonAlternative';
import EmptyState from '../components/EmptyState';
import LoadSpinner from '../components/LoadSpinner';
import SpeciesCard from '../components/SpeciesCard';
import { downloadXLSX } from '../utilities/CSVfunctions';
import { useTranslation } from 'react-i18next';
import Pagination from '../components/Pagination';
import InfoButton from '../components/InfoButton';
import useToast from '../hooks/useToast';
import ASSETS, { assetUrl } from '../config/assets';
//import ImageCarousel from '../components/ImageCarrousel';
//import ScrollIndicator from '../components/ScrollIndicator';

const Explore = ({
  data,
  filteredSpecies,
  selectedSpecies,
  noItalicTerms,
  hasError = false,
  isLoading = false,
  onRetry,
  onClearFilters,
}) => {
  const { t } = useTranslation();
  const [uniqueSpecies, setUniqueSpecies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [pageDirection, setPageDirection] = useState(0);
  const headingRef = useRef(null);
  const { notifyError } = useToast();

  useEffect(() => {
    if (!Array.isArray(filteredSpecies)) return;
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

  const currentResults = uniqueSpecies.length;

  // Especies únicas de todos los datos, sin filtro: se recalcula en cada carga (también al reintentar).
  const totalResults = useMemo(() => {
    if (!Array.isArray(data)) return 0;
    const all = data
      .flatMap((item) => item["Especies Características"] ?? [])
      .filter((species) => species && String(species).trim() !== "");
    return new Set(all).size;
  }, [data]);

  const handlePageChange = (direction) => {
    setPageDirection(direction === "next" ? 1 : -1);
    if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    } else if (direction === "prev" && currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // El botón se desmonta al pulsarlo: el foco pasa al título para no caer a <body>.
  const handleClearFilters = () => {
    onClearFilters?.();
    headingRef.current?.focus();
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = assetUrl(ASSETS.GLOSSARY);
      link.download = 'glossary.pdf';
      link.click();
    } catch {
      notifyError(t('dialogAdvice.errorDownloadFile'));
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

  const hasData = Array.isArray(data) && data.length > 0;
  const filtersActive =
    hasData && (filteredSpecies.length !== data.length || selectedSpecies?.size > 0);

  const renderContent = () => {
    if (isLoading) return null;
    if (hasError) {
      return (
        <EmptyState
          role="alert"
          title={t('explore.empty.errorTitle')}
          action={<ButtonPrincipal onClick={onRetry} text={t('feedback.retry')} />}
        >
          {t('explore.empty.errorCause')}
        </EmptyState>
      );
    }
    if (currentItems.length === 0) {
      return filtersActive ? (
        <EmptyState
          title={t('explore.empty.noResultsTitle')}
          action={<ButtonAlternative onClick={handleClearFilters} text={t('explore.empty.clearFilters')} />}
        >
          {t('explore.empty.noResultsCause')}
        </EmptyState>
      ) : (
        <EmptyState title={t('explore.empty.noDataTitle')}>{t('explore.empty.noDataCause')}</EmptyState>
      );
    }
    return (
      <>
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
          <span className="text-moss text-lg">
            {t("explore.resultsInfo", { currentResults, totalResults })}
          </span>

          <div className="flex-grow text-center sm:w-auto">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>

          <ButtonPrincipal
            onClick={handleDownload}
            text={t('explore.downloadGlossaryButton')}
          />

          <InfoButton
            tooltipText={t('explore.downloadGlossaryButtonTooltip')}
          />

          <ButtonPrincipal
            onClick={() => {
              downloadXLSX(filteredSpecies);
            }}
            text={t('explore.downloadExcelButton')}
          />

          <InfoButton
            tooltipText={t('explore.downloadExcelButtonTooltip')}
          />
        </div>

        <AnimatePresence initial={false} mode="wait" custom={pageDirection}>
          <motion.div
            key={currentPage}
            custom={pageDirection}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 py-4"
          >
            {currentItems.map((species) => (
              <SpeciesCard
                key={species}
                data={data}
                noItalicTerms={noItalicTerms}
                species={{
                  ...filteredSpecies,
                  "Especies Características": species,
                }}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </>
    );
  };

  return (
    <>
      <div className="page-container min-w-0 py-stack-xl">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="focus-heading text-brand-deep text-3xl font-bold leading-tight mb-stack-lg"
        >
          {t('explore.title')}
        </h1>
        <LoadSpinner inline label={isLoading ? t('feedback.loading') : undefined} />
        {renderContent()}
      </div>

      {/*
      <motion.h2
        className="text-[#15B659] text-center my-4 text-2xl sm:text-4xl font-bold leading-tight"
        >
          {t('explore.vegetationCaroselTitle')}
      </motion.h2>
      <div className="relative overflow-hidden w-full h-[300px] my-4 flex justify-center items-center">
        <ImageCarousel/>
      </div>
      */}

    </>
  );
};

export default Explore;