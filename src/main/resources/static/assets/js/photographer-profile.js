/* ============================================
   ECO SNAP — Photographer Profile Page JavaScript
   Depends on: js/main.js, js/api.js, js/session.js
   ============================================ */

let currentProfile = null;
let currentLightboxIndex = 0;
let currentGalleryImages = [];

// ============================================
// INIT
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  let id = parseInt(params.get("id")) || null;

  if (!window.EcoSnapAPI) {
    console.error("EcoSnapAPI not loaded");
    return;
  }

  // If no ID is specified, load the first available photographer from DB
  if (!id) {
    try {
      const list = await EcoSnapAPI.photographers();
      if (Array.isArray(list) && list.length > 0) {
        id = list[0].id;
      }
    } catch (e) {
      console.warn("Could not fetch photographer list", e);
    }
  }

  let data = null;
  if (id) {
    data = await loadProfileFromBackend(id);
  }

  if (!data) {
    showNotFound();
    return;
  }

  currentProfile = data;
  loadProfileData(data);
  renderPackages(data.packages || []);
  renderGallery(data.portfolio || []);
  renderReviews(data.reviews || []);
  initTabs();
  initGalleryFilter();
  initLightbox();
  initBookingModal(data);
  initFAQ();
  initSaveButton();
});

function showNotFound() {
  const hero = document.getElementById("profHero");
  if (hero) {
    hero.innerHTML = `
      <div class="eco-container" style="padding: 100px 20px; text-align: center;">
        <i class="ri-user-unfollow-line" style="font-size: 4rem; color: var(--gray-400); display: block; margin-bottom: 16px;"></i>
        <h2 style="font-size: 1.8rem; margin-bottom: 8px;">Photographer Not Found</h2>
        <p style="color: var(--gray-500); margin-bottom: 24px;">The requested photographer profile does not exist or has been removed.</p>
        <a href="photographers.html" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px;">
          <i class="ri-arrow-left-line"></i> Browse All Photographers
        </a>
      </div>
    `;
  }
}

// ============================================
// 0. BACKEND LOADING
// ============================================
async function loadProfileFromBackend(id) {
  if (!window.EcoSnapAPI) return null;
  try {
    const [profile, portfolio, reviews, packages] = await Promise.all([
      EcoSnapAPI.photographer(id).catch(() => null),
      EcoSnapAPI.photographerPortfolio(id).catch(() => []),
      EcoSnapAPI.photographerReviews(id).catch(() => []),
      EcoSnapAPI.photographerPackages(id).catch(() => [])
    ]);
    if (!profile) return null;

    const tags = (profile.specialization || '').split(',').map(s => s.trim()).filter(Boolean);
    const resolvedPackages = (packages && packages.length) ? packages : (profile.packages || []);
    const minPrice = resolvedPackages.length
      ? Math.min(...resolvedPackages.map(p => Number(p.price) || 0))
      : Number(profile.hourlyRate || 0);

    return {
      id: profile.id,
      name: profile.ownerName || 'Photographer',
      tagline: profile.bio ? profile.bio.split('\n')[0] : 'Professional Photography Services',
      location: profile.location || 'Nepal',
      experience: profile.experienceYears ? `${profile.experienceYears}+ Years Experience` : 'Experienced Professional',
      shoots: `${profile.reviewCount || 0}+ Shoots`,
      rating: String(profile.rating ? Number(profile.rating).toFixed(1) : '5.0'),
      reviewCount: profile.reviewCount || 0,
      price: 'Rs. ' + (minPrice || 0).toLocaleString('en-IN'),
      avatar: profile.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      cover: profile.coverImageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=80',
      tags: tags.length ? tags : ['Photography'],
      bio: profile.bio || 'Professional photographer ready to capture your special moments.',
      packages: resolvedPackages,
      portfolio: (portfolio || []).map(p => ({
        src: p.imageUrl,
        tag: (p.category || 'photo').toLowerCase(),
        tall: false
      })),
      reviews: (reviews || []).map(r => ({
        name: r.customerName || 'Verified Client',
        event: r.photographerName ? `Session with ${r.photographerName}` : 'Photography Session',
        rating: r.rating || 5,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recent',
        body: r.comment || ''
      }))
    };
  } catch (e) {
    console.warn('Failed to load profile from backend', e);
    return null;
  }
}

// ============================================
// 1. POPULATE HERO & ABOUT
// ============================================
function loadProfileData(p) {
  document.title = `${p.name} — Photographer | ECO SNAP`;

  const bName = document.getElementById("breadcrumbName");
  if (bName) bName.textContent = p.name;

  const coverEl = document.getElementById("profHeroCover");
  if (coverEl && p.cover) {
    coverEl.style.backgroundImage = `url('${p.cover}')`;
    coverEl.style.backgroundSize = "cover";
    coverEl.style.backgroundPosition = "center";
  }

  const avatarEl = document.getElementById("profAvatar");
  if (avatarEl && p.avatar) {
    avatarEl.src = p.avatar;
    avatarEl.alt = p.name;
  }

  const nameEl = document.getElementById("profName");
  if (nameEl) nameEl.textContent = p.name;

  const tagEl = document.getElementById("profTagline");
  if (tagEl) tagEl.textContent = p.tagline;

  const locEl = document.getElementById("profLocation");
  if (locEl) locEl.textContent = p.location;

  const expEl = document.getElementById("profExp");
  if (expEl) expEl.textContent = p.experience;

  const shootsEl = document.getElementById("profShootsCount");
  if (shootsEl) shootsEl.textContent = p.shoots;

  const tagsContainer = document.getElementById("profTags");
  if (tagsContainer) {
    tagsContainer.innerHTML = p.tags.map(t => `<span>${escapeHtml(t)}</span>`).join("");
  }

  const ratingEl = document.getElementById("profRating");
  if (ratingEl) ratingEl.textContent = p.rating;

  const revCountEl = document.getElementById("profReviewCount");
  if (revCountEl) revCountEl.textContent = p.reviewCount;

  const starsEl = document.getElementById("profStars");
  if (starsEl) {
    const num = Math.round(parseFloat(p.rating) || 5);
    starsEl.innerHTML = Array(num).fill('<i class="ri-star-fill"></i>').join("") +
      Array(5 - num).fill('<i class="ri-star-line"></i>').join("");
  }

  const priceEl = document.getElementById("profPrice");
  if (priceEl) priceEl.textContent = p.price;

  const aboutTitle = document.getElementById("aboutTitle");
  if (aboutTitle) aboutTitle.textContent = `About ${p.name}`;

  const aboutBio = document.getElementById("aboutBio");
  if (aboutBio) {
    aboutBio.innerHTML = p.bio.split("\n\n").map(para => `<p>${escapeHtml(para)}</p>`).join("");
  }

  // Update Mini Booking Card
  const bkgAvatar = document.getElementById("bookingAvatar");
  if (bkgAvatar) bkgAvatar.src = p.avatar;
  const bkgName = document.getElementById("bookingName");
  if (bkgName) bkgName.textContent = p.name;
  const bkgTagline = document.getElementById("bookingTagline");
  if (bkgTagline) bkgTagline.textContent = p.tagline;
}

// ============================================
// 2. PACKAGES
// ============================================
function renderPackages(packages) {
  const container = document.getElementById("profilePackagesGrid");
  if (!container) return;

  if (!packages || packages.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--gray-500);">
        <i class="ri-price-tag-3-line" style="font-size: 2.5rem; display:block; margin-bottom: 8px;"></i>
        Packages are customized based on event requirements. Contact for a tailored quote.
      </div>
    `;
    return;
  }

  container.innerHTML = packages.map((pkg, idx) => {
    const isPopular = idx === 1 || packages.length === 1;
    const priceFormatted = 'Rs. ' + (Number(pkg.price) || 0).toLocaleString('en-IN');

    return `
      <div class="pkg-card ${isPopular ? 'pkg-card-popular' : ''}">
        ${isPopular ? '<div class="pkg-popular-badge">Most Popular</div>' : ''}
        <div class="pkg-card-header">
          <span class="pkg-icon"><i class="ri-camera-lens-line"></i></span>
          <h3 class="pkg-name">${escapeHtml(pkg.name)}</h3>
          <p class="pkg-tagline">${escapeHtml(pkg.description || 'Tailored session coverage')}</p>
        </div>
        <div class="pkg-price">
          <span class="pkg-price-amount">${priceFormatted}</span>
          <span class="pkg-price-per">/ session</span>
        </div>
        <ul class="pkg-features">
          <li><i class="ri-check-line"></i> ${pkg.durationHours || 4} Hours Coverage</li>
          <li><i class="ri-check-line"></i> Category: ${escapeHtml(pkg.category || 'Event')}</li>
          <li><i class="ri-check-line"></i> High-Resolution Edited Photos</li>
          <li><i class="ri-check-line"></i> Private Digital Gallery</li>
        </ul>
        <button class="btn-select-pkg ${isPopular ? 'btn-select-pkg-primary' : ''}" onclick="selectPackageFromCard(${pkg.id})">
          Select Package
        </button>
      </div>
    `;
  }).join('');
}

window.selectPackageFromCard = function(pkgId) {
  const overlay = document.getElementById("bookingOverlay");
  const bookingTitle = document.getElementById("bookingTitle");
  const bookingForm  = document.getElementById("bookingForm");
  const availForm    = document.getElementById("availabilityForm");
  const availResult  = document.getElementById("availResult");
  const success      = document.getElementById("bookingSuccess");
  const sel          = document.getElementById("bkgPackage");

  if (overlay) {
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    if (bookingTitle) bookingTitle.textContent = "Book a Session";
    if (availForm) availForm.hidden = true;
    if (bookingForm) { bookingForm.hidden = false; bookingForm.style.display = ""; }
    if (success) success.hidden = true;
    if (availResult) { availResult.hidden = true; availResult.className = "avail-result"; }
    if (sel && pkgId) sel.value = String(pkgId);
  }
};

// ============================================
// 3. GALLERY
// ============================================
function renderGallery(images) {
  currentGalleryImages = images || [];
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  if (!images || images.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 48px 20px; color: var(--gray-400);">
        <i class="ri-image-line" style="font-size: 2.5rem; display: block; margin-bottom: 8px;"></i>
        No portfolio photos uploaded yet.
      </div>
    `;
    return;
  }

  grid.innerHTML = images.map((img, idx) => `
    <div class="gallery-item ${img.tall ? 'gallery-item-tall' : ''}" data-category="${escapeHtml(img.tag)}" data-index="${idx}">
      <img src="${img.src}" alt="Portfolio image ${idx + 1}" loading="lazy" />
      <div class="gallery-item-overlay">
        <span class="gallery-item-tag">${capitalize(img.tag)}</span>
        <button class="gallery-item-expand" aria-label="Expand image"><i class="ri-fullscreen-line"></i></button>
      </div>
    </div>
  `).join("");

  // Attach Lightbox click
  grid.querySelectorAll(".gallery-item").forEach(item => {
    item.addEventListener("click", () => {
      const idx = parseInt(item.getAttribute("data-index"));
      openLightbox(idx);
    });
  });
}

function initGalleryFilter() {
  document.querySelectorAll(".g-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".g-filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter");
      const items = document.querySelectorAll(".gallery-item");

      items.forEach(item => {
        const cat = item.getAttribute("data-category");
        if (filter === "all" || cat === filter) {
          item.classList.remove("hidden");
        } else {
          item.classList.add("hidden");
        }
      });
    });
  });
}

// ============================================
// 4. LIGHTBOX
// ============================================
function initLightbox() {
  const overlay = document.getElementById("lightboxOverlay");
  const btnClose = document.getElementById("lightboxClose");
  const btnPrev = document.getElementById("lightboxPrev");
  const btnNext = document.getElementById("lightboxNext");

  btnClose?.addEventListener("click", closeLightbox);
  btnPrev?.addEventListener("click", () => changeLightbox(-1));
  btnNext?.addEventListener("click", () => changeLightbox(1));

  overlay?.addEventListener("click", e => {
    if (e.target === overlay) closeLightbox();
  });

  document.addEventListener("keydown", e => {
    if (!overlay?.classList.contains("active")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") changeLightbox(-1);
    if (e.key === "ArrowRight") changeLightbox(1);
  });
}

function openLightbox(idx) {
  if (!currentGalleryImages.length) return;
  currentLightboxIndex = idx;
  updateLightboxContent();
  const overlay = document.getElementById("lightboxOverlay");
  overlay?.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const overlay = document.getElementById("lightboxOverlay");
  overlay?.classList.remove("active");
  document.body.style.overflow = "";
}

function changeLightbox(dir) {
  if (!currentGalleryImages.length) return;
  currentLightboxIndex = (currentLightboxIndex + dir + currentGalleryImages.length) % currentGalleryImages.length;
  updateLightboxContent();
}

function updateLightboxContent() {
  const img = document.getElementById("lightboxImg");
  const counter = document.getElementById("lightboxCounter");
  const current = currentGalleryImages[currentLightboxIndex];
  if (img && current) {
    img.src = current.src;
  }
  if (counter) {
    counter.textContent = `${currentLightboxIndex + 1} / ${currentGalleryImages.length}`;
  }
}

// ============================================
// 5. REVIEWS
// ============================================
function renderReviews(reviews) {
  const list = document.getElementById("reviewsList");
  const summary = document.querySelector(".reviews-summary");
  if (!list) return;

  const total = (reviews || []).length;
  const avg = total ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / total).toFixed(1) : "0.0";

  if (summary) {
    if (total === 0) {
      summary.style.display = "none";
    } else {
      summary.style.display = "";
      const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(r => {
        const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
        counts[star] = (counts[star] || 0) + 1;
      });

      const fullStars = Math.round(+avg);
      const starsHtml = Array(fullStars).fill('<i class="ri-star-fill"></i>').join('') +
                        Array(5 - fullStars).fill('<i class="ri-star-line"></i>').join('');

      summary.innerHTML = `
        <div class="reviews-score">
          <span class="reviews-score-num">${avg}</span>
          <div class="reviews-score-stars" style="color:#f59e0b;">${starsHtml}</div>
          <span class="reviews-score-count">${total} review${total === 1 ? '' : 's'}</span>
        </div>
        <div class="reviews-breakdown">
          ${[5, 4, 3, 2, 1].map(star => {
            const pct = Math.round((counts[star] / total) * 100);
            return `
              <div class="rb-row">
                <span class="rb-label">${star} star${star > 1 ? 's' : ''}</span>
                <div class="rb-bar-wrap">
                  <div class="rb-bar rb-bar-${star}" style="width: ${pct}%;"></div>
                </div>
                <span class="rb-pct">${pct}%</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }

  if (!reviews || reviews.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; color: var(--gray-400);">
        <i class="ri-star-line" style="font-size: 2.5rem; display: block; margin-bottom: 8px;"></i>
        No reviews yet. Complete a session to leave the first review!
      </div>
    `;
    const btnMore = document.getElementById("btnLoadMoreReviews");
    if (btnMore) btnMore.style.display = "none";
    return;
  }

  list.innerHTML = reviews.map(r => {
    const initials = (r.name || 'C').split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const stars = Array(Math.min(5, Math.max(1, r.rating))).fill('<i class="ri-star-fill"></i>').join("") +
      Array(5 - Math.min(5, Math.max(1, r.rating))).fill('<i class="ri-star-line"></i>').join("");
    return `
      <div class="review-card">
        <div class="review-header">
          <div class="review-user">
            <div class="review-avatar-initials">${initials}</div>
            <div>
              <div class="review-user-name">${escapeHtml(r.name)}</div>
              <div class="review-user-event">${escapeHtml(r.event)}</div>
            </div>
          </div>
          <div class="review-meta">
            <div class="review-stars" style="color:#f59e0b;">${stars}</div>
            <div class="review-date">${escapeHtml(r.date)}</div>
          </div>
        </div>
        <p class="review-body">"${escapeHtml(r.body)}"</p>
      </div>
    `;
  }).join("");
}

// ============================================
// 6. BOOKING & AVAILABILITY MODAL
// ============================================
function initBookingModal(p) {
  const overlay = document.getElementById("bookingOverlay");
  const btnClose = document.getElementById("bookingClose");
  const bookingForm = document.getElementById("bookingForm");
  const availForm = document.getElementById("availabilityForm");
  const availResult = document.getElementById("availResult");
  const success = document.getElementById("bookingSuccess");
  const bookingTitle = document.getElementById("bookingTitle");

  // Populate package dropdown dynamically from photographer's real packages
  const pkgSelect = document.getElementById("bkgPackage");
  if (pkgSelect && p && p.packages && p.packages.length > 0) {
    pkgSelect.innerHTML = '<option value="">-- No Package (Hourly Rate) --</option>' +
      p.packages
        .filter(pkg => pkg.active !== false)
        .map(pkg => `<option value="${pkg.id}">${escapeHtml(pkg.packageName || pkg.name)} — Rs. ${Number(pkg.price || 0).toLocaleString('en-IN')}</option>`)
        .join('');
  }

  // Pre-fill location from photographer profile
  const locField = document.getElementById("bkgLocation");
  if (locField && p && p.location && !locField.value) {
    locField.value = p.location;
  }

  // Pre-fill name & email from session if available
  if (window.EcoSnapAPI) {
    EcoSnapAPI.me().then(me => {
      if (me && me.user) {
        const nameField = document.getElementById("bkgName");
        const emailField = document.getElementById("bkgEmail");
        if (nameField && !nameField.value) nameField.value = me.user.fullName || '';
        if (emailField && !emailField.value) emailField.value = me.user.email || '';
      }
    }).catch(() => {});
  }

  function openModal(mode = "booking") {
    if (!overlay) return;
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";

    if (mode === "availability") {
      if (bookingTitle) bookingTitle.textContent = "Check Availability";
      if (availForm) availForm.hidden = false;
      if (bookingForm) bookingForm.hidden = true;
    } else {
      if (bookingTitle) bookingTitle.textContent = "Book a Session";
      if (availForm) availForm.hidden = true;
      if (bookingForm) {
        bookingForm.hidden = false;
        bookingForm.style.display = "";
      }
    }
    if (success) success.hidden = true;
    if (availResult) {
      availResult.hidden = true;
      availResult.textContent = "";
      availResult.className = "avail-result";
    }
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove("active");
    document.body.style.overflow = "";
    if (availForm) availForm.hidden = true;
    if (success) success.hidden = true;
    if (availResult) {
      availResult.hidden = true;
      availResult.textContent = "";
      availResult.className = "avail-result";
    }
  }

  document.getElementById("btnBookNow")?.addEventListener("click", () => openModal("booking"));
  document.getElementById("btnCheckAvail")?.addEventListener("click", () => openModal("availability"));

  btnClose?.addEventListener("click", closeModal);
  overlay?.addEventListener("click", e => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  document.getElementById("btnCloseSuccess")?.addEventListener("click", () => {
    closeModal();
    if (bookingForm) {
      bookingForm.style.display = "";
      bookingForm.reset();
    }
    if (success) success.hidden = true;
  });

  // Booking form submission
  bookingForm?.addEventListener("submit", async e => {
    e.preventDefault();
    let valid = true;

    ["bkgName", "bkgEmail", "bkgDate", "bkgLocation"].forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field && !field.value.trim()) {
        field.classList.add("error");
        valid = false;
        field.addEventListener("input", () => field.classList.remove("error"), { once: true });
      }
    });

    if (!valid) return;

    const btn = document.getElementById("btnSubmitBooking");
    if (btn) {
      btn.innerHTML = '<i class="ri-loader-4-line spin"></i> Sending...';
      btn.disabled = true;
    }

    const selPkg = document.getElementById("bkgPackage");
    const pkgVal = selPkg && selPkg.value ? parseInt(selPkg.value) : null;
    const pkgId = pkgVal && !isNaN(pkgVal) ? pkgVal : null;

    // timeSlot value is already uppercase (MORNING/AFTERNOON/EVENING/FULL_DAY) from the HTML
    const timeSlotVal = (document.getElementById("bkgTimeSlot") || {}).value || 'MORNING';
    // eventType value is already uppercase (WEDDING/PORTRAIT/etc.) from the HTML
    const eventTypeVal = (document.getElementById("bkgEventType") || {}).value || 'WEDDING';
    const locInputVal = (document.getElementById("bkgLocation") || {}).value || '';

    const payload = {
      photographerProfileId: currentProfile ? currentProfile.id : null,
      packageId: pkgId,
      eventType: eventTypeVal,
      eventDate: (document.getElementById("bkgDate") || {}).value,
      timeSlot: timeSlotVal,
      location: locInputVal.trim() || (currentProfile ? currentProfile.location || 'Kathmandu' : 'Kathmandu'),
      notes: (document.getElementById("bkgMessage") || {}).value || ''
    };

    try {
      const me = await EcoSnapAPI.me();
      if (!me || !me.user) {
        const ctx = (window.EcoSnapSession && typeof window.EcoSnapSession.getPathContext === 'function')
          ? window.EcoSnapSession.getPathContext()
          : { root: './', pages: 'pages/' };
        window.location.href = ctx.pages + 'login.html';
        return;
      }
      if (me.user.role === 'PHOTOGRAPHER' || me.user.role === 'ADMIN') {
        alert('Booking is only available for Client accounts. Please log in with your client credentials.');
        if (btn) { btn.innerHTML = '<i class="ri-send-plane-fill"></i> Send Booking Request'; btn.disabled = false; }
        return;
      }
      await EcoSnapAPI.createBooking(payload);
      bookingForm.style.display = "none";
      if (success) success.hidden = false;
    } catch (err) {
      const msg = err.message || 'Could not send booking request.';
      const status = err.status;
      if (status === 401) {
        const ctx = (window.EcoSnapSession && typeof window.EcoSnapSession.getPathContext === 'function')
          ? window.EcoSnapSession.getPathContext()
          : { root: './', pages: 'pages/' };
        alert('Please log in as a Client to make a booking.');
        window.location.href = ctx.pages + 'login.html';
      } else if (status === 403) {
        alert('Only Client accounts can make bookings. Please log in with your Client credentials.');
      } else {
        alert(msg);
      }
      if (btn) {
        btn.innerHTML = '<i class="ri-send-plane-fill"></i> Send Booking Request';
        btn.disabled = false;
      }
    }
  });

  // Availability form submission
  availForm?.addEventListener("submit", async e => {
    e.preventDefault();
    const dateInput = document.getElementById("availDate");
    const slotInput = document.getElementById("availTimeSlot");
    const submitBtn = document.getElementById("btnCheckAvailSubmit");

    const selectedDate = dateInput?.value;
    if (!selectedDate) {
      dateInput?.classList.add("error");
      dateInput?.addEventListener("input", () => dateInput.classList.remove("error"), { once: true });
      return;
    }

    if (submitBtn) {
      submitBtn.innerHTML = '<i class="ri-loader-4-line spin"></i> Checking...';
      submitBtn.disabled = true;
    }

    try {
      const slot = slotInput?.value || "MORNING";
      const profileId = currentProfile ? currentProfile.id : null;
      const res = await EcoSnapAPI.checkAvailability(profileId, selectedDate, slot);
      const available = res === true || (res && res.available === true);

      const slotLabel = { MORNING: "Morning", AFTERNOON: "Afternoon", EVENING: "Evening", FULL_DAY: "Full Day" }[slot] || slot;
      const dateStr = new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

      if (available) {
        showAvailResult(true, `<i class="ri-checkbox-circle-fill"></i> <span><strong>${slotLabel}</strong> on ${dateStr} is <strong>available</strong>!</span>`);
      } else {
        showAvailResult(false, `<i class="ri-close-circle-fill"></i> <span><strong>${slotLabel}</strong> on ${dateStr} is <strong>unavailable</strong>. Please choose another slot.</span>`);
      }
    } catch (err) {
      showAvailResult(false, '<i class="ri-close-circle-fill"></i> <span>' + (err.message || 'Could not check availability.') + '</span>');
    } finally {
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="ri-calendar-check-line"></i> Check Availability';
        submitBtn.disabled = false;
      }
    }
  });

  function showAvailResult(isAvailable, html) {
    if (!availResult) return;
    availResult.innerHTML = html;
    availResult.className = "avail-result " + (isAvailable ? "avail-result--available" : "avail-result--unavailable");
    availResult.hidden = false;
  }
}

// ============================================
// 7. TABS
// ============================================
function initTabs() {
  const tabs = document.querySelectorAll(".prof-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");

      const targetId = tab.getAttribute("data-target");
      const targetSec = document.getElementById(targetId);
      if (targetSec) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elemRect = targetSec.getBoundingClientRect().top;
        const elemPos  = elemRect - bodyRect;
        const offsetPos = elemPos - offset;
        window.scrollTo({ top: offsetPos, behavior: "smooth" });
      }
    });
  });
}

// ============================================
// 8. FAQ
// ============================================
function initFAQ() {
  document.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll(".faq-question").forEach(b => {
        b.setAttribute("aria-expanded", "false");
        b.nextElementSibling?.classList.remove("open");
      });
      if (!isOpen) {
        btn.setAttribute("aria-expanded", "true");
        btn.nextElementSibling?.classList.add("open");
      }
    });
  });
}

// ============================================
// 9. SAVE BUTTON
// ============================================
function initSaveButton() {
  const btn = document.getElementById("btnSave");
  if (!btn) return;
  btn.addEventListener("click", () => {
    btn.classList.toggle("saved");
    const icon = btn.querySelector("i");
    if (icon) {
      icon.className = btn.classList.contains("saved") ? "ri-heart-fill" : "ri-heart-line";
    }
  });
}

// ============================================
// HELPERS
// ============================================
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
