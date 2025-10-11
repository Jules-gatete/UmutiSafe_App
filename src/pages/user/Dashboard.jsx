import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, History, BookOpen, Package, Clock, Truck } from 'lucide-react';
import StatCard from '../../components/StatCard';
import { currentUser, mockDisposals, mockPickupRequests } from '../../utils/mockData';

export default function Dashboard() {
  const userDisposals = mockDisposals.filter(d => d.userId === currentUser.id);
  const userPickups = mockPickupRequests.filter(p => p.userId === currentUser.id);

  const totalDisposed = userDisposals.length;
  const pendingReview = userDisposals.filter(d => d.status === 'pending_review').length;
  const pickupsRequested = userPickups.length;

  const recentDisposals = userDisposals.slice(0, 3);

  const statusColors = {
    completed: 'success',
    pending_review: 'warning',
    pickup_requested: 'info',
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
          Welcome back, {currentUser.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Keep your home safe by disposing of medicines properly
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Package}
          label="Total Disposed"
          value={totalDisposed}
          color="blue"
        />
        <StatCard
          icon={Clock}
          label="Pending Review"
          value={pendingReview}
          color="yellow"
        />
        <StatCard
          icon={Truck}
          label="Pickups Requested"
          value={pickupsRequested}
          color="green"
        />
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
          className="card hover:scale-105 transition-transform bg-primary-green text-white"
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
            className="text-sm text-primary-blue dark:text-accent-cta hover:underline font-medium"
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
