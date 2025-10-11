import { ArrowLeftIcon, EnvelopeIcon, LockClosedIcon, UserIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "../../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import Button from "../../components/button/Button";
import TextField from "../../components/textField/TextField";

const Signup = ({ signUpForm, setSignUpForm, handleSignUp, isSignUp }) => {
    const { translate } = useLanguage();
	const navigate = useNavigate();

    return (
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
                        placeholder={translate("fullName")}
                        value={signUpForm.fullName}
                        IconLeft={UserIcon}
                        onChange={(e) => setSignUpForm({ ...signUpForm, fullName: e.target.value })}
                        className="w-full"
                    />

                    <TextField
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required={true}
                        placeholder={translate("emailAddres")}
                        value={signUpForm.email}
                        IconLeft={EnvelopeIcon}
                        onChange={(e) => setSignUpForm({ ...signUpForm, email: e.target.value })}
                        className="w-full"
                    />

                    <TextField
                        id="reset-password"
                        name="reset-password"
                        type="password"
                        required={true}
                        placeholder={translate("password")}
                        value={signUpForm.password}
                        IconLeft={LockClosedIcon}
                        onChange={(e) => setSignUpForm({ ...signUpForm, password: e.target.value })}
                        className="w-full"
                    />

                    <TextField
                        id="confirm-password"
                        name="confirm-password"
                        type="password"
                        required={true}
                        placeholder={translate("confirmPassword")}
                        value={signUpForm.confirmPassword}
                        IconLeft={LockClosedIcon}
                        onChange={(e) => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                        className="w-full"
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            className="w-full"
                        >
                            {translate("signUp")}
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
    );
};

export default Signup;
