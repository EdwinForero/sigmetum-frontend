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
});
