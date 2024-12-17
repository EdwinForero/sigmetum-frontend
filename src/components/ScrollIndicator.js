import React from 'react';
import UseAtBottom from '../utilities/UseAtBottom';

const ScrollIndicator = () => {
  const isAtBottom = UseAtBottom();

  const handleScrollDown = () => {
    window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    !isAtBottom && (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <button
          onClick={handleScrollDown}
          className="flex flex-col items-center animate-bounce cursor-pointer"
        >
        <span className="material-symbols-outlined text-3xl text-[#15B659] mx-auto">arrow_circle_down</span>
        </button>
      </div>
    )
  );
};

export default ScrollIndicator;