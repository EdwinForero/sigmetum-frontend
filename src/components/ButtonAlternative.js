import { useState, useEffect, useRef } from 'react';

const ButtonAlternative = ({
  onClick,
  text,
  dropdownOptions,
  icon,
  className,
  onOptionSelect,
  getButtonText,
}) => {

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(text);
  const dropdownRef = useRef(null);

  const displayText = getButtonText
    ? getButtonText(selectedOption)
    : selectedOption;

  const toggleDropdown = () => {
    if (dropdownOptions) {
      setIsDropdownOpen(!isDropdownOpen);
    } else if (onClick) {
      onClick();
    }
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setIsDropdownOpen(false);
    if (onOptionSelect) {
      onOptionSelect(option);
    }
  };
  
  useEffect(() => {
    setSelectedOption(text);
  }, [text]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`bg-[#F9FBFA] border-2 border-[#15B659] flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-between overflow-hidden rounded-xl h-10 px-4 sm:h-10 sm:px-5 font-bold leading-normal tracking-[0.015em] sm:text-base sm:font-bold sm:leading-normal sm:tracking-[0.015em] ${className}`}
      >
        <span className="text-[#15B659] sm:text-sm md:text-base lg:text-xl truncate">
          {displayText}
        </span>
        {dropdownOptions && (
          <span className="ml-2">
            {isDropdownOpen ? (
              <span className="material-symbols-outlined text-xl sm:text-3xl text-[#15B659] mx-auto">keyboard_arrow_up</span>
            ) : (
              <span className="material-symbols-outlined text-xl sm:text-3xl text-[#15B659] mx-auto">keyboard_arrow_down</span>
            )}
          </span>
        )}
      </button>

      {dropdownOptions && isDropdownOpen && (
        <div className="absolute left-0 mt-2 w-40 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          {dropdownOptions.map((option, index) => (
            <div
              key={index}
              className="cursor-pointer px-4 py-2 hover:bg-gray-100"
              onClick={() => handleOptionClick(option)}
            >
              <span className="text-[#0C1811]">
                {option.label || option}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ButtonAlternative;