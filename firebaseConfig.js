// ============================================================
// AIO DIGITAL MALL
// FIREBASE CONFIGURATION
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
  getStorage
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-storage.js";

import {
  getAnalytics
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAyH9RRJTEETFh4zHWwCMO4d6qMielJQFA",
  authDomain: "aio-digital-mall.firebaseapp.com",
  projectId: "aio-digital-mall",
  storageBucket: "aio-digital-mall.firebasestorage.app",
  messagingSenderId: "501384049673",
  appId: "1:501384049673:web:968bd8311cc700f82874d8",
  measurementId: "G-TNDT9FYNRP"
};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);


// ============================================================
// FIREBASE SERVICES
// ============================================================

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


// ============================================================
// ANALYTICS
// ============================================================

let analytics = null;

try {
  analytics = getAnalytics(app);
} catch (error) {
  console.warn("Firebase Analytics unavailable:", error);
}


// ============================================================
// EXPORT
// ============================================================

export {
  app,
  auth,
  db,
  storage,
  analytics
};
