import { AuthenticationHelper } from 'amazon-cognito-identity-js';

// Cálculo SRP de Cognito sin red ni almacenamiento. Solo se usa AuthenticationHelper (importado de la raíz del
// paquete, nunca por ruta profunda); la firma y la fecha las calcula el proyecto con Web Crypto.
// `poolName` es la parte del id de pool posterior al guion bajo (<región>_<poolName>).

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const two = (n) => String(n).padStart(2, '0');

// Formato de Cognito: 'Mon Nov 9 07:05:03 UTC 2026' (UTC, día sin cero delante).
export const srpTimestamp = (date) =>
  `${DAYS[date.getUTCDay()]} ${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()} ` +
  `${two(date.getUTCHours())}:${two(date.getUTCMinutes())}:${two(date.getUTCSeconds())} UTC ${date.getUTCFullYear()}`;

const base64ToBytes = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
const bytesToBase64 = (bytes) => btoa(String.fromCharCode(...bytes));

// HMAC-SHA256(hkdf, poolName + userId + secretBlock (base64 decodificado) + timestamp), en base64.
export const passwordClaimSignature = async ({ hkdf, poolName, userId, secretBlock, timestamp }) => {
  const encoder = new TextEncoder();
  const parts = [encoder.encode(poolName), encoder.encode(userId), base64ToBytes(secretBlock), encoder.encode(timestamp)];
  const message = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  parts.forEach((part) => {
    message.set(part, offset);
    offset += part.length;
  });
  const key = await crypto.subtle.importKey('raw', hkdf, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToBase64(new Uint8Array(await crypto.subtle.sign('HMAC', key, message)));
};

// Primer paso: crea el helper (con su `a` aleatoria) y devuelve A en hexadecimal.
export const srpStart = (poolName) => {
  const helper = new AuthenticationHelper(poolName);
  let srpA;
  helper.getLargeAValue((error, value) => {
    if (error) throw error;
    srpA = value.toString(16);
  });
  return { helper, srpA };
};

// El paquete entrega el resultado por callback síncrono y lanza excepciones síncronas (p. ej. 'B cannot be zero').
const passwordKey = (helper, userId, password, serverB, salt) =>
  new Promise((resolve, reject) => {
    try {
      helper.getPasswordAuthenticationKey(userId, password, serverB, salt, (error, hkdf) => {
        if (error) reject(error);
        else resolve(Uint8Array.from(hkdf));
      });
    } catch (error) {
      reject(error);
    }
  });

// Segundo paso: respuesta al reto PASSWORD_VERIFIER. No devuelve ni conserva la contraseña.
export const srpPasswordVerifier = async (helper, poolName, password, challengeParameters, date = new Date()) => {
  const { USER_ID_FOR_SRP: userId, SRP_B, SALT, SECRET_BLOCK } = challengeParameters;
  // B y la sal deben ser del mismo BigInteger del paquete (padHex comprueba instanceof; no se exporta).
  const BigInteger = helper.N.constructor;
  const hkdf = await passwordKey(helper, userId, password, new BigInteger(SRP_B, 16), new BigInteger(SALT, 16));
  const timestamp = srpTimestamp(date);
  const signature = await passwordClaimSignature({ hkdf, poolName, userId, secretBlock: SECRET_BLOCK, timestamp });
  return {
    USERNAME: userId,
    PASSWORD_CLAIM_SECRET_BLOCK: SECRET_BLOCK,
    PASSWORD_CLAIM_SIGNATURE: signature,
    TIMESTAMP: timestamp,
  };
};
