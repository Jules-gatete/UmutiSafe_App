import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MapPin, Calendar, CheckCircle, User, Phone, Star } from 'lucide-react';
import Input from '../../components/FormFields/Input';
import Textarea from '../../components/FormFields/Textarea';
import Select from '../../components/FormFields/Select';
import Table from '../../components/Table';
import SearchBar from '../../components/SearchBar';
import { chwAPI, pickupsAPI } from '../../services/api';

export default function CHWInteraction() {
  const location = useLocation();
  const prefillData = location.state || {};

  const [query, setQuery] = useState('');
  const [chws, setChws] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();

    // Auto-refresh every 10 seconds for real-time updates
    const pollInterval = setInterval(() => {
      fetchData();
    }, 10000); // Poll every 10 seconds

    // Refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [chwsResult, pickupsResult] = await Promise.all([
        chwAPI.getAvailable(),
        pickupsAPI.getAll()
      ]);

      if (chwsResult.success) {
        setChws(chwsResult.data);
      }
      if (pickupsResult.success) {
        setPickups(pickupsResult.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load CHW data');
    } finally {
      setLoading(false);
    }
  };

  // Filter CHWs by user's sector first, then by search query
  const filteredCHWs = useMemo(() => {
    // First filter by sector - only show CHWs from the same sector as the user
    let sectorFiltered = chws;
    if (user.sector) {
      sectorFiltered = chws.filter(c =>
        c.sector && c.sector.toLowerCase() === user.sector.toLowerCase()
      );
    }

    // Then apply search query filter
    if (!query) return sectorFiltered;
    const q = query.toLowerCase();
    return sectorFiltered.filter(
      c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.sector || '').toLowerCase().includes(q) ||
        (c.coverageArea || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
    );
  }, [query, chws, user.sector]);

  const [selectedCHW, setSelectedCHW] = useState(null);
  const [formData, setFormData] = useState({
    medicineName: prefillData.medicineName || '',
    disposalGuidance: prefillData.disposalGuidance || '',
    reason: '',
    pickupLocation: '',
    preferredTime: '',
    consent: false,
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reasonOptions = [
    { value: 'expired', label: 'Medicine Expired' },
    { value: 'no_longer_needed', label: 'No Longer Needed' },
    { value: 'completed_treatment', label: 'Completed Treatment' },
    { value: 'adverse_reaction', label: 'Adverse Reaction' },
    { value: 'other', label: 'Other' },
  ];

  const handleCHWSelect = (chw) => {
    setSelectedCHW(chw);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCHW) {
      alert('Please select a CHW first.');
      return;
    }

    if (!formData.consent) {
      alert('Please provide consent to share your information.');
      return;
    }

    const request = {
      chwId: selectedCHW.id,
      medicineName: formData.medicineName,
      disposalGuidance: formData.disposalGuidance,
      reason: formData.reason,
      pickupLocation: formData.pickupLocation,
      preferredTime: formData.preferredTime,
      consentGiven: formData.consent
    };

    try {
      setSubmitting(true);
      const response = await pickupsAPI.create(request);

      if (response.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);

        // Reset form
        setFormData({
          medicineName: '',
          disposalGuidance: '',
          reason: '',
          pickupLocation: '',
          preferredTime: '',
          consent: false,
        });
        setSelectedCHW(null);

        // Refresh pickups list
        fetchData();
      }
    } catch (err) {
      console.error('Error submitting pickup request:', err);
      alert('Failed to submit pickup request. Please try again.');
    } finally {
      setSubmitting(false);
    }

    setFormData({
      medicineName: '',
      disposalGuidance: '',
      reason: '',
      pickupLocation: '',
      preferredTime: '',
      consent: false,
    });
    setSelectedCHW(null);
  };

  // Format pickups data for table display
  const formattedPickups = useMemo(() => {
    return pickups.map(pickup => ({
      ...pickup,
      chwName: pickup.chw?.name || 'Not assigned',
      createdAt: new Date(pickup.createdAt).toLocaleDateString()
    }));
  }, [pickups]);

  const pickupColumns = [
    {
      key: 'medicineName',
      label: 'Medicine',
      sortable: true,
    },
    {
      key: 'chwName',
      label: 'CHW',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={`badge badge-${
            value === 'completed'
              ? 'success'
              : value === 'scheduled'
              ? 'info'
              : value === 'pending'
              ? 'warning'
              : 'danger'
          }`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Requested',
      sortable: true,
    },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-8 pb-24 lg:pb-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading CHW data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8">
      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        Request CHW Pickup
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Connect with Community Health Workers for safe medicine disposal
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 dark:bg-opacity-30 border-l-4 border-green-500 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-200 font-medium">
            Pickup request submitted successfully! The CHW will contact you soon.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-bold mb-2">Community Health Workers in Your Sector</h2>
          {user.sector && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Showing CHWs from <span className="font-semibold text-primary-blue dark:text-accent-cta">{user.sector}</span> sector
            </p>
          )}
          {!user.sector && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Please update your sector in your profile to see CHWs in your area.
              </p>
            </div>
          )}
          <div className="mb-4 max-w-md">
            <SearchBar
              onSearch={(q) => setQuery(q)}
              placeholder="Search CHWs by name, sector or coverage area..."
            />
          </div>
          <div className="space-y-3">
            {filteredCHWs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  {user.sector
                    ? `No CHWs available in ${user.sector} sector at the moment.`
                    : 'Please set your sector in your profile to see available CHWs.'}
                </p>
              </div>
            ) : (
              filteredCHWs.map((chw) => (
              <div
                key={chw.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedCHW?.id === chw.id
                    ? 'border-primary-blue dark:border-accent-cta bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-blue dark:hover:border-accent-cta'
                }`}
                onClick={() => handleCHWSelect(chw)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-primary-green text-white flex items-center justify-center font-semibold flex-shrink-0">
                      {chw.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{chw.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {chw.coverageArea}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {chw.phone}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`badge ${
                            chw.availability === 'available' ? 'badge-success' : 'badge-warning'
                          }`}
                        >
                          {chw.availability}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          {chw.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <h2 className="text-xl font-bold mb-4">Pickup Request Form</h2>

          {selectedCHW ? (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Selected CHW: <span className="font-semibold">{selectedCHW.name}</span>
              </p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Please select a CHW from the list
              </p>
            </div>
          )}

          <Input
            label="Medicine Name"
            id="medicineName"
            name="medicineName"
            value={formData.medicineName}
            onChange={handleInputChange}
            placeholder="e.g., Paracetamol (Panadol)"
            required
          />

          <Textarea
            label="Disposal Guidance (Pre-filled)"
            id="disposalGuidance"
            name="disposalGuidance"
            value={formData.disposalGuidance}
            onChange={handleInputChange}
            rows={3}
            placeholder="Disposal instructions will appear here after classification"
          />

          <Select
            label="Reason for Disposal"
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            options={reasonOptions}
            required
          />

          <Input
            label="Pickup Location"
            id="pickupLocation"
            name="pickupLocation"
            value={formData.pickupLocation}
            onChange={handleInputChange}
            placeholder="e.g., KG 123 St, Remera, Kigali"
            required
          />

          <Input
            label="Preferred Pickup Time"
            id="preferredTime"
            name="preferredTime"
            type="datetime-local"
            value={formData.preferredTime}
            onChange={handleInputChange}
            required
          />

          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleInputChange}
                className="mt-1 w-5 h-5 text-primary-blue focus:ring-accent-cta rounded"
                required
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                I consent to share my contact information and location with the selected
                Community Health Worker for the purpose of medicine pickup and disposal.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!selectedCHW || !formData.consent}
            className="btn-primary w-full"
          >
            Submit Pickup Request
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold mb-4">My Pickup Requests</h2>
        <Table columns={pickupColumns} data={formattedPickups} />
      </div>
    </div>
  );
}
