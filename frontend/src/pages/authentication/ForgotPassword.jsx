import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { EnvelopeIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import Button from "../../components/button/Button";
import TextField from "../../components/textField/TextField";
import { forgotPassword } from "../../api/authenticationApi";
import { useNotification } from "../../hooks/useNotification";

const ForgotPassword = () => {
  const { translate } = useLanguage();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showNotification(translate("pleaseFillAllFields"), "error");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
      showNotification(translate("passwordResetEmailSent"), "success");
      navigate("/login");
    } catch (err) {
      console.error("Forgot password error:", err);
      const message =
        err.response?.data?.error ||
        err.message ||
        translate("anErrorHasOccured");
      showNotification(message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`absolute top-0 left-0 h-full w-full bg-white p-6 sm:p-8 lg:p-12 flex items-center justify-center transition-transform duration-700 ease-in-out transform z-10 translate-x-0`}
    >
      {/* Back arrow to return to login (same behavior as SignUp) */}
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
          <h1 className="text-3xl font-bold text-gray-900">
            {translate("forgotPassword")}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {translate("forgotPasswordSubtitle")}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <TextField
              id="email-address2"
              name="email"
              type="email"
              autoComplete="email"
              required={true}
              placeholder={translate("emailAddres")}
              value={email}
              IconLeft={EnvelopeIcon}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {translate("sendResetLink")}
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          <Button variant="text" onClick={() => navigate("/login")}>
            {translate("backToLogin")}
          </Button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
