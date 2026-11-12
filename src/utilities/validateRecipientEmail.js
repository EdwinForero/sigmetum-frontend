export const EMAIL_MAX_LENGTH = 254;
export const RECIPIENTS_MIN = 1;
export const RECIPIENTS_MAX = 5;

// Copia literal de EMAIL_PATTERN en sigmetum-backend/functions/validateContactMessage.js (línea 10).
// Si el servidor cambia la regla, hay que cambiar esta copia: el cliente valida solo por usabilidad,
// quien decide es el servidor.
export const RECIPIENT_EMAIL_PATTERN = /^[^\s@,;:<>()'"\\]+@[^\s@,;:<>()'"\\]+\.[^\s@,;:<>()'"\\]+$/;
// Igual que HEADER_FORBIDDEN del servidor: ningún carácter de control ni U+2028/U+2029.
const CONTROL_CHARS = /[\p{Cc}\u2028\u2029]/u;

export const normalizeEmail = (value) => value.trim().toLowerCase();

// Devuelve null (válido) o 'required' | 'email' | 'duplicate'. `list` es la lista del servidor,
// con la forma [{ email }]. No muta nada.
const validateRecipientEmail = (value, list = []) => {
  const address = typeof value === 'string' ? value.trim() : '';
  if (!address) return 'required';
  if (address.length > EMAIL_MAX_LENGTH || CONTROL_CHARS.test(address) || !RECIPIENT_EMAIL_PATTERN.test(address)) {
    return 'email';
  }
  const normalized = normalizeEmail(address);
  const isDuplicate = list.some((item) => typeof item?.email === 'string' && normalizeEmail(item.email) === normalized);
  return isDuplicate ? 'duplicate' : null;
};

export default validateRecipientEmail;
