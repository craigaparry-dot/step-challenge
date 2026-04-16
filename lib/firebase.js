import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDZqW7ZbZC5DUUo28BJ_v2JE79O04oK_2U",
  authDomain: "step-challenge-e153e.firebaseapp.com",
  projectId: "step-challenge-e153e",
  storageBucket: "step-challenge-e153e.firebasestorage.app",
  messagingSenderId: "413021147387",
  appId: "1:413021147387:web:b5614d4b27d693f058605e"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

console.log("API KEY:", firebaseConfig.apiKey);