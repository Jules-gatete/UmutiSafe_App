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

        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/add-disposal"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <AddDisposal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/history"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <DisposalHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/education"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <EducationTips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/chw-interaction"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <CHWInteraction />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/profile"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chw"
          element={
            <ProtectedRoute allowedRoles={['chw']}>
              <CHWDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chw/pickup-requests"
          element={
            <ProtectedRoute allowedRoles={['chw']}>
              <PickupRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chw/profile"
          element={
            <ProtectedRoute allowedRoles={['chw']}>
              <CHWProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/disposals"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDisposalsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/disposals/:id"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDisposalInfo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/medicines"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <MedicinesRegistry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/education"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EducationTipsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SystemReports />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
