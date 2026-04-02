const I18N_LANG_KEY = 'bhos.lang';

const I18N = {
  en: {
    appName: 'BHOS Lost & Found',
    bhos: 'Baku Higher Oil School',
    getStarted: 'Get Started',
    alreadyAccount: 'I already have an account',
    welcomeBack: 'Welcome back',
    signInSubtitle: 'Sign in to your campus account',
    emailOrPhone: 'Campus Email or Phone',
    password: 'Password',
    signIn: 'Sign In',
    createAccount: 'Create account',
    joinCommunity: 'Join the campus community',
    fullName: 'Full Name',
    campusEmail: 'Campus Email',
    phoneNumber: 'Phone Number',
    role: 'Role',
    facultyProgram: 'Faculty / Program',
    select: 'Select...',
    registerCta: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    signUp: 'Sign up',
    homeSearchPlaceholder: 'Search items, locations...',
    language: 'Language',
    english: 'English',
    azeri: 'Azerbaijani',
    logout: 'Log Out',
    account: 'Account',
    myPosts: 'My Posts',
    myClaims: 'My Claims'
  },
  az: {
    appName: 'BHOS İtirilən & Tapılan',
    bhos: 'Bakı Ali Neft Məktəbi',
    getStarted: 'Başla',
    alreadyAccount: 'Artıq hesabım var',
    welcomeBack: 'Xoş gəlmisiniz',
    signInSubtitle: 'Kampus hesabınıza daxil olun',
    emailOrPhone: 'Kampus e-poçtu və ya telefon',
    password: 'Şifrə',
    signIn: 'Daxil ol',
    createAccount: 'Hesab yaradın',
    joinCommunity: 'Kampus icmasına qoşulun',
    fullName: 'Ad Soyad',
    campusEmail: 'Kampus e-poçtu',
    phoneNumber: 'Telefon nömrəsi',
    role: 'Rol',
    facultyProgram: 'Fakültə / Proqram',
    select: 'Seçin...',
    registerCta: 'Hesab yarat',
    alreadyHaveAccount: 'Hesabınız var?',
    signUp: 'Qeydiyyat',
    homeSearchPlaceholder: 'Əşyalar, məkanlar üzrə axtar...',
    language: 'Dil',
    english: 'İngiliscə',
    azeri: 'Azərbaycan dili',
    logout: 'Çıxış',
    account: 'Hesab',
    myPosts: 'Paylaşımlarım',
    myClaims: 'Tələblərim'
  }
};

function getLang() {
  try {
    const saved = localStorage.getItem(I18N_LANG_KEY);
    if (saved === 'az' || saved === 'en') return saved;
  } catch {}
  return 'en';
}

function setLang(lang) {
  const next = lang === 'az' ? 'az' : 'en';
  try { localStorage.setItem(I18N_LANG_KEY, next); } catch {}
  window.Lang.current = next;
  // Rerender current screen without pushing history
  if (window.App?.currentScreen) window.App.navigate(window.App.currentScreen, window.App.screenContext || {}, false);
}

function t(key) {
  const lang = window.Lang?.current || getLang();
  return I18N[lang]?.[key] ?? I18N.en[key] ?? key;
}

window.Lang = {
  current: getLang(),
  set: setLang,
  t
};

