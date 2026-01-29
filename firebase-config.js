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

console.log("🔥 Firebase Config: Starting initialization...");

// Check if Firebase SDK is loaded
if (typeof firebase === 'undefined') {
    console.error("❌ CRITICAL: Firebase SDK not loaded! Check your script tags.");
} else {
    console.log("✅ Firebase SDK loaded successfully");
}

// Initialize Firebase using the Compat SDK
try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase App initialized");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
}

// Initialize Firestore if available
var db = (typeof firebase.firestore === 'function') ? firebase.firestore() : null;
if (db) {
    console.log("✅ Firestore initialized");
} else {
    console.error("❌ Firestore not available");
}

// Initialize Auth if available
var auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;
if (auth) {
    console.log("✅ Auth initialized");
} else {
    console.error("❌ Auth not available");
}

// Initialize Storage if available
var storage = (typeof firebase.storage === 'function') ? firebase.storage() : null;
if (storage) {
    console.log("✅ Storage initialized");
} else {
    console.error("❌ Storage not available");
}

// Optional: Enable offline persistence
if (db) {
    db.enablePersistence()
        .then(() => {
            console.log("✅ Firestore persistence enabled");
        })
        .catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn('⚠️ Persistence failed: Multiple tabs open');
            } else if (err.code == 'unimplemented') {
                console.warn('⚠️ Persistence not supported by browser');
            } else {
                console.error('❌ Persistence error:', err);
            }
        });
}

console.log("🔥 Firebase Config: Initialization complete");
