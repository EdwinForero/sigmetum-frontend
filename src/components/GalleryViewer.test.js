import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// t devuelve la clave y sus opciones, para poder comprobar «n de N».
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => (options ? `${key}:${JSON.stringify(options)}` : key),
    i18n: { language: 'es', changeLanguage: vi.fn() },
  }),
}));

import GalleryViewer from './GalleryViewer';

const images = [
  { fileName: 'bosque_de_encinas.jpg', url: 'https://assets.test/1.jpg' },
  { fileName: 'dehesa_alta.png', url: 'https://assets.test/2.png' },
  { fileName: 'pinar_costero.webp', url: 'https://assets.test/3.webp' },
];

// Contenedor con estado: abre el visor desde un botón, como la galería.
const Harness = ({ start = 0, onClose = vi.fn(), onIndexChange }) => {
  const [index, setIndex] = useState(start);
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>abrir</button>
      {open && (
        <GalleryViewer
          images={images}
          index={index}
          onIndexChange={(next) => {
            onIndexChange?.(next);
            setIndex(next);
          }}
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        />
      )}
    </>
  );
};

describe('GalleryViewer', () => {
  it('es un diálogo modal nombrado por el nombre legible de la foto, sin extensión', () => {
    render(<Harness />);

    const dialog = screen.getByRole('dialog', { name: 'bosque de encinas' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('heading', { level: 2, name: 'bosque de encinas' })).toBeInTheDocument();
  });

  it('el foco entra en la caja del diálogo al abrir', () => {
    render(<Harness />);

    expect(screen.getByRole('dialog')).toHaveFocus();
  });

  it('la foto está en una caja de alto fijo con object-contain y su alt es el nombre', () => {
    render(<Harness />);

    const img = screen.getByRole('img', { name: 'bosque de encinas' });
    expect(img).toHaveAttribute('src', images[0].url);
    expect(img).toHaveClass('object-contain', 'h-full', 'w-full');
    expect(img.parentElement).toHaveClass('h-[calc(100dvh-10rem)]', 'w-full');
  });

  it('una envoltura aria-live anuncia el nombre y «n de N» juntos (aria-atomic)', () => {
    render(<Harness />);

    const live = screen.getByRole('heading', { level: 2 }).parentElement;
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveAttribute('aria-atomic', 'true');
    expect(live).toHaveTextContent('bosque de encinas');
    expect(live).toHaveTextContent('gallery.viewer.counter:{"current":1,"total":3}');
    expect(live.querySelectorAll('[aria-live]')).toHaveLength(0);
  });

  it('las flechas izquierda y derecha cambian de foto y el contador anuncia la nueva', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const live = () => screen.getByRole('heading', { level: 2 }).parentElement;

    await user.keyboard('{ArrowRight}');
    expect(live()).toHaveTextContent('dehesa alta');
    expect(live()).toHaveTextContent('"current":2,"total":3');

    await user.keyboard('{ArrowLeft}');
    expect(live()).toHaveTextContent('bosque de encinas');
    expect(live()).toHaveTextContent('"current":1,"total":3');
  });

  it('la navegación es cíclica: de la última se pasa a la primera y de la primera a la última', async () => {
    const user = userEvent.setup();
    render(<Harness start={2} />);
    const counter = () => screen.getByRole('heading', { level: 2 }).parentElement.textContent;

    await user.keyboard('{ArrowRight}');
    expect(counter()).toContain('"current":1,"total":3');

    await user.keyboard('{ArrowLeft}');
    expect(counter()).toContain('"current":3,"total":3');
  });

  it('los botones anterior y siguiente tienen nombre accesible, miden 48 px, nunca se deshabilitan y navegan', async () => {
    const user = userEvent.setup();
    render(<Harness start={2} />);

    const next = screen.getByRole('button', { name: 'iconButton.nextPhoto' });
    const previous = screen.getByRole('button', { name: 'iconButton.previousPhoto' });
    [next, previous, screen.getByRole('button', { name: 'iconButton.close' })].forEach((button) => {
      expect(button).toHaveClass('h-12', 'w-12', 'rounded-xl', 'bg-surface', 'text-ink', 'focus-ring');
      expect(button).toBeEnabled();
    });

    await user.click(next);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('bosque de encinas');
    await user.click(previous);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('pinar costero');
  });

  it('con una sola foto las flechas no fallan y se queda en ella', async () => {
    const user = userEvent.setup();
    render(<GalleryViewer images={[images[0]]} index={0} onIndexChange={vi.fn()} onClose={vi.fn()} />);

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('bosque de encinas');
  });

  it('el botón Cerrar y Escape llaman a onClose', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { unmount } = render(<Harness onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'iconButton.close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();

    render(<Harness onClose={onClose} />);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('Tab queda atrapado dentro del diálogo', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">fuera</button>
        <Harness />
      </>
    );

    for (let i = 0; i < 8; i += 1) {
      await user.tab();
      expect(screen.getByRole('dialog')).toContainElement(document.activeElement);
    }
  });

  it('bloquea el scroll del body al abrir y restaura el valor anterior al cerrar', async () => {
    document.body.style.overflow = 'scroll';
    const user = userEvent.setup();
    render(<Harness />);
    expect(document.body.style.overflow).toBe('hidden');

    await user.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('scroll');
    document.body.style.overflow = '';
  });

  it('restaura el overflow del body también si se desmonta con el visor abierto', () => {
    document.body.style.overflow = '';
    const { unmount } = render(<Harness />);
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('las flechas del teclado no navegan si el visor ya se cerró', async () => {
    const onIndexChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onIndexChange={onIndexChange} />);

    await user.keyboard('{Escape}');
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('usa el sistema de diseño: fondo bg-ink/95, texto surface, sin hex ni animaciones', () => {
    const { container } = render(<Harness />);

    expect(container.querySelector('.fixed')).toHaveClass('inset-0', 'z-[60]', 'bg-ink/95');
    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('text-xl', 'font-bold', 'text-surface');
    expect(container.innerHTML).not.toMatch(/\[#[0-9A-Fa-f]{3,8}\]|animate-|transition|(gray|blue|red|green|yellow)-\d/);
  });

  it('móvil: anterior y siguiente abajo y cerrar arriba a la derecha; desde md, anterior y siguiente a los lados', () => {
    render(<Harness />);

    const close = screen.getByRole('button', { name: 'iconButton.close' });
    expect(close).toHaveClass('absolute', 'top-stack', 'right-gutter');
    const previous = screen.getByRole('button', { name: 'iconButton.previousPhoto' });
    const next = screen.getByRole('button', { name: 'iconButton.nextPhoto' });
    expect(previous).toHaveClass('absolute', 'bottom-stack', 'left-gutter', 'md:bottom-auto', 'md:top-1/2');
    expect(next).toHaveClass('absolute', 'bottom-stack', 'right-gutter', 'md:bottom-auto', 'md:top-1/2');
  });

  it.each([
    ['http://evil.example/a.jpg'],
    ['javascript:alert(1)'],
    ['data:image/png;base64,AAAA'],
    ['no es una url'],
  ])('con la URL no segura %s no hay img: el diálogo conserva título y botones', (url) => {
    render(
      <GalleryViewer images={[{ fileName: 'x.jpg', url }]} index={0} onIndexChange={vi.fn()} onClose={vi.fn()} />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByRole('button', { name: 'iconButton.close' })).toBeInTheDocument();
  });

  it('con una URL https muestra el img', () => {
    render(<GalleryViewer images={images} index={0} onIndexChange={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://assets.test/1.jpg');
  });
});
