import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Eye, Package, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import StatCard from '../../components/StatCard';
import { disposalsAPI } from '../../services/api';

export default function DisposalHistory() {
  const [selectedDisposal, setSelectedDisposal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [disposals, setDisposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDisposals();

    // Auto-refresh every 10 seconds for real-time updates
    const pollInterval = setInterval(() => {
      fetchDisposals();
    }, 10000); // Poll every 10 seconds

    // Refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDisposals();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchDisposals = async () => {
    try {
      setLoading(true);
      const response = await disposalsAPI.getAll();
      if (response.success) {
        setDisposals(response.data);
      }
    } catch (err) {
      console.error('Error fetching disposals:', err);
      setError('Failed to load disposal history');
    } finally {
      setLoading(false);
    }
  };

  const filteredDisposals =
    filterStatus === 'all'
      ? disposals
      : disposals.filter(d => d.status === filterStatus);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = disposals.length;
    const completed = disposals.filter(d => d.status === 'completed').length;
    const pending = disposals.filter(d => d.status === 'pending_review').length;
    const pickupRequested = disposals.filter(d => d.status === 'pickup_requested').length;
    const highRisk = disposals.filter(d => d.riskLevel === 'HIGH').length;

    return { total, completed, pending, pickupRequested, highRisk };
  }, [disposals]);

  const columns = [
    {
      key: 'genericName',
      label: 'Medicine',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          {row.brandName && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {row.brandName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'dosageForm',
      label: 'Form',
      sortable: true,
      render: (value) => (
        <span className="text-sm">{value || 'N/A'}</span>
      ),
    },
    {
      key: 'riskLevel',
      label: 'Risk',
      sortable: true,
      render: (value) => (
        <span
          className={`badge badge-${
            value === 'HIGH' ? 'danger' : value === 'MEDIUM' ? 'warning' : 'success'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={`badge badge-${
            value === 'completed' ? 'success' : value === 'pending_review' ? 'warning' : value === 'pickup_requested' ? 'info' : 'secondary'
          }`}
        >
          {value.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (value) => {
        const date = new Date(value);
        return (
          <div>
            <div className="font-medium">{date.toLocaleDateString()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-8 pb-24 lg:pb-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading disposal history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
          Disposal History
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View all your past medicine disposals and track their status
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Disposals"
          value={stats.total}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending Review"
          value={stats.pending}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="High Risk Items"
          value={stats.highRisk}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field flex-1 max-w-xs"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending_review">Pending Review</option>
            <option value="pickup_requested">Pickup Requested</option>
          </select>
        </div>
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={filteredDisposals}
          actions={(row) => (
            <button
              onClick={() => setSelectedDisposal(row)}
              className="btn-outline py-2 px-4 text-sm"
            >
              <Eye className="w-4 h-4 inline mr-1" />
              View
            </button>
          )}
        />
      </div>

      <Modal
        isOpen={!!selectedDisposal}
        onClose={() => setSelectedDisposal(null)}
        title="Disposal Details"
        size="lg"
      >
        {selectedDisposal && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                {selectedDisposal.genericName}
                {selectedDisposal.brandName && ` (${selectedDisposal.brandName})`}
              </h3>
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`badge badge-${
                    selectedDisposal.riskLevel === 'HIGH'
                      ? 'danger'
                      : selectedDisposal.riskLevel === 'MEDIUM'
                      ? 'warning'
                      : 'success'
                  }`}
                >
                  {selectedDisposal.riskLevel} Risk
                </span>
                <span className="badge badge-info">{selectedDisposal.predictedCategory || 'N/A'}</span>
                <span
                  className={`badge badge-${
                    selectedDisposal.status === 'completed'
                      ? 'success'
                      : selectedDisposal.status === 'pending_review'
                      ? 'warning'
                      : selectedDisposal.status === 'pickup_requested'
                      ? 'info'
                      : 'secondary'
                  }`}
                >
                  {selectedDisposal.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dosage Form</p>
                <p className="font-medium">{selectedDisposal.dosageForm || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Packaging</p>
                <p className="font-medium">{selectedDisposal.packagingType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
                <p className="font-medium">
                  {new Date(selectedDisposal.createdAt).toLocaleDateString()}{' '}
                  {new Date(selectedDisposal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reason</p>
                <p className="font-medium">{selectedDisposal.reason?.replace('_', ' ') || 'N/A'}</p>
              </div>
              {selectedDisposal.completedAt && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completed At</p>
                  <p className="font-medium">
                    {new Date(selectedDisposal.completedAt).toLocaleDateString()}{' '}
                    {new Date(selectedDisposal.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Disposal Guidance:</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">{selectedDisposal.disposalGuidance || 'No guidance available'}</p>
            </div>

            {selectedDisposal.confidence && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Classification Confidence</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      selectedDisposal.confidence >= 0.8
                        ? 'bg-green-500'
                        : selectedDisposal.confidence >= 0.6
                        ? 'bg-yellow-500'
                        : 'bg-orange-500'
                    }`}
                    style={{ width: `${selectedDisposal.confidence * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {(selectedDisposal.confidence * 100).toFixed(1)}% confident
                </p>
              </div>
            )}

            {selectedDisposal.pickupRequest && (
              <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <h4 className="font-semibold mb-3 text-green-900 dark:text-green-100">Pickup Request Information</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">CHW Assigned</p>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {selectedDisposal.pickupRequest.chw?.name || 'Not assigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">CHW Phone</p>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {selectedDisposal.pickupRequest.chw?.phone || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">Pickup Status</p>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {selectedDisposal.pickupRequest.status?.replace('_', ' ').toUpperCase() || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-300">Pickup Location</p>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      {selectedDisposal.pickupRequest.pickupLocation || 'N/A'}
                    </p>
                  </div>
                  {selectedDisposal.pickupRequest.scheduledTime && (
                    <div className="col-span-2">
                      <p className="text-sm text-green-700 dark:text-green-300">Scheduled Time</p>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        {new Date(selectedDisposal.pickupRequest.scheduledTime).toLocaleDateString()}{' '}
                        {new Date(selectedDisposal.pickupRequest.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                  {selectedDisposal.pickupRequest.chwNotes && (
                    <div className="col-span-2">
                      <p className="text-sm text-green-700 dark:text-green-300">CHW Notes</p>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        {selectedDisposal.pickupRequest.chwNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedDisposal.notes && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Additional Notes:</h4>
                <p className="text-sm">{selectedDisposal.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
