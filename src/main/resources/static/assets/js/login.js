// Login page: real backend auth via /api/auth/login, forgot-password, role routing.
// Depends on: assets/js/session.js, assets/js/api.js

// Redirect if already authenticated (async check against the server session)
async function maybeRedirectIfLoggedIn() {
  if (!window.EcoSnapAPI) return;
  // Restore Bearer token into the API client on page load (if a previous login saved one)
  try {
    const storedToken = localStorage.getItem('ecosnap_token');
    if (storedToken) EcoSnapAPI.setToken(storedToken);
  } catch (e) { /* ignore */ }
  try {
    const me = await EcoSnapAPI.me();
    if (me && me.user) {
      const role = (me.user.role || '').toUpperCase();
      window.location.href = dashboardUrl(role);
    } else {
      clearCachedUser();
    }
  } catch (e) {
    clearCachedUser();
  }
}
maybeRedirectIfLoggedIn();

function clearCachedUser() {
  localStorage.removeItem('ecosnap_user');
  localStorage.removeItem('ecosnap_token');
  sessionStorage.removeItem('ecosnap_user');
  sessionStorage.removeItem('ecosnap_token');
}

function showPendingApproval() {
  var pending = document.getElementById('pendingApproval');
  var error = document.getElementById('loginError');
  if (pending) pending.classList.add('visible');
  if (error) error.classList.remove('visible');
}

function hidePendingApproval() {
  var pending = document.getElementById('pendingApproval');
  if (pending) pending.classList.remove('visible');
}

var urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('registered') === 'pending') showPendingApproval();

// Resolve the dashboard URL for a given role, accounting for pages/ context.
function dashboardUrl(role) {
  const ctx = (window.EcoSnapSession && typeof window.EcoSnapSession.getPathContext === 'function')
    ? window.EcoSnapSession.getPathContext()
    : { root: './', pages: 'pages/' };
  const r = String(role || '').toUpperCase();
  if (r === 'ADMIN') return ctx.pages + 'dashboard-admin.html';
  if (r === 'PHOTOGRAPHER') return ctx.pages + 'dashboard-photographer.html';
  return ctx.pages + 'dashboard-client.html';
}

// Password visibility toggle
function togglePassword() {
  var pw = document.getElementById('password');
  var icon = document.getElementById('pwToggleIcon');
  if (!pw || !icon) return;
  if (pw.type === 'password') {
    pw.type = 'text';
    icon.className = 'ri-eye-line';
  } else {
    pw.type = 'password';
    icon.className = 'ri-eye-off-line';
  }
}

// Switch to Reset Password View
function showResetView() {
  document.getElementById('loginCard').classList.add('hidden');
  document.getElementById('resetCard').classList.remove('hidden');
  document.getElementById('resetSuccess').classList.remove('visible');
  document.getElementById('resetError').classList.remove('visible');
  var resetEmail = document.getElementById('resetEmail');
  if (resetEmail) resetEmail.focus();
}

// Switch back to Login View
function showLoginView() {
  document.getElementById('resetCard').classList.add('hidden');
  document.getElementById('loginCard').classList.remove('hidden');
}

// Reset Password Handler -> /api/auth/forgot-password
async function handleResetPassword(e) {
  e.preventDefault();
  var email = (document.getElementById('resetEmail').value || '').trim();
  var btn = document.getElementById('resetSubmitBtn');
  var success = document.getElementById('resetSuccess');
  var error = document.getElementById('resetError');

  if (!email) {
    if (error) { error.textContent = 'Please enter a valid email address.'; error.classList.add('visible'); }
    return;
  }

  if (error) error.classList.remove('visible');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line spin"></i> SENDING...';
  }

  try {
    await EcoSnapAPI.forgotPassword({ email: email });
    if (btn) {
      btn.innerHTML = '<i class="ri-checkbox-circle-line"></i> SENT!';
      btn.style.backgroundColor = '#10b981';
    }
    if (success) success.classList.add('visible');
    setTimeout(function () {
      if (btn) {
        btn.innerHTML = 'RESET PASSWORD';
        btn.style.backgroundColor = '';
        btn.disabled = false;
      }
    }, 3000);
  } catch (err) {
    if (error) { error.textContent = (err.message || 'Could not send reset link.'); error.classList.add('visible'); }
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'RESET PASSWORD';
    }
  }
}

// Main Login Handler -> /api/auth/login
async function handleLogin(e) {
  e.preventDefault();
  var email = (document.getElementById('email').value || '').trim();
  var password = document.getElementById('password').value || '';
  var btn = document.getElementById('submitBtn');
  var error = document.getElementById('loginError');

  if (!email || !password) {
    if (error) { error.textContent = 'Email and password are required.'; error.classList.add('visible'); }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ri-loader-4-line spin"></i> LOGGING IN...';
  }

  try {
    const res = await EcoSnapAPI.login({ email: email, password: password });
    const user = res && res.user;
    if (user && String(user.status || '').toUpperCase() === 'ACTIVE') {
      const role = (user.role || '').toUpperCase();
      hidePendingApproval();
      if (error) error.classList.remove('visible');
      // Store Bearer token if the server returns one (future-proof; session cookie is still primary auth)
      if (res && res.token && window.EcoSnapAPI) {
        EcoSnapAPI.setToken(res.token);
      }
      // Cache user for UI helpers (no token stored beyond above).
      if (window.EcoSnapSession) {
        const sessionUser = {
          id: user.id,
          fullName: user.fullName || '',
          name: user.fullName || '',
          email: user.email || '',
          role: role,
          phoneNumber: user.phoneNumber || '',
          imageUrl: (user.profile && user.profile.avatarUrl) || ''
        };
        localStorage.setItem('ecosnap_user', JSON.stringify(sessionUser));
        EcoSnapSession.applyNavbarAuth();
        EcoSnapSession.applyToUI(sessionUser);
      }
      if (btn) {
        btn.innerHTML = '<i class="ri-checkbox-circle-line"></i> SUCCESS!';
        btn.style.backgroundColor = '#10b981';
      }
      setTimeout(function () {
        window.location.href = dashboardUrl(role);
      }, 500);
    } else {
      throw new Error('Invalid email or password.');
    }
  } catch (err) {
    if (err && err.status === 403 && /pending approval/i.test(err.message || '')) {
      showPendingApproval();
    } else {
      hidePendingApproval();
      if (error) { error.textContent = (err.message || 'Invalid email or password.'); error.classList.add('visible'); }
    }
    clearCachedUser();
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'LOG IN';
    }
  }
}

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
    if (!href || href.startsWith('javascript') || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return;
    e.preventDefault();
    navigateWithTransition(href);
  });
})();