import React, { useId } from "react";
import ButtonPrincipal from "./ButtonPrincipal";
import { useTranslation } from "react-i18next";
import { motion, useIsPresent } from "motion/react";
import useDialogFocus from "../hooks/useDialogFocus";
import { NOTICE_BASE, noticeVariant } from "../utilities/noticeStyles";

const DialogAdvice = ({ 
  onClose, 
  dialogTitle, 
  dialogMessage, 
  onConfirm,
  showActions = false,
  dialogDetails = null,
  confirmText,
  variant = "info"
}) => {
  const { t } = useTranslation();
  const { box, icon, iconClass } = noticeVariant(variant);
  const titleId = useId();
  const isPresent = useIsPresent();
  const dialogRef = useDialogFocus(isPresent, onClose);

  const renderDialogDetails = () => {
    if (dialogDetails) {
      return (
        <details className="py-2 text-xl">
          <summary className="font-bold">{dialogDetails.title}</summary>
          <p>{dialogDetails.content}</p>
        </details>
      );
    }
    return null;
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-surface rounded-lg p-6 w-full max-w-md"
        initial={{ y: -1000 }}
        animate={{ y: 0 }}
        exit={{ y: 1000 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="flex justify-center px-4 py-2 mx-auto">
          <h2 id={titleId} className="text-brand-deep text-4xl mb-4 font-bold">
            {dialogTitle}
          </h2>
        </div>

        <div className="p-4 grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto flex-grow mb-10">
          <div className={`${NOTICE_BASE} ${box}`}>
            <span className={`material-symbols-outlined ${iconClass}`} aria-hidden="true">{icon}</span>
            <p className="py-2 text-xl whitespace-pre-wrap [overflow-wrap:anywhere]">{dialogMessage}</p>
          </div>
          {renderDialogDetails()}
        </div>

        <div className="flex justify-center gap-4 px-4 py-2 mx-auto">
          {showActions ? (
            <>
              <ButtonPrincipal
                text={confirmText ?? t("dialogAdvice.confirmButton")}
                onClick={onConfirm}
              />
              <ButtonPrincipal
                text={t("dialogAdvice.cancelButton")}
                onClick={onClose}
              />
            </>
          ) : (
            <ButtonPrincipal
              text={t("dialogAdvice.closeButton")}
              onClick={onClose}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DialogAdvice;