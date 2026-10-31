import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';

const { render } = vi.hoisted(() => ({ render: vi.fn() }));

vi.mock('react-dom/client', () => ({
  default: { createRoot: () => ({ render }) },
}));
vi.mock('./App', () => ({ default: () => null }));
vi.mock('./i18n', () => ({ default: {} }));
vi.mock('./components/ErrorBoundary', () => ({
  default: ({ children }) => children,
}));
vi.mock('./index.css', () => ({}));

describe('index.js', () => {
  it('monta BrowserRouter con las opciones future de React Router v7', async () => {
    await import('./index');

    expect(render).toHaveBeenCalledTimes(1);
    const boundary = render.mock.calls[0][0];
    const router = React.Children.only(boundary.props.children);

    expect(router.type).toBe(BrowserRouter);
    expect(router.props.future).toEqual({
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    });
  });
});
