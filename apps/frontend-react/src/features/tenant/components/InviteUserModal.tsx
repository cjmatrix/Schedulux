import { useState } from 'react';
import { X, Calendar, Shield, Loader2, ArrowRight } from 'lucide-react';
import { useInviteUser } from '../hooks/useTenant';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

export function InviteUserModal({ isOpen, onClose, tenantId }: InviteUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [systemRole, setSystemRole] = useState<'manager' | 'root'>('manager');
  const [errorMsg, setErrorMsg] = useState('');

  const inviteUserMutation = useInviteUser();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !name) {
      setErrorMsg('Please enter both name and email address.');
      return;
    }

    inviteUserMutation.mutate(
      {
        tenant_id: tenantId,
        name: name.trim(),
        email: email.trim(),
        system_role: systemRole,
      },
      {
        onSuccess: () => {
          setName('');
          setEmail('');
          setSystemRole('manager');
          onClose();
        },
        onError: (err: any) => {
          setErrorMsg(err?.response?.data?.error || err.message || 'Failed to send invitation.');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full p-7 shadow-2xl border border-slate-100 flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Invite to Workspace</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md">
            Send an email invitation to a new team member and set their access level.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-600 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1.5">
              FULL NAME
            </label>
            <input
              type="text"
              placeholder="e.g. Sarah Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1.5">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              placeholder="colleague@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              required
            />
          </div>

          {/* Select Role & Permissions */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2">
              SELECT ROLE & PERMISSIONS
            </label>

            <div className="flex flex-col gap-3">
              {/* Option 1: Manager */}
              <div
                onClick={() => setSystemRole('manager')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  systemRole === 'manager'
                    ? 'border-slate-900 bg-slate-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="mt-0.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    systemRole === 'manager' ? 'border-slate-900 bg-slate-900' : 'border-slate-300 bg-white'
                  }`}>
                    {systemRole === 'manager' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-700" />
                    <span>Manager (Front Desk / Operations)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Can manage the calendar, view customer data, and take over live AI chats. Cannot change billing or edit the AI Agent.
                  </p>
                </div>
              </div>

              {/* Option 2: Owner (Root) */}
              <div
                onClick={() => setSystemRole('root')}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                  systemRole === 'root'
                    ? 'border-slate-900 bg-slate-50/70 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="mt-0.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    systemRole === 'root' ? 'border-slate-900 bg-slate-900' : 'border-slate-300 bg-white'
                  }`}>
                    {systemRole === 'root' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 mb-1">
                    <Shield className="w-3.5 h-3.5 text-slate-700" />
                    <span>Owner (Full Admin Access)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Has absolute control. Can configure the AI Agent Studio, edit Stripe billing, and delete the workspace.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 mt-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteUserMutation.isPending}
              className="px-5 py-2.5 text-xs font-medium text-white bg-slate-950 hover:bg-black rounded-full transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            >
              {inviteUserMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send Invite <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
