import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
    getFunctions,
    httpsCallable,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js";

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
export const functions = getFunctions(app, 'asia-northeast1');

export const generateDreamImage = httpsCallable(functions, 'generateDreamImage');

// Resolves once an (anonymous) user is signed in.
export const authReady = new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
        if (user) {
            unsub();
            resolve(user);
            return;
        }
        try {
            await signInAnonymously(auth);
            // onAuthStateChanged will fire again with the new user
        } catch (e) {
            unsub();
            reject(e);
        }
    });
});
