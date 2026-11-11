import React, { useState, useRef, useEffect, useId } from "react";
import { useTranslation } from "react-i18next";

const InfoButton = ({ tooltipText }) => {
  const { t } = useTranslation();
  const tooltipId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState("center");
  const tooltipRef = useRef(null);

  const showTooltip = () => setIsVisible(true);
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

  // Escape lo oculta mientras se ve (WCAG 1.4.13: descartable sin mover el puntero ni el foco).
  useEffect(() => {
    if (!isVisible) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsVisible(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  const tooltipClasses = {
    center: "left-1/2 transform -translate-x-1/2",
    left: "left-0 transform translate-x-0",
    right: "right-0 transform translate-x-0",
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      <button
        type="button"
        className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded text-moss"
        aria-label={t("iconButton.info")}
        aria-describedby={tooltipId}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={showTooltip}
      >
        <span className="material-symbols-outlined" aria-hidden="true">info</span>
      </button>

      <span
        id={tooltipId}
        role="tooltip"
        hidden={!isVisible}
        ref={tooltipRef}
        className={`absolute top-full z-10 mt-2 rounded bg-surface px-4 py-2 text-left text-sm text-ink shadow-lg ${tooltipClasses[tooltipPosition]}
          w-max min-w-[200px] max-w-[calc(100vw-2rem)] sm:min-w-[300px] sm:max-w-[500px] md:min-w-[400px] md:max-w-[800px]`}
        style={{
          wordWrap: "break-word",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {tooltipText}
      </span>
    </span>
  );
};

export default InfoButton;
