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

  const uploadOneFile = async (user) => {
    const { container } = render(<FileUpload onLoad={onLoad} />);
    const file = new File(['datos'], 'Málaga datos.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await user.upload(container.querySelector('#fileInput'), file);
    await user.click(screen.getByText('uploadFiles.fileUploadForm.uploadFilesButton'));
    await screen.findByText('dialogAdvice.fieldsMissingMessage');
  };

  beforeEach(() => {
    onLoad = vi.fn();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
});
