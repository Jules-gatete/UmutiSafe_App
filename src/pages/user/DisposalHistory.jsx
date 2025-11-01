import React, { useState, useMemo } from 'react';
import useStablePolling from '../../hooks/useStablePolling';
import { useLocation, useNavigate } from 'react-router-dom';
import { Filter, Eye, Package, CheckCircle, Clock, AlertTriangle, Truck } from 'lucide-react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import StatCard from '../../components/StatCard';
import { disposalsAPI } from '../../services/api';

export default function DisposalHistory() {
  const [selectedDisposal, setSelectedDisposal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [highRiskFilter, setHighRiskFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [disposals, setDisposals] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const navigate = useNavigate();

  // apply filter from query params (e.g., ?filter=pending_review or ?filter=highRisk)
  const params = new URLSearchParams(window.location.search);
  const f = params.get('filter');
  if (f) {
    if (f === 'highRisk') applyCardFilter('highRisk');
    else applyCardFilter(f);
  }

  // Use centralized polling: fetchDisposals will be called with { background }
  useStablePolling(async ({ background = false } = {}) => {
    try {
      if (background) setRefreshing(true);
      else setInitialLoading(true);

      setServerError('');
      const response = await disposalsAPI.getAll();
      if (response && response.success) {
        if (background) {
          try {
            const existing = JSON.stringify(disposals || []);
            const incoming = JSON.stringify(response.data || []);
            if (existing !== incoming) setDisposals(response.data);
          } catch (e) {
            setDisposals(response.data);
          }
        } else {
          setDisposals(response.data);
        }
      } else {
        const msg = response?.error?.message || response?.error || 'Failed to load disposals from server';
        setServerError(msg);
        if (!background) setDisposals([]);
      }
    } catch (err) {
      console.error('Error fetching disposals:', err);
      setError('Failed to load disposal history');
    } finally {
      if (background) setRefreshing(false);
      else setInitialLoading(false);
    }
  }, 10000);

  const fetchDisposals = async () => {
    try {
      setLoading(true);
      setServerError('');
      const response = await disposalsAPI.getAll();
      if (response && response.success) {
        setDisposals(response.data);
      } else {
        const msg = response?.error?.message || response?.error || 'Failed to load disposals from server';
        setServerError(msg);
        setDisposals([]);
      }
    } catch (err) {
      console.error('Error fetching disposals:', err);
      setError('Failed to load disposal history');
    } finally {
      setLoading(false);
    }
  };

  // navigate to CHW interaction page with prefilled form data
  const goToChwPickup = (disposal) => {
    const prefill = {
      medicineName: disposal.genericName || disposal.generic_name || '',
      disposalGuidance: disposal.disposalGuidance || disposal.disposal_guidance || disposal.safetyNotes || '',
      disposalId: disposal.id || disposal._id || null,
      // other fields can be left blank and filled in the CHWInteraction form
    };

    navigate('/user/chw-interaction', { state: prefill });
  };

  const filteredDisposals =
    // if highRiskFilter is active, show only HIGH risk items
    highRiskFilter
      ? disposals.filter(d => d.riskLevel === 'HIGH')
      : filterStatus === 'all'
      ? disposals
      : disposals.filter(d => d.status === filterStatus);

  // (Stats removed from History page — Dashboard now shows summary cards)

  // Pagination calculations
  const totalItems = filteredDisposals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pagedData = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDisposals.slice(start, start + pageSize);
  }, [filteredDisposals, page, pageSize]);

  const applyCardFilter = (type) => {
    // type: 'all' | 'completed' | 'pending_review' | 'pickup_requested' | 'highRisk'
    setPage(1);
    if (type === 'highRisk') {
      setHighRiskFilter(true);
      setFilterStatus('all');
    } else {
      setHighRiskFilter(false);
      setFilterStatus(type);
    }
  };

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

  if (initialLoading) {
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

      {/* success messages are handled in the CHW interaction page after submitting pickup requests */}

      {/* Stats removed here: History page is table-only (Dashboard shows summaries) */}

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
          <button onClick={fetchDisposals} className="btn-outline ml-auto">Refresh</button>
        </div>
      </div>

      {serverError && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {serverError}
        </div>
      )}

      <div className="card">
        {filteredDisposals.length === 0 ? (
          <div className="p-6 text-center text-gray-600 dark:text-gray-400">No disposal records found.</div>
        ) : (
          <>
            <Table
              columns={columns}
              data={pagedData}
              actions={(row) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedDisposal(row)}
                      className="btn-outline py-2 px-4 text-sm"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      View
                    </button>

                    {/* Show Request Pickup when not already pickup_requested and no pickupRequest exists */}
                    {row.status === 'pending_review' && !row.pickupRequest && (
                      <button
                        onClick={() => goToChwPickup(row)}
                        className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        Request Pickup
                      </button>
                    )}
                  </div>
                )}
            />

            {/* Pagination controls */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <button
                  className="btn-outline px-3 py-1"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                <div className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </div>
                <button
                  className="btn-outline px-3 py-1"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Rows:</label>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="input-field">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>
          </>
        )}
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
