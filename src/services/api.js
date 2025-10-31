import axios from 'axios';

// API Base URL (main backend)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Model API (FastAPI) - separate backend serving ML model
const MODEL_API_URL = import.meta.env.VITE_MODEL_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================

export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// ==================== MEDICINES APIs ====================

export const medicinesAPI = {
  // Get all medicines
  getAll: async (params = {}) => {
    const response = await api.get('/medicines', { params });
    return response.data;
  },

  // Get medicine by ID
  getById: async (id) => {
    const response = await api.get(`/medicines/${id}`);
    return response.data;
  },

  // Search medicines
  search: async (query) => {
    const response = await api.get(`/medicines/search?q=${query}`);
    return response.data;
  },

  // Create medicine (Admin only)
  create: async (medicineData) => {
    const response = await api.post('/medicines', medicineData);
    return response.data;
  },

  // Update medicine (Admin only)
  update: async (id, medicineData) => {
    const response = await api.put(`/medicines/${id}`, medicineData);
    return response.data;
  },

  // Delete medicine (Admin only)
  delete: async (id) => {
    const response = await api.delete(`/medicines/${id}`);
    return response.data;
  },
  
  // Predict medicine disposal from text
  predictFromText: async (data) => {
    // FastAPI expects application/x-www-form-urlencoded form fields
    try {
      const params = new URLSearchParams();
      params.append('generic_name', data.genericName || data.generic_name || '');
      params.append('brand_name', data.brandName || data.brand_name || '');
      params.append('dosage_form', data.dosageForm || data.dosage_form || '');
      params.append('packaging_type', data.packagingType || data.packaging_type || '');

      const resp = await axios.post(`${MODEL_API_URL}/api/predict/text`, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      // Map FastAPI response to the frontend expected shape used in AddDisposal.jsx
      const f = resp.data;
      const mapped = {
        success: !!f.success,
        ocr_text: {
          medicine_name: f.ocr_info?.extracted_info?.generic_name || f.medicine_info?.generic_name || '',
          brand_name: f.ocr_info?.extracted_info?.brand_name || f.medicine_info?.brand_name || ''
        },
        predicted_category: f.predictions?.disposal_category || f.safety_guidance?.category_name || '',
        risk_level: f.predictions?.risk_level || f.safety_guidance?.risk_level || '',
        confidence: typeof f.predictions?.confidence === 'number' ? f.predictions.confidence : (f.predictions?.all_probabilities?.['1'] || 0),
        disposal_guidance: f.safety_guidance?.procedure || f.safety_guidance?.prohibitions || '',
        safety_notes: f.safety_guidance?.special_instructions || f.safety_guidance?.risks || '',
        // Pass through raw blocks so UI can render detailed guidance and OCR metadata
        ocr_info: f.ocr_info || null,
        medicine_info: f.medicine_info || null,
        predictions: f.predictions || null,
        safety_guidance: f.safety_guidance || null
      };

      return { success: true, data: mapped };
    } catch (err) {
      console.error('predictFromText error', err?.response?.data || err.message || err);
      return { success: false, error: err?.response?.data || err.message };
    }
  },
  
  // Predict medicine disposal from image
  predictFromImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const resp = await axios.post(`${MODEL_API_URL}/api/predict/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const f = resp.data;
      const mapped = {
        success: !!f.success,
        ocr_text: {
          medicine_name: f.ocr_info?.extracted_info?.generic_name || f.medicine_info?.generic_name || '',
          brand_name: f.ocr_info?.extracted_info?.brand_name || f.medicine_info?.brand_name || ''
        },
        predicted_category: f.predictions?.disposal_category || f.safety_guidance?.category_name || '',
        risk_level: f.predictions?.risk_level || f.safety_guidance?.risk_level || '',
        confidence: typeof f.predictions?.confidence === 'number' ? f.predictions.confidence : (f.predictions?.all_probabilities?.['1'] || 0),
        disposal_guidance: f.safety_guidance?.procedure || f.safety_guidance?.prohibitions || '',
        safety_notes: f.safety_guidance?.special_instructions || f.safety_guidance?.risks || '',
        // Pass through raw blocks so UI can render detailed guidance and OCR metadata
        ocr_info: f.ocr_info || null,
        medicine_info: f.medicine_info || null,
        predictions: f.predictions || null,
        safety_guidance: f.safety_guidance || null
      };

      return { success: true, data: mapped };
    } catch (err) {
      console.error('predictFromImage error', err?.response?.data || err.message || err);
      return { success: false, error: err?.response?.data || err.message };
    }
  }
};

// ==================== DISPOSALS APIs ====================

export const disposalsAPI = {
  // Get user's disposals
  getAll: async (params = {}) => {
    const response = await api.get('/disposals', { params });
    return response.data;
  },

  // Get disposal by ID
  getById: async (id) => {
    const response = await api.get(`/disposals/${id}`);
    return response.data;
  },

  // Create disposal
  create: async (disposalData) => {
    // If there's a file (image) attached, send multipart/form-data
    if (disposalData.file) {
      const fd = new FormData();
      // append fields
      Object.keys(disposalData).forEach((k) => {
        if (k === 'file') return fd.append('image', disposalData.file);
        if (disposalData[k] !== undefined && disposalData[k] !== null) fd.append(k, disposalData[k]);
      });

      const response = await api.post('/disposals', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    }

    const response = await api.post('/disposals', disposalData);
    return response.data;
  },

  // Update disposal
  update: async (id, disposalData) => {
    const response = await api.put(`/disposals/${id}`, disposalData);
    return response.data;
  },

  // Delete disposal
  delete: async (id) => {
    const response = await api.delete(`/disposals/${id}`);
    return response.data;
  },

  // Request pickup for disposal
  requestPickup: async (id, pickupData) => {
    const response = await api.post(`/disposals/${id}/request-pickup`, pickupData);
    return response.data;
  }
};

// ==================== PICKUP REQUESTS APIs ====================

export const pickupsAPI = {
  // Get pickup requests
  getAll: async (params = {}) => {
    const response = await api.get('/pickups', { params });
    return response.data;
  },

  // Get pickup by ID
  getById: async (id) => {
    const response = await api.get(`/pickups/${id}`);
    return response.data;
  },

  // Create pickup request
  create: async (pickupData) => {
    const response = await api.post('/pickups', pickupData);
    return response.data;
  },

  // Update pickup request
  update: async (id, pickupData) => {
    const response = await api.put(`/pickups/${id}`, pickupData);
    return response.data;
  },

  // Accept pickup (CHW only)
  accept: async (id) => {
    const response = await api.put(`/pickups/${id}/accept`);
    return response.data;
  },

  // Complete pickup (CHW only)
  complete: async (id, notes) => {
    const response = await api.put(`/pickups/${id}/complete`, { notes });
    return response.data;
  },

  // Cancel pickup
  cancel: async (id, reason) => {
    const response = await api.put(`/pickups/${id}/cancel`, { reason });
    return response.data;
  },

  // Update pickup status (CHW only)
  updateStatus: async (id, statusData) => {
    const response = await api.put(`/pickups/${id}/status`, statusData);
    return response.data;
  }
};

// ==================== CHW APIs ====================

export const chwAPI = {
  // Get available CHWs
  getAvailable: async () => {
    const response = await api.get('/chws/nearby');
    return response.data;
  },

  // Get all CHWs
  getAll: async (params = {}) => {
    const response = await api.get('/chws', { params });
    return response.data;
  },

  // Get CHW by ID
  getById: async (id) => {
    const response = await api.get(`/chws/${id}`);
    return response.data;
  },

  // Get CHW dashboard data (for CHW users)
  getDashboard: async () => {
    const response = await api.get('/pickups/chw/stats');
    return response.data;
  },

  // Update availability
  updateAvailability: async (availability) => {
    const response = await api.put('/chws/availability', { availability });
    return response.data;
  },

  // Get CHW pickups
  getPickups: async (params = {}) => {
    const response = await api.get('/pickups/chw', { params });
    return response.data;
  }
};

// ==================== EDUCATION APIs ====================

export const educationAPI = {
  // Get all education tips
  getAll: async () => {
    const response = await api.get('/education');
    return response.data;
  },

  // Get education tip by ID
  getById: async (id) => {
    const response = await api.get(`/education/${id}`);
    return response.data;
  },

  // Create education tip (Admin only)
  create: async (tipData) => {
    const response = await api.post('/education', tipData);
    return response.data;
  },

  // Update education tip (Admin only)
  update: async (id, tipData) => {
    const response = await api.put(`/education/${id}`, tipData);
    return response.data;
  },

  // Delete education tip (Admin only)
  delete: async (id) => {
    const response = await api.delete(`/education/${id}`);
    return response.data;
  }
};

// ==================== ADMIN APIs ====================

export const adminAPI = {
  // Get system stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Get all users
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Get pending users
  getPendingUsers: async () => {
    const response = await api.get('/admin/users/pending');
    return response.data;
  },

  // Approve user
  approveUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/approve`);
    return response.data;
  },

  // Reject user
  rejectUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/reject`);
    return response.data;
  },

  // Update user
  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Activate user
  activateUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/activate`);
    return response.data;
  },

  // Deactivate user
  deactivateUser: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/deactivate`);
    return response.data;
  },

  // Get all disposals
  getDisposals: async (params = {}) => {
    const response = await api.get('/admin/disposals', { params });
    return response.data;
  },

  // Get single disposal by id (Admin)
  getDisposalById: async (id) => {
    const response = await api.get(`/admin/disposals/${id}`);
    return response.data;
  },

  // Get all pickups
  getPickups: async (params = {}) => {
    const response = await api.get('/admin/pickups', { params });
    return response.data;
  }
};

export default api;

