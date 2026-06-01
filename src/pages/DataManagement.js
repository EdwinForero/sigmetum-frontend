import { React, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ButtonAlternative from '../components/ButtonAlternative';
import Table from '../components/Table';
import FileDropdown from '../components/FileDropdown';
import LoadSpinner from '../components/LoadSpinner';
import DialogAdvice from '../components/DialogAdvice';
import InfoButton from '../components/InfoButton';
import { downloadXLSX } from '../utilities/CSVfunctions';
import api from '../services/api';
import useDialog from '../hooks/useDialog';

const DataManagement = ({ onFileDropdownSelect, filteredSpecies }) => {
  const { t } = useTranslation();
  const [fileName, setFileName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileDropdownRef = useRef(null);
  const { dialog, showDialog, closeDialog } = useDialog();

  const handleFileSelect = (jsonData, fileName) => {
    onFileDropdownSelect(jsonData);
    setFileName(fileName);
  };

  const resetDropdown = () => {
    onFileDropdownSelect([]);
    setFileName(null);
    if (fileDropdownRef.current) fileDropdownRef.current.fetchFiles();
  };

  const handleFileDelete = async () => {
    setIsLoading(true);
    try {
      await api.postAuth('/delete-file', { fileName });
      showDialog(t('dialogAdvice.successTitle'), t('dialogAdvice.successDeleteMessage'));
      resetDropdown();
    } catch {
      showDialog(t('dialogAdvice.errorTitle'), t('dialogAdvice.errorDeleteMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpdate = async () => {
    setIsLoading(true);
    try {
      await api.postAuth('/update-file', { fileName });
      if (fileDropdownRef.current) fileDropdownRef.current.fetchFiles();
      showDialog(t('dialogAdvice.successTitle'), t('dialogAdvice.successUpdateMessage'));
    } catch {
      showDialog(t('dialogAdvice.errorTitle'), t('dialogAdvice.errorUpdateMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnLoad = (state) => setIsLoading(state);

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
          <InfoButton tooltipText={t('dataManagement.fileSelectDropdwon.selectFileDropdownTooltip')} />
        </div>

        <div className="flex justify-stretch w-full">
          <label className="flex flex-col w-full min-w-40 py-3 flex-1">
            <FileDropdown ref={fileDropdownRef} onLoad={handleOnLoad} onFileSelect={handleFileSelect} selectedFile={fileName} className="file-dropdown" />
          </label>
          {fileName && fileName !== '' && (
            <>
              <div className="flex gap-3 flex-wrap px-3 py-3 justify-end">
                <ButtonAlternative onClick={() => downloadXLSX(filteredSpecies)} text={t('dataManagement.downloadExcelButton')} />
                <InfoButton tooltipText={t('dataManagement.downloadExcelButtonTooltip')} />
              </div>
              <div className="flex gap-3 flex-wrap px-3 py-3 justify-end">
                <ButtonAlternative onClick={handleFileDelete} text={t('dataManagement.deleteVersionButton')} />
                <InfoButton tooltipText={t('dataManagement.deleteVersionButtonTooltip')} />
              </div>
              <div className="flex gap-3 flex-wrap px-3 py-3 justify-end">
                <ButtonAlternative onClick={handleFileUpdate} text={t('dataManagement.updateDataButton')} />
                <InfoButton tooltipText={t('dataManagement.downloadExcelButtonTooltip')} />
              </div>
            </>
          )}
        </div>

        <div className="py-3 w-full overflow-hidden">
          {isLoading ? (
            <div className="flex bg-[#F9FBFA] justify-center items-center min-h-screen">
              <LoadSpinner />
            </div>
          ) : (
            <div className="flex w-full max-w-full overflow-hidden">
              <Table data={filteredSpecies} />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {dialog.visible && (
          <DialogAdvice
            dialogTitle={dialog.title}
            dialogMessage={dialog.message}
            onClose={closeDialog}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataManagement;
