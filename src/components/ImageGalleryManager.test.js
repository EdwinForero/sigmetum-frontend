import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageGalleryManager from './ImageGalleryManager';
import ToastProvider from './ToastProvider';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), postFormAuth: vi.fn(), deleteAuth: vi.fn() },
}));

const NS = 'contentManagement';
const campoTitulo = () => screen.getByLabelText(`${NS}.galleryManagementPlaceholder`);
const botonSeleccionar = () => screen.getByRole('button', { name: `${NS}.selectImageButton` });
const botonAnadir = () => screen.getByRole('button', { name: `${NS}.addImageButton` });
// Las regiones role=status y role=alert del ToastProvider están siempre montadas: se busca por texto y se sube a su región.
const regionDe = (texto) => screen.getByText(texto).closest('[role=alert],[role=status]');

const renderManager = async () => {
  const user = userEvent.setup();
  const { container } = render(
    <ToastProvider>
      <ImageGalleryManager />
    </ToastProvider>
  );
  await waitFor(() => expect(api.get).toHaveBeenCalled());
  return { user, container };
};

const setup = async ({ title, withFile = true }) => {
  const { user, container } = await renderManager();
  if (title) fireEvent.change(campoTitulo(), { target: { value: title } });
  if (withFile) {
    const file = new File(['x'], 'foto.png', { type: 'image/png' });
    await user.upload(container.querySelector('#imageFileInput'), file);
  }
  await user.click(botonAnadir());
  return { user, container };
};

describe('ImageGalleryManager: validación en línea', () => {
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue([]);
    api.postFormAuth.mockReset().mockResolvedValue({});
    api.deleteAuth.mockReset().mockResolvedValue({});
  });

  it.each([
    ['/', 'a/b'],
    ['\\', 'a\\b'],
    ['..', 'a..b'],
    ['control', 'a\u0001b'],
    [',', 'a,b'],
    ["'", "a'b"],
    [':', 'a:b'],
    ['&', 'a&b'],
    ['#', 'a#b'],
    ['?', 'a?b'],
    ['%', 'a%b'],
    ['"', 'a"b'],
  ])('rechaza el carácter %s sin subir y marca el campo del título', async (_nombre, title) => {
    await setup({ title });

    const mensaje = await screen.findByText('dialogAdvice.adviceInvalidImageTitle');
    expect(mensaje.closest('p')).toHaveAttribute('role', 'alert');
    expect(campoTitulo()).toHaveAttribute('aria-invalid', 'true');
    expect(campoTitulo()).toHaveAttribute('aria-describedby', mensaje.closest('p').id);
    expect(api.postFormAuth).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('el input de archivos oculto queda fuera del orden de tabulación y del árbol de accesibilidad', async () => {
    const { container } = await renderManager();
    const input = container.querySelector('#imageFileInput');

    expect(input).toHaveAttribute('aria-hidden', 'true');
    expect(input).toHaveAttribute('tabindex', '-1');
  });

  it('sin título marca el campo del título, le da el foco y no sube', async () => {
    await setup({ title: '' });

    const mensaje = await screen.findByText(`${NS}.imageTitleRequired`);
    expect(mensaje.closest('p')).toHaveAttribute('role', 'alert');
    expect(campoTitulo()).toHaveAttribute('aria-invalid', 'true');
    expect(campoTitulo()).toHaveFocus();
    expect(api.postFormAuth).not.toHaveBeenCalled();
  });

  it('sin imagen marca el botón «Seleccionar imagen», le da el foco y no sube', async () => {
    await setup({ title: 'Mi foto', withFile: false });

    const mensaje = await screen.findByText(`${NS}.imageFileRequired`);
    expect(mensaje.closest('p')).toHaveAttribute('role', 'alert');
    expect(botonSeleccionar()).toHaveAttribute('aria-invalid', 'true');
    expect(botonSeleccionar()).toHaveAttribute('aria-describedby', mensaje.closest('p').id);
    expect(botonSeleccionar()).toHaveFocus();
    expect(campoTitulo()).not.toHaveAttribute('aria-invalid');
    expect(api.postFormAuth).not.toHaveBeenCalled();
  });

  it('sin título y sin imagen marca primero el título', async () => {
    await setup({ title: '', withFile: false });

    await screen.findByText(`${NS}.imageTitleRequired`);
    expect(screen.queryByText(`${NS}.imageFileRequired`)).not.toBeInTheDocument();
    expect(botonSeleccionar()).not.toHaveAttribute('aria-invalid');
  });

  it('el error del título se limpia al escribir y el de la imagen al elegir una', async () => {
    const { user, container } = await setup({ title: '', withFile: false });
    await screen.findByText(`${NS}.imageTitleRequired`);

    await user.type(campoTitulo(), 'x');
    expect(screen.queryByText(`${NS}.imageTitleRequired`)).not.toBeInTheDocument();
    expect(campoTitulo()).not.toHaveAttribute('aria-invalid');

    await user.click(botonAnadir());
    await screen.findByText(`${NS}.imageFileRequired`);
    await user.upload(container.querySelector('#imageFileInput'), new File(['x'], 'foto.png', { type: 'image/png' }));

    expect(screen.queryByText(`${NS}.imageFileRequired`)).not.toBeInTheDocument();
    expect(botonSeleccionar()).not.toHaveAttribute('aria-invalid');
  });
});

describe('ImageGalleryManager', () => {
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue([]);
    api.postFormAuth.mockReset().mockResolvedValue({});
    api.deleteAuth.mockReset().mockResolvedValue({});
  });

  it('muestra «ninguna imagen seleccionada» y después el nombre del archivo elegido', async () => {
    const { user, container } = await renderManager();
    expect(screen.getByText(`${NS}.noImageSelected`)).toBeInTheDocument();

    await user.upload(container.querySelector('#imageFileInput'), new File(['x'], 'foto.png', { type: 'image/png' }));

    expect(screen.getByText('foto.png')).toBeInTheDocument();
    expect(screen.queryByText(`${NS}.noImageSelected`)).not.toBeInTheDocument();
  });

  it('sube con un título válido y avisa del éxito en la región status', async () => {
    await setup({ title: 'Mi foto 1' });

    await waitFor(() => expect(api.postFormAuth).toHaveBeenCalledTimes(1));
    await screen.findByText('dialogAdvice.successUploadImage');
    expect(regionDe('dialogAdvice.successUploadImage')).toHaveAttribute('role', 'status');
    expect(screen.queryByText('dialogAdvice.adviceInvalidImageTitle')).not.toBeInTheDocument();
    expect(api.postFormAuth.mock.calls[0][0]).toBe('/upload-image');
  });

  it('si la subida falla da un aviso persistente en la región alert', async () => {
    api.postFormAuth.mockRejectedValue(new Error('500'));
    await setup({ title: 'Mi foto 1' });

    await screen.findByText('dialogAdvice.errorUploadImage');
    expect(regionDe('dialogAdvice.errorUploadImage')).toHaveAttribute('role', 'alert');
  });

  describe('lista y borrado', () => {
    beforeEach(() => {
      api.get.mockReset().mockResolvedValue([{ fileName: 'a.png' }, { fileName: 'b.png' }]);
    });

    it('las papeleras de la galería tienen nombre accesible y anillo de foco', async () => {
      await renderManager();

      const papeleras = await screen.findAllByRole('button', { name: `${NS}.deleteImage` });

      expect(papeleras).toHaveLength(2);
      papeleras.forEach((papelera) => expect(papelera).toHaveClass('focus-ring'));
      expect(screen.getByRole('list', { name: `${NS}.imagesListLabel` })).toBeInTheDocument();
    });

    it('borrar pide confirmación: Cancelar no borra y Confirmar borra una sola vez con foco al título', async () => {
      const { user } = await renderManager();
      const abrir = async () => {
        await user.click((await screen.findAllByRole('button', { name: `${NS}.deleteImage` }))[0]);
        await screen.findByRole('dialog');
      };

      await abrir();
      await user.click(screen.getByRole('button', { name: 'dialogAdvice.cancelButton' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(api.deleteAuth).not.toHaveBeenCalled();

      await abrir();
      await user.click(screen.getByRole('button', { name: 'dialogAdvice.deleteButton' }));

      await screen.findByText('dialogAdvice.successDeleteImage');
      expect(regionDe('dialogAdvice.successDeleteImage')).toHaveAttribute('role', 'status');
      expect(api.deleteAuth).toHaveBeenCalledTimes(1);
      expect(api.deleteAuth).toHaveBeenCalledWith('/delete-image', { imageKey: 'a.png' });
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: `${NS}.galleryManagementTitle` })).toHaveFocus()
      );
    });

    it('si borrar falla da un aviso persistente en la región alert', async () => {
      api.deleteAuth.mockRejectedValue(new Error('500'));
      const { user } = await renderManager();

      await user.click((await screen.findAllByRole('button', { name: `${NS}.deleteImage` }))[0]);
      await user.click(await screen.findByRole('button', { name: 'dialogAdvice.deleteButton' }));

      await screen.findByText('dialogAdvice.errorDeleteImage');
      expect(regionDe('dialogAdvice.errorDeleteImage')).toHaveAttribute('role', 'alert');
    });

    it('si borrar falla, el foco no queda en body sino en el título de la sección', async () => {
      api.deleteAuth.mockRejectedValue(new Error('500'));
      const { user } = await renderManager();

      await user.click((await screen.findAllByRole('button', { name: `${NS}.deleteImage` }))[0]);
      await user.click(await screen.findByRole('button', { name: 'dialogAdvice.deleteButton' }));

      await screen.findByText('dialogAdvice.errorDeleteImage');
      await waitFor(() =>
        expect(screen.getByRole('heading', { name: `${NS}.galleryManagementTitle` })).toHaveFocus()
      );
      expect(document.body).not.toHaveFocus();
    });

    it('si la carga falla muestra el error en línea con «Reintentar»', async () => {
      api.get.mockReset().mockRejectedValueOnce(new Error('500')).mockResolvedValue([{ fileName: 'a.png' }]);
      const { user } = await renderManager();

      const mensaje = await screen.findByText('dialogAdvice.errorLoadData');
      expect(mensaje.closest('p')).toHaveAttribute('role', 'alert');
      await user.click(screen.getByRole('button', { name: 'feedback.retry' }));

      expect(await screen.findByText('a.png')).toBeInTheDocument();
    });
  });
});
