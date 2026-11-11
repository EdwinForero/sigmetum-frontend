// Muestra la clave del MFA en grupos de 4 caracteres separados por espacios: el navegador solo parte la línea entre grupos.
// Solo es para pintar; «Copiar clave» sigue copiando la clave sin espacios.
const formatSecret = (secret) => secret?.match(/.{1,4}/g)?.join(' ') ?? '';

export default formatSecret;
