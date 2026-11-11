import React, { useId } from 'react';

const TextInput = ({
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
            <input
                id={inputId}
                ref={inputRef}
                value={value}
                onChange={onChange}
                placeholder={placeholderText}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
                className="focus-ring-inset h-12 w-full min-w-0 rounded-xl border border-brand-dark bg-surface px-4 text-base font-normal text-ink placeholder:text-moss"
            />
        </div>
    );
}

export default TextInput;
