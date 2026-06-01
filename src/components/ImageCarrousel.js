import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import env from '../config/env';

const FALLBACK_IMAGES = [
  { src: 'https://via.placeholder.com/300x400/FF5733', description: 'Image 1' },
  { src: 'https://via.placeholder.com/300x400/33FF57', description: 'Image 2' },
  { src: 'https://via.placeholder.com/300x400/3357FF', description: 'Image 3' },
  { src: 'https://via.placeholder.com/300x400/FF33A5', description: 'Image 4' },
];

const ImageCarrousel = () => {
  const [images, setImages] = useState(FALLBACK_IMAGES);

  useEffect(() => {
    if (env.CAROUSEL_IMAGE_KEYS.length === 0) return;

    Promise.all(
      env.CAROUSEL_IMAGE_KEYS.map((key) =>
        api.get(`/get-image?imageKey=${key}`).then((data) => ({
          src: data.imageUrl,
          description: key.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
        }))
      )
    )
      .then(setImages)
      .catch((error) => console.error('Error fetching carousel images:', error));
  }, []);

  return (
    <div className="overflow-hidden w-full">
      <motion.div
        className="flex gap-4"
        initial={{ x: 0 }}
        animate={{ x: `-${images.length * 316}px` }}
        transition={{ duration: images.length * 8, ease: 'linear', repeat: Infinity }}
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
      {!isLoaded && <div className="w-full h-full bg-gray-200 rounded-lg"></div>}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover rounded-lg transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-[#0C1811] bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
        <p className="text-[#F9FBFA] text-xl font-bold">{text}</p>
      </div>
    </div>
  );
};

export default ImageCarrousel;
