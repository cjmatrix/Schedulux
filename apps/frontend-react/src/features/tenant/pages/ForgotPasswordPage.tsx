import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Calendar, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { authApi } from '../api/authApi';
import { dashboardUserAuthApi } from '../../dashboard-user/api/authApi';

export default function ForgotPasswordPage() {
  const location = useLocation();
  const isDashboardUser = location.pathname.includes('dashboarduser');
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      if (isDashboardUser) {
        await dashboardUserAuthApi.forgotPassword(email);
      } else {
        await authApi.forgotPassword(email);
      }
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Check your email</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            If an account exists for <span className="font-semibold text-slate-700">{email}</span>, we've sent instructions on how to reset your password.
          </p>
          <Link
            to={isDashboardUser ? "/dashboarduser/login" : "/login"}
            className="block w-full py-3.5 px-4 bg-slate-950 hover:bg-black text-white text-sm font-semibold rounded-2xl transition-all shadow-md active:scale-[0.98]"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/10">
              <Calendar className="w-7 h-7" />
            </div>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            Reset password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500 font-medium">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-10 px-4 sm:px-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50/80 text-red-600 text-xs font-medium rounded-2xl border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
                  placeholder="name@company.com"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-slate-950 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Send reset link'
                )}
              </button>

              <div className="text-center mt-6">
                <Link
                  to={isDashboardUser ? "/dashboarduser/login" : "/login"}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
