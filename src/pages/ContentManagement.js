import { React, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import InfoButton from '../components/InfoButton.js';
import TextInput from '../components/TextInput.js';
import LoadSpinner from '../components/LoadSpinner.js';
import DialogAdvice from '../components/DialogAdvice.js';
import ButtonPrincipal from '../components/ButtonPrincipal.js';
import { AnimatePresence } from 'framer-motion';

const ContentManagement = () => {

  const { t } = useTranslation();
  const [term, setTerm] = useState('');
  const [terms, setTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogActions] = useState({ onConfirm: null});
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/list-terms`);
      const data = await response.json();
      setTerms(data.terms);
    } catch (error) {
      console.error('Error al obtener los términos:', error);
    }finally{
      setIsLoading(false);
    }
  };

  const handleDeleteTerm = async (termToDelete) => {

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/delete-term`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ term: termToDelete }),
      });

      if (!response.ok) {
        setDialogMessage(t('dialogAdvice.errorDeleteTerm'));
        setDialogTitle(t('dialogAdvice.errorTitle'));
        setDialogVisible(true);
      }else{
        setDialogMessage(t('dialogAdvice.successDeleteTerm'));
        setDialogTitle(t('dialogAdvice.successTitle'));
        setDialogVisible(true);
        fetchTerms();
      }

    } catch (error) {
      setDialogMessage(t('dialogAdvice.errorDeleteTerm'));
      setDialogTitle(t('dialogAdvice.errorTitle'));
      setDialogVisible(true);
    }finally{
      setIsLoading(false);
    }
  };
  
  const handleAddTerm = async () => {
    setIsLoading(true);
    if (!term.trim()) {
      setDialogMessage(t('dialogAdvice.adviceEmptyValues'));
      setDialogTitle(t('dialogAdvice.adviceTitle'));
      setDialogVisible(true);
      setIsLoading(false);
      return;
    }
  
    const isDuplicate = terms.some((item) => item.term.toLowerCase() === term.trim().toLowerCase());
    if (isDuplicate) {
      setDialogMessage(t('dialogAdvice.adviceDuplicatedTerm'));
      setDialogTitle(t('dialogAdvice.adviceTitle'));
      setDialogVisible(true);
      setIsLoading(false);
      return;
    }
  
    try {
      const response = await fetch(`${BASE_URL}/upload-term`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ term }),
      });
  
      if (!response.ok) {
        
        setDialogMessage(t('dialogAdvice.errorUploadTerm'));
        setDialogTitle(t('dialogAdvice.errorTitle'));
        setDialogVisible(true);
      }else{
        setDialogMessage(t('dialogAdvice.successUploadTerm'));
        setDialogTitle(t('dialogAdvice.successTitle'));
        setDialogVisible(true);
        setTerm('');
        fetchTerms();
      }
    } catch (error) {
      setDialogMessage(t('dialogAdvice.errorUploadTerm'));
      setDialogTitle(t('dialogAdvice.errorTitle'));
      setDialogVisible(true);
    }finally{
      setIsLoading(false);
    }
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setDialogMessage('');
  };

    return (
      <div className="bg-[#F9FBFA] min-h-screen layout-container flex h-full grow flex-col px-2">
        <div className="flex w-full flex-wrap justify-between gap-3 py-4">
          <div className="flex min-w-72 flex-col gap-3">
            <h2 className="text-[#15B659] tracking-light text-[32px] font-bold leading-tight">
              {t('contentManagement.title')}
            </h2>
          </div>
        </div>
        <p className="text-[#14281D] text-base text-justify sm:text-lg text-center">
        {t('contentManagement.description')}
        </p>
        <div className="layout-content-container flex flex-col w-full max-w-screen mx-auto">

          <div className="flex w-full flex-wrap justify-between gap-3 py-4">
            
            <div className="flex min-w-72 flex-col gap-3">
              <div className="flex gap-3 flex-wrap items-center">
                <h3 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">
                  {t('contentManagement.noLatinTermsTitle')}
                </h3>
                <InfoButton 
                  tooltipText={t('contentManagement.noLatinTermsTooltip')}
                />
              </div>

              <div className="flex justify-stretch items-center w-full">
                
                <TextInput
                  placeholderText={t('contentManagement.noLatinTermsPlaceholder')}
                  value={term}
                  onChange={(e) => setTerm(e.target.value)}
                />

                <ButtonPrincipal className="mx-2" icon="add" onClick={handleAddTerm}/>
              </div>
              
              <div className="mt-4">
              {isLoading ?
                (
                  <div className="flex bg-[#F9FBFA] justify-center items-center min-h-screen">
                    <LoadSpinner />
                  </div>
                ) : (
                  <div className="mt-2 max-h-40 overflow-y-auto bg-[#F9FBFA] p-2 rounded">
                    {terms.length === 0 ? (
                      <p className="text-[#0C1811] text-lg font-semibold">{t('contentManagement.noTermsFoundPlaceholder')}</p>
                    ) : (
                      terms.sort((a, b) => a.term.localeCompare(b.term)) 
                      .map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-[#0C1811] mb-2"
                        >
                          <p>{item.term}</p>
                          <button
                            className="text-[#15B659] cursor-pointer"
                            onClick={() => handleDeleteTerm(item.term)}
                          >
                            <span className="material-symbols-outlined text-3xl mx-auto">
                              delete
                            </span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )
              }
              </div>
            </div>
          </div>
        </div>
        <AnimatePresence>
        {dialogVisible && (
          <DialogAdvice
            dialogTitle={dialogTitle}
            dialogMessage={dialogMessage}
            onConfirm={dialogActions.onConfirm}
            onClose={closeDialog}
            showActions={!!dialogActions.onConfirm}
          />
        )}
        </AnimatePresence>
      </div>
    )
};

export default ContentManagement;