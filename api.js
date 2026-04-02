// Minimal API client for the static frontend.

function resolveApiBase() {
  // Deployed (Vercel): same-origin API routes at /api
  try {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') return '';
  } catch {}
  // Local dev: separate API server
  return 'http://localhost:8787';
}

const API_BASE = resolveApiBase();
const AUTH_TOKEN_KEY = 'bhos.authToken';

function getToken() {
  try { return localStorage.getItem(AUTH_TOKEN_KEY) || ''; } catch { return ''; }
}

function setToken(t) {
  try {
    if (t) localStorage.setItem(AUTH_TOKEN_KEY, t);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {}
}

async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      const err = new Error('invalid_json');
      err.status = res.status;
      throw err;
    }
  }
  if (!res.ok) {
    const err = new Error(data?.error || 'request_failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const Api = {
  token: { get: getToken, set: setToken },

  async login(identifier, password) {
    const out = await apiFetch('/api/auth/login', { method: 'POST', auth: false, body: { identifier, password } });
    if (!out?.token || !out.user) throw new Error('bad_login_response');
    setToken(out.token);
    return out.user;
  },

  async register(payload) {
    const out = await apiFetch('/api/auth/register', { method: 'POST', auth: false, body: payload });
    if (!out?.token || !out.user) throw new Error('bad_register_response');
    setToken(out.token);
    return out.user;
  },

  async me() {
    const out = await apiFetch('/api/me', { method: 'GET', auth: true });
    return out.user;
  },

  async config() {
    const out = await apiFetch('/api/config', { method: 'GET', auth: false });
    return out;
  }
};

window.Api = Api;

