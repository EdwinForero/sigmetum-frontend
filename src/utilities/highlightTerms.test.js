import { describe, it, expect } from 'vitest';
import { highlightTerms } from './highlightTerms';

const joined = (parts) => parts.map((p) => p.text).join('');
const upright = (parts) => parts.filter((p) => !p.isItalic).map((p) => p.text);

describe('highlightTerms', () => {
  it('pone en redonda solo los términos no latinos y conserva el texto completo', () => {
    const parts = highlightTerms('Quercus suber subsp. suber', [{ term: 'subsp.' }]);

    expect(joined(parts)).toBe('Quercus suber subsp. suber');
    expect(upright(parts)).toEqual(['subsp.']);
  });

  it('acepta términos con caracteres especiales de expresión regular sin lanzar error', () => {
    const parts = highlightTerms('Pistacia x (var.) lentiscus', [{ term: '(var.)' }]);

    expect(joined(parts)).toBe('Pistacia x (var.) lentiscus');
    expect(upright(parts)).toEqual(['(var.)']);
  });

  it('no lanza error con caracteres que invalidarían una expresión regular', () => {
    expect(() => highlightTerms('Quercus ( suber', [{ term: '(' }])).not.toThrow();
    expect(() => highlightTerms('Quercus + suber', [{ term: '+' }])).not.toThrow();
  });

  it('trata el punto del término como un punto literal y no como comodín', () => {
    const parts = highlightTerms('Quercus subspX suber', [{ term: 'subsp.' }]);

    expect(parts).toEqual([{ text: 'Quercus subspX suber', isItalic: true }]);
  });

  it('devuelve todo en cursiva si no hay términos', () => {
    expect(highlightTerms('Quercus ilex', [])).toEqual([{ text: 'Quercus ilex', isItalic: true }]);
    expect(highlightTerms('Quercus ilex', undefined)).toEqual([{ text: 'Quercus ilex', isItalic: true }]);
  });

  it('acepta términos como cadenas simples además de objetos { term }', () => {
    const parts = highlightTerms('Quercus ilex var. ballota', ['var.']);

    expect(upright(parts)).toEqual(['var.']);
  });
});
