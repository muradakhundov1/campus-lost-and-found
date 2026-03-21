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
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div>
          <div class="splash-title">Campus Lost &amp; Found</div>
          <div class="splash-sub" style="margin-top:10px">One place for the whole campus.<br>Simple. Fast. Trustworthy.</div>
        </div>
        <div class="splash-dots">
          <div class="splash-dot active"></div>
          <div class="splash-dot"></div>
          <div class="splash-dot"></div>
        </div>
      </div>
      <div style="padding:32px;display:flex;flex-direction:column;gap:12px">
        <button class="btn btn-block" onclick="App.navigate('onboarding')" style="background:white;color:var(--primary);font-size:16px;padding:16px">
          Get Started
        </button>
        <button class="btn btn-block btn-outline" onclick="App.navigate('login')" style="border-color:rgba(255,255,255,0.5);color:white;font-size:16px;padding:16px">
          I already have an account
        </button>
      </div>
      <div style="text-align:center;padding-bottom:24px;color:rgba(255,255,255,0.5);font-size:11px">
        🏫 University of Lakewood Campus
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
    <div class="auth-screen has-bottom-pad" style="padding-top:24px">
      <div class="auth-logo">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
      </div>
      <div class="auth-title">Welcome back</div>
      <div class="auth-sub">Sign in to your campus account</div>
      <div class="form-group">
        <label class="form-label">Campus Email or Phone<span class="required">*</span></label>
        <div class="input-icon-wrap">
          <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <input id="login-email" class="form-input" type="email" placeholder="you@campus.edu or +1 555-..." value="alex.j@campus.edu" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Password<span class="required">*</span></label>
        <div class="input-icon-wrap">
          <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          <input id="login-pass" class="form-input" type="password" placeholder="••••••••" value="password" style="padding-left:44px"/>
        </div>
      </div>
      <div style="text-align:right;margin-top:-8px;margin-bottom:20px">
        <span style="font-size:13px;color:var(--primary);font-weight:600;cursor:pointer">Forgot password?</span>
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="login-btn">Sign In</button>
      <div style="text-align:center;margin:16px 0;font-size:12px;color:var(--text-tertiary)">— or sign in as —</div>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${DB.users.filter(u=>u.id!=='u4').map(u=>`
          <button class="btn btn-secondary btn-block" onclick="App.login('${u.id}')" style="justify-content:flex-start;gap:12px">
            <div class="avatar avatar-sm">${u.avatar}</div>
            <div style="text-align:left">
              <div style="font-size:13px;font-weight:700">${u.name}</div>
              <div style="font-size:11px;color:var(--text-secondary)">${u.role} — ${u.department}</div>
            </div>
          </button>`).join('')}
        <button class="btn btn-outline btn-block" onclick="App.login('u4')" style="justify-content:flex-start;gap:12px;border-color:var(--warning);color:var(--warning)">
          <div class="avatar avatar-sm" style="background:var(--warning-light);color:var(--warning)">AU</div>
          <div style="text-align:left">
            <div style="font-size:13px;font-weight:700">Admin User</div>
            <div style="font-size:11px;color:var(--text-secondary)">admin — Administration</div>
          </div>
        </button>
      </div>
      <div class="auth-footer">Don't have an account? <span class="auth-link" onclick="App.navigate('register')">Sign up</span></div>
    </div>`;
  s.querySelector('#login-btn').addEventListener('click', () => {
    const email = s.querySelector('#login-email').value;
    const found = DB.users.find(u => u.email === email || u.phone === email);
    App.login(found ? found.id : 'u1');
  });
  return s;
};

// ===== REGISTER =====
Screens.register = () => {
  const s = makeScreen('register');
  s.innerHTML = `
    <div class="auth-screen has-bottom-pad" style="padding-top:24px;overflow-y:auto">
      <div class="auth-logo">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
      </div>
      <div class="auth-title">Create account</div>
      <div class="auth-sub">Join the campus community</div>
      <div class="form-group">
        <label class="form-label">Full Name<span class="required">*</span></label>
        <input class="form-input" type="text" placeholder="Your full name" id="reg-name" />
      </div>
      <div class="form-group">
        <label class="form-label">Campus Email<span class="required">*</span></label>
        <input class="form-input" type="email" placeholder="you@campus.edu" id="reg-email" />
        <div class="form-hint">Must be your official campus email address</div>
      </div>
      <div class="form-group">
        <label class="form-label">Phone Number</label>
        <input class="form-input" type="tel" placeholder="+1 555-..." id="reg-phone" />
        <div class="form-hint">Used for account verification only, not shown publicly</div>
      </div>
      <div class="form-group">
        <label class="form-label">Role<span class="required">*</span></label>
        <select class="form-select" id="reg-role">
          <option value="student">Student</option>
          <option value="staff">Staff</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Department / Faculty</label>
        <input class="form-input" type="text" placeholder="e.g. Computer Science" id="reg-dept" />
      </div>
      <div class="form-group">
        <label class="form-label">Password<span class="required">*</span></label>
        <input class="form-input" type="password" placeholder="Min. 8 characters" id="reg-pass" />
      </div>
      <div class="info-banner" style="margin:0 0 20px">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--info)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style="font-size:12px;color:var(--info);line-height:1.5">A 6-digit verification code will be sent to your email or phone after registration.</div>
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="reg-btn">Continue</button>
      <div class="auth-footer">Already have an account? <span class="auth-link" onclick="App.navigate('login')">Sign in</span></div>
    </div>`;
  s.querySelector('#reg-btn').addEventListener('click', () => {
    const name = s.querySelector('#reg-name').value;
    if (!name.trim()) { App.toast('Please enter your full name'); return; }
    const email = s.querySelector('#reg-email').value;
    if (!email.includes('@')) { App.toast('Please enter a valid campus email'); return; }
    App.navigate('otp', { name, email, fromRegister: true });
  });
  return s;
};

// ===== OTP VERIFICATION =====
Screens.otp = (ctx) => {
  const s = makeScreen('otp');
  s.innerHTML = `
    <div class="auth-screen" style="padding-top:32px">
      <div class="auth-logo">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
      </div>
      <div class="auth-title">Verify your account</div>
      <div class="auth-sub">We sent a 6-digit code to<br><strong>${ctx.email || 'your@campus.edu'}</strong></div>
      <div class="otp-inputs" id="otp-inputs">
        ${[0,1,2,3,4,5].map(i=>`<input class="otp-input" id="otp-${i}" maxlength="1" type="text" inputmode="numeric" />`).join('')}
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="otp-verify-btn">Verify &amp; Continue</button>
      <div style="text-align:center;margin-top:20px">
        <div style="font-size:13px;color:var(--text-secondary)">Didn't get the code?</div>
        <button class="btn btn-secondary" style="margin-top:8px;font-size:13px" id="otp-resend">Resend Code</button>
      </div>
      <div class="info-banner" style="margin:20px 0 0">
        <span style="font-size:20px">💡</span>
        <div style="font-size:12px;color:var(--info)">For this demo, enter any 6 digits to proceed.</div>
      </div>
    </div>`;

  // OTP auto-advance
  const inputs = s.querySelectorAll('.otp-input');
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      if (inp.value && i < inputs.length - 1) inputs[i + 1].focus();
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && i > 0) inputs[i - 1].focus();
    });
  });
  // Pre-fill for demo
  ['1','2','3','4','5','6'].forEach((v,i) => { inputs[i].value = v; });

  s.querySelector('#otp-verify-btn').addEventListener('click', () => {
    const code = Array.from(inputs).map(i=>i.value).join('');
    if (code.length < 6) { App.toast('Please enter all 6 digits'); return; }
    App.toast('✅ Account verified!');
    setTimeout(() => App.login('u1'), 800);
  });
  s.querySelector('#otp-resend').addEventListener('click', () => App.toast('Code resent to ' + (ctx.email || 'your email')));
  return s;
};
