import React, { useState } from 'react';
import { Filter, Eye } from 'lucide-react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import { mockDisposals, currentUser } from '../../utils/mockData';

export default function DisposalHistory() {
  const [selectedDisposal, setSelectedDisposal] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const userDisposals = mockDisposals.filter(d => d.userId === currentUser.id);

  const filteredDisposals =
    filterStatus === 'all'
      ? userDisposals
      : userDisposals.filter(d => d.status === filterStatus);

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
            value === 'completed' ? 'success' : value === 'pending_review' ? 'warning' : 'info'
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
    },
  ];

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        Disposal History
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        View all your past medicine disposals
      </p>

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
        size="md"
      >
        {selectedDisposal && (
          <div className="space-y-4">
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
                <span className="badge badge-info">{selectedDisposal.predictedCategory}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dosage Form</p>
                <p className="font-medium">{selectedDisposal.dosageForm}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Packaging</p>
                <p className="font-medium">{selectedDisposal.packagingType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
                <p className="font-medium">{selectedDisposal.createdAt}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                <p className="font-medium">{selectedDisposal.status.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Disposal Guidance:</h4>
              <p className="text-sm">{selectedDisposal.disposalGuidance}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div
                  className="bg-primary-green h-2 rounded-full"
                  style={{ width: `${selectedDisposal.confidence * 100}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {(selectedDisposal.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
