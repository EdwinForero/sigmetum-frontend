import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FormatFileName } from '../utilities/FormatFileName.js';
import DialogAdvice from './DialogAdvice';
import api from '../services/api';
import useDialog from '../hooks/useDialog';

const FileDropdown = forwardRef(({
  onLoad,
  onFileSelect,
  selectedFile },
  ref
) => {

  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [versions, setVersions] = useState([]);
  const [isError, setIsError] = useState(false);
  const dropdownRef = useRef();
  const { dialog, showDialog, closeDialog } = useDialog();

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setIsError(false);
    try {
      const data = await api.get('/list-files');
      setProvinces(Object.keys(data));
      setFiles(data);
      setSelectedProvince(null);
    } catch {
      setIsError(true);
    }
  };

  const handleProvinceSelect = (province) => {
    setSelectedProvince(province);
    setVersions(files[province] || []);
  };

  const handleVersionSelect = async (fileKey, fileName) => {
    onLoad(true);
    try {
      const jsonData = await api.get(`/get-data/${fileKey}`);
      onFileSelect(jsonData, fileKey);
      setName(fileName);
      setIsOpen(false);
    } catch {
      showDialog(t('dialogAdvice.errorTitle'), t('dialogAdvice.errorLoadFile'));
    } finally {
      onLoad(false);
    }
  };

  useImperativeHandle(ref, () => ({ fetchFiles }));

  useEffect(() => {
    if (selectedFile && !Object.values(files).flat().some((file) => file.key === selectedFile)) {
      onFileSelect([], null);
    }
  }, [files, selectedFile, onFileSelect]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div ref={dropdownRef} className="relative">
        <div
          className="form-input bg-[#F9FBFA] w-full resize-none rounded-xl text-[#111418] focus:outline-0 border border-[#15B659] h-14 p-[15px] text-base cursor-pointer"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          {selectedFile ? FormatFileName(name) : t('dataManagement.fileSelectDropdwon.selectFileDropdownPlaceholder')}
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute z-50 bg-white border border-[#15B659] rounded-xl shadow-lg w-full mt-2"
              initial={{ clipPath: 'inset(0 0 100% 0)' }}
              animate={{ clipPath: 'inset(0 0 0 0)' }}
              exit={{ clipPath: 'inset(0 0 100% 0)' }}
              transition={{ duration: 0.3 }}
            >
              {isError ? (
                <p className="text-[#0C1811] p-3">{t('dialogAdvice.errorLoadData')}</p>
              ) : provinces.length > 0 ? (
                <div className="flex">
                  <div className="w-1/2 max-h-60 overflow-y-auto border-r border-[#15B659] p-2">
                    <h3 className="font-bold text-base mb-2">{t('dataManagement.fileSelectDropdwon.provinceTitle')}</h3>
                    <ul>
                      {provinces.map((province) => (
                        <li
                          key={province}
                          className={`p-2 cursor-pointer rounded ${province === selectedProvince ? 'bg-[#99BBA8]' : 'hover:bg-[#99BBA8]'}`}
                          onClick={() => handleProvinceSelect(province)}
                        >
                          {province}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="w-1/2 max-h-60 overflow-y-auto p-2">
                    <h3 className="font-bold text-base mb-2">{t('dataManagement.fileSelectDropdwon.versionTitle')}</h3>
                    {selectedProvince ? (
                      <ul>
                        {versions.map(({ key, name }) => (
                          <li
                            key={key}
                            className={`p-2 cursor-pointer rounded ${selectedFile === key ? 'bg-[#99BBA8]' : 'hover:bg-[#99BBA8]'}`}
                            onClick={() => handleVersionSelect(key, name)}
                          >
                            {FormatFileName(name)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#0C1811]">{t('dataManagement.fileSelectDropdwon.versionPlaceholder')}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[#0C1811] p-3">{t('dataManagement.fileSelectDropdwon.noDataFoundPlaceholder')}</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
    </>
  );
});

export default FileDropdown;
