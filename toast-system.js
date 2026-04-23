/**
 * Premium Toast & Dialog System - EssKay Sportswear
 * Replaces alert(), confirm(), and prompt() with Glassmorphism UI
 */

// 1. CSS Injection
const toastStyles = `
  @keyframes toast-slide-in {
    0% { transform: translateY(100px) scale(0.9); opacity: 0; }
    100% { transform: translateY(0) scale(1); opacity: 1; }
  }
  @keyframes toast-fade-out {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.9); }
  }
  @keyframes spinner-rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  #toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
  }

  .toast-item {
    pointer-events: auto;
    min-width: 280px;
    max-width: 400px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 0 10px rgba(255,255,255,0.05);
    display: flex;
    align-items: center;
    gap: 12px;
    color: #1f150f;
    font-family: 'Sora', sans-serif;
    font-size: 14px;
    font-weight: 500;
    animation: toast-slide-in 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    transition: all 0.3s ease;
  }

  .toast-item.removing {
    animation: toast-fade-out 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  .toast-icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  .toast-success .toast-icon { background: #e6f4ea; color: #1e7e34; }
  .toast-error .toast-icon { background: #fdf2f2; color: #c81e1e; }
  .toast-loading .toast-icon { background: rgba(0,0,0,0.05); color: #72a5b8; }

  .toast-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spinner-rotate 0.8s linear infinite;
  }

  /* Custom Modal for Confirm/Prompt */
  #custom-dialog-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(8px);
    z-index: 10001;
    display: none;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .custom-dialog-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24px;
    padding: 32px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.2);
    text-align: center;
    animation: toast-slide-in 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    color: #1f150f;
  }

  .custom-dialog-card h3 { font-family: 'Bebas Neue', sans-serif; font-size: 28px; margin-bottom: 12px; letter-spacing: 1px; }
  .custom-dialog-card p { font-size: 15px; opacity: 0.8; margin-bottom: 24px; line-height: 1.5; }
  
  .dialog-input {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    border: 1px solid rgba(0,0,0,0.1);
    margin-bottom: 20px;
    outline: none;
    font-family: inherit;
  }

  .dialog-btns { display: flex; gap: 12px; }
  .dialog-btn {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: transform 0.2s;
  }
  .dialog-btn:active { transform: scale(0.95); }
  .btn-confirm { background: #1f150f; color: white; }
  .btn-cancel { background: #f0f4f8; color: #555; }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = toastStyles;
document.head.appendChild(styleSheet);

const container = document.createElement('div');
container.id = 'toast-container';
document.body.appendChild(container);

const dialogOverlay = document.createElement('div');
dialogOverlay.id = 'custom-dialog-overlay';
dialogOverlay.innerHTML = `
  <div class="custom-dialog-card">
    <h3 id="dialog-title">Confirm</h3>
    <p id="dialog-message"></p>
    <input type="text" id="dialog-input-field" class="dialog-input" style="display: none;">
    <div class="dialog-btns">
      <button id="dialog-cancel" class="dialog-btn btn-cancel">Cancel</button>
      <button id="dialog-confirm" class="dialog-btn btn-confirm">OK</button>
    </div>
  </div>
`;
document.body.appendChild(dialogOverlay);

// --- Icons Map ---
const icons = {
  success: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"></path></svg>',
  error: '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"></path></svg>',
  loading: '<div class="toast-spinner"></div>'
};

function scheduleRemove(el, ms) {
  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 400);
  }, ms);
}

/**
 * Creates and shows a toast
 * @returns {HTMLElement} The toast element
 */
export function showToast(message, type = 'success', duration = 4000) {
  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || ''}</div>
    <div class="toast-message">${message}</div>
  `;
  container.appendChild(toast);

  // Auto-remove only if not loading (or let updateToast handle it)
  if (type !== 'loading') {
    scheduleRemove(toast, duration);
  }

  return toast;
}

/**
 * Updates an existing toast
 */
export function updateToast(toast, message, type = 'success', duration = 3000) {
  if (!toast) return;
  toast.className = `toast-item toast-${type}`;
  const iconEl = toast.querySelector('.toast-icon');
  const msgEl = toast.querySelector('.toast-message');
  
  if (iconEl) iconEl.innerHTML = icons[type] || '';
  if (msgEl) msgEl.textContent = message;

  scheduleRemove(toast, duration);
}

export async function showConfirm(message, title = 'Confirm Action') {
  return new Promise((resolve) => {
    dialogOverlay.style.display = 'flex';
    document.getElementById('dialog-title').textContent = title;
    document.getElementById('dialog-message').textContent = message;
    document.getElementById('dialog-input-field').style.display = 'none';
    const confirmBtn = document.getElementById('dialog-confirm');
    const cancelBtn = document.getElementById('dialog-cancel');
    const cleanup = (val) => {
      dialogOverlay.style.display = 'none';
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      resolve(val);
    };
    confirmBtn.onclick = () => cleanup(true);
    cancelBtn.onclick = () => cleanup(false);
  });
}

export async function showPrompt(message, defaultValue = '', title = 'Input Required') {
  return new Promise((resolve) => {
    dialogOverlay.style.display = 'flex';
    document.getElementById('dialog-title').textContent = title;
    document.getElementById('dialog-message').textContent = message;
    const input = document.getElementById('dialog-input-field');
    input.style.display = 'block';
    input.value = defaultValue;
    input.focus();
    const confirmBtn = document.getElementById('dialog-confirm');
    const cancelBtn = document.getElementById('dialog-cancel');
    const cleanup = (val) => {
      dialogOverlay.style.display = 'none';
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      resolve(val);
    };
    confirmBtn.onclick = () => cleanup(input.value);
    cancelBtn.onclick = () => cleanup(null);
  });
}
