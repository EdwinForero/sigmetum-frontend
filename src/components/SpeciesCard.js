import React, { useState } from 'react';
import DialogSpecies from './DialogSpecies';
import { AnimatePresence } from 'motion/react';
import { highlightTerms } from '../utilities/highlightTerms.js';

const SpeciesCard = ({ 
  data, 
  species, 
  noItalicTerms 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);
  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openDialog();
  };

  const textParts = highlightTerms(species["Especies Características"], noItalicTerms);

  return (
    <>
      <div
        role="button"
        aria-label={species["Especies Características"]}
        tabIndex={0}
        onClick={openDialog}
        onKeyDown={handleKeyDown}
        className="focus-ring cursor-pointer flex items-center gap-2 rounded-lg min-h-[72px] py-2 border border-sage bg-surface hover:bg-sage transition-colors motion-reduce:transition-none"
      >
        <div className="flex flex-col justify-center">
          <p className="text-ink text-base font-normal leading-normal whitespace-normal overflow-hidden text-ellipsis px-2">
            {textParts.map((part, index) => (
              <span
                key={index}
                className={part.isItalic ? 'font-primary italic' : ''}
              >
                {part.text}
              </span>
            ))}
          </p>
        </div>
      </div>

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