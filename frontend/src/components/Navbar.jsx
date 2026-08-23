import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Calculator, 
  PlusCircle, 
  Truck, 
  ShieldCheck, 
  User, 
  LogOut, 
  ChevronDown, 
  Menu, 
  X,
  Compass,
  Sparkles
} from 'lucide-react';

const Navbar = () => {
  const { user, role, isAuthenticated, logout, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  const handleDemoSwitch = async (email, password) => {
    try {
      await login(email, password);
      setDemoMenuOpen(false);
      if (email.includes('admin')) navigate('/admin');
      else if (email.includes('agent')) navigate('/agent-tasks');
      else navigate('/my-orders');
    } catch (err) {
      console.error(err);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-900 to-blue-600 bg-clip-text text-transparent">
                  LastMile
                </span>
                <span className="text-xs uppercase px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold tracking-wider">
                  Tracker
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium -mt-0.5 hidden sm:block">
                Intelligent Logistics Platform
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/track"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/track') || location.pathname.startsWith('/track')
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Live Tracker</span>
            </Link>

            <Link
              to="/calculator"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/calculator')
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Rate Calculator</span>
            </Link>

            <Link
              to="/create-order"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/create-order')
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Book Shipment</span>
            </Link>

            {isAuthenticated && role === 'customer' && (
              <Link
                to="/my-orders"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/my-orders')
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>My Shipments</span>
              </Link>
            )}

            {isAuthenticated && role === 'agent' && (
              <Link
                to="/agent-tasks"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/agent-tasks')
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Agent Tasks</span>
              </Link>
            )}

            {isAuthenticated && role === 'admin' && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin')
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Admin Ops</span>
              </Link>
            )}
          </nav>

          {/* Right Action Buttons & Quick Role Switcher */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Demo Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Quick Role Demo</span>
                <ChevronDown className="w-3 h-3 text-amber-700" />
              </button>

              {demoMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">1-Click Role Switch</p>
                  </div>
                  <button
                    onClick={() => handleDemoSwitch('admin@lastmile.com', 'Admin@123')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-semibold text-purple-700">👑 Admin Ops</span>
                    <span className="text-[10px] text-slate-400 font-mono">admin@lastmile.com</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('rahul.agent@lastmile.com', 'Agent@123')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-semibold text-blue-700">🛵 Agent Rahul (South)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Bike</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('vikram.agent@lastmile.com', 'Agent@123')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-semibold text-blue-700">🚐 Agent Vikram (East)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Van</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('customer@lastmile.com', 'Customer@123')}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span className="font-semibold text-emerald-700">🛍️ Customer (Aravind)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Customer</span>
                  </button>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{user?.name}</p>
                  <p className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">{role}</p>
                </div>
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-3">
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-blue-600"
          >
            Live Tracker
          </Link>
          <Link
            to="/calculator"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-blue-600"
          >
            Rate Calculator
          </Link>
          <Link
            to="/create-order"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-sm font-medium text-slate-700 hover:text-blue-600"
          >
            Book Shipment
          </Link>
          {isAuthenticated && role === 'customer' && (
            <Link
              to="/my-orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-blue-600"
            >
              My Shipments
            </Link>
          )}
          {isAuthenticated && role === 'agent' && (
            <Link
              to="/agent-tasks"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-slate-700 hover:text-blue-600"
            >
              Agent Tasks
            </Link>
          )}
          {isAuthenticated && role === 'admin' && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-medium text-purple-700 hover:text-purple-900"
            >
              Admin Ops
            </Link>
          )}

          <div className="pt-3 border-t border-slate-200">
            {isAuthenticated ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">{user?.name}</p>
                  <p className="text-[10px] text-slate-500">{role}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs text-rose-600 bg-rose-50 rounded-md font-semibold"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
