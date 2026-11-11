import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FilesUpload from './FilesUpload';
import ToastProvider from '../components/ToastProvider';

vi.mock('../services/api', () => ({
  default: { postFormAuth: vi.fn(), postAuth: vi.fn() },
}));

const renderPage = () =>
  render(
    <ToastProvider>
      <FilesUpload />
    </ToastProvider>
  );

describe('FilesUpload', () => {
  it('pinta el título y la descripción de la página', () => {
    renderPage();

    expect(screen.getByText('uploadFiles.title')).toBeInTheDocument();
    expect(screen.getByText('uploadFiles.description')).toBeInTheDocument();
  });

  it('pinta el formulario de subida (FileUpload)', () => {
    const { container } = renderPage();

    expect(screen.getByText('uploadFiles.fileUploadForm.selectFilesButton')).toBeInTheDocument();
    expect(container.querySelector('#fileInput')).toBeInTheDocument();
  });

  it('tiene un único h1 y un contenedor max-w-3xl', () => {
    const { container } = renderPage();

    const h1 = screen.getAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent('uploadFiles.title');
    expect(container.querySelector('.max-w-3xl')).toBeInTheDocument();
  });

  it('no usa anchos fijos que desbordan a 320 px ni la superposición de carga', () => {
    const { container } = renderPage();

    ['.px-40', '.min-w-72', '.max-w-screen', '.min-w-screen', '.min-h-screen'].forEach((selector) =>
      expect(container.querySelector(selector)).toBeNull()
    );
    expect(container.querySelector('[class*="w-[512px]"]')).toBeNull();
    expect(container.querySelector('[class*="max-w-[512px]"]')).toBeNull();
    expect(screen.queryByText('feedback.loading')).not.toBeInTheDocument();
  });
});
