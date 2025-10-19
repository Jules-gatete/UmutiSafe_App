import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

import Login from '../pages/Login';
import Register from '../pages/Register';
import NotFound from '../pages/NotFound';

import UserDashboard from '../pages/user/Dashboard';
import AddDisposal from '../pages/user/AddDisposal';
import DisposalHistory from '../pages/user/DisposalHistory';
import EducationTips from '../pages/user/EducationTips';
import CHWInteraction from '../pages/user/CHWInteraction';
import UserProfile from '../pages/user/Profile';

import CHWDashboard from '../pages/chw/CHWDashboard';
import PickupRequests from '../pages/chw/PickupRequests';
import CHWProfile from '../pages/chw/CHWProfile';

import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageUsers from '../pages/admin/ManageUsers';
import MedicinesRegistry from '../pages/admin/MedicinesRegistry';
import EducationTipsManagement from '../pages/admin/EducationTips';
import SystemReports from '../pages/admin/SystemReports';
import AdminDisposalsList from '../pages/admin/AdminDisposalsList';
import AdminDisposalInfo from '../pages/admin/AdminDisposalInfo';

export default function AppRoutes() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAuthenticated = !!localStorage.getItem('token');

  return (
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
  );
}
