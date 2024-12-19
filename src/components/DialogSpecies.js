import React from 'react';
import { motion } from 'framer-motion';
import ButtonPrincipal from '../components/ButtonPrincipal.js';
import SpeciesAttribute from '../components/SpeciesAttribute.js';
import { SortItemsList } from '../utilities/SortItemsList.js';
import { useTranslation } from 'react-i18next';

const Dialog = ({ 
  isOpen, 
  onClose, 
  data, 
  species, 
  noItalicTerms 
}) => {
  
  const { t } = useTranslation();

  if (!isOpen) return null;
  
  const formattedQuery = encodeURIComponent(species["Especies Características"]);

  const filteredSpecies = data.filter(
    (item) =>
      item["Especies Características"]?.includes(species["Especies Características"])
  );

  const highlightTerms = (text, terms) => {
    if (!text || !terms || !Array.isArray(terms) || terms.length === 0) {
      return [{ text, isItalic: true }];
    }

    const filteredTerms = terms
      .map(term => (typeof term === 'object' && term.term ? term.term : term))
      .filter(term => typeof term === 'string' && term.trim() !== '');

    if (filteredTerms.length === 0) {
      return [{ text, isItalic: true }];
    }

    const regex = new RegExp(`(\\s|^)(${filteredTerms.join('|')})(\\s|$)`, 'gi');

    const parts = text.split(regex).map(part => ({
      text: part,
      isItalic: !filteredTerms.some(term => term.toLowerCase() === part.toLowerCase()),
    }));

    return parts;
  };

  const textParts = highlightTerms(species["Especies Características"], noItalicTerms);

  const uniqueAttributes = {
    province: SortItemsList([...new Set(filteredSpecies.map((item) => item["Provincia"]))])
      .join(", "),
    municipality: SortItemsList([...new Set(filteredSpecies.map((item) => item["Municipio"]))])
      .join(", "),
    averageAltitude: SortItemsList([...new Set(filteredSpecies.map((item) => item["Altitud Media"]))])
      .join(", "),
    biogeographicSector: SortItemsList([...new Set(filteredSpecies.map((item) => item["Sector Biogeográfico"]))])
      .join(", "),
    bioclimaticFloor: SortItemsList([...new Set(filteredSpecies.map((item) => item["Piso Bioclimático"]))])
      .join(", "),
    ombrotype: SortItemsList([...new Set(filteredSpecies.map((item) => item["Ombrotipo"]))])
      .join(", "),
    natureOfSubstrate: SortItemsList([...new Set(filteredSpecies.map((item) => item["Naturaleza del Sustrato"]))])
      .join(", "),
    seriesType: SortItemsList([...new Set(filteredSpecies.map((item) => item["Tipo de Serie"]))])
      .join(", "),
    vegetationSeries: SortItemsList([...new Set(filteredSpecies.map((item) => item["Serie de Vegetación"]))])
      .join(", "),
    potentialVegetation: SortItemsList([...new Set(filteredSpecies.map((item) => item["Vegetación Potencial"]))])
      .join(", "),
  };

  return (
    <motion.div
      className="fixed overflow-hidden inset-0 z-50 flex overflow-auto items-center justify-center bg-[#0C1811] bg-opacity-70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#F9FBFA] max-h-screen overflow-auto rounded-lg p-6 w-full max-w-md flex flex-col"
        initial={{ y: -1000 }}
        animate={{ y: 0 }}
        exit={{ y: 1000 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-center px-4 py-2 mx-auto w-full">
          <div className="text-[#4B644A] text-4xl mb-4 font-bold text-center break-words whitespace-normal">
            {textParts.map((part, index) => (
                <h2
                  key={index}
                  className={part.isItalic ? 'italic' : ''}
                >
                  {part.text}
                </h2>
              ))}
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 gap-4 overflow-y-auto flex-grow">
            {Object.entries(uniqueAttributes).map(([key, value]) => (
                <SpeciesAttribute
                    key={key}
                    title={t(`explore.dialogSpecies.attributes.${key}`, key)}
                    description={value}
                />
            ))}
        </div>

        <div className="flex justify-center px-4 py-2 mx-auto">
          <a
            href={`https://www.ipni.org/?q=${formattedQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-[#0C1811] font-bold"
          >
            <span className="hover:underline">{t('explore.dialogSpecies.readMoreLabel')}</span>
            <span className="material-symbols-outlined items-center text-[#15B659] mx-auto">open_in_new</span>
          </a>
        </div>

        <div className="flex justify-center px-4 py-2 mx-auto mt-4">
          <ButtonPrincipal onClick={onClose} text={t('explore.dialogSpecies.closeButton')} />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dialog;