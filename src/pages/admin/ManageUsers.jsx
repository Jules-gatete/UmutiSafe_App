import React, { useState } from 'react';
import { UserPlus, Edit, Trash2 } from 'lucide-react';
import Table from '../../components/Table';
import { mockUsers, mockCHWs } from '../../utils/mockData';

export default function ManageUsers() {
  const [filterRole, setFilterRole] = useState('all');

  const allUsers = [...mockUsers, ...mockCHWs.filter(chw => !mockUsers.find(u => u.id === chw.id))];

  const filteredUsers =
    filterRole === 'all' ? allUsers : allUsers.filter(u => u.role === filterRole);

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-blue text-white flex items-center justify-center font-semibold text-sm">
            {row.avatar}
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
      key: 'phone',
      label: 'Phone',
      sortable: false,
    },
    {
      key: 'createdAt',
      label: 'Member Since',
      sortable: true,
    },
  ];

  const handleEdit = (user) => {
    alert(`Edit user: ${user.name}`);
  };

  const handleDelete = (user) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      alert('User deleted (mock action)');
    }
  };

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
        <button className="btn-primary flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="card mb-6">
        <div className="flex items-center gap-4">
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
        </div>
      </div>

      <div className="card">
        <Table
          columns={columns}
          data={filteredUsers}
          actions={(row) => (
            <>
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
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        />
      </div>
    </div>
  );
}
