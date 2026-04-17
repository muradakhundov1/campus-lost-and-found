const { query } = require('./_db');
const { json, authToken } = require('./_util');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });

  const t = authToken(req);
  if (!t) return json(res, 401, { error: 'unauthorized' });

  const s = await query('select user_id from sessions where token = $1 limit 1', [t]);
  const session = s.rows[0];
  if (!session) return json(res, 401, { error: 'unauthorized' });

  const u = await query(
    'select id,name,email,phone,role,avatar,verified,suspended,joined_date,department,year,post_count,resolved_count from users where id = $1 limit 1',
    [session.user_id]
  );
  const user = u.rows[0];
  if (!user) return json(res, 401, { error: 'unauthorized' });

  return json(res, 200, { user });
};

