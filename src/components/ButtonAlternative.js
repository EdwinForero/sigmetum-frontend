import { BUTTON_INACTIVE_CLASS } from './ButtonPrincipal';

// Clases del estado habilitado, exportables para los Link con aspecto de botón.
export const BUTTON_ALTERNATIVE_CLASS = 'focus-ring inline-flex min-h-12 min-w-[84px] max-w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-dark bg-surface px-5 py-2 text-base font-bold leading-tight text-brand-deep hover:bg-brand hover:text-ink';

const ButtonAlternative = ({
  onClick,
  text,
  className = '',
  type = 'button',
  disabled = false,
  loading = false,
  ...rest
}) => {
  const handleClick = (event) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    if (onClick) onClick(event);
  };

  return (
    <button
      {...rest}
      type={type}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      disabled={disabled}
      className={`${disabled ? BUTTON_INACTIVE_CLASS : `${BUTTON_ALTERNATIVE_CLASS} cursor-pointer`} ${loading ? 'cursor-progress' : ''} ${className}`}
    >
      {loading && (
        <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
      )}
      <span>{text}</span>
    </button>
  );
};

export default ButtonAlternative;
