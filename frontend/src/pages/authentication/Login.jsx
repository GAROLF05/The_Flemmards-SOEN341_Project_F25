import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { LockClosedIcon, UserIcon } from "@heroicons/react/24/outline";
import Button from "../../components/button/Button";
import Checkbox from "../../components/checkbox/Checkbox";
import ButtonGroup from "../../components/button/ButtonGroup";
import TextField from "../../components/textField/TextField";

const Login = ({ loginForm, setLoginForm, handleLogin }) => {
    const { translate } = useLanguage();
	const navigate = useNavigate();

    const roles = [
		{ value: 'student', label: translate("student") },
		{ value: 'organizer', label: translate("organizer") },
		{ value: 'admin', label: translate("roleAdmin") },
	];

    return (
        <div className="w-full max-w-md">
            <div className="text-center lg:text-left mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{translate("welcomeBack")}</h1>
                <p className="mt-2 text-sm text-gray-600">{translate("selectRoleSubtitle")}</p>
            </div>

            <ButtonGroup
                options={roles}
                value={loginForm.role}
                onChange={value => setLoginForm({ ...loginForm, role: value })}
                className="mb-6"
            />

            <form className="space-y-6" onSubmit={handleLogin}>
                <div className="space-y-4">
                    <TextField
                        id="email-address"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required={true}
                        placeholder={translate("emailAddres")}
                        value={loginForm.email}
                        IconLeft={UserIcon}
                        onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                        className="w-full"
                    />

                    <TextField
                        id="password"
                        name="password"
                        type="password"
                        required={true}
                        placeholder={translate("password")}
                        value={loginForm.password}
                        IconLeft={LockClosedIcon}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        className="w-full"
                    />
                </div>
                <div className="flex items-center justify-between mt-6">
                    <Checkbox
                        label={translate("rememberMe")}
                        name="remember-me"
                        id="remember-me"
                        checked={loginForm.rememberMe}
                        onChange={e => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
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
                    {translate("signUpNow")}
                </Button>
            </p>
        </div>
    );
};

export default Login;
