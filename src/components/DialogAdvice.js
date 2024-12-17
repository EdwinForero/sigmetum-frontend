import React from "react";
import ButtonPrincipal from "./ButtonPrincipal";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const DialogAdvice = ({ 
  onClose, 
  dialogTitle, 
  dialogMessage, 
  onConfirm,
  showActions = false
}) => {
  
  const { t } = useTranslation();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C1811] bg-opacity-70"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#F9FBFA] rounded-lg p-6 w-full max-w-md"
        initial={{ y: -1000 }}
        animate={{ y: 0 }}
        exit={{ y: 1000 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex justify-center px-4 py-2 mx-auto">
          <h3 className="text-[#15B659] text-4xl mb-4 font-bold">
            {dialogTitle}
          </h3>
        </div>

        <div className="flex max-h-[300px] overflow-y-auto justify-center px-4 py-2 mx-auto">
          <p className="py-2 text-xl whitespace-pre-wrap">{dialogMessage}</p>
        </div>

        <div className="flex justify-center gap-4 px-4 py-2 mx-auto">
          {showActions ? (
            <>
              <ButtonPrincipal
                text={t("dialogAdvice.confirmButton")}
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