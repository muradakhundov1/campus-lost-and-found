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
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      const err = new Error('invalid_json');
      err.status = res.status;
      err.hint = 'not_json';
      throw err;
    }
  } else if (res.ok && !text) {
    // Empty 2xx: `{}` was breaking login/register — unwrapAuthPayload saw no token/user and showed
    // "signup returned OK but no token". Auth routes must return JSON; keep data null so unwrap fails clearly.
    if (res.status === 204 || res.status === 205) {
      data = {};
    } else if (method === 'GET' || method === 'HEAD') {
      data = null;
    } else if (path.includes('/auth/')) {
      data = null;
    } else {
      // POST/PATCH/PUT to other APIs (e.g. claims) — tolerate empty body from some proxies
      data = {};
    }
  }
  if (!res.ok) {
    const err = new Error(data?.error || 'request_failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  if (res.ok && data == null && !ct.includes('json') && text === '') {
    return {};
  }
  return data;
}

/** Normalize login/register JSON (handles minor API shape differences). */
function unwrapAuthPayload(raw) {
  if (raw == null || typeof raw !== 'object') return null;
  const nested =
    raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) && (raw.data.token || raw.data.user || raw.data.access_token)
      ? raw.data
      : raw;
  const tokenVal = nested.token ?? nested.access_token ?? nested.accessToken;
  const user = nested.user ?? nested.profile;
  if (
    tokenVal &&
    user != null &&
    typeof user === 'object' &&
    user !== null &&
    !Array.isArray(user)
  ) {
    return { token: tokenVal, user };
  }
  return null;
}

function normalizeItem(raw) {
  if (!raw) return raw;
  const vq = raw.verificationQuestions ?? raw.verification_questions;
  let questions = [];
  if (Array.isArray(vq)) questions = vq;
  else if (typeof vq === 'string') {
    try {
      questions = JSON.parse(vq);
    } catch {
      questions = [];
    }
  }
  return {
    id: raw.id,
    posterId: raw.posterId ?? raw.poster_id,
    posterName: raw.posterName ?? raw.poster_name,
    type: raw.type,
    title: raw.title,
    category: raw.category,
    description: raw.description,
    location: raw.location,
    date: raw.date,
    time: raw.time ?? '',
    emoji: raw.emoji ?? '',
    status: raw.status,
    verificationQuestions: questions.map((q, i) => ({
      id: q.id || `nq${i}`,
      text: q.text || ''
    })),
    claimCount: Number(raw.claimCount ?? raw.claim_count ?? 0),
    resolvedAt: raw.resolvedAt ?? raw.resolved_at ?? null
  };
}

function normalizeClaim(raw) {
  if (!raw) return raw;
  const finder = raw.isFinderResponse ?? raw.is_finder_response;
  return {
    id: raw.id,
    itemId: raw.itemId ?? raw.item_id,
    claimantId: raw.claimantId ?? raw.claimant_id,
    claimantName: raw.claimantName ?? raw.claimant_name,
    isFinderResponse: finder === true || finder === 1 || finder === 't' || finder === 'true',
    status: raw.status,
    submittedAt: raw.submittedAt ?? raw.submitted_at,
    chatEnabled: Boolean(raw.chatEnabled ?? raw.chat_enabled),
    reviewNote: raw.reviewNote ?? raw.review_note ?? '',
    meetingPoint: raw.meetingPoint ?? raw.meeting_point,
    meetingTime: raw.meetingTime ?? raw.meeting_time,
    handoverStatus: raw.handoverStatus ?? raw.handover_status,
    answers: Array.isArray(raw.answers) ? raw.answers : []
  };
}

const Api = {
  token: { get: getToken, set: setToken },

  async login(identifier, password) {
    // Must match api/_dispatch.js: segments ['auth','login'] POST → _authLogin.js
    const out = await apiFetch('/api/auth/login', { method: 'POST', auth: false, body: { identifier, password } });
    const auth = unwrapAuthPayload(out);
    if (!auth) {
      const err = new Error('bad_login_response');
      err.code = 'bad_auth_payload';
      err.raw = out;
      throw err;
    }
    setToken(auth.token);
    return auth.user;
  },

  async register(payload) {
    // Must match api/_dispatch.js: segments ['auth','register'] POST → _authRegister.js
    const out = await apiFetch('/api/auth/register', { method: 'POST', auth: false, body: payload });
    const auth = unwrapAuthPayload(out);
    if (!auth) {
      const err = new Error('bad_register_response');
      err.code = 'bad_auth_payload';
      err.raw = out;
      throw err;
    }
    setToken(auth.token);
    return auth.user;
  },

  async me() {
    const out = await apiFetch('/api/me', { method: 'GET', auth: true });
    return out?.user;
  },

  async config() {
    const out = await apiFetch('/api/config', { method: 'GET', auth: false });
    return out;
  },

  async itemsList() {
    const out = await apiFetch('/api/items', { method: 'GET', auth: false });
    const items = (out?.items || []).map(normalizeItem);
    return { items };
  },

  async itemsCreate(payload) {
    const out = await apiFetch('/api/items', { method: 'POST', body: payload });
    return { item: normalizeItem(out?.item) };
  },

  async itemsGet(id) {
    const out = await apiFetch(`/api/items/${encodeURIComponent(id)}`, { method: 'GET', auth: false });
    return { item: normalizeItem(out?.item) };
  },

  async itemsDelete(id) {
    await apiFetch(`/api/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async itemsPatch(id, body) {
    const out = await apiFetch(`/api/items/${encodeURIComponent(id)}`, { method: 'PATCH', body });
    return { item: normalizeItem(out?.item) };
  },

  async claimsList() {
    const out = await apiFetch('/api/claims', { method: 'GET' });
    const claims = (out?.claims || []).map(normalizeClaim);
    return { claims };
  },

  async itemClaimsGet(itemId) {
    const out = await apiFetch(`/api/items/${encodeURIComponent(itemId)}/claims`, { method: 'GET' });
    const claims = (out?.claims || []).map(normalizeClaim);
    return { claims };
  },

  async itemClaimsPost(itemId, body) {
    const out = await apiFetch(`/api/items/${encodeURIComponent(itemId)}/claims`, { method: 'POST', body });
    const next = { ...(out || {}) };
    if (out?.claim) next.claim = normalizeClaim(out.claim);
    if (out?.item) next.item = normalizeItem(out.item);
    return next;
  },

  async claimApprove(claimId) {
    return await apiFetch(`/api/claims/${encodeURIComponent(claimId)}/approve`, { method: 'POST' });
  },

  async claimReject(claimId, reviewNote) {
    return await apiFetch(`/api/claims/${encodeURIComponent(claimId)}/reject`, { method: 'POST', body: { reviewNote } });
  },

  async claimMessagesGet(claimId) {
    return await apiFetch(`/api/claims/${encodeURIComponent(claimId)}/messages`, { method: 'GET' });
  },

  async claimMessagesPost(claimId, text) {
    return await apiFetch(`/api/claims/${encodeURIComponent(claimId)}/messages`, { method: 'POST', body: { text } });
  },

  async claimHandover(claimId, body) {
    return await apiFetch(`/api/claims/${encodeURIComponent(claimId)}/handover`, { method: 'POST', body });
  },

  async notificationsList() {
    const out = await apiFetch('/api/notifications', { method: 'GET' });
    return { notifications: out?.notifications || [] };
  },

  async notificationsMarkAllRead() {
    return await apiFetch('/api/notifications', { method: 'POST', body: { markAllRead: true } });
  },

  async reportsList() {
    const out = await apiFetch('/api/reports', { method: 'GET' });
    return { reports: out?.reports || [] };
  },

  async reportsCreate(body) {
    return await apiFetch('/api/reports', { method: 'POST', body });
  },

  async adminStats() {
    return await apiFetch('/api/admin/stats', { method: 'GET' });
  },

  async adminLog() {
    const out = await apiFetch('/api/admin/log', { method: 'GET' });
    return { adminLog: out?.adminLog || [] };
  },

  async adminAction(body) {
    return await apiFetch('/api/admin/actions', { method: 'POST', body });
  },

  async userGet(id) {
    const out = await apiFetch(`/api/users/${encodeURIComponent(id)}`, { method: 'GET', auth: false });
    return out?.user;
  }
};

window.Api = Api;

