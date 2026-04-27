// firebase-config.js
// Fixed for iPad / Safari compatibility (IndexedDB / ITP issues)

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
try {
    firebase.initializeApp(firebaseConfig);
    console.log("✅ Firebase App initialized");
} catch (error) {
    if (error.code !== 'app/duplicate-app') {
        console.error("❌ Firebase initialization error:", error);
    }
}

// Initialize core services
var db = (typeof firebase.firestore === 'function') ? firebase.firestore() : null;
var auth = (typeof firebase.auth === 'function') ? firebase.auth() : null;
var storage = (typeof firebase.storage === 'function') ? firebase.storage() : null;

// Safari-specific: Firestore settings to improve iPad compatibility
// longerPollingInterval reduces connection drops on mobile Safari
if (db) {
    try {
        db.settings({
            experimentalForceLongPolling: isSafariOrIOS(), // Long polling on iOS/Safari
            merge: true
        });
    } catch (e) {
        // Settings already applied or not supported — ignore
    }
}

// ── iPad / Safari fix ──────────────────────────────────────────────────────────
// `enablePersistence()` fails silently on Safari ITP and iPad private mode.
// We catch ALL errors and fall back gracefully without breaking the app.
// Previously this caused the site to hang on iOS/iPad.
if (db) {
    db.enablePersistence({ synchronizeTabs: true })
        .then(() => {
            console.log("✅ Firestore offline persistence enabled");
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                // Multiple tabs open — use in-memory cache only
                console.warn('⚠️ Persistence disabled: multiple tabs open. Using in-memory cache.');
            } else if (err.code === 'unimplemented') {
                // Safari / iPad / private mode — not supported
                console.warn('⚠️ Persistence not supported on this browser (Safari/iPad/private mode). App will use live data only.');
            } else {
                // Any other error — log but do NOT crash the app
                console.warn('⚠️ Persistence error (non-fatal):', err.code, err.message);
            }
            // App continues normally without offline persistence
        });
}

// Detect Safari or iOS device
function isSafariOrIOS() {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || // iPad Pro
        /^((?!chrome|android).)*safari/i.test(ua);
}

console.log("🔥 Firebase ready | Safari/iPad mode:", isSafariOrIOS());
