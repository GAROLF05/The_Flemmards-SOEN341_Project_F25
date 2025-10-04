import { useState, useRef, useEffect } from 'react';

// You can replace these with your actual SVG icons or use a library like lucide-react
const UserIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400">
		<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
		<circle cx="12" cy="7" r="4"></circle>
	</svg>
);

const LockIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400">
		<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
		<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
	</svg>
);

const ArrowLeftIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
		<line x1="19" y1="12" x2="5" y2="12"></line>
		<polyline points="12 19 5 12 12 5"></polyline>
	</svg>
);

const translations = {
	en: {
		mainTitle: "Flemmards",
		mainSubtitle: "Your ultimate platform for discovering and booking amazing events.",
		formTitle: "Welcome Back!",
		formSubtitle: "Please select your role and sign in to continue.",
		roleStudent: "Student",
		roleManager: "Manager",
		roleAdmin: "Admin",
		emailPlaceholder: "Email address",
		passwordPlaceholder: "Password",
		rememberMe: "Remember me",
		forgotPassword: "Forgot password?",
		signIn: "Sign in",
		notMember: "Not a member yet?",
		signUp: "Sign up now",
		createAccount: "Create your account",
		createAccountSubtitle: "Join our community of event lovers.",
		fullNamePlaceholder: "Full Name",
		confirmPasswordPlaceholder: "Confirm Password",
		alreadyMember: "Already a member?",
		signUpButton: "Sign up",
		goBack: "Go back",
	},
	fr: {
		mainTitle: "Flemmards",
		mainSubtitle: "Votre plateforme ultime pour découvrir et réserver des événements incroyables.",
		formTitle: "Bon retour!",
		formSubtitle: "Veuillez sélectionner votre rôle et vous connecter pour continuer.",
		roleStudent: "Étudiant",
		roleManager: "Gérant",
		roleAdmin: "Admin",
		emailPlaceholder: "Adresse e-mail",
		passwordPlaceholder: "Mot de passe",
		rememberMe: "Se souvenir de moi",
		forgotPassword: "Mot de passe oublié?",
		signIn: "Se connecter",
		notMember: "Pas encore membre?",
		signUp: "Inscrivez-vous maintenant",
		createAccount: "Créez votre compte",
		createAccountSubtitle: "Rejoignez notre communauté d'amateurs d'événements.",
		fullNamePlaceholder: "Nom complet",
		confirmPasswordPlaceholder: "Confirmez le mot de passe",
		alreadyMember: "Déjà membre?",
		signUpButton: "S'inscrire",
		goBack: "Retourner",
	},
	es: {
		mainTitle: "Flemmards",
		mainSubtitle: "Tu plataforma definitiva para descubrir y reservar eventos increíbles.",
		formTitle: "¡Bienvenido de nuevo!",
		formSubtitle: "Por favor, seleccione su rol e inicie sesión para continuar.",
		roleStudent: "Estudiante",
		roleManager: "Gerente",
		roleAdmin: "Administrador",
		emailPlaceholder: "Dirección de correo electrónico",
		passwordPlaceholder: "Contraseña",
		rememberMe: "Recuérdame",
		forgotPassword: "¿Olvidaste tu contraseña?",
		signIn: "Iniciar sesión",
		notMember: "¿Aún no eres miembro?",
		signUp: "Regístrate ahora",
		createAccount: "Crea tu cuenta",
		createAccountSubtitle: "Únete a nuestra comunidad de amantes de los eventos.",
		fullNamePlaceholder: "Nombre completo",
		confirmPasswordPlaceholder: "Confirmar contraseña",
		alreadyMember: "¿Ya eres miembro?",
		signUpButton: "Regístrate",
		goBack: "Regresar",
	}
};


export default function Login() {
	const [role, setRole] = useState('student');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [language, setLanguage] = useState('en');
	const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
	const [isSignUp, setIsSignUp] = useState(false);
	const langDropdownRef = useRef(null);


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
		console.log('Logging in with:', { email, password, role, language });
	};

	const handleSignUp = (e) => {
		e.preventDefault();
		// In a real app, you would handle new user registration here
	};

  	const t = translations[language];

	const RoleSelector = ({ currentRole, setRole }) => {
		const roles = [
			{ id: 'student', label: t.roleStudent },
			{ id: 'manager', label: t.roleManager },
			{ id: 'admin', label: t.roleAdmin },
		];

		return (
			<div className="flex w-full rounded-lg bg-gray-100 p-1 mb-6">
				{roles.map(r => (
					<button
						key={r.id}
						type="button"
						onClick={() => setRole(r.id)}
						className={`w-full py-2.5 text-sm font-semibold text-center rounded-md transition-all duration-300 ease-in-out
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
					className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
				>
					{language.toUpperCase()}
					<svg className="-mr-1 ml-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
					</svg>
				</button>

				{isLangDropdownOpen && (
					<div className="absolute right-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
						<div className="py-1">
							{Object.keys(translations).map((lang) => (
								<button
									key={lang}
									onClick={() => {
										setLanguage(lang);
										setIsLangDropdownOpen(false);
									}}
									className="block w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
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
					src="./public/login-background.png"
					alt="Abstract background of an event"
					className="absolute h-full w-full object-cover opacity-30"
				/>
				<div className="relative text-center p-12 text-white">
					<h1 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">{t.mainTitle}</h1>
					<p className="text-lg lg:text-xl text-indigo-100">
						{t.mainSubtitle}
					</p>
				</div>
			</div>

			{/* Right Panel: Forms */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative overflow-hidden">
				<LanguageSelector />

				{/* LOGIN FORM CONTAINER */}
				<div className="w-full max-w-md">
					<div className="text-center lg:text-left mb-8">
						<h1 className="text-3xl font-bold text-gray-900">{t.formTitle}</h1>
						<p className="mt-2 text-sm text-gray-600">{t.formSubtitle}</p>
					</div>

					<RoleSelector currentRole={role} setRole={setRole} />

					<form className="space-y-6" onSubmit={handleLogin}>
						<div className="space-y-4">
							<div className="relative">
								<UserIcon />
								<input id="email-address" name="email" type="email" autoComplete="email" required className="w-full pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} />
							</div>
							<div className="relative">
								<LockIcon />
								<input id="password" name="password" type="password" autoComplete="current-password" required className="w-full pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder={t.passwordPlaceholder} value={password} onChange={(e) => setPassword(e.target.value)} />
							</div>
						</div>
						<div className="flex items-center justify-between mt-6">
							<div className="flex items-center">
								<input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" />
								<label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">{t.rememberMe}</label>
							</div>
							<div className="text-sm">
								<a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">{t.forgotPassword}</a>
							</div>
						</div>
						<div>
							<button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105">{t.signIn}</button>
						</div>
					</form>
					<p className="mt-8 text-center text-sm text-gray-600">
						{t.notMember}{' '}
						<button onClick={() => setIsSignUp(true)} className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none">
							{t.signUp}
						</button>
					</p>
				</div>

				{/* SIGN UP SLIDER PANEL */}
				<div className={`absolute top-0 left-0 h-full w-full bg-white p-6 sm:p-8 lg:p-12 flex items-center justify-center transition-transform duration-700 ease-in-out transform z-10 ${isSignUp ? 'translate-x-0' : 'translate-x-full'}`}>
					<button
						type="button"
						onClick={() => setIsSignUp(false)}
						className="absolute top-6 left-6 sm:top-8 sm:left-8 text-gray-500 hover:text-gray-800 transition-colors"
						aria-label={t.goBack}
					>
						<ArrowLeftIcon />
					</button>
					<div className="w-full max-w-md">
						<div className="text-center lg:text-left mb-8">
							<h1 className="text-3xl font-bold text-gray-900">{t.createAccount}</h1>
							<p className="mt-2 text-sm text-gray-600">{t.createAccountSubtitle}</p>
						</div>

						<form className="space-y-4" onSubmit={handleSignUp}>
							<div className="relative">
								<UserIcon />
								<input name="fullname" type="text" required className="w-full pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder={t.fullNamePlaceholder} />
							</div>
							<div className="relative">
								<UserIcon />
								<input name="email" type="email" autoComplete="email" required className="w-full pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder={t.emailPlaceholder} />
							</div>
							<div className="relative">
								<LockIcon />
								<input name="password" type="password" required className="w-full pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder={t.passwordPlaceholder} />
							</div>
							<div className="relative">
								<LockIcon />
								<input name="confirm-password" type="password" required className="w-full pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" placeholder={t.confirmPasswordPlaceholder} />
							</div>
							<div className="pt-2">
								<button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-transform transform hover:scale-105">{t.signUpButton}</button>
							</div>
						</form>
						<p className="mt-8 text-center text-sm text-gray-600">
							{t.alreadyMember}{' '}
							<button onClick={() => setIsSignUp(false)} className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none">
								{t.signIn}
							</button>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
