import { React, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import InfoButton from './InfoButton';
import TextInput from './TextInput';
import LoadSpinner from './LoadSpinner';
import DialogAdvice from './DialogAdvice';
import ButtonPrincipal from './ButtonPrincipal';
import api from '../services/api';
import useDialog from '../hooks/useDialog';

const TermsManager = () => {
  const { t } = useTranslation();
  const [term, setTerm] = useState('');
  const [terms, setTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const { dialog, showDialog, closeDialog } = useDialog();

  useEffect(() => { fetchTerms(); }, []);

  const fetchTerms = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await api.get('/list-terms');
      setTerms(data);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTerm = async () => {
    if (!term.trim()) {
      showDialog(t('dialogAdvice.adviceTitle'), t('dialogAdvice.adviceEmptyValues'));
      return;
    }
    const isDuplicate = terms.some((item) => item.term.toLowerCase() === term.trim().toLowerCase());
    if (isDuplicate) {
      showDialog(t('dialogAdvice.adviceTitle'), t('dialogAdvice.adviceDuplicatedTerm'));
      return;
    }
    setIsLoading(true);
    try {
      await api.postAuth('/upload-term', { term });
      showDialog(t('dialogAdvice.successTitle'), t('dialogAdvice.successUploadTerm'));
      setTerm('');
      fetchTerms();
    } catch {
      showDialog(t('dialogAdvice.errorTitle'), t('dialogAdvice.errorUploadTerm'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTerm = async (termToDelete) => {
    setIsLoading(true);
    try {
      await api.deleteAuth('/delete-term', { term: termToDelete });
      showDialog(t('dialogAdvice.successTitle'), t('dialogAdvice.successDeleteTerm'));
      fetchTerms();
    } catch {
      showDialog(t('dialogAdvice.errorTitle'), t('dialogAdvice.errorDeleteTerm'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderList = () => {
    if (isLoading) {
      return (
        <div className="flex bg-[#F9FBFA] justify-center items-center min-h-[100px]">
          <LoadSpinner />
        </div>
      );
    }
    if (isError) {
      return <p className="text-[#0C1811] text-base">{t('dialogAdvice.errorLoadData')}</p>;
    }
    if (terms.length === 0) {
      return <p className="text-[#0C1811] text-lg font-semibold">{t('contentManagement.noTermsFoundPlaceholder')}</p>;
    }
    return terms
      .sort((a, b) => a.term.localeCompare(b.term))
      .map((item, index) => (
        <div key={index} className="flex items-center justify-between text-[#0C1811] mb-2">
          <p>{item.term}</p>
          <button className="text-[#15B659] cursor-pointer" onClick={() => handleDeleteTerm(item.term)}>
            <span className="material-symbols-outlined text-3xl mx-auto">delete</span>
          </button>
        </div>
      ));
  };

  return (
    <div className="flex min-w-72 flex-col mx-auto gap-3">
      <div className="flex gap-3 flex-wrap items-center">
        <h3 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">
          {t('contentManagement.noLatinTermsTitle')}
        </h3>
        <InfoButton tooltipText={t('contentManagement.noLatinTermsTooltip')} />
      </div>

      <div className="flex justify-stretch items-center w-full">
        <TextInput
          placeholderText={t('contentManagement.noLatinTermsPlaceholder')}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <ButtonPrincipal className="mx-2" icon="add" onClick={handleAddTerm} />
      </div>

      <div className="mt-4">
        <div className="mt-2 max-h-40 overflow-y-auto bg-[#F9FBFA] p-2 rounded">
          {renderList()}
        </div>
      </div>

      <AnimatePresence>
        {dialog.visible && (
          <DialogAdvice dialogTitle={dialog.title} dialogMessage={dialog.message} onClose={closeDialog} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TermsManager;
