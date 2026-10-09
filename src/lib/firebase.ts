import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAofuQt09avj1VcQ9wFyccZLlyF0aUwd24",
  authDomain: "bakery-shop-f27a7.firebaseapp.com",
  projectId: "bakery-shop-f27a7",
  storageBucket: "bakery-shop-f27a7.firebasestorage.app",
  messagingSenderId: "594730953015",
  appId: "1:594730953015:web:f9f2fa81b829e8b66c92b2",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
