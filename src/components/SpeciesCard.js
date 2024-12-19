import React, { useState } from 'react';
import DialogSpecies from './DialogSpecies';
import { motion, AnimatePresence } from 'framer-motion';

const SpeciesCard = ({ 
  data, 
  species, 
  noItalicTerms 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

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

  return (
    <>
      <motion.div
        onClick={openDialog}
        initial={{ backgroundColor: '#F9FBFA' }}
        whileHover={{ backgroundColor: '#99BBA8', transition: { duration: 0.3 } }}
        className="cursor-pointer flex items-center gap-2 rounded-lg min-h-[72px] py-2 border border-[#99BBA8]"
      >
        <div className="flex flex-col justify-center">
          <p className="text-[#0C1811] text-base font-medium leading-normal whitespace-normal overflow-hidden text-ellipsis px-2">
            {textParts.map((part, index) => (
              <span
                key={index}
                className={part.isItalic ? 'italic' : ''}
              >
                {part.text}
              </span>
            ))}
          </p>
        </div>
      </motion.div>

      <AnimatePresence>
        {isDialogOpen && (
          <DialogSpecies
            isOpen={isDialogOpen}
            onClose={closeDialog}
            data={data}
            species={species}
            noItalicTerms={noItalicTerms}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default SpeciesCard;