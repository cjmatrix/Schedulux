import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { authApi } from '../api/authApi';
import { dashboardUserAuthApi } from '../../dashboard-user/api/authApi';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const role = searchParams.get('role'); // 'tenant' or 'dashboard_user'
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      if (role === 'dashboard_user') {
        await dashboardUserAuthApi.resetPassword({ token, new_password: newPassword });
      } else {
        await authApi.resetPassword({ token, new_password: newPassword });
      }
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link might be expired.');
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
          <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Password reset!</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Your password has been successfully updated. You can now use your new password to log in.
          </p>
          <Link
            to={role === 'dashboard_user' ? "/dashboarduser/login" : "/login"}
            className="block w-full py-3.5 px-4 bg-slate-950 hover:bg-black text-white text-sm font-semibold rounded-2xl transition-all shadow-md active:scale-[0.98]"
          >
            Go to login
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
            Create new password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500 font-medium">
            Please enter your new password below.
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
                <label htmlFor="new_password" className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  New Password
                </label>
                <input
                  id="new_password"
                  type="password"
                  required
                  disabled={!token}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirm_password" className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                  Confirm Password
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  required
                  disabled={!token}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-400 transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !token}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl text-sm font-semibold text-white bg-slate-950 hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Reset password'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
