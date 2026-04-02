const { query } = require('./_db');
const { json } = require('./_util');
const { requireUserId } = require('./_auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });

  const userId = await requireUserId(req, res);
  if (!userId) return;

  const u = await query('select role from users where id = $1', [userId]);
  if (u.rows[0]?.role !== 'admin') return json(res, 403, { error: 'forbidden' });

  try {
    const [users, items, pending] = await Promise.all([
      query('select count(*)::int as c from users'),
      query('select count(*)::int as c from items'),
      query("select count(*)::int as c from reports where status = 'pending'")
    ]);
    return json(res, 200, {
      userCount: users.rows[0].c,
      itemCount: items.rows[0].c,
      pendingReports: pending.rows[0].c
    });
  } catch (e) {
    console.error('[admin/stats]', e);
    return json(res, 500, { error: 'server_error' });
  }
};
