const { z } = require('zod');
const { query } = require('../_db');
const { json, readJson, newId } = require('../_util');
const { requireUserId } = require('../_auth');

const LABELS = {
  warning: 'Warning issued to user',
  remove: 'Post removed',
  suspend: 'User suspended',
  dismiss: 'Report dismissed'
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

  const userId = await requireUserId(req, res);
  if (!userId) return;

  const u = await query('select role from users where id = $1', [userId]);
  if (u.rows[0]?.role !== 'admin') return json(res, 403, { error: 'forbidden' });

  let body;
  try {
    body = await readJson(req);
  } catch {
    return json(res, 400, { error: 'invalid_json' });
  }

  const parsed = z
    .object({
      reportId: z.string().min(1),
      action: z.enum(['warning', 'remove', 'suspend', 'dismiss'])
    })
    .safeParse(body);
  if (!parsed.success) return json(res, 400, { error: 'invalid_request' });

  const { reportId, action } = parsed.data;

  try {
    const r = await query('select * from reports where id = $1', [reportId]);
    if (!r.rows[0]) return json(res, 404, { error: 'not_found' });

    await query("update reports set status = 'reviewed' where id = $1", [reportId]);

    const targetTitle = r.rows[0].target_title || '';
    await query(
      `insert into admin_log (id, action, target, note, admin_id, at)
       values ($1,$2,$3,$4,$5,now())`,
      [newId('al'), LABELS[action], targetTitle, `Report ${reportId}`, userId]
    );

    return json(res, 200, { ok: true });
  } catch (e) {
    console.error('[admin/actions]', e);
    return json(res, 500, { error: 'server_error' });
  }
};
