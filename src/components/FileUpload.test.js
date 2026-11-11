import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from './FileUpload';
import ToastProvider from './ToastProvider';

const jsonResponse = (status, body) => ({ ok: status < 400, status, json: async () => body });

const draftResponse = () =>
  jsonResponse(400, {
    success: false,
    error: 'Some rows have empty fields.',
    data: { emptyFields: [{ rowIndex: 3 }], draftKey: 'Malaga/Malaga_V1_01_01_2026.xlsx' },
  });

const confirmCalls = (fetchMock) =>
  fetchMock.mock.calls
    .filter(([url]) => url.endsWith('/upload/confirm'))
    .map(([, options]) => JSON.parse(options.body));

const uploadCalls = (fetchMock) => fetchMock.mock.calls.filter(([url]) => url.endsWith('/upload'));

const deferred = () => {
  let resolve;
  const promise = new Promise((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

// Las regiones role=status y role=alert del ToastProvider están siempre montadas: se busca por texto y se sube a su región.
const regionDe = (texto) => screen.getByText(texto).closest('[role=alert],[role=status]');

const renderUpload = () =>
  render(
    <ToastProvider>
      <FileUpload />
    </ToastProvider>
  );

const FS = 'uploadFiles.fileUploadForm';
const BTN = `${FS}.uploadFilesButton`;
const botonSubir = () => screen.getByRole('button', { name: BTN });

describe('FileUpload con campos vacíos en el Excel', () => {
  let fetchMock;

  let assign;

  const selectAndSubmit = async (user) => {
    const { container } = renderUpload();
    const file = new File(['datos'], 'Málaga datos.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await user.upload(container.querySelector('#fileInput'), file);
    await user.click(screen.getByText(BTN));
  };

  const uploadOneFile = async (user) => {
    await selectAndSubmit(user);
    await screen.findByText('dialogAdvice.fieldsMissingMessage');
  };

  beforeEach(() => {
    fetchMock = vi.fn();
    assign = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('location', { assign });
    localStorage.setItem('token', 'abc');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('al confirmar, activa el borrador y avisa del éxito en la región status', async () => {
    fetchMock
      .mockResolvedValueOnce(draftResponse())
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));
    const user = userEvent.setup();
    await uploadOneFile(user);

    await user.click(screen.getByText('dialogAdvice.confirmButton'));

    await screen.findByText('dialogAdvice.successUploadMessage');
    expect(regionDe('dialogAdvice.successUploadMessage')).toHaveAttribute('role', 'status');
    expect(confirmCalls(fetchMock)).toEqual([
      { confirmed: true, draftKey: 'Malaga/Malaga_V1_01_01_2026.xlsx' },
    ]);
    await waitFor(() => expect(screen.queryByText('Málaga datos.xlsx')).not.toBeInTheDocument());
  });

  it('al cancelar, avisa al backend para borrar el borrador y no muestra éxito', async () => {
    fetchMock
      .mockResolvedValueOnce(draftResponse())
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'cancelled' }));
    const user = userEvent.setup();
    await uploadOneFile(user);

    await user.click(screen.getByText('dialogAdvice.cancelButton'));

    await waitFor(() =>
      expect(confirmCalls(fetchMock)).toEqual([
        { confirmed: false, draftKey: 'Malaga/Malaga_V1_01_01_2026.xlsx' },
      ])
    );
    expect(screen.queryByText('dialogAdvice.successUploadMessage')).not.toBeInTheDocument();
    await waitFor(() => expect(botonSubir()).not.toHaveAttribute('aria-busy'));
  });

  it('el input de archivos oculto queda fuera del orden de tabulación y del árbol de accesibilidad', () => {
    const { container } = renderUpload();
    const input = container.querySelector('#fileInput');

    expect(input).toHaveAttribute('aria-hidden', 'true');
    expect(input).toHaveAttribute('tabindex', '-1');
  });

  it('solo acepta .xlsx en el selector de archivos', () => {
    const { container } = renderUpload();
    const accept = container.querySelector('#fileInput').getAttribute('accept');

    expect(accept).toContain('.xlsx');
    expect(accept).not.toContain('.csv');
    expect(accept).not.toContain('.xls,');
    expect(accept).not.toContain('vnd.ms-excel');
  });

  it('al confirmar con 404 muestra que el borrador ya no existe', async () => {
    fetchMock
      .mockResolvedValueOnce(draftResponse())
      .mockResolvedValueOnce(jsonResponse(404, { success: false, error: 'Draft not found' }));
    const user = userEvent.setup();
    await uploadOneFile(user);

    await user.click(screen.getByText('dialogAdvice.confirmButton'));

    expect(await screen.findByText('dialogAdvice.errorDraftNotFound')).toBeInTheDocument();
    expect(screen.queryByText('dialogAdvice.successUploadMessage')).not.toBeInTheDocument();
    expect(screen.queryByText('dialogAdvice.errorUploadMessage')).not.toBeInTheDocument();
  });

  it('al cancelar con 404 muestra que el borrador ya no existe y conserva los archivos', async () => {
    fetchMock
      .mockResolvedValueOnce(draftResponse())
      .mockResolvedValueOnce(jsonResponse(404, { success: false, error: 'Draft not found' }));
    const user = userEvent.setup();
    await uploadOneFile(user);

    await user.click(screen.getByText('dialogAdvice.cancelButton'));

    expect(await screen.findByText('dialogAdvice.errorDraftNotFound')).toBeInTheDocument();
    expect(screen.queryByText('dialogAdvice.successUploadMessage')).not.toBeInTheDocument();
    expect(screen.getByText('Málaga datos.xlsx')).toBeInTheDocument();
  });

  it('al cancelar con 500 muestra el error de subida y conserva los archivos', async () => {
    fetchMock
      .mockResolvedValueOnce(draftResponse())
      .mockResolvedValueOnce(jsonResponse(500, { success: false, error: 'Internal' }));
    const user = userEvent.setup();
    await uploadOneFile(user);

    await user.click(screen.getByText('dialogAdvice.cancelButton'));

    expect(await screen.findByText('dialogAdvice.errorUploadMessage')).toBeInTheDocument();
    expect(screen.queryByText('dialogAdvice.successUploadMessage')).not.toBeInTheDocument();
    expect(screen.getByText('Málaga datos.xlsx')).toBeInTheDocument();
  });

  const expectSessionExpired = async () => {
    await waitFor(() => expect(assign).toHaveBeenCalledWith('/login'));
    await waitFor(() => expect(botonSubir()).not.toHaveAttribute('aria-busy'));
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.queryByText('dialogAdvice.errorUploadMessage')).not.toBeInTheDocument();
    expect(screen.queryByText('dialogAdvice.successUploadMessage')).not.toBeInTheDocument();
    expect(screen.queryByText('dialogAdvice.errorDraftNotFound')).not.toBeInTheDocument();
    expect(screen.getByText('Málaga datos.xlsx')).toBeInTheDocument();
  };

  it('envía el archivo a /upload con la cabecera Authorization', async () => {
    fetchMock.mockResolvedValueOnce(draftResponse());
    const user = userEvent.setup();
    await uploadOneFile(user);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url.endsWith('/upload')).toBe(true);
    expect(options.headers.Authorization).toBe('Bearer abc');
    const files = options.body.getAll('file');
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('Malagadatos.xlsx');
  });

  it.each([
    ['confirmar', 'dialogAdvice.confirmButton', true],
    ['cancelar', 'dialogAdvice.cancelButton', false],
  ])('al %s envía Authorization y Content-Type JSON', async (_name, button, confirmed) => {
    fetchMock
      .mockResolvedValueOnce(draftResponse())
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));
    const user = userEvent.setup();
    await uploadOneFile(user);

    await user.click(screen.getByText(button));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [, options] = fetchMock.mock.calls[1];
    expect(options.headers.Authorization).toBe('Bearer abc');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body).confirmed).toBe(confirmed);
  });

  it('un 401 en /upload redirige a /login sin mostrar error', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }));
    const user = userEvent.setup();
    await selectAndSubmit(user);

    await expectSessionExpired();
  });

  it('un 401 al confirmar redirige a /login sin mostrar error', async () => {
    fetchMock
      .mockResolvedValueOnce(draftResponse())
      .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }));
    const user = userEvent.setup();
    await uploadOneFile(user);

    await user.click(screen.getByText('dialogAdvice.confirmButton'));

    await expectSessionExpired();
  });

  it('un 401 al cancelar redirige a /login sin mostrar error', async () => {
    fetchMock
      .mockResolvedValueOnce(draftResponse())
      .mockResolvedValueOnce(jsonResponse(401, { success: false, error: 'Unauthorized' }));
    const user = userEvent.setup();
    await uploadOneFile(user);

    await user.click(screen.getByText('dialogAdvice.cancelButton'));

    await expectSessionExpired();
  });

  it('un 400 sin emptyFields muestra el error de subida y conserva los archivos', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, { success: false, error: 'Bad file' }));
    const user = userEvent.setup();
    await selectAndSubmit(user);

    expect(await screen.findByText('dialogAdvice.errorUploadMessage')).toBeInTheDocument();
    expect(screen.queryByText('dialogAdvice.fieldsMissingMessage')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Málaga datos.xlsx')).toBeInTheDocument();
  });

  it('al confirmar con 500 muestra el error de subida y conserva el archivo con estado de error', async () => {
    fetchMock
      .mockResolvedValueOnce(draftResponse())
      .mockResolvedValueOnce(jsonResponse(500, { success: false, error: 'Internal' }));
    const user = userEvent.setup();
    await uploadOneFile(user);

    await user.click(screen.getByText('dialogAdvice.confirmButton'));

    const mensaje = await screen.findByText('dialogAdvice.errorUploadMessage');
    expect(mensaje.closest('p')).toHaveAttribute('role', 'alert');
    const fila = screen.getByText('Málaga datos.xlsx').closest('li');
    expect(within(fila).getByText(`uploadFiles.fileStatus.error`)).toBeInTheDocument();
  });

  it('un fallo de red conserva el archivo con estado de error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const user = userEvent.setup();
    await selectAndSubmit(user);

    expect(await screen.findByText('dialogAdvice.errorUploadMessage')).toBeInTheDocument();
    const fila = screen.getByText('Málaga datos.xlsx').closest('li');
    expect(within(fila).getByText('uploadFiles.fileStatus.error')).toBeInTheDocument();
  });

  it('la papelera de cada archivo tiene nombre accesible y anillo de foco', async () => {
    const user = userEvent.setup();
    const { container } = renderUpload();
    const archivos = ['uno.xlsx', 'dos.xlsx'].map((nombre) => new File([nombre], nombre));
    await user.upload(container.querySelector('#fileInput'), archivos);

    const papeleras = await screen.findAllByRole('button', { name: `${FS}.removeFile` });

    expect(papeleras).toHaveLength(2);
    papeleras.forEach((papelera) => expect(papelera).toHaveClass('focus-ring'));
    expect(screen.getByRole('list', { name: `${FS}.filesListLabel` })).toBeInTheDocument();
  });

  it('quitar un archivo lo saca de la lista', async () => {
    const user = userEvent.setup();
    const { container } = renderUpload();
    await user.upload(
      container.querySelector('#fileInput'),
      ['uno.xlsx', 'dos.xlsx'].map((nombre) => new File([nombre], nombre))
    );

    await user.click(screen.getAllByRole('button', { name: `${FS}.removeFile` })[0]);

    expect(screen.queryByText('uno.xlsx')).not.toBeInTheDocument();
    expect(screen.getByText('dos.xlsx')).toBeInTheDocument();
  });

  it('sin archivos explica que no se ha elegido ninguno y no hay botón de subir', () => {
    renderUpload();

    expect(screen.getByText(`${FS}.noFilesSelected`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: BTN })).not.toBeInTheDocument();
  });

  it('Escape sobre la confirmación equivale a cancelar: envía confirmed false una sola vez y no muestra éxito', async () => {
    fetchMock
      .mockResolvedValueOnce(draftResponse())
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'cancelled' }));
    const user = userEvent.setup();
    await uploadOneFile(user);

    await user.keyboard('{Escape}');
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(confirmCalls(fetchMock)).toEqual([
        { confirmed: false, draftKey: 'Malaga/Malaga_V1_01_01_2026.xlsx' },
      ])
    );
    expect(screen.queryByText('dialogAdvice.successUploadMessage')).not.toBeInTheDocument();
  });

  it('tras Escape sobre la confirmación, el error de subida sale en línea y no en un diálogo', async () => {
    fetchMock
      .mockResolvedValueOnce(draftResponse())
      .mockResolvedValueOnce(jsonResponse(500, { success: false, error: 'Internal' }));
    const user = userEvent.setup();
    await uploadOneFile(user);

    await user.keyboard('{Escape}');

    const mensaje = await screen.findByText('dialogAdvice.errorUploadMessage');
    expect(mensaje.closest('p')).toHaveAttribute('role', 'alert');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  describe('estado por archivo y progreso', () => {
    const subirDos = async (user) => {
      const { container } = renderUpload();
      await user.upload(
        container.querySelector('#fileInput'),
        ['uno.xlsx', 'dos.xlsx'].map((nombre) => new File([nombre], nombre))
      );
      await user.click(botonSubir());
    };
    const estadoDe = (nombre) => within(screen.getByText(nombre).closest('li'));

    it('con dos archivos y un 400 en el segundo, el primero queda subido y al reintentar solo se sube el segundo', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }))
        .mockResolvedValueOnce(jsonResponse(400, { success: false, error: 'Bad file' }))
        .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));
      const user = userEvent.setup();
      await subirDos(user);

      await screen.findByText('dialogAdvice.errorUploadMessage');
      expect(estadoDe('uno.xlsx').getByText('uploadFiles.fileStatus.done')).toBeInTheDocument();
      expect(estadoDe('dos.xlsx').getByText('uploadFiles.fileStatus.error')).toBeInTheDocument();
      expect(uploadCalls(fetchMock)).toHaveLength(2);

      await user.click(botonSubir());

      await screen.findByText('dialogAdvice.successUploadMessage');
      expect(uploadCalls(fetchMock)).toHaveLength(3);
      expect(uploadCalls(fetchMock)[2][1].body.getAll('file')[0].name).toBe('dos.xlsx');
      await waitFor(() => expect(screen.queryByText('dos.xlsx')).not.toBeInTheDocument());
    });

    it('los archivos que no se llegaron a subir quedan pendientes', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse(400, { success: false, error: 'Bad file' }));
      const user = userEvent.setup();
      await subirDos(user);

      await screen.findByText('dialogAdvice.errorUploadMessage');
      expect(estadoDe('uno.xlsx').getByText('uploadFiles.fileStatus.error')).toBeInTheDocument();
      expect(estadoDe('dos.xlsx').getByText('uploadFiles.fileStatus.pending')).toBeInTheDocument();
    });

    it('durante la subida hay aria-busy, una barra de progreso «n de N» y el texto de estado', async () => {
      const primera = deferred();
      fetchMock.mockReturnValueOnce(primera.promise).mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));
      const user = userEvent.setup();
      await subirDos(user);

      const barra = await screen.findByRole('progressbar');
      expect(botonSubir()).toHaveAttribute('aria-busy', 'true');
      expect(barra).toHaveAttribute('aria-valuemin', '0');
      expect(barra).toHaveAttribute('aria-valuemax', '2');
      expect(barra).toHaveAttribute('aria-valuenow', '0');
      expect(barra).toHaveAttribute('aria-valuetext', 'uploadFiles.progress');
      expect(screen.getByText('uploadFiles.progress', { selector: 'span' })).toBeInTheDocument();
      expect(estadoDe('uno.xlsx').getByText('uploadFiles.fileStatus.uploading')).toBeInTheDocument();

      primera.resolve(jsonResponse(200, { success: true, data: 'ok' }));

      await screen.findByText('dialogAdvice.successUploadMessage');
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('mientras se sube, quitar y elegir archivos está desactivado', async () => {
      const primera = deferred();
      fetchMock.mockReturnValueOnce(primera.promise);
      const user = userEvent.setup();
      await subirDos(user);

      await screen.findByRole('progressbar');
      screen.getAllByRole('button', { name: `${FS}.removeFile` }).forEach((boton) => expect(boton).toBeDisabled());
      expect(screen.getByRole('button', { name: `${FS}.selectFilesButton` })).toBeDisabled();

      primera.resolve(jsonResponse(400, { success: false, error: 'Bad file' }));
      await screen.findByText('dialogAdvice.errorUploadMessage');
    });

    it('un envío mientras se sube se ignora (clic y submit del formulario)', async () => {
      const primera = deferred();
      fetchMock.mockReturnValueOnce(primera.promise);
      const user = userEvent.setup();
      await subirDos(user);
      await screen.findByRole('progressbar');

      await user.click(botonSubir());
      fireEvent.submit(botonSubir().closest('form'));

      expect(uploadCalls(fetchMock)).toHaveLength(1);
      primera.resolve(jsonResponse(400, { success: false, error: 'Bad file' }));
      await screen.findByText('dialogAdvice.errorUploadMessage');
    });
  });
});
