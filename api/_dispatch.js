/**
 * Single entry dispatcher for all /api/* routes (Vercel Hobby: one serverless function).
 * Handlers live in api/_*.js (underscore = not deployed as separate functions).
 */

function parseSegments(req) {
  let pathname = (req.url || '').split('?')[0];
  if (pathname.includes('://')) {
    try {
      pathname = new URL(pathname).pathname;
    } catch {
      /* ignore */
    }
  }
  if (!pathname.startsWith('/')) pathname = '/' + pathname;
  const rest = pathname.replace(/^\/api\/?/, '');
  const fromUrl = rest ? rest.split('/').filter(Boolean) : [];
  if (fromUrl.length) return fromUrl;
  const q = req.query || {};
  if (Array.isArray(q.path)) return q.path;
  if (typeof q.path === 'string') return q.path.split('/').filter(Boolean);
  return [];
}

function withId(req, id) {
  return Object.assign(req, { query: { ...(req.query || {}), id } });
}

module.exports = async function dispatch(req, res) {
  const method = req.method || 'GET';
  const segments = parseSegments(req);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (method === 'OPTIONS') return res.end();

  const one = segments[0];
  const two = segments[1];
  const three = segments[2];

  try {
    if (segments.length === 1 && one === 'health' && method === 'GET') {
      return require('./_health')(req, res);
    }
    if (segments.length === 1 && one === 'config' && method === 'GET') {
      return require('./_config')(req, res);
    }
    if (segments.length === 1 && one === 'me' && method === 'GET') {
      return require('./_me')(req, res);
    }

    if (segments.length === 2 && one === 'auth' && two === 'login' && method === 'POST') {
      return require('./_authLogin')(req, res);
    }
    if (segments.length === 2 && one === 'auth' && two === 'register' && method === 'POST') {
      return require('./_authRegister')(req, res);
    }

    if (segments.length === 1 && one === 'items' && (method === 'GET' || method === 'POST')) {
      return require('./_items')(req, res);
    }
    if (segments.length === 2 && one === 'items' && two && (method === 'GET' || method === 'DELETE' || method === 'PATCH')) {
      return require('./_itemById')(withId(req, two), res);
    }
    if (segments.length === 3 && one === 'items' && two && three === 'claims' && (method === 'GET' || method === 'POST')) {
      return require('./_itemClaims')(withId(req, two), res);
    }

    if (segments.length === 1 && one === 'claims' && method === 'GET') {
      return require('./_claims')(req, res);
    }
    if (segments.length === 3 && one === 'claims' && two && three === 'approve' && method === 'POST') {
      return require('./_claimApprove')(withId(req, two), res);
    }
    if (segments.length === 3 && one === 'claims' && two && three === 'reject' && method === 'POST') {
      return require('./_claimReject')(withId(req, two), res);
    }
    if (segments.length === 3 && one === 'claims' && two && three === 'messages' && (method === 'GET' || method === 'POST')) {
      return require('./_claimMessages')(withId(req, two), res);
    }
    if (segments.length === 3 && one === 'claims' && two && three === 'handover' && method === 'POST') {
      return require('./_claimHandover')(withId(req, two), res);
    }

    if (segments.length === 1 && one === 'notifications' && (method === 'GET' || method === 'POST')) {
      return require('./_notifications')(req, res);
    }
    if (segments.length === 1 && one === 'reports' && (method === 'GET' || method === 'POST')) {
      return require('./_reports')(req, res);
    }

    if (segments.length === 2 && one === 'admin' && two === 'stats' && method === 'GET') {
      return require('./_adminStats')(req, res);
    }
    if (segments.length === 2 && one === 'admin' && two === 'log' && method === 'GET') {
      return require('./_adminLog')(req, res);
    }
    if (segments.length === 2 && one === 'admin' && two === 'actions' && method === 'POST') {
      return require('./_adminActions')(req, res);
    }

    if (segments.length === 2 && one === 'users' && two && method === 'GET') {
      return require('./_userById')(withId(req, two), res);
    }
  } catch (e) {
    console.error('[dispatch]', e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'server_error' }));
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify({ error: 'not_found' }));
};
