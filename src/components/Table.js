import React, { useState } from "react";
import Pagination from "./Pagination";
import { useTranslation } from 'react-i18next';

const Table = ({ 
  data, 
  rowsPerPage = 5,
  label
}) => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  if (!data || data.length === 0) {
    return (
    <p className="text-ink text-lg font-semibold">
      {t('dataManagement.table.noDataFoundPlaceholder')}
    </p>
    );
  }

  const columnNames = [...new Set(data.flatMap((row) => Object.keys(row)))];

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  return (
    <div className="w-full">
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(direction) => {
          if (direction === "next" && currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
          } else if (direction === "prev" && currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
          }
        }}
      />
      <div role="region" aria-label={label} tabIndex={0} className="focus-ring overflow-x-auto">
      <table className="w-full">
        {label && <caption className="sr-only">{label}</caption>}
        <thead>
          <tr className="bg-brand">
            {columnNames.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-4 py-2 text-left text-base font-bold text-ink border-b border-sage"
              >
                {t(`attributes.${col}`, col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {currentRows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-sage">
              {columnNames.map((col) => (
                <td
                  key={col}
                  className="px-4 py-2 text-sm text-ink border-b border-sage"
                >
                  {Array.isArray(row[col]) ? (
                            row[col].map((item, index) => (
                                <span key={index}>
                                    {item}
                                    <br/>
                                </span>
                            ))
                        ) : (
                            row[col]
                        )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default Table;