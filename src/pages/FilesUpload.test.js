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

  it('usa el mismo contenedor que las otras páginas privadas y la descripción y la subida en max-w-3xl', () => {
    const { container } = renderPage();

    const h1 = screen.getAllByRole('heading', { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent('uploadFiles.title');
    expect(container.firstChild).toHaveClass('mx-auto', 'w-full', 'max-w-6xl', 'px-4', 'sm:px-5', 'pb-6', 'animate-page-fade', 'motion-reduce:animate-none');
    const columna = container.querySelector('.max-w-3xl');
    expect(columna).toBeInTheDocument();
    expect(columna).toContainElement(screen.getByText('uploadFiles.description'));
    expect(columna).toContainElement(container.querySelector('#fileInput'));
    expect(columna).not.toContainElement(h1[0]);
    expect(columna.className).not.toMatch(/mx-auto/);
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
