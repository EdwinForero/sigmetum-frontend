import React, { useState } from 'react';
import ButtonAlternative from './ButtonAlternative.js';
import FilterSearchBar from './FilterSearchBar.js';
import { SortItemsList } from '../utilities/SortItemsList.js';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const CategoryFilter = ({ 
  category, 
  items, 
  blocked, 
  onChange, 
  selected, 
  isExpanded,
  onExpand
}) => {
  const [searchText, setSearchText] = useState('');
  const { t } = useTranslation();

  const handleCheckboxChange = (item) => {
    onChange(category, item);
  };

  const handleClearAll = () => {
    onChange(category, 'clear');
  };

  const filteredItems = SortItemsList(items.filter((item) =>
    String(item).toLowerCase().includes(searchText.toLowerCase())
  ));

  return (
    <div className="w-full max-w-md mx-auto bg-[#F9FBFA] rounded-lg shadow-lg p-2 mt-2 mb-2">
      <div
        className={`flex justify-between items-center cursor-pointer pb-2 ${
          blocked ? 'text-gray-500' : ''
        }`}
        onClick={onExpand}
      >
        <p className="text-[#0C1811] text-xl font-medium leading-normal">
          {t(`attributes.${category}`, category)}
        </p>
        <span>
          {isExpanded ? (
            <span className="material-symbols-outlined text-3xl text-[#15B659] mx-auto">keyboard_arrow_up</span>
          ) : (
            <span className="material-symbols-outlined text-3xl text-[#15B659] mx-auto">keyboard_arrow_down</span>
          )}
        </span>
      </div>

      <AnimatePresence>
        {isExpanded && !blocked && (
          <motion.div
            className="space-y-3 py-1"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-1 items-center justify-center flex space-x-4">
              <ButtonAlternative
                onClick={handleClearAll}
                text={t('filter.categoryFilter.cleanFilterButton')}
              />
            </div>
            <FilterSearchBar
              placeholderText={t(`attributes.${category}`, category)}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <label key={item} className="flex items-center cursor-pointer space-x-2">
                  <input
                    type="checkbox"
                    name={`${category}-${item}`}
                    checked={selected.has(item)}
                    onChange={() => handleCheckboxChange(item)}
                    className="appearance-none h-6 w-6 border-2 border-[#15B659] rounded-md cursor-pointer hover:bg-[#15B659] checked:bg-[#15B659] checked:border-transparent"
                  />
                  <span className="text-[#0C1811] text-1xl capitalize">{item}</span>
                </label>
              ))
            ) : (
              <p className="text-[#4B644A]">
                {t('filter.categoryFilter.noResultsFoundPlaceholder')} "{searchText}"
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategoryFilter;