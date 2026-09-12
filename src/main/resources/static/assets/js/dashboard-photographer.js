// Photographer Dashboard — authentication, section routing, availability calendar,
// portfolio management, package CRUD, booking request actions, reviews, and notifications.
// Depends on: assets/js/session.js, js/mock-data.js (loaded before this file).

// ===== AUTH =====
const user = EcoSnapSession.requireAuth(['PHOTOGRAPHER']);
if (user) {
  EcoSnapSession.applyToUI(user);
}

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

// ===== MOCK DATA =====
let mockBookings = [
  {id:'BK-1091',client:'Aayush & Nisha Thapa',  eventType:'WEDDING',   eventDate:'2025-09-07',package:'Premium', amount:50000,netPayout:45000,status:'CONFIRMED', notes:'Hotel Yak & Yeti, Kathmandu'},
  {id:'BK-1095',client:'Himalayan Bank Ltd.',    eventType:'CORPORATE', eventDate:'2025-10-16',package:'Standard',amount:30000,netPayout:27000,status:'PENDING',   notes:'Corporate headquarters, Kathmandu'},
  {id:'BK-1097',client:'Rohan Maharjan',         eventType:'BIRTHDAY',  eventDate:'2025-10-27',package:'Basic',   amount:15000,netPayout:13500,status:'PENDING',   notes:'Rohan residence, Lalitpur'},
  {id:'BK-1089',client:'Suresh & Kamala Poudel', eventType:'WEDDING',   eventDate:'2025-08-23',package:'Premium', amount:100000,netPayout:90000,status:'COMPLETED',notes:'Gokarna Forest Resort'},
  {id:'BK-1087',client:'Puja Maharjan',          eventType:'ENGAGEMENT',eventDate:'2025-08-29',package:'Standard',amount:45000,netPayout:40500,status:'COMPLETED', notes:'Patan Durbar Square'},
  {id:'BK-1086',client:'Dipesh Tamang',          eventType:'BIRTHDAY',  eventDate:'2025-08-20',package:'Basic',   amount:15000,netPayout:13500,status:'CANCELLED', notes:'Cancelled by client'},
];

let mockReviews = [
  {id:1, clientName:'Aayush Thapa',  rating:5, comment:'Sangeeta captured every precious moment of our wedding with incredible skill. The photos were breathtaking and made our family emotional with joy.', date:'2025-08-28'},
  {id:2, clientName:'Puja Maharjan', rating:5, comment:'Professional and creative — our engagement shoot looked like it came straight out of a magazine. Definitely recommend to anyone looking for a quality photographer!', date:'2025-08-30'},
  {id:3, clientName:'Rajesh Gurung', rating:4, comment:"Sangeeta's work for our corporate event was extremely professional. Photos were delivered on time and the quality was impeccable. Great value for money.", date:'2025-08-15'},
];

let mockPortfolio = [
  {id:1, caption:'Summer Wedding — Gokarna Forest', category:'WEDDING',  bg:'linear-gradient(135deg,#009245,#00b555)', icon:'img'},
  {id:2, caption:'Engagement — Patan Durbar Square', category:'WEDDING', bg:'linear-gradient(135deg,#8b5cf6,#a78bfa)', icon:'img'},
  {id:3, caption:'Corporate Event — Himalayan Bank', category:'EVENT',   bg:'linear-gradient(135deg,#3b82f6,#60a5fa)', icon:'img'},
  {id:4, caption:'Birthday Party — Pokhara',         category:'EVENT',   bg:'linear-gradient(135deg,#f59e0b,#fbbf24)', icon:'img'},
  {id:5, caption:'Portrait Session — Studio',        category:'PORTRAIT',bg:'linear-gradient(135deg,#ec4899,#f9a8d4)', icon:'img'},
];
let portfolioIdCounter = 6;

let mockPackages = [
  {id:1, packageName:'Basic Portrait',    category:'PORTRAIT', description:'2-hour portrait session with 40 edited digital photos. Perfect for headshots and personal profiles.', price:15000, durationHours:2},
  {id:2, packageName:'Standard Event',   category:'EVENT',    description:'5-hour event coverage with 100 edited photos and a printed album.', price:35000, durationHours:5},
  {id:3, packageName:'Premium Wedding',  category:'WEDDING',  description:'Full-day wedding coverage with 200 edited photos and a highlight video.', price:50000, durationHours:8},
  {id:4, packageName:'Wedding Suite',    category:'WEDDING',  description:'Two-day wedding suite with 500 edited photos and a cinematic film. Includes pre-wedding shoot.', price:100000, durationHours:16},
  {id:5, packageName:'Corporate Day',    category:'EVENT',    description:'8-hour corporate event coverage with 150 edited photos plus raw files.', price:80000, durationHours:8},
];
let packageIdCounter = 6;

let mockAvailability = [
  {id:1, date:'2025-09-07', timeSlot:'FULL_DAY', isBooked:true},
  {id:2, date:'2025-09-10', timeSlot:'MORNING',  isBooked:false},
  {id:3, date:'2025-09-12', timeSlot:'AFTERNOON',isBooked:false},
  {id:4, date:'2025-09-20', timeSlot:'FULL_DAY', isBooked:false},
  {id:5, date:'2025-09-25', timeSlot:'EVENING',  isBooked:false},
  {id:6, date:'2025-10-16', timeSlot:'FULL_DAY', isBooked:true},
  {id:7, date:'2025-10-27', timeSlot:'AFTERNOON',isBooked:true},
];
let slotIdCounter = 8;

let mockNotifications = [
  {id:1, message:'New booking request BK-1095 from Himalayan Bank Ltd. for Oct 16 corporate event. Please review and confirm.', isRead:false, createdAt:'2025-09-09'},
  {id:2, message:'New booking request BK-1097 from Rohan Maharjan for Oct 27 birthday event. Action required.', isRead:false, createdAt:'2025-09-08'},
  {id:3, message:'Booking BK-1089 (Wedding — Suresh & Kamala Poudel) has been marked as completed. Payout of Rs. 90,000 is being processed.', isRead:true, createdAt:'2025-08-24'},
  {id:4, message:'Platform notice: Khalti wallet payment is now available. Your clients can pay directly via Khalti.', isRead:true, createdAt:'2025-09-08'},
  {id:5, message:'Photographer Verification Drive: Submit your updated documents by Sept 20, 2025 to maintain verified status.', isRead:true, createdAt:'2025-09-05'},
];
let notifIdCounter = 6;

// ===== HELPERS =====
function statusBadge(s){
  const map={CONFIRMED:'confirmed',PENDING:'pending',CANCELLED:'cancelled',COMPLETED:'completed',ACTIVE:'active',DECLINED:'declined'};
  return `<span class="status-badge ${map[s]||'inactive'}">${s}</span>`;
}
function fmtDate(d){return d?new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}):'—';}
function isPast(d){return new Date(d)<new Date();}

// ===== HOME =====
function renderHome(){
  const completed=mockBookings.filter(b=>b.status==='COMPLETED');
  const monthlyEarnings=completed.reduce((a,b)=>a+b.netPayout,0);
  const monthlyJobs=completed.length;
  const avgRating=mockReviews.length?(mockReviews.reduce((a,r)=>a+r.rating,0)/mockReviews.length).toFixed(1):0;
  const profileViews=2140;

  document.getElementById('homeStats').innerHTML=`
    <div class="stat-card"><div class="stat-icon green"><i class="ri-coins-line"></i></div><div class="stat-body"><div class="stat-label">Earnings (Completed)</div><div class="stat-value">Rs. ${monthlyEarnings.toLocaleString('en-IN')}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> From ${monthlyJobs} jobs</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="ri-calendar-check-line"></i></div><div class="stat-body"><div class="stat-label">Pending Requests</div><div class="stat-value">${mockBookings.filter(b=>b.status==='PENDING').length}</div><div class="stat-change down"><i class="ri-arrow-down-s-line"></i> Action needed</div></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="ri-star-line"></i></div><div class="stat-body"><div class="stat-label">Avg Rating</div><div class="stat-value">${avgRating||'—'}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> ${mockReviews.length} reviews</div></div></div>
    <div class="stat-card"><div class="stat-icon purple"><i class="ri-eye-line"></i></div><div class="stat-body"><div class="stat-label">Profile Views</div><div class="stat-value">${profileViews.toLocaleString()}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> This month</div></div></div>
  `;

  const nextJob=mockBookings.find(b=>b.status==='CONFIRMED'&&!isPast(b.eventDate));
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

  const upcoming=mockBookings.filter(b=>b.status==='CONFIRMED'&&!isPast(b.eventDate));
  document.getElementById('homeUpcomingJobs').innerHTML=upcoming.length===0
    ? `<div class="state-row"><i class="ri-calendar-close-line"></i>No upcoming confirmed jobs.</div>`
    : upcoming.slice(0,3).map(b=>`
      <div class="list-item">
        <div class="list-avatar" style="background:var(--primary-accent);color:var(--primary-color);">${b.eventType[0]}</div>
        <div class="list-body"><div class="list-title">${b.eventType} — ${b.client}</div><div class="list-sub">${fmtDate(b.eventDate)} · ${b.package} · Rs. ${b.netPayout.toLocaleString('en-IN')}</div></div>
        ${statusBadge(b.status)}
      </div>`).join('');

  document.getElementById('homeLatestReviews').innerHTML=mockReviews.slice(0,2).map(r=>`
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
    mockPortfolio.map((p,i)=>`
      <div class="portfolio-card">
        <div class="thumb" style="background:${thumbColors[i%thumbColors.length]};"><i class="ri-image-line" style="font-size:2rem;color:rgba(255,255,255,.7);"></i></div>
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
  document.getElementById('pfFile').value='';
  document.getElementById('pfCategory').value='WEDDING';
  document.getElementById('modalPortfolioTitle').textContent='Upload Image';
  openModal('modalPortfolio');
}

function savePortfolioItem(){
  const caption=document.getElementById('pfCaption').value.trim();
  const category=document.getElementById('pfCategory').value;
  if(!caption){showToast('Caption is required.','error');return;}
  mockPortfolio.push({id:portfolioIdCounter++,caption,category,bg:'',icon:'img'});
  closeModal('modalPortfolio');
  showToast('Image uploaded to portfolio.','success');
  renderPortfolio();
}

function openEditCaption(id){
  const p=mockPortfolio.find(x=>x.id===id); if(!p) return;
  document.getElementById('captionId').value=id;
  document.getElementById('captionText').value=p.caption;
  openModal('modalCaption');
}

function saveCaption(){
  const id=+document.getElementById('captionId').value;
  const p=mockPortfolio.find(x=>x.id===id); if(!p) return;
  p.caption=document.getElementById('captionText').value.trim();
  closeModal('modalCaption');
  showToast('Caption updated.','success');
  renderPortfolio();
}

function deletePortfolioItem(id){
  const p=mockPortfolio.find(x=>x.id===id); if(!p) return;
  confirmAction('Delete Image',`Remove "${p.caption}" from your portfolio?`,()=>{
    mockPortfolio=mockPortfolio.filter(x=>x.id!==id);
    showToast('Image removed from portfolio.','success');
    renderPortfolio();
  });
}

// ===== PACKAGES =====
function renderPackages(){
  const tbody=mockPackages.length===0
    ?`<tr><td colspan="6" class="state-row"><i class="ri-price-tag-off-line"></i>No packages yet. Add your first package!</td></tr>`
    :mockPackages.map(p=>`
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
  const p=mockPackages.find(x=>x.id===id); if(!p) return;
  document.getElementById('pkgId').value=id;
  document.getElementById('pkgName').value=p.packageName;
  document.getElementById('pkgCategory').value=p.category;
  document.getElementById('pkgDesc').value=p.description;
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
  if(!packageName||!price||!durationHours){showToast('Name, price, and duration are required.','error');return;}

  if(id){
    const p=mockPackages.find(x=>x.id===+id);
    if(p){p.packageName=packageName;p.category=category;p.description=description;p.price=price;p.durationHours=durationHours;}
    showToast('Package updated.','success');
  } else {
    mockPackages.push({id:packageIdCounter++,packageName,category,description,price,durationHours});
    showToast('Package created.','success');
  }
  closeModal('modalPackage');
  renderPackages();
}

function deletePackage(id){
  const p=mockPackages.find(x=>x.id===id); if(!p) return;
  confirmAction('Delete Package',`Delete package "${p.packageName}"?`,()=>{
    mockPackages=mockPackages.filter(x=>x.id!==id);
    showToast('Package deleted.','success');
    renderPackages();
  });
}

// ===== AVAILABILITY =====
function renderAvailability(){
  const tbody=mockAvailability.length===0
    ?`<tr><td colspan="4" class="state-row"><i class="ri-calendar-close-line"></i>No slots added yet.</td></tr>`
    :mockAvailability.map(s=>`
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
  const bookedDates=mockAvailability.filter(s=>s.isBooked).map(s=>new Date(s.date).getDate());
  const partialDates=mockAvailability.filter(s=>!s.isBooked&&s.timeSlot!=='FULL_DAY').map(s=>new Date(s.date).getDate());
  const startOffset=3; // Bhadra 1 = Wednesday
  for(let i=0;i<startOffset;i++) grid.appendChild(document.createElement('div'));
  for(let d=1;d<=31;d++){
    const cell=document.createElement('div');
    cell.className='avail-day';
    const isPastDay=d<20;
    if(isPastDay) cell.classList.add('past');
    else if(bookedDates.includes(d)) cell.classList.add('booked');
    else if(partialDates.includes(d)) cell.classList.add('partial');
    else cell.classList.add('free');
    cell.innerHTML=`<span class="day-num">${d}</span>`;
    if(!isPastDay&&!bookedDates.includes(d)){
      cell.addEventListener('click',()=>{
        document.getElementById('slotDate').value=`2025-09-${String(d).padStart(2,'0')}`;
        openModal('modalSlot');
      });
    }
    grid.appendChild(cell);
  }
}

function openSlotModal(){
  document.getElementById('slotDate').value='';
  document.getElementById('slotTime').value='MORNING';
  openModal('modalSlot');
}

function saveSlot(){
  const date=document.getElementById('slotDate').value;
  const timeSlot=document.getElementById('slotTime').value;
  if(!date){showToast('Date is required.','error');return;}
  if(new Date(date)<new Date().setHours(0,0,0,0)){showToast('Cannot add a slot for a past date.','error');return;}
  if(mockAvailability.find(s=>s.date===date&&s.timeSlot===timeSlot)){showToast('This slot already exists.','error');return;}
  mockAvailability.push({id:slotIdCounter++,date,timeSlot,isBooked:false});
  closeModal('modalSlot');
  showToast('Slot added.','success');
  renderAvailability();
}

function deleteSlot(id){
  confirmAction('Delete Slot','Remove this availability slot?',()=>{
    mockAvailability=mockAvailability.filter(x=>x.id!==id);
    showToast('Slot removed.','success');
    renderAvailability();
  });
}

// ===== BOOKING REQUESTS =====
let activeTab='All';

function renderRequests(){
  const byStat=s=>mockBookings.filter(b=>b.status===s).length;
  document.getElementById('requestStats').innerHTML=`
    <div class="stat-card"><div class="stat-icon amber"><i class="ri-time-line"></i></div><div class="stat-body"><div class="stat-label">Pending</div><div class="stat-value">${byStat('PENDING')}</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="ri-calendar-check-line"></i></div><div class="stat-body"><div class="stat-label">Confirmed</div><div class="stat-value">${byStat('CONFIRMED')}</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="ri-checkbox-circle-line"></i></div><div class="stat-body"><div class="stat-label">Completed</div><div class="stat-value">${byStat('COMPLETED')}</div></div></div>
    <div class="stat-card"><div class="stat-icon red"><i class="ri-close-circle-line"></i></div><div class="stat-body"><div class="stat-label">Cancelled/Declined</div><div class="stat-value">${byStat('CANCELLED')+byStat('DECLINED')}</div></div></div>
  `;

  const tabs=['All','PENDING','CONFIRMED','COMPLETED','CANCELLED'];
  document.getElementById('requestTabs').innerHTML=tabs.map(t=>`
    <button class="tab-btn ${activeTab===t?'active':''}" onclick="setTab('${t}')">${t==='All'?'All':t.charAt(0)+t.slice(1).toLowerCase()}</button>`).join('');

  const filtered=activeTab==='All'?mockBookings:mockBookings.filter(b=>b.status===activeTab);

  const canConfirm=b=>b.status==='PENDING';
  const canDecline=b=>b.status==='PENDING';
  const canComplete=b=>b.status==='CONFIRMED'&&isPast(b.eventDate);

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
          <div class="action-btns">
            ${canConfirm(b)?`<button class="btn-xs success" onclick="confirmBooking('${b.id}')">Confirm</button>`:''}
            ${canDecline(b)?`<button class="btn-xs danger" onclick="openDeclineModal('${b.id}')">Decline</button>`:''}
            ${canComplete(b)?`<button class="btn-xs edit" onclick="completeBooking('${b.id}')">Complete</button>`:''}
          </div>
        </td>
      </tr>`).join('');

  document.getElementById('requestsTable').innerHTML=`
    <thead><tr><th>ID</th><th>Client</th><th>Event</th><th>Date</th><th>Package</th><th>Payout</th><th>Status</th><th>Actions</th></tr></thead>
    <tbody>${tbody}</tbody>`;
}

function setTab(t){activeTab=t;renderRequests();}

function confirmBooking(id){
  const b=mockBookings.find(x=>x.id===id); if(!b) return;
  confirmAction('Confirm Booking',`Confirm booking ${id} for ${b.client} on ${fmtDate(b.eventDate)}?`,()=>{
    b.status='CONFIRMED';
    const sl=mockAvailability.find(s=>s.date===b.eventDate);
    if(sl)sl.isBooked=true;
    mockNotifications.unshift({id:notifIdCounter++,message:`You confirmed booking ${id} for ${b.client}. Event on ${fmtDate(b.eventDate)}.`,isRead:false,createdAt:new Date().toISOString().split('T')[0]});
    updateBadges();
    showToast(`Booking ${id} confirmed.`,'success');
    renderRequests();
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
  const b=mockBookings.find(x=>x.id===id); if(!b) return;
  b.status='DECLINED';
  closeModal('modalDecline');
  showToast(`Booking ${id} declined.`,'success');
  renderRequests();
}

function completeBooking(id){
  const b=mockBookings.find(x=>x.id===id); if(!b) return;
  confirmAction('Mark as Completed',`Mark booking ${id} for ${b.client} as COMPLETED?`,()=>{
    b.status='COMPLETED';
    mockNotifications.unshift({id:notifIdCounter++,message:`Booking ${id} marked as completed. Payout of Rs. ${b.netPayout.toLocaleString('en-IN')} is being processed.`,isRead:false,createdAt:new Date().toISOString().split('T')[0]});
    updateBadges();
    showToast(`Booking ${id} completed!`,'success');
    renderRequests();
  });
}

// ===== REVIEWS =====
function renderReviews(){
  if(!mockReviews.length){
    document.getElementById('reviewSummaryCard').innerHTML=`<div class="state-row"><i class="ri-star-off-line"></i>No reviews yet.</div>`;
    document.getElementById('reviewsList').innerHTML='';
    return;
  }
  const avg=(mockReviews.reduce((a,r)=>a+r.rating,0)/mockReviews.length).toFixed(1);
  const pct=v=>Math.round(mockReviews.filter(r=>r.rating===v).length/mockReviews.length*100);

  document.getElementById('reviewSummaryCard').innerHTML=`
    <div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap;">
      <div style="text-align:center;">
        <div style="font-size:3rem;font-weight:800;color:var(--primary-black);">${avg}</div>
        <div class="review-stars" style="font-size:1.2rem;">${'★'.repeat(Math.round(avg))}${'☆'.repeat(5-Math.round(avg))}</div>
        <div style="font-size:.8rem;color:var(--gray-500);margin-top:4px;">${mockReviews.length} reviews</div>
      </div>
      <div style="flex:1;min-width:200px;">
        ${[5,4,3,2,1].map(v=>`
          <div class="progress-item">
            <div class="progress-header"><span>${v} ★</span><span>${pct(v)}%</span></div>
            <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct(v)}%"></div></div>
          </div>`).join('')}
      </div>
    </div>`;

  document.getElementById('reviewsList').innerHTML=mockReviews.map(r=>`
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
  const unread=mockNotifications.filter(n=>!n.isRead).length;
  const pending=mockBookings.filter(b=>b.status==='PENDING').length;
  const nb=document.getElementById('notifBadge');
  const pb=document.getElementById('pendingBadge');
  const dot=document.getElementById('topbarNotifDot');
  if(nb){nb.textContent=unread;nb.style.display=unread?'':'none';}
  if(pb){pb.textContent=pending;pb.style.display=pending?'':'none';}
  if(dot)dot.style.display=unread?'':'none';
}

function renderNotifications(){
  updateBadges();
  if(mockNotifications.length===0){
    document.getElementById('notificationsList').innerHTML=`<div class="state-row"><i class="ri-notification-off-line"></i>No notifications.</div>`;
    return;
  }
  document.getElementById('notificationsList').innerHTML=mockNotifications.map(n=>`
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

function markRead(id){const n=mockNotifications.find(x=>x.id===id);if(n)n.isRead=true;renderNotifications();}
function markAllRead(){mockNotifications.forEach(n=>n.isRead=true);renderNotifications();showToast('All notifications marked as read.','success');}
function deleteNotification(id){
  confirmAction('Delete Notification','Remove this notification?',()=>{
    mockNotifications=mockNotifications.filter(x=>x.id!==id);
    showToast('Notification deleted.','success');
    renderNotifications();
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
  document.getElementById('profPwdCur').value='';
  document.getElementById('profPwdNew').value='';
  document.getElementById('profPwdCf').value='';
  showToast('Password updated successfully.','success');
}
