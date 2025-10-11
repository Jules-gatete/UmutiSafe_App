import React, { useState } from 'react';
import { MapPin, Calendar, Eye } from 'lucide-react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Select from '../../components/FormFields/Select';
import Textarea from '../../components/FormFields/Textarea';
import { mockPickupRequests, currentUser, updatePickupRequestStatus } from '../../utils/mockData';

export default function PickupRequests() {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const chwRequests = mockPickupRequests.filter(r => r.chwId === currentUser.id);
  const filteredRequests =
    filterStatus === 'all'
      ? chwRequests
      : chwRequests.filter(r => r.status === filterStatus);

  const statusOptions = [
    { value: 'scheduled', label: 'Schedule Pickup' },
    { value: 'collected', label: 'Mark as Collected' },
    { value: 'requires_inspection', label: 'Requires Inspection' },
    { value: 'rejected', label: 'Reject Request' },
  ];

  const columns = [
    {
      key: 'userName',
      label: 'Requester',
      sortable: true,
    },
    {
      key: 'medicineName',
      label: 'Medicine',
      sortable: true,
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
      render: (value) => new Date(value).toLocaleString(),
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

  const handleSubmitReview = () => {
    if (!reviewStatus) {
      alert('Please select a status');
      return;
    }

    updatePickupRequestStatus(selectedRequest.id, reviewStatus, reviewNotes);
    alert('Request status updated successfully!');
    setSelectedRequest(null);
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        Pickup Requests
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Review and manage medicine pickup requests
      </p>

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
        </div>

        <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Map Placeholder:</strong> In production, this would display an interactive
            map showing pickup locations. To integrate: use Leaflet or Google Maps API with
            markers for each request location.
          </p>
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
                <p className="font-medium">{selectedRequest.userName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Medicine</p>
                <p className="font-medium">{selectedRequest.medicineName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reason</p>
                <p className="font-medium">{selectedRequest.reason.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Preferred Time</p>
                <p className="font-medium">
                  {new Date(selectedRequest.preferredTime).toLocaleString()}
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
              <p className="text-sm">{selectedRequest.disposalGuidance}</p>
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
              <button onClick={() => setSelectedRequest(null)} className="btn-outline flex-1">
                Cancel
              </button>
              <button onClick={handleSubmitReview} className="btn-primary flex-1">
                Submit
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
