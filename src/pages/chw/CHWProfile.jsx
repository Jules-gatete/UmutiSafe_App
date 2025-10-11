import React, { useState } from 'react';
import { MapPin, Phone, Mail, Award, Calendar } from 'lucide-react';
import Input from '../../components/FormFields/Input';
import { currentUser, mockPickupRequests } from '../../utils/mockData';

export default function CHWProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [availability, setAvailability] = useState('available');
  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    sector: currentUser.sector,
  });

  const chwRequests = mockPickupRequests.filter(r => r.chwId === currentUser.id);
  const stats = {
    totalPickups: chwRequests.length,
    completed: chwRequests.filter(r => r.status === 'completed').length,
    pending: chwRequests.filter(r => r.status === 'pending').length,
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleSave = () => {
    alert('Profile updated successfully!');
    setIsEditing(false);
  };

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
            {currentUser.avatar}
          </div>
          <h2 className="text-xl font-bold mb-1">{currentUser.name}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Community Health Worker
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Availability Status</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
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

        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-bold mb-4">Contact Information</h3>

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
                label="Coverage Sector"
                id="sector"
                name="sector"
                value={profileData.sector}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coverage Area</p>
                  <p className="font-medium">{currentUser.coverageArea}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">CHW Since</p>
                  <p className="font-medium">{currentUser.createdAt}</p>
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
            <p className="text-3xl font-bold text-primary-blue dark:text-accent-cta mb-1">
              {stats.totalPickups}
            </p>
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
