const { z } = require('zod');
const { query } = require('./_db');
const { json, readJson, authToken } = require('./_util');
const { mapItem } = require('./_itemsMap');

function posterAbbrev(name) {
  const parts = String(name || '')
    .split(' ')
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[0]} ${parts[1][0]}.`;
  return parts[0] || 'U.';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.end();

  if (req.method === 'GET') {
    try {
      const r = await query(
        `select id, type, title, category, description, location, date, time, status, poster_id, poster_name, claim_count, resolved_at, verification_questions, created_at
         from items order by created_at desc`
      );
      return json(res, 200, { items: r.rows.map(mapItem) });
    } catch (e) {
      console.error('[items GET]', e);
      return json(res, 500, { error: 'server_error' });
    }
  }

  if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed' });

  const t = authToken(req);
  if (!t) return json(res, 401, { error: 'unauthorized' });

  const sess = await query('select user_id from sessions where token = $1 limit 1', [t]);
  const userId = sess.rows[0]?.user_id;
  if (!userId) return json(res, 401, { error: 'unauthorized' });

  let body;
  try {
    body = await readJson(req);
  } catch {
    return json(res, 400, { error: 'invalid_json' });
  }

  const parsed = z
    .object({
      type: z.enum(['lost', 'found']),
      title: z.string().min(1),
      category: z.string().min(1),
      description: z.string().min(1),
      location: z.string().min(1),
      date: z.string().min(1),
      time: z.string().optional(),
      verificationQuestions: z.array(z.object({ id: z.string().optional(), text: z.string().min(1) })).optional()
    })
    .safeParse(body);
  if (!parsed.success) return json(res, 400, { error: 'invalid_request' });

  const p = parsed.data;
  const urow = await query('select name from users where id = $1 limit 1', [userId]);
  const posterName = posterAbbrev(urow.rows[0]?.name);

  const questionsJson = JSON.stringify(
    (p.verificationQuestions || []).map((q, i) => ({
      id: q.id || `nq${i}`,
      text: String(q.text).trim()
    }))
  );

  const itemId = `i${Date.now()}${Math.floor(Math.random() * 1000)}`;

  try {
    await query(
      `insert into items (id, type, title, category, description, location, date, time, status, poster_id, poster_name, claim_count, resolved_at, verification_questions, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0,null,$12::jsonb,now(),now())`,
      [
        itemId,
        p.type,
        p.title,
        p.category,
        p.description,
        p.location,
        p.date,
        p.time || '',
        'Active',
        userId,
        posterName,
        questionsJson
      ]
    );
    await query('update users set post_count = post_count + 1 where id = $1', [userId]);
    const row = (await query('select * from items where id = $1', [itemId])).rows[0];
    return json(res, 201, { item: mapItem(row) });
  } catch (e) {
    console.error('[items POST]', e);
    return json(res, 500, { error: 'server_error' });
  }
};
