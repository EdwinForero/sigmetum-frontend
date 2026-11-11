import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TermsManager from './TermsManager';
import ToastProvider from './ToastProvider';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), postAuth: vi.fn(), deleteAuth: vi.fn() },
}));

const NS = 'contentManagement';
const campo = () => screen.getByLabelText(`${NS}.noLatinTermsPlaceholder`);
const botonAnadir = () => screen.getByRole('button', { name: `${NS}.addTermButton` });
// Las regiones role=status y role=alert del ToastProvider están siempre montadas: se busca por texto y se sube a su región.
const regionDe = (texto) => screen.getByText(texto).closest('[role=alert],[role=status]');

const deferred = () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const renderManager = async () => {
  render(
    <ToastProvider>
      <TermsManager />
    </ToastProvider>
  );
  await screen.findByText('subsp.');
};

describe('TermsManager', () => {
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue([{ term: 'var.' }, { term: 'subsp.' }]);
    api.postAuth.mockReset().mockResolvedValue({});
    api.deleteAuth.mockReset().mockResolvedValue({});
  });

  it('no muta el array que devuelve la api al ordenar la lista', async () => {
    const respuesta = [{ term: 'var.' }, { term: 'subsp.' }];
    api.get.mockResolvedValue(respuesta);

    await renderManager();

    expect(respuesta.map((item) => item.term)).toEqual(['var.', 'subsp.']);
    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items[0]).toContain('subsp.');
    expect(items[1]).toContain('var.');
  });

  it('el botón de añadir tiene el texto «Añadir término» y la sección tiene nombre', async () => {
    await renderManager();

    expect(botonAnadir()).toBeInTheDocument();
    expect(screen.getByRole('region', { name: `${NS}.noLatinTermsTitle` })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: `${NS}.termsListLabel` })).toBeInTheDocument();
  });

  it('las papeleras tienen nombre accesible y anillo de foco', async () => {
    await renderManager();

    const papeleras = screen.getAllByRole('button', { name: `${NS}.deleteTerm` });

    expect(papeleras).toHaveLength(2);
    papeleras.forEach((papelera) => expect(papelera).toHaveClass('focus-ring'));
  });

  describe('validación en línea', () => {
    it('con el campo vacío muestra el error junto al campo, lo marca, le da el foco y no sube ni abre diálogo', async () => {
      const user = userEvent.setup();
      await renderManager();

      await user.click(botonAnadir());

      const mensaje = await screen.findByText('dialogAdvice.adviceEmptyValues');
      const error = mensaje.closest('p');
      expect(error).toHaveAttribute('role', 'alert');
      expect(campo()).toHaveAttribute('aria-invalid', 'true');
      expect(campo()).toHaveAttribute('aria-describedby', error.id);
      expect(campo()).toHaveFocus();
      expect(api.postAuth).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('con un duplicado (sin distinguir mayúsculas) da el error de duplicado y no sube', async () => {
      const user = userEvent.setup();
      await renderManager();

      await user.type(campo(), 'SUBSP.');
      await user.click(botonAnadir());

      const mensaje = await screen.findByText('dialogAdvice.adviceDuplicatedTerm');
      expect(mensaje.closest('p')).toHaveAttribute('role', 'alert');
      expect(campo()).toHaveAttribute('aria-invalid', 'true');
      expect(campo()).toHaveFocus();
      expect(api.postAuth).not.toHaveBeenCalled();
    });

    it('el error se limpia al escribir', async () => {
      const user = userEvent.setup();
      await renderManager();
      await user.click(botonAnadir());
      await screen.findByText('dialogAdvice.adviceEmptyValues');

      await user.type(campo(), 'n');

      expect(screen.queryByText('dialogAdvice.adviceEmptyValues')).not.toBeInTheDocument();
      expect(campo()).not.toHaveAttribute('aria-invalid');
      expect(campo()).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('añadir', () => {
    it('con éxito avisa en la región status, vacía el campo y recarga la lista', async () => {
      const user = userEvent.setup();
      await renderManager();

      await user.type(campo(), 'nuevo');
      await user.click(botonAnadir());

      await screen.findByText('dialogAdvice.successUploadTerm');
      expect(regionDe('dialogAdvice.successUploadTerm')).toHaveAttribute('role', 'status');
      expect(api.postAuth).toHaveBeenCalledTimes(1);
      expect(api.postAuth).toHaveBeenCalledWith('/upload-term', { term: 'nuevo' });
      expect(campo()).toHaveValue('');
      await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    });

    it('si falla da un aviso persistente en la región alert y conserva el texto', async () => {
      api.postAuth.mockRejectedValue(new Error('500'));
      const user = userEvent.setup();
      await renderManager();

      await user.type(campo(), 'nuevo');
      await user.click(botonAnadir());

      await screen.findByText('dialogAdvice.errorUploadTerm');
      expect(regionDe('dialogAdvice.errorUploadTerm')).toHaveAttribute('role', 'alert');
      expect(campo()).toHaveValue('nuevo');
    });

    it('mientras sube, el botón queda con aria-busy y un segundo clic no vuelve a subir', async () => {
      const subida = deferred();
      api.postAuth.mockReturnValue(subida.promise);
      const user = userEvent.setup();
      await renderManager();

      await user.type(campo(), 'nuevo');
      await user.click(botonAnadir());
      await waitFor(() => expect(botonAnadir()).toHaveAttribute('aria-busy', 'true'));
      await user.click(botonAnadir());

      expect(api.postAuth).toHaveBeenCalledTimes(1);
      subida.resolve({});
      await waitFor(() => expect(botonAnadir()).not.toHaveAttribute('aria-busy'));
    });
  });

  describe('borrar', () => {
    const abrirConfirmacion = async (user) => {
      await user.click(screen.getAllByRole('button', { name: `${NS}.deleteTerm` })[0]);
      return screen.findByRole('dialog');
    };

    it('pide confirmación con el nombre y Cancelar no borra', async () => {
      const user = userEvent.setup();
      await renderManager();

      const dialogo = await abrirConfirmacion(user);
      expect(dialogo).toHaveTextContent('dialogAdvice.confirmDeleteTerm');
      await user.click(screen.getByRole('button', { name: 'dialogAdvice.cancelButton' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(api.deleteAuth).not.toHaveBeenCalled();
    });

    it('Confirmar borra una sola vez, avisa en status, recarga y lleva el foco al título de la sección', async () => {
      const user = userEvent.setup();
      await renderManager();

      await abrirConfirmacion(user);
      await user.click(screen.getByRole('button', { name: 'dialogAdvice.deleteButton' }));

      await screen.findByText('dialogAdvice.successDeleteTerm');
      expect(regionDe('dialogAdvice.successDeleteTerm')).toHaveAttribute('role', 'status');
      expect(api.deleteAuth).toHaveBeenCalledTimes(1);
      expect(api.deleteAuth).toHaveBeenCalledWith('/delete-term', { term: 'subsp.' });
      await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: `${NS}.noLatinTermsTitle` })).toHaveFocus()
      );
    });

    it('si borrar falla da un aviso persistente en alert', async () => {
      api.deleteAuth.mockRejectedValue(new Error('500'));
      const user = userEvent.setup();
      await renderManager();

      await abrirConfirmacion(user);
      await user.click(screen.getByRole('button', { name: 'dialogAdvice.deleteButton' }));

      await screen.findByText('dialogAdvice.errorDeleteTerm');
      expect(regionDe('dialogAdvice.errorDeleteTerm')).toHaveAttribute('role', 'alert');
    });

    it('si borrar falla, el foco no queda en body sino en el título de la sección', async () => {
      api.deleteAuth.mockRejectedValue(new Error('500'));
      const user = userEvent.setup();
      await renderManager();

      await abrirConfirmacion(user);
      await user.click(screen.getByRole('button', { name: 'dialogAdvice.deleteButton' }));

      await screen.findByText('dialogAdvice.errorDeleteTerm');
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: `${NS}.noLatinTermsTitle` })).toHaveFocus()
      );
      expect(document.body).not.toHaveFocus();
    });
  });

  describe('lista', () => {
    it('vacía explica qué hacer', async () => {
      api.get.mockResolvedValue([]);
      render(
        <ToastProvider>
          <TermsManager />
        </ToastProvider>
      );

      expect(await screen.findByText(`${NS}.noTermsFoundPlaceholder`)).toBeInTheDocument();
      expect(screen.queryByRole('list', { name: `${NS}.termsListLabel` })).not.toBeInTheDocument();
    });

    it('si la carga falla muestra el error en línea con «Reintentar», que vuelve a pedir la lista', async () => {
      api.get.mockRejectedValueOnce(new Error('500'));
      const user = userEvent.setup();
      render(
        <ToastProvider>
          <TermsManager />
        </ToastProvider>
      );

      const mensaje = await screen.findByText('dialogAdvice.errorLoadData');
      expect(mensaje.closest('p')).toHaveAttribute('role', 'alert');
      await user.click(screen.getByRole('button', { name: 'feedback.retry' }));

      expect(await screen.findByText('subsp.')).toBeInTheDocument();
      expect(screen.queryByText('dialogAdvice.errorLoadData')).not.toBeInTheDocument();
    });
  });
});
