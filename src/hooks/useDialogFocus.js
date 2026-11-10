import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

// Pila de diálogos abiertos: solo atiende el teclado el último abierto (el de encima).
const openDialogs = [];

// Gestiona el foco de un diálogo modal: lo lleva a la caja al abrir, atrapa Tab y Shift+Tab,
// cierra con Escape y devuelve el foco a quien lo abrió. Devuelve la ref de la caja del diálogo,
// que debe llevar tabIndex={-1}.
const useDialogFocus = (isOpen, onClose) => {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const token = {};
    openDialogs.push(token);
    const opener = document.activeElement;
    dialogRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return;
      if (openDialogs[openDialogs.length - 1] !== token) return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = Array.from(dialog.querySelectorAll(FOCUSABLE));
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const isOutside = !dialog.contains(active);

      if (event.shiftKey && (items.indexOf(active) <= 0 || isOutside)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (active === last || isOutside)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const index = openDialogs.indexOf(token);
      if (index !== -1) openDialogs.splice(index, 1);
      if (opener && opener !== document.body && opener.isConnected) {
        opener.focus?.({ preventScroll: true });
        return;
      }
      const main = document.querySelector('main');
      if (main) {
        if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  return dialogRef;
};

export default useDialogFocus;
