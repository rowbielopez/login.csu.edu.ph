<!DOCTYPE html>
<html lang="en" class="scroll-smooth">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="MyCSU Admin Portal — MIS system management">
    <meta name="robots" content="noindex, nofollow">
    <meta name="theme-color" content="#800000">
    <title>Admin Portal — MyCSU</title>
    <link rel="icon" type="image/x-icon" href="../public/favicon.ico">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Shared Styles -->
    <link rel="stylesheet" href="../styles.css">

    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

    <!-- Firebase SDK (compat) -->
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>

    <!-- Tailwind Config (matches main portal) -->
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        maroon: {
                            50: '#fdf2f2', 100: '#fce4e4', 200: '#fbcdcd', 300: '#f7a8a8',
                            400: '#f07575', 500: '#e54545', 600: '#c92a2a', 700: '#a31f1f',
                            800: '#800000', 900: '#6b1c1c', 950: '#3a0c0c'
                        },
                        gold: {
                            50: '#fffef7', 100: '#fffce8', 200: '#fff8c5', 300: '#fff099',
                            400: '#ffe566', 500: '#FFDF00', 600: '#e6c900', 700: '#b89c00',
                            800: '#967d00', 900: '#7a6600', 950: '#453a00'
                        },
                        slate: { 850: '#172033' }
                    },
                    fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
                    boxShadow: {
                        'glass': '0 8px 32px rgba(0,0,0,0.08)',
                        'glass-lg': '0 16px 48px rgba(0,0,0,0.12)',
                        'card': '0 2px 8px rgba(0,0,0,0.06)',
                        'card-hover': '0 8px 24px rgba(0,0,0,0.12)'
                    }
                }
            }
        };
    </script>

    <style>
        /* Auth guard overlay */
        #authGuard {
            position: fixed; inset: 0; z-index: 9999;
            background: linear-gradient(135deg, #800000 0%, #3a0c0c 100%);
            display: flex; align-items: center; justify-content: center;
        }
        /* Tab active indicator */
        .tab-btn.active { border-bottom: 3px solid #800000; color: #800000; font-weight: 600; }
        .tab-btn { border-bottom: 3px solid transparent; }
        /* Table row hover */
        tbody tr:hover { background: #fdf2f2; }
        /* Status badges */
        .badge-active   { background:#d1fae5; color:#065f46; }
        .badge-inactive { background:#f1f5f9; color:#475569; }
        .badge-pending  { background:#fef3c7; color:#92400e; }
        .badge-rejected { background:#fee2e2; color:#991b1b; }
    </style>
</head>

<body class="bg-slate-50 text-slate-800 font-sans antialiased">

<!-- ======================================================================
     AUTH GUARD — replaced by admin/app.js after auth check
     ====================================================================== -->
<div id="authGuard">
    <div class="text-center text-white">
        <div class="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <i class="fas fa-shield-halved text-3xl"></i>
        </div>
        <p class="text-lg font-semibold">Verifying access…</p>
        <p class="text-white/60 text-sm mt-1">Please wait</p>
    </div>
</div>

<!-- ======================================================================
     TOP NAVBAR
     ====================================================================== -->
<header class="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">

            <!-- Logo + Title -->
            <div class="flex items-center gap-3">
                <a href="../" class="flex items-center gap-2 text-slate-400 hover:text-maroon-800 text-sm transition-colors">
                    <i class="fas fa-chevron-left"></i> Portal
                </a>
                <span class="text-slate-300">|</span>
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-maroon-800 rounded-lg flex items-center justify-center">
                        <i class="fas fa-shield-halved text-white text-sm"></i>
                    </div>
                    <span class="font-bold text-slate-900">Admin Portal</span>
                    <span class="text-xs bg-maroon-100 text-maroon-800 font-semibold px-2 py-0.5 rounded-full">MIS</span>
                </div>
            </div>

            <!-- Admin user info + logout -->
            <div class="flex items-center gap-4">
                <div class="hidden sm:flex items-center gap-2">
                    <img id="adminAvatar" src="" alt="Admin" class="w-8 h-8 rounded-full object-cover bg-slate-200">
                    <div class="text-right">
                        <p class="text-sm font-semibold text-slate-800 leading-none" id="adminName">—</p>
                        <p class="text-xs text-slate-500 mt-0.5" id="adminEmail">—</p>
                    </div>
                </div>
                <button id="adminLogoutBtn"
                    class="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <i class="fas fa-arrow-right-from-bracket"></i>
                    <span class="hidden sm:inline">Sign Out</span>
                </button>
            </div>
        </div>
    </div>
</header>

<!-- ======================================================================
     TAB NAVIGATION
     ====================================================================== -->
<div class="bg-white border-b border-slate-200 sticky top-16 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="flex gap-1 overflow-x-auto scrollbar-hide" role="tablist">
            <button class="tab-btn active flex items-center gap-2 px-5 py-4 text-sm whitespace-nowrap transition-colors"
                data-tab="dashboard" role="tab" aria-selected="true">
                <i class="fas fa-chart-bar"></i> Dashboard
            </button>
            <button class="tab-btn flex items-center gap-2 px-5 py-4 text-sm whitespace-nowrap text-slate-500 hover:text-slate-700 transition-colors"
                data-tab="users" role="tab" aria-selected="false">
                <i class="fas fa-users"></i> Users
                <span id="pendingBadge" class="hidden bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">0</span>
            </button>
            <button class="tab-btn flex items-center gap-2 px-5 py-4 text-sm whitespace-nowrap text-slate-500 hover:text-slate-700 transition-colors"
                data-tab="systems" role="tab" aria-selected="false">
                <i class="fas fa-cubes"></i> Systems
            </button>
            <button class="tab-btn flex items-center gap-2 px-5 py-4 text-sm whitespace-nowrap text-slate-500 hover:text-slate-700 transition-colors"
                data-tab="logs" role="tab" aria-selected="false">
                <i class="fas fa-list-check"></i> Activity Logs
            </button>
        </nav>
    </div>
</div>

<!-- ======================================================================
     MAIN CONTENT
     ====================================================================== -->
<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

    <!-- ----------------------------------------------------------------
         DASHBOARD TAB
         ---------------------------------------------------------------- -->
    <section id="tab-dashboard" data-tab-content="dashboard">

        <!-- Stats cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <div class="bg-white rounded-2xl border border-slate-200 shadow-card p-6 flex items-center gap-4">
                <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-user-clock text-amber-600 text-xl"></i>
                </div>
                <div>
                    <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold">Pending</p>
                    <p class="text-3xl font-bold text-slate-900 mt-0.5" id="statPending">—</p>
                </div>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 shadow-card p-6 flex items-center gap-4">
                <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-users-check text-emerald-600 text-xl"></i>
                </div>
                <div>
                    <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold">Active Users</p>
                    <p class="text-3xl font-bold text-slate-900 mt-0.5" id="statActive">—</p>
                </div>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 shadow-card p-6 flex items-center gap-4">
                <div class="w-12 h-12 bg-maroon-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-cubes text-maroon-700 text-xl"></i>
                </div>
                <div>
                    <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold">Systems</p>
                    <p class="text-3xl font-bold text-slate-900 mt-0.5" id="statSystems">—</p>
                </div>
            </div>
            <div class="bg-white rounded-2xl border border-slate-200 shadow-card p-6 flex items-center gap-4">
                <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-bolt text-blue-600 text-xl"></i>
                </div>
                <div>
                    <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold">Logs Today</p>
                    <p class="text-3xl font-bold text-slate-900 mt-0.5" id="statLogsToday">—</p>
                </div>
            </div>
        </div>

        <!-- Recent activity -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-card">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 class="font-bold text-slate-900">Recent Activity</h2>
                <span class="text-xs text-slate-400">Last 10 events</span>
            </div>
            <div id="recentActivityFeed" class="divide-y divide-slate-100">
                <div class="px-6 py-8 text-center text-slate-400 text-sm">Loading…</div>
            </div>
        </div>
    </section>

    <!-- ----------------------------------------------------------------
         USERS TAB
         ---------------------------------------------------------------- -->
    <section id="tab-users" data-tab-content="users" class="hidden">

        <!-- Filter pills -->
        <div class="flex flex-wrap items-center gap-3 mb-6">
            <div class="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
                <button class="user-filter-btn rounded-lg px-4 py-2 text-sm font-medium bg-maroon-800 text-white transition-colors" data-filter="all">All</button>
                <button class="user-filter-btn rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors" data-filter="pending">Pending</button>
                <button class="user-filter-btn rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors" data-filter="active">Active</button>
                <button class="user-filter-btn rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors" data-filter="rejected">Rejected</button>
            </div>
            <div class="ml-auto">
                <input type="search" id="userSearch" placeholder="Search by name or email…"
                    class="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/30 w-64">
            </div>
        </div>

        <!-- Users table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                            <th class="text-left px-6 py-3 font-semibold">User</th>
                            <th class="text-left px-6 py-3 font-semibold">Status</th>
                            <th class="text-left px-6 py-3 font-semibold">Assigned Systems</th>
                            <th class="text-left px-6 py-3 font-semibold">Joined</th>
                            <th class="text-left px-6 py-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr><td colspan="5" class="px-6 py-10 text-center text-slate-400">Loading users…</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>

    <!-- ----------------------------------------------------------------
         SYSTEMS TAB
         ---------------------------------------------------------------- -->
    <section id="tab-systems" data-tab-content="systems" class="hidden">

        <div class="flex items-center justify-between mb-6">
            <h2 class="font-bold text-slate-900 text-lg">Registered Systems</h2>
            <div class="flex items-center gap-2">
                <button id="addSystemBtn"
                    class="flex items-center gap-2 px-4 py-2.5 bg-maroon-800 text-white text-sm font-semibold rounded-xl hover:bg-maroon-900 transition-colors shadow-sm">
                    <i class="fas fa-plus"></i> Add System
                </button>
            </div>
        </div>

        <!-- Systems table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                            <th class="text-left px-6 py-3 font-semibold">System</th>
                            <th class="text-left px-6 py-3 font-semibold">Description</th>
                            <th class="text-left px-6 py-3 font-semibold">Status</th>
                            <th class="text-left px-6 py-3 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="systemsTableBody">
                        <tr><td colspan="4" class="px-6 py-10 text-center text-slate-400">Loading systems…</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </section>

    <!-- ----------------------------------------------------------------
         LOGS TAB
         ---------------------------------------------------------------- -->
    <section id="tab-logs" data-tab-content="logs" class="hidden">

        <!-- Filters -->
        <div class="flex flex-wrap gap-3 mb-6">
            <select id="logSystemFilter" class="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/30">
                <option value="">All Systems</option>
            </select>
            <select id="logActionFilter" class="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/30">
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="system_access">System Access</option>
                <option value="access_denied">Access Denied</option>
                <option value="admin_assign_role">Role Assignment</option>
                <option value="admin_revoke_role">Role Revoked</option>
                <option value="admin_system_status_change">System Status Change</option>
                <option value="admin_system_create">System Created</option>
                <option value="admin_system_delete">System Deleted</option>
                <option value="admin_approve_user">User Approved</option>
                <option value="admin_reject_user">User Rejected</option>
            </select>
            <button id="logsRefreshBtn" class="px-4 py-2 border border-slate-200 text-sm rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
                <i class="fas fa-rotate-right"></i> Refresh
            </button>
        </div>

        <!-- Logs table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                            <th class="text-left px-6 py-3 font-semibold">Timestamp</th>
                            <th class="text-left px-6 py-3 font-semibold">User</th>
                            <th class="text-left px-6 py-3 font-semibold">Action</th>
                            <th class="text-left px-6 py-3 font-semibold">System</th>
                            <th class="text-left px-6 py-3 font-semibold">Details</th>
                        </tr>
                    </thead>
                    <tbody id="logsTableBody">
                        <tr><td colspan="5" class="px-6 py-10 text-center text-slate-400">Loading logs…</td></tr>
                    </tbody>
                </table>
            </div>
            <!-- Pagination -->
            <div class="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
                <button id="logsPrevBtn" disabled
                    class="px-4 py-2 text-sm border border-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors">
                    <i class="fas fa-chevron-left mr-1"></i> Prev
                </button>
                <span id="logsPageInfo" class="text-sm text-slate-500">Page 1</span>
                <button id="logsNextBtn"
                    class="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    Next <i class="fas fa-chevron-right ml-1"></i>
                </button>
            </div>
        </div>
    </section>

</main>

<!-- ======================================================================
     MODAL: Assign / Edit User Access
     ====================================================================== -->
<div id="assignAccessModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div class="bg-white rounded-2xl shadow-glass-lg w-full max-w-lg">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 class="font-bold text-slate-900">Manage User System Access</h3>
            <button class="modal-close w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                data-modal="assignAccessModal"><i class="fas fa-times"></i></button>
        </div>
        <div class="px-6 py-5 space-y-4">
            <div>
                <p class="text-sm text-slate-500 mb-1">User</p>
                <p class="font-semibold text-slate-900" id="assignModalUserName">—</p>
                <p class="text-sm text-slate-500" id="assignModalUserEmail">—</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1" for="assignSystemSelect">System</label>
                <select id="assignSystemSelect"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/30">
                    <option value="">— Select system —</option>
                </select>
                <p class="text-xs text-slate-400 mt-1">Assignments are additive. Repeat this flow to grant access to multiple systems.</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1" for="assignRoleSelect">System Role</label>
                <select id="assignRoleSelect"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/30">
                    <option value="">— Select role —</option>
                </select>
            </div>

            <div id="ofesProvisionSection" class="hidden border border-slate-200 rounded-xl p-3 space-y-3 bg-blue-50/40">
                <p class="text-xs font-semibold text-slate-700 uppercase tracking-wide">OFES Provisioning Setup</p>
                <p class="text-xs text-slate-500">These values are needed to create/update the user in OFES automatically.</p>

                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1" for="ofesCampusSelect">Campus</label>
                    <select id="ofesCampusSelect"
                        class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/30">
                        <option value="">— Select campus —</option>
                    </select>
                </div>

                <div id="ofesCollegeRow" class="hidden">
                    <label class="block text-sm font-medium text-slate-700 mb-1" for="ofesCollegeSelect">College</label>
                    <select id="ofesCollegeSelect"
                        class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/30">
                        <option value="">— Select college —</option>
                    </select>
                </div>

                <p id="ofesProvisionHint" class="text-[11px] text-slate-500"></p>
            </div>

            <!-- Custom role fields (shown when "Add Custom Role..." is selected) -->
            <div id="customRoleSection" class="hidden border border-slate-200 rounded-xl p-3 space-y-3 bg-slate-50">
                <p class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Custom Role Definition</p>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1" for="customRoleDisplayName">Display Name</label>
                    <input id="customRoleDisplayName" type="text" placeholder="e.g. College Dean"
                        class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/30">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1" for="customRoleExternalValue">External / Enum Value</label>
                    <input id="customRoleExternalValue" type="text" placeholder="e.g. Dean, S, campus_admin"
                        class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/30">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-700 mb-1" for="customRoleCanonicalRole">Canonical Role</label>
                    <select id="customRoleCanonicalRole"
                        class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/30">
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                        <option value="viewer">Viewer</option>
                    </select>
                </div>
            </div>

            <div class="border border-slate-200 rounded-xl p-3 bg-white">
                <div class="flex items-center justify-between mb-2">
                    <p class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Current System Access</p>
                    <span class="text-[11px] text-slate-400">Use Revoke to remove specific system access</span>
                </div>
                <div id="currentUserAccessList" class="space-y-2">
                    <p class="text-xs text-slate-400">No systems assigned yet.</p>
                </div>
            </div>
        </div>
        <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
            <button class="modal-close px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                data-modal="assignAccessModal">Cancel</button>
            <button id="assignAccessConfirmBtn"
                class="px-5 py-2 bg-maroon-800 text-white text-sm font-semibold rounded-xl hover:bg-maroon-900 transition-colors">
                Add System Access
            </button>
        </div>
    </div>
</div>

<!-- ======================================================================
     MODAL: Add / Edit System
     ====================================================================== -->
<div id="systemFormModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div class="bg-white rounded-2xl shadow-glass-lg w-full max-w-2xl max-h-[88vh] overflow-y-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 class="font-bold text-slate-900" id="systemFormModalTitle">Add System</h3>
            <button class="modal-close w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                data-modal="systemFormModal"><i class="fas fa-times"></i></button>
        </div>
        <form id="systemForm" class="px-6 py-5 space-y-4" novalidate>
            <input type="hidden" id="systemFormId" value="">
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1" for="systemFormName">System ID / Key
                    <span class="text-xs text-slate-400">(e.g. HRIS, OFES — used as identifier)</span>
                </label>
                <input type="text" id="systemFormName" required
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/30"
                    placeholder="HRIS">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1" for="systemFormFullName">Display Name</label>
                <input type="text" id="systemFormFullName"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/30"
                    placeholder="Human Resource Information System">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1" for="systemFormDesc">Description</label>
                <textarea id="systemFormDesc" rows="3"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-maroon-800/30"
                    placeholder="Brief description of this system"></textarea>
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1" for="systemFormUrl">Auth URL (verify.php)</label>
                <input type="url" id="systemFormUrl"
                    class="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-800/30"
                    placeholder="https://hris.csu.edu.ph/api/auth/verify.php">
            </div>
            <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <div class="flex gap-4">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="systemStatus" value="active" checked class="accent-maroon-800"> Active
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="systemStatus" value="inactive" class="accent-maroon-800"> Inactive
                    </label>
                </div>
            </div>

            <div class="pt-2 border-t border-slate-100">
                <div class="flex items-center justify-between mb-2">
                    <div>
                        <h4 class="text-sm font-semibold text-slate-800">System Roles</h4>
                        <p class="text-xs text-slate-500">Add one or more role mappings for this system before saving.</p>
                    </div>
                    <button type="button" id="addSystemRoleRowBtn"
                        class="px-3 py-1.5 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors">
                        <i class="fas fa-plus mr-1"></i>Add Role
                    </button>
                </div>
                <div id="systemRoleRows" class="space-y-2"></div>
                <p class="text-[11px] text-slate-400 mt-2">Role Key is auto-generated from the role name and external value.</p>
            </div>
        </form>
        <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
            <button class="modal-close px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                data-modal="systemFormModal">Cancel</button>
            <button id="systemFormSubmitBtn"
                class="px-5 py-2 bg-maroon-800 text-white text-sm font-semibold rounded-xl hover:bg-maroon-900 transition-colors">
                Save System
            </button>
        </div>
    </div>
</div>

<!-- ======================================================================
     MODAL: Confirm Delete / Reject
     ====================================================================== -->
<div id="confirmModal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div class="bg-white rounded-2xl shadow-glass-lg w-full max-w-sm">
        <div class="px-6 py-5 text-center">
            <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-triangle-exclamation text-red-600 text-2xl"></i>
            </div>
            <h3 class="font-bold text-slate-900 text-lg mb-2" id="confirmModalTitle">Are you sure?</h3>
            <p class="text-sm text-slate-500" id="confirmModalMessage">This action cannot be undone.</p>
        </div>
        <div class="px-6 pb-5 flex gap-3">
            <button class="modal-close flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                data-modal="confirmModal">Cancel</button>
            <button id="confirmModalOkBtn"
                class="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors">
                Confirm
            </button>
        </div>
    </div>
</div>

<!-- ======================================================================
     TOAST
     ====================================================================== -->
<div id="adminToast" class="hidden fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-glass-lg border border-slate-200 p-4 flex items-start gap-3">
    <div id="adminToastIcon" class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-500">
        <i class="fas fa-info text-white text-sm"></i>
    </div>
    <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-slate-900" id="adminToastTitle">Notification</p>
        <p class="text-xs text-slate-500 mt-0.5 line-clamp-2" id="adminToastMessage"></p>
    </div>
    <button id="closeAdminToast" class="text-slate-400 hover:text-slate-600 flex-shrink-0 mt-0.5">
        <i class="fas fa-times text-xs"></i>
    </button>
</div>

<!-- Admin JS -->
<script src="app.js"></script>

</body>
</html>
