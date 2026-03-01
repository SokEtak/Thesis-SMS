const PASSWORD_CONFIRM_ENDPOINT = '/user/confirm-password';
const CSRF_COOKIE_ENDPOINT = '/sanctum/csrf-cookie';
const LOGIN_PATH = '/login';
const CONFIRM_PASSWORD_SUCCESS_STATUS = 201;
const VALIDATION_ERROR_STATUS = 422;
const CSRF_ERROR_STATUS = 419;

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const encodedName = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(encodedName)) {
      continue;
    }

    return trimmed.slice(encodedName.length);
  }

  return null;
};

const getXsrfToken = (): string | null => {
  const token = getCookie('XSRF-TOKEN');
  if (!token) {
    return null;
  }

  try {
    return decodeURIComponent(token);
  } catch {
    return token;
  }
};

const getCsrfMetaToken = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const metaTag = document.querySelector('meta[name="csrf-token"]');
  if (!metaTag) {
    return null;
  }

  const token = metaTag.getAttribute('content');
  return token ? token.trim() : null;
};

const refreshCsrfCookie = async (): Promise<void> => {
  await fetch(CSRF_COOKIE_ENDPOINT, {
    credentials: 'same-origin',
  });
};

const postConfirmPassword = async (password: string): Promise<Response> => {
  const xsrfToken = getXsrfToken();
  const csrfMetaToken = getCsrfMetaToken();

  return fetch(PASSWORD_CONFIRM_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
      ...(csrfMetaToken ? { 'X-CSRF-TOKEN': csrfMetaToken } : {}),
    },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({ password }),
  });
};

type ConfirmPasswordResult = 'confirmed' | 'invalid' | 'failed' | 'unauthenticated';

const isLoginRedirect = (response: Response): boolean => {
  if (!response.redirected) {
    return false;
  }

  try {
    const redirectedUrl = new URL(response.url, window.location.origin);
    return redirectedUrl.pathname === LOGIN_PATH;
  } catch {
    return false;
  }
};

const confirmPasswordOnce = async (password: string): Promise<ConfirmPasswordResult> => {
  let response = await postConfirmPassword(password);

  // Token mismatch/expired. Refresh CSRF cookie then retry once.
  if (response.status === CSRF_ERROR_STATUS) {
    await refreshCsrfCookie();
    response = await postConfirmPassword(password);
  }

  if (response.status === CONFIRM_PASSWORD_SUCCESS_STATUS) {
    return 'confirmed';
  }

  if (response.status === VALIDATION_ERROR_STATUS) {
    return 'invalid';
  }

  if (response.status === 401 || response.status === 403 || isLoginRedirect(response)) {
    return 'unauthenticated';
  }

  // Non-JSON flow fallback.
  if (response.redirected || response.status === 200 || response.status === 302) {
    return 'invalid';
  }

  return 'failed';
};

let passwordConfirmationInFlight: Promise<boolean> | null = null;

export const requirePasswordConfirmation = async (operationLabel: string): Promise<boolean> => {
  if (passwordConfirmationInFlight) {
    return passwordConfirmationInFlight;
  }

  passwordConfirmationInFlight = (async () => {
    while (true) {
      const password = window.prompt(`Enter your password to continue: ${operationLabel}`);
      if (password === null) {
        return false;
      }

      if (password.length === 0) {
        window.alert('Password is required.');
        continue;
      }

      try {
        const result = await confirmPasswordOnce(password);

        if (result === 'confirmed') {
          return true;
        }

        if (result === 'invalid') {
          window.alert('Incorrect password. Please try again.');
          continue;
        }

        if (result === 'unauthenticated') {
          window.alert('Your session has expired. Please sign in again, then retry.');
          return false;
        }

        window.alert('Unable to verify password right now. Please try again.');
      } catch {
        window.alert('Unable to verify password right now. Please try again.');
      }
    }
  })();

  try {
    return await passwordConfirmationInFlight;
  } catch {
    return false;
  } finally {
    passwordConfirmationInFlight = null;
  }
};
