import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataManagement from './DataManagement';
import ToastProvider from '../components/ToastProvider';
import api from '../services/api';

vi.mock('../services/api', () => ({ default: { get: vi.fn(), postAuth: vi.fn() } }));
// Este test comprueba el nombre de la versión en la confirmación: el `t` simulado devuelve la clave con sus valores.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => (options && typeof options === 'object' ? `${key} ${JSON.stringify(options)}` : key),
    i18n: { language: 'es', changeLanguage: () => {} },
  }),
  Trans: ({ i18nKey }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

const KEY = 'Almería/2026-11-10_v1.xlsx';
const NAME = 'Almería 10/11/2026 · V1';
const FILES = { Almería: [{ key: KEY, name: '2026-11-10_v1.xlsx' }] };
const NS = 'dataManagement';
const DELETE_NAME = `${NS}.deleteVersionNamed {"name":"${NAME}"}`;

const listCalls = () => api.get.mock.calls.filter(([path]) => path === '/list-files').length;
const regionOf = (text) => screen.queryByText(text)?.closest('[role=status],[role=alert]') ?? null;

const deferred = () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe('DataManagement', () => {
  let onFileDropdownSelect;
  let container;

  const renderPage = async (filteredSpecies = [{ especie: 'a' }]) => {
    await act(async () => {
      ({ container } = render(
        <MemoryRouter>
          <ToastProvider>
            <DataManagement onFileDropdownSelect={onFileDropdownSelect} filteredSpecies={filteredSpecies} />
          </ToastProvider>
        </MemoryRouter>
      ));
    });
  };

  const combobox = () => screen.getByRole('combobox', { name: `${NS}.fileSelectDropdwon.selectFileDropdownLabel` });

  const chooseVersion = async (user) => {
    await user.selectOptions(combobox(), KEY);
    await screen.findByRole('button', { name: DELETE_NAME });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    onFileDropdownSelect = vi.fn();
    api.get.mockImplementation(async (path) => (path === '/list-files' ? FILES : [{ especie: 'a' }]));
    api.postAuth.mockResolvedValue({});
  });

  it('tiene un único h1 con el título y el selector con la etiqueta visible', async () => {
    await renderPage();

    const h1 = screen.getAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent(`${NS}.title`);
    expect(h1[0]).toHaveClass('focus-heading');
    expect(h1[0]).toHaveAttribute('tabindex', '-1');
    expect(screen.getByText(`${NS}.description`)).toBeInTheDocument();
    expect(combobox().tagName).toBe('SELECT');
  });

  it('sin versión elegida no hay botones de acción', async () => {
    await renderPage();

    expect(screen.queryByText(`${NS}.deleteVersionButton`)).not.toBeInTheDocument();
  });

  it('al elegir una versión pasa los datos a la página y muestra los tres botones de acción', async () => {
    const user = userEvent.setup();
    await renderPage();
    await chooseVersion(user);

    expect(onFileDropdownSelect).toHaveBeenCalledWith([{ especie: 'a' }]);
    expect(screen.getByText(`${NS}.downloadExcelButton`)).toBeInTheDocument();
    expect(screen.getByText(`${NS}.updateDataButton`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: DELETE_NAME })).toHaveTextContent(`${NS}.deleteVersionButton`);
  });

  it('«Actualizar datos» usa su propio tooltip y «Descargar Excel» el suyo', async () => {
    const user = userEvent.setup();
    await renderPage();
    await chooseVersion(user);

    expect(screen.getAllByText(`${NS}.updateDataButtonTooltip`)).toHaveLength(1);
    expect(screen.getAllByText(`${NS}.downloadExcelButtonTooltip`)).toHaveLength(1);
  });

  it('mientras carga la versión se ve el texto en línea, sin superposición ni min-h-screen', async () => {
    const user = userEvent.setup();
    const datos = deferred();
    api.get.mockImplementation((path) => (path === '/list-files' ? Promise.resolve(FILES) : datos.promise));
    await renderPage();

    await user.selectOptions(combobox(), KEY);

    expect(await screen.findByText(`${NS}.loadingVersionData`)).toBeInTheDocument();
    expect(container.querySelector('.min-h-screen, .inset-0')).toBeNull();

    await act(async () => datos.resolve([{ especie: 'a' }]));
    expect(screen.queryByText(`${NS}.loadingVersionData`)).not.toBeInTheDocument();
  });

  it('la tabla va en una región con nombre alcanzable con teclado y la página no usa anchos mínimos ni overflow-hidden', async () => {
    const user = userEvent.setup();
    await renderPage([{ especie: 'a', familia: 'b' }]);
    await chooseVersion(user);

    const region = screen.getByRole('region', { name: `${NS}.table.regionLabel` });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(within(region).getByRole('table')).toBeInTheDocument();
    expect(container.querySelector('.min-w-72, .min-h-screen, .max-w-screen, .overflow-hidden')).toBeNull();
    expect(container.querySelector('.text-justify')).toBeNull();
  });

  it('usa el mismo contenedor que las otras páginas privadas', async () => {
    await renderPage();

    expect(container.firstChild).toHaveClass('mx-auto', 'w-full', 'max-w-6xl', 'px-4', 'sm:px-5', 'pb-6');
  });

  it('sin versiones se ve el vacío, no la tabla ni su placeholder', async () => {
    api.get.mockImplementation(async () => ({}));
    await renderPage([]);

    expect(screen.getByRole('link', { name: `${NS}.fileSelectDropdwon.emptyStateLink` })).toBeInTheDocument();
    expect(screen.queryByText(`${NS}.table.noDataFoundPlaceholder`)).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: `${NS}.table.regionLabel` })).not.toBeInTheDocument();
  });

  it('con un fallo de la lista se ve el error y «Reintentar», no el vacío ni la tabla', async () => {
    api.get.mockRejectedValue(new Error('500'));
    await renderPage([]);

    expect(screen.getByText('dialogAdvice.errorLoadData')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'feedback.retry' })).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`${NS}.fileSelectDropdwon.emptyState`))).not.toBeInTheDocument();
    expect(screen.queryByText(`${NS}.table.noDataFoundPlaceholder`)).not.toBeInTheDocument();
  });

  it('cada botón «i» se llama por el título o la etiqueta que tiene al lado', async () => {
    const user = userEvent.setup();
    await renderPage();
    await chooseVersion(user);

    const nombre = (topic) => `iconButton.infoAbout {"topic":"${topic}"}`;
    [
      `${NS}.fileSelectDropdwon.selectFileDropdownLabel`,
      `${NS}.downloadExcelButton`,
      `${NS}.deleteVersionButton`,
      `${NS}.updateDataButton`,
    ].forEach((topic) => expect(screen.getByRole('button', { name: nombre(topic) })).toBeInTheDocument());
  });

  describe('eliminar versión', () => {
    it('la confirmación sale con el icono de advertencia, no el de información', async () => {
      const user = userEvent.setup();
      await renderPage();
      await chooseVersion(user);

      await user.click(screen.getByRole('button', { name: DELETE_NAME }));

      const dialog = screen.getByRole('dialog', { name: 'dialogAdvice.confirmDeleteTitle' });
      expect(within(dialog).getByText('warning')).toHaveClass('text-warning');
      expect(within(dialog).queryByText('info')).toBeNull();
    });

    it('pide confirmación con el nombre de la versión y Cancelar no llama a /delete-file', async () => {
      const user = userEvent.setup();
      await renderPage();
      await chooseVersion(user);

      await user.click(screen.getByRole('button', { name: DELETE_NAME }));

      const dialog = screen.getByRole('dialog', { name: 'dialogAdvice.confirmDeleteTitle' });
      expect(dialog).toHaveTextContent(`dialogAdvice.confirmDeleteVersion {"name":"${NAME}"}`);
      expect(within(dialog).getByRole('button', { name: 'dialogAdvice.deleteButton' })).toBeInTheDocument();

      await user.click(within(dialog).getByRole('button', { name: 'dialogAdvice.cancelButton' }));

      expect(api.postAuth).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('Escape cierra la confirmación sin borrar', async () => {
      const user = userEvent.setup();
      await renderPage();
      await chooseVersion(user);
      await user.click(screen.getByRole('button', { name: DELETE_NAME }));

      await user.keyboard('{Escape}');

      expect(api.postAuth).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('Confirmar llama una vez a /delete-file, avisa en status, recarga la lista y limpia la página', async () => {
      const user = userEvent.setup();
      await renderPage();
      await chooseVersion(user);
      const antes = listCalls();

      await user.click(screen.getByRole('button', { name: DELETE_NAME }));
      await user.click(screen.getByRole('button', { name: 'dialogAdvice.deleteButton' }));

      await screen.findByText('dialogAdvice.successDeleteMessage');
      expect(regionOf('dialogAdvice.successDeleteMessage')).toHaveAttribute('role', 'status');
      expect(api.postAuth).toHaveBeenCalledTimes(1);
      expect(api.postAuth).toHaveBeenCalledWith('/delete-file', { fileName: KEY });
      await waitFor(() => expect(listCalls()).toBe(antes + 1));
      expect(onFileDropdownSelect).toHaveBeenLastCalledWith([]);
      expect(screen.queryByRole('button', { name: DELETE_NAME })).not.toBeInTheDocument();
      expect(screen.queryByText('dialogAdvice.errorDeleteMessage')).not.toBeInTheDocument();
    });

    it('tras borrar con éxito, el foco va al h1 y no se pierde en body', async () => {
      const user = userEvent.setup();
      await renderPage();
      await chooseVersion(user);

      await user.click(screen.getByRole('button', { name: DELETE_NAME }));
      await user.click(screen.getByRole('button', { name: 'dialogAdvice.deleteButton' }));
      await screen.findByText('dialogAdvice.successDeleteMessage');

      await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
    });

    it('si borrar falla, da un alert con errorDeleteMessage, no recarga y el foco vuelve al botón', async () => {
      const user = userEvent.setup();
      await renderPage();
      await chooseVersion(user);
      const antes = listCalls();
      api.postAuth.mockRejectedValue(new Error('500'));

      await user.click(screen.getByRole('button', { name: DELETE_NAME }));
      await user.click(screen.getByRole('button', { name: 'dialogAdvice.deleteButton' }));

      await screen.findByText('dialogAdvice.errorDeleteMessage');
      expect(regionOf('dialogAdvice.errorDeleteMessage')).toHaveAttribute('role', 'alert');
      expect(listCalls()).toBe(antes);
      expect(screen.queryByText('dialogAdvice.successDeleteMessage')).not.toBeInTheDocument();
      await waitFor(() => expect(screen.getByRole('button', { name: DELETE_NAME })).toHaveFocus());
    });
  });

  describe('actualizar datos', () => {
    it('llama a /update-file con la clave, recarga la lista y avisa en status', async () => {
      const user = userEvent.setup();
      await renderPage();
      await chooseVersion(user);
      const antes = listCalls();

      await user.click(screen.getByRole('button', { name: `${NS}.updateDataButton` }));

      await screen.findByText('dialogAdvice.successUpdateMessage');
      expect(regionOf('dialogAdvice.successUpdateMessage')).toHaveAttribute('role', 'status');
      expect(api.postAuth).toHaveBeenCalledWith('/update-file', { fileName: KEY });
      await waitFor(() => expect(listCalls()).toBe(antes + 1));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('si falla, da un alert con errorUpdateMessage', async () => {
      const user = userEvent.setup();
      await renderPage();
      await chooseVersion(user);
      api.postAuth.mockRejectedValue(new Error('500'));

      await user.click(screen.getByRole('button', { name: `${NS}.updateDataButton` }));

      await screen.findByText('dialogAdvice.errorUpdateMessage');
      expect(regionOf('dialogAdvice.errorUpdateMessage')).toHaveAttribute('role', 'alert');
      expect(screen.queryByText('dialogAdvice.successUpdateMessage')).not.toBeInTheDocument();
    });

    it('mientras dura, el botón queda con aria-busy y un segundo clic no repite la petición', async () => {
      const user = userEvent.setup();
      const respuesta = deferred();
      await renderPage();
      await chooseVersion(user);
      api.postAuth.mockReturnValue(respuesta.promise);
      const boton = screen.getByRole('button', { name: `${NS}.updateDataButton` });

      await user.click(boton);
      await user.click(boton);

      expect(boton).toHaveAttribute('aria-busy', 'true');
      expect(api.postAuth).toHaveBeenCalledTimes(1);
      await act(async () => respuesta.resolve({}));
      await waitFor(() => expect(boton).not.toHaveAttribute('aria-busy'));
    });
  });

  describe('bloqueo cruzado entre selector y acciones', () => {
    it('mientras carga otra versión, descargar, eliminar y actualizar quedan deshabilitados', async () => {
      const user = userEvent.setup();
      const datos = deferred();
      const OTRA = 'Almería/2026-11-11_v2.xlsx';
      api.get.mockImplementation((path) =>
        path === '/list-files'
          ? Promise.resolve({ Almería: [...FILES.Almería, { key: OTRA, name: '2026-11-11_v2.xlsx' }] })
          : path.endsWith(OTRA)
            ? datos.promise
            : Promise.resolve([{ especie: 'a' }])
      );
      await renderPage();
      await chooseVersion(user);

      await user.selectOptions(combobox(), OTRA);

      expect(screen.getByRole('button', { name: DELETE_NAME })).toBeDisabled();
      expect(screen.getByRole('button', { name: `${NS}.updateDataButton` })).toBeDisabled();
      expect(screen.getByRole('button', { name: `${NS}.downloadExcelButton` })).toBeDisabled();

      await act(async () => datos.resolve([{ especie: 'b' }]));
    });

    it('mientras se actualiza o se borra una versión, el selector queda deshabilitado', async () => {
      const user = userEvent.setup();
      const respuesta = deferred();
      await renderPage();
      await chooseVersion(user);
      api.postAuth.mockReturnValue(respuesta.promise);

      await user.click(screen.getByRole('button', { name: `${NS}.updateDataButton` }));

      expect(combobox()).toBeDisabled();
      await act(async () => respuesta.resolve({}));
      await waitFor(() => expect(combobox()).not.toBeDisabled());
    });
  });
});
