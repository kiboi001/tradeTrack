
// auth.js

(function () {
    console.log("auth.js: Script starting...");

    // 0. Check Protocol
    if (window.location.protocol === 'file:') {
        console.warn("Firebase Auth: You are running from a local file (file://). If login fails, try using a local server (like Live Server in VS Code).");
    }

    // 1. Check if Firebase objects exist
    if (typeof auth === 'undefined' || !auth) {
        const msg = "CRITICAL ERROR: Firebase 'auth' missing. Check your script tags in the HTML file.";
        console.error(msg);
        alert(msg);
        return;
    }

    try {
        // 2. Redirect logic
        auth.onAuthStateChanged((user) => {
            const path = window.location.pathname.toLowerCase();
            // Handle local file paths which might have \ instead of /
            const isLoginPage = path.includes('login.html') || path.endsWith('/') || path === '' || path.endsWith('\\');

            if (user) {
                console.log('Firebase Auth: User is logged in as', user.email);
                if (isLoginPage) {
                    window.location.href = 'index.html';
                }
                if (typeof window.initAppWithUser === 'function') {
                    window.initAppWithUser(user.uid);
                }
            } else {
                console.log('Firebase Auth: No user session found.');
                if (!isLoginPage) {
                    window.location.href = 'login.html';
                }
            }
        });

        // 3. Auth Functions
        window.authLogin = async function (email, password) {
            const btn = document.getElementById('submit-btn');
            const originalText = btn ? btn.textContent : 'Log In';
            try {
                if (btn) {
                    btn.textContent = 'Logging in...';
                    btn.disabled = true;
                }
                await auth.signInWithEmailAndPassword(email, password);
                console.log("Login successful");
            } catch (error) {
                console.error("Login failed:", error.message);
                alert("Login Error: " + error.message);
                if (btn) {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            }
        };

        window.authSignup = async function (email, password) {
            const btn = document.getElementById('submit-btn');
            const originalText = btn ? btn.textContent : 'Sign Up';
            try {
                if (btn) {
                    btn.textContent = 'Creating account...';
                    btn.disabled = true;
                }
                await auth.createUserWithEmailAndPassword(email, password);
                console.log("Signup successful");
            } catch (error) {
                console.error("Signup failed:", error.message);
                alert("Signup Error: " + error.message);
                if (btn) {
                    btn.textContent = originalText;
                    btn.disabled = false;
                }
            }
        };

        window.authLogout = async function () {
            try {
                await auth.signOut();
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Logout error', error);
            }
        };

        window.authGoogleLogin = async function () {
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                console.log("Starting Google Login...");
                const result = await auth.signInWithPopup(provider);
                console.log("Google Login successful", result.user.email);
            } catch (error) {
                console.error("Google Login failed:", error.message);
                alert("Google Login Error: " + error.message);
            }
        };

        console.log("auth.js: Initialization complete.");

    } catch (e) {
        console.error("auth.js: Fatal startup error", e);
        alert("auth.js failed to start: " + e.message);
    }
})();
