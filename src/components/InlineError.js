import React from 'react';
import { NOTICE_BASE, noticeVariant } from '../utilities/noticeStyles';

const { box, icon, iconClass } = noticeVariant('error');

// announce={false} pinta el aviso sin role: lo leerá el foco (aria-describedby) o un resumen aparte, sin anuncio doble.
const InlineError = ({ id, announce = true, children }) => (
  <p
    id={id}
    role={announce ? 'alert' : undefined}
    className={`my-2 font-bold ${NOTICE_BASE} ${box}`}
  >
    <span className={`material-symbols-outlined ${iconClass}`} aria-hidden="true">{icon}</span>
    <span>{children}</span>
  </p>
);

export default InlineError;
