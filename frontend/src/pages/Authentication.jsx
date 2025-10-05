import { useState, useRef, useEffect } from 'react';
import { UserIcon, EnvelopeIcon,  ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../hooks/useLanguage';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';

export default function Authentication() {
	const [role, setRole] = useState('student');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
	const langDropdownRef = useRef(null);
	const { translate, changeLanguage, currentLanguage, availableLanguages } = useLanguage();
	const { showNotification } = useNotification();
	const navigate = useNavigate();

	const location = useLocation();
	const isSignUp = location.pathname
		.split('/')
		.filter(Boolean)
		.includes('signup');

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
				setIsLangDropdownOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [langDropdownRef]);

	const handleLogin = (e) => {
		e.preventDefault();
	};

	const handleSignUp = (e) => {
		e.preventDefault();
		// todo: handle signup call here
	};

	const RoleSelector = ({ currentRole, setRole }) => {
		const roles = [
			{ id: 'student', label: translate("roleStudent") },
			{ id: 'manager', label: translate("roleManager") },
			{ id: 'admin', label: translate("roleAdmin") },
		];

		return (
			<div className="flex w-full rounded-lg bg-gray-100 p-1 mb-6">
				{roles.map(r => (
					<button
						key={r.id}
						type="button"
						onClick={() => setRole(r.id)}
						className={`w-full py-2.5 text-sm font-semibold text-center rounded-md transition-all duration-300 ease-in-out cursor-pointer
						${currentRole === r.id
								? 'bg-white text-indigo-600 shadow-sm'
								: 'text-gray-500 hover:bg-gray-200'
							}`}
					>
						{r.label}
					</button>
				))}
			</div>
		);
	};

	const LanguageSelector = () => (
		<div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20">
			<div className="relative" ref={langDropdownRef}>
				<button
					type="button"
					onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
					className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all cursor-pointer"
				>
					{currentLanguage.toUpperCase()}
					<svg className="-mr-1 ml-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
					</svg>
				</button>

				{isLangDropdownOpen && (
					<div className="absolute right-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
						<div className="py-1">
							{availableLanguages.map(lang => (
								<button
									key={lang}
									onClick={() => {
										changeLanguage(lang);
										setIsLangDropdownOpen(false);
									}}
									className="block w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
								>
									{lang.toUpperCase()}
								</button>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);

	return (
		<div className="flex min-h-screen font-sans bg-white">
			{/* Left Panel: Welcome Message & Background Image */}
			<div className="hidden lg:flex w-1/2 items-center justify-center bg-indigo-800 relative">
				<img
					src="/images/login-background.png"
					alt="Abstract background of an event"
					className="absolute h-full w-full object-cover opacity-30"
				/>
				<div className="relative text-center p-12 text-white">
					<h1 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">{translate("mainTitle")}</h1>
					<p className="text-lg lg:text-xl text-indigo-100">
						{translate("mainSubtitle")}
					</p>
				</div>
			</div>

			{/* Right Panel: Forms */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative overflow-hidden">
				<LanguageSelector />

				{/* LOGIN FORM CONTAINER */}
				<div className="w-full max-w-md">
					<div className="text-center lg:text-left mb-8">
						<h1 className="text-3xl font-bold text-gray-900">{translate("formTitle")}</h1>
						<p className="mt-2 text-sm text-gray-600">{translate("formSubtitle")}</p>
					</div>

					<RoleSelector currentRole={role} setRole={setRole} />

					<form className="space-y-6" onSubmit={handleLogin}>
						<div className="space-y-4">
							<div className="relative">
								<UserIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
								<input id="email-address" name="email" type="email" autoComplete="email" required className="w-full pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder={translate("emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} />
							</div>
							<div className="relative">
								<LockClosedIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
								<input id="password" name="password" type="password" autoComplete="current-password" required className="w-full pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder={translate("passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} />
							</div>
						</div>
						<div className="flex items-center justify-between mt-6">
							<div className="flex items-center">
								<input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
								<label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">{translate("rememberMe")}</label>
							</div>
							<div className="text-sm">
								<a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">{translate("forgotPassword")}</a>
							</div>
						</div>
						<div>
							<button
								type="submit"
								className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105 cursor-pointer"
								onClick={() => showNotification('This is just a test for notifications.', 'success')}
							>
								{translate("signIn")}
							</button>
						</div>
					</form>
					<p className="mt-8 text-center text-sm text-gray-600">
						{translate("notMember")}{' '}
						<button onClick={() => navigate("/signup")} className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none cursor-pointer">
							{translate("signUp")}
						</button>
					</p>
				</div>

				{/* SIGN UP SLIDER PANEL */}
				<div className={`absolute top-0 left-0 h-full w-full bg-white p-6 sm:p-8 lg:p-12 flex items-center justify-center transition-transform duration-700 ease-in-out transform z-10 ${isSignUp ? 'translate-x-0' : 'translate-x-full'}`}>
					<button
						type="button"
						onClick={() => navigate("/login")}
						className="absolute top-6 left-6 sm:top-8 sm:left-8 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
						aria-label={translate("goBack")}
					>
						<ArrowLeftIcon className="h-6 w-6 text-gray-900" />
					</button>
					<div className="w-full max-w-md">
						<div className="text-center lg:text-left mb-8">
							<h1 className="text-3xl font-bold text-gray-900">{translate("createAccount")}</h1>
							<p className="mt-2 text-sm text-gray-600">{translate("createAccountSubtitle")}</p>
						</div>

						<form className="space-y-4" onSubmit={handleSignUp}>
							<div className="relative">
								<UserIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
								<input name="fullname" type="text" required className="w-full pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder={translate("fullNamePlaceholder")} />
							</div>
							<div className="relative">
								<EnvelopeIcon  className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
								<input name="email" type="email" autoComplete="email" required className="w-full pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder={translate("emailPlaceholder")} />
							</div>
							<div className="relative">
								<LockClosedIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
								<input name="password" type="password" required className="w-full pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder={translate("passwordPlaceholder")} />
							</div>
							<div className="relative">
								<LockClosedIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
								<input name="confirm-password" type="password" required className="w-full pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder={translate("confirmPasswordPlaceholder")} />
							</div>
							<div className="pt-2">
								<button
									type="submit"
									className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105 cursor-pointer"
									onClick={() => showNotification('This is just a test for notifications.', 'error')}
								>
									{translate("signUpButton")}
								</button>
							</div>
						</form>
						<p className="mt-8 text-center text-sm text-gray-600">
							{translate("alreadyMember")}{' '}
							<button onClick={() => navigate("/login")} className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none cursor-pointer">
								{translate("signIn")}
							</button>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
