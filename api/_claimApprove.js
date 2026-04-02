const { query } = require('./_db');
const { json, newId } = require('./_util');
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

  const claimId = req.query.id;
  if (!claimId) return json(res, 400, { error: 'invalid_request' });

  const userId = await requireUserId(req, res);
  if (!userId) return;

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

    await query("update claims set status = 'Approved', chat_enabled = true where id = $1", [claimId]);
    await query("update items set status = 'Approved for Handover', updated_at = now() where id = $1", [item.id]);

    const d = new Date();
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    await query(
      `insert into messages (id, claim_id, sender_id, text, time, date, created_at)
       values ($1,$2,$3,$4,$5,$6,now())`,
      [
        newId('m'),
        claimId,
        'system',
        'Claim approved! Chat is now open. Please coordinate a safe handover.',
        timeStr,
        d.toISOString().slice(0, 10)
      ]
    );

    await insertNotification({
      userId: claim.claimant_id,
      type: 'approved',
      title: item.type === 'lost' ? 'Your response was accepted' : 'Your claim was approved',
      description: `Your claim regarding "${item.title}" was approved.`,
      screen: 'chat',
      claimId,
      itemId: item.id
    });

    const { mapClaimRow } = require('./_claimMap');
    const { mapItem } = require('./_itemsMap');
    const crow = (await query('select * from claims where id = $1', [claimId])).rows[0];
    const ans = await query('select question_id, question, answer from claim_answers where claim_id = $1 order by id', [
      claimId
    ]);
    const irow = (await query('select * from items where id = $1', [item.id])).rows[0];

    return json(res, 200, { ok: true, claim: mapClaimRow(crow, ans.rows), item: mapItem(irow) });
  } catch (e) {
    console.error('[claims/:id/approve]', e);
    return json(res, 500, { error: 'server_error' });
  }
};
