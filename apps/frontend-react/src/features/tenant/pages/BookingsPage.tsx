import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CalendarDays,
  X,
  PhoneCall,
  Globe,
  Mail,
  Phone,
} from "lucide-react";

interface BookingItem {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  duration: string;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  source: "AI Voice Agent" | "Web Embed" | "Manual";
  assignedStaff: string;
  price: string;
}

const INITIAL_BOOKINGS: BookingItem[] = [
  {
    id: "BK-8021",
    customerName: "Sarah Jenkins",
    customerEmail: "sarah.j@example.com",
    customerPhone: "+1 (555) 234-5678",
    serviceName: "Executive Strategy Consultation",
    date: "2026-10-03",
    timeSlot: "09:00 AM - 10:00 AM",
    duration: "60 mins",
    status: "confirmed",
    source: "AI Voice Agent",
    assignedStaff: "Dr. Alex Rivera",
    price: "$150.00",
  },
  {
    id: "BK-8022",
    customerName: "Michael Chen",
    customerEmail: "mchen@techcorp.io",
    customerPhone: "+1 (555) 876-5432",
    serviceName: "Initial Product Onboarding",
    date: "2026-10-03",
    timeSlot: "11:30 AM - 12:15 PM",
    duration: "45 mins",
    status: "confirmed",
    source: "Web Embed",
    assignedStaff: "Elena Rostova",
    price: "$95.00",
  },
  {
    id: "BK-8023",
    customerName: "Amanda Vance",
    customerEmail: "amanda@vancelegal.com",
    customerPhone: "+1 (555) 345-6789",
    serviceName: "Comprehensive Operations Review",
    date: "2026-10-03",
    timeSlot: "02:00 PM - 03:00 PM",
    duration: "60 mins",
    status: "pending",
    source: "AI Voice Agent",
    assignedStaff: "Dr. Alex Rivera",
    price: "$200.00",
  },
  {
    id: "BK-8024",
    customerName: "David Miller",
    customerEmail: "dmiller@apexsystems.com",
    customerPhone: "+1 (555) 987-6543",
    serviceName: "Technical Architecture Audit",
    date: "2026-10-04",
    timeSlot: "10:00 AM - 11:30 AM",
    duration: "90 mins",
    status: "confirmed",
    source: "Web Embed",
    assignedStaff: "Marcus Thorne",
    price: "$275.00",
  },
  {
    id: "BK-8025",
    customerName: "Jessica Taylor",
    customerEmail: "jess.taylor@designco.com",
    customerPhone: "+1 (555) 456-7890",
    serviceName: "Follow-up Consultation",
    date: "2026-10-04",
    timeSlot: "01:15 PM - 02:00 PM",
    duration: "45 mins",
    status: "completed",
    source: "Manual",
    assignedStaff: "Elena Rostova",
    price: "$80.00",
  },
  {
    id: "BK-8026",
    customerName: "Robert Hayes",
    customerEmail: "rhayes@globalnet.org",
    customerPhone: "+1 (555) 654-3210",
    serviceName: "AI Automation Workshop",
    date: "2026-10-05",
    timeSlot: "03:30 PM - 05:00 PM",
    duration: "90 mins",
    status: "confirmed",
    source: "AI Voice Agent",
    assignedStaff: "Dr. Alex Rivera",
    price: "$310.00",
  },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>(INITIAL_BOOKINGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(
    null,
  );


  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newService, setNewService] = useState(
    "Executive Strategy Consultation",
  );
  const [newDate, setNewDate] = useState("2026-10-06");
  const [newTime, setNewTime] = useState("10:00 AM - 11:00 AM");
  const [newStaff, setNewStaff] = useState("Dr. Alex Rivera");

  const filteredBookings = bookings.filter((item) => {
    const matchesSearch =
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerEmail) return;

    const newBooking: BookingItem = {
      id: `BK-${Math.floor(8000 + Math.random() * 1000)}`,
      customerName: newCustomerName,
      customerEmail: newCustomerEmail,
      customerPhone: newCustomerPhone || "+1 (555) 000-0000",
      serviceName: newService,
      date: newDate,
      timeSlot: newTime,
      duration: "60 mins",
      status: "confirmed",
      source: "Manual",
      assignedStaff: newStaff,
      price: "$150.00",
    };

    setBookings([newBooking, ...bookings]);
    setIsNewBookingModalOpen(false);
    // Reset form
    setNewCustomerName("");
    setNewCustomerEmail("");
    setNewCustomerPhone("");
  };

  const updateBookingStatus = (
    id: string,
    newStatus: BookingItem["status"],
  ) => {
    setBookings(
      bookings.map((b) => (b.id === id ? { ...b, status: newStatus } : b)),
    );
    if (selectedBooking && selectedBooking.id === id) {
      setSelectedBooking({ ...selectedBooking, status: newStatus });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-6 font-sans">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wide">
        <span>Operations</span>
        <span>/</span>
        <span className="text-slate-800">Calendar & Bookings</span>
      </div>

      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Calendar & Bookings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-200/70 text-slate-700 text-[10px] font-bold tracking-wider uppercase">
              {filteredBookings.length} ACTIVE SLOTS
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Manage real-time appointments, customer schedules, and AI-assisted bookings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white border border-slate-200/90 rounded-full p-1 shadow-2xs">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-slate-950 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                viewMode === "calendar"
                  ? "bg-slate-950 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Calendar View
            </button>
          </div>

          <button
            onClick={() => setIsNewBookingModalOpen(true)}
            className="px-5 py-2.5 bg-slate-950 hover:bg-black text-white text-xs font-semibold rounded-full flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Total Appointments
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
              <CalendarDays className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              142
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +14% vs last mo
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              AI Auto-Booked
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              84.2%
            </span>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              119 by AI Agent
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Scheduled Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              3 Sessions
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Next: 09:00 AM
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Pending Confirmation
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              1 Pending
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Action Required
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar (Search & Filter) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, booking ID, service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200/90 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-white border border-slate-200/90 rounded-full px-4 py-2 pr-8 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Filter className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      {viewMode === "list" ? (
        /* List View Table */
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Booking ID & Customer</th>
                  <th className="py-3.5 px-5">Service</th>
                  <th className="py-3.5 px-5">Date & Time</th>
                  <th className="py-3.5 px-5">Staff / Provider</th>
                  <th className="py-3.5 px-5">Source</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-slate-400 text-xs"
                    >
                      No bookings match your current filter.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedBooking(item)}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {item.customerName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {item.customerName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {item.id} • {item.customerEmail}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-800">
                          {item.serviceName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.duration} • {item.price}
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-medium text-slate-800">
                          {item.date}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.timeSlot}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-medium text-slate-700">
                        {item.assignedStaff}
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.source === "AI Voice Agent" && (
                            <PhoneCall className="w-3 h-3 text-indigo-600" />
                          )}
                          {item.source === "Web Embed" && (
                            <Globe className="w-3 h-3 text-blue-600" />
                          )}
                          {item.source === "Manual" && (
                            <User className="w-3 h-3 text-slate-500" />
                          )}
                          <span>{item.source}</span>
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        {item.status === "confirmed" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Confirmed
                          </span>
                        )}
                        {item.status === "pending" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending
                          </span>
                        )}
                        {item.status === "completed" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                            Completed
                          </span>
                        )}
                        {item.status === "cancelled" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(item);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Calendar View Mock Grid */
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                October 2026
              </h2>
              <span className="px-2.5 py-0.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-600">
                Today
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `2026-10-${dayNum < 10 ? `0${dayNum}` : dayNum}`;
              const dayBookings = bookings.filter((b) => b.date === dateStr);

              return (
                <div
                  key={i}
                  className={`min-h-[90px] p-2 rounded-xl border transition-all ${
                    dayNum === 3
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50/50 border-slate-100 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`text-xs font-bold mb-1 ${
                      dayNum === 3 ? "text-white" : "text-slate-700"
                    }`}
                  >
                    {dayNum}
                  </div>
                  <div className="flex flex-col gap-1">
                    {dayBookings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBooking(b)}
                        className={`text-[10px] p-1.5 rounded-md font-semibold truncate cursor-pointer transition-all ${
                          dayNum === 3
                            ? "bg-white/20 text-white hover:bg-white/30"
                            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                        }`}
                      >
                        {b.timeSlot.split(" - ")[0]} • {b.customerName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl border border-slate-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {selectedBooking.id}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                  {selectedBooking.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedBooking.serviceName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scheduled for {selectedBooking.date} at {selectedBooking.timeSlot}
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold">{selectedBooking.customerName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{selectedBooking.customerEmail}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{selectedBooking.customerPhone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 border border-slate-100 rounded-xl bg-white">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">
                    Assigned Staff
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedBooking.assignedStaff}
                  </span>
                </div>
                <div className="p-3 border border-slate-100 rounded-xl bg-white">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">
                    Channel Source
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedBooking.source}
                  </span>
                </div>
              </div>

              {selectedBooking.source === "AI Voice Agent" && (
                <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI Voice Transcript Summary</span>
                  </div>
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    Customer called to schedule consultation for business scaling.
                    The AI agent confirmed available slot with Dr. Alex Rivera.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => updateBookingStatus(selectedBooking.id, "cancelled")}
                className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Cancel Booking
              </button>
              <div className="flex gap-2">
                {selectedBooking.status === "pending" && (
                  <button
                    onClick={() => updateBookingStatus(selectedBooking.id, "confirmed")}
                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Confirm Booking
                  </button>
                )}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Booking Modal */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl border border-slate-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center font-bold text-xs">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Create New Booking
                </h3>
              </div>
              <button
                onClick={() => setIsNewBookingModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Customer Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="e.g. Rachel Green"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    placeholder="rachel@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Select Service
                </label>
                <select
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Executive Strategy Consultation">
                    Executive Strategy Consultation ($150)
                  </option>
                  <option value="Initial Product Onboarding">
                    Initial Product Onboarding ($95)
                  </option>
                  <option value="Technical Architecture Audit">
                    Technical Architecture Audit ($275)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Assigned Staff / Provider
                </label>
                <select
                  value={newStaff}
                  onChange={(e) => setNewStaff(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="Dr. Alex Rivera">Dr. Alex Rivera</option>
                  <option value="Elena Rostova">Elena Rostova</option>
                  <option value="Marcus Thorne">Marcus Thorne</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Time Slot
                  </label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    <option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM</option>
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-black hover:bg-slate-900 text-white text-xs font-semibold shadow-md cursor-pointer"
                >
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
