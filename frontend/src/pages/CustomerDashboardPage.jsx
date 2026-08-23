import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Search, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  RefreshCw, 
  AlertTriangle,
  PlusCircle,
  Clock,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const CustomerDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Reschedule Modal
  const [selectedFailedOrder, setSelectedFailedOrder] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState('10:00 AM - 01:00 PM');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getMyOrders();
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFailedOrder) return;
    setRescheduling(true);
    try {
      const res = await orderAPI.rescheduleOrder(selectedFailedOrder._id, {
        rescheduledDate,
        rescheduledTimeSlot,
        notes: rescheduleNotes
      });
      if (res.data.success) {
        alert('Order rescheduled successfully!');
        setSelectedFailedOrder(null);
        fetchOrders();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error rescheduling order.');
    } finally {
      setRescheduling(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'active') {
      if (['Delivered', 'Cancelled'].includes(o.status)) return false;
    } else if (filter === 'delivered') {
      if (o.status !== 'Delivered') return false;
    } else if (filter === 'failed') {
      if (o.status !== 'Failed') return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.trackingNumber.toLowerCase().includes(q) ||
        o.pickupAddress?.area?.toLowerCase().includes(q) ||
        o.dropAddress?.area?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Shipments & Orders
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, <strong className="text-slate-700">{user?.name}</strong>. Track deliveries, inspect invoices, and manage rescheduling.
          </p>
        </div>

        <Link
          to="/create-order"
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs transition-colors shadow-md flex items-center justify-center gap-2 self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Book New Shipment</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'active', label: 'Active Shipments' },
            { id: 'failed', label: 'Failed (Action Required)' },
            { id: 'delivered', label: 'Delivered' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Tracking ID or Area..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 text-blue-600 animate-spin" />
          Loading your shipments...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-bold text-slate-700 text-base">No shipments found</p>
          <p className="text-xs text-slate-400 mt-1">Book your first last-mile delivery to get started.</p>
          <Link
            to="/create-order"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
          >
            <PlusCircle className="w-4 h-4" /> Book Shipment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((o) => (
            <div
              key={o._id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-sm transition-all hover:shadow-md ${
                o.status === 'Failed' ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold font-mono text-base text-slate-900">
                      {o.trackingNumber}
                    </span>
                    <StatusBadge status={o.status} size="sm" />
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {o.orderType} • {o.paymentType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">
                    Booked on {new Date(o.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Total Amount</span>
                    <span className="font-extrabold font-mono text-slate-900 text-base">
                      ₹{o.pricing?.totalAmount?.toFixed(2)}
                    </span>
                  </div>

                  <Link
                    to={`/track/${o.trackingNumber}`}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <span>Track Live</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {o.status === 'Failed' && (
                    <button
                      onClick={() => {
                        setSelectedFailedOrder(o);
                        setRescheduleDate(new Date().toISOString().split('T')[0]);
                      }}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Addresses Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
                <div className="flex items-start gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                  <div>
                    <strong className="text-slate-800">From:</strong> {o.pickupAddress.street}, {o.pickupAddress.area} ({o.pickupAddress.city})
                  </div>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                  <div>
                    <strong className="text-slate-800">To:</strong> {o.dropAddress.street}, {o.dropAddress.area} ({o.dropAddress.city})
                  </div>
                </div>
              </div>

              {/* Failed Note */}
              {o.status === 'Failed' && (
                <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-100 text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>
                    <strong>Delivery Unsuccessful:</strong> {o.failedDetails?.reason || 'Customer Unavailable'}. Click Reschedule to pick a new date.
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      {selectedFailedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reschedule Delivery Attempt</h3>
                <p className="text-xs text-slate-500">Order #{selectedFailedOrder.trackingNumber}</p>
              </div>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Reschedule Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Time Window</label>
                <select
                  value={rescheduleTimeSlot}
                  onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="09:00 AM - 01:00 PM">Morning (09:00 AM - 01:00 PM)</option>
                  <option value="01:00 PM - 05:00 PM">Afternoon (01:00 PM - 05:00 PM)</option>
                  <option value="05:00 PM - 08:30 PM">Evening (05:00 PM - 08:30 PM)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delivery Instructions</label>
                <textarea
                  rows={3}
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  placeholder="e.g. Call before coming or leave with flatmate"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedFailedOrder(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md flex items-center gap-2"
                >
                  {rescheduling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm Reschedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerDashboardPage;
