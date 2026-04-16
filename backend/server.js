const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { getDb } = require('./db');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: true, credentials: false }));

function nowIso() {
  return new Date().toISOString();
}
function id(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
function token() {
  return crypto.randomBytes(24).toString('hex');
}

function getAuthUser(req) {
  const header = req.header('authorization') || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const t = m[1].trim();
  if (!t) return null;
  const db = getDb();
  const session = db.prepare('SELECT token, user_id FROM sessions WHERE token = ?').get(t);
  if (!session) return null;
  const user = db.prepare('SELECT id,name,email,phone,role,avatar,verified,suspended,joined_date,department,year,post_count,resolved_count FROM users WHERE id = ?').get(session.user_id);
  if (!user) return null;
  return user;
}

function requireAuth(req, res, next) {
  const u = getAuthUser(req);
  if (!u) return res.status(401).json({ error: 'unauthorized' });
  req.user = u;
  next();
}

function mapClaimRow(row, answerRows) {
  const answers = (answerRows || []).map((a) => ({
    questionId: a.question_id,
    question: a.question,
    answer: a.answer
  }));
  return {
    id: row.id,
    itemId: row.item_id,
    claimantId: row.claimant_id,
    claimantName: row.claimant_name,
    isFinderResponse: Boolean(row.is_finder_response),
    status: row.status,
    submittedAt: row.submitted_at,
    chatEnabled: Boolean(row.chat_enabled),
    reviewNote: row.review_note || '',
    meetingPoint: row.meeting_point,
    meetingTime: row.meeting_time,
    handoverStatus: row.handover_status,
    answers
  };
}

function mapMessageRow(row) {
  return {
    id: row.id,
    senderId: row.sender_id,
    text: row.text,
    time: row.time,
    date: row.date
  };
}

function mapNotificationRow(row) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    desc: row.description,
    time: row.time_label || '',
    read: Boolean(row.read),
    screen: row.screen,
    claimId: row.claim_id,
    itemId: row.item_id
  };
}

function mapReportRow(row) {
  return {
    id: row.id,
    type: row.type,
    targetId: row.target_id,
    targetTitle: row.target_title,
    reporterId: row.reporter_id,
    reason: row.reason,
    detail: row.detail,
    severity: row.severity,
    status: row.status,
    createdAt: row.created_at
  };
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ===== Upload (Supabase Storage via service role key) =====
app.post('/api/upload', requireAuth, async (req, res) => {
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'item-photos';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
  if (!storageUrl || !bucket || !serviceRoleKey) {
    return res.status(500).json({
      error: 'storage_not_configured',
      missing: {
        SUPABASE_URL: !storageUrl,
        SUPABASE_STORAGE_BUCKET: !bucket,
        SUPABASE_SERVICE_ROLE_KEY: !serviceRoleKey
      }
    });
  }

  const ct = String(req.headers['content-type'] || '').toLowerCase();
  if (!ct.startsWith('image/')) return res.status(400).json({ error: 'invalid_file_type' });

  const maxBytes = 6 * 1024 * 1024;
  const chunks = [];
  let n = 0;
  req.on('data', (c) => {
    n += c.length;
    if (n > maxBytes) {
      try { req.destroy(); } catch {}
    } else {
      chunks.push(c);
    }
  });
  req.on('end', async () => {
    if (n > maxBytes) return res.status(413).json({ error: 'payload_too_large' });
    const buf = Buffer.concat(chunks);
    if (!buf.length) return res.status(400).json({ error: 'empty_file' });
    const rawName = String(req.headers['x-filename'] || '').trim();
    const rawExt = (rawName.split('.').pop() || '').toLowerCase();
    const safeExt = /^[a-z0-9]{1,8}$/.test(rawExt) ? rawExt : (ct.split('/')[1] || 'jpg');
    const filePath = `items/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
    const encPath = filePath.split('/').filter(Boolean).map(encodeURIComponent).join('/');
    const objPath = `${encodeURIComponent(bucket)}/${encPath}`;

    try {
      const upRes = await fetch(`${storageUrl}/storage/v1/object/${objPath}`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': ct,
          'x-upsert': 'false'
        },
        body: buf
      });
      if (!upRes.ok) return res.status(502).json({ error: 'upload_failed' });
      return res.json({
        path: filePath,
        publicUrl: `${storageUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encPath}`
      });
    } catch (e) {
      console.error('[upload]', e);
      return res.status(502).json({ error: 'upload_failed' });
    }
  });
});

// ===== Auth =====
app.post('/api/auth/login', (req, res) => {
  const body = z
    .object({
      identifier: z.string().min(1),
      password: z.string().min(1)
    })
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid_request' });

  const { identifier, password } = body.data;
  const db = getDb();
  const user = db
    .prepare('SELECT * FROM users WHERE email = ? OR phone = ?')
    .get(identifier, identifier);
  if (!user) return res.status(401).json({ error: 'invalid_credentials' });
  if (user.suspended) return res.status(403).json({ error: 'suspended' });
  if (!user.password_hash) return res.status(401).json({ error: 'invalid_credentials' });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid_credentials' });

  const t = token();
  db.prepare('INSERT INTO sessions (token,user_id,created_at,expires_at) VALUES (?,?,?,?)').run(t, user.id, nowIso(), null);
  const safeUser = db
    .prepare('SELECT id,name,email,phone,role,avatar,verified,suspended,joined_date,department,year,post_count,resolved_count FROM users WHERE id = ?')
    .get(user.id);
  res.json({ token: t, user: safeUser });
});

app.post('/api/auth/register', (req, res) => {
  const body = z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      role: z.enum(['student', 'staff']).default('student'),
      department: z.string().optional(),
      year: z.string().optional(),
      password: z.string().min(8)
    })
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid_request' });
  const db = getDb();
  const u = body.data;
  const newId = id('u');
  const avatar = u.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
  const password_hash = bcrypt.hashSync(u.password, 10);

  try {
    db.prepare(
      `INSERT INTO users (id,name,email,phone,password_hash,role,avatar,verified,suspended,joined_date,department,year,post_count,resolved_count)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      newId,
      u.name,
      u.email,
      u.phone || null,
      password_hash,
      u.role,
      avatar || 'U',
      1,
      0,
      nowIso().slice(0, 10),
      u.department || '',
      u.year || '',
      0,
      0
    );
  } catch (e) {
    return res.status(409).json({ error: 'user_exists' });
  }

  const t = token();
  db.prepare('INSERT INTO sessions (token,user_id,created_at,expires_at) VALUES (?,?,?,?)').run(t, newId, nowIso(), null);
  const safeUser = db
    .prepare('SELECT id,name,email,phone,role,avatar,verified,suspended,joined_date,department,year,post_count,resolved_count FROM users WHERE id = ?')
    .get(newId);
  res.status(200).json({ token: t, user: safeUser });
});

app.get('/api/me', requireAuth, (req, res) => res.json({ user: req.user }));

// ===== Config used by frontend =====
app.get('/api/config', (req, res) => {
  // Branding is handled in frontend separately; this is data/config for UI.
  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const storageAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const storageBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'item-photos';
  res.json({
    categories: [
      'Documents / ID Cards',
      'Electronics',
      'Keys',
      'Wallet / Money',
      'Earphones / Accessories',
      'Bags',
      'Clothing',
      'Other'
    ],
    locations: [
      'Main Building',
      'Library',
      'Cafeteria',
      'Lab',
      'Classroom Building',
      'Dormitory',
      'Parking Area',
      'Security Desk',
      'Other'
    ],
    predefinedQuestions: [
      'What brand is the item?',
      'What color is it?',
      'What was inside it?',
      'Where do you think you lost it?',
      'What identifying feature does it have?',
      'Can you describe any writing or labels on it?',
      'What model or size is it?'
    ],
    storage:
      storageUrl && storageAnonKey
        ? {
            url: storageUrl,
            anonKey: storageAnonKey,
            bucket: storageBucket
          }
        : null
  });
});

// ===== Items =====
app.get('/api/items', (req, res) => {
  const db = getDb();
  const { type, q, category, location, status } = req.query;
  const where = [];
  const params = {};

  if (type && (type === 'lost' || type === 'found')) {
    where.push('type = @type');
    params.type = type;
  }
  if (category) {
    where.push('category = @category');
    params.category = category;
  }
  if (location) {
    where.push('location = @location');
    params.location = location;
  }
  if (status) {
    where.push('status = @status');
    params.status = status;
  }
  if (q) {
    where.push('(lower(title) LIKE @q OR lower(description) LIKE @q OR lower(category) LIKE @q OR lower(location) LIKE @q)');
    params.q = `%${String(q).toLowerCase()}%`;
  }

  const sql = `SELECT * FROM items ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`;
  const items = db.prepare(sql).all(params);
  const qs = db.prepare('SELECT id,item_id,text,position FROM item_verification_questions WHERE item_id = ? ORDER BY position ASC').all.bind(db.prepare('SELECT id,item_id,text,position FROM item_verification_questions WHERE item_id = ? ORDER BY position ASC'));

  const withQuestions = items.map((it) => {
    const qRows = db.prepare('SELECT id,text,position FROM item_verification_questions WHERE item_id = ? ORDER BY position ASC').all(it.id);
    return {
      ...it,
      verificationQuestions: qRows.map((r) => ({ id: r.id, text: r.text }))
    };
  });
  res.json({ items: withQuestions });
});

app.get('/api/items/:id', (req, res) => {
  const db = getDb();
  const it = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!it) return res.status(404).json({ error: 'not_found' });
  const qRows = db.prepare('SELECT id,text,position FROM item_verification_questions WHERE item_id = ? ORDER BY position ASC').all(it.id);
  res.json({ item: { ...it, verificationQuestions: qRows.map((r) => ({ id: r.id, text: r.text })) } });
});

app.delete('/api/items/:id', requireAuth, (req, res) => {
  const db = getDb();
  const it = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!it) return res.status(404).json({ error: 'not_found' });
  if (it.poster_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.patch('/api/items/:id', requireAuth, (req, res) => {
  const status = req.body?.status;
  if (!status || typeof status !== 'string') return res.status(400).json({ error: 'invalid_request' });
  const db = getDb();
  const it = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!it) return res.status(404).json({ error: 'not_found' });
  if (it.poster_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  db.prepare('UPDATE items SET status = ?, updated_at = ? WHERE id = ?').run(status, nowIso(), req.params.id);
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  const qRows = db.prepare('SELECT id,text,position FROM item_verification_questions WHERE item_id = ? ORDER BY position ASC').all(item.id);
  res.json({ item: { ...item, verificationQuestions: qRows.map((r) => ({ id: r.id, text: r.text })) } });
});

app.post('/api/items', requireAuth, (req, res) => {
  const body = z
    .object({
      type: z.enum(['lost', 'found']),
      title: z.string().min(1),
      category: z.string().min(1),
      description: z.string().min(1),
      photoUrl: z.string().url().optional(),
      location: z.string().min(1),
      date: z.string().min(1),
      time: z.string().optional(),
      verificationQuestions: z.array(z.object({ id: z.string().optional(), text: z.string().optional() })).optional()
    })
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid_request' });
  const db = getDb();
  const it = body.data;

  const itemId = id('i');
  const posterName = (() => {
    const parts = req.user.name.split(' ').filter(Boolean);
    return parts.length >= 2 ? `${parts[0]} ${parts[1][0]}.` : parts[0] || req.user.name;
  })();
  const created = nowIso();
  db.prepare(
    `INSERT INTO items (id,type,title,category,description,photo_url,location,date,time,status,poster_id,poster_name,claim_count,resolved_at,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    itemId,
    it.type,
    it.title,
    it.category,
    it.description,
    it.photoUrl || null,
    it.location,
    it.date,
    it.time || '',
    'Active',
    req.user.id,
    posterName,
    0,
    null,
    created,
    created
  );

  if (it.type === 'found') {
    const qs = (it.verificationQuestions || [])
      .map((q) => ({ ...q, text: String(q.text ?? '').trim() }))
      .filter((q) => q.text.length > 0);
    const insertQ = db.prepare('INSERT INTO item_verification_questions (id,item_id,text,position) VALUES (?,?,?,?)');
    db.transaction((rows) => {
      rows.forEach((q, idx) => insertQ.run(id('q'), itemId, q.text.trim(), idx + 1));
    })(qs);
  }

  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
  const qRows = db.prepare('SELECT id,text,position FROM item_verification_questions WHERE item_id = ? ORDER BY position ASC').all(itemId);
  res.status(201).json({ item: { ...item, verificationQuestions: qRows.map((r) => ({ id: r.id, text: r.text })) } });
});

// ===== Claims =====
app.get('/api/items/:id/claims', requireAuth, (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  if (item.poster_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const claims = db.prepare('SELECT * FROM claims WHERE item_id = ? ORDER BY submitted_at DESC').all(item.id);
  const answersStmt = db.prepare('SELECT question_id,question,answer FROM claim_answers WHERE claim_id = ? ORDER BY id');
  res.json({
    claims: claims.map((c) => mapClaimRow(c, answersStmt.all(c.id)))
  });
});

app.post('/api/items/:id/claims', requireAuth, (req, res) => {
  const rawBody = { ...req.body };
  if (rawBody.isFinderResponse != null && typeof rawBody.isFinderResponse !== 'boolean') {
    rawBody.isFinderResponse =
      rawBody.isFinderResponse === true || rawBody.isFinderResponse === 'true' || rawBody.isFinderResponse === 1;
  }
  const body = z
    .object({
      answers: z.array(z.object({ questionId: z.string().optional(), question: z.string().min(1), answer: z.string().min(1) })).default([]),
      isFinderResponse: z.boolean().optional(),
      meetingPoint: z.string().optional()
    })
    .safeParse(rawBody);
  if (!body.success) return res.status(400).json({ error: 'invalid_request' });
  const db = getDb();
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  if (item.poster_id === req.user.id) return res.status(400).json({ error: 'cannot_claim_own_item' });

  const claimId = id('c');
  const created = nowIso();
  const isFinderResponse = body.data.isFinderResponse ? 1 : 0;
  db.prepare(
    `INSERT INTO claims (id,item_id,claimant_id,claimant_name,is_finder_response,status,submitted_at,chat_enabled,review_note)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).run(claimId, item.id, req.user.id, req.user.name, isFinderResponse, 'Pending', created, 0, '');

  const insertAns = db.prepare('INSERT INTO claim_answers (claim_id,question_id,question,answer) VALUES (?,?,?,?)');
  db.transaction((rows) => {
    rows.forEach((a) => insertAns.run(claimId, a.questionId || null, a.question, a.answer));
  })(body.data.answers || []);

  // Update item status + count similar to demo
  const newClaimCount = (item.claim_count || 0) + 1;
  const newStatus = item.type === 'found' ? 'Claim Pending' : item.status;
  db.prepare('UPDATE items SET claim_count = ?, status = ?, updated_at = ? WHERE id = ?').run(newClaimCount, newStatus, nowIso(), item.id);

  res.status(201).json({ id: claimId });
});

app.post('/api/claims/:id/approve', requireAuth, (req, res) => {
  const db = getDb();
  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) return res.status(404).json({ error: 'not_found' });
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(claim.item_id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  if (item.poster_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });

  db.prepare('UPDATE claims SET status = ?, chat_enabled = 1 WHERE id = ?').run('Approved', claim.id);
  db.prepare('UPDATE items SET status = ?, updated_at = ? WHERE id = ?').run('Approved for Handover', nowIso(), item.id);

  // system message
  db.prepare('INSERT INTO messages (id,claim_id,sender_id,text,time,date,created_at) VALUES (?,?,?,?,?,?,?)').run(
    id('m'),
    claim.id,
    'u4',
    'Claim approved! Chat is now open. Please coordinate a safe handover.',
    new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    new Date().toISOString().slice(0, 10),
    nowIso()
  );

  res.json({ ok: true });
});

app.post('/api/claims/:id/reject', requireAuth, (req, res) => {
  const db = getDb();
  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) return res.status(404).json({ error: 'not_found' });
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(claim.item_id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  if (item.poster_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });

  const note = typeof req.body?.reviewNote === 'string' ? req.body.reviewNote : 'Answers did not match.';
  db.prepare('UPDATE claims SET status = ?, review_note = ?, chat_enabled = 0 WHERE id = ?').run('Rejected', note, claim.id);
  res.json({ ok: true });
});

app.get('/api/claims', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.* FROM claims c
       JOIN items i ON i.id = c.item_id
       WHERE c.claimant_id = ? OR i.poster_id = ?
       ORDER BY c.submitted_at DESC`
    )
    .all(req.user.id, req.user.id);
  const answersStmt = db.prepare('SELECT question_id,question,answer FROM claim_answers WHERE claim_id = ? ORDER BY id');
  res.json({ claims: rows.map((row) => mapClaimRow(row, answersStmt.all(row.id))) });
});

app.post('/api/claims/:id/handover', requireAuth, (req, res) => {
  const body = z
    .object({
      action: z.enum(['schedule', 'complete']),
      meetingPoint: z.string().optional(),
      meetingTime: z.string().optional()
    })
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid_request' });
  const db = getDb();
  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) return res.status(404).json({ error: 'not_found' });
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(claim.item_id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  const isParticipant =
    claim.claimant_id === req.user.id || item.poster_id === req.user.id || req.user.role === 'admin';
  if (!isParticipant) return res.status(403).json({ error: 'forbidden' });

  if (body.data.action === 'schedule') {
    const mp = (body.data.meetingPoint || '').trim();
    const mt = (body.data.meetingTime || '').trim();
    if (!mp || !mt) return res.status(400).json({ error: 'meeting_required' });
    db.prepare('UPDATE claims SET handover_status = ?, meeting_point = ?, meeting_time = ? WHERE id = ?').run(
      'Scheduled',
      mp,
      mt,
      claim.id
    );
  } else {
    db.prepare("UPDATE claims SET handover_status = 'Completed', status = 'Resolved' WHERE id = ?").run(claim.id);
    db.prepare("UPDATE items SET status = 'Resolved / Returned', resolved_at = ?, updated_at = ? WHERE id = ?").run(
      new Date().toISOString().slice(0, 10),
      nowIso(),
      item.id
    );
  }

  const crow = db.prepare('SELECT * FROM claims WHERE id = ?').get(claim.id);
  const ans = db.prepare('SELECT question_id, question, answer FROM claim_answers WHERE claim_id = ? ORDER BY id').all(claim.id);
  const irow = db.prepare('SELECT * FROM items WHERE id = ?').get(item.id);
  const qRows = db.prepare('SELECT id,text,position FROM item_verification_questions WHERE item_id = ? ORDER BY position ASC').all(irow.id);
  const mappedItem = { ...irow, verificationQuestions: qRows.map((r) => ({ id: r.id, text: r.text })) };
  res.json({ claim: mapClaimRow(crow, ans), item: mappedItem });
});

// ===== Messages =====
app.get('/api/claims/:id/messages', requireAuth, (req, res) => {
  const db = getDb();
  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) return res.status(404).json({ error: 'not_found' });
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(claim.item_id);
  const isParticipant = claim.claimant_id === req.user.id || item?.poster_id === req.user.id || req.user.role === 'admin';
  if (!isParticipant) return res.status(403).json({ error: 'forbidden' });
  const msgs = db.prepare('SELECT * FROM messages WHERE claim_id = ? ORDER BY created_at ASC').all(claim.id);
  res.json({ messages: msgs.map(mapMessageRow) });
});

app.post('/api/claims/:id/messages', requireAuth, (req, res) => {
  const body = z.object({ text: z.string().min(1) }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid_request' });
  const db = getDb();
  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(req.params.id);
  if (!claim) return res.status(404).json({ error: 'not_found' });
  if (!claim.chat_enabled) return res.status(400).json({ error: 'chat_locked' });
  const item = db.prepare('SELECT * FROM items WHERE id = ?').get(claim.item_id);
  const isParticipant = claim.claimant_id === req.user.id || item?.poster_id === req.user.id || req.user.role === 'admin';
  if (!isParticipant) return res.status(403).json({ error: 'forbidden' });

  const d = new Date();
  const mid = id('m');
  db.prepare('INSERT INTO messages (id,claim_id,sender_id,text,time,date,created_at) VALUES (?,?,?,?,?,?,?)').run(
    mid,
    claim.id,
    req.user.id,
    body.data.text.trim(),
    d.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    d.toISOString().slice(0, 10),
    nowIso()
  );
  const row = db.prepare('SELECT * FROM messages WHERE id = ?').get(mid);
  res.status(201).json({ message: mapMessageRow(row) });
});

// ===== Reports (minimal) =====
app.get('/api/reports', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const db = getDb();
  const rows = db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all();
  res.json({ reports: rows.map(mapReportRow) });
});

app.post('/api/reports', requireAuth, (req, res) => {
  const body = z
    .object({
      type: z.enum(['post', 'user']),
      targetId: z.string().optional(),
      targetTitle: z.string().optional(),
      reason: z.string().min(1),
      detail: z.string().optional(),
      severity: z.enum(['low', 'medium', 'high']).default('medium')
    })
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid_request' });
  const db = getDb();
  const r = body.data;
  const reportId = id('r');
  db.prepare(
    'INSERT INTO reports (id,type,target_id,target_title,reporter_id,reason,detail,severity,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)'
  ).run(reportId, r.type, r.targetId || null, r.targetTitle || null, req.user.id, r.reason, r.detail || '', r.severity, 'pending', nowIso());
  res.status(201).json({ id: reportId });
});

app.get('/api/notifications', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 200')
    .all(req.user.id);
  res.json({ notifications: rows.map(mapNotificationRow) });
});

app.post('/api/notifications', requireAuth, (req, res) => {
  if (req.body?.markAllRead) {
    const db = getDb();
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
    return res.json({ ok: true });
  }
  return res.status(400).json({ error: 'invalid_request' });
});

app.get('/api/admin/stats', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const db = getDb();
  const userCount = db.prepare('SELECT count(*) AS c FROM users').get().c;
  const itemCount = db.prepare('SELECT count(*) AS c FROM items').get().c;
  const pendingReports = db.prepare("SELECT count(*) AS c FROM reports WHERE status = 'pending'").get().c;
  res.json({ userCount, itemCount, pendingReports });
});

app.get('/api/admin/log', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const db = getDb();
  const rows = db.prepare('SELECT id, action, target, note, admin_id, at FROM admin_log ORDER BY at DESC LIMIT 100').all();
  const adminLog = rows.map((row) => ({
    id: row.id,
    action: row.action,
    target: row.target,
    note: row.note,
    adminId: row.admin_id,
    at: row.at
  }));
  res.json({ adminLog });
});

const ADMIN_LABELS = {
  warning: 'Warning issued to user',
  remove: 'Post removed',
  suspend: 'User suspended',
  dismiss: 'Report dismissed'
};

app.post('/api/admin/actions', requireAuth, (req, res) => {
  const body = z
    .object({
      reportId: z.string().min(1),
      action: z.enum(['warning', 'remove', 'suspend', 'dismiss'])
    })
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: 'invalid_request' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
  const db = getDb();
  const r = db.prepare('SELECT * FROM reports WHERE id = ?').get(body.data.reportId);
  if (!r) return res.status(404).json({ error: 'not_found' });
  db.prepare("UPDATE reports SET status = 'reviewed' WHERE id = ?").run(body.data.reportId);
  db.prepare('INSERT INTO admin_log (id, action, target, note, admin_id, at) VALUES (?,?,?,?,?,?)').run(
    id('al'),
    ADMIN_LABELS[body.data.action],
    r.target_title || '',
    `Report ${body.data.reportId}`,
    req.user.id,
    nowIso()
  );
  res.json({ ok: true });
});

app.get('/api/users/:id', (req, res) => {
  const db = getDb();
  const u = db.prepare('SELECT id, name, avatar FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'not_found' });
  res.json({ user: { id: u.id, name: u.name, avatar: u.avatar } });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});

