import { React, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import ButtonAlternative from '../components/ButtonAlternative';
import Table from '../components/Table';
import FileDropdown from '../components/FileDropdown';
import DialogAdvice from '../components/DialogAdvice';
import InfoButton from '../components/InfoButton';
import { downloadXLSX } from '../utilities/CSVfunctions';
import api from '../services/api';
import useDialog from '../hooks/useDialog';
import { useToast } from '../hooks/useToast';

const DataManagement = ({ onFileDropdownSelect, filteredSpecies }) => {
  const { t } = useTranslation();
  const { notifySuccess, notifyError } = useToast();
  const selectId = useId();
  const [fileName, setFileName] = useState(null);
  const [versionLabel, setVersionLabel] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [busyAction, setBusyAction] = useState(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const fileDropdownRef = useRef(null);
  const headingRef = useRef(null);
  const { dialog, showDialog, closeDialog } = useDialog();

  // El botón que abrió la confirmación se desmonta al borrar: el foco pasa al título, no a body.
  useEffect(() => {
    if (focusRequest > 0) headingRef.current?.focus();
  }, [focusRequest]);

  const handleFileSelect = (jsonData, key, label) => {
    onFileDropdownSelect(jsonData);
    setFileName(key);
    setVersionLabel(label);
  };

  const resetDropdown = () => {
    onFileDropdownSelect([]);
    setFileName(null);
    setVersionLabel(null);
    if (fileDropdownRef.current) fileDropdownRef.current.fetchFiles();
  };

  const handleFileDelete = async () => {
    closeDialog();
    setBusyAction('delete');
    try {
      await api.postAuth('/delete-file', { fileName });
      notifySuccess(t('dialogAdvice.successDeleteMessage'));
      resetDropdown();
      setFocusRequest((current) => current + 1);
    } catch {
      notifyError(t('dialogAdvice.errorDeleteMessage'));
    } finally {
      setBusyAction(null);
    }
  };

  const askDeleteConfirmation = () => {
    showDialog(
      t('dialogAdvice.confirmDeleteTitle'),
      t('dialogAdvice.confirmDeleteVersion', { name: versionLabel }),
      { onConfirm: handleFileDelete }
    );
  };

  const handleFileUpdate = async () => {
    setBusyAction('update');
    try {
      await api.postAuth('/update-file', { fileName });
      if (fileDropdownRef.current) fileDropdownRef.current.fetchFiles();
      notifySuccess(t('dialogAdvice.successUpdateMessage'));
    } catch {
      notifyError(t('dialogAdvice.errorUpdateMessage'));
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-5 pb-6">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="focus-heading py-4 text-[32px] font-bold leading-tight text-brand-deep"
      >
        {t('dataManagement.title')}
      </h1>

      <p className="text-left text-base text-ink sm:text-lg">
        {t('dataManagement.description')}
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-3">
        <label htmlFor={selectId} className="text-lg font-bold leading-tight tracking-[-0.015em] text-ink">
          {t('dataManagement.fileSelectDropdwon.selectFileDropdownLabel')}
        </label>
        <InfoButton
          topic={t('dataManagement.fileSelectDropdwon.selectFileDropdownLabel')}
          tooltipText={t('dataManagement.fileSelectDropdwon.selectFileDropdownTooltip')}
        />
      </div>

      <div className="py-3">
        <FileDropdown
          id={selectId}
          ref={fileDropdownRef}
          onLoad={setIsLoadingData}
          onFileSelect={handleFileSelect}
          selectedFile={fileName}
          disabled={busyAction !== null}
        />
      </div>

      {fileName && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <ButtonAlternative
              onClick={() => downloadXLSX(filteredSpecies)}
              text={t('dataManagement.downloadExcelButton')}
              disabled={isLoadingData}
            />
            <InfoButton
              topic={t('dataManagement.downloadExcelButton')}
              tooltipText={t('dataManagement.downloadExcelButtonTooltip')}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonAlternative
              onClick={askDeleteConfirmation}
              text={t('dataManagement.deleteVersionButton')}
              aria-label={t('dataManagement.deleteVersionNamed', { name: versionLabel })}
              loading={busyAction === 'delete'}
              disabled={busyAction === 'update' || isLoadingData}
            />
            <InfoButton
              topic={t('dataManagement.deleteVersionButton')}
              tooltipText={t('dataManagement.deleteVersionButtonTooltip')}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonAlternative
              onClick={handleFileUpdate}
              text={t('dataManagement.updateDataButton')}
              loading={busyAction === 'update'}
              disabled={busyAction === 'delete' || isLoadingData}
            />
            <InfoButton
              topic={t('dataManagement.updateDataButton')}
              tooltipText={t('dataManagement.updateDataButtonTooltip')}
            />
          </div>
        </div>
      )}

      <div className="w-full py-3">
        {fileName && !isLoadingData && <Table data={filteredSpecies} label={t('dataManagement.table.regionLabel')} />}
      </div>

      <AnimatePresence>
        {dialog.visible && (
          <DialogAdvice
            variant="warning"
            dialogTitle={dialog.title}
            dialogMessage={dialog.message}
            showActions
            confirmText={t('dialogAdvice.deleteButton')}
            onConfirm={dialog.onConfirm}
            onClose={closeDialog}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default DataManagement;
