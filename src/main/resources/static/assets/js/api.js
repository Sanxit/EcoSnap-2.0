// EcoSnap real backend API helpers (same-origin, cookie/session auth + CSRF)
// Optional: if a JWT token is stored (ecosnap_token) it is also sent as
// Authorization: Bearer <token> — harmless when the backend ignores it.
(function () {
  'use strict';

  const API = {
    BASE: '/api',

    // Cached CSRF token from /api/auth/csrf (XSRF-TOKEN cookie, read by header X-XSRF-TOKEN)
    _csrfToken: null,

    // Optional JWT – stored by login.js when the server returns one.
    _bearerToken: null,

    setToken(token) {
      if (token) {
        this._bearerToken = token;
        try { localStorage.setItem('ecosnap_token', token); } catch (e) { /* ignore */ }
      }
    },

    getToken() {
      if (this._bearerToken) return this._bearerToken;
      try {
        const t = localStorage.getItem('ecosnap_token');
        if (t) { this._bearerToken = t; }
        return this._bearerToken;
      } catch (e) { return null; }
    },

    clearToken() {
      this._bearerToken = null;
      try { localStorage.removeItem('ecosnap_token'); } catch (e) { /* ignore */ }
    },

    setCsrf(token) {
      if (token) this._csrfToken = token;
    },

    async fetchCsrf() {
      try {
        const r = await fetch(this.BASE + '/auth/csrf', { credentials: 'include' });
        if (r.ok) {
          const j = await r.json();
          if (j && j.token) this._csrfToken = j.token;
        }
      } catch (e) { /* ignore */ }
      return this._csrfToken;
    },

    async request(path, options = {}) {
      const method = (options.method || 'GET').toUpperCase();
      const url = this.BASE + path;

      const headers = Object.assign(
        { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        options.headers || {}
      );

      // Attach CSRF on every mutating request (keeps Spring Security happy)
      if (this._csrfToken && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
        headers['X-XSRF-TOKEN'] = this._csrfToken;
      }

      // Attach Bearer token if we have one (optional — doesn't break cookie auth)
      const tok = this.getToken();
      if (tok) {
        headers['Authorization'] = 'Bearer ' + tok;
      }

      const opts = Object.assign({ credentials: 'include' }, options, { method, headers });

      const res = await fetch(url, opts);
      const text = await res.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }

      if (!res.ok) {
        // ── 4xx / 5xx debug log ──────────────────────────────────────────
        const payload = opts.body ? (() => { try { return JSON.parse(opts.body); } catch(e) { return opts.body; } })() : undefined;
        console.error(
          `[EcoSnap API] ${method} ${url} → ${res.status}`,
          { status: res.status, body: data, payload }
        );
        // ────────────────────────────────────────────────────────────────
        const err = new Error((data && (data.message || data.error)) || ('HTTP ' + res.status));
        err.status = res.status;
        err.body = data;
        err.endpoint = url;
        err.payload = payload;
        throw err;
      }

      return data;
    },

    /**
     * Unwrap standard API envelope:  { data: { data: ... } }  →  inner payload.
     * Falls back gracefully if the server returns a plain object.
     * For paginated responses the content array lives at res.data.data.content.
     */
    unwrap(res) {
      if (res == null) return res;
      // Wrapped:  { data: { data: [...] } }
      if (res.data && res.data.data !== undefined) return res.data.data;
      // Single-level:  { data: [...] }
      if (res.data !== undefined) return res.data;
      // Plain response (current backend shape)
      return res;
    },

    unwrapList(res) {
      const inner = this.unwrap(res);
      if (Array.isArray(inner)) return inner;
      // Paginated: { content: [...], ... }
      if (inner && Array.isArray(inner.content)) return inner.content;
      return [];
    },

    get(path, params) {
      let url = path;
      if (params) {
        const sp = new URLSearchParams();
        Object.keys(params).forEach(k => {
          const v = params[k];
          if (v !== undefined && v !== null && v !== '') sp.append(k, v);
        });
        const qs = sp.toString();
        if (qs) url += (path.indexOf('?') >= 0 ? '&' : '?') + qs;
      }
      return this.request(url, { method: 'GET' });
    },

    post(path, body) {
      return this.request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
    },
    put(path, body) {
      return this.request(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
    },
    patch(path, body) {
      return this.request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
    },
    del(path) {
      return this.request(path, { method: 'DELETE' });
    },

    // ---------- Auth ----------
    async register(data) { return this.post('/auth/register', data); },
    async login(data) { return this.post('/auth/login', data); },
    async logout() {
      try { await this.post('/auth/logout'); } catch (e) {}
      finally {
        this._csrfToken = null;
        this.clearToken();
      }
    },
    async me() { return this.get('/auth/me'); },
    async changePassword(data) { return this.post('/auth/change-password', data); },
    async forgotPassword(data) { return this.post('/auth/forgot-password', data); },
    async resetPassword(data) { return this.post('/auth/reset-password', data); },

    // ---------- Public ----------
    photographers(params) { return this.get('/photographers', params); },
    photographer(id) { return this.get('/photographers/' + id); },
    photographerPackages(id) { return this.get('/photographers/' + id + '/packages'); },
    photographerPortfolio(id) { return this.get('/photographers/' + id + '/portfolio'); },
    photographerReviews(id) { return this.get('/photographers/' + id + '/reviews'); },
    allPackages() { return this.get('/packages'); },
    publicStats() { return this.get('/public/stats'); },
    publicReviews() { return this.get('/public/reviews'); },
    contactInquiry(data) { return this.post('/contact/inquiries', data); },

    /**
     * Public availability check — backend returns a raw boolean (true/false).
     * Normalised here to { available: boolean } for consistent consumer API.
     */
    checkAvailability(profileId, date, timeSlot) {
      return this.get('/photographers/' + profileId + '/availability/check', { date, timeSlot })
        .then(res => ({ available: res === true }));
    },

    // ---------- Photographer (own) ----------
    ownProfile() { return this.get('/photographer/profile'); },
    updateProfile(data) { return this.put('/photographer/profile', data); },
    ownPortfolio() { return this.get('/photographer/portfolio'); },
    createPortfolio(data) { return this.post('/photographer/portfolio', data); },
    updatePortfolio(id, data) { return this.put('/photographer/portfolio/' + id, data); },
    deletePortfolio(id) { return this.del('/photographer/portfolio/' + id); },
    ownPackages() { return this.get('/photographer/packages'); },
    createPackage(data) { return this.post('/photographer/packages', data); },
    updatePackage(id, data) { return this.put('/photographer/packages/' + id, data); },
    deletePackage(id) { return this.del('/photographer/packages/' + id); },
    ownAvailability() { return this.get('/photographer/availability'); },
    createSlot(data) { return this.post('/photographer/availability', data); },
    deleteSlot(id) { return this.del('/photographer/availability/' + id); },
    photographerBookings() { return this.get('/photographer/bookings'); },
    photographerBookingAction(id, data) { return this.post('/photographer/bookings/' + id + '/status', data); },
    // Dedicated booking lifecycle endpoints (PATCH /api/bookings/{id}/...)
    confirmBooking(id) { return this.patch('/bookings/' + id + '/confirm'); },
    declineBooking(id, reason) { return this.patch('/bookings/' + id + '/decline', { reason: reason }); },
    completeBooking(id) { return this.patch('/bookings/' + id + '/complete'); },
    photographerReviews() { return this.get('/photographer/reviews'); },
    photographerNotifications() { return this.get('/photographer/notifications'); },
    markNotificationRead(id) { return this.patch('/photographer/notifications/' + id + '/read'); },
    markAllNotificationsRead() { return this.post('/photographer/notifications/read-all'); },
    deleteNotification(id) { return this.del('/photographer/notifications/' + id); },

    // ---------- Customer ----------
    customerBookings() { return this.get('/customer/bookings'); },
    customerBooking(id) { return this.get('/customer/bookings/' + id); },
    createBooking(data) { return this.post('/customer/bookings', data); },
    updateBookingNotes(id, data) { return this.put('/customer/bookings/' + id + '/notes', data); },
    cancelBooking(id) { return this.post('/customer/bookings/' + id + '/cancel'); },
    customerProfile(data) { return this.put('/customer/profile', data); },
    customerReviews() { return this.get('/customer/reviews'); },
    createReview(bookingId, data) { return this.post('/customer/reviews?bookingId=' + bookingId, data); },
    updateReview(id, data) { return this.put('/customer/reviews/' + id, data); },
    deleteReview(id) { return this.del('/customer/reviews/' + id); },
    customerNotifications() { return this.get('/customer/notifications'); },
    customerMarkRead(id) { return this.patch('/customer/notifications/' + id + '/read'); },
    customerMarkAllRead() { return this.post('/customer/notifications/read-all'); },
    customerDeleteNotification(id) { return this.del('/customer/notifications/' + id); },

    // ---------- Admin ----------
    adminStats() { return this.get('/admin/stats'); },
    adminUsers() { return this.get('/admin/users'); },
    adminCreateUser(data) { return this.post('/admin/users', data); },
    adminPhotographers() { return this.get('/admin/photographers'); },
    adminUpdatePhotographer(id, data) { return this.put('/admin/photographers/' + id, data); },
    adminBookings(status) { return this.get('/admin/bookings', { status }); },
    adminBookingAction(id, data) { return this.patch('/admin/bookings/' + id + '/status', data); },
    adminReviews(search) { return this.get('/admin/reviews', { search }); },
    adminDeleteReview(id) { return this.del('/admin/reviews/' + id); },
    adminInquiries(status) { return this.get('/admin/inquiries', { status }); },
    adminUpdateInquiryStatus(id, status) { return this.patch('/admin/inquiries/' + id + '/status', { status }); },
    adminPostNotice(data) { return this.post('/admin/notices', data); },
    adminUpdateUserStatus(id, status) { return this.patch('/admin/users/' + id + '/status', { status }); },
    adminVerifyPhotographer(id) { return this.patch('/admin/photographers/' + id + '/verify'); },
    adminDeleteUser(id) { return this.del('/admin/users/' + id); },
    adminDeletePhotographer(id) { return this.del('/admin/photographers/' + id); },
  };

  // Bootstrap CSRF token on load so subsequent requests carry it.
  API.fetchCsrf();

  // Restore Bearer token from localStorage (set by login.js if server ever returns one).
  try {
    const stored = localStorage.getItem('ecosnap_token');
    if (stored) API._bearerToken = stored;
  } catch (e) { /* ignore */ }

  // Expose globally
  window.EcoSnapAPI = API;
})();