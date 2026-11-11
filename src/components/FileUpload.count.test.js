import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from './FileUpload';
import ToastProvider from './ToastProvider';

// Este `t` simulado interpola `count`: así se comprueba que el botón recibe la cuenta real de pendientes.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => (options && 'count' in options ? `${key}#${options.count}` : key),
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
  Trans: ({ i18nKey }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}));

const FS = 'uploadFiles.fileUploadForm';
const jsonResponse = (status, body) => ({ ok: status < 400, status, json: async () => body });
const botonSubir = (count) => screen.queryByRole('button', { name: `${FS}.uploadFilesButton#${count}` });

describe('FileUpload: cuenta del botón de subir', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const elegir = async (user, nombres) => {
    const { container } = render(
      <ToastProvider>
        <FileUpload />
      </ToastProvider>
    );
    await user.upload(
      container.querySelector('#fileInput'),
      nombres.map((nombre) => new File([nombre], nombre))
    );
  };

  it('lleva la cuenta de archivos pendientes y la actualiza al quitar uno', async () => {
    const user = userEvent.setup();
    await elegir(user, ['uno.xlsx', 'dos.xlsx']);

    expect(botonSubir(2)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: `${FS}.removeFile` })[0]);

    expect(botonSubir(1)).toBeInTheDocument();
    expect(botonSubir(2)).not.toBeInTheDocument();
  });

  it('tras una subida parcial, si se quitan los pendientes no queda un botón «Subir 0 archivos»', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: 'ok' }))
      .mockResolvedValueOnce(jsonResponse(400, { success: false, error: 'Bad file' }));
    const user = userEvent.setup();
    await elegir(user, ['uno.xlsx', 'dos.xlsx']);
    await user.click(botonSubir(2));
    await screen.findByText('dialogAdvice.errorUploadMessage');
    await waitFor(() => expect(botonSubir(1)).toBeInTheDocument());

    // El segundo archivo es el que quedó con error: se quita de la lista.
    const quitarBotones = screen.getAllByRole('button', { name: `${FS}.removeFile` });
    await user.click(quitarBotones[quitarBotones.length - 1]);

    expect(screen.getByText('uno.xlsx')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: new RegExp(`${FS}.uploadFilesButton`) })).not.toBeInTheDocument();
  });
});
