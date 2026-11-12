import { createRef, useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TextInput from './TextInput';

const Harness = () => {
  const [value, setValue] = useState('');
  return (
    <>
      <TextInput label="Nuevo término" value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={() => setValue('')}>vaciar</button>
    </>
  );
};

describe('TextInput', () => {
  it('muestra el valor que recibe del padre y se vacía cuando el padre lo vacía', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Nuevo término');

    await user.type(input, 'subsp.');
    expect(input).toHaveValue('subsp.');

    await user.click(screen.getByText('vaciar'));
    expect(input).toHaveValue('');
  });

  it('la etiqueta es visible y está asociada al campo', () => {
    render(<Harness />);
    const input = screen.getByLabelText('Nuevo término');
    const etiqueta = screen.getByText('Nuevo término');

    expect(etiqueta.tagName).toBe('LABEL');
    expect(etiqueta).not.toHaveClass('sr-only');
    expect(etiqueta).toHaveAttribute('for', input.id);
  });

  it('dos campos tienen id distintos', () => {
    render(
      <>
        <TextInput label="Uno" value="" onChange={() => {}} />
        <TextInput label="Dos" value="" onChange={() => {}} />
      </>
    );

    expect(screen.getByLabelText('Uno').id).not.toBe(screen.getByLabelText('Dos').id);
  });

  it('usa el id que recibe', () => {
    render(<TextInput id="mi-campo" label="Uno" value="" onChange={() => {}} />);

    expect(screen.getByLabelText('Uno')).toHaveAttribute('id', 'mi-campo');
  });

  it('el campo lleva el anillo interior de foco y no lleva clases de foco inertes', () => {
    render(<Harness />);
    const input = screen.getByLabelText('Nuevo término');

    expect(input).toHaveClass('focus-ring-inset');
    expect(input.className).not.toMatch(/focus:(outline|ring)/);
  });

  it('el campo redondea sus esquinas para que el anillo interior no las pierda', () => {
    render(<Harness />);

    expect(screen.getByLabelText('Nuevo término')).toHaveClass('rounded-xl');
  });

  it('usa los tokens: borde brand-dark, placeholder moss y ningún hexadecimal', () => {
    render(<TextInput label="Uno" placeholderText="Ej." value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Uno');

    expect(input).toHaveClass('h-12', 'border-brand-dark', 'placeholder:text-moss');
    expect(input.className).not.toMatch(/#99BBA8/i);
    expect(input).toHaveAttribute('placeholder', 'Ej.');
  });

  it('sin placeholderText no pinta placeholder', () => {
    render(<TextInput label="Uno" value="" onChange={() => {}} />);

    expect(screen.getByLabelText('Uno')).not.toHaveAttribute('placeholder');
  });

  it('aria-invalid y aria-describedby solo aparecen cuando se pasan', () => {
    const { rerender } = render(<TextInput label="Uno" value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Uno');

    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');

    rerender(<TextInput label="Uno" value="" onChange={() => {}} invalid describedBy="error-uno" />);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'error-uno');
  });

  it('con invalid y sin error: aria-invalid vale true y el campo lleva el borde de error (usos privados)', () => {
    render(<TextInput label="Uno" value="" onChange={() => {}} invalid describedBy="error-uno" />);
    const input = screen.getByLabelText('Uno');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('border-danger', 'ring-1', 'ring-inset', 'ring-danger');
    expect(input).toHaveAttribute('aria-describedby', 'error-uno');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('sin error ni invalid no lleva borde de error ni aria-invalid', () => {
    render(<TextInput label="Uno" value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Uno');

    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveClass('border-danger');
    expect(input).toHaveClass('border-brand-dark');
  });

  it('el hint se enlaza con aria-describedby y no es un aviso', () => {
    render(<TextInput id="uno" label="Uno" hint="Máximo 100 caracteres" value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Uno');
    const hint = screen.getByText('Máximo 100 caracteres');

    expect(hint).toHaveAttribute('id', 'uno-hint');
    expect(hint).toHaveClass('text-sm', 'text-moss');
    expect(input).toHaveAttribute('aria-describedby', 'uno-hint');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('el error es un nodo role=alert enlazado, va tras el hint y marca el campo inválido', () => {
    render(<TextInput id="uno" label="Uno" hint="Ayuda" error="Falta el dato" value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Uno');
    const hint = screen.getByText('Ayuda');
    const alerta = screen.getByRole('alert');

    expect(alerta).toHaveAttribute('id', 'uno-error');
    expect(alerta).toHaveTextContent('Falta el dato');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'uno-hint uno-error');
    expect(input).toHaveClass('border-danger', 'ring-1', 'ring-inset', 'ring-danger');
    expect(hint.compareDocumentPosition(alerta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(input.compareDocumentPosition(hint) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('une describedBy, hint y error en ese orden', () => {
    render(
      <TextInput id="uno" label="Uno" describedBy="externo" hint="Ayuda" error="Mal" value="" onChange={() => {}} />
    );

    expect(screen.getByLabelText('Uno')).toHaveAttribute('aria-describedby', 'externo uno-hint uno-error');
  });

  it('pasa type, maxLength, autoComplete, required y onBlur al campo', async () => {
    const onBlur = vi.fn();
    const user = userEvent.setup();
    render(
      <TextInput
        label="Correo"
        type="email"
        maxLength={254}
        autoComplete="email"
        required
        onBlur={onBlur}
        value=""
        onChange={() => {}}
      />
    );
    const input = screen.getByLabelText('Correo');

    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('maxLength', '254');
    expect(input).toHaveAttribute('autocomplete', 'email');
    expect(input).toBeRequired();
    await user.click(input);
    await user.tab();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('por defecto es type=text', () => {
    render(<TextInput label="Uno" value="" onChange={() => {}} />);

    expect(screen.getByLabelText('Uno')).toHaveAttribute('type', 'text');
  });

  it('multiline pinta un textarea con las mismas clases, más alto y con relleno de 12 px', () => {
    render(<TextInput label="Mensaje" multiline value="" onChange={() => {}} maxLength={2000} />);
    const area = screen.getByLabelText('Mensaje');

    expect(area.tagName).toBe('TEXTAREA');
    expect(area).not.toHaveAttribute('type');
    expect(area).toHaveAttribute('maxLength', '2000');
    expect(area).toHaveClass('min-h-32', 'py-stack-md', 'rounded-xl', 'border-brand-dark', 'focus-ring-inset');
  });

  it('el envoltorio y la etiqueta usan los tokens de espaciado (mismos 8 y 4 px de antes)', () => {
    render(<TextInput label="Uno" value="" onChange={() => {}} />);
    const input = screen.getByLabelText('Uno');

    expect(input.parentElement).toHaveClass('my-stack-sm', 'w-full');
    expect(screen.getByText('Uno')).toHaveClass('mb-stack-xs');
  });

  it('inputRef apunta al input', () => {
    const ref = createRef();
    render(<TextInput label="Uno" value="" onChange={() => {}} inputRef={ref} />);

    expect(ref.current).toBe(screen.getByLabelText('Uno'));
  });

  it('con announceError={false} el error se pinta enlazado por aria-describedby pero sin role', () => {
    render(<TextInput id="uno" label="Uno" error="Falta" announceError={false} value="" onChange={() => {}} />);

    expect(screen.queryByRole('alert')).toBeNull();
    expect(document.getElementById('uno-error')).toHaveTextContent('Falta');
    expect(screen.getByLabelText('Uno')).toHaveAttribute('aria-describedby', 'uno-error');
    expect(screen.getByLabelText('Uno')).toHaveAttribute('aria-invalid', 'true');
  });
});
