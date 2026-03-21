// ========================================
// CAMPUS LOST & FOUND — MAIN SCREENS
// Home, Search, Item Detail, Post Type, Create Post
// Finder Response Submit
// ========================================

// Category icon helper (replaces emojis with SVG icon class)
function categoryIcon(cat) {
  const map = {
    'Documents / ID Cards': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="14" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>',
    'Electronics': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    'Keys': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
    'Wallet / Money': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="14" r="1"/></svg>',
    'Earphones / Accessories': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z"/><path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z"/></svg>',
    'Bags': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
    'Clothing': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M20.38 3.46L16 2 12 5 8 2l-4.38 1.46a1 1 0 00-.62.93V8l5 2v12h8V10l5-2V4.39a1 1 0 00-.62-.93z"/></svg>',
  };
  return map[cat] || '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>';
}

// ===== HOME =====
Screens.home = () => {
  const s = makeScreen('home');
  const u = DB.currentUser || DB.users[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const lostItems = DB.items.filter(i => i.type === 'lost');
  const foundItems = DB.items.filter(i => i.type === 'found');

  const myLostItems = DB.items.filter(i => i.posterId === u.id && i.type === 'lost');
  let suggestedMatches = [];
  myLostItems.forEach(li => { suggestedMatches.push(...DB.getSuggestedMatches(li)); });
  if (suggestedMatches.length === 0) {
    suggestedMatches = DB.getSuggestedMatches(lostItems[0] || DB.items[0]);
  }
  suggestedMatches = [...new Map(suggestedMatches.map(m=>[m.id,m])).values()].slice(0,3);

  s.innerHTML = `
    <div class="home-header">
      <div class="home-header-top">
        <div class="home-greeting">
          <div class="home-greeting-sub">${greeting}</div>
          <h2>${u.name.split(' ')[0]}</h2>
        </div>
        <div style="display:flex;gap:8px">
          <button class="icon-btn" onclick="App.navigate('notifications')" aria-label="Notifications" style="position:relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            ${DB.notifications.filter(n=>!n.read).length > 0 ? '<span style="position:absolute;top:4px;right:4px;width:8px;height:8px;background:var(--danger);border-radius:50%"></span>' : ''}
          </button>
          ${u.role === 'admin' ? `<button class="icon-btn" onclick="App.navigate('admin-dashboard')" aria-label="Admin Dashboard" style="background:var(--warning-light)"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></button>` : ''}
        </div>
      </div>
      <div class="home-search-bar" onclick="App.navigate('search')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>Search items, locations...</span>
      </div>
    </div>
    <div class="scroll-area has-bottom-pad" id="home-content"></div>`;

  const content = s.querySelector('#home-content');
  let activeTab = 'lost';

  const renderContent = () => {
    const items = activeTab === 'lost' ? lostItems : foundItems;
    content.innerHTML = `
      <div style="padding:16px 16px 8px">
        <div class="segment-control">
          <button class="segment-btn ${activeTab==='lost'?'active':''}" id="tab-lost">Lost Items (${lostItems.length})</button>
          <button class="segment-btn ${activeTab==='found'?'active':''}" id="tab-found">Found Items (${foundItems.length})</button>
        </div>
      </div>
      ${suggestedMatches.length > 0 ? `
        <div class="section-header">
          <span class="section-title">Suggested Matches</span>
          <button class="section-link" onclick="App.navigate('search',{matchMode:true})">See all</button>
        </div>
        <div class="h-scroll">
          ${suggestedMatches.map(m => `
            <div class="match-card" onclick="App.navigate('item-detail',{itemId:'${m.id}'})">
              <div class="match-badge">Match</div>
              <div style="margin-bottom:8px">${categoryIcon(m.category)}</div>
              <div class="match-title">${m.title}</div>
              <div class="match-meta">${m.location} · ${formatDate(m.date)}</div>
              <div class="match-score">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                Similar category &amp; location
              </div>
            </div>`).join('')}
        </div>` : ''}
      <div class="section-header">
        <span class="section-title">${activeTab === 'lost' ? 'Lost Items' : 'Found Items'}</span>
        <button class="section-link" onclick="App.navigate('search',{type:'${activeTab}'})">Filter</button>
      </div>
      ${items.length === 0 ? `<div class="empty-state"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></div><div class="empty-title">No items yet</div><div class="empty-desc">Be the first to post a ${activeTab} item on campus.</div></div>` : items.map(i => itemCardHTML(i)).join('')}
    `;
    content.querySelector('#tab-lost')?.addEventListener('click', () => { activeTab = 'lost'; renderContent(); });
    content.querySelector('#tab-found')?.addEventListener('click', () => { activeTab = 'found'; renderContent(); });
  };
  renderContent();
  return s;
};

// ===== SEARCH =====
Screens.search = (ctx) => {
  const s = makeScreen('search');
  let query = '', filterType = ctx.type || 'all', filterCat = 'all', filterLoc = 'all';

  s.innerHTML = `
    <div class="nav-header"><h1>Search</h1></div>
    <div class="search-bar-wrap" style="position:sticky;top:0;z-index:10;background:white">
      <div class="search-input-row">
        <div class="search-input-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search items, descriptions..." id="search-input" />
        </div>
        <button class="btn btn-secondary btn-sm" id="filter-btn" style="flex-shrink:0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
          Filter
        </button>
      </div>
      <div class="filter-row" id="type-filters">
        ${['all','lost','found'].map(t=>`<button class="filter-chip ${filterType===t?'active':''}" data-type="${t}">${t==='all'?'All Items':t==='lost'?'Lost':'Found'}</button>`).join('')}
        <span style="margin: 0 4px; color: var(--border); font-size:18px">|</span>
        ${DB.categories.slice(0,4).map(c=>`<button class="filter-chip" data-cat="${c}">${c.split('/')[0].trim()}</button>`).join('')}
      </div>
    </div>
    <div class="scroll-area has-bottom-pad" id="search-results"></div>`;

  const input = s.querySelector('#search-input');
  const resultsEl = s.querySelector('#search-results');

  const renderResults = () => {
    let items = DB.items.filter(item => {
      const q = query.toLowerCase();
      const matchQ = !q || item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
      const matchType = filterType === 'all' || item.type === filterType;
      const matchCat = filterCat === 'all' || item.category === filterCat;
      const matchLoc = filterLoc === 'all' || item.location === filterLoc;
      return matchQ && matchType && matchCat && matchLoc;
    });
    if (items.length === 0) {
      resultsEl.innerHTML = `<div class="empty-state"><div class="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div><div class="empty-title">No results found</div><div class="empty-desc">Try different keywords or clear your filters.</div></div>`;
    } else {
      resultsEl.innerHTML = `<div style="padding:12px 16px 4px;font-size:12px;color:var(--text-secondary);font-weight:600">${items.length} item${items.length!==1?'s':''} found</div>` + items.map(i => itemCardHTML(i)).join('');
    }
  };

  input.addEventListener('input', () => { query = input.value; renderResults(); });
  s.querySelectorAll('[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      filterType = btn.dataset.type;
      s.querySelectorAll('[data-type]').forEach(b => b.classList.toggle('active', b.dataset.type === filterType));
      renderResults();
    });
  });
  s.querySelectorAll('[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      filterCat = filterCat === btn.dataset.cat ? 'all' : btn.dataset.cat;
      s.querySelectorAll('[data-cat]').forEach(b => b.classList.toggle('active', b.dataset.cat === filterCat));
      renderResults();
    });
  });
  s.querySelector('#filter-btn').addEventListener('click', () => {
    App.showModal(`
      <div class="modal-title">Filter Items</div>
      <div style="padding:0 20px 20px">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-select" id="modal-cat">
            <option value="all">All Categories</option>
            ${DB.categories.map(c=>`<option value="${c}" ${filterCat===c?'selected':''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Location</label>
          <select class="form-select" id="modal-loc">
            <option value="all">All Locations</option>
            ${DB.locations.map(l=>`<option value="${l}" ${filterLoc===l?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex;gap:12px">
          <button class="btn btn-secondary btn-block" onclick="App.closeModal()">Reset</button>
          <button class="btn btn-primary btn-block" id="apply-filters">Apply</button>
        </div>
      </div>`);
    document.getElementById('apply-filters').addEventListener('click', () => {
      filterCat = document.getElementById('modal-cat').value;
      filterLoc = document.getElementById('modal-loc').value;
      App.closeModal(); renderResults();
    });
  });
  renderResults();
  return s;
};

// ===== ITEM DETAIL =====
Screens['item-detail'] = (ctx) => {
  const s = makeScreen('item-detail');
  const item = DB.getItemById(ctx.itemId) || DB.items[0];
  const u = DB.currentUser;
  const isOwner = item.posterId === u?.id;
  const isAdmin = u?.role === 'admin';
  const myExistingClaim = DB.claims.find(c => c.itemId === item.id && c.claimantId === u?.id);
  // Finder responses on lost items
  const myFinderResponse = DB.claims.find(c => c.itemId === item.id && c.claimantId === u?.id && c.isFinderResponse);
  const matches = DB.getSuggestedMatches(item);
  const claimCount = DB.getItemClaims(item.id).length;
  const finderResponses = DB.claims.filter(c => c.itemId === item.id && c.isFinderResponse);

  // Build action HTML based on role, ownership, item type, item status
  let actionHTML = '';
  let adminActionHTML = '';

  // Admin: always show remove
  if (isAdmin && !isOwner) {
    adminActionHTML = `
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-light)">
        <div style="font-size:11px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Admin Actions</div>
        <button class="btn btn-danger btn-block btn-sm" onclick="window.adminRemovePost('${item.id}')">Remove Post</button>
      </div>`;
  }

  if (item.status === 'Resolved / Returned') {
    actionHTML = `<div class="info-banner success" style="margin:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><div style="font-size:13px;color:var(--success);font-weight:600">Item Returned</div></div>`;
  } else if (item.status === 'Removed') {
    actionHTML = `<div class="info-banner danger" style="margin:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg><div style="font-size:13px;color:var(--danger);font-weight:600">This post has been removed by a moderator.</div></div>`;
  } else if (isOwner) {
    // Owner actions
    let ownerActions = '';
    if (item.type === 'found' && claimCount > 0) {
      ownerActions += `<button class="btn btn-primary btn-block" onclick="App.navigate('claim-review',{itemId:'${item.id}'})">Review ${claimCount} Claim${claimCount!==1?'s':''}</button>`;
    }
    if (item.type === 'lost' && finderResponses.length > 0) {
      ownerActions += `<button class="btn btn-primary btn-block" onclick="App.navigate('claim-review',{itemId:'${item.id}'})">Review ${finderResponses.length} Response${finderResponses.length!==1?'s':''}</button>`;
    }
    ownerActions += `
      <div style="display:flex;gap:10px;margin-top:${ownerActions?'10px':'0'}">
        <button class="btn btn-secondary btn-block btn-sm" onclick="App.toast('Edit post — simulated')">Edit Post</button>
        <button class="btn btn-outline btn-block btn-sm" style="color:var(--danger);border-color:var(--danger)" onclick="window.deleteOwnPost('${item.id}')">Delete Post</button>
      </div>`;
    actionHTML = ownerActions;
  } else if (item.type === 'found') {
    // Non-owner viewing a found item: Submit Claim
    if (myExistingClaim) {
      actionHTML = `<div class="info-banner" style="margin:0 0 10px;background:var(--success-light);border-color:rgba(22,163,74,0.2)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><div><div style="font-size:13px;font-weight:700;color:var(--success)">Claim submitted</div><div style="font-size:12px;color:var(--text-secondary)">Status: ${myExistingClaim.status}</div></div></div>
        ${myExistingClaim.chatEnabled ? `<button class="btn btn-primary btn-block" onclick="App.navigate('chat',{claimId:'${myExistingClaim.id}'})">Open Chat</button>` : ''}`;
    } else {
      actionHTML = `<button class="btn btn-primary btn-block btn-lg" onclick="App.navigate('claim-submit',{itemId:'${item.id}'})">Submit Claim</button>`;
    }
  } else if (item.type === 'lost') {
    // Non-owner viewing a lost item: I Found This
    if (myFinderResponse) {
      actionHTML = `<div class="info-banner" style="margin:0 0 10px;background:var(--success-light);border-color:rgba(22,163,74,0.2)"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><div><div style="font-size:13px;font-weight:700;color:var(--success)">Response submitted</div><div style="font-size:12px;color:var(--text-secondary)">Status: ${myFinderResponse.status}</div></div></div>
        ${myFinderResponse.chatEnabled ? `<button class="btn btn-primary btn-block" onclick="App.navigate('chat',{claimId:'${myFinderResponse.id}'})">Open Chat</button>` : ''}`;
    } else {
      actionHTML = `<button class="btn btn-primary btn-block btn-lg" onclick="App.navigate('finder-response',{itemId:'${item.id}'})">I Found This</button>`;
    }
  }

  // Report button for non-owners
  let reportHTML = '';
  if (!isOwner) {
    reportHTML = `<button class="btn btn-outline btn-block btn-sm" style="margin-top:10px" onclick="App.navigate('report',{targetType:'post',targetId:'${item.id}',targetTitle:'${item.title.replace(/'/g,"\\'")}'})" >Report Post</button>`;
  }

  // Report icon in header: only for non-owners
  const headerRight = !isOwner ? `<button class="icon-btn" onclick="App.navigate('report',{targetType:'post',targetId:'${item.id}',targetTitle:'${item.title.replace(/'/g,"\\'")}'})" aria-label="Report"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg></button>` : '';

  s.innerHTML = `
    ${backHeader(item.type === 'lost' ? 'Lost Item' : 'Found Item', headerRight)}
    <div class="scroll-area" style="padding-bottom:24px">
      <div class="item-detail-img">${categoryIcon(item.category)}</div>
      <div class="item-detail-body">
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
          ${itemBadge(item.type)} ${statusBadge(item.status)}
        </div>
        <h1 class="item-detail-title">${item.title}</h1>
        <div class="item-detail-desc">${item.description}</div>
        <div class="detail-row">
          <div class="detail-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="14" y2="14"/></svg></div>
          <div class="detail-row-content"><div class="detail-row-label">Category</div><div class="detail-row-value">${item.category}</div></div>
        </div>
        <div class="detail-row">
          <div class="detail-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
          <div class="detail-row-content"><div class="detail-row-label">Location</div><div class="detail-row-value">${item.location}</div></div>
        </div>
        <div class="detail-row">
          <div class="detail-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <div class="detail-row-content"><div class="detail-row-label">Date & Time</div><div class="detail-row-value">${formatDate(item.date)} at ${item.time}</div></div>
        </div>
        ${item.verificationQuestions?.length > 0 ? `
        <div class="detail-row">
          <div class="detail-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>
          <div class="detail-row-content"><div class="detail-row-label">Verification</div><div class="detail-row-value">${item.verificationQuestions.length} question${item.verificationQuestions.length!==1?'s':''} required</div></div>
        </div>` : ''}
        <div class="poster-card">
          ${avatarHTML(DB.getUserById(item.posterId), 'avatar-md')}
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:var(--text-primary)">Posted by ${item.posterName}</div>
            <div style="font-size:12px;color:var(--text-secondary)">Campus member · ${formatDate(item.date)}</div>
          </div>
        </div>
        ${matches.length > 0 ? `
        <div style="margin-top:20px">
          <div class="section-title" style="margin-bottom:12px">Possible Matches</div>
          ${matches.map(m=>`
            <div class="item-card" onclick="App.navigate('item-detail',{itemId:'${m.id}'})" style="margin:0 0 10px">
              <div style="display:flex;gap:12px;align-items:center">
                <div>${categoryIcon(m.category)}</div>
                <div style="flex:1">
                  <div style="font-size:14px;font-weight:700">${m.title}</div>
                  <div style="font-size:12px;color:var(--text-secondary)">${itemBadge(m.type)} · ${m.location} · ${formatDate(m.date)}</div>
                </div>
              </div>
            </div>`).join('')}
        </div>` : ''}
      </div>
      <div style="padding:0 20px 20px">
        ${actionHTML}
        ${reportHTML}
        ${adminActionHTML}
      </div>
    </div>`;

  window.deleteOwnPost = (itemId) => {
    const idx = DB.items.findIndex(i => i.id === itemId);
    if (idx >= 0) DB.items.splice(idx, 1);
    App.toast('Post deleted.');
    setTimeout(() => App.navigate('home', {}, false), 600);
  };
  window.adminRemovePost = (itemId) => {
    const target = DB.getItemById(itemId);
    if (target) target.status = 'Removed';
    DB.adminLog.unshift({ id: 'al'+Date.now(), action: 'Post Removed', target: target?.title, note: 'Admin removed from item detail.', adminId: u?.id, at: new Date().toISOString() });
    App.toast('Post removed by admin.');
    App.navigate('item-detail', { itemId });
  };
  return s;
};

// ===== POST TYPE SELECT =====
Screens['post-type'] = () => {
  const s = makeScreen('post-type');
  s.innerHTML = `
    ${backHeader('Post an Item')}
    <div class="scroll-area" style="padding:20px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="font-size:15px;color:var(--text-secondary);line-height:1.6">What would you like to report?</div>
      </div>
      <div class="post-type-select" style="flex-direction:column">
        <div class="post-type-card" onclick="App.navigate('create-post',{type:'lost'})" style="padding:24px;display:flex;align-items:center;gap:16px;text-align:left">
          <div style="width:48px;height:48px;border-radius:12px;background:var(--lost-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--lost-color)" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
          <div>
            <div class="post-type-label" style="font-size:18px;color:var(--lost-color)">I Lost Something</div>
            <div class="post-type-desc" style="margin-top:6px">Post your lost item so finders can contact you.</div>
          </div>
        </div>
        <div class="post-type-card" onclick="App.navigate('create-post',{type:'found'})" style="padding:24px;display:flex;align-items:center;gap:16px;text-align:left">
          <div style="width:48px;height:48px;border-radius:12px;background:var(--found-bg);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--found-color)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div>
            <div class="post-type-label" style="font-size:18px;color:var(--found-color)">I Found Something</div>
            <div class="post-type-desc" style="margin-top:6px">Report a found item. Claimants must verify ownership.</div>
          </div>
        </div>
      </div>
      <div class="info-banner" style="margin-top:20px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <div style="font-size:12px;color:var(--info);line-height:1.5">Don't share sensitive personal details publicly. Contact info stays private until a claim is approved.</div>
      </div>
    </div>`;
  return s;
};

// ===== CREATE POST =====
Screens['create-post'] = (ctx) => {
  const s = makeScreen('create-post');
  const type = ctx.type || 'lost';
  const isFound = type === 'found';
  let questions = isFound ? [{ text: '' }] : [];

  const renderQs = (container) => {
    container.innerHTML = questions.map((q, i) => `
      <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:10px">
        <div class="claim-q-num">${i + 1}</div>
        <div style="flex:1">
          <input class="form-input q-input" data-idx="${i}" value="${q.text}" placeholder="e.g. What color is it?" style="font-size:13px;padding:10px 12px" />
        </div>
        ${questions.length > 1 ? `<button onclick="removeQ(${i})" style="background:none;border:none;cursor:pointer;color:var(--danger);padding:10px 4px;font-size:18px">×</button>` : ''}
      </div>`).join('');
    container.querySelectorAll('.q-input').forEach(inp => {
      inp.addEventListener('change', () => { questions[+inp.dataset.idx].text = inp.value; });
    });
  };

  s.innerHTML = `
    ${backHeader(`Post ${isFound ? 'Found' : 'Lost'} Item`)}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div class="info-banner ${isFound ? 'success' : ''}" style="margin:0 0 20px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${isFound?'var(--success)':'var(--info)'}" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style="font-size:12px;color:${isFound?'var(--success)':'var(--info)'};line-height:1.5">
          ${isFound ? 'You are posting a <strong>Found Item</strong>. Add verification questions so claimants can prove ownership.' : 'You are posting a <strong>Lost Item</strong>. Other users may reach out if they find it.'}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Title<span class="required">*</span></label>
        <input class="form-input" id="post-title" placeholder="Brief, clear title. e.g. Black leather wallet" />
      </div>
      <div class="form-group">
        <label class="form-label">Category<span class="required">*</span></label>
        <select class="form-select" id="post-cat">
          <option value="">Select a category...</option>
          ${DB.categories.map(c=>`<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Description<span class="required">*</span></label>
        <textarea class="form-textarea" id="post-desc" placeholder="Describe the item in detail. Include color, brand, size, distinguishing features..."></textarea>
        <div class="form-hint">Be specific but avoid sharing sensitive personal details publicly.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Location<span class="required">*</span></label>
        <select class="form-select" id="post-loc">
          <option value="">Where was it ${isFound ? 'found' : 'lost'}?</option>
          ${DB.locations.map(l=>`<option value="${l}">${l}</option>`).join('')}
        </select>
      </div>
      <div style="display:flex;gap:12px">
        <div class="form-group" style="flex:1">
          <label class="form-label">Date<span class="required">*</span></label>
          <input class="form-input" type="date" id="post-date" value="2026-03-21" />
        </div>
        <div class="form-group" style="flex:1">
          <label class="form-label">Time (approx.)</label>
          <input class="form-input" type="time" id="post-time" value="12:00" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Photo (optional)</label>
        <div class="photo-upload" onclick="App.toast('Photo picker — simulated')">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <span>Tap to add photo</span>
        </div>
      </div>
      ${isFound ? `
      <div class="section-divider"></div>
      <div style="margin-bottom:12px">
        <div class="section-title" style="margin-bottom:4px">Verification Questions</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.5">Add questions that only the true owner would know how to answer.</div>
      </div>
      <div id="questions-container"></div>
      <div style="display:flex;gap:8px;margin-bottom:20px">
        <button class="btn btn-secondary btn-sm" id="add-custom-q">+ Custom Question</button>
        <button class="btn btn-outline btn-sm" id="add-preset-q">+ Preset Question</button>
      </div>` : ''}
      <button class="btn btn-primary btn-block btn-lg" id="post-submit-btn">Post Item</button>
    </div>`;

  if (isFound) {
    const qContainer = s.querySelector('#questions-container');
    renderQs(qContainer);
    const removeQ = (i) => { questions.splice(i, 1); renderQs(qContainer); };
    window.removeQ = removeQ;
    s.querySelector('#add-custom-q').addEventListener('click', () => { questions.push({ text: '' }); renderQs(qContainer); });
    s.querySelector('#add-preset-q').addEventListener('click', () => {
      App.showModal(`
        <div class="modal-title">Preset Questions</div>
        <div style="padding:0 20px 20px;display:flex;flex-direction:column;gap:10px">
          ${DB.predefinedQuestions.map((q,i)=>`<button class="btn btn-secondary" style="text-align:left;font-size:13px" onclick="window.addPresetQ('${q.replace(/'/g,"\\'")}')">${q}</button>`).join('')}
        </div>`);
      window.addPresetQ = (q) => { App.closeModal(); questions.push({ text: q }); renderQs(qContainer); };
    });
  }

  s.querySelector('#post-submit-btn').addEventListener('click', () => {
    const title = s.querySelector('#post-title').value;
    const cat = s.querySelector('#post-cat').value;
    const loc = s.querySelector('#post-loc').value;
    if (!title.trim() || !cat || !loc) { App.toast('Please fill in title, category, and location'); return; }
    const newItem = {
      id: 'i' + Date.now(), type, title, category: cat,
      description: s.querySelector('#post-desc').value || 'No description.',
      location: loc, date: s.querySelector('#post-date').value,
      time: s.querySelector('#post-time').value,
      emoji: '',
      status: 'Active', posterId: DB.currentUser?.id || 'u1', posterName: DB.currentUser?.name.split(' ')[0] + ' ' + (DB.currentUser?.name.split(' ')[1]?.[0] || '') + '.',
      verificationQuestions: isFound ? questions.filter(q=>q.text.trim()).map((q,i)=>({id:'nq'+i,text:q.text})) : [],
      claimCount: 0, resolvedAt: null
    };
    DB.items.unshift(newItem);
    App.toast('Item posted successfully!');
    setTimeout(() => App.navigate('item-detail', { itemId: newItem.id }), 600);
  });
  return s;
};

// ===== FINDER RESPONSE (for Lost Items) =====
Screens['finder-response'] = (ctx) => {
  const s = makeScreen('finder-response');
  const item = DB.getItemById(ctx.itemId) || DB.items[0];

  s.innerHTML = `
    ${backHeader('I Found This Item')}
    <div class="scroll-area has-bottom-pad" style="padding:16px">
      <div style="display:flex;gap:12px;align-items:center;background:white;border-radius:var(--r-lg);padding:14px;margin-bottom:20px;box-shadow:var(--shadow-sm);border:1px solid var(--border-light)">
        <div>${categoryIcon(item.category)}</div>
        <div><div style="font-size:15px;font-weight:700">${item.title}</div><div style="font-size:12px;color:var(--text-secondary)">${item.location} · ${formatDate(item.date)}</div></div>
      </div>
      <div class="info-banner" style="margin:0 0 20px">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style="font-size:12px;color:var(--info);line-height:1.5">Let the owner know you found their item. They will review your response and can accept or reject it.</div>
      </div>
      <div class="form-group">
        <label class="form-label">Message to Owner<span class="required">*</span></label>
        <textarea class="form-textarea" id="finder-msg" placeholder="E.g. I found what looks like your item at the library front desk. I can bring it to the main building."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Item Description (optional)</label>
        <textarea class="form-textarea" id="finder-desc" placeholder="Describe the item you found to help the owner confirm it's theirs..." style="min-height:70px"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Photo (optional)</label>
        <div class="photo-upload" onclick="App.toast('Photo picker — simulated')">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <span>Tap to add photo</span>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Suggested Meeting Point (optional)</label>
        <select class="form-select" id="finder-meeting">
          <option value="">Select a location...</option>
          ${DB.locations.map(l=>`<option value="${l}">${l}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="submit-finder-btn">Submit Response</button>
    </div>`;

  s.querySelector('#submit-finder-btn').addEventListener('click', () => {
    const msg = s.querySelector('#finder-msg').value;
    if (!msg.trim()) { App.toast('Please write a message to the owner'); return; }
    const u = DB.currentUser;
    const meeting = s.querySelector('#finder-meeting').value;
    const newResponse = {
      id: 'c' + Date.now(), itemId: item.id, claimantId: u.id, claimantName: u.name,
      isFinderResponse: true,
      status: 'Pending', submittedAt: new Date().toISOString(),
      answers: [
        { questionId: 'msg', question: 'Message to owner', answer: msg },
        { questionId: 'desc', question: 'Item description', answer: s.querySelector('#finder-desc').value || '(not provided)' },
        ...(meeting ? [{ questionId: 'meeting', question: 'Suggested meeting point', answer: meeting }] : [])
      ],
      chatEnabled: false, reviewNote: ''
    };
    DB.claims.push(newResponse);
    item.claimCount = (item.claimCount || 0) + 1;
    DB.notifications.unshift({ id: 'nn' + Date.now(), type: 'finder', icon: '', title: 'Someone found your item', desc: `${u.name} responded to "${item.title}" — review their response.`, time: 'Just now', read: false, screen: 'claim-review', itemId: item.id });
    App.toast('Response submitted! The owner will review it.');
    setTimeout(() => App.navigate('item-detail', { itemId: item.id }), 800);
  });
  return s;
};
