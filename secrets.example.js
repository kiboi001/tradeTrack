/**
 * secrets.example.js - Template for Sensitive Configuration
 * 
 * Instructions:
 * 1. Copy this file and rename it to 'secrets.js'
 * 2. Fill in your own Firebase and Cloudinary credentials.
 * 3. Add your owner UID and Email to the admin lists.
 */

window.TRADETRACK_SECRETS = {
    FIREBASE: {
        apiKey: "YOUR_FIREBASE_API_KEY",
        authDomain: "YOUR_PROJECT.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT.firebasestorage.app",
        messagingSenderId: "YOUR_SENDER_ID",
        appId: "YOUR_APP_ID",
        measurementId: "YOUR_MEASUREMENT_ID"
    },
    CLOUDINARY: {
        cloudName: 'YOUR_CLOUD_NAME',
        uploadPreset: 'YOUR_UNSIGNED_PRESET'
    },
    ADMIN_UIDS: [
        "YOUR_OWNER_UID"
    ],
    ADMIN_EMAILS: [
        "your@email.com"
    ]
};
