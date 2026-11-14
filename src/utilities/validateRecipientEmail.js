export const EMAIL_MAX_LENGTH = 254;
export const RECIPIENTS_MIN = 1;
export const RECIPIENTS_MAX = 5;

// Copia literal de EMAIL_PATTERN en sigmetum-backend/functions/validateContactMessage.js (línea 10), más
// FORMAT_CHARS (/\p{Cf}/u) de ese mismo archivo: el servidor rechaza los caracteres de formato (invisibles y
// de dirección, p. ej. U+200B, U+200E, U+202E). Si el servidor cambia una regla, hay que cambiar esta copia:
// el cliente valida solo por usabilidad, quien decide es el servidor.
export const RECIPIENT_EMAIL_PATTERN = /^[^\s@,;:<>()'"\\]+@[^\s@,;:<>()'"\\]+\.[^\s@,;:<>()'"\\]+$/;
// Igual que HEADER_FORBIDDEN del servidor: ningún carácter de control ni U+2028/U+2029.
const CONTROL_CHARS = /[\p{Cc}\u2028\u2029]/u;
// Igual que FORMAT_CHARS del servidor: ningún carácter de formato Unicode (categoría Cf).
const FORMAT_CHARS = /\p{Cf}/u;

export const normalizeEmail = (value) => value.trim().toLowerCase();

// Mismo nombre y misma regla que isValidEmailAddress del servidor. Recibe la dirección ya recortada.
// La usan este módulo y validateContact: una sola copia de la regla en el cliente.
export const isValidEmailAddress = (trimmed) =>
  trimmed.length <= EMAIL_MAX_LENGTH &&
  !CONTROL_CHARS.test(trimmed) &&
  !FORMAT_CHARS.test(trimmed) &&
  RECIPIENT_EMAIL_PATTERN.test(trimmed);

// Devuelve null (válido) o 'required' | 'email' | 'duplicate'. `list` es la lista del servidor,
// con la forma [{ email }]. No muta nada.
const validateRecipientEmail = (value, list = []) => {
  const address = typeof value === 'string' ? value.trim() : '';
  if (!address) return 'required';
  if (!isValidEmailAddress(address)) return 'email';
  const normalized = normalizeEmail(address);
  const isDuplicate = list.some((item) => typeof item?.email === 'string' && normalizeEmail(item.email) === normalized);
  return isDuplicate ? 'duplicate' : null;
};

export default validateRecipientEmail;
