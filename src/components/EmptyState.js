import React from 'react';

// Estado vacío o de error de una página: título, causa y, como mucho, una acción.
// Solo el estado de error es un aviso (role="alert"); los casos vacíos no se anuncian.
const EmptyState = ({ title, children, action, role }) => (
  <div role={role === 'alert' ? 'alert' : undefined} className="max-w-prose mt-stack-lg">
    <h2 className="text-xl font-bold text-brand-deep">{title}</h2>
    <p className="mt-stack-sm text-base text-ink-soft">{children}</p>
    {action && <div className="mt-stack-lg">{action}</div>}
  </div>
);

export default EmptyState;
