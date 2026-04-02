const { z } = require('zod');
const { query } = require('./_db');
const { json, readJson, newId } = require('./_util');
const { mapClaimRow } = require('./_claimMap');
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

  const itemId = req.query.id;
  if (!itemId) return json(res, 400, { error: 'invalid_request' });

  const userId = await requireUserId(req, res);
  if (!userId) return;

  if (req.method === 'GET') {
    try {
      const item = await query('select poster_id from items where id = $1', [itemId]);
      if (!item.rows[0]) return json(res, 404, { error: 'not_found' });
      const role = await query('select role from users where id = $1', [userId]);
      const isAdmin = role.rows[0]?.role === 'admin';
      if (item.rows[0].poster_id !== userId && !isAdmin) return json(res, 403, { error: 'forbidden' });

      const r = await query('select * from claims where item_id = $1 order by submitted_at desc', [itemId]);
      const claims = [];
      for (const row of r.rows) {
        const a = await query(
          'select question_id, question, answer from claim_answers where claim_id = $1 order by id',
          [row.id]
        );
        claims.push(mapClaimRow(row, a.rows));
      }
      return json(res, 200, { claims });
    } catch (e) {
      console.error('[items/:id/claims GET]', e);
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
        answers: z
          .array(z.object({ questionId: z.string().optional(), question: z.string().min(1), answer: z.string().min(1) }))
          .default([]),
        isFinderResponse: z.boolean().optional()
      })
      .safeParse(body);
    if (!parsed.success) return json(res, 400, { error: 'invalid_request' });

    try {
      const ir = await query('select * from items where id = $1', [itemId]);
      const item = ir.rows[0];
      if (!item) return json(res, 404, { error: 'not_found' });
      if (item.poster_id === userId) return json(res, 400, { error: 'cannot_claim_own_item' });

      const urow = await query('select name from users where id = $1', [userId]);
      const claimantName = urow.rows[0]?.name || 'User';

      const claimId = newId('c');
      const isFinder = Boolean(parsed.data.isFinderResponse);

      await query(
        `insert into claims (id, item_id, claimant_id, claimant_name, is_finder_response, status, submitted_at, chat_enabled, review_note)
         values ($1,$2,$3,$4,$5,'Pending',now(),false,'')`,
        [claimId, itemId, userId, claimantName, isFinder]
      );

      for (const a of parsed.data.answers || []) {
        await query(
          'insert into claim_answers (claim_id, question_id, question, answer) values ($1,$2,$3,$4)',
          [claimId, a.questionId || null, a.question, a.answer]
        );
      }

      const newClaimCount = (item.claim_count || 0) + 1;
      const newStatus = item.type === 'found' ? 'Claim Pending' : item.status;
      await query('update items set claim_count = $1, status = $2, updated_at = now() where id = $3', [
        newClaimCount,
        newStatus,
        itemId
      ]);

      await insertNotification({
        userId: item.poster_id,
        type: isFinder ? 'finder' : 'claim',
        title: isFinder ? 'Someone responded to your lost item' : 'New claim on your item',
        description: isFinder
          ? `${claimantName} responded to "${item.title}".`
          : `${claimantName} submitted a claim on "${item.title}".`,
        timeLabel: 'Just now',
        screen: 'claim-review',
        claimId,
        itemId
      });

      const crow = (await query('select * from claims where id = $1', [claimId])).rows[0];
      const ans = await query('select question_id, question, answer from claim_answers where claim_id = $1 order by id', [
        claimId
      ]);
      const updatedItem = (await query('select * from items where id = $1', [itemId])).rows[0];
      const { mapItem } = require('./_itemsMap');

      return json(res, 201, {
        id: claimId,
        claim: mapClaimRow(crow, ans.rows),
        item: mapItem(updatedItem)
      });
    } catch (e) {
      console.error('[items/:id/claims POST]', e);
      return json(res, 500, { error: 'server_error' });
    }
  }

  return json(res, 405, { error: 'method_not_allowed' });
};
