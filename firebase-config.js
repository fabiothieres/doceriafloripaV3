import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyDUMEJjJrpyLuakOFFh4Qp1frUid27IlS8",
  authDomain: "doceria-floripa.firebaseapp.com",
  projectId: "doceria-floripa",
  storageBucket: "doceria-floripa.firebasestorage.app",
  messagingSenderId: "329196185407",
  appId: "1:329196185407:web:a63227793fb072af2a958a",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
