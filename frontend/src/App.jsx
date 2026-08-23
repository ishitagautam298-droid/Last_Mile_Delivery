import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import PublicTrackerPage from './pages/PublicTrackerPage';
import RateCalculatorPage from './pages/RateCalculatorPage';
import CreateOrderPage from './pages/CreateOrderPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import DeliveryAgentPage from './pages/DeliveryAgentPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Verifying session credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/track" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/track" replace />} />
          <Route path="/track" element={<PublicTrackerPage />} />
          <Route path="/track/:trackingNumber" element={<PublicTrackerPage />} />
          <Route path="/calculator" element={<RateCalculatorPage />} />
          <Route path="/create-order" element={<CreateOrderPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Customer Portal */}
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute allowedRoles={['customer', 'admin']}>
                <CustomerDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Agent Portal */}
          <Route
            path="/agent-tasks"
            element={
              <ProtectedRoute allowedRoles={['agent', 'admin']}>
                <DeliveryAgentPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Command Center */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/track" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Last-Mile Delivery Tracker. Enterprise Logistics Platform.</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Dynamic Rate Engine</span>
            <span>•</span>
            <span>Volumetric Weight Billing</span>
            <span>•</span>
            <span>Intelligent Nearest Auto-Assignment</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
