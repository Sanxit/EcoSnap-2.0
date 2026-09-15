// Homepage dynamic data loading & hero search
document.addEventListener('DOMContentLoaded', function () {
  // 1. Hero Search Handler
  var btnSearch = document.getElementById('btnHeroSearch');
  if (btnSearch) {
    btnSearch.addEventListener('click', function () {
      var specialty = document.getElementById('searchSpecialty') ? document.getElementById('searchSpecialty').value : '';
      var location = document.getElementById('searchLocation') ? document.getElementById('searchLocation').value : '';
      var budget = document.getElementById('searchBudget') ? document.getElementById('searchBudget').value : '';

      var params = new URLSearchParams();
      if (specialty) params.set('specialty', specialty);
      if (location) params.set('location', location);
      if (budget) params.set('budget', budget);

      var qs = params.toString();
      window.location.href = 'pages/photographers.html' + (qs ? '?' + qs : '');
    });
  }

  // 2. Load Dynamic Content from Backend API
  loadHomeDynamicData();
});

async function loadHomeDynamicData() {
  if (!window.EcoSnapAPI) return;

  try {
    const [photographers, packages, reviews, stats] = await Promise.all([
      EcoSnapAPI.photographers().catch(() => []),
      EcoSnapAPI.allPackages().catch(() => []),
      EcoSnapAPI.publicReviews().catch(() => []),
      EcoSnapAPI.publicStats().catch(() => null)
    ]);

    // Render Featured Photographers
    if (Array.isArray(photographers) && photographers.length > 0) {
      renderHomePhotographers(photographers.slice(0, 6));
    }

    // Render Popular Packages
    if (Array.isArray(packages) && packages.length > 0) {
      renderHomePackages(packages.slice(0, 3));
    }

    // Render Testimonials
    if (Array.isArray(reviews) && reviews.length > 0) {
      renderHomeTestimonials(reviews.slice(0, 3));
    }

    // Update Live Platform Statistics
    if (stats) {
      updateHomeStats(stats);
    }
  } catch (e) {
    console.warn('Home page dynamic data load error:', e);
  }
}

function renderHomePhotographers(list) {
  const container = document.getElementById('homePhotographersGrid');
  if (!container) return;

  container.innerHTML = list.map((p, idx) => {
    const rating = p.rating ? Number(p.rating).toFixed(1) : '5.0';
    const tags = (p.specialization || 'General').split(',').map(s => s.trim()).filter(Boolean);
    const cover = p.coverImageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80';
    const avatar = p.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    const delay = (idx % 3) * 0.1;

    return `
      <div class="photographer-card reveal visible" style="transition-delay: ${delay}s">
        <div class="card-cover">
          <img src="${cover}" alt="${p.ownerName || 'Photographer'} Portfolio" loading="lazy" />
          <div class="card-rating">
            <i class="ri-star-fill"></i> ${rating}
          </div>
        </div>
        <div class="card-body">
          <img class="card-avatar" src="${avatar}" alt="${p.ownerName || 'Photographer'}" loading="lazy" />
          <div class="card-info">
            <h3 class="card-name">${p.ownerName || 'Photographer'}</h3>
            <p class="card-location">
              <i class="ri-map-pin-2-fill"></i> ${p.location || 'Nepal'}
            </p>
            <div class="card-tags">
              ${tags.slice(0, 2).map(t => `<span>${t}</span>`).join('')}
            </div>
            <button class="btn-profile" onclick="window.location.href='pages/photographer-profile.html?id=${p.id}'">
              View Profile
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderHomePackages(list) {
  const container = document.getElementById('homePackagesGrid');
  if (!container) return;

  container.innerHTML = list.map((pkg, idx) => {
    const isFeatured = idx === 1;
    const priceFormatted = 'Rs. ' + (Number(pkg.price) || 0).toLocaleString('en-IN');
    const delay = idx * 0.1;

    return `
      <div class="package-card ${isFeatured ? 'featured' : ''} reveal visible" style="transition-delay: ${delay}s">
        ${isFeatured ? '<div class="package-badge">Most Popular</div>' : ''}
        <h3 class="package-name">${pkg.name}</h3>
        <p class="package-desc">${pkg.description || 'Professional photography coverage tailored for your special event.'}</p>
        <div class="package-price">
          <span class="amount">${priceFormatted}</span>
          <span class="period">/event</span>
        </div>
        <ul class="package-features">
          <li><i class="ri-checkbox-circle-fill"></i> ${pkg.durationHours || 4} Hours Coverage</li>
          <li><i class="ri-checkbox-circle-fill"></i> Category: ${pkg.category || 'Event'}</li>
          <li><i class="ri-checkbox-circle-fill"></i> Professional Editing Included</li>
          <li><i class="ri-checkbox-circle-fill"></i> Digital High-Res Gallery</li>
        </ul>
        <button class="btn-package ${isFeatured ? 'btn-package-filled' : 'btn-package-outline'}"
          onclick="window.location.href='pages/photographers.html?specialty=${encodeURIComponent((pkg.category||'').toLowerCase())}'">
          Select Package
        </button>
      </div>
    `;
  }).join('');
}

function renderHomeTestimonials(list) {
  const container = document.getElementById('homeTestimonialsGrid');
  if (!container) return;

  container.innerHTML = list.map((r, idx) => {
    const stars = Math.min(5, Math.max(1, r.rating || 5));
    const delay = idx * 0.1;
    const clientName = r.customerName || 'Verified Client';
    const photogName = r.photographerName ? 'Session with ' + r.photographerName : 'EcoSnap Client';
    const avatarSeed = Math.abs(hashCode(clientName)) % 70 + 1;
    const avatarUrl = `https://i.pravatar.cc/150?img=${avatarSeed}`;

    return `
      <div class="testimonial-card reveal visible" style="transition-delay: ${delay}s">
        <div class="testimonial-stars" style="color:#f59e0b;">
          ${'<i class="ri-star-fill"></i>'.repeat(stars)}
          ${'<i class="ri-star-line"></i>'.repeat(5 - stars)}
        </div>
        <p class="quote">"${escapeHtml(r.comment)}"</p>
        <div class="testimonial-author">
          <img src="${avatarUrl}" alt="${clientName}" loading="lazy" />
          <div>
            <div class="author-name">${clientName}</div>
            <div class="author-role">${photogName}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function updateHomeStats(stats) {
  const statPhoto = document.getElementById('statPhotographers');
  const statBk = document.getElementById('statBookings');
  const statRt = document.getElementById('statRating');
  const statDist = document.getElementById('statDistricts');

  if (statPhoto) {
    statPhoto.setAttribute('data-target', stats.photographersCount + '+');
    statPhoto.textContent = stats.photographersCount + '+';
  }
  if (statBk) {
    statBk.setAttribute('data-target', stats.bookingsCount + '+');
    statBk.textContent = stats.bookingsCount + '+';
  }
  if (statRt) {
    statRt.setAttribute('data-target', String(stats.averageRating));
    statRt.textContent = String(stats.averageRating);
  }
  if (statDist) {
    statDist.setAttribute('data-target', stats.districtsCount + '+');
    statDist.textContent = stats.districtsCount + '+';
  }

  const heroRating = document.getElementById('heroRatingValue');
  const heroPkg = document.getElementById('heroPackagePrice');
  if (heroRating) heroRating.textContent = String(stats.averageRating);
  if (heroPkg && stats.minPackagePrice) {
    heroPkg.textContent = 'Rs. ' + Number(stats.minPackagePrice).toLocaleString('en-IN');
  }
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
