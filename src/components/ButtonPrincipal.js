const BUTTON_SHAPE = 'focus-ring inline-flex min-h-12 min-w-[84px] max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-base font-bold leading-tight';

// Clases exportables para los Link con aspecto de botón.
export const BUTTON_PRINCIPAL_CLASS = `${BUTTON_SHAPE} bg-brand text-ink hover:bg-brand-dark`;
export const BUTTON_INACTIVE_CLASS = `${BUTTON_SHAPE} border-2 border-dashed border-moss bg-surface text-moss cursor-not-allowed`;

const ButtonPrincipal = ({
  onClick,
  text,
  icon,
  ariaLabel,
  type = 'button',
  className = '',
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

  const state = `${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${loading ? 'cursor-progress' : ''}`;

  return icon ? (
    <button
      {...rest}
      type={type}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      disabled={disabled}
      className={`focus-ring inline-flex h-12 w-12 items-center justify-center rounded-xl text-brand-dark hover:bg-brand hover:text-ink ${state} ${className}`}
    >
      <span className={`material-symbols-outlined text-3xl ${loading ? 'animate-spin' : ''}`} aria-hidden="true">
        {loading ? 'progress_activity' : icon}
      </span>
    </button>
  ) : (
    <button
      {...rest}
      type={type}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={handleClick}
      disabled={disabled}
      className={`${disabled ? BUTTON_INACTIVE_CLASS : `${BUTTON_PRINCIPAL_CLASS} cursor-pointer`} ${loading ? 'cursor-progress' : ''} ${className}`}
    >
      {loading && (
        <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
      )}
      <span>{text}</span>
    </button>
  );
};

export default ButtonPrincipal;
