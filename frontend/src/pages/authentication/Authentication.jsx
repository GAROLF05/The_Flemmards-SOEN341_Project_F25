import { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import Select from '../../components/select/Select';
import Signup from './Signup';
import Login from './Login';
import { login } from '../../api/authenticationApi';

export default function Authentication() {
	const [loginForm, setLoginForm] = useState({
		email: '',
		password: '',
		role: 'student',
		rememberMe: false,
	});
	const [signUpForm, setSignUpForm] = useState({
		fullName: '',
		email: '',
		password: '',
		confirmPassword: '',
	});
	const { translate, changeLanguage, currentLanguage, availableLanguages } = useLanguage();
	const { showNotification } = useNotification();
	const navigate = useNavigate();

	const location = useLocation();
	const isSignUp = location.pathname
		.split('/')
		.filter(Boolean)
		.includes('signup');

	const handleLogin = (e) => {
		e.preventDefault();

		const data = {
			usernameEmail: loginForm.email,
			password: loginForm.password,
			role: loginForm.role,
			rememberMe: loginForm.rememberMe,
		}

		login(data)
			.then(response => {
				localStorage.setItem("auth-token", response.data.token);

				const role = response.data.user.role.toLowerCase();

				if (role === "student")
					navigate("/student");
				else if (role === "organizer")
					navigate("/organizer");
				else if (role === "admin")
					navigate("/admin");
			})
			.catch(error => {
				if (error.status === 401)
					showNotification(translate("invalidCredentials"), 'error');
				else
					showNotification(translate("anErrorHasOccured"), 'error');
			});
	};

	const handleSignUp = (e) => {
		e.preventDefault();
		showNotification('This is just a test for notifications.', 'error');

		// todo: handle signup call here
	};

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
					<h1 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">{translate("appTitle")}</h1>
					<p className="text-lg lg:text-xl text-indigo-100">
						{translate("loginSubtitle")}
					</p>
				</div>
			</div>

			{/* Right Panel: Forms */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 relative overflow-hidden">
				<Select
					label={translate("language")}
					value={currentLanguage.toLowerCase()}
					onChange={lang => changeLanguage(lang)}
					options={availableLanguages.map(lang => ({ value: lang.toLowerCase(), label: lang.toUpperCase() }))}
					className="absolute top-6 right-6 sm:top-8 sm:right-8 z-2 w-[90px]"
				/>

				{/* LOGIN FORM CONTAINER */}
				<Login
					loginForm={loginForm}
					setLoginForm={setLoginForm}
					handleLogin={handleLogin}
				/>

				{/* SIGN UP SLIDER PANEL */}
				<Signup
					signUpForm={signUpForm}
					setSignUpForm={setSignUpForm}
					handleSignUp={handleSignUp}
					isSignUp={isSignUp}
				/>
			</div>
		</div>
	);
}
