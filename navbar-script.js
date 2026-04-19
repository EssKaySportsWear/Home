// Navbar indicator positioning - desktop horizontal + mobile vertical
const navbar = document.querySelector('.site-nav');
const navItems = document.querySelectorAll('.nav-link');
const indicator = document.getElementById('indicator');

function isMobile() {
  return window.innerWidth <= 768 || document.body.classList.contains('mobile-nav-open');
}

function moveIndicator(el) {
  if (!indicator) return;
  
  const rect = el.getBoundingClientRect();
  const container = isMobile() ? document.body : navbar;
  const containerRect = container.getBoundingClientRect();
  
  if (isMobile()) {
    // Vertical sidebar positioning
    const y = rect.top - containerRect.top;
    const height = rect.height;
    indicator.style.transform = `translateY(${y}px)`;
    indicator.style.width = '100%';
    indicator.style.height = `${height}px`;
    indicator.style.left = '0';
    indicator.style.top = 'auto';
  } else {
    // Horizontal desktop positioning
    const x = rect.left - containerRect.left;
    const width = rect.width;
    indicator.style.transform = `translateX(${x}px)`;
    indicator.style.width = `${width}px`;
    indicator.style.height = 'auto';
    indicator.style.top = '5px';
  }
}

// Initial position
document.addEventListener('DOMContentLoaded', () => {
  const activeItem = document.querySelector('.nav-link.active');
  if (activeItem) moveIndicator(activeItem);
});

// Listen for active changes (triggered by navbar-complete.js)
const observer = new MutationObserver(() => {
  const activeItem = document.querySelector('.nav-link.active');
  if (activeItem) moveIndicator(activeItem);
});
navItems.forEach(item => observer.observe(item, { attributes: true, attributeFilter: ['class'] }));

// Resize and mobile open/close handler
window.addEventListener('resize', () => {
  const activeItem = document.querySelector('.nav-link.active');
  if (activeItem) moveIndicator(activeItem);
});

document.body.addEventListener('mobile-nav-toggle', () => {
  const activeItem = document.querySelector('.nav-link.active');
  if (activeItem) moveIndicator(activeItem);
});
