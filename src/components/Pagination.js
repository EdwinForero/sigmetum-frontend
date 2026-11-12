import React from "react";
import ButtonPrincipal from "./ButtonPrincipal";
import { useTranslation } from 'react-i18next';

const Pagination = ({
  currentPage, 
  totalPages, 
  onPageChange
}) => {

  const { t } = useTranslation();

  return (
    <div className="flex justify-center items-center m-2">
      <ButtonPrincipal
        icon="arrow_back_ios_new"
        ariaLabel={t("iconButton.previousPage")}
        onClick={() => onPageChange("prev")}
        disabled={currentPage === 1}
      />
      <span className="text-ink text-base font-bold mx-2">
        {t("pagination.pageInfo", { currentPage, totalPages })}
      </span>
      <ButtonPrincipal
        icon="arrow_forward_ios"
        ariaLabel={t("iconButton.nextPage")}
        onClick={() => onPageChange("next")}
        disabled={currentPage === totalPages}
      />
    </div>
  );
};

export default Pagination;