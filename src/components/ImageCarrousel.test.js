import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import ImageCarrousel from './ImageCarrousel';
import api from '../services/api';

const mockEnv = vi.hoisted(() => ({ CAROUSEL_IMAGE_KEYS: [] }));

vi.mock('../services/api', () => ({ default: { get: vi.fn() } }));
vi.mock('../config/env', () => ({ default: mockEnv }));

describe('ImageCarrousel', () => {
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue({ imageUrl: 'https://s3/x.jpg' });
  });

  it('codifica cada clave en la consulta', async () => {
    mockEnv.CAROUSEL_IMAGE_KEYS = ['gallery/Mi foto&1.jpg'];
    render(<ImageCarrousel />);

    await waitFor(() =>
      expect(api.get).toHaveBeenCalledWith('/get-image?imageKey=gallery%2FMi%20foto%261.jpg')
    );
  });

  it('sin claves no llama a la API', () => {
    mockEnv.CAROUSEL_IMAGE_KEYS = [];
    render(<ImageCarrousel />);

    expect(api.get).not.toHaveBeenCalled();
  });
});
