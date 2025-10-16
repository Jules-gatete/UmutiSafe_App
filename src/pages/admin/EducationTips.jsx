import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Input from '../../components/FormFields/Input';
import Select from '../../components/FormFields/Select';
import Textarea from '../../components/FormFields/Textarea';
import { educationAPI } from '../../services/api';

export default function EducationTipsManagement() {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    icon: 'AlertTriangle',
    summary: '',
    content: '',
    category: 'safety',
    displayOrder: 0
  });

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      setLoading(true);
      const response = await educationAPI.getAll();
      if (response.success) {
        setTips(response.data);
      }
    } catch (err) {
      console.error('Error fetching tips:', err);
      setError('Failed to load education tips');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingTip(null);
    setFormData({
      title: '',
      icon: 'AlertTriangle',
      summary: '',
      content: '',
      category: 'safety',
      displayOrder: 0
    });
    setShowModal(true);
  };

  const handleEdit = (tip) => {
    setEditingTip(tip);
    setFormData({
      title: tip.title || '',
      icon: tip.icon || 'AlertTriangle',
      summary: tip.summary || '',
      content: tip.content || '',
      category: tip.category || 'safety',
      displayOrder: tip.displayOrder || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (tip) => {
    if (!confirm(`Are you sure you want to delete "${tip.title}"?`)) return;

    try {
      const response = await educationAPI.delete(tip.id);
      if (response.success) {
        alert('Education tip deleted successfully!');
        fetchTips();
      }
    } catch (err) {
      console.error('Error deleting tip:', err);
      alert('Failed to delete education tip. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.summary || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      let response;

      if (editingTip) {
        response = await educationAPI.update(editingTip.id, formData);
      } else {
        response = await educationAPI.create(formData);
      }

      if (response.success) {
        alert(`Education tip ${editingTip ? 'updated' : 'created'} successfully!`);
        setShowModal(false);
        fetchTips();
      }
    } catch (err) {
      console.error('Error saving tip:', err);
      alert('Failed to save education tip. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-blue bg-opacity-10 rounded-lg">
            <BookOpen className="w-5 h-5 text-primary-blue" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{row.summary?.substring(0, 50)}...</div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (value) => (
        <span className="badge badge-info">
          {value?.toUpperCase() || 'N/A'}
        </span>
      ),
    },
    {
      key: 'displayOrder',
      label: 'Order',
      sortable: true,
    },
    {
      key: 'isActive',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`badge badge-${value ? 'success' : 'danger'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-8 pb-24 lg:pb-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading education tips...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        Education Tips Management
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Create and manage educational content for users
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            Education Tips ({tips.length} total)
          </h2>
          <button onClick={handleAdd} className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Education Tip
          </button>
        </div>
        <Table 
          columns={columns} 
          data={tips}
          actions={(row) => (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(row)}
                className="btn-outline py-2 px-3 text-sm"
                title="Edit tip"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(row)}
                className="btn-outline py-2 px-3 text-sm text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20"
                title="Delete tip"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTip ? 'Edit Education Tip' : 'Add New Education Tip'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title *"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Icon"
              id="icon"
              name="icon"
              value={formData.icon}
              onChange={handleInputChange}
              options={[
                { value: 'AlertTriangle', label: 'Alert Triangle' },
                { value: 'Clock', label: 'Clock' },
                { value: 'Lock', label: 'Lock' },
                { value: 'Users', label: 'Users' },
                { value: 'ShieldAlert', label: 'Shield Alert' },
                { value: 'Heart', label: 'Heart' }
              ]}
            />
            <Select
              label="Category"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              options={[
                { value: 'safety', label: 'Safety' },
                { value: 'disposal', label: 'Disposal' },
                { value: 'storage', label: 'Storage' },
                { value: 'general', label: 'General' }
              ]}
            />
          </div>
          <Input
            label="Display Order"
            id="displayOrder"
            name="displayOrder"
            type="number"
            value={formData.displayOrder}
            onChange={handleInputChange}
          />
          <Textarea
            label="Summary *"
            id="summary"
            name="summary"
            value={formData.summary}
            onChange={handleInputChange}
            rows={2}
            placeholder="Brief summary of the tip..."
            required
          />
          <Textarea
            label="Content *"
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows={5}
            placeholder="Detailed content of the education tip..."
            required
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
              {submitting ? 'Saving...' : editingTip ? 'Update Tip' : 'Add Tip'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

