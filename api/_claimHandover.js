const { z } = require('zod');
const { query } = require('./_db');
const { json, readJson } = require('./_util');
const { mapClaimRow } = require('./_claimMap');
const { mapItem } = require('./_itemsMap');
const { requireUserId } = require('./_auth');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

  const claimId = req.query.id;
  if (!claimId) return json(res, 400, { error: 'invalid_request' });

  const userId = await requireUserId(req, res);
  if (!userId) return;

  let body;
  try {
    body = await readJson(req);
  } catch {
    return json(res, 400, { error: 'invalid_json' });
  }

  const parsed = z
    .object({
      action: z.enum(['schedule', 'complete']),
      meetingPoint: z.string().optional(),
      meetingTime: z.string().optional()
    })
    .safeParse(body);
  if (!parsed.success) return json(res, 400, { error: 'invalid_request' });

  try {
    const cr = await query('select * from claims where id = $1', [claimId]);
    const claim = cr.rows[0];
    if (!claim) return json(res, 404, { error: 'not_found' });

    const ir = await query('select * from items where id = $1', [claim.item_id]);
    const item = ir.rows[0];
    if (!item) return json(res, 404, { error: 'not_found' });

    const role = await query('select role from users where id = $1', [userId]);
    const isAdmin = role.rows[0]?.role === 'admin';
    const isParticipant = claim.claimant_id === userId || item.poster_id === userId || isAdmin;
    if (!isParticipant) return json(res, 403, { error: 'forbidden' });

    if (parsed.data.action === 'schedule') {
      const mp = parsed.data.meetingPoint || 'Main Building Lobby';
      const mt = parsed.data.meetingTime || 'Mar 22, 2026 at 2:00 PM';
      await query(
        'update claims set handover_status = $1, meeting_point = $2, meeting_time = $3 where id = $4',
        ['Scheduled', mp, mt, claimId]
      );
    } else {
      await query(
        "update claims set handover_status = 'Completed', status = 'Resolved' where id = $1",
        [claimId]
      );
      await query("update items set status = 'Resolved / Returned', resolved_at = $1, updated_at = now() where id = $2", [
        new Date().toISOString().slice(0, 10),
        item.id
      ]);
    }

    const crow = (await query('select * from claims where id = $1', [claimId])).rows[0];
    const ans = await query('select question_id, question, answer from claim_answers where claim_id = $1 order by id', [
      claimId
    ]);
    const irow = (await query('select * from items where id = $1', [item.id])).rows[0];

    return json(res, 200, { claim: mapClaimRow(crow, ans.rows), item: mapItem(irow) });
  } catch (e) {
    console.error('[claims/:id/handover]', e);
    return json(res, 500, { error: 'server_error' });
  }
};
