import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useDialogFocus from './useDialogFocus';

const Dialog = ({ name, onClose, children }) => {
  const ref = useDialogFocus(true, onClose);
  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-label={name}>
      <button>{`${name}-1`}</button>
      {children}
      <button>{`${name}-2`}</button>
    </div>
  );
};

describe('useDialogFocus', () => {
  it('con dos diálogos abiertos, Escape cierra solo el de encima', async () => {
    const user = userEvent.setup();
    const cierraA = vi.fn();
    const cierraB = vi.fn();
    render(
      <>
        <Dialog name="A" onClose={cierraA} />
        <Dialog name="B" onClose={cierraB} />
      </>
    );

    await user.keyboard('{Escape}');

    expect(cierraB).toHaveBeenCalledTimes(1);
    expect(cierraA).not.toHaveBeenCalled();
  });

  it('con dos diálogos abiertos, Tab no sale del de encima', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Dialog name="A" onClose={vi.fn()} />
        <Dialog name="B" onClose={vi.fn()} />
      </>
    );

    screen.getByRole('button', { name: 'B-2' }).focus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'B-1' })).toHaveFocus();

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'B-2' })).toHaveFocus();
  });

  it('al cerrarse el de encima, el de debajo vuelve a atender Escape', async () => {
    const user = userEvent.setup();
    const cierraA = vi.fn();
    const { rerender } = render(
      <>
        <Dialog name="A" onClose={cierraA} />
        <Dialog name="B" onClose={vi.fn()} />
      </>
    );
    rerender(<Dialog name="A" onClose={cierraA} />);
    // el de debajo conserva su identidad al reutilizarse la posición 0
    await user.keyboard('{Escape}');

    expect(cierraA).toHaveBeenCalledTimes(1);
  });

  it('si se abre desde body (sin elemento enfocado), al cerrar el foco va al main', () => {
    render(<main><p>contenido</p></main>);
    expect(document.activeElement).toBe(document.body);
    const { unmount } = render(<Dialog name="A" onClose={vi.fn()} />);

    unmount();

    expect(document.querySelector('main')).toHaveFocus();
  });

  it('Shift+Tab desde un contenedor con scroll no enfocable por el selector lleva al último control', async () => {
    const user = userEvent.setup();
    render(
      <Dialog name="A" onClose={vi.fn()}>
        <div data-testid="scroll" tabIndex={-1}>texto largo</div>
      </Dialog>
    );
    screen.getByTestId('scroll').focus();

    await user.tab({ shift: true });

    expect(screen.getByRole('button', { name: 'A-2' })).toHaveFocus();
  });
});
