import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../../hooks/useLanguage";
import { LockClosedIcon } from "@heroicons/react/24/outline";
import Button from "../../components/button/Button";
import TextField from "../../components/textField/TextField";
import { resetPassword } from "../../api/authenticationApi";
import { useNotification } from "../../hooks/useNotification";

const ResetPassword = () => {
  const { translate } = useLanguage();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();

  const tokenFromQuery = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If there's no token in query, stay but show a message
    if (!tokenFromQuery) {
      showNotification(translate("missingToken"), "error");
    }
  }, [tokenFromQuery, showNotification, translate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      showNotification(translate("pleaseFillAllFields"), "error");
      return;
    }
    if (password !== confirmPassword) {
      showNotification(translate("passwordsDoNotMatch"), "error");
      return;
    }
    if (password.length < 6) {
      showNotification(translate("passwordTooShort"), "error");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token: tokenFromQuery, password });
      showNotification(translate("passwordResetSuccess"), "success");
      navigate("/login");
    } catch (err) {
      console.error("Reset password error:", err);
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
      <div className="min-h-screen flex items-center justify-center bg-white p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md p-6 sm:p-8 lg:p-12">
          <div className="text-center lg:text-left mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {translate("resetPassword")}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {translate("resetPasswordSubtitle")}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <TextField
                id="password"
                name="password"
                type="password"
                required={true}
                placeholder={translate("password")}
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
                placeholder={translate("confirmPassword")}
                value={confirmPassword}
                IconLeft={LockClosedIcon}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full"
              />
            </div>

            <div>
              <Button type="submit" className="w-full" disabled={loading}>
                {translate("setNewPassword")}
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
    </div>
  );
};

export default ResetPassword;
