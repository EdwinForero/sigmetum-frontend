import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from './FileUpload';

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

describe('FileUpload con campos vacíos en el Excel', () => {
  let fetchMock;
  let onLoad;

  let assign;

  const selectAndSubmit = async (user) => {
    const { container } = render(<FileUpload onLoad={onLoad} />);
    const file = new File(['datos'], 'Málaga datos.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await user.upload(container.querySelector('#fileInput'), file);
    await user.click(screen.getByText('uploadFiles.fileUploadForm.uploadFilesButton'));
  };

  const uploadOneFile = async (user) => {
    await selectAndSubmit(user);
    await screen.findByText('dialogAdvice.fieldsMissingMessage');
  };

  beforeEach(() => {
    onLoad = vi.fn();
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

  it('al confirmar, activa el borrador y muestra el éxito', async () => {
    fetchMock
      .mockResolvedValueOnce(draftResponse())
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }));
    const user = userEvent.setup();
    await uploadOneFile(user);

    await user.click(screen.getByText('dialogAdvice.confirmButton'));

    await screen.findByText('dialogAdvice.successUploadMessage');
    expect(confirmCalls(fetchMock)).toEqual([
      { confirmed: true, draftKey: 'Malaga/Malaga_V1_01_01_2026.xlsx' },
    ]);
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
    await waitFor(() => expect(onLoad).toHaveBeenLastCalledWith(false));
  });

  it('solo acepta .xlsx en el selector de archivos', () => {
    const { container } = render(<FileUpload onLoad={onLoad} />);
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
    await waitFor(() => expect(onLoad).toHaveBeenLastCalledWith(false));
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

  it('al confirmar con 500 muestra el error de subida y vacía los archivos', async () => {
    fetchMock
      .mockResolvedValueOnce(draftResponse())
      .mockResolvedValueOnce(jsonResponse(500, { success: false, error: 'Internal' }));
    const user = userEvent.setup();
    await uploadOneFile(user);

    await user.click(screen.getByText('dialogAdvice.confirmButton'));

    expect(await screen.findByText('dialogAdvice.errorUploadMessage')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Málaga datos.xlsx')).not.toBeInTheDocument());
  });
});
