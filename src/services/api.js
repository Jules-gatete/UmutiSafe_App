import axios from 'axios';

/**
 * Runtime backend selector:
 *  - Try preferredLocal = 'http://localhost:5000' first (short timeout).
 *  - If health check works, use it; otherwise fallback to REMOTE_BACKEND.
 */
const REMOTE_BACKEND = 'https://umutisafe-backend.onrender.com';
const PREFERRED_LOCAL = 'http://localhost:5000';
const HEALTH_PATH = '/api/health';
const HEALTH_TIMEOUT = 1200; // ms

async function probeBase(baseUrl) {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), HEALTH_TIMEOUT);

    const res = await fetch(baseUrl + HEALTH_PATH, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
    });
    clearTimeout(id);
    return res && res.ok;
  } catch (err) {
    return false;
  }
}

let baseURLPromise = (async () => {
  if (await probeBase(PREFERRED_LOCAL)) {
    console.info('Using local backend:', PREFERRED_LOCAL);
    return PREFERRED_LOCAL;
  }
  console.info('Falling back to remote backend:', REMOTE_BACKEND);
  return REMOTE_BACKEND;
})();

export async function createApiClient() {
  const base = await baseURLPromise;
  const client = axios.create({
    baseURL: base,
    withCredentials: true, // keep cookies if your backend uses them
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });
  return client;
}

// API Base URL (main backend) - if provided at build time it will be used as-is.
// Otherwise we will pick at runtime (local first, then remote) via the probe above.
const API_BASE_URL = import.meta.env.VITE_API_URL || null;

// Model API (FastAPI) - separate backend serving ML model
const PREFERRED_MODEL = 'http://localhost:8000';
const DEFAULT_REMOTE_MODEL = 'https://plankton-app-2c2ae.ondigitalocean.app';

let configuredModelUrl = import.meta.env.VITE_MODEL_API_URL;
if (configuredModelUrl && typeof configuredModelUrl === 'string') {
  configuredModelUrl = configuredModelUrl.trim().replace(/\/$/, '');
}

const MODEL_API_URL = configuredModelUrl || DEFAULT_REMOTE_MODEL;
const MODEL_HEALTH_PATH = '/api/health';
const MODEL_HEALTH_TIMEOUT = 1200;


async function probeModel(baseUrl) {
  // Try a few common health endpoints so the probe works even if the model
  // server exposes a different path (some projects use /health or /)
  const candidates = ['/api/health', '/health', '/'];
  for (const p of candidates) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), MODEL_HEALTH_TIMEOUT);
      const url = baseUrl.replace(/\/$/, '') + p;
      const res = await fetch(url, { method: 'GET', mode: 'cors', signal: controller.signal });
      clearTimeout(id);
      if (res && res.ok) {
        console.info(`Model probe: ${url} OK`);
        return true;
      }
    } catch (err) {
      // ignore and try next candidate
    }
  }
  return false;
}

function mapModelPredictionResponse(raw = {}) {
  return {
    success: raw.success !== false,
    data: {
      medicineName: raw.medicine_name || null,
      inputType: raw.input_type || null,
      predictions: raw.predictions || {},
      analysis: raw.analysis || '',
      messages: Array.isArray(raw.messages)
        ? raw.messages
        : raw.messages
        ? [raw.messages]
        : [],
      errors: Array.isArray(raw.errors)
        ? raw.errors
        : raw.errors
        ? [raw.errors]
        : [],
      raw
    }
  };
}

// runtime selection for the model service (prefer local)
let modelBaseURLPromise = (async () => {
  const localAvailable = await probeModel(PREFERRED_MODEL).catch(() => false);
  if (localAvailable) {
    console.info('Using local model service:', PREFERRED_MODEL);
    return PREFERRED_MODEL;
  }

  const remoteRoot = MODEL_API_URL ? MODEL_API_URL.replace(/\/$/, '') : DEFAULT_REMOTE_MODEL;
  const remoteAvailable = await probeModel(remoteRoot).catch(() => false);
  if (remoteAvailable) {
    console.info('Using remote model service:', remoteRoot);
    return remoteRoot;
  }

  console.warn('Neither local nor remote model endpoints responded to health checks. Proceeding with remote URL anyway.');
  return remoteRoot;
})();

// Create axios instance WITHOUT a static baseURL — we'll set it at request time
// so the app can pick the best backend (local first, then remote) at runtime.
const api = axios.create({
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: ensure baseURL is set (runtime selection) and attach auth token
api.interceptors.request.use(
  async (config) => {
    // If a baseURL was explicitly set on the request, keep it.
    if (!config.baseURL) {
      // Prefer the runtime-detected base (local first, then remote) so
      // the deployed static app will use a local backend when available.
      // Fall back to the build-time API URL only if the runtime probe fails.
      const detected = await baseURLPromise.catch(() => null);
      const chosenRoot = detected || API_BASE_URL || PREFERRED_LOCAL;

      // If chosenRoot already includes an /api suffix, don't append it again
      if (/\/api\/?$/.test(chosenRoot)) {
        config.baseURL = chosenRoot.replace(/\/$/, '');
      } else {
        config.baseURL = chosenRoot.replace(/\/$/, '') + '/api';
      }
    }

    // Attach token if present
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      // localStorage might throw in some environments; ignore safely
    }

    return config;
  },
  (error) => Promise.reject(error)
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

  // Upload medicines CSV (Admin only)
  uploadCSV: async (formData) => {
    const response = await api.post('/medicines/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  // Predict medicine disposal from text
  predictFromText: async (data = {}) => {
    try {
      const genericName = (data.genericName || data.generic_name || '').trim();
      if (!genericName) {
        return { success: false, error: 'Please provide a generic medicine name before requesting a prediction.' };
      }

      const modelRoot = (await modelBaseURLPromise) || MODEL_API_URL || PREFERRED_MODEL;
      const root = modelRoot.replace(/\/$/, '');
      const requestBody = {
        medicine_name: genericName,
        output_format: 'full'
      };
      const endpoints = ['/api/predict/text', '/predict/text'];

      let response;
      let lastError;
      for (const path of endpoints) {
        const url = `${root}${path}`;
        try {
          response = await axios.post(url, requestBody, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 20000
          });
          break;
        } catch (error) {
          lastError = error;
          if (error?.response?.status === 404 || error?.response?.status === 405) {
            continue;
          }
          break;
        }
      }

      if (!response) {
        throw lastError || new Error('Prediction request failed');
      }

      const mapped = mapModelPredictionResponse(response.data);
      if (mapped.success) {
        return mapped;
      }

      const fallbackError = typeof response.data === 'string' ? response.data : 'Prediction failed';
      return { success: false, error: fallbackError };
    } catch (err) {
      const serverData = err?.response?.data;
      const errorMsg = typeof serverData === 'string'
        ? serverData
        : (serverData && (serverData.detail || serverData.message)) || err.message || 'Unknown error';
      console.error('predictFromText error', errorMsg);
      return { success: false, error: errorMsg };
    }
  },
  
  // Predict medicine disposal from image
  predictFromImage: async (imageFile) => {
    if (!imageFile) {
      return { success: false, error: 'Please select an image before requesting a prediction.' };
    }

    try {
      const modelRoot = (await modelBaseURLPromise) || MODEL_API_URL || PREFERRED_MODEL;
      const root = modelRoot.replace(/\/$/, '');
  const formData = new FormData();
  formData.append('file', imageFile);
  formData.append('output_format', 'full');

      const endpoints = ['/api/predict/image', '/predict/image'];
      let response;
      let lastError;

      for (const path of endpoints) {
        const url = `${root}${path}`;
        try {
          response = await axios.post(url, formData, {
            timeout: 30000
          });
          break;
        } catch (error) {
          lastError = error;
          if (error?.response?.status === 404 || error?.response?.status === 405) {
            continue;
          }
          break;
        }
      }

      if (!response) {
        throw lastError || new Error('Image prediction request failed');
      }

      const mapped = mapModelPredictionResponse(response.data);
      if (mapped.success) {
        return mapped;
      }

      const fallbackError = typeof response.data === 'string' ? response.data : 'Image prediction failed';
      return { success: false, error: fallbackError };
    } catch (err) {
      const serverData = err?.response?.data;
      const errorMsg = typeof serverData === 'string'
        ? serverData
        : (serverData && (serverData.detail || serverData.message)) || err.message || 'Unknown error';
      console.error('predictFromImage error', errorMsg);
      return { success: false, error: errorMsg };
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
      Object.entries(disposalData).forEach(([key, value]) => {
        if (key === 'file') {
          fd.append('image', disposalData.file);
          return;
        }
        if (value === undefined || value === null) {
          return;
        }
        if (value instanceof Blob || value instanceof File) {
          fd.append(key, value);
          return;
        }
        if (typeof value === 'object') {
          fd.append(key, JSON.stringify(value));
          return;
        }
        fd.append(key, value);
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

