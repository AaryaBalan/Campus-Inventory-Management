import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from './context/AppContext.jsx';
import Layout from './components/layout/Layout.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import AdminDashboard from './pages/dashboard/AdminDashboard.jsx';
import FinanceDashboard from './pages/dashboard/FinanceDashboard.jsx';
import InventoryDashboard from './pages/dashboard/InventoryDashboard.jsx';
import DepartmentDashboard from './pages/dashboard/DepartmentDashboard.jsx';
import AuditorDashboard from './pages/dashboard/AuditorDashboard.jsx';
import ExecutiveDashboard from './pages/dashboard/ExecutiveDashboard.jsx';
import AssetList from './pages/assets/AssetList.jsx';
import AssetDetail from './pages/assets/AssetDetail.jsx';
import AssetRegister from './pages/assets/AssetRegister.jsx';
import CampusMap from './pages/campus/CampusMap.jsx';
import StockLevels from './pages/inventory/StockLevels.jsx';
import PurchaseRequest from './pages/procurement/PurchaseRequest.jsx';
import ApprovalQueue from './pages/procurement/ApprovalQueue.jsx';
import PurchaseHistory from './pages/procurement/PurchaseHistory.jsx';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard.jsx';
import AlertsPanel from './pages/alerts/AlertsPanel.jsx';
import AuditTrail from './pages/compliance/AuditTrail.jsx';
import ReportGenerator from './pages/compliance/ReportGenerator.jsx';
import QRScanner from './pages/scanner/QRScanner.jsx';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useApp();
  return currentUser ? children : <Navigate to="/login" replace />;
};

export default function App() {
  const { currentUser } = useApp();

  return (
    <div className="min-h-screen bg-[#0e0e11] text-slate-100 dark:bg-[#0e0e11] dark:text-slate-100">
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/dashboard/admin" replace /> : <LoginPage />} />
        <Route path="/" element={<Navigate to={currentUser ? '/dashboard/admin' : '/login'} replace />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="dashboard/admin" element={<AdminDashboard />} />
          <Route path="dashboard/finance" element={<FinanceDashboard />} />
          <Route path="dashboard/inventory" element={<InventoryDashboard />} />
          <Route path="dashboard/department" element={<DepartmentDashboard />} />
          <Route path="dashboard/auditor" element={<AuditorDashboard />} />
          <Route path="dashboard/executive" element={<ExecutiveDashboard />} />

          <Route path="assets" element={<AssetList />} />
          <Route path="assets/:id" element={<AssetDetail />} />
          <Route path="assets/register" element={<AssetRegister />} />

          <Route path="campus" element={<CampusMap />} />

          <Route path="inventory" element={<StockLevels />} />

          <Route path="procurement/request" element={<PurchaseRequest />} />
          <Route path="procurement/approvals" element={<ApprovalQueue />} />
          <Route path="procurement/history" element={<PurchaseHistory />} />

          <Route path="analytics" element={<AnalyticsDashboard />} />

          <Route path="alerts" element={<AlertsPanel />} />

          <Route path="compliance/audit" element={<AuditTrail />} />
          <Route path="compliance/reports" element={<ReportGenerator />} />

          <Route path="scanner" element={<QRScanner />} />
        </Route>
      </Routes>
    </div>
  );
}