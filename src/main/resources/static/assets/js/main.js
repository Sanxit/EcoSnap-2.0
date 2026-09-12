// Global behaviors: navbar scroll, scroll-reveal, counter animations, mobile menu, smooth scrolling.
// Mirrors js/main.js — loaded on every public page in assets/js/ order.

document.addEventListener('DOMContentLoaded', function () {

  // ---- Mobile Menu Toggle ----
  var menuToggle = document.querySelector('.menu-toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (menuToggle && mobileNav) {
    var closeMobileNav = function () {
      menuToggle.classList.remove('active');
      mobileNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    var openMobileNav = function () {
      menuToggle.classList.add('active');
      mobileNav.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
      mobileNav.scrollTop = 0;
      document.body.style.overflow = 'hidden';
    };

    menuToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (mobileNav.classList.contains('open')) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { closeMobileNav(); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        closeMobileNav();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024 && mobileNav.classList.contains('open')) {
        closeMobileNav();
      }
    });
  }

  // ---- Navbar Scroll Effect ----
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // ---- Scroll Reveal Animations ----
  var revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        setTimeout(function () {
          if (entry.target.classList.contains('visible')) {
            entry.target.style.transform = 'none';
          }
        }, 700);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(function (el) { revealObserver.observe(el); });

  // ---- Stats Counter Animation ----
  var statNumbers = document.querySelectorAll('.stat-number');
  var statsAnimated = false;

  function animateCounters() {
    statNumbers.forEach(function (el) {
      var target = el.getAttribute('data-target');
      var isDecimal = target.includes('.');
      var hasPlus = target.includes('+');
      var numericTarget = parseFloat(target.replace('+', ''));
      var duration = 2000;
      var start = performance.now();

      function updateCount(currentTime) {
        var elapsed = currentTime - start;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = eased * numericTarget;
        if (isDecimal) {
          el.textContent = current.toFixed(1) + (hasPlus ? '+' : '');
        } else {
          el.textContent = Math.floor(current).toLocaleString() + (hasPlus ? '+' : '');
        }
        if (progress < 1) { requestAnimationFrame(updateCount); }
      }

      requestAnimationFrame(updateCount);
    });
  }

  if (statNumbers.length > 0) {
    var statsSection = document.querySelector('.stats-section');
    var statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !statsAnimated) {
          statsAnimated = true;
          animateCounters();
          statsObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    if (statsSection) { statsObserver.observe(statsSection); }
  }

  // ---- Smooth Scroll for Anchor Links ----
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      var targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        var navHeight = navbar ? navbar.offsetHeight : 0;
        var targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });
});
