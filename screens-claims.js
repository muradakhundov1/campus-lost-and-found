// ========================================
// CAMPUS LOST & FOUND — CLAIM, CHAT, PROFILE, ADMIN SCREENS
// ========================================

// ===== CLAIM SUBMIT =====
Screens['claim-submit'] = (ctx) => {
  const s = makeScreen('claim-submit');
  const item = DB.getItemById(ctx.itemId) || DB.items[0];
  const questions = item.verificationQuestions || [];
  const answers = questions.map(() => '');

  s.innerHTML = `
    ${backHeader('Submit Claim')}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div style="display:flex;gap:12px;align-items:center;background:white;border-radius:var(--r-lg);padding:14px;margin-bottom:20px;box-shadow:var(--shadow-sm);border:1px solid var(--border-light)">
        <div>${categoryIcon(item.category)}</div>
        <div><div style="font-size:15px;font-weight:700">${item.title}</div><div style="font-size:12px;color:var(--text-secondary)">${item.location} · ${formatDate(item.date)}</div></div>
      </div>
      <div class="info-banner" style="margin:0 0 20px">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style="font-size:12px;color:var(--info);line-height:1.5">Only real owners should be able to answer these questions. Please answer honestly — false claims are a violation of community guidelines.</div>
      </div>
      ${questions.length > 0 ? `
        <div class="section-title" style="margin-bottom:16px">Verification Questions</div>
        <div id="claim-questions">
          ${questions.map((q, i) => `
            <div class="claim-q-card">
              <div class="claim-q-num">${i + 1}</div>
              <div class="claim-q-text">${q.text}</div>
              <textarea class="form-textarea" data-idx="${i}" placeholder="Your answer..." style="min-height:70px;font-size:13px"></textarea>
            </div>`).join('')}
        </div>` : `<div class="empty-state" style="padding:32px"><div class="empty-icon">📝</div><div class="empty-title">No verification required</div><div class="empty-desc">This item has no verification questions. The finder will review your claim directly.</div></div>`}
      <div class="form-group" style="margin-top:${questions.length>0?'4px':'8px'}">
        <label class="form-label">Additional Notes (optional)</label>
        <textarea class="form-textarea" id="claim-notes" placeholder="Any extra context to help the finder verify your ownership..." style="min-height:80px"></textarea>
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="submit-claim-btn">Submit Claim</button>
    </div>`;

  s.querySelectorAll('textarea[data-idx]').forEach(ta => {
    ta.addEventListener('input', () => { answers[+ta.dataset.idx] = ta.value; });
  });

  s.querySelector('#submit-claim-btn').addEventListener('click', () => {
    const u = DB.currentUser;
    const newClaim = {
      id: 'c' + Date.now(), itemId: item.id, claimantId: u.id, claimantName: u.name,
      status: 'Pending', submittedAt: new Date().toISOString(),
      answers: questions.map((q, i) => ({ questionId: q.id, question: q.text, answer: answers[i] || '(no answer)' })),
      chatEnabled: false, reviewNote: ''
    };
    DB.claims.push(newClaim);
    item.status = 'Claim Pending'; item.claimCount = (item.claimCount || 0) + 1;
    DB.notifications.unshift({ id: 'nn' + Date.now(), type: 'claim', icon: '', title: 'Claim submitted', desc: `Your claim for "${item.title}" is being reviewed.`, time: 'Just now', read: false });
    App.toast('Claim submitted! The finder will review your answers.');
    setTimeout(() => App.navigate('item-detail', { itemId: item.id }), 800);
  });
  return s;
};

// ===== CLAIM REVIEW (Finder side) =====
Screens['claim-review'] = (ctx) => {
  const s = makeScreen('claim-review');
  const item = DB.getItemById(ctx.itemId) || DB.items[0];
  const claims = DB.getItemClaims(item.id);
  const isLostItem = item.type === 'lost';

  const renderClaims = () => {
    claimList.innerHTML = claims.length === 0
      ? `<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div><div class="empty-title">${isLostItem ? 'No responses yet' : 'No claims yet'}</div></div>`
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
              </div>`).join('') : '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">No verification questions for this item.</div>'}
            ${claim.status === 'Pending' ? `
              <div style="display:flex;gap:10px;margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light)">
                <button class="btn btn-danger btn-block btn-sm" onclick="window.rejectClaim('${claim.id}')">Reject</button>
                <button class="btn btn-success btn-block btn-sm" onclick="window.approveClaim('${claim.id}')">${isLostItem ? 'Accept' : 'Approve'}</button>
              </div>` : claim.status === 'Approved' ? `
              <div style="margin-top:10px"><button class="btn btn-primary btn-block btn-sm" onclick="App.navigate('chat',{claimId:'${claim.id}'})">Open Chat</button></div>` : `
              <div style="font-size:12px;color:var(--text-secondary);margin-top:8px">Claim rejected. ${claim.reviewNote}</div>`}
          </div>`;}).join('');
  };

  s.innerHTML = `
    ${backHeader(isLostItem ? 'Finder Responses' : 'Claims for Item', `<span style="font-size:13px;color:var(--text-secondary);font-weight:600">${claims.length} ${isLostItem ? 'response' : 'claim'}${claims.length!==1?'s':''}</span>`)}
    <div style="padding:12px 16px;background:white;border-bottom:1px solid var(--border-light);display:flex;gap:10px;align-items:center">
      <div>${categoryIcon(item.category)}</div>
      <div style="flex:1"><div style="font-size:13px;font-weight:700">${item.title}</div><div style="font-size:11px;color:var(--text-secondary)">${item.location}</div></div>
    </div>
    <div class="scroll-area has-bottom-pad" style="padding:16px" id="claim-list"></div>`;

  const claimList = s.querySelector('#claim-list');
  renderClaims();

  window.approveClaim = (claimId) => {
    const claim = DB.getClaimById(claimId);
    claim.status = 'Approved'; claim.chatEnabled = true;
    item.status = 'Approved for Handover';
    if (!DB.messages[claimId]) DB.messages[claimId] = [];
    DB.messages[claimId].unshift({ id: 'ms1', senderId: 'system', text: 'Claim approved! Chat is now open. Please coordinate a safe handover.', time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }), date: new Date().toISOString().slice(0, 10) });
    DB.notifications.unshift({ id: 'nn2', type: 'approved', icon: '', title: isLostItem ? 'Response accepted' : 'Claim approved', desc: `You ${isLostItem?'accepted':'approved'} ${claim.claimantName}'s ${isLostItem?'response':'claim'} for "${item.title}"`, time: 'Just now', read: false });
    renderClaims();
    App.toast(isLostItem ? 'Response accepted! Chat is now unlocked.' : 'Claim approved! Chat is now unlocked.');
  };
  window.rejectClaim = (claimId) => {
    const claim = DB.getClaimById(claimId);
    claim.status = 'Rejected'; claim.reviewNote = 'Answers did not match.';
    DB.notifications.unshift({ id: 'nn3', type: 'rejected', icon: '', title: isLostItem ? 'Response rejected' : 'Claim rejected', desc: `You rejected ${claim.claimantName}'s ${isLostItem?'response':'claim'}.`, time: 'Just now', read: false });
    renderClaims();
    App.toast('Claim rejected.');
  };
  return s;
};

// ===== CHAT =====
Screens.chat = (ctx) => {
  const s = makeScreen('chat');
  const claim = DB.getClaimById(ctx.claimId) || DB.claims.find(c => c.chatEnabled);
  if (!claim) { s.innerHTML = backHeader('Chat') + `<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><div class="empty-title">No active chats</div></div>`; return s; }
  const item = DB.getItemById(claim.itemId);
  const u = DB.currentUser;
  const otherId = u?.id === claim.claimantId ? item?.posterId : claim.claimantId;
  const other = DB.getUserById(otherId);
  let msgs = DB.messages[claim.id] || [];

  const renderMsgs = () => {
    msgList.innerHTML = `
      <div class="chat-system-msg">Chat unlocked after approval · ${formatDate(claim.submittedAt)}</div>
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
          <div class="chat-header-name">${other?.name || 'User'}</div>
          <div class="chat-header-status">● Active</div>
        </div>
        <button class="icon-btn" onclick="App.navigate('handover',{claimId:'${claim.id}'})" style="color:var(--primary)" aria-label="Handover">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
        </button>
      </div>
      <div style="background:var(--border-light);padding:8px 16px;font-size:11px;color:var(--text-secondary);text-align:center">
        Re: <strong>${item?.title}</strong> · ${item?.location}
      </div>
      <div class="chat-messages" id="chat-msgs" style="flex:1;overflow-y:auto"></div>
      <div class="chat-action-bar">
        <div style="display:flex;gap:8px;margin-bottom:8px;overflow-x:auto;scrollbar-width:none">
          <button class="btn btn-secondary btn-sm" style="white-space:nowrap;font-size:11px" onclick="window.sendQuick('Meet at Main Building Lobby?')">Suggest meeting</button>
          <button class="btn btn-secondary btn-sm" style="white-space:nowrap;font-size:11px" onclick="App.navigate('handover',{claimId:'${claim.id}'})">Track handover</button>
          <button class="btn btn-secondary btn-sm" style="white-space:nowrap;font-size:11px" onclick="window.sendQuick('Item received, thank you!')">Confirm receipt</button>
        </div>
        <div class="chat-input-row">
          <input class="chat-input" id="chat-input" placeholder="Type a message..." />
          <button class="chat-send-btn" id="chat-send" aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>`;

  const msgList = s.querySelector('#chat-msgs');
  const input = s.querySelector('#chat-input');
  renderMsgs();

  const sendMsg = (text) => {
    if (!text.trim()) return;
    const now = new Date();
    const newMsg = { id: 'm' + Date.now(), senderId: u?.id || 'u1', text: text.trim(), time: now.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }), date: now.toISOString().slice(0, 10) };
    if (!DB.messages[claim.id]) DB.messages[claim.id] = [];
    DB.messages[claim.id].push(newMsg);
    msgs = DB.messages[claim.id];
    renderMsgs();
    input.value = '';
    // Auto-reply
    setTimeout(() => {
      const reply = { id: 'm' + Date.now(), senderId: otherId, text: 'Sounds good! See you then. 👍', time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }), date: new Date().toISOString().slice(0, 10) };
      DB.messages[claim.id].push(reply); msgs = DB.messages[claim.id]; renderMsgs();
    }, 1500);
  };

  window.sendQuick = sendMsg;
  s.querySelector('#chat-send').addEventListener('click', () => sendMsg(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(input.value); });
  return s;
};

// ===== HANDOVER TRACKING =====
Screens.handover = (ctx) => {
  const s = makeScreen('handover');
  const claim = DB.getClaimById(ctx.claimId) || DB.claims.find(c => c.status === 'Approved');
  const item = claim ? DB.getItemById(claim.itemId) : DB.items[0];
  const steps = ['Claim Approved', 'Meeting Arranged', 'Handover Scheduled', 'Item Received', 'Completed'];
  const stepDone = claim?.handoverStatus === 'Completed' ? 5 : claim?.handoverStatus === 'Scheduled' ? 3 : claim?.status === 'Approved' ? 1 : 0;

  s.innerHTML = `
    ${backHeader('Handover Tracking')}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div class="handover-card">
        <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
          <div>${categoryIcon(item?.category || 'Other')}</div>
          <div><div style="font-size:15px;font-weight:700">${item?.title}</div><div style="font-size:12px;color:var(--text-secondary)">${item?.location}</div></div>
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
          <div style="font-size:13px;font-weight:700;margin-bottom:12px">Arranged Handover</div>
          <div class="detail-row" style="border:none;padding:6px 0"><div class="detail-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div><div class="detail-row-content"><div class="detail-row-label">Meeting Point</div><div class="detail-row-value">${claim.meetingPoint}</div></div></div>
          <div class="detail-row" style="border:none;padding:6px 0"><div class="detail-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div class="detail-row-content"><div class="detail-row-label">Meeting Time</div><div class="detail-row-value">${claim.meetingTime || 'Not set'}</div></div></div>
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
          ${stepDone < 2 ? `<button class="btn btn-outline btn-block" onclick="App.navigate('chat',{claimId:'${claim?.id}'})">Open Chat</button>` : ''}
          ${stepDone < 3 ? `<button class="btn btn-primary btn-block" onclick="window.updateHandover()">Schedule Handover</button>` : ''}
          ${stepDone === 3 ? `<button class="btn btn-success btn-block" onclick="window.confirmHandover()">Confirm Item Received</button>` : ''}
        </div>` : `
        <div class="info-banner success" style="margin:0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          <div><strong>Handover complete!</strong><br><span style="font-size:12px">This item has been successfully returned to its owner.</span></div>
        </div>`}
    </div>`;

  window.updateHandover = () => {
    if (claim) { claim.handoverStatus = 'Scheduled'; claim.meetingPoint = 'Main Building Lobby'; claim.meetingTime = 'Mar 22, 2026 at 2:00 PM'; }
    App.toast('Handover scheduled!');
    App.navigate('handover', { claimId: ctx.claimId });
  };
  window.confirmHandover = () => {
    if (claim) { claim.handoverStatus = 'Completed'; claim.status = 'Resolved'; }
    if (item) item.status = 'Resolved / Returned';
    App.toast('Handover confirmed! Item returned.');
    App.navigate('handover', { claimId: ctx.claimId });
  };
  return s;
};

// ===== MESSAGES LIST =====
Screens.messages = () => {
  const s = makeScreen('messages');
  const u = DB.currentUser;
  const myApprovedClaims = DB.claims.filter(c => c.chatEnabled && (c.claimantId === u?.id || DB.getItemById(c.itemId)?.posterId === u?.id));

  s.innerHTML = `
    <div class="nav-header"><h1>Messages</h1></div>
    <div class="scroll-area has-bottom-pad">
      ${myApprovedClaims.length === 0 ? `
        <div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><div class="empty-title">No messages yet</div>
        <div class="empty-desc">Messages become available after a claim is approved.</div></div>` :
      myApprovedClaims.map(claim => {
        const item = DB.getItemById(claim.itemId);
        const otherId = u?.id === claim.claimantId ? item?.posterId : claim.claimantId;
        const other = DB.getUserById(otherId);
        const lastMsg = (DB.messages[claim.id] || []).slice(-1)[0];
        return `<div class="message-thread" onclick="App.navigate('chat',{claimId:'${claim.id}'})">
          ${avatarHTML(other, 'avatar-md')}
          <div class="message-thread-info">
            <div class="message-thread-name">${other?.name || 'User'}</div>
            <div style="font-size:11px;color:var(--text-secondary);margin-bottom:3px">${item?.title}</div>
            <div class="message-thread-preview">${lastMsg ? lastMsg.text : 'Chat opened'}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
            <div class="message-thread-time">${lastMsg?.time || ''}</div>
            <div class="message-thread-badge">2</div>
          </div>
        </div>`;}).join('')}
    </div>`;
  return s;
};

// ===== NOTIFICATIONS =====
Screens.notifications = () => {
  const s = makeScreen('notifications');
  s.innerHTML = `
    ${backHeader('Notifications', `<button class="icon-btn" onclick="DB.notifications.forEach(n=>n.read=true);App.navigate('notifications')" style="font-size:11px;color:var(--primary);width:auto;padding:0 4px">Mark all read</button>`)}
    <div class="scroll-area has-bottom-pad">
      ${DB.notifications.length === 0 ? `<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg></div><div class="empty-title">No notifications</div></div>` :
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
  return s;
};

// ===== PROFILE =====
Screens.profile = () => {
  const s = makeScreen('profile');
  const u = DB.currentUser;
  if (!u) {
    s.innerHTML = `${backHeader(Lang.t('account'))}<div class="empty-state"><div class="empty-icon">👤</div><div class="empty-title">${Lang.t('account')}</div><div class="empty-desc">Please sign in to view your profile.</div><button class="btn btn-primary" onclick="App.navigate('login',{},false)">Sign in</button></div>`;
    return s;
  }

  s.innerHTML = `
    <div class="scroll-area has-bottom-pad">
      <div class="profile-header">
        <div style="display:flex;justify-content:flex-end"><button class="icon-btn" style="color:white" onclick="App.navigate('settings')" aria-label="Settings"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg></button></div>
        <div class="avatar avatar-xl" style="margin:0 auto;font-size:28px;background:rgba(255,255,255,0.2);color:white">${u.avatar}</div>
        <div class="profile-name">${u.name}</div>
        <div class="profile-role">${u.department} · ${u.year}</div>
        <div style="margin-top:8px">${u.role==='admin'?'<span class="badge badge-pending">Admin</span>':u.role==='staff'?'<span class="badge badge-info">Staff</span>':'<span class="badge badge-active">Student</span>'}</div>
        <div class="profile-stats">
          <div class="stat-item"><div class="stat-num">${DB.getMyItems(u.id).length}</div><div class="stat-label">${Lang.t('myPosts')}</div></div>
          <div class="stat-item"><div class="stat-num">${DB.getMyClaims(u.id).length}</div><div class="stat-label">${Lang.t('myClaims')}</div></div>
          <div class="stat-item"><div class="stat-num">${u.resolvedCount}</div><div class="stat-label">Resolved</div></div>
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
          <span style="font-size:12px;color:var(--text-secondary);margin-right:8px">${DB.getMyItems(u.id).length} items</span>
          <svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div class="menu-item" onclick="App.navigate('my-claims')">
          <div class="menu-item-icon" style="background:var(--success-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
          <span class="menu-item-label">${Lang.t('myClaims')}</span>
          <span style="font-size:12px;color:var(--text-secondary);margin-right:8px">${DB.getMyClaims(u.id).length} claims</span>
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
          <span class="menu-item-label">Notifications</span>
          ${DB.notifications.filter(n=>!n.read).length>0?`<span class="badge badge-active" style="margin-right:8px">${DB.notifications.filter(n=>!n.read).length} new</span>`:''}
          <svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        ${u.role === 'admin' ? `<div class="menu-item" onclick="App.navigate('admin-dashboard')">
          <div class="menu-item-icon" style="background:var(--warning-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
          <span class="menu-item-label">Admin Dashboard</span>
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
    s.innerHTML = `${backHeader(Lang.t('account'))}<div class="empty-state"><div class="empty-icon">🔒</div><div class="empty-title">${Lang.t('account')}</div><div class="empty-desc">Please sign in.</div><button class="btn btn-primary" onclick="App.navigate('login',{},false)">Sign in</button></div>`;
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
            <div style="font-size:12px;color:var(--text-secondary)">${u.role}</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <div><div style="font-size:11px;color:var(--text-tertiary);font-weight:700">Email</div><div style="font-size:13px;font-weight:600">${u.email || '-'}</div></div>
          <div><div style="font-size:11px;color:var(--text-tertiary);font-weight:700">Phone</div><div style="font-size:13px;font-weight:600">${u.phone || '-'}</div></div>
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
    ${backHeader('My Posts', `<button class="icon-btn" onclick="App.navigate('post-type')" aria-label="Add post" style="background:var(--primary);color:white;border-radius:50%"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>`)}
    <div class="scroll-area has-bottom-pad" style="padding-top:8px">
      ${items.length === 0 ? `<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-title">No posts yet</div><div class="empty-desc">Start by posting a lost or found item.</div><button class="btn btn-primary" onclick="App.navigate('post-type')">Post Item</button></div>` :
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
    ${backHeader('My Claims')}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      ${claims.length === 0 ? `<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg></div><div class="empty-title">No claims yet</div><div class="empty-desc">Browse found items and submit a claim if something is yours.</div><button class="btn btn-primary" onclick="App.navigate('search',{type:'found'})">Browse Found Items</button></div>` :
      claims.map(claim => {
        const item = DB.getItemById(claim.itemId);
        return `<div class="claim-review-card" onclick="App.navigate('item-detail',{itemId:'${claim.itemId}'})">
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px">
            <div>${categoryIcon(item?.category || 'Other')}</div>
            <div style="flex:1"><div style="font-size:14px;font-weight:700">${item?.title || 'Unknown Item'}</div><div style="font-size:11px;color:var(--text-secondary)">${formatDate(claim.submittedAt)}</div></div>
            ${statusBadge(claim.status)}
          </div>
          ${claim.status === 'Approved' && claim.chatEnabled ? `<button class="btn btn-primary btn-block btn-sm" onclick="event.stopPropagation();App.navigate('chat',{claimId:'${claim.id}'})">Open Chat</button>` : ''}
          ${claim.handoverStatus === 'Scheduled' ? `<button class="btn btn-secondary btn-block btn-sm" style="margin-top:8px" onclick="event.stopPropagation();App.navigate('handover',{claimId:'${claim.id}'})">Track Handover</button>` : ''}
        </div>`;}).join('')}
    </div>`;
  return s;
};

// ===== REPORT =====
Screens.report = (ctx) => {
  const s = makeScreen('report');
  const reasons = ['Spam / duplicate post', 'Fake or misleading listing', 'Harassment or threatening behavior', 'False claim', 'Inappropriate content', 'Other'];
  let selectedReason = '';

  s.innerHTML = `
    ${backHeader(`Report ${ctx.targetType === 'user' ? 'User' : 'Post'}`)}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div class="info-banner warning" style="margin:0 0 20px">
        <span>⚠️</span>
        <div style="font-size:12px;color:var(--warning);line-height:1.5">Reports are reviewed by campus moderators. False reports may result in account action.</div>
      </div>
      <div style="background:white;border-radius:var(--r-lg);padding:14px;margin-bottom:20px;border:1px solid var(--border-light)">
        <div style="font-size:11px;color:var(--text-tertiary);font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">Reporting</div>
        <div style="font-size:15px;font-weight:700">${ctx.targetTitle || 'this item'}</div>
      </div>
      <div class="section-title" style="margin-bottom:12px">Select a reason</div>
      <div id="reason-list" style="display:flex;flex-direction:column;gap:10px">
        ${reasons.map(r => `<div class="menu-item" data-reason="${r}" style="border:1.5px solid var(--border-light);border-radius:var(--r-lg);padding:12px 16px">
          <span style="flex:1;font-size:14px">${r}</span>
          <div class="reason-check" style="width:20px;height:20px;border-radius:50%;border:2px solid var(--border);display:flex;align-items:center;justify-content:center"></div>
        </div>`).join('')}
      </div>
      <div class="form-group" style="margin-top:20px">
        <label class="form-label">Additional details (optional)</label>
        <textarea class="form-textarea" id="report-detail" placeholder="Help moderators understand the issue..."></textarea>
      </div>
      <button class="btn btn-danger btn-block btn-lg" id="submit-report-btn" disabled>Submit Report</button>
    </div>`;

  s.querySelectorAll('[data-reason]').forEach(item => {
    item.addEventListener('click', () => {
      s.querySelectorAll('[data-reason]').forEach(i => { i.style.borderColor = 'var(--border-light)'; i.querySelector('.reason-check').innerHTML = ''; i.querySelector('.reason-check').style.borderColor = 'var(--border)'; });
      item.style.borderColor = 'var(--danger)';
      item.querySelector('.reason-check').innerHTML = '✓'; item.querySelector('.reason-check').style.cssText += 'background:var(--danger);color:white;border-color:var(--danger);font-size:11px;font-weight:bold';
      selectedReason = item.dataset.reason;
      s.querySelector('#submit-report-btn').disabled = false;
    });
  });

  s.querySelector('#submit-report-btn').addEventListener('click', () => {
    const newReport = { id: 'r' + Date.now(), type: ctx.targetType, targetId: ctx.targetId, targetTitle: ctx.targetTitle, reporterId: DB.currentUser?.id, reason: selectedReason, detail: s.querySelector('#report-detail').value, severity: 'medium', status: 'pending', createdAt: new Date().toISOString() };
    DB.reports.push(newReport);
    App.toast('Report submitted. Moderators will review it shortly.');
    setTimeout(() => App.back(), 800);
  });
  return s;
};

// ===== SETTINGS (stub) =====
Screens.settings = () => {
  const s = makeScreen('settings');
  s.innerHTML = `
    ${backHeader('Settings')}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div class="menu-item" onclick="App.toast('Coming soon')"><div class="menu-item-icon" style="background:var(--primary-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg></div><span class="menu-item-label">Notification Preferences</span><svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
      <div class="menu-item" onclick="App.toast('Coming soon')"><div class="menu-item-icon" style="background:var(--success-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><span class="menu-item-label">Privacy Settings</span><svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
      <div class="menu-item" onclick="App.toast('Coming soon')"><div class="menu-item-icon" style="background:var(--warning-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33"/></svg></div><span class="menu-item-label">Appearance</span><svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
      <div class="divider"></div>
      <div class="menu-item" onclick="App.navigate('report',{targetType:'post',targetTitle:'Feedback',targetId:'feedback'})"><div class="menu-item-icon" style="background:var(--info-light)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><span class="menu-item-label">Send Feedback</span><svg class="menu-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div>
    </div>`;
  return s;
};

// ===== ADMIN DASHBOARD =====
Screens['admin-dashboard'] = () => {
  const s = makeScreen('admin-dashboard');
  const u = DB.currentUser;
  if (u?.role !== 'admin') {
    s.innerHTML = `${backHeader('Admin')}<div class="empty-state"><div class="empty-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div><div class="empty-title">Access Denied</div><div class="empty-desc">Only administrators can access this area.</div></div>`;
    return s;
  }
  const pendingReports = DB.reports.filter(r => r.status === 'pending');
  s.innerHTML = `
    <div class="nav-header">
      <button class="back-btn" onclick="App.back()"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg></button>
      <h2>Admin Dashboard</h2>
      <span class="badge badge-pending">Admin</span>
    </div>
    <div class="scroll-area has-bottom-pad">
      <div class="admin-stat-grid">
        <div class="admin-stat-card"><div class="admin-stat-num" style="color:var(--primary)">${DB.items.length}</div><div class="admin-stat-label">Total Items</div></div>
        <div class="admin-stat-card"><div class="admin-stat-num" style="color:var(--warning)">${pendingReports.length}</div><div class="admin-stat-label">Pending Reports</div></div>
        <div class="admin-stat-card"><div class="admin-stat-num" style="color:var(--success)">${DB.items.filter(i=>i.status==='Resolved / Returned').length}</div><div class="admin-stat-label">Items Resolved</div></div>
        <div class="admin-stat-card"><div class="admin-stat-num" style="color:var(--text-primary)">${DB.users.length}</div><div class="admin-stat-label">Users</div></div>
      </div>
      <div class="section-divider"></div>
      <div class="section-header"><span class="section-title">Reports Queue</span><span class="badge badge-pending">${pendingReports.length} pending</span></div>
      ${DB.reports.map(r => `
        <div class="report-item" onclick="App.navigate('admin-mod',{reportId:'${r.id}'})">
          <div class="report-severity ${r.severity==='high'?'severity-high':r.severity==='medium'?'severity-medium':'severity-low'}"></div>
          <div class="report-content">
            <div class="report-title">${r.type === 'user' ? 'User Report' : 'Post Report'}: ${r.targetTitle}</div>
            <div class="report-desc">${r.reason}</div>
            <div class="report-meta">${formatDate(r.createdAt)} · ${r.severity.toUpperCase()} priority · ${r.status}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </div>`).join('')}
      <div class="section-divider"></div>
      <div class="section-header"><span class="section-title">Audit Log</span></div>
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
    ${backHeader('Moderation Detail')}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div style="background:white;border-radius:var(--r-lg);padding:16px;box-shadow:var(--shadow-sm);border:1px solid var(--border-light);margin-bottom:16px">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
          <div class="report-severity ${report.severity==='high'?'severity-high':report.severity==='medium'?'severity-medium':'severity-low'}" style="width:10px;height:10px"></div>
          <span class="badge ${report.status==='pending'?'badge-pending':'badge-resolved'}">${report.status}</span>
          <span style="font-size:11px;color:var(--text-tertiary);margin-left:auto">${report.severity.toUpperCase()} priority</span>
        </div>
        <div style="font-size:16px;font-weight:800;margin-bottom:4px">${report.reason}</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px">${report.type === 'user' ? 'User report' : 'Post report'}: <strong>${report.targetTitle}</strong></div>
        ${report.detail ? `<div style="background:var(--border-light);border-radius:var(--r-md);padding:12px;font-size:13px;color:var(--text-primary)">"${report.detail}"</div>` : ''}
        <div style="margin-top:12px;font-size:12px;color:var(--text-tertiary)">Reported by ${reporter?.name || 'Anonymous'} · ${formatDate(report.createdAt)}</div>
      </div>
      <div class="section-title" style="margin-bottom:12px">Admin Actions</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <button class="btn btn-secondary btn-block" onclick="window.adminAction('Warning issued to user','warning')">Issue Warning</button>
        <button class="btn btn-danger btn-block" onclick="window.adminAction('Post removed','remove')">Remove Post</button>
        <button class="btn btn-danger btn-block" onclick="window.adminAction('User suspended','suspend')">Suspend User</button>
        <button class="btn btn-outline btn-block" onclick="window.adminAction('Report dismissed','dismiss')">Dismiss Report</button>
      </div>
      ${report.status === 'reviewed' ? `<div class="info-banner success" style="margin-top:16px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><div style="font-size:12px;color:var(--success)">This report has already been reviewed and actioned.</div></div>` : ''}
    </div>`;

  window.adminAction = (actionLabel, type) => {
    report.status = 'reviewed';
    DB.adminLog.unshift({ id: 'al' + Date.now(), action: actionLabel, target: report.targetTitle, note: `Action taken on report ${report.id}`, adminId: DB.currentUser?.id, at: new Date().toISOString() });
    App.toast(`Action taken: ${actionLabel}`);
    setTimeout(() => App.back(), 800);
  };
  return s;
};

// Init
window.addEventListener('DOMContentLoaded', () => App.init());
