import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Lazy-load route pages to enable code-splitting and reduce initial bundle size
const Login = lazy(() => import('../pages/Login'));
const Register = lazy(() => import('../pages/Register'));
const NotFound = lazy(() => import('../pages/NotFound'));

const UserDashboard = lazy(() => import('../pages/user/Dashboard'));
const AddDisposal = lazy(() => import('../pages/user/AddDisposal'));
const DisposalHistory = lazy(() => import('../pages/user/DisposalHistory'));
const EducationTips = lazy(() => import('../pages/user/EducationTips'));
const CHWInteraction = lazy(() => import('../pages/user/CHWInteraction'));
const UserProfile = lazy(() => import('../pages/user/Profile'));

const CHWDashboard = lazy(() => import('../pages/chw/CHWDashboard'));
const PickupRequests = lazy(() => import('../pages/chw/PickupRequests'));
const CHWProfile = lazy(() => import('../pages/chw/CHWProfile'));

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const ManageUsers = lazy(() => import('../pages/admin/ManageUsers'));
const MedicinesRegistry = lazy(() => import('../pages/admin/MedicinesRegistry'));
const EducationTipsManagement = lazy(() => import('../pages/admin/EducationTips'));
const SystemReports = lazy(() => import('../pages/admin/SystemReports'));
const AdminDisposalsList = lazy(() => import('../pages/admin/AdminDisposalsList'));
const AdminDisposalInfo = lazy(() => import('../pages/admin/AdminDisposalInfo'));
const AdminProfile = lazy(() => import('../pages/admin/AdminProfile'));

export default function AppRoutes() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    // Suspense boundary for lazy-loaded routes; use a simple fallback
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <Navigate
              to={isAuthenticated && user ? `/${user.role}` : '/login'}
              replace
            />
          }
        />

        {/* User routes (protected) */}
        <Route path="/user" element={<ProtectedRoute allowedRoles={["user"]} />}>
          <Route index element={<UserDashboard />} />
          <Route path="add-disposal" element={<AddDisposal />} />
          <Route path="history" element={<DisposalHistory />} />
          <Route path="education" element={<EducationTips />} />
          <Route path="chw-interaction" element={<CHWInteraction />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>

        {/* CHW routes (protected) */}
        <Route path="/chw" element={<ProtectedRoute allowedRoles={["chw"]} />}>
          <Route index element={<CHWDashboard />} />
          <Route path="pickup-requests" element={<PickupRequests />} />
          <Route path="profile" element={<CHWProfile />} />
        </Route>

        {/* Admin routes (protected) */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="disposals" element={<AdminDisposalsList />} />
          <Route path="disposals/:id" element={<AdminDisposalInfo />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="medicines" element={<MedicinesRegistry />} />
          <Route path="education" element={<EducationTipsManagement />} />
          <Route path="reports" element={<SystemReports />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
