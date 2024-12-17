import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ImageCarrousel = () => {
  const images = [
    { src: 'https://via.placeholder.com/300x400/FF5733', description: 'Text 1' },
    { src: 'https://via.placeholder.com/300x400/33FF57', description: 'Text 2' },
    { src: 'https://via.placeholder.com/300x400/3357FF', description: 'Text 3' },
    { src: 'https://via.placeholder.com/300x400/FF33A5', description: 'Text 4' },
  ];

  return (
    <div className="overflow-hidden w-full">
      <motion.div
        className="flex gap-4"
        initial={{ x: 0 }}
        animate={{ x: `-${images.length * 316}px` }}
        transition={{
          duration: images.length * 8,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {[...images, ...images, ...images].map((image, index) => (
          <ImageWithFallback key={index} src={image.src} text={image.description} alt={`Slide ${index}`} />
        ))}
      </motion.div>
    </div>
  );
};

const ImageWithFallback = ({ src, text, alt }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative group flex-shrink-0 w-[300px] h-[400px] overflow-hidden">
      {!isLoaded && (
        <div className="w-full h-full bg-gray-200 rounded-lg"></div>
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover rounded-lg transition-opacity duration-500 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-[#0C1811] bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
        <p className="text-[#F9FBFA] text-xl font-bold">{text}</p>
      </div>
    </div>
  );
};

export default ImageCarrousel;