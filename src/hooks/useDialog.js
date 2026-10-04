import { useState } from 'react';

const useDialog = () => {
  const [dialog, setDialog] = useState({
    visible: false,
    title: '',
    message: '',
    details: null,
    onConfirm: null,
    onCancel: null,
  });

  const showDialog = (title, message, { details = null, onConfirm = null, onCancel = null } = {}) => {
    setDialog({ visible: true, title, message, details, onConfirm, onCancel });
  };

  const closeDialog = () => {
    setDialog({ visible: false, title: '', message: '', details: null, onConfirm: null, onCancel: null });
  };

  return { dialog, showDialog, closeDialog };
};

export default useDialog;
