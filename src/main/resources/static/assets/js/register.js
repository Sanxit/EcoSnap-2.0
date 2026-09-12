// register.js — dual-form architecture (client / photographer)
// Depends on: session.js (DASHBOARD_MAP, loginUser)

// ─── Password visibility toggle ──────────────────────────────────────────────
// fieldId and iconId are passed explicitly so each form's toggles are independent.
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

// ─── Google Sign-Up Simulation ────────────────────────────────────────────────
function handleGoogleSignup(role) {
  role = role || 'client';
  var btn = role === 'photographer'
    ? document.getElementById('googleSignupBtnPhoto')
    : document.getElementById('googleSignupBtnClient');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line spin"></i> Connecting Google...';
  }
  setTimeout(function () {
    var mockEmail = role === 'photographer' ? 'photo@ecosnap.com' : 'client@ecosnap.com';
    var mockPw = role === 'photographer' ? 'photo123' : 'client123';
    var result = loginUser(mockEmail, mockPw);
    if (result && result.success) {
      window.location.href = DASHBOARD_MAP[result.user.role];
    } else {
      window.location.href = role === 'photographer'
        ? 'dashboard-photographer.html'
        : 'dashboard-client.html';
    }
  }, 600);
}

// ─── Main Signup Handler ──────────────────────────────────────────────────────
// role is passed directly from the form's onsubmit="handleSignup(event, 'client')"
function handleSignup(e, role) {
  e.preventDefault();
  role = role || 'client';

  var isPhotographer = role === 'photographer';
  var prefix = isPhotographer ? 'photo' : 'client';

  // Field references
  var fullName    = (document.getElementById(prefix + 'FullName')   || {}).value || '';
  var email       = (document.getElementById(prefix + 'Email')      || {}).value || '';
  var password    = (document.getElementById(prefix + 'Password')   || {}).value || '';
  var confirmPw   = (document.getElementById(prefix + 'ConfirmPassword') || {}).value || '';
  var submitBtn   = document.getElementById(isPhotographer ? 'photoSubmitBtn' : 'clientSubmitBtn');

  // Client-side validation
  fullName = fullName.trim();
  email    = email.trim();

  if (!fullName) {
    alert('Please enter your full name.');
    return;
  }
  if (!email) {
    alert('Please enter your email address.');
    return;
  }
  if (password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }
  if (password !== confirmPw) {
    alert('Passwords do not match. Please try again.');
    var confirmField = document.getElementById(prefix + 'ConfirmPassword');
    if (confirmField) { confirmField.value = ''; confirmField.focus(); }
    return;
  }

  // Photographer-specific validation
  var extraFields = {};
  if (isPhotographer) {
    var specialization  = (document.getElementById('specialization')  || {}).value || '';
    var experienceYears = (document.getElementById('experienceYears') || {}).value || '';
    var hourlyRate      = (document.getElementById('hourlyRate')      || {}).value || '';
    var location        = (document.getElementById('location')        || {}).value || '';

    if (!specialization.trim()) {
      alert('Please enter your specialization.');
      return;
    }
    if (!experienceYears) {
      alert('Please enter your years of experience.');
      return;
    }
    if (!hourlyRate) {
      alert('Please enter your hourly rate.');
      return;
    }
    if (!location.trim()) {
      alert('Please enter your location.');
      return;
    }
    extraFields = {
      specialization: specialization.trim(),
      experienceYears: Number(experienceYears),
      hourlyRate: Number(hourlyRate),
      location: location.trim()
    };
  }

  // Loading state
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ri-loader-4-line spin"></i> Creating Account...';
  }

  // Build payload / session
  var internalRole = role.toUpperCase() === 'CLIENT' ? 'CUSTOMER' : role.toUpperCase();
  var newUser = Object.assign({
    id: 'user-' + Date.now(),
    fullName: fullName || 'Demo User',
    email: email || 'user@ecosnap.com',
    role: internalRole,
    imageUrl: ''
  }, extraFields);

  var token = 'reg-token-' + Date.now();
  localStorage.setItem('ecosnap_token', token);
  localStorage.setItem('ecosnap_user', JSON.stringify(newUser));
  sessionStorage.setItem('ecosnap_token', token);
  sessionStorage.setItem('ecosnap_user', JSON.stringify(newUser));

  setTimeout(function () {
    window.location.href = DASHBOARD_MAP[internalRole] || '../index.html';
  }, 500);
}

// ─── Role Toggle ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  var typeBtns     = document.querySelectorAll('.signup-role-btn, .type-btn');
  var formClient   = document.getElementById('formClient');
  var formPhoto    = document.getElementById('formPhotographer');

  function setRole(role) {
    var isPhotographer = role === 'photographer';

    // Update toggle button states
    typeBtns.forEach(function (btn) {
      var matches = btn.getAttribute('data-type') === role;
      btn.classList.toggle('active', matches);
      btn.setAttribute('aria-selected', matches ? 'true' : 'false');
    });

    // Swap visible form — use flex to restore layout since signup-form is column flex
    if (formClient) {
      formClient.style.display = isPhotographer ? 'none' : 'flex';
    }
    if (formPhoto) {
      formPhoto.style.display = isPhotographer ? 'flex' : 'none';
    }
  }

  typeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setRole(this.getAttribute('data-type'));
    });
  });

  // Respect ?role= URL parameter
  var urlParams = new URLSearchParams(window.location.search);
  var initialRole = urlParams.get('role');
  if (initialRole === 'photographer' || initialRole === 'client') {
    setRole(initialRole);
  }
});

// ─── Page transition on navigation ───────────────────────────────────────────
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
