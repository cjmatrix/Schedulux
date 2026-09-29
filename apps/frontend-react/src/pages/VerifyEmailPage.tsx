import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck, MailQuestion } from 'lucide-react';
import { useVerifyEmail } from '../hooks/useAuth';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'missing'>(
    token ? 'verifying' : 'missing'
  );
  const [errorMessage, setErrorMessage] = useState('');

  const verifyMutation = useVerifyEmail();

  useEffect(() => {
    if (!token) {
      setStatus('missing');
      return;
    }

    setStatus('verifying');
    verifyMutation.mutate(token, {
      onSuccess: () => {
        setStatus('success');
        const timer = setTimeout(() => {
          navigate('/login?verified=true');
        }, 2000);
        return () => clearTimeout(timer);
      },
      onError: (err) => {
        setStatus('error');
        setErrorMessage(err.message || 'Invalid or expired verification link.');
      },
    });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[250px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md bg-[#0f172a]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10 text-center">
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Schedulux</span>
        </div>

        {/* State: Verifying */}
        {status === 'verifying' && (
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Verifying Your Email</h2>
            <p className="text-sm text-slate-400 max-w-xs">
              Please wait a moment while we validate your verification link...
            </p>
          </div>
        )}

        {/* State: Success */}
        {status === 'success' && (
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Email Verified!</h2>
            <p className="text-sm text-slate-300 mb-6">
              Your account has been successfully verified. Redirecting you to sign in...
            </p>
            <button
              onClick={() => navigate('/login?verified=true')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20"
            >
              Proceed to Sign In
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* State: Error */}
        {status === 'error' && (
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 text-red-400">
              <XCircle className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-sm text-red-400/90 mb-6 bg-red-950/40 border border-red-900/50 rounded-lg p-3 max-w-sm">
              {errorMessage}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20"
            >
              Back to Sign In
            </Link>
          </div>
        )}

        {/* State: Missing Token */}
        {status === 'missing' && (
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5 text-amber-400">
              <MailQuestion className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Missing Verification Link</h2>
            <p className="text-sm text-slate-400 mb-6 max-w-xs leading-relaxed">
              No verification token was detected in this link. Please check your inbox and click the link sent in your verification email.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20"
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
