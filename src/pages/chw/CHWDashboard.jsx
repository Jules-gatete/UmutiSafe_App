import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, MapPin } from 'lucide-react';
import StatCard from '../../components/StatCard';
import SearchBar from '../../components/SearchBar';
import { mockPickupRequests, currentUser } from '../../utils/mockData';

export default function CHWDashboard() {
  const chwRequests = mockPickupRequests.filter(r => r.chwId === currentUser.id);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    if (!query) return chwRequests;
    const q = query.toLowerCase();
    return chwRequests.filter(r => (r.patientName || '').toLowerCase().includes(q) || (r.address || '').toLowerCase().includes(q));
  }, [chwRequests, query]);

  const pendingRequests = chwRequests.filter(r => r.status === 'pending');
  const scheduledRequests = chwRequests.filter(r => r.status === 'scheduled');
  const completedRequests = chwRequests.filter(r => r.status === 'completed');

  const recentRequests = chwRequests.slice(0, 5);

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
