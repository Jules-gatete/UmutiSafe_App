import React, { useState, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Check, X, Clock, UserCheck, UserX } from 'lucide-react';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Input from '../../components/FormFields/Input';
import Select from '../../components/FormFields/Select';
import { adminAPI, authAPI } from '../../services/api';

export default function ManageUsers() {
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    sector: '',
    district: '',
    province: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const roleMatch = filterRole === 'all' || user.role === filterRole;
    const statusMatch = filterStatus === 'all' ||
      (filterStatus === 'pending' && !user.isApproved) ||
      (filterStatus === 'approved' && user.isApproved);
    return roleMatch && statusMatch;
  });

  const handleApprove = async (userId) => {
    if (!confirm('Are you sure you want to approve this user?')) return;

    setActionLoading(userId);
    try {
      const response = await adminAPI.approveUser(userId);
      if (response.success) {
        alert('User approved successfully! They will receive an email notification.');
        fetchUsers();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    if (!confirm('Are you sure you want to reject this user? This will deactivate their account.')) return;

    setActionLoading(userId);
    try {
      const response = await adminAPI.rejectUser(userId);
      if (response.success) {
        alert('User rejected successfully');
        fetchUsers();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (userId) => {
    if (!confirm('Are you sure you want to activate this user account?')) return;

    setActionLoading(userId);
    try {
      const response = await adminAPI.activateUser(userId);
      if (response.success) {
        alert('User account activated successfully! They can now login.');
        fetchUsers();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to activate user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this user account? They will not be able to login.')) return;

    setActionLoading(userId);
    try {
      const response = await adminAPI.deactivateUser(userId);
      if (response.success) {
        alert('User account deactivated successfully');
        fetchUsers();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setActionLoading(null);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-blue text-white flex items-center justify-center font-semibold text-sm">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <span
          className={`badge badge-${
            value === 'admin' ? 'danger' : value === 'chw' ? 'success' : 'info'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'isApproved',
      label: 'Approval',
      sortable: true,
      render: (value, row) => (
        <span
          className={`badge ${
            value ? 'badge-success' : 'badge-warning'
          }`}
        >
          {value ? 'Approved' : 'Pending'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Account Status',
      sortable: true,
      render: (value, row) => (
        <span
          className={`badge ${
            value ? 'badge-success' : 'badge-danger'
          }`}
        >
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: false,
    },
    {
      key: 'createdAt',
      label: 'Member Since',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  const handleDelete = async (user) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;

    setActionLoading(user.id);
    try {
      const response = await adminAPI.deleteUser(user.id);
      if (response.success) {
        alert('User deleted successfully');
        fetchUsers();
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: 'user',
      sector: '',
      district: '',
      province: ''
    });
    setShowAddModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      sector: user.sector || '',
      district: user.district || '',
      province: user.province || '',
      password: '' // Don't populate password for editing
    });
    setShowEditModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    // Email domain validation
    const emailDomain = formData.email.split('@')[1];
    if (formData.role === 'admin' && emailDomain !== 'umutisafe.gov.rw') {
      alert('Admin accounts must use @umutisafe.gov.rw email domain');
      return;
    }
    if (formData.role !== 'admin' && emailDomain === 'umutisafe.gov.rw') {
      alert('Regular users and CHWs cannot use @umutisafe.gov.rw email domain');
      return;
    }

    try {
      setSubmitting(true);
      const response = await authAPI.register(formData);

      if (response.success) {
        alert('User created successfully!');
        setShowAddModal(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        sector: formData.sector,
        district: formData.district,
        province: formData.province
      };

      const response = await adminAPI.updateUser(editingUser.id, updateData);

      if (response.success) {
        alert('User updated successfully!');
        setShowEditModal(false);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.message || 'Failed to update user');
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

  if (loading) {
    return (
      <div className="p-4 lg:p-8 flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-blue"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
            Manage Users
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all users and CHWs in the system
          </p>
        </div>
        <button onClick={handleAdd} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input-field flex-1 max-w-xs"
          >
            <option value="all">All Roles</option>
            <option value="user">Household Users</option>
            <option value="chw">CHWs</option>
            <option value="admin">Admins</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field flex-1 max-w-xs"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Approval</option>
          </select>
        </div>
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={filteredUsers}
          actions={(row) => (
            <div className="flex items-center gap-2">
              {!row.isApproved && (
                <>
                  <button
                    onClick={() => handleApprove(row.id)}
                    className="btn-outline py-2 px-3 text-sm text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900 dark:hover:bg-opacity-20"
                    title="Approve user"
                    disabled={actionLoading === row.id}
                  >
                    {actionLoading === row.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleReject(row.id)}
                    className="btn-outline py-2 px-3 text-sm text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20"
                    title="Reject user"
                    disabled={actionLoading === row.id}
                  >
                    {actionLoading === row.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}
              {row.isActive ? (
                <button
                  onClick={() => handleDeactivate(row.id)}
                  className="btn-outline py-2 px-3 text-sm text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900 dark:hover:bg-opacity-20"
                  title="Deactivate account"
                  disabled={actionLoading === row.id}
                >
                  {actionLoading === row.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                  ) : (
                    <UserX className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleActivate(row.id)}
                  className="btn-outline py-2 px-3 text-sm text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-900 dark:hover:bg-opacity-20"
                  title="Activate account"
                  disabled={actionLoading === row.id}
                >
                  {actionLoading === row.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={() => handleEdit(row)}
                className="btn-outline py-2 px-3 text-sm"
                title="Edit user"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(row)}
                className="btn-outline py-2 px-3 text-sm text-warning border-warning hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20"
                title="Delete user"
                disabled={actionLoading === row.id}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Email *"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Password *"
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Phone"
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
            />
            <Select
              label="Role *"
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              options={[
                { value: 'user', label: 'Household User' },
                { value: 'chw', label: 'Community Health Worker' },
                { value: 'admin', label: 'Administrator' }
              ]}
              required
            />
            <Input
              label="Sector"
              id="sector"
              name="sector"
              value={formData.sector}
              onChange={handleInputChange}
            />
            <Input
              label="District"
              id="district"
              name="district"
              value={formData.district}
              onChange={handleInputChange}
            />
            <Input
              label="Province"
              id="province"
              name="province"
              value={formData.province}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
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
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit User"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              disabled
              className="bg-gray-100 dark:bg-gray-800"
            />
            <Input
              label="Phone"
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
            />
            <Input
              label="Role"
              id="role"
              name="role"
              value={formData.role}
              disabled
              className="bg-gray-100 dark:bg-gray-800"
            />
            <Input
              label="Sector"
              id="sector"
              name="sector"
              value={formData.sector}
              onChange={handleInputChange}
            />
            <Input
              label="District"
              id="district"
              name="district"
              value={formData.district}
              onChange={handleInputChange}
            />
            <Input
              label="Province"
              id="province"
              name="province"
              value={formData.province}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
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
              {submitting ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
