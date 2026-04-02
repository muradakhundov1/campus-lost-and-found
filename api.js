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
  },

  async itemsList() {
    const out = await apiFetch('/api/items', { method: 'GET', auth: false });
    const items = (out.items || []).map(normalizeItem);
    return { items };
  },

  async itemsCreate(payload) {
    const out = await apiFetch('/api/items', { method: 'POST', body: payload });
    return { item: normalizeItem(out.item) };
  },

  async itemsGet(id) {
    const out = await apiFetch(`/api/items/${encodeURIComponent(id)}`, { method: 'GET', auth: false });
    return { item: normalizeItem(out.item) };
  },

  async itemsDelete(id) {
    await apiFetch(`/api/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async itemsPatch(id, body) {
    const out = await apiFetch(`/api/items/${encodeURIComponent(id)}`, { method: 'PATCH', body });
    return { item: normalizeItem(out.item) };
  },

  async claimsList() {
    return await apiFetch('/api/claims', { method: 'GET' });
  },

  async itemClaimsGet(itemId) {
    return await apiFetch(`/api/items/${encodeURIComponent(itemId)}/claims`, { method: 'GET' });
  },

  async itemClaimsPost(itemId, body) {
    return await apiFetch(`/api/items/${encodeURIComponent(itemId)}/claims`, { method: 'POST', body });
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
    return await apiFetch('/api/notifications', { method: 'GET' });
  },

  async notificationsMarkAllRead() {
    return await apiFetch('/api/notifications', { method: 'POST', body: { markAllRead: true } });
  },

  async reportsList() {
    return await apiFetch('/api/reports', { method: 'GET' });
  },

  async reportsCreate(body) {
    return await apiFetch('/api/reports', { method: 'POST', body });
  },

  async adminStats() {
    return await apiFetch('/api/admin/stats', { method: 'GET' });
  },

  async adminLog() {
    return await apiFetch('/api/admin/log', { method: 'GET' });
  },

  async adminAction(body) {
    return await apiFetch('/api/admin/actions', { method: 'POST', body });
  },

  async userGet(id) {
    const out = await apiFetch(`/api/users/${encodeURIComponent(id)}`, { method: 'GET', auth: false });
    return out.user;
  }
};

window.Api = Api;

