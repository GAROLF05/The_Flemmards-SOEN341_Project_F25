import { useState } from 'react';
import { UserIcon, EnvelopeIcon,  ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../hooks/useLanguage';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import Button from '../components/button/Button';
import Checkbox from '../components/checkbox/Checkbox';
import TextField from '../components/textField/TextField';
import ButtonGroup from '../components/button/ButtonGroup';
import Select from '../components/select/Select';

export default function Authentication() {
	const [role, setRole] = useState('student');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [rememberMe, setRememberMe] = useState(false);
	const [fullName, setFullName] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
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

		if (role === "student")
			navigate("/student");
		else if (role === "organizer")
			navigate("/organizer");
		else if (role === "admin")
			navigate("/admin");
	};

	const handleSignUp = (e) => {
		e.preventDefault();
		showNotification('This is just a test for notifications.', 'error');
		
		// todo: handle signup call here
	};

	const RoleSelector = ({ currentRole, setRole }) => {
		const roles = [
			{ value: 'student', label: translate("roleStudent") },
			{ value: 'organizer', label: translate("roleOrganizer") },
			{ value: 'admin', label: translate("roleAdmin") },
		];

		return (
			<ButtonGroup
				options={roles}
				value={currentRole}
				onChange={setRole}
				className="mb-6"
			/>
		);
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
					<h1 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">{translate("mainTitle")}</h1>
					<p className="text-lg lg:text-xl text-indigo-100">
						{translate("mainSubtitle")}
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
				<div className="w-full max-w-md">
					<div className="text-center lg:text-left mb-8">
						<h1 className="text-3xl font-bold text-gray-900">{translate("formTitle")}</h1>
						<p className="mt-2 text-sm text-gray-600">{translate("formSubtitle")}</p>
					</div>

					<RoleSelector currentRole={role} setRole={setRole} />

					<form className="space-y-6" onSubmit={handleLogin}>
						<div className="space-y-4">
							<TextField
								id="email-address"
								name="email"
								type="email"
								autoComplete="email"
								required={true}
								placeholder={translate("emailPlaceholder")}
								value={email}
								IconLeft={UserIcon}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full"
							/>

							<TextField
								id="password"
								name="password"
								type="password"
								required={true}
								placeholder={translate("passwordPlaceholder")}
								value={password}
								IconLeft={LockClosedIcon}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full"
							/>
						</div>
						<div className="flex items-center justify-between mt-6">
							<Checkbox
								label={translate("rememberMe")}
								name="remember-me"
								id="remember-me"
								checked={rememberMe}
								onChange={e => setRememberMe(e.target.checked)}
							/>

							<Button
								variant="text"
								onClick={() => navigate("/login")}
								className="!px-2"
							>
								{translate("forgotPassword")}
							</Button>
						</div>
						<div>
							<Button
								type="submit"
								className="w-full"
							>
								{translate("signIn")}
							</Button>
						</div>
					</form>
					<p className="mt-8 text-center text-sm text-gray-600">
						{translate("notMember")}
						<Button
							variant="text"
							onClick={() => navigate("/signup")}
						>
							{translate("signUp")}
						</Button>
					</p>
				</div>

				{/* SIGN UP SLIDER PANEL */}
				<div className={`absolute top-0 left-0 h-full w-full bg-white p-6 sm:p-8 lg:p-12 flex items-center justify-center transition-transform duration-700 ease-in-out transform z-10 ${isSignUp ? 'translate-x-0' : 'translate-x-full'}`}>
					<Button
						variant="none"
						onClick={() => navigate("/login")}
						aria-label={translate("goBack")}
						className="absolute top-6 left-6 sm:top-8 sm:left-8 text-gray-500 hover:text-gray-800 transition-colors"
					>
						<ArrowLeftIcon className="h-6 w-6 text-gray-900" />
					</Button>

					<div className="w-full max-w-md">
						<div className="text-center lg:text-left mb-8">
							<h1 className="text-3xl font-bold text-gray-900">{translate("createAccount")}</h1>
							<p className="mt-2 text-sm text-gray-600">{translate("createAccountSubtitle")}</p>
						</div>

						<form className="space-y-4" onSubmit={handleSignUp}>
							<TextField
								id="fullname"
								name="fullname"
								type="text"
								autoComplete="fullname"
								required={true}
								placeholder={translate("fullNamePlaceholder")}
								value={fullName}
								IconLeft={UserIcon}
								onChange={(e) => setFullName(e.target.value)}
								className="w-full"
							/>

							<TextField
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required={true}
								placeholder={translate("emailPlaceholder")}
								value={email}
								IconLeft={EnvelopeIcon}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full"
							/>

							<TextField
								id="reset-password"
								name="reset-password"
								type="password"
								required={true}
								placeholder={translate("passwordPlaceholder")}
								value={password}
								IconLeft={LockClosedIcon}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full"
							/>

							<TextField
								id="confirm-password"
								name="confirm-password"
								type="password"
								required={true}
								placeholder={translate("confirmPasswordPlaceholder")}
								value={confirmPassword}
								IconLeft={LockClosedIcon}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="w-full"
							/>

							<div className="pt-2">
								<Button
									type="submit"
									className="w-full"
								>
									{translate("signUpButton")}
								</Button>
							</div>
						</form>
						<p className="mt-8 text-center text-sm text-gray-600">
							{translate("alreadyMember")}
							<Button
								variant="text"
								onClick={() => navigate("/login")}
							>
								{translate("signIn")}
							</Button>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
