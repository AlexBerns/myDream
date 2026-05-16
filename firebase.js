import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
    getFirestore,
    doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
    collection, onSnapshot, query, orderBy,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDSH2WQNRIlNQjCRLEBFnms8Xt1T8BH2sc",
    authDomain: "wedream-43204.firebaseapp.com",
    projectId: "wedream-43204",
    storageBucket: "wedream-43204.firebasestorage.app",
    messagingSenderId: "203006035778",
    appId: "1:203006035778:web:75e667c406dd921e9ceadb",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const authReady = new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) { unsub(); resolve(user); return; }
        try {
            await signInAnonymously(auth);
        } catch (e) { unsub(); reject(e); }
    });
});

export {
    doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
    collection, onSnapshot, query, orderBy,
};
