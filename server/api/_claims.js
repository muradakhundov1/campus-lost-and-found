const { query } = require('./_db');
const { json } = require('./_util');
const { requireUserId } = require('./_auth');
const { mapClaimRow } = require('./_claimMap');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.end();
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });

  const userId = await requireUserId(req, res);
  if (!userId) return;

  try {
    const r = await query(
      `select c.* from claims c
       join items i on i.id = c.item_id
       where c.claimant_id = $1 or i.poster_id = $1
       order by c.submitted_at desc`,
      [userId]
    );
    const claims = [];
    for (const row of r.rows) {
      const a = await query('select question_id, question, answer from claim_answers where claim_id = $1 order by id', [
        row.id
      ]);
      claims.push(mapClaimRow(row, a.rows));
    }
    return json(res, 200, { claims });
  } catch (e) {
    console.error('[claims GET]', e);
    return json(res, 500, { error: 'server_error' });
  }
};

