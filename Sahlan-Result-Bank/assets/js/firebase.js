
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDguKbDF6o9MbMJZEIsiUmlJqanPv-vZQU",
  authDomain: "sahlan-result-bank.firebaseapp.com",
  databaseURL: "https://sahlan-result-bank-default-rtdb.firebaseio.com",
  projectId: "sahlan-result-bank",
  storageBucket: "sahlan-result-bank.firebasestorage.app",
  messagingSenderId: "145994987403",
  appId: "1:145994987403:web:5f877c850a1f3eab44618e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

setPersistence(auth, browserLocalPersistence).catch(console.error);

export { auth, db };
