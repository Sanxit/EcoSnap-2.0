/* ============================================
   ECO SNAP — Photographers Page JavaScript
   Depends on: assets/js/main.js (shared base)
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  // ============================================
  // 1. STICKY SIDEBAR & MOBILE TOGGLE ENGINE
  // ============================================
  const filterSidebar = document.querySelector(".filter-sidebar");
  const filterMobileToggle = document.getElementById("filterMobileToggle");
  const filterSidebarTitle = document.getElementById("filterSidebarTitle");
  const filterActiveBadge = document.getElementById("filterActiveBadge");

  if (filterSidebar) {
    filterSidebar.classList.add("visible");
    filterSidebar.style.transform = "none";
  }

  const toggleMobileFilters = () => {
    if (window.innerWidth > 776 || !filterSidebar) return;
    const isCollapsed = filterSidebar.classList.toggle("collapsed");
    if (filterMobileToggle) {
      filterMobileToggle.setAttribute("aria-expanded", String(!isCollapsed));
      const stateText = filterMobileToggle.querySelector(".filter-toggle-state");
      if (stateText) {
        stateText.textContent = isCollapsed ? "Expand" : "Collapse";
      }
    }
  };

  if (filterMobileToggle) {
    filterMobileToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleMobileFilters();
    });
  }

  if (filterSidebarTitle) {
    filterSidebarTitle.addEventListener("click", (e) => {
      if (window.innerWidth <= 776 && !e.target.closest("#filterMobileToggle")) {
        toggleMobileFilters();
      }
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 776 && filterSidebar) {
      filterSidebar.classList.remove("collapsed");
      if (filterMobileToggle) {
        filterMobileToggle.setAttribute("aria-expanded", "true");
        const stateText = filterMobileToggle.querySelector(".filter-toggle-state");
        if (stateText) stateText.textContent = "Collapse";
      }
    }
  });

  const updateActiveBadge = () => {
    if (!filterActiveBadge) return;
    const checkedCount = document.querySelectorAll(
      "#specialtiesBody input[type='checkbox']:checked, #locationBody input[type='checkbox']:checked"
    ).length;
    const isPriceFiltered = priceSlider && parseInt(priceSlider.value) < parseInt(priceSlider.max || 60000);
    const totalActive = checkedCount + (isPriceFiltered ? 1 : 0);

    if (totalActive > 0) {
      filterActiveBadge.textContent = totalActive;
      filterActiveBadge.style.display = "inline-flex";
    } else {
      filterActiveBadge.style.display = "none";
    }
  };

  // ============================================
  // 2. FILTER SIDEBAR — ACCORDION TOGGLE
  // ============================================
  const filterGroups = document.querySelectorAll(".filter-group");

  filterGroups.forEach((group) => {
    const header = group.querySelector(".filter-group-header");
    if (!header) return;
    header.addEventListener("click", () => {
      group.classList.toggle("open");
    });
  });

  // ============================================
  // 3. PRICE RANGE SLIDER
  // ============================================
  const priceSlider = document.getElementById("priceSlider");
  const priceMaxLabel = document.getElementById("priceMax");

  const updateSliderTrack = () => {
    if (!priceSlider || !priceMaxLabel) return;
    const val = parseInt(priceSlider.value);
    priceMaxLabel.textContent = `Rs. ${val.toLocaleString()}`;

    const min = parseInt(priceSlider.min) || 15000;
    const max = parseInt(priceSlider.max) || 60000;
    const pct = ((val - min) / (max - min)) * 100;
    priceSlider.style.background = `linear-gradient(to right, var(--primary-color) ${pct}%, var(--gray-200) ${pct}%)`;
  };

  if (priceSlider) {
    priceSlider.addEventListener("input", () => {
      updateSliderTrack();
      scheduleReload(300); // debounce server reloads while dragging
    });
    updateSliderTrack();
  }

// ============================================
// 4. LIVE DATA ENGINE (server-backed)
// ============================================
  const cardsGrid = document.getElementById("pgCardsGrid");
  const resultCount = document.getElementById("resultCount");
  const emptyState = document.getElementById("pgEmptyState");

  const PLACEHOLDER_IMG =
    'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1 1\'%3E%3C/svg%3E';

  const selectedSpecialties = () =>
    Array.from(document.querySelectorAll("#specialtiesBody input[type='checkbox']:checked"))
      .map((cb) => cb.value.trim().toLowerCase())
      .filter(Boolean);

  const selectedLocations = () =>
    Array.from(document.querySelectorAll("#locationBody input[type='checkbox']:checked"))
      .map((cb) => cb.value.trim().toLowerCase())
      .filter(Boolean);

  const currentMaxPrice = () =>
    priceSlider ? parseInt(priceSlider.value, 10) : null;

  // Filter state as backend query params. Names must match
  // GET /api/photographers → specialization, location, maxPrice.
  // Multiple selections are sent as comma-separated tokens (ANY-of match).
  function currentQueryParams() {
    return {
      specialization: selectedSpecialties().join(",") || null,
      location: selectedLocations().join(",") || null,
      maxPrice: currentMaxPrice(),
    };
  }

  // Normalize a backend photographer record into a card-like object with the
  // same data-* attributes used by the sort engine. Null-safe on every field.
  function toCardData(p) {
    if (!p || typeof p !== "object") return null;
    const specs = String(p.specialization || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const loc = String(p.location || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const packagePrices = (Array.isArray(p.packages) ? p.packages : [])
      .map((pkg) => Number(pkg && pkg.price))
      .filter((n) => !isNaN(n) && n > 0);
    const price = packagePrices.length ? Math.min(...packagePrices) : Number(p.hourlyRate) || 0;
    return {
      id: p.id,
      name: p.ownerName || "Photographer",
      specs: specs,
      loc: loc,
      price: price,
      rating: String(p.rating || 0),
      cover: p.coverImageUrl || p.avatarUrl || PLACEHOLDER_IMG,
      avatar: p.avatarUrl || PLACEHOLDER_IMG,
      tags: specs.length ? specs : ["Photography"],
      verified: p.verified === true
    };
  }

  // Build a card element from backend data and append it to the grid.
  function buildCardEl(card) {
    const el = document.createElement('div');
    el.className = 'pg-card reveal';
    el.setAttribute('data-profile-id', String(card.id));
    el.setAttribute('data-specialties', card.specs.join(','));
    el.setAttribute('data-location', card.loc);
    el.setAttribute('data-price', String(card.price));
    el.setAttribute('data-rating', card.rating);
    el.style.cursor = 'pointer';

    const tagHtml = card.tags.map(t => `<span>${t}</span>`).join('');
    const verifiedHtml = card.verified
      ? '<div class="pg-card-verified"><i class="ri-verified-badge-fill"></i> Verified</div>'
      : '';

    el.innerHTML = `
      <div class="pg-card-cover">
        <img src="${card.cover}" alt="${card.name}" />
        <div class="pg-card-rating-badge"><i class="ri-star-fill"></i> ${card.rating}</div>
        ${verifiedHtml}
      </div>
      <div class="pg-card-body">
        <img class="pg-card-avatar" src="${card.avatar}" alt="${card.name}" />
        <div class="pg-card-info">
          <h3 class="pg-card-name">${card.name}</h3>
          <p class="pg-card-location"><i class="ri-map-pin-2-fill"></i> ${card.loc || 'Nepal'}</p>
          <div class="pg-card-tags">${tagHtml}</div>
        </div>
      </div>
      <div class="pg-card-footer">
        <div class="pg-card-price">
          <span class="price-from">Starting from</span>
          <span class="price-amount">Rs. ${card.price.toLocaleString('en-IN')}</span>
        </div>
        <button class="btn-view-profile">View Profile</button>
      </div>`;

    el.addEventListener('click', () => {
      window.location.href = `photographer-profile.html?id=${card.id}`;
    });
    return el;
  }

  function clearCards() {
    if (!cardsGrid) return;
    cardsGrid.querySelectorAll(".pg-card").forEach((el) => el.remove());
  }

  function updateHeroCount(count) {
    const heroCount = document.querySelector(".pg-title span");
    if (heroCount) heroCount.textContent = String(count);
  }

  function updateResultCount(count) {
    if (resultCount) {
      resultCount.innerHTML = `Showing <strong>${count}</strong> photographer${count === 1 ? "" : "s"}`;
    }
  }

  function showEmptyState(visible) {
    if (emptyState) emptyState.classList.toggle("visible", visible);
  }

  // Load photographers from the live API using the active filters and
  // re-render the grid. Old cards are always cleared first — including when
  // the result set is empty or the request fails (no mock fallback).
  async function loadPhotographers() {
    if (!window.EcoSnapAPI || !cardsGrid) return;
    const params = currentQueryParams();
    try {
      const list = EcoSnapAPI.unwrapList(await EcoSnapAPI.photographers(params));
      const cards = (Array.isArray(list) ? list : [])
        .map(toCardData)
        .filter(Boolean)
        .filter((card) => card.verified);

      clearCards();
      cards.forEach((card) => cardsGrid.appendChild(buildCardEl(card)));
      requestAnimationFrame(() => {
        cardsGrid.querySelectorAll(".pg-card.reveal").forEach((el) => el.classList.add("visible"));
      });
      updateHeroCount(cards.length);
      updateResultCount(cards.length);
      showEmptyState(cards.length === 0);
      updateActiveBadge();
    } catch (e) {
      // Log the failing endpoint + payload for diagnostics.
      console.error(
        "[EcoSnap] GET /api/photographers failed",
        { params: params, reason: e && e.message },
        e
      );
      clearCards();
      updateHeroCount(0);
      updateResultCount(0);
      showEmptyState(true);
      updateActiveBadge();
    }
  }

  let reloadTimer = null;
  function scheduleReload(delayMs) {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(loadPhotographers, delayMs || 0);
  }

  // Any filter change reloads from the live API with matching query params.
  document.querySelectorAll(".filter-option input[type='checkbox']").forEach((cb) => {
    cb.addEventListener("change", () => loadPhotographers());
  });

  const btnApply = document.getElementById("btnApplyFilter");
  if (btnApply) {
    btnApply.addEventListener("click", () => {
      loadPhotographers();
      if (window.innerWidth < 1024 && cardsGrid) {
        cardsGrid.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  // ============================================
  // 5. RESET / CLEAR FILTERS
  // ============================================
  function resetAllFilters() {
    document.querySelectorAll(".filter-option input[type='checkbox']").forEach((cb) => {
      cb.checked = false;
    });

    if (priceSlider) {
      priceSlider.value = priceSlider.max;
      updateSliderTrack();
    }

    loadPhotographers();
  }

  const btnClear = document.getElementById("btnClearFilters");
  if (btnClear) { btnClear.addEventListener("click", resetAllFilters); }

  const btnReset = document.getElementById("btnResetFilters");
  if (btnReset) { btnReset.addEventListener("click", resetAllFilters); }

  // ============================================
  // 6. SORT DROPDOWN — DYNAMIC SORTING
  // ============================================
  const sortSelect = document.getElementById("sortSelect");

  function sortPhotographers() {
    if (!cardsGrid) return;
    const sortMode = sortSelect ? sortSelect.value : "relevance";

    const cards = Array.from(cardsGrid.querySelectorAll(".pg-card[data-profile-id]"));

    cards.sort((a, b) => {
      if (sortMode === "rating") {
        return parseFloat(b.getAttribute("data-rating") || 0) - parseFloat(a.getAttribute("data-rating") || 0);
      } else if (sortMode === "price-low") {
        return parseInt(a.getAttribute("data-price") || 0) - parseInt(b.getAttribute("data-price") || 0);
      } else if (sortMode === "price-high") {
        return parseInt(b.getAttribute("data-price") || 0) - parseInt(a.getAttribute("data-price") || 0);
      } else {
        return parseInt(a.getAttribute("data-profile-id") || 0) - parseInt(b.getAttribute("data-profile-id") || 0);
      }
    });

    cards.forEach((card) => cardsGrid.appendChild(card));
  }

  if (sortSelect) { sortSelect.addEventListener("change", sortPhotographers); }

  // ============================================
  // 7. URL PARAMS — Pre-apply filters from hero search
  // ============================================
  const urlParams = new URLSearchParams(window.location.search);
  const paramSpecialty = urlParams.get("specialty");
  const paramLocation = urlParams.get("location");
  const paramBudget = urlParams.get("budget");

  if (paramSpecialty) {
    const cb = document.querySelector(`#specialtiesBody input[value="${paramSpecialty.toLowerCase()}"]`);
    if (cb) cb.checked = true;
  }

  if (paramLocation) {
    const cb = document.querySelector(`#locationBody input[value="${paramLocation.toLowerCase()}"]`);
    if (cb) cb.checked = true;
  }

  if (paramBudget && priceSlider) {
    const budgetVal = parseInt(paramBudget);
    if (!isNaN(budgetVal)) {
      priceSlider.value = budgetVal;
      updateSliderTrack();
    }
  }

  // Initial load from the live API (URL params pre-applied above).
  loadPhotographers();
});
