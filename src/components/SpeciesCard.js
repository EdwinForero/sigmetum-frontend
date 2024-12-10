import React, { useState } from 'react';
import DialogSpecies from './DialogSpecies';
import { motion, AnimatePresence } from 'framer-motion';

const SpeciesCard = ({ 
  data, 
  species 
}) => {
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const openDialog = () => setIsDialogOpen(true);
  const closeDialog = () => setIsDialogOpen(false);

  return (
    <>
      <motion.div
        onClick={openDialog}
        initial={{ backgroundColor: '#F9FBFA' }}
        whileHover={{ backgroundColor: '#99BBA8', transition: { duration: 0.3 } }}
        className="cursor-pointer flex items-center gap-2 rounded-lg min-h-[72px] py-2 border border-[#99BBA8]"
      >
        <div className="flex flex-col justify-center">
          <p className="text-[#0C1811] text-base italic font-medium leading-normal whitespace-normal overflow-hidden text-ellipsis px-2">
            {species["Especies Características"]}
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
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default SpeciesCard;