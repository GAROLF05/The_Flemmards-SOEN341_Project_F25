import { ArrowLeftIcon, EnvelopeIcon, LockClosedIcon, UserIcon, PhoneIcon, GlobeAltIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "../../hooks/useLanguage";
import { useNavigate } from "react-router-dom";
import Button from "../../components/button/Button";
import TextField from "../../components/textField/TextField";
import ButtonGroup from "../../components/button/ButtonGroup";

const Signup = ({ signUpForm, setSignUpForm, handleSignUp, isSignUp }) => {
    const { translate } = useLanguage();
    const navigate = useNavigate();

    const roles = [
        { value: 'student', label: translate("student") },
        { value: 'organizer', label: translate("organizer") },
    ];

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

                <ButtonGroup
                    options={roles}
                    value={signUpForm.role || 'student'}
                    onChange={value => setSignUpForm({ ...signUpForm, role: value })}
                    className="mb-6"
                />

                <div
                    className="max-h-[calc(100vh-250px)] overflow-y-auto pr-2 signup-form-scroll"
                    style={{
                        scrollbarWidth: 'none', /* Firefox */
                        msOverflowStyle: 'none', /* IE and Edge */
                    }}
                >
                    <style>{`
                        .signup-form-scroll::-webkit-scrollbar {
                            display: none;
                        }
                    `}</style>
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

                        {signUpForm.role === 'organizer' && (
                            <>
                                <TextField
                                    id="organizationName"
                                    name="organizationName"
                                    type="text"
                                    required={true}
                                    placeholder={translate("organizationName")}
                                    value={signUpForm.organizationName || ''}
                                    IconLeft={BuildingOfficeIcon}
                                    onChange={(e) => setSignUpForm({ ...signUpForm, organizationName: e.target.value })}
                                    className="w-full"
                                />

                                <div className="relative">
                                    <BuildingOfficeIcon className="h-5 w-5 absolute left-3 top-4 text-gray-400" />
                                    <style>{`
                                    #organizationDescription::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>
                                    <textarea
                                        id="organizationDescription"
                                        name="organizationDescription"
                                        required={true}
                                        placeholder={translate("organizationDescription")}
                                        value={signUpForm.organizationDescription || ''}
                                        onChange={(e) => setSignUpForm({ ...signUpForm, organizationDescription: e.target.value })}
                                        rows={3}
                                        className="w-full pl-10 pr-3 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none overflow-y-auto"
                                        style={{
                                            scrollbarWidth: 'none', /* Firefox */
                                            msOverflowStyle: 'none', /* IE and Edge */
                                        }}
                                    />
                                </div>

                                <TextField
                                    id="organizationWebsite"
                                    name="organizationWebsite"
                                    type="url"
                                    required={false}
                                    placeholder={translate("organizationWebsiteOptional")}
                                    value={signUpForm.organizationWebsite || ''}
                                    IconLeft={GlobeAltIcon}
                                    onChange={(e) => setSignUpForm({ ...signUpForm, organizationWebsite: e.target.value })}
                                    className="w-full"
                                />

                                <TextField
                                    id="organizationEmail"
                                    name="organizationEmail"
                                    type="email"
                                    required={true}
                                    placeholder={translate("organizationEmail")}
                                    value={signUpForm.organizationEmail || ''}
                                    IconLeft={EnvelopeIcon}
                                    onChange={(e) => setSignUpForm({ ...signUpForm, organizationEmail: e.target.value })}
                                    className="w-full"
                                />

                                <TextField
                                    id="organizationPhone"
                                    name="organizationPhone"
                                    type="tel"
                                    required={true}
                                    placeholder={translate("phoneNumber")}
                                    value={signUpForm.organizationPhone || ''}
                                    IconLeft={PhoneIcon}
                                    onChange={(e) => setSignUpForm({ ...signUpForm, organizationPhone: e.target.value })}
                                    className="w-full"
                                />
                            </>
                        )}

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
                </div>

                <p className="mt-8 text-center text-sm text-gray-600">
                    {signUpForm.role === 'organizer' ? (
                        <>
                            {translate("alreadyRegistered")}
                            <Button
                                variant="text"
                                onClick={() => navigate("/login")}
                            >
                                {translate("signIn")}
                            </Button>
                        </>
                    ) : (
                        <>
                            {translate("alreadyMember")}
                            <Button
                                variant="text"
                                onClick={() => navigate("/login")}
                            >
                                {translate("signIn")}
                            </Button>
                        </>
                    )}
                </p>
            </div>
        </div>
    );
};

export default Signup;
