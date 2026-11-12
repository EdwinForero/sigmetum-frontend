import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useId } from "react";
import { useTranslation } from "react-i18next";
import { NOTICE_BASE, noticeVariant } from "../utilities/noticeStyles";

const { box, icon, iconClass } = noticeVariant("info");

const VIEWPORT_MARGIN = 16;
const BOTTOM_BAR_HEIGHT = 72;
const BOTTOM_BAR_BREAKPOINT = 768;

const InfoButton = ({ tooltipText, topic }) => {
  const { t } = useTranslation();
  const tooltipId = useId();
  const [isVisible, setIsVisible] = useState(false);
  // Desplazamiento horizontal (px) y lado: se recalculan al mostrarse y en resize.
  const [shift, setShift] = useState(0);
  const [isAbove, setIsAbove] = useState(false);
  const anchorRef = useRef(null);
  const tooltipRef = useRef(null);
  const shiftRef = useRef(0);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  const adjustTooltipPosition = useCallback(() => {
    const tooltipElement = tooltipRef.current;
    const anchorElement = anchorRef.current;
    if (!tooltipElement || !anchorElement) return;

    const rect = tooltipElement.getBoundingClientRect();
    const naturalLeft = rect.left - shiftRef.current;
    const naturalRight = rect.right - shiftRef.current;
    let nextShift = 0;
    if (naturalLeft < VIEWPORT_MARGIN) {
      nextShift = VIEWPORT_MARGIN - naturalLeft;
    } else if (naturalRight > window.innerWidth - VIEWPORT_MARGIN) {
      nextShift = window.innerWidth - VIEWPORT_MARGIN - naturalRight;
    }
    shiftRef.current = nextShift;
    setShift(nextShift);

    const anchor = anchorElement.getBoundingClientRect();
    const reserved = window.innerWidth < BOTTOM_BAR_BREAKPOINT ? BOTTOM_BAR_HEIGHT : 0;
    const overflowsBelow = anchor.bottom + rect.height > window.innerHeight - reserved;
    const fitsAbove = anchor.top - rect.height >= 0;
    setIsAbove(overflowsBelow && fitsAbove);
  }, []);

  useLayoutEffect(() => {
    if (!isVisible) return undefined;
    adjustTooltipPosition();
    window.addEventListener("resize", adjustTooltipPosition);
    return () => window.removeEventListener("resize", adjustTooltipPosition);
  }, [isVisible, adjustTooltipPosition]);

  // Escape lo oculta mientras se ve (WCAG 1.4.13: descartable sin mover el puntero ni el foco).
  useEffect(() => {
    if (!isVisible) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsVisible(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible]);

  return (
    <span
      ref={anchorRef}
      className="relative inline-block shrink-0"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
    >
      <button
        type="button"
        className="focus-ring inline-flex h-11 w-11 shrink-0 items-center justify-center rounded text-moss"
        aria-label={topic ? t("iconButton.infoAbout", { topic }) : t("iconButton.info")}
        aria-describedby={tooltipId}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onClick={showTooltip}
      >
        <span className="material-symbols-outlined" aria-hidden="true">info</span>
      </button>

      {/* La envoltura es transparente: el hueco con el botón forma parte del tooltip y no dispara onMouseLeave (WCAG 1.4.13). */}
      <span
        id={tooltipId}
        role="tooltip"
        hidden={!isVisible}
        ref={tooltipRef}
        className={`absolute left-1/2 z-10 w-max max-w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 ${
          isAbove ? "bottom-full pb-2" : "top-full pt-2"
        }`}
        style={{ marginLeft: `${shift}px` }}
      >
        <span
          className={`${NOTICE_BASE} ${box} text-left text-sm shadow-lg`}
          style={{
            wordWrap: "break-word",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
          }}
        >
          <span className={`material-symbols-outlined ${iconClass}`} aria-hidden="true">{icon}</span>
          <span>{tooltipText}</span>
        </span>
      </span>
    </span>
  );
};

export default InfoButton;
