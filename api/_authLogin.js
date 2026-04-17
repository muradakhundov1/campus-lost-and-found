const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { query } = require('./_db');
const { json, readJson, token, authToken } = require('./_util');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

  let body;
  try {
    body = await readJson(req);
  } catch {
    return json(res, 400, { error: 'invalid_json' });
  }

  const parsed = z
    .object({ identifier: z.string().min(1), password: z.string().min(1) })
    .safeParse(body);
  if (!parsed.success) return json(res, 400, { error: 'invalid_request' });

  const { identifier, password } = parsed.data;
  try {
    const u = await query('select * from users where email = $1 or phone = $1 limit 1', [identifier]);
    const user = u.rows[0];
    if (!user) return json(res, 401, { error: 'invalid_credentials' });
    if (user.suspended) return json(res, 403, { error: 'suspended' });
    if (!user.password_hash) return json(res, 401, { error: 'invalid_credentials' });
    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return json(res, 401, { error: 'invalid_credentials' });

    const t = token();
    await query('insert into sessions (token,user_id,created_at,expires_at) values ($1,$2,now(),null)', [t, user.id]);
    return json(res, 200, {
      token: t,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        verified: !!user.verified,
        suspended: !!user.suspended,
        joined_date: user.joined_date,
        department: user.department,
        year: user.year,
        post_count: user.post_count,
        resolved_count: user.resolved_count
      }
    });
  } catch (e) {
    const msg = String(e?.message || '');
    if (msg.includes('Missing DATABASE_URL')) return json(res, 500, { error: 'db_not_configured' });
    console.error('[auth/login]', e);
    return json(res, 500, { error: 'server_error' });
  }
};

