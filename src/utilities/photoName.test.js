import { describe, it, expect } from 'vitest';
import photoName from './photoName';

describe('photoName', () => {
  it('quita la extensión y cambia los guiones bajos por espacios', () => {
    expect(photoName('bosque_de_encinas.jpg')).toBe('bosque de encinas');
  });

  it('solo quita la última extensión', () => {
    expect(photoName('sierra_nevada.v2.png')).toBe('sierra nevada.v2');
  });

  it('un nombre sin extensión solo cambia los guiones bajos', () => {
    expect(photoName('dehesa_alta')).toBe('dehesa alta');
  });

  it('conserva los acentos y las mayúsculas', () => {
    expect(photoName('Sierra_Nevada_Ñandú.JPG')).toBe('Sierra Nevada Ñandú');
  });

  it('no falla con un valor vacío', () => {
    expect(photoName('')).toBe('');
    expect(photoName(undefined)).toBe('');
  });
});
