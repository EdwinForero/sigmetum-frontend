import React from 'react';
import { useTranslation } from 'react-i18next';

const LoadSpinner = ({ label, inline = false }) => {
  const { t } = useTranslation();

  if (inline) {
    return (
      <div role="status" className="flex min-h-6 items-center gap-2 text-ink">
        {label && (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-4 border-sage border-t-brand-dark" aria-hidden="true" />
            <span>{label}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div role="status" className="fixed inset-0 z-50 flex items-center justify-center bg-ink bg-opacity-70">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-sage border-t-brand" aria-hidden="true" />
      <span className="sr-only">{label ?? t('feedback.loading')}</span>
    </div>
  );
};

export default LoadSpinner;
