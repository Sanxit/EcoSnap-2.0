/**
 * EcoSnap — Shared Session & Navbar Auth Helper
 * Handles client-side session state in localStorage, navbar avatar swapping,
 * profile UI population, and role-based routing.
 */

(function () {
  'use strict';

  // Inject user dropdown & avatar styles if not already present
  function injectSessionStyles() {
    if (document.getElementById('ecosnap-session-styles')) return;
    const style = document.createElement('style');
    style.id = 'ecosnap-session-styles';
    style.textContent = `
      .navbar-actions {
        position: relative;
      }
      .topbar-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: var(--primary-color, #2E7D32);
        color: #ffffff;
        font-weight: 700;
        font-size: 14px;
        letter-spacing: 0.5px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;
        flex-shrink: 0;
        transition: transform var(--transition-fast, 0.15s ease), box-shadow var(--transition-fast, 0.15s ease);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        background-size: cover;
        background-position: center;
      }
      .topbar-avatar:hover {
        box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.28);
        transform: translateY(-1px);
      }
      .user-dropdown {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        min-width: 240px;
        background: #ffffff;
        border: 1px solid var(--gray-200, #e5e7eb);
        border-radius: var(--radius-md, 10px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        padding: 8px;
        z-index: 1000;
        display: none;
        flex-direction: column;
        gap: 2px;
        animation: userDropdownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        text-align: left;
        box-sizing: border-box;
      }
      .user-dropdown.open {
        display: flex !important;
      }
      @keyframes userDropdownIn {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .user-dropdown-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border-bottom: 1px solid var(--gray-200, #e5e7eb);
        margin-bottom: 4px;
      }
      .user-dropdown-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--primary-color, #2E7D32);
        color: #ffffff;
        font-weight: 700;
        font-size: 14px;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background-size: cover;
        background-position: center;
      }
      .user-dropdown-name {
        font-weight: 700;
        font-size: 0.9rem;
        color: var(--primary-black, #111827);
        line-height: 1.25;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 170px;
      }
      .user-dropdown-email {
        font-size: 0.78rem;
        color: var(--gray-500, #6b7280);
        line-height: 1.25;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 170px;
      }
      .user-dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        font-size: 0.85rem;
        font-weight: 500;
        border-radius: var(--radius-sm, 6px);
        color: var(--gray-700, #374151);
        cursor: pointer;
        text-decoration: none;
        border: none;
        background: transparent;
        width: 100%;
        text-align: left;
        font-family: var(--font-primary, 'Red Rose', sans-serif);
        transition: background-color var(--transition-fast, 0.15s ease), color var(--transition-fast, 0.15s ease);
        box-sizing: border-box;
      }
      .user-dropdown-item i {
        font-size: 1.1rem;
        color: inherit;
      }
      .user-dropdown-item:hover {
        background: var(--gray-100, #f3f4f6);
        color: var(--primary-color, #2E7D32);
      }
      .user-dropdown-item.danger {
        color: var(--error, #dc2626);
      }
      .user-dropdown-item.danger:hover {
        background: #fee2e2;
        color: #b91c1c;
      }
      @media (max-width: 1024px) {
        .navbar-actions.auth-active {
          display: flex !important;
          align-items: center;
        }
      }
      @media (max-width: 768px) {
        .navbar-actions.auth-active {
          display: flex !important;
        }
        .user-dropdown {
          position: fixed !important;
          left: 12px !important;
          right: 12px !important;
          top: 64px !important;
          width: auto !important;
          min-width: 0 !important;
          max-width: calc(100vw - 24px) !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Detect relative paths based on current page location
  function getPathContext() {
    const p = window.location.pathname.replace(/\\/g, '/');
    const isInPages = p.includes('/pages/') || (!p.includes('/') && window.location.href.includes('/pages/'));
    return {
      root: isInPages ? '../' : './',
      pages: isInPages ? '' : 'pages/'
    };
  }

  const EcoSnapSession = {
    /**
     * Retrieves current logged in user from localStorage (fallback to sessionStorage).
     * Normalizes role to UPPERCASE: ADMIN | CUSTOMER | PHOTOGRAPHER
     * @returns {Object|null}
     */
    getUser: function () {
      try {
        const raw = localStorage.getItem('ecosnap_user') || sessionStorage.getItem('ecosnap_user');
        if (!raw) return null;
        const user = JSON.parse(raw);
        if (!user || typeof user !== 'object') return null;

        let role = (user.role || '').toUpperCase();
        if (role === 'CLIENT') role = 'CUSTOMER';
        user.role = role;

        user.fullName = user.fullName || user.name || 'User';
        user.name = user.fullName;
        user.initials = user.initials || EcoSnapSession.initials(user.fullName);
        user.imageUrl = user.imageUrl || '';

        return user;
      } catch (e) {
        return null;
      }
    },

    getPathContext: function () {
      return getPathContext();
    },

/**
   * Retrieves authentication token from localStorage (legacy fallback only).
   * The real session is cookie-based; this exists only for backwards compat.
   * @returns {string}
   */
    getToken: function () {
      return localStorage.getItem('ecosnap_token') || '';
    },

    /**
     * Generates initials from full name: first letters of first two words, uppercase.
     * @param {string} name
     * @returns {string}
     */
    initials: function (name) {
      if (!name || typeof name !== 'string') return 'ES';
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return 'ES';
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
    },

    /**
     * Returns true if user session exists
     * @returns {boolean}
     */
    isLoggedIn: function () {
      return Boolean(EcoSnapSession.getUser());
    },

    /**
     * Clears all session storage and redirects to index.html.
     * Also fires a best-effort same-origin logout so the server invalidates the session.
     */
    logout: function () {
      const ctx = getPathContext();
      localStorage.removeItem('ecosnap_user');
      localStorage.removeItem('ecosnap_token');
      sessionStorage.removeItem('ecosnap_user');
      sessionStorage.removeItem('ecosnap_token');
      if (window.EcoSnapAPI) {
        EcoSnapAPI.logout().finally(function () {
          window.location.href = ctx.root + 'index.html';
        });
      } else {
        window.location.href = ctx.root + 'index.html';
      }
    },

    /**
     * Guards dashboard routes.
     * If not logged in -> redirects to login.html
     * If logged in with wrong role -> redirects to correct dashboard for that role.
     * @param {Array<string>} [allowedRoles]
     * @returns {Object|null}
     */
    requireAuth: async function (allowedRoles) {
      const ctx = getPathContext();
      const loginUrl = ctx.pages ? ctx.pages + 'login.html' : 'login.html';
      const user = await EcoSnapSession.refreshUser();

      if (!user) {
        window.location.href = loginUrl;
        return null;
      }

      const roleDashboards = {
        ADMIN: ctx.pages ? ctx.pages + 'dashboard-admin.html' : 'dashboard-admin.html',
        CUSTOMER: ctx.pages ? ctx.pages + 'dashboard-client.html' : 'dashboard-client.html',
        PHOTOGRAPHER: ctx.pages ? ctx.pages + 'dashboard-photographer.html' : 'dashboard-photographer.html'
      };

      if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
        const normalizedAllowed = allowedRoles.map(function (r) {
          const u = String(r).toUpperCase();
          return u === 'CLIENT' ? 'CUSTOMER' : u;
        });
        if (!normalizedAllowed.includes(user.role)) {
          window.location.href = roleDashboards[user.role] || loginUrl;
          return null;
        }
      }

      return user;
    },

    /**
     * Replaces public navbar login/register buttons with user avatar + dropdown menu
     */
    applyNavbarAuth: function () {
      injectSessionStyles();

      const user = EcoSnapSession.getUser();
      const navActions = document.querySelector('.navbar-actions');
      if (!navActions) return;

      if (!user) {
        // Not logged in -> keep Login / Get Started buttons as they are
        navActions.classList.remove('auth-active');
        return;
      }

      navActions.classList.add('auth-active');
      navActions.style.position = 'relative';

      const ctx = getPathContext();
      let dashUrl = ctx.pages + 'dashboard-client.html';
      let profileUrl = ctx.pages + 'dashboard-client.html#profile';

      if (user.role === 'ADMIN') {
        dashUrl = ctx.pages + 'dashboard-admin.html';
        profileUrl = ctx.pages + 'dashboard-admin.html#settings';
      } else if (user.role === 'PHOTOGRAPHER') {
        dashUrl = ctx.pages + 'dashboard-photographer.html';
        profileUrl = ctx.pages + 'dashboard-photographer.html#profile';
      }

      const initials = EcoSnapSession.initials(user.fullName);

      navActions.innerHTML = `
        <div class="topbar-avatar" id="navUserAvatar" onclick="toggleUserMenu(event)" title="${user.fullName}"></div>
        <div class="user-dropdown" id="userDropdown">
          <div class="user-dropdown-header">
            <div class="user-dropdown-avatar" id="dropdownAvatar"></div>
            <div>
              <div class="user-dropdown-name" id="dropdownName"></div>
              <div class="user-dropdown-email" id="dropdownEmail"></div>
            </div>
          </div>
          <a href="${dashUrl}" id="dropdownDashboardLink" class="user-dropdown-item">
            <i class="ri-dashboard-line"></i> Dashboard
          </a>
          <a href="${profileUrl}" id="dropdownProfileLink" class="user-dropdown-item">
            <i class="ri-user-line"></i> My Profile
          </a>
          <button type="button" class="user-dropdown-item danger" onclick="EcoSnapSession.logout()">
            <i class="ri-logout-box-r-line"></i> Log Out
          </button>
        </div>
      `;

      const navAvatar = document.getElementById('navUserAvatar');
      const dropAvatar = document.getElementById('dropdownAvatar');
      const dropName = document.getElementById('dropdownName');
      const dropEmail = document.getElementById('dropdownEmail');

      if (dropName) dropName.textContent = user.fullName;
      if (dropEmail) dropEmail.textContent = user.email || '';

      [navAvatar, dropAvatar].forEach(function (el) {
        if (!el) return;
        if (user.imageUrl) {
          el.style.backgroundImage = `url("${user.imageUrl}")`;
          el.textContent = '';
        } else {
          el.style.backgroundImage = 'none';
          el.textContent = initials;
        }
      });

      // Handle mobile nav CTA if present
      const mobileCta = document.querySelector('.mobile-nav .mobile-nav-cta');
      if (mobileCta) {
        mobileCta.innerHTML = `
          <a href="${dashUrl}" class="btn btn-outline" style="justify-content: center">
            <i class="ri-dashboard-line"></i> Dashboard
          </a>
          <button type="button" class="btn btn-primary" style="justify-content: center" onclick="EcoSnapSession.logout()">
            <i class="ri-logout-box-r-line"></i> Log Out
          </button>
        `;
      }
    },

    /**
     * Fills sidebar & topbar user details across dashboards:
     * #sidebarAvatar, #sidebarName, #sidebarEmail, #topbarAvatar, #profileInitials, #profileName, #profileEmail
     * @param {Object} [user]
     */
    applyToUI: function (user) {
      if (!user) user = EcoSnapSession.getUser();
      if (!user) return;

      const initials = EcoSnapSession.initials(user.fullName);

      function setAvatar(el) {
        if (!el) return;
        if (user.imageUrl) {
          el.style.backgroundImage = `url("${user.imageUrl}")`;
          el.style.backgroundSize = 'cover';
          el.style.backgroundPosition = 'center';
          el.textContent = '';
        } else {
          el.style.backgroundImage = 'none';
          el.textContent = initials;
        }
      }

      setAvatar(document.getElementById('sidebarAvatar'));
      setAvatar(document.getElementById('topbarAvatar'));
      setAvatar(document.getElementById('profileInitials'));

      const sName = document.getElementById('sidebarName');
      if (sName) sName.textContent = user.fullName;

      const sEmail = document.getElementById('sidebarEmail');
      if (sEmail) sEmail.textContent = user.email || '';

      const pName = document.getElementById('profileName');
      if (pName) pName.textContent = user.fullName;

      const pEmail = document.getElementById('profileEmail');
      if (pEmail) pEmail.textContent = user.email || '';

      const topbarSub = document.getElementById('topbarSub');
      if (topbarSub) {
        const firstName = (user.fullName || '').split(' ')[0] || 'User';
        const prefix = user.role === 'PHOTOGRAPHER' ? 'Good morning' : 'Welcome back';
        topbarSub.textContent = `${prefix}, ${firstName}`;
      }
    },

    /**
     * Refreshes the cached user from the server session (/api/auth/me) and updates
     * the in-memory user object used by applyToUI / applyNavbarAuth.
     * Returns the refreshed user or null if not authenticated.
     */
    refreshUser: async function () {
      if (!window.EcoSnapAPI) return EcoSnapSession.getUser();
      try {
        const me = await EcoSnapAPI.me();
        if (me && me.user) {
          const u = me.user;
          const sessionUser = {
            id: u.id,
            fullName: u.fullName || '',
            name: u.fullName || '',
            email: u.email || '',
            role: (u.role || '').toUpperCase(),
            phoneNumber: u.phoneNumber || '',
            imageUrl: (u.profile && u.profile.avatarUrl) || '',
            profile: u.profile || null
          };
          if (sessionUser.role === 'CLIENT') sessionUser.role = 'CUSTOMER';
          localStorage.setItem('ecosnap_user', JSON.stringify(sessionUser));
          // Capture Bearer token if the server returns one in the /me response
          if (me.token && window.EcoSnapAPI) {
            EcoSnapAPI.setToken(me.token);
          }
          return sessionUser;
        }
        // Not authenticated -> clear any stale local user
        localStorage.removeItem('ecosnap_user');
        EcoSnapAPI.clearToken && EcoSnapAPI.clearToken();
        return null;
      } catch (e) {
        localStorage.removeItem('ecosnap_user');
        localStorage.removeItem('ecosnap_token');
        sessionStorage.removeItem('ecosnap_user');
        sessionStorage.removeItem('ecosnap_token');
        if (window.EcoSnapAPI && EcoSnapAPI.clearToken) EcoSnapAPI.clearToken();
        return null;
      }
    }
  };

  // Dropdown toggle handler
  window.toggleUserMenu = function (e) {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const dd = document.getElementById('userDropdown');
    if (dd) {
      dd.classList.toggle('open');
    }
  };

  // Close dropdown on click outside
  document.addEventListener('click', function (e) {
    const dd = document.getElementById('userDropdown');
    const av = document.getElementById('navUserAvatar');
    if (dd && dd.classList.contains('open')) {
      if (!dd.contains(e.target) && (!av || !av.contains(e.target))) {
        dd.classList.remove('open');
      }
    }
  });

  // Close dropdown on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const dd = document.getElementById('userDropdown');
      if (dd && dd.classList.contains('open')) {
        dd.classList.remove('open');
      }
    }
  });

  // Auto-apply on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      EcoSnapSession.applyNavbarAuth();
    });
  } else {
    EcoSnapSession.applyNavbarAuth();
  }

  // Export globally
  window.EcoSnapSession = EcoSnapSession;

  // Restore Bearer token into EcoSnapAPI if it was loaded before this script.
  // (api.js also does this on its own init — this is a belt-and-suspenders guard.)
  if (window.EcoSnapAPI) {
    try {
      const t = localStorage.getItem('ecosnap_token');
      if (t) EcoSnapAPI.setToken(t);
    } catch (e) { /* ignore */ }
  }
})();
