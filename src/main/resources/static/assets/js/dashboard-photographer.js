// Photographer Dashboard — authentication, section routing, real backend CRUD for profile,
// portfolio, packages, availability, booking requests, reviews, and notifications.
// Depends on: assets/js/session.js, assets/js/api.js (loaded before this file).

// ===== SHARED STATE =====
// Declared FIRST so hoisted top-level calls below (loadAuth/initHashRoute/loadBackendData)
// never hit the temporal dead zone ("Cannot access 'backend…' before initialization").
let currentUser = null;
let backendBookings = [];
let backendReviews = [];
let backendPortfolio = [];
let backendPackages = [];
let backendAvailability = [];
let backendNotifications = [];
let profile = null;
let bookingsLoadFailed = false;   // set when GET /photographer/bookings fails
let busyBookingId = null;         // id of the booking row currently being actioned
let activeTab = 'All';            // active filter tab in the Booking Requests section

// ===== AUTH =====
// Server session is cookie-based; we verify it async and fall back gracefully.
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

// ===== SECTIONS =====
const SECTIONS = ['home','profile','portfolio','packages','availability','requests','reviews','notifications'];
const SECTION_TITLES = {home:'Home',profile:'My Profile',portfolio:'Portfolio',packages:'Packages',availability:'Availability',requests:'Booking Requests',reviews:'Reviews',notifications:'Notifications'};
let currentSection = 'home';

function showSection(id, linkEl) {
  if (!SECTIONS.includes(id)) return;
  currentSection = id;
  SECTIONS.forEach(s => {
    const el = document.getElementById('section-' + s);
    if (el) el.style.display = (s===id)?'':'none';
  });
  document.getElementById('topbarTitle').textContent = SECTION_TITLES[id]||id;
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');
  else { const nl=document.getElementById('nav-'+id); if(nl)nl.classList.add('active'); }
  if (window.location.hash!=='#'+id) history.replaceState(null,'','#'+id);
  closeSidebar();
  const renders={home:renderHome,portfolio:renderPortfolio,packages:renderPackages,availability:renderAvailability,requests:renderRequests,reviews:renderReviews,notifications:renderNotifications};
  if(renders[id]) renders[id]();
}

function initHashRoute(){
  const hash=window.location.hash.replace('#','');
  if(hash&&SECTIONS.includes(hash)) showSection(hash,null);
  else renderHome();
}
window.addEventListener('hashchange',()=>{
  const hash=window.location.hash.replace('#','');
  if(hash&&SECTIONS.includes(hash)&&hash!==currentSection) showSection(hash,null);
});
initHashRoute();

function toggleSidebar(){document.getElementById('sidebar').classList.toggle('open');document.getElementById('sidebarOverlay').classList.toggle('open');}
function closeSidebar(){document.getElementById('sidebar').classList.remove('open');document.getElementById('sidebarOverlay').classList.remove('open');}

// ===== MODAL =====
function openModal(id){document.getElementById(id).classList.add('open');}
function closeModal(id){document.getElementById(id).classList.remove('open');}

// ===== TOAST =====
function showToast(msg,type='success'){
  const c=document.getElementById('toastContainer');
  const t=document.createElement('div');
  t.className=`toast ${type}`;
  t.innerHTML=`<i class="ri-${type==='success'?'check-circle':'error-warning'}-line"></i> ${msg}`;
  c.appendChild(t);setTimeout(()=>t.remove(),3200);
}

// ===== CONFIRM =====
function confirmAction(title,msg,cb){
  document.getElementById('confirmTitle').textContent=title;
  document.getElementById('confirmMsg').textContent=msg;
  const btn=document.getElementById('confirmOkBtn');
  btn.onclick=()=>{closeModal('modalConfirm');cb();};
  openModal('modalConfirm');
}

// ===== BACKEND DATA (replaces mock data; falls back to empty arrays on failure) =====
function fmtMoney(n) { return 'Rs. ' + (Number(n) || 0).toLocaleString('en-IN'); }
function initials(name) {
  const parts = (name || '').trim().split(/\s+/);
  return parts.length ? parts.slice(0,2).map(p => p[0].toUpperCase()).join('') : '?';
}
function isPast(d) { return new Date(d) < new Date(); }
// Date-only "has the event date passed" check — true only from the day AFTER the event,
// so the Complete button never appears on the event day itself.
function isDatePast(d) {
  if (!d) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(d + 'T00:00:00') < today;
}
// Shared formatting helpers (were missing on this page and crashed renderRequests/renderHome).
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—'; }
function statusBadge(s) {
  const map={CONFIRMED:'confirmed',PENDING:'pending',CANCELLED:'cancelled',COMPLETED:'completed',ACTIVE:'active',DECLINED:'declined'};
  return `<span class="status-badge ${map[s]||'inactive'}">${s}</span>`;
}

// Targeted re-fetch helpers — keep every view in sync with server truth.
async function loadBookings() {
  if (!window.EcoSnapAPI) return;
  try {
    const bookings = await EcoSnapAPI.photographerBookings();
    bookingsLoadFailed = false;
    backendBookings = (bookings || []).map(b => ({
      id: b.id,
      client: b.customerName || b.client || '',
      eventType: b.eventType || '',
      eventDate: b.eventDate || '',
      timeSlot: b.timeSlot || '',
      package: b.packageName || b.package || '-',
      amount: b.amount || 0,
      netPayout: Math.round((Number(b.amount) || 0) * 0.9),
      status: b.status || 'PENDING',
      notes: b.notes || ''
    }));
  } catch (e) {
    bookingsLoadFailed = true;
    console.error('[EcoSnap] loadBookings failed', e);
    throw e;
  }
}

// Re-fetch availability slots and re-render the availability views.
async function loadAvailability() {
  if (!window.EcoSnapAPI) return;
  try {
    const slots = await EcoSnapAPI.ownAvailability();
    backendAvailability = (slots || []).map(s => ({
      id: s.id,
      date: s.date || '',
      timeSlot: s.timeSlot || '',
      isBooked: s.booked === true || s.isBooked === true
    }));
    renderAvailability();
  } catch (e) {
    console.warn('[EcoSnap] availability re-fetch failed', e);
  }
}

async function loadBackendData() {
  if (!window.EcoSnapAPI) return;

  // Initial loading state for the booking requests table.
  const reqTable = document.getElementById('requestsTable');
  if (reqTable) reqTable.innerHTML = '<tbody><tr><td colspan="8" class="state-row"><i class="ri-loader-4-line spin"></i> Loading booking requests...</td></tr></tbody>';

  try {
    // loadBookings() assigns backendBookings internally; its resolved value
    // (undefined on success, null on failure) is destructured here only to
    // keep positional alignment with the other fetches below.
    const [bookings, reviews, portfolio, packages, slots, notifications, me] = await Promise.all([
      loadBookings().catch(() => null),
      EcoSnapAPI.photographerReviews().catch(() => []),
      EcoSnapAPI.ownPortfolio().catch(() => []),
      EcoSnapAPI.ownPackages().catch(() => []),
      EcoSnapAPI.ownAvailability().catch(() => []),
      EcoSnapAPI.photographerNotifications().catch(() => []),
      EcoSnapAPI.ownProfile().catch(() => null)
    ]);

if (me) {
      profile = {
        id: me.id,
        ownerName: me.ownerName || '',
        specialization: me.specialization || '',
        location: me.location || '',
        experienceYears: me.experienceYears || 0,
        hourlyRate: me.hourlyRate || 0,
        bio: me.bio || '',
        avatarUrl: me.avatarUrl || '',
        coverImageUrl: me.coverImageUrl || '',
        responseHours: me.responseHours || 24,
        verified: me.verified === true,
        reviewCount: me.reviewCount || 0,
        rating: me.rating || 0
      };
    }

    backendReviews = (reviews || []).map(r => ({
      id: r.id,
      clientName: r.customerName || r.clientName || '',
      rating: r.rating || 0,
      comment: r.comment || '',
      date: (r.createdAt || '').split('T')[0] || r.date || ''
    }));

    backendPortfolio = (portfolio || []).map(p => ({
      id: p.id,
      caption: p.caption || '',
      category: (p.category || '').toUpperCase() || 'EVENT',
      imageUrl: p.imageUrl || ''
    }));

    backendPackages = (packages || []).map(p => ({
      id: p.id,
      packageName: p.name || p.packageName || '',
      name: p.name || p.packageName || '',
      category: (p.category || '').toUpperCase() || 'EVENT',
      description: p.description || '',
      price: p.price || 0,
      durationHours: p.durationHours || 0
    }));

    backendAvailability = (slots || []).map(s => ({
      id: s.id,
      date: s.date || '',
      timeSlot: s.timeSlot || '',
      isBooked: s.booked === true || s.isBooked === true
    }));

    backendNotifications = (notifications || []).map(n => ({
      id: n.id,
      message: n.message || '',
      isRead: n.read === true,
      createdAt: n.createdAt || ''
    }));

    renderHome();
    renderPortfolio();
    renderPackages();
    renderAvailability();
    renderRequests();
    renderReviews();
    renderNotifications();
    renderProfile();
  } catch (e) {
    console.warn('Backend data load failed', e);
  }
}

loadBackendData();

// ===== HOME =====
function renderHome(){
  const completed=backendBookings.filter(b=>b.status==='COMPLETED');
  const monthlyEarnings=completed.reduce((a,b)=>a+(b.netPayout||0),0);
  const monthlyJobs=completed.length;
  const avgRating=backendReviews.length?(backendReviews.reduce((a,r)=>a+r.rating,0)/backendReviews.length).toFixed(1):0;
  const profileViews = profile && profile.reviewCount
    ? (profile.reviewCount * 85 + backendBookings.length * 40 + (backendPortfolio.length * 15))
    : (backendBookings.length * 30 + backendPortfolio.length * 10);

  document.getElementById('homeStats').innerHTML=`
    <div class="stat-card"><div class="stat-icon green"><i class="ri-coins-line"></i></div><div class="stat-body"><div class="stat-label">Earnings (Completed)</div><div class="stat-value">Rs. ${monthlyEarnings.toLocaleString('en-IN')}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> From ${monthlyJobs} jobs</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="ri-calendar-check-line"></i></div><div class="stat-body"><div class="stat-label">Pending Requests</div><div class="stat-value">${backendBookings.filter(b=>b.status==='PENDING').length}</div><div class="stat-change down"><i class="ri-arrow-down-s-line"></i> Action needed</div></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="ri-star-line"></i></div><div class="stat-body"><div class="stat-label">Avg Rating</div><div class="stat-value">${avgRating||'—'}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> ${backendReviews.length} reviews</div></div></div>
    <div class="stat-card"><div class="stat-icon purple"><i class="ri-eye-line"></i></div><div class="stat-body"><div class="stat-label">Profile Views</div><div class="stat-value">${profileViews.toLocaleString()}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> This month</div></div></div>
  `;

  const nextJob=backendBookings.find(b=>b.status==='CONFIRMED'&&!isDatePast(b.eventDate));
  if(nextJob){
    document.getElementById('nextJobBanner').innerHTML=`
      <div class="dash-card" style="margin-bottom:20px;background:linear-gradient(135deg,var(--primary-black) 0%,#2d2d2d 100%);border:none;color:#fff;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <div style="font-size:.78rem;font-weight:700;color:var(--primary-light);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Next Job</div>
            <div style="font-size:1.3rem;font-weight:700;margin-bottom:6px;">${nextJob.eventType} — ${nextJob.client}</div>
            <div style="opacity:.7;font-size:.9rem;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <i class="ri-calendar-event-line"></i> ${fmtDate(nextJob.eventDate)} &nbsp;|&nbsp;
              <i class="ri-map-pin-line"></i> ${nextJob.notes} &nbsp;|&nbsp;
              <i class="ri-briefcase-line"></i> ${nextJob.package}
            </div>
          </div>
          <button style="background:var(--primary-color);color:#fff;font-weight:700;padding:10px 22px;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:.9rem;" onclick="showSection('requests',null)">View Details</button>
        </div>
      </div>`;
  } else {
    document.getElementById('nextJobBanner').innerHTML='';
  }

  const upcoming=backendBookings.filter(b=>b.status==='CONFIRMED'&&!isDatePast(b.eventDate));
  document.getElementById('homeUpcomingJobs').innerHTML=upcoming.length===0
    ? `<div class="state-row"><i class="ri-calendar-close-line"></i>No upcoming confirmed jobs.</div>`
    : upcoming.slice(0,3).map(b=>`
      <div class="list-item">
        <div class="list-avatar" style="background:var(--primary-accent);color:var(--primary-color);">${b.eventType[0]}</div>
        <div class="list-body"><div class="list-title">${b.eventType} — ${b.client}</div><div class="list-sub">${fmtDate(b.eventDate)} · ${b.package} · Rs. ${b.netPayout.toLocaleString('en-IN')}</div></div>
        ${statusBadge(b.status)}
      </div>`).join('');

  document.getElementById('homeLatestReviews').innerHTML=backendReviews.slice(0,2).map(r=>`
    <div style="background:var(--gray-50);border-radius:var(--radius-md);padding:14px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <div class="list-avatar" style="width:32px;height:32px;font-size:.75rem;">${r.clientName.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
        <div>
          <div style="font-weight:600;font-size:.85rem;">${r.clientName}</div>
          <div class="review-stars" style="font-size:.8rem;">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
        </div>
        <div style="margin-left:auto;font-size:.75rem;color:var(--gray-500);">${fmtDate(r.date)}</div>
      </div>
      <p style="font-size:.82rem;color:var(--gray-600);line-height:1.5;">"${r.comment.slice(0,120)}${r.comment.length>120?'...':''}"</p>
    </div>`).join('');

  updateBadges();
}

// ===== PORTFOLIO =====
function renderPortfolio(){
  const thumbColors=['linear-gradient(135deg,#009245,#00b555)','linear-gradient(135deg,#8b5cf6,#a78bfa)','linear-gradient(135deg,#3b82f6,#60a5fa)','linear-gradient(135deg,#f59e0b,#fbbf24)','linear-gradient(135deg,#ec4899,#f9a8d4)','linear-gradient(135deg,#0ea5e9,#38bdf8)'];

  document.getElementById('portfolioGrid').innerHTML=
    backendPortfolio.map((p,i)=>`
      <div class="portfolio-card">
        <div class="thumb" style="${p.imageUrl ? `background-image:url('${p.imageUrl}');background-size:cover;background-position:center;` : `background:${thumbColors[i%thumbColors.length]};`}">
          ${!p.imageUrl ? `<i class="ri-image-line" style="font-size:2rem;color:rgba(255,255,255,.7);"></i>` : ''}
        </div>
        <div class="caption-bar">
          <span class="caption" title="${p.caption}">${p.caption}</span>
          <div class="action-btns">
            <button class="btn-xs edit" onclick="openEditCaption(${p.id})">Edit</button>
            <button class="btn-xs danger" onclick="deletePortfolioItem(${p.id})">Del</button>
          </div>
        </div>
        <div style="padding:0 12px 10px;font-size:.72rem;color:var(--gray-400);">${p.category}</div>
      </div>`).join('') +
    `<div class="portfolio-add" onclick="openUploadModal()">
      <i class="ri-add-line" style="font-size:1.8rem;"></i>
      <div style="font-size:.8rem;font-weight:600;">Upload Image</div>
    </div>`;
}

function openUploadModal(){
  document.getElementById('pfId').value='';
  document.getElementById('pfCaption').value='';
  const imgUrlField = document.getElementById('pfImageUrl');
  if (imgUrlField) imgUrlField.value='';
  document.getElementById('pfCategory').value='WEDDING';
  document.getElementById('modalPortfolioTitle').textContent='Upload Image';
  openModal('modalPortfolio');
}

function savePortfolioItem(){
  const caption=document.getElementById('pfCaption').value.trim();
  const category=document.getElementById('pfCategory').value;
  const imgUrlField=document.getElementById('pfImageUrl');
  let imageUrl = imgUrlField ? imgUrlField.value.trim() : '';

  if (!imageUrl) {
    const presets = {
      WEDDING: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=80',
      EVENT: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&auto=format&fit=crop&q=80',
      PORTRAIT: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80',
      PRODUCT: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      FASHION: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
      WILDLIFE: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&auto=format&fit=crop&q=80'
    };
    imageUrl = presets[category] || presets.WEDDING;
  }

  if(!caption){showToast('Caption is required.','error');return;}
  const btn=document.querySelector('#modalPortfolio .btn-primary');
  const original=btn?btn.innerHTML:'';
  if(btn){btn.disabled=true;btn.innerHTML='<i class="ri-loader-4-line spin"></i> Saving...';}
  EcoSnapAPI.createPortfolio({ caption: caption, category: category, imageUrl: imageUrl, sortOrder: 0 }).then(res => {
    backendPortfolio.unshift({
      id: res ? res.id : Date.now(),
      caption: caption,
      category: category,
      imageUrl: (res && res.imageUrl) || imageUrl
    });
    closeModal('modalPortfolio');
    showToast('Image uploaded to portfolio.','success');
    renderPortfolio();
  }).catch(err => showToast(err.message || 'Could not upload portfolio image.','error')).finally(()=>{
    if(btn){btn.innerHTML=original;btn.disabled=false;}
  });
}

function openEditCaption(id){
  const p=backendPortfolio.find(x=>String(x.id)===String(id)); if(!p) return;
  document.getElementById('captionId').value=id;
  document.getElementById('captionText').value=p.caption;
  openModal('modalCaption');
}

function saveCaption(){
  const id=document.getElementById('captionId').value;
  const p=backendPortfolio.find(x=>String(x.id)===String(id)); if(!p) return;
  const caption=document.getElementById('captionText').value.trim();
  if(!caption){showToast('Caption cannot be empty.','error');return;}
  EcoSnapAPI.updatePortfolio(id, { caption: caption, imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800', category: p.category, sortOrder: 0 }).then(() => {
    p.caption=caption;
    closeModal('modalCaption');
    showToast('Caption updated.','success');
    renderPortfolio();
  }).catch(err => showToast(err.message || 'Could not update caption.','error'));
}

function deletePortfolioItem(id){
  const p=backendPortfolio.find(x=>String(x.id)===String(id)); if(!p) return;
  confirmAction('Delete Image',`Remove "${p.caption}" from your portfolio?`,()=>{
    EcoSnapAPI.deletePortfolio(id).then(() => {
      backendPortfolio=backendPortfolio.filter(x=>String(x.id)!==String(id));
      showToast('Image removed from portfolio.','success');
      renderPortfolio();
    }).catch(err => showToast(err.message || 'Could not delete image.','error'));
  });
}

// ===== PACKAGES =====
function renderPackages(){
  const tbody=backendPackages.length===0
    ?`<tr><td colspan="6" class="state-row"><i class="ri-price-tag-off-line"></i>No packages yet. Add your first package!</td></tr>`
    :backendPackages.map(p=>`
      <tr>
        <td>PKG-${p.id}</td>
        <td><div style="font-weight:600;">${p.packageName}</div></td>
        <td>${p.category}</td>
        <td>Rs. ${p.price.toLocaleString('en-IN')}</td>
        <td>${p.durationHours} hr${p.durationHours>1?'s':''}</td>
        <td>
          <div class="action-btns">
            <button class="btn-xs edit" onclick="editPackage(${p.id})">Edit</button>
            <button class="btn-xs danger" onclick="deletePackage(${p.id})">Delete</button>
          </div>
        </td>
      </tr>`).join('');

  document.getElementById('packagesTable').innerHTML=`
    <thead><tr><th>ID</th><th>Package Name</th><th>Category</th><th>Price</th><th>Duration</th><th>Actions</th></tr></thead>
    <tbody>${tbody}</tbody>`;
}

function openNewPackage(){
  document.getElementById('pkgId').value='';
  document.getElementById('pkgName').value='';
  document.getElementById('pkgCategory').value='WEDDING';
  document.getElementById('pkgDesc').value='';
  document.getElementById('pkgPrice').value='';
  document.getElementById('pkgDuration').value='';
  document.getElementById('modalPackageTitle').textContent='Add Package';
  openModal('modalPackage');
}

function editPackage(id){
  const p=backendPackages.find(x=>String(x.id)===String(id)); if(!p) return;
  document.getElementById('pkgId').value=id;
  document.getElementById('pkgName').value=p.packageName || p.name || '';
  document.getElementById('pkgCategory').value=p.category;
  document.getElementById('pkgDesc').value=p.description || '';
  document.getElementById('pkgPrice').value=p.price;
  document.getElementById('pkgDuration').value=p.durationHours;
  document.getElementById('modalPackageTitle').textContent='Edit Package';
  openModal('modalPackage');
}

function savePackage(){
  const id=document.getElementById('pkgId').value;
  const packageName=document.getElementById('pkgName').value.trim();
  const category=document.getElementById('pkgCategory').value;
  const description=document.getElementById('pkgDesc').value.trim();
  const price=+document.getElementById('pkgPrice').value;
  const durationHours=+document.getElementById('pkgDuration').value;
  if(!packageName||isNaN(price)||price<0||isNaN(durationHours)||durationHours<1){
    showToast('Valid name, price, and duration (min 1 hour) are required.','error');
    return;
  }

  const btn=document.querySelector('#modalPackage .btn-primary');
  const original=btn?btn.innerHTML:'';
  if(btn){btn.disabled=true;btn.innerHTML='<i class="ri-loader-4-line spin"></i> Saving...';}

  // Backend DTO requires "name", NOT "packageName"
  const payload = {
    name: packageName,
    category: category,
    description: description,
    price: price,
    durationHours: durationHours,
    active: true
  };

  const savePromise = id
    ? EcoSnapAPI.updatePackage(+id, payload)
    : EcoSnapAPI.createPackage(payload);

  savePromise.then(res => {
    if(id){
      const p=backendPackages.find(x=>String(x.id)===String(id));
      if(p){
        p.packageName=packageName;
        p.name=packageName;
        p.category=category;
        p.description=description;
        p.price=price;
        p.durationHours=durationHours;
      }
      showToast('Package updated.','success');
    } else {
      backendPackages.unshift({
        id: res ? res.id : Date.now(),
        packageName: packageName,
        name: packageName,
        category: category,
        description: description,
        price: price,
        durationHours: durationHours
      });
      showToast('Package created.','success');
    }
    closeModal('modalPackage');
    renderPackages();
  }).catch(err => showToast(err.message || 'Could not save package.','error')).finally(()=>{
    if(btn){btn.innerHTML=original;btn.disabled=false;}
  });
}

function deletePackage(id){
  const p=backendPackages.find(x=>String(x.id)===String(id)); if(!p) return;
  confirmAction('Delete Package',`Delete package "${p.packageName || p.name}"?`,()=>{
    EcoSnapAPI.deletePackage(id).then(() => {
      backendPackages=backendPackages.filter(x=>String(x.id)!==String(id));
      showToast('Package deleted.','success');
      renderPackages();
    }).catch(err => showToast(err.message || 'Could not delete package.','error'));
  });
}

// ===== AVAILABILITY =====
function renderAvailability(){
  const tbody=backendAvailability.length===0
    ?`<tr><td colspan="4" class="state-row"><i class="ri-calendar-close-line"></i>No slots added yet.</td></tr>`
    :backendAvailability.map(s=>`
      <tr>
        <td>${fmtDate(s.date)}</td>
        <td>${s.timeSlot}</td>
        <td>${s.isBooked?statusBadge('CONFIRMED'):statusBadge('ACTIVE')}</td>
        <td>${!s.isBooked?`<button class="btn-xs danger" onclick="deleteSlot(${s.id})">Delete</button>`:'<span style="font-size:.75rem;color:var(--gray-400);">Booked</span>'}</td>
      </tr>`).join('');
  document.getElementById('slotsTable').innerHTML=`
    <thead><tr><th>Date</th><th>Time Slot</th><th>Status</th><th>Action</th></tr></thead>
    <tbody>${tbody}</tbody>`;

  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  document.getElementById('calendarDayHeaders').innerHTML=days.map(d=>`<div style="text-align:center;font-size:.72rem;font-weight:700;color:var(--gray-500);padding:4px;">${d}</div>`).join('');

  const grid=document.getElementById('calendarGrid');
  grid.innerHTML='';

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  const monthName = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const calHeader = document.querySelector('#section-availability .dash-card:last-child .dash-card-header h3');
  if (calHeader) calHeader.textContent = `Calendar View — ${monthName}`;

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const todayNum = today.getDate();

  for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement('div'));

  for(let d=1; d<=totalDays; d++){
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const slots = backendAvailability.filter(s => s.date === dateStr);
    const isBooked = slots.some(s => s.isBooked);
    const hasSlot = slots.length > 0;
    const isPastDay = d < todayNum;

    const cell=document.createElement('div');
    cell.className='avail-day';
    if(isPastDay) cell.classList.add('past');
    else if(isBooked) cell.classList.add('booked');
    else if(hasSlot) cell.classList.add('free');
    else cell.classList.add('partial');

    cell.innerHTML=`<span class="day-num">${d}</span>`;
    if(!isPastDay && !isBooked){
      cell.addEventListener('click',()=>{
        document.getElementById('slotDate').value=dateStr;
        openModal('modalSlot');
      });
    }
    grid.appendChild(cell);
  }
}

function openSlotModal(){
  const todayStr = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('slotDate');
  if (dateInput) {
    dateInput.value = todayStr;
    dateInput.min = todayStr;
  }
  document.getElementById('slotTime').value='MORNING';
  openModal('modalSlot');
}

function saveSlot(){
  const date=document.getElementById('slotDate').value;
  const timeSlot=document.getElementById('slotTime').value;
  if(!date){showToast('Date is required.','error');return;}

  const todayStr = new Date().toISOString().split('T')[0];
  if(date < todayStr){
    showToast('Cannot add a slot for a past date.','error');
    return;
  }
  if(backendAvailability.find(s=>s.date===date&&s.timeSlot===timeSlot)){
    showToast('This slot already exists.','error');
    return;
  }

  const btn=document.querySelector('#modalSlot .btn-primary');
  const original=btn?btn.innerHTML:'';
  if(btn){btn.disabled=true;btn.innerHTML='<i class="ri-loader-4-line spin"></i> Adding...';}

  EcoSnapAPI.createSlot({ date: date, timeSlot: timeSlot }).then(res => {
    backendAvailability.unshift({
      id: res ? res.id : Date.now(),
      date: date,
      timeSlot: timeSlot,
      isBooked: false
    });
    closeModal('modalSlot');
    showToast('Availability slot added.','success');
    renderAvailability();
  }).catch(err => showToast(err.message || 'Could not add slot.','error')).finally(()=>{
    if(btn){btn.innerHTML=original;btn.disabled=false;}
  });
}

function deleteSlot(id){
  confirmAction('Delete Slot','Remove this availability slot?',()=>{
    EcoSnapAPI.deleteSlot(id).then(() => {
      backendAvailability=backendAvailability.filter(x=>String(x.id)!==String(id));
      showToast('Slot removed.','success');
      renderAvailability();
    }).catch(err => showToast(err.message || 'Could not delete slot.','error'));
  });
}

// ===== BOOKING REQUESTS =====
function renderRequests(){
  // Error state with retry when the bookings fetch failed.
  if (bookingsLoadFailed) {
    document.getElementById('requestStats').innerHTML='';
    document.getElementById('requestTabs').innerHTML='';
    document.getElementById('requestsTable').innerHTML=`<tbody><tr><td colspan="8" class="state-row" style="color:var(--error);"><i class="ri-error-warning-line"></i> Could not load booking requests. <button class="btn-xs edit" onclick="retryLoadBookings()">Retry</button></td></tr></tbody>`;
    return;
  }
  const byStat=s=>backendBookings.filter(b=>b.status===s).length;
  document.getElementById('requestStats').innerHTML=`
    <div class="stat-card"><div class="stat-icon amber"><i class="ri-time-line"></i></div><div class="stat-body"><div class="stat-label">Pending</div><div class="stat-value">${byStat('PENDING')}</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="ri-calendar-check-line"></i></div><div class="stat-body"><div class="stat-label">Confirmed</div><div class="stat-value">${byStat('CONFIRMED')}</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="ri-checkbox-circle-line"></i></div><div class="stat-body"><div class="stat-label">Completed</div><div class="stat-value">${byStat('COMPLETED')}</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="ri-close-circle-line"></i></div><div class="stat-body"><div class="stat-label">Cancelled/Declined</div><div class="stat-value">${byStat('CANCELLED')+byStat('DECLINED')}</div></div></div>
  `;

  const tabs=['All','PENDING','CONFIRMED','COMPLETED','CANCELLED'];
  document.getElementById('requestTabs').innerHTML=tabs.map(t=>`
    <button class="tab-btn ${activeTab===t?'active':''}" onclick="setTab('${t}')">${t==='All'?'All':t.charAt(0)+t.slice(1).toLowerCase()}</button>`).join('');

  const filtered=activeTab==='All'?backendBookings:backendBookings.filter(b=>b.status===activeTab);

  const canConfirm=b=>b.status==='PENDING';
  const canDecline=b=>b.status==='PENDING';
  // Complete only appears strictly AFTER the event date has passed.
  const canComplete=b=>b.status==='CONFIRMED'&&isDatePast(b.eventDate);

  const tbody=filtered.length===0
    ?`<tr><td colspan="8" class="state-row"><i class="ri-calendar-close-line"></i>No bookings in this category.</td></tr>`
    :filtered.map(b=>`
      <tr>
        <td>${b.id}</td>
        <td>${b.client}</td>
        <td>${b.eventType}</td>
        <td>${fmtDate(b.eventDate)}</td>
        <td>${b.package}</td>
        <td>Rs. ${b.netPayout.toLocaleString('en-IN')}</td>
        <td>${statusBadge(b.status)}</td>
        <td>
          ${busyBookingId===String(b.id)
            ? `<span style="font-size:.78rem;color:var(--gray-500);white-space:nowrap;"><i class="ri-loader-4-line spin"></i> Working...</span>`
            : `<div class="action-btns">
            ${canConfirm(b)?`<button class="btn-xs success" onclick="confirmBooking('${b.id}')">Confirm</button>`:''}
            ${canDecline(b)?`<button class="btn-xs danger" onclick="openDeclineModal('${b.id}')">Decline</button>`:''}
            ${canComplete(b)?`<button class="btn-xs edit" onclick="completeBooking('${b.id}')">Complete</button>`:''}
          </div>`}
        </td>
      </tr>`).join('');

  document.getElementById('requestsTable').innerHTML=`
    <thead><tr><th>ID</th><th>Client</th><th>Event</th><th>Date</th><th>Package</th><th>Payout</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${tbody}</tbody>`;
}

function setTab(t){activeTab=t;renderRequests();}

function confirmBooking(id){
  const b=backendBookings.find(x=>String(x.id)===String(id)); if(!b) return;
  confirmAction('Confirm Booking',`Confirm booking ${id} for ${b.client} on ${fmtDate(b.eventDate)}?`,()=>{
    busyBookingId=String(id);
    renderRequests();
    EcoSnapAPI.confirmBooking(id).then(res => {
      b.status=(res&&res.status)||'CONFIRMED';
      busyBookingId=null;
      showToast(`Booking ${id} confirmed.`,'success');
      renderRequests();
      renderHome();
      updateBadges();
      // Re-fetch availability + bookings so the slot and every view reflect server truth.
      return Promise.all([loadAvailability(), loadBookings().catch(()=>null)]).then(()=>{renderRequests();renderHome();});
    }).catch(err => {
      busyBookingId=null;
      renderRequests();
      showToast(err.message || 'Could not confirm booking.','error');
    });
  });
}

function openDeclineModal(id){
  document.getElementById('declineId').value=id;
  document.getElementById('declineReason').value='';
  openModal('modalDecline');
}

function confirmDecline(){
  const id=document.getElementById('declineId').value;
  const reason=document.getElementById('declineReason').value.trim();
  if(!reason){showToast('Reason is required to decline.','error');return;}
  const b=backendBookings.find(x=>String(x.id)===String(id)); if(!b) return;
  const btn=document.querySelector('#modalDecline button[onclick="confirmDecline()"]');
  const original=btn?btn.innerHTML:'';
  if(btn){btn.disabled=true;btn.innerHTML='<i class="ri-loader-4-line spin"></i> Declining...';}
  EcoSnapAPI.declineBooking(id, reason).then(res => {
    b.status=(res&&res.status)||'DECLINED';
    b.declineReason=reason;
    closeModal('modalDecline');
    showToast(`Booking ${id} declined.`,'success');
    renderRequests();
    renderHome();
    updateBadges();
    // Re-fetch availability + bookings so every view reflects server truth.
    return Promise.all([loadAvailability(), loadBookings().catch(()=>null)]).then(()=>{renderRequests();renderHome();});
  }).catch(err => {
    showToast(err.message || 'Could not decline booking.','error');
  }).finally(()=>{
    if(btn){btn.innerHTML=original;btn.disabled=false;}
  });
}

function completeBooking(id){
  const b=backendBookings.find(x=>String(x.id)===String(id)); if(!b) return;
  confirmAction('Mark as Completed',`Mark booking ${id} for ${b.client} as COMPLETED?`,()=>{
    busyBookingId=String(id);
    renderRequests();
    EcoSnapAPI.completeBooking(id).then(res => {
      b.status=(res&&res.status)||'COMPLETED';
      busyBookingId=null;
      showToast(`Booking ${id} completed!`,'success');
      renderRequests();
      renderHome();
      updateBadges();
      // Re-fetch bookings so every view reflects server truth.
      return loadBookings().then(()=>{renderRequests();renderHome();}).catch(()=>{});
    }).catch(err => {
      busyBookingId=null;
      renderRequests();
      showToast(err.message || 'Could not complete booking.','error');
    });
  });
}

// Retry helper for the requests table error state.
async function retryLoadBookings(){
  const table=document.getElementById('requestsTable');
  if(table) table.innerHTML='<tbody><tr><td colspan="8" class="state-row"><i class="ri-loader-4-line spin"></i> Loading booking requests...</td></tr></tbody>';
  try { await loadBookings(); } catch(e) { /* bookingsLoadFailed already set */ }
  renderRequests();
  renderHome();
}

// ===== REVIEWS =====
function renderReviews(){
  if(!backendReviews.length){
    document.getElementById('reviewSummaryCard').innerHTML=`<div class="state-row"><i class="ri-star-off-line"></i>No reviews yet.</div>`;
    document.getElementById('reviewsList').innerHTML='';
    return;
  }
  const avg=(backendReviews.reduce((a,r)=>a+r.rating,0)/backendReviews.length).toFixed(1);
  const pct=v=>Math.round(backendReviews.filter(r=>r.rating===v).length/backendReviews.length*100);

  document.getElementById('reviewSummaryCard').innerHTML=`
    <div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap;">
      <div style="text-align:center;">
        <div style="font-size:3rem;font-weight:800;color:var(--primary-black);">${avg}</div>
        <div class="review-stars" style="font-size:1.2rem;">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5-Math.round(avg))}</div>
        <div style="font-size:.8rem;color:var(--gray-500);margin-top:4px;">${backendReviews.length} reviews</div>
      </div>
      <div style="flex:1;min-width:200px;">
        ${[5,4,3,2,1].map(v=>`
          <div class="progress-item">
            <div class="progress-header"><span>${v} ★</span><span>${pct(v)}%</span></div>
            <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct(v)}%"></div></div>
          </div>`).join('')}
      </div>
    </div>`;

  document.getElementById('reviewsList').innerHTML=backendReviews.map(r=>`
    <div class="dash-card">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <div class="list-avatar">${r.clientName.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <div style="font-weight:700;font-size:.9rem;">${r.clientName}</div>
            <div style="font-size:.75rem;color:var(--gray-500);">${fmtDate(r.date)}</div>
          </div>
          <div class="review-stars" style="font-size:.9rem;margin-bottom:8px;">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
          <p style="font-size:.875rem;color:var(--gray-600);line-height:1.6;">"${r.comment}"</p>
        </div>
      </div>
    </div>`).join('');
}

// ===== NOTIFICATIONS =====
function updateBadges(){
  const unread=backendNotifications.filter(n=>!n.isRead).length;
  const pending=backendBookings.filter(b=>b.status==='PENDING').length;
  const nb=document.getElementById('notifBadge');
  const pb=document.getElementById('pendingBadge');
  const dot=document.getElementById('topbarNotifDot');
  if(nb){nb.textContent=unread;nb.style.display=unread?'':'none';}
  if(pb){pb.textContent=pending;pb.style.display=pending?'':'none';}
  if(dot)dot.style.display=unread?'':'none';
}

function renderNotifications(){
  updateBadges();
  if(backendNotifications.length===0){
    document.getElementById('notificationsList').innerHTML=`<div class="state-row"><i class="ri-notification-off-line"></i>No notifications.</div>`;
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

function markRead(id){EcoSnapAPI.markNotificationRead(id).then(()=>{const n=backendNotifications.find(x=>x.id===id);if(n)n.isRead=true;renderNotifications();}).catch(err=>showToast(err.message||'Could not mark read.','error'));}
function markAllRead(){EcoSnapAPI.markAllNotificationsRead().then(()=>{backendNotifications.forEach(n=>n.isRead=true);renderNotifications();showToast('All notifications marked as read.','success');}).catch(err=>showToast(err.message||'Could not mark all read.','error'));}
function deleteNotification(id){
  confirmAction('Delete Notification','Remove this notification?',()=>{
    EcoSnapAPI.deleteNotification(id).then(() => {
      backendNotifications=backendNotifications.filter(x=>x.id!==id);
      showToast('Notification deleted.','success');
      renderNotifications();
    }).catch(err => showToast(err.message || 'Could not delete notification.','error'));
  });
}

// ===== PASSWORD =====
function changePassword(){
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
  }).catch(err => showToast(err.message || 'Could not update password.','error'));
}

// ===== PROFILE SECTION =====
function renderProfile(){
  if (!profile) return;
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  const setHtml = (id, v) => { const el = document.getElementById(id); if (el) el.innerHTML = v || ''; };
  set('pName', profile.ownerName);
  set('pEmail', currentUser ? currentUser.email : '');
  set('pPhone', currentUser ? currentUser.phoneNumber : '');
  set('pSpec', profile.specialization);
  set('pExp', profile.experienceYears);
  set('pRate', profile.hourlyRate);
  set('pLoc', profile.location);
  set('pBio', profile.bio);
  set('pResp', profile.responseHours);
  setHtml('pInitials', initials(profile.ownerName || (currentUser ? currentUser.fullName : '')));
  setHtml('pAvatar', (profile.avatarUrl ? `<img src="${profile.avatarUrl}" alt="avatar" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid var(--primary-color);">` : `<div class="avatar" style="width:64px;height:64px;font-size:1.5rem;background:var(--primary-color);color:#fff;display:flex;align-items:center;justify-content:center;border-radius:50%;">${initials(profile.ownerName||'')}</div>`));
  setHtml('pCover', profile.coverImageUrl ? `<img src="${profile.coverImageUrl}" alt="cover" style="width:100%;height:180px;object-fit:cover;border-radius:var(--radius-sm);">` : `<div style="width:100%;height:180px;background:linear-gradient(135deg,var(--primary-color),var(--primary-dark));border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">${profile.ownerName||'Photographer'}</div>`);
}

function saveProfile(){
  const data = {
    specialization: (document.getElementById('pSpec')||{}).value || '',
    location: (document.getElementById('pLoc')||{}).value || '',
    experienceYears: Number((document.getElementById('pExp')||{}).value || 0),
    hourlyRate: Number((document.getElementById('pRate')||{}).value || 0),
    bio: (document.getElementById('pBio')||{}).value || '',
    responseHours: Number((document.getElementById('pResp')||{}).value || 24)
  };
  const btn = document.querySelector('#section-profile .btn-primary');
  const original = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ri-loader-4-line spin"></i> Saving...'; }
  EcoSnapAPI.updateProfile(data).then(res => {
    if (res) {
      profile = Object.assign({}, profile, res);
      renderProfile();
    }
    closeModal ? null : null;
    showToast('Profile saved successfully.','success');
  }).catch(err => showToast(err.message || 'Could not save profile.','error')).finally(() => {
    if (btn) { btn.innerHTML = original; btn.disabled = false; }
  });
}
