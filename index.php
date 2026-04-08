<?php
$assetHost = (strpos($_SERVER['HTTP_HOST'] ?? '', 'csu.edu.ph') !== false)
	? 'https://hris.csu.edu.ph'
	: 'http://localhost/hris.csu.edu.ph';
?>
<!DOCTYPE html>
<html lang="en" class="scroll-smooth">

<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="description"
		content="MyCSU - Your unified gateway to Cagayan State University digital systems. Access HRIS, OFES, E2E and more.">
	<meta name="theme-color" content="#800000">
	<title>MyCSU — Unified University Portal</title>
	<link rel="icon" type="image/x-icon" href="public/favicon.ico">

	<!-- Preconnect for performance -->
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

	<!-- Google Fonts - Inter -->
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
		rel="stylesheet">

	<!-- Tailwind CSS CDN -->
	<script src="https://cdn.tailwindcss.com"></script>

	<!-- Custom Styles -->
	<link rel="stylesheet" href="styles.css">

	<!-- Font Awesome 6 -->
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

	<!-- Firebase SDK -->
	<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
	<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
	<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>

	<!-- Tailwind Configuration -->
	<script>
		tailwind.config = {
			theme: {
				extend: {
					colors: {
						maroon: {
							50: '#fdf2f2',
							100: '#fce4e4',
							200: '#fbcdcd',
							300: '#f7a8a8',
							400: '#f07575',
							500: '#e54545',
							600: '#c92a2a',
							700: '#a31f1f',
							800: '#800000',
							900: '#6b1c1c',
							950: '#3a0c0c'
						},
						gold: {
							50: '#fffef7',
							100: '#fffce8',
							200: '#fff8c5',
							300: '#fff099',
							400: '#ffe566',
							500: '#FFDF00',
							600: '#e6c900',
							700: '#b89c00',
							800: '#967d00',
							900: '#7a6600',
							950: '#453a00'
						},
						slate: {
							850: '#172033'
						}
					},
					fontFamily: {
						sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
					},
					boxShadow: {
						'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
						'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.12)',
						'card': '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 40px -10px rgba(0, 0, 0, 0.08)',
						'card-hover': '0 20px 60px -15px rgba(0, 0, 0, 0.15)',
						'glow': '0 0 60px -15px rgba(128, 0, 0, 0.3)',
						'glow-gold': '0 0 40px -10px rgba(255, 223, 0, 0.4)'
					},
					backdropBlur: {
						'xs': '2px'
					},
					animation: {
						'fade-in': 'fadeIn 0.5s ease-out forwards',
						'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
						'fade-in-down': 'fadeInDown 0.5s ease-out forwards',
						'scale-in': 'scaleIn 0.3s ease-out forwards',
						'slide-in-right': 'slideInRight 0.4s ease-out forwards',
						'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
						'float': 'float 6s ease-in-out infinite',
						'gradient': 'gradient 8s ease infinite',
						'shimmer': 'shimmer 2s linear infinite'
					},
					transitionTimingFunction: {
						'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
					}
				}
			}
		}
	</script>
	<style>
		.system-loading-bg {
			background: radial-gradient(1200px 800px at 15% -10%, rgba(245, 197, 66, 0.28), transparent 60%),
				radial-gradient(900px 600px at 110% 10%, rgba(122, 13, 22, 0.4), transparent 55%),
				radial-gradient(700px 500px at 50% 120%, rgba(56, 189, 248, 0.22), transparent 60%),
				linear-gradient(135deg, rgba(12, 19, 38, 0.95), rgba(122, 13, 22, 0.85));
		}

		.system-loading-grid {
			background-image: linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
				linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
			background-size: 40px 40px;
			animation: system-grid-move 12s linear infinite;
		}

		.system-loading-orb {
			position: absolute;
			width: 280px;
			height: 280px;
			border-radius: 999px;
			background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.35), transparent 60%);
			filter: blur(12px);
			opacity: 0.5;
			animation: system-orb 8s ease-in-out infinite;
		}

		.system-loading-logo {
			animation: system-pulse 2s ease-in-out infinite;
		}

		.system-network {
			position: relative;
			width: 180px;
			height: 180px;
			margin: 0 auto 20px;
		}

		.system-network::before {
			content: '';
			position: absolute;
			inset: 18px;
			border-radius: 999px;
			border: 1px dashed rgba(255, 255, 255, 0.25);
			animation: system-rotate 14s linear infinite;
		}

		.system-node {
			position: absolute;
			width: 10px;
			height: 10px;
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.85);
			box-shadow: 0 0 12px rgba(59, 130, 246, 0.8);
			animation: system-node 2.5s ease-in-out infinite;
		}

		.system-node.n1 {
			top: 6px;
			left: 50%;
			transform: translateX(-50%);
			animation-delay: 0s;
		}

		.system-node.n2 {
			right: 12px;
			top: 45%;
			animation-delay: 0.4s;
		}

		.system-node.n3 {
			bottom: 10px;
			left: 40%;
			animation-delay: 0.8s;
		}

		.system-node.n4 {
			left: 10px;
			top: 35%;
			animation-delay: 1.2s;
		}

		.system-loading-ring {
			position: absolute;
			inset: 0;
			border-radius: 999px;
			border: 2px solid rgba(255, 255, 255, 0.15);
			animation: system-ping 2.8s ease-out infinite;
		}

		.system-loading-spinner {
			width: 48px;
			height: 48px;
			border-radius: 999px;
			border: 3px solid rgba(255, 255, 255, 0.25);
			border-top-color: #ffffff;
			animation: system-spin 1s linear infinite;
			margin: 0 auto;
		}

		.system-loading-bar {
			height: 6px;
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.15);
			overflow: hidden;
			margin: 18px auto 0;
			max-width: 220px;
		}

		.system-loading-bar span {
			display: block;
			height: 100%;
			width: 45%;
			background: linear-gradient(90deg, rgba(245, 197, 66, 0.2), rgba(245, 197, 66, 0.9), rgba(56, 189, 248, 0.9));
			animation: system-loading 1.8s ease-in-out infinite;
		}

		@keyframes system-spin {
			to {
				transform: rotate(360deg);
			}
		}

		@keyframes system-pulse {

			0%,
			100% {
				transform: scale(1);
				box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
			}

			50% {
				transform: scale(1.05);
				box-shadow: 0 14px 32px rgba(0, 0, 0, 0.35);
			}
		}

		@keyframes system-ping {
			0% {
				transform: scale(0.6);
				opacity: 0.6;
			}

			100% {
				transform: scale(1.2);
				opacity: 0;
			}
		}

		@keyframes system-node {

			0%,
			100% {
				transform: scale(1);
				opacity: 0.7;
			}

			50% {
				transform: scale(1.35);
				opacity: 1;
			}
		}

		@keyframes system-rotate {
			to {
				transform: rotate(360deg);
			}
		}

		@keyframes system-grid-move {
			0% {
				background-position: 0 0;
			}

			100% {
				background-position: 80px 80px;
			}
		}

		@keyframes system-orb {

			0%,
			100% {
				transform: translate(-40px, -20px);
				opacity: 0.5;
			}

			50% {
				transform: translate(30px, 20px);
				opacity: 0.8;
			}
		}

		@keyframes system-loading {
			0% {
				transform: translateX(-120%);
			}

			100% {
				transform: translateX(240%);
			}
		}
	</style>

</head>

<body class="bg-slate-50 font-sans antialiased text-slate-800">

	<!-- ========================================
		 NAVIGATION BAR
	======================================== -->
	<nav id="navbar"
		class="fixed w-full top-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-lg border-b border-transparent">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<div class="flex justify-between items-center h-16 lg:h-18">

				<!-- Logo & Branding -->
				<a href="#" class="flex items-center gap-3 group" aria-label="MyCSU Home">
					<img src="public/600x600 CSU Logo.png" alt="CSU Logo"
						class="w-10 h-10 lg:w-11 lg:h-11 object-contain">
					<div class="hidden sm:block">
						<h1 class="text-lg lg:text-xl font-bold text-maroon-800 tracking-tight">MyCSU</h1>
						<p class="text-[10px] lg:text-xs text-slate-500 font-medium -mt-0.5">University Portal</p>
					</div>
				</a>

				<!-- Desktop Navigation Links -->
				<div class="hidden md:flex items-center gap-1">
					<a href="#systems"
						class="nav-link px-4 py-2 text-sm font-medium text-slate-600 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all duration-200 focus-ring">
						<i class="fas fa-th-large mr-2 text-xs opacity-70"></i>Systems
					</a>
					<a href="#announcements"
						class="nav-link px-4 py-2 text-sm font-medium text-slate-600 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all duration-200 focus-ring">
						<i class="fas fa-bullhorn mr-2 text-xs opacity-70"></i>Announcements
					</a>
					<a href="#updates"
						class="nav-link px-4 py-2 text-sm font-medium text-slate-600 hover:text-maroon-800 hover:bg-maroon-50 rounded-lg transition-all duration-200 focus-ring">
						<i class="fas fa-code-branch mr-2 text-xs opacity-70"></i>Updates
					</a>
				</div>

				<!-- Right Side: Auth & Mobile Menu -->
				<div class="flex items-center gap-3">

					<!-- System Status Indicator -->
					<div
						class="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
						<span class="relative flex h-2 w-2">
							<span
								class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
						</span>
						<span class="text-xs font-medium text-emerald-700">All Systems Operational</span>
					</div>

					<!-- Login Button (Logged Out State) -->
					<button id="loginBtn"
						class="btn-shine bg-gradient-to-r from-maroon-800 to-maroon-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-maroon-800/20 hover:shadow-xl hover:shadow-maroon-800/30 hover:-translate-y-0.5 transition-all duration-200 focus-ring"
						aria-label="Sign in to MyCSU">
						<i class="fas fa-arrow-right-to-bracket mr-2"></i>
						<span class="hidden sm:inline">Sign In</span>
						<span class="sm:hidden">Login</span>
					</button>

					<!-- User Menu (Logged In State) -->
					<div id="userMenu" class="hidden relative">
						<button id="userMenuBtn"
							class="flex items-center gap-3 pl-3 pr-1 py-1 rounded-full bg-slate-100 hover:bg-slate-200 transition-all duration-200 focus-ring min-w-0"
							aria-label="Open user menu" aria-expanded="false">
							<div class="hidden sm:block text-right min-w-0 max-w-[180px]">
								<p id="userName" class="text-sm font-semibold text-slate-700 truncate">User Name</p>
								<p id="userRole" class="text-xs text-slate-500 truncate">Faculty</p>
							</div>
							<div class="relative">
								<img id="userAvatar"
									src="https://ui-avatars.com/api/?name=User&background=800000&color=fff&size=128"
									alt="User Avatar" class="w-9 h-9 rounded-full ring-2 ring-maroon-800 ring-offset-2">
								<span
									class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
							</div>
							<i class="fas fa-chevron-down text-xs text-slate-400 mr-2 transition-transform duration-200"
								id="dropdownArrow"></i>
						</button>

						<!-- User Dropdown -->
						<div id="userDropdown"
							class="hidden absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-glass-lg border border-slate-200/60 py-2 animate-fade-in-down"
							role="menu">
							<div class="px-4 py-3 border-b border-slate-100">
								<p class="text-sm font-semibold text-slate-800 truncate" id="dropdownUserName">John Doe
								</p>
								<p class="text-xs text-slate-500 truncate max-w-[220px]" id="dropdownUserEmail">
									john.doe@csu.edu.ph</p>
							</div>
							<div class="py-2">
								<a href="#profile"
									class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-maroon-800 transition-colors"
									role="menuitem">
									<i class="fas fa-user-circle w-4 text-center opacity-60"></i>My Profile
								</a>
								<a href="#settings"
									class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-maroon-800 transition-colors"
									role="menuitem">
									<i class="fas fa-cog w-4 text-center opacity-60"></i>Settings
								</a>
								<a href="#help"
									class="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-maroon-800 transition-colors"
									role="menuitem">
									<i class="fas fa-question-circle w-4 text-center opacity-60"></i>Help & Support
								</a>
								<a id="adminPortalLink" href="admin/"
									class="hidden flex items-center gap-3 px-4 py-2.5 text-sm text-maroon-800 font-semibold hover:bg-maroon-50 transition-colors"
									role="menuitem">
									<i class="fas fa-shield-halved w-4 text-center"></i>Admin Portal
								</a>
							</div>
							<div class="border-t border-slate-100 pt-2 mt-1">
								<button id="logoutBtn"
									class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
									role="menuitem">
									<i class="fas fa-arrow-right-from-bracket w-4 text-center"></i>Sign Out
								</button>
							</div>
						</div>
					</div>

					<!-- Mobile Menu Toggle -->
					<button id="mobileMenuBtn"
						class="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all duration-200 focus-ring"
						aria-label="Toggle mobile menu" aria-expanded="false">
						<i class="fas fa-bars text-lg" id="mobileMenuIcon"></i>
					</button>
				</div>
			</div>
		</div>

		<!-- Mobile Navigation Menu -->
		<div id="mobileMenu" class="hidden md:hidden bg-white border-t border-slate-100 shadow-lg" role="navigation">
			<div class="px-4 py-4 space-y-1">
				<a href="#systems"
					class="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-maroon-50 hover:text-maroon-800 rounded-xl transition-colors">
					<i class="fas fa-th-large w-5 text-center"></i>University Systems
				</a>
				<a href="#announcements"
					class="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-maroon-50 hover:text-maroon-800 rounded-xl transition-colors">
					<i class="fas fa-bullhorn w-5 text-center"></i>Announcements
				</a>
				<a href="#updates"
					class="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-maroon-50 hover:text-maroon-800 rounded-xl transition-colors">
					<i class="fas fa-code-branch w-5 text-center"></i>System Updates
				</a>
			</div>
			<div class="px-4 pb-4">
				<div class="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
					<span class="relative flex h-2 w-2">
						<span
							class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
					</span>
					<span class="text-xs font-medium text-emerald-700">All Systems Operational</span>
				</div>
			</div>
		</div>
	</nav>

	<!-- ========================================
		 HERO SECTION
	======================================== -->
	<section class="relative min-h-[85vh] lg:min-h-[90vh] flex items-center hero-gradient hero-pattern overflow-hidden"
		style="background-color: #800000;">
		<!-- Decorative Elements -->
		<div class="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
			<div class="absolute top-20 left-10 w-72 h-72 bg-gold-500/10 rounded-full blur-3xl animate-float"></div>
			<div class="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float"
				style="animation-delay: -3s;"></div>
			<div
				class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full">
			</div>
			<div
				class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full">
			</div>
		</div>

		<div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
			<div class="max-w-4xl mx-auto text-center">

				<!-- Badge -->
				<div
					class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8 animate-fade-in-up">
					<span class="relative flex h-2 w-2">
						<span
							class="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
					</span>
					<span class="text-sm font-medium text-white/90">Managed by MIS Office</span>
				</div>

				<!-- Main Headline -->
				<h1
					class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 tracking-tight leading-[1.12] animate-fade-in-up delay-100">
					Welcome to
					<span class="block text-gradient mt-2 pb-1">MyCSU</span>
				</h1>

				<!-- Subtitle -->
				<p
					class="text-lg sm:text-xl md:text-2xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
					Your unified gateway to Cagayan State University's digital ecosystem.
					Access all essential systems in one secure place.
				</p>

				<!-- CTA Buttons -->
				<div class="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
					<button id="heroLoginBtn"
						class="group btn-shine w-full sm:w-auto bg-gold-500 text-maroon-900 px-8 py-4 rounded-2xl text-lg font-bold shadow-xl shadow-gold-500/30 hover:bg-gold-400 hover:shadow-2xl hover:shadow-gold-500/40 hover:-translate-y-1 transition-all duration-300 focus-ring-gold">
						<i class="fas fa-arrow-right-to-bracket mr-3"></i>
						Sign in with CSU Account
						<i class="fas fa-arrow-right ml-3 group-hover:translate-x-1 transition-transform"></i>
					</button>
					<a href="#systems"
						class="w-full sm:w-auto px-8 py-4 rounded-2xl text-lg font-semibold text-white border-2 border-white/30 hover:bg-white/10 hover:border-white/50 transition-all duration-300">
						<i class="fas fa-th-large mr-3"></i>Explore Systems
					</a>
				</div>
			</div>
		</div>

		<!-- Scroll Indicator -->
		<div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
			<a href="#systems" class="text-white/40 hover:text-white/70 transition-colors"
				aria-label="Scroll to systems section">
				<i class="fas fa-chevron-down text-2xl"></i>
			</a>
		</div>
	</section>

	<!-- ========================================
		 SYSTEMS DASHBOARD SECTION
	======================================== -->
	<section id="systems" class="relative py-20 lg:py-28 bg-white">
		<!-- Section Background Pattern -->
		<div class="absolute inset-0 opacity-50" aria-hidden="true">
			<div class="absolute top-0 right-0 w-96 h-96 bg-maroon-50 rounded-full blur-3xl -translate-y-1/2"></div>
			<div class="absolute bottom-0 left-0 w-96 h-96 bg-gold-50 rounded-full blur-3xl translate-y-1/2"></div>
		</div>

		<div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

			<!-- Section Header -->
			<div class="text-center mb-16">
				<div
					class="inline-flex items-center gap-2 px-4 py-2 bg-maroon-50 border border-maroon-100 rounded-full mb-4">
					<i class="fas fa-th-large text-maroon-800 text-sm"></i>
					<span class="text-sm font-semibold text-maroon-800">University Systems</span>
				</div>
				<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
					Access Your Digital Tools
				</h2>
				<p class="text-lg text-slate-600 max-w-2xl mx-auto">
					All university systems at your fingertips. Sign in once to access HRIS, OFES, and more.
				</p>
			</div>

			<!-- Login Prompt Banner (Shown when logged out) -->
			<div id="loginPromptBanner"
				class="mb-10 p-5 bg-gradient-to-r from-maroon-50 to-gold-50 border border-maroon-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 bg-maroon-100 rounded-xl flex items-center justify-center flex-shrink-0">
						<i class="fas fa-lock text-maroon-800 text-xl"></i>
					</div>
					<div>
						<h4 class="font-semibold text-slate-800">Authentication Required</h4>
						<p class="text-sm text-slate-600">Sign in with your CSU account to access university systems</p>
					</div>
				</div>
				<button
					class="prompt-login-btn whitespace-nowrap px-6 py-2.5 bg-maroon-800 text-white rounded-xl font-medium hover:bg-maroon-900 transition-colors focus-ring">
					Sign In Now <i class="fas fa-arrow-right ml-2"></i>
				</button>
			</div>

			<!-- Pending User Banner (shown after login when account is not yet approved) -->
			<div id="pendingUserBanner"
				class="hidden mb-10 p-5 bg-gradient-to-r from-amber-50 to-gold-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
				<div class="flex items-center gap-4">
					<div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
						<i class="fas fa-clock text-amber-600 text-xl"></i>
					</div>
					<div>
						<h4 class="font-semibold text-slate-800">Account Pending Approval</h4>
						<p class="text-sm text-slate-600" data-pending-message>Your account is not yet registered in any system. Please contact MIS for access.</p>
					</div>
				</div>
				<a href="mailto:mis@csu.edu.ph"
					class="whitespace-nowrap px-6 py-2.5 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors focus-ring">
					<i class="fas fa-envelope mr-2"></i>Contact MIS
				</a>
			</div>

			<!-- System Cards Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">

				<!-- HRIS Card -->
				<article
					class="system-card group relative bg-white rounded-3xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden card-lift flex flex-col h-full"
					data-system="HRIS">
					<!-- Card Header with Status -->
					<div class="relative p-6 pb-4">
						<div class="flex items-start justify-between mb-4">
							<div>
								<h3
									class="text-xl font-bold text-slate-900 mb-1 group-hover:text-maroon-800 transition-colors">
									HRIS</h3>
								<p class="text-sm text-slate-500 font-medium">Human Resource Information System</p>
							</div>
							<div
								class="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-full">
								<span class="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
								<span class="text-xs font-semibold text-slate-500">Inactive</span>
							</div>
						</div>
					</div>

					<!-- Card Body -->
					<div class="px-6 pb-4 flex-1">
						<p class="text-slate-600 text-sm leading-relaxed mb-4">
							Unified employee information hub for service history, attendance, leave, and personnel
							actions—improving accuracy, accountability, and self-service access for staff and HR
							offices.
						</p>
						<div class="flex items-center gap-4 text-xs text-slate-500">
							<span class="flex items-center gap-1">
								Updated 2h ago
							</span>
							<span class="flex items-center gap-1">
								v2.5.0
							</span>
						</div>
					</div>

					<!-- Card Footer -->
					<div class="px-6 pb-6 mt-auto">
						<button
							class="system-btn w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed bg-slate-100 text-slate-400 disabled:hover:bg-slate-100"
							data-system="HRIS" disabled aria-label="Sign in to access HRIS">
							Sign in to Access
						</button>
					</div>
				</article>

				<!-- OFES Card -->
				<article
					class="system-card group relative bg-white rounded-3xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden card-lift flex flex-col h-full"
					data-system="OFES">
					<!-- Card Header with Status -->
					<div class="relative p-6 pb-4">
						<div class="flex items-start justify-between mb-4">
							<div>
								<h3
									class="text-xl font-bold text-slate-900 mb-1 group-hover:text-maroon-800 transition-colors">
									OFES</h3>
								<p class="text-sm text-slate-500 font-medium">Online Faculty Evaluation System</p>
							</div>
							<div
								class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
								<span class="status-pulse status-online relative flex h-2 w-2">
									<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
								</span>
								<span class="text-xs font-semibold text-emerald-700">Online</span>
							</div>
						</div>
					</div>

					<!-- Card Body -->
					<div class="px-6 pb-4 flex-1">
						<p class="text-slate-600 text-sm leading-relaxed mb-4">
							Secure digital evaluation workflow that replaces paper forms, blocks duplicate or invalid
							entries, protects fairness, and delivers faster results for academic improvement.
						</p>
						<div class="flex items-center gap-4 text-xs text-slate-500">
							<span class="flex items-center gap-1">
								Updated 1d ago
							</span>
							<span class="flex items-center gap-1">
								v1.8.2
							</span>
						</div>
					</div>

					<!-- Card Footer -->
					<div class="px-6 pb-6 mt-auto">
						<button
							class="system-btn w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed bg-slate-100 text-slate-400 disabled:hover:bg-slate-100"
							data-system="OFES" disabled aria-label="Sign in to access OFES">
							Sign in to Access
						</button>
					</div>
				</article>

				<!-- E2E System Card -->
				<article
					class="system-card group relative bg-white rounded-3xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden card-lift flex flex-col h-full"
					data-system="E2E">
					<!-- Card Header with Status -->
					<div class="relative p-6 pb-4">
						<div class="flex items-start justify-between mb-4">
							<div>
								<h3
									class="text-xl font-bold text-slate-900 mb-1 group-hover:text-maroon-800 transition-colors">
									E2E System</h3>
								<p class="text-sm text-slate-500 font-medium">Enrollment-to-Employment System</p>
							</div>
							<div
								class="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-full">
								<span class="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
								<span class="text-xs font-semibold text-slate-500">Inactive</span>
							</div>
						</div>
					</div>

					<!-- Card Body -->
					<div class="px-6 pb-4 flex-1">
						<p class="text-slate-600 text-sm leading-relaxed mb-4">
							Connected student lifecycle platform from admission to employment, consolidating records,
							credentials, and outcomes to track progress, employability, and support data-driven
							planning.
						</p>
						<div class="flex items-center gap-4 text-xs text-slate-500">
							<span class="flex items-center gap-1">
								<span class="text-amber-600">Jan 25, 10PM</span>
							</span>
							<span class="flex items-center gap-1">
								v3.2.1
							</span>
						</div>
					</div>

					<!-- Card Footer -->
					<div class="px-6 pb-6 mt-auto">
						<button
							class="system-btn w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed bg-slate-100 text-slate-400 disabled:hover:bg-slate-100"
							data-system="E2E" disabled aria-label="Sign in to access E2E System">
							Sign in to Access
						</button>
					</div>
				</article>
			</div>

			<!-- More Systems Hint -->
			<div class="mt-12 text-center">
				<p class="text-slate-500 text-sm">
					<i class="fas fa-info-circle mr-2"></i>
					More systems coming soon. Need a new system integrated?
					<a href="mailto:mis@csu.edu.ph" class="text-maroon-800 font-medium hover:underline">Contact MIS
						Office</a>
				</p>
			</div>
		</div>
	</section>

	<!-- Section Divider -->
	<div class="h-px section-divider" aria-hidden="true"></div>

	<!-- ========================================
		 ANNOUNCEMENTS SECTION
	======================================== -->
	<section id="announcements" class="py-20 lg:py-28 bg-slate-50">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

			<!-- Section Header -->
			<div class="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
				<div>
					<div
						class="inline-flex items-center gap-2 px-4 py-2 bg-maroon-50 border border-maroon-100 rounded-full mb-4">
						<i class="fas fa-bullhorn text-maroon-800 text-sm"></i>
						<span class="text-sm font-semibold text-maroon-800">Official Announcements</span>
					</div>
					<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-3">
						MIS Office Updates
					</h2>
					<p class="text-lg text-slate-600 max-w-xl">
						Stay informed with the latest news, system updates, and important notices.
					</p>
				</div>
				<a href="#all-announcements"
					class="inline-flex items-center gap-2 text-maroon-800 font-semibold hover:text-maroon-900 transition-colors group">
					View All Announcements
					<i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
				</a>
			</div>

			<!-- Featured Announcement (Highlighted) -->
			<article
				class="mb-8 p-8 bg-gradient-to-br from-maroon-800 to-maroon-900 rounded-3xl text-white shadow-xl shadow-maroon-800/20 relative overflow-hidden">
				<!-- Background Pattern -->
				<div class="absolute inset-0 opacity-10" aria-hidden="true">
					<div
						class="absolute top-0 right-0 w-64 h-64 bg-gold-500 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2">
					</div>
				</div>

				<div class="relative z-10">
					<div class="flex flex-wrap items-center gap-3 mb-4">
						<span
							class="px-3 py-1 bg-gold-500 text-maroon-900 text-xs font-bold rounded-full uppercase tracking-wide">
							<i class="fas fa-star mr-1"></i>Featured
						</span>
						<span class="px-3 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">
							System Update
						</span>
						<span class="text-white/60 text-sm ml-auto">
							<i class="far fa-calendar mr-1"></i>January 20, 2026
						</span>
					</div>

					<h3 class="text-2xl lg:text-3xl font-bold mb-3">HRIS System Major Enhancement Released</h3>
					<p class="text-white/80 text-lg mb-6 max-w-3xl">
						We've rolled out significant improvements to the HRIS including automated payroll processing,
						advanced analytics dashboard, and enhanced employee self-service features.
					</p>

					<button
						class="announcement-btn inline-flex items-center gap-2 px-6 py-3 bg-white text-maroon-800 rounded-xl font-semibold hover:bg-gold-500 hover:text-maroon-900 transition-all duration-200 focus-ring"
						data-announcement="1">
						Read Full Announcement
						<i class="fas fa-arrow-right"></i>
					</button>
				</div>
			</article>

			<!-- Announcement Cards Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

				<!-- Announcement Card 2 -->
				<article
					class="group bg-white rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
					<div class="p-6">
						<div class="flex flex-wrap items-center gap-3 mb-4">
							<span class="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
								<i class="fas fa-wrench mr-1"></i>Maintenance
							</span>
							<time class="text-slate-500 text-sm ml-auto" datetime="2026-01-18">
								<i class="far fa-calendar mr-1"></i>January 18, 2026
							</time>
						</div>

						<h4 class="text-lg font-bold text-slate-900 mb-2 group-hover:text-maroon-800 transition-colors">
							Scheduled Maintenance Notice
						</h4>
						<p class="text-slate-600 text-sm mb-4 line-clamp-2">
							E2E System will undergo scheduled maintenance on January 25, 2026 from 10:00 PM to 2:00 AM
							for performance improvements.
						</p>

						<button
							class="announcement-btn inline-flex items-center gap-2 text-maroon-800 font-medium hover:text-maroon-900 text-sm group/btn focus-ring"
							data-announcement="2">
							Read more
							<i
								class="fas fa-arrow-right text-xs group-hover/btn:translate-x-1 transition-transform"></i>
						</button>
					</div>
				</article>

				<!-- Announcement Card 3 -->
				<article
					class="group bg-white rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
					<div class="p-6">
						<div class="flex flex-wrap items-center gap-3 mb-4">
							<span class="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
								<i class="fas fa-check-circle mr-1"></i>New Feature
							</span>
							<time class="text-slate-500 text-sm ml-auto" datetime="2026-01-15">
								<i class="far fa-calendar mr-1"></i>January 15, 2026
							</time>
						</div>

						<h4 class="text-lg font-bold text-slate-900 mb-2 group-hover:text-maroon-800 transition-colors">
							Faculty Evaluation Period Now Open
						</h4>
						<p class="text-slate-600 text-sm mb-4 line-clamp-2">
							OFES is now accepting faculty evaluations for the first semester of AY 2025-2026. Deadline:
							February 1, 2026.
						</p>

						<button
							class="announcement-btn inline-flex items-center gap-2 text-maroon-800 font-medium hover:text-maroon-900 text-sm group/btn focus-ring"
							data-announcement="3">
							Read more
							<i
								class="fas fa-arrow-right text-xs group-hover/btn:translate-x-1 transition-transform"></i>
						</button>
					</div>
				</article>
			</div>
		</div>
	</section>

	<!-- ========================================
		 PATCH NOTES & UPDATES SECTION
	======================================== -->
	<section id="updates" class="py-20 lg:py-28 bg-white">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

			<!-- Section Header -->
			<div class="text-center mb-16">
				<div
					class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-slate-200 rounded-full mb-4">
					<i class="fas fa-code-branch text-slate-700 text-sm"></i>
					<span class="text-sm font-semibold text-slate-700">Changelog</span>
				</div>
				<h2 class="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
					System Updates & Patch Notes
				</h2>
				<p class="text-lg text-slate-600 max-w-2xl mx-auto">
					Track improvements, bug fixes, and new features across all university systems.
				</p>
			</div>

			<!-- System Filter Tabs -->
			<div class="flex flex-wrap justify-center gap-2 mb-12" role="tablist" aria-label="Filter updates by system">
				<button
					class="filter-tab active px-5 py-2 rounded-full text-sm font-medium bg-maroon-800 text-white transition-all duration-200 focus-ring"
					data-filter="all" role="tab" aria-selected="true">
					All Systems
				</button>
				<button
					class="filter-tab px-5 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-200 focus-ring"
					data-filter="HRIS" role="tab" aria-selected="false">
					HRIS
				</button>
				<button
					class="filter-tab px-5 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-200 focus-ring"
					data-filter="OFES" role="tab" aria-selected="false">
					OFES
				</button>
				<button
					class="filter-tab px-5 py-2 rounded-full text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-200 focus-ring"
					data-filter="E2E" role="tab" aria-selected="false">
					E2E
				</button>
			</div>

			<!-- Timeline -->
			<div class="max-w-4xl mx-auto relative">
				<!-- Timeline Line -->
				<div class="absolute left-0 md:left-1/2 top-0 bottom-0 w-0.5 timeline-line md:-translate-x-1/2"
					aria-hidden="true"></div>

				<!-- Timeline Item 1 -->
				<article class="update-item relative flex flex-col md:flex-row gap-8 mb-12" data-system="HRIS">
					<!-- Date Column (Desktop) -->
					<div class="hidden md:block md:w-1/2 text-right pr-12">
						<div class="sticky top-24">
							<time class="text-sm font-semibold text-slate-500" datetime="2026-01-20">January 20,
								2026</time>
						</div>
					</div>

					<!-- Timeline Dot -->
					<div class="absolute left-0 md:left-1/2 w-4 h-4 bg-maroon-800 rounded-full border-4 border-white shadow-lg -translate-x-1/2 z-10"
						aria-hidden="true"></div>

					<!-- Content Column -->
					<div class="ml-8 md:ml-0 md:w-1/2 md:pl-12">
						<div
							class="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow duration-300">
							<!-- Mobile Date -->
							<time class="text-sm font-semibold text-slate-500 mb-3 md:hidden block"
								datetime="2026-01-20">
								<i class="far fa-calendar mr-1"></i>January 20, 2026
							</time>

							<div class="flex flex-wrap items-center gap-2 mb-4">
								<span
									class="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">HRIS</span>
								<span
									class="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-mono rounded">v2.5.0</span>
								<span
									class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full ml-auto">Major
									Release</span>
							</div>

							<h4 class="text-lg font-bold text-slate-900 mb-3">Feature Update</h4>

							<ul class="space-y-2 text-sm text-slate-600">
								<li class="flex items-start gap-2">
									<i class="fas fa-plus-circle text-emerald-500 mt-0.5 flex-shrink-0"></i>
									Added automated payroll calculation system
								</li>
								<li class="flex items-start gap-2">
									<i class="fas fa-plus-circle text-emerald-500 mt-0.5 flex-shrink-0"></i>
									Implemented advanced analytics dashboard
								</li>
								<li class="flex items-start gap-2">
									<i class="fas fa-plus-circle text-emerald-500 mt-0.5 flex-shrink-0"></i>
									Enhanced employee self-service portal
								</li>
								<li class="flex items-start gap-2">
									<i class="fas fa-wrench text-amber-500 mt-0.5 flex-shrink-0"></i>
									Fixed bugs in leave management module
								</li>
							</ul>
						</div>
					</div>
				</article>

				<!-- Timeline Item 2 -->
				<article class="update-item relative flex flex-col md:flex-row gap-8 mb-12" data-system="OFES">
					<!-- Date Column (Desktop) - Right Side -->
					<div class="hidden md:block md:w-1/2 md:order-2 pl-12">
						<div class="sticky top-24">
							<time class="text-sm font-semibold text-slate-500" datetime="2026-01-15">January 15,
								2026</time>
						</div>
					</div>

					<!-- Timeline Dot -->
					<div class="absolute left-0 md:left-1/2 w-4 h-4 bg-maroon-800 rounded-full border-4 border-white shadow-lg -translate-x-1/2 z-10"
						aria-hidden="true"></div>

					<!-- Content Column -->
					<div class="ml-8 md:ml-0 md:w-1/2 md:order-1 md:pr-12 md:text-right">
						<div
							class="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow duration-300 md:text-left">
							<!-- Mobile Date -->
							<time class="text-sm font-semibold text-slate-500 mb-3 md:hidden block"
								datetime="2026-01-15">
								<i class="far fa-calendar mr-1"></i>January 15, 2026
							</time>

							<div class="flex flex-wrap items-center gap-2 mb-4">
								<span
									class="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">OFES</span>
								<span
									class="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-mono rounded">v1.8.2</span>
								<span
									class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full ml-auto">Improvement</span>
							</div>

							<h4 class="text-lg font-bold text-slate-900 mb-3">Performance Improvements</h4>

							<ul class="space-y-2 text-sm text-slate-600">
								<li class="flex items-start gap-2">
									<i class="fas fa-bolt text-blue-500 mt-0.5 flex-shrink-0"></i>
									Optimized evaluation form loading speed
								</li>
								<li class="flex items-start gap-2">
									<i class="fas fa-plus-circle text-emerald-500 mt-0.5 flex-shrink-0"></i>
									Added real-time progress tracking
								</li>
								<li class="flex items-start gap-2">
									<i class="fas fa-mobile-alt text-blue-500 mt-0.5 flex-shrink-0"></i>
									Improved mobile responsiveness
								</li>
								<li class="flex items-start gap-2">
									<i class="fas fa-shield-alt text-amber-500 mt-0.5 flex-shrink-0"></i>
									Security patches and bug fixes
								</li>
							</ul>
						</div>
					</div>
				</article>

				<!-- Timeline Item 3 -->
				<article class="update-item relative flex flex-col md:flex-row gap-8 mb-12" data-system="E2E">
					<!-- Date Column (Desktop) -->
					<div class="hidden md:block md:w-1/2 text-right pr-12">
						<div class="sticky top-24">
							<time class="text-sm font-semibold text-slate-500" datetime="2026-01-10">January 10,
								2026</time>
						</div>
					</div>

					<!-- Timeline Dot -->
					<div class="absolute left-0 md:left-1/2 w-4 h-4 bg-maroon-800 rounded-full border-4 border-white shadow-lg -translate-x-1/2 z-10"
						aria-hidden="true"></div>

					<!-- Content Column -->
					<div class="ml-8 md:ml-0 md:w-1/2 md:pl-12">
						<div
							class="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow duration-300">
							<!-- Mobile Date -->
							<time class="text-sm font-semibold text-slate-500 mb-3 md:hidden block"
								datetime="2026-01-10">
								<i class="far fa-calendar mr-1"></i>January 10, 2026
							</time>

							<div class="flex flex-wrap items-center gap-2 mb-4">
								<span
									class="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">E2E</span>
								<span
									class="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-mono rounded">v3.2.1</span>
								<span
									class="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full ml-auto">Bug
									Fix</span>
							</div>

							<h4 class="text-lg font-bold text-slate-900 mb-3">Bug Fixes & Security Updates</h4>

							<ul class="space-y-2 text-sm text-slate-600">
								<li class="flex items-start gap-2">
									<i class="fas fa-wrench text-amber-500 mt-0.5 flex-shrink-0"></i>
									Resolved data synchronization issues
								</li>
								<li class="flex items-start gap-2">
									<i class="fas fa-shield-alt text-emerald-500 mt-0.5 flex-shrink-0"></i>
									Enhanced system security protocols
								</li>
								<li class="flex items-start gap-2">
									<i class="fas fa-wrench text-amber-500 mt-0.5 flex-shrink-0"></i>
									Fixed reporting module errors
								</li>
								<li class="flex items-start gap-2">
									<i class="fas fa-paint-brush text-blue-500 mt-0.5 flex-shrink-0"></i>
									Updated user interface components
								</li>
							</ul>
						</div>
					</div>
				</article>

				<!-- Timeline Item 4 (Infrastructure) -->
				<article class="update-item relative flex flex-col md:flex-row gap-8" data-system="all">
					<!-- Date Column (Desktop) - Right Side -->
					<div class="hidden md:block md:w-1/2 md:order-2 pl-12">
						<div class="sticky top-24">
							<time class="text-sm font-semibold text-slate-500" datetime="2026-01-05">January 5,
								2026</time>
						</div>
					</div>

					<!-- Timeline Dot (End) -->
					<div class="absolute left-0 md:left-1/2 w-4 h-4 bg-slate-300 rounded-full border-4 border-white shadow-lg -translate-x-1/2 z-10"
						aria-hidden="true"></div>

					<!-- Content Column -->
					<div class="ml-8 md:ml-0 md:w-1/2 md:order-1 md:pr-12 md:text-right">
						<div
							class="bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:shadow-lg transition-shadow duration-300 md:text-left">
							<!-- Mobile Date -->
							<time class="text-sm font-semibold text-slate-500 mb-3 md:hidden block"
								datetime="2026-01-05">
								<i class="far fa-calendar mr-1"></i>January 5, 2026
							</time>

							<div class="flex flex-wrap items-center gap-2 mb-4">
								<span class="px-3 py-1 bg-maroon-100 text-maroon-800 text-xs font-bold rounded-full">All
									Systems</span>
								<span
									class="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-medium rounded-full ml-auto">Infrastructure</span>
							</div>

							<h4 class="text-lg font-bold text-slate-900 mb-3">Server Migration Completed</h4>

							<ul class="space-y-2 text-sm text-slate-600">
								<li class="flex items-start gap-2">
									<i class="fas fa-server text-maroon-600 mt-0.5 flex-shrink-0"></i>
									Migrated to new high-performance servers
								</li>
								<li class="flex items-start gap-2">
									<i class="fas fa-chart-line text-emerald-500 mt-0.5 flex-shrink-0"></i>
									Improved system uptime and reliability
								</li>
								<li class="flex items-start gap-2">
									<i class="fas fa-database text-blue-500 mt-0.5 flex-shrink-0"></i>
									Enhanced backup and disaster recovery
								</li>
								<li class="flex items-start gap-2">
									<i class="fas fa-tachometer-alt text-emerald-500 mt-0.5 flex-shrink-0"></i>
									Reduced system latency by 40%
								</li>
							</ul>
						</div>
					</div>
				</article>
			</div>

			<!-- View All Updates Link -->
			<div class="mt-12 text-center">
				<a href="#all-updates"
					class="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors focus-ring">
					<i class="fas fa-history"></i>
					View Complete Changelog
				</a>
			</div>
		</div>
	</section>

	<!-- ========================================
		 FOOTER
	======================================== -->
	<footer class="bg-slate-900 text-white pt-16 pb-8" role="contentinfo">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

			<!-- Footer Main Content -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

				<!-- Brand Column -->
				<div class="lg:col-span-2">
					<div class="flex items-center gap-3 mb-6">
						<img src="public/600x600 CSU Logo.png" alt="CSU Logo" class="w-12 h-12 object-contain">
						<div>
							<h4 class="text-xl font-bold">MyCSU</h4>
							<p class="text-gold-500 text-sm font-medium">University Portal</p>
						</div>
					</div>
					<p class="text-slate-400 text-sm leading-relaxed mb-6 max-w-md">
						MyCSU is the unified digital gateway for Cagayan State University, providing secure access to
						essential systems and services for students, faculty, and staff.
					</p>
					<div class="flex items-center gap-4">
						<a href="#"
							class="w-10 h-10 bg-slate-800 hover:bg-maroon-800 rounded-lg flex items-center justify-center transition-colors focus-ring"
							aria-label="Facebook">
							<i class="fab fa-facebook-f text-white"></i>
						</a>
						<a href="#"
							class="w-10 h-10 bg-slate-800 hover:bg-maroon-800 rounded-lg flex items-center justify-center transition-colors focus-ring"
							aria-label="Twitter">
							<i class="fab fa-twitter text-white"></i>
						</a>
						<a href="#"
							class="w-10 h-10 bg-slate-800 hover:bg-maroon-800 rounded-lg flex items-center justify-center transition-colors focus-ring"
							aria-label="YouTube">
							<i class="fab fa-youtube text-white"></i>
						</a>
					</div>
				</div>

				<!-- Quick Links -->
				<div>
					<h5 class="text-lg font-semibold mb-6">Quick Links</h5>
					<ul class="space-y-3">
						<li>
							<a href="#systems"
								class="text-slate-400 hover:text-gold-500 transition-colors text-sm flex items-center gap-2">
								<i class="fas fa-chevron-right text-xs"></i>University Systems
							</a>
						</li>
						<li>
							<a href="#announcements"
								class="text-slate-400 hover:text-gold-500 transition-colors text-sm flex items-center gap-2">
								<i class="fas fa-chevron-right text-xs"></i>Announcements
							</a>
						</li>
						<li>
							<a href="#updates"
								class="text-slate-400 hover:text-gold-500 transition-colors text-sm flex items-center gap-2">
								<i class="fas fa-chevron-right text-xs"></i>System Updates
							</a>
						</li>
						<li>
							<a href="#help"
								class="text-slate-400 hover:text-gold-500 transition-colors text-sm flex items-center gap-2">
								<i class="fas fa-chevron-right text-xs"></i>Help & Support
							</a>
						</li>
						<li>
							<a href="#privacy"
								class="text-slate-400 hover:text-gold-500 transition-colors text-sm flex items-center gap-2">
								<i class="fas fa-chevron-right text-xs"></i>Privacy Policy
							</a>
						</li>
					</ul>
				</div>

				<!-- Contact Info -->
				<div>
					<h5 class="text-lg font-semibold mb-6">Contact MIS Office</h5>
					<ul class="space-y-4">
						<li class="flex items-start gap-3">
							<div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
								<i class="fas fa-map-marker-alt text-gold-500 text-sm"></i>
							</div>
							<address class="text-sm text-slate-400 not-italic">
								MIS Office, Admin Building<br>
								CSU Main Campus<br>
								Tuguegarao City, Cagayan
							</address>
						</li>
						<li class="flex items-center gap-3">
							<div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
								<i class="fas fa-phone text-gold-500 text-sm"></i>
							</div>
							<span class="text-sm text-slate-400">(078) 844-0099</span>
						</li>
						<li class="flex items-center gap-3">
							<div class="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
								<i class="fas fa-envelope text-gold-500 text-sm"></i>
							</div>
							<a href="mailto:mis@csu.edu.ph"
								class="text-sm text-slate-400 hover:text-gold-500 transition-colors">mis@csu.edu.ph</a>
						</li>
					</ul>
				</div>
			</div>

			<!-- Footer Bottom -->
			<div class="pt-8 border-t border-slate-800">
				<div class="flex flex-col md:flex-row items-center justify-between gap-4">
					<p class="text-slate-500 text-sm text-center md:text-left">
						&copy; 2026 Cagayan State University — Management Information Systems Office. All rights
						reserved.
					</p>
					<div class="flex items-center gap-2 text-slate-500 text-sm">
						<span class="relative flex h-2 w-2">
							<span
								class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
							<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
						</span>
						All systems operational
					</div>
				</div>
			</div>
		</div>
	</footer>

	<!-- ========================================
		 LOGIN MODAL
	======================================== -->
	<div id="loginModal" class="hidden fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4"
		role="dialog" aria-modal="true" aria-labelledby="loginModalTitle">
		<div class="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden">
			<div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
				<h3 id="loginModalTitle" class="text-xl font-bold text-slate-900">Sign in to MyCSU</h3>
				<button id="closeLoginModal"
					class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors focus-ring"
					aria-label="Close sign in modal">
					<i class="fas fa-times"></i>
				</button>
			</div>
			<div class="px-6 py-6 space-y-5">
				<button id="loginGoogleBtn" type="button"
					class="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors focus-ring">
					<i class="fab fa-google mr-2"></i>Continue with Google
				</button>
				<div id="switchAccountSection"
					class="hidden rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
					<p class="text-xs text-slate-500 mb-3">
						Signed in as <span id="currentUserEmail" class="font-semibold text-slate-700"></span>
					</p>
					<button id="switchAccountBtn" type="button"
						class="w-full py-2.5 bg-maroon-800 text-white rounded-xl text-sm font-semibold hover:bg-maroon-900 transition-colors focus-ring">
						Switch account
					</button>
				</div>
				<p class="text-xs text-slate-500 text-center">
					Sign in with your CSU Google account. Access is granted based on system authorization.
				</p>
			</div>
		</div>
	</div>

	<!-- ========================================
		 SYSTEM ACCESS (e.g. OFES not registered)
	======================================== -->
	<div id="systemAccessModal" class="hidden fixed inset-0 modal-backdrop z-[60] flex items-center justify-center p-4"
		role="alertdialog" aria-modal="true" aria-labelledby="systemAccessModalTitle">
		<div class="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
			<div class="flex items-center justify-between px-6 py-5 border-b border-slate-100">
				<div class="flex items-center gap-3 min-w-0 pr-2">
					<span
						class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700"
						aria-hidden="true">
						<i class="fas fa-exclamation-triangle"></i>
					</span>
					<h3 id="systemAccessModalTitle" class="text-lg font-bold text-slate-900 leading-tight">Access notice
					</h3>
				</div>
				<button id="closeSystemAccessModal" type="button"
					class="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors focus-ring"
					aria-label="Close dialog">
					<i class="fas fa-times"></i>
				</button>
			</div>
			<div class="px-6 py-5">
				<p id="systemAccessModalBody" class="text-slate-600 text-sm leading-relaxed"></p>
			</div>
			<div class="px-6 pb-6">
				<button id="systemAccessModalOk" type="button"
					class="w-full py-3 bg-maroon-800 text-white rounded-xl font-semibold hover:bg-maroon-900 transition-colors focus-ring">
					Got it
				</button>
			</div>
		</div>
	</div>

	<!-- ========================================
		 ANNOUNCEMENT MODAL
	======================================== -->
	<div id="announcementModal" class="hidden fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4"
		role="dialog" aria-modal="true" aria-labelledby="modalTitle">
		<div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">

			<!-- Modal Header -->
			<div class="sticky top-0 bg-white border-b border-slate-100 px-6 py-5">
				<div class="flex items-start justify-between gap-4">
					<div class="flex-1">
						<div class="flex items-center gap-2 mb-2">
							<span id="modalCategory"
								class="px-3 py-1 bg-maroon-100 text-maroon-800 text-xs font-semibold rounded-full">Category</span>
							<span id="modalDate" class="text-sm text-slate-500"></span>
						</div>
						<h3 id="modalTitle" class="text-xl lg:text-2xl font-bold text-slate-900"></h3>
					</div>
					<button id="closeModal"
						class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors focus-ring"
						aria-label="Close modal">
						<i class="fas fa-times"></i>
					</button>
				</div>
			</div>

			<!-- Modal Body -->
			<div class="px-6 py-6 max-h-[60vh] overflow-y-auto">
				<div id="modalContent" class="prose prose-slate max-w-none text-slate-700"></div>
			</div>

			<!-- Modal Footer -->
			<div class="sticky bottom-0 bg-slate-50 border-t border-slate-100 px-6 py-4">
				<button id="closeModalBtn"
					class="w-full py-3 bg-maroon-800 text-white rounded-xl font-semibold hover:bg-maroon-900 transition-colors focus-ring">
					Close Announcement
				</button>
			</div>
		</div>
	</div>

	<!-- ========================================
		 TOAST NOTIFICATION
	======================================== -->
	<div id="systemLoadingOverlay" class="hidden fixed inset-0 z-[9999] items-center justify-center">
		<div class="absolute inset-0 system-loading-bg"></div>
		<div class="absolute inset-0 system-loading-grid opacity-30"></div>
		<div class="system-loading-orb" style="top: 12%; left: 8%;"></div>
		<div class="system-loading-orb" style="bottom: 8%; right: 10%; animation-delay: -3s;"></div>
		<div class="relative w-full max-w-md mx-auto text-center px-6">
			<div class="system-network">
				<span class="system-loading-ring"></span>
				<span class="system-node n1"></span>
				<span class="system-node n2"></span>
				<span class="system-node n3"></span>
				<span class="system-node n4"></span>
				<div
					class="system-loading-logo absolute inset-[32px] rounded-full bg-white/90 shadow-lg flex items-center justify-center">
					<img src="<?= htmlspecialchars($assetHost) ?>/assets/images/csulogoweb.png" alt="CSU Logo"
						class="w-14 h-14 object-contain">
				</div>
			</div>
			<h2 class="text-white text-xl font-semibold mb-2">Signing in with MyCSU</h2>
			<p class="text-white/80 text-sm">Connecting to MIS secure network...</p>
			<div class="system-loading-bar"><span></span></div>
			<div class="system-loading-spinner mt-5"></div>
		</div>
	</div>

	<!-- ========================================
		 TOAST NOTIFICATION
	======================================== -->
	<div id="toast" class="hidden fixed bottom-6 right-6 z-50 animate-slide-in-right" role="alert" aria-live="polite">
		<div class="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
			<div id="toastIcon"
				class="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
				<i class="fas fa-check"></i>
			</div>
			<div>
				<p id="toastTitle" class="font-semibold">Success</p>
				<p id="toastMessage" class="text-sm text-slate-400">Action completed successfully.</p>
			</div>
			<button id="closeToast" class="text-slate-400 hover:text-white transition-colors"
				aria-label="Dismiss notification">
				<i class="fas fa-times"></i>
			</button>
		</div>
	</div>

	<!-- JavaScript -->
	<script src="app.js"></script>
</body>

</html>