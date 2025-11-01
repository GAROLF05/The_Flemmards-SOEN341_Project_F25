import { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import Select from '../../components/select/Select';
import Signup from './Signup';
import Login from './Login';
import { login, signup } from '../../api/authenticationApi';

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

		// Validate form
		if (!loginForm.email || !loginForm.password) {
			showNotification(translate("pleaseFillAllFields") || "Please fill in all fields", 'error');
			return;
		}

		// Prepare data for backend (backend accepts email or username as usernameEmail)
		const data = {
			usernameEmail: loginForm.email.trim(),
			password: loginForm.password,
			role: loginForm.role, // Send selected role to backend
		};

		console.log('Attempting login with:', { email: data.usernameEmail });

		login(data)
			.then(response => {
				console.log('Login response:', response);
				
				// axiosClient interceptor returns response.data directly
				if (response && response.token) {
					localStorage.setItem("auth-token", response.token);
					console.log('Token stored in localStorage');
				}

				const role = response?.user?.role?.toLowerCase() || '';

				// Navigate based on user role from database
				if (role === "student")
					navigate("/student");
				else if (role === "organizer")
					navigate("/organizer");
				else if (role === "admin")
					navigate("/admin");
				else
					navigate("/student"); // Default fallback
			})
			.catch(error => {
				console.error('Login error:', error);
				console.error('Error response:', error.response);
				
				const errorMessage = error.response?.data?.error || error.message || translate("anErrorHasOccured");
				
				if (error.response?.status === 401) {
					showNotification(translate("invalidCredentials") || "Invalid email or password", 'error');
				} else if (error.response?.status === 400) {
					showNotification(errorMessage, 'error');
				} else if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
					showNotification("Cannot connect to server. Please check if the backend is running.", 'error');
				} else {
					showNotification(errorMessage || "An error occurred. Please try again.", 'error');
				}
			});
	};

	const handleSignUp = (e) => {
		e.preventDefault();

		// Validate password confirmation
		if (signUpForm.password !== signUpForm.confirmPassword) {
			showNotification(translate("passwordsDoNotMatch") || "Passwords do not match", 'error');
			return;
		}

		// Validate password length
		if (signUpForm.password.length < 6) {
			showNotification(translate("passwordTooShort") || "Password must be at least 6 characters", 'error');
			return;
		}

		// Prepare data for backend
		// Backend expects: name, username (optional), email, password, role ("Student" or "Organizer")
		const data = {
			name: signUpForm.fullName.trim(),
			username: signUpForm.fullName.trim() || null,
			email: signUpForm.email.trim(),
			password: signUpForm.password,
			role: "Student" // Default to Student for signup (can be changed later if needed)
		};

		signup(data)
			.then(() => {
				showNotification(translate("accountCreated") || "Account created successfully", 'success');
				navigate("/login");
			})
			.catch(error => {
				const errorMessage = error.response?.data?.error || error.message || translate("anErrorHasOccured");
				showNotification(errorMessage, 'error');
			});
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
