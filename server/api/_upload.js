const { json } = require('./_util');
const { requireUserId } = require('./_auth');

function encodeStoragePath(path) {
  return String(path || '')
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function readBodyBuffer(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let n = 0;
    req.on('data', (c) => {
      n += c.length;
      if (n > maxBytes) {
        const err = new Error('payload_too_large');
        err.code = 'payload_too_large';
        reject(err);
        try {
          req.destroy();
        } catch {}
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.end();
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

  const userId = await requireUserId(req, res);
  if (!userId) return;

  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'item-photos';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

  if (!storageUrl || !bucket || !serviceRoleKey) {
    return json(res, 500, {
      error: 'storage_not_configured',
      missing: {
        SUPABASE_URL: !storageUrl,
        SUPABASE_STORAGE_BUCKET: !bucket,
        SUPABASE_SERVICE_ROLE_KEY: !serviceRoleKey
      }
    });
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('image/')) {
    return json(res, 400, { error: 'invalid_file_type' });
  }

  const maxBytes = 6 * 1024 * 1024; // 6MB
  let buf;
  try {
    buf = await readBodyBuffer(req, maxBytes);
  } catch (e) {
    if (e?.code === 'payload_too_large') return json(res, 413, { error: 'payload_too_large' });
    console.error('[upload]', e);
    return json(res, 400, { error: 'invalid_request' });
  }
  if (!buf || buf.length === 0) return json(res, 400, { error: 'empty_file' });

  const rawName = String(req.headers['x-filename'] || '').trim();
  const rawExt = (rawName.split('.').pop() || '').toLowerCase();
  const safeExt = /^[a-z0-9]{1,8}$/.test(rawExt) ? rawExt : contentType.split('/')[1] || 'jpg';
  const filePath = `items/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;

  const objPath = `${encodeURIComponent(bucket)}/${encodeStoragePath(filePath)}`;
  const upRes = await fetch(`${storageUrl}/storage/v1/object/${objPath}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': contentType,
      'x-upsert': 'false'
    },
    body: buf
  });

  if (!upRes.ok) {
    let data = null;
    try {
      data = await upRes.json();
    } catch {}
    console.error('[upload] storage failed', upRes.status, data || '');
    return json(res, 502, { error: 'upload_failed' });
  }

  return json(res, 200, {
    path: filePath,
    publicUrl: `${storageUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeStoragePath(filePath)}`
  });
};

