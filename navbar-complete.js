// Navbar active button styling + mobile toggle
document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-link');
  const hamburgerBtn = document.getElementById('mobile-menu-btn');
  const overlay = document.getElementById('nav-overlay');
  const body = document.body;

  // ── Icon helpers ──────────────────────────────────────────────
  // Swap a nav-link's icon based on its current state.
  // State priority: active > normal (hovered uses normal icon)
  function setIcon(link, state /* 'active' | 'normal' */) {
    const img = link.querySelector('.nav-icon');
    if (!img) return;
    img.src = state === 'active' ? img.dataset.active : img.dataset.normal;
  }

  // Apply correct icons to ALL nav items based on their class list
  function syncAllIcons() {
    navItems.forEach(link => {
      setIcon(link, link.classList.contains('active') ? 'active' : 'normal');
    });
  }

  // Set initial active based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  navItems.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });

  // Sync icons after active class is set
  syncAllIcons();

  // Hamburger toggle
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      body.classList.toggle('mobile-nav-open');
    });
  }

  // Close on overlay click
  if (overlay) {
    overlay.addEventListener('click', () => {
      body.classList.remove('mobile-nav-open');
    });
  }

  // Close on nav link click + handle navigation
  navItems.forEach(item => {
    item.addEventListener('click', e => {
      const href = item.getAttribute('href');
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      
      if (href === currentPage) {
        // Same page - no action
        body.classList.remove('mobile-nav-open');
        return;
      }
      
      navItems.forEach(i => {
        i.classList.remove('active');
        setIcon(i, 'normal');
      });
      item.classList.add('active');
      setIcon(item, 'active');
      
      body.classList.remove('mobile-nav-open'); // Close mobile menu
      
      if (href && href !== '#') {
        window.location.href = href;
      }
    });
    // Hover handled by CSS in index.html and cart.html now
  });

  // Close on document click (outside sidebar)
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-nav') && body.classList.contains('mobile-nav-open')) {
      body.classList.remove('mobile-nav-open');
    }
  });
});


