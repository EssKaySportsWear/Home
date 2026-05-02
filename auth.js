/**
 * EssKay Sportswear - Authentication System
 * Clean, Production-Ready Firebase Auth Module
 */

import { auth, rtdb } from './firebase.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
  fetchSignInMethodsForEmail,
  updateProfile,
  updatePassword,
  deleteUser,
  linkWithCredential,
  linkWithPopup,
  unlink,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { ref, set, get, child, query, orderByChild, equalTo, remove, update } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

// --- Import Toast System ---
import { showToast, showConfirm, showPrompt, updateToast } from './toast-system.js';

const ADMIN_EMAIL = 'business.esskaysportswear@gmail.com';

// --- Error Handling Helper ---
function getFriendlyError(error) {
  const code = error.code || '';
  if (code === 'auth/user-not-found') return "User not found";
  if (code === 'auth/wrong-password') return "Incorrect password";
  if (code === 'auth/invalid-email') return "Invalid email address";
  if (code === 'auth/email-already-in-use') return "Email already in use";
  if (code === 'auth/weak-password') return "Password is too weak";
  if (code === 'auth/requires-recent-login') return "Security: Please log in again to continue";
  if (code === 'auth/popup-closed-by-user') return "Login cancelled";
  
  // Strip "Firebase: " prefix if present for other errors
  return error.message.replace('Firebase: ', '').replace(/\(auth\/.*\).*/, '').trim();
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('🔐 Auth system initialized.');

  // --- UI Elements ---
  const elements = {
    sections: {
      login: document.getElementById('login-section'),
      signup: document.getElementById('signup-section'),
      forgot: document.getElementById('forgot-password-section'),
      verify: document.getElementById('verify-email-section')
    },
    buttons: {
      showSignup: document.getElementById('showSignup'),
      showLogin: document.getElementById('showLogin'),
      showForgot: document.getElementById('showForgotPwd'),
      forgotBack: document.getElementById('forgotBackToLogin'),
      loginGoogle: document.getElementById('loginGoogleBtn'),
      signupGoogle: document.getElementById('signupGoogleBtn'),
      userBtn: document.getElementById('nav-user-btn'),
      adminLink: document.getElementById('nav-admin-link'),
      changeEmail: document.getElementById('changeEmailBtn'),
      verifyBack: document.getElementById('verifyBackToLogin'),
      loginBtn: document.getElementById('loginBtn'),
      signupBtn: document.getElementById('signupBtn')
    },
    forms: {
      login: document.getElementById('loginForm'),
      signup: document.getElementById('signupForm'),
      forgot: document.getElementById('forgotIdentityForm')
    },
    inputs: {
      loginEmail: document.getElementById('loginEmail'),
      signupEmail: document.getElementById('signupEmail'),
      signupName: document.getElementById('signupName'),
      signupPhone: document.getElementById('signupPhone')
    },
    containers: {
      loginPasswordGroup: document.getElementById('loginPasswordGroup'),
      signupPasswordWrapper: document.getElementById('signupPasswordWrapper')
    },
    messages: {
      googleDetectLogin: document.getElementById('google-detect-msg-login'),
      googleDetectSignup: document.getElementById('google-detect-msg-signup')
    },
    usernameSpan: document.getElementById('nav-username'),
    displayVerifyEmail: document.getElementById('display-verify-email')
  };

  const googleProvider = new GoogleAuthProvider();
  let verificationCheckInterval = null;
  let isProcessingGoogle = false;

  // --- Account Panel Injection ---
  const accountPanelHtml = `
    <div id="account-panel-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); z-index: 1000; display: none; align-items: center; justify-content: center;">
      <div id="account-panel-card" style="background: rgba(255, 255, 255, 0.9); border-radius: 24px; padding: 40px; width: 100%; max-width: 450px; color: #1f150f; position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
        <button id="close-account-panel" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
        <h2 style="font-family: 'Bebas Neue', sans-serif; font-size: 32px; margin-bottom: 24px; letter-spacing: 1px;">Account Settings</h2>
        
        <div class="account-section" style="margin-bottom: 20px;">
          <label style="font-size: 13px; font-weight: 600; opacity: 0.7; display: block; margin-bottom: 8px;">Full Name</label>
          <div style="display: flex; gap: 10px;">
            <input type="text" id="acc-name" style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); background: white;">
            <button id="btn-update-name" style="padding: 10px 15px; background: #72a5b8; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 13px;">Save</button>
          </div>
        </div>

        <div class="account-section" style="margin-bottom: 20px;">
          <label style="font-size: 13px; font-weight: 600; opacity: 0.7; display: block; margin-bottom: 8px;">Email Address</label>
          <input type="text" id="acc-email" disabled style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.05);">
        </div>

        <div id="acc-security-section" style="margin-bottom: 20px;">
          <label style="font-size: 13px; font-weight: 600; opacity: 0.7; display: block; margin-bottom: 8px;">Security</label>
          <button id="btn-reset-pwd-email" style="width: 100%; padding: 12px; background: #f0f4f8; border: 1px solid #72a5b8; color: #72a5b8; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; display: none;">Send Password Reset Link</button>
        </div>

        <div id="acc-switch-section" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(0,0,0,0.05);">
          <button id="btn-switch-account" style="width: 100%; padding: 14px; background: white; border: 1px solid #72a5b8; color: #72a5b8; border-radius: 12px; cursor: pointer; font-weight: 600; transition: all 0.2s;">
            Switch to Custom Email
          </button>
          <p id="acc-switch-info" style="font-size: 12px; opacity: 0.6; text-align: center; margin-top: 8px;">Security: Google Authenticated</p>
        </div>

        <div style="margin-top: 20px; display: flex; gap: 10px;">
          <button id="btn-logout-panel" style="flex: 1; padding: 14px; background: #1f150f; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600;">Log Out</button>
          <button id="btn-delete-account" style="padding: 14px; background: #fff1f1; border: 1px solid #ff4d4d; color: #ff4d4d; border-radius: 12px; cursor: pointer; font-weight: 600;">Delete</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', accountPanelHtml);

  const panel = {
    overlay: document.getElementById('account-panel-overlay'),
    close: document.getElementById('close-account-panel'),
    name: document.getElementById('acc-name'),
    email: document.getElementById('acc-email'),
    btnUpdateName: document.getElementById('btn-update-name'),
    btnResetEmail: document.getElementById('btn-reset-pwd-email'),
    btnSwitch: document.getElementById('btn-switch-account'),
    btnDelete: document.getElementById('btn-delete-account'),
    btnLogout: document.getElementById('btn-logout-panel'),
    switchInfo: document.getElementById('acc-switch-info')
  };

  async function openAccountPanel() {
    const user = auth.currentUser;
    if (!user) return;
    panel.name.value = user.displayName || '';
    panel.email.value = user.email || '';
    const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
    if (isGoogle) {
      panel.btnResetEmail.style.display = 'none';
      panel.btnSwitch.textContent = 'Switch to Custom Email';
      panel.switchInfo.textContent = 'Security: Google Authenticated';
    } else {
      panel.btnResetEmail.style.display = 'block';
      panel.btnSwitch.textContent = 'Link Google Account';
      panel.switchInfo.textContent = 'Security: Email & Password';
    }
    panel.overlay.style.display = 'flex';
  }

  panel.close?.addEventListener('click', () => panel.overlay.style.display = 'none');
  elements.buttons.userBtn?.addEventListener('click', openAccountPanel);

  panel.btnUpdateName?.addEventListener('click', async () => {
    const newName = panel.name.value.trim();
    if (!newName) return;
    const toast = showToast('Updating name...', 'loading');
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      await update(ref(rtdb, 'users/' + auth.currentUser.uid), { name: newName });
      if (elements.usernameSpan) elements.usernameSpan.textContent = newName;
      updateToast(toast, 'Name updated successfully!', 'success');
    } catch (e) { updateToast(toast, getFriendlyError(e), 'error'); }
  });

  panel.btnResetEmail?.addEventListener('click', async () => {
    const toast = showToast('Sending reset link...', 'loading');
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      updateToast(toast, 'Reset link sent to your inbox!', 'success');
    } catch (e) { updateToast(toast, getFriendlyError(e), 'error'); }
  });

  panel.btnDelete?.addEventListener('click', async () => {
    if (!await showConfirm('Are you absolutely sure? This will delete your entire account and data forever.', 'Delete Account')) return;
    const toast = showToast('Deleting account...', 'loading');
    try {
      const uid = auth.currentUser.uid;
      await remove(ref(rtdb, 'users/' + uid));
      await deleteUser(auth.currentUser);
      updateToast(toast, 'Account deleted.', 'success');
      setTimeout(() => window.location.href = 'index.html', 1500);
    } catch (e) { updateToast(toast, getFriendlyError(e), 'error'); }
  });

  panel.btnLogout?.addEventListener('click', async () => {
    await signOut(auth);
    showToast('Logged out successfully', 'success');
    setTimeout(() => window.location.href = 'index.html', 1000);
  });

  panel.btnSwitch?.addEventListener('click', async () => {
    const user = auth.currentUser;
    const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
    if (isGoogle) {
      if (!await showConfirm('Are you sure you want to switch to Email login? This will remove Google access.', 'Switch Method')) return;
      const pwd = await showPrompt('Create a new password for your email login:');
      if (!pwd || pwd.length < 6) { showToast('Password too short', 'error'); return; }
      const toast = showToast('Switching account type...', 'loading');
      try {
        const credential = EmailAuthProvider.credential(user.email, pwd);
        await linkWithCredential(user, credential);
        await unlink(user, 'google.com');
        updateToast(toast, 'Switched to Email! Please log in again.', 'success');
        await signOut(auth);
        setTimeout(() => window.location.href = 'login.html', 2000);
      } catch (e) { updateToast(toast, getFriendlyError(e), 'error'); }
    } else {
      if (!await showConfirm('Link your Google account and remove your password?', 'Link Google')) return;
      const toast = showToast('Linking Google...', 'loading');
      try {
        await linkWithPopup(user, googleProvider);
        updateToast(toast, 'Google account linked!', 'success');
        location.reload();
      } catch (e) { updateToast(toast, getFriendlyError(e), 'error'); }
    }
  });

  // --- Auth & Core Logic ---
  function showSection(sectionName) {
    stopVerificationCheck();
    Object.values(elements.sections).forEach(s => s?.classList.remove('active'));
    elements.sections[sectionName]?.classList.add('active');
    hideAllErrors();
    resetDynamicUI();
  }

  function resetDynamicUI() {
    if (elements.containers.loginPasswordGroup) elements.containers.loginPasswordGroup.style.display = 'block';
    if (elements.buttons.loginBtn) elements.buttons.loginBtn.style.display = 'block';
    if (elements.messages.googleDetectLogin) elements.messages.googleDetectLogin.style.display = 'none';
    if (elements.containers.signupPasswordWrapper) elements.containers.signupPasswordWrapper.style.display = 'block';
    if (elements.buttons.signupBtn) elements.buttons.signupBtn.style.display = 'block';
    if (elements.messages.googleDetectSignup) elements.messages.googleDetectSignup.style.display = 'none';
  }

  function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) { el.textContent = message; el.style.display = 'block'; }
  }

  function hideAllErrors() {
    ['loginError', 'signupError', 'forgotIdentityError'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.textContent = ''; }
    });
  }

  function stopVerificationCheck() {
    if (verificationCheckInterval) { clearInterval(verificationCheckInterval); verificationCheckInterval = null; }
  }

  async function checkEmailMethods(email, context) {
    if (!email || !email.includes('@')) { resetDynamicUI(); return; }
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      const isGoogle = methods.includes('google.com');
      if (context === 'login') {
        if (isGoogle) {
          if (elements.containers.loginPasswordGroup) elements.containers.loginPasswordGroup.style.display = 'none';
          if (elements.buttons.loginBtn) elements.buttons.loginBtn.style.display = 'none';
          if (elements.messages.googleDetectLogin) elements.messages.googleDetectLogin.style.display = 'block';
        } else { resetDynamicUI(); }
      } else if (context === 'signup') {
        if (isGoogle) {
          if (elements.containers.signupPasswordWrapper) elements.containers.signupPasswordWrapper.style.display = 'none';
          if (elements.buttons.signupBtn) elements.buttons.signupBtn.style.display = 'none';
          if (elements.messages.googleDetectSignup) elements.messages.googleDetectSignup.style.display = 'block';
        } else { resetDynamicUI(); }
      }
    } catch (error) { resetDynamicUI(); }
  }

  elements.inputs.loginEmail?.addEventListener('blur', () => checkEmailMethods(elements.inputs.loginEmail.value, 'login'));
  elements.inputs.signupEmail?.addEventListener('blur', () => checkEmailMethods(elements.inputs.signupEmail.value, 'signup'));

  elements.buttons.showSignup?.addEventListener('click', () => showSection('signup'));
  elements.buttons.showLogin?.addEventListener('click', () => showSection('login'));
  elements.buttons.showForgot?.addEventListener('click', () => showSection('forgot'));
  elements.buttons.forgotBack?.addEventListener('click', () => showSection('login'));
  elements.buttons.verifyBack?.addEventListener('click', async () => { await signOut(auth); showSection('login'); });
  elements.buttons.changeEmail?.addEventListener('click', () => showSection('signup'));
  elements.inputs.signupPhone?.addEventListener('input', () => {
    elements.inputs.signupPhone.value = elements.inputs.signupPhone.value.replace(/\D/g, '').slice(0, 10);
  });

  elements.forms.login?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllErrors();
    const email = elements.inputs.loginEmail.value.trim();
    const password = document.getElementById('loginPassword').value;
    const toast = showToast('Logging in...', 'loading');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) { 
        updateToast(toast, 'Please verify your email.', 'error');
        showError('loginError', 'Verification required.'); 
        await signOut(auth); 
        return; 
      }
      updateToast(toast, 'Login successful', 'success');
      setTimeout(() => window.location.href = 'index.html', 1000);
    } catch (error) { 
      const friendly = getFriendlyError(error);
      updateToast(toast, friendly, 'error'); 
      showError('loginError', friendly); 
    }
  });

  elements.forms.signup?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllErrors();
    const name = elements.inputs.signupName.value.trim();
    const phone = elements.inputs.signupPhone.value.trim();
    const email = elements.inputs.signupEmail.value.trim();
    const password = document.getElementById('signupPassword').value;
    if (!/^[16789]\d{9}$/.test(phone)) { showToast('Enter a valid 10-digit phone number starting with 1, 6, 7, 8, or 9', 'error'); showError('signupError', 'Phone must start with 1, 6, 7, 8, or 9'); return; }
    if (password.length < 6) { showToast('Password too short', 'error'); showError('signupError', 'Min 6 characters'); return; }
    const toast = showToast('Creating account...', 'loading');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await sendEmailVerification(user);
      await set(ref(rtdb, 'users/' + user.uid), { name, phone, email, provider: 'email', orderBlocked: false, createdAt: new Date().toISOString() });
      await signOut(auth);
      if (elements.displayVerifyEmail) elements.displayVerifyEmail.textContent = email;
      updateToast(toast, 'Verification email sent!', 'success');
      showSection('verify');
      verificationCheckInterval = setInterval(async () => {
        try { await user.reload(); if (user.emailVerified) { stopVerificationCheck(); showToast('Email verified!', 'success'); setTimeout(() => window.location.href = 'index.html', 1500); } }
        catch (err) { console.error(err); }
      }, 3000);
    } catch (error) { updateToast(toast, getFriendlyError(error), 'error'); showError('signupError', getFriendlyError(error)); }
  });

  async function handleGoogleSignIn() {
    isProcessingGoogle = true;
    const toast = showToast('Signing in with Google...', 'loading');
    
    // Check if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    try {
      if (isMobile) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        const result = await signInWithPopup(auth, googleProvider);
        await processAuthResult(result.user, toast);
      }
    } catch (error) { 
      updateToast(toast, getFriendlyError(error), 'error'); 
      isProcessingGoogle = false; 
    }
  }

  async function processAuthResult(user, toast) {
    const userRef = ref(rtdb, 'users/' + user.uid);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      await set(userRef, { 
        name: user.displayName || 'Google User', 
        phone: 'Not provided', 
        email: user.email, 
        provider: 'google', 
        orderBlocked: false, 
        createdAt: new Date().toISOString() 
      });
    }
    if (toast) updateToast(toast, 'Login successful', 'success');
    setTimeout(() => window.location.href = 'index.html', 1000);
  }

  // Handle redirect result on page load
  getRedirectResult(auth).then(async (result) => {
    if (result) {
      isProcessingGoogle = true;
      const toast = showToast('Completing Google Sign-in...', 'loading');
      await processAuthResult(result.user, toast);
    }
  }).catch((error) => {
    if (error.code !== 'auth/popup-closed-by-user') {
      showToast(getFriendlyError(error), 'error');
    }
  });

  elements.buttons.loginGoogle?.addEventListener('click', (e) => { e.preventDefault(); handleGoogleSignIn(); });
  elements.buttons.signupGoogle?.addEventListener('click', (e) => { e.preventDefault(); handleGoogleSignIn(); });

  onAuthStateChanged(auth, async (user) => {
    const authNavBtns = document.querySelectorAll('.auth-nav-btn');
    const userNavBtns = document.querySelectorAll('.user-nav-btn');
    const adminLink = elements.buttons.adminLink;
    if (user && user.emailVerified) {
      if (user.email === ADMIN_EMAIL) { if (adminLink) adminLink.style.display = 'inline-flex'; } 
      else { if (adminLink) adminLink.style.display = 'none'; }
      const snapshot = await get(ref(rtdb, 'users/' + user.uid));
      if (snapshot.exists() && snapshot.val().disabled === true) {
        showToast('Your account has been disabled.', 'error');
        await signOut(auth);
        window.location.href = 'login.html';
        return;
      }
      authNavBtns.forEach(btn => btn.style.display = 'none');
      userNavBtns.forEach(btn => btn.style.display = 'inline-flex');
      if (elements.usernameSpan) {
        elements.usernameSpan.textContent = user.displayName || 'User';
        if (snapshot.exists() && snapshot.val().name) elements.usernameSpan.textContent = snapshot.val().name;
      }
      if (!isProcessingGoogle && window.location.pathname.includes('login.html') && !elements.sections.verify?.classList.contains('active')) {
        window.location.href = 'index.html';
      }
    } else {
      authNavBtns.forEach(btn => btn.style.display = 'inline-flex');
      userNavBtns.forEach(btn => btn.style.display = 'none');
      if (adminLink) adminLink.style.display = 'none';
    }
  });
});
