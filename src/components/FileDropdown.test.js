import { createRef } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileDropdown from './FileDropdown';
import api from '../services/api';

vi.mock('../services/api', () => ({ default: { get: vi.fn() } }));

const FILES = {
  Almería: [
    { key: 'Almería/2026-11-10_v1.xlsx', name: '2026-11-10_v1.xlsx' },
    { key: 'Almería/2026-11-12_v2.xlsx', name: '2026-11-12_v2.xlsx' },
  ],
  Granada: [{ key: 'Granada/2026-01-02_v1.xlsx', name: '2026-01-02_v1.xlsx' }],
};
const KEY_A = 'Almería/2026-11-10_v1.xlsx';
const KEY_B = 'Granada/2026-01-02_v1.xlsx';
const OPTION_A = 'Almería · 10/11/2026 · V1';
const NS = 'dataManagement.fileSelectDropdwon';

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const alertOf = (text) => screen.queryByText(text)?.closest('[role=alert]') ?? null;

describe('FileDropdown como <select> nativo', () => {
  let onFileSelect;
  let onLoad;

  const renderDropdown = async (props = {}) => {
    const ref = createRef();
    await act(async () => {
      render(
        <MemoryRouter>
          <label htmlFor="dataset">Conjunto de datos</label>
          <FileDropdown
            id="dataset"
            ref={ref}
            onLoad={onLoad}
            onFileSelect={onFileSelect}
            selectedFile={null}
            {...props}
          />
        </MemoryRouter>
      );
    });
    return ref;
  };

  const combobox = () => screen.getByRole('combobox', { name: 'Conjunto de datos' });

  beforeEach(() => {
    vi.clearAllMocks();
    onFileSelect = vi.fn();
    onLoad = vi.fn();
    api.get.mockImplementation(async (path) => {
      if (path === '/list-files') return FILES;
      if (path.startsWith('/get-data/')) return [{ especie: 'a' }];
      throw new Error(`ruta inesperada ${path}`);
    });
  });

  it('es un combobox con el nombre de su etiqueta, la opción vacía y un optgroup por provincia', async () => {
    await renderDropdown();

    const select = combobox();
    expect(select.tagName).toBe('SELECT');
    expect(select).toHaveValue('');
    expect(screen.getByRole('option', { name: `${NS}.emptyOption` })).toHaveValue('');
    const groups = Array.from(select.querySelectorAll('optgroup')).map((group) => group.label);
    expect(groups).toEqual(['Almería', 'Granada']);
  });

  it('cada opción lleva la provincia y la versión con FormatFileName, en el orden del backend', async () => {
    await renderDropdown();

    const names = screen.getAllByRole('option').map((option) => option.textContent);
    expect(names).toEqual([
      `${NS}.emptyOption`,
      'Almería · 10/11/2026 · V1',
      'Almería · 12/11/2026 · V2',
      'Granada · 02/01/2026 · V1',
    ]);
    expect(screen.getByRole('option', { name: OPTION_A })).toHaveValue(KEY_A);
  });

  it('mientras llega la lista muestra el texto de carga y después lo quita', async () => {
    const lista = deferred();
    api.get.mockImplementation((path) => (path === '/list-files' ? lista.promise : Promise.resolve([])));
    await renderDropdown();

    expect(screen.getByText(`${NS}.loading`)).toBeInTheDocument();

    await act(async () => lista.resolve(FILES));

    expect(screen.queryByText(`${NS}.loading`)).not.toBeInTheDocument();
  });

  it('al elegir una versión pide /get-data/<key> y llama a onFileSelect con la etiqueta de la versión', async () => {
    const user = userEvent.setup();
    await renderDropdown();

    await user.selectOptions(combobox(), KEY_A);

    await waitFor(() =>
      expect(onFileSelect).toHaveBeenCalledWith([{ especie: 'a' }], KEY_A, 'Almería 10/11/2026 · V1')
    );
    expect(api.get).toHaveBeenCalledWith(`/get-data/${KEY_A}`);
    expect(onLoad).toHaveBeenNthCalledWith(1, true);
    expect(onLoad).toHaveBeenLastCalledWith(false);
  });

  it('durante la carga de la versión se ve el texto de estado y el selector muestra la elegida', async () => {
    const user = userEvent.setup();
    const datos = deferred();
    api.get.mockImplementation((path) => (path === '/list-files' ? Promise.resolve(FILES) : datos.promise));
    await renderDropdown();

    await user.selectOptions(combobox(), KEY_A);

    expect(await screen.findByText('dataManagement.loadingVersionData')).toBeInTheDocument();
    expect(combobox()).toHaveValue(KEY_A);

    await act(async () => datos.resolve([{ especie: 'a' }]));

    expect(screen.queryByText('dataManagement.loadingVersionData')).not.toBeInTheDocument();
  });

  it('si la carga de la versión falla, vuelve a la opción vacía y avisa en línea con alert', async () => {
    const user = userEvent.setup();
    api.get.mockImplementation(async (path) => {
      if (path === '/list-files') return FILES;
      throw new Error('500');
    });
    await renderDropdown();

    await user.selectOptions(combobox(), KEY_A);

    await screen.findByText('dialogAdvice.errorLoadFile');
    expect(alertOf('dialogAdvice.errorLoadFile')).toBeInTheDocument();
    expect(combobox()).toHaveValue('');
    expect(onFileSelect).toHaveBeenCalledTimes(1);
    expect(onFileSelect).toHaveBeenCalledWith([], null, null);
    expect(onLoad).toHaveBeenLastCalledWith(false);
  });

  it('«Reintentar» repite la petición de la misma clave y quita el error si sale bien', async () => {
    const user = userEvent.setup();
    let fallos = 1;
    api.get.mockImplementation(async (path) => {
      if (path === '/list-files') return FILES;
      if (fallos-- > 0) throw new Error('500');
      return [{ especie: 'a' }];
    });
    await renderDropdown();
    await user.selectOptions(combobox(), KEY_B);
    await screen.findByText('dialogAdvice.errorLoadFile');

    await user.click(screen.getByRole('button', { name: 'feedback.retry' }));

    await waitFor(() =>
      expect(onFileSelect).toHaveBeenLastCalledWith([{ especie: 'a' }], KEY_B, 'Granada 02/01/2026 · V1')
    );
    expect(api.get.mock.calls.filter(([path]) => path === `/get-data/${KEY_B}`)).toHaveLength(2);
    expect(screen.queryByText('dialogAdvice.errorLoadFile')).not.toBeInTheDocument();
  });

  it('descarta la respuesta tardía de una clave anterior (A pedida, B pedida, B llega antes que A)', async () => {
    const user = userEvent.setup();
    const pedidas = { [KEY_A]: deferred(), [KEY_B]: deferred() };
    api.get.mockImplementation((path) =>
      path === '/list-files' ? Promise.resolve(FILES) : pedidas[path.replace('/get-data/', '')].promise
    );
    await renderDropdown();

    await user.selectOptions(combobox(), KEY_A);
    await user.selectOptions(combobox(), KEY_B);
    expect(combobox()).toHaveValue(KEY_B);
    await act(async () => pedidas[KEY_B].resolve([{ especie: 'b' }]));
    await act(async () => pedidas[KEY_A].resolve([{ especie: 'a' }]));

    expect(onFileSelect).toHaveBeenCalledTimes(1);
    expect(onFileSelect).toHaveBeenCalledWith([{ especie: 'b' }], KEY_B, 'Granada 02/01/2026 · V1');
    expect(onLoad).toHaveBeenLastCalledWith(false);
  });

  it('descarta la respuesta de A aunque llegue antes que la de B, y no apaga la carga de B', async () => {
    const user = userEvent.setup();
    const pedidas = { [KEY_A]: deferred(), [KEY_B]: deferred() };
    api.get.mockImplementation((path) =>
      path === '/list-files' ? Promise.resolve(FILES) : pedidas[path.replace('/get-data/', '')].promise
    );
    await renderDropdown();

    await user.selectOptions(combobox(), KEY_A);
    await user.selectOptions(combobox(), KEY_B);
    await act(async () => pedidas[KEY_A].resolve([{ especie: 'a' }]));

    expect(onFileSelect).not.toHaveBeenCalled();
    expect(onLoad).not.toHaveBeenCalledWith(false);
    expect(screen.getByText('dataManagement.loadingVersionData')).toBeInTheDocument();

    await act(async () => pedidas[KEY_B].resolve([{ especie: 'b' }]));

    expect(onFileSelect).toHaveBeenCalledTimes(1);
    expect(onFileSelect).toHaveBeenCalledWith([{ especie: 'b' }], KEY_B, 'Granada 02/01/2026 · V1');
  });

  it('un fallo tardío de una clave anterior no marca error', async () => {
    const user = userEvent.setup();
    const pedidas = { [KEY_A]: deferred(), [KEY_B]: deferred() };
    api.get.mockImplementation((path) =>
      path === '/list-files' ? Promise.resolve(FILES) : pedidas[path.replace('/get-data/', '')].promise
    );
    await renderDropdown();

    await user.selectOptions(combobox(), KEY_A);
    await user.selectOptions(combobox(), KEY_B);
    await act(async () => pedidas[KEY_B].resolve([{ especie: 'b' }]));
    await act(async () => pedidas[KEY_A].reject(new Error('500')));

    expect(screen.queryByText('dialogAdvice.errorLoadFile')).not.toBeInTheDocument();
    expect(onFileSelect).toHaveBeenCalledTimes(1);
  });

  it('elegir la opción vacía limpia la selección sin pedir datos', async () => {
    const user = userEvent.setup();
    await renderDropdown({ selectedFile: KEY_A });
    expect(combobox()).toHaveValue(KEY_A);

    await user.selectOptions(combobox(), '');

    expect(onFileSelect).toHaveBeenCalledWith([], null, null);
    expect(api.get.mock.calls.some(([path]) => path.startsWith('/get-data/'))).toBe(false);
  });

  it('si la lista falla, muestra errorLoadData con alert y «Reintentar» vuelve a pedirla', async () => {
    const user = userEvent.setup();
    api.get.mockRejectedValueOnce(new Error('red'));
    await renderDropdown();

    await screen.findByText('dialogAdvice.errorLoadData');
    expect(alertOf('dialogAdvice.errorLoadData')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'feedback.retry' }));

    await waitFor(() => expect(screen.queryByText('dialogAdvice.errorLoadData')).not.toBeInTheDocument());
    expect(api.get.mock.calls.filter(([path]) => path === '/list-files')).toHaveLength(2);
    expect(screen.getAllByRole('option')).toHaveLength(4);
  });

  it('si no hay versiones, explica qué hacer con un enlace a /cargar-archivos', async () => {
    api.get.mockResolvedValue({});
    await renderDropdown();

    const enlace = screen.getByRole('link', { name: `${NS}.emptyStateLink` });
    expect(enlace).toHaveAttribute('href', '/cargar-archivos');
    expect(enlace.closest('p')).toHaveTextContent(`${NS}.emptyState ${NS}.emptyStateLink`);
  });

  it('con la lista cargada no se muestra el vacío', async () => {
    await renderDropdown();

    expect(screen.queryByRole('link', { name: `${NS}.emptyStateLink` })).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`${NS}.emptyState`))).not.toBeInTheDocument();
  });

  it('el selector se alcanza con Tab', async () => {
    const user = userEvent.setup();
    await renderDropdown();

    await user.tab();

    expect(combobox()).toHaveFocus();
  });

  it('refleja la versión seleccionada que le pasa la página', async () => {
    await renderDropdown({ selectedFile: KEY_B });

    expect(combobox()).toHaveValue(KEY_B);
  });

  it('si la versión seleccionada desaparece de la lista, llama a onFileSelect([], null, null)', async () => {
    await renderDropdown({ selectedFile: 'Almería/2026-11-99_v9.xlsx' });

    await waitFor(() => expect(onFileSelect).toHaveBeenCalledWith([], null, null));
  });

  it('mientras recarga la lista no borra la selección', async () => {
    const ref = await renderDropdown({ selectedFile: KEY_A });
    const lista = deferred();
    api.get.mockImplementation(() => lista.promise);

    let recarga;
    act(() => {
      recarga = ref.current.fetchFiles();
    });
    expect(onFileSelect).not.toHaveBeenCalled();
    await act(async () => {
      lista.resolve(FILES);
      await recarga;
    });

    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('ref.fetchFiles vuelve a pedir la lista', async () => {
    const ref = await renderDropdown();

    await act(async () => {
      await ref.current.fetchFiles();
    });

    expect(api.get.mock.calls.filter(([path]) => path === '/list-files')).toHaveLength(2);
  });
});
