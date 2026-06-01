import { useState } from 'react';

const useDialog = () => {
  const [dialog, setDialog] = useState({
    visible: false,
    title: '',
    message: '',
    details: null,
    onConfirm: null,
  });

  const showDialog = (title, message, { details = null, onConfirm = null } = {}) => {
    setDialog({ visible: true, title, message, details, onConfirm });
  };

  const closeDialog = () => {
    setDialog({ visible: false, title: '', message: '', details: null, onConfirm: null });
  };

  return { dialog, showDialog, closeDialog };
};

export default useDialog;
