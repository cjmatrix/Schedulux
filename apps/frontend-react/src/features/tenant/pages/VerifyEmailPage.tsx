import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  MailQuestion,
  Calendar,
} from "lucide-react";
import { useVerifyEmail } from "../hooks/useAuth";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "verifying" | "success" | "error" | "missing"
  >(token ? "verifying" : "missing");
  const [errorMessage, setErrorMessage] = useState("");

  const verifyMutation = useVerifyEmail();

  useEffect(() => {
    if (!token) {
      setStatus("missing");
      return;
    }

    setStatus("verifying");
    verifyMutation.mutate(token, {
      onSuccess: () => {
        setStatus("success");
        const timer = setTimeout(() => {
          navigate("/login?verified=true");
        }, 2000);
        return () => clearTimeout(timer);
      },
      onError: (err) => {
        setStatus("error");
        setErrorMessage(err.message || "Invalid or expired verification link.");
      },
    });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-between text-gray-900 selection:bg-black selection:text-white">
      {/* Top Navigation */}
      <header className="w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        {/* Left Logo */}
        <div className="flex items-center gap-2 font-bold text-gray-900 text-sm tracking-tight">
          <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center shadow-sm">
            <Calendar className="w-4 h-4" />
          </div>
          <span>Schedulux AI</span>
        </div>

        {/* Right Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200/80 bg-white/80 hover:bg-white text-xs font-medium text-gray-700 shadow-sm transition-all hover:shadow cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[430px]">
          {/* Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-9 shadow-[0_10px_35px_rgb(0,0,0,0.05)] border border-gray-100">
            {/* Header Badge */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white shadow-sm">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-gray-900 text-sm">
                Schedulux AI
              </span>
            </div>

            {/* State: Verifying */}
            {status === "verifying" && (
              <div className="py-4 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200/80 flex items-center justify-center mb-5">
                  <Loader2 className="w-8 h-8 text-black animate-spin" />
                </div>
                <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
                  Verifying Your Email
                </h1>
                <p className="text-xs text-gray-500 mt-2 max-w-xs">
                  Please wait a moment while we validate your verification
                  link...
                </p>
              </div>
            )}

            {/* State: Success */}
            {status === "success" && (
              <div className="py-4 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5 text-emerald-600 animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
                  Email Verified!
                </h1>
                <p className="text-xs text-gray-500 mt-2 mb-6">
                  Your account has been successfully verified. Redirecting you
                  to sign in...
                </p>
                <button
                  onClick={() => navigate("/login?verified=true")}
                  className="w-full bg-black hover:bg-gray-800 active:scale-[0.99] text-white py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* State: Error */}
            {status === "error" && (
              <div className="py-4 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-5 text-red-500">
                  <XCircle className="w-9 h-9" />
                </div>
                <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight mb-3">
                  Verification Failed
                </h1>
                <div className="w-full mb-6 p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium">
                  {errorMessage}
                </div>
                <Link
                  to="/login"
                  className="w-full bg-black hover:bg-gray-800 active:scale-[0.99] text-white py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer text-center"
                >
                  <span>Back to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* State: Missing Token */}
            {status === "missing" && (
              <div className="py-4 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mb-5 text-amber-500">
                  <MailQuestion className="w-8 h-8" />
                </div>
                <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight">
                  Missing Verification Link
                </h1>
                <p className="text-xs text-gray-500 mt-2 mb-6 max-w-xs leading-relaxed">
                  No verification token was detected in this link. Please check
                  your inbox and click the link sent in your verification email.
                </p>
                <Link
                  to="/login"
                  className="w-full bg-black hover:bg-gray-800 active:scale-[0.99] text-white py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer text-center"
                >
                  <span>Back to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Trust & Cluster Info */}
          <div className="mt-6 text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                Autonomous Cluster: US-East (Virginia) • 99.99% operational
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
              <span>
                Enterprise SAML 2.0 Ready • SOC2 Type II Certified • 256-Bit
                Vault Storage
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="w-full px-6 py-6 border-t border-gray-200/60 text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        <div>
          <span>© 2026 Schedulux AI Inc. Precision scheduling platform.</span>
        </div>

        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-gray-600 transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-gray-600 transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-gray-600 transition-colors">
            System Status
          </a>
        </div>
      </footer>
    </div>
  );
}
