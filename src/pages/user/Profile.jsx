import React, { useState } from 'react';
import { User, Phone, MapPin, Mail, Calendar, Shield, Bell } from 'lucide-react';
import Input from '../../components/FormFields/Input';
import { currentUser, mockDisposals, mockPickupRequests } from '../../utils/mockData';

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    location: currentUser.location,
  });
  const [privacySettings, setPrivacySettings] = useState({
    dataSharing: true,
    notifications: true,
    locationTracking: false,
  });

  const userStats = {
    totalDisposals: mockDisposals.filter(d => d.userId === currentUser.id).length,
    totalPickups: mockPickupRequests.filter(p => p.userId === currentUser.id).length,
    memberSince: currentUser.createdAt,
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

  const handleSave = () => {
    alert('Profile updated successfully!');
    setIsEditing(false);
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        My Profile
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Manage your account information and settings
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="w-24 h-24 rounded-full bg-primary-blue text-white flex items-center justify-center font-bold text-3xl mx-auto mb-4">
            {currentUser.avatar}
          </div>
          <h2 className="text-xl font-bold mb-1">{currentUser.name}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Household User</p>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-outline w-full"
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
              <button onClick={handleSave} className="btn-primary w-full">
                Save Changes
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
                  <p className="font-medium">{profileData.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                  <p className="font-medium">{userStats.memberSince}</p>
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
