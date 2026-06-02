import React, { useState } from 'react';
import ButtonAlternative from './ButtonAlternative';
import ButtonPrincipal from './ButtonPrincipal';
import DialogAdvice from './DialogAdvice';
import InfoButton from './InfoButton';
import { useTranslation } from 'react-i18next';
import { AnimatePresence } from 'framer-motion';
import env from '../config/env';
import useDialog from '../hooks/useDialog';

const FileUploadForm = ({
  onLoad
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const { dialog, showDialog, closeDialog } = useDialog();

  function normalizeFileName(fileName) {

    const lastDotIndex = fileName.lastIndexOf('.');
    const name = fileName.substring(0, lastDotIndex);
    const extension = fileName.substring(lastDotIndex);

    const normalizedFileName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9-_]/g, '');

    return normalizedFileName + extension;
  }

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);

    const newFiles = selectedFiles.filter(
      (newFile) => !files.some(
        (existingFile) => existingFile.name === newFile.name && existingFile.size === newFile.size
      )
    );
  
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  
    event.target.value = null;
  };

  const handleSubmit = async () => {
    onLoad(true);
    let allFilesUploadedSuccessfully = true;
  
    for (const file of files) {
      if (!file) continue;
  
      const normalizedFileName = normalizeFileName(file.name);
      const formData = new FormData();
      formData.append('file', new File([file], normalizedFileName));
  
      try {
        const response = await fetch(`${env.BASE_URL}${env.API_PREFIX}/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        const responseData = await response.json();

        if (!response.ok) {
          if (responseData.data?.emptyFields) {
            onLoad(false);
            const emptyFieldSummary = responseData.data.emptyFields
              .map((field) => t('dialogAdvice.rowEmpty', { rowIndex: field.rowIndex }))
              .join(', ');

            const confirmed = await new Promise((resolve) => {
              showDialog(
                t('dialogAdvice.adviceTitle'),
                t('dialogAdvice.fieldsMissingMessage', { filename: file.name }),
                {
                  details: { title: t('dialogAdvice.emptyFieldsSummary'), content: emptyFieldSummary },
                  onConfirm: () => resolve(true),
                }
              );
            });
            closeDialog();
  
            if (confirmed) {
              onLoad(true);
              const confirmedResponse = await fetch(`${env.BASE_URL}${env.API_PREFIX}/upload/confirm`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                  confirmed: true,
                  fileData: responseData.data.processedData,
                }),
              });
  
              if (!confirmedResponse.ok) {
                throw new Error('Error al confirmar la subida');
              }
            } else {
              allFilesUploadedSuccessfully = false;
              break;
            }
          } else {
            allFilesUploadedSuccessfully = false;
            showDialog(t('dialogAdvice.errorTitle'), t('dialogAdvice.errorUploadMessage'));
            break;
          }
        }
      } catch (error) {
        allFilesUploadedSuccessfully = false;
        showDialog(t('dialogAdvice.errorTitle'), t('dialogAdvice.errorUploadMessage'));
        setFiles([]);
        break;
      } finally {
        onLoad(false);
      }
    }
  
    if (allFilesUploadedSuccessfully) {
      showDialog(t('dialogAdvice.successTitle'), t('dialogAdvice.successUploadMessage'));
      setFiles([]);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prevFiles) => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  return (

    <>
      <div className="flex flex-col items-center gap-4 p-4 border border-[#99BBA8] rounded">
        
        <input
          type="file"
          multiple
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleFileSelect}
          className="hidden"
          id="fileInput"
        />
        
        <div className="flex justify-center items-center m-2">
          <ButtonAlternative text={t('uploadFiles.fileUploadForm.selectFilesButton')} onClick={() => document.getElementById('fileInput').click()}/>
          <InfoButton 
            tooltipText={t('uploadFiles.fileUploadForm.selectFilesButtonTooltip')}
          />
        </div>

        <div className="mt-4">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between text-gray-700 mb-2">
              <p>{file.name}</p>
              <button
                onClick={() => handleRemoveFile(index)}
                className="text-[#15B659] cursor-pointer"
              >
              <span className="material-symbols-outlined text-3xl mx-auto">
                delete
              </span>
            </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex px-4 py-3 justify-center">
        {files.length > 0 && (
          <ButtonPrincipal text={t('uploadFiles.fileUploadForm.uploadFilesButton')} onClick={handleSubmit} />
        )}
        
        <AnimatePresence>
          {dialog.visible && (
            <DialogAdvice
              dialogTitle={dialog.title}
              dialogMessage={dialog.message}
              dialogDetails={dialog.details}
              onConfirm={dialog.onConfirm}
              onClose={closeDialog}
              showActions={!!dialog.onConfirm}
            />
          )}
        </AnimatePresence>
      </div>
      </>
  );
};

export default FileUploadForm;