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
    submittedAt: row.submitted_at ? new Date(row.submitted_at).toISOString() : new Date().toISOString(),
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
    read: row.read,
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
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : ''
  };
}

module.exports = { mapClaimRow, mapMessageRow, mapNotificationRow, mapReportRow };
