import { auth, rtdb } from './firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { ref, onValue } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

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
  const currentHash = window.location.hash;

  function updateActiveState() {
    navItems.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.remove('active');
      
      if (href === currentPage || (href.includes('#') && currentPage === href.split('#')[0] && currentHash === '#' + href.split('#')[1])) {
        link.classList.add('active');
      }
    });

    // Special case for scrolling on Home page
    if (currentPage === 'index.html' || currentPage === '') {
      const prodSection = document.getElementById('products-section');
      if (prodSection) {
        const rect = prodSection.getBoundingClientRect();
        if (rect.top < 150 && rect.bottom > 150) {
          navItems.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes('#products-section')) link.classList.add('active');
          });
        }
      }
    }
    syncAllIcons();
  }

  updateActiveState();
  window.addEventListener('scroll', updateActiveState);

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
    if (!e.target.closest('.site-nav') && document.body.classList.contains('mobile-nav-open')) {
      document.body.classList.remove('mobile-nav-open');
    }
  });

  // ── Cart Badge Logic ──────────────────────────────────────────
  function initCartBadge(user) {
    const cartLinks = document.querySelectorAll('a[href="cart.html"]');
    const productsLinks = document.querySelectorAll('a[href="products.html"]');
    
    // Update products links to point to home section
    productsLinks.forEach(link => {
      link.setAttribute('href', 'index.html#products-section');
    });

    if (!user) {
      cartLinks.forEach(link => {
        const existingBadge = link.querySelector('.cart-badge');
        if (existingBadge) existingBadge.style.display = 'none';
      });
      return;
    }

    const cartRef = ref(rtdb, `carts/${user.uid}`);
    onValue(cartRef, (snap) => {
      const count = snap.exists() ? Object.keys(snap.val()).length : 0;
      cartLinks.forEach(link => {
        let badge = link.querySelector('.cart-badge');
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'cart-badge';
          badge.style.cssText = 'position:absolute; top:-2px; right:-2px; background:#ff4d4d; color:white; font-size:10px; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; box-shadow:0 4px 10px rgba(255, 77, 77, 0.3);';
          link.style.position = 'relative';
          link.appendChild(badge);
        }
        badge.innerText = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      });
    });
  }

  // ── Auth Swap Logic ──────────────────────────────────────────
  function initAuthSwap(user) {
    const authBtn = document.querySelector('.auth-nav-btn');
    const userBtn = document.querySelector('.user-nav-btn');
    const userName = document.getElementById('nav-username');

    if (user) {
      if (authBtn) authBtn.style.display = 'none';
      if (userBtn) {
        userBtn.style.display = 'inline-flex';
        // Handle both button and a tag variations
        const nameSpan = userBtn.querySelector('#nav-username') || userName;
        if (nameSpan) nameSpan.innerText = user.displayName || user.email.split('@')[0];
        
        // If it's a button (on home page), add click to logout or profile
        userBtn.onclick = () => {
          if (confirm('Do you want to logout?')) auth.signOut();
        };
      }
    } else {
      if (authBtn) authBtn.style.display = 'inline-flex';
      if (userBtn) userBtn.style.display = 'none';
    }
  }

  onAuthStateChanged(auth, (user) => {
    initCartBadge(user);
    initAuthSwap(user);
  });
});


