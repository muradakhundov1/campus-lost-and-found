const { query } = require('./_db');
const { json, readJson, newId } = require('./_util');
const { requireUserId } = require('./_auth');

async function insertNotification({ userId, type, title, description, timeLabel, screen, claimId, itemId }) {
  const nid = newId('n');
  await query(
    `insert into notifications (id, user_id, type, title, description, time_label, read, screen, claim_id, item_id)
     values ($1,$2,$3,$4,$5,$6,false,$7,$8,$9)`,
    [nid, userId, type, title, description, timeLabel || 'Just now', screen || null, claimId || null, itemId || null]
  );
}

module.exports = async function handler(req, res) {
  if (req.method === 'POST') console.log('[api]', 'POST', '/claims/:id/reject', 'claimId=', req.query?.id);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.end();
  }
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

  const claimId = req.query.id;
  if (!claimId) return json(res, 400, { error: 'invalid_request' });

  const userId = await requireUserId(req, res);
  if (!userId) return;

  let body = {};
  try {
    body = await readJson(req);
  } catch {
    body = {};
  }
  const reviewNote =
    typeof body.reviewNote === 'string' && body.reviewNote.trim() ? body.reviewNote.trim() : 'Answers did not match.';

  try {
    const cr = await query('select * from claims where id = $1', [claimId]);
    const claim = cr.rows[0];
    if (!claim) return json(res, 404, { error: 'not_found' });

    const ir = await query('select * from items where id = $1', [claim.item_id]);
    const item = ir.rows[0];
    if (!item) return json(res, 404, { error: 'not_found' });

    const role = await query('select role from users where id = $1', [userId]);
    const isAdmin = role.rows[0]?.role === 'admin';
    if (item.poster_id !== userId && !isAdmin) return json(res, 403, { error: 'forbidden' });

    await query("update claims set status = 'Rejected', review_note = $1, chat_enabled = false where id = $2", [
      reviewNote,
      claimId
    ]);

    await insertNotification({
      userId: claim.claimant_id,
      type: 'rejected',
      title: item.type === 'lost' ? 'Your response was rejected' : 'Your claim was rejected',
      description: `Your claim regarding "${item.title}" was rejected.`,
      screen: 'item-detail',
      claimId,
      itemId: item.id
    });

    const { mapClaimRow } = require('./_claimMap');
    const crow = (await query('select * from claims where id = $1', [claimId])).rows[0];
    const ans = await query('select question_id, question, answer from claim_answers where claim_id = $1 order by id', [
      claimId
    ]);
    const updatedItem = (await query('select * from items where id = $1', [item.id])).rows[0];
    const { mapItem } = require('./_itemsMap');

    return json(res, 200, { ok: true, claim: mapClaimRow(crow, ans.rows), item: mapItem(updatedItem) });
  } catch (e) {
    console.error('[claims/:id/reject]', e);
    return json(res, 500, { error: 'server_error' });
  }
};

