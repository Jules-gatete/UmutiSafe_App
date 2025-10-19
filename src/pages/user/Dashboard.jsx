import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, History, BookOpen, Package, Clock, Truck, CheckCircle, AlertTriangle } from 'lucide-react';
import StatCard from '../../components/StatCard';
import { disposalsAPI, pickupsAPI } from '../../services/api';

export default function Dashboard() {
  const [disposals, setDisposals] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();

    // Auto-refresh every 10 seconds for real-time updates
    const pollInterval = setInterval(() => {
      fetchData();
    }, 10000); // Poll every 10 seconds

    // Refresh data when page becomes visible (user switches back to tab or navigates to page)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    const handleFocus = () => {
      fetchData();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [disposalsResult, pickupsResult] = await Promise.all([
        disposalsAPI.getAll(),
        pickupsAPI.getAll()
      ]);

      if (disposalsResult.success) {
        setDisposals(disposalsResult.data);
      }
      if (pickupsResult.success) {
        setPickups(pickupsResult.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Determine if a dashboard card should be visually "active" based on current location
  const location = useLocation();
  const getActiveFor = (filterName) => {
    // Read ?filter= from location.search
    try {
      const params = new URLSearchParams(location.search);
      const f = params.get('filter') || 'all';
      if (filterName === 'all') return f === 'all' || !f;
      if (filterName === 'highRisk') return f === 'highRisk';
      return f === filterName;
    } catch (e) {
      return false;
    }
  };

  const totalDisposed = disposals.length;
  const pendingReview = disposals.filter(d => d.status === 'pending_review').length;
  const pickupsRequested = pickups.length;

  const recentDisposals = disposals.slice(0, 3);

  const statusColors = {
    completed: 'success',
    pending_review: 'warning',
    pickup_requested: 'info',
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 pb-24 lg:pb-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
          Welcome back, {user.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Keep your home safe by disposing of medicines properly
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Link to="/user/history" className={`block ${getActiveFor('all') ? 'ring-2 ring-accent-cta rounded' : ''}`}>
          <StatCard
            icon={Package}
            label="Total Disposals"
            value={totalDisposed}
            color="blue"
          />
        </Link>

        <Link to="/user/history?filter=completed" className={`block ${getActiveFor('completed') ? 'ring-2 ring-accent-cta rounded' : ''}`}>
          <StatCard
            icon={CheckCircle}
            label="Completed"
            value={disposals.filter(d => d.status === 'completed').length}
            color="green"
          />
        </Link>

        <Link to="/user/history?filter=pending_review" className={`block ${getActiveFor('pending_review') ? 'ring-2 ring-accent-cta rounded' : ''}`}>
          <StatCard
            icon={Clock}
            label="Pending Review"
            value={pendingReview}
            color="yellow"
          />
        </Link>

        <Link to="/user/history?filter=pickup_requested" className={`block ${getActiveFor('pickup_requested') ? 'ring-2 ring-accent-cta rounded' : ''}`}>
          <StatCard
            icon={Truck}
            label="Pickup Requested"
            value={pickupsRequested}
            color="teal"
          />
        </Link>

        <Link to="/user/history?filter=highRisk" className={`block ${getActiveFor('highRisk') ? 'ring-2 ring-accent-cta rounded' : ''}`}>
          <StatCard
            icon={AlertTriangle}
            label="High Risk Items"
            value={disposals.filter(d => d.riskLevel === 'HIGH').length}
            color="red"
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          to="/user/add-disposal"
          className="card hover:scale-105 transition-transform bg-primary-blue text-white"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <PlusCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Add New Disposal</h3>
              <p className="text-sm text-white text-opacity-90">
                Classify your medicine
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/user/history"
          className={`card hover:scale-105 transition-transform bg-primary-green text-white ${getActiveFor('all') ? 'ring-2 ring-accent-cta' : ''}`}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <History className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">View History</h3>
              <p className="text-sm text-white text-opacity-90">
                See past disposals
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/user/education"
          className="card hover:scale-105 transition-transform bg-accent-cta text-white"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Education Tips</h3>
              <p className="text-sm text-white text-opacity-90">
                Learn safe practices
              </p>
            </div>
          </div>
        </Link>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-dark dark:text-text-light">
            Recent Disposals
          </h2>
          <Link
            to="/user/history"
            className={`text-sm text-primary-blue dark:text-accent-cta hover:underline font-medium ${getActiveFor('all') ? 'underline font-semibold' : ''}`}
          >
            View All
          </Link>
        </div>

        {recentDisposals.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No disposals yet. Start by adding your first medicine disposal.
            </p>
            <Link to="/user/add-disposal" className="btn-primary inline-block">
              Add Your First Disposal
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recentDisposals.map((disposal) => (
              <div
                key={disposal.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-text-dark dark:text-text-light mb-1">
                      {disposal.genericName}
                      {disposal.brandName && (
                        <span className="text-gray-600 dark:text-gray-400 font-normal">
                          {' '}
                          ({disposal.brandName})
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {disposal.dosageForm} • {disposal.packagingType}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`badge badge-${
                          disposal.riskLevel === 'HIGH'
                            ? 'danger'
                            : disposal.riskLevel === 'MEDIUM'
                            ? 'warning'
                            : 'success'
                        }`}
                      >
                        {disposal.riskLevel} Risk
                      </span>
                      <span className={`badge badge-${statusColors[disposal.status]}`}>
                        {disposal.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {disposal.createdAt}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
