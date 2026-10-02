import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Calendar,
  Loader2,
  Users,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useDashboardLogin } from '../hooks/useAuth';

export default function DashboardUserLoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('sarah@apex.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const login = useAuthStore((state) => state.login);
  const dashboardLoginMutation = useDashboardLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter your workspace email and password.');
      return;
    }

    dashboardLoginMutation.mutate(
      { email, password },
      {
        onSuccess: (res) => {
          login(res.data);
          navigate('/tenant/bookings');
        },
        onError: (error: any) => {
          setErrorMessage(
            error.response?.data?.message ||
              error.message ||
              'An error occurred during login.'
          );
        },
      }
    );
  };

  const isSubmitting = dashboardLoginMutation.isPending;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col justify-between text-gray-900 selection:bg-black selection:text-white">
    
      <header className="w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
       
        <div className="flex items-center gap-2 font-bold text-gray-900 text-sm tracking-tight">
          <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center shadow-sm">
            <Calendar className="w-4 h-4" />
          </div>
          <span>Schedulux AI</span>
        </div>

    
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200/80 bg-white/80 hover:bg-white text-xs font-medium text-gray-700 shadow-sm transition-all hover:shadow cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
      </header>

    
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-[430px]">
         
          <div className="bg-white rounded-3xl p-8 sm:p-9 shadow-[0_10px_35px_rgb(0,0,0,0.05)] border border-gray-100">
          
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-bold text-gray-900 text-sm">Dashboard Member Portal</span>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-[26px] font-bold text-gray-900 tracking-tight mt-1">
                Workspace User Sign In
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Access your team dashboard and appointment schedule.
              </p>
            </div>



            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs text-center font-medium animate-in fade-in duration-200">
                {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Workspace Email Address */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Workspace Email Address
                </label>
                <div className="relative flex items-center bg-[#f3f4f6] rounded-xl px-3.5 py-3 border border-transparent focus-within:border-gray-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-black/5 transition-all">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@apex.com"
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>

             
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
                    className="text-gray-400 hover:text-gray-600 focus:outline-none ml-2 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 active:scale-[0.99] text-white py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md mt-6 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in to Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In as Dashboard User</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

       
          <div className="mt-6 text-center space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Workspace Portal • Session Role: Dashboard Member</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
              <span>End-to-End Encrypted Session • HIPAA Ready Workspace</span>
            </div>
          </div>
        </div>
      </main>

     
      <footer className="w-full px-6 py-6 border-t border-gray-200/60 text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        <div>
          <span>© 2026 Schedulux AI Inc. Precision scheduling platform.</span>
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
