import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, createEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import qrcode from 'qrcode-generator';

const EMAIL = 'persona@example.test';
const PASSWORD = 'Contrasena-Actual-9!';
const NEW_PASSWORD = 'Abcdefghij1!kl';
const CODE = '123456';
const USER_ID = 'b1c2d3e4-0000-4000-8000-0123456789ab';
const SECRET = 'JBSWY3DPEHPK3PXP';
const SECRET_GROUPED = 'JBSW Y3DP EHPK 3PXP';
const OTHER_SECRET = 'OTROSECRETO234567';
const OTHER_SECRET_GROUPED = 'OTRO SECR ETO2 3456 7';
const OTP_URI = `otpauth://totp/SIGMETUM-A:${encodeURIComponent(EMAIL)}?secret=${SECRET}&issuer=SIGMETUM-A`;
const SRP_CHALLENGE = {
  USER_ID_FOR_SRP: USER_ID,
  SRP_B: 'c3a15e7f09d248b6'.repeat(32),
  SALT: '9f3a1c5e7b2d4f60a8c1e3b5d7f90214',
  SECRET_BLOCK: Buffer.from('bloque-secreto-de-prueba').toString('base64'),
};
const SLOW = { timeout: 15000 };

const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
const fail = (status, type) => json(status, { __type: type, message: 'detalle que no se debe mostrar' });
const challenge = (name, Session) => json(200, { ChallengeName: name, Session });
const tokens = () => json(200, { AuthenticationResult: { AccessToken: 'A', IdToken: 'I', RefreshToken: 'R' } });
const srpChallenge = () => json(200, { ChallengeName: 'PASSWORD_VERIFIER', ChallengeParameters: SRP_CHALLENGE, Session: 'S1' });
const queue = (...responses) => () => responses.shift();

describe('LoginForm', () => {
  let LoginForm;
  let fetchMock;
  let user;

  const actionOf = (call) => call[1].headers['X-Amz-Target'].split('.')[1];
  const bodyOf = (call) => JSON.parse(call[1].body);
  const callsOf = (action) => fetchMock.mock.calls.filter((call) => actionOf(call) === action);

  // Enruta por X-Amz-Target: cada ruta es una respuesta o una función (cuerpo) => respuesta.
  const route = (routes) => {
    fetchMock.mockImplementation(async (url, options) => {
      const action = options.headers['X-Amz-Target'].split('.')[1];
      const handler = routes[action];
      if (!handler) throw new Error(`sin ruta para ${action}`);
      return typeof handler === 'function' ? handler(JSON.parse(options.body)) : handler;
    });
  };

  const renderForm = (wrapper = ({ children }) => children) =>
    render(
      wrapper({
        children: (
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginForm />} />
              <Route path="/cargar-archivos" element={<p>pagina-archivos</p>} />
            </Routes>
          </MemoryRouter>
        ),
      })
    );

  const fillCredentials = async (password = PASSWORD) => {
    await user.type(screen.getByLabelText('login.emailLabel'), EMAIL);
    await user.type(screen.getByLabelText('login.passwordLabel'), password);
  };
  const submitCredentials = async () => {
    await fillCredentials();
    await user.click(screen.getByRole('button', { name: 'login.logInButton' }));
  };
  const h2 = (name) => screen.findByRole('heading', { level: 2, name }, { timeout: 10000 });

  beforeEach(async () => {
    vi.stubEnv('VITE_COGNITO_USER_POOL_ID', 'eu-west-1_AbC');
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'client123');
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    user = userEvent.setup();
    vi.resetModules();
    LoginForm = (await import('./LoginForm')).default;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('tiene un h1, los campos con su autocomplete, sin atributo name, sin enlaces y con un estado role=status', () => {
    renderForm();

    expect(screen.getByRole('heading', { level: 1, name: 'login.title' })).toBeInTheDocument();
    const email = screen.getByLabelText('login.emailLabel');
    const password = screen.getByLabelText('login.passwordLabel');
    expect(email).toHaveAttribute('type', 'email');
    expect(email).toHaveAttribute('autocomplete', 'username');
    expect(email).toHaveAttribute('maxlength', '254');
    expect(email).toBeRequired();
    expect(password).toHaveAttribute('type', 'password');
    expect(password).toHaveAttribute('autocomplete', 'current-password');
    expect(password).toHaveAttribute('maxlength', '256');
    expect(email).not.toHaveAttribute('name');
    expect(password).not.toHaveAttribute('name');
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'login.logInButton' })).toHaveAttribute('type', 'submit');
    expect(document.querySelector('form')).toHaveAttribute('method', 'post');
  });

  it('campos vacíos: requiredFields y ninguna petición', async () => {
    renderForm();

    await user.click(screen.getByRole('button', { name: 'login.logInButton' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('login.requiredFields');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('el aviso de error lleva icono decorativo, borde y texto danger, y el texto en su propio span', async () => {
    renderForm();

    await user.click(screen.getByRole('button', { name: 'login.logInButton' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveClass('border-danger', 'text-danger', 'flex', 'items-start', 'gap-2');
    expect(alert.className).not.toMatch(/#0C1811/);
    const icon = alert.querySelector('.material-symbols-outlined');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toHaveTextContent('error');
    expect(screen.getByText('login.requiredFields').tagName).toBe('SPAN');
    expect(alert).toHaveAttribute('id');
  });

  it('solo estilos: el aviso usa las clases base del sistema de avisos y los campos usan tokens y rounded-xl', async () => {
    const { container } = renderForm();

    await user.click(screen.getByRole('button', { name: 'login.logInButton' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveClass('rounded-lg', 'border', 'p-stack-md', 'bg-surface', 'border-danger', 'text-danger');
    expect(alert).toHaveClass('mx-4', 'mb-4');
    const campo = screen.getByLabelText('login.emailLabel');
    expect(campo).toHaveClass('rounded-xl', 'border-moss', 'bg-white', 'text-ink');
    expect(screen.getByLabelText('login.passwordLabel')).toHaveClass('rounded-xl');
    expect(screen.getByRole('button', { name: 'login.showPassword' })).toHaveClass('text-moss');
    expect(container.innerHTML).not.toMatch(/\[#|#[0-9A-Fa-f]{6}/);
  });

  it('acceso con TOTP: reto SOFTWARE_TOKEN_MFA con el foco en el h2, tokens guardados y navegación', SLOW, async () => {
    route({
      InitiateAuth: srpChallenge,
      RespondToAuthChallenge: queue(challenge('SOFTWARE_TOKEN_MFA', 'S2'), tokens()),
    });
    renderForm();

    await submitCredentials();

    const title = await h2('login.totpTitle');
    expect(title).toHaveFocus();
    expect(title).toHaveClass('focus-heading');
    expect(title).not.toHaveClass('focus-ring');
    expect(screen.getByLabelText('login.codeLabel')).toHaveAttribute('autocomplete', 'one-time-code');
    await user.type(screen.getByLabelText('login.codeLabel'), CODE);
    await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));

    expect(await screen.findByText('pagina-archivos')).toBeInTheDocument();
    const last = bodyOf(fetchMock.mock.calls[2]);
    expect(last).toMatchObject({ ChallengeName: 'SOFTWARE_TOKEN_MFA', Session: 'S2' });
    expect(last.ChallengeResponses).toEqual({ USERNAME: USER_ID, SOFTWARE_TOKEN_MFA_CODE: CODE });
    expect(localStorage.getItem('token')).toBe('A');
    expect(localStorage.getItem('refreshToken')).toBe('R');
    expect(Object.values({ ...localStorage })).not.toContain('I');
  });

  it.each([
    ['NotAuthorizedException', 400],
    ['UserNotFoundException', 400],
    ['PasswordResetRequiredException', 400],
    ['UserNotConfirmedException', 400],
  ])('%s da el mismo texto de credenciales, vacía la contraseña y lleva el foco a ella', SLOW, async (type, status) => {
    route({ InitiateAuth: fail(status, type) });
    renderForm();

    await submitCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent('login.credentialsError');
    const password = screen.getByLabelText('login.passwordLabel');
    expect(password).toHaveValue('');
    expect(password).toHaveFocus();
    expect(screen.getByLabelText('login.emailLabel')).toHaveValue(EMAIL);
  });

  it.each([
    ['un fallo de red', () => fetchMock.mockRejectedValue(new TypeError('failed'))],
    ['un 500', () => route({ InitiateAuth: fail(500, 'InternalFailure') })],
    ['TooManyRequestsException', () => route({ InitiateAuth: fail(400, 'TooManyRequestsException') })],
  ])('%s da serviceUnavailable', SLOW, async (_name, arrange) => {
    arrange();
    renderForm();

    await submitCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent('login.serviceUnavailable');
  });

  it('con la configuración de Cognito vacía da startError sin llamar a fetch', async () => {
    vi.stubEnv('VITE_COGNITO_USER_POOL_ID', '');
    vi.resetModules();
    LoginForm = (await import('./LoginForm')).default;
    renderForm();

    await submitCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent('login.startError');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('un código erróneo permite reintentar con un solo InitiateAuth', SLOW, async () => {
    route({
      InitiateAuth: srpChallenge,
      RespondToAuthChallenge: queue(
        challenge('SOFTWARE_TOKEN_MFA', 'S2'),
        fail(400, 'CodeMismatchException'),
        tokens()
      ),
    });
    renderForm();
    await submitCredentials();
    await h2('login.totpTitle');

    await user.type(screen.getByLabelText('login.codeLabel'), '000000');
    await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('login.codeError');
    const code = screen.getByLabelText('login.codeLabel');
    expect(code).toHaveValue('');
    expect(code).toHaveFocus();
    await user.type(code, CODE);
    await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));

    expect(await screen.findByText('pagina-archivos')).toBeInTheDocument();
    expect(callsOf('InitiateAuth')).toHaveLength(1);
  });

  it('un código con formato incorrecto da codeFormatError sin petición', SLOW, async () => {
    route({ InitiateAuth: srpChallenge, RespondToAuthChallenge: challenge('SOFTWARE_TOKEN_MFA', 'S2') });
    renderForm();
    await submitCredentials();
    await h2('login.totpTitle');
    const before = fetchMock.mock.calls.length;

    await user.type(screen.getByLabelText('login.codeLabel'), '12ab');
    await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('login.codeFormatError');
    expect(fetchMock.mock.calls).toHaveLength(before);
  });

  it('la sesión del reto caducada vuelve al primer paso con aviso y el foco en el correo', SLOW, async () => {
    route({
      InitiateAuth: srpChallenge,
      RespondToAuthChallenge: queue(challenge('SOFTWARE_TOKEN_MFA', 'S2'), fail(400, 'NotAuthorizedException')),
    });
    renderForm();
    await submitCredentials();
    await h2('login.totpTitle');

    await user.type(screen.getByLabelText('login.codeLabel'), CODE);
    await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('login.sessionExpired');
    expect(screen.getByLabelText('login.emailLabel')).toHaveFocus();
    expect(screen.getByLabelText('login.passwordLabel')).toHaveValue('');
  });

  it('si la sesión se pierde tras un código erróneo, el aviso no sugiere que pasó demasiado tiempo', SLOW, async () => {
    route({
      InitiateAuth: srpChallenge,
      RespondToAuthChallenge: queue(
        challenge('SOFTWARE_TOKEN_MFA', 'S2'),
        fail(400, 'CodeMismatchException'),
        fail(400, 'NotAuthorizedException')
      ),
    });
    renderForm();
    await submitCredentials();
    await h2('login.totpTitle');
    await user.type(screen.getByLabelText('login.codeLabel'), '000000');
    await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));
    await screen.findByText('login.codeError');

    await user.type(screen.getByLabelText('login.codeLabel'), CODE);
    await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('login.codeSessionLost');
    expect(screen.queryByText('login.sessionExpired')).toBeNull();
  });

  it('cualquier otro reto da startError', SLOW, async () => {
    route({ InitiateAuth: srpChallenge, RespondToAuthChallenge: challenge('SELECT_MFA_TYPE', 'S2') });
    renderForm();

    await submitCredentials();

    expect(await screen.findByRole('alert')).toHaveTextContent('login.startError');
  });

  describe('primer acceso', () => {
    const goToNewPassword = async () => {
      await submitCredentials();
      await h2('login.newPasswordTitle');
    };
    const fillNewPassword = async (password, confirmation = password) => {
      await user.type(screen.getByLabelText('login.newPasswordLabel'), password);
      await user.type(screen.getByLabelText('login.confirmPasswordLabel'), confirmation);
    };
    const copyClipboard = (writeText) =>
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    afterEach(() => {
      delete navigator.clipboard;
    });

    it('política, contraseñas distintas y InvalidPasswordException se tratan sin salir del paso', SLOW, async () => {
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: queue(challenge('NEW_PASSWORD_REQUIRED', 'S2'), fail(400, 'InvalidPasswordException')),
      });
      renderForm();
      await goToNewPassword();
      const username = screen.getByDisplayValue(EMAIL);
      expect(username).toHaveAttribute('readonly');
      expect(username).toHaveAttribute('autocomplete', 'username');
      expect(screen.getByLabelText('login.newPasswordLabel')).toHaveAttribute('autocomplete', 'new-password');
      const before = fetchMock.mock.calls.length;

      await fillNewPassword('corta');
      await user.click(screen.getByRole('button', { name: 'login.continueButton' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('login.passwordPolicyError');

      await fillNewPassword(NEW_PASSWORD, 'Otra-Distinta-1!aa');
      await user.click(screen.getByRole('button', { name: 'login.continueButton' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('login.passwordMismatch');
      expect(fetchMock.mock.calls).toHaveLength(before);

      await fillNewPassword(NEW_PASSWORD);
      await user.click(screen.getByRole('button', { name: 'login.continueButton' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('login.passwordRejected');
      expect(screen.getByLabelText('login.newPasswordLabel')).toHaveValue('');
    });

    it('flujo completo: contraseña nueva, MFA_SETUP con un solo AssociateSoftwareToken, copia anunciada y acceso', SLOW, async () => {
      const writeText = vi.fn().mockResolvedValue();
      copyClipboard(writeText);
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: queue(challenge('NEW_PASSWORD_REQUIRED', 'S2'), challenge('MFA_SETUP', 'S3'), tokens()),
        AssociateSoftwareToken: json(200, { SecretCode: SECRET, Session: 'S4' }),
        VerifySoftwareToken: json(200, { Status: 'SUCCESS', Session: 'S5' }),
      });
      renderForm(({ children }) => <StrictMode>{children}</StrictMode>);
      await goToNewPassword();

      await fillNewPassword(NEW_PASSWORD);
      await user.click(screen.getByRole('button', { name: 'login.continueButton' }));

      await h2('login.mfaSetupTitle');
      expect(callsOf('AssociateSoftwareToken')).toHaveLength(1);
      expect(bodyOf(callsOf('AssociateSoftwareToken')[0])).toEqual({ Session: 'S3' });
      expect(bodyOf(fetchMock.mock.calls[2]).ChallengeResponses).toEqual({ USERNAME: USER_ID, NEW_PASSWORD });
      expect(screen.getByText(SECRET_GROUPED).tagName).toBe('CODE');
      expect(screen.queryAllByRole('link')).toHaveLength(0);
      expect(screen.queryByText('login.mfaSetupAgain')).toBeNull();

      const copy = screen.getByRole('button', { name: 'login.copyButton' });
      expect(copy.closest('form')).toBeNull();
      await user.click(copy);
      expect(writeText).toHaveBeenCalledWith(SECRET);
      expect(await screen.findByRole('status')).toHaveTextContent('login.copied');

      await user.type(screen.getByLabelText('login.codeLabel'), CODE);
      await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));

      expect(await screen.findByText('pagina-archivos')).toBeInTheDocument();
      expect(bodyOf(callsOf('VerifySoftwareToken')[0])).toEqual({ Session: 'S4', UserCode: CODE });
      expect(bodyOf(fetchMock.mock.calls.at(-1))).toMatchObject({ ChallengeName: 'MFA_SETUP', Session: 'S5' });
      expect(bodyOf(fetchMock.mock.calls.at(-1)).ChallengeResponses).toEqual({ USERNAME: USER_ID });
      expect(callsOf('AssociateSoftwareToken')).toHaveLength(1);
    });

    it('si falla la copia lo anuncia y sin portapapeles no hay botón de copiar', SLOW, async () => {
      copyClipboard(vi.fn().mockRejectedValue(new Error('denegado')));
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: challenge('MFA_SETUP', 'S3'),
        AssociateSoftwareToken: json(200, { SecretCode: SECRET, Session: 'S4' }),
      });
      renderForm();
      await submitCredentials();
      await h2('login.mfaSetupTitle');

      await user.click(screen.getByRole('button', { name: 'login.copyButton' }));

      expect(await screen.findByText('login.copyFailed')).toBeInTheDocument();
    });

    it('sin navigator.clipboard no aparece el botón de copiar', SLOW, async () => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: challenge('MFA_SETUP', 'S3'),
        AssociateSoftwareToken: json(200, { SecretCode: SECRET, Session: 'S4' }),
      });
      renderForm();
      await submitCredentials();
      await h2('login.mfaSetupTitle');

      expect(screen.queryByRole('button', { name: 'login.copyButton' })).toBeNull();
    });

    it('un MFA_SETUP repetido genera otro secreto y avisa de que el anterior quedó obsoleto', SLOW, async () => {
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: queue(challenge('MFA_SETUP', 'S3'), challenge('MFA_SETUP', 'S6')),
        AssociateSoftwareToken: queue(
          json(200, { SecretCode: SECRET, Session: 'S4' }),
          json(200, { SecretCode: OTHER_SECRET, Session: 'S7' })
        ),
        VerifySoftwareToken: json(200, { Status: 'SUCCESS', Session: 'S5' }),
      });
      renderForm();
      await submitCredentials();
      await h2('login.mfaSetupTitle');

      await user.type(screen.getByLabelText('login.codeLabel'), CODE);
      await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));

      expect(await screen.findByText(OTHER_SECRET_GROUPED)).toBeInTheDocument();
      expect(screen.getByText('login.mfaSetupAgain')).toBeInTheDocument();
      expect(screen.queryByText(SECRET_GROUPED)).toBeNull();
    });

    it('al volver al primer paso se vacían el secreto y la dirección', SLOW, async () => {
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: challenge('MFA_SETUP', 'S3'),
        AssociateSoftwareToken: json(200, { SecretCode: SECRET, Session: 'S4' }),
        VerifySoftwareToken: fail(400, 'NotAuthorizedException'),
      });
      renderForm();
      await submitCredentials();
      await h2('login.mfaSetupTitle');

      await user.type(screen.getByLabelText('login.codeLabel'), CODE);
      await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('login.sessionExpired');
      expect(screen.queryByText(SECRET_GROUPED)).toBeNull();
      expect(screen.queryByRole('img')).toBeNull();
      expect(document.body.textContent).not.toContain('otpauth://');
    });

    const toMfaSetupAfterNewPassword = async () => {
      await goToNewPassword();
      await fillNewPassword(NEW_PASSWORD);
      await user.click(screen.getByRole('button', { name: 'login.continueButton' }));
    };
    const newPasswordCalls = () => callsOf('RespondToAuthChallenge').filter((call) => bodyOf(call).ChallengeName === 'NEW_PASSWORD_REQUIRED');

    it.each([
      ['un fallo de red', () => { throw new TypeError('failed'); }],
      ['un 500', () => fail(500, 'InternalFailure')],
      ['un 429', () => fail(429, 'TooManyRequestsException')],
    ])('si AssociateSoftwareToken falla (%s) tras la contraseña nueva, el reintento repite solo Associate y no vuelve a mandar NEW_PASSWORD', SLOW, async (_name, failure) => {
      let associateCalls = 0;
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: queue(challenge('NEW_PASSWORD_REQUIRED', 'S2'), challenge('MFA_SETUP', 'S3')),
        AssociateSoftwareToken: () => (associateCalls++ === 0 ? failure() : json(200, { SecretCode: SECRET, Session: 'S4' })),
      });
      renderForm();

      await toMfaSetupAfterNewPassword();

      expect(await screen.findByRole('alert')).toHaveTextContent('login.serviceUnavailable');
      await h2('login.mfaSetupTitle');
      expect(screen.queryByLabelText('login.codeLabel')).toBeNull();
      expect(screen.queryByRole('img')).toBeNull();
      expect(screen.queryByText('login.credentialsError')).toBeNull();
      await user.click(screen.getByRole('button', { name: 'login.retryButton' }));

      expect(await screen.findByText(SECRET_GROUPED)).toBeInTheDocument();
      expect(callsOf('AssociateSoftwareToken')).toHaveLength(2);
      callsOf('AssociateSoftwareToken').forEach((call) => expect(bodyOf(call)).toEqual({ Session: 'S3' }));
      expect(newPasswordCalls()).toHaveLength(1);
      expect(screen.getByLabelText('login.codeLabel')).toBeInTheDocument();
    });

    it('un NotAuthorizedException en AssociateSoftwareToken da sessionExpired, no el aviso de credenciales', SLOW, async () => {
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: queue(challenge('NEW_PASSWORD_REQUIRED', 'S2'), challenge('MFA_SETUP', 'S3')),
        AssociateSoftwareToken: fail(400, 'NotAuthorizedException'),
      });
      renderForm();

      await toMfaSetupAfterNewPassword();

      expect(await screen.findByRole('alert')).toHaveTextContent('login.sessionExpired');
      expect(screen.getByLabelText('login.emailLabel')).toBeInTheDocument();
    });

    it('un MFA_SETUP al iniciar sesión cuyo Associate falla de forma reintentable también ofrece reintentar', SLOW, async () => {
      let associateCalls = 0;
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: challenge('MFA_SETUP', 'S3'),
        AssociateSoftwareToken: () => (associateCalls++ === 0 ? fail(500, 'InternalFailure') : json(200, { SecretCode: SECRET, Session: 'S4' })),
      });
      renderForm();

      await submitCredentials();

      expect(await screen.findByRole('alert')).toHaveTextContent('login.serviceUnavailable');
      await user.click(await screen.findByRole('button', { name: 'login.retryButton' }));
      expect(await screen.findByText(SECRET_GROUPED)).toBeInTheDocument();
    });

    it('un Associate sin SecretCode da startError y no pinta secret=undefined', SLOW, async () => {
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: challenge('MFA_SETUP', 'S3'),
        AssociateSoftwareToken: json(200, { Session: 'S4' }),
      });
      renderForm();

      await submitCredentials();

      expect(await screen.findByRole('alert')).toHaveTextContent('login.startError');
      expect(document.body.textContent).not.toContain('undefined');
      expect(screen.getByLabelText('login.emailLabel')).toBeInTheDocument();
    });

    it('si VerifySoftwareToken va bien y la respuesta MFA_SETUP falla de forma reintentable, el reintento no vuelve a verificar el código', SLOW, async () => {
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: queue(challenge('MFA_SETUP', 'S3'), fail(500, 'InternalFailure'), tokens()),
        AssociateSoftwareToken: json(200, { SecretCode: SECRET, Session: 'S4' }),
        VerifySoftwareToken: json(200, { Status: 'SUCCESS', Session: 'S5' }),
      });
      renderForm();
      await submitCredentials();
      await h2('login.mfaSetupTitle');
      await user.type(screen.getByLabelText('login.codeLabel'), CODE);
      await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('login.serviceUnavailable');
      await user.click(screen.getByRole('button', { name: 'login.retryButton' }));

      expect(await screen.findByText('pagina-archivos')).toBeInTheDocument();
      expect(callsOf('VerifySoftwareToken')).toHaveLength(1);
      expect(bodyOf(callsOf('RespondToAuthChallenge').at(-1))).toMatchObject({ ChallengeName: 'MFA_SETUP', Session: 'S5' });
      expect(callsOf('AssociateSoftwareToken')).toHaveLength(1);
    });

    it('el botón de copiar queda junto a la clave, fuera del form y antes del campo del código en el orden del DOM', SLOW, async () => {
      copyClipboard(vi.fn().mockResolvedValue());
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: challenge('MFA_SETUP', 'S3'),
        AssociateSoftwareToken: json(200, { SecretCode: SECRET, Session: 'S4' }),
      });
      renderForm();
      await submitCredentials();
      await h2('login.mfaSetupTitle');

      const copy = screen.getByRole('button', { name: 'login.copyButton' });

      expect(copy.closest('form')).toBeNull();
      expect(screen.getByText(SECRET_GROUPED).compareDocumentPosition(copy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(copy.compareDocumentPosition(screen.getByLabelText('login.codeLabel')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('el orden del DOM en mfaSetup es ayuda, clave, copiar, QR, campo del código y botón', SLOW, async () => {
      copyClipboard(vi.fn().mockResolvedValue());
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: challenge('MFA_SETUP', 'S3'),
        AssociateSoftwareToken: json(200, { SecretCode: SECRET, Session: 'S4' }),
      });
      renderForm();
      await submitCredentials();
      await h2('login.mfaSetupTitle');

      const ordered = [
        screen.getByText('login.mfaSetupHelp'),
        screen.getByText(SECRET_GROUPED),
        screen.getByRole('button', { name: 'login.copyButton' }),
        screen.getByRole('img', { name: 'login.qrLabel' }),
        screen.getByLabelText('login.codeLabel'),
        screen.getByRole('button', { name: 'login.verifyButton' }),
      ];

      ordered.slice(1).forEach((node, index) => {
        expect(ordered[index].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      });
    });

    it('muestra el QR de la URI esperada (no del secreto), sin otpauth ni el secreto sin espacios en pantalla y sin más peticiones que a cognito-idp', SLOW, async () => {
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: challenge('MFA_SETUP', 'S3'),
        AssociateSoftwareToken: json(200, { SecretCode: SECRET, Session: 'S4' }),
      });
      renderForm();
      await submitCredentials();
      await h2('login.mfaSetupTitle');

      const svg = screen.getByRole('img', { name: 'login.qrLabel' });
      const expected = qrcode(0, 'M');
      expected.addData(OTP_URI);
      expected.make();
      const modules = expected.getModuleCount();
      const painted = Array.from({ length: modules }, () => Array(modules).fill(false));
      for (const [, x, y] of svg.querySelector('path').getAttribute('d').matchAll(/M(\d+) (\d+)h1v1h-1z/g)) painted[Number(y) - 4][Number(x) - 4] = true;
      const reference = Array.from({ length: modules }, (_, r) => Array.from({ length: modules }, (_, c) => expected.isDark(r, c)));
      expect(painted).toEqual(reference);

      expect(document.body.textContent).not.toContain('otpauth');
      expect(document.body.textContent).not.toContain(SECRET);
      expect(document.body.innerHTML).not.toContain('otpauth');
      expect(document.body.innerHTML).not.toContain(SECRET);
      expect(document.querySelector('img')).toBeNull();
      expect(screen.queryAllByRole('link')).toHaveLength(0);
      expect(fetchMock.mock.calls.length).toBeGreaterThan(0);
      fetchMock.mock.calls.forEach((call) => expect(String(call[0])).toMatch(/^https:\/\/cognito-idp\./));
    });

    it('con un secreto nuevo (MFA_SETUP repetido) el QR cambia con él', SLOW, async () => {
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: queue(challenge('MFA_SETUP', 'S3'), challenge('MFA_SETUP', 'S6')),
        AssociateSoftwareToken: queue(
          json(200, { SecretCode: SECRET, Session: 'S4' }),
          json(200, { SecretCode: OTHER_SECRET, Session: 'S7' })
        ),
        VerifySoftwareToken: json(200, { Status: 'SUCCESS', Session: 'S5' }),
      });
      renderForm();
      await submitCredentials();
      await h2('login.mfaSetupTitle');
      const before = screen.getByRole('img', { name: 'login.qrLabel' }).innerHTML;

      await user.type(screen.getByLabelText('login.codeLabel'), CODE);
      await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));
      await screen.findByText(OTHER_SECRET_GROUPED);

      expect(screen.getByRole('img', { name: 'login.qrLabel' }).innerHTML).not.toBe(before);
    });
  });

  it('un código pegado con espacios ("123 456") se limpia y se envía completo', SLOW, async () => {
    route({
      InitiateAuth: srpChallenge,
      RespondToAuthChallenge: queue(challenge('SOFTWARE_TOKEN_MFA', 'S2'), tokens()),
    });
    renderForm();
    await submitCredentials();
    await h2('login.totpTitle');

    await user.type(screen.getByLabelText('login.codeLabel'), '123 456');
    await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));

    expect(await screen.findByText('pagina-archivos')).toBeInTheDocument();
    expect(bodyOf(callsOf('RespondToAuthChallenge').at(-1)).ChallengeResponses.SOFTWARE_TOKEN_MFA_CODE).toBe(CODE);
  });

  it('con el correo vacío y la contraseña escrita el foco va al correo, y el campo vacío lleva aria-invalid', async () => {
    renderForm();

    await user.type(screen.getByLabelText('login.passwordLabel'), PASSWORD);
    await user.click(screen.getByRole('button', { name: 'login.logInButton' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('login.requiredFields');
    const email = screen.getByLabelText('login.emailLabel');
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('con la contraseña vacía el foco va a la contraseña y el correo escrito no se marca como inválido', async () => {
    renderForm();

    await user.type(screen.getByLabelText('login.emailLabel'), EMAIL);
    await user.click(screen.getByRole('button', { name: 'login.logInButton' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('login.requiredFields');
    expect(screen.getByLabelText('login.passwordLabel')).toHaveFocus();
    expect(screen.getByLabelText('login.passwordLabel')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('login.emailLabel')).not.toHaveAttribute('aria-invalid');
  });

  it('un error que no es de validación no pone aria-invalid en los campos', SLOW, async () => {
    route({ InitiateAuth: fail(400, 'NotAuthorizedException') });
    renderForm();

    await submitCredentials();

    await screen.findByRole('alert');
    expect(screen.getByLabelText('login.emailLabel')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByLabelText('login.passwordLabel')).not.toHaveAttribute('aria-invalid');
  });

  it('un error de validación del código pone aria-invalid en el campo del código', SLOW, async () => {
    route({ InitiateAuth: srpChallenge, RespondToAuthChallenge: challenge('SOFTWARE_TOKEN_MFA', 'S2') });
    renderForm();
    await submitCredentials();
    await h2('login.totpTitle');

    await user.type(screen.getByLabelText('login.codeLabel'), '12ab');
    await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));

    await screen.findByText('login.codeFormatError');
    expect(screen.getByLabelText('login.codeLabel')).toHaveAttribute('aria-invalid', 'true');
  });

  it('un doble envío en el mismo tick solo hace un InitiateAuth (lo impide busyRef, no disabled)', SLOW, async () => {
    route({ InitiateAuth: fail(400, 'NotAuthorizedException') });
    renderForm();
    await fillCredentials();
    const form = document.querySelector('form');

    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(await screen.findByRole('alert')).toHaveTextContent('login.credentialsError');
    expect(callsOf('InitiateAuth')).toHaveLength(1);
  });

  it('mientras dura la petición muestra login.loading en role=status y deshabilita el botón', SLOW, async () => {
    let release;
    route({ InitiateAuth: () => new Promise((resolve) => { release = () => resolve(fail(400, 'NotAuthorizedException')); }) });
    renderForm();
    await submitCredentials();

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('login.loading'));
    expect(screen.getByRole('button', { name: 'login.logInButton' })).toBeDisabled();
    release();

    await screen.findByRole('alert');
    expect(screen.getByRole('status')).not.toHaveTextContent('login.loading');
  });

  it('el envío empieza con preventDefault: aunque falle, no hay navegación ni cambia la dirección', SLOW, async () => {
    fetchMock.mockRejectedValue(new TypeError('failed'));
    const historyLength = window.history.length;
    const href = window.location.href;
    renderForm();
    await fillCredentials();
    const form = document.querySelector('form');

    const event = createEvent.submit(form);
    fireEvent(form, event);

    expect(event.defaultPrevented).toBe(true);
    await screen.findByRole('alert');
    expect(window.history.length).toBe(historyLength);
    expect(window.location.href).toBe(href);
    expect(window.location.href).not.toContain(encodeURIComponent(PASSWORD));
  });

  describe('mostrar u ocultar la contraseña', () => {
    const SHOW = { name: 'login.showPassword' };
    const SHOW_NEW = { name: 'login.showNewPassword' };
    const SHOW_CONFIRM = { name: 'login.showConfirmPassword' };
    const passwordInput = () => screen.getByLabelText('login.passwordLabel');
    const goToNewPassword = async () => {
      route({ InitiateAuth: srpChallenge, RespondToAuthChallenge: challenge('NEW_PASSWORD_REQUIRED', 'S2') });
      renderForm();
      await submitCredentials();
      await h2('login.newPasswordTitle');
    };
    const pressed = (button) => button.getAttribute('aria-pressed');

    afterEach(() => {
      vi.useRealTimers();
    });

    it('el botón tiene nombre fijo, type=button, aria-pressed, icono oculto a los lectores y .focus-ring, y alternar no envía nada', async () => {
      renderForm();
      await user.type(passwordInput(), PASSWORD);
      const button = screen.getByRole('button', SHOW);

      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveClass('focus-ring');
      expect(button).not.toHaveAttribute('title');
      expect(button.getAttribute('aria-label')).not.toContain(PASSWORD);
      expect(pressed(button)).toBe('false');
      const icon = button.querySelector('.material-symbols-outlined');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
      expect(icon).toHaveTextContent('visibility');
      expect(button.closest('label')).toBeNull();

      await user.click(button);
      expect(passwordInput()).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', SHOW)).toBe(button);
      expect(pressed(button)).toBe('true');
      expect(icon).toHaveTextContent('visibility_off');

      await user.click(button);
      expect(passwordInput()).toHaveAttribute('type', 'password');
      expect(pressed(button)).toBe('false');
      expect(icon).toHaveTextContent('visibility');
      expect(fetchMock).not.toHaveBeenCalled();
      expect(screen.queryByRole('alert')).toBeNull();
    });

    it('los textos de los tres botones existen en español y en inglés, distintos entre sí', async () => {
      const [es, en] = await Promise.all([import('../languages/es/translation.json'), import('../languages/en/translation.json')]);
      const keys = ['showPassword', 'showNewPassword', 'showConfirmPassword'];

      [es.default, en.default].forEach((dictionary) => {
        const names = keys.map((key) => dictionary.login[key]);
        expect(names.every(Boolean)).toBe(true);
        expect(new Set(names).size).toBe(3);
        names.forEach((name) => expect(name).not.toContain(PASSWORD));
      });
      expect(es.default.login.showPassword).not.toBe(en.default.login.showPassword);
    });

    it('la contraseña lleva siempre spellcheck, capitalización y corrección desactivados, oculta o visible', async () => {
      renderForm();
      const input = passwordInput();
      const expectOff = (field) => {
        expect(field).toHaveAttribute('spellcheck', 'false');
        expect(field).toHaveAttribute('autocapitalize', 'none');
        expect(field).toHaveAttribute('autocorrect', 'off');
      };

      expectOff(input);
      await user.click(screen.getByRole('button', SHOW));
      expect(input).toHaveAttribute('type', 'text');
      expectOff(input);
    });

    it('en la contraseña nueva y su repetición, cada campo tiene su botón, el estado es independiente y conservan los atributos de seguridad', SLOW, async () => {
      await goToNewPassword();
      const newPassword = screen.getByLabelText('login.newPasswordLabel');
      const confirmation = screen.getByLabelText('login.confirmPasswordLabel');
      const showNew = screen.getByRole('button', SHOW_NEW);
      const showConfirm = screen.getByRole('button', SHOW_CONFIRM);

      await user.click(showNew);
      expect([newPassword.type, confirmation.type]).toEqual(['text', 'password']);
      expect([pressed(showNew), pressed(showConfirm)]).toEqual(['true', 'false']);
      await user.click(showConfirm);
      expect([newPassword.type, confirmation.type]).toEqual(['text', 'text']);
      await user.click(showNew);
      expect([newPassword.type, confirmation.type]).toEqual(['password', 'text']);
      expect([pressed(showNew), pressed(showConfirm)]).toEqual(['false', 'true']);

      [newPassword, confirmation].forEach((field) => {
        expect(field).toHaveAttribute('autocomplete', 'new-password');
        expect(field).toHaveAttribute('spellcheck', 'false');
        expect(field).toHaveAttribute('autocapitalize', 'none');
        expect(field).toHaveAttribute('autocorrect', 'off');
        expect(field).not.toHaveAttribute('name');
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('el código TOTP no tiene botón de mostrar', SLOW, async () => {
      route({ InitiateAuth: srpChallenge, RespondToAuthChallenge: challenge('SOFTWARE_TOKEN_MFA', 'S2') });
      renderForm();
      await submitCredentials();
      await h2('login.totpTitle');

      expect(screen.queryByRole('button', { name: /login\.show/ })).toBeNull();
      expect(screen.getAllByRole('button')).toHaveLength(1);
    });

    it('conserva el mismo nodo, el valor, la selección, el id y el autocomplete, y no añade name', async () => {
      renderForm();
      const input = passwordInput();
      await user.type(input, PASSWORD);
      input.setSelectionRange(2, 4);
      const button = screen.getByRole('button', SHOW);

      await user.click(button);
      await user.click(button);

      expect(passwordInput()).toBe(input);
      expect(input).toHaveValue(PASSWORD);
      expect([input.selectionStart, input.selectionEnd]).toEqual([2, 4]);
      expect(input).toHaveAttribute('id', 'login-password');
      expect(input).toHaveAttribute('autocomplete', 'current-password');
      expect(input).not.toHaveAttribute('name');
    });

    it('el foco queda en el botón tras pulsarlo con el ratón y tras un clic que no enfoca (focus imperativo)', async () => {
      renderForm();
      const button = screen.getByRole('button', SHOW);

      await user.click(button);
      expect(button).toHaveFocus();

      passwordInput().focus();
      expect(button).not.toHaveFocus();
      fireEvent.click(button);
      expect(button).toHaveFocus();
      expect(pressed(button)).toBe('false');
    });

    it('Enter en la contraseña envía con un solo InitiateAuth y no alterna; el orden de Tab es correo, contraseña, su botón y enviar', SLOW, async () => {
      route({ InitiateAuth: fail(400, 'NotAuthorizedException') });
      renderForm();
      screen.getByLabelText('login.emailLabel').focus();

      await user.tab();
      expect(passwordInput()).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('button', SHOW)).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('button', { name: 'login.logInButton' })).toHaveFocus();

      await user.type(screen.getByLabelText('login.emailLabel'), EMAIL);
      await user.type(passwordInput(), `${PASSWORD}{Enter}`);
      expect(await screen.findByRole('alert')).toHaveTextContent('login.credentialsError');
      expect(callsOf('InitiateAuth')).toHaveLength(1);
      expect(pressed(screen.getByRole('button', SHOW))).toBe('false');
    });

    it('el orden de Tab en newPassword es usuario, nueva, su botón, repetición, su botón y continuar', SLOW, async () => {
      await goToNewPassword();
      screen.getByDisplayValue(EMAIL).focus();
      const order = [
        screen.getByLabelText('login.newPasswordLabel'),
        screen.getByRole('button', SHOW_NEW),
        screen.getByLabelText('login.confirmPasswordLabel'),
        screen.getByRole('button', SHOW_CONFIRM),
        screen.getByRole('button', { name: 'login.continueButton' }),
      ];

      for (const element of order) {
        await user.tab();
        expect(element).toHaveFocus();
      }
    });

    it('vuelve a ocultarse al enviar con error de credenciales', SLOW, async () => {
      route({ InitiateAuth: fail(400, 'NotAuthorizedException') });
      renderForm();
      await fillCredentials();
      await user.click(screen.getByRole('button', SHOW));
      expect(passwordInput()).toHaveAttribute('type', 'text');

      await user.click(screen.getByRole('button', { name: 'login.logInButton' }));

      await screen.findByRole('alert');
      expect(passwordInput()).toHaveAttribute('type', 'password');
      expect(pressed(screen.getByRole('button', SHOW))).toBe('false');
    });

    it('vuelve a ocultarse con contraseñas distintas (sin petición)', SLOW, async () => {
      await goToNewPassword();
      const before = fetchMock.mock.calls.length;
      await user.type(screen.getByLabelText('login.newPasswordLabel'), NEW_PASSWORD);
      await user.type(screen.getByLabelText('login.confirmPasswordLabel'), 'Otra-Distinta-1!aa');
      await user.click(screen.getByRole('button', SHOW_NEW));
      await user.click(screen.getByRole('button', SHOW_CONFIRM));

      await user.click(screen.getByRole('button', { name: 'login.continueButton' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('login.passwordMismatch');
      expect(fetchMock.mock.calls).toHaveLength(before);
      expect(screen.getByLabelText('login.newPasswordLabel')).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText('login.confirmPasswordLabel')).toHaveAttribute('type', 'password');
      expect(pressed(screen.getByRole('button', SHOW_NEW))).toBe('false');
      expect(pressed(screen.getByRole('button', SHOW_CONFIRM))).toBe('false');
    });

    it('al volver a credenciales por sesión caducada la contraseña, mostrada antes, vuelve oculta', SLOW, async () => {
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: queue(challenge('NEW_PASSWORD_REQUIRED', 'S2'), fail(400, 'NotAuthorizedException')),
      });
      renderForm();
      await fillCredentials();
      await user.click(screen.getByRole('button', SHOW));
      await user.click(screen.getByRole('button', { name: 'login.logInButton' }));
      await h2('login.newPasswordTitle');
      await user.type(screen.getByLabelText('login.newPasswordLabel'), NEW_PASSWORD);
      await user.type(screen.getByLabelText('login.confirmPasswordLabel'), NEW_PASSWORD);
      await user.click(screen.getByRole('button', { name: 'login.continueButton' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('login.sessionExpired');
      expect(passwordInput()).toHaveAttribute('type', 'password');
      expect(pressed(screen.getByRole('button', SHOW))).toBe('false');
    });

    it('al entrar otra vez en newPassword, los campos nuevos nacen ocultos aunque se mostraran en la entrada anterior', SLOW, async () => {
      route({
        InitiateAuth: srpChallenge,
        RespondToAuthChallenge: queue(
          challenge('NEW_PASSWORD_REQUIRED', 'S2'),
          fail(400, 'NotAuthorizedException'),
          challenge('NEW_PASSWORD_REQUIRED', 'S3'),
        ),
      });
      renderForm();
      await submitCredentials();
      await h2('login.newPasswordTitle');
      await user.type(screen.getByLabelText('login.newPasswordLabel'), NEW_PASSWORD);
      await user.type(screen.getByLabelText('login.confirmPasswordLabel'), NEW_PASSWORD);
      await user.click(screen.getByRole('button', SHOW_NEW));
      await user.click(screen.getByRole('button', SHOW_CONFIRM));
      await user.click(screen.getByRole('button', { name: 'login.continueButton' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('login.sessionExpired');

      await user.type(passwordInput(), PASSWORD);
      await user.click(screen.getByRole('button', { name: 'login.logInButton' }));
      await h2('login.newPasswordTitle');

      expect(screen.getByLabelText('login.newPasswordLabel')).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText('login.confirmPasswordLabel')).toHaveAttribute('type', 'password');
      expect(pressed(screen.getByRole('button', SHOW_NEW))).toBe('false');
      expect(pressed(screen.getByRole('button', SHOW_CONFIRM))).toBe('false');
    });

    it('no se oculta por tiempo ni al perder el foco (sin temporizador)', async () => {
      // shouldAdvanceTime: sin él, el asyncWrapper de Testing Library espera un setTimeout falso y el test se cuelga (no hay `jest` que lo avance).
      vi.useFakeTimers({ shouldAdvanceTime: true });
      user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      renderForm();
      await user.type(passwordInput(), PASSWORD);
      await user.click(screen.getByRole('button', SHOW));

      await act(async () => {
        vi.advanceTimersByTime(10 * 60 * 1000);
      });
      expect(passwordInput()).toHaveAttribute('type', 'text');

      fireEvent.blur(passwordInput());
      await user.tab();
      await user.tab();
      expect(passwordInput()).toHaveAttribute('type', 'text');
      expect(pressed(screen.getByRole('button', SHOW))).toBe('true');
    });

    it('al desmontar y volver a montar el campo nace oculto', async () => {
      const { unmount } = renderForm();
      await user.click(screen.getByRole('button', SHOW));
      expect(passwordInput()).toHaveAttribute('type', 'text');

      unmount();
      renderForm();

      expect(passwordInput()).toHaveAttribute('type', 'password');
      expect(pressed(screen.getByRole('button', SHOW))).toBe('false');
    });
  });

  it('ninguna llamada a console ni a Storage.setItem lleva la contraseña, el código ni el secreto, y sessionStorage queda vacío', SLOW, async () => {
    const consoleSpies = ['log', 'info', 'warn', 'error', 'debug'].map((method) => vi.spyOn(console, method).mockImplementation(() => {}));
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    route({
      InitiateAuth: srpChallenge,
      RespondToAuthChallenge: queue(challenge('NEW_PASSWORD_REQUIRED', 'S2'), challenge('MFA_SETUP', 'S3'), tokens()),
      AssociateSoftwareToken: json(200, { SecretCode: SECRET, Session: 'S4' }),
      VerifySoftwareToken: json(200, { Status: 'SUCCESS', Session: 'S5' }),
    });
    renderForm();
    await submitCredentials();
    await h2('login.newPasswordTitle');
    await user.type(screen.getByLabelText('login.newPasswordLabel'), NEW_PASSWORD);
    await user.type(screen.getByLabelText('login.confirmPasswordLabel'), NEW_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'login.showNewPassword' }));
    await user.click(screen.getByRole('button', { name: 'login.showConfirmPassword' }));
    await user.click(screen.getByRole('button', { name: 'login.continueButton' }));
    await h2('login.mfaSetupTitle');
    await user.type(screen.getByLabelText('login.codeLabel'), CODE);
    await user.click(screen.getByRole('button', { name: 'login.verifyButton' }));
    await screen.findByText('pagina-archivos');

    const logged = JSON.stringify([...consoleSpies.flatMap((spy) => spy.mock.calls), ...setItem.mock.calls]);
    [PASSWORD, NEW_PASSWORD, CODE, SECRET].forEach((secret) => expect(logged).not.toContain(secret));
    expect(sessionStorage.length).toBe(0);
    const stored = Object.values({ ...localStorage }).join('|');
    [PASSWORD, NEW_PASSWORD, SECRET].forEach((secret) => expect(stored.includes(secret)).toBe(false));
  });
});
