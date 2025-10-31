import React, { useEffect, useState } from 'react';
import { authAPI } from '../../services/api';

export default function AdminProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await authAPI.getMe();
      if (res && res.success) {
        setUser(res.data);
        setForm({
          name: res.data.name || '',
          email: res.data.email || '',
          phone: res.data.phone || ''
        });
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await authAPI.updateProfile({ name: form.name, phone: form.phone });
      if (res && res.success) {
        // Update local state and localStorage
        const updated = res.data || { ...user, name: form.name, phone: form.phone };
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        setSuccessMsg('Profile saved');
        setTimeout(() => setSuccessMsg(''), 2500);
      } else {
        console.error('Profile update failed', res);
        alert((res && res.error) || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Error saving profile', err);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="p-8 text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-blue mx-auto mb-4"></div>
      <p className="text-gray-600">Loading profile...</p>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Profile</h1>
      </div>

      <div className="card max-w-2xl">
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 text-green-700 rounded">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleInput}
              className="input-field mt-1 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email (read-only)</label>
            <input
              name="email"
              value={form.email}
              disabled
              className="input-field mt-1 w-full bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleInput}
              className="input-field mt-1 w-full"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
