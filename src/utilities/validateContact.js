export const MESSAGE_MIN_LENGTH = 20;

// Expresión fija, sin entrada del usuario. La validación en cliente no sustituye a la del servidor.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Igual que el servidor: un correo con caracteres de formato (categoría Cf: invisibles, de dirección) no vale.
const FORMAT_CHARS = /\p{Cf}/u;

const REQUIRED = { key: 'form.errors.required' };

// Devuelve { [campo]: { key, count? } } solo con los campos inválidos; no muta la entrada.
const validateContact = ({ username, email, subject, message }) => {
  const errors = {};
  const name = username.trim();
  const address = email.trim();
  const topic = subject.trim();
  const body = message.trim();

  if (!name) errors.username = REQUIRED;
  if (!address) errors.email = REQUIRED;
  else if (!EMAIL_PATTERN.test(address) || FORMAT_CHARS.test(address)) errors.email = { key: 'form.errors.email' };
  if (!topic) errors.subject = REQUIRED;
  if (!body) errors.message = REQUIRED;
  else if (body.length < MESSAGE_MIN_LENGTH) {
    errors.message = { key: 'form.errors.minLength', count: MESSAGE_MIN_LENGTH };
  }

  return errors;
};

export default validateContact;
