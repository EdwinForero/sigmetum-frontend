import React, { useCallback, useEffect, useId, useImperativeHandle, useRef, useState, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FormatFileName } from '../utilities/FormatFileName.js';
import ButtonAlternative from './ButtonAlternative';
import InlineError from './InlineError';
import LoadSpinner from './LoadSpinner';
import api from '../services/api';

const FileDropdown = forwardRef(function FileDropdown({
  id,
  onLoad,
  onFileSelect,
  selectedFile,
  disabled = false },
  ref
) {
  const { t } = useTranslation();
  const errorId = useId();
  const listErrorId = useId();
  const emptyId = useId();
  const [files, setFiles] = useState({});
  const [listStatus, setListStatus] = useState('loading');
  const [pendingKey, setPendingKey] = useState(null);
  const [failedKey, setFailedKey] = useState(null);
  // La clave que se está pidiendo ahora: una respuesta de otra clave llega tarde y se descarta.
  const pendingRef = useRef(null);

  const fetchFiles = useCallback(async () => {
    setListStatus('loading');
    try {
      const data = await api.get('/list-files');
      setFiles(data);
      setListStatus('ready');
    } catch {
      setListStatus('error');
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useImperativeHandle(ref, () => ({ fetchFiles }), [fetchFiles]);

  const provinces = Object.keys(files);

  const versionLabel = (key) => {
    for (const province of provinces) {
      const version = files[province].find((file) => file.key === key);
      if (version) return `${province} ${FormatFileName(version.name)}`;
    }
    return key;
  };

  const loadVersion = async (key) => {
    pendingRef.current = key;
    setPendingKey(key);
    setFailedKey(null);
    onLoad(true);
    let data;
    try {
      data = await api.get(`/get-data/${key}`);
    } catch {
      if (pendingRef.current !== key) return;
      setFailedKey(key);
      onFileSelect([], null, null);
      pendingRef.current = null;
      setPendingKey(null);
      onLoad(false);
      return;
    }
    if (pendingRef.current !== key) return;
    onFileSelect(data, key, versionLabel(key));
    pendingRef.current = null;
    setPendingKey(null);
    onLoad(false);
  };

  const handleChange = (event) => {
    const key = event.target.value;
    if (key === '') {
      const wasLoading = pendingRef.current !== null;
      pendingRef.current = null;
      setPendingKey(null);
      setFailedKey(null);
      if (wasLoading) onLoad(false);
      onFileSelect([], null, null);
      return;
    }
    loadVersion(key);
  };

  useEffect(() => {
    if (
      listStatus === 'ready' &&
      selectedFile &&
      !Object.values(files).flat().some((file) => file.key === selectedFile)
    ) {
      onFileSelect([], null, null);
    }
  }, [files, listStatus, selectedFile, onFileSelect]);

  const isEmpty = listStatus === 'ready' && provinces.length === 0;
  const describedBy =
    [failedKey && errorId, listStatus === 'error' && listErrorId, isEmpty && emptyId].filter(Boolean).join(' ') ||
    undefined;
  const statusLabel =
    listStatus === 'loading'
      ? t('dataManagement.fileSelectDropdwon.loading')
      : pendingKey
        ? t('dataManagement.loadingVersionData')
        : '';

  return (
    <div className="w-full">
      <select
        id={id}
        value={pendingKey ?? selectedFile ?? ''}
        onChange={handleChange}
        disabled={listStatus !== 'ready' || isEmpty || disabled}
        aria-invalid={failedKey ? true : undefined}
        aria-describedby={describedBy}
        className="focus-ring h-12 w-full rounded-xl border border-brand-dark bg-surface px-3 text-base text-ink disabled:cursor-not-allowed disabled:border-moss disabled:text-moss disabled:opacity-100"
      >
        <option value="">{t('dataManagement.fileSelectDropdwon.emptyOption')}</option>
        {provinces.map((province) => (
          <optgroup key={province} label={province}>
            {files[province].map(({ key, name }) => (
              <option key={key} value={key}>{`${province} · ${FormatFileName(name)}`}</option>
            ))}
          </optgroup>
        ))}
      </select>

      <LoadSpinner inline label={statusLabel} />

      {listStatus === 'error' && (
        <div className="py-2">
          <InlineError id={listErrorId}>{t('dialogAdvice.errorLoadData')}</InlineError>
          <ButtonAlternative text={t('feedback.retry')} onClick={fetchFiles} />
        </div>
      )}

      {failedKey && (
        <div className="py-2">
          <InlineError id={errorId}>{t('dialogAdvice.errorLoadFile')}</InlineError>
          <ButtonAlternative text={t('feedback.retry')} onClick={() => loadVersion(failedKey)} />
        </div>
      )}

      {isEmpty && (
        <p id={emptyId} className="py-2 text-ink">
          {t('dataManagement.fileSelectDropdwon.emptyState')}{' '}
          <Link to="/cargar-archivos" className="focus-ring rounded font-bold text-brand-deep underline">
            {t('dataManagement.fileSelectDropdwon.emptyStateLink')}
          </Link>
        </p>
      )}
    </div>
  );
});

export default FileDropdown;
