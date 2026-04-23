// scroll-behavior.js — Snap-scroll between Home & Products sections
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const homeSection    = document.getElementById('home-section');
    const productsSection = document.getElementById('products-section');
    if (!homeSection || !productsSection) return;

    const navLinks     = document.querySelectorAll('.nav-link');
    const homeLink     = [...navLinks].find(l => l.getAttribute('href') === 'index.html');
    const productsLink = [...navLinks].find(l => l.getAttribute('href') === 'products.html');

    let isSnapping     = false;
    let currentSection = 'home';

    // ── Helpers ──────────────────────────────────────────────────

    /** Move the active pill + swap icons to match the given section */
    function setActiveNav(section) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        const icon = link.querySelector('.nav-icon');
        if (icon) icon.src = icon.dataset.normal;
      });

      const activeLink = section === 'home' ? homeLink : productsLink;
      if (activeLink) {
        activeLink.classList.add('active');
        const icon = activeLink.querySelector('.nav-icon');
        if (icon) icon.src = icon.dataset.active;
      }

      currentSection = section;
    }

    /** Smoothly scroll to a section and update navbar */
    function snapTo(section) {
      if (isSnapping) return;
      isSnapping = true;

      const target = section === 'home' ? homeSection : productsSection;
      
      // Use absolute coordinates which are more reliable than scrollIntoView
      window.scrollTo({
        top: target.offsetTop,
        behavior: 'smooth'
      });
      setActiveNav(section);

      // Lock out further snaps until the smooth scroll finishes (approx 600ms)
      setTimeout(() => { isSnapping = false; }, 600);
    }

    // ── Wheel snap ───────────────────────────────────────────────

    window.addEventListener('wheel', (e) => {
      if (isSnapping) { e.preventDefault(); return; }

      // Ignore tiny accidental flicks
      if (Math.abs(e.deltaY) < 4) return;

      if (currentSection === 'home' && e.deltaY > 0) {
        // Scrolling DOWN from Home → snap to Products
        e.preventDefault();
        snapTo('products');

      } else if (currentSection === 'products' && e.deltaY < 0) {
        // Scrolling UP inside Products → only snap when at the very top
        const productsTop = productsSection.getBoundingClientRect().top;
        if (productsTop >= -10) {
          e.preventDefault();
          snapTo('home');
        }
        // else: normal scroll within Products — don't interfere
      }
    }, { passive: false });

    // ── Touch snap (mobile) ──────────────────────────────────────

    let touchStartY = 0;
    let touchHandled = false;

    window.addEventListener('touchstart', (e) => {
      touchStartY  = e.touches[0].clientY;
      touchHandled = false;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (isSnapping || touchHandled) return;

      const deltaY = touchStartY - e.touches[0].clientY; // positive = swipe up

      if (currentSection === 'home' && deltaY > 40) {
        touchHandled = true;
        snapTo('products');

      } else if (currentSection === 'products' && deltaY < -40) {
        const productsTop = productsSection.getBoundingClientRect().top;
        if (productsTop >= -10) {
          touchHandled = true;
          snapTo('home');
        }
      }
    }, { passive: false });

    // ── Nav click overrides ──────────────────────────────────────
    // Capture phase so we intercept BEFORE navbar-complete.js navigates

    document.addEventListener('click', (e) => {
      const link = e.target.closest('.nav-link');
      if (!link) return;

      const href = link.getAttribute('href');

      if (href === 'index.html') {
        e.preventDefault();
        e.stopImmediatePropagation();
        snapTo('home');
      } else if (href === 'products.html') {
        e.preventDefault();
        e.stopImmediatePropagation();
        snapTo('products');
      }
    }, true); // ← capture phase

    // ── Scroll safety net ────────────────────────────────────────
    // Keep currentSection in sync if the user scrolls by other means
    // (keyboard, scrollbar drag, etc.)

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (isSnapping || ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const threshold  = productsSection.offsetTop - 60;
        const newSection = window.scrollY >= threshold ? 'products' : 'home';

        if (newSection !== currentSection) {
          setActiveNav(newSection);
        }
        ticking = false;
      });
    });

    // ── Initial state on page load / refresh ─────────────────────
    if (window.scrollY > homeSection.offsetHeight / 2) {
      setActiveNav('products');
    }
  });
})();
