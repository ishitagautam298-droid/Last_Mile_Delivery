import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        await register({ name, email, password, role, phone });
      } else {
        await login(email, password);
      }

      if (role === 'admin' || email.includes('admin')) navigate('/admin');
      else if (role === 'agent' || email.includes('agent')) navigate('/agent-tasks');
      else navigate('/my-orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPass, targetRoute) => {
    setLoading(true);
    setError('');
    try {
      await login(demoEmail, demoPass);
      navigate(targetRoute);
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        
        {/* Logo and Intro */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-blue-500/25 mb-4">
            <Truck className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isRegister ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access the Last-Mile Logistics & Delivery Management Platform
          </p>
        </div>

        {/* Quick Demo Role Logins Card */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-sm space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>1-Click Evaluator Demo Logins</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('admin@lastmile.com', 'Admin@123', '/admin')}
              className="p-2.5 rounded-xl bg-white border border-amber-200 text-purple-800 hover:bg-purple-50 transition-colors text-left flex items-center justify-between"
            >
              <span>👑 Admin Ops</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('customer@lastmile.com', 'Customer@123', '/my-orders')}
              className="p-2.5 rounded-xl bg-white border border-amber-200 text-emerald-800 hover:bg-emerald-50 transition-colors text-left flex items-center justify-between"
            >
              <span>🛍️ Customer</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('rahul.agent@lastmile.com', 'Agent@123', '/agent-tasks')}
              className="p-2.5 rounded-xl bg-white border border-amber-200 text-blue-800 hover:bg-blue-50 transition-colors text-left flex items-center justify-between"
            >
              <span>🛵 Agent Rahul</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('vikram.agent@lastmile.com', 'Agent@123', '/agent-tasks')}
              className="p-2.5 rounded-xl bg-white border border-amber-200 text-blue-800 hover:bg-blue-50 transition-colors text-left flex items-center justify-between"
            >
              <span>🚐 Agent Vikram</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Auth Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          
          <div className="flex border-b border-slate-100 mb-6">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`flex-1 pb-3 text-xs font-bold border-b-2 text-center transition-colors ${
                !isRegister ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`flex-1 pb-3 text-xs font-bold border-b-2 text-center transition-colors ${
                isRegister ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {isRegister && (
              <>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ishita Gautam"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-semibold"
                  >
                    <option value="customer">Customer (Send / Receive Shipments)</option>
                    <option value="agent">Delivery Agent (Fleet Partner)</option>
                    <option value="admin">Operations Admin</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md flex items-center justify-center gap-2 mt-6"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{isRegister ? 'Register & Continue' : 'Sign In'}</span>
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};

export default LoginPage;
