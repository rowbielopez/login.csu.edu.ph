/**
 * ============================================================================
 * MyCSU Portal - Enterprise JavaScript Application
 * Handles authentication, UI interactions, and Firebase integration
 * Version: 2.0.0 | Enterprise Edition
 * ============================================================================
 */

// ============================================================================
// FIREBASE CONFIGURATION
// ============================================================================

/**
 * Firebase configuration object
 * Production credentials for MyCSU
 */
const firebaseConfig = {
    apiKey: "AIzaSyA_Tmm0njzjtYnKAZp26VsSXXoJeU0x_zI",
    authDomain: "mycsu-2c526.firebaseapp.com",
    projectId: "mycsu-2c526",
    storageBucket: "mycsu-2c526.firebasestorage.app",
    messagingSenderId: "245974217112",
    appId: "1:245974217112:web:ff9cc290fb455a35ac3bed",
    measurementId: "G-DSFE3LVWXJ"
};

// System endpoints — auto-detect production vs local dev
// Match index.php: any *.csu.edu.ph host is production (not only exact login.csu.edu.ph).
function getBaseUrl(system) {
    const hostname = window.location.hostname || '';
    const isProd = hostname.includes('csu.edu.ph');
    const bases = {
        hris: isProd ? 'https://hris.csu.edu.ph' : 'http://localhost/hris.csu.edu.ph',
        ofes: isProd ? 'https://ofes.csu.edu.ph' : 'http://localhost/ofes'
    };
    return bases[system] || '';
}
const HRIS_AUTH_URL = getBaseUrl('hris') + '/api/auth/verify.php';
const HRIS_DASHBOARD_URL = getBaseUrl('hris') + '/';
const HRIS_ADMIN_URL = getBaseUrl('hris') + '/admin/';
const OFES_AUTH_URL = getBaseUrl('ofes') + '/api/auth/verify.php';

// Initialize Firebase
let auth = null;
let db = null;
try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        auth = firebase.auth();
        db = firebase.firestore();
    }
} catch (error) {
    console.warn('[Auth] Firebase initialization failed:', error);
}

// Firestore server timestamp helper
const serverTimestamp = () =>
    typeof firebase !== 'undefined' ? firebase.firestore.FieldValue.serverTimestamp() : new Date();

// ============================================================================
// APPLICATION STATE
// ============================================================================

const AppState = {
    isLoggedIn: false,
    currentUser: null,
    hrisAuthorized: false,
    hrisIsAdmin: false,
    hrisRole: null,
    isNavScrolled: false,
    isMobileMenuOpen: false,
    isUserDropdownOpen: false,
    activeFilter: 'all',
    // Firestore-backed user state
    userStatus: null,        // 'active' | 'pending' | 'rejected' | null
    userFirestoreRole: null, // 'mis_admin' | 'user' | null
    userAccessMap: {},       // { [systemId]: { roleId, roleName } }
    userRevokedSystems: {},  // { [systemId]: true }
    systemStatusMap: {}      // { [systemId]: 'active' | 'inactive' }
};

// ============================================================================
// DOM ELEMENT CACHE
// ============================================================================

const DOM = {
    // Navigation
    navbar: document.getElementById('navbar'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileMenu: document.getElementById('mobileMenu'),
    mobileMenuIcon: document.getElementById('mobileMenuIcon'),

    // Authentication
    loginBtn: document.getElementById('loginBtn'),
    heroLoginBtn: document.getElementById('heroLoginBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    loginModal: document.getElementById('loginModal'),
    loginGoogleBtn: document.getElementById('loginGoogleBtn'),
    switchAccountBtn: document.getElementById('switchAccountBtn'),
    switchAccountSection: document.getElementById('switchAccountSection'),
    currentUserEmail: document.getElementById('currentUserEmail'),
    closeLoginModal: document.getElementById('closeLoginModal'),
    userMenu: document.getElementById('userMenu'),
    userMenuBtn: document.getElementById('userMenuBtn'),
    userDropdown: document.getElementById('userDropdown'),
    dropdownArrow: document.getElementById('dropdownArrow'),

    // User Info Display
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    userAvatar: document.getElementById('userAvatar'),
    dropdownUserName: document.getElementById('dropdownUserName'),
    dropdownUserEmail: document.getElementById('dropdownUserEmail'),

    // Systems Section
    loginPromptBanner: document.getElementById('loginPromptBanner'),
    systemButtons: document.querySelectorAll('.system-btn'),
    promptLoginBtns: document.querySelectorAll('.prompt-login-btn'),

    // Announcements
    announcementButtons: document.querySelectorAll('.announcement-btn'),
    announcementModal: document.getElementById('announcementModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalDate: document.getElementById('modalDate'),
    modalCategory: document.getElementById('modalCategory'),
    modalContent: document.getElementById('modalContent'),
    closeModal: document.getElementById('closeModal'),
    closeModalBtn: document.getElementById('closeModalBtn'),

    // System access error (OFES / future systems)
    systemAccessModal: document.getElementById('systemAccessModal'),
    systemAccessModalTitle: document.getElementById('systemAccessModalTitle'),
    systemAccessModalBody: document.getElementById('systemAccessModalBody'),
    closeSystemAccessModal: document.getElementById('closeSystemAccessModal'),
    systemAccessModalOk: document.getElementById('systemAccessModalOk'),

    // Updates Section
    filterTabs: document.querySelectorAll('.filter-tab'),
    updateItems: document.querySelectorAll('.update-item'),

    // Toast Notification
    toast: document.getElementById('toast'),
    toastIcon: document.getElementById('toastIcon'),
    toastTitle: document.getElementById('toastTitle'),
    toastMessage: document.getElementById('toastMessage'),
    closeToast: document.getElementById('closeToast'),

    // System Loading Overlay
    systemLoadingOverlay: document.getElementById('systemLoadingOverlay')
};

// ============================================================================
// ANNOUNCEMENT DATA STORE
// ============================================================================

const announcementsData = {
    1: {
        title: "HRIS System Major Enhancement Released",
        date: "January 20, 2026",
        category: "System Update",
        categoryClass: "bg-maroon-100 text-maroon-800",
        content: `
            <p class="mb-4 text-base leading-relaxed">
                We are excited to announce the release of major enhancements to the Human Resource Information System (HRIS). 
                These updates are designed to streamline HR operations, improve user experience, and provide better tools for our university community.
            </p>
            
            <h4 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <i class="fas fa-star text-gold-500"></i> New Features
            </h4>
            <ul class="mb-6 space-y-2">
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i class="fas fa-check text-xs"></i>
                    </span>
                    <span><strong>Automated Payroll Processing</strong> — Calculate salaries and deductions automatically with configurable rules</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i class="fas fa-check text-xs"></i>
                    </span>
                    <span><strong>Advanced Analytics Dashboard</strong> — Visualize HR metrics and trends with interactive charts</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i class="fas fa-check text-xs"></i>
                    </span>
                    <span><strong>Enhanced Reporting</strong> — Generate comprehensive reports with one click</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i class="fas fa-check text-xs"></i>
                    </span>
                    <span><strong>Mobile Access</strong> — Full HRIS functionality from any device</span>
                </li>
            </ul>
            
            <h4 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <i class="fas fa-rocket text-blue-500"></i> Key Benefits
            </h4>
            <ul class="mb-6 space-y-2">
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-2 h-2 bg-maroon-500 rounded-full flex-shrink-0 mt-2"></span>
                    <span>Reduced manual data entry and processing time by up to 60%</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-2 h-2 bg-maroon-500 rounded-full flex-shrink-0 mt-2"></span>
                    <span>Improved accuracy in payroll calculations</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-2 h-2 bg-maroon-500 rounded-full flex-shrink-0 mt-2"></span>
                    <span>Better insights for decision-making with real-time data</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-2 h-2 bg-maroon-500 rounded-full flex-shrink-0 mt-2"></span>
                    <span>Increased accessibility and convenience for all users</span>
                </li>
            </ul>
            
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p class="text-sm text-slate-600 flex items-start gap-2">
                    <i class="fas fa-info-circle text-maroon-600 mt-0.5"></i>
                    <span>For training sessions and detailed documentation, please contact the MIS Office at 
                    <a href="mailto:mis@csu.edu.ph" class="text-maroon-800 font-medium hover:underline">mis@csu.edu.ph</a></span>
                </p>
            </div>
        `
    },
    2: {
        title: "Scheduled Maintenance Notice",
        date: "January 18, 2026",
        category: "Maintenance",
        categoryClass: "bg-amber-100 text-amber-700",
        content: `
            <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                <p class="text-amber-800 font-medium flex items-center gap-2">
                    <i class="fas fa-exclamation-triangle"></i>
                    Please save your work before the maintenance window
                </p>
            </div>
            
            <p class="mb-6 text-base leading-relaxed">
                Please be informed that the E2E System will undergo scheduled maintenance to improve 
                system performance and security. We apologize for any inconvenience this may cause.
            </p>
            
            <h4 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <i class="fas fa-calendar-alt text-maroon-600"></i> Maintenance Schedule
            </h4>
            <div class="bg-slate-50 rounded-xl p-4 mb-6">
                <ul class="space-y-3">
                    <li class="flex items-center gap-3">
                        <span class="font-semibold text-slate-700 w-24">Date:</span>
                        <span class="text-slate-600">January 25, 2026</span>
                    </li>
                    <li class="flex items-center gap-3">
                        <span class="font-semibold text-slate-700 w-24">Time:</span>
                        <span class="text-slate-600">10:00 PM - 2:00 AM (PHT)</span>
                    </li>
                    <li class="flex items-center gap-3">
                        <span class="font-semibold text-slate-700 w-24">Duration:</span>
                        <span class="text-slate-600">Approximately 4 hours</span>
                    </li>
                    <li class="flex items-center gap-3">
                        <span class="font-semibold text-slate-700 w-24">Affected:</span>
                        <span class="px-2 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded">E2E System</span>
                    </li>
                </ul>
            </div>
            
            <h4 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <i class="fas fa-info-circle text-blue-500"></i> What to Expect
            </h4>
            <ul class="mb-6 space-y-2">
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-2"></span>
                    <span>E2E System will be temporarily unavailable during the maintenance window</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-2"></span>
                    <span>All active sessions will be terminated at 10:00 PM</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-2"></span>
                    <span>System will be back online by 2:00 AM</span>
                </li>
            </ul>
            
            <h4 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <i class="fas fa-tools text-emerald-500"></i> Planned Improvements
            </h4>
            <ul class="mb-6 space-y-2">
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i class="fas fa-check text-xs"></i>
                    </span>
                    <span>Enhanced system security protocols</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i class="fas fa-check text-xs"></i>
                    </span>
                    <span>Improved database performance</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <i class="fas fa-check text-xs"></i>
                    </span>
                    <span>Bug fixes and optimizations</span>
                </li>
            </ul>
            
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p class="text-sm text-slate-600 flex items-start gap-2">
                    <i class="fas fa-headset text-maroon-600 mt-0.5"></i>
                    <span>For urgent concerns during maintenance, please contact the MIS Office hotline or email 
                    <a href="mailto:mis@csu.edu.ph" class="text-maroon-800 font-medium hover:underline">mis@csu.edu.ph</a></span>
                </p>
            </div>
        `
    },
    3: {
        title: "Faculty Evaluation Period Now Open",
        date: "January 15, 2026",
        category: "New Feature",
        categoryClass: "bg-emerald-100 text-emerald-700",
        content: `
            <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
                <p class="text-emerald-800 font-medium flex items-center gap-2">
                    <i class="fas fa-check-circle"></i>
                    Evaluation period is now open — Don't miss the deadline!
                </p>
            </div>
            
            <p class="mb-6 text-base leading-relaxed">
                The Online Faculty Evaluation System (OFES) is now accepting evaluations for the 
                first semester of Academic Year 2025-2026. Your feedback is essential for improving 
                teaching quality at CSU.
            </p>
            
            <h4 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <i class="fas fa-calendar-check text-maroon-600"></i> Important Dates
            </h4>
            <div class="bg-slate-50 rounded-xl p-4 mb-6">
                <ul class="space-y-3">
                    <li class="flex items-center gap-3">
                        <span class="font-semibold text-slate-700 w-36">Evaluation Period:</span>
                        <span class="text-slate-600">January 15 - February 1, 2026</span>
                    </li>
                    <li class="flex items-center gap-3">
                        <span class="font-semibold text-slate-700 w-36">Deadline:</span>
                        <span class="text-red-600 font-medium">February 1, 2026 at 11:59 PM</span>
                    </li>
                    <li class="flex items-center gap-3">
                        <span class="font-semibold text-slate-700 w-36">Who Can Evaluate:</span>
                        <span class="text-slate-600">All enrolled students</span>
                    </li>
                </ul>
            </div>
            
            <h4 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <i class="fas fa-list-ol text-blue-500"></i> How to Participate
            </h4>
            <ol class="mb-6 space-y-3">
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-6 h-6 bg-maroon-800 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</span>
                    <span>Log in to MyCSU Portal with your CSU credentials</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-6 h-6 bg-maroon-800 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</span>
                    <span>Click on the "OFES" system card to access the evaluation system</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-6 h-6 bg-maroon-800 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</span>
                    <span>Select the courses you want to evaluate from your enrollment list</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-6 h-6 bg-maroon-800 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">4</span>
                    <span>Complete the evaluation form for each faculty member</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-6 h-6 bg-maroon-800 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">5</span>
                    <span>Submit your evaluations before the deadline</span>
                </li>
            </ol>
            
            <h4 class="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <i class="fas fa-heart text-red-500"></i> Why Your Feedback Matters
            </h4>
            <ul class="mb-6 space-y-2">
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-2 h-2 bg-maroon-500 rounded-full flex-shrink-0 mt-2"></span>
                    <span>Helps improve teaching quality across all colleges</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-2 h-2 bg-maroon-500 rounded-full flex-shrink-0 mt-2"></span>
                    <span>Provides constructive feedback to faculty members</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-2 h-2 bg-maroon-500 rounded-full flex-shrink-0 mt-2"></span>
                    <span>Influences curriculum development and improvements</span>
                </li>
                <li class="flex items-start gap-3 text-slate-700">
                    <span class="w-2 h-2 bg-maroon-500 rounded-full flex-shrink-0 mt-2"></span>
                    <span>Ensures accountability and excellence in education</span>
                </li>
            </ul>
            
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p class="text-sm text-blue-800 flex items-start gap-2">
                    <i class="fas fa-shield-alt mt-0.5"></i>
                    <span><strong>Privacy Notice:</strong> Your responses are completely confidential and will be used solely for evaluation purposes. Faculty members cannot see individual responses.</span>
                </p>
            </div>
        `
    }
};

// ============================================================================
// NAVIGATION CONTROLLER
// ============================================================================

const NavigationController = {
    /**
     * Initialize navigation event listeners
     */
    init() {
        // Scroll effect for navbar
        window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

        // Mobile menu toggle
        DOM.mobileMenuBtn?.addEventListener('click', this.toggleMobileMenu.bind(this));

        // Close mobile menu on link click
        DOM.mobileMenu?.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => this.closeMobileMenu());
        });

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', this.handleAnchorClick.bind(this));
        });
    },

    /**
     * Handle scroll event for navbar styling
     */
    handleScroll() {
        const scrolled = window.scrollY > 20;

        if (scrolled !== AppState.isNavScrolled) {
            AppState.isNavScrolled = scrolled;

            if (scrolled) {
                DOM.navbar.classList.add('shadow-md', 'border-slate-200/60');
                DOM.navbar.classList.remove('border-transparent');
            } else {
                DOM.navbar.classList.remove('shadow-md', 'border-slate-200/60');
                DOM.navbar.classList.add('border-transparent');
            }
        }
    },

    /**
     * Toggle mobile menu visibility
     */
    toggleMobileMenu() {
        AppState.isMobileMenuOpen = !AppState.isMobileMenuOpen;

        DOM.mobileMenu.classList.toggle('hidden');
        DOM.mobileMenuIcon.classList.toggle('fa-bars');
        DOM.mobileMenuIcon.classList.toggle('fa-times');
        DOM.mobileMenuBtn.setAttribute('aria-expanded', AppState.isMobileMenuOpen);
    },

    /**
     * Close mobile menu
     */
    closeMobileMenu() {
        if (AppState.isMobileMenuOpen) {
            AppState.isMobileMenuOpen = false;
            DOM.mobileMenu.classList.add('hidden');
            DOM.mobileMenuIcon.classList.add('fa-bars');
            DOM.mobileMenuIcon.classList.remove('fa-times');
            DOM.mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
    },

    /**
     * Handle smooth scroll for anchor links
     */
    handleAnchorClick(e) {
        const href = e.currentTarget.getAttribute('href');
        if (href === '#') return;

        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const offset = 80;
            const targetPosition = target.offsetTop - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // Close mobile menu if open
            this.closeMobileMenu();
        }
    }
};

// ============================================================================
// AUTHENTICATION CONTROLLER
// ============================================================================

const AuthController = {
    /**
     * Initialize authentication event listeners
     */
    init() {
        // Login buttons
        DOM.loginBtn?.addEventListener('click', () => this.openLoginModal());
        DOM.heroLoginBtn?.addEventListener('click', () => this.openLoginModal());
        DOM.promptLoginBtns?.forEach(btn => {
            btn.addEventListener('click', () => this.openLoginModal());
        });

        // Logout button
        DOM.logoutBtn?.addEventListener('click', () => this.handleLogout());

        // Google login button
        DOM.loginGoogleBtn?.addEventListener('click', () => this.handleGoogleLogin());

        // Switch account button
        DOM.switchAccountBtn?.addEventListener('click', () => this.handleSwitchAccount());

        // Login modal close
        DOM.closeLoginModal?.addEventListener('click', () => this.closeLoginModal());
        DOM.loginModal?.addEventListener('click', (e) => {
            if (e.target === DOM.loginModal) this.closeLoginModal();
        });

        // User menu dropdown
        DOM.userMenuBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleUserDropdown();
        });

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            if (!DOM.userMenu?.contains(e.target)) {
                this.closeUserDropdown();
            }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (DOM.systemAccessModal && !DOM.systemAccessModal.classList.contains('hidden')) {
                    SystemAccessModal.close();
                    return;
                }
                this.closeUserDropdown();
                this.closeLoginModal();
            }
        });
    },

    /**
     * Handle user login
     * In production, this integrates with Firebase Auth
     */
    openLoginModal() {
        if (!auth) {
            ToastController.show('error', 'Firebase Not Ready', 'Please configure Firebase to enable login.');
            return;
        }
        DOM.loginModal?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        this.updateLoginModalState();
        DOM.loginEmail?.focus();
    },

    closeLoginModal() {
        DOM.loginModal?.classList.add('hidden');
        document.body.style.overflow = '';
    },

    setGoogleLoading(isLoading) {
        if (!DOM.loginGoogleBtn) return;
        DOM.loginGoogleBtn.disabled = isLoading;
        DOM.loginGoogleBtn.classList.toggle('opacity-70', isLoading);
        DOM.loginGoogleBtn.classList.toggle('cursor-not-allowed', isLoading);
        if (isLoading) {
            DOM.loginGoogleBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing In...';
        } else {
            this.updateLoginModalState();
        }
    },

    updateLoginModalState() {
        if (!DOM.loginGoogleBtn) return;

        const isLoggedIn = AppState.isLoggedIn === true;
        const email = AppState.currentUser?.email || '';

        DOM.loginGoogleBtn.disabled = isLoggedIn;
        DOM.loginGoogleBtn.classList.toggle('opacity-60', isLoggedIn);
        DOM.loginGoogleBtn.classList.toggle('cursor-not-allowed', isLoggedIn);
        DOM.loginGoogleBtn.classList.toggle('hover:bg-slate-50', !isLoggedIn);

        DOM.loginGoogleBtn.innerHTML = isLoggedIn
            ? '<i class="fas fa-check-circle mr-2"></i>Already signed in'
            : '<i class="fab fa-google mr-2"></i>Continue with Google';

        if (DOM.switchAccountSection) {
            DOM.switchAccountSection.classList.toggle('hidden', !isLoggedIn);
        }

        if (DOM.currentUserEmail) {
            DOM.currentUserEmail.textContent = email || 'your account';
        }
    },

    async handleSwitchAccount() {
        if (!auth) return;

        try {
            await auth.signOut();
            this.updateUIForLoggedOutUser();
            this.openLoginModal();
            setTimeout(() => this.handleGoogleLogin(), 200);
        } catch (error) {
            ToastController.show('error', 'Switch Account Failed', error.message || 'Unable to switch account.');
        }
    },

    async handleGoogleLogin() {
        if (!auth) {
            ToastController.show('error', 'Firebase Not Ready', 'Please configure Firebase to enable login.');
            return;
        }

        try {
            this.setGoogleLoading(true);

            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });

            const credential = await auth.signInWithPopup(provider);
            const user = credential.user;

            // --- Email domain enforcement ---
            if (!user.email || !user.email.toLowerCase().endsWith('@csu.edu.ph')) {
                await auth.signOut();
                ToastController.show('error', 'Access Restricted', 'Only @csu.edu.ph institutional emails are allowed.');
                return;
            }

            const displayName = user.displayName || user.email?.split('@')[0]?.replace(/[._-]/g, ' ') || 'User';
            const userProfile = {
                displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
                email: user.email,
                uid: user.uid,
                role: 'User',
                photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=800000&color=fff&size=128&bold=true`
            };

            this.closeLoginModal();

            // --- Firestore user onboarding ---
            await this.resolveFirestoreUser(user, userProfile);
        } catch (error) {
            console.error('Login error:', error);
            ToastController.show('error', 'Login Failed', error.message || 'Unable to sign in.');
            if (auth?.currentUser) {
                await auth.signOut();
            }
            this.updateUIForLoggedOutUser();
        } finally {
            this.setGoogleLoading(false);
        }
    },

    /**
     * Check Firestore for the user doc; create a pending doc if absent.
     * Then apply the appropriate UI state.
     */
    async resolveFirestoreUser(firebaseUser, userProfile) {
        // Apply logged-in shell UI immediately to avoid sign-in flicker while
        // Firestore reads resolve on refresh/session restore.
        this.updateUIForLoggedInUser(userProfile);

        if (!db) {
            // Firestore unavailable — fall back to basic logged-in UI
            ToastController.show('success', 'Signed In', 'You can now open available systems from the Systems section.');
            return;
        }

        try {
            const userRef = db.collection('users').doc(firebaseUser.uid);
            const normalizedEmail = (firebaseUser.email || '').toLowerCase().trim();
            const userSnap = await userRef.get();

            let resolvedUserData = null;

            if (!userSnap.exists) {
                // First visit — create UID-bound pending doc.
                // We intentionally avoid cross-email queries here because Firestore rules
                // only allow non-admin users to read/write their own UID document.
                resolvedUserData = {
                    email: normalizedEmail || firebaseUser.email,
                    displayName: userProfile.displayName,
                    photoURL: userProfile.photoURL,
                    status: 'pending',
                    role: 'user',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    assignedSystems: []
                };
                await userRef.set(resolvedUserData);
            } else {
                resolvedUserData = userSnap.data() || {};
            }

            const rawStatus = String(resolvedUserData.status || 'pending').trim().toLowerCase();
            const rawRole = String(resolvedUserData.role || 'user').trim().toLowerCase();

            const normalizedStatus =
                rawStatus === '1' || rawStatus === 'approved' ? 'active'
                : rawStatus === '0' || rawStatus === 'for_approval' || rawStatus === 'awaiting_approval' ? 'pending'
                : rawStatus;

            AppState.userStatus = normalizedStatus;
            AppState.userFirestoreRole = rawRole;
            AppState.userAccessMap = {};
            AppState.userRevokedSystems = {};

            // Load user_access records to enforce revocations even when
            // a user can be opened via system-side existing account fallback.
            const accessSnap = await db.collection('user_access')
                .where('userId', '==', firebaseUser.uid)
                .get();
            const accessMap = {};
            const revokedMap = {};
            accessSnap.forEach(doc => {
                const d = doc.data();
                const systemId = String(d.systemId || '').toUpperCase();
                if (!systemId) return;

                const accessStatus = String(d.status || 'active').trim().toLowerCase();
                const isRevoked = accessStatus === 'revoked' || accessStatus === 'inactive' || accessStatus === 'disabled';
                if (isRevoked) {
                    revokedMap[systemId] = true;
                    return;
                }

                if (AppState.userStatus === 'active') {
                    accessMap[systemId] = {
                        roleId: d.systemRoleKey || d.roleId || '',
                        roleName: d.systemRoleName || d.roleName || '',
                        canonicalRole: d.canonicalRole || '',
                        externalRoleValue: d.externalRoleValue || ''
                    };
                }
            });
            AppState.userAccessMap = accessMap;
            AppState.userRevokedSystems = revokedMap;

            // Re-apply UI so role-dependent elements (e.g. admin link) reflect
            // the resolved Firestore role/state.
            this.updateUIForLoggedInUser(userProfile);

            if (AppState.userStatus === 'pending') {
                this.showPendingUserBanner();
                LoggingController.logEvent('login', null, { status: 'pending' });
            } else if (AppState.userStatus === 'active') {
                this.applySystemAccessFromFirestore();
                LoggingController.logEvent('login', null, { status: 'active', role: AppState.userFirestoreRole });
                ToastController.show('success', 'Signed In', 'Welcome back! Your accessible systems are now available.');
            } else {
                // rejected or unknown
                this.showPendingUserBanner('Your account access has been revoked. Please contact MIS.', false);
                LoggingController.logEvent('login', null, { status: AppState.userStatus });
            }
        } catch (err) {
            console.error('[Auth] Firestore user resolve failed:', err);
            // Degrade gracefully — show regular logged-in state without access gating
            this.updateUIForLoggedInUser(userProfile);
            ToastController.show('warning', 'Signed In', 'Could not verify system access. Contact MIS if systems are unavailable.');
        }
    },

    /**
     * Show the pending/restricted user banner and disable all system cards.
     */
    canOpenViaExistingSystemRecord(systemId) {
        const normalized = String(systemId || '').toUpperCase();
        return normalized === 'HRIS' || normalized === 'OFES';
    },

    isSystemEnabled(systemId) {
        const normalized = String(systemId || '').toUpperCase();
        if (!normalized) return true;

        const status = String(AppState.systemStatusMap[normalized] || '').trim().toLowerCase();
        return status === '' || status === 'active';
    },

    isSystemRevoked(systemId) {
        const normalized = String(systemId || '').toUpperCase();
        if (!normalized) return false;
        return !!AppState.userRevokedSystems[normalized];
    },

    showPendingUserBanner(message = null, allowDirectSystemFallback = true) {
        const banner = document.getElementById('pendingUserBanner');
        if (banner) {
            if (message) {
                const msgEl = banner.querySelector('[data-pending-message]');
                if (msgEl) msgEl.textContent = message;
            } else {
                const msgEl = banner.querySelector('[data-pending-message]');
                if (msgEl) {
                    msgEl.textContent = 'Your MyCSU account is pending, but you may still open integrated systems where your email already exists.';
                }
            }
            banner.classList.remove('hidden');
        }
        // Keep integrated systems openable (HRIS/OFES) so existing system records can pass through.
        DOM.systemButtons.forEach(btn => {
            const systemId = btn.dataset.system;
            const allowDirect = allowDirectSystemFallback
                && this.canOpenViaExistingSystemRecord(systemId)
                && this.isSystemEnabled(systemId)
                && !this.isSystemRevoked(systemId);

            if (allowDirect) {
                btn.disabled = false;
                btn.classList.remove('bg-slate-100', 'text-slate-400');
                btn.classList.add('bg-maroon-800', 'text-white', 'hover:bg-maroon-900', 'shadow-lg', 'shadow-maroon-800/20');
                btn.innerHTML = '<i class="fas fa-external-link-alt mr-2"></i>Open System';
                return;
            }

            btn.disabled = true;
            btn.classList.add('bg-slate-100', 'text-slate-400');
            btn.classList.remove('bg-maroon-800', 'text-white', 'hover:bg-maroon-900', 'shadow-lg', 'shadow-maroon-800/20');
            btn.innerHTML = '<i class="fas fa-clock mr-2 opacity-60"></i>Pending Approval';
        });
    },

    /**
     * Enable only the system cards the user has been granted access to in Firestore.
     */
    applySystemAccessFromFirestore() {
        const accessMap = AppState.userAccessMap;
        // MIS admins get access to everything
        const isMisAdmin = AppState.userFirestoreRole === 'mis_admin';

        DOM.systemButtons.forEach(btn => {
            const systemId = btn.dataset.system;
            const isSystemActive = this.isSystemEnabled(systemId);
            const isRevoked = this.isSystemRevoked(systemId);
            const allowByExistingSystemRecord = this.canOpenViaExistingSystemRecord(systemId) && !isRevoked;
            const hasAccess = isMisAdmin
                || (systemId && accessMap[systemId])
                || allowByExistingSystemRecord;
            const canOpen = hasAccess && isSystemActive;

            if (canOpen) {
                btn.disabled = false;
                btn.classList.remove('bg-slate-100', 'text-slate-400');
                btn.classList.add('bg-maroon-800', 'text-white', 'hover:bg-maroon-900', 'shadow-lg', 'shadow-maroon-800/20');
                btn.innerHTML = '<i class="fas fa-external-link-alt mr-2"></i>Open System';
            } else {
                btn.disabled = true;
                btn.classList.add('bg-slate-100', 'text-slate-400');
                btn.classList.remove('bg-maroon-800', 'text-white', 'hover:bg-maroon-900', 'shadow-lg', 'shadow-maroon-800/20');
                if (!isSystemActive) {
                    btn.innerHTML = '<i class="fas fa-circle-pause mr-2 opacity-70"></i>System Inactive';
                } else if (isRevoked) {
                    btn.innerHTML = '<i class="fas fa-ban mr-2 opacity-70"></i>Access Revoked';
                } else {
                    btn.innerHTML = '<i class="fas fa-lock mr-2 opacity-60"></i>No Access';
                }
            }
        });
    },

    async authorizeWithHRIS(idToken) {
        const response = await fetch(HRIS_AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ idToken })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || 'Access denied by HRIS.');
        }

        return data;
    },

    /**
     * Handle user logout
     */
    handleLogout() {
        if (!auth) {
            this.updateUIForLoggedOutUser();
            ToastController.show('info', 'Signed Out', 'You have been logged out successfully.');
            return;
        }

        LoggingController.logEvent('logout').finally(() => {
            auth.signOut()
                .then(() => {
                    this.updateUIForLoggedOutUser();
                    ToastController.show('info', 'Signed Out', 'You have been logged out successfully.');
                })
                .catch((error) => {
                    console.error('Logout error:', error);
                });
        });
    },

    /**
     * Update UI for logged in state (base visibility only — access gating is separate)
     */
    updateUIForLoggedInUser(user) {
        AppState.isLoggedIn = true;
        AppState.currentUser = user;

        // Toggle visibility
        DOM.loginBtn?.classList.add('hidden');
        DOM.userMenu?.classList.remove('hidden');
        DOM.loginPromptBanner?.classList.add('hidden');

        // Show admin portal link if MIS admin
        const adminLink = document.getElementById('adminPortalLink');
        if (adminLink && AppState.userFirestoreRole === 'mis_admin') {
            adminLink.classList.remove('hidden');
        }

        // Update user info displays
        if (DOM.userName) DOM.userName.textContent = user.displayName;
        if (DOM.userRole) DOM.userRole.textContent = user.role || 'User';
        if (DOM.dropdownUserName) DOM.dropdownUserName.textContent = user.displayName;
        if (DOM.dropdownUserEmail) DOM.dropdownUserEmail.textContent = user.email;
        if (DOM.userAvatar && user.photoURL) DOM.userAvatar.src = user.photoURL;

        console.log('[Auth] User logged in:', user.displayName);
        this.updateLoginModalState();
    },

    /**
     * Update UI for logged out state
     */
    updateUIForLoggedOutUser() {
        AppState.isLoggedIn = false;
        AppState.currentUser = null;
        AppState.hrisAuthorized = false;
        AppState.hrisIsAdmin = false;
        AppState.hrisRole = null;
        AppState.userStatus = null;
        AppState.userFirestoreRole = null;
        AppState.userAccessMap = {};
        AppState.userRevokedSystems = {};

        // Toggle visibility
        DOM.loginBtn?.classList.remove('hidden');
        DOM.userMenu?.classList.add('hidden');
        DOM.loginPromptBanner?.classList.remove('hidden');

        // Hide admin portal link
        const adminLink = document.getElementById('adminPortalLink');
        if (adminLink) adminLink.classList.add('hidden');

        // Hide pending banner
        const banner = document.getElementById('pendingUserBanner');
        if (banner) banner.classList.add('hidden');

        // Close dropdown
        this.closeUserDropdown();

        // Reset system buttons
        DOM.systemButtons.forEach(btn => {
            btn.disabled = true;
            btn.classList.add('bg-slate-100', 'text-slate-400');
            btn.classList.remove('bg-maroon-800', 'text-white', 'hover:bg-maroon-900', 'shadow-lg', 'shadow-maroon-800/20');
            btn.innerHTML = '<i class="fas fa-lock mr-2 opacity-60"></i>Sign in to Access';
        });

        console.log('[Auth] User logged out');
        this.updateLoginModalState();
    },

    /**
     * Toggle user dropdown menu
     */
    toggleUserDropdown() {
        AppState.isUserDropdownOpen = !AppState.isUserDropdownOpen;

        DOM.userDropdown?.classList.toggle('hidden');
        DOM.dropdownArrow?.classList.toggle('rotate-180');
        DOM.userMenuBtn?.setAttribute('aria-expanded', AppState.isUserDropdownOpen);
    },

    /**
     * Close user dropdown menu
     */
    closeUserDropdown() {
        if (AppState.isUserDropdownOpen) {
            AppState.isUserDropdownOpen = false;
            DOM.userDropdown?.classList.add('hidden');
            DOM.dropdownArrow?.classList.remove('rotate-180');
            DOM.userMenuBtn?.setAttribute('aria-expanded', 'false');
        }
    }
};

// ============================================================================
// SYSTEM ACCESS MODAL (OFES / future integrated systems)
// ============================================================================

const SystemAccessModal = {
    init() {
        const close = () => this.close();
        DOM.closeSystemAccessModal?.addEventListener('click', close);
        DOM.systemAccessModalOk?.addEventListener('click', close);
        DOM.systemAccessModal?.addEventListener('click', (e) => {
            if (e.target === DOM.systemAccessModal) close();
        });
    },

    close() {
        DOM.systemAccessModal?.classList.add('hidden');
        DOM.systemAccessModal?.classList.remove('flex');
        document.body.style.overflow = '';
    },

    /**
     * @param {string} systemName - e.g. "OFES"
     * @param {string} code - server error code (e.g. ofes_email_not_registered)
     * @param {string} message - full message from API or fallback
     */
    open(systemName, code, message) {
        const titles = {
            ofes_email_not_registered: 'No OFES account for this email',
            ofes_role_not_eligible: 'This login path is not for your role',
            ofes_account_inactive: 'OFES account inactive',
            invalid_or_expired_token: 'Sign-in expired',
            missing_id_token: 'Sign-in error',
            network_error: 'Connection problem',
            system_inactive: 'System inactive',
            access_revoked: 'Access revoked'
        };
        const title = titles[code] || `Cannot open ${systemName}`;
        const body = message || 'Please contact MIS if you need access.';

        if (DOM.systemAccessModalTitle) DOM.systemAccessModalTitle.textContent = title;
        if (DOM.systemAccessModalBody) DOM.systemAccessModalBody.textContent = body;

        DOM.systemAccessModal?.classList.remove('hidden');
        DOM.systemAccessModal?.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
};

// ============================================================================
// SYSTEM CARDS CONTROLLER
// ============================================================================

const SystemController = {
    showLoadingOverlay() {
        if (!DOM.systemLoadingOverlay) return Promise.resolve();

        const overlay = DOM.systemLoadingOverlay;
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');

        const delayMs = 3000 + Math.floor(Math.random() * 2000);
        return new Promise((resolve) => setTimeout(resolve, delayMs));
    },

    hideLoadingOverlay() {
        if (!DOM.systemLoadingOverlay) return;
        DOM.systemLoadingOverlay.classList.add('hidden');
        DOM.systemLoadingOverlay.classList.remove('flex');
    },

    /**
     * Initialize system card event listeners
     */
    init() {
        DOM.systemButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleSystemClick(e));
        });
    },

    /**
     * Handle system button click
     */
    async handleSystemClick(e) {
        const button = e.target.closest('.system-btn');
        const systemName = button?.dataset.system;

        if (!AppState.isLoggedIn) {
            ToastController.show('warning', 'Authentication Required', 'Please sign in to access university systems.');
            return;
        }

        if (!systemName) return;

        if (!AuthController.isSystemEnabled(systemName)) {
            LoggingController.logEvent('access_denied', systemName, { reason: 'system_inactive' });
            SystemAccessModal.open(
                systemName,
                'system_inactive',
                `${systemName} is currently inactive. Please contact MIS.`
            );
            return;
        }

        if (AuthController.isSystemRevoked(systemName)) {
            LoggingController.logEvent('access_denied', systemName, { reason: 'access_revoked' });
            SystemAccessModal.open(
                systemName,
                'access_revoked',
                `Your access to ${systemName} has been revoked. Please contact MIS.`
            );
            return;
        }

        // Firestore access gate
        const isMisAdmin = AppState.userFirestoreRole === 'mis_admin';
        const hasAccess = isMisAdmin || AppState.userAccessMap[systemName];
        const canDirectCheck = AuthController.canOpenViaExistingSystemRecord(systemName);
        if (!hasAccess && AppState.userStatus !== null && !canDirectCheck) {
            LoggingController.logEvent('access_denied', systemName);
            SystemAccessModal.open(
                systemName,
                'access_denied',
                `You do not have access to ${systemName}. Please contact MIS to request access.`
            );
            return;
        }

        // System URLs mapping (configure for production)
        const systemUrls = {
            'HRIS': AppState.hrisIsAdmin ? HRIS_ADMIN_URL : HRIS_DASHBOARD_URL,
            'E2E': '/systems/e2e'
        };

        console.log(`[System] Opening ${systemName}...`);

        if (systemName === 'HRIS') {
            if (!auth?.currentUser) {
                ToastController.show('warning', 'Authentication Required', 'Please sign in to access HRIS.');
                return;
            }

            try {
                const loadingPromise = this.showLoadingOverlay();
                const idToken = await auth.currentUser.getIdToken(true);
                await loadingPromise;

                const form = document.createElement('form');
                form.method = 'POST';
                form.action = HRIS_AUTH_URL;

                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'idToken';
                input.value = idToken;

                form.appendChild(input);
                document.body.appendChild(form);

                LoggingController.logEvent('system_access', 'HRIS');
                form.submit();
            } catch (error) {
                this.hideLoadingOverlay();
                ToastController.show('error', 'Access Denied', error.message || 'Your account is not authorized for HRIS.');
            }

            return;
        }

        if (systemName === 'OFES') {
            if (!auth?.currentUser) {
                ToastController.show('warning', 'Authentication Required', 'Please sign in to access OFES.');
                return;
            }

            try {
                const loadingPromise = this.showLoadingOverlay();
                const idToken = await auth.currentUser.getIdToken(true);
                await loadingPromise;

                const response = await fetch(OFES_AUTH_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ idToken })
                });

                const rawBody = await response.text();
                let data = {};
                try {
                    data = rawBody ? JSON.parse(rawBody) : {};
                } catch {
                    data = {};
                }
                this.hideLoadingOverlay();

                if (response.ok && data.redirect) {
                    LoggingController.logEvent('system_access', 'OFES');
                    window.location.href = data.redirect;
                    return;
                }

                const code = data.code || '';
                const bodySnippet = rawBody
                    ? rawBody.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220)
                    : '';
                const msg =
                    data.message ||
                    (response.status === 403
                        ? 'Access was denied for OFES.'
                        : bodySnippet
                            ? `OFES response (${response.status}): ${bodySnippet}`
                            : `Could not open OFES. Try again or contact MIS. (HTTP ${response.status})`);
                SystemAccessModal.open('OFES', code, msg);
            } catch (error) {
                this.hideLoadingOverlay();
                SystemAccessModal.open(
                    'OFES',
                    'network_error',
                    error.message || 'Could not reach OFES. Check your connection and try again.'
                );
            }

            return;
        }

        await this.showLoadingOverlay();
        if (systemUrls[systemName]) {
            window.location.href = systemUrls[systemName];
        }
    }
};

// ============================================================================
// LOGGING CONTROLLER
// ============================================================================

const LoggingController = {
    /**
     * Write an event to the Firestore logs collection.
     * Silently fails — logging must never interrupt the user flow.
     *
     * @param {string} action  - e.g. 'login', 'logout', 'system_access', 'access_denied'
     * @param {string|null} systemId  - Firestore system doc ID or data-system value, null if N/A
     * @param {Object} metadata  - optional additional details
     */
    logEvent(action, systemId = null, metadata = {}) {
        if (!db || !auth?.currentUser) return Promise.resolve();

        const user = auth.currentUser;
        const entry = {
            userId: user.uid,
            email: user.email || '',
            action,
            systemId: systemId || null,
            timestamp: serverTimestamp(),
            metadata
        };

        return db.collection('logs').add(entry).catch(err => {
            console.warn('[Log] Failed to write log entry:', err);
        });
    }
};

// ============================================================================
// SYSTEM STATUS CONTROLLER (Firestore systems collection)
// ============================================================================

const SystemStatusController = {
    _unsub: null,

    init() {
        if (!db || !auth?.currentUser) {
            this.destroy();
            return;
        }

        this.destroy();

        this._unsub = db.collection('systems').onSnapshot((snap) => {
            const statusMap = {};
            snap.forEach((doc) => {
                const d = doc.data() || {};
                const systemId = String(doc.id || d.name || '').toUpperCase();
                if (!systemId) return;
                statusMap[systemId] = String(d.status || 'active').trim().toLowerCase();
            });

            AppState.systemStatusMap = statusMap;
            this.applyCardStatuses();

            if (!AppState.isLoggedIn) return;

            if (AppState.userStatus === 'pending') {
                AuthController.showPendingUserBanner();
                return;
            }

            if (AppState.userStatus === 'active') {
                AuthController.applySystemAccessFromFirestore();
                return;
            }

            if (AppState.userStatus) {
                AuthController.showPendingUserBanner('Your account access has been revoked. Please contact MIS.', false);
            }
        }, (err) => {
            console.warn('[Systems] status subscribe failed:', err);
        });
    },

    destroy() {
        this._unsub?.();
        this._unsub = null;
    },

    applyCardStatuses() {
        document.querySelectorAll('.system-card[data-system]').forEach((card) => {
            const systemId = String(card.getAttribute('data-system') || '').toUpperCase();
            if (!systemId) return;

            const status = String(AppState.systemStatusMap[systemId] || '').trim().toLowerCase();
            const normalized = status === 'inactive' ? 'inactive' : 'active';

            const badgeEl = card.querySelector('[data-system-status]');
            const dotEl = card.querySelector('[data-system-status-dot]');
            const textEl = card.querySelector('[data-system-status-text]');
            if (!badgeEl || !dotEl || !textEl) return;

            badgeEl.classList.remove('bg-emerald-50', 'border-emerald-200', 'bg-slate-100', 'border-slate-300');
            dotEl.classList.remove('bg-emerald-500', 'bg-slate-400');
            textEl.classList.remove('text-emerald-700', 'text-slate-500');

            if (normalized === 'active') {
                badgeEl.classList.add('bg-emerald-50', 'border-emerald-200');
                dotEl.classList.add('bg-emerald-500');
                textEl.classList.add('text-emerald-700');
                textEl.textContent = 'Active';
            } else {
                badgeEl.classList.add('bg-slate-100', 'border-slate-300');
                dotEl.classList.add('bg-slate-400');
                textEl.classList.add('text-slate-500');
                textEl.textContent = 'Inactive';
            }
        });
    }
};

// ============================================================================
// ANNOUNCEMENTS CONTROLLER
// ============================================================================

const AnnouncementsController = {
    /**
     * Initialize announcement event listeners
     */
    init() {
        // Open modal buttons
        DOM.announcementButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.announcement-btn')?.dataset.announcement;
                if (id) this.openModal(id);
            });
        });

        // Close modal buttons
        DOM.closeModal?.addEventListener('click', () => this.closeModal());
        DOM.closeModalBtn?.addEventListener('click', () => this.closeModal());

        // Close on backdrop click
        DOM.announcementModal?.addEventListener('click', (e) => {
            if (e.target === DOM.announcementModal) {
                this.closeModal();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !DOM.announcementModal?.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    },

    /**
     * Open announcement modal
     */
    openModal(announcementId) {
        const announcement = announcementsData[announcementId];

        if (!announcement) {
            console.error('[Announcements] Not found:', announcementId);
            return;
        }

        // Populate modal content
        if (DOM.modalTitle) DOM.modalTitle.textContent = announcement.title;
        if (DOM.modalDate) DOM.modalDate.innerHTML = `<i class="far fa-calendar mr-1"></i>${announcement.date}`;
        if (DOM.modalCategory) {
            DOM.modalCategory.textContent = announcement.category;
            DOM.modalCategory.className = `px-3 py-1 text-xs font-semibold rounded-full ${announcement.categoryClass}`;
        }
        if (DOM.modalContent) DOM.modalContent.innerHTML = announcement.content;

        // Show modal
        DOM.announcementModal?.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // Focus management for accessibility
        DOM.closeModal?.focus();
    },

    /**
     * Close announcement modal
     */
    closeModal() {
        DOM.announcementModal?.classList.add('hidden');
        document.body.style.overflow = '';
    }
};

// ============================================================================
// UPDATES FILTER CONTROLLER
// ============================================================================

const UpdatesController = {
    /**
     * Initialize filter tab event listeners
     */
    init() {
        DOM.filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.handleFilterClick(e));
        });
    },

    /**
     * Handle filter tab click
     */
    handleFilterClick(e) {
        const clickedTab = e.target.closest('.filter-tab');
        const filter = clickedTab?.dataset.filter;

        if (!filter || filter === AppState.activeFilter) return;

        AppState.activeFilter = filter;

        // Update tab styles
        DOM.filterTabs.forEach(tab => {
            const isActive = tab.dataset.filter === filter;
            tab.classList.toggle('bg-maroon-800', isActive);
            tab.classList.toggle('text-white', isActive);
            tab.classList.toggle('bg-slate-100', !isActive);
            tab.classList.toggle('text-slate-600', !isActive);
            tab.setAttribute('aria-selected', isActive);
        });

        // Filter update items
        DOM.updateItems.forEach(item => {
            const itemSystem = item.dataset.system;
            const shouldShow = filter === 'all' || itemSystem === filter || itemSystem === 'all';

            if (shouldShow) {
                item.classList.remove('hidden');
                item.style.opacity = '0';
                requestAnimationFrame(() => {
                    item.style.transition = 'opacity 0.3s ease';
                    item.style.opacity = '1';
                });
            } else {
                item.classList.add('hidden');
            }
        });
    }
};

// ============================================================================
// TOAST NOTIFICATION CONTROLLER
// ============================================================================

const ToastController = {
    timeout: null,

    /**
     * Initialize toast event listeners
     */
    init() {
        DOM.closeToast?.addEventListener('click', () => this.hide());
    },

    /**
     * Show toast notification
     * @param {string} type - 'success' | 'error' | 'warning' | 'info'
     * @param {string} title - Toast title
     * @param {string} message - Toast message
     */
    show(type = 'info', title = 'Notification', message = '') {
        if (!DOM.toast) return;

        // Clear existing timeout
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        // Set icon and colors based on type
        const config = {
            success: { icon: 'fa-check', bg: 'bg-emerald-500' },
            error: { icon: 'fa-times', bg: 'bg-red-500' },
            warning: { icon: 'fa-exclamation', bg: 'bg-amber-500' },
            info: { icon: 'fa-info', bg: 'bg-blue-500' }
        };

        const { icon, bg } = config[type] || config.info;

        // Update toast content
        if (DOM.toastIcon) {
            DOM.toastIcon.className = `w-10 h-10 ${bg} rounded-full flex items-center justify-center flex-shrink-0`;
            DOM.toastIcon.innerHTML = `<i class="fas ${icon} text-white"></i>`;
        }
        if (DOM.toastTitle) DOM.toastTitle.textContent = title;
        if (DOM.toastMessage) DOM.toastMessage.textContent = message;

        // Show toast
        DOM.toast.classList.remove('hidden');

        // Auto-hide after 5 seconds
        this.timeout = setTimeout(() => this.hide(), 5000);
    },

    /**
     * Hide toast notification
     */
    hide() {
        DOM.toast?.classList.add('hidden');
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
};

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

const KeyboardController = {
    /**
     * Initialize keyboard navigation
     */
    init() {
        // Skip to main content
        document.addEventListener('keydown', (e) => {
            // Alt + S: Skip to systems section
            if (e.altKey && e.key === 's') {
                e.preventDefault();
                document.querySelector('#systems')?.scrollIntoView({ behavior: 'smooth' });
            }

            // Alt + A: Skip to announcements
            if (e.altKey && e.key === 'a') {
                e.preventDefault();
                document.querySelector('#announcements')?.scrollIntoView({ behavior: 'smooth' });
            }

            // Alt + U: Skip to updates
            if (e.altKey && e.key === 'u') {
                e.preventDefault();
                document.querySelector('#updates')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
};

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

/**
 * OFES verify.php links "Back to MyCSU" with ?ofes=... so users get a clear toast after access issues.
 */
function consumeOfesQueryToast() {
    const params = new URLSearchParams(window.location.search);
    const ofes = params.get('ofes');
    if (!ofes) return;

    const map = {
        not_registered: {
            title: 'No OFES account',
            message: 'Your Google email is not in OFES yet. Ask MIS to add your official @csu.edu.ph address to OFES, then try Open System again.'
        },
        wrong_role: {
            title: 'OFES role',
            message: 'Your OFES role does not use the staff shortcut from MyCSU. Use the OFES website login, or contact MIS if you need a different role.'
        },
        inactive: {
            title: 'OFES account inactive',
            message: 'Your OFES account is deactivated. Contact MIS to reactivate it.'
        },
        session: {
            title: 'Session expired',
            message: 'Your sign-in could not be verified for OFES. Sign out of MyCSU and sign in again, then try Open System.'
        },
        error: {
            title: 'OFES',
            message: 'Something went wrong connecting to OFES. Try again or contact MIS.'
        }
    };
    const entry = map[ofes] || map.error;
    ToastController.show('warning', entry.title, entry.message);

    params.delete('ofes');
    const qs = params.toString();
    const clean = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    window.history.replaceState({}, '', clean);
}

/**
 * Initialize all controllers when DOM is ready
 */
function initializeApp() {
    console.log('[MyCSU] Initializing application...');

    // Initialize all controllers
    NavigationController.init();
    AuthController.init();
    SystemController.init();
    AnnouncementsController.init();
    UpdatesController.init();
    ToastController.init();
    KeyboardController.init();
    SystemAccessModal.init();

    consumeOfesQueryToast();

    // Firebase auth state observer
    if (auth) {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                SystemStatusController.init();
                // Reject non-CSU emails silently on session restore
                if (!user.email || !user.email.toLowerCase().endsWith('@csu.edu.ph')) {
                    await auth.signOut();
                    AuthController.updateUIForLoggedOutUser();
                    return;
                }
                const displayName = user.displayName || user.email?.split('@')[0] || 'User';
                const userProfile = {
                    displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
                    email: user.email,
                    uid: user.uid,
                    role: 'User',
                    photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=800000&color=fff&size=128&bold=true`
                };
                await AuthController.resolveFirestoreUser(user, userProfile);
            } else {
                SystemStatusController.destroy();
                AuthController.updateUIForLoggedOutUser();
            }
        });
    }

    console.log('[MyCSU] Application initialized successfully');
    if (!auth) {
        console.log('[MyCSU] Firebase not initialized. Configure firebaseConfig to enable login.');
    }
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// ============================================================================
// UTILITY EXPORTS (for console debugging)
// ============================================================================

window.MyCSU = {
    AppState,
    AuthController,
    SystemStatusController,
    LoggingController,
    ToastController,
    SystemAccessModal,
    version: '2.1.0'
};
