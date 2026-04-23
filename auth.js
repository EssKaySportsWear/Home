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
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut
} from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { ref, set, get, child, query, orderByChild, equalTo } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const sections = {
    login: document.getElementById('login-section'),
    signup: document.getElementById('signup-section'),
    forgot: document.getElementById('forgot-password-section'),
    verify: document.getElementById('verify-email-section')
  };

  const buttons = {
    showSignup: document.getElementById('showSignup'),
    showLogin: document.getElementById('showLogin'),
    showForgot: document.getElementById('showForgotPwd'),
    forgotBack: document.getElementById('forgotBackToLogin'),
    loginGoogle: document.getElementById('loginGoogleBtn'),
    signupGoogle: document.getElementById('signupGoogleBtn'),
    logout: document.getElementById('nav-logout-btn'),
    changeEmail: document.getElementById('changeEmailBtn'),
    verifyBack: document.getElementById('verifyBackToLogin')
  };

  const forms = {
    login: document.getElementById('loginForm'),
    signup: document.getElementById('signupForm'),
    forgot: document.getElementById('forgotIdentityForm')
  };

  const displayVerifyEmail = document.getElementById('display-verify-email');
  const googleProvider = new GoogleAuthProvider();
  let verificationCheckInterval = null;

  // --- Helper: Toggle Sections ---
  function showSection(sectionName) {
    stopVerificationCheck();
    Object.values(sections).forEach(s => s?.classList.remove('active'));
    sections[sectionName]?.classList.add('active');
    hideAllErrors();
  }

  // --- Helper: Error/Status Display ---
  function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.style.display = 'block';
    } else {
      console.error(message);
    }
  }

  function hideAllErrors() {
    ['loginError', 'signupError', 'forgotIdentityError'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = 'none';
        el.textContent = '';
      }
    });
  }

  function stopVerificationCheck() {
    if (verificationCheckInterval) {
      clearInterval(verificationCheckInterval);
      verificationCheckInterval = null;
    }
  }

  // --- Navigation Listeners ---
  buttons.showSignup?.addEventListener('click', () => showSection('signup'));
  buttons.showLogin?.addEventListener('click', () => showSection('login'));
  buttons.showForgot?.addEventListener('click', () => showSection('forgot'));
  buttons.forgotBack?.addEventListener('click', () => showSection('login'));
  buttons.verifyBack?.addEventListener('click', async () => {
    await signOut(auth);
    showSection('login');
  });
  buttons.changeEmail?.addEventListener('click', async () => {
    // We keep them signed in but go back to signup so they can try another email
    showSection('signup');
  });

  // --- Core Action: Login ---
  forms.login?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllErrors();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        showError('loginError', 'Please verify your email before logging in. Check your inbox.');
        await signOut(auth);
        return;
      }

      window.location.href = 'index.html';
    } catch (error) {
      let msg = "Invalid email or password";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
        msg = "User doesn't exist";
      } else if (error.code === 'auth/wrong-password') {
        msg = "Incorrect password";
      }
      showError('loginError', msg);
    }
  });

  // --- Core Action: Signup ---
  forms.signup?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllErrors();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const phone = document.getElementById('signupPhone').value.trim();

    if (password.length < 6) {
      showError('signupError', 'Password must be at least 6 characters.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send Verification
      await sendEmailVerification(user);
      
      // Store Profile in RTDB
      await set(ref(rtdb, 'users/' + user.uid), {
        name: name,
        email: email,
        phone: phone,
        createdAt: new Date().toISOString()
      });

      // Show Verification Section instead of alert/redirect
      if (displayVerifyEmail) displayVerifyEmail.textContent = email;
      showSection('verify');

      // Start Polling for verification
      verificationCheckInterval = setInterval(async () => {
        try {
          await user.reload();
          if (user.emailVerified) {
            stopVerificationCheck();
            alert('Email verified! Logging you in automatically...');
            window.location.href = 'index.html';
          }
        } catch (err) {
          console.error('Reload error:', err);
        }
      }, 3000);

    } catch (error) {
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') msg = 'Email already in use.';
      showError('signupError', msg);
    }
  });

  // --- Core Action: Google Sign-In ---
  async function handleGoogleSignIn() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Save profile if new
      const snapshot = await get(child(ref(rtdb), `users/${user.uid}`));
      if (!snapshot.exists()) {
        await set(ref(rtdb, 'users/' + user.uid), {
          name: user.displayName || 'Google User',
          email: user.email,
          createdAt: new Date().toISOString()
        });
      }

      window.location.href = 'index.html';
    } catch (error) {
      alert('Google Sign-In failed. Please try again.');
    }
  }

  buttons.loginGoogle?.addEventListener('click', (e) => { e.preventDefault(); handleGoogleSignIn(); });
  buttons.signupGoogle?.addEventListener('click', (e) => { e.preventDefault(); handleGoogleSignIn(); });

  // --- Core Action: Forgot Password ---
  forms.forgot?.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllErrors();
    
    const email = document.getElementById('forgotIdentityInput').value.trim();
    if (!email) {
      showError('forgotIdentityError', 'Please enter your email.');
      return;
    }

    try {
      // Check if email exists in DB
      const usersRef = ref(rtdb, 'users');
      const emailQuery = query(usersRef, orderByChild('email'), equalTo(email));
      const snapshot = await get(emailQuery);

      if (!snapshot.exists()) {
        showError('forgotIdentityError', "Email Doesn't Exist");
        return;
      }

      await sendPasswordResetEmail(auth, email);
      alert('Password reset link sent! Please check your email inbox.');
      showSection('login');
    } catch (error) {
      showError('forgotIdentityError', 'Reset failed. Please try again.');
    }
  });

  // --- Auth State Observer: Update UI ---
  onAuthStateChanged(auth, async (user) => {
    const authNavBtns = document.querySelectorAll('.auth-nav-btn');
    const userNavBtns = document.querySelectorAll('.user-nav-btn');
    const usernameSpan = document.getElementById('nav-username');

    if (user && user.emailVerified) {
      authNavBtns.forEach(btn => btn.style.display = 'none');
      userNavBtns.forEach(btn => btn.style.display = 'inline-flex');
      
      if (usernameSpan) {
        usernameSpan.textContent = user.displayName || 'User';
        const snapshot = await get(child(ref(rtdb), `users/${user.uid}`));
        if (snapshot.exists() && snapshot.val().name) {
          usernameSpan.textContent = snapshot.val().name;
        }
      }

      // Auto-redirect if on login page and not in the process of verifying
      if (window.location.pathname.includes('login.html') && !sections.verify.classList.contains('active')) {
        window.location.href = 'index.html';
      }
    } else {
      authNavBtns.forEach(btn => btn.style.display = 'inline-flex');
      userNavBtns.forEach(btn => btn.style.display = 'none');
    }
  });

  // --- Global Action: Logout ---
  buttons.logout?.addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => {
      window.location.href = 'index.html';
    });
  });
});
