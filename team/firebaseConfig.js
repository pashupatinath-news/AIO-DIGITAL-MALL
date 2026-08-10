import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

const firebaseConfig = {

  apiKey:
    "AIzaSyAyH9RRJTEETFh4zHWwCMO4d6qMielJQFA",

  authDomain:
    "aio-digital-mall.firebaseapp.com",

  projectId:
    "aio-digital-mall",

  storageBucket:
    "aio-digital-mall.firebasestorage.app",

  messagingSenderId:
    "501384049673",

  appId:
    "1:501384049673:web:968bd8311cc700f82874d8",

  measurementId:
    "G-TNDT9FYNRP"
};

const app =
  initializeApp(firebaseConfig);

export const auth =
  getAuth(app);

export const db =
  getFirestore(app);

export default app;