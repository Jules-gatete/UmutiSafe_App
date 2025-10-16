import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, MapPin } from 'lucide-react';
import StatCard from '../../components/StatCard';
import SearchBar from '../../components/SearchBar';
import { chwAPI, pickupsAPI } from '../../services/api';

export default function CHWDashboard() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();

    // Auto-refresh every 10 seconds for real-time updates
    const pollInterval = setInterval(() => {
      fetchData();
    }, 10000); // Poll every 10 seconds

    // Refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashboardResult, pickupsResult] = await Promise.all([
        chwAPI.getDashboard(),
        chwAPI.getPickups() // Use chwAPI.getPickups() instead of pickupsAPI.getAll()
      ]);

      if (dashboardResult.success) {
        setStats(dashboardResult.data);
      }
      if (pickupsResult.success) {
        setRequests(pickupsResult.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query) return requests;
    const q = query.toLowerCase();
    return requests.filter(r =>
      (r.userName || '').toLowerCase().includes(q) ||
      (r.pickupLocation || '').toLowerCase().includes(q)
    );
  }, [requests, query]);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const scheduledRequests = requests.filter(r => r.status === 'scheduled');
  const completedRequests = requests.filter(r => r.status === 'completed');

  const recentRequests = requests.slice(0, 5);

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
          CHW Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage pickup requests and help your community dispose of medicines safely
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Clock}
          label="Pending Requests"
          value={pendingRequests.length}
          color="yellow"
        />
        <StatCard
          icon={Truck}
          label="Scheduled Pickups"
          value={scheduledRequests.length}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={completedRequests.length}
          color="green"
        />
      </div>

      <div className="mb-8 max-w-xl">
        <SearchBar onSearch={(q) => setQuery(q)} placeholder="Search pickups by name or address..." />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text-dark dark:text-text-light">
            Recent Pickup Requests
          </h2>
          <Link
            to="/chw/pickup-requests"
            className="text-sm text-primary-blue dark:text-accent-cta hover:underline font-medium"
          >
            View All
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No pickup requests yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentRequests.map((request) => (
              <div
                key={request.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <h3 className="font-semibold text-lg mb-1">{request.userName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {request.medicineName}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      {request.pickupLocation}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`badge badge-${
                        request.status === 'completed'
                          ? 'success'
                          : request.status === 'scheduled'
                          ? 'info'
                          : 'warning'
                      }`}
                    >
                      {request.status.toUpperCase()}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {request.createdAt}
                    </p>
                    {request.status === 'pending' && (
                      <Link
                        to={`/chw/pickup-requests`}
                        className="btn-primary py-2 px-4 text-sm"
                      >
                        Review
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* render filtered requests */}
      <div>
        {filtered.map(r => (
          <div key={r.id} className="card mb-3">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{r.patientName}</div>
                <div className="text-sm text-gray-600">{r.address}</div>
              </div>
              <div className="text-sm">{r.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
