import React from 'react';

const InlineError = ({ id, children }) => (
  <p
    id={id}
    role="alert"
    className="my-2 flex items-start gap-2 rounded-lg border border-danger p-3 font-bold text-danger"
  >
    <span className="material-symbols-outlined" aria-hidden="true">error</span>
    <span>{children}</span>
  </p>
);

export default InlineError;
