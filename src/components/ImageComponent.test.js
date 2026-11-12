import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import ImageComponent from './ImageComponent';
import api from '../services/api';

vi.mock('../services/api', () => ({ default: { get: vi.fn() } }));

describe('ImageComponent', () => {
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue({ imageUrl: 'https://s3/x.jpg' });
  });

  it('codifica imageKey en la consulta', async () => {
    render(<ImageComponent imageKey="gallery/Mi foto&1.jpg" />);

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith('/get-image?imageKey=gallery%2FMi%20foto%261.jpg')
    );
  });

  it('sin imageKey no llama a la API', () => {
    render(<ImageComponent />);

    expect(api.get).not.toHaveBeenCalled();
  });

  it('la imagen es decorativa por defecto (alt vacío) y recibe width, height y loading', () => {
    const { container } = render(<ImageComponent directUrl="https://s3/x.jpg" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');

    const { container: otro } = render(
      <ImageComponent directUrl="https://s3/y.jpg" alt="Roble" width={1200} height={500} loading="lazy" />
    );
    const img = otro.querySelector('img');
    expect(img).toHaveAttribute('alt', 'Roble');
    expect(img).toHaveAttribute('width', '1200');
    expect(img).toHaveAttribute('height', '500');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('sin width, height ni loading no los pinta', () => {
    const { container } = render(<ImageComponent directUrl="https://s3/x.jpg" />);
    const img = container.querySelector('img');
    expect(img).not.toHaveAttribute('width');
    expect(img).not.toHaveAttribute('height');
    expect(img).not.toHaveAttribute('loading');
  });

  it('el fondo no usa attachment fixed ni minHeight propio y pinta a sus hijos', () => {
    const { container } = render(
      <ImageComponent directUrl="https://s3/x.jpg" isBackground className="hero">
        <p>hijo</p>
      </ImageComponent>
    );
    const fondo = container.firstChild;
    expect(fondo).toHaveClass('hero');
    expect(fondo.style.backgroundAttachment).not.toBe('fixed');
    expect(fondo.style.minHeight).toBe('');
    expect(fondo).toHaveTextContent('hijo');
  });
});
