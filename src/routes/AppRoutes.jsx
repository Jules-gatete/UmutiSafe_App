import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

import Login from '../pages/Login';
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
import SystemReports from '../pages/admin/SystemReports';

import { authState } from '../utils/mockData';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <Navigate
            to={authState.isAuthenticated ? `/${authState.currentRole}` : '/login'}
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
