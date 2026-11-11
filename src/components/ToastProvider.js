import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToastContext } from '../hooks/useToast';

const SUCCESS_DURATION = 8000;

const Toast = ({ toast, onDismiss }) => {
  const { t } = useTranslation();
  const [paused, setPaused] = useState(false);
  const isSuccess = toast.type === 'success';

  // El éxito se cierra solo; el contador se para con el ratón encima o el foco dentro y vuelve a empezar al salir.
  useEffect(() => {
    if (!isSuccess || paused) return undefined;
    const timer = setTimeout(() => onDismiss(toast.id), SUCCESS_DURATION);
    return () => clearTimeout(timer);
  }, [isSuccess, paused, onDismiss, toast.id]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-2 rounded-lg border-2 bg-surface p-3 shadow-lg ${
        isSuccess ? 'border-brand-deep text-ink' : 'border-danger text-danger'
      }`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span
        className={`material-symbols-outlined mt-2 ${isSuccess ? 'text-brand-deep' : ''}`}
        aria-hidden="true"
      >
        {isSuccess ? 'check_circle' : 'error'}
      </span>
      <span className="min-w-0 flex-1 break-words py-2 font-bold">{toast.message}</span>
      <button
        type="button"
        aria-label={t('feedback.close')}
        onClick={() => onDismiss(toast.id)}
        className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink hover:bg-brand"
      >
        <span className="material-symbols-outlined" aria-hidden="true">close</span>
      </button>
    </div>
  );
};

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const add = useCallback((type, message) => {
    nextId.current += 1;
    const id = nextId.current;
    setToasts((current) => [...current, { id, type, message }]);
  }, []);

  const value = useMemo(
    () => ({
      notifySuccess: (message) => add('success', message),
      notifyError: (message) => add('error', message),
    }),
    [add]
  );

  const renderToasts = (type) =>
    toasts
      .filter((toast) => toast.type === type)
      .map((toast) => <Toast key={toast.id} toast={toast} onDismiss={dismiss} />);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-2 top-20 z-[55] flex flex-col items-end gap-2 sm:left-auto sm:right-4 sm:w-96">
        <div role="status" className="flex w-full flex-col gap-2">
          {renderToasts('success')}
        </div>
        <div role="alert" className="flex w-full flex-col gap-2">
          {renderToasts('error')}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
