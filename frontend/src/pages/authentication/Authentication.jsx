import { useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification';
import Select from '../../components/select/Select';
import Signup from './SignUp';
import Login from './Login';
import { login, signup } from '../../api/authenticationApi';
import { createOrganization } from '../../api/organizationApi';

export default function Authentication() {
	const [loginForm, setLoginForm] = useState({
		email: '',
		password: '',
		role: 'student',
		rememberMe: false,
	});
	const [signUpForm, setSignUpForm] = useState({
		role: 'student',
		fullName: '',
		email: '',
		password: '',
		confirmPassword: '',
		organizationName: '',
		organizationDescription: '',
		organizationWebsite: '',
		organizationEmail: '',
		organizationPhone: '',
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
				// axiosClient interceptor returns response.data directly
				if (response && response.token) {
					localStorage.setItem("auth-token", response.token);
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

	const handleSignUp = async (e) => {
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

		const isOrganizer = signUpForm.role === 'organizer';

		// Validate organizer-specific fields
		if (isOrganizer) {
			if (!signUpForm.organizationName?.trim()) {
				showNotification("Organization name is required", 'error');
				return;
			}
			if (!signUpForm.organizationDescription?.trim()) {
				showNotification("Organization description is required", 'error');
				return;
			}
			// Website is optional, but if provided, validate URL format
			if (signUpForm.organizationWebsite?.trim()) {
				try {
					new URL(signUpForm.organizationWebsite.trim());
				} catch {
					showNotification("Please enter a valid website URL (e.g., https://example.com)", 'error');
					return;
				}
			}
			if (!signUpForm.organizationEmail?.trim()) {
				showNotification("Organization email is required", 'error');
				return;
			}
			if (!signUpForm.organizationPhone?.trim()) {
				showNotification("Phone number is required", 'error');
				return;
			}
		}

		// Prepare user data for backend
		// Backend expects: name, username (optional), email, password, role ("Student" or "Organizer")
		const userData = {
			name: signUpForm.fullName.trim(),
			username: signUpForm.fullName.trim() || null,
			email: signUpForm.email.trim(),
			password: signUpForm.password,
			role: isOrganizer ? "Organizer" : "Student"
		};

		try {
			// Step 1: Sign up the user
			await signup(userData);

			if (isOrganizer) {
				// Step 2: Login the user to get authentication token
				const loginResponse = await login({
					usernameEmail: signUpForm.email.trim(),
					password: signUpForm.password,
					role: 'organizer'
				});

				if (loginResponse && loginResponse.token) {
					localStorage.setItem("auth-token", loginResponse.token);
				}

				// Step 3: Create the organization
				// Website is optional in frontend, but required in backend model
				// Use a placeholder if not provided
				const websiteUrl = signUpForm.organizationWebsite?.trim() || 
					`https://${signUpForm.organizationName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`;

				const organizationData = {
					name: signUpForm.organizationName.trim(),
					description: signUpForm.organizationDescription.trim(),
					website: websiteUrl,
					contact: {
						email: signUpForm.organizationEmail.trim(),
						phone: signUpForm.organizationPhone.trim()
					}
				};

				await createOrganization(organizationData);
				showNotification(translate("accountCreated") || "Account and organization created successfully. Awaiting admin approval.", 'success');
				navigate("/organizer");
			} else {
				// Student signup - just redirect to login
				showNotification(translate("accountCreated") || "Account created successfully", 'success');
				navigate("/login");
			}
		} catch (error) {
			console.error('Signup error:', error);
			const errorMessage = error.response?.data?.error || error.message || translate("anErrorHasOccured");
			showNotification(errorMessage, 'error');
		}
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
