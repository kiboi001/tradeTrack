// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyDyTCmpcS7rsqmDrnI85lS-C14Z1Jom7jU",
    authDomain: "tradetrack-44b18.firebaseapp.com",
    projectId: "tradetrack-44b18",
    storageBucket: "tradetrack-44b18.firebasestorage.app",
    messagingSenderId: "223490443349",
    appId: "1:223490443349:web:8517b9fb49c240f5f82cdc",
    measurementId: "G-RJ3NTVPWYH"
};

// Initialize Firebase using the Compat SDK
firebase.initializeApp(firebaseConfig);

// Initialize Firestore if available
var db = (typeof firebase.firestore === 'function') ? firebase.firestore() : null;

// Initialize Auth if available
var auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;

// Initialize Storage if available
var storage = (typeof firebase.storage === 'function') ? firebase.storage() : null;

// Optional: Enable offline persistence
if (db) {
    db.enablePersistence()
        .catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn('Persistence failed: Multiple tabs open');
            } else if (err.code == 'unimplemented') {
                console.warn('Persistence not supported by browser');
            }
        });
}
