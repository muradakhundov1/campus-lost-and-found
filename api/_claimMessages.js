const { z } = require('zod');
const { query } = require('./_db');
const { json, readJson, newId } = require('./_util');
const { mapMessageRow } = require('./_claimMap');
const { requireUserId } = require('./_auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'OPTIONS') {
    console.log('[api]', req.method, '/claims/:id/messages', 'claimId=', req.query?.id);
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    return res.end();
  }

  const claimId = req.query.id;
  if (!claimId) return json(res, 400, { error: 'invalid_request' });

  const userId = await requireUserId(req, res);
  if (!userId) return;

  if (req.method === 'GET') {
    try {
      const cr = await query('select * from claims where id = $1', [claimId]);
      const claim = cr.rows[0];
      if (!claim) return json(res, 404, { error: 'not_found' });

      const ir = await query('select poster_id from items where id = $1', [claim.item_id]);
      const item = ir.rows[0];
      if (!item) return json(res, 404, { error: 'not_found' });

      const role = await query('select role from users where id = $1', [userId]);
      const isAdmin = role.rows[0]?.role === 'admin';
      const isParticipant = claim.claimant_id === userId || item.poster_id === userId || isAdmin;
      if (!isParticipant) return json(res, 403, { error: 'forbidden' });

      const r = await query('select * from messages where claim_id = $1 order by created_at asc', [claimId]);
      return json(res, 200, { messages: r.rows.map(mapMessageRow) });
    } catch (e) {
      console.error('[claims/:id/messages GET]', e);
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
    const parsed = z.object({ text: z.string().min(1) }).safeParse(body);
    if (!parsed.success) return json(res, 400, { error: 'invalid_request' });

    try {
      const cr = await query('select * from claims where id = $1', [claimId]);
      const claim = cr.rows[0];
      if (!claim) return json(res, 404, { error: 'not_found' });
      if (!claim.chat_enabled) return json(res, 400, { error: 'chat_locked' });

      const ir = await query('select poster_id from items where id = $1', [claim.item_id]);
      const item = ir.rows[0];
      if (!item) return json(res, 404, { error: 'not_found' });

      const role = await query('select role from users where id = $1', [userId]);
      const isAdmin = role.rows[0]?.role === 'admin';
      const isParticipant = claim.claimant_id === userId || item.poster_id === userId || isAdmin;
      if (!isParticipant) return json(res, 403, { error: 'forbidden' });

      const d = new Date();
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const mid = newId('m');
      await query(
        `insert into messages (id, claim_id, sender_id, text, time, date, created_at)
         values ($1,$2,$3,$4,$5,$6,now())`,
        [mid, claimId, userId, parsed.data.text.trim(), timeStr, d.toISOString().slice(0, 10)]
      );

      const row = (await query('select * from messages where id = $1', [mid])).rows[0];
      return json(res, 201, { message: mapMessageRow(row) });
    } catch (e) {
      console.error('[claims/:id/messages POST]', e);
      return json(res, 500, { error: 'server_error' });
    }
  }

  return json(res, 405, { error: 'method_not_allowed' });
};
