import React from "react";
import { useSearchParams, Link } from "react-router-dom";

const VerifySuccess = () => {
  const [searchParams] = useSearchParams();
  const status = searchParams.get("status");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {status === "success"
              ? "Email Verified Successfully!"
              : "Verification Error"}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {status === "success"
              ? "Your email has been verified. You can now log in to your account."
              : "There was an error verifying your email. Please try again or contact support."}
          </p>
        </div>
        <div className="mt-5 text-center">
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifySuccess;
