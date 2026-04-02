// ========================================
// CAMPUS LOST & FOUND — ROUTER & UTILITIES
// ========================================

const App = {
  history: [],
  currentScreen: null,
  screenContext: {},
  /** True after /api/config has been applied once (categories/locations rarely change). */
  _configLoaded: false,
  /** Coalesce concurrent full refreshes so double navigation does not duplicate work. */
  _refreshDefaultInFlight: null,

  /**
   * @param {object} [opts]
   * @param {boolean} [opts.notificationsOnly] — only refetch notifications (e.g. mark all read)
   * @param {boolean} [opts.listsOnly] — items + claims + notifications, no config or admin block
   * @param {boolean} [opts.forceConfig] — include /api/config even if already loaded
   */
  async refreshRemoteData(opts = {}) {
    const tok = window.Api.token.get();
    if (!tok) {
      App._configLoaded = false;
      DB.claims = [];
      DB.messages = {};
      DB.notifications = [];
      DB.reports = [];
      DB.adminLog = [];
      DB._adminStats = null;
      App.updateNavBadges();
      return;
    }

    const isDefault =
      !opts.notificationsOnly && !opts.listsOnly && !opts.forceConfig && Object.keys(opts).length === 0;
    if (isDefault && App._refreshDefaultInFlight) {
      return App._refreshDefaultInFlight;
    }

    const run = (async () => {
      if (opts.notificationsOnly) {
        try {
          const notifRes = await window.Api.notificationsList();
          if (Array.isArray(notifRes.notifications)) DB.notifications = notifRes.notifications;
        } catch (e) {
          console.warn('Notifications refresh failed:', e);
        }
        App.updateNavBadges();
        return;
      }

      if (opts.listsOnly) {
        try {
          const [itemsRes, claimsRes, notifRes] = await Promise.all([
            window.Api.itemsList().catch((e) => {
              console.warn('Items load failed:', e);
              return {};
            }),
            window.Api.claimsList().catch((e) => {
              console.warn('Claims load failed:', e);
              return {};
            }),
            window.Api.notificationsList().catch((e) => {
              console.warn('Notifications load failed:', e);
              return {};
            })
          ]);
          if (Array.isArray(itemsRes.items)) DB.items = itemsRes.items;
          if (Array.isArray(claimsRes.claims)) DB.claims = claimsRes.claims;
          if (Array.isArray(notifRes.notifications)) DB.notifications = notifRes.notifications;
        } catch (e) {
          console.warn('Lists refresh failed:', e);
        }
        App.updateNavBadges();
        return;
      }

      const wantConfig = opts.forceConfig || !App._configLoaded;
      try {
        const fetches = [
          wantConfig
            ? window.Api.config().catch((e) => {
                console.warn('Config load failed:', e);
                return null;
              })
            : Promise.resolve(null),
          window.Api.itemsList().catch((e) => {
            console.warn('Items load failed:', e);
            return {};
          }),
          window.Api.claimsList().catch((e) => {
            console.warn('Claims load failed:', e);
            return {};
          }),
          window.Api.notificationsList().catch((e) => {
            console.warn('Notifications load failed:', e);
            return {};
          })
        ];
        const [cfg, itemsRes, claimsRes, notifRes] = await Promise.all(fetches);
        if (cfg) {
          DB.categories = cfg.categories || DB.categories;
          DB.locations = cfg.locations || DB.locations;
          DB.predefinedQuestions = cfg.predefinedQuestions || DB.predefinedQuestions;
          App._configLoaded = true;
        }
        if (Array.isArray(itemsRes.items)) DB.items = itemsRes.items;
        if (Array.isArray(claimsRes.claims)) DB.claims = claimsRes.claims;
        if (Array.isArray(notifRes.notifications)) DB.notifications = notifRes.notifications;
      } catch (e) {
        console.warn('Parallel refresh failed:', e);
      }
      try {
        if (DB.currentUser?.role === 'admin') {
          const [reportsRes, stats, logRes] = await Promise.all([
            window.Api.reportsList().catch((e) => {
              console.warn('Reports load failed:', e);
              return {};
            }),
            window.Api.adminStats().catch((e) => {
              console.warn('Admin stats failed:', e);
              return null;
            }),
            window.Api.adminLog().catch((e) => {
              console.warn('Admin log failed:', e);
              return {};
            })
          ]);
          const { reports } = reportsRes;
          DB.reports = Array.isArray(reports) ? reports : [];
          DB._adminStats = stats;
          const { adminLog } = logRes;
          DB.adminLog = Array.isArray(adminLog) ? adminLog : [];
        } else {
          DB.reports = [];
          DB.adminLog = [];
          DB._adminStats = null;
        }
      } catch (e) {
        console.warn('Admin/reports load failed:', e);
      }
      App.updateNavBadges();
    })();

    if (isDefault) {
      App._refreshDefaultInFlight = run;
      run.finally(() => {
        if (App._refreshDefaultInFlight === run) App._refreshDefaultInFlight = null;
      });
    }

    return run;
  },

  /** Messages tab badge = approved chats you can open (same filter as Screens.messages). Not the same as unread notifications (home bell). */
  updateNavBadges() {
    const badge = document.getElementById('msg-badge');
    if (!badge) return;
    const u = DB.currentUser;
    if (!u?.id) {
      badge.style.display = 'none';
      badge.textContent = '';
      return;
    }
    const threads = DB.claims.filter(
      (c) =>
        c.chatEnabled &&
        (c.claimantId === u.id || DB.getItemById(c.itemId)?.posterId === u.id)
    );
    const n = threads.length;
    if (n === 0) {
      badge.style.display = 'none';
      badge.textContent = '';
    } else {
      badge.style.display = 'flex';
      badge.textContent = n > 9 ? '9+' : String(n);
    }
  },

  async init() {
    if (App._initStarted) return;
    App._initStarted = true;

    if (window.Lang?.syncChrome) window.Lang.syncChrome();
    // Set clock
    const updateTime = () => {
      const statusTime = document.getElementById('status-time');
      if (!statusTime) return;
      const now = new Date();
      const h = now.getHours(); const m = now.getMinutes();
      statusTime.textContent =
        `${h % 12 || 12}:${m.toString().padStart(2, '0')}`;
    };
    updateTime(); setInterval(updateTime, 30000);

    if (!App._navUiBound) {
      App._navUiBound = true;
      document.querySelectorAll('.nav-btn[data-screen]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const s = btn.dataset.screen;
          if (s === 'post') { App.navigate('post-type'); return; }
          App.navigate(s, {}, false);
          document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });
      document.getElementById('modal-overlay').addEventListener('click', App.closeModal);
    }

    try {
      if (window.Api?.token?.get?.()) {
        const me = await window.Api.me();
        DB.currentUser = me;
      } else {
        DB.currentUser = null;
      }
    } catch (e) {
      window.Api?.token?.set?.('');
      DB.currentUser = null;
    }

    await App.refreshRemoteData();

    if (DB.currentUser) {
      App.navigate('home', {}, false);
      return;
    }

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

    App.updateNavBadges();
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
    App.updateNavBadges();
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

  /** Map API errors from claim POST to a user-facing toast (see api/_itemClaims.js error codes). */
  toastClaimApiError(e) {
    if (e?.status === 401) {
      App.toast(Lang.t('signInShort'));
      return;
    }
    const code = e?.data?.error;
    if (code === 'cannot_claim_own_item') App.toast(Lang.t('toastClaimOwnItem'));
    else if (code === 'not_found') App.toast(Lang.t('toastClaimNotFound'));
    else App.toast(Lang.t('toastClaimFailed'));
  },

  login(userId) {
    DB.currentUser = DB.getUserById(userId);
    App.navigate('home', {}, false);
    App.history = [];
  },

  logout() {
    window.Api?.token?.set?.('');
    DB.currentUser = null;
    DB.claims = [];
    DB.messages = {};
    DB.notifications = [];
    DB.reports = [];
    DB.adminLog = [];
    DB._adminStats = null;
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
    <button class="back-btn" onclick="App.back()" aria-label="${Lang.t('back')}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <h2>${title}</h2>
    ${rightHTML}
  </div>`;
}

function itemBadge(type) {
  const label = type === 'lost' ? Lang.t('lost') : Lang.t('found');
  const cls = type === 'lost' ? 'badge-lost' : 'badge-found';
  return `<span class="badge ${cls}">${label}</span>`;
}

function statusBadge(status) {
  const map = {
    'Active': 'badge-active', 'Claim Pending': 'badge-pending',
    'Approved for Handover': 'badge-approved', 'Handover Scheduled': 'badge-info',
    'Resolved / Returned': 'badge-resolved', 'Removed': 'badge-rejected',
    'Pending': 'badge-pending', 'Approved': 'badge-approved',
    'Rejected': 'badge-rejected', 'Resolved': 'badge-resolved'
  };
  const labelKey = {
    'Active': 'statusActive', 'Claim Pending': 'statusClaimPending',
    'Approved for Handover': 'statusApprovedHandover', 'Handover Scheduled': 'statusHandoverScheduled',
    'Resolved / Returned': 'statusResolvedReturned', 'Removed': 'statusRemoved',
    'Pending': 'statusPending', 'Approved': 'statusApproved',
    'Rejected': 'statusRejected', 'Resolved': 'statusResolved'
  };
  const label = labelKey[status] ? Lang.t(labelKey[status]) : status;
  return `<span class="badge ${map[status] || 'badge-active'}">${label}</span>`;
}

function avatarHTML(user, size = 'avatar-md') {
  return `<div class="avatar ${size}">${user ? user.avatar : '?'}</div>`;
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d + (d.includes('T') ? '' : 'T00:00:00'));
  const loc = Lang.current === 'az' ? 'az-AZ' : 'en-US';
  return dt.toLocaleDateString(loc, { month: 'short', day: 'numeric', year: 'numeric' });
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
            ${Lang.formatLocation(item.location)}
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
