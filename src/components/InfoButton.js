import React, { useState, useRef, useEffect } from "react";

const InfoButton = ({ tooltipText }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState("center");
  const tooltipRef = useRef(null);

  const showTooltip = () => {
    setIsVisible(true);
    adjustTooltipPosition();
  };

  const hideTooltip = () => setIsVisible(false);

  const adjustTooltipPosition = () => {
    const tooltipElement = tooltipRef.current;
    if (tooltipElement) {
      const { left, right } = tooltipElement.getBoundingClientRect();
      const screenWidth = window.innerWidth;

      if (left < 0) {
        setTooltipPosition("left");
      } else if (right > screenWidth) {
        setTooltipPosition("right");
      } else {
        setTooltipPosition("center");
      }
    }
  };

  useEffect(() => {
    if (isVisible) {
      adjustTooltipPosition();
    }
  }, [isVisible]);

  const tooltipClasses = {
    center: "left-1/2 transform -translate-x-1/2",
    left: "left-0 transform translate-x-0",
    right: "right-0 transform translate-x-0",
  };

  return (
    <div className="relative inline-block">
      <button
        className="material-symbols-outlined text-[#99BBA8] px-3 py-1 rounded focus:outline-none"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onClick={showTooltip}
      >
        info
      </button>

      {isVisible && (
        <div
        ref={tooltipRef}
        className={`absolute top-full mt-2 bg-white text-[#0C1811] text-sm rounded px-4 py-2 text-justify shadow-lg z-10 ${tooltipClasses[tooltipPosition]} 
          min-w-[200px] max-w-[300px] sm:min-w-[300px] sm:max-w-[500px] md:min-w-[400px] md:max-w-[800px]`}
        style={{
          wordWrap: "break-word",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        <span>{tooltipText}</span>
      </div>
      )}
    </div>
  );
};

export default InfoButton;