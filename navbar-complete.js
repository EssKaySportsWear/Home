// Navbar active button styling + mobile toggle
document.addEventListener('DOMContentLoaded', () => {
  const navItems = document.querySelectorAll('.nav-link');
  const hamburgerBtn = document.getElementById('mobile-menu-btn');
  const overlay = document.getElementById('nav-overlay');
  const body = document.body;

  // Set initial active based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  navItems.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });

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
      
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      body.classList.remove('mobile-nav-open'); // Close mobile menu
      
      if (href && href !== '#') {
        window.location.href = href;
      }
    });
    
    // Hover handling
    item.addEventListener('mouseenter', () => {
      if (!item.classList.contains('active')) {
        // Non-active: full hover
        item.style.transform = 'translateY(-2px)';
        item.style.borderColor = 'var(--border-strong)';
        item.style.background = 'rgba(255, 255, 255, 0.06)';
        item.style.boxShadow = '0 18px 38px rgba(5, 15, 25, 0.45)';
        item.style.color = '#000000';
      } else {
        // Active: only color change to black
        item.style.color = '#000000';
      }
    });
    
    item.addEventListener('mouseleave', () => {
      if (!item.classList.contains('active')) {
        // Reset non-active
        item.style.transform = '';
        item.style.borderColor = '';
        item.style.background = '';
        item.style.boxShadow = '';
        item.style.color = '';
      } else {
        // Reset active color
        item.style.color = '';
      }
    });
  });

  // Close on document click (outside sidebar)
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-nav') && body.classList.contains('mobile-nav-open')) {
      body.classList.remove('mobile-nav-open');
    }
  });
});


