import { ArrowRight, Calendar, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTenantAgents } from '../hooks/useKnowledgeDocuments';
import { useInviteUser } from '../hooks/useTenant';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  defaultAgentId?: string;
}

export function InviteUserModal({
  isOpen,
  onClose,
  tenantId,
  defaultAgentId,
}: InviteUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState(defaultAgentId || '');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: agents = [], isLoading: isLoadingAgents } = useTenantAgents();
  const inviteUserMutation = useInviteUser();

  useEffect(() => {
    if (defaultAgentId) {
      setSelectedAgentId(defaultAgentId);
    } else if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].agent_id);
    }
  }, [agents, defaultAgentId, selectedAgentId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !name) {
      setErrorMsg('Please enter both name and email address.');
      return;
    }

    if (!selectedAgentId) {
      setErrorMsg('Please select an agent to assign this team member.');
      return;
    }

    inviteUserMutation.mutate(
      {
        tenant_id: tenantId,
        agent_id: selectedAgentId,
        name: name.trim(),
        email: email.trim(),
        system_role: 'manager',
      },
      {
        onSuccess: () => {
          setName('');
          setEmail('');
          setSelectedAgentId(agents[0]?.agent_id || '');
          onClose();
        },
        onError: (err: unknown) => {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to send invitation.');
        },
      },
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">
            Invite Team Member
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md">
            Send an email invitation link to your staff. They will set their own password and will
            be restricted to the assigned agent.
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

          {/* Assign to Agent */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-1.5">
              ASSIGN TO AI AGENT
            </label>
            {isLoadingAgents ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading agents...
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  required
                >
                  {agents.map((agent) => (
                    <option key={agent.agent_id} value={agent.agent_id}>
                      {agent.name} ({agent.agent_id.slice(-6)})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Staff can only view and manage bookings, services, resources, and customers for this
              agent.
            </p>
          </div>

          {/* System Role Info */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2">
              ASSIGNED ROLE
            </label>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3.5">
              <div className="mt-0.5">
                <div className="w-4 h-4 rounded-full border border-slate-900 bg-slate-900 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-700" />
                  <span>Operations Manager</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Staff members have operational access to Calendar & Bookings, Services, Resources,
                  and Customers. They cannot access billing, invite other users, or edit agent
                  knowledge base.
                </p>
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
              disabled={inviteUserMutation.isPending || !selectedAgentId}
              className="px-5 py-2.5 text-xs font-medium text-white bg-slate-950 hover:bg-black rounded-full transition-all flex items-center gap-1.5 shadow-md active:scale-95 disabled:opacity-50"
            >
              {inviteUserMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sending Invite...
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
