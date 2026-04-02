const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { query } = require('./_db');
const { json, readJson, token, avatarFromName } = require('./_util');

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
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      role: z.enum(['student', 'staff']).default('student'),
      department: z.string().optional(),
      year: z.string().optional(),
      password: z.string().min(8)
    })
    .safeParse(body);
  if (!parsed.success) return json(res, 400, { error: 'invalid_request' });

  const p = parsed.data;
  const id = `u${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const avatar = avatarFromName(p.name);
  const password_hash = bcrypt.hashSync(p.password, 10);

  try {
    await query(
      `insert into users (id,name,email,phone,password_hash,role,avatar,verified,suspended,joined_date,department,year,post_count,resolved_count)
       values ($1,$2,$3,$4,$5,$6,$7,true,false,current_date,$8,$9,0,0)`,
      [id, p.name, p.email, p.phone || null, password_hash, p.role, avatar, p.department || '', p.year || '']
    );
  } catch (e) {
    // Any DB error was previously returned as "user_exists"; only unique violations mean duplicate.
    if (e && e.code === '23505') {
      return json(res, 409, { error: 'user_exists' });
    }
    console.error('[register] insert user failed', e);
    return json(res, 500, { error: 'server_error' });
  }

  const t = token();
  await query('insert into sessions (token,user_id,created_at,expires_at) values ($1,$2,now(),null)', [t, id]);
  return json(res, 201, {
    token: t,
    user: {
      id,
      name: p.name,
      email: p.email,
      phone: p.phone || null,
      role: p.role,
      avatar,
      verified: true,
      suspended: false,
      joined_date: new Date().toISOString().slice(0, 10),
      department: p.department || '',
      year: p.year || '',
      post_count: 0,
      resolved_count: 0
    }
  });
};

