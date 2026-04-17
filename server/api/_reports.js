const { z } = require('zod');
const { query } = require('./_db');
const { json, readJson, newId } = require('./_util');
const { requireUserId } = require('./_auth');
const { mapReportRow } = require('./_claimMap');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.end();

  const userId = await requireUserId(req, res);
  if (!userId) return;

  if (req.method === 'GET') {
    const u = await query('select role from users where id = $1', [userId]);
    if (u.rows[0]?.role !== 'admin') return json(res, 403, { error: 'forbidden' });
    try {
      const r = await query('select * from reports order by created_at desc');
      return json(res, 200, { reports: r.rows.map(mapReportRow) });
    } catch (e) {
      console.error('[reports GET]', e);
      return json(res, 500, { error: 'server_error' });
    }
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await readJson(req);
    } catch {
      return json(res, 400, { error: 'invalid_json' });
    }
    const parsed = z
      .object({
        type: z.enum(['post', 'user']),
        targetId: z.string().optional(),
        targetTitle: z.string().optional(),
        reason: z.string().min(1),
        detail: z.string().optional(),
        severity: z.enum(['low', 'medium', 'high']).default('medium')
      })
      .safeParse(body);
    if (!parsed.success) return json(res, 400, { error: 'invalid_request' });
    const p = parsed.data;
    const rid = newId('r');
    try {
      await query(
        `insert into reports (id, type, target_id, target_title, reporter_id, reason, detail, severity, status, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,'pending',now())`,
        [rid, p.type, p.targetId || null, p.targetTitle || null, userId, p.reason, p.detail || '', p.severity]
      );
      return json(res, 201, { id: rid });
    } catch (e) {
      console.error('[reports POST]', e);
      return json(res, 500, { error: 'server_error' });
    }
  }

  return json(res, 405, { error: 'method_not_allowed' });
};

