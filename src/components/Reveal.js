import React, { useLayoutEffect, useRef, useState } from 'react';
import { REVEAL, staggerDelay } from '../config/reveal.js';

// Un solo IntersectionObserver para todos los Reveal: elemento -> callback. Se crea al observar el primero
// (dentro del try del componente) y se desconecta cuando el mapa se vacía (guía §5).
const callbacks = new Map();
let observer = null;

const unobserve = (el) => {
  if (!callbacks.delete(el)) return;
  observer?.unobserve(el);
  if (callbacks.size === 0 && observer) {
    observer.disconnect();
    observer = null;
  }
};

const observe = (el, callback) => {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const reveal = callbacks.get(entry.target);
        unobserve(entry.target);
        reveal?.();
      }
    },
    { threshold: REVEAL.threshold, rootMargin: REVEAL.rootMargin }
  );
  callbacks.set(el, callback);
  try {
    observer.observe(el);
  } catch (error) {
    unobserve(el);
    throw error;
  }
};

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const STATE_CLASS = { visible: '', hidden: 'reveal-hidden', revealed: 'reveal-in' };

// Aparición única al entrar en pantalla (opacidad y 12 px). El contenido es visible por defecto: solo se oculta
// si hay IntersectionObserver, no hay movimiento reducido y el elemento está por debajo del primer pliegue.
// No se anida, ni se aplica a la primera pantalla ni a destinos de ancla o foco programático.
const Reveal = ({ as: Tag = 'div', index = 0, disabled = false, className = '', style, onFocus, children, ...rest }) => {
  const ref = useRef(null);
  const decided = useRef(false);
  const [state, setState] = useState('visible');

  useLayoutEffect(() => {
    const el = ref.current;
    if (decided.current || !el) return undefined;
    if (disabled || typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      decided.current = true;
      setState('visible');
      return undefined;
    }
    // Posición en el documento: App sube la página después del primer render, así que no basta rect.top.
    if (el.getBoundingClientRect().top + window.scrollY < window.innerHeight) {
      decided.current = true;
      return undefined;
    }
    try {
      observe(el, () => {
        decided.current = true;
        setState('revealed');
      });
    } catch {
      decided.current = true;
      setState('visible');
      return undefined;
    }
    setState('hidden');
    return () => unobserve(el);
  }, [disabled]);

  // Con foco (teclado o clic) se muestra en el acto y sin transición: un elemento con foco nunca queda a 0.
  const handleFocus = (event) => {
    if (!decided.current) {
      decided.current = true;
      unobserve(ref.current);
      setState('visible');
    }
    onFocus?.(event);
  };

  const classes = [className, STATE_CLASS[state]].filter(Boolean).join(' ');
  const delay = state === 'revealed' ? { transitionDelay: `${staggerDelay(index)}ms` } : undefined;

  return (
    <Tag
      {...rest}
      ref={ref}
      data-reveal=""
      className={classes || undefined}
      style={delay || style ? { ...style, ...delay } : undefined}
      onFocus={handleFocus}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
