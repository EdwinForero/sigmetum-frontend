import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnimatePresence } from 'motion/react';
import DialogAdvice from './DialogAdvice';

const renderSimple = (props = {}) => {
  const onClose = vi.fn();
  render(<DialogAdvice dialogTitle="Aviso" dialogMessage="Mensaje" onClose={onClose} {...props} />);
  return { onClose };
};

const renderConfirm = () => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();
  render(
    <>
      <button>fuera</button>
      <DialogAdvice
        dialogTitle="Aviso"
        dialogMessage="Mensaje"
        showActions
        onClose={onClose}
        onConfirm={onConfirm}
      />
      <button>fuera después</button>
    </>
  );
  return { onClose, onConfirm };
};

const Harness = ({ onClose = vi.fn(), animated = false }) => {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose();
    setOpen(false);
  };
  const dialog = open && <DialogAdvice dialogTitle="Aviso" dialogMessage="Mensaje" onClose={close} />;
  return (
    <>
      <button onClick={() => setOpen(true)}>abrir</button>
      {animated ? <AnimatePresence>{dialog}</AnimatePresence> : dialog}
    </>
  );
};

describe('DialogAdvice', () => {
  it('es un diálogo modal con el título como nombre accesible', () => {
    renderSimple();

    const dialogo = screen.getByRole('dialog', { name: 'Aviso' });
    expect(dialogo).toHaveAttribute('aria-modal', 'true');
  });

  it('al abrir, el foco pasa al propio diálogo', () => {
    renderSimple();

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('Escape llama a onClose en la variante simple', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSimple();

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape equivale a cancelar: llama a onClose y no a onConfirm', async () => {
    const user = userEvent.setup();
    const { onClose, onConfirm } = renderConfirm();

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Tab y Shift+Tab quedan atrapados entre Confirmar y Cancelar', async () => {
    const user = userEvent.setup();
    renderConfirm();
    const confirmar = screen.getByRole('button', { name: 'dialogAdvice.confirmButton' });
    const cancelar = screen.getByRole('button', { name: 'dialogAdvice.cancelButton' });

    cancelar.focus();
    await user.tab();
    expect(confirmar).toHaveFocus();

    await user.tab({ shift: true });
    expect(cancelar).toHaveFocus();
  });

  it('Shift+Tab desde el propio diálogo no sale hacia el botón de fuera', async () => {
    const user = userEvent.setup();
    renderConfirm();

    await user.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'dialogAdvice.cancelButton' })).toHaveFocus();
  });

  it('con el foco fuera del diálogo, Tab lo devuelve al primer control', async () => {
    const user = userEvent.setup();
    renderConfirm();

    screen.getByRole('button', { name: 'fuera después' }).focus();
    await user.tab();

    expect(screen.getByRole('button', { name: 'dialogAdvice.confirmButton' })).toHaveFocus();
  });

  it('al cerrar, el foco vuelve al botón que abrió el diálogo', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const abrir = screen.getByRole('button', { name: 'abrir' });

    await user.click(abrir);
    expect(screen.getByRole('dialog')).toHaveFocus();
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(abrir).toHaveFocus();
  });

  it('con AnimatePresence, un segundo Escape durante la salida no vuelve a llamar a onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} animated />);
    const abrir = screen.getByRole('button', { name: 'abrir' });

    await user.click(abrir);
    await user.keyboard('{Escape}');
    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(abrir).toHaveFocus();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('si el elemento que lo abrió ya no está en el documento, el foco va al main', async () => {
    const user = userEvent.setup();
    const Desmontando = () => {
      const [estado, setEstado] = useState('cerrado');
      return (
        <>
          <main>
            {estado !== 'fin' && <button onClick={() => setEstado('abierto')}>abrir</button>}
          </main>
          {estado === 'abierto' && (
            <DialogAdvice dialogTitle="Aviso" dialogMessage="Mensaje" onClose={() => setEstado('fin')} />
          )}
        </>
      );
    };
    render(<Desmontando />);

    await user.click(screen.getByRole('button', { name: 'abrir' }));
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('button', { name: 'abrir' })).not.toBeInTheDocument();
    expect(document.querySelector('main')).toHaveFocus();
  });

  it('caracterización: el clic en el fondo llama a onClose y el clic dentro de la caja no', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSimple();

    await user.click(screen.getByText('Mensaje'));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByText('Mensaje').closest('div.fixed'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('el título usa brand-deep (contraste sobre el fondo claro)', () => {
    renderSimple();

    expect(screen.getByRole('heading', { name: 'Aviso' })).toHaveClass('text-brand-deep');
  });

  it('con confirmText, el botón de confirmar lleva ese texto y sigue llamando a onConfirm', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderSimple({ showActions: true, onConfirm, confirmText: 'Eliminar' });

    expect(screen.queryByRole('button', { name: 'dialogAdvice.confirmButton' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('sin confirmText, el botón de confirmar es dialogAdvice.confirmButton', () => {
    renderSimple({ showActions: true, onConfirm: vi.fn() });

    expect(screen.getByRole('button', { name: 'dialogAdvice.confirmButton' })).toBeInTheDocument();
  });
});
