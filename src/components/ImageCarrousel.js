import React from 'react';
import { motion } from 'framer-motion';

const CircularCarousel = () => {

const images = [
    'https://via.placeholder.com/300x400/FF5733',
    'https://via.placeholder.com/300x400/33FF57',
    'https://via.placeholder.com/300x400/3357FF',
    'https://via.placeholder.com/300x400/FF33A5',
    ];

  return (
      <motion.div
        className="flex gap-4"
        initial={{ x: 0 }}
        animate={{ x: `-${images.length * 315.5}px` }}
        transition={{
          duration: images.length * 8,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {[...images, ...images, ...images].map((image, index) => (
          <div key={index} className="flex-none">
            <img
              src={image}
              alt={`Slide ${index}`}
              className="w-full h-full object-cover rounded-lg shadow-lg"
            />
          </div>
        ))}
      </motion.div>
  );
};

export default CircularCarousel;