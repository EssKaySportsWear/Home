// firebase.js - Firebase v9+ Modular SDK Setup

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const firebaseConfig = {
  apiKey: "AIzaSyDd0qqrkRLzq7UyK5_MwZv6tYAnHBeWHHg",
  authDomain: "esskaysportsdata.firebaseapp.com",
  projectId: "esskaysportsdata",
  storageBucket: "esskaysportsdata.firebasestorage.app",
  messagingSenderId: "734706027382",
  appId: "1:734706027382:web:bb9bc72eec36e2eed94857"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);

// Firestore helpers
export async function addTestData() {
  try {
    const docRef = await addDoc(collection(db, "test"), {
      timestamp: new Date(),
      message: "Test data from Firebase v9+",
      data: { value: Math.random() }
    });
    console.log("✅ Test data added with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error adding data: ", error);
    throw error;
  }
}

export async function getTestData() {
  try {
    const querySnapshot = await getDocs(collection(db, "test"));
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    console.log("📖 Test data:", data);
    return data;
  } catch (error) {
    console.error("❌ Error reading data: ", error);
    throw error;
  }
}

// Usage: import { db, auth, addTestData, getTestData } from './firebase.js';
