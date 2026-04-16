// ========================================
// CAMPUS LOST & FOUND — AUTH SCREENS
// ========================================

const Screens = {};

// ===== SPLASH =====
Screens.splash = () => {
  const s = makeScreen('splash');
  s.style.background = 'linear-gradient(160deg, #1E40AF 0%, #2563EB 50%, #3B82F6 100%)';
  s.innerHTML = `
    <div class="splash-screen" style="flex:1;gap:0">
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;padding:32px">
        <div class="splash-logo">
          <img src="assets/bhos-logo.png" alt="Baku Higher Oil School logo" />
        </div>
        <div>
          <div class="splash-title">${Lang.t('appName')}</div>
          <div class="splash-sub" style="margin-top:10px">${Lang.t('splashTagline')}<br>${Lang.t('splashTagline2')}</div>
        </div>
        <div class="splash-dots">
          <div class="splash-dot active"></div>
          <div class="splash-dot"></div>
          <div class="splash-dot"></div>
        </div>
      </div>
      <div style="padding:32px;display:flex;flex-direction:column;gap:12px">
        <button class="btn btn-block" onclick="App.navigate('onboarding')" style="background:white;color:var(--primary);font-size:16px;padding:16px">
          ${Lang.t('getStarted')}
        </button>
        <button class="btn btn-block btn-outline" onclick="App.navigate('login')" style="border-color:rgba(255,255,255,0.5);color:white;font-size:16px;padding:16px">
          ${Lang.t('alreadyAccount')}
        </button>
      </div>
      <div style="text-align:center;padding-bottom:24px;color:rgba(255,255,255,0.5);font-size:11px">
        ${Lang.t('bhos')}
      </div>
    </div>`;
  return s;
};

// ===== ONBOARDING =====
Screens.onboarding = () => {
  const s = makeScreen('onboarding');
  const pages = [
    { emoji: '🔍', titleKey: 'onboard1Title', descKey: 'onboard1Desc' },
    { emoji: '📋', titleKey: 'onboard2Title', descKey: 'onboard2Desc' },
    { emoji: '🔒', titleKey: 'onboard3Title', descKey: 'onboard3Desc' }
  ];
  let idx = 0;
  const render = () => { wrapper.innerHTML = pageHTML(pages[idx]); updateDots(); };
  const pageHTML = (p) => `
    <div class="onboard-page" style="padding-top:60px">
      <div class="onboard-illustration">${p.emoji}</div>
      <div class="onboard-title">${Lang.t(p.titleKey)}</div>
      <div class="onboard-desc">${Lang.t(p.descKey)}</div>
    </div>`;
  const updateDots = () => {
    dotsEl.querySelectorAll('.splash-dot').forEach((d, i) => {
      d.classList.toggle('active', i === idx); d.style.width = i === idx ? '20px' : '7px';
    });
  };
  s.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column">
      <div id="onboard-wrapper" style="flex:1">${pageHTML(pages[0])}</div>
      <div style="padding:24px 24px 32px">
        <div class="splash-dots" id="onboard-dots" style="justify-content:center;margin-bottom:28px">
          ${pages.map((_, i) => `<div class="splash-dot ${i === 0 ? 'active' : ''}" style="${i === 0 ? 'width:20px' : ''}"></div>`).join('')}
        </div>
        <button class="btn btn-primary btn-block btn-lg" id="onboard-next-btn">${Lang.t('next')}</button>
        <button class="btn btn-secondary btn-block" style="margin-top:10px" onclick="App.navigate('login')">${Lang.t('skip')}</button>
      </div>
    </div>`;
  const wrapper = s.querySelector('#onboard-wrapper');
  const dotsEl = s.querySelector('#onboard-dots');
  s.querySelector('#onboard-next-btn').addEventListener('click', () => {
    idx++;
    if (idx >= pages.length) { App.navigate('register'); return; }
    render();
    const btn = s.querySelector('#onboard-next-btn');
    if (btn) btn.textContent = idx === pages.length - 1 ? Lang.t('registerCta') : Lang.t('next');
  });
  return s;
};

// ===== LOGIN =====
Screens.login = () => {
  const s = makeScreen('login');
  s.innerHTML = `
    <div class="auth-screen has-bottom-pad tight-top">
      <div class="lang-toggle-row">
        <button class="lang-pill ${Lang.current === 'en' ? 'active' : ''}" type="button" id="lang-en">EN</button>
        <button class="lang-pill ${Lang.current === 'az' ? 'active' : ''}" type="button" id="lang-az">AZ</button>
      </div>
      <div class="auth-logo">
        <img src="assets/bhos-logo.png" alt="Baku Higher Oil School logo" />
      </div>
      <div class="auth-title">${Lang.t('welcomeBack')}</div>
      <div class="auth-sub">${Lang.t('signInSubtitle')}</div>
      <div class="form-group">
        <label class="form-label">${Lang.t('emailOrPhone')}<span class="required">*</span></label>
        <div class="input-icon-wrap">
          <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <input id="login-email" class="form-input" type="text" placeholder="${Lang.t('loginEmailPlaceholder')}" autocomplete="username" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${Lang.t('password')}<span class="required">*</span></label>
        <div class="input-icon-wrap">
          <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <input id="login-pass" class="form-input" type="password" placeholder="••••••••" autocomplete="current-password" style="padding-left:44px;padding-right:44px"/>
          <button class="pw-toggle" type="button" id="login-pass-toggle" aria-label="${Lang.t('showPassword')}">${Lang.t('show')}</button>
        </div>
      </div>
      <div style="text-align:right;margin-top:-8px;margin-bottom:20px">
        <span style="font-size:13px;color:var(--primary);font-weight:600;cursor:pointer">${Lang.t('forgotPassword')}</span>
      </div>
      <button type="button" class="btn btn-primary btn-block btn-lg" id="login-btn">${Lang.t('signIn')}</button>
      <div class="auth-footer">${Lang.t('dontHaveAccount')} <span class="auth-link" onclick="App.navigate('register')">${Lang.t('signUp')}</span></div>
    </div>`;
  const pass = s.querySelector('#login-pass');
  const toggle = s.querySelector('#login-pass-toggle');
  toggle.addEventListener('click', () => {
    const isPw = pass.type === 'password';
    pass.type = isPw ? 'text' : 'password';
    toggle.textContent = isPw ? Lang.t('hide') : Lang.t('show');
    toggle.setAttribute('aria-label', isPw ? Lang.t('hidePassword') : Lang.t('showPassword'));
  });

  let loginBusy = false;
  s.querySelector('#login-btn').addEventListener('click', async () => {
    if (loginBusy) return;
    const identifier = s.querySelector('#login-email').value.trim();
    const password = s.querySelector('#login-pass').value;
    if (!identifier) { App.toast(Lang.t('toastEnterEmail')); return; }
    if (!password) { App.toast(Lang.t('toastEnterPassword')); return; }
    loginBusy = true;
    try {
      let user;
      try {
        user = await window.Api.login(identifier, password);
      } catch (e) {
        if (e.message === 'invalid_json' || e.message === 'empty_response' || e.code === 'bad_auth_payload') {
          App.toast(Lang.t('toastRegBadResponse'));
        } else {
          App.toast(Lang.t('toastSignInFailed'));
        }
        return;
      }
      DB.currentUser = user;
      try {
        await App.refreshRemoteData();
        App.navigate('home', {}, false);
        App.history = [];
      } catch (e) {
        console.error(e);
        App.toast(Lang.t('toastSignedInBlank'));
      }
    } finally {
      loginBusy = false;
    }
  });

  s.querySelector('#lang-en').addEventListener('click', () => Lang.set('en'));
  s.querySelector('#lang-az').addEventListener('click', () => Lang.set('az'));
  return s;
};

// ===== REGISTER =====
Screens.register = () => {
  const s = makeScreen('register');
  s.innerHTML = `
    <div class="auth-screen has-bottom-pad tight-top scroll-y">
      <div class="lang-toggle-row">
        <button class="lang-pill ${Lang.current === 'en' ? 'active' : ''}" type="button" id="lang-en">EN</button>
        <button class="lang-pill ${Lang.current === 'az' ? 'active' : ''}" type="button" id="lang-az">AZ</button>
      </div>
      <div class="auth-logo">
        <img src="assets/bhos-logo.png" alt="Baku Higher Oil School logo" />
      </div>
      <div class="auth-title">${Lang.t('createAccount')}</div>
      <div class="auth-sub">${Lang.t('joinCommunity')}</div>
      <div class="form-group">
        <label class="form-label">${Lang.t('fullName')}<span class="required">*</span></label>
        <input class="form-input" type="text" placeholder="${Lang.t('regFullNamePlaceholder')}" id="reg-name" />
      </div>
      <div class="form-group">
        <label class="form-label">${Lang.t('campusEmail')}<span class="required">*</span></label>
        <input class="form-input" type="email" placeholder="${Lang.t('regEmailPlaceholder')}" id="reg-email" />
        <div class="form-hint">${Lang.t('regEmailHint')}</div>
      </div>
      <div class="form-group">
        <label class="form-label">${Lang.t('phoneNumber')}</label>
        <input class="form-input" type="tel" placeholder="+994 XX XXX XX XX" id="reg-phone" autocomplete="tel" />
        <div class="form-hint">${Lang.t('regPhoneHint')}</div>
      </div>
      <div class="form-group">
        <label class="form-label">${Lang.t('role')}<span class="required">*</span></label>
        <select class="form-select" id="reg-role">
          <option value="student">${Lang.t('student')}</option>
          <option value="staff">${Lang.t('staff')}</option>
        </select>
      </div>
      <div class="form-group" id="reg-dept-wrap">
        <label class="form-label">${Lang.t('facultyProgram')}</label>
        <select class="form-select" id="reg-dept">
          <option value="">${Lang.t('select')}</option>
          ${[
            'Petroleum Engineering',
            'Chemical Engineering',
            'Process Automation Engineering',
            'Information Security',
            'Computer Engineering',
            'Business Administration',
            'Computer Science',
            'Finance',
            'Data Analytics'
          ].map(f => `<option value="${f}">${f}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">${Lang.t('password')}<span class="required">*</span></label>
        <div class="input-icon-wrap">
          <input class="form-input" type="password" placeholder="${Lang.t('regPasswordPlaceholder')}" id="reg-pass" autocomplete="new-password" style="padding-right:44px" />
          <button class="pw-toggle" type="button" id="reg-pass-toggle" aria-label="${Lang.t('showPassword')}">${Lang.t('show')}</button>
        </div>
      </div>
      <button type="button" class="btn btn-primary btn-block btn-lg" id="reg-btn">${Lang.t('registerCta')}</button>
      <div class="auth-footer">${Lang.t('alreadyHaveAccount')} <span class="auth-link" onclick="App.navigate('login')">${Lang.t('signIn')}</span></div>
    </div>`;

  const phone = s.querySelector('#reg-phone');
  phone.addEventListener('focus', () => {
    if (!phone.value) phone.value = '+994 ';
  });
  phone.addEventListener('input', () => {
    if (phone.value && !phone.value.startsWith('+994')) {
      phone.value = '+994 ' + phone.value.replace(/^\+?/, '').replace(/^994\s?/, '');
    }
  });

  const deptWrap = s.querySelector('#reg-dept-wrap');
  const roleSelect = s.querySelector('#reg-role');
  const syncDeptVisibility = () => {
    const isStaff = roleSelect.value === 'staff';
    deptWrap.style.display = isStaff ? 'none' : '';
    deptWrap.setAttribute('aria-hidden', isStaff ? 'true' : 'false');
    if (isStaff) s.querySelector('#reg-dept').value = '';
  };
  roleSelect.addEventListener('change', syncDeptVisibility);
  syncDeptVisibility();

  const rpass = s.querySelector('#reg-pass');
  const rtoggle = s.querySelector('#reg-pass-toggle');
  rtoggle.addEventListener('click', () => {
    const isPw = rpass.type === 'password';
    rpass.type = isPw ? 'text' : 'password';
    rtoggle.textContent = isPw ? Lang.t('hide') : Lang.t('show');
    rtoggle.setAttribute('aria-label', isPw ? Lang.t('hidePassword') : Lang.t('showPassword'));
  });

  let regBusy = false;
  s.querySelector('#reg-btn').addEventListener('click', async () => {
    const name = s.querySelector('#reg-name').value.trim();
    const email = s.querySelector('#reg-email').value.trim();
    const phoneVal = phone.value.trim() || undefined;
    const role = s.querySelector('#reg-role').value;
    const department = role === 'staff' ? '' : s.querySelector('#reg-dept').value;
    const password = rpass.value;

    if (!name) { App.toast(Lang.t('toastEnterName')); return; }
    if (!email.includes('@')) { App.toast(Lang.t('toastValidEmail')); return; }
    if (phoneVal && !phoneVal.startsWith('+994')) { App.toast(Lang.t('toastPhone994')); return; }
    if (role === 'student' && !department) { App.toast(Lang.t('toastSelectFaculty')); return; }
    if (!password || password.length < 8) { App.toast(Lang.t('toastPasswordLen')); return; }

    if (regBusy) return;
    regBusy = true;
    try {
      const user = await window.Api.register({ name, email, phone: phoneVal, role, department, year: role === 'staff' ? 'Staff' : '', password });
      DB.currentUser = user;
      await App.refreshRemoteData();
      App.toast(Lang.t('toastAccountCreated'));
      setTimeout(() => App.navigate('home', {}, false), 500);
      App.history = [];
    } catch (e) {
      if (e.status === 409 || e.data?.error === 'user_exists') {
        App.toast(Lang.t('toastRegDuplicate'));
      } else if (
        e.message === 'invalid_json' ||
        e.message === 'empty_response' ||
        e.code === 'bad_auth_payload'
      ) {
        App.toast(Lang.t('toastRegBadResponse'));
      } else {
        App.toast(Lang.t('toastRegDb'));
      }
    } finally {
      regBusy = false;
    }
  });
  s.querySelector('#lang-en').addEventListener('click', () => Lang.set('en'));
  s.querySelector('#lang-az').addEventListener('click', () => Lang.set('az'));
  return s;
};

// ===== OTP VERIFICATION =====
Screens.otp = (ctx) => {
  const s = makeScreen('otp');
  s.innerHTML = `
    <div class="auth-screen otp-top">
      <div class="auth-logo">
        <img src="assets/bhos-logo.png" alt="Baku Higher Oil School logo" />
      </div>
      <div class="auth-title">${Lang.t('verification')}</div>
      <div class="auth-sub">${Lang.t('verificationPending')}</div>
      <button class="btn btn-primary btn-block btn-lg" onclick="App.navigate('login')">${Lang.t('backToSignIn')}</button>
    </div>`;
  return s;
};
