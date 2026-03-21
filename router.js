// ========================================
// CAMPUS LOST & FOUND — ROUTER & UTILITIES
// ========================================

const App = {
  history: [],
  currentScreen: null,
  screenContext: {},

  init() {
    // Set clock
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours(); const m = now.getMinutes();
      document.getElementById('status-time').textContent =
        `${h % 12 || 12}:${m.toString().padStart(2, '0')}`;
    };
    updateTime(); setInterval(updateTime, 30000);

    // Nav button listeners
    document.querySelectorAll('.nav-btn[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = btn.dataset.screen;
        if (s === 'post') { App.navigate('post-type'); return; }
        App.navigate(s, {}, false);
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Modal overlay close
    document.getElementById('modal-overlay').addEventListener('click', App.closeModal);

    // Start app
    App.navigate('splash');
  },

  navigate(screenId, ctx = {}, pushHistory = true) {
    const container = document.getElementById('screen-container');
    const old = container.querySelector('.screen.active');

    App.screenContext = ctx;

    if (pushHistory && App.currentScreen) {
      App.history.push(App.currentScreen);
    }
    App.currentScreen = screenId;

    // Remove old
    if (old) {
      old.classList.remove('active');
      old.classList.add('screen-leave');
      setTimeout(() => { if (old.parentNode) old.remove(); }, 300);
    }

    // Build new
    const fn = Screens[screenId];
    if (!fn) { console.error('Unknown screen:', screenId); return; }
    const el = fn(ctx);
    el.classList.add('screen', 'active', 'screen-enter');
    container.appendChild(el);
    setTimeout(() => el.classList.remove('screen-enter'), 300);

    // Nav bar visibility
    const authScreens = ['splash', 'onboarding', 'login', 'register', 'otp'];
    const nav = document.getElementById('bottom-nav');
    nav.style.display = authScreens.includes(screenId) ? 'none' : 'flex';

    // Update active nav
    if (!authScreens.includes(screenId)) {
      const mainMap = { home: 'nav-home', search: 'nav-search', post: 'nav-post', messages: 'nav-messages', profile: 'nav-profile' };
      const mainKey = Object.keys(mainMap).find(k => screenId === k || screenId.startsWith(k));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      if (mainKey && mainMap[mainKey]) {
        const nb = document.getElementById(mainMap[mainKey]);
        if (nb) nb.classList.add('active');
      }
    }

    // Badge
    const unread = DB.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('msg-badge');
    if (badge) { badge.style.display = unread > 0 ? 'flex' : 'none'; badge.textContent = unread; }
  },

  back() {
    if (App.history.length === 0) { App.navigate('home', {}, false); return; }
    const prev = App.history.pop();
    const container = document.getElementById('screen-container');
    const old = container.querySelector('.screen.active');
    if (old) { old.classList.remove('active'); old.classList.add('screen-leave'); setTimeout(() => { if (old.parentNode) old.remove(); }, 280); }
    const fn = Screens[prev];
    if (!fn) return;
    const el = fn(App.screenContext);
    el.classList.add('screen', 'active', 'screen-enter-back');
    container.appendChild(el);
    setTimeout(() => el.classList.remove('screen-enter-back'), 280);
    App.currentScreen = prev;
    const authScreens = ['splash', 'onboarding', 'login', 'register', 'otp'];
    document.getElementById('bottom-nav').style.display = authScreens.includes(prev) ? 'none' : 'flex';
  },

  showModal(html) {
    document.getElementById('modal-overlay').style.display = 'block';
    const sheet = document.getElementById('modal-sheet');
    sheet.innerHTML = `<div class="modal-handle"></div>${html}`;
    sheet.style.display = 'block';
  },

  closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    document.getElementById('modal-sheet').style.display = 'none';
  },

  toast(msg, duration = 2500) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
  },

  login(userId) {
    DB.currentUser = DB.getUserById(userId);
    App.navigate('home', {}, false);
    App.history = [];
  },

  logout() {
    DB.currentUser = null;
    App.navigate('login', {}, false);
    App.history = [];
    document.getElementById('bottom-nav').style.display = 'none';
  }
};

// ========== HELPERS ==========
function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

function div(cls, html) { return el('div', cls, html); }

function makeScreen(id) {
  const s = div('screen');
  s.id = 'screen-' + id;
  return s;
}

function backHeader(title, rightHTML = '') {
  return `<div class="nav-header">
    <button class="back-btn" onclick="App.back()" aria-label="Back">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <h2>${title}</h2>
    ${rightHTML}
  </div>`;
}

function itemBadge(type) {
  return type === 'lost'
    ? '<span class="badge badge-lost">Lost</span>'
    : '<span class="badge badge-found">Found</span>';
}

function statusBadge(status) {
  const map = {
    'Active': 'badge-active', 'Claim Pending': 'badge-pending',
    'Approved for Handover': 'badge-approved', 'Handover Scheduled': 'badge-info',
    'Resolved / Returned': 'badge-resolved', 'Removed': 'badge-rejected',
    'Pending': 'badge-pending', 'Approved': 'badge-approved',
    'Rejected': 'badge-rejected', 'Resolved': 'badge-resolved'
  };
  return `<span class="badge ${map[status] || 'badge-active'}">${status}</span>`;
}

function avatarHTML(user, size = 'avatar-md') {
  return `<div class="avatar ${size}">${user ? user.avatar : '?'}</div>`;
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d + (d.includes('T') ? '' : 'T00:00:00'));
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function itemCardHTML(item, onclick) {
  const poster = DB.getUserById(item.posterId);
  return `<div class="item-card" onclick="${onclick || `App.navigate('item-detail', {itemId:'${item.id}'})`}">
    <div class="item-card-header">
      <div class="item-photo">${typeof categoryIcon === 'function' ? categoryIcon(item.category) : ''}</div>
      <div class="item-card-info">
        <div class="item-card-title">${item.title}</div>
        <div class="item-card-meta">
          ${itemBadge(item.type)}
          <span class="meta-chip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${item.location}
          </span>
        </div>
      </div>
      <div style="flex-shrink:0">${statusBadge(item.status)}</div>
    </div>
    <div class="item-card-desc">${item.description}</div>
    <div class="item-card-footer">
      <span class="tag">${item.category}</span>
      <span style="font-size:11px;color:var(--text-tertiary)">${formatDate(item.date)}</span>
    </div>
  </div>`;
}
