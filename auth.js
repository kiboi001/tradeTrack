
// auth.js

(function () {
    console.log("auth.js: Script starting...");

    // 0. Check Protocol
    if (window.location.protocol === 'file:') {
        console.warn("Firebase Auth: You are running from a local file (file://).");
    }

    if (typeof auth === 'undefined' || !auth) {
        console.error("CRITICAL ERROR: Firebase 'auth' missing.");
        return;
    }

    try {
        // 2. Redirect logic
        auth.onAuthStateChanged((user) => {
            const rawPath = window.location.pathname.toLowerCase();

            // Precise matching for login pages
            const isStandardLogin = rawPath.endsWith('login.html') || rawPath.endsWith('/') || rawPath === '';
            const isAdminPage = rawPath.includes('admin'); // Protects admin.html and admin-login.html

            if (user) {
                console.log('Firebase Auth: User is logged in as', user.email);

                // If on standard login page, send to dashboard
                if (isStandardLogin && !isAdminPage) {
                    window.location.href = 'index.html';
                }

                // Fix race condition: Scripts.js might not be loaded yet
                if (typeof window.initAppWithUser === 'function') {
                    window.initAppWithUser(user.uid);
                } else {
                    window.pendingUser = user;
                }
            } else {
                console.log('Firebase Auth: No user session found.');
                // Protect non-login pages
                if (!isStandardLogin && !isAdminPage) {
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
                // If we are logged out while on an admin page, go to admin login
                if (window.location.pathname.includes('admin')) {
                    window.location.href = 'admin-login.html';
                } else {
                    window.location.href = 'login.html';
                }
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
    }
})();
