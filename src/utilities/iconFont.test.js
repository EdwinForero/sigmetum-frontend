import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { watchIconFont } from './iconFont';

const crearDoc = (fonts) => ({ documentElement: document.createElement('html'), fonts });
const clases = (doc) => Array.from(doc.documentElement.classList);

describe('watchIconFont', () => {
  beforeEach(() => {
    document.documentElement.className = '';
  });

  it('carga la fuente con una ligadura como texto', async () => {
    const load = vi.fn().mockResolvedValue([{}]);
    await watchIconFont(crearDoc({ load }));
    expect(load).toHaveBeenCalledWith('24px "Material Symbols Outlined"', 'close');
  });

  it('con una cara cargada añade icons-ready', async () => {
    const doc = crearDoc({ load: vi.fn().mockResolvedValue([{}]) });
    await watchIconFont(doc);
    expect(clases(doc)).toEqual(['icons-ready']);
  });

  it('con una lista vacía añade icons-failed', async () => {
    const doc = crearDoc({ load: vi.fn().mockResolvedValue([]) });
    await watchIconFont(doc);
    expect(clases(doc)).toEqual(['icons-failed']);
  });

  it('con un rechazo añade icons-failed', async () => {
    const doc = crearDoc({ load: vi.fn().mockRejectedValue(new Error('red')) });
    await watchIconFont(doc);
    expect(clases(doc)).toEqual(['icons-failed']);
  });

  describe('con límite de tiempo', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('una carga que nunca resuelve añade icons-failed tras 4 s', async () => {
      vi.useFakeTimers();
      const doc = crearDoc({ load: vi.fn(() => new Promise(() => {})) });
      const espera = watchIconFont(doc);
      await vi.advanceTimersByTimeAsync(3999);
      expect(clases(doc)).toEqual([]);
      await vi.advanceTimersByTimeAsync(1);
      await espera;
      expect(clases(doc)).toEqual(['icons-failed']);
    });

    it('una carga a tiempo añade icons-ready y no icons-failed después', async () => {
      vi.useFakeTimers();
      const doc = crearDoc({ load: vi.fn().mockResolvedValue([{}]) });
      await watchIconFont(doc);
      await vi.advanceTimersByTimeAsync(10000);
      expect(clases(doc)).toEqual(['icons-ready']);
      expect(vi.getTimerCount()).toBe(0);
    });

    it('si la fuente llega después del límite, icons-ready sustituye a icons-failed', async () => {
      vi.useFakeTimers();
      let resolver;
      const doc = crearDoc({ load: vi.fn(() => new Promise((res) => { resolver = res; })) });
      const espera = watchIconFont(doc);
      await vi.advanceTimersByTimeAsync(4000);
      await espera;
      expect(clases(doc)).toEqual(['icons-failed']);
      resolver([{}]);
      await vi.advanceTimersByTimeAsync(0);
      expect(clases(doc)).toEqual(['icons-ready']);
    });
  });

  it('sin document.fonts añade icons-ready', async () => {
    const doc = crearDoc(undefined);
    await watchIconFont(doc);
    expect(clases(doc)).toEqual(['icons-ready']);
  });
});
