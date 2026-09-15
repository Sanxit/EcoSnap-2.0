// Customer Dashboard — authentication, section routing, real backend CRUD for bookings,
// reviews, notifications, find-photographers, and profile.
// Depends on: assets/js/session.js, assets/js/api.js (loaded before this file).

// ===== AUTH =====
// Server session is cookie-based; we verify it async and fall back gracefully.
let currentUser = null;
async function loadAuth() {
  if (!window.EcoSnapAPI) return null;
  try {
    const me = await EcoSnapAPI.me();
    if (me && me.user) {
      const u = me.user;
      currentUser = {
        id: u.id,
        fullName: u.fullName || '',
        name: u.fullName || '',
        email: u.email || '',
        role: (u.role || '').toUpperCase(),
        phoneNumber: u.phoneNumber || '',
        imageUrl: (u.profile && u.profile.avatarUrl) || '',
        profile: u.profile || null
      };
      if (currentUser.role === 'CLIENT') currentUser.role = 'CUSTOMER';
      // Capture Bearer token if server ever returns one
      if (me.token) EcoSnapAPI.setToken(me.token);
      localStorage.setItem('ecosnap_user', JSON.stringify(currentUser));
      if (window.EcoSnapSession) {
        EcoSnapSession.applyNavbarAuth();
        EcoSnapSession.applyToUI(currentUser);
      }
    } else {
      localStorage.removeItem('ecosnap_user');
      localStorage.removeItem('ecosnap_token');
      sessionStorage.removeItem('ecosnap_user');
      sessionStorage.removeItem('ecosnap_token');
      const ctx = (window.EcoSnapSession && typeof window.EcoSnapSession.getPathContext === 'function')
        ? window.EcoSnapSession.getPathContext()
        : { root: './', pages: 'pages/' };
      window.location.href = ctx.pages + 'login.html';
      return null;
    }
  } catch (e) {
    // Not authenticated -> redirect to login.
    const ctx = (window.EcoSnapSession && typeof window.EcoSnapSession.getPathContext === 'function')
      ? window.EcoSnapSession.getPathContext()
      : { root: './', pages: 'pages/' };
    window.location.href = ctx.pages + 'login.html';
    return null;
  }
  return currentUser;
}
loadAuth();

// ===== SECTIONS =====
const SECTIONS = ['home','bookings','reviews','notifications','find','profile'];
const SECTION_TITLES = {home:'Home',bookings:'My Bookings',reviews:'My Reviews',notifications:'Notifications',find:'Find Photographers',profile:'Profile'};
let currentSection = 'home';
let backendBookings = [];
let backendReviews = [];
let backendNotifications = [];
let backendPhotographers = [];

// ===== HELPERS =====
function statusBadge(s) {
  const map={CONFIRMED:'confirmed',PENDING:'pending',CANCELLED:'cancelled',COMPLETED:'completed',ACTIVE:'active',DECLINED:'declined'};
  return `<span class="status-badge ${map[s]||'inactive'}">${s}</span>`;
}
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—'; }
function isPast(d) { return new Date(d) < new Date(); }
function fmtMoney(n) { return 'Rs. ' + (Number(n) || 0).toLocaleString('en-IN'); }
function initials(name) {
  const parts = (name || '').trim().split(/\s+/);
  return parts.length ? parts.slice(0,2).map(p => p[0].toUpperCase()).join('') : '?';
}

// ===== LOADING / ERROR HELPERS =====
function loadingRow(colspan, msg) {
  return `<tr><td colspan="${colspan}" class="state-row"><i class="ri-loader-4-line spin"></i> ${msg || 'Loading...'}</td></tr>`;
}
function errorRow(colspan, msg) {
  return `<tr><td colspan="${colspan}" class="state-row" style="color:var(--error);"><i class="ri-error-warning-line"></i> ${msg || 'Could not load data.'}</td></tr>`;
}
function loadingState(containerId, msg) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<div class="state-row"><i class="ri-loader-4-line spin"></i> ${msg || 'Loading...'}</div>`;
}
function errorState(containerId, msg) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<div class="state-row" style="color:var(--error);"><i class="ri-error-warning-line"></i> ${msg || 'Could not load data. Please refresh.'}</div>`;
}

// ===== SECTION ROUTING =====
function showSection(id, linkEl) {
  if (!SECTIONS.includes(id)) return;
  currentSection = id;
  SECTIONS.forEach(s => {
    const el = document.getElementById('section-' + s);
    if (el) el.style.display = (s===id) ? '' : 'none';
  });
  document.getElementById('topbarTitle').textContent = SECTION_TITLES[id] || id;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');
  else { const nl = document.getElementById('nav-' + id); if(nl) nl.classList.add('active'); }
  if (window.location.hash !== '#'+id) history.replaceState(null,'','#'+id);
  closeSidebar();
  const renders={home:renderHome,bookings:renderMyBookings,reviews:renderMyReviews,notifications:renderNotifications,find:renderFindPhotographers};
  if (renders[id]) renders[id]();
}

function initHashRoute() {
  const hash = window.location.hash.replace('#','');
  if (hash && SECTIONS.includes(hash)) showSection(hash,null);
  else renderHome();
}
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#','');
  if (hash && SECTIONS.includes(hash) && hash!==currentSection) showSection(hash,null);
});

// ===== HOME =====
function renderHome() {
  const total = backendBookings.length;
  const upcoming = backendBookings.filter(b=>b.status==='CONFIRMED'&&!isPast(b.eventDate)).length;
  const completed = backendBookings.filter(b=>b.status==='COMPLETED').length;
  const spent = backendBookings.filter(b=>b.status!=='CANCELLED'&&b.status!=='DECLINED').reduce((a,b)=>a+(Number(b.amount)||0),0);

  document.getElementById('homeStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon green"><i class="ri-calendar-check-line"></i></div><div class="stat-body"><div class="stat-label">Total Bookings</div><div class="stat-value">${total}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> All time</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="ri-time-line"></i></div><div class="stat-body"><div class="stat-label">Upcoming Events</div><div class="stat-value">${upcoming}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Confirmed</div></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="ri-checkbox-circle-line"></i></div><div class="stat-body"><div class="stat-label">Completed</div><div class="stat-value">${completed}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Sessions done</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="ri-coins-line"></i></div><div class="stat-body"><div class="stat-label">Total Spent</div><div class="stat-value">${fmtMoney(spent)}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Lifetime</div></div></div>
  `;

  const nextBooking = backendBookings.find(b=>b.status==='CONFIRMED'&&!isPast(b.eventDate));
  if (nextBooking) {
    document.getElementById('upcomingBanner').innerHTML = `
      <div class="dash-card" style="margin-bottom:20px;background:linear-gradient(135deg,var(--primary-color) 0%,var(--primary-dark) 100%);border:none;color:#fff;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <div style="font-size:.78rem;font-weight:700;opacity:.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Upcoming Event</div>
            <div style="font-size:1.3rem;font-weight:700;margin-bottom:6px;">${nextBooking.eventType} Photography</div>
            <div style="opacity:.85;font-size:.9rem;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <i class="ri-calendar-event-line"></i> ${fmtDate(nextBooking.eventDate)} &nbsp;|&nbsp;
              <i class="ri-map-pin-line"></i> ${nextBooking.location || nextBooking.notes} &nbsp;|&nbsp;
              <i class="ri-user-line"></i> ${nextBooking.photographer}
            </div>
          </div>
          <button style="background:#fff;color:var(--primary-color);font-weight:700;padding:10px 22px;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:.9rem;" onclick="showSection('bookings',null)">View Details</button>
        </div>
      </div>`;
  } else {
    document.getElementById('upcomingBanner').innerHTML = '';
  }

  const recent = backendBookings.slice(0,4);
  document.getElementById('homeRecentBookings').innerHTML = recent.length === 0
    ? `<div class="state-row"><i class="ri-calendar-close-line"></i> No bookings yet.</div>`
    : recent.map(b=>`
    <div class="list-item">
      <div class="list-avatar">${b.photographerInit||initials(b.photographer)}</div>
      <div class="list-body"><div class="list-title">${b.photographer} — ${b.eventType}</div><div class="list-sub">${fmtDate(b.eventDate)} · ${b.package||'Package'} Package</div></div>
      ${statusBadge(b.status)}
    </div>`).join('');

  document.getElementById('homeRecommended').innerHTML = backendPhotographers.slice(0,3).map(p=>`
    <div class="photographer-card">
      <div class="photo-avatar" style="background:${p.color||'var(--primary-color)'};">${p.init||initials(p.name)}</div>
      <div class="photo-body">
        <div class="photo-name">${p.name}</div>
        <div class="photo-spec">${p.spec||p.specialization||''} · ${p.location}</div>
        <div class="photo-rating">&#9733; ${p.rating} (${p.reviews||p.reviewCount||0} reviews)</div>
      </div>
      <button class="btn-xs success" style="padding:7px 14px;font-size:.78rem;" onclick="openBookModal(${p.id})">Book</button>
    </div>`).join('');

  updateNotifBadge();
}

// ===== MY BOOKINGS =====
function renderMyBookings() {
  const statF = (document.getElementById('bkStatusFilter')||{}).value||'';
  const filtered = statF ? backendBookings.filter(b=>b.status===statF) : backendBookings;

  const canCancel = s => s==='PENDING'||s==='CONFIRMED';
  const canEdit   = s => s==='PENDING'||s==='CONFIRMED';
  const canReview = (s,bkId) => s==='COMPLETED' && !backendReviews.find(r=>r.bookingId===bkId);

  const tbody = filtered.length===0
    ? `<tr><td colspan="8" class="state-row"><i class="ri-calendar-close-line"></i> No bookings found.</td></tr>`
    : filtered.map(b=>`
      <tr>
        <td>${b.id}</td>
        <td>${b.photographer}</td>
        <td>${b.eventType}</td>
        <td>${fmtDate(b.eventDate)}</td>
        <td>${b.package}</td>
        <td>Rs. ${(Number(b.amount)||0).toLocaleString('en-IN')}</td>
        <td>${statusBadge(b.status)}</td>
        <td>
          <div class="action-btns">
            ${canEdit(b.status) ? `<button class="btn-xs edit" onclick="openEditBookingNotes('${b.id}')">Edit Notes</button>` : ''}
            ${canCancel(b.status) ? `<button class="btn-xs danger" onclick="cancelBooking('${b.id}')">Cancel</button>` : ''}
            ${canReview(b.status,b.id) ? `<button class="btn-xs purple" onclick="openWriteReview('${b.id}')">Review</button>` : ''}
          </div>
        </td>
      </tr>`).join('');

  document.getElementById('myBookingsTable').innerHTML = `
    <thead><tr><th>ID</th><th>Photographer</th><th>Event</th><th>Date</th><th>Package</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${tbody}</tbody>`;
}

function openEditBookingNotes(id) {
  const b = backendBookings.find(x=>x.id===id); if(!b) return;
  document.getElementById('ebkId').value = id;
  document.getElementById('ebkNotes').value = b.notes||'';
  openModal('modalEditBooking');
}

function saveBookingNotes() {
  const id = document.getElementById('ebkId').value;
  const notes = document.getElementById('ebkNotes').value.trim();
  const btn = document.querySelector('#modalEditBooking .btn-primary');
  const original = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ri-loader-4-line spin"></i> Saving...'; }
  EcoSnapAPI.updateBookingNotes(id, { notes: notes }).then(() => {
    const b = backendBookings.find(x=>x.id===id); if (b) b.notes = notes;
    closeModal('modalEditBooking');
    showToast('Booking notes updated.','success');
    renderMyBookings();
    if(currentSection==='home') renderHome();
  }).catch(err => {
    showToast(err.message || 'Could not update notes.','error');
  }).finally(() => {
    if (btn) { btn.innerHTML = original; btn.disabled = false; }
  });
}

function cancelBooking(id) {
  const b = backendBookings.find(x=>x.id===id); if(!b) return;
  confirmAction('Cancel Booking', `Cancel your booking ${id} with ${b.photographer}? This action cannot be undone.`, () => {
    EcoSnapAPI.cancelBooking(id).then(() => {
      // Re-fetch bookings from server to get ground truth
      return loadBookings();
    }).then(() => {
      showToast(`Booking ${id} has been cancelled.`,'success');
      renderMyBookings();
      if(currentSection==='home') renderHome();
    }).catch(err => {
      showToast(err.message || 'Could not cancel booking.','error');
    });
  });
}

// ===== MY REVIEWS =====
function renderMyReviews() {
  if (backendReviews.length===0) {
    document.getElementById('myReviewsList').innerHTML = `<div class="state-row"><i class="ri-star-off-line"></i> You have not written any reviews yet. Complete a booking to leave a review!</div>`;
    return;
  }
  document.getElementById('myReviewsList').innerHTML = backendReviews.map(r=>`
    <div style="border-bottom:1px solid var(--gray-100);padding:16px 0;display:flex;align-items:flex-start;gap:14px;">
      <div style="flex:1;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <div style="font-weight:700;">${r.photographerName||r.photographer}</div>
          <div style="font-size:.78rem;color:var(--gray-500);">${fmtDate(r.createdAt)}</div>
        </div>
        <div style="color:#f59e0b;margin-bottom:6px;">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
        <p style="font-size:.875rem;color:var(--gray-600);line-height:1.6;">"${r.comment}"</p>
        <div style="font-size:.76rem;color:var(--gray-400);margin-top:4px;">Booking: ${r.bookingId}</div>
      </div>
      <div class="action-btns" style="flex-shrink:0;">
        <button class="btn-xs edit" onclick="openEditReview(${r.id})">Edit</button>
        <button class="btn-xs danger" onclick="deleteReview(${r.id})">Delete</button>
      </div>
    </div>`).join('');
}

function openWriteReview(bookingId) {
  const b = backendBookings.find(x=>x.id===bookingId); if(!b) return;
  currentRating=0;
  document.getElementById('rvId').value='';
  document.getElementById('rvBooking').value=`${bookingId} — ${b.photographer} (${b.eventType})`;
  document.getElementById('rvComment').value='';
  document.getElementById('modalReviewTitle').textContent='Write a Review';
  setRating(0);
  openModal('modalReview');
}

function openEditReview(id) {
  const r = backendReviews.find(x=>x.id===id); if(!r) return;
  document.getElementById('rvId').value=id;
  document.getElementById('rvBooking').value=`${r.bookingId} — ${r.photographerName||r.photographer}`;
  document.getElementById('rvComment').value=r.comment;
  document.getElementById('modalReviewTitle').textContent='Edit Review';
  setRating(r.rating);
  openModal('modalReview');
}

function setRating(v) {
  currentRating=v;
  document.querySelectorAll('#starInput span').forEach(s=>{
    s.classList.toggle('on', +s.dataset.v<=v);
  });
}

function saveReview() {
  const id = document.getElementById('rvId').value;
  const comment = document.getElementById('rvComment').value.trim();
  const bkStr = document.getElementById('rvBooking').value;
  if (!comment) { showToast('Please write a comment.','error'); return; }
  if (!currentRating) { showToast('Please select a rating.','error'); return; }

  const btn = document.querySelector('#modalReview .btn-primary');
  const original = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ri-loader-4-line spin"></i> Saving...'; }

  const bookingId = bkStr.split(' — ')[0];
  const savePromise = id
    ? EcoSnapAPI.updateReview(id, { rating: currentRating, comment: comment })
    : EcoSnapAPI.createReview(bookingId, { rating: currentRating, comment: comment });

  savePromise.then(res => {
    closeModal('modalReview');
    showToast(id ? 'Review updated.' : 'Review submitted!', 'success');
    // Re-fetch reviews from server
    return loadReviews();
  }).then(() => {
    renderMyReviews();
    renderMyBookings();
  }).catch(err => {
    showToast(err.message || 'Could not save review.','error');
  }).finally(() => {
    if (btn) { btn.innerHTML = original; btn.disabled = false; }
  });
}

function deleteReview(id) {
  confirmAction('Delete Review','Delete this review? This cannot be undone.',()=>{
    EcoSnapAPI.deleteReview(id).then(() => {
      return loadReviews();
    }).then(() => {
      showToast('Review deleted.','success');
      renderMyReviews();
      renderMyBookings();
    }).catch(err => {
      showToast(err.message || 'Could not delete review.','error');
    });
  });
}

// ===== NOTIFICATIONS =====
function updateNotifBadge() {
  // Backend field is `read` (boolean), not `isRead`
  const unread=backendNotifications.filter(n=>!n.isRead).length;
  const badge=document.getElementById('notifBadge');
  const dot=document.getElementById('topbarNotifDot');
  if(badge){badge.textContent=unread;badge.style.display=unread?'':'none';}
  if(dot)dot.style.display=unread?'':'none';
}

function renderNotifications() {
  updateNotifBadge();
  if(backendNotifications.length===0){
    document.getElementById('notificationsList').innerHTML=`<div class="state-row"><i class="ri-notification-off-line"></i> No notifications.</div>`;
    return;
  }
  document.getElementById('notificationsList').innerHTML=backendNotifications.map(n=>`
    <div class="notif-item">
      <div class="notif-dot-indicator ${n.isRead?'read':''}"></div>
      <div style="flex:1;">
        <div style="font-size:.88rem;${n.isRead?'color:var(--gray-500);':'font-weight:600;'}">${n.message}</div>
        <div style="font-size:.76rem;color:var(--gray-400);margin-top:3px;">${fmtDate(n.createdAt)}</div>
      </div>
      <div class="action-btns" style="flex-shrink:0;">
        ${!n.isRead?`<button class="btn-xs edit" onclick="markRead(${n.id})">Mark Read</button>`:''}
        <button class="btn-xs danger" onclick="deleteNotification(${n.id})">Delete</button>
      </div>
    </div>`).join('');
}

function markRead(id) {
  EcoSnapAPI.customerMarkRead(id).then(() => {
    const n=backendNotifications.find(x=>x.id===id);
    if(n) n.isRead=true;
    renderNotifications();
  }).catch(err => showToast(err.message || 'Could not mark read.','error'));
}

function markAllRead() {
  EcoSnapAPI.customerMarkAllRead().then(() => {
    backendNotifications.forEach(n=>n.isRead=true);
    renderNotifications();
    showToast('All notifications marked as read.','success');
  }).catch(err => showToast(err.message || 'Could not mark all read.','error'));
}

function deleteNotification(id) {
  confirmAction('Delete Notification','Remove this notification?',()=>{
    EcoSnapAPI.customerDeleteNotification(id).then(() => {
      backendNotifications=backendNotifications.filter(x=>x.id!==id);
      showToast('Notification deleted.','success');
      renderNotifications();
    }).catch(err => showToast(err.message || 'Could not delete notification.','error'));
  });
}

// ===== FIND PHOTOGRAPHERS =====
function renderFindPhotographers() {
  const search=(document.getElementById('findSearch')||{}).value?.toLowerCase()||'';
  const filtered=backendPhotographers.filter(p=>
    !search||p.name.toLowerCase().includes(search)||(p.spec||p.specialization||'').toLowerCase().includes(search)||p.location.toLowerCase().includes(search)
  );

  document.getElementById('findPhotographersList').innerHTML = filtered.length===0
    ? `<div class="state-row"><i class="ri-search-eye-line"></i> No photographers found.</div>`
    : filtered.map(p=>`
      <div class="photographer-card" style="padding:18px;">
        <div class="photo-avatar" style="background:${p.color||'var(--primary-color)'};width:56px;height:56px;font-size:1.2rem;">${p.init||initials(p.name)}</div>
        <div class="photo-body">
          <div class="photo-name" style="font-size:1rem;">${p.name}</div>
          <div class="photo-spec">${p.spec||p.specialization||''} · ${p.location}</div>
          <div class="photo-rating">&#9733; ${p.rating} · ${p.reviews||p.reviewCount||0} reviews · From ${fmtMoney(p.rate||p.price||0)}/hr</div>
          <div style="margin-top:6px;">${(p.tags||p.specialties||[]).map(t=>`<span class="event-tag">${t}</span>`).join('')}</div>
        </div>
        <button class="btn-xs success" style="padding:10px 20px;font-size:.85rem;" onclick="openBookModal(${p.id})">Book Now</button>
      </div>`).join('');
}

// ===== BOOK MODAL =====
let bkAvailChecked = false;
let bkPhotographerId = null;

function openBookModal(photographerId) {
  const p=backendPhotographers.find(x=>x.id===photographerId);
  if(!p) return;
  bkPhotographerId=photographerId;
  bkAvailChecked=false;
  document.getElementById('bkPhotographer').value=p.name;
  document.getElementById('bkDate').value='';
  document.getElementById('bkDateError').textContent='';
  document.getElementById('bkLocation').value='';
  document.getElementById('bkNotes').value='';
  document.getElementById('bkAvailCheck').textContent='';
  document.getElementById('bkSubmitBtn').textContent='Check Availability';
  openModal('modalBook');
}

function submitBooking() {
  const date=document.getElementById('bkDate').value;
  const loc=document.getElementById('bkLocation').value.trim();
  const errEl=document.getElementById('bkDateError');

  if(!date){errEl.textContent='Event date is required.';return;}
  if(new Date(date)<new Date().setHours(0,0,0,0)){errEl.textContent='Event date cannot be in the past.';return;}
  if(!loc){showToast('Please enter the event location.','error');return;}
  errEl.textContent='';

  if(!bkAvailChecked){
    const btn=document.getElementById('bkSubmitBtn');
    const av=document.getElementById('bkAvailCheck');
    btn.disabled=true;
    btn.textContent='Checking availability...';
    av.textContent='Checking photographer availability...';

    EcoSnapAPI.checkAvailability(bkPhotographerId, date, document.getElementById('bkTimeSlot').value).then(res => {
      const available = res && res.available === true;
      btn.disabled=false;
      if(available){
        av.innerHTML='<span style="color:var(--success);font-weight:600;"><i class="ri-check-circle-line"></i> Available on this date!</span>';
        btn.textContent='Confirm Booking';
        bkAvailChecked=true;
      } else {
        av.innerHTML='<span style="color:var(--error);font-weight:600;"><i class="ri-close-circle-line"></i> Not available on this date. Please choose another date.</span>';
        btn.textContent='Check Availability';
        bkAvailChecked=false;
      }
    }).catch(err => {
      av.innerHTML='<span style="color:var(--error);"><i class="ri-close-circle-line"></i> ' + (err.message||'Could not check availability.') + '</span>';
      btn.disabled=false;
      btn.textContent='Check Availability';
    });
    return;
  }

  const eventType=document.getElementById('bkEventType').value;
  const timeSlot=document.getElementById('bkTimeSlot').value;
  const notes=document.getElementById('bkNotes').value.trim();

  const payload = {
    photographerProfileId: bkPhotographerId,
    eventType: eventType,
    eventDate: date,
    timeSlot: timeSlot,
    location: loc,
    notes: notes
  };

  const btn=document.getElementById('bkSubmitBtn');
  btn.disabled=true;
  btn.textContent='Submitting...';

  EcoSnapAPI.createBooking(payload).then(res => {
    closeModal('modalBook');
    bkAvailChecked=false;
    const newId = res ? res.id : 'BK-new';
    showToast(`Booking ${newId} submitted! Awaiting photographer confirmation.`,'success');
    // Re-fetch bookings from server (ground truth, not local push)
    return loadBookings();
  }).then(() => {
    if(currentSection==='home') renderHome();
    renderMyBookings();
  }).catch(err => {
    showToast(err.message || 'Could not submit booking.','error');
    btn.disabled=false;
    btn.textContent='Confirm Booking';
  });
}

// ===== PASSWORD =====
function changePassword() {
  const cur=document.getElementById('profPwdCur').value;
  const nw=document.getElementById('profPwdNew').value;
  const cf=document.getElementById('profPwdCf').value;
  if(!cur||!nw||!cf){showToast('All password fields are required.','error');return;}
  if(nw!==cf){showToast('New passwords do not match.','error');return;}
  if(nw.length<6){showToast('Password must be at least 6 characters.','error');return;}
  EcoSnapAPI.changePassword({ currentPassword: cur, newPassword: nw }).then(() => {
    document.getElementById('profPwdCur').value='';
    document.getElementById('profPwdNew').value='';
    document.getElementById('profPwdCf').value='';
    showToast('Password updated successfully.','success');
  }).catch(err => {
    showToast(err.message || 'Could not update password.','error');
  });
}

// ===== INDIVIDUAL DATA LOADERS (for targeted re-fetch) =====
async function loadBookings() {
  if (!window.EcoSnapAPI) return;
  try {
    const bookings = await EcoSnapAPI.customerBookings();
    backendBookings = (bookings || []).map(b => ({
      id: b.id,
      photographer: b.photographerName || b.photographer || '',
      photographerInit: initials(b.photographerName || b.photographer || ''),
      eventType: b.eventType || '',
      eventDate: b.eventDate || '',
      package: b.packageName || b.package || '-',
      amount: Number(b.amount) || 0,
      status: (b.status || 'PENDING').toString().toUpperCase(),
      notes: b.notes || '',
      location: b.location || ''
    }));
  } catch (e) {
    console.error('[EcoSnap] loadBookings failed', e);
    throw e;
  }
}

async function loadReviews() {
  if (!window.EcoSnapAPI) return;
  try {
    const reviews = await EcoSnapAPI.customerReviews();
    backendReviews = (reviews || []).map(r => ({
      id: r.id,
      bookingId: r.bookingId,
      photographerName: r.photographerName || r.photographer || '',
      photographer: r.photographerName || r.photographer || '',
      rating: r.rating || 0,
      comment: r.comment || '',
      createdAt: r.createdAt || ''
    }));
  } catch (e) {
    console.error('[EcoSnap] loadReviews failed', e);
    throw e;
  }
}

async function loadNotifications() {
  if (!window.EcoSnapAPI) return;
  try {
    const notifications = await EcoSnapAPI.customerNotifications();
    // Backend field: `read` (boolean) — map to `isRead` for UI consistency
    backendNotifications = (notifications || []).map(n => ({
      id: n.id,
      message: n.message || '',
      isRead: n.read === true,   // ← FIXED: backend sends `read`, not `isRead`
      createdAt: n.createdAt || ''
    }));
  } catch (e) {
    console.error('[EcoSnap] loadNotifications failed', e);
    throw e;
  }
}

async function loadPhotographers() {
  if (!window.EcoSnapAPI) return;
  try {
    const photographers = await EcoSnapAPI.photographers();
    backendPhotographers = (photographers || []).map(p => ({
      id: p.id,
      name: p.ownerName || p.name || '',
      init: initials(p.ownerName || p.name || ''),
      color: 'var(--primary-color)',
      spec: p.specialization || '',
      specialization: p.specialization || '',
      location: p.location || '',
      rating: p.rating || 0,
      reviews: p.reviewCount || 0,
      reviewCount: p.reviewCount || 0,
      rate: Number(p.hourlyRate || 0),
      price: Number(p.packages && p.packages.length ? p.packages[0].price : (p.hourlyRate || 0)),
      tags: (p.specialization || '').split(',').map(s=>s.trim()).filter(Boolean),
      specialties: (p.specialization || '').split(',').map(s=>s.trim()).filter(Boolean)
    }));
  } catch (e) {
    console.error('[EcoSnap] loadPhotographers failed', e);
    throw e;
  }
}

// ===== BACKEND DATA LOADING =====
async function loadBackendData() {
  if (!window.EcoSnapAPI) return;

  // Show loading states immediately
  const bkTable = document.getElementById('myBookingsTable');
  if (bkTable) bkTable.innerHTML = loadingRow(8, 'Loading bookings...');
  loadingState('myReviewsList', 'Loading reviews...');
  loadingState('notificationsList', 'Loading notifications...');
  loadingState('findPhotographersList', 'Loading photographers...');
  loadingState('homeRecentBookings', 'Loading...');

  // Fetch all in parallel; each loader handles its own error internally
  const results = await Promise.allSettled([
    loadBookings(),
    loadReviews(),
    loadNotifications(),
    loadPhotographers()
  ]);

  // Log any failures (they are already logged inside each loader)
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const labels = ['bookings', 'reviews', 'notifications', 'photographers'];
      console.error(`[EcoSnap] Failed to load ${labels[i]}:`, r.reason);
    }
  });

  // Check if bookings specifically failed
  if (results[0].status === 'rejected') {
    const bkT = document.getElementById('myBookingsTable');
    if (bkT) bkT.innerHTML = errorRow(8, 'Could not load bookings. Please refresh.');
  }
  if (results[1].status === 'rejected') {
    errorState('myReviewsList', 'Could not load reviews. Please refresh.');
  }
  if (results[2].status === 'rejected') {
    errorState('notificationsList', 'Could not load notifications. Please refresh.');
  }
  if (results[3].status === 'rejected') {
    errorState('findPhotographersList', 'Could not load photographers. Please refresh.');
  }

  // Render all sections
  renderHome();
  renderMyBookings();
  renderMyReviews();
  renderNotifications();
  renderFindPhotographers();
}

// ===== PROFILE SECTION =====
function renderProfile() {
  if (!currentUser) return;
  const nameEl = document.getElementById('profileName');
  const emailEl = document.getElementById('profileEmail');
  const initialsEl = document.getElementById('profileInitials');
  const nameInput = document.getElementById('profileNameInput');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('profilePhone');
  const cityInput = document.getElementById('profileCity');
  if (nameEl) nameEl.textContent = currentUser.fullName || currentUser.name || '';
  if (emailEl) emailEl.textContent = currentUser.email || '';
  if (initialsEl) initialsEl.textContent = initials(currentUser.fullName || currentUser.name || '');
  if (nameInput) nameInput.value = currentUser.fullName || currentUser.name || '';
  if (emailInput) emailInput.value = currentUser.email || '';
  if (phoneInput) phoneInput.value = currentUser.phoneNumber || '';
  if (cityInput) cityInput.value = (currentUser.profile && currentUser.profile.location) || 'Kathmandu';
}

function saveProfile() {
  const fullName = (document.getElementById('profileNameInput')||{}).value || '';
  const phone = (document.getElementById('profilePhone')||{}).value || '';
  const payload = { fullName: fullName.trim(), phoneNumber: phone };
  EcoSnapAPI.customerProfile(payload).then(res => {
    if (res && res.user) {
      const u = res.user;
      currentUser.fullName = u.fullName || '';
      currentUser.phoneNumber = u.phoneNumber || '';
      if (u.profile) currentUser.profile = u.profile;
      localStorage.setItem('ecosnap_user', JSON.stringify(currentUser));
      if (window.EcoSnapSession) EcoSnapSession.applyToUI(currentUser);
    }
    renderProfile();
    showToast('Profile saved successfully.','success');
  }).catch(err => showToast(err.message || 'Could not save profile.','error'));
}

// Bootstrap backend data + hash routing after auth check completes.
loadBackendData();
initHashRoute();
