// Login page: form handler, demo drawer, password toggle, reset view, page transitions.
// Depends on: assets/js/session.js, js/mock-data.js (loaded before this file).

// Redirect if already authenticated
var existingUser = getCurrentUser();
if (existingUser) {
  window.location.href = DASHBOARD_MAP[existingUser.role];
}

// Toggle collapsible demo accounts drawer
function toggleDemoDrawer() {
  var helper = document.getElementById('demoHelper');
  if (helper) helper.classList.toggle('open');
}

// Google Sign-In Simulation with Mock Data
function handleGoogleLogin() {
  var result = loginUser('client@ecosnap.com', 'client123');
  if (result.success) {
    window.location.href = DASHBOARD_MAP[result.user.role];
  }
}

// Apply Demo Credentials to Login Form
function applyDemo(email, password) {
  var emailInput = document.getElementById('email');
  var pwInput = document.getElementById('password');
  emailInput.value = email;
  pwInput.value = password;

  var error = document.getElementById('loginError');
  if (error) error.classList.remove('visible');

  emailInput.focus();
}

// Password visibility toggle
function togglePassword() {
  var pw = document.getElementById('password');
  var icon = document.getElementById('pwToggleIcon');
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
  document.getElementById('resetEmail').focus();
}

// Switch back to Login View
function showLoginView() {
  document.getElementById('resetCard').classList.add('hidden');
  document.getElementById('loginCard').classList.remove('hidden');
}

// Reset Password Handler
function handleResetPassword(e) {
  e.preventDefault();
  var email = document.getElementById('resetEmail').value.trim();
  var btn = document.getElementById('resetSubmitBtn');
  var success = document.getElementById('resetSuccess');
  var error = document.getElementById('resetError');

  if (!email) {
    if (error) error.classList.add('visible');
    return;
  }

  if (error) error.classList.remove('visible');
  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line spin"></i> SENDING...';

  setTimeout(function () {
    btn.disabled = false;
    btn.innerHTML = '<i class="ri-checkbox-circle-line"></i> SENT!';
    btn.style.backgroundColor = '#10b981';
    if (success) success.classList.add('visible');

    setTimeout(function () {
      btn.innerHTML = 'RESET PASSWORD';
      btn.style.backgroundColor = '';
    }, 3000);
  }, 700);
}

// Main Login Handler
function handleLogin(e) {
  e.preventDefault();
  var email = document.getElementById('email').value.trim();
  var password = document.getElementById('password').value;
  var btn = document.getElementById('submitBtn');
  var error = document.getElementById('loginError');

  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line spin"></i> LOGGING IN...';

  setTimeout(function () {
    var result = loginUser(email, password);
    if (result.success) {
      btn.innerHTML = '<i class="ri-checkbox-circle-line"></i> SUCCESS!';
      btn.style.backgroundColor = '#10b981';
      setTimeout(function () {
        window.location.href = DASHBOARD_MAP[result.user.role];
      }, 500);
    } else {
      if (error) error.classList.add('visible');
      btn.disabled = false;
      btn.innerHTML = 'LOG IN';
    }
  }, 700);
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
