import React, { useState, useMemo } from 'react';
import useStablePolling from '../../hooks/useStablePolling';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Eye } from 'lucide-react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Select from '../../components/FormFields/Select';
import Textarea from '../../components/FormFields/Textarea';
import SearchBar from '../../components/SearchBar';
import { chwAPI, pickupsAPI } from '../../services/api';

export default function PickupRequests() {
  const [requests, setRequests] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Centralized polling hook; fetchPickups will be invoked with { background }
  useStablePolling(async ({ background = false } = {}) => {
    try {
      if (background) setRefreshing(true);
      else setInitialLoading(true);

      const result = await chwAPI.getPickups();

      if (result?.success) {
        if (background) {
          try {
            const existing = JSON.stringify(requests || []);
            const incoming = JSON.stringify(result.data || []);
            if (existing !== incoming) setRequests(result.data);
          } catch (e) {
            setRequests(result.data);
          }
        } else {
          setRequests(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching pickups:', err);
      setError('Failed to load pickup requests');
    } finally {
      if (background) setRefreshing(false);
      else setInitialLoading(false);
    }
  }, 10000);

  const fetchPickups = async () => {
    try {
      setRefreshing(true);
      // Use chwAPI.getPickups() to get pickups assigned to this CHW
      const result = await chwAPI.getPickups();

      if (result.success) {
        setRequests(result.data);
      }
    } catch (err) {
      console.error('Error fetching pickups:', err);
      setError('Failed to load pickup requests');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredRequests = useMemo(() => {
    let filtered = requests;
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }
    if (query) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        r =>
          (r.requester?.name || '').toLowerCase().includes(q) ||
          (r.medicineName || '').toLowerCase().includes(q) ||
          (r.pickupLocation || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [requests, filterStatus, query]);

  const statusOptions = [
    { value: 'scheduled', label: 'Schedule Pickup' },
    { value: 'collected', label: 'Mark as Collected' },
    // Send a UI action 'requires_inspection' — backend will map this to 'pending'
    { value: 'requires_inspection', label: 'Requires Inspection' },
    { value: 'rejected', label: 'Reject Request' },
  ];

  const columns = [
    {
      key: 'requester',
      label: 'Requester',
      sortable: true,
      render: (value) => value?.name || 'N/A',
    },
    {
      key: 'medicineName',
      label: 'Medicine',
      sortable: true,
    },
    {
      key: 'disposal',
      label: 'Disposal',
      sortable: false,
      render: (_value, row) => (
        row.disposal ? `${row.disposal.genericName}${row.disposal.brandName ? ` (${row.disposal.brandName})` : ''}` : 'N/A'
      )
    },
    {
      key: 'pickupLocation',
      label: 'Location',
      sortable: false,
      render: (value) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="w-4 h-4" />
          {value}
        </div>
      ),
    },
    {
      key: 'preferredTime',
      label: 'Preferred Time',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleString() : 'N/A',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={`badge badge-${
            value === 'completed'
              ? 'success'
              : value === 'scheduled'
              ? 'info'
              : value === 'pending'
              ? 'warning'
              : 'danger'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
  ];

  const handleReview = (request) => {
    setSelectedRequest(request);
    setReviewStatus('');
    setReviewNotes('');
  };

  const handleSubmitReview = async () => {
    if (!reviewStatus) {
      alert('Please select a status');
      return;
    }

    try {
      setSubmitting(true);
      const result = await pickupsAPI.updateStatus(selectedRequest.id, {
        status: reviewStatus,
        chwNotes: reviewNotes
      });

      if (result.success) {
        alert('Request status updated successfully!');
        setSelectedRequest(null);
        fetchPickups(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-4 lg:p-8 pb-24 lg:pb-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading pickup requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        Pickup Requests
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Review and manage medicine pickup requests
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field flex-1 max-w-xs"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="scheduled">Scheduled</option>
            <option value="collected">Collected</option>
            <option value="completed">Completed</option>
          </select>

          <div className="mb-4 max-w-xl w-full">
            <SearchBar onSearch={(q) => setQuery(q)} placeholder="Search requests by name, medicine or location..." />
          </div>
        </div>

      </div>

      <div className="card">
        <Table
          columns={columns}
          data={filteredRequests}
          actions={(row) => (
            <button
              onClick={() => handleReview(row)}
              className="btn-outline py-2 px-4 text-sm"
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Review
            </button>
          )}
        />
      </div>

      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Review Pickup Request"
        size="md"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Requester</p>
                <p className="font-medium">{selectedRequest.requester?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Medicine</p>
                  <p className="font-medium">{selectedRequest.disposal?.genericName || selectedRequest.medicineName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reason</p>
                <p className="font-medium">{selectedRequest.reason?.replace('_', ' ') || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Preferred Time</p>
                <p className="font-medium">
                  {selectedRequest.preferredTime ? new Date(selectedRequest.preferredTime).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Location</p>
              <p className="font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {selectedRequest.pickupLocation}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Disposal Guidance:</h4>
              <p className="text-sm">{selectedRequest.disposal?.disposalGuidance || selectedRequest.disposalGuidance || 'N/A'}</p>
            </div>

            <Select
              label="Update Status"
              id="reviewStatus"
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value)}
              options={statusOptions}
              placeholder="Select action"
            />

            <Textarea
              label="Notes (Optional)"
              id="reviewNotes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Add any notes or instructions..."
              rows={3}
            />

            <div className="flex gap-4">
              <button
                onClick={() => setSelectedRequest(null)}
                className="btn-outline flex-1"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                className="btn-primary flex-1"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
