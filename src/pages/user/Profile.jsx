import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, Mail, Calendar, Shield, Bell, Building2 } from 'lucide-react';
import Input from '../../components/FormFields/Input';
import { authAPI, disposalsAPI, pickupsAPI } from '../../services/api';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [profileData, setProfileData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    location: user.location || '',
    sector: user.sector || '',
  });

  const [userStats, setUserStats] = useState({
    totalDisposals: 0,
    totalPickups: 0,
    memberSince: user.createdAt || new Date().toISOString(),
  });

  const [privacySettings, setPrivacySettings] = useState({
    dataSharing: true,
    notifications: true,
    locationTracking: false,
  });

  useEffect(() => {
    fetchUserData();

    // Refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUserData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [disposalsResult, pickupsResult] = await Promise.all([
        disposalsAPI.getAll(),
        pickupsAPI.getAll()
      ]);

      if (disposalsResult.success) {
        setUserStats(prev => ({
          ...prev,
          totalDisposals: disposalsResult.data.filter(d => d.userId === user.id).length
        }));
      }
      if (pickupsResult.success) {
        setUserStats(prev => ({
          ...prev,
          totalPickups: pickupsResult.data.filter(p => p.userId === user.id).length
        }));
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handlePrivacyToggle = (setting) => {
    setPrivacySettings({
      ...privacySettings,
      [setting]: !privacySettings[setting],
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await authAPI.updateProfile(profileData);

      if (response.success) {
        // Update localStorage with new user data
        const updatedUser = { ...user, ...profileData };
        localStorage.setItem('user', JSON.stringify(updatedUser));

        alert('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 pb-24 lg:pb-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        My Profile
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage your account information and settings
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="w-24 h-24 rounded-full bg-primary-blue text-white flex items-center justify-center font-bold text-3xl mx-auto mb-4">
            {user.avatar || user.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <h2 className="text-xl font-bold mb-1">{user.name}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {user.role === 'user' ? 'Household User' : user.role === 'chw' ? 'Community Health Worker' : 'Administrator'}
          </p>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-outline w-full"
            disabled={saving}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-bold mb-4">Personal Information</h3>

          {isEditing ? (
            <div className="space-y-4">
              <Input
                label="Full Name"
                id="name"
                name="name"
                value={profileData.name}
                onChange={handleInputChange}
              />
              <Input
                label="Email"
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleInputChange}
              />
              <Input
                label="Phone"
                id="phone"
                name="phone"
                type="tel"
                value={profileData.phone}
                onChange={handleInputChange}
              />
              <Input
                label="Location"
                id="location"
                name="location"
                value={profileData.location}
                onChange={handleInputChange}
              />
              {user.role === 'user' && (
                <Input
                  label="Sector"
                  id="sector"
                  name="sector"
                  value={profileData.sector}
                  onChange={handleInputChange}
                  icon={Building2}
                />
              )}
              <button onClick={handleSave} className="btn-primary w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                  <p className="font-medium">{profileData.location || 'Not specified'}</p>
                </div>
              </div>
              {user.role === 'user' && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sector</p>
                    <p className="font-medium">{profileData.sector || 'Not specified'}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                  <p className="font-medium">{new Date(userStats.memberSince).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="text-lg font-bold mb-4">Activity Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-blue dark:text-accent-cta mb-1">
              {userStats.totalDisposals}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Disposals</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary-green mb-1">
              {userStats.totalPickups}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">CHW Pickups</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-accent-cta mb-1">
              {Math.floor((Date.now() - new Date(userStats.memberSince).getTime()) / (1000 * 60 * 60 * 24 * 30))}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Months Active</p>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Privacy & Consent
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <div>
              <p className="font-medium">Data Sharing with CHWs</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Allow CHWs to access your disposal history for better service
              </p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.dataSharing}
              onChange={() => handlePrivacyToggle('dataSharing')}
              className="w-12 h-6 rounded-full appearance-none bg-gray-300 dark:bg-gray-600 relative cursor-pointer transition-colors checked:bg-primary-green"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive updates about pickups and safety alerts
              </p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.notifications}
              onChange={() => handlePrivacyToggle('notifications')}
              className="w-12 h-6 rounded-full appearance-none bg-gray-300 dark:bg-gray-600 relative cursor-pointer transition-colors checked:bg-primary-green"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <div>
              <p className="font-medium">Location Tracking</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Help CHWs find you for faster pickups
              </p>
            </div>
            <input
              type="checkbox"
              checked={privacySettings.locationTracking}
              onChange={() => handlePrivacyToggle('locationTracking')}
              className="w-12 h-6 rounded-full appearance-none bg-gray-300 dark:bg-gray-600 relative cursor-pointer transition-colors checked:bg-primary-green"
            />
          </label>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold mb-4">Account Actions</h3>
        <div className="space-y-3">
          <button className="btn-outline w-full text-left">Change Password</button>
          <button className="btn-outline w-full text-left text-warning hover:bg-red-50 dark:hover:bg-red-900 dark:hover:bg-opacity-20">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
