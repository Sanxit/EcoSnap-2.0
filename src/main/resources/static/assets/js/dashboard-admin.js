// Admin Dashboard — authentication, section routing, real backend CRUD for users,
// photographers, bookings, reviews, notices, and settings.
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

// ===== BACKEND DATA =====
let backendUsers = [];
let backendPhotographers = [];
let backendBookings = [];
let backendReviews = [];
let backendNotices = [];
let backendInquiries = [];
let adminStats = null;

function fmtMoney(n) { return 'Rs. ' + (Number(n) || 0).toLocaleString('en-IN'); }
function initials(name) {
  const parts = (name || '').trim().split(/\s+/);
  return parts.length ? parts.slice(0,2).map(p => p[0].toUpperCase()).join('') : '?';
}

let bookingsLoadFailed = false;   // set when GET /admin/bookings fails
let busyBookingId = null;         // id of the booking row currently being actioned

// Targeted re-fetch helper — keeps the booking log in sync with server truth.
async function loadBookings() {
  if (!window.EcoSnapAPI) return;
  try {
    const bookings = await EcoSnapAPI.adminBookings();
    bookingsLoadFailed = false;
    backendBookings = (bookings || []).map(b => ({
      id: b.id,
      client: b.customerName || b.client || '',
      photographer: b.photographerName || b.photographer || '',
      eventType: b.eventType || '',
      eventDate: b.eventDate || '',
      amount: b.amount || 0,
      status: b.status || 'PENDING',
      notes: b.notes || ''
    }));
  } catch (e) {
    bookingsLoadFailed = true;
    console.error('[EcoSnap] admin loadBookings failed', e);
    throw e;
  }
}

async function loadBackendData() {
  if (!window.EcoSnapAPI) return;
  // Initial loading state for the bookings table.
  const bkTable = document.getElementById('bookingsTable');
  if (bkTable) bkTable.innerHTML = '<tbody><tr><td colspan="8" class="state-row"><i class="ri-loader-4-line spin"></i> Loading bookings...</td></tr></tbody>';
  try {
    const [stats, users, photographers, reviews, inquiries] = await Promise.all([
      EcoSnapAPI.adminStats().catch(() => null),
      EcoSnapAPI.adminUsers().catch(() => []),
      EcoSnapAPI.adminPhotographers().catch(() => []),
      loadBookings().catch(() => null),
      EcoSnapAPI.adminReviews().catch(() => []),
      EcoSnapAPI.adminInquiries().catch(() => [])
    ]);

    adminStats = stats || {};

    backendUsers = (users || []).map(u => ({
      id: u.id,
      name: u.fullName || '',
      email: u.email || '',
      role: (u.role || '').toUpperCase(),
      status: (u.status || '').toUpperCase(),
      joined: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—',
      bookings: 0
    }));

    backendPhotographers = (photographers || []).map(p => ({
      id: p.id,
      name: p.ownerName || '',
      specialization: p.specialization || '',
      expYears: p.experienceYears || 0,
      hourlyRate: p.hourlyRate || 0,
      location: p.location || '',
      bio: p.bio || '',
      verified: p.verified === true,
      rating: p.rating || 0,
      jobs: p.reviewCount || 0
    }));

    backendReviews = (reviews || []).map(r => ({
      id: r.id,
      customerName: r.customerName || '',
      photographerName: r.photographerName || '',
      rating: r.rating || 0,
      comment: r.comment || '',
      date: (r.createdAt || '').split('T')[0] || '—'
    }));

    backendInquiries = (inquiries || []).map(i => ({
      id: i.id,
      name: i.name || '',
      email: i.email || '',
      subject: i.subject || '',
      message: i.message || '',
      status: (i.status || 'OPEN').toUpperCase(),
      createdAt: i.createdAt ? new Date(i.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
    }));

    backendNotices = backendInquiries.map(i => ({
      id: i.id,
      title: i.subject || 'Inquiry',
      message: i.message || '',
      targetRole: 'ALL',
      postedAt: i.createdAt ? new Date(i.createdAt).toISOString().split('T')[0] : '—'
    }));

    renderOverview();
    renderUsers();
    renderPhotographers();
    renderBookings();
    renderReviews();
    renderNotices();
  } catch (e) {
    console.warn('Backend data load failed', e);
  }
}

loadBackendData();

// ===== SECTIONS =====
const SECTIONS = ['overview','users','photographers','bookings','reviews','notices','settings'];
const SECTION_TITLES = {
  overview:'Dashboard', users:'User Management', photographers:'Photographers',
  bookings:'Bookings', reviews:'Reviews', notices:'Notices', settings:'Settings'
};
let currentSection = 'overview';

function showSection(id, linkEl) {
  if (!SECTIONS.includes(id)) return;
  currentSection = id;
  SECTIONS.forEach(s => {
    const el = document.getElementById('section-' + s);
    if (el) el.style.display = (s === id) ? '' : 'none';
  });
  document.getElementById('topbarTitle').textContent = SECTION_TITLES[id] || id;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');
  else {
    const nl = document.getElementById('nav-' + id);
    if (nl) nl.classList.add('active');
  }
  if (window.location.hash !== '#' + id) history.replaceState(null,'','#'+id);
  closeSidebar();
  const renders = {users:renderUsers,photographers:renderPhotographers,bookings:renderBookings,reviews:renderReviews,notices:renderNotices,overview:renderOverview};
  if (renders[id]) renders[id]();
}

function initHashRoute() {
  const hash = window.location.hash.replace('#','');
  if (hash && SECTIONS.includes(hash)) showSection(hash, null);
  else renderOverview();
}
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#','');
  if (hash && SECTIONS.includes(hash) && hash !== currentSection) showSection(hash,null);
});
initHashRoute();

// ===== HELPERS =====
function statusBadge(s) {
  const map = {CONFIRMED:'confirmed',PENDING:'pending',CANCELLED:'cancelled',COMPLETED:'completed',ACTIVE:'active',SUSPENDED:'inactive',DECLINED:'declined'};
  return `<span class="status-badge ${map[s]||'inactive'}">${s}</span>`;
}
function starRating(r) {
  return r ? '★'.repeat(Math.round(r)) + '☆'.repeat(5-Math.round(r)) : '—';
}
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—'; }
function fmtMoney(n) { return 'Rs. ' + (Number(n) || 0).toLocaleString('en-IN'); }

// ===== OVERVIEW =====
function renderOverview() {
  const totalUsers = backendUsers.length;
  const totalPhotographers = backendPhotographers.length;
  const activeBookings = backendBookings.filter(b=>b.status==='CONFIRMED'||b.status==='PENDING').length;
  const revenue = backendBookings.filter(b=>b.status==='COMPLETED').reduce((a,b)=>a+b.amount,0);

  document.getElementById('overviewStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon green"><i class="ri-group-line"></i></div><div class="stat-body"><div class="stat-label">Total Users</div><div class="stat-value">${totalUsers}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Platform members</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="ri-camera-2-line"></i></div><div class="stat-body"><div class="stat-label">Photographers</div><div class="stat-value">${totalPhotographers}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> ${backendPhotographers.filter(p=>p.verified).length} verified</div></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="ri-calendar-check-line"></i></div><div class="stat-body"><div class="stat-label">Active Bookings</div><div class="stat-value">${activeBookings}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Pending + Confirmed</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="ri-coins-line"></i></div><div class="stat-body"><div class="stat-label">Revenue (Completed)</div><div class="stat-value">Rs. ${revenue.toLocaleString('en-IN')}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> From ${backendBookings.filter(b=>b.status==='COMPLETED').length} bookings</div></div></div>
  `;

  const recent = backendUsers.slice(-4).reverse();
  document.getElementById('overviewRecentUsers').innerHTML = recent.map(u => `
    <div class="list-item">
      <div class="list-avatar">${u.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
      <div class="list-body"><div class="list-title">${u.name}</div><div class="list-sub">${u.role} · ${u.email}</div></div>
      ${statusBadge(u.status)}
    </div>
  `).join('');

  const recentBk = backendBookings.slice(0,4);
  document.getElementById('overviewBookingsTable').innerHTML = `
    <thead><tr><th>ID</th><th>Client</th><th>Photographer</th><th>Event</th><th>Amount (Rs.)</th><th>Status</th></tr></thead>
    <tbody>${recentBk.map(b=>`<tr><td>${b.id}</td><td>${b.client}</td><td>${b.photographer}</td><td>${b.eventType}</td><td>${b.amount.toLocaleString('en-IN')}</td><td>${statusBadge(b.status)}</td></tr>`).join('')}</tbody>
  `;
}

// ===== USERS =====
function renderUsers() {
  const search = (document.getElementById('userSearch')||{}).value?.toLowerCase()||'';
  const roleF  = (document.getElementById('userRoleFilter')||{}).value||'';
  const statF  = (document.getElementById('userStatusFilter')||{}).value||'';

  const filtered = backendUsers.filter(u =>
    (!search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)) &&
    (!roleF || u.role === roleF) &&
    (!statF || u.status === statF)
  );

  document.getElementById('userStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon green"><i class="ri-user-line"></i></div><div class="stat-body"><div class="stat-label">Customers</div><div class="stat-value">${backendUsers.filter(u=>u.role==='CUSTOMER').length}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Active users</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="ri-admin-line"></i></div><div class="stat-body"><div class="stat-label">Admins</div><div class="stat-value">${backendUsers.filter(u=>u.role==='ADMIN').length}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Platform staff</div></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="ri-time-line"></i></div><div class="stat-body"><div class="stat-label">Pending</div><div class="stat-value">${backendUsers.filter(u=>u.status==='PENDING').length}</div><div class="stat-change down"><i class="ri-arrow-down-s-line"></i> Needs review</div></div></div>
  `;

  const tbody = filtered.length === 0
    ? `<tr><td colspan="7" class="state-row"><i class="ri-user-unfollow-line"></i>No users found.</td></tr>`
    : filtered.map(u => `
      <tr>
        <td><div style="font-weight:600;">${u.name}</div></td>
        <td>${u.email}</td>
        <td>${u.role}</td>
        <td>${u.joined}</td>
        <td>${u.bookings || '—'}</td>
        <td>${statusBadge(u.status)}</td>
        <td>
          <div class="action-btns">
            <button class="btn-xs view" onclick="viewUser(${u.id})">View</button>
            <button class="btn-xs edit" onclick="editUser(${u.id})">Edit</button>
            ${u.status==='PENDING' ? `<button class="btn-xs success" onclick="approveUser(${u.id})">Approve</button>` : ''}
            ${u.status!=='SUSPENDED' && u.role!=='ADMIN' ? `<button class="btn-xs warn" onclick="suspendUser(${u.id})">Suspend</button>` : ''}
            <button class="btn-xs danger" onclick="deleteUser(${u.id})">Delete</button>
          </div>
        </td>
      </tr>`).join('');

  document.getElementById('usersTable').innerHTML = `
    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Bookings</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${tbody}</tbody>`;
}

function resetUserForm() {
  document.getElementById('uId').value='';
  document.getElementById('uName').value='';
  document.getElementById('uEmail').value='';
  document.getElementById('uRole').value='CUSTOMER';
  document.getElementById('uStatus').value='ACTIVE';
  document.getElementById('modalUserTitle').textContent='Add User';
}

function viewUser(id) {
  const u = backendUsers.find(x=>x.id===id); if(!u) return;
  document.getElementById('modalUserViewBody').innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
      ${[['Name',u.name],['Email',u.email],['Role',u.role],['Status',statusBadge(u.status)],['Joined',u.joined],['Bookings',u.bookings||'—']].map(([k,v])=>`
        <tr style="border-bottom:1px solid var(--gray-100);">
          <td style="padding:10px 8px;font-weight:600;color:var(--gray-500);width:120px;">${k}</td>
          <td style="padding:10px 8px;">${v}</td>
        </tr>`).join('')}
    </table>`;
  openModal('modalUserView');
}

function editUser(id) {
  const u = backendUsers.find(x=>x.id===id); if(!u) return;
  document.getElementById('uId').value = id;
  document.getElementById('uName').value = u.name;
  document.getElementById('uEmail').value = u.email;
  document.getElementById('uRole').value = u.role;
  document.getElementById('uStatus').value = u.status;
  document.getElementById('modalUserTitle').textContent = 'Edit User';
  openModal('modalUser');
}

function saveUser() {
  const id = document.getElementById('uId').value;
  const name = document.getElementById('uName').value.trim();
  const email = document.getElementById('uEmail').value.trim();
  const role = document.getElementById('uRole').value;
  const status = document.getElementById('uStatus').value;
  if (!name || !email) { showToast('Name and email are required.','error'); return; }
  const btn = document.querySelector('#modalUser .btn-primary');
  const original = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ri-loader-4-line spin"></i> Saving...'; }
  if (id) {
    EcoSnapAPI.adminUpdateUserStatus(+id, status).then(() => {
      const u = backendUsers.find(x=>x.id===+id);
      if (u) { u.name=name; u.email=email; u.role=role; u.status=status; }
      showToast('User updated successfully.','success');
      closeModal('modalUser');
      renderUsers();
    }).catch(err => showToast(err.message || 'Could not update user.','error')).finally(()=>{
      if (btn) { btn.innerHTML = original; btn.disabled = false; }
    });
  } else {
    EcoSnapAPI.adminCreateUser({
      fullName: name,
      email: email,
      password: 'Password@123',
      role: role === 'CUSTOMER' ? 'CLIENT' : role,
      status: status || 'ACTIVE'
    }).then(res => {
      backendUsers.unshift({
        id: res && res.id ? res.id : Date.now(),
        name: res && res.fullName ? res.fullName : name,
        email: email,
        role: role,
        status: status,
        joined: new Date().toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}),
        bookings: 0
      });
      showToast('User created successfully.','success');
      closeModal('modalUser');
      renderUsers();
    }).catch(err => showToast(err.message || 'Could not create user.','error')).finally(()=>{
      if (btn) { btn.innerHTML = original; btn.disabled = false; }
    });
  }
}

function approveUser(id) {
  const u = backendUsers.find(x=>x.id===id); if(!u) return;
  confirmAction('Approve User', `Approve "${u.name}" and set their status to ACTIVE?`, () => {
    EcoSnapAPI.adminUpdateUserStatus(id, 'ACTIVE').then(() => {
      u.status = 'ACTIVE';
      showToast(`${u.name} has been approved.`,'success');
      renderUsers();
    }).catch(err => showToast(err.message || 'Could not approve user.','error'));
  });
}

function suspendUser(id) {
  const u = backendUsers.find(x=>x.id===id); if(!u) return;
  confirmAction('Suspend User', `Suspend "${u.name}"? They will lose access to the platform.`, () => {
    EcoSnapAPI.adminUpdateUserStatus(id, 'SUSPENDED').then(() => {
      u.status = 'SUSPENDED';
      showToast(`${u.name} has been suspended.`,'success');
      renderUsers();
    }).catch(err => showToast(err.message || 'Could not suspend user.','error'));
  });
}

function deleteUser(id) {
  const u = backendUsers.find(x=>x.id===id); if(!u) return;
  confirmAction('Delete User', `Permanently delete "${u.name}"? This action cannot be undone.`, () => {
    EcoSnapAPI.adminDeleteUser(id).then(() => {
      backendUsers = backendUsers.filter(x=>x.id!==id);
      showToast(`${u.name} has been deleted.`,'success');
      renderUsers();
    }).catch(err => showToast(err.message || 'Could not delete user.','error'));
  });
}

// ===== PHOTOGRAPHERS =====
function renderPhotographers() {
  const search = (document.getElementById('photoSearch')||{}).value?.toLowerCase()||'';
  const verF   = (document.getElementById('photoVerFilter')||{}).value||'';

  const filtered = backendPhotographers.filter(p =>
    (!search || p.name.toLowerCase().includes(search) || p.location.toLowerCase().includes(search)) &&
    (verF==='' || (verF==='true'?p.verified:(verF==='false'?!p.verified:true)))
  );

  document.getElementById('photoStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon green"><i class="ri-camera-2-line"></i></div><div class="stat-body"><div class="stat-label">Total</div><div class="stat-value">${backendPhotographers.length}</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="ri-checkbox-circle-line"></i></div><div class="stat-body"><div class="stat-label">Verified</div><div class="stat-value">${backendPhotographers.filter(p=>p.verified).length}</div></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="ri-time-line"></i></div><div class="stat-body"><div class="stat-label">Unverified</div><div class="stat-value">${backendPhotographers.filter(p=>!p.verified).length}</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="ri-briefcase-line"></i></div><div class="stat-body"><div class="stat-label">Total Jobs</div><div class="stat-value">${backendPhotographers.reduce((a,p)=>a+p.jobs,0)}</div></div></div>
  `;

  const tbody = filtered.length===0
    ? `<tr><td colspan="7" class="state-row"><i class="ri-camera-off-line"></i>No photographers found.</td></tr>`
    : filtered.map(p=>`
      <tr>
        <td><div style="font-weight:600;">${p.name}</div></td>
        <td>${p.specialization}</td>
        <td>${p.location}</td>
        <td>${p.rating ? `★ ${p.rating}` : '—'}</td>
        <td>${p.jobs}</td>
        <td>${statusBadge(p.verified?'ACTIVE':'PENDING')}</td>
        <td>
          <div class="action-btns">
            <button class="btn-xs view" onclick="viewPhotographer(${p.id})">View</button>
            <button class="btn-xs edit" onclick="editPhotographer(${p.id})">Edit</button>
            ${!p.verified ? `<button class="btn-xs success" onclick="verifyPhotographer(${p.id})">Verify</button>` : ''}
            <button class="btn-xs danger" onclick="deletePhotographer(${p.id})">Delete</button>
          </div>
        </td>
      </tr>`).join('');

  document.getElementById('photographersTable').innerHTML = `
    <thead><tr><th>Name</th><th>Specialization</th><th>Location</th><th>Rating</th><th>Jobs</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${tbody}</tbody>`;
}

function viewPhotographer(id) {
  const p = backendPhotographers.find(x=>x.id===id); if(!p) return;
  document.getElementById('modalPhotoViewBody').innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
      ${[['Name',p.name],['Specialization',p.specialization],['Experience',`${p.expYears} years`],['Rate',`Rs. ${p.hourlyRate}/hr`],['Location',p.location],['Rating',p.rating?`★ ${p.rating}`:'Not rated yet'],['Total Jobs',p.jobs],['Verified',p.verified?'Yes':'No'],['Bio',p.bio]].map(([k,v])=>`
        <tr style="border-bottom:1px solid var(--gray-100);">
          <td style="padding:9px 8px;font-weight:600;color:var(--gray-500);width:120px;vertical-align:top;">${k}</td>
          <td style="padding:9px 8px;">${v}</td>
        </tr>`).join('')}
    </table>`;
  openModal('modalPhotoView');
}

function editPhotographer(id) {
  const p = backendPhotographers.find(x=>x.id===id); if(!p) return;
  document.getElementById('phId').value = id;
  document.getElementById('phSpec').value = p.specialization;
  document.getElementById('phExp').value = p.expYears;
  document.getElementById('phRate').value = p.hourlyRate;
  document.getElementById('phLoc').value = p.location;
  document.getElementById('phBio').value = p.bio;
  document.getElementById('modalPhotoTitle').textContent = `Edit — ${p.name}`;
  openModal('modalPhotographer');
}

function savePhotographer() {
  const id = +document.getElementById('phId').value;
  const p = backendPhotographers.find(x=>x.id===id); if(!p) return;
  const data = {
    specialization: document.getElementById('phSpec').value.trim(),
    experienceYears: +document.getElementById('phExp').value,
    hourlyRate: +document.getElementById('phRate').value,
    location: document.getElementById('phLoc').value.trim(),
    bio: document.getElementById('phBio').value.trim()
  };
  EcoSnapAPI.adminUpdatePhotographer(id, data).then(() => {
    p.specialization = data.specialization;
    p.expYears = data.experienceYears;
    p.hourlyRate = data.hourlyRate;
    p.location = data.location;
    p.bio = data.bio;
    closeModal('modalPhotographer');
    showToast(`${p.name}'s profile updated.`,'success');
    renderPhotographers();
  }).catch(err => showToast(err.message || 'Could not update photographer.','error'));
}

function verifyPhotographer(id) {
  const p = backendPhotographers.find(x=>x.id===id); if(!p) return;
  confirmAction('Verify Photographer', `Mark "${p.name}" as a verified photographer on ECO SNAP?`, () => {
    EcoSnapAPI.adminVerifyPhotographer(id).then(() => {
      p.verified = true;
      showToast(`${p.name} is now verified.`,'success');
      renderPhotographers();
    }).catch(err => showToast(err.message || 'Could not verify photographer.','error'));
  });
}

function deletePhotographer(id) {
  const p = backendPhotographers.find(x=>x.id===id); if(!p) return;
  confirmAction('Delete Photographer', `Permanently remove "${p.name}" from the platform?`, () => {
    EcoSnapAPI.adminDeletePhotographer(id).then(() => {
      backendPhotographers = backendPhotographers.filter(x=>x.id!==id);
      showToast(`${p.name} has been removed.`,'success');
      renderPhotographers();
    }).catch(err => showToast(err.message || 'Could not delete photographer.','error'));
  });
}

// ===== BOOKINGS =====
function renderBookings() {
  // Error state with retry when the bookings fetch failed.
  if (bookingsLoadFailed) {
    document.getElementById('bookingStats').innerHTML='';
    document.getElementById('bookingsTable').innerHTML=`<tbody><tr><td colspan="8" class="state-row" style="color:var(--error);"><i class="ri-error-warning-line"></i> Could not load bookings. <button class="btn-xs edit" onclick="retryLoadBookings()">Retry</button></td></tr></tbody>`;
    return;
  }
  const search = (document.getElementById('bookingSearch')||{}).value?.toLowerCase()||'';
  const statF  = (document.getElementById('bookingStatusFilter')||{}).value||'';

  const filtered = backendBookings.filter(b =>
    (!search || b.client.toLowerCase().includes(search) || b.photographer.toLowerCase().includes(search)) &&
    (!statF || b.status === statF)
  );

  const byStat = s => backendBookings.filter(b=>b.status===s).length;
  document.getElementById('bookingStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon green"><i class="ri-calendar-check-line"></i></div><div class="stat-body"><div class="stat-label">Confirmed</div><div class="stat-value">${byStat('CONFIRMED')}</div></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="ri-time-line"></i></div><div class="stat-body"><div class="stat-label">Pending</div><div class="stat-value">${byStat('PENDING')}</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="ri-checkbox-circle-line"></i></div><div class="stat-body"><div class="stat-label">Completed</div><div class="stat-value">${byStat('COMPLETED')}</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="ri-close-circle-line"></i></div><div class="stat-body"><div class="stat-label">Cancelled</div><div class="stat-value">${byStat('CANCELLED')}</div></div></div>
  `;

  const tbody = filtered.length===0
    ? `<tr><td colspan="8" class="state-row"><i class="ri-calendar-close-line"></i>No bookings found.</td></tr>`
    : filtered.map(b=>`
      <tr>
        <td>${b.id}</td>
        <td>${b.client}</td>
        <td>${b.photographer}</td>
        <td>${b.eventType}</td>
        <td>${fmtDate(b.eventDate)}</td>
        <td>Rs. ${b.amount.toLocaleString('en-IN')}</td>
        <td>${statusBadge(b.status)}</td>
        <td>
          ${busyBookingId===String(b.id)
            ? `<span style="font-size:.78rem;color:var(--gray-500);white-space:nowrap;"><i class="ri-loader-4-line spin"></i> Working...</span>`
            : `<div class="action-btns">
            <button class="btn-xs view" onclick="viewBooking('${b.id}')">View</button>
            ${b.status==='CONFIRMED' ? `<button class="btn-xs warn" onclick="adminCancelBooking('${b.id}')">Cancel</button>` : ''}
            ${b.status==='CONFIRMED' ? `<button class="btn-xs success" onclick="adminCompleteBooking('${b.id}')">Complete</button>` : ''}
          </div>`}
        </td>
      </tr>`).join('');

  document.getElementById('bookingsTable').innerHTML = `
    <thead><tr><th>ID</th><th>Client</th><th>Photographer</th><th>Event</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${tbody}</tbody>`;
}

function viewBooking(id) {
  // ids arrive as strings from onclick — compare loosely typed
  const b = backendBookings.find(x=>String(x.id)===String(id)); if(!b) return;
  document.getElementById('modalBookingViewBody').innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
      ${[['Booking ID',b.id],['Client',b.client],['Photographer',b.photographer],['Event Type',b.eventType],['Event Date',fmtDate(b.eventDate)],['Amount',`Rs. ${b.amount.toLocaleString('en-IN')}`],['Status',statusBadge(b.status)],['Notes',b.notes||'—']].map(([k,v])=>`
        <tr style="border-bottom:1px solid var(--gray-100);">
          <td style="padding:9px 8px;font-weight:600;color:var(--gray-500);width:130px;">${k}</td>
          <td style="padding:9px 8px;">${v}</td>
        </tr>`).join('')}
    </table>`;
  openModal('modalBookingView');
}

function adminCancelBooking(id) {
  // ids arrive as strings from onclick — compare loosely typed
  const b = backendBookings.find(x=>String(x.id)===String(id)); if(!b) return;
  confirmAction('Cancel Booking', `Cancel booking ${id} for ${b.client}? This cannot be undone.`, () => {
    busyBookingId = String(id);
    renderBookings();
    EcoSnapAPI.adminBookingAction(id, { status: 'CANCELLED' }).then(() => {
      showToast(`Booking ${id} cancelled.`,'success');
      // Re-fetch so the booking log reflects server truth.
      return loadBookings();
    }).then(() => {
      busyBookingId = null;
      renderBookings();
      renderOverview();
    }).catch(err => {
      busyBookingId = null;
      renderBookings();
      showToast(err.message || 'Could not cancel booking.','error');
    });
  });
}

function adminCompleteBooking(id) {
  // ids arrive as strings from onclick — compare loosely typed
  const b = backendBookings.find(x=>String(x.id)===String(id)); if(!b) return;
  confirmAction('Mark as Completed', `Mark booking ${id} for ${b.client} as COMPLETED?`, () => {
    busyBookingId = String(id);
    renderBookings();
    EcoSnapAPI.adminBookingAction(id, { status: 'COMPLETED' }).then(() => {
      showToast(`Booking ${id} marked as completed.`,'success');
      // Re-fetch so the booking log reflects server truth.
      return loadBookings();
    }).then(() => {
      busyBookingId = null;
      renderBookings();
      renderOverview();
    }).catch(err => {
      busyBookingId = null;
      renderBookings();
      showToast(err.message || 'Could not complete booking.','error');
    });
  });
}

// Retry helper for the bookings table error state.
async function retryLoadBookings(){
  const table=document.getElementById('bookingsTable');
  if(table) table.innerHTML='<tbody><tr><td colspan="8" class="state-row"><i class="ri-loader-4-line spin"></i> Loading bookings...</td></tr></tbody>';
  try { await loadBookings(); } catch(e) { /* bookingsLoadFailed already set */ }
  renderBookings();
  renderOverview();
}

// ===== REVIEWS =====
function renderReviews() {
  const search = (document.getElementById('reviewSearch')||{}).value?.toLowerCase()||'';
  const filtered = backendReviews.filter(r =>
    !search || r.customerName.toLowerCase().includes(search) || r.photographerName.toLowerCase().includes(search)
  );

  const tbody = filtered.length===0
    ? `<tr><td colspan="6" class="state-row"><i class="ri-star-off-line"></i>No reviews found.</td></tr>`
    : filtered.map(r=>`
      <tr>
        <td>${r.customerName}</td>
        <td>${r.photographerName}</td>
        <td><span style="color:#f59e0b;font-weight:700;">${starRating(r.rating)}</span> ${r.rating}/5</td>
        <td style="max-width:280px;">${r.comment}</td>
        <td>${fmtDate(r.date)}</td>
        <td><button class="btn-xs danger" onclick="deleteReview(${r.id})">Delete</button></td>
      </tr>`).join('');

  document.getElementById('reviewsTable').innerHTML = `
    <thead><tr><th>Customer</th><th>Photographer</th><th>Rating</th><th>Comment</th><th>Date</th><th>Action</th></tr></thead>
    <tbody>${tbody}</tbody>`;
}

function deleteReview(id) {
  const r = backendReviews.find(x=>x.id===id); if(!r) return;
  confirmAction('Delete Review', `Remove this review by ${r.customerName}? This is a moderation action.`, () => {
    EcoSnapAPI.adminDeleteReview(id).then(() => {
      backendReviews = backendReviews.filter(x=>x.id!==id);
      showToast('Review removed.','success');
      renderReviews();
    }).catch(err => showToast(err.message || 'Could not delete review.','error'));
  });
}

// ===== NOTICES =====
function renderNotices() {
  const tbody = backendNotices.length===0
    ? `<tr><td colspan="5" class="state-row"><i class="ri-notification-off-line"></i>No notices posted yet.</td></tr>`
    : backendNotices.map(n=>`
      <tr>
        <td>NT-${n.id}</td>
        <td style="font-weight:600;">${n.title}</td>
        <td>${statusBadge(n.targetRole==='ALL'?'ACTIVE':n.targetRole==='CUSTOMER'?'CONFIRMED':'PENDING')}<span style="font-size:.75rem;margin-left:4px;">${n.targetRole}</span></td>
        <td>${fmtDate(n.postedAt)}</td>
        <td><button class="btn-xs danger" onclick="deleteNotice(${n.id})">Delete</button></td>
      </tr>`).join('');

  document.getElementById('noticesTable').innerHTML = `
    <thead><tr><th>ID</th><th>Title</th><th>Target</th><th>Posted</th><th>Action</th></tr></thead>
    <tbody>${tbody}</tbody>`;
}

function saveNotice() {
  const title = document.getElementById('nTitle').value.trim();
  const message = document.getElementById('nMessage').value.trim();
  const targetRole = document.getElementById('nTarget').value;
  if (!title || !message) { showToast('Title and message are required.','error'); return; }
  EcoSnapAPI.adminPostNotice({ title, message, targetRole }).then(res => {
    backendNotices.unshift({
      id: res && res.id ? res.id : Date.now(),
      title,
      message,
      targetRole,
      postedAt: new Date().toISOString().split('T')[0]
    });
    closeModal('modalNotice');
    showToast('Notice posted and sent to users.','success');
    renderNotices();
  }).catch(err => showToast(err.message || 'Could not post notice.','error'));
}

function deleteNotice(id) {
  const n = backendNotices.find(x=>x.id===id); if(!n) return;
  confirmAction('Delete Notice', `Delete notice "${n.title}"?`, () => {
    backendNotices = backendNotices.filter(x=>x.id!==id);
    showToast('Notice deleted.','success');
    renderNotices();
  });
}

// ===== PASSWORD =====
function changePasswordSettings() {
  const cur = document.getElementById('settingsPwdCurrent').value;
  const nw  = document.getElementById('settingsPwdNew').value;
  const cf  = document.getElementById('settingsPwdConfirm').value;
  if (!cur || !nw || !cf) { showToast('All password fields are required.','error'); return; }
  if (nw !== cf) { showToast('New passwords do not match.','error'); return; }
  if (nw.length < 6) { showToast('Password must be at least 6 characters.','error'); return; }
  EcoSnapAPI.changePassword({ currentPassword: cur, newPassword: nw }).then(() => {
    document.getElementById('settingsPwdCurrent').value='';
    document.getElementById('settingsPwdNew').value='';
    document.getElementById('settingsPwdConfirm').value='';
    showToast('Password updated successfully.','success');
  }).catch(err => showToast(err.message || 'Could not update password.','error'));
}

function changePassword() {
  const cur = document.getElementById('pwdCurrent').value;
  const nw  = document.getElementById('pwdNew').value;
  const cf  = document.getElementById('pwdConfirm').value;
  if (!cur||!nw||!cf) { showToast('All fields required.','error'); return; }
  if (nw!==cf) { showToast('Passwords do not match.','error'); return; }
  EcoSnapAPI.changePassword({ currentPassword: cur, newPassword: nw }).then(() => {
    closeModal('modalPwd');
    showToast('Password changed.','success');
  }).catch(err => showToast(err.message || 'Could not change password.','error'));
}
