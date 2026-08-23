import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Truck, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  ArrowRight, 
  RefreshCw, 
  Power,
  Navigation,
  ShieldAlert,
  Clock,
  Compass
} from 'lucide-react';
import { orderAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const DeliveryAgentPage = () => {
  const { user, updateAgentDuty } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingDuty, setUpdatingDuty] = useState(false);

  // Failure Modal state
  const [selectedOrderForFailure, setSelectedOrderForFailure] = useState(null);
  const [failureReason, setFailureReason] = useState('Customer Unavailable / Door Locked');
  const [failureNotes, setFailureNotes] = useState('');
  const [failureSubmitting, setFailureSubmitting] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getAgentTasks();
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Error fetching agent tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDutyToggle = async () => {
    setUpdatingDuty(true);
    const newStatus = user?.agentDetails?.status === 'available' ? 'offline' : 'available';
    try {
      await updateAgentDuty(newStatus);
    } catch (err) {
      alert('Error updating status');
    } finally {
      setUpdatingDuty(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      const res = await orderAPI.updateStatus(orderId, {
        status: newStatus,
        notes: `Agent updated status to ${newStatus}`
      });
      if (res.data.success) {
        fetchTasks();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating order status');
    }
  };

  const handleFailSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderForFailure) return;
    setFailureSubmitting(true);
    try {
      const res = await orderAPI.updateStatus(selectedOrderForFailure._id, {
        status: 'Failed',
        reason: failureReason,
        notes: failureNotes || 'Agent reported delivery attempt failed'
      });
      if (res.data.success) {
        setSelectedOrderForFailure(null);
        setFailureNotes('');
        fetchTasks();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error flagging order as failed');
    } finally {
      setFailureSubmitting(false);
    }
  };

  const isOnline = user?.agentDetails?.status === 'available';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Agent Header & Duty Switch */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              Delivery Partner Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Vehicle: <strong className="capitalize text-white">{user?.agentDetails?.vehicleType || 'Bike'}</strong> • Active Assigned Deliveries: <strong className="text-white">{orders.filter(o => !['Delivered', 'Cancelled'].includes(o.status)).length}</strong>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleDutyToggle}
            disabled={updatingDuty}
            className={`px-5 py-3 rounded-2xl font-bold text-xs transition-all shadow-md flex items-center gap-2.5 ${
              isOnline
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isOnline ? 'Active On-Duty' : 'Offline / Off-Duty'}</span>
          </button>
        </div>
      </div>

      {/* Active Tasks List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" /> Assigned Delivery Shipments ({orders.length})
          </h2>
          <button
            onClick={fetchTasks}
            className="p-2 text-slate-500 hover:text-blue-600 bg-white border border-slate-200 rounded-xl shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 text-blue-600 animate-spin" />
            Loading assigned orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
            <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700 text-base">No active delivery tasks</p>
            <p className="text-xs text-slate-400 mt-1">Orders auto-assigned to you will appear here in real time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orders.map((o) => {
              const isDelivered = o.status === 'Delivered';
              const isFailed = o.status === 'Failed';

              return (
                <div
                  key={o._id}
                  className={`bg-white rounded-3xl border p-6 shadow-sm flex flex-col justify-between transition-all ${
                    isFailed ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div>
                        <span className="font-mono font-extrabold text-base text-slate-900">
                          {o.trackingNumber}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {o.orderType} • {o.paymentType} {o.paymentType === 'COD' && `(Collect ₹${o.pricing?.totalAmount})`}
                        </p>
                      </div>
                      <StatusBadge status={o.status} size="sm" />
                    </div>

                    {/* Customer Info */}
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                        <span>{o.customerName}</span>
                        <span className="text-blue-600 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3" /> {o.customerPhone}
                        </span>
                      </div>
                      <p className="text-slate-500">{o.packageDetails?.description} ({o.packageDetails?.chargeableWeightKg}kg)</p>
                    </div>

                    {/* Addresses */}
                    <div className="space-y-3 mt-4 text-xs">
                      <div className="flex items-start gap-2 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0"></span>
                        <div>
                          <strong className="text-slate-800">Pickup:</strong> {o.pickupAddress.street}, {o.pickupAddress.area}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                        <div>
                          <strong className="text-slate-800">Drop:</strong> {o.dropAddress.street}, {o.dropAddress.area}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-2">
                      
                      {o.status === 'Assigned' && (
                        <button
                          onClick={() => handleStatusUpdate(o._id, 'Picked Up')}
                          className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Package className="w-4 h-4" />
                          <span>Mark Picked Up</span>
                        </button>
                      )}

                      {o.status === 'Picked Up' && (
                        <button
                          onClick={() => handleStatusUpdate(o._id, 'In Transit')}
                          className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Mark In Transit</span>
                        </button>
                      )}

                      {o.status === 'In Transit' && (
                        <button
                          onClick={() => handleStatusUpdate(o._id, 'Out for Delivery')}
                          className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>Out for Delivery</span>
                        </button>
                      )}

                      {['Picked Up', 'In Transit', 'Out for Delivery'].includes(o.status) && (
                        <button
                          onClick={() => handleStatusUpdate(o._id, 'Delivered')}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Delivered</span>
                        </button>
                      )}

                      {!['Delivered', 'Cancelled'].includes(o.status) && (
                        <button
                          onClick={() => setSelectedOrderForFailure(o)}
                          className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Fail Attempt</span>
                        </button>
                      )}

                      <Link
                        to={`/track/${o.trackingNumber}`}
                        className="px-3 py-2.5 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl"
                      >
                        Details
                      </Link>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Failure Reason Modal */}
      {selectedOrderForFailure && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Report Failed Delivery</h3>
                <p className="text-xs text-slate-500">Order #{selectedOrderForFailure.trackingNumber}</p>
              </div>
            </div>

            <form onSubmit={handleFailSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Failure</label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="Customer Unavailable / Door Locked">Customer Unavailable / Door Locked</option>
                  <option value="Incomplete or Unreachable Address">Incomplete or Unreachable Address</option>
                  <option value="Customer Requested Rescheduling">Customer Requested Rescheduling</option>
                  <option value="Customer Refused Delivery / COD Rejected">Customer Refused Delivery / COD Rejected</option>
                  <option value="Security / Gate Restricted Access">Security / Gate Restricted Access</option>
                  <option value="Package Damaged in Transit">Package Damaged in Transit</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Agent Notes & Observations</label>
                <textarea
                  rows={3}
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  placeholder="e.g. Rang bell twice, phoned customer with no response."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                Flagging this order will immediately notify the customer with an automated email & SMS with a rescheduling link.
              </p>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForFailure(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={failureSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md flex items-center gap-2"
                >
                  {failureSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>Flag as Failed</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default DeliveryAgentPage;
