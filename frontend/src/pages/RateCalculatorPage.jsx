import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, 
  Package, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  CreditCard, 
  Sparkles, 
  RefreshCw,
  HelpCircle,
  ShieldCheck,
  Building2,
  UserCheck
} from 'lucide-react';
import { rateCardAPI, zoneAPI } from '../services/api';

const RateCalculatorPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    pickupPincode: '462016',
    pickupArea: 'Arera Colony (E1-E7)',
    pickupCity: 'Bhopal',
    dropPincode: '462042',
    dropArea: 'Kolar Road & Sarvdharm',
    dropCity: 'Bhopal',
    lengthCm: '30',
    breadthCm: '20',
    heightCm: '15',
    actualWeightKg: '1.5',
    orderType: 'B2C',
    paymentType: 'Prepaid'
  });

  const [availableAreas, setAvailableAreas] = useState([]);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load available mapped areas for quick pick
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

  const calculatePrice = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await rateCardAPI.calculateQuote({
        ...formData,
        lengthCm: parseFloat(formData.lengthCm),
        breadthCm: parseFloat(formData.breadthCm),
        heightCm: parseFloat(formData.heightCm),
        actualWeightKg: parseFloat(formData.actualWeightKg)
      });

      if (res.data.success) {
        setQuote(res.data.quote);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error calculating delivery quote. Please verify details.');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculatePrice();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAreaSelect = (type, areaObj) => {
    if (type === 'pickup') {
      setFormData((prev) => ({
        ...prev,
        pickupPincode: areaObj.pincode,
        pickupArea: areaObj.areaName,
        pickupCity: areaObj.city
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        dropPincode: areaObj.pincode,
        dropArea: areaObj.areaName,
        dropCity: areaObj.city
      }));
    }
  };

  const handleProceedToBooking = () => {
    navigate('/create-order', { state: { prefill: formData, quote } });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Delivery Rate & Volumetric Calculator
          </h1>
        </div>
        <p className="text-slate-500 text-sm max-w-2xl">
          Instantly compute shipping rates using our dynamic pricing engine with volumetric weight billing, B2B/B2C rate card lookups, and intra/inter-zone detection.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Input Form (Col Span 7) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <form onSubmit={calculatePrice} className="space-y-6">
            
            {/* Order Type & Payment Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Order Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('orderType', 'B2C')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      formData.orderType === 'B2C'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>B2C Retail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInputChange('orderType', 'B2B')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      formData.orderType === 'B2B'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>B2B Commercial</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange('paymentType', 'Prepaid')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      formData.paymentType === 'Prepaid'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Prepaid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInputChange('paymentType', 'COD')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      formData.paymentType === 'COD'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Cash on Delivery</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Locations */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Route & Serviceability
              </h3>

              {/* Pickup */}
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600" /> Pickup Location
                  </span>
                  {availableAreas.length > 0 && (
                    <select
                      onChange={(e) => {
                        const selected = availableAreas.find(a => a._id === e.target.value);
                        if (selected) handleAreaSelect('pickup', selected);
                      }}
                      className="text-[11px] bg-white border border-blue-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none"
                    >
                      <option value="">Quick Pick Hub...</option>
                      {availableAreas.map(a => (
                        <option key={a._id} value={a._id}>{a.areaName} ({a.pincode})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      value={formData.pickupPincode}
                      onChange={(e) => handleInputChange('pickupPincode', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Area / Locality</label>
                    <input
                      type="text"
                      required
                      value={formData.pickupArea}
                      onChange={(e) => handleInputChange('pickupArea', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">City</label>
                    <input
                      type="text"
                      value={formData.pickupCity}
                      onChange={(e) => handleInputChange('pickupCity', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Drop */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600" /> Drop Destination
                  </span>
                  {availableAreas.length > 0 && (
                    <select
                      onChange={(e) => {
                        const selected = availableAreas.find(a => a._id === e.target.value);
                        if (selected) handleAreaSelect('drop', selected);
                      }}
                      className="text-[11px] bg-white border border-emerald-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none"
                    >
                      <option value="">Quick Pick Destination...</option>
                      {availableAreas.map(a => (
                        <option key={a._id} value={a._id}>{a.areaName} ({a.pincode})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Pincode</label>
                    <input
                      type="text"
                      required
                      value={formData.dropPincode}
                      onChange={(e) => handleInputChange('dropPincode', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Area / Locality</label>
                    <input
                      type="text"
                      required
                      value={formData.dropArea}
                      onChange={(e) => handleInputChange('dropArea', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">City</label>
                    <input
                      type="text"
                      value={formData.dropCity}
                      onChange={(e) => handleInputChange('dropCity', e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Package Dimensions & Weight */}
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Package Measurements & Weight
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Length (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.lengthCm}
                    onChange={(e) => handleInputChange('lengthCm', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Breadth (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.breadthCm}
                    onChange={(e) => handleInputChange('breadthCm', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Height (cm)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.heightCm}
                    onChange={(e) => handleInputChange('heightCm', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Actual Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={formData.actualWeightKg}
                    onChange={(e) => handleInputChange('actualWeightKg', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              <span>Recalculate Estimate</span>
            </button>
          </form>
        </div>

        {/* Output Quote Card (Col Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {quote ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Price Estimate</span>
                  <div className="text-3xl font-extrabold font-mono text-slate-900 mt-1">
                    ₹{quote.pricing?.totalAmount?.toFixed(2)}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  quote.isZoneIntra
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  {quote.isZoneIntra ? 'Intra-Zone Rate' : 'Inter-Zone Rate'}
                </span>
              </div>

              {/* Zone Detection Details */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pickup Zone:</span>
                  <span className="font-bold text-slate-800">{quote.pickupZone?.name} ({quote.pickupZone?.code})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Drop Zone:</span>
                  <span className="font-bold text-slate-800">{quote.dropZone?.name} ({quote.dropZone?.code})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rate Card Matched:</span>
                  <span className="font-semibold text-blue-700">{quote.rateCardApplied?.name}</span>
                </div>
              </div>

              {/* Volumetric Calculation Card */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2.5 text-xs text-slate-800">
                <div className="flex items-center justify-between font-bold text-blue-900">
                  <span>Volumetric Weight Engine:</span>
                  <span className="font-mono text-sm">{quote.packageMetrics?.volumetricWeightKg} kg</span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono">
                  ({formData.lengthCm} × {formData.breadthCm} × {formData.heightCm}) ÷ 5000 = {quote.packageMetrics?.volumetricWeightKg} kg
                </p>
                <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between font-semibold">
                  <span>Chargeable Weight:</span>
                  <span className="font-bold text-blue-800 font-mono text-sm">
                    {quote.packageMetrics?.chargeableWeightKg} kg (billed on {quote.packageMetrics?.billedOn?.replace('_', ' ')})
                  </span>
                </div>
              </div>

              {/* Line Items Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Fare ({quote.rateCardApplied?.baseWeightLimitKg}kg slab):</span>
                  <span className="font-mono">₹{quote.pricing?.basePrice?.toFixed(2)}</span>
                </div>

                {quote.pricing?.extraWeightKg > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Extra Weight ({quote.pricing.extraWeightKg} kg @ ₹{quote.pricing.incrementalPricePerKg}/kg):</span>
                    <span className="font-mono">₹{quote.pricing?.extraWeightCharge?.toFixed(2)}</span>
                  </div>
                )}

                {quote.pricing?.codSurcharge > 0 && (
                  <div className="flex justify-between text-amber-800 font-medium">
                    <span>COD Surcharge ({formData.orderType}):</span>
                    <span className="font-mono">₹{quote.pricing?.codSurcharge?.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-100">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{quote.pricing?.subtotal?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>GST Tax ({quote.pricing?.taxPercentage}%):</span>
                  <span className="font-mono">₹{quote.pricing?.taxAmount?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-200 text-sm font-bold text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700 font-mono text-lg font-extrabold">
                    ₹{quote.pricing?.totalAmount?.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleProceedToBooking}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <span>Book Shipment with this Quote</span>
                <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
              Fill in the parameters and click calculate to view the real-time quote.
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default RateCalculatorPage;
