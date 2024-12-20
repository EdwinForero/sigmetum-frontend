import { React, useState, useRef } from 'react';
import ButtonAlternative from '../components/ButtonAlternative.js'
import Table from '../components/Table.js'
import FileDropdown from '../components/FileDropdown.js';
import LoadSpinner from '../components/LoadSpinner.js';
import { downloadXLSX } from '../utilities/CSVfunctions.js';
import DialogAdvice from '../components/DialogAdvice';
import InfoButton from '../components/InfoButton.js';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';

const DataManagement = ({
  onFileDropdownSelect, 
  filteredSpecies
}) => {

  const { t } = useTranslation();
  const [fileName, setFileName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const fileDropdownRef = useRef(null);
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

  const handleFileSelect = (jsonData, fileName) => {
    onFileDropdownSelect(jsonData);
    setFileName(fileName);
  };

  const resetDropdown = () => {
    onFileDropdownSelect([]);
    setFileName(null);
    if (fileDropdownRef.current) {
      fileDropdownRef.current.fetchFiles();
    }
  };

  const handleFileDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/delete-file`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ fileName }),
    });
      if (!response.ok) {
        setDialogMessage(t('dialogAdvice.errorDeleteMessage'));
        setDialogType('error');
        setDialogVisible(true);
      }else{
      setDialogMessage(t('dialogAdvice.successDeleteMessage'));
      setDialogType('success');
      setDialogVisible(true);
      resetDropdown();
    }

    } catch (error) {
      setDialogMessage(t('dialogAdvice.errorDeleteMessage'));
      setDialogType('error');
      setDialogVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnLoad = (state) => {
    setIsLoading(state);
  }

  const handleFileUpdate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/update-file`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ fileName }),
    });

      if (!response.ok) {
        setDialogMessage(t('dialogAdvice.errorUpdateMessage'));
        setDialogType('error');
        setDialogVisible(true);
      }else{

        if (fileDropdownRef.current) {
          fileDropdownRef.current.fetchFiles();
        }

        setDialogMessage(t('dialogAdvice.successUpdateMessage'));;
        setDialogType('success');
        setDialogVisible(true);
      }
    } catch (error) {
      setDialogMessage(t('dialogAdvice.errorUpdateMessage'));
      setDialogType('error');
      setDialogVisible(true);
    } finally{
      setIsLoading(false);
    }
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setDialogMessage('');
  };

    return (
      <div className="w-full max-w-screen px-2">
        <div className="layout-content-container flex flex-col w-full max-w-screen mx-auto">
          <div className="flex w-full flex-wrap justify-between gap-3 py-4">
            <div className="flex min-w-72 flex-col gap-3">
              <h2 className="text-[#15B659] tracking-light text-[32px] font-bold leading-tight">
                {t('dataManagement.title')}
              </h2>
            </div>
          </div>

          <p className="text-[#14281D] text-base text-justify sm:text-lg text-center">
            {t('dataManagement.description')}
          </p>

          <div className="flex gap-3 flex-wrap py-3 items-center">
            <h3 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">
              {t('dataManagement.fileSelectDropdwon.selectFileDropdownLabel')}
            </h3>
            <InfoButton 
              tooltipText={t('dataManagement.fileSelectDropdwon.selectFileDropdownTooltip')}
            />
          </div>

          <div className="flex justify-stretch w-full">
            <label className="flex flex-col w-full min-w-40 py-3 flex-1">
                <FileDropdown ref={fileDropdownRef} onLoad={handleOnLoad} onFileSelect={handleFileSelect} selectedFile={fileName} className="file-dropdown"/>
            </label>
            {fileName && fileName !== "" && (
            <>
              <div className="flex gap-3 flex-wrap px-3 py-3 justify-end">
                <ButtonAlternative onClick={() => {downloadXLSX(filteredSpecies)}} text={t('dataManagement.downloadExcelButton')}/>
                  <InfoButton 
                  tooltipText={t('dataManagement.downloadExcelButtonTooltip')}
                />
              </div>
              <div className="flex gap-3 flex-wrap px-3 py-3 justify-end">
                <ButtonAlternative onClick={handleFileDelete} text={t('dataManagement.deleteVersionButton')} />
                <InfoButton 
                  tooltipText={t('dataManagement.deleteVersionButtonTooltip')}
                />
              </div>
              <div className="flex gap-3 flex-wrap px-3 py-3 justify-end">
                <ButtonAlternative onClick={handleFileUpdate} text={t('dataManagement.updateDataButton')} />
                <InfoButton 
                  tooltipText={t('dataManagement.downloadExcelButtonTooltip')}
                />
              </div>
            </>
            )}
          </div>
          <div className="py-3 w-full overflow-hidden">
          {isLoading ?
            (
              <div className="flex bg-[#F9FBFA] justify-center items-center min-h-screen">
                <LoadSpinner />
              </div>
            ) : (
            <div className="flex w-full max-w-full overflow-hidden">
              <Table data={filteredSpecies}/>
            </div>
            )
          }
          </div>
        </div>
        <AnimatePresence>
          {dialogVisible && (
            <DialogAdvice 
            dialogTitle={`${dialogType === 'success' ? t('dialogAdvice.successTitle') : t('dialogAdvice.errorTitle')}`}
            dialogMessage={dialogMessage} 
            onClose={closeDialog}/>
          )}
        </AnimatePresence>
      </div>
    )
};

export default DataManagement;