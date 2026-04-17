// ========================================
// CAMPUS LOST & FOUND — CLAIM, CHAT, PROFILE, ADMIN SCREENS
// ========================================

function timeLocale() {
  return Lang.current === 'az' ? 'az-AZ' : 'en-US';
}

// ===== CLAIM SUBMIT =====
Screens['claim-submit'] = (ctx) => {
  const s = makeScreen('claim-submit');
  const item = DB.getItemById(ctx.itemId) || DB.items[0];
  const questions = item.verificationQuestions || [];
  const answers = questions.map(() => '');

  s.innerHTML = `
    ${backHeader(Lang.t('submitClaim'))}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div style="display:flex;gap:12px;align-items:center;background:white;border-radius:var(--r-lg);padding:14px;margin-bottom:20px;box-shadow:var(--shadow-sm);border:1px solid var(--border-light)">
        <div>${categoryIcon(item.category)}</div>
        <div><div style="font-size:15px;font-weight:700">${item.title}</div><div style="font-size:12px;color:var(--text-secondary)">${Lang.formatLocation(item.location)} · ${formatDate(item.date)}</div></div>
      </div>
      <div class="info-banner" style="margin:0 0 20px">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style="font-size:12px;color:var(--info);line-height:1.5">${Lang.t('claimHonestyBanner')}</div>
      </div>
      ${questions.length > 0 ? `
        <div class="section-title" style="margin-bottom:16px">${Lang.t('verifyQuestionsTitle2')}</div>
        <div id="claim-questions">
          ${questions.map((q, i) => `
            <div class="claim-q-card">
              <div class="claim-q-num">${i + 1}</div>
              <div class="claim-q-text">${q.text}</div>
              <textarea class="form-textarea" data-idx="${i}" placeholder="${Lang.t('yourAnswer')}" style="min-height:70px;font-size:13px"></textarea>
            </div>`).join('')}
        </div>` : `<div class="empty-state" style="padding:32px"><div class="empty-icon">📝</div><div class="empty-title">${Lang.t('noVerifyNeeded')}</div><div class="empty-desc">${Lang.t('noVerifyDesc')}</div></div>`}
      <div class="form-group" style="margin-top:${questions.length>0?'4px':'8px'}">
        <label class="form-label">${Lang.t('additionalNotes')}</label>
        <textarea class="form-textarea" id="claim-notes" placeholder="${Lang.t('claimNotesPlaceholder')}" style="min-height:80px"></textarea>
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="submit-claim-btn">${Lang.t('submitClaimBtn')}</button>
    </div>`;

  s.querySelectorAll('textarea[data-idx]').forEach(ta => {
    ta.addEventListener('input', () => { answers[+ta.dataset.idx] = ta.value; });
  });

  let claimSubmitBusy = false;
  s.querySelector('#submit-claim-btn').addEventListener('click', async () => {
    if (claimSubmitBusy) return;
    const u = DB.currentUser;
    if (!u?.id) { App.toast(Lang.t('signInShort')); return; }
    const answersPayload = questions.map((q, i) => ({
      ...(q.id != null && q.id !== '' ? { questionId: String(q.id) } : {}),
      question: (q.text && String(q.text).trim()) || '(question)',
      answer: (answers[i] != null && String(answers[i]).trim()) || '(no answer)'
    }));
    const notes = s.querySelector('#claim-notes').value.trim();
    if (notes) answersPayload.push({ questionId: 'notes', question: 'Additional notes', answer: notes });
    claimSubmitBusy = true;
    try {
      await window.Api.itemClaimsPost(item.id, { answers: answersPayload, isFinderResponse: false });
      await App.refreshRemoteData({ listsOnly: true });
      App.toast(Lang.t('claimOk'));
      setTimeout(() => App.navigate('item-detail', { itemId: item.id }), 800);
    } catch (e) {
      App.toastClaimApiError(e);
    } finally {
      claimSubmitBusy = false;
    }
  });
  return s;
};

// ===== CLAIM REVIEW (Finder side) =====
Screens['claim-review'] = (ctx) => {
  const s = makeScreen('claim-review');
  const item = DB.getItemById(ctx.itemId) || DB.items[0];
  let claims = DB.getItemClaims(item.id);
  const isLostItem = item.type === 'lost';

  const renderClaims = () => {
    claims = DB.getItemClaims(item.id);
    claimList.innerHTML = claims.length === 0
      ? `<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><div class="empty-title">${isLostItem ? Lang.t('noResponsesYet') : Lang.t('noClaimsYetShort')}</div></div>`
      : claims.map(claim => {
          const claimant = DB.getUserById(claim.claimantId);
          return `<div class="claim-review-card">
            <div class="claim-review-header">
              ${avatarHTML(claimant, 'avatar-md')}
              <div style="flex:1"><div style="font-size:15px;font-weight:700">${claim.claimantName}</div><div style="font-size:11px;color:var(--text-secondary)">${formatDate(claim.submittedAt)}</div></div>
              ${statusBadge(claim.status)}
            </div>
            ${claim.answers.length > 0 ? claim.answers.map(a=>`
              <div class="qa-item">
                <div class="qa-question">${a.question}</div>
                <div class="qa-answer">${a.answer}</div>
              </div>`).join('') : `<div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">${Lang.t('noVerificationForItem')}</div>`}
            ${claim.status === 'Pending' ? `
              <div style="display:flex;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light)">
                <button class="btn btn-danger btn-block btn-sm" onclick="window.rejectClaim('${claim.id}')">${Lang.t('reject')}</button>
                <button class="btn btn-success btn-block btn-sm" onclick="window.approveClaim('${claim.id}')">${isLostItem ? Lang.t('accept') : Lang.t('approve')}</button>
              </div>` : claim.status === 'Approved' ? `
              <div style="margin-top:10px"><button class="btn btn-primary btn-block btn-sm" onclick="App.navigate('chat',{claimId:'${claim.id}'})">${Lang.t('openChat')}</button></div>` : `
              <div style="font-size:12px;color:var(--text-secondary);margin-top:8px">${Lang.t('statusRejected')}. ${claim.reviewNote}</div>`}
          </div>`;}).join('');
  };

  s.innerHTML = `
    ${backHeader(isLostItem ? Lang.t('finderResponsesTitle') : Lang.t('claimsForItemTitle'), `<span style="font-size:13px;color:var(--text-secondary);font-weight:600">${isLostItem ? Lang.t('claimCountResponses', { count: claims.length }) : Lang.t('claimCountClaims', { count: claims.length })}</span>`)}
    <div style="padding:12px 16px;background:white;border-bottom:1px solid var(--border-light);display:flex;gap:10px;align-items:center">
      <div>${categoryIcon(item.category)}</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:700">${item.title}</div><div style="font-size:11px;color:var(--text-secondary)">${Lang.formatLocation(item.location)}</div></div>
    </div>
    <div class="scroll-area has-bottom-pad" style="padding:16px" id="claim-list"></div>`;

  const claimList = s.querySelector('#claim-list');
  renderClaims();

  window.approveClaim = async (claimId) => {
    try {
      await window.Api.claimApprove(claimId);
      await App.refreshRemoteData({ listsOnly: true });
      renderClaims();
      App.toast(isLostItem ? Lang.t('responseAcceptedChat') : Lang.t('claimApprovedChat'));
    } catch (e) {
      App.toast(Lang.t('toastApiGeneric'));
    }
  };
  window.rejectClaim = async (claimId) => {
    try {
      await window.Api.claimReject(claimId, Lang.t('rejectMatchNote'));
      await App.refreshRemoteData({ listsOnly: true });
      renderClaims();
      App.toast(Lang.t('claimRejected'));
    } catch (e) {
      App.toast(Lang.t('toastApiGeneric'));
    }
  };
  return s;
};

// ===== CHAT =====
Screens.chat = (ctx) => {
  const s = makeScreen('chat');
  const claim = DB.getClaimById(ctx.claimId) || DB.claims.find(c => c.chatEnabled);
  if (!claim) { s.innerHTML = backHeader(Lang.t('chatTitle')) + `<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><div class="empty-title">${Lang.t('noActiveChats')}</div></div>`; return s; }
  const item = DB.getItemById(claim.itemId);
  const u = DB.currentUser;
  const otherId = u?.id === claim.claimantId ? item?.posterId : claim.claimantId;
  const other = DB.getUserById(otherId);
  let msgs = DB.messages[claim.id] || [];

  const renderMsgs = () => {
    msgList.innerHTML = `
      <div class="chat-system-msg">${Lang.t('chatUnlocked')} · ${formatDate(claim.submittedAt)}</div>
      ${msgs.map(m => {
        if (m.senderId === 'system') return `<div class="chat-system-msg">${m.text}</div>`;
        const isOwn = m.senderId === u?.id;
        return `<div class="chat-bubble-wrap ${isOwn ? 'own' : ''}">
          ${!isOwn ? avatarHTML(DB.getUserById(m.senderId), 'avatar-sm') : ''}
          <div class="chat-bubble ${isOwn ? 'own' : 'other'}">${m.text}</div>
          <span class="chat-time">${m.time}</span>
        </div>`;}).join('')}`;
    msgList.scrollTop = msgList.scrollHeight;
  };

  s.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%">
      <div class="chat-header">
        <button class="back-btn" onclick="App.back()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>
        ${avatarHTML(other, 'avatar-md')}
        <div class="chat-header-info">
          <div class="chat-header-name">${other?.name || Lang.t('chatUserFallback')}</div>
          <div class="chat-header-status">● ${Lang.t('statusActive')}</div>
        </div>
        <button class="icon-btn" onclick="App.navigate('handover',{claimId:'${claim.id}'})" style="color:var(--primary)" aria-label="${Lang.t('handoverShortAria')}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        </button>
      </div>
      <div style="background:var(--border-light);padding:8px 16px;font-size:11px;color:var(--text-secondary);text-align:center">
        ${Lang.t('reItem')}: <strong>${item?.title}</strong> · ${Lang.formatLocation(item?.location)}
      </div>
      <div class="chat-messages" id="chat-msgs" style="flex:1;overflow-y:auto"></div>
      <div class="chat-action-bar">
        <div style="display:flex;gap:8px;margin-bottom:8px;overflow-x:auto;scrollbar-width:none">
          <button class="btn btn-secondary btn-sm" style="white-space:nowrap;font-size:11px" onclick="window.sendQuick(${JSON.stringify(Lang.t('quickMsgLobby'))})">${Lang.t('suggestMeeting')}</button>
          <button class="btn btn-secondary btn-sm" style="white-space:nowrap;font-size:11px" onclick="App.navigate('handover',{claimId:'${claim.id}'})">${Lang.t('trackHandover')}</button>
          <button class="btn btn-secondary btn-sm" style="white-space:nowrap;font-size:11px" onclick="window.sendQuick(${JSON.stringify(Lang.t('quickMsgThanks'))})">${Lang.t('confirmReceipt')}</button>
        </div>
        <div class="chat-input-row">
          <input class="chat-input" id="chat-input" placeholder="${Lang.t('chatInputPlaceholder')}" />
          <button class="chat-send-btn" id="chat-send" aria-label="${Lang.t('sendAria')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>`;

  const msgList = s.querySelector('#chat-msgs');
  const input = s.querySelector('#chat-input');
  renderMsgs();

  (async () => {
    try {
      const { messages } = await window.Api.claimMessagesGet(claim.id);
      DB.messages[claim.id] = messages;
      msgs = messages;
      renderMsgs();
    } catch (e) {
      console.warn('Chat load failed:', e);
    }
  })();

  let chatSending = false;
  const sendMsg = async (text) => {
    if (!text.trim()) return;
    if (chatSending) return;
    chatSending = true;
    try {
      const { message } = await window.Api.claimMessagesPost(claim.id, text.trim());
      if (!DB.messages[claim.id]) DB.messages[claim.id] = [];
      DB.messages[claim.id].push(message);
      msgs = DB.messages[claim.id];
      renderMsgs();
      input.value = '';
    } catch (e) {
      App.toast(Lang.t('toastApiGeneric'));
    } finally {
      chatSending = false;
    }
  };

  window.sendQuick = (t) => sendMsg(t);
  s.querySelector('#chat-send').addEventListener('click', () => sendMsg(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    sendMsg(input.value);
  });
  return s;
};

// ===== HANDOVER TRACKING =====
Screens.handover = (ctx) => {
  const s = makeScreen('handover');
  const claim = DB.getClaimById(ctx.claimId) || DB.claims.find(c => c.status === 'Approved');
  const item = claim ? DB.getItemById(claim.itemId) : DB.items[0];
  const steps = [Lang.t('handoverStep1'), Lang.t('handoverStep2'), Lang.t('handoverStep3'), Lang.t('handoverStep4'), Lang.t('handoverStep5')];
  const stepDone = claim?.handoverStatus === 'Completed' ? 5 : claim?.handoverStatus === 'Scheduled' ? 3 : claim?.status === 'Approved' ? 1 : 0;

  s.innerHTML = `
    ${backHeader(Lang.t('handoverTitle'))}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div class="handover-card">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
          <div>${categoryIcon(item?.category || 'Other')}</div>
          <div><div style="font-size:15px;font-weight:700">${item?.title}</div><div style="font-size:12px;color:var(--text-secondary)">${Lang.formatLocation(item?.location)}</div></div>
        </div>
        ${statusBadge(claim?.status || 'Approved')}
        <div class="handover-status-bar" style="margin-top:20px">
          <div class="handover-progress"><div class="handover-progress-fill" style="width:${(stepDone/steps.length)*100}%"></div></div>
          <div class="handover-steps" style="margin-top:12px">
            ${steps.map((st, i) => `<div class="handover-step">
              <div class="handover-step-dot ${i < stepDone ? 'done' : i === stepDone ? 'current' : ''}">${i < stepDone ? '✓' : i + 1}</div>
              <div class="handover-step-label">${st}</div>
            </div>`).join('')}
          </div>
        </div>
      </div>

      ${claim?.meetingPoint ? `
        <div style="background:white;border-radius:var(--r-lg);padding:16px;box-shadow:var(--shadow-sm);border:1px solid var(--border-light);margin-bottom:16px">
          <div style="font-size:13px;font-weight:700;margin-bottom:12px">${Lang.t('arrangedHandover')}</div>
          <div class="detail-row" style="border:none;padding:6px 0"><div class="detail-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div><div class="detail-row-content"><div class="detail-row-label">${Lang.t('meetingPointLabel')}</div><div class="detail-row-value">${claim.meetingPoint}</div></div></div>
          <div class="detail-row" style="border:none;padding:6px 0"><div class="detail-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div class="detail-row-content"><div class="detail-row-label">${Lang.t('meetingTime')}</div><div class="detail-row-value">${claim.meetingTime || Lang.t('notSet')}</div></div></div>
        </div>` : ''}

      <div class="status-timeline">
        ${steps.slice(0, stepDone + 1).map((st, i) => `
          <div class="timeline-item">
            <div class="timeline-dot ${i < stepDone ? 'done' : 'current'}">${i < stepDone ? '✓' : '●'}</div>
            <div class="timeline-content">
              <div class="timeline-label">${st}</div>
              <div class="timeline-date">${i === 0 ? formatDate(claim?.submittedAt || '') : 'Mar ' + (19 + i) + ', 2026'}</div>
            </div>
          </div>`).join('')}
      </div>

      ${stepDone < 5 ? `
        <div style="display:flex;flex-direction:column;gap:10px;margin-top:8px">
          ${stepDone < 2 ? `<button class="btn btn-outline btn-block" onclick="App.navigate('chat',{claimId:'${claim?.id}'})">${Lang.t('openChat')}</button>` : ''}
          ${stepDone < 3 ? `<button class="btn btn-primary btn-block" onclick="window.openHandoverScheduleModal()">${Lang.t('scheduleHandover')}</button>` : ''}
          ${stepDone === 3 ? `<button class="btn btn-success btn-block" onclick="window.confirmHandover()">${Lang.t('confirmReceived')}</button>` : ''}
        </div>` : `
        <div class="info-banner success" style="margin:0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          <div><strong>${Lang.t('handoverCompleteTitle')}</strong><br><span style="font-size:12px">${Lang.t('handoverCompleteDesc')}</span></div>
        </div>`}
    </div>`;

  const formatHandoverMeetingTime = (dtLocal) => {
    if (!dtLocal) return '';
    const d = new Date(dtLocal);
    if (Number.isNaN(d.getTime())) return dtLocal;
    try {
      return d.toLocaleString(Lang.current === 'az' ? 'az-AZ' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return dtLocal;
    }
  };

  window.openHandoverScheduleModal = () => {
    if (!claim) return;
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    const locOpts = (DB.locations || []).map((l) => `<option value="${esc(l)}">${Lang.formatLocation(l)}</option>`).join('');
    App.showModal(`
      <div style="padding:12px 16px 20px">
        <div style="font-size:17px;font-weight:700;margin-bottom:4px">${Lang.t('handoverScheduleModalTitle')}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;line-height:1.45">${Lang.t('handoverScheduleModalHint')}</div>
        <div class="form-group">
          <label class="form-label">${Lang.t('meetingPointLabel')}</label>
          <select class="form-select" id="handover-modal-meeting">
            <option value="">${Lang.t('selectLocation')}</option>
            ${locOpts}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">${Lang.t('handoverMeetingTimeLabel')}</label>
          <input type="datetime-local" class="form-input" id="handover-modal-time" />
        </div>
        <button type="button" class="btn btn-primary btn-block" id="handover-modal-submit">${Lang.t('handoverConfirmSchedule')}</button>
        <button type="button" class="btn btn-outline btn-block" style="margin-top:8px" onclick="App.closeModal()">${Lang.t('handoverModalCancel')}</button>
      </div>`);
    setTimeout(() => {
      const timeEl = document.getElementById('handover-modal-time');
      if (timeEl) {
        const min = new Date();
        min.setMinutes(min.getMinutes() - min.getTimezoneOffset());
        timeEl.min = min.toISOString().slice(0, 16);
      }
      document.getElementById('handover-modal-submit')?.addEventListener('click', async () => {
        const mp = document.getElementById('handover-modal-meeting')?.value?.trim();
        const raw = document.getElementById('handover-modal-time')?.value;
        if (!mp || !raw) {
          App.toast(Lang.t('toastHandoverMeetingRequired'));
          return;
        }
        const mt = formatHandoverMeetingTime(raw);
        try {
          await window.Api.claimHandover(claim.id, { action: 'schedule', meetingPoint: mp, meetingTime: mt });
          App.closeModal();
          await App.refreshRemoteData({ listsOnly: true });
          App.toast(Lang.t('handoverScheduled'));
          App.navigate('handover', { claimId: ctx.claimId });
        } catch (e) {
          if (e?.data?.error === 'meeting_required') App.toast(Lang.t('toastHandoverMeetingRequired'));
          else App.toast(Lang.t('toastApiGeneric'));
        }
      });
    }, 0);
  };
  window.confirmHandover = async () => {
    if (!claim) return;
    try {
      await window.Api.claimHandover(claim.id, { action: 'complete' });
      await App.refreshRemoteData({ listsOnly: true });
      App.toast(Lang.t('handoverConfirmed'));
      App.navigate('handover', { claimId: ctx.claimId });
    } catch (e) {
      App.toast(Lang.t('toastApiGeneric'));
    }
  };
  return s;
};

// ===== MESSAGES LIST =====
Screens.messages = () => {
  const s = makeScreen('messages');
  const u = DB.currentUser;
  const myApprovedClaims = DB.claims.filter(c => c.chatEnabled && (c.claimantId === u?.id || DB.getItemById(c.itemId)?.posterId === u?.id));

  s.innerHTML = `
    <div class="nav-header"><h1>${Lang.t('messages')}</h1></div>
    <div class="scroll-area has-bottom-pad">
      ${myApprovedClaims.length === 0 ? `
        <div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><div class="empty-title">${Lang.t('noMessagesYet')}</div>
        <div class="empty-desc">${Lang.t('noMessagesDesc')}</div></div>` :
      myApprovedClaims.map(claim => {
        const item = DB.getItemById(claim.itemId);
        const otherId = u?.id === claim.claimantId ? item?.posterId : claim.claimantId;
        const other = DB.getUserById(otherId);
        const lastMsg = (DB.messages[claim.id] || []).slice(-1)[0];
        return `<div class="message-thread" onclick="App.navigate('chat',{claimId:'${claim.id}'})">
          ${avatarHTML(other, 'avatar-md')}
          <div class="message-thread-info">
            <div class="message-thread-name">${other?.name || Lang.t('chatUserFallback')}</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:3px">${item?.title}</div>
            <div class="message-thread-preview">${lastMsg ? lastMsg.text : Lang.t('chatOpenedPreview')}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
            <div class="message-thread-time">${lastMsg?.time || ''}</div>
          </div>
        </div>`;}).join('')}
    </div>`;
  return s;
};

// ===== NOTIFICATIONS =====
Screens.notifications = () => {
  const s = makeScreen('notifications');
  s.innerHTML = `
    ${backHeader(Lang.t('notifications'), `<button class="icon-btn" id="notif-mark-all" style="font-size:11px;color:var(--primary);width:auto;padding:0 4px">${Lang.t('markAllRead')}</button>`)}
    <div class="scroll-area has-bottom-pad">
      ${DB.notifications.length === 0 ? `<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></div><div class="empty-title">${Lang.t('noNotifications')}</div></div>` :
      DB.notifications.map(n => `
        <div class="notif-item ${n.read?'':'unread'}" onclick="n.read=true;${n.screen?`App.navigate('${n.screen}',{claimId:'${n.claimId||''}',itemId:'${n.itemId||''}'})`:''}" data-id="${n.id}">
          <div class="notif-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
          <div class="notif-content">
            <div class="notif-title">${n.title}</div>
            <div class="notif-desc">${n.desc}</div>
          </div>
          <div class="notif-time">${n.time}</div>
        </div>`).join('')}
    </div>`;
  s.querySelector('#notif-mark-all')?.addEventListener('click', async () => {
    try {
      await window.Api.notificationsMarkAllRead();
      await App.refreshRemoteData({ notificationsOnly: true });
      App.navigate('notifications');
    } catch (e) {
      App.toast(Lang.t('toastApiGeneric'));
    }
  });
  return s;
};

// ===== PROFILE =====
Screens.profile = () => {
  const s = makeScreen('profile');
  const u = DB.currentUser;
  if (!u) {
    s.innerHTML = `${backHeader(Lang.t('account'))}<div class="empty-state"><div class="empty-icon">👤</div><div class="empty-title">${Lang.t('account')}</div><div class="empty-desc">${Lang.t('signInToViewProfile')}</div><button class="btn btn-primary" onclick="App.navigate('login',{},false)">${Lang.t('signInButton')}</button></div>`;
    return s;
  }

  s.innerHTML = `
    <div class="scroll-area has-bottom-pad">
      <div class="profile-header">
        <div style="display:flex;justify-content:flex-end"><button class="icon-btn" style="color:white" onclick="App.navigate('settings')" aria-label="${Lang.t('settings')}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg></button></div>
        <div class="avatar avatar-xl" style="margin:0 auto;font-size:28px;background:rgba(255,255,255,0.2);color:white">${u.avatar}</div>
        <div class="profile-name">${u.name}</div>
        <div class="profile-role">${u.department} · ${u.year}</div>
        <div style="margin-top:8px">${u.role==='admin'?`<span class="badge badge-pending">${Lang.t('roleAdminBadge')}</span>`:u.role==='staff'?`<span class="badge badge-info">${Lang.t('roleStaffBadge')}</span>`:`<span class="badge badge-active">${Lang.t('roleStudentBadge')}</span>`}</div>
        <div class="profile-stats">
          <div class="stat-item"><div class="stat-num">${DB.getMyItems(u.id).length}</div><div class="stat-label">${Lang.t('myPosts')}</div></div>
          <div class="stat-item"><div class="stat-num">${DB.getMyClaims(u.id).length}</div><div class="stat-label">${Lang.t('myClaims')}</div></div>
          <div class="stat-item"><div class="stat-num">${u.resolvedCount ?? DB.getMyItems(u.id).filter(i => i.status === 'Resolved / Returned').length}</div><div class="stat-label">${Lang.t('resolvedLabel')}</div></div>
        </div>
      </div>
      <div class="profile-menu">
        <div class="menu-item" onclick="App.navigate('account')">
          <div class="menu-item-icon" style="background:var(--info-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
          <span class="menu-item-label">${Lang.t('account')}</span>
          <svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="menu-item" onclick="App.navigate('my-posts')">
          <div class="menu-item-icon" style="background:var(--primary-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <span class="menu-item-label">${Lang.t('myPosts')}</span>
          <span style="font-size:12px;color:var(--text-secondary);margin-right:8px">${DB.getMyItems(u.id).length} ${Lang.t('itemsCount')}</span>
          <svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="menu-item" onclick="App.navigate('my-claims')">
          <div class="menu-item-icon" style="background:var(--success-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
          <span class="menu-item-label">${Lang.t('myClaims')}</span>
          <span style="font-size:12px;color:var(--text-secondary);margin-right:8px">${DB.getMyClaims(u.id).length} ${Lang.t('claimsCountSuffix')}</span>
          <svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="menu-item" onclick="App.navigate('language')">
          <div class="menu-item-icon" style="background:var(--primary-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-2"/><path d="M2 20h12"/><path d="M14 20c1.8-1.2 3-3.3 3-6 0-5-4-10-4-10s-4 5-4 10c0 2.7 1.2 4.8 3 6z"/></svg></div>
          <span class="menu-item-label">${Lang.t('language')}</span>
          <span style="font-size:12px;color:var(--text-secondary);margin-right:8px">${Lang.current.toUpperCase()}</span>
          <svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="menu-item" onclick="App.navigate('notifications')">
          <div class="menu-item-icon" style="background:var(--warning-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></div>
          <span class="menu-item-label">${Lang.t('notifications')}</span>
          ${DB.notifications.filter(n=>!n.read).length>0?`<span class="badge badge-active" style="margin-right:8px">${DB.notifications.filter(n=>!n.read).length} ${Lang.t('newBadge')}</span>`:''}
          <svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        ${u.role === 'admin' ? `<div class="menu-item" onclick="App.navigate('admin-dashboard')">
          <div class="menu-item-icon" style="background:var(--warning-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
          <span class="menu-item-label">${Lang.t('adminDashboard')}</span>
          <svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>` : ''}
        <div class="divider" style="margin:8px 0"></div>
        <div class="menu-item" onclick="App.logout()" style="color:var(--danger)">
          <div class="menu-item-icon" style="background:var(--danger-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg></div>
          <span class="menu-item-label" style="color:var(--danger)">${Lang.t('logout')}</span>
        </div>
      </div>
    </div>`;
  return s;
};

// ===== ACCOUNT INFO =====
Screens.account = () => {
  const s = makeScreen('account');
  const u = DB.currentUser;
  if (!u) {
    s.innerHTML = `${backHeader(Lang.t('account'))}<div class="empty-state"><div class="empty-icon">🔒</div><div class="empty-title">${Lang.t('account')}</div><div class="empty-desc">${Lang.t('signInShort')}</div><button class="btn btn-primary" onclick="App.navigate('login',{},false)">${Lang.t('signInButton')}</button></div>`;
    return s;
  }
  s.innerHTML = `
    ${backHeader(Lang.t('account'))}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div class="card" style="padding:16px;border:1px solid var(--border-light)">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
          ${avatarHTML(u, 'avatar-lg')}
          <div style="flex:1">
            <div style="font-size:16px;font-weight:800">${u.name}</div>
            <div style="font-size:12px;color:var(--text-secondary)">${u.role === 'admin' ? Lang.t('admin') : u.role === 'staff' ? Lang.t('staff') : Lang.t('student')}</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div><div style="font-size:11px;color:var(--text-tertiary);font-weight:700">${Lang.t('emailLabel')}</div><div style="font-size:13px;font-weight:600">${u.email || '-'}</div></div>
          <div><div style="font-size:11px;color:var(--text-tertiary);font-weight:700">${Lang.t('phoneLabel')}</div><div style="font-size:13px;font-weight:600">${u.phone || '-'}</div></div>
          <div><div style="font-size:11px;color:var(--text-tertiary);font-weight:700">${Lang.t('facultyProgram')}</div><div style="font-size:13px;font-weight:600">${u.department || '-'}</div></div>
        </div>
      </div>
    </div>`;
  return s;
};

// ===== LANGUAGE =====
Screens.language = () => {
  const s = makeScreen('language');
  s.innerHTML = `
    ${backHeader(Lang.t('language'))}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div class="menu-item" onclick="Lang.set('en')" style="border:1.5px solid var(--border-light);border-radius:var(--r-lg);margin-bottom:10px">
        <span class="menu-item-label">${Lang.t('english')}</span>
        ${Lang.current==='en' ? '<span class="badge badge-active">✓</span>' : ''}
      </div>
      <div class="menu-item" onclick="Lang.set('az')" style="border:1.5px solid var(--border-light);border-radius:var(--r-lg)">
        <span class="menu-item-label">${Lang.t('azeri')}</span>
        ${Lang.current==='az' ? '<span class="badge badge-active">✓</span>' : ''}
      </div>
    </div>`;
  return s;
};

// ===== MY POSTS =====
Screens['my-posts'] = () => {
  const s = makeScreen('my-posts');
  const u = DB.currentUser;
  const items = DB.getMyItems(u?.id || 'u1');
  s.innerHTML = `
    ${backHeader(Lang.t('myPosts'), `<button class="icon-btn" onclick="App.navigate('post-type')" aria-label="${Lang.t('ariaLabelPost')}" style="background:var(--primary);color:white;border-radius:50%"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>`)}
    <div class="scroll-area has-bottom-pad" style="padding-top:8px">
      ${items.length === 0 ? `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">${Lang.t('noPostsYet')}</div><div class="empty-desc">${Lang.t('noPostsDesc')}</div><button class="btn btn-primary" onclick="App.navigate('post-type')">${Lang.t('postItem')}</button></div>` :
      items.map(i => itemCardHTML(i)).join('')}
    </div>`;
  return s;
};

// ===== MY CLAIMS =====
Screens['my-claims'] = () => {
  const s = makeScreen('my-claims');
  const u = DB.currentUser;
  const claims = DB.getMyClaims(u?.id || 'u1');
  s.innerHTML = `
    ${backHeader(Lang.t('myClaims'))}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      ${claims.length === 0 ? `<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg></div><div class="empty-title">${Lang.t('noClaimsYet')}</div><div class="empty-desc">${Lang.t('noClaimsDesc')}</div><button class="btn btn-primary" onclick="App.navigate('search',{type:'found'})">${Lang.t('browseFoundItems')}</button></div>` :
      claims.map(claim => {
        const item = DB.getItemById(claim.itemId);
        return `<div class="claim-review-card" onclick="App.navigate('item-detail',{itemId:'${claim.itemId}'})">
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
            <div>${categoryIcon(item?.category || 'Other')}</div>
            <div style="flex:1"><div style="font-size:14px;font-weight:700">${item?.title || Lang.t('unknownItem')}</div><div style="font-size:11px;color:var(--text-secondary)">${formatDate(claim.submittedAt)}</div></div>
            ${statusBadge(claim.status)}
          </div>
          ${claim.status === 'Approved' && claim.chatEnabled ? `<button class="btn btn-primary btn-block btn-sm" onclick="event.stopPropagation();App.navigate('chat',{claimId:'${claim.id}'})">${Lang.t('openChat')}</button>` : ''}
          ${claim.handoverStatus === 'Scheduled' ? `<button class="btn btn-secondary btn-block btn-sm" style="margin-top:8px" onclick="event.stopPropagation();App.navigate('handover',{claimId:'${claim.id}'})">${Lang.t('trackHandover')}</button>` : ''}
        </div>`;}).join('')}
    </div>`;
  return s;
};

// ===== REPORT =====
Screens.report = (ctx) => {
  const s = makeScreen('report');
  const reasonKeys = ['reasonSpam', 'reasonFake', 'reasonHarass', 'reasonFalseClaim', 'reasonInappropriate', 'reasonOther'];
  let selectedReasonKey = '';

  s.innerHTML = `
    ${backHeader(ctx.targetType === 'user' ? Lang.t('reportTitleUser') : Lang.t('reportTitlePost'))}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div class="info-banner warning" style="margin:0 0 20px">
        <span>⚠️</span>
        <div style="font-size:12px;color:var(--warning);line-height:1.5">${Lang.t('reportWarning')}</div>
      </div>
      <div style="background:white;border-radius:var(--r-lg);padding:14px;margin-bottom:20px;border:1px solid var(--border-light)">
        <div style="font-size:11px;color:var(--text-tertiary);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${Lang.t('reportingLabel')}</div>
        <div style="font-size:15px;font-weight:700">${ctx.targetTitle || Lang.t('thisItem')}</div>
      </div>
      <div class="section-title" style="margin-bottom:12px">${Lang.t('selectReason')}</div>
      <div id="reason-list" style="display:flex;flex-direction:column;gap:10px">
        ${reasonKeys.map(k => `<div class="menu-item" data-reason-key="${k}" style="border:1.5px solid var(--border-light);border-radius:var(--r-lg);padding:12px 16px">
          <span style="flex:1;font-size:14px">${Lang.t(k)}</span>
          <div class="reason-check" style="width:20px;height:20px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center"></div>
        </div>`).join('')}
      </div>
      <div class="form-group" style="margin-top:20px">
        <label class="form-label">${Lang.t('additionalDetails')}</label>
        <textarea class="form-textarea" id="report-detail" placeholder="${Lang.t('reportDetailPlaceholder')}"></textarea>
      </div>
      <button class="btn btn-danger btn-block btn-lg" id="submit-report-btn" disabled>${Lang.t('submitReport')}</button>
    </div>`;

  s.querySelectorAll('[data-reason-key]').forEach(item => {
    item.addEventListener('click', () => {
      s.querySelectorAll('[data-reason-key]').forEach(i => { i.style.borderColor = 'var(--border-light)'; i.querySelector('.reason-check').innerHTML = ''; i.querySelector('.reason-check').style.borderColor = 'var(--border)'; });
      item.style.borderColor = 'var(--danger)';
      item.querySelector('.reason-check').innerHTML = '✓'; item.querySelector('.reason-check').style.cssText += 'background:var(--danger);color:white;border-color:var(--danger);font-size:11px;font-weight:bold';
      selectedReasonKey = item.dataset.reasonKey;
      s.querySelector('#submit-report-btn').disabled = false;
    });
  });

  let reportSubmitBusy = false;
  s.querySelector('#submit-report-btn').addEventListener('click', async () => {
    if (!selectedReasonKey) return;
    if (!DB.currentUser?.id) { App.toast(Lang.t('signInShort')); return; }
    if (reportSubmitBusy) return;
    reportSubmitBusy = true;
    try {
      await window.Api.reportsCreate({
        type: ctx.targetType,
        targetId: ctx.targetId,
        targetTitle: ctx.targetTitle,
        reason: Lang.t(selectedReasonKey),
        detail: s.querySelector('#report-detail').value,
        severity: 'medium'
      });
      await App.refreshRemoteData({ listsOnly: true });
      App.toast(Lang.t('reportOk'));
      setTimeout(() => App.back(), 800);
    } catch (e) {
      App.toast(Lang.t('toastApiGeneric'));
    } finally {
      reportSubmitBusy = false;
    }
  });
  return s;
};

// ===== SETTINGS (stub) =====
Screens.settings = () => {
  const s = makeScreen('settings');
  s.innerHTML = `
    ${backHeader(Lang.t('settings'))}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div class="menu-item" onclick="App.toast(Lang.t('comingSoon'))"><div class="menu-item-icon" style="background:var(--primary-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg></div><span class="menu-item-label">${Lang.t('notificationPrefs')}</span><svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
      <div class="menu-item" onclick="App.toast(Lang.t('comingSoon'))"><div class="menu-item-icon" style="background:var(--success-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><span class="menu-item-label">${Lang.t('privacySettings')}</span><svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
      <div class="menu-item" onclick="App.toast(Lang.t('comingSoon'))"><div class="menu-item-icon" style="background:var(--warning-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33"/></svg></div><span class="menu-item-label">${Lang.t('appearance')}</span><svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
      <div class="divider"></div>
      <div class="menu-item" onclick="App.navigate('report',{targetType:'post',targetTitle:Lang.t('sendFeedback'),targetId:'feedback'})"><div class="menu-item-icon" style="background:var(--info-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><span class="menu-item-label">${Lang.t('sendFeedback')}</span><svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
    </div>`;
  return s;
};

// ===== ADMIN DASHBOARD =====
Screens['admin-dashboard'] = () => {
  const s = makeScreen('admin-dashboard');
  const u = DB.currentUser;
  if (u?.role !== 'admin') {
    s.innerHTML = `${backHeader(Lang.t('admin'))}<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><div class="empty-title">${Lang.t('accessDenied')}</div><div class="empty-desc">${Lang.t('accessDeniedDesc')}</div></div>`;
    return s;
  }
  const pendingReports = DB.reports.filter(r => r.status === 'pending');
  const st = DB._adminStats;
  const totalItems = st?.itemCount ?? DB.items.length;
  const pendingCount = st?.pendingReports ?? pendingReports.length;
  const resolvedCount = DB.items.filter(i => i.status === 'Resolved / Returned').length;
  const userCount = st?.userCount ?? DB.users.length;
  s.innerHTML = `
    <div class="nav-header">
      <button class="back-btn" onclick="App.back()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>
      <h2>${Lang.t('adminDashboard')}</h2>
      <span class="badge badge-pending">${Lang.t('admin')}</span>
    </div>
    <div class="scroll-area has-bottom-pad">
      <div class="admin-stat-grid">
        <div class="admin-stat-card"><div class="admin-stat-num" style="color:var(--primary)">${totalItems}</div><div class="admin-stat-label">${Lang.t('totalItems')}</div></div>
        <div class="admin-stat-card"><div class="admin-stat-num" style="color:var(--warning)">${pendingCount}</div><div class="admin-stat-label">${Lang.t('pendingReports')}</div></div>
        <div class="admin-stat-card"><div class="admin-stat-num" style="color:var(--success)">${resolvedCount}</div><div class="admin-stat-label">${Lang.t('itemsResolved')}</div></div>
        <div class="admin-stat-card"><div class="admin-stat-num" style="color:var(--text-primary)">${userCount}</div><div class="admin-stat-label">${Lang.t('users')}</div></div>
      </div>
      <div class="section-divider"></div>
      <div class="section-header"><span class="section-title">${Lang.t('reportsQueue')}</span><span class="badge badge-pending">${Lang.t('reportsPendingCount', { count: pendingReports.length })}</span></div>
      ${DB.reports.map(r => `
        <div class="report-item" onclick="App.navigate('admin-mod',{reportId:'${r.id}'})">
          <div class="report-severity ${r.severity==='high'?'severity-high':r.severity==='medium'?'severity-medium':'severity-low'}"></div>
          <div class="report-content">
            <div class="report-title">${r.type === 'user' ? Lang.t('userReport') : Lang.t('postReport')}: ${r.targetTitle}</div>
            <div class="report-desc">${r.reason}</div>
            <div class="report-meta">${formatDate(r.createdAt)} · ${r.severity.toUpperCase()} ${Lang.t('priority')} · ${r.status === 'pending' ? Lang.t('statusPending') : Lang.t('statusResolved')}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`).join('')}
      <div class="section-divider"></div>
      <div class="section-header"><span class="section-title">${Lang.t('auditLog')}</span></div>
      ${DB.adminLog.map(log => `
        <div style="padding:12px 16px;border-bottom:1px solid var(--border-light)">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:13px;font-weight:700">${log.action}</span>
            <span style="font-size:11px;color:var(--text-tertiary)">${formatDate(log.at)}</span>
          </div>
          <div style="font-size:12px;color:var(--text-secondary)">${log.target} — ${log.note}</div>
        </div>`).join('')}
    </div>`;
  return s;
};

// ===== ADMIN MODERATION DETAIL =====
Screens['admin-mod'] = (ctx) => {
  const s = makeScreen('admin-mod');
  const report = DB.reports.find(r => r.id === ctx.reportId) || DB.reports[0];
  const reporter = DB.getUserById(report.reporterId);
  s.innerHTML = `
    ${backHeader(Lang.t('moderationDetail'))}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div style="background:white;border-radius:var(--r-lg);padding:16px;box-shadow:var(--shadow-sm);border:1px solid var(--border-light);margin-bottom:16px">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
          <div class="report-severity ${report.severity==='high'?'severity-high':report.severity==='medium'?'severity-medium':'severity-low'}" style="width:10px;height:10px"></div>
          <span class="badge ${report.status==='pending'?'badge-pending':'badge-resolved'}">${report.status === 'pending' ? Lang.t('statusPending') : Lang.t('statusResolved')}</span>
          <span style="font-size:11px;color:var(--text-tertiary);margin-left:auto">${report.severity.toUpperCase()} ${Lang.t('priority')}</span>
        </div>
        <div style="font-size:16px;font-weight:800;margin-bottom:4px">${report.reason}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">${report.type === 'user' ? Lang.t('userReportLower') : Lang.t('postReportLower')}: <strong>${report.targetTitle}</strong></div>
        ${report.detail ? `<div style="background:var(--border-light);border-radius:var(--r-md);padding:12px;font-size:13px;color:var(--text-primary)">"${report.detail}"</div>` : ''}
        <div style="margin-top:12px;font-size:12px;color:var(--text-tertiary)">${Lang.t('reportedBy')} ${reporter?.name || Lang.t('anonymous')} · ${formatDate(report.createdAt)}</div>
      </div>
      <div class="section-title" style="margin-bottom:12px">${Lang.t('adminActionsTitle')}</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-secondary btn-block" onclick="window.adminAction('warning')">${Lang.t('issueWarning')}</button>
        <button class="btn btn-danger btn-block" onclick="window.adminAction('remove')">${Lang.t('removePostAction')}</button>
        <button class="btn btn-danger btn-block" onclick="window.adminAction('suspend')">${Lang.t('suspendUser')}</button>
        <button class="btn btn-outline btn-block" onclick="window.adminAction('dismiss')">${Lang.t('dismissReport')}</button>
      </div>
      ${report.status === 'reviewed' ? `<div class="info-banner success" style="margin-top:16px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><div style="font-size:12px;color:var(--success)">${Lang.t('reportReviewed')}</div></div>` : ''}
    </div>`;

  window.adminAction = async (kind) => {
    const labels = { warning: Lang.t('issueWarning'), remove: Lang.t('removePostAction'), suspend: Lang.t('suspendUser'), dismiss: Lang.t('dismissReport') };
    const actionLabel = labels[kind] || kind;
    try {
      await window.Api.adminAction({ reportId: report.id, action: kind });
      await App.refreshRemoteData();
      App.toast(Lang.t('actionTaken', { action: actionLabel }));
      setTimeout(() => App.back(), 800);
    } catch (e) {
      if (e?.status === 401) App.toast(Lang.t('signInShort'));
      else if (e?.status === 403 || e?.data?.error === 'forbidden') App.toast(Lang.t('toastAdminForbidden'));
      else if (e?.code === 'html_response') App.toast(Lang.t('toastApiHtmlResponse'));
      else {
        const code = e?.data?.error || e?.message || 'error';
        App.toast(Lang.t('toastAdminFailedWithCode', { code }));
      }
    }
  };
  return s;
};

