// Centralized UI utilities — modal, toast, confirm, sidebar helpers.
// Loaded on every page after session.js.

(function () {
  'use strict';

  // ---- Toast ----
  window.showToast = function (msg, type) {
    type = type || 'success';
    var c = document.getElementById('toastContainer');
    if (!c) return;
    var t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = '<i class="ri-' + (type === 'success' ? 'check-circle' : 'error-warning') + '-line"></i> ' + msg;
    c.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  };

  // ---- Modal ----
  window.openModal = function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('open');
  };

  window.closeModal = function (id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('open');
  };

  // ---- Confirm dialog ----
  window.confirmAction = function (title, msg, cb) {
    var titleEl = document.getElementById('confirmTitle');
    var msgEl = document.getElementById('confirmMsg');
    var btn = document.getElementById('confirmOkBtn');
    if (!titleEl || !msgEl || !btn) { if (cb) cb(); return; }
    titleEl.textContent = title;
    msgEl.textContent = msg;
    btn.onclick = function () { closeModal('modalConfirm'); cb(); };
    openModal('modalConfirm');
  };

  // ---- Sidebar (dashboard pages) ----
  window.toggleSidebar = function () {
    var sb = document.getElementById('sidebar');
    var ov = document.getElementById('sidebarOverlay');
    if (sb) sb.classList.toggle('open');
    if (ov) ov.classList.toggle('open');
  };

  window.closeSidebar = function () {
    var sb = document.getElementById('sidebar');
    var ov = document.getElementById('sidebarOverlay');
    if (sb) sb.classList.remove('open');
    if (ov) ov.classList.remove('open');
  };

  // Close modals on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(function (m) {
        m.classList.remove('open');
      });
    }
  });
})();
