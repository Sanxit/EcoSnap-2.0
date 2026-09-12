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
      filterPhotographers();
    });
    updateSliderTrack();
  }

  // ============================================
  // 4. REAL-TIME FILTERING ENGINE
  // ============================================
  const cardsGrid = document.getElementById("pgCardsGrid");
  const resultCount = document.getElementById("resultCount");
  const emptyState = document.getElementById("pgEmptyState");
  const allCards = Array.from(document.querySelectorAll(".pg-card[data-profile-id]"));

  function filterPhotographers() {
    const selectedSpecs = Array.from(
      document.querySelectorAll("#specialtiesBody input[type='checkbox']:checked")
    ).map((cb) => cb.value.toLowerCase());

    const selectedLocs = Array.from(
      document.querySelectorAll("#locationBody input[type='checkbox']:checked")
    ).map((cb) => cb.value.toLowerCase());

    const maxPrice = priceSlider ? parseInt(priceSlider.value) : 60000;

    let visibleCount = 0;

    allCards.forEach((card) => {
      const cardSpecs = (card.getAttribute("data-specialties") || "")
        .toLowerCase()
        .split(",")
        .map((s) => s.trim());
      const cardLoc = (card.getAttribute("data-location") || "").toLowerCase().trim();
      const cardPrice = parseInt(card.getAttribute("data-price") || 0);

      const matchesSpec =
        selectedSpecs.length === 0 ||
        selectedSpecs.some((s) => cardSpecs.includes(s));

      const matchesLoc =
        selectedLocs.length === 0 ||
        selectedLocs.some((loc) => {
          if (loc === "other") {
            return cardLoc === "other" || cardLoc === "dharan" || cardLoc === "butwal";
          }
          return cardLoc.includes(loc);
        });

      const matchesPrice = cardPrice <= maxPrice;
      const isMatch = matchesSpec && matchesLoc && matchesPrice;

      if (isMatch) {
        card.classList.remove("filtered-out");
        visibleCount++;
      } else {
        card.classList.add("filtered-out");
      }
    });

    if (resultCount) {
      resultCount.innerHTML = `Showing <strong>${visibleCount}</strong> of ${allCards.length} photographers`;
    }

    if (emptyState) {
      emptyState.classList.toggle("visible", visibleCount === 0);
    }

    updateActiveBadge();
  }

  document.querySelectorAll(".filter-option input[type='checkbox']").forEach((cb) => {
    cb.addEventListener("change", filterPhotographers);
  });

  const btnApply = document.getElementById("btnApplyFilter");
  if (btnApply) {
    btnApply.addEventListener("click", () => {
      filterPhotographers();
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

    filterPhotographers();
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
    if (emptyState) cardsGrid.appendChild(emptyState);
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

  // Profile card navigation
  document.querySelectorAll('.pg-card[data-profile-id]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-profile-id');
      window.location.href = `photographer-profile.html?id=${id}`;
    });
  });

  filterPhotographers();
});
