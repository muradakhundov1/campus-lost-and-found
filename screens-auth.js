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
          <div class="splash-sub" style="margin-top:10px">One place for BHOS.<br>Simple. Fast. Trustworthy.</div>
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
    { emoji:'🔍', title:'Find lost items fast', desc:'Search through verified lost and found posts from across your campus. Keyword search, filters, and smart matching.' },
    { emoji:'📋', title:'Claim with confidence', desc:'Submit a structured claim, answer verification questions, and get your item back safely — no guessing games.' },
    { emoji:'🔒', title:'Private & secure', desc:'Your personal details stay protected. Chat only opens after claim approval. Reports and moderation keep the community safe.' }
  ];
  let idx = 0;
  const render = () => { wrapper.innerHTML = pageHTML(pages[idx]); updateDots(); };
  const pageHTML = (p) => `
    <div class="onboard-page" style="padding-top:60px">
      <div class="onboard-illustration">${p.emoji}</div>
      <div class="onboard-title">${p.title}</div>
      <div class="onboard-desc">${p.desc}</div>
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
          ${pages.map((_,i)=>`<div class="splash-dot ${i===0?'active':''}" style="${i===0?'width:20px':''}"></div>`).join('')}
        </div>
        <button class="btn btn-primary btn-block btn-lg" id="onboard-next-btn">Next</button>
        <button class="btn btn-secondary btn-block" style="margin-top:10px" onclick="App.navigate('login')">Skip</button>
      </div>
    </div>`;
  const wrapper = s.querySelector('#onboard-wrapper');
  const dotsEl = s.querySelector('#onboard-dots');
  s.querySelector('#onboard-next-btn').addEventListener('click', () => {
    idx++;
    if (idx >= pages.length) { App.navigate('register'); return; }
    render();
    const btn = s.querySelector('#onboard-next-btn');
    if (btn) btn.textContent = idx === pages.length - 1 ? 'Create Account' : 'Next';
  });
  return s;
};

// ===== LOGIN =====
Screens.login = () => {
  const s = makeScreen('login');
  s.innerHTML = `
    <div class="auth-screen has-bottom-pad tight-top">
      <div class="lang-toggle-row">
        <button class="lang-pill ${Lang.current==='en'?'active':''}" type="button" id="lang-en">EN</button>
        <button class="lang-pill ${Lang.current==='az'?'active':''}" type="button" id="lang-az">AZ</button>
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
          <input id="login-email" class="form-input" type="text" placeholder="you@bhos.edu.az or +994..." autocomplete="username" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${Lang.t('password')}<span class="required">*</span></label>
        <div class="input-icon-wrap">
          <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <input id="login-pass" class="form-input" type="password" placeholder="••••••••" autocomplete="current-password" style="padding-left:44px;padding-right:44px"/>
          <button class="pw-toggle" type="button" id="login-pass-toggle" aria-label="Show password">Show</button>
        </div>
      </div>
      <div style="text-align:right;margin-top:-8px;margin-bottom:20px">
        <span style="font-size:13px;color:var(--primary);font-weight:600;cursor:pointer">Forgot password?</span>
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="login-btn">${Lang.t('signIn')}</button>
      <div class="auth-footer">Don't have an account? <span class="auth-link" onclick="App.navigate('register')">${Lang.t('signUp')}</span></div>
    </div>`;
  const pass = s.querySelector('#login-pass');
  const toggle = s.querySelector('#login-pass-toggle');
  toggle.addEventListener('click', () => {
    const isPw = pass.type === 'password';
    pass.type = isPw ? 'text' : 'password';
    toggle.textContent = isPw ? 'Hide' : 'Show';
    toggle.setAttribute('aria-label', isPw ? 'Hide password' : 'Show password');
  });

  s.querySelector('#login-btn').addEventListener('click', async () => {
    const identifier = s.querySelector('#login-email').value.trim();
    const password = s.querySelector('#login-pass').value;
    if (!identifier) { App.toast('Please enter email or phone'); return; }
    if (!password) { App.toast('Please enter password'); return; }
    let user;
    try {
      user = await window.Api.login(identifier, password);
    } catch (e) {
      App.toast('Sign in failed. Check credentials.');
      return;
    }
    DB.currentUser = user;
    try {
      App.navigate('home', {}, false);
      App.history = [];
    } catch (e) {
      console.error(e);
      App.toast('Signed in. If the screen is blank, refresh the page.');
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
        <button class="lang-pill ${Lang.current==='en'?'active':''}" type="button" id="lang-en">EN</button>
        <button class="lang-pill ${Lang.current==='az'?'active':''}" type="button" id="lang-az">AZ</button>
      </div>
      <div class="auth-logo">
        <img src="assets/bhos-logo.png" alt="Baku Higher Oil School logo" />
      </div>
      <div class="auth-title">${Lang.t('createAccount')}</div>
      <div class="auth-sub">${Lang.t('joinCommunity')}</div>
      <div class="form-group">
        <label class="form-label">${Lang.t('fullName')}<span class="required">*</span></label>
        <input class="form-input" type="text" placeholder="Your full name" id="reg-name" />
      </div>
      <div class="form-group">
        <label class="form-label">${Lang.t('campusEmail')}<span class="required">*</span></label>
        <input class="form-input" type="email" placeholder="you@bhos.edu.az" id="reg-email" />
        <div class="form-hint">Must be your official campus email address</div>
      </div>
      <div class="form-group">
        <label class="form-label">${Lang.t('phoneNumber')}</label>
        <input class="form-input" type="tel" placeholder="+994 XX XXX XX XX" id="reg-phone" autocomplete="tel" />
        <div class="form-hint">Used for account verification only, not shown publicly</div>
      </div>
      <div class="form-group">
        <label class="form-label">${Lang.t('role')}<span class="required">*</span></label>
        <select class="form-select" id="reg-role">
          <option value="student">Student</option>
          <option value="staff">Staff</option>
        </select>
      </div>
      <div class="form-group">
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
          <input class="form-input" type="password" placeholder="Min. 8 characters" id="reg-pass" autocomplete="new-password" style="padding-right:44px" />
          <button class="pw-toggle" type="button" id="reg-pass-toggle" aria-label="Show password">Show</button>
        </div>
      </div>
      <div class="info-banner" style="margin:0 0 20px">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style="font-size:12px;color:var(--info);line-height:1.5">A 6-digit verification code will be sent to your email or phone after registration.</div>
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="reg-btn">${Lang.t('registerCta')}</button>
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

  const rpass = s.querySelector('#reg-pass');
  const rtoggle = s.querySelector('#reg-pass-toggle');
  rtoggle.addEventListener('click', () => {
    const isPw = rpass.type === 'password';
    rpass.type = isPw ? 'text' : 'password';
    rtoggle.textContent = isPw ? 'Hide' : 'Show';
    rtoggle.setAttribute('aria-label', isPw ? 'Hide password' : 'Show password');
  });

  s.querySelector('#reg-btn').addEventListener('click', async () => {
    const name = s.querySelector('#reg-name').value.trim();
    const email = s.querySelector('#reg-email').value.trim();
    const phoneVal = phone.value.trim() || undefined;
    const role = s.querySelector('#reg-role').value;
    const department = s.querySelector('#reg-dept').value;
    const password = rpass.value;

    if (!name) { App.toast('Please enter your full name'); return; }
    if (!email.includes('@')) { App.toast('Please enter a valid email'); return; }
    if (phoneVal && !phoneVal.startsWith('+994')) { App.toast('Phone number must start with +994'); return; }
    if (!department) { App.toast('Please select a faculty/program'); return; }
    if (!password || password.length < 8) { App.toast('Password must be at least 8 characters'); return; }

    try {
      const user = await window.Api.register({ name, email, phone: phoneVal, role, department, year: role === 'staff' ? 'Staff' : '' , password });
      DB.currentUser = user;
      App.toast('Account created!');
      setTimeout(() => App.navigate('home', {}, false), 500);
      App.history = [];
    } catch (e) {
      if (e.status === 409 || e.data?.error === 'user_exists') {
        App.toast('Registration failed. Email/phone may already exist.');
      } else {
        App.toast('Registration failed. Check that the database is set up, then try again.');
      }
    }
  });
  s.querySelector('#lang-en').addEventListener('click', () => Lang.set('en'));
  s.querySelector('#lang-az').addEventListener('click', () => Lang.set('az'));
  return s;
};

// ===== OTP VERIFICATION =====
Screens.otp = (ctx) => {
  const s = makeScreen('otp');
  // OTP is not implemented yet (would require SMS/email provider). Keep screen but clearly message.
  s.innerHTML = `
    <div class="auth-screen otp-top">
      <div class="auth-logo">
        <img src="assets/bhos-logo.png" alt="Baku Higher Oil School logo" />
      </div>
      <div class="auth-title">Verification</div>
      <div class="auth-sub">Verification codes will be added later. For now, accounts are verified automatically.</div>
      <button class="btn btn-primary btn-block btn-lg" onclick="App.navigate('login')">Back to Sign In</button>
    </div>`;
  return s;
};
