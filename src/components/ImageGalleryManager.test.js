import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageGalleryManager from './ImageGalleryManager';
import api from '../services/api';

vi.mock('../services/api', () => ({
  default: { get: vi.fn(), postFormAuth: vi.fn(), deleteAuth: vi.fn() },
}));

const setup = async (title) => {
  const user = userEvent.setup();
  const { container } = render(<ImageGalleryManager />);
  await waitFor(() => expect(api.get).toHaveBeenCalled());
  fireEvent.change(screen.getByPlaceholderText('contentManagement.galleryManagementPlaceholder'), {
    target: { value: title },
  });
  const file = new File(['x'], 'foto.png', { type: 'image/png' });
  await user.upload(container.querySelector('#imageFileInput'), file);
  await user.click(screen.getByText('add'));
};

describe('ImageGalleryManager: validación del título', () => {
  beforeEach(() => {
    api.get.mockReset().mockResolvedValue([]);
    api.postFormAuth.mockReset().mockResolvedValue({});
  });

  it.each([
    ['/', 'a/b'],
    ['\\', 'a\\b'],
    ['..', 'a..b'],
    ['control', 'a\u0001b'],
    [',', 'a,b'],
    ["'", "a'b"],
    [':', 'a:b'],
    ['&', 'a&b'],
    ['#', 'a#b'],
    ['?', 'a?b'],
    ['%', 'a%b'],
    ['"', 'a"b'],
  ])('rechaza el carácter %s sin subir', async (_nombre, title) => {
    await setup(title);

    expect(await screen.findByText('dialogAdvice.adviceInvalidImageTitle')).toBeInTheDocument();
    expect(api.postFormAuth).not.toHaveBeenCalled();
  });

  it('sube con un título válido', async () => {
    await setup('Mi foto 1');

    await waitFor(() => expect(api.postFormAuth).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('dialogAdvice.adviceInvalidImageTitle')).not.toBeInTheDocument();
  });
});
