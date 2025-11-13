import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
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
      showNotification(
        translate("pleaseFillAllFields") || "Please fill in all fields",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email: email.trim() });
      showNotification(
        translate("passwordResetEmailSent") ||
          "If an account with that email exists, a reset link has been sent.",
        "success"
      );
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center lg:text-left mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {translate("forgotPassword")}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {translate("forgotPasswordSubtitle") ||
              "Enter your email to receive a password reset link."}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <TextField
              id="email-address"
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
              {translate("sendResetLink") || "Send reset link"}
            </Button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-gray-600">
          <Button variant="text" onClick={() => navigate("/login")}>
            {translate("backToLogin") || "Back to login"}
          </Button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
