/**
 * =============================================================================
 * MyCSU Admin Portal — app.js
 * Controllers: AdminAuthGuard, AdminToast, DashboardController,
 *              UserManagementController, SystemManagementController,
 *              LogsController, AdminLoggingController, TabController
 * =============================================================================
 */

// ---------------------------------------------------------------------------
// Firebase config (mirrors mycsu/app.js)
// ---------------------------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyA_Tmm0njzjtYnKAZp26VsSXXoJeU0x_zI",
    authDomain: "mycsu-2c526.firebaseapp.com",
    projectId: "mycsu-2c526",
    storageBucket: "mycsu-2c526.firebasestorage.app",
    messagingSenderId: "245974217112",
    appId: "1:245974217112:web:ff9cc290fb455a35ac3bed",
    measurementId: "G-DSFE3LVWXJ"
};

let auth = null;
let db   = null;

try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db   = firebase.firestore();
    }
} catch (e) {
    console.error('[Admin] Firebase init failed:', e);
}

const serverTimestamp = () =>
    typeof firebase !== 'undefined'
        ? firebase.firestore.FieldValue.serverTimestamp()
        : new Date();

function getOfesBaseUrl() {
    const hostname = window.location.hostname || '';
    const isProd = hostname.includes('csu.edu.ph');
    return isProd ? 'https://ofes.csu.edu.ph' : 'http://localhost/ofes';
}

function sanitizeRoleKey(input) {
    return String(input || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 64);
}

function getDefaultSystemRoleTemplates(systemId) {
    const id = String(systemId || '').toUpperCase();

    const templates = {
        HRIS: [
            { roleKey: 'HRIS_S', displayName: 'HRIS Super Admin', externalValue: 'S', canonicalRole: 'admin' },
            { roleKey: 'HRIS_A', displayName: 'HRIS Admin', externalValue: 'A', canonicalRole: 'admin' },
            { roleKey: 'HRIS_E', displayName: 'HRIS Employee', externalValue: 'E', canonicalRole: 'staff' }
        ],
        OFES: [
            { roleKey: 'OFES_ADMINISTRATOR', displayName: 'OFES Administrator', externalValue: 'Administrator', canonicalRole: 'admin' },
            { roleKey: 'OFES_CAMPUS_ADMIN', displayName: 'OFES Campus Admin', externalValue: 'Campus Admin', canonicalRole: 'admin' },
            { roleKey: 'OFES_DEAN', displayName: 'OFES Dean', externalValue: 'Dean', canonicalRole: 'staff' }
        ],
        E2E: [
            { roleKey: 'E2E_ADMIN', displayName: 'E2E Admin', externalValue: 'admin', canonicalRole: 'admin' },
            { roleKey: 'E2E_STAFF', displayName: 'E2E Staff', externalValue: 'staff', canonicalRole: 'staff' },
            { roleKey: 'E2E_VIEWER', displayName: 'E2E Viewer', externalValue: 'viewer', canonicalRole: 'viewer' }
        ]
    };

    const fallback = [
        { roleKey: `${id}_ADMIN`, displayName: 'Admin', externalValue: 'admin', canonicalRole: 'admin' },
        { roleKey: `${id}_STAFF`, displayName: 'Staff', externalValue: 'staff', canonicalRole: 'staff' },
        { roleKey: `${id}_VIEWER`, displayName: 'Viewer', externalValue: 'viewer', canonicalRole: 'viewer' }
    ];

    return (templates[id] || fallback).map(role => ({ ...role, systemId: id }));
}

// ---------------------------------------------------------------------------
// Admin Toast
// ---------------------------------------------------------------------------
const AdminToast = {
    _timer: null,
    show(type = 'info', title = '', message = '') {
        const el    = document.getElementById('adminToast');
        const icon  = document.getElementById('adminToastIcon');
        const ttl   = document.getElementById('adminToastTitle');
        const msg   = document.getElementById('adminToastMessage');
        if (!el) return;

        const cfg = {
            success: { bg: 'bg-emerald-500', fa: 'fa-check' },
            error:   { bg: 'bg-red-500',     fa: 'fa-times' },
            warning: { bg: 'bg-amber-500',   fa: 'fa-exclamation' },
            info:    { bg: 'bg-blue-500',     fa: 'fa-info' }
        };
        const { bg, fa } = cfg[type] || cfg.info;

        icon.className = `w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`;
        icon.innerHTML = `<i class="fas ${fa} text-white text-sm"></i>`;
        ttl.textContent = title;
        msg.textContent = message;
        el.classList.remove('hidden');

        clearTimeout(this._timer);
        this._timer = setTimeout(() => el.classList.add('hidden'), 5000);
    }
};

// ---------------------------------------------------------------------------
// Admin Logging — writes to Firestore logs collection
// ---------------------------------------------------------------------------
const AdminLoggingController = {
    logEvent(action, systemId = null, metadata = {}) {
        if (!db || !auth?.currentUser) return Promise.resolve();
        const user = auth.currentUser;
        return db.collection('logs').add({
            userId:    user.uid,
            email:     user.email || '',
            action,
            systemId:  systemId || null,
            timestamp: serverTimestamp(),
            metadata
        }).catch(err => console.warn('[AdminLog] write failed:', err));
    }
};

// ---------------------------------------------------------------------------
// Tab Controller
// ---------------------------------------------------------------------------
const TabController = {
    init() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => this.activate(btn.dataset.tab));
        });
    },
    activate(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const isActive = btn.dataset.tab === tabName;
            btn.classList.toggle('active', isActive);
            btn.classList.toggle('text-slate-500', !isActive);
            btn.setAttribute('aria-selected', isActive);
        });
        document.querySelectorAll('[data-tab-content]').forEach(section => {
            section.classList.toggle('hidden', section.dataset.tabContent !== tabName);
        });
    }
};

// ---------------------------------------------------------------------------
// Modal helpers
// ---------------------------------------------------------------------------
function openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('hidden'); document.body.style.overflow = ''; }
}

function initModalCloseButtons() {
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.modal));
    });
    // Close on backdrop click
    ['assignAccessModal', 'systemFormModal', 'confirmModal'].forEach(id => {
        const el = document.getElementById(id);
        el?.addEventListener('click', e => { if (e.target === el) closeModal(id); });
    });
    // Escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            ['assignAccessModal', 'systemFormModal', 'confirmModal'].forEach(closeModal);
        }
    });
}

// ---------------------------------------------------------------------------
// Dashboard Controller
// ---------------------------------------------------------------------------
const DashboardController = {
    _unsubFeed: null,

    async loadStats() {
        if (!db) return;
        try {
            const [pendingSnap, activeSnap, systemsSnap] = await Promise.all([
                db.collection('users').where('status', '==', 'pending').get(),
                db.collection('users').where('status', '==', 'active').get(),
                db.collection('systems').get()
            ]);

            document.getElementById('statPending').textContent  = pendingSnap.size;
            document.getElementById('statActive').textContent   = activeSnap.size;
            document.getElementById('statSystems').textContent  = systemsSnap.size;

            // Update pending badge in tab
            const badge = document.getElementById('pendingBadge');
            if (badge) {
                badge.textContent = pendingSnap.size;
                badge.classList.toggle('hidden', pendingSnap.size === 0);
            }

            // Logs today
            const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
            const todaySnap  = await db.collection('logs')
                .where('timestamp', '>=', startOfDay).get();
            document.getElementById('statLogsToday').textContent = todaySnap.size;
        } catch (err) {
            console.error('[Dashboard] loadStats failed:', err);
        }
    },

    subscribeRecentActivity() {
        if (!db) return;
        const feed = document.getElementById('recentActivityFeed');

        this._unsubFeed = db.collection('logs')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .onSnapshot(snap => {
                if (snap.empty) {
                    feed.innerHTML = '<div class="px-6 py-8 text-center text-slate-400 text-sm">No activity yet.</div>';
                    return;
                }
                feed.innerHTML = snap.docs.map(doc => {
                    const d = doc.data();
                    const ts = d.timestamp?.toDate ? d.timestamp.toDate() : new Date();
                    return `
                    <div class="px-6 py-3.5 flex items-center gap-4">
                        <div class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                            ${actionIcon(d.action)}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-slate-800 truncate">
                                <span class="font-medium">${escHtml(d.email || d.userId || 'Unknown')}</span>
                                — <span class="text-slate-500">${formatAction(d.action)}</span>
                                ${d.systemId ? `<span class="ml-1 text-xs bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">${escHtml(d.systemId)}</span>` : ''}
                            </p>
                        </div>
                        <time class="text-xs text-slate-400 flex-shrink-0">${formatRelativeTime(ts)}</time>
                    </div>`;
                }).join('');
            }, err => console.error('[Dashboard] activity feed failed:', err));
    },

    destroy() {
        this._unsubFeed?.();
    }
};

// ---------------------------------------------------------------------------
// User Management Controller
// ---------------------------------------------------------------------------
const UserManagementController = {
    _unsub: null,
    _allUsers: [],
    _filter: 'all',
    _searchQuery: '',
    _pendingAssignUid: null,
    _pendingUserAccess: [],
    _pendingUserSystemIds: new Set(),
    _systemRolesCache: {},
    _ofesOptionsCache: null,

    init() {
        // Filter pills
        document.querySelectorAll('.user-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.user-filter-btn').forEach(b => {
                    b.classList.toggle('bg-maroon-800', b === btn);
                    b.classList.toggle('text-white', b === btn);
                    b.classList.toggle('text-slate-600', b !== btn);
                    b.classList.remove('bg-slate-50');
                });
                this._filter = btn.dataset.filter;
                this._renderTable();
            });
        });

        // Search
        document.getElementById('userSearch')?.addEventListener('input', e => {
            this._searchQuery = e.target.value.toLowerCase().trim();
            this._renderTable();
        });

        // Assign access modal
        document.getElementById('assignAccessConfirmBtn')?.addEventListener('click', () => {
            this._confirmAssignAccess();
        });

        document.getElementById('assignSystemSelect')?.addEventListener('change', async (e) => {
            await this.populateRolesForSystem(e.target.value);
            this.refreshOfesProvisioningSection();
        });

        document.getElementById('assignRoleSelect')?.addEventListener('change', (e) => {
            this.toggleCustomRoleSection(e.target.value === '__custom__');
            this.refreshOfesProvisioningSection();
        });

        document.getElementById('ofesCampusSelect')?.addEventListener('change', () => {
            this.renderOfesCollegeOptions();
        });
    },

    subscribe() {
        if (!db) return;
        this._unsub = db.collection('users')
            .onSnapshot(snap => {
                this._allUsers = snap.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => this._extractSortTime(b) - this._extractSortTime(a));
                this._renderTable();

                // Keep stats badge in sync
                const pending = this._allUsers.filter(u => u.status === 'pending').length;
                const badge = document.getElementById('pendingBadge');
                if (badge) {
                    badge.textContent = pending;
                    badge.classList.toggle('hidden', pending === 0);
                }
                document.getElementById('statPending').textContent  = pending;
                document.getElementById('statActive').textContent   =
                    this._allUsers.filter(u => u.status === 'active').length;
            }, err => console.error('[Users] subscribe failed:', err));
    },

    _extractSortTime(user) {
        const ts = user?.createdAt || user?.updatedAt || null;
        if (!ts) return 0;
        if (typeof ts?.toDate === 'function') {
            const dt = ts.toDate();
            return dt instanceof Date ? dt.getTime() : 0;
        }
        if (ts instanceof Date) return ts.getTime();
        if (typeof ts === 'number') return ts;
        const parsed = Date.parse(String(ts));
        return Number.isNaN(parsed) ? 0 : parsed;
    },

    _renderTable() {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        let users = this._allUsers;
        if (this._filter !== 'all') users = users.filter(u => u.status === this._filter);
        if (this._searchQuery) {
            users = users.filter(u =>
                (u.email || '').toLowerCase().includes(this._searchQuery) ||
                (u.displayName || '').toLowerCase().includes(this._searchQuery)
            );
        }

        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-10 text-center text-slate-400">No users found.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => {
            const assignedSystems = Array.isArray(u.assignedSystems) ? u.assignedSystems : [];
            const tsSource = u.createdAt || u.updatedAt || null;
            const ts = tsSource?.toDate ? tsSource.toDate() : (tsSource instanceof Date ? tsSource : null);
            return `
            <tr data-uid="${escAttr(u.id)}">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <img src="${escAttr(u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName||'U')}&background=800000&color=fff&size=64`)}"
                            alt="" class="w-8 h-8 rounded-full object-cover flex-shrink-0">
                        <div>
                            <p class="font-semibold text-slate-900 text-sm leading-tight">${escHtml(u.displayName || '—')}</p>
                            <p class="text-xs text-slate-500">${escHtml(u.email || '—')}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <span class="badge-${escAttr(u.status || 'pending')} text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                        ${escHtml(u.status || 'pending')}
                    </span>
                </td>
                <td class="px-6 py-4 text-xs text-slate-500">
                    ${assignedSystems.length
                        ? assignedSystems.map(s => `<span class="inline-block bg-slate-100 text-slate-700 rounded px-1.5 py-0.5 mr-1">${escHtml(s)}</span>`).join('')
                        : '<span class="text-slate-300">None</span>'
                    }
                </td>
                <td class="px-6 py-4 text-xs text-slate-500">${ts ? ts.toLocaleDateString() : '—'}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2 flex-wrap">
                        ${u.status === 'pending' ? `
                        <button class="approve-btn px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                            data-uid="${escAttr(u.id)}">Approve</button>
                        <button class="reject-btn px-3 py-1.5 bg-red-100 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-200 transition-colors"
                            data-uid="${escAttr(u.id)}">Reject</button>
                        ` : ''}
                        <button class="assign-btn px-3 py-1.5 bg-maroon-100 text-maroon-800 text-xs font-semibold rounded-lg hover:bg-maroon-200 transition-colors"
                            data-uid="${escAttr(u.id)}" data-name="${escAttr(u.displayName||'')}" data-email="${escAttr(u.email||'')}">
                            Manage Access
                        </button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        // Wire dynamic buttons
        tbody.querySelectorAll('.approve-btn').forEach(btn =>
            btn.addEventListener('click', () => this.approveUser(btn.dataset.uid)));
        tbody.querySelectorAll('.reject-btn').forEach(btn =>
            btn.addEventListener('click', () => this._confirmReject(btn.dataset.uid)));
        tbody.querySelectorAll('.assign-btn').forEach(btn =>
            btn.addEventListener('click', () => this.openAssignModal(btn.dataset.uid, btn.dataset.name, btn.dataset.email)));
    },

    async approveUser(uid) {
        if (!db || !uid) return;
        try {
            await db.collection('users').doc(uid).update({ status: 'active' });
            AdminLoggingController.logEvent('admin_approve_user', null, { targetUid: uid });
            AdminToast.show('success', 'User Approved', 'The user has been activated.');
        } catch (err) {
            AdminToast.show('error', 'Error', err.message);
        }
    },

    _confirmReject(uid) {
        ConfirmModal.show(
            'Reject User',
            'This user will be marked as rejected and will not be able to access any system. Continue?',
            () => this.rejectUser(uid)
        );
    },

    async rejectUser(uid) {
        if (!db || !uid) return;
        try {
            await db.collection('users').doc(uid).update({ status: 'rejected' });
            AdminLoggingController.logEvent('admin_reject_user', null, { targetUid: uid });
            AdminToast.show('info', 'User Rejected', 'The user has been rejected.');
        } catch (err) {
            AdminToast.show('error', 'Error', err.message);
        }
    },

    toggleCustomRoleSection(show) {
        const section = document.getElementById('customRoleSection');
        const displayNameEl = document.getElementById('customRoleDisplayName');
        const externalValueEl = document.getElementById('customRoleExternalValue');
        const canonicalEl = document.getElementById('customRoleCanonicalRole');

        if (section) section.classList.toggle('hidden', !show);

        if (!show) {
            if (displayNameEl) displayNameEl.value = '';
            if (externalValueEl) externalValueEl.value = '';
            if (canonicalEl) canonicalEl.value = 'admin';
        }
    },

    normalizeOfesRole(input) {
        const raw = String(input || '').trim();
        const lowered = raw.toLowerCase();
        if (lowered === 'administrator' || lowered === 'admin') return 'Administrator';
        if (lowered === 'campus admin' || lowered === 'campus_admin' || lowered === 'campus-admin') return 'Campus Admin';
        if (lowered === 'dean') return 'Dean';
        return raw;
    },

    resetOfesProvisioningForm() {
        const campusEl = document.getElementById('ofesCampusSelect');
        const collegeEl = document.getElementById('ofesCollegeSelect');
        const sectionEl = document.getElementById('ofesProvisionSection');
        const collegeRow = document.getElementById('ofesCollegeRow');
        const hintEl = document.getElementById('ofesProvisionHint');

        if (campusEl) {
            campusEl.innerHTML = '<option value="">— Select campus —</option>';
            campusEl.value = '';
        }
        if (collegeEl) {
            collegeEl.innerHTML = '<option value="">— Select college —</option>';
            collegeEl.value = '';
        }
        if (sectionEl) sectionEl.classList.add('hidden');
        if (collegeRow) collegeRow.classList.add('hidden');
        if (hintEl) hintEl.textContent = '';
    },

    async loadOfesProvisionOptions() {
        if (this._ofesOptionsCache) return this._ofesOptionsCache;
        if (!auth?.currentUser) throw new Error('No authenticated admin user found.');

        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(getOfesBaseUrl() + '/api/auth/provision.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                mode: 'options',
                idToken
            })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `Unable to load OFES setup options (HTTP ${response.status}).`);
        }

        this._ofesOptionsCache = {
            campuses: Array.isArray(data.campuses) ? data.campuses : [],
            colleges: Array.isArray(data.colleges) ? data.colleges : []
        };

        return this._ofesOptionsCache;
    },

    renderOfesCampusOptions() {
        const campusEl = document.getElementById('ofesCampusSelect');
        if (!campusEl) return;

        const selected = String(campusEl.value || '');
        const options = this._ofesOptionsCache?.campuses || [];

        campusEl.innerHTML = '<option value="">— Select campus —</option>';
        options.forEach(campus => {
            const opt = document.createElement('option');
            opt.value = String(campus.id || '');
            opt.textContent = campus.name || `Campus ${campus.id}`;
            campusEl.appendChild(opt);
        });

        if (selected && options.some(c => String(c.id) === selected)) {
            campusEl.value = selected;
        }
    },

    renderOfesCollegeOptions() {
        const collegeEl = document.getElementById('ofesCollegeSelect');
        const campusEl = document.getElementById('ofesCampusSelect');
        if (!collegeEl || !campusEl) return;

        const selectedCampus = String(campusEl.value || '');
        const selectedCollege = String(collegeEl.value || '');
        const colleges = this._ofesOptionsCache?.colleges || [];

        collegeEl.innerHTML = '<option value="">— Select college —</option>';
        colleges
            .filter(college => {
                const collegeCampus = String(college.campusId ?? '');
                if (selectedCampus === '') return true;
                return collegeCampus === '' || collegeCampus === selectedCampus;
            })
            .forEach(college => {
                const opt = document.createElement('option');
                opt.value = String(college.id || '');
                opt.textContent = college.code
                    ? `${college.code} - ${college.name || ''}`
                    : (college.name || `College ${college.id}`);
                collegeEl.appendChild(opt);
            });

        if (selectedCollege && Array.from(collegeEl.options).some(opt => opt.value === selectedCollege)) {
            collegeEl.value = selectedCollege;
        }
    },

    async refreshOfesProvisioningSection() {
        const sectionEl = document.getElementById('ofesProvisionSection');
        const collegeRow = document.getElementById('ofesCollegeRow');
        const hintEl = document.getElementById('ofesProvisionHint');
        const systemEl = document.getElementById('assignSystemSelect');
        const roleEl = document.getElementById('assignRoleSelect');

        if (!sectionEl || !collegeRow || !hintEl || !systemEl || !roleEl) return;

        const normalizedSystemId = String(systemEl.value || '').toUpperCase();
        const selectedOption = roleEl.selectedOptions?.[0] || null;
        const selectedRoleValue = String(roleEl.value || '');
        const roleCandidate = selectedOption?.dataset?.externalValue
            || selectedOption?.dataset?.displayName
            || selectedOption?.textContent
            || selectedRoleValue;
        const normalizedRole = this.normalizeOfesRole(roleCandidate);

        const requiresCampus = normalizedSystemId === 'OFES' && (normalizedRole === 'Campus Admin' || normalizedRole === 'Dean');
        const requiresCollege = normalizedRole === 'Dean';

        if (!requiresCampus) {
            this.resetOfesProvisioningForm();
            return;
        }

        sectionEl.classList.remove('hidden');
        collegeRow.classList.toggle('hidden', !requiresCollege);
        hintEl.textContent = requiresCollege
            ? 'Dean role requires both campus and college mapping in OFES.'
            : 'Campus Admin role requires campus mapping in OFES.';

        try {
            await this.loadOfesProvisionOptions();
            this.renderOfesCampusOptions();
            this.renderOfesCollegeOptions();
        } catch (err) {
            hintEl.textContent = err.message || 'Unable to load OFES setup options.';
            AdminToast.show('warning', 'OFES Options Unavailable', hintEl.textContent);
        }
    },

    async provisionOfesUser(userData) {
        if (!auth?.currentUser) {
            throw new Error('Cannot provision OFES user: admin session not found.');
        }

        const idToken = await auth.currentUser.getIdToken();
        const response = await fetch(getOfesBaseUrl() + '/api/auth/provision.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                mode: 'provision',
                idToken,
                ...userData
            })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.message || `OFES provisioning failed (HTTP ${response.status}).`);
        }

        return data;
    },

    async loadRolesForSystem(systemId) {
        const normalizedSystemId = String(systemId || '').toUpperCase();
        if (!normalizedSystemId) return [];

        if (this._systemRolesCache[normalizedSystemId]) {
            return this._systemRolesCache[normalizedSystemId];
        }

        const roleSnap = await db.collection('system_roles')
            .where('systemId', '==', normalizedSystemId)
            .get();

        let roles = roleSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (!roles.length) {
            // Seed system role templates on first use.
            const defaults = getDefaultSystemRoleTemplates(normalizedSystemId);
            for (const role of defaults) {
                const docId = `${normalizedSystemId}_${role.roleKey}`;
                await db.collection('system_roles').doc(docId).set({
                    ...role,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    source: 'auto_seed'
                }, { merge: true });
            }
            roles = defaults.map(role => ({ id: `${normalizedSystemId}_${role.roleKey}`, ...role }));
        }

        roles.sort((a, b) => String(a.displayName || '').localeCompare(String(b.displayName || '')));
        this._systemRolesCache[normalizedSystemId] = roles;
        return roles;
    },

    async populateRolesForSystem(systemId) {
        const rolesSel = document.getElementById('assignRoleSelect');
        if (!rolesSel) return;

        rolesSel.innerHTML = '<option value="">— Select role —</option>';
        this.toggleCustomRoleSection(false);

        if (!systemId) return;

        try {
            const roles = await this.loadRolesForSystem(systemId);

            roles.forEach(role => {
                const opt = document.createElement('option');
                opt.value = role.roleKey || role.roleId || '';
                opt.textContent = role.displayName || role.roleKey || role.roleId || 'Role';
                opt.dataset.displayName = role.displayName || role.roleName || opt.textContent;
                opt.dataset.canonicalRole = role.canonicalRole || 'viewer';
                opt.dataset.externalValue = role.externalValue || role.enumValue || opt.value;
                rolesSel.appendChild(opt);
            });

            const customOpt = document.createElement('option');
            customOpt.value = '__custom__';
            customOpt.textContent = 'Add Custom Role...';
            rolesSel.appendChild(customOpt);
        } catch (err) {
            console.error('[Users] Failed loading roles for system:', err);
            AdminToast.show('error', 'Role Load Failed', 'Unable to load roles for selected system.');
        }
    },

    async loadUserAccessList(uid) {
        if (!db || !uid) {
            this._pendingUserAccess = [];
            this._pendingUserSystemIds = new Set();
            this.renderCurrentAccessList();
            return;
        }

        const accessSnap = await db.collection('user_access')
            .where('userId', '==', uid)
            .get();

        const entries = accessSnap.docs
            .map(doc => ({
                _docId: doc.id,
                ...doc.data()
            }))
            .filter(entry => {
                const status = String(entry.status || 'active').trim().toLowerCase();
                return !['revoked', 'inactive', 'disabled'].includes(status);
            });

        entries.sort((a, b) => String(a.systemId || '').localeCompare(String(b.systemId || '')));
        this._pendingUserAccess = entries;
        this._pendingUserSystemIds = new Set(entries.map(e => e.systemId).filter(Boolean));
        this.renderCurrentAccessList();
    },

    renderCurrentAccessList() {
        const container = document.getElementById('currentUserAccessList');
        if (!container) return;

        if (!this._pendingUserAccess.length) {
            container.innerHTML = '<p class="text-xs text-slate-400">No systems assigned yet.</p>';
            return;
        }

        const systemMap = new Map(
            (SystemManagementController._allSystems || []).map(sys => [sys.id, sys.name || sys.id])
        );

        container.innerHTML = this._pendingUserAccess.map(item => {
            const systemId = item.systemId || '';
            const systemLabel = systemMap.get(systemId) || systemId || 'Unknown System';
            const roleLabel = item.systemRoleName || item.roleName || item.systemRoleKey || item.roleId || 'Role';
            const canonical = item.canonicalRole ? String(item.canonicalRole).toUpperCase() : '';

            return `
                <div class="flex items-center justify-between gap-3 p-2 border border-slate-200 rounded-lg bg-slate-50/50">
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-slate-800 truncate">${escHtml(systemLabel)}</p>
                        <p class="text-xs text-slate-500 truncate">
                            ${escHtml(roleLabel)}
                            ${canonical ? `<span class="ml-1 px-1.5 py-0.5 rounded bg-slate-200 text-[10px] text-slate-700">${escHtml(canonical)}</span>` : ''}
                        </p>
                    </div>
                    <button type="button" class="revoke-user-access-btn px-3 py-1.5 text-xs font-semibold border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        data-system-id="${escAttr(systemId)}">
                        Revoke
                    </button>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.revoke-user-access-btn').forEach(btn => {
            btn.addEventListener('click', () => this.revokeSystemAccess(btn.dataset.systemId));
        });
    },

    async revokeSystemAccess(systemId) {
        const uid = this._pendingAssignUid;
        if (!db || !uid || !systemId) return;

        try {
            const matching = await db.collection('user_access')
                .where('userId', '==', uid)
                .where('systemId', '==', systemId)
                .get();

            const batch = db.batch();

            if (matching.empty) {
                const fallbackDocId = `${uid}_${systemId}`;
                const fallbackRef = db.collection('user_access').doc(fallbackDocId);
                batch.set(fallbackRef, {
                    userId: uid,
                    systemId,
                    status: 'revoked',
                    revokedAt: serverTimestamp(),
                    revokedBy: auth?.currentUser?.uid || null,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            } else {
                matching.docs.forEach(doc => {
                    batch.set(doc.ref, {
                        status: 'revoked',
                        revokedAt: serverTimestamp(),
                        revokedBy: auth?.currentUser?.uid || null,
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                });
            }

            await batch.commit();

            await db.collection('users').doc(uid).update({
                assignedSystems: firebase.firestore.FieldValue.arrayRemove(systemId)
            });

            await this.loadUserAccessList(uid);

            AdminLoggingController.logEvent('admin_revoke_role', systemId, {
                targetUid: uid
            });
            AdminToast.show('info', 'Access Revoked', `Removed ${systemId} access from this user.`);
        } catch (err) {
            AdminToast.show('error', 'Revoke Failed', err.message || 'Unable to revoke system access.');
        }
    },

    resetAssignForm() {
        const systemEl = document.getElementById('assignSystemSelect');
        const roleEl = document.getElementById('assignRoleSelect');
        if (systemEl) systemEl.value = '';
        if (roleEl) roleEl.innerHTML = '<option value="">— Select role —</option>';
        this.toggleCustomRoleSection(false);
        this.resetOfesProvisioningForm();
    },

    async openAssignModal(uid, name, email) {
        this._pendingAssignUid = uid;
        document.getElementById('assignModalUserName').textContent = name || '—';
        document.getElementById('assignModalUserEmail').textContent = email || '—';

        await this.loadUserAccessList(uid);
        const assignedSet = this._pendingUserSystemIds;

        // Populate systems dropdown
        const sel = document.getElementById('assignSystemSelect');
        sel.innerHTML = '<option value="">— Select system —</option>';
        SystemManagementController._allSystems.forEach(sys => {
            const opt = document.createElement('option');
            opt.value = sys.id;
            const base = sys.name || sys.id;
            opt.textContent = assignedSet.has(sys.id) ? `${base} (Assigned)` : base;
            sel.appendChild(opt);
        });

        this.resetAssignForm();

        openModal('assignAccessModal');
    },

    async _confirmAssignAccess() {
        const uid = this._pendingAssignUid;
        const systemId = document.getElementById('assignSystemSelect').value;
        const roleSelectEl = document.getElementById('assignRoleSelect');
        const selectedRoleValue = roleSelectEl?.value || '';
        const normalizedSystemId = String(systemId || '').toUpperCase();

        if (!uid || !systemId || !selectedRoleValue) {
            AdminToast.show('warning', 'Incomplete', 'Please select both a system and a role.');
            return;
        }

        let roleKey = selectedRoleValue;
        let roleName = selectedRoleValue;
        let canonicalRole = 'viewer';
        let externalRoleValue = selectedRoleValue;
        let ofesCampusId = null;
        let ofesCollegeId = null;
        let ofesProvisioning = null;
        const alreadyAssigned = this._pendingUserSystemIds.has(systemId);

        try {
            if (selectedRoleValue === '__custom__') {
                const displayName = (document.getElementById('customRoleDisplayName')?.value || '').trim();
                const externalValue = (document.getElementById('customRoleExternalValue')?.value || '').trim();
                const canonicalValue = (document.getElementById('customRoleCanonicalRole')?.value || 'viewer').trim().toLowerCase();

                if (!displayName || !externalValue) {
                    AdminToast.show('warning', 'Incomplete', 'Custom roles require display name and external/enum value.');
                    return;
                }

                roleKey = sanitizeRoleKey(`${normalizedSystemId}_${displayName}_${externalValue}`);
                roleName = displayName;
                canonicalRole = canonicalValue || 'viewer';
                externalRoleValue = externalValue;

                if (!roleKey) {
                    AdminToast.show('warning', 'Invalid Role', 'Unable to generate a valid role key from the provided values.');
                    return;
                }

                // Persist custom role for this system for future assignments.
                const customRoleDocId = `${normalizedSystemId}_${roleKey}`;
                await db.collection('system_roles').doc(customRoleDocId).set({
                    systemId: normalizedSystemId,
                    roleKey,
                    displayName: roleName,
                    externalValue: externalRoleValue,
                    canonicalRole,
                    source: 'custom_admin',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }, { merge: true });

                // Invalidate cache so next modal open includes the newly added role.
                delete this._systemRolesCache[normalizedSystemId];
            } else {
                const selectedOption = roleSelectEl?.selectedOptions?.[0];
                roleName = selectedOption?.dataset?.displayName || selectedOption?.textContent || roleKey;
                canonicalRole = (selectedOption?.dataset?.canonicalRole || 'viewer').toLowerCase();
                externalRoleValue = selectedOption?.dataset?.externalValue || roleKey;
            }

            if (normalizedSystemId === 'OFES') {
                const ofesRole = this.normalizeOfesRole(externalRoleValue || roleName || roleKey);
                const needsCampus = ofesRole === 'Campus Admin' || ofesRole === 'Dean';
                const needsCollege = ofesRole === 'Dean';

                const campusValue = String(document.getElementById('ofesCampusSelect')?.value || '').trim();
                const collegeValue = String(document.getElementById('ofesCollegeSelect')?.value || '').trim();

                if (needsCampus && !campusValue) {
                    AdminToast.show('warning', 'Incomplete', 'OFES Campus Admin/Dean assignment requires campus selection.');
                    return;
                }
                if (needsCollege && !collegeValue) {
                    AdminToast.show('warning', 'Incomplete', 'OFES Dean assignment requires both campus and college.');
                    return;
                }

                ofesCampusId = campusValue ? Number.parseInt(campusValue, 10) : null;
                ofesCollegeId = collegeValue ? Number.parseInt(collegeValue, 10) : null;

                const targetUser = this._allUsers.find(u => u.id === uid) || {};
                const targetEmail = String(targetUser.email || document.getElementById('assignModalUserEmail')?.textContent || '').trim().toLowerCase();
                const targetName = String(targetUser.displayName || document.getElementById('assignModalUserName')?.textContent || '').trim();

                if (!targetEmail) {
                    AdminToast.show('error', 'Provisioning Failed', 'Missing target user email for OFES provisioning.');
                    return;
                }

                ofesProvisioning = await this.provisionOfesUser({
                    email: targetEmail,
                    fullname: targetName,
                    role: ofesRole,
                    campusId: ofesCampusId,
                    collegeId: ofesCollegeId
                });
            }

            const accessPayload = {
                userId: uid,
                systemId,

                // Backward-compatible fields
                roleId: roleKey,
                roleName,

                // New per-system role schema
                systemRoleKey: roleKey,
                systemRoleName: roleName,
                canonicalRole,
                externalRoleValue,
                status: 'active',

                grantedAt: serverTimestamp(),
                grantedBy: auth?.currentUser?.uid || null,
                updatedAt: serverTimestamp()
            };

            if (normalizedSystemId === 'OFES') {
                accessPayload.ofesCampusId = ofesCampusId;
                accessPayload.ofesCollegeId = ofesCollegeId;
                accessPayload.ofesProvisionStatus = ofesProvisioning?.status || 'ok';
                accessPayload.ofesProvisionedAt = serverTimestamp();
            }

            // Upsert user_access doc (one per user+system combination).
            const docId = `${uid}_${systemId}`;
            await db.collection('user_access').doc(docId).set(accessPayload, { merge: true });

            // Add systemId to user.assignedSystems array and activate user.
            await db.collection('users').doc(uid).update({
                assignedSystems: firebase.firestore.FieldValue.arrayUnion(systemId),
                status: 'active'
            });

            AdminLoggingController.logEvent('admin_assign_role', systemId, {
                targetUid: uid,
                roleKey,
                roleName,
                canonicalRole,
                externalRoleValue,
                ofesProvisioned: normalizedSystemId === 'OFES',
                ofesProvisionStatus: ofesProvisioning?.status || null
            });

            await this.loadUserAccessList(uid);
            this.resetAssignForm();
            document.getElementById('assignSystemSelect')?.focus();

            AdminToast.show(
                'success',
                alreadyAssigned ? 'Access Updated' : 'Access Added',
                alreadyAssigned
                    ? `${systemId} role updated to ${roleName}.`
                    : `${systemId} access as ${roleName} has been added.`
            );
        } catch (err) {
            AdminToast.show('error', 'Error', err.message);
        }
    },

    destroy() { this._unsub?.(); }
};

// ---------------------------------------------------------------------------
// System Management Controller
// ---------------------------------------------------------------------------
const SystemManagementController = {
    _unsub: null,
    _allSystems: [],
    _pendingDeleteId: null,

    init() {
        document.getElementById('addSystemBtn')?.addEventListener('click', () => {
            this.openSystemForm(null);
        });
        document.getElementById('systemFormSubmitBtn')?.addEventListener('click', () => {
            this.submitSystemForm();
        });

        document.getElementById('addSystemRoleRowBtn')?.addEventListener('click', () => {
            this.addRoleRow();
        });

        document.getElementById('systemRoleRows')?.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-system-role-btn');
            if (!removeBtn) return;

            const rows = document.querySelectorAll('#systemRoleRows .system-role-row');
            if (rows.length <= 1) {
                AdminToast.show('warning', 'Validation', 'At least one role is required.');
                return;
            }

            removeBtn.closest('.system-role-row')?.remove();
        });
    },

    subscribe() {
        if (!db) return;
        this._unsub = db.collection('systems')
            .orderBy('name')
            .onSnapshot(snap => {
                this._allSystems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                this._renderTable();
                document.getElementById('statSystems').textContent = this._allSystems.length;
            }, err => console.error('[Systems] subscribe failed:', err));
    },

    _renderTable() {
        const tbody = document.getElementById('systemsTableBody');
        if (!tbody) return;

        if (!this._allSystems.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-10 text-center text-slate-400">No systems registered. Click "Add System" to get started.</td></tr>`;
            return;
        }

        tbody.innerHTML = this._allSystems.map(sys => `
            <tr data-system-id="${escAttr(sys.id)}">
                <td class="px-6 py-4">
                    <p class="font-semibold text-slate-900 text-sm">${escHtml(sys.name || sys.id)}</p>
                    ${sys.fullName ? `<p class="text-xs text-slate-400">${escHtml(sys.fullName)}</p>` : ''}
                </td>
                <td class="px-6 py-4 text-sm text-slate-500 max-w-xs">
                    <p class="line-clamp-2">${escHtml(sys.description || '—')}</p>
                </td>
                <td class="px-6 py-4">
                    <span class="badge-${sys.status === 'active' ? 'active' : 'inactive'} text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                        ${escHtml(sys.status || 'inactive')}
                    </span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                        <button class="edit-system-btn px-3 py-1.5 border border-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            data-id="${escAttr(sys.id)}">
                            <i class="fas fa-pencil mr-1"></i>Edit
                        </button>
                        <button class="toggle-status-btn px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors ${sys.status === 'active' ? 'text-amber-600' : 'text-emerald-600'}"
                            data-id="${escAttr(sys.id)}" data-current="${escAttr(sys.status || 'inactive')}">
                            ${sys.status === 'active' ? '<i class="fas fa-eye-slash mr-1"></i>Deactivate' : '<i class="fas fa-eye mr-1"></i>Activate'}
                        </button>
                        <button class="delete-system-btn px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
                            data-id="${escAttr(sys.id)}" data-name="${escAttr(sys.name || sys.id)}">
                            <i class="fas fa-trash-can mr-1"></i>Delete
                        </button>
                    </div>
                </td>
            </tr>`
        ).join('');

        tbody.querySelectorAll('.edit-system-btn').forEach(btn =>
            btn.addEventListener('click', () => this.openSystemForm(btn.dataset.id)));
        tbody.querySelectorAll('.toggle-status-btn').forEach(btn =>
            btn.addEventListener('click', () => this.toggleStatus(btn.dataset.id, btn.dataset.current)));
        tbody.querySelectorAll('.delete-system-btn').forEach(btn =>
            btn.addEventListener('click', () => this._confirmDelete(btn.dataset.id, btn.dataset.name)));
    },

    _getFallbackRoleTemplates() {
        return [
            { roleKey: 'ADMIN', displayName: 'Admin', externalValue: 'admin', canonicalRole: 'admin' },
            { roleKey: 'STAFF', displayName: 'Staff', externalValue: 'staff', canonicalRole: 'staff' },
            { roleKey: 'VIEWER', displayName: 'Viewer', externalValue: 'viewer', canonicalRole: 'viewer' }
        ];
    },

    addRoleRow(role = {}) {
        const container = document.getElementById('systemRoleRows');
        if (!container) return;

        const displayName = String(role.displayName || '').trim();
        const externalValue = String(role.externalValue || '').trim();
        const existingRoleKey = String(role.roleKey || '').trim();
        const canonicalRole = String(role.canonicalRole || 'staff').toLowerCase();

        const row = document.createElement('div');
        row.className = 'system-role-row p-3 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-end';
        row.innerHTML = `
            <input type="hidden" class="system-role-key" value="${escAttr(existingRoleKey)}">
            <div class="col-span-5">
                <label class="block text-[11px] font-medium text-slate-600 mb-1">Role Name</label>
                <input type="text" class="system-role-display w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-maroon-800/30"
                    placeholder="Dean" value="${escAttr(displayName)}">
            </div>
            <div class="col-span-4">
                <label class="block text-[11px] font-medium text-slate-600 mb-1">External Value</label>
                <input type="text" class="system-role-external w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-maroon-800/30"
                    placeholder="Dean" value="${escAttr(externalValue)}">
            </div>
            <div class="col-span-2">
                <label class="block text-[11px] font-medium text-slate-600 mb-1">Type</label>
                <select class="system-role-canonical w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-maroon-800/30">
                    <option value="admin" ${canonicalRole === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="staff" ${canonicalRole === 'staff' ? 'selected' : ''}>Staff</option>
                    <option value="viewer" ${canonicalRole === 'viewer' ? 'selected' : ''}>Viewer</option>
                </select>
            </div>
            <div class="col-span-1 flex justify-end">
                <button type="button" class="remove-system-role-btn w-8 h-8 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors" title="Remove role">
                    <i class="fas fa-trash text-xs"></i>
                </button>
            </div>
        `;

        container.appendChild(row);
    },

    setRoleRows(roles = []) {
        const container = document.getElementById('systemRoleRows');
        if (!container) return;
        container.innerHTML = '';

        const list = Array.isArray(roles) && roles.length ? roles : this._getFallbackRoleTemplates();
        list.forEach(role => this.addRoleRow(role));
    },

    async _loadSystemRoleRows(systemId) {
        if (!db || !systemId) {
            this.setRoleRows(getDefaultSystemRoleTemplates(systemId));
            return;
        }

        try {
            const snap = await db.collection('system_roles').where('systemId', '==', systemId).get();
            const roles = snap.docs
                .map(doc => doc.data() || {})
                .filter(role => role.displayName || role.externalValue)
                .sort((a, b) => String(a.displayName || '').localeCompare(String(b.displayName || '')));

            if (roles.length) {
                this.setRoleRows(roles);
                return;
            }
        } catch (err) {
            console.warn('[Systems] role template load failed:', err);
        }

        this.setRoleRows(getDefaultSystemRoleTemplates(systemId));
    },

    _collectRoleRows(systemId) {
        const rows = Array.from(document.querySelectorAll('#systemRoleRows .system-role-row'));
        const roles = [];
        const usedKeys = new Set();
        let hasPartial = false;

        rows.forEach((row, index) => {
            const displayInput = row.querySelector('.system-role-display');
            const externalInput = row.querySelector('.system-role-external');
            const canonicalSelect = row.querySelector('.system-role-canonical');
            const roleKeyInput = row.querySelector('.system-role-key');

            const displayName = String(displayInput?.value || '').trim();
            const externalValue = String(externalInput?.value || '').trim();
            const canonicalRole = String(canonicalSelect?.value || 'staff').toLowerCase();

            displayInput?.classList.remove('border-red-300');
            externalInput?.classList.remove('border-red-300');

            if (!displayName && !externalValue) return;
            if (!displayName || !externalValue) {
                hasPartial = true;
                if (!displayName) displayInput?.classList.add('border-red-300');
                if (!externalValue) externalInput?.classList.add('border-red-300');
                return;
            }

            const explicitKey = sanitizeRoleKey(String(roleKeyInput?.value || ''));
            const baseKey = explicitKey || sanitizeRoleKey(`${displayName}_${externalValue}`) || `ROLE_${index + 1}`;
            let roleKey = baseKey;
            let dedupe = 2;
            while (usedKeys.has(roleKey)) {
                roleKey = sanitizeRoleKey(`${baseKey}_${dedupe}`) || `${baseKey}_${dedupe}`;
                dedupe += 1;
            }
            usedKeys.add(roleKey);
            if (roleKeyInput) roleKeyInput.value = roleKey;

            roles.push({
                systemId,
                roleKey,
                displayName,
                externalValue,
                canonicalRole: ['admin', 'staff', 'viewer'].includes(canonicalRole) ? canonicalRole : 'staff'
            });
        });

        return { roles, hasPartial };
    },

    async openSystemForm(systemId) {
        const isEdit = !!systemId;
        document.getElementById('systemFormModalTitle').textContent = isEdit ? 'Edit System' : 'Add System';
        document.getElementById('systemFormId').value = systemId || '';

        if (isEdit) {
            const sys = this._allSystems.find(s => s.id === systemId);
            if (sys) {
                document.getElementById('systemFormName').value     = sys.name || '';
                document.getElementById('systemFormFullName').value = sys.fullName || '';
                document.getElementById('systemFormDesc').value     = sys.description || '';
                document.getElementById('systemFormUrl').value      = sys.authUrl || '';
                document.querySelector(`input[name="systemStatus"][value="${sys.status || 'active'}"]`).checked = true;
            }
        } else {
            document.getElementById('systemForm').reset();
        }

        // Lock name field when editing (it's the doc ID used as identifier)
        document.getElementById('systemFormName').readOnly = isEdit;

        if (isEdit) {
            await this._loadSystemRoleRows(systemId);
        } else {
            this.setRoleRows(this._getFallbackRoleTemplates());
        }

        openModal('systemFormModal');
    },

    async submitSystemForm() {
        const id     = document.getElementById('systemFormId').value.trim();
        const name   = document.getElementById('systemFormName').value.trim().toUpperCase();
        const status = document.querySelector('input[name="systemStatus"]:checked')?.value || 'active';
        const data   = {
            name,
            fullName:    document.getElementById('systemFormFullName').value.trim(),
            description: document.getElementById('systemFormDesc').value.trim(),
            authUrl:     document.getElementById('systemFormUrl').value.trim(),
            status,
            updatedAt:   serverTimestamp()
        };

        if (!name) { AdminToast.show('warning', 'Validation', 'System ID is required.'); return; }

        const targetSystemId = id || name;
        const { roles, hasPartial } = this._collectRoleRows(targetSystemId);
        if (hasPartial) {
            AdminToast.show('warning', 'Validation', 'Each role row must have both Role Name and External Value.');
            return;
        }
        if (!roles.length) {
            AdminToast.show('warning', 'Validation', 'Add at least one role before saving the system.');
            return;
        }

        try {
            if (id) {
                // Edit existing doc
                await db.collection('systems').doc(id).update(data);
                for (const role of roles) {
                    const roleDocId = `${id}_${role.roleKey}`;
                    await db.collection('system_roles').doc(roleDocId).set({
                        ...role,
                        systemId: id,
                        source: 'admin_form',
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                }
                delete UserManagementController._systemRolesCache[String(id || '').toUpperCase()];

                AdminLoggingController.logEvent('admin_system_update', id, {
                    status,
                    rolesConfigured: roles.length
                });
                AdminToast.show('success', 'System Updated', `${name} has been updated.`);
            } else {
                // Create new doc using name as ID for easy reference
                data.createdAt = serverTimestamp();
                await db.collection('systems').doc(name).set(data);

                for (const role of roles) {
                    const roleDocId = `${name}_${role.roleKey}`;
                    await db.collection('system_roles').doc(roleDocId).set({
                        ...role,
                        systemId: name,
                        source: 'admin_form',
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                }
                delete UserManagementController._systemRolesCache[String(name || '').toUpperCase()];

                AdminLoggingController.logEvent('admin_system_create', name, {
                    status,
                    rolesConfigured: roles.length
                });
                AdminToast.show('success', 'System Added', `${name} has been registered.`);
            }
            closeModal('systemFormModal');
        } catch (err) {
            AdminToast.show('error', 'Error', err.message);
        }
    },

    async toggleStatus(id, current) {
        if (!db || !id) return;
        const newStatus = current === 'active' ? 'inactive' : 'active';
        try {
            await db.collection('systems').doc(id).update({ status: newStatus });
            AdminLoggingController.logEvent('admin_system_status_change', id, { from: current, to: newStatus });
            AdminToast.show('success', 'Status Updated', `System is now ${newStatus}.`);
        } catch (err) {
            AdminToast.show('error', 'Error', err.message);
        }
    },

    _confirmDelete(id, name) {
        ConfirmModal.show(
            'Delete System',
            `Delete "${name}"? All user_access records for this system will remain but the system will no longer appear in the portal.`,
            () => this.deleteSystem(id, name)
        );
    },

    async deleteSystem(id, name) {
        if (!db || !id) return;
        try {
            await db.collection('systems').doc(id).delete();
            AdminLoggingController.logEvent('admin_system_delete', id, { name });
            AdminToast.show('info', 'System Deleted', `${name} has been removed.`);
        } catch (err) {
            AdminToast.show('error', 'Error', err.message);
        }
    },

    destroy() { this._unsub?.(); }
};

// ---------------------------------------------------------------------------
// Confirm Modal
// ---------------------------------------------------------------------------
const ConfirmModal = {
    _callback: null,
    show(title, message, onConfirm) {
        document.getElementById('confirmModalTitle').textContent   = title;
        document.getElementById('confirmModalMessage').textContent = message;
        this._callback = onConfirm;
        openModal('confirmModal');
    },
    init() {
        document.getElementById('confirmModalOkBtn')?.addEventListener('click', () => {
            closeModal('confirmModal');
            this._callback?.();
            this._callback = null;
        });
    }
};

// ---------------------------------------------------------------------------
// Logs Controller
// ---------------------------------------------------------------------------
const LogsController = {
    _pageSize: 20,
    _cursors: [null],   // stack of start-after cursors; cursors[0] = first page
    _pageIndex: 0,

    init() {
        document.getElementById('logSystemFilter')?.addEventListener('change', () => {
            this._resetPagination(); this._load();
        });
        document.getElementById('logActionFilter')?.addEventListener('change', () => {
            this._resetPagination(); this._load();
        });
        document.getElementById('logsRefreshBtn')?.addEventListener('click', () => {
            this._resetPagination(); this._load();
        });
        document.getElementById('logsPrevBtn')?.addEventListener('click', () => this._prevPage());
        document.getElementById('logsNextBtn')?.addEventListener('click', () => this._nextPage());

        // Populate systems filter from Firestore
        if (db) {
            db.collection('systems').get().then(snap => {
                const sel = document.getElementById('logSystemFilter');
                snap.docs.forEach(doc => {
                    const opt = document.createElement('option');
                    opt.value = doc.id;
                    opt.textContent = doc.data().name || doc.id;
                    sel?.appendChild(opt);
                });
            });
        }

        this._load();
    },

    _buildQuery() {
        let q = db.collection('logs').orderBy('timestamp', 'desc');
        const sys    = document.getElementById('logSystemFilter')?.value;
        const action = document.getElementById('logActionFilter')?.value;
        if (sys)    q = q.where('systemId', '==', sys);
        if (action) q = q.where('action', '==', action);
        return q;
    },

    async _load() {
        if (!db) return;
        const tbody = document.getElementById('logsTableBody');
        tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">Loading…</td></tr>`;

        try {
            let q = this._buildQuery().limit(this._pageSize);
            const cursor = this._cursors[this._pageIndex];
            if (cursor) q = q.startAfter(cursor);

            const snap = await q.get();

            document.getElementById('logsPageInfo').textContent =
                `Page ${this._pageIndex + 1}`;
            document.getElementById('logsPrevBtn').disabled = this._pageIndex === 0;
            document.getElementById('logsNextBtn').disabled = snap.size < this._pageSize;

            if (snap.empty) {
                tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">No logs found.</td></tr>`;
                return;
            }

            // Store next-page cursor
            this._cursors[this._pageIndex + 1] = snap.docs[snap.docs.length - 1];

            tbody.innerHTML = snap.docs.map(doc => {
                const d  = doc.data();
                const ts = d.timestamp?.toDate ? d.timestamp.toDate() : null;
                const meta = d.metadata && Object.keys(d.metadata).length
                    ? JSON.stringify(d.metadata)
                    : '—';
                return `
                <tr>
                    <td class="px-6 py-3.5 text-xs text-slate-500 whitespace-nowrap">${ts ? ts.toLocaleString() : '—'}</td>
                    <td class="px-6 py-3.5 text-sm">
                        <p class="font-medium text-slate-800 text-xs truncate max-w-[200px]">${escHtml(d.email || d.userId || '—')}</p>
                    </td>
                    <td class="px-6 py-3.5">
                        <span class="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                            ${actionIcon(d.action)} ${escHtml(formatAction(d.action))}
                        </span>
                    </td>
                    <td class="px-6 py-3.5 text-xs text-slate-500">${escHtml(d.systemId || '—')}</td>
                    <td class="px-6 py-3.5 text-xs text-slate-400 max-w-[200px] truncate" title="${escAttr(meta)}">${escHtml(meta)}</td>
                </tr>`;
            }).join('');
        } catch (err) {
            console.error('[Logs] load failed:', err);
            tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-red-400">Failed to load logs: ${escHtml(err.message)}</td></tr>`;
        }
    },

    _resetPagination() {
        this._pageIndex = 0;
        this._cursors   = [null];
    },

    _nextPage() {
        if (this._cursors[this._pageIndex + 1]) {
            this._pageIndex++;
            this._load();
        }
    },

    _prevPage() {
        if (this._pageIndex > 0) {
            this._pageIndex--;
            this._load();
        }
    }
};

// ---------------------------------------------------------------------------
// Utility helpers
// ---------------------------------------------------------------------------
function escHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

function escAttr(str) {
    return String(str ?? '').replace(/"/g, '&quot;');
}

function formatAction(action) {
    const map = {
        login:                       'Login',
        logout:                      'Logout',
        system_access:               'Opened System',
        access_denied:               'Access Denied',
        admin_assign_role:           'Assigned Role',
        admin_revoke_role:           'Revoked Role',
        admin_system_status_change:  'Changed System Status',
        admin_system_create:         'Created System',
        admin_system_update:         'Updated System',
        admin_system_delete:         'Deleted System',
        admin_approve_user:          'Approved User',
        admin_reject_user:           'Rejected User'
    };
    return map[action] || action;
}

function actionIcon(action) {
    const icons = {
        login:                       'fa-right-to-bracket text-emerald-500',
        logout:                      'fa-right-from-bracket text-slate-400',
        system_access:               'fa-external-link text-blue-500',
        access_denied:               'fa-ban text-red-400',
        admin_assign_role:           'fa-user-check text-maroon-700',
        admin_revoke_role:           'fa-user-minus text-red-500',
        admin_system_status_change:  'fa-toggle-on text-amber-500',
        admin_system_create:         'fa-plus text-emerald-500',
        admin_system_update:         'fa-pencil text-blue-400',
        admin_system_delete:         'fa-trash text-red-400',
        admin_approve_user:          'fa-check text-emerald-500',
        admin_reject_user:           'fa-times text-red-500'
    };
    const cls = icons[action] || 'fa-circle-dot text-slate-400';
    return `<i class="fas ${cls} text-xs"></i>`;
}

function formatRelativeTime(date) {
    const diffMs = Date.now() - date.getTime();
    const secs   = Math.floor(diffMs / 1000);
    if (secs < 60)   return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60)   return `${mins}m ago`;
    const hrs  = Math.floor(mins / 60);
    if (hrs  < 24)   return `${hrs}h ago`;
    return date.toLocaleDateString();
}

// ---------------------------------------------------------------------------
// Admin Auth Guard
// ---------------------------------------------------------------------------
const AdminAuthGuard = {
    init() {
        if (!auth) {
            // Firebase not available — redirect immediately
            window.location.href = '../';
            return;
        }

        auth.onAuthStateChanged(async user => {
            if (!user || !user.email?.toLowerCase().endsWith('@csu.edu.ph')) {
                window.location.href = '../';
                return;
            }

            try {
                const snap = await db.collection('users').doc(user.uid).get();
                if (!snap.exists || snap.data()?.role !== 'mis_admin') {
                    window.location.href = '../';
                    return;
                }

                // Authenticated as MIS admin — show the portal
                document.getElementById('authGuard')?.remove();

                // Populate header
                const displayName = user.displayName || user.email;
                document.getElementById('adminName').textContent  = displayName;
                document.getElementById('adminEmail').textContent = user.email;
                const avatar = document.getElementById('adminAvatar');
                if (avatar) {
                    avatar.src = user.photoURL ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=800000&color=fff&size=64`;
                }

                // Init everything now that we know the user is an admin
                initAdminApp();
            } catch (err) {
                console.error('[AdminAuth] Firestore check failed:', err);
                window.location.href = '../';
            }
        });
    }
};

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
function initAdminApp() {
    TabController.init();
    ConfirmModal.init();
    initModalCloseButtons();

    DashboardController.loadStats();
    DashboardController.subscribeRecentActivity();

    UserManagementController.init();
    UserManagementController.subscribe();

    SystemManagementController.init();
    SystemManagementController.subscribe();

    LogsController.init();

    // Logout button
    document.getElementById('adminLogoutBtn')?.addEventListener('click', async () => {
        if (!auth) return;
        await AdminLoggingController.logEvent('logout');
        auth.signOut().then(() => { window.location.href = '../'; });
    });

    // Toast close button
    document.getElementById('closeAdminToast')?.addEventListener('click', () => {
        document.getElementById('adminToast')?.classList.add('hidden');
    });
}

// Run auth guard immediately
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdminAuthGuard.init());
} else {
    AdminAuthGuard.init();
}
