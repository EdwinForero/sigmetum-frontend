import React, { useId } from 'react';

const FilterSearchBar = ({
    id,
    label,
    value,
    onChange,
    placeholderText,
    invalid = false,
    describedBy,
    inputRef
}) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
        <div className="my-2 w-full">
            <label htmlFor={inputId} className="mb-1 block text-base font-bold text-ink">
                {label}
            </label>
            <div className="relative">
                <div
                    className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-brand-dark"
                    aria-hidden="true"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20px"
                        height="20px"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                    >
                        <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                    </svg>
                </div>
                <input
                    id={inputId}
                    ref={inputRef}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholderText}
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    className="focus-ring-inset h-12 w-full min-w-0 rounded-xl border border-brand-dark bg-surface pl-10 pr-4 text-base font-normal text-ink placeholder:text-moss"
                />
            </div>
        </div>
    );
}

export default FilterSearchBar;
