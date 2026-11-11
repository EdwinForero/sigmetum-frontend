import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

const QUIET_ZONE = 4;

// El `d` del path equivale al contenido del QR (la URI con el secreto): no se registra ni se guarda en ningún sitio.
// Devuelve solo { n, d }: el objeto del generador conserva la URI en su estado interno y no se retiene.
const buildQr = (value) => {
  if (!value) return null;
  try {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const modules = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < modules; r += 1) {
      for (let c = 0; c < modules; c += 1) {
        if (qr.isDark(r, c)) d += `M${c + QUIET_ZONE} ${r + QUIET_ZONE}h1v1h-1z`;
      }
    }
    return { n: modules + QUIET_ZONE * 2, d };
  } catch {
    // Si el valor no cabe, no se pinta el QR: la clave en texto sigue siendo la alternativa.
    return null;
  }
};

// QR local como SVG en línea (sin innerHTML, data: ni imágenes): fondo blanco y módulos en ink, con quiet zone dentro del SVG.
const QrCode = ({ value, label }) => {
  const qr = useMemo(() => buildQr(value), [value]);
  if (!qr) return null;

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${qr.n} ${qr.n}`}
      shapeRendering="crispEdges"
      className="w-48 max-w-full h-auto forced-color-adjust-none"
    >
      <rect width={qr.n} height={qr.n} fill="white" />
      <path d={qr.d} fill="#0C1811" />
    </svg>
  );
};

export default QrCode;
