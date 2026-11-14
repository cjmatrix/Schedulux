import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { dashboardUserAuthApi, type InvitationInfo } from './api/authApi';
import { useAcceptInvitation } from './hooks/useDashboardAuth';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [invitation, setInvitation] = useState<InvitationInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const acceptInviteMutation = useAcceptInvitation();

  useEffect(() => {
    if (!token) {
      setInfoError('Missing invitation token. Please check the link in your email.');
      setIsLoadingInfo(false);
      return;
    }

    dashboardUserAuthApi
      .getInvitationInfo(token)
      .then((res) => {
        if (res?.data) {
          setInvitation(res.data);
        } else {
          setInfoError('Invalid or expired invitation link.');
        }
      })
      .catch((err: unknown) => {
        setInfoError(
          err instanceof Error
            ? err.message
            : 'Invalid or expired invitation link. Please request a new invite.',
        );
      })
      .finally(() => {
        setIsLoadingInfo(false);
      });
  }, [token]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    acceptInviteMutation.mutate(
      { token, password },
      {
        onSuccess: () => {
          setIsSuccess(true);
          toast.success('Account created successfully! You can now log in.');
          setTimeout(() => {
            navigate('/dashboarduser/login');
          }, 2000);
        },
        onError: (err: unknown) => {
          setFormError(
            err instanceof Error ? err.message : 'Failed to accept invitation. Please try again.',
          );
        },
      },
    );
  };

  if (isLoadingInfo) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
        <span className="text-xs font-semibold text-slate-500">Verifying invitation...</span>
      </div>
    );
  }

  if (infoError || !token) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xl text-center">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Invitation Invalid or Expired</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            {infoError || 'This invitation link is invalid or has already expired. Please ask your workspace administrator to resend the invitation.'}
          </p>
          <Link
            to="/dashboarduser/login"
            className="inline-flex items-center justify-center w-full px-5 py-2.5 text-xs font-semibold text-white bg-black hover:bg-slate-800 rounded-xl transition shadow-sm"
          >
            Go to Team Login
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xl text-center animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Account Ready!</h2>
          <p className="text-xs text-slate-500 leading-relaxed mb-6">
            Your password has been set. Redirecting you to the login screen...
          </p>
          <Link
            to="/dashboarduser/login"
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 text-xs font-semibold text-white bg-black hover:bg-slate-800 rounded-xl transition shadow-sm"
          >
            Log in Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-6 border-b border-slate-100">
          <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center mb-4 shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">
            Accept Invitation
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            Welcome, <strong className="text-slate-800">{invitation?.name}</strong>! You have been invited to join{' '}
            <strong className="text-slate-800">{invitation?.business_name || 'the workspace'}</strong> as an Operations Manager.
          </p>
        </div>

        {/* Member Details Card */}
        <div className="p-8 pt-6 flex flex-col gap-5">
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
              <UserCheck className="w-4 h-4 text-slate-700" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 truncate">
                {invitation?.email}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Operations Manager
              </span>
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* New Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1.5">
                SET YOUR PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1.5">
                CONFIRM PASSWORD
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={acceptInviteMutation.isPending}
              className="mt-2 w-full py-2.5 px-4 bg-black hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {acceptInviteMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Activate Account <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-[11px] text-slate-400">
              Already have an account?{' '}
              <Link
                to="/dashboarduser/login"
                className="text-slate-900 font-semibold hover:underline"
              >
                Log in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
