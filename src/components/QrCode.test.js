import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import qrcode from 'qrcode-generator';
import QrCode from './QrCode';

const SECRET = 'JBSWY3DPEHPK3PXP';
const URI = `otpauth://totp/SIGMETUM-A:persona%40example.test?secret=${SECRET}&issuer=SIGMETUM-A`;
const LABEL = 'Código QR de prueba';

const expectedMatrix = (value, level = 'M') => {
  const qr = qrcode(0, level);
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)));
};

// Reconstruye la matriz desde el atributo d del único path (cada módulo oscuro es "M{c+4} {r+4}h1v1h-1z").
const matrixFrom = (svg, modules) => {
  const d = svg.querySelector('path').getAttribute('d');
  const matrix = Array.from({ length: modules }, () => Array(modules).fill(false));
  for (const [, x, y] of d.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) matrix[Number(y) - 4][Number(x) - 4] = true;
  return matrix;
};

describe('QrCode', () => {
  it('pinta el QR de la URI como un SVG con role=img y nombre accesible', () => {
    render(<QrCode value={URI} label={LABEL} />);

    const svg = screen.getByRole('img', { name: LABEL });
    expect(svg.tagName.toLowerCase()).toBe('svg');
  });

  it('la matriz pintada coincide módulo a módulo con la de qrcode-generator (nivel M) y no con la del nivel L', () => {
    const { container } = render(<QrCode value={URI} label={LABEL} />);
    const svg = container.querySelector('svg');
    const expected = expectedMatrix(URI);

    expect(matrixFrom(svg, expected.length)).toEqual(expected);
    expect(matrixFrom(svg, expected.length)).not.toEqual(expectedMatrix(URI, 'L'));
  });

  it('el atributo d solo contiene módulos y la geometría lleva una quiet zone de 4 módulos', () => {
    const { container } = render(<QrCode value={URI} label={LABEL} />);
    const svg = container.querySelector('svg');
    const modules = expectedMatrix(URI).length;
    const n = modules + 8;
    const d = svg.querySelector('path').getAttribute('d');

    expect(d).toMatch(/^(M\d+ \d+h1v1h-1z)*$/);
    expect(svg).toHaveAttribute('viewBox', `0 0 ${n} ${n}`);
    const coordinates = [...d.matchAll(/M(\d+) (\d+)h1v1h-1z/g)].flatMap(([, x, y]) => [Number(x), Number(y)]);
    expect(coordinates.length).toBeGreaterThan(0);
    coordinates.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(4);
      expect(value).toBeLessThan(n - 4);
    });
  });

  it('fondo blanco, módulos en ink, bordes nítidos y tamaño que cabe en 320 px', () => {
    const { container } = render(<QrCode value={URI} label={LABEL} />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('shape-rendering', 'crispEdges');
    expect(svg.querySelector('rect')).toHaveAttribute('fill', 'white');
    expect(svg.querySelector('path')).toHaveAttribute('fill', '#0C1811');
    expect(svg).toHaveClass('w-48', 'max-w-full', 'h-auto', 'forced-color-adjust-none');
  });

  it('ni el nombre accesible ni el marcado contienen la URI, otpauth ni el secreto', () => {
    const { container } = render(<QrCode value={URI} label={LABEL} />);
    const svg = container.querySelector('svg');
    const html = container.innerHTML;

    [URI, 'otpauth', SECRET].forEach((text) => {
      expect(svg.getAttribute('aria-label')).not.toContain(text);
      expect(html).not.toContain(text);
    });
  });

  it('solo usa path y rect: sin img, image, use, foreignObject ni data:', () => {
    const { container } = render(<QrCode value={URI} label={LABEL} />);

    ['img', 'image', 'use', 'foreignObject'].forEach((tag) => expect(container.querySelector(tag)).toBeNull());
    expect(container.innerHTML).not.toContain('data:');
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });

  it('si la generación falla por capacidad no pinta nada ni lanza', () => {
    const { container } = render(<QrCode value={'a'.repeat(5000)} label={LABEL} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('sin valor no pinta nada', () => {
    const { container } = render(<QrCode value="" label={LABEL} />);

    expect(container).toBeEmptyDOMElement();
  });
});
