import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, 
  MapPin, 
  CreditCard, 
  User, 
  Phone, 
  Mail, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight,
  AlertCircle,
  Building2,
  UserCheck,
  Zap,
  Info
} from 'lucide-react';
import { orderAPI, rateCardAPI, zoneAPI, authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CreateOrderPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, isAuthenticated } = useAuth();

  const prefillData = location.state?.prefill || {};

  const [formData, setFormData] = useState({
    customerName: user?.name || 'Aravind Swamy',
    customerEmail: user?.email || 'customer@lastmile.com',
    customerPhone: user?.phone || '+91 98450 11223',
    pickupStreet: 'No. 42, 80 Feet Road',
    pickupPincode: prefillData.pickupPincode || '560034',
    pickupArea: prefillData.pickupArea || 'Koramangala 4th Block',
    pickupCity: prefillData.pickupCity || 'Bangalore',
    dropStreet: 'Flat 304, Green Heights',
    dropPincode: prefillData.dropPincode || '560038',
    dropArea: prefillData.dropArea || 'Indiranagar 100ft Road',
    dropCity: prefillData.dropCity || 'Bangalore',
    lengthCm: prefillData.lengthCm || '25',
    breadthCm: prefillData.breadthCm || '20',
    heightCm: prefillData.heightCm || '15',
    actualWeightKg: prefillData.actualWeightKg || '1.2',
    description: 'Tech Accessories & Documents',
    declaredValue: '2500',
    orderType: prefillData.orderType || 'B2C',
    paymentType: prefillData.paymentType || 'Prepaid',
    autoAssign: true
  });

  const [availableAreas, setAvailableAreas] = useState([]);
  const [quote, setQuote] = useState(location.state?.quote || null);
  const [calculating, setCalculating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && !formData.customerName) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone || '+91 98450 11223'
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const res = await zoneAPI.getAreas();
        if (res.data.success) {
          setAvailableAreas(res.data.areas);
        }
      } catch (err) {
        console.error('Failed to load areas:', err);
      }
    };
    fetchAreas();
  }, []);

  const calculateLiveQuote = async () => {
    if (!formData.pickupPincode || !formData.dropPincode || !formData.lengthCm || !formData.actualWeightKg) return;
    setCalculating(true);
    setError('');
    try {
      const res = await rateCardAPI.calculateQuote({
        pickupPincode: formData.pickupPincode,
        pickupArea: formData.pickupArea,
        pickupCity: formData.pickupCity,
        dropPincode: formData.dropPincode,
        dropArea: formData.dropArea,
        dropCity: formData.dropCity,
        lengthCm: parseFloat(formData.lengthCm),
        breadthCm: parseFloat(formData.breadthCm),
        heightCm: parseFloat(formData.heightCm),
        actualWeightKg: parseFloat(formData.actualWeightKg),
        orderType: formData.orderType,
        paymentType: formData.paymentType
      });
      if (res.data.success) {
        setQuote(res.data.quote);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to compute verified rate card.');
      setQuote(null);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    calculateLiveQuote();
  }, [
    formData.pickupPincode,
    formData.pickupArea,
    formData.dropPincode,
    formData.dropArea,
    formData.lengthCm,
    formData.breadthCm,
    formData.heightCm,
    formData.actualWeightKg,
    formData.orderType,
    formData.paymentType
  ]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAreaSelect = (type, areaObj) => {
    if (type === 'pickup') {
      setFormData(prev => ({
        ...prev,
        pickupPincode: areaObj.pincode,
        pickupArea: areaObj.areaName,
        pickupCity: areaObj.city
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        dropPincode: areaObj.pincode,
        dropArea: areaObj.areaName,
        dropCity: areaObj.city
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to book this shipment.');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        pickupAddress: {
          street: formData.pickupStreet,
          area: formData.pickupArea,
          city: formData.pickupCity,
          pincode: formData.pickupPincode,
          state: 'Karnataka'
        },
        dropAddress: {
          street: formData.dropStreet,
          area: formData.dropArea,
          city: formData.dropCity,
          pincode: formData.dropPincode,
          state: 'Karnataka'
        },
        packageDetails: {
          lengthCm: parseFloat(formData.lengthCm),
          breadthCm: parseFloat(formData.breadthCm),
          heightCm: parseFloat(formData.heightCm),
          actualWeightKg: parseFloat(formData.actualWeightKg),
          description: formData.description,
          declaredValue: parseFloat(formData.declaredValue || 1000)
        },
        orderType: formData.orderType,
        paymentType: formData.paymentType,
        autoAssign: formData.autoAssign
      };

      const res = await orderAPI.createOrder(payload);
      if (res.data.success) {
        navigate(`/track/${res.data.order.trackingNumber}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Book New Delivery Shipment
          </h1>
        </div>
        <p className="text-slate-500 text-sm max-w-2xl">
          Create an order with instant volumetric pricing verification, automatic pickup and drop zone resolution, and intelligent agent auto-dispatch.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs mb-8 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Form Fields (Col Span 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Customer Details */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                1. Customer & Contact Details
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email for Notifications</label>
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number (SMS)</label>
                  <input
                    type="text"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Route Addresses */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                2. Pickup & Drop Addresses
              </h2>

              {/* Pickup Address */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" /> Origin / Pickup Address
                  </span>
                  {availableAreas.length > 0 && (
                    <select
                      onChange={(e) => {
                        const selected = availableAreas.find(a => a._id === e.target.value);
                        if (selected) handleAreaSelect('pickup', selected);
                      }}
                      className="text-[11px] bg-white border border-blue-200 rounded-lg px-2 py-1 text-slate-700"
                    >
                      <option value="">Choose Hub Area...</option>
                      {availableAreas.map(a => (
                        <option key={a._id} value={a._id}>{a.areaName} ({a.pincode})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="text-slate-600 block mb-1">Street Address / House No.</label>
                    <input
                      type="text"
                      required
                      value={formData.pickupStreet}
                      onChange={(e) => handleInputChange('pickupStreet', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      value={formData.pickupPincode}
                      onChange={(e) => handleInputChange('pickupPincode', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Area / Locality</label>
                    <input
                      type="text"
                      required
                      value={formData.pickupArea}
                      onChange={(e) => handleInputChange('pickupArea', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Drop Address */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" /> Destination / Drop Address
                  </span>
                  {availableAreas.length > 0 && (
                    <select
                      onChange={(e) => {
                        const selected = availableAreas.find(a => a._id === e.target.value);
                        if (selected) handleAreaSelect('drop', selected);
                      }}
                      className="text-[11px] bg-white border border-emerald-200 rounded-lg px-2 py-1 text-slate-700"
                    >
                      <option value="">Choose Destination Area...</option>
                      {availableAreas.map(a => (
                        <option key={a._id} value={a._id}>{a.areaName} ({a.pincode})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="text-slate-600 block mb-1">Street Address / Landmark</label>
                    <input
                      type="text"
                      required
                      value={formData.dropStreet}
                      onChange={(e) => handleInputChange('dropStreet', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      value={formData.dropPincode}
                      onChange={(e) => handleInputChange('dropPincode', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">Area / Locality</label>
                    <input
                      type="text"
                      required
                      value={formData.dropArea}
                      onChange={(e) => handleInputChange('dropArea', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Package Specifications & Volumetric Dimensions */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                3. Parcel Dimensions, Weight & Specs
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Length (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.lengthCm}
                    onChange={(e) => handleInputChange('lengthCm', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Breadth (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.breadthCm}
                    onChange={(e) => handleInputChange('breadthCm', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.heightCm}
                    onChange={(e) => handleInputChange('heightCm', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Actual Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.actualWeightKg}
                    onChange={(e) => handleInputChange('actualWeightKg', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Parcel Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Declared Value (₹)</label>
                  <input
                    type="number"
                    value={formData.declaredValue}
                    onChange={(e) => handleInputChange('declaredValue', e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Type, Payment & Auto-Dispatch */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                4. Logistics Options
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 text-xs block mb-2">Order Classification</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange('orderType', 'B2C')}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                        formData.orderType === 'B2C'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      B2C Retail
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('orderType', 'B2B')}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                        formData.orderType === 'B2B'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      B2B Commercial
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 text-xs block mb-2">Payment Collection</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange('paymentType', 'Prepaid')}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                        formData.paymentType === 'Prepaid'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Prepaid
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('paymentType', 'COD')}
                      className={`py-3 rounded-xl text-xs font-bold border transition-all ${
                        formData.paymentType === 'COD'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Cash on Delivery
                    </button>
                  </div>
                </div>
              </div>

              {/* Auto-Assignment Toggle */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-xl">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-blue-900">Intelligent Auto-Assignment Dispatch</h3>
                    <p className="text-[11px] text-blue-700">Detect and assign nearest online delivery agent on confirmation</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.autoAssign}
                  onChange={(e) => handleInputChange('autoAssign', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

            </div>

          </div>

          {/* Pricing Quote & Confirmation Card (Col Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm sticky top-24 space-y-6">
              
              <div className="pb-4 border-b border-slate-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Verified Price Quote
                </span>
                <div className="text-3xl font-extrabold font-mono text-slate-900 mt-1">
                  {quote ? `₹${quote.pricing?.totalAmount?.toFixed(2)}` : 'Calculating...'}
                </div>
                {quote && (
                  <p className="text-xs text-slate-500 mt-1">
                    {quote.isZoneIntra ? '🟢 Intra-Zone Fare' : '🟣 Inter-Zone Fare'} ({formData.orderType})
                  </p>
                )}
              </div>

              {quote && (
                <div className="space-y-3 text-xs">
                  
                  {/* Volumetric Engine Summary */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Volumetric Wt:</span>
                      <span className="font-mono font-bold text-slate-800">{quote.packageMetrics?.volumetricWeightKg} kg</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Actual Weight:</span>
                      <span className="font-mono font-bold text-slate-800">{quote.packageMetrics?.actualWeightKg} kg</span>
                    </div>
                    <div className="flex justify-between font-bold text-blue-800 pt-1 border-t border-slate-200">
                      <span>Chargeable Wt:</span>
                      <span className="font-mono">{quote.packageMetrics?.chargeableWeightKg} kg</span>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <span>Base Freight Fare:</span>
                      <span className="font-mono">₹{quote.pricing?.basePrice?.toFixed(2)}</span>
                    </div>

                    {quote.pricing?.extraWeightKg > 0 && (
                      <div className="flex justify-between">
                        <span>Extra Weight Charge:</span>
                        <span className="font-mono">₹{quote.pricing?.extraWeightCharge?.toFixed(2)}</span>
                      </div>
                    )}

                    {quote.pricing?.codSurcharge > 0 && (
                      <div className="flex justify-between text-amber-700 font-medium">
                        <span>COD Surcharge:</span>
                        <span className="font-mono">₹{quote.pricing?.codSurcharge?.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between pt-1 border-t border-slate-100">
                      <span>GST Tax ({quote.pricing?.taxPercentage}%):</span>
                      <span className="font-mono">₹{quote.pricing?.taxAmount?.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                      <span>Total Payable:</span>
                      <span className="text-emerald-700 font-mono text-base font-extrabold">
                        ₹{quote.pricing?.totalAmount?.toFixed(2)}
                      </span>
                    </div>
                  </div>

                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !quote}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-sm transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
                <span>Confirm & Place Order</span>
              </button>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
                <Info className="w-3.5 h-3.5" />
                <span>Price is locked and shown transparently before checkout</span>
              </div>

            </div>
          </div>

        </div>
      </form>

    </div>
  );
};

export default CreateOrderPage;
