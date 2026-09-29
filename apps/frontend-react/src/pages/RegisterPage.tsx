import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Store,
  AtSign,
  Lock,
  Shield,
  Eye,
  EyeOff,
  ShieldCheck,
  Calendar,
  Loader2,
  Mail,
} from 'lucide-react';
import { useRegister } from '../hooks/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  const registerMutation = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!businessName.trim() || !email.trim() || !password || !confirmPassword) {
      setValidationError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    registerMutation.mutate(
      {
        business_name: businessName.trim(),
        full_name: businessName.trim(),
        email: email.trim().toLowerCase(),
        password,
      },
      {
        onSuccess: () => {
          setIsRegistered(true);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-between text-gray-900 selection:bg-black selection:text-white">
      {/* Top Navigation */}
      <header className="w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200/80 bg-white/80 hover:bg-white text-xs font-medium text-gray-700 shadow-sm transition-all hover:shadow"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {/* Center Logo */}
        <div className="flex items-center gap-2 font-bold text-gray-900 text-sm tracking-tight pr-12">
          <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center shadow-sm">
            <Calendar className="w-4 h-4" />
          </div>
          <span>Schedulux AI</span>
        </div>

        <div className="w-16" /> {/* Placeholder to balance center logo */}
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[450px]">
          {/* Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-9 shadow-[0_10px_35px_rgb(0,0,0,0.05)] border border-gray-100">
            {isRegistered ? (
              <div className="text-center py-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Mail className="w-8 h-8" />
                </div>

                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Account Created
                </span>

                <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-3">
                  Check your inbox
                </h1>

                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  We've sent a verification link to <span className="font-semibold text-gray-800">{email}</span>. Click the link in the email to activate your account.
                </p>

                <div className="mt-8 space-y-3">
                  <Link
                    to="/login"
                    className="w-full py-3 px-4 rounded-full bg-black text-white text-xs font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Go to Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsRegistered(false)}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
                  >
                    Entered wrong email? Click here to re-register
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Header Icon */}
                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-sm">
                  <Calendar className="w-5 h-5 text-white" />
                </div>

                {/* Title & Subtitle */}
                <div className="text-center mb-6">
                  <span className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
                    Service Owner Portal
                  </span>
                  <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight mt-1">
                    Create your account
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">
                    Set up your AI receptionist in minutes.
                  </p>
                </div>

                {/* Google Button */}
                <button
              type="button"
              onClick={() => alert('Google Workspace login will be available in production.')}
              className="w-full bg-[#f3f4f6] hover:bg-[#eaecee] active:scale-[0.99] text-gray-800 text-xs font-medium py-3 rounded-full flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              {/* Google G SVG */}
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
                Or sign up with email
              </span>
            </div>

            {/* Errors */}
            {(validationError || registerMutation.isError) && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs text-center font-medium animate-in fade-in duration-200">
                {validationError || registerMutation.error?.message}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username / Business Handle */}
              <div>
                <div className="flex justify-between items-center mb-1 text-[11px]">
                  <label className="font-semibold text-gray-700">Username</label>
                  <span className="text-gray-400">Business Handle</span>
                </div>
                <div className="relative flex items-center bg-[#f3f4f6] rounded-xl px-3.5 py-3 border border-transparent focus-within:border-gray-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 transition-all">
                  <Store className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g., ApexDental"
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative flex items-center bg-[#f3f4f6] rounded-xl px-3.5 py-3 border border-transparent focus-within:border-gray-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 transition-all">
                  <AtSign className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="hello@yourbusiness.com"
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative flex items-center bg-[#f3f4f6] rounded-xl px-3.5 py-3 border border-transparent focus-within:border-gray-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 transition-all">
                  <Lock className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
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

              {/* Confirm Password */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative flex items-center bg-[#f3f4f6] rounded-xl px-3.5 py-3 border border-transparent focus-within:border-gray-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 transition-all">
                  <Shield className="w-4 h-4 text-gray-400 mr-2.5 flex-shrink-0" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none ml-2"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-300 active:scale-[0.99] text-white py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md mt-6 cursor-pointer"
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Terms */}
            <p className="text-[11px] text-gray-500 text-center mt-4 leading-relaxed">
              By continuing, you agree to Schedulux AI{' '}
              <a href="#" className="font-semibold text-gray-800 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="font-semibold text-gray-800 hover:underline">
                Privacy Policy
              </a>
              .
            </p>

            {/* Already have an account */}
            <div className="text-center mt-6 pt-5 border-t border-gray-100 text-xs text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-gray-900 hover:underline">
                Sign in
              </Link>
            </div>
          </>
        )}
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
        <div className="flex items-center gap-1.5 text-gray-500">
          <ShieldCheck className="w-4 h-4 text-gray-500" />
          <span>256-bit SSL Secure Auth</span>
        </div>

        <div>
          <span>© 2025 Schedulux AI Inc. All rights reserved.</span>
        </div>

        <div className="flex items-center gap-5">
          <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Security</a>
        </div>
      </footer>
    </div>
  );
}
