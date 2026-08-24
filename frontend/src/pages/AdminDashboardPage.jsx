import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Package, 
  MapPin, 
  Calculator, 
  Users, 
  TrendingUp, 
  RefreshCw, 
  Filter, 
  Search, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Sliders,
  DollarSign,
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  Layers,
  Bell
} from 'lucide-react';
import { 
  analyticsAPI, 
  orderAPI, 
  zoneAPI, 
  rateCardAPI, 
  authAPI,
  trackingAPI 
} from '../services/api';
import StatusBadge from '../components/StatusBadge';
import NotificationDrawer from '../components/NotificationDrawer';

const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('orders'); // 'metrics' | 'orders' | 'zones' | 'ratecards'
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [zones, setZones] = useState([]);
  const [areas, setAreas] = useState([]);
  const [rateCards, setRateCards] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters for Orders Tab
  const [orderFilter, setOrderFilter] = useState({
    status: 'all',
    zone: 'all',
    agent: 'all',
    orderType: 'all',
    paymentType: 'all',
    search: ''
  });

  // Notifications Drawer
  const [activeNotifs, setActiveNotifs] = useState({ open: false, list: [], loading: false, trackingNumber: '' });

  // Modal States
  const [manualAssignModal, setManualAssignModal] = useState({ open: false, order: null, selectedAgentId: '' });
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [statusOverrideModal, setStatusOverrideModal] = useState({ open: false, order: null, newStatus: '', reason: '', notes: '' });
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [zoneModal, setZoneModal] = useState({ open: false, mode: 'create', data: { name: '', code: '', city: 'Bhopal', description: '', lat: 23.2332, lng: 77.4344 } });
  const [areaModal, setAreaModal] = useState({ open: false, data: { pincode: '', areaName: '', city: 'Bhopal', state: 'Madhya Pradesh', zoneId: '' } });
  const [rateCardModal, setRateCardModal] = useState({ open: false, mode: 'create', data: { name: '', orderType: 'B2C', scope: 'intra_zone', baseWeightLimitKg: 0.5, basePrice: 45, incrementalPricePerKg: 20, codSurchargeType: 'fixed', codSurchargeValue: 25, minCodFee: 20, taxPercentage: 18 } });

  const handleOpenNotifications = async (trackingNumber) => {
    setActiveNotifs({ open: true, list: [], loading: true, trackingNumber });
    try {
      const res = await trackingAPI.getNotifications(trackingNumber);
      if (res.data.success) {
        setActiveNotifs({ open: true, list: res.data.notifications, loading: false, trackingNumber });
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setActiveNotifs(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [metricsRes, ordersRes, zonesRes, areasRes, rateCardsRes, agentsRes] = await Promise.all([
        analyticsAPI.getDashboardMetrics(),
        orderAPI.getOrders(orderFilter),
        zoneAPI.getZones(),
        zoneAPI.getAreas(),
        rateCardAPI.getRateCards(),
        authAPI.getAgents()
      ]);

      if (metricsRes.data.success) setMetrics(metricsRes.data.metrics);
      if (ordersRes.data.success) setOrders(ordersRes.data.orders);
      if (zonesRes.data.success) setZones(zonesRes.data.zones);
      if (areasRes.data.success) setAreas(areasRes.data.areas);
      if (rateCardsRes.data.success) setRateCards(rateCardsRes.data.rateCards);
      if (agentsRes.data.success) setAgents(agentsRes.data.agents);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [orderFilter.status, orderFilter.zone, orderFilter.agent, orderFilter.orderType, orderFilter.paymentType]);

  // Order Actions
  const handleAutoAssign = async (orderId) => {
    try {
      const res = await orderAPI.autoAssign(orderId);
      if (res.data.success) {
        alert('Auto-assignment executed successfully!');
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Auto-assignment failed');
    }
  };

  const handleManualAssignSubmit = async (e) => {
    e.preventDefault();
    const targetAgentId = manualAssignModal.selectedAgentId || agents[0]?._id;
    if (!manualAssignModal.order || !targetAgentId) {
      alert('Please select a valid delivery agent.');
      return;
    }
    setAssignSubmitting(true);
    try {
      const res = await orderAPI.manualAssign(manualAssignModal.order._id, targetAgentId);
      if (res.data.success) {
        alert('Agent assigned successfully!');
        setManualAssignModal({ open: false, order: null, selectedAgentId: '' });
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Manual assignment failed');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleStatusOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!statusOverrideModal.order || !statusOverrideModal.newStatus) return;
    setOverrideSubmitting(true);
    try {
      const res = await orderAPI.overrideStatus(statusOverrideModal.order._id, {
        status: statusOverrideModal.newStatus,
        reason: statusOverrideModal.reason || 'Admin Executive Override',
        notes: statusOverrideModal.notes || 'Status updated via Operations Control Center'
      });
      if (res.data.success) {
        alert(`Status overridden to ${statusOverrideModal.newStatus}`);
        setStatusOverrideModal({ open: false, order: null, newStatus: '', reason: '', notes: '' });
        fetchDashboardData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Status override failed');
    } finally {
      setOverrideSubmitting(false);
    }
  };

  // Zone Actions
  const handleSaveZone = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: zoneModal.data.name,
        code: zoneModal.data.code,
        city: zoneModal.data.city,
        description: zoneModal.data.description,
        centerCoordinates: {
          lat: parseFloat(zoneModal.data.lat || 12.9716),
          lng: parseFloat(zoneModal.data.lng || 77.5946)
        }
      };

      if (zoneModal.mode === 'create') {
        await zoneAPI.createZone(payload);
      } else {
        await zoneAPI.updateZone(zoneModal.data._id, payload);
      }

      setZoneModal({ open: false, mode: 'create', data: {} });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving zone');
    }
  };

  const handleDeleteZone = async (id) => {
    if (!window.confirm('Are you sure you want to delete this zone and all its area mappings?')) return;
    try {
      await zoneAPI.deleteZone(id);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting zone');
    }
  };

  // Area Actions
  const handleSaveArea = async (e) => {
    e.preventDefault();
    try {
      await zoneAPI.createArea(areaModal.data);
      setAreaModal({ open: false, data: { city: 'Bhopal', state: 'Madhya Pradesh' } });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding area mapping');
    }
  };

  const handleDeleteArea = async (id) => {
    if (!window.confirm('Delete this area mapping?')) return;
    try {
      await zoneAPI.deleteArea(id);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting area');
    }
  };

  // Rate Card Actions
  const handleSaveRateCard = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...rateCardModal.data,
        baseWeightLimitKg: parseFloat(rateCardModal.data.baseWeightLimitKg),
        basePrice: parseFloat(rateCardModal.data.basePrice),
        incrementalPricePerKg: parseFloat(rateCardModal.data.incrementalPricePerKg),
        codSurchargeValue: parseFloat(rateCardModal.data.codSurchargeValue),
        minCodFee: parseFloat(rateCardModal.data.minCodFee || 20),
        taxPercentage: parseFloat(rateCardModal.data.taxPercentage || 18)
      };

      if (rateCardModal.mode === 'create') {
        await rateCardAPI.createRateCard(payload);
      } else {
        await rateCardAPI.updateRateCard(rateCardModal.data._id, payload);
      }

      setRateCardModal({ open: false, mode: 'create', data: {} });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving rate card');
    }
  };

  const handleDeleteRateCard = async (id) => {
    if (!window.confirm('Are you sure you want to remove this rate card?')) return;
    try {
      await rateCardAPI.deleteRateCard(id);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing rate card');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[11px] font-bold uppercase tracking-wider border border-purple-400/30">
              Operations Control Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Logistics & Fleet Management
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
            Dynamic Rate Engine Configuration • Zone Resolution Mappings • Intelligent Auto-Assignment Dispatch
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/create-order"
            className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-xs transition-colors shadow-md flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Order for Customer</span>
          </Link>
          <button
            onClick={fetchDashboardData}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
            <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">{metrics.totalOrders}</div>
            <span className="text-[10px] text-slate-500 font-medium">B2B: {metrics.b2bOrders} | B2C: {metrics.b2cOrders}</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Active Fleet</span>
            <div className="text-2xl font-extrabold font-mono text-blue-700 mt-1">{metrics.activeOrders}</div>
            <span className="text-[10px] text-slate-500 font-medium">In Transit / Out for Drop</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Delivered</span>
            <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-1">{metrics.deliveredOrders}</div>
            <span className="text-[10px] text-emerald-600 font-medium">Completed Deliveries</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Failed Rate</span>
            <div className="text-2xl font-extrabold font-mono text-rose-700 mt-1">{metrics.failedRatePercentage}%</div>
            <span className="text-[10px] text-rose-600 font-medium">{metrics.failedOrders} Failed Attempts</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Online Drivers</span>
            <div className="text-2xl font-extrabold font-mono text-slate-900 mt-1">{metrics.activeAgents} / {metrics.totalAgents}</div>
            <span className="text-[10px] text-slate-500 font-medium">Ready for Dispatch</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
            <div className="text-2xl font-extrabold font-mono text-emerald-700 mt-1">₹{metrics.totalRevenue}</div>
            <span className="text-[10px] text-slate-500 font-medium">Billed Freight</span>
          </div>

        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-8 overflow-x-auto">
        {[
          { id: 'orders', label: '📦 Orders & Dispatch Manager', icon: Package },
          { id: 'ratecards', label: '⚡ Dynamic Rate Cards (B2B/B2C)', icon: Calculator },
          { id: 'zones', label: '🗺️ Zones & Area Mappings', icon: MapPin },
          { id: 'agents', label: '🛵 Fleet & Delivery Executives', icon: Users }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORDERS & DISPATCH MANAGER */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="text-slate-500 block mb-1 font-semibold">Status</label>
              <select
                value={orderFilter.status}
                onChange={(e) => setOrderFilter(prev => ({ ...prev, status: e.target.value }))}
                className="w-full p-2 rounded-xl border border-slate-200"
              >
                <option value="all">All Statuses</option>
                <option value="Created">Created</option>
                <option value="Assigned">Assigned</option>
                <option value="Picked Up">Picked Up</option>
                <option value="In Transit">In Transit</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Failed">Failed</option>
                <option value="Rescheduled">Rescheduled</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 block mb-1 font-semibold">Zone</label>
              <select
                value={orderFilter.zone}
                onChange={(e) => setOrderFilter(prev => ({ ...prev, zone: e.target.value }))}
                className="w-full p-2 rounded-xl border border-slate-200"
              >
                <option value="all">All Zones</option>
                {zones.map(z => (
                  <option key={z._id} value={z._id}>{z.name} ({z.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-500 block mb-1 font-semibold">Order Type</label>
              <select
                value={orderFilter.orderType}
                onChange={(e) => setOrderFilter(prev => ({ ...prev, orderType: e.target.value }))}
                className="w-full p-2 rounded-xl border border-slate-200"
              >
                <option value="all">All Types</option>
                <option value="B2C">B2C Retail</option>
                <option value="B2B">B2B Commercial</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 block mb-1 font-semibold">Payment Mode</label>
              <select
                value={orderFilter.paymentType}
                onChange={(e) => setOrderFilter(prev => ({ ...prev, paymentType: e.target.value }))}
                className="w-full p-2 rounded-xl border border-slate-200"
              >
                <option value="all">All Payments</option>
                <option value="Prepaid">Prepaid</option>
                <option value="COD">Cash on Delivery</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-500 block mb-1 font-semibold">Search Query</label>
              <input
                type="text"
                value={orderFilter.search}
                onChange={(e) => setOrderFilter(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Tracking ID, Customer, Area..."
                className="w-full p-2 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Tracking ID</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Route & Zones</th>
                    <th className="py-3.5 px-4">Weight (Chargeable)</th>
                    <th className="py-3.5 px-4">Fare & Mode</th>
                    <th className="py-3.5 px-4">Assigned Agent</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">
                        <Link to={`/track/${o.trackingNumber}`} className="hover:underline flex items-center gap-1">
                          <span>{o.trackingNumber}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{o.customerName}</div>
                        <div className="text-slate-400 text-[11px]">{o.customerEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-700 font-medium">{o.pickupAddress?.area} → {o.dropAddress?.area}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {o.isZoneIntra ? 'Intra-Zone' : 'Inter-Zone'} ({o.orderType})
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-800">{o.packageDetails?.chargeableWeightKg} kg</span>
                        <div className="text-[10px] text-slate-400">Vol: {o.packageDetails?.volumetricWeightKg} kg</div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-emerald-700 text-sm">₹{o.pricing?.totalAmount?.toFixed(2)}</span>
                        <div className="text-[10px] text-slate-500 font-sans">{o.paymentType}</div>
                      </td>
                      <td className="py-3 px-4">
                        {o.assignedAgent ? (
                          <div className="font-semibold text-slate-800 flex items-center gap-1">
                            <span>{o.assignedAgent.name}</span>
                            <span className="text-[10px] text-slate-400 capitalize">({o.assignedAgent.agentDetails?.vehicleType})</span>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-medium italic">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={o.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        
                        {/* Auto Assign Button */}
                        {!['Delivered', 'Cancelled'].includes(o.status) && (
                          <button
                            onClick={() => handleAutoAssign(o._id)}
                            title="Trigger Intelligent Auto-Assignment"
                            className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Manual Assign Button */}
                        {!['Delivered', 'Cancelled'].includes(o.status) && (
                          <button
                            onClick={() => setManualAssignModal({ open: true, order: o, selectedAgentId: agents[0]?._id || '' })}
                            title="Manually Assign Delivery Agent"
                            className="p-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-bold"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Override Status Button */}
                        <button
                          onClick={() => setStatusOverrideModal({ open: true, order: o, newStatus: o.status, reason: '', notes: '' })}
                          title="Override Order Status"
                          className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>

                        {/* View Messages & Email Button */}
                        <button
                          onClick={() => handleOpenNotifications(o.trackingNumber)}
                          title="View Messages & Email Logs"
                          className="p-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg font-bold"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: DYNAMIC RATE CARDS */}
      {activeTab === 'ratecards' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Configured Rate Cards (Zero Hardcoding)</h2>
              <p className="text-xs text-slate-500">Configure base slabs, per-kg rates, COD fees, and GST rates for B2B & B2C shipments.</p>
            </div>
            <button
              onClick={() => setRateCardModal({ open: true, mode: 'create', data: { name: '', orderType: 'B2C', scope: 'intra_zone', baseWeightLimitKg: 0.5, basePrice: 50, incrementalPricePerKg: 20, codSurchargeType: 'fixed', codSurchargeValue: 25, minCodFee: 20, taxPercentage: 18 } })}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Rate Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rateCards.map((rc) => (
              <div key={rc._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{rc.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">{rc.orderType}</span>
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold text-[10px] uppercase">
                          {rc.scope.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold font-mono text-emerald-700">₹{rc.basePrice}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">up to {rc.baseWeightLimitKg} kg</span>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Extra Weight Incremental Rate:</span>
                      <span className="font-mono font-bold text-slate-800">₹{rc.incrementalPricePerKg} / kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>COD Surcharge ({rc.codSurchargeType}):</span>
                      <span className="font-mono font-bold text-amber-700">
                        {rc.codSurchargeType === 'percentage' ? `${rc.codSurchargeValue}% (Min ₹${rc.minCodFee})` : `₹${rc.codSurchargeValue}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax GST:</span>
                      <span className="font-mono text-slate-800">{rc.taxPercentage || 18}%</span>
                    </div>
                    {rc.description && (
                      <p className="text-[11px] text-slate-400 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {rc.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setRateCardModal({ open: true, mode: 'edit', data: rc })}
                    className="px-3 py-1.5 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-lg flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRateCard(rc._id)}
                    className="px-3 py-1.5 text-xs bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ZONES & AREA MAPPINGS */}
      {activeTab === 'zones' && (
        <div className="space-y-8">
          
          {/* Zones Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Municipal Delivery Zones</h2>
                <p className="text-xs text-slate-500">Serviceable geographic zones for intra vs inter routing.</p>
              </div>
              <button
                onClick={() => setZoneModal({ open: true, mode: 'create', data: { name: '', code: '', city: 'Bhopal', description: '', lat: 23.2332, lng: 77.4344 } })}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Add Zone
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map((z) => (
                <div key={z._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {z.code}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{z.city}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{z.name}</h3>
                    <p className="text-xs text-slate-500">{z.description}</p>
                    <p className="text-[11px] font-mono text-slate-400 mt-2">
                      Center: {z.centerCoordinates?.lat}, {z.centerCoordinates?.lng}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setZoneModal({ open: true, mode: 'edit', data: { ...z, lat: z.centerCoordinates?.lat, lng: z.centerCoordinates?.lng } })}
                      className="p-1.5 text-slate-500 hover:text-slate-800"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteZone(z._id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Area to Zone Mappings */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pincode & Locality Resolution Mappings</h2>
                <p className="text-xs text-slate-500">Maps user pickup/drop pincodes and localities to assigned operational zones.</p>
              </div>
              <button
                onClick={() => setAreaModal({ open: true, data: { pincode: '', areaName: '', city: 'Bhopal', state: 'Madhya Pradesh', zoneId: zones[0]?._id } })}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Map New Pincode/Area
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="py-3 px-4">Pincode</th>
                      <th className="py-3 px-4">Area Name</th>
                      <th className="py-3 px-4">City / State</th>
                      <th className="py-3 px-4">Assigned Zone</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {areas.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{a.pincode}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{a.areaName}</td>
                        <td className="py-2.5 px-4 text-slate-500">{a.city}, {a.state}</td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px]">
                            {a.zone?.name || 'Assigned Zone'} ({a.zone?.code})
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteArea(a._id)}
                            className="text-rose-600 hover:text-rose-800 font-bold"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 4: AGENTS & FLEET */}
      {activeTab === 'agents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Delivery Fleet & Agents</h2>
              <p className="text-xs text-slate-500">Live agent availability, vehicle types, assigned zones, and active workloads.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map((ag) => (
              <div key={ag._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    ag.agentDetails?.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {ag.agentDetails?.status || 'Active'}
                  </span>
                  <span className="text-xs font-mono capitalize text-slate-500">{ag.agentDetails?.vehicleType || 'Bike'}</span>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{ag.name}</h3>
                <p className="text-xs text-slate-500">{ag.phone}</p>
                
                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Zone:</span>
                    <span className="font-bold text-slate-800">{ag.agentDetails?.assignedZone?.name || 'Central'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Active Orders:</span>
                    <span className="font-bold text-blue-700">{ag.agentDetails?.activeDeliveriesCount || 0} / {ag.agentDetails?.maxActiveDeliveries || 5}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MANUAL ASSIGN MODAL */}
      {manualAssignModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-1">Manually Assign Delivery Agent</h3>
            <p className="text-xs text-slate-500 mb-4">
              Order <span className="font-mono font-bold text-purple-700">#{manualAssignModal.order?.trackingNumber}</span> • {manualAssignModal.order?.customerName}
            </p>
            
            <form onSubmit={handleManualAssignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Select Delivery Agent</label>
                <select
                  value={manualAssignModal.selectedAgentId || agents[0]?._id || ''}
                  onChange={(e) => setManualAssignModal(prev => ({ ...prev, selectedAgentId: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {agents.map(ag => (
                    <option key={ag._id} value={ag._id}>
                      {ag.name} ({ag.agentDetails?.vehicleType || 'Courier'}) • Active: {ag.agentDetails?.activeDeliveriesCount || 0} orders
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  disabled={assignSubmitting}
                  onClick={() => setManualAssignModal({ open: false, order: null, selectedAgentId: '' })}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignSubmitting}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-500/25 flex items-center gap-2 disabled:opacity-50"
                >
                  {assignSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Assigning Agent...</span>
                    </>
                  ) : (
                    <span>Assign Agent</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATUS OVERRIDE MODAL */}
      {statusOverrideModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-2">Admin Status Override</h3>
            <p className="text-xs text-slate-500 mb-4">Order #{statusOverrideModal.order?.trackingNumber}</p>
            
            <form onSubmit={handleStatusOverrideSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Set Target Status</label>
                <select
                  value={statusOverrideModal.newStatus}
                  onChange={(e) => setStatusOverrideModal(prev => ({ ...prev, newStatus: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold"
                >
                  <option value="Created">Created</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Failed">Failed</option>
                  <option value="Rescheduled">Rescheduled</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Override</label>
                <input
                  type="text"
                  required
                  value={statusOverrideModal.reason}
                  onChange={(e) => setStatusOverrideModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Verified customer confirmation over call"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Admin Notes</label>
                <textarea
                  rows={2}
                  value={statusOverrideModal.notes}
                  onChange={(e) => setStatusOverrideModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Audit notes..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  disabled={overrideSubmitting}
                  onClick={() => setStatusOverrideModal({ open: false, order: null, newStatus: '', reason: '', notes: '' })}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideSubmitting}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {overrideSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Applying Override...</span>
                    </>
                  ) : (
                    <span>Apply Override</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RATE CARD MODAL */}
      {rateCardModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {rateCardModal.mode === 'create' ? 'Create Dynamic Rate Card' : 'Edit Rate Card'}
            </h3>

            <form onSubmit={handleSaveRateCard} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Rate Card Name</label>
                <input
                  type="text"
                  required
                  value={rateCardModal.data.name || ''}
                  onChange={(e) => setRateCardModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                  placeholder="e.g. B2C Intra-Zone Standard"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Order Classification</label>
                  <select
                    value={rateCardModal.data.orderType || 'B2C'}
                    onChange={(e) => setRateCardModal(prev => ({ ...prev, data: { ...prev.data, orderType: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="B2C">B2C</option>
                    <option value="B2B">B2B</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Zone Scope</label>
                  <select
                    value={rateCardModal.data.scope || 'intra_zone'}
                    onChange={(e) => setRateCardModal(prev => ({ ...prev, data: { ...prev.data, scope: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="intra_zone">Intra-Zone (Same Zone)</option>
                    <option value="inter_zone">Inter-Zone (Cross Zone)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Wt Slab (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={rateCardModal.data.baseWeightLimitKg || ''}
                    onChange={(e) => setRateCardModal(prev => ({ ...prev, data: { ...prev.data, baseWeightLimitKg: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Base Fare (₹)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={rateCardModal.data.basePrice || ''}
                    onChange={(e) => setRateCardModal(prev => ({ ...prev, data: { ...prev.data, basePrice: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Extra ₹/kg</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={rateCardModal.data.incrementalPricePerKg || ''}
                    onChange={(e) => setRateCardModal(prev => ({ ...prev, data: { ...prev.data, incrementalPricePerKg: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">COD Fee Type</label>
                  <select
                    value={rateCardModal.data.codSurchargeType || 'fixed'}
                    onChange={(e) => setRateCardModal(prev => ({ ...prev, data: { ...prev.data, codSurchargeType: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="fixed">Fixed Flat Fee (₹)</option>
                    <option value="percentage">Percentage of Total (%)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">COD Value</label>
                  <input
                    type="number"
                    step="0.5"
                    value={rateCardModal.data.codSurchargeValue || ''}
                    onChange={(e) => setRateCardModal(prev => ({ ...prev, data: { ...prev.data, codSurchargeValue: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setRateCardModal({ open: false, mode: 'create', data: {} })}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
                >
                  Save Rate Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ZONE MODAL */}
      {zoneModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {zoneModal.mode === 'create' ? 'Create Delivery Zone' : 'Edit Zone'}
            </h3>

            <form onSubmit={handleSaveZone} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  value={zoneModal.data.name || ''}
                  onChange={(e) => setZoneModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                  placeholder="e.g. South Zone (Tech Hub)"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Code (Unique)</label>
                  <input
                    type="text"
                    required
                    value={zoneModal.data.code || ''}
                    onChange={(e) => setZoneModal(prev => ({ ...prev, data: { ...prev.data, code: e.target.value } }))}
                    placeholder="SZ-01"
                    className="w-full p-2.5 rounded-xl border border-slate-200 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={zoneModal.data.city || 'Bhopal'}
                    onChange={(e) => setZoneModal(prev => ({ ...prev, data: { ...prev.data, city: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={zoneModal.data.description || ''}
                  onChange={(e) => setZoneModal(prev => ({ ...prev, data: { ...prev.data, description: e.target.value } }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setZoneModal({ open: false, mode: 'create', data: {} })}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl"
                >
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AREA MODAL */}
      {areaModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-4">Map Area / Pincode to Zone</h3>

            <form onSubmit={handleSaveArea} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={areaModal.data.pincode || ''}
                    onChange={(e) => setAreaModal(prev => ({ ...prev, data: { ...prev.data, pincode: e.target.value } }))}
                    placeholder="560034"
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Area / Locality Name</label>
                  <input
                    type="text"
                    required
                    value={areaModal.data.areaName || ''}
                    onChange={(e) => setAreaModal(prev => ({ ...prev, data: { ...prev.data, areaName: e.target.value } }))}
                    placeholder="Koramangala 4th Block"
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign to Zone</label>
                <select
                  required
                  value={areaModal.data.zoneId || ''}
                  onChange={(e) => setAreaModal(prev => ({ ...prev, data: { ...prev.data, zoneId: e.target.value } }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                >
                  <option value="">Select Zone...</option>
                  {zones.map(z => (
                    <option key={z._id} value={z._id}>{z.name} ({z.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAreaModal({ open: false, data: {} })}
                  className="px-4 py-2 border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Save Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatched Notifications Drawer */}
      <NotificationDrawer
        isOpen={activeNotifs.open}
        notifications={activeNotifs.list}
        onClose={() => setActiveNotifs({ open: false, list: [], loading: false, trackingNumber: '' })}
      />

    </div>
  );
};

export default AdminDashboardPage;
