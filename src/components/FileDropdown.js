import React, { useEffect, useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { FormatFileName } from '../utilities/FormatFileName.js';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const FileDropdown = forwardRef(({ 
  onLoad, 
  onFileSelect, 
  selectedFile }, 
  ref
) => {
  
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [versions, setVersions] = useState([]);
  const dropdownRef = useRef();
  const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
      fetchFiles();
  }, []);

  const fetchFiles = async () => {
      try {
          const response = await fetch(`${BASE_URL}/list-files`);
          const data = await response.json();

          const provincesSet = new Set();
          const filesByProvince = {};

          data.files.forEach((file) => {
              const parts = file.key.split('/');
              if (parts.length > 1) {
                  const province = parts[1];
                  provincesSet.add(province);

                  if (!filesByProvince[province]) {
                      filesByProvince[province] = [];
                  }
                  filesByProvince[province].push({ 
                      version: parts.slice(2).join('/'), 
                      fullKey: file.key, 
                      name: file.name 
                  });
              }
          });

          setProvinces(Array.from(provincesSet));
          setFiles(filesByProvince);
          setSelectedProvince(null);
      } catch (error) {
          console.error('Error fetching files:', error);
      }
  };

  const handleProvinceSelect = (province) => {
      setSelectedProvince(province);
      setVersions(files[province] || []);
  };

  const handleVersionSelect = async (fileKey, name) => {
      onLoad(true);
      try {
          const response = await fetch(`${BASE_URL}/get-data/${fileKey}`);
          const jsonData = await response.json();
          onFileSelect(jsonData, fileKey);
          setName(name);
          setIsOpen(false);
      } catch (error) {
          console.error('Error fetching file data:', error);
      } finally {
          onLoad(false);
      }
  };

  useImperativeHandle(ref, () => ({
      fetchFiles,
  }));

  useEffect(() => {
      if (selectedFile && !Object.values(files).flat().some(file => file.fullKey === selectedFile)) {
          onFileSelect([], null);
      }
  }, [files, selectedFile, onFileSelect]);

  useEffect(() => {
      const handleClickOutside = (event) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
              setIsOpen(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      };
  }, []);

  return (
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
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.3 }}
          >
            {provinces.length > 0 ? (
              <div className="flex">
                <div className="w-1/2 max-h-60 overflow-y-auto border-r border-[#15B659] p-2">
                  <h3 className="font-bold text-base mb-2">{t('dataManagement.fileSelectDropdwon.provinceTitle')}</h3>
                  <ul>
                    {provinces.map((province) => (
                      <li
                        key={province}
                        className={`p-2 cursor-pointer rounded ${
                          province === selectedProvince
                            ? "bg-[#99BBA8]"
                            : "hover:bg-[#99BBA8]"
                        }`}
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
                      {versions.map(({ fullKey, name }) => (
                        <li
                          key={fullKey}
                          className={`p-2 cursor-pointer rounded ${
                            selectedFile === fullKey
                              ? "bg-[#99BBA8]"
                              : "hover:bg-[#99BBA8]"
                          }`}
                          onClick={() => handleVersionSelect(fullKey, name)}
                        >
                          {FormatFileName(name)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[#0C1811]">
                      {t('dataManagement.fileSelectDropdwon.versionPlaceholder')}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[#0C1811]">{t('dataManagement.fileSelectDropdwon.noDataFoundPlaceholder')}</p>
            )}
          </motion.div>
          
        )}
        </AnimatePresence>
    </div>
  );
});

export default FileDropdown;