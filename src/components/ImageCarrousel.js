import React, { useState } from 'react';
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
        ease: 'linear',
        repeat: Infinity,
      }}
    >
      {[...images, ...images, ...images].map((image, index) => (
        <ImageWithFallback key={index} src={image} alt={`Slide ${index}`} />
      ))}
    </motion.div>
  );
};

const ImageWithFallback = ({ src, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      {!isLoaded && (
        <div className="w-full h-full object-cover rounded-lg transition-opacity duration-500"></div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover rounded-lg transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
};

export default CircularCarousel;