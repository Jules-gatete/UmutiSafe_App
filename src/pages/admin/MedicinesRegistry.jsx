import React, { useState, useMemo } from 'react';
import { Upload, Database } from 'lucide-react';
import Table from '../../components/Table';
import SearchBar from '../../components/SearchBar';
import { mockMedicines } from '../../utils/mockData';

export default function MedicinesRegistry() {
  const [searchQuery, setSearchQuery] = useState('');
  const [csvFile, setCsvFile] = useState(null);

  const filteredMedicines = useMemo(() => {
    if (!searchQuery) return mockMedicines;
    const q = searchQuery.toLowerCase();
    return mockMedicines.filter(
      med =>
        (med.genericName || '').toLowerCase().includes(q) ||
        (med.brandName || '').toLowerCase().includes(q) ||
        (med.manufacturer || '').toLowerCase().includes(q)
    );
  }, [mockMedicines, searchQuery]);

  const columns = [
    { key: 'genericName', label: 'Generic Name', sortable: true },
    { key: 'brandName', label: 'Brand Name', sortable: true },
    { key: 'dosageForm', label: 'Form', sortable: true },
    { key: 'strength', label: 'Strength', sortable: false },
    { key: 'category', label: 'Category', sortable: true },
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
  ];

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!csvFile) {
      alert('Please select a CSV file first');
      return;
    }
    alert(`CSV upload simulated: ${csvFile.name}\n\nIn production, this would:\n1. Parse the CSV file\n2. Validate medicine data\n3. Update the FDA registry\n4. Show upload results`);
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        Medicines Registry
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage Rwanda FDA approved medicines database
      </p>

      <div className="card mb-6 bg-primary-blue text-white">
        <div className="flex items-start gap-4">
          <Database className="w-12 h-12 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Upload FDA Registry CSV</h2>
            <p className="text-white text-opacity-90 mb-4">
              Update the medicines database by uploading a CSV file from Rwanda FDA. The file
              should include: Generic Name, Brand Name, Dosage Form, Strength, Category, Risk
              Level.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="btn-secondary cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-5 h-5" />
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {csvFile ? csvFile.name : 'Choose CSV File'}
              </label>
              {csvFile && (
                <button onClick={handleUpload} className="btn-outline border-white text-white hover:bg-white hover:text-primary-blue">
                  Upload & Process
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search medicines..."
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            Medicine Database ({filteredMedicines.length} entries)
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>
        <Table columns={columns} data={filteredMedicines} />
      </div>
    </div>
  );
}
