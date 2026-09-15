// register.js — dual-form architecture (client / photographer), real backend registration.
// Depends on: session.js, api.js

// Password visibility toggle
function togglePassword(fieldId, iconId) {
  var pw = document.getElementById(fieldId);
  var icon = document.getElementById(iconId);
  if (!pw || !icon) return;
  if (pw.type === 'password') {
    pw.type = 'text';
    icon.className = 'ri-eye-line';
  } else {
    pw.type = 'password';
    icon.className = 'ri-eye-off-line';
  }
}

// Main Signup Handler -> /api/auth/register
async function handleSignup(e, role) {
  e.preventDefault();
  role = role || 'client';

  var isPhotographer = role === 'photographer';
  var prefix = isPhotographer ? 'photo' : 'client';

  var fullName    = (document.getElementById(prefix + 'FullName')   || {}).value || '';
  var email       = (document.getElementById(prefix + 'Email')      || {}).value || '';
  var password    = (document.getElementById(prefix + 'Password')   || {}).value || '';
  var confirmPw   = (document.getElementById(prefix + 'ConfirmPassword') || {}).value || '';
  var submitBtn   = document.getElementById(isPhotographer ? 'photoSubmitBtn' : 'clientSubmitBtn');

  fullName = fullName.trim();
  email    = email.trim();

  if (!fullName) { alert('Please enter your full name.'); return; }
  if (!email) { alert('Please enter your email address.'); return; }
  if (password.length < 8) { alert('Password must be at least 8 characters.'); return; }
  if (password !== confirmPw) {
    alert('Passwords do not match. Please try again.');
    var confirmField = document.getElementById(prefix + 'ConfirmPassword');
    if (confirmField) { confirmField.value = ''; confirmField.focus(); }
    return;
  }

  var payload = {
    fullName: fullName,
    email: email,
    password: password,
    phoneNumber: '',
    role: isPhotographer ? 'PHOTOGRAPHER' : 'CUSTOMER'
  };

  if (isPhotographer) {
    var specialization  = (document.getElementById('specialization')  || {}).value || '';
    var experienceYears = (document.getElementById('experienceYears') || {}).value || '';
    var hourlyRate      = (document.getElementById('hourlyRate')      || {}).value || '';
    var location        = (document.getElementById('location')        || {}).value || '';

    if (!specialization.trim()) { alert('Please enter your specialization.'); return; }
    if (!experienceYears) { alert('Please enter your years of experience.'); return; }
    if (!hourlyRate) { alert('Please enter your hourly rate.'); return; }
    if (!location.trim()) { alert('Please enter your location.'); return; }

    payload.phoneNumber = (document.getElementById(prefix + 'Phone') || {}).value || '';
    payload.profile = {
      bio: (document.getElementById('photoBio') || {}).value || '',
      specialization: specialization.trim(),
      location: location.trim(),
      experienceYears: Number(experienceYears),
      hourlyRate: Number(hourlyRate),
      avatarUrl: '',
      coverImageUrl: '',
      responseHours: null
    };
  } else {
    payload.phoneNumber = (document.getElementById(prefix + 'Phone') || {}).value || '';
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ri-loader-4-line spin"></i> Creating Account...';
  }

  try {
    const res = await EcoSnapAPI.register(payload);
    if (!res || !res.user) throw new Error('Registration failed.');

    localStorage.removeItem('ecosnap_user');
    localStorage.removeItem('ecosnap_token');
    sessionStorage.removeItem('ecosnap_user');
    sessionStorage.removeItem('ecosnap_token');

    const ctx = (window.EcoSnapSession && typeof window.EcoSnapSession.getPathContext === 'function')
      ? window.EcoSnapSession.getPathContext()
      : { root: './', pages: 'pages/' };
    window.location.href = (ctx.pages || '') + 'login.html?registered=pending';
  } catch (err) {
    alert(err.message || 'Could not create your account. Please try again.');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Create Account';
    }
  }
}

// Role Toggle
document.addEventListener('DOMContentLoaded', function () {
  var typeBtns     = document.querySelectorAll('.signup-role-btn, .type-btn');
  var formClient   = document.getElementById('formClient');
  var formPhoto    = document.getElementById('formPhotographer');

  function setRole(role) {
    var isPhotographer = role === 'photographer';

    typeBtns.forEach(function (btn) {
      var matches = btn.getAttribute('data-type') === role;
      btn.classList.toggle('active', matches);
      btn.setAttribute('aria-selected', matches ? 'true' : 'false');
    });

    if (formClient) formClient.style.display = isPhotographer ? 'none' : 'flex';
    if (formPhoto)  formPhoto.style.display  = isPhotographer ? 'flex' : 'none';
  }

  typeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setRole(this.getAttribute('data-type'));
    });
  });

  var urlParams = new URLSearchParams(window.location.search);
  var initialRole = urlParams.get('role');
  if (initialRole === 'photographer' || initialRole === 'client') {
    setRole(initialRole);
  }
});

// Page transition on navigation
(function () {
  var DELAY = 280;

  function navigateWithTransition(href) {
    document.body.classList.add('page-exit');
    setTimeout(function () {
      window.location.href = href;
    }, DELAY);
  }

  document.addEventListener('click', function (e) {
    var anchor = e.target.closest('a[href]');
    if (!anchor) return;
    var href = anchor.getAttribute('href');
    if (!href || href.startsWith('javascript') || href.startsWith('#') ||
        href.startsWith('http') || href.startsWith('mailto')) return;
    e.preventDefault();
    navigateWithTransition(href);
  });
})();