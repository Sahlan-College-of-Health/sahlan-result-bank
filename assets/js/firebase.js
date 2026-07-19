import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { APP_CONFIG } from "./config.js";

const firebaseApp = initializeApp(APP_CONFIG.firebase);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Firebase persistence error:", error);
});

export { auth, db };
