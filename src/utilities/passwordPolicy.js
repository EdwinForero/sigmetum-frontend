// Ayuda en cliente: replica la política del pool (14 caracteres, minúsculas, mayúsculas, números y símbolos).
// La autoridad es Cognito; esto solo evita una petición que se sabe que será rechazada.
export const meetsPasswordPolicy = (password) =>
  password.length >= 14 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);
