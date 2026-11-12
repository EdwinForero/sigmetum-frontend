import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactRecipientsManager from './ContactRecipientsManager';
import ToastProvider from './ToastProvider';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { getAuth: vi.fn(), postAuth: vi.fn(), deleteAuth: vi.fn() },
}));

// El simulacro global devuelve solo la clave: aquí también se ven los parámetros ({{name}}, {{count}}, {{max}}).
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => (options ? `${key} ${JSON.stringify(options)}` : key),
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

const NS = 'contactRecipients';
const FIVE = ['a@x.es', 'b@x.es', 'c@x.es', 'd@x.es', 'e@x.es'].map((email) => ({ email }));
const LIST = [{ email: 'ana@x.es' }, { email: 'Luis@x.es' }];

const campo = () => screen.getByLabelText(`${NS}.label`);
const botonAnadir = () => screen.getByRole('button', { name: `${NS}.add` });
const quitar = (email) => screen.getByRole('button', { name: `${NS}.removeRecipient ${JSON.stringify({ name: email })}` });
const titulo = () => screen.getByRole('heading', { name: `${NS}.title` });
const regionDe = (texto) => screen.getByText(texto).closest('[role=alert],[role=status]');
const httpFailure = (status) => Object.assign(new Error(String(status)), { status });

const deferred = () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

const renderManager = async (list = LIST) => {
  api.getAuth.mockResolvedValue(list);
  render(
    <ToastProvider>
      <ContactRecipientsManager />
    </ToastProvider>
  );
  if (list.length > 0) await screen.findByText(list[0].email);
  else await screen.findByText(`${NS}.empty`);
};

describe('ContactRecipientsManager', () => {
  beforeEach(() => {
    api.getAuth.mockReset();
    api.postAuth.mockReset().mockResolvedValue('Recipient added successfully');
    api.deleteAuth.mockReset().mockResolvedValue('Recipient deleted successfully');
  });

  describe('estructura y carga', () => {
    it('es una región con nombre, tiene un único h2 enfocable y pide la lista con la sesión', async () => {
      await renderManager();

      expect(screen.getByRole('region', { name: `${NS}.title` })).toBeInTheDocument();
      const h2 = screen.getAllByRole('heading', { level: 2 });
      expect(h2).toHaveLength(1);
      expect(h2[0]).toHaveAttribute('tabindex', '-1');
      expect(h2[0]).toHaveClass('focus-heading');
      expect(api.getAuth).toHaveBeenCalledTimes(1);
      expect(api.getAuth).toHaveBeenCalledWith('/list-recipients');
    });

    it('mientras carga, la región de estado está montada y dice «cargando»; después queda vacía', async () => {
      const carga = deferred();
      api.getAuth.mockReturnValue(carga.promise);
      render(
        <ToastProvider>
          <ContactRecipientsManager />
        </ToastProvider>
      );

      const estado = screen.getByText(`${NS}.loading`).closest('[role=status]');
      expect(estado).toBeInTheDocument();
      carga.resolve(LIST);
      await screen.findByText('ana@x.es');

      expect(screen.queryByText(`${NS}.loading`)).not.toBeInTheDocument();
      expect(estado).toBeInTheDocument();
    });

    it('pinta la lista en el orden del servidor, con nombre accesible, y el contador «N de máximo»', async () => {
      await renderManager([{ email: 'zeta@x.es' }, { email: 'alfa@x.es' }]);

      const lista = screen.getByRole('list', { name: `${NS}.listLabel` });
      expect(within(lista).getAllByRole('listitem').map((li) => li.firstChild.textContent)).toEqual(['zeta@x.es', 'alfa@x.es']);
      expect(screen.getByText(`${NS}.counter ${JSON.stringify({ count: 2, max: 5 })}`)).toHaveClass('text-sm', 'text-moss');
    });

    it('el correo se pinta como texto (no se interpreta) y se parte si es largo', async () => {
      await renderManager([{ email: '<b>x</b>@x.es' }, { email: 'b@x.es' }]);

      const texto = screen.getByText('<b>x</b>@x.es');
      expect(texto).toHaveClass('min-w-0', 'break-all');
      expect(texto.querySelector('b')).toBeNull();
    });

    it('las filas miden al menos 48 px y la «x» es de 48×48 con nombre que incluye el correo', async () => {
      await renderManager();

      screen.getAllByRole('listitem').forEach((li) => expect(li).toHaveClass('min-h-12'));
      const equis = quitar('ana@x.es');
      expect(equis).toHaveClass('h-12', 'w-12', 'focus-ring');
      expect(equis).not.toHaveAttribute('aria-disabled');
    });

    it('la «x» no se encoge con un correo largo (shrink-0)', async () => {
      await renderManager([{ email: `${'a'.repeat(80)}@x.es` }, { email: 'b@x.es' }]);

      expect(quitar(`${'a'.repeat(80)}@x.es`)).toHaveClass('shrink-0');
    });

    it('sin destinatarios explica que se usa la dirección por defecto, sin lista y con contador a 0', async () => {
      await renderManager([]);

      expect(screen.getByText(`${NS}.empty`)).toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
      expect(screen.getByText(`${NS}.counter ${JSON.stringify({ count: 0, max: 5 })}`)).toBeInTheDocument();
    });

    it.each([[500], [404]])('si la carga falla con %i muestra el error de carga con «Reintentar», que vuelve a pedir la lista', async (status) => {
      api.getAuth.mockRejectedValueOnce(httpFailure(status));
      api.getAuth.mockResolvedValue(LIST);
      const user = userEvent.setup();
      render(
        <ToastProvider>
          <ContactRecipientsManager />
        </ToastProvider>
      );

      const mensaje = await screen.findByText(`${NS}.errorLoad`);
      expect(mensaje.closest('p')).toHaveAttribute('role', 'alert');
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
      expect(screen.queryByText(new RegExp(`^${NS}.counter`))).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'feedback.retry' }));

      expect(await screen.findByText('ana@x.es')).toBeInTheDocument();
      expect(screen.queryByText(`${NS}.errorLoad`)).not.toBeInTheDocument();
      expect(api.getAuth).toHaveBeenCalledTimes(2);
    });

    it('una respuesta que no es una lista se trata como error de carga, no como lista vacía', async () => {
      api.getAuth.mockResolvedValue('Recipient list');
      render(
        <ToastProvider>
          <ContactRecipientsManager />
        </ToastProvider>
      );

      expect(await screen.findByText(`${NS}.errorLoad`)).toBeInTheDocument();
      expect(screen.queryByText(`${NS}.empty`)).not.toBeInTheDocument();
    });
  });

  describe('añadir: validación en el cliente', () => {
    it('el campo es de tipo correo, con 254 como máximo, etiqueta visible y fila que envuelve', async () => {
      await renderManager();

      expect(campo()).toHaveAttribute('type', 'email');
      expect(campo()).toHaveAttribute('maxlength', '254');
      expect(screen.getByText(`${NS}.label`).tagName).toBe('LABEL');
      expect(campo().closest('.flex.flex-wrap.gap-stack')).toContainElement(botonAnadir());
    });

    it.each([
      ['vacío', '', 'form.errors.required'],
      ['solo espacios', '   ', 'form.errors.required'],
      ['con formato no válido', 'sin-arroba', 'form.errors.email'],
      ['duplicado con otras mayúsculas y espacios', '  ANA@x.es ', `${NS}.errors.duplicate`],
    ])('con un correo %s da el error en el campo, le da el foco y no llama a la API ni abre diálogo ni toast', async (_caso, texto, clave) => {
      const user = userEvent.setup();
      await renderManager();

      if (texto) await user.type(campo(), texto);
      await user.click(botonAnadir());

      const mensaje = await screen.findByText(clave);
      const error = mensaje.closest('p');
      expect(error).toHaveAttribute('role', 'alert');
      expect(campo()).toHaveAttribute('aria-invalid', 'true');
      expect(campo()).toHaveAttribute('aria-describedby', error.id);
      expect(campo()).toHaveFocus();
      expect(api.postAuth).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText(`${NS}.errorAdd`)).not.toBeInTheDocument();
    });

    it('el error se limpia al escribir', async () => {
      const user = userEvent.setup();
      await renderManager();
      await user.click(botonAnadir());
      await screen.findByText('form.errors.required');

      await user.type(campo(), 'n');

      expect(screen.queryByText('form.errors.required')).not.toBeInTheDocument();
      expect(campo()).not.toHaveAttribute('aria-invalid');
      expect(campo()).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('añadir: envío', () => {
    it('con éxito envía el correo recortado, avisa en status, vacía el campo y recarga la lista', async () => {
      const user = userEvent.setup();
      await renderManager();

      await user.type(campo(), ' nuevo@x.es ');
      await user.click(botonAnadir());

      await screen.findByText(`${NS}.successAdded`);
      expect(regionDe(`${NS}.successAdded`)).toHaveAttribute('role', 'status');
      expect(api.postAuth).toHaveBeenCalledTimes(1);
      expect(api.postAuth).toHaveBeenCalledWith('/add-recipient', { email: 'nuevo@x.es' });
      expect(campo()).toHaveValue('');
      await waitFor(() => expect(api.getAuth).toHaveBeenCalledTimes(2));
    });

    it.each([[429], [400], [500]])('si el servidor responde %i da un aviso persistente en alert y conserva lo escrito', async (status) => {
      api.postAuth.mockRejectedValue(httpFailure(status));
      const user = userEvent.setup();
      await renderManager();

      await user.type(campo(), 'nuevo@x.es');
      await user.click(botonAnadir());

      await screen.findByText(`${NS}.errorAdd`);
      expect(regionDe(`${NS}.errorAdd`)).toHaveAttribute('role', 'alert');
      expect(campo()).toHaveValue('nuevo@x.es');
      expect(api.getAuth).toHaveBeenCalledTimes(1);
    });

    it('mientras envía, el botón queda con aria-busy y un segundo clic no vuelve a enviar', async () => {
      const envio = deferred();
      api.postAuth.mockReturnValue(envio.promise);
      const user = userEvent.setup();
      await renderManager();

      await user.type(campo(), 'nuevo@x.es');
      await user.click(botonAnadir());
      await waitFor(() => expect(botonAnadir()).toHaveAttribute('aria-busy', 'true'));
      await user.click(botonAnadir());

      expect(api.postAuth).toHaveBeenCalledTimes(1);
      envio.resolve('ok');
      await waitFor(() => expect(botonAnadir()).not.toHaveAttribute('aria-busy'));
    });

    it('con 4 destinatarios todavía se puede añadir', async () => {
      const user = userEvent.setup();
      await renderManager(FIVE.slice(0, 4));

      expect(botonAnadir()).not.toHaveAttribute('aria-disabled');
      expect(screen.queryByText(`${NS}.maxReached ${JSON.stringify({ max: 5 })}`)).not.toBeInTheDocument();
      await user.type(campo(), 'f@x.es');
      await user.click(botonAnadir());

      await waitFor(() => expect(api.postAuth).toHaveBeenCalledWith('/add-recipient', { email: 'f@x.es' }));
    });

    it('con 5 «Añadir» es inactivo (aria-disabled, no disabled), recibe el foco con Tab, se explica con texto visible y no llama a la API', async () => {
      const user = userEvent.setup();
      await renderManager(FIVE);
      const texto = `${NS}.maxReached ${JSON.stringify({ max: 5 })}`;

      await user.type(campo(), 'f@x.es');
      await user.tab();

      expect(botonAnadir()).toHaveFocus();
      expect(botonAnadir()).toHaveAttribute('aria-disabled', 'true');
      expect(botonAnadir()).not.toBeDisabled();
      expect(botonAnadir()).toHaveAccessibleDescription(texto);
      expect(screen.getByText(texto)).toBeVisible();
      expect(screen.getByText(texto)).toHaveClass('text-sm', 'text-moss');
      await user.click(botonAnadir());
      await user.keyboard('{Enter}');
      expect(api.postAuth).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('quitar', () => {
    const abrirConfirmacion = async (user, email = 'ana@x.es') => {
      await user.click(quitar(email));
      return screen.findByRole('dialog');
    };

    it('pide confirmación con aviso de advertencia y el correo en negrita; Cancelar no llama a la API', async () => {
      const user = userEvent.setup();
      await renderManager();

      const dialogo = await abrirConfirmacion(user);

      expect(within(dialogo).getByText('warning')).toHaveClass('text-warning');
      expect(within(dialogo).getByText('ana@x.es').tagName).toBe('STRONG');
      expect(within(dialogo).getByText('ana@x.es')).toHaveClass('font-bold');
      expect(dialogo).toHaveTextContent(`${NS}.confirmDelete`);
      await user.click(screen.getByRole('button', { name: 'dialogAdvice.cancelButton' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(api.deleteAuth).not.toHaveBeenCalled();
    });

    it('Escape cierra el diálogo sin llamar a la API', async () => {
      const user = userEvent.setup();
      await renderManager();

      await abrirConfirmacion(user);
      await user.keyboard('{Escape}');

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(api.deleteAuth).not.toHaveBeenCalled();
    });

    it('Confirmar borra una sola vez con el correo de esa fila, avisa en status, recarga y lleva el foco al título', async () => {
      const user = userEvent.setup();
      await renderManager();

      await abrirConfirmacion(user, 'Luis@x.es');
      await user.click(screen.getByRole('button', { name: 'dialogAdvice.deleteButton' }));

      await screen.findByText(`${NS}.successRemoved`);
      expect(regionDe(`${NS}.successRemoved`)).toHaveAttribute('role', 'status');
      expect(api.deleteAuth).toHaveBeenCalledTimes(1);
      expect(api.deleteAuth).toHaveBeenCalledWith('/delete-recipient', { email: 'Luis@x.es' });
      await waitFor(() => expect(api.getAuth).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(titulo()).toHaveFocus());
    });

    it('confirmar dos veces seguidas antes de que resuelva el borrado llama a la API una sola vez', async () => {
      const borrado = deferred();
      api.deleteAuth.mockReturnValue(borrado.promise);
      const user = userEvent.setup();
      await renderManager();

      await abrirConfirmacion(user, 'Luis@x.es');
      const confirmar = screen.getByRole('button', { name: 'dialogAdvice.deleteButton' });
      fireEvent.click(confirmar);
      fireEvent.click(confirmar);
      borrado.resolve('Recipient deleted successfully');

      expect(await screen.findAllByText(`${NS}.successRemoved`)).toHaveLength(1);
      expect(api.deleteAuth).toHaveBeenCalledTimes(1);
    });

    it.each([[404], [400], [500]])('si borrar falla con %i avisa en alert y el foco va al título, no a body', async (status) => {
      api.deleteAuth.mockRejectedValue(httpFailure(status));
      const user = userEvent.setup();
      await renderManager();

      await abrirConfirmacion(user);
      await user.click(screen.getByRole('button', { name: 'dialogAdvice.deleteButton' }));

      await screen.findByText(`${NS}.errorRemove`);
      expect(regionDe(`${NS}.errorRemove`)).toHaveAttribute('role', 'alert');
      await waitFor(() => expect(titulo()).toHaveFocus());
      expect(document.body).not.toHaveFocus();
    });

    it('con un solo destinatario la «x» es inactiva (aria-disabled, no disabled), se alcanza con Tab, se explica con texto visible y no abre el diálogo', async () => {
      const user = userEvent.setup();
      await renderManager([{ email: 'solo@x.es' }]);
      const equis = quitar('solo@x.es');

      for (let i = 0; i < 6 && document.activeElement !== equis; i += 1) await user.tab();

      expect(equis).toHaveFocus();
      expect(equis).toHaveAttribute('aria-disabled', 'true');
      expect(equis).not.toBeDisabled();
      expect(equis).toHaveClass('border-dashed', 'border-moss', 'h-12', 'w-12');
      expect(equis).toHaveAccessibleDescription(`${NS}.lastRecipient`);
      expect(screen.getByText(`${NS}.lastRecipient`)).toBeVisible();
      await user.click(equis);
      await user.keyboard('{Enter}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(api.deleteAuth).not.toHaveBeenCalled();
    });

    it('con dos destinatarios ninguna «x» es inactiva y no aparece el texto de «último»', async () => {
      await renderManager();

      expect(quitar('ana@x.es')).not.toHaveAttribute('aria-disabled');
      expect(quitar('Luis@x.es')).not.toHaveAttribute('aria-describedby');
      expect(screen.queryByText(`${NS}.lastRecipient`)).not.toBeInTheDocument();
    });
  });
});
