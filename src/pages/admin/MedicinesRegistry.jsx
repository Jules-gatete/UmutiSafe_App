import React, { useState, useMemo, useEffect } from 'react';
import { Upload, Database, Search, Plus, Edit, Trash2 } from 'lucide-react';
import Table from '../../components/Table';
import SearchBar from '../../components/SearchBar';
import Modal from '../../components/Modal';
import Input from '../../components/FormFields/Input';
import Select from '../../components/FormFields/Select';
import Textarea from '../../components/FormFields/Textarea';
import { medicinesAPI } from '../../services/api';

export default function MedicinesRegistry() {
  const [searchQuery, setSearchQuery] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    genericName: '',
    brandName: '',
    dosageForm: '',
    strength: '',
    category: '',
    riskLevel: 'MEDIUM',
    manufacturer: '',
    fdaApproved: true,
    disposalInstructions: ''
  });

  useEffect(() => {
    fetchMedicines();

    // Refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMedicines();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await medicinesAPI.getAll();
      if (response.success) {
        setMedicines(response.data);
      }
    } catch (err) {
      console.error('Error fetching medicines:', err);
      setError('Failed to load medicines registry');
    } finally {
      setLoading(false);
    }
  };

  const filteredMedicines = useMemo(() => {
    if (!searchQuery) return medicines;
    const q = searchQuery.toLowerCase();
    return medicines.filter(
      med =>
        (med.genericName || '').toLowerCase().includes(q) ||
        (med.brandName || '').toLowerCase().includes(q) ||
        (med.manufacturer || '').toLowerCase().includes(q)
    );
  }, [medicines, searchQuery]);

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

  const handleUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file first');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await medicinesAPI.uploadCSV(formData);

      if (response.success) {
        alert('CSV uploaded successfully!');
        setCsvFile(null);
        fetchMedicines(); // Refresh the list
      }
    } catch (err) {
      console.error('Error uploading CSV:', err);
      alert('Failed to upload CSV. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = () => {
    setEditingMedicine(null);
    setFormData({
      genericName: '',
      brandName: '',
      dosageForm: '',
      strength: '',
      category: '',
      riskLevel: 'MEDIUM',
      manufacturer: '',
      fdaApproved: true,
      disposalInstructions: ''
    });
    setShowModal(true);
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      genericName: medicine.genericName || '',
      brandName: medicine.brandName || '',
      dosageForm: medicine.dosageForm || '',
      strength: medicine.strength || '',
      category: medicine.category || '',
      riskLevel: medicine.riskLevel || 'MEDIUM',
      manufacturer: medicine.manufacturer || '',
      fdaApproved: medicine.fdaApproved !== undefined ? medicine.fdaApproved : true,
      disposalInstructions: medicine.disposalInstructions || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (medicine) => {
    if (!confirm(`Are you sure you want to delete ${medicine.genericName}?`)) return;

    try {
      const response = await medicinesAPI.delete(medicine.id);
      if (response.success) {
        alert('Medicine deleted successfully!');
        fetchMedicines();
      }
    } catch (err) {
      console.error('Error deleting medicine:', err);
      alert('Failed to delete medicine. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.genericName) {
      alert('Please enter the generic name');
      return;
    }

    try {
      setSubmitting(true);
      let response;

      if (editingMedicine) {
        response = await medicinesAPI.update(editingMedicine.id, formData);
      } else {
        response = await medicinesAPI.create(formData);
      }

      if (response.success) {
        alert(`Medicine ${editingMedicine ? 'updated' : 'created'} successfully!`);
        setShowModal(false);
        fetchMedicines();
      }
    } catch (err) {
      console.error('Error saving medicine:', err);
      alert('Failed to save medicine. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 pb-24 lg:pb-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading medicines registry...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        Medicines Registry
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage Rwanda FDA approved medicines database
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

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
          <button onClick={handleAdd} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Medicine
          </button>
        </div>
        <Table
          columns={columns}
          data={filteredMedicines}
          actions={(row) => (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(row)}
                className="btn-outline py-2 px-3 text-sm"
                title="Edit medicine"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(row)}
                className="btn-outline py-2 px-3 text-sm text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20"
                title="Delete medicine"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>

      {/* Add/Edit Medicine Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Generic Name *"
              id="genericName"
              name="genericName"
              value={formData.genericName}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Brand Name"
              id="brandName"
              name="brandName"
              value={formData.brandName}
              onChange={handleInputChange}
            />
            <Input
              label="Dosage Form"
              id="dosageForm"
              name="dosageForm"
              value={formData.dosageForm}
              onChange={handleInputChange}
              placeholder="e.g., Tablet, Capsule, Syrup"
            />
            <Input
              label="Strength"
              id="strength"
              name="strength"
              value={formData.strength}
              onChange={handleInputChange}
              placeholder="e.g., 500mg, 10ml"
            />
            <Input
              label="Category"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              placeholder="e.g., Antibiotic, Painkiller"
            />
            <Select
              label="Risk Level *"
              id="riskLevel"
              name="riskLevel"
              value={formData.riskLevel}
              onChange={handleInputChange}
              options={[
                { value: 'LOW', label: 'Low Risk' },
                { value: 'MEDIUM', label: 'Medium Risk' },
                { value: 'HIGH', label: 'High Risk' }
              ]}
              required
            />
            <Input
              label="Manufacturer"
              id="manufacturer"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleInputChange}
            />
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="fdaApproved"
                name="fdaApproved"
                checked={formData.fdaApproved}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary-blue border-gray-300 rounded focus:ring-primary-blue"
              />
              <label htmlFor="fdaApproved" className="text-sm font-medium">
                FDA Approved
              </label>
            </div>
          </div>
          <Textarea
            label="Disposal Instructions"
            id="disposalInstructions"
            name="disposalInstructions"
            value={formData.disposalInstructions}
            onChange={handleInputChange}
            rows={3}
            placeholder="Enter disposal instructions..."
          />
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-outline flex-1"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editingMedicine ? 'Update Medicine' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
