import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Package, 
  MapPin, 
  Calendar, 
  CreditCard, 
  User, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Bell, 
  Layers,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { trackingAPI, orderAPI } from '../services/api';
import { getSocket, joinOrderRoom } from '../services/socket';
import StatusBadge from '../components/StatusBadge';
import TrackingMap from '../components/TrackingMap';
import OrderTimeline from '../components/OrderTimeline';
import NotificationDrawer from '../components/NotificationDrawer';

const stages = ['Created', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];

const PublicTrackerPage = () => {
  const { trackingNumber: urlTrackingNum } = useParams();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState(urlTrackingNum || '');
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  // Reschedule Modal state
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState('10:00 AM - 01:00 PM');
  const [rescheduleNotes, setRescheduleNotes] = useState('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleSuccessMsg, setRescheduleSuccessMsg] = useState('');

  const fetchTrackingData = async (tNum) => {
    if (!tNum) return;
    setLoading(true);
    setError('');
    try {
      const res = await trackingAPI.trackOrder(tNum.trim().toUpperCase());
      if (res.data.success) {
        setOrder(res.data.order);
        setTimeline(res.data.timeline);
        setNotifications(res.data.notifications);
        joinOrderRoom(res.data.order.trackingNumber);
      }
    } catch (err) {
      setError(err.response?.data?.message || `No shipment found for tracking number '${tNum}'.`);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlTrackingNum) {
      setSearchInput(urlTrackingNum);
      fetchTrackingData(urlTrackingNum);
    } else {
      // Default to one sample tracking number for immediate preview
      fetchTrackingData('LMD-2026-B94K2');
      setSearchInput('LMD-2026-B94K2');
    }
  }, [urlTrackingNum]);

  // Real-time WebSocket updates
  useEffect(() => {
    const socket = getSocket();
    const handleOrderUpdate = (data) => {
      if (order && data.trackingNumber === order.trackingNumber) {
        // Re-fetch fresh state
        fetchTrackingData(order.trackingNumber);
      }
    };

    socket.on('order_updated', handleOrderUpdate);
    return () => {
      socket.off('order_updated', handleOrderUpdate);
    };
  }, [order]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/track/${searchInput.trim().toUpperCase()}`);
      fetchTrackingData(searchInput.trim().toUpperCase());
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!order) return;
    setRescheduleSubmitting(true);
    try {
      const res = await orderAPI.rescheduleOrder(order._id, {
        rescheduledDate: rescheduleDate,
        rescheduledTimeSlot: rescheduleTimeSlot,
        notes: rescheduleNotes
      });
      if (res.data.success) {
        setRescheduleSuccessMsg('Your delivery has been successfully rescheduled and queued for agent reassignment!');
        setIsRescheduleModalOpen(false);
        fetchTrackingData(order.trackingNumber);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reschedule order. Please try again.');
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const getActiveStageIndex = () => {
    if (!order) return 0;
    if (order.status === 'Failed') return 4;
    if (order.status === 'Rescheduled') return 1;
    const idx = stages.indexOf(order.status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Search Header Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-Time GPS Logistics Telemetry
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            Track Last-Mile Delivery
          </h1>
          <p className="text-sm sm:text-base text-blue-100/80 mb-6">
            Enter your tracking ID to inspect live location, immutable audit logs, delivery quote breakdowns, and notification history.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Tracking ID (e.g. LMD-2026-X81A1, LMD-2026-F33X7)"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-slate-900 text-sm font-mono placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-md"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Track Now</span>
            </button>
          </form>

          {/* Quick Tracking ID Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-blue-200/80">
            <span>Sample Orders:</span>
            {['LMD-2026-X81A1', 'LMD-2026-B94K2', 'LMD-2026-F33X7', 'LMD-2026-D19M4'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setSearchInput(code);
                  navigate(`/track/${code}`);
                  fetchTrackingData(code);
                }}
                className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] transition-colors"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm mb-8 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Reschedule Success Alert */}
      {rescheduleSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm mb-8 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{rescheduleSuccessMsg}</span>
        </div>
      )}

      {/* Main Order Content */}
      {order && (
        <div className="space-y-8">
          
          {/* Top Status & Key Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900">
                    {order.trackingNumber}
                  </h2>
                  <StatusBadge status={order.status} size="lg" />
                </div>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>Placed on {new Date(order.createdAt).toLocaleString('en-IN')}</span>
                  <span>•</span>
                  <span>Order Type: <strong className="text-slate-700">{order.orderType}</strong></span>
                  <span>•</span>
                  <span>Zone: <strong className="text-slate-700">{order.isZoneIntra ? 'Intra-Zone' : 'Inter-Zone'}</strong></span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setNotifDrawerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
                >
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span>View Notifications ({notifications.length})</span>
                </button>
              </div>
            </div>

            {/* FAILED DELIVERY BANNER (Requirement: On failed delivery, customer receives notification and can reschedule) */}
            {order.status === 'Failed' && (
              <div className="mt-6 p-5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl mt-0.5">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-rose-900">
                      Delivery Attempt Unsuccessful: {order.failedDetails?.reason || 'Customer Unavailable'}
                    </h3>
                    <p className="text-xs text-rose-700 mt-1">
                      {order.failedDetails?.notes || 'Our agent could not complete the drop-off. Please choose a new date/time slot to reschedule.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRescheduleModalOpen(true)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 shrink-0"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reschedule Delivery Slot</span>
                </button>
              </div>
            )}

            {/* RESCHEDULED NOTICE BANNER */}
            {order.status === 'Rescheduled' && (
              <div className="mt-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
                <div className="text-xs text-indigo-900">
                  <strong>Rescheduled Attempt Confirmed:</strong> New delivery scheduled for{' '}
                  <span className="font-bold underline">
                    {order.failedDetails?.rescheduledDate ? new Date(order.failedDetails.rescheduledDate).toDateString() : 'Next Business Day'}
                  </span>{' '}
                  ({order.failedDetails?.rescheduledTimeSlot || 'Standard Slot'}). Agent is assigned.
                </div>
              </div>
            )}

            {/* Visual Lifecycle Stepper */}
            <div className="mt-8 pt-4">
              <div className="relative">
                <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />
                <div
                  className="hidden sm:block absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-500 z-0"
                  style={{
                    width: `${(getActiveStageIndex() / (stages.length - 1)) * 100}%`
                  }}
                />

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 relative z-10">
                  {stages.map((stage, idx) => {
                    const currentIndex = getActiveStageIndex();
                    const isCompleted = idx <= currentIndex && order.status !== 'Failed';
                    const isCurrent = idx === currentIndex;
                    const isFailedStage = order.status === 'Failed' && idx === currentIndex;

                    return (
                      <div key={stage} className="flex flex-col items-center text-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                            isFailedStage
                              ? 'bg-rose-600 border-rose-600 text-white ring-4 ring-rose-100'
                              : isCompleted
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : isCurrent
                              ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100 animate-pulse'
                              : 'bg-white border-slate-300 text-slate-400'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : isFailedStage ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-xs mt-2 font-semibold ${
                            isFailedStage
                              ? 'text-rose-600 font-bold'
                              : isCurrent
                              ? 'text-blue-700 font-bold'
                              : isCompleted
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Middle Grid: Map + Agent Card + Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Map & Live Route (Col Span 2) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900">Live Delivery Route & Map</h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    GPS: {order.liveLocation?.lat.toFixed(4)}, {order.liveLocation?.lng.toFixed(4)}
                  </span>
                </div>

                <TrackingMap
                  pickupCoords={order.pickupAddress?.coordinates}
                  dropCoords={order.dropAddress?.coordinates}
                  liveCoords={order.liveLocation}
                  pickupAddress={order.pickupAddress}
                  dropAddress={order.dropAddress}
                  status={order.status}
                />

                {/* Pickup and Drop Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-800 mb-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span>PICKUP LOCATION ({order.pickupZone?.code || 'ZONE'})</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{order.pickupAddress.street}</p>
                    <p className="text-xs text-slate-600">{order.pickupAddress.area}, {order.pickupAddress.city} - {order.pickupAddress.pincode}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>DELIVERY DESTINATION ({order.dropZone?.code || 'ZONE'})</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">{order.dropAddress.street}</p>
                    <p className="text-xs text-slate-600">{order.dropAddress.area}, {order.dropAddress.city} - {order.dropAddress.pincode}</p>
                  </div>
                </div>
              </div>

              {/* Immutable Tracking Audit Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900">Immutable Audit Trail & Timeline</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Logged with Actor & Timestamp</span>
                </div>
                <OrderTimeline timeline={timeline} />
              </div>
            </div>

            {/* Right Column: Driver Card, Pricing & Dimension Details */}
            <div className="space-y-6">
              
              {/* Assigned Delivery Agent Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-slate-400 mb-4">
                  Assigned Delivery Partner
                </h3>
                {order.assignedAgent ? (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                        {order.assignedAgent.name ? order.assignedAgent.name.charAt(0) : 'A'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{order.assignedAgent.name}</h4>
                        <p className="text-xs text-slate-500 capitalize">
                          Vehicle: {order.assignedAgent.agentDetails?.vehicleType || 'Bike'} • Status: {order.assignedAgent.agentDetails?.status || 'Active'}
                        </p>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Contact Agent:</span>
                      <span className="font-bold text-blue-700 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {order.assignedAgent.phone || '+91 98765 43211'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    <RefreshCw className="w-6 h-6 mx-auto mb-2 text-slate-300 animate-spin" />
                    Auto-assigning nearest available agent...
                  </div>
                )}
              </div>

              {/* Package & Weight Metrics (Volumetric Engine) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900">Package & Weight Engine</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Dimensions (L × B × H):</span>
                    <span className="font-mono font-bold text-slate-800">
                      {order.packageDetails?.lengthCm} × {order.packageDetails?.breadthCm} × {order.packageDetails?.heightCm} cm
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Actual Weight:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {order.packageDetails?.actualWeightKg} kg
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Volumetric Weight (L×B×H ÷ 5000):</span>
                    <span className="font-mono font-bold text-blue-700">
                      {order.packageDetails?.volumetricWeightKg} kg
                    </span>
                  </div>

                  <div className="flex justify-between py-2 px-3 bg-blue-50 rounded-lg text-blue-900 font-semibold">
                    <span>Chargeable Weight:</span>
                    <span className="font-mono font-bold text-sm">
                      {order.packageDetails?.chargeableWeightKg} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing & Rate Card Breakdown */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900">Auto-Calculated Pricing</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Base Price ({order.pricing?.baseWeightLimitKg || 0.5} kg slab):</span>
                    <span className="font-mono">₹{order.pricing?.basePrice?.toFixed(2)}</span>
                  </div>

                  {order.pricing?.extraWeightKg > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Extra Weight ({order.pricing.extraWeightKg} kg @ ₹{order.pricing.incrementalPricePerKg}/kg):</span>
                      <span className="font-mono">₹{order.pricing?.extraWeightCharge?.toFixed(2)}</span>
                    </div>
                  )}

                  {order.pricing?.codSurcharge > 0 && (
                    <div className="flex justify-between text-amber-700 font-medium">
                      <span>COD Surcharge ({order.orderType}):</span>
                      <span className="font-mono">₹{order.pricing?.codSurcharge?.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-100">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{order.pricing?.subtotal?.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>GST Tax ({order.pricing?.taxPercentage || 18}%):</span>
                    <span className="font-mono">₹{order.pricing?.taxAmount?.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between pt-3 border-t border-slate-200 text-sm font-bold text-slate-900">
                    <span>Total Billed Amount:</span>
                    <span className="text-emerald-700 font-mono text-base font-extrabold">
                      ₹{order.pricing?.totalAmount?.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-3 p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Payment Mode: <strong>{order.paymentType}</strong></span>
                    <span className="text-emerald-600 font-semibold">{order.paymentType === 'Prepaid' ? 'PAID ONLINE' : 'CASH ON DELIVERY'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reschedule Delivery Attempt</h3>
                <p className="text-xs text-slate-500">Shipment #{order?.trackingNumber}</p>
              </div>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Convenient Date</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Preferred Time Window</label>
                <select
                  value={rescheduleTimeSlot}
                  onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="09:00 AM - 01:00 PM">Morning (09:00 AM - 01:00 PM)</option>
                  <option value="01:00 PM - 05:00 PM">Afternoon (01:00 PM - 05:00 PM)</option>
                  <option value="05:00 PM - 08:30 PM">Evening (05:00 PM - 08:30 PM)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Special Delivery Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={rescheduleNotes}
                  onChange={(e) => setRescheduleNotes(e.target.value)}
                  placeholder="e.g. Please leave with security or call 10 mins before arrival"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRescheduleModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduleSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md flex items-center gap-2"
                >
                  {rescheduleSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm Reschedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatched Notifications Drawer */}
      <NotificationDrawer
        notifications={notifications}
        isOpen={notifDrawerOpen}
        onClose={() => setNotifDrawerOpen(false)}
      />

    </div>
  );
};

export default PublicTrackerPage;
