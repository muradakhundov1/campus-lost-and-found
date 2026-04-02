function mapItem(row) {
  if (!row) return null;
  let vq = row.verification_questions;
  if (typeof vq === 'string') {
    try {
      vq = JSON.parse(vq);
    } catch {
      vq = [];
    }
  }
  const questions = Array.isArray(vq) ? vq : [];
  return {
    id: row.id,
    posterId: row.poster_id,
    posterName: row.poster_name,
    type: row.type,
    title: row.title,
    category: row.category,
    description: row.description,
    location: row.location,
    date: row.date,
    time: row.time || '',
    emoji: '',
    status: row.status,
    verificationQuestions: questions.map((q, i) => ({
      id: q.id || `nq${i}`,
      text: q.text || ''
    })),
    claimCount: row.claim_count,
    resolvedAt: row.resolved_at
  };
}

module.exports = { mapItem };
