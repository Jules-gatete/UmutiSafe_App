import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Award, Calendar } from 'lucide-react';
import Input from '../../components/FormFields/Input';
import { chwAPI, authAPI } from '../../services/api';

export default function CHWProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [availability, setAvailability] = useState('available');
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '', sector: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalPickups: 0, completed: 0, pending: 0 });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [availabilitySuccessMsg, setAvailabilitySuccessMsg] = useState('');

  // pickups assigned to this CHW (for listing or stats)
  const [pickups, setPickups] = useState([]);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
    // refresh when window gets focus
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // refresh user profile (authAPI.getMe) and CHW-specific data
      const [meResp, dashboardResp, pickupsResp] = await Promise.all([
        authAPI.getMe(),
        chwAPI.getDashboard(),
        chwAPI.getPickups()
      ]);

      if (meResp?.success) {
        const me = meResp.data;
        // update local storage and local state
        localStorage.setItem('user', JSON.stringify(me));
        setProfileData({ name: me.name || '', email: me.email || '', phone: me.phone || '', sector: me.sector || '' });
      }

      if (dashboardResp?.success) {
        setStats({
          totalPickups: dashboardResp.data.total || 0,
          completed: dashboardResp.data.completed || 0,
          pending: dashboardResp.data.pending || 0
        });
      }

      if (pickupsResp?.success) {
        setPickups(pickupsResp.data || []);
      }
      setError('');
    } catch (err) {
      console.error('Error loading CHW profile data', err);
      setError('Failed to load CHW data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await authAPI.updateProfile(profileData);
      if (response?.success) {
        // update local user
        const updatedUser = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setIsEditing(false);
        setSaveSuccessMsg('Profile updated successfully');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        alert(response?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error saving profile', err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityChange = async (value) => {
    setAvailability(value);
    try {
      await chwAPI.updateAvailability(value);
      setAvailabilitySuccessMsg('Availability updated');
      setTimeout(() => setAvailabilitySuccessMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update availability', err);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-4xl mx-auto">
        <div className="text-center py-12">Loading CHW profile...</div>
      </div>
    );
  }

  // fallback display user info from localStorage
  const displayUser = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        CHW Profile
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage your profile and availability
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="w-24 h-24 rounded-full bg-primary-green text-white flex items-center justify-center font-bold text-3xl mx-auto mb-4">
            {displayUser.avatar || (displayUser.name ? displayUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'CHW')}
          </div>
          <h2 className="text-xl font-bold mb-1">{displayUser.name}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Community Health Worker</p>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Availability Status</label>
            <select
              value={availability}
              onChange={(e) => handleAvailabilityChange(e.target.value)}
              className="input-field"
            >
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="off_duty">Off Duty</option>
            </select>
          </div>

          <button onClick={() => setIsEditing(!isEditing)} className="btn-outline w-full">
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
        {availabilitySuccessMsg && (
          <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-400 text-green-800 rounded">
            {availabilitySuccessMsg}
          </div>
        )}

        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-bold mb-4">Contact Information</h3>

          {isEditing ? (
            <>
              <div className="space-y-4">
                <Input label="Full Name" id="name" name="name" value={profileData.name} onChange={handleInputChange} />
                <Input label="Email" id="email" name="email" type="email" value={profileData.email} onChange={handleInputChange} />
                <Input label="Phone" id="phone" name="phone" type="tel" value={profileData.phone} onChange={handleInputChange} />
                <Input label="Coverage Sector" id="sector" name="sector" value={profileData.sector} onChange={handleInputChange} />
                <button onClick={handleSave} className="btn-primary w-full" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
              {saveSuccessMsg && (
                <div className="mt-3 p-3 bg-green-50 border-l-4 border-green-400 text-green-800 rounded">
                  {saveSuccessMsg}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-medium">{profileData.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                  <p className="font-medium">{profileData.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coverage Area</p>
                  <p className="font-medium">{profileData.sector || displayUser.coverageArea || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CHW Since</p>
                  <p className="font-medium">{displayUser.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Performance Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-blue dark:text-accent-cta mb-1">{stats.totalPickups}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Pickups</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-green mb-1">{stats.completed}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-500 mb-1">{stats.pending}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
          </div>
        </div>
      </div>
    </div>
  );
}
