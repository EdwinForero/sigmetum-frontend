import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToastProvider from './ToastProvider';
import { useToast } from '../hooks/useToast';

const Launcher = ({ success = 'Guardado', error = 'Falló' }) => {
  const { notifySuccess, notifyError } = useToast();
  return (
    <>
      <button onClick={() => notifySuccess(success)}>lanzar éxito</button>
      <button onClick={() => notifyError(error)}>lanzar error</button>
    </>
  );
};

const renderLauncher = (props) => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <ToastProvider>
      <Launcher {...props} />
    </ToastProvider>
  );
  return user;
};

const advance = (ms) => act(() => { vi.advanceTimersByTime(ms); });
const region = (text) => screen.queryByText(text)?.closest('[role=status],[role=alert]');

describe('ToastProvider', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it('monta siempre las dos regiones, aunque no haya avisos', () => {
    renderLauncher();

    expect(document.querySelector('[role=status]')).toBeInTheDocument();
    expect(document.querySelector('[role=alert]')).toBeInTheDocument();
    expect(document.querySelector('[role=status]')).toBeEmptyDOMElement();
    expect(document.querySelector('[role=alert]')).toBeEmptyDOMElement();
  });

  it('el éxito aparece en la región status y desaparece a los 8 segundos', async () => {
    const user = renderLauncher();

    await user.click(screen.getByText('lanzar éxito'));
    expect(region('Guardado')).toHaveAttribute('role', 'status');

    advance(7000);
    expect(screen.queryByText('Guardado')).toBeInTheDocument();
    advance(1500);
    expect(screen.queryByText('Guardado')).toBeNull();
  });

  it('el éxito no desaparece con el ratón encima y reinicia el contador al salir', async () => {
    const user = renderLauncher();
    await user.click(screen.getByText('lanzar éxito'));

    advance(5000);
    await user.hover(screen.getByText('Guardado'));
    advance(60000);
    expect(screen.queryByText('Guardado')).toBeInTheDocument();

    await user.unhover(screen.getByText('Guardado'));
    advance(7000);
    expect(screen.queryByText('Guardado')).toBeInTheDocument();
    advance(1500);
    expect(screen.queryByText('Guardado')).toBeNull();
  });

  it('el éxito no desaparece mientras el foco está en su botón de cerrar', async () => {
    const user = renderLauncher();
    await user.click(screen.getByText('lanzar éxito'));
    const cerrar = screen.getByRole('button', { name: 'feedback.close' });

    act(() => cerrar.focus());
    advance(60000);
    expect(screen.queryByText('Guardado')).toBeInTheDocument();

    act(() => cerrar.blur());
    advance(8100);
    expect(screen.queryByText('Guardado')).toBeNull();
  });

  it('el error aparece en la región alert, sigue a los 60 segundos y cerrar lo quita', async () => {
    const user = renderLauncher();

    await user.click(screen.getByText('lanzar error'));
    expect(region('Falló')).toHaveAttribute('role', 'alert');

    advance(60000);
    expect(screen.queryByText('Falló')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'feedback.close' }));
    expect(screen.queryByText('Falló')).toBeNull();
  });

  it('cada aviso lleva icono oculto a lectores y un botón de cerrar de 44 por 44', async () => {
    const user = renderLauncher();
    await user.click(screen.getByText('lanzar error'));

    const aviso = region('Falló');
    expect(aviso.querySelector('[aria-hidden="true"]')).toHaveClass('material-symbols-outlined');
    expect(screen.getByRole('button', { name: 'feedback.close' })).toHaveClass('h-11', 'w-11');
  });

  it.each([
    ['lanzar éxito', 'Guardado', 'border-brand-deep', 'check_circle', 'text-brand-deep'],
    ['lanzar error', 'Falló', 'border-danger', 'error', 'text-danger'],
  ])('%s usa el sistema de avisos: clases base, color de su variante e icono', async (boton, texto, border, icon, iconClass) => {
    const user = renderLauncher();
    await user.click(screen.getByText(boton));

    const caja = screen.getByText(texto).parentElement;
    expect(caja).toHaveClass('flex', 'items-start', 'gap-2', 'rounded-lg', 'border', 'p-stack-md', 'bg-surface', border, 'shadow-lg');
    expect(caja).not.toHaveClass('border-2');
    const ligadura = caja.querySelector('[aria-hidden="true"]');
    expect(ligadura).toHaveTextContent(icon);
    expect(ligadura).toHaveClass(iconClass);
  });

  it('no mueve el foco al aparecer un aviso', async () => {
    const user = renderLauncher();
    const lanzar = screen.getByText('lanzar éxito');

    await user.click(lanzar);
    expect(screen.queryByText('Guardado')).toBeInTheDocument();
    expect(lanzar).toHaveFocus();

    await user.click(screen.getByText('lanzar error'));
    expect(screen.getByText('lanzar error')).toHaveFocus();
  });

  it('varios avisos conviven y se cierran por separado', async () => {
    const user = renderLauncher();
    await user.click(screen.getByText('lanzar error'));
    await user.click(screen.getByText('lanzar error'));

    expect(screen.getAllByText('Falló')).toHaveLength(2);
    await user.click(screen.getAllByRole('button', { name: 'feedback.close' })[0]);
    expect(screen.getAllByText('Falló')).toHaveLength(1);
  });
});

describe('useToast', () => {
  it('lanza un error si se usa sin proveedor', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useToast())).toThrow();
    spy.mockRestore();
  });
});
