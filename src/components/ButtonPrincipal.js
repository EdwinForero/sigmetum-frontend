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
      className={`focus-ring inline-flex min-h-12 min-w-[84px] max-w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2 text-base font-bold leading-tight text-ink hover:bg-brand-dark ${state} ${className}`}
    >
      {loading && (
        <span className="material-symbols-outlined animate-spin" aria-hidden="true">progress_activity</span>
      )}
      <span>{text}</span>
    </button>
  );
};

export default ButtonPrincipal;
