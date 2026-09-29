import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Calendar,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useLogin } from '../hooks/useAuth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loginMutation = useLogin();
  const justVerified = searchParams.get('verified') === 'true';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    loginMutation.mutate(
      {
        email: email.trim().toLowerCase(),
        password,
      },
      {
        onSuccess: (data) => {
          // Success: cookies set automatically via credentials: 'include'
          alert(`Welcome back, ${data.tenant.business_name}!`);
          navigate('/home');
        },
        onError: (err) => {
          if (err.message === 'EMAIL_NOT_VERIFIED') {
            setErrorMessage('Your email is not verified yet. Please check your inbox and click the verification link.');
          } else {
            setErrorMessage(err.message || 'Invalid email or password.');
          }
        },
      }
    );
  };

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
                <Calendar className="w-4 h-4" />
              </div>
              <span className="font-bold text-gray-900 text-sm">Schedulux AI</span>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight mt-1">
                Welcome back
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Sign in to manage your AI scheduling agent.
              </p>
            </div>

            {/* Just Verified Banner */}
            {justVerified && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs text-center font-medium flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Account verified! Please sign in with your credentials.</span>
              </div>
            )}

            {/* Google Button */}
            <button
              type="button"
              onClick={() => alert('Google Workspace login will be available in production.')}
              className="w-full bg-[#f3f4f6] hover:bg-[#eaecee] active:scale-[0.99] text-gray-800 text-xs font-medium py-3 rounded-full flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google Workspace</span>
            </button>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200/80" />
              </div>
              <span className="relative bg-white px-3 text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                Or sign in with email
              </span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs text-center font-medium animate-in fade-in duration-200">
                {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center bg-[#f3f4f6] rounded-xl px-3.5 py-3 border border-transparent focus-within:border-gray-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 transition-all">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@business.com"
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                    Password
                  </label>
                  <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    Forgot password?
                  </a>
                </div>
                <div className="relative flex items-center bg-[#f3f4f6] rounded-xl px-3.5 py-3 border border-transparent focus-within:border-gray-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 transition-all">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none ml-2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-300 active:scale-[0.99] text-white py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md mt-6 cursor-pointer"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Register */}
            <div className="text-center mt-6 pt-5 border-t border-gray-100 text-xs text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-bold text-gray-900 hover:underline">
                Get started
              </Link>
            </div>
          </div>

          {/* Trust & Cluster Info */}
          <div className="mt-6 text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Autonomous Cluster: US-East (Virginia) • 99.99% operational</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
              <span>Enterprise SAML 2.0 Ready • SOC2 Type II Certified • 256-Bit Vault Storage</span>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="w-full px-6 py-6 border-t border-gray-200/60 text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        <div>
          <span>© 2025 Schedulux AI Inc. Precision scheduling platform.</span>
        </div>

        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-gray-600 transition-colors">System Status</a>
        </div>
      </footer>
    </div>
  );
}
