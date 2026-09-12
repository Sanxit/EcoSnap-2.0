// Customer Dashboard — authentication, section routing, bookings, reviews, notifications,
// photographer search, and booking modal with availability check.
// Depends on: assets/js/session.js, js/mock-data.js (loaded before this file).

// ===== AUTH =====
const user = EcoSnapSession.requireAuth(['CUSTOMER']);
if (user) {
  EcoSnapSession.applyToUI(user);
}

// ===== SECTIONS =====
const SECTIONS = ['home','bookings','reviews','notifications','find','profile'];
const SECTION_TITLES = {home:'Home',bookings:'My Bookings',reviews:'My Reviews',notifications:'Notifications',find:'Find Photographers',profile:'Profile'};
let currentSection = 'home';

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
initHashRoute();

// ===== MOCK DATA =====
let mockBookings = [
  {id:'BK-1091', photographer:'Sangeeta Shrestha', photographerInit:'SS', eventType:'WEDDING',    eventDate:'2025-09-07', package:'Premium', amount:50000, status:'CONFIRMED',  notes:'Hotel Yak & Yeti, Kathmandu'},
  {id:'BK-1089', photographer:'Anjali Gurung',     photographerInit:'AG', eventType:'BIRTHDAY',   eventDate:'2025-08-30', package:'Basic',   amount:20000, status:'COMPLETED',  notes:'Pokhara lakeside resort'},
  {id:'BK-1088', photographer:'Roshan Maharjan',   photographerInit:'RM', eventType:'CORPORATE',  eventDate:'2025-08-28', package:'Standard',amount:35000, status:'CONFIRMED',  notes:'Kumari Hall, Lalitpur'},
  {id:'BK-1087', photographer:'Alisha Shrestha',   photographerInit:'AS', eventType:'ENGAGEMENT', eventDate:'2025-08-26', package:'Standard',amount:45000, status:'COMPLETED',  notes:'Patan Durbar Square'},
  {id:'BK-1085', photographer:'Manish Khadka',     photographerInit:'MK', eventType:'CORPORATE',  eventDate:'2025-10-15', package:'Premium', amount:80000, status:'PENDING',    notes:'Product launch, Bhaktapur'},
  {id:'BK-1048', photographer:'Alisha Shrestha',   photographerInit:'AS', eventType:'ENGAGEMENT', eventDate:'2025-04-05', package:'Standard',amount:20000, status:'CANCELLED',  notes:'Cancelled by client'},
];
let bkIdCounter = 1100;

let mockReviews = [
  {id:1, bookingId:'BK-1089', photographer:'Anjali Gurung',   rating:5, comment:'The birthday shoot was amazing! Anjali was so patient and professional. Every moment captured beautifully.', date:'2025-08-31'},
  {id:2, bookingId:'BK-1087', photographer:'Alisha Shrestha', rating:5, comment:'The engagement shoot at Patan Durbar Square was beyond expectations. Truly magazine-quality photos!', date:'2025-08-27'},
];
let rvIdCounter = 3;
let currentRating = 0;

let mockNotifications = [
  {id:1, message:'Your booking BK-1091 (Wedding — Sangeeta Shrestha) has been confirmed.', isRead:false, createdAt:'2025-09-09'},
  {id:2, message:'Reminder: Your wedding event is on Sep 7, 2025 at Hotel Yak & Yeti, Kathmandu.', isRead:false, createdAt:'2025-09-08'},
  {id:3, message:'Platform notice: Khalti payment gateway is now available for all bookings.', isRead:true, createdAt:'2025-09-08'},
  {id:4, message:'Your booking BK-1088 (Corporate — Roshan Maharjan) has been confirmed.', isRead:true, createdAt:'2025-09-05'},
  {id:5, message:'Dashain Festival offer: Book photographers and get 10% platform fee waiver this October.', isRead:true, createdAt:'2025-09-01'},
];
let notifIdCounter = 6;

const mockPhotographersCatalog = [
  {id:1, name:'Sangeeta Shrestha', init:'SS', color:'var(--primary-color)', spec:'Wedding & Portrait', location:'Kathmandu', rating:4.9, reviews:87, rate:5000, tags:['WEDDING','PORTRAIT','CORPORATE']},
  {id:2, name:'Roshan Maharjan',   init:'RM', color:'#3b82f6', spec:'Corporate & Product', location:'Lalitpur',  rating:4.8, reviews:56, rate:4000, tags:['CORPORATE','PRODUCT']},
  {id:3, name:'Anjali Gurung',     init:'AG', color:'#f59e0b', spec:'Family & Birthday',   location:'Pokhara',   rating:5.0, reviews:63, rate:2500, tags:['BIRTHDAY','PORTRAIT']},
  {id:4, name:'Manish Khadka',     init:'MK', color:'#8b5cf6', spec:'Corporate & Fashion', location:'Bhaktapur', rating:4.9, reviews:44, rate:3500, tags:['CORPORATE','FASHION']},
  {id:5, name:'Alisha Shrestha',   init:'AS', color:'#ec4899', spec:'Wedding & Engagement', location:'Chitwan',  rating:5.0, reviews:52, rate:6000, tags:['WEDDING','ENGAGEMENT']},
  {id:6, name:'Sameer Bajracharya',init:'SB', color:'#0ea5e9', spec:'Portrait & Events',    location:'Dharan',   rating:4.7, reviews:38, rate:2000, tags:['PORTRAIT','EVENT']},
];

// ===== HELPERS =====
function statusBadge(s) {
  const map={CONFIRMED:'confirmed',PENDING:'pending',CANCELLED:'cancelled',COMPLETED:'completed',ACTIVE:'active',DECLINED:'declined'};
  return `<span class="status-badge ${map[s]||'inactive'}">${s}</span>`;
}
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}) : '—'; }
function isPast(d) { return new Date(d) < new Date(); }

// ===== HOME =====
function renderHome() {
  const total = mockBookings.length;
  const upcoming = mockBookings.filter(b=>b.status==='CONFIRMED'&&!isPast(b.eventDate)).length;
  const completed = mockBookings.filter(b=>b.status==='COMPLETED').length;
  const spent = mockBookings.filter(b=>b.status!=='CANCELLED'&&b.status!=='DECLINED').reduce((a,b)=>a+b.amount,0);

  document.getElementById('homeStats').innerHTML = `
    <div class="stat-card"><div class="stat-icon green"><i class="ri-calendar-check-line"></i></div><div class="stat-body"><div class="stat-label">Total Bookings</div><div class="stat-value">${total}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> All time</div></div></div>
    <div class="stat-card"><div class="stat-icon blue"><i class="ri-time-line"></i></div><div class="stat-body"><div class="stat-label">Upcoming Events</div><div class="stat-value">${upcoming}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Confirmed</div></div></div>
    <div class="stat-card"><div class="stat-icon amber"><i class="ri-checkbox-circle-line"></i></div><div class="stat-body"><div class="stat-label">Completed</div><div class="stat-value">${completed}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Sessions done</div></div></div>
    <div class="stat-card"><div class="stat-icon green"><i class="ri-coins-line"></i></div><div class="stat-body"><div class="stat-label">Total Spent</div><div class="stat-value">Rs. ${spent.toLocaleString('en-IN')}</div><div class="stat-change up"><i class="ri-arrow-up-s-line"></i> Lifetime</div></div></div>
  `;

  const nextBooking = mockBookings.find(b=>b.status==='CONFIRMED'&&!isPast(b.eventDate));
  if (nextBooking) {
    document.getElementById('upcomingBanner').innerHTML = `
      <div class="dash-card" style="margin-bottom:20px;background:linear-gradient(135deg,var(--primary-color) 0%,var(--primary-dark) 100%);border:none;color:#fff;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <div style="font-size:.78rem;font-weight:700;opacity:.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Upcoming Event</div>
            <div style="font-size:1.3rem;font-weight:700;margin-bottom:6px;">${nextBooking.eventType} Photography</div>
            <div style="opacity:.85;font-size:.9rem;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <i class="ri-calendar-event-line"></i> ${fmtDate(nextBooking.eventDate)} &nbsp;|&nbsp;
              <i class="ri-map-pin-line"></i> ${nextBooking.notes} &nbsp;|&nbsp;
              <i class="ri-user-line"></i> ${nextBooking.photographer}
            </div>
          </div>
          <button style="background:#fff;color:var(--primary-color);font-weight:700;padding:10px 22px;border:none;border-radius:var(--radius-sm);cursor:pointer;font-size:.9rem;" onclick="showSection('bookings',null)">View Details</button>
        </div>
      </div>`;
  } else {
    document.getElementById('upcomingBanner').innerHTML = '';
  }

  const recent = mockBookings.slice(0,4);
  document.getElementById('homeRecentBookings').innerHTML = recent.map(b=>`
    <div class="list-item">
      <div class="list-avatar">${b.photographerInit}</div>
      <div class="list-body"><div class="list-title">${b.photographer} — ${b.eventType}</div><div class="list-sub">${fmtDate(b.eventDate)} · ${b.package} Package</div></div>
      ${statusBadge(b.status)}
    </div>`).join('');

  document.getElementById('homeRecommended').innerHTML = mockPhotographersCatalog.slice(0,3).map(p=>`
    <div class="photographer-card">
      <div class="photo-avatar" style="background:${p.color};">${p.init}</div>
      <div class="photo-body">
        <div class="photo-name">${p.name}</div>
        <div class="photo-spec">${p.spec} · ${p.location}</div>
        <div class="photo-rating">&#9733; ${p.rating} (${p.reviews} reviews)</div>
      </div>
      <button class="btn-xs success" style="padding:7px 14px;font-size:.78rem;" onclick="openBookModal(${p.id})">Book</button>
    </div>`).join('');

  updateNotifBadge();
}

// ===== MY BOOKINGS =====
function renderMyBookings() {
  const statF = (document.getElementById('bkStatusFilter')||{}).value||'';
  const filtered = statF ? mockBookings.filter(b=>b.status===statF) : mockBookings;

  const canCancel = s => s==='PENDING'||s==='CONFIRMED';
  const canEdit   = s => s==='PENDING'||s==='CONFIRMED';
  const canReview = (s,bkId) => s==='COMPLETED' && !mockReviews.find(r=>r.bookingId===bkId);

  const tbody = filtered.length===0
    ? `<tr><td colspan="8" class="state-row"><i class="ri-calendar-close-line"></i>No bookings found.</td></tr>`
    : filtered.map(b=>`
      <tr>
        <td>${b.id}</td>
        <td>${b.photographer}</td>
        <td>${b.eventType}</td>
        <td>${fmtDate(b.eventDate)}</td>
        <td>${b.package}</td>
        <td>Rs. ${b.amount.toLocaleString('en-IN')}</td>
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
  const b = mockBookings.find(x=>x.id===id); if(!b) return;
  document.getElementById('ebkId').value = id;
  document.getElementById('ebkNotes').value = b.notes||'';
  openModal('modalEditBooking');
}

function saveBookingNotes() {
  const id = document.getElementById('ebkId').value;
  const b = mockBookings.find(x=>x.id===id); if(!b) return;
  b.notes = document.getElementById('ebkNotes').value.trim();
  closeModal('modalEditBooking');
  showToast('Booking notes updated.','success');
  renderMyBookings();
}

function cancelBooking(id) {
  const b = mockBookings.find(x=>x.id===id); if(!b) return;
  confirmAction('Cancel Booking', `Cancel your booking ${id} with ${b.photographer}? This action cannot be undone.`, () => {
    b.status='CANCELLED';
    showToast(`Booking ${id} has been cancelled.`,'success');
    renderMyBookings();
    if(currentSection==='home') renderHome();
  });
}

// ===== MY REVIEWS =====
function renderMyReviews() {
  if (mockReviews.length===0) {
    document.getElementById('myReviewsList').innerHTML = `<div class="state-row"><i class="ri-star-off-line"></i>You have not written any reviews yet. Complete a booking to leave a review!</div>`;
    return;
  }
  document.getElementById('myReviewsList').innerHTML = mockReviews.map(r=>`
    <div style="border-bottom:1px solid var(--gray-100);padding:16px 0;display:flex;align-items:flex-start;gap:14px;">
      <div style="flex:1;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <div style="font-weight:700;">${r.photographer}</div>
          <div style="font-size:.78rem;color:var(--gray-500);">${fmtDate(r.date)}</div>
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
  const b = mockBookings.find(x=>x.id===bookingId); if(!b) return;
  currentRating=0;
  document.getElementById('rvId').value='';
  document.getElementById('rvBooking').value=`${bookingId} — ${b.photographer} (${b.eventType})`;
  document.getElementById('rvComment').value='';
  document.getElementById('modalReviewTitle').textContent='Write a Review';
  setRating(0);
  openModal('modalReview');
}

function openEditReview(id) {
  const r = mockReviews.find(x=>x.id===id); if(!r) return;
  document.getElementById('rvId').value=id;
  document.getElementById('rvBooking').value=`${r.bookingId} — ${r.photographer}`;
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

  if (id) {
    const r=mockReviews.find(x=>x.id===+id); if(r){r.rating=currentRating;r.comment=comment;r.date=new Date().toISOString().split('T')[0];}
    showToast('Review updated.','success');
  } else {
    const bookingId = bkStr.split(' — ')[0];
    const b = mockBookings.find(x=>x.id===bookingId);
    mockReviews.push({id:rvIdCounter++,bookingId,photographer:b?b.photographer:'',rating:currentRating,comment,date:new Date().toISOString().split('T')[0]});
    showToast('Review submitted!','success');
  }
  closeModal('modalReview');
  renderMyReviews();
  renderMyBookings();
}

function deleteReview(id) {
  confirmAction('Delete Review','Delete this review? This cannot be undone.',()=>{
    mockReviews=mockReviews.filter(x=>x.id!==id);
    showToast('Review deleted.','success');
    renderMyReviews();
    renderMyBookings();
  });
}

// ===== NOTIFICATIONS =====
function updateNotifBadge() {
  const unread=mockNotifications.filter(n=>!n.isRead).length;
  const badge=document.getElementById('notifBadge');
  const dot=document.getElementById('topbarNotifDot');
  if(badge){badge.textContent=unread;badge.style.display=unread?'':'none';}
  if(dot)dot.style.display=unread?'':'none';
}

function renderNotifications() {
  updateNotifBadge();
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

function markRead(id) {
  const n=mockNotifications.find(x=>x.id===id); if(n)n.isRead=true;
  renderNotifications();
}

function markAllRead() {
  mockNotifications.forEach(n=>n.isRead=true);
  renderNotifications();
  showToast('All notifications marked as read.','success');
}

function deleteNotification(id) {
  confirmAction('Delete Notification','Remove this notification?',()=>{
    mockNotifications=mockNotifications.filter(x=>x.id!==id);
    showToast('Notification deleted.','success');
    renderNotifications();
  });
}

// ===== FIND PHOTOGRAPHERS =====
function renderFindPhotographers() {
  const search=(document.getElementById('findSearch')||{}).value?.toLowerCase()||'';
  const filtered=mockPhotographersCatalog.filter(p=>
    !search||p.name.toLowerCase().includes(search)||p.location.toLowerCase().includes(search)||p.spec.toLowerCase().includes(search)
  );

  document.getElementById('findPhotographersList').innerHTML = filtered.length===0
    ? `<div class="state-row"><i class="ri-search-eye-line"></i>No photographers found.</div>`
    : filtered.map(p=>`
      <div class="photographer-card" style="padding:18px;">
        <div class="photo-avatar" style="background:${p.color};width:56px;height:56px;font-size:1.2rem;">${p.init}</div>
        <div class="photo-body">
          <div class="photo-name" style="font-size:1rem;">${p.name}</div>
          <div class="photo-spec">${p.spec} · ${p.location}</div>
          <div class="photo-rating">&#9733; ${p.rating} · ${p.reviews} reviews · From Rs. ${p.rate.toLocaleString('en-IN')}/hr</div>
          <div style="margin-top:6px;">${p.tags.map(t=>`<span class="event-tag">${t}</span>`).join('')}</div>
        </div>
        <button class="btn-xs success" style="padding:10px 20px;font-size:.85rem;" onclick="openBookModal(${p.id})">Book Now</button>
      </div>`).join('');
}

// ===== BOOK MODAL =====
let bkAvailChecked = false;
let bkPhotographerId = null;

function openBookModal(photographerId) {
  const p=mockPhotographersCatalog.find(x=>x.id===photographerId); if(!p) return;
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
    setTimeout(()=>{
      const available=Math.random()>0.2;
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
    },1500);
    return;
  }

  const eventType=document.getElementById('bkEventType').value;
  const timeSlot=document.getElementById('bkTimeSlot').value;
  const notes=document.getElementById('bkNotes').value.trim();
  const p=mockPhotographersCatalog.find(x=>x.id===bkPhotographerId);
  const newId=`BK-${bkIdCounter++}`;
  mockBookings.unshift({
    id:newId, photographer:p.name, photographerInit:p.init,
    eventType, eventDate:date, package:'Standard',
    amount:p.rate*8, status:'PENDING', notes:`${loc}${timeSlot?' · '+timeSlot:''} ${notes?'· '+notes:''}`
  });

  mockNotifications.unshift({id:notifIdCounter++,message:`Booking ${newId} with ${p.name} has been submitted and is awaiting confirmation.`,isRead:false,createdAt:new Date().toISOString().split('T')[0]});
  updateNotifBadge();

  closeModal('modalBook');
  showToast(`Booking ${newId} submitted! Awaiting photographer confirmation.`,'success');
  bkAvailChecked=false;
}

// ===== PASSWORD =====
function changePassword() {
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
