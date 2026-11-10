import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHmac, webcrypto } from 'node:crypto';
import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js';
import { srpTimestamp, passwordClaimSignature, srpStart, srpPasswordVerifier } from './srp';

const POOL_ID = 'eu-west-1_AbC';
const POOL_NAME = 'AbC';
const USER_ID = 'b1c2d3e4-0000-4000-8000-0123456789ab';
const PASSWORD = 'Tr0ub4dor&3-contrasena-larga';
const SALT = '9f3a1c5e7b2d4f60a8c1e3b5d7f90214';
const SRP_B = ['c3', 'a1', '5e', '7f', '09', 'd2', '48', 'b6'].join('').repeat(32);
const SECRET_BLOCK = Buffer.from('bloque-secreto-de-prueba-0123456789').toString('base64');
const CHALLENGE = { USER_ID_FOR_SRP: USER_ID, SRP_B, SALT, SECRET_BLOCK };
const NOW = new Date(Date.UTC(2026, 10, 9, 7, 5, 3));

// Los números aleatorios del paquete salen de crypto.getRandomValues: con un contador se obtiene la misma A en las dos ejecuciones.
const makeDeterministic = () => {
  let counter = 0;
  vi.spyOn(window.crypto, 'getRandomValues').mockImplementation((array) => {
    for (let i = 0; i < array.length; i += 1) array[i] = Math.imul(++counter, 2654435761) >>> 0;
    return array;
  });
  return () => { counter = 0; };
};

describe('srp', () => {
  beforeEach(() => {
    if (!globalThis.crypto?.subtle) vi.stubGlobal('crypto', webcrypto);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('srpTimestamp', () => {
    it('da el formato de Cognito con un día de una cifra', () => {
      expect(srpTimestamp(NOW)).toBe('Mon Nov 9 07:05:03 UTC 2026');
    });

    it('da el formato de Cognito con un día de dos cifras', () => {
      expect(srpTimestamp(new Date(Date.UTC(2026, 11, 25, 23, 59, 59)))).toBe('Fri Dec 25 23:59:59 UTC 2026');
    });

    it('usa el día UTC aunque el día local sea otro', () => {
      const tz = process.env.TZ;
      process.env.TZ = 'Pacific/Kiritimati';
      try {
        expect(srpTimestamp(new Date(Date.UTC(2026, 10, 9, 23, 30, 0)))).toBe('Mon Nov 9 23:30:00 UTC 2026');
      } finally {
        if (tz === undefined) delete process.env.TZ;
        else process.env.TZ = tz;
      }
    });
  });

  describe('passwordClaimSignature', () => {
    it('coincide con un HMAC-SHA256 calculado con node:crypto sobre las mismas piezas', async () => {
      const hkdf = Uint8Array.from({ length: 16 }, (_, i) => i * 7 + 1);
      const timestamp = srpTimestamp(NOW);
      const expected = createHmac('sha256', Buffer.from(hkdf))
        .update(Buffer.concat([
          Buffer.from(POOL_NAME, 'utf8'),
          Buffer.from(USER_ID, 'utf8'),
          Buffer.from(SECRET_BLOCK, 'base64'),
          Buffer.from(timestamp, 'utf8'),
        ]))
        .digest('base64');

      await expect(
        passwordClaimSignature({ hkdf, poolName: POOL_NAME, userId: USER_ID, secretBlock: SECRET_BLOCK, timestamp })
      ).resolves.toBe(expected);
    });
  });

  describe('cálculo completo frente a CognitoUser.authenticateUser del paquete (oráculo)', () => {
    // Ejecuta el flujo del propio paquete (solo en el test) y captura lo que enviaría a Cognito.
    const runOracle = async () => {
      const pool = new CognitoUserPool({ UserPoolId: POOL_ID, ClientId: 'client123' });
      const captured = {};
      pool.client.request = vi.fn((operation, request, callback) => {
        if (operation === 'InitiateAuth') {
          captured.srpA = request.AuthParameters.SRP_A;
          callback(null, { ChallengeParameters: CHALLENGE });
        } else {
          captured.responses = request.ChallengeResponses;
          callback(new Error('fin del oráculo'));
        }
      });
      const user = new CognitoUser({ Username: 'persona@example.test', Pool: pool });
      await new Promise((resolve) => {
        user.authenticateUser(new AuthenticationDetails({ Username: 'persona@example.test', Password: PASSWORD }), {
          onSuccess: resolve,
          onFailure: resolve,
        });
      });
      return captured;
    };

    it('SRP_A, TIMESTAMP y PASSWORD_CLAIM_SIGNATURE son idénticos byte a byte', async () => {
      const reset = makeDeterministic();
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);

      reset();
      const oracle = await runOracle();
      reset();
      const { helper, srpA } = srpStart(POOL_NAME);
      const mine = await srpPasswordVerifier(helper, POOL_NAME, PASSWORD, CHALLENGE, NOW);

      expect(oracle.srpA).toBeTruthy();
      expect(srpA).toBe(oracle.srpA);
      expect(mine.TIMESTAMP).toBe(oracle.responses.TIMESTAMP);
      expect(mine.PASSWORD_CLAIM_SIGNATURE).toBe(oracle.responses.PASSWORD_CLAIM_SIGNATURE);
      expect(mine.USERNAME).toBe(oracle.responses.USERNAME);
      expect(mine.PASSWORD_CLAIM_SECRET_BLOCK).toBe(oracle.responses.PASSWORD_CLAIM_SECRET_BLOCK);
    });

    it('con el id de pool completo como poolName la firma no coincide (el error que hay que evitar)', async () => {
      const reset = makeDeterministic();
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(NOW);

      reset();
      const oracle = await runOracle();
      reset();
      const { helper } = srpStart(POOL_ID);
      const mine = await srpPasswordVerifier(helper, POOL_ID, PASSWORD, CHALLENGE, NOW);

      expect(mine.PASSWORD_CLAIM_SIGNATURE).not.toBe(oracle.responses.PASSWORD_CLAIM_SIGNATURE);
    });
  });

  describe('con el AuthenticationHelper real', () => {
    it('srpA es hexadecimal, la firma son 32 bytes y ningún valor contiene la contraseña', async () => {
      const { helper, srpA } = srpStart(POOL_NAME);
      const out = await srpPasswordVerifier(helper, POOL_NAME, PASSWORD, CHALLENGE, NOW);

      expect(srpA).toMatch(/^[0-9a-f]+$/);
      expect(Buffer.from(out.PASSWORD_CLAIM_SIGNATURE, 'base64')).toHaveLength(32);
      expect(out.USERNAME).toBe(USER_ID);
      expect(out.TIMESTAMP).toBe('Mon Nov 9 07:05:03 UTC 2026');
      expect(out.PASSWORD_CLAIM_SECRET_BLOCK).toBe(SECRET_BLOCK);
      expect(Object.keys(out).sort()).toEqual(['PASSWORD_CLAIM_SECRET_BLOCK', 'PASSWORD_CLAIM_SIGNATURE', 'TIMESTAMP', 'USERNAME']);
      expect(JSON.stringify([srpA, out])).not.toContain(PASSWORD);
    });

    it('rechaza (sin excepción síncrona) si el servidor envía B igual a cero', async () => {
      const { helper } = srpStart(POOL_NAME);

      await expect(
        srpPasswordVerifier(helper, POOL_NAME, PASSWORD, { ...CHALLENGE, SRP_B: '0' }, NOW)
      ).rejects.toThrow('B cannot be zero');
    });
  });
});
