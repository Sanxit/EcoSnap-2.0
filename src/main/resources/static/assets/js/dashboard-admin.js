// Admin Dashboard — authentication, section routing, mock CRUD for users, photographers,
// bookings, reviews, notices, and settings.
// Depends on: assets/js/session.js, js/mock-data.js (loaded before this file).

// ===== AUTH =====
const user = EcoSnapSession.requireAuth(['ADMIN']);
if (user) {
  EcoSnapSession.applyToUI(user);
}

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

// ===== MOCK DATA =====
let mockUsers = [
  {id:1, name:'Priya Thapa',    email:'priya.thapa@gmail.com',    role:'CUSTOMER',     status:'ACTIVE',    joined:'Poush 12, 2081', bookings:5},
  {id:2, name:'Binod Thapa',    email:'binod.thapa@gmail.com',    role:'CUSTOMER',     status:'ACTIVE',    joined:'Bhadra 10, 2082', bookings:1},
  {id:3, name:'Bikash Karki',   email:'bikash.karki@mail.com',    role:'CUSTOMER',     status:'ACTIVE',    joined:'Shrawan 18, 2082', bookings:3},
  {id:4, name:'Sunita Basnet',  email:'sunita.basnet@mail.com',   role:'CUSTOMER',     status:'PENDING',   joined:'Ashadh 5, 2082',  bookings:2},
  {id:5, name:'Dipesh Tamang',  email:'dipesh.tamang@mail.com',   role:'CUSTOMER',     status:'SUSPENDED', joined:'Jestha 20, 2082', bookings:0},
  {id:6, name:'Anil Maharjan',  email:'admin@ecosnap.com',        role:'ADMIN',        status:'ACTIVE',    joined:'Baishakh 1, 2081', bookings:0},
  {id:7, name:'Suresh Tamang',  email:'suresh@ecosnap.com',       role:'ADMIN',        status:'ACTIVE',    joined:'Falgun 10, 2081',  bookings:0},
];
let userIdCounter = 8;

let mockPhotographers = [
  {id:1, name:'Sangeeta Shrestha', specialization:'WEDDING, PORTRAIT',   expYears:10, hourlyRate:5000, location:'Kathmandu', bio:'Award-winning wedding photographer. 10+ years of experience.',  verified:true,  rating:4.9, jobs:87},
  {id:2, name:'Roshan Maharjan',   specialization:'CORPORATE, PRODUCT',  expYears:7,  hourlyRate:4000, location:'Lalitpur',  bio:'Corporate and product photography specialist.',                   verified:true,  rating:4.8, jobs:56},
  {id:3, name:'Anjali Gurung',     specialization:'EVENT, PORTRAIT',     expYears:5,  hourlyRate:2500, location:'Pokhara',   bio:'Family & birthday events expert.',                                verified:true,  rating:5.0, jobs:63},
  {id:4, name:'Manish Khadka',     specialization:'CORPORATE, FASHION',  expYears:8,  hourlyRate:3500, location:'Bhaktapur', bio:'Architecture and corporate photography.',                         verified:true,  rating:4.9, jobs:44},
  {id:5, name:'Alisha Shrestha',   specialization:'WEDDING, ENGAGEMENT', expYears:6,  hourlyRate:6000, location:'Chitwan',   bio:'Wedding and engagement specialist in Chitwan.',                   verified:true,  rating:5.0, jobs:52},
  {id:6, name:'Kabita Rai',        specialization:'WILDLIFE, PORTRAIT',  expYears:2,  hourlyRate:2000, location:'Kathmandu', bio:'Nature and travel photographer just starting out.',               verified:false, rating:0,   jobs:0},
  {id:7, name:'Deepa Gurung',      specialization:'PORTRAIT, FASHION',   expYears:3,  hourlyRate:2200, location:'Pokhara',   bio:'Portrait and fashion photography enthusiast.',                    verified:false, rating:0,   jobs:0},
];

let mockBookings = [
  {id:'BK-1091', client:'Priya Thapa',   photographer:'Sangeeta Shrestha', eventType:'WEDDING',    eventDate:'2025-09-07', amount:50000, status:'CONFIRMED',  notes:'Hotel Yak & Yeti, Kathmandu'},
  {id:'BK-1090', client:'Bikash Karki',  photographer:'Manish Khadka',     eventType:'CORPORATE',  eventDate:'2025-09-05', amount:30000, status:'PENDING',    notes:'Himalayan Bank headquarters'},
  {id:'BK-1089', client:'Sunita Basnet', photographer:'Anjali Gurung',     eventType:'BIRTHDAY',   eventDate:'2025-08-30', amount:20000, status:'COMPLETED',  notes:'Pokhara lakeside resort'},
  {id:'BK-1088', client:'Binod Thapa',   photographer:'Roshan Maharjan',   eventType:'CORPORATE',  eventDate:'2025-08-28', amount:35000, status:'CONFIRMED',  notes:'Kumari Hall, Lalitpur'},
  {id:'BK-1087', client:'Priya Thapa',   photographer:'Alisha Shrestha',   eventType:'ENGAGEMENT', eventDate:'2025-08-26', amount:45000, status:'COMPLETED',  notes:'Patan Durbar Square'},
  {id:'BK-1086', client:'Dipesh Tamang', photographer:'Roshan Maharjan',   eventType:'CORPORATE',  eventDate:'2025-08-23', amount:35000, status:'CANCELLED',  notes:'Product launch event'},
  {id:'BK-1085', client:'Bikash Karki',  photographer:'Sangeeta Shrestha', eventType:'WEDDING',    eventDate:'2025-10-15', amount:80000, status:'PENDING',    notes:'Banquet hall, Kathmandu'},
];

let mockReviews = [
  {id:1, customerName:'Priya Thapa',   photographerName:'Sangeeta Shrestha', rating:5, comment:'Absolutely stunning wedding photos. Every moment captured perfectly. Highly recommended!', date:'2025-08-30'},
  {id:2, customerName:'Sunita Basnet', photographerName:'Anjali Gurung',     rating:5, comment:'The birthday shoot was amazing! Anjali was so patient and professional with the kids.', date:'2025-08-28'},
  {id:3, customerName:'Priya Thapa',   photographerName:'Alisha Shrestha',   rating:5, comment:'The engagement shoot at Patan Durbar Square was beyond our expectations. Magazine-quality photos!', date:'2025-08-27'},
  {id:4, customerName:'Bikash Karki',  photographerName:'Manish Khadka',     rating:4, comment:'Very professional service for our corporate event. Timely delivery and great quality.', date:'2025-08-20'},
  {id:5, customerName:'Dipesh Tamang', photographerName:'Roshan Maharjan',   rating:3, comment:'Good photos but delivery was slightly delayed. Would consider again for next time.', date:'2025-08-15'},
];

let mockNotices = [
  {id:1, title:'Platform Maintenance Window',   message:'ECO SNAP will undergo scheduled maintenance on Sep 15, 2025 from 2:00 AM – 4:00 AM NPT. Services may be unavailable during this period.', targetRole:'ALL',          postedAt:'2025-09-10'},
  {id:2, title:'New Payment Gateway — Khalti',  message:'Khalti digital wallet payment is now available for all bookings. Enjoy seamless transactions directly from your wallet.',                 targetRole:'ALL',          postedAt:'2025-09-08'},
  {id:3, title:'Photographer Verification Drive', message:'Submit your updated identification and certification documents by Sept 20, 2025 to maintain your verified status on the platform.',  targetRole:'PHOTOGRAPHER', postedAt:'2025-09-05'},
  {id:4, title:'Festival Season Offer',          message:'Book photographers for Dashain and Tihar events and get a 10% platform fee waiver. Offer valid through October 2025.',                targetRole:'CUSTOMER',     postedAt:'2025-09-01'},
  {id:5, title:'Rate Your Experience',           message:'Share your experience with your photographer after your event. Your reviews help maintain quality standards on ECO SNAP.',            targetRole:'CUSTOMER',     postedAt:'2025-08-28'},
];
let noticeIdCounter = 6;

// ===== HELPERS =====
function statusBadge(s) {
  const map = {CONFIRMED:'confirmed',PENDING:'pending',CANCELLED:'cancelled',COMPLETED:'completed',ACTIVE:'active',SUSPENDED:'inactive',DECLINED:'declined'};
  return `<span class="status-badge ${map[s]||'inactive'}">${s}</span>`;
}
function starRating(r) {
  return r ? '★'.repeat(Math.round(r)) + '☆'.repeat(5-Math.round(r)) : '—';
}
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—'; }

// ===== OVERVIEW =====
function renderOverview() {
  const totalUsers = mockUsers.length;
  const totalPhotographers = mockPhotographers.length;
  const activeBookings = mockBookings.filter(b=>b.status==='CONFIRMED'||b.status==='PENDING').length;
  const revenue = mockBookings.filter(b=>b.status==='COMPLETED').reduce((a,b)=>a+b.amount,0);

  document.getElementById('overviewStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon green"><i class="ri-group-line"></i></div><div class="stat-body"><div class="stat-label">Total Users</div><div class="stat-value">${totalUsers}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Platform members</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="ri-camera-2-line"></i></div><div class="stat-body"><div class="stat-label">Photographers</div><div class="stat-value">${totalPhotographers}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> ${mockPhotographers.filter(p=>p.verified).length} verified</div></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="ri-calendar-check-line"></i></div><div class="stat-body"><div class="stat-label">Active Bookings</div><div class="stat-value">${activeBookings}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Pending + Confirmed</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="ri-coins-line"></i></div><div class="stat-body"><div class="stat-label">Revenue (Completed)</div><div class="stat-value">Rs. ${revenue.toLocaleString('en-IN')}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> From ${mockBookings.filter(b=>b.status==='COMPLETED').length} bookings</div></div></div>
  `;

  const recent = mockUsers.slice(-4).reverse();
  document.getElementById('overviewRecentUsers').innerHTML = recent.map(u => `
    <div class="list-item">
      <div class="list-avatar">${u.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
      <div class="list-body"><div class="list-title">${u.name}</div><div class="list-sub">${u.role} · ${u.email}</div></div>
      ${statusBadge(u.status)}
    </div>
  `).join('');

  const recentBk = mockBookings.slice(0,4);
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

  const filtered = mockUsers.filter(u =>
    (!search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search)) &&
    (!roleF || u.role === roleF) &&
    (!statF || u.status === statF)
  );

  document.getElementById('userStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon green"><i class="ri-user-line"></i></div><div class="stat-body"><div class="stat-label">Customers</div><div class="stat-value">${mockUsers.filter(u=>u.role==='CUSTOMER').length}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Active users</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="ri-admin-line"></i></div><div class="stat-body"><div class="stat-label">Admins</div><div class="stat-value">${mockUsers.filter(u=>u.role==='ADMIN').length}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Platform staff</div></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="ri-time-line"></i></div><div class="stat-body"><div class="stat-label">Pending</div><div class="stat-value">${mockUsers.filter(u=>u.status==='PENDING').length}</div><div class="stat-change down"><i class="ri-arrow-down-s-line"></i> Needs review</div></div></div>
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
  const u = mockUsers.find(x=>x.id===id); if(!u) return;
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
  const u = mockUsers.find(x=>x.id===id); if(!u) return;
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
  if (id) {
    const u = mockUsers.find(x=>x.id===+id);
    if (u) { u.name=name; u.email=email; u.role=role; u.status=status; }
    showToast('User updated successfully.','success');
  } else {
    mockUsers.push({id:userIdCounter++, name, email, role, status, joined:'Bhadra 25, 2082', bookings:0});
    showToast('User created successfully.','success');
  }
  closeModal('modalUser');
  renderUsers();
}

function approveUser(id) {
  const u = mockUsers.find(x=>x.id===id); if(!u) return;
  confirmAction('Approve User', `Approve "${u.name}" and set their status to ACTIVE?`, () => {
    u.status = 'ACTIVE';
    showToast(`${u.name} has been approved.`,'success');
    renderUsers();
  });
}

function suspendUser(id) {
  const u = mockUsers.find(x=>x.id===id); if(!u) return;
  confirmAction('Suspend User', `Suspend "${u.name}"? They will lose access to the platform.`, () => {
    u.status = 'SUSPENDED';
    showToast(`${u.name} has been suspended.`,'success');
    renderUsers();
  });
}

function deleteUser(id) {
  const u = mockUsers.find(x=>x.id===id); if(!u) return;
  confirmAction('Delete User', `Permanently delete "${u.name}"? This action cannot be undone.`, () => {
    mockUsers = mockUsers.filter(x=>x.id!==id);
    showToast(`${u.name} has been deleted.`,'success');
    renderUsers();
  });
}

// ===== PHOTOGRAPHERS =====
function renderPhotographers() {
  const search = (document.getElementById('photoSearch')||{}).value?.toLowerCase()||'';
  const verF   = (document.getElementById('photoVerFilter')||{}).value||'';

  const filtered = mockPhotographers.filter(p =>
    (!search || p.name.toLowerCase().includes(search) || p.location.toLowerCase().includes(search)) &&
    (verF==='' || (verF==='true'?p.verified:(verF==='false'?!p.verified:true)))
  );

  document.getElementById('photoStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon green"><i class="ri-camera-2-line"></i></div><div class="stat-body"><div class="stat-label">Total</div><div class="stat-value">${mockPhotographers.length}</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="ri-checkbox-circle-line"></i></div><div class="stat-body"><div class="stat-label">Verified</div><div class="stat-value">${mockPhotographers.filter(p=>p.verified).length}</div></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="ri-time-line"></i></div><div class="stat-body"><div class="stat-label">Unverified</div><div class="stat-value">${mockPhotographers.filter(p=>!p.verified).length}</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="ri-briefcase-line"></i></div><div class="stat-body"><div class="stat-label">Total Jobs</div><div class="stat-value">${mockPhotographers.reduce((a,p)=>a+p.jobs,0)}</div></div></div>
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
  const p = mockPhotographers.find(x=>x.id===id); if(!p) return;
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
  const p = mockPhotographers.find(x=>x.id===id); if(!p) return;
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
  const p = mockPhotographers.find(x=>x.id===id); if(!p) return;
  p.specialization = document.getElementById('phSpec').value.trim();
  p.expYears = +document.getElementById('phExp').value;
  p.hourlyRate = +document.getElementById('phRate').value;
  p.location = document.getElementById('phLoc').value.trim();
  p.bio = document.getElementById('phBio').value.trim();
  closeModal('modalPhotographer');
  showToast(`${p.name}'s profile updated.`,'success');
  renderPhotographers();
}

function verifyPhotographer(id) {
  const p = mockPhotographers.find(x=>x.id===id); if(!p) return;
  confirmAction('Verify Photographer', `Mark "${p.name}" as a verified photographer on ECO SNAP?`, () => {
    p.verified = true;
    showToast(`${p.name} is now verified.`,'success');
    renderPhotographers();
  });
}

function deletePhotographer(id) {
  const p = mockPhotographers.find(x=>x.id===id); if(!p) return;
  confirmAction('Delete Photographer', `Permanently remove "${p.name}" from the platform?`, () => {
    mockPhotographers = mockPhotographers.filter(x=>x.id!==id);
    showToast(`${p.name} has been removed.`,'success');
    renderPhotographers();
  });
}

// ===== BOOKINGS =====
function renderBookings() {
  const search = (document.getElementById('bookingSearch')||{}).value?.toLowerCase()||'';
  const statF  = (document.getElementById('bookingStatusFilter')||{}).value||'';

  const filtered = mockBookings.filter(b =>
    (!search || b.client.toLowerCase().includes(search) || b.photographer.toLowerCase().includes(search)) &&
    (!statF || b.status === statF)
  );

  const byStat = s => mockBookings.filter(b=>b.status===s).length;
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
          <div class="action-btns">
            <button class="btn-xs view" onclick="viewBooking('${b.id}')">View</button>
            ${b.status==='CONFIRMED' ? `<button class="btn-xs warn" onclick="adminCancelBooking('${b.id}')">Cancel</button>` : ''}
            ${b.status==='CONFIRMED' ? `<button class="btn-xs success" onclick="adminCompleteBooking('${b.id}')">Complete</button>` : ''}
          </div>
        </td>
      </tr>`).join('');

  document.getElementById('bookingsTable').innerHTML = `
    <thead><tr><th>ID</th><th>Client</th><th>Photographer</th><th>Event</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${tbody}</tbody>`;
}

function viewBooking(id) {
  const b = mockBookings.find(x=>x.id===id); if(!b) return;
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
  const b = mockBookings.find(x=>x.id===id); if(!b) return;
  confirmAction('Cancel Booking', `Cancel booking ${id} for ${b.client}? This cannot be undone.`, () => {
    b.status = 'CANCELLED';
    showToast(`Booking ${id} cancelled.`,'success');
    renderBookings();
  });
}

function adminCompleteBooking(id) {
  const b = mockBookings.find(x=>x.id===id); if(!b) return;
  confirmAction('Mark as Completed', `Mark booking ${id} for ${b.client} as COMPLETED?`, () => {
    b.status = 'COMPLETED';
    showToast(`Booking ${id} marked as completed.`,'success');
    renderBookings();
  });
}

// ===== REVIEWS =====
function renderReviews() {
  const search = (document.getElementById('reviewSearch')||{}).value?.toLowerCase()||'';
  const filtered = mockReviews.filter(r =>
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
  const r = mockReviews.find(x=>x.id===id); if(!r) return;
  confirmAction('Delete Review', `Remove this review by ${r.customerName}? This is a moderation action.`, () => {
    mockReviews = mockReviews.filter(x=>x.id!==id);
    showToast('Review removed.','success');
    renderReviews();
  });
}

// ===== NOTICES =====
function renderNotices() {
  const tbody = mockNotices.length===0
    ? `<tr><td colspan="5" class="state-row"><i class="ri-notification-off-line"></i>No notices posted yet.</td></tr>`
    : mockNotices.map(n=>`
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
  mockNotices.unshift({id:noticeIdCounter++, title, message, targetRole, postedAt: new Date().toISOString().split('T')[0]});
  closeModal('modalNotice');
  showToast('Notice posted successfully.','success');
  renderNotices();
}

function deleteNotice(id) {
  const n = mockNotices.find(x=>x.id===id); if(!n) return;
  confirmAction('Delete Notice', `Delete notice "${n.title}"?`, () => {
    mockNotices = mockNotices.filter(x=>x.id!==id);
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
  document.getElementById('settingsPwdCurrent').value='';
  document.getElementById('settingsPwdNew').value='';
  document.getElementById('settingsPwdConfirm').value='';
  showToast('Password updated successfully.','success');
}

function changePassword() {
  const cur = document.getElementById('pwdCurrent').value;
  const nw  = document.getElementById('pwdNew').value;
  const cf  = document.getElementById('pwdConfirm').value;
  if (!cur||!nw||!cf) { showToast('All fields required.','error'); return; }
  if (nw!==cf) { showToast('Passwords do not match.','error'); return; }
  closeModal('modalPwd');
  showToast('Password changed.','success');
}
