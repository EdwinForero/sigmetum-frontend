// Sistema de avisos: todos sobre surface, con borde y texto del color de la variante (sin fondos tintados).
export const NOTICE_BASE = 'flex items-start gap-2 rounded-lg border p-stack-md';

const VARIANTS = {
  info: { box: 'border-moss bg-surface text-ink', icon: 'info', iconClass: 'text-moss' },
  success: { box: 'border-brand-deep bg-surface text-ink', icon: 'check_circle', iconClass: 'text-brand-deep' },
  warning: { box: 'border-warning bg-surface text-ink', icon: 'warning', iconClass: 'text-warning' },
  error: { box: 'border-danger bg-surface text-danger', icon: 'error', iconClass: 'text-danger' },
};

export const noticeVariant = (variant) => VARIANTS[variant] ?? VARIANTS.info;
