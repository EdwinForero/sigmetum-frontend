import React, { useId } from 'react';
import InlineError from './InlineError';

const CONTROL_BASE = 'focus-ring-inset w-full min-w-0 rounded-xl border bg-surface px-4 text-base font-normal text-ink placeholder:text-moss';
const CONTROL_VALID = 'border-brand-dark';
const CONTROL_INVALID = 'border-danger ring-1 ring-inset ring-danger';

const TextInput = ({
    id,
    label,
    value,
    onChange,
    onBlur,
    placeholderText,
    type = 'text',
    maxLength,
    autoComplete,
    required,
    multiline = false,
    hint,
    error,
    announceError = true,
    invalid = false,
    describedBy,
    inputRef
}) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;
    const isInvalid = invalid || Boolean(error);
    const ariaDescribedBy = [describedBy, hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

    const controlProps = {
        id: inputId,
        ref: inputRef,
        value,
        onChange,
        onBlur,
        placeholder: placeholderText,
        maxLength,
        autoComplete,
        required,
        'aria-invalid': isInvalid || undefined,
        'aria-describedby': ariaDescribedBy,
    };
    const state = isInvalid ? CONTROL_INVALID : CONTROL_VALID;

    return (
        <div className="my-stack-sm w-full">
            <label htmlFor={inputId} className="mb-stack-xs block text-base font-bold text-ink">
                {label}
            </label>
            {multiline ? (
                <textarea {...controlProps} className={`${CONTROL_BASE} ${state} min-h-32 py-stack-md`} />
            ) : (
                <input {...controlProps} type={type} className={`${CONTROL_BASE} ${state} h-12`} />
            )}
            {hint && (
                <p id={hintId} className="mt-stack-xs text-sm text-moss">
                    {hint}
                </p>
            )}
            {error && <InlineError id={errorId} announce={announceError}>{error}</InlineError>}
        </div>
    );
}

export default TextInput;
