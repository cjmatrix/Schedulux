import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Copy,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { TablePaginationFooter } from '../../../components/TablePaginationFooter';
import useDebounceHook from '../../../shared/hooks/useDebounceHook';
import { useCustomersList } from '../hooks/useCustomers';

export default function CustomersPage() {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId?: string }>();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'guest'>('all');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [debouncedSearch] = useDebounceHook(searchTerm);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const {
    data: customersResponse,
    isLoading,
    refetch,
    isRefetching,
  } = useCustomersList({
    page,
    limit,
    agent_id: agentId,
    search: debouncedSearch.trim() || undefined,
  });

  const rawCustomers = customersResponse?.data || [];
  const total = customersResponse?.pagination?.total ?? 0;
  const totalPages = customersResponse?.pagination?.total_pages ?? Math.max(1, Math.ceil(total / limit));

  const filteredCustomers = rawCustomers.filter((c) => {
    if (statusFilter === 'verified') return !c.is_guest;
    if (statusFilter === 'guest') return c.is_guest;
    return true;
  });

  const verifiedCount = rawCustomers.filter((c) => !c.is_guest).length;
  const guestCount = rawCustomers.filter((c) => c.is_guest).length;

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const getInitials = (name?: string) => {
    if (!name || name.trim() === '' || name.toLowerCase() === 'guest') return 'CU';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6 font-sans text-slate-800">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wide">
        {agentId ? (
          <>
            <button
              onClick={() => navigate('/tenant/agents')}
              className="flex items-center gap-1 hover:text-slate-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              AI Agents
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <button
              onClick={() => navigate(`/tenant/agents/${agentId}/dashboard`)}
              className="hover:text-slate-800 transition cursor-pointer font-bold truncate max-w-xs"
            >
              {agentId}
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-900 font-bold">Customers</span>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/tenant/dashboard')}
              className="hover:text-slate-800 transition cursor-pointer"
            >
              Dashboard
            </button>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="text-slate-900 font-bold">Customers</span>
          </>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-600" />
            Customer Directory
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Directory of client records, verified phone identities, and appointment volume.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200/90 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Customers</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{total}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Verified Clients</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{verifiedCount}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Guest Visitors</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{guestCount}</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white transition text-slate-800 placeholder:text-slate-400 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 self-start md:self-auto bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('verified')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              statusFilter === 'verified'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Verified Only
          </button>
          <button
            onClick={() => setStatusFilter('guest')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
              statusFilter === 'guest'
                ? 'bg-white text-amber-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Guests
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-2xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Phone Number</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Appointments</th>
                <th className="py-4 px-6">First Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
                      <span className="font-medium">Loading customer records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        {searchTerm ? 'No matching customers found' : 'No customers recorded yet'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {searchTerm
                          ? 'Try refining your search keyword or clearing the status filter.'
                          : 'Customers who interact with your AI receptionist or book appointments will appear here automatically.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {getInitials(customer.name)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">
                            {customer.name || 'Guest Customer'}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            ID: {customer.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-medium text-slate-700">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{customer.phone}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyPhone(customer.phone, e)}
                          className="text-slate-400 hover:text-slate-700 transition p-1 rounded cursor-pointer"
                          title="Copy phone number"
                        >
                          {copiedPhone === customer.phone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-medium text-slate-600">
                      {customer.email ? (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{customer.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-normal italic">None provided</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center">
                      {!customer.is_guest ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                          <ShieldAlert className="w-3 h-3 text-amber-600" />
                          Guest
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {customer.total_bookings}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-500 font-medium">
                      {formatDate(customer.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePaginationFooter
          currentPage={page}
          totalPages={totalPages}
          totalCount={total}
          pageSize={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
          isLoading={isLoading || isRefetching}
          entityName="customers"
        />
      </div>
    </div>
  );
}
