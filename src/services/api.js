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
const LOCAL_MODEL = import.meta.env.DEV ? 'http://localhost:8000' : null;
const DEFAULT_REMOTE_MODEL = 'https://plankton-app-2c2ae.ondigitalocean.app';
const LEGACY_MODEL_HOSTS = ['mission-capstone.onrender.com'];

let configuredModelUrl = import.meta.env.VITE_MODEL_API_URL;
if (configuredModelUrl && typeof configuredModelUrl === 'string') {
  configuredModelUrl = configuredModelUrl.trim().replace(/\/$/, '');

  // Ignore legacy Render host so deployments fall back to the DigitalOcean model.
  const legacyMatch = (() => {
    try {
      const candidate = new URL(configuredModelUrl);
      return LEGACY_MODEL_HOSTS.includes(candidate.hostname);
    } catch (err) {
      const normalized = configuredModelUrl.replace(/^https?:\/\//, '').split('/')[0];
      return LEGACY_MODEL_HOSTS.includes(normalized);
    }
  })();

  if (legacyMatch) {
    console.warn('Legacy model host detected in VITE_MODEL_API_URL; defaulting to DigitalOcean endpoint.');
    configuredModelUrl = null;
  }
}

const MODEL_API_URL = configuredModelUrl || DEFAULT_REMOTE_MODEL;
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
  const clampConfidence = (value) => {
    if (value === undefined || value === null) return null;
    let numeric = value;
    if (typeof numeric === 'string') {
      numeric = Number.parseFloat(numeric);
    }
    if (typeof numeric !== 'number' || Number.isNaN(numeric)) {
      return null;
    }
    if (numeric > 1 && numeric <= 100) {
      numeric = numeric / 100;
    }
    if (numeric < 0) return 0;
    if (numeric > 1) return 1;
    return numeric;
  };

  const toNumber = (...candidates) => {
    for (const candidate of candidates) {
      if (candidate === undefined || candidate === null) continue;
      let value = candidate;
      if (typeof value === 'string') {
        value = Number.parseFloat(value);
      }
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value;
      }
    }
    return null;
  };

  const pickText = (...candidates) => {
    for (const candidate of candidates) {
      if (!candidate) continue;
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed) {
          return trimmed;
        }
        continue;
      }
      if (Array.isArray(candidate)) {
        const joined = candidate
          .map((item) => {
            if (!item) return '';
            if (typeof item === 'string') return item.trim();
            if (typeof item === 'object') {
              const textValue = item.text || item.value || item.label || item.name || item.title || '';
              return typeof textValue === 'string' ? textValue.trim() : '';
            }
            return '';
          })
          .filter(Boolean)
          .join('\n')
          .trim();
        if (joined) {
          return joined;
        }
        continue;
      }
      if (typeof candidate === 'object') {
        const textValue =
          candidate.text ||
          candidate.value ||
          candidate.message ||
          candidate.msg ||
          candidate.description;
        if (typeof textValue === 'string') {
          const trimmed = textValue.trim();
          if (trimmed) {
            return trimmed;
          }
        }
      }
    }
    return '';
  };

  const normalizePredictionList = (input, options = {}) => {
    const { defaultConfidence = null, splitText = false, fillConfidence = false } = options;
    const results = [];
    const seen = new Set();

    const addEntry = (value, confidence, meta = {}) => {
      if (value === undefined || value === null) return;
      const stringValue = value.toString().trim();
      if (!stringValue) return;
      const normalizedConfidence = confidence !== undefined && confidence !== null
        ? clampConfidence(confidence)
        : null;
      const label = typeof meta.label === 'string' && meta.label.trim()
        ? meta.label.trim()
        : stringValue;
      const key = `${stringValue.toLowerCase()}|${normalizedConfidence ?? ''}`;
      if (!meta.allowDuplicate && seen.has(key)) {
        return;
      }
      seen.add(key);

      const entry = {
        value: stringValue,
        label
      };

      if (normalizedConfidence !== null) {
        entry.confidence = normalizedConfidence;
      } else if (fillConfidence && defaultConfidence !== null) {
        entry.confidence = defaultConfidence;
      }

      const extras = { ...meta };
      delete extras.label;
      delete extras.allowDuplicate;
      delete extras.confidence;
      Object.entries(extras).forEach(([k, v]) => {
        if (v !== undefined) {
          entry[k] = v;
        }
      });

      results.push(entry);
    };

    const fromObjectEntry = (obj) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return false;
      }
      const value = obj.value ?? obj.label ?? obj.name ?? obj.title ?? obj.text;
      if (!value && value !== 0) {
        return false;
      }
      const confidence =
        obj.confidence ??
        obj.score ??
        obj.probability ??
        obj.weight ??
        obj.confidence_score;
      const meta = { ...obj };
      delete meta.value;
      delete meta.label;
      delete meta.name;
      delete meta.title;
      delete meta.text;
      delete meta.confidence;
      delete meta.score;
      delete meta.probability;
      delete meta.weight;
      delete meta.confidence_score;
      addEntry(value, confidence, meta);
      return true;
    };

    const handle = (value) => {
      if (value === undefined || value === null) {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(handle);
        return;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return;
        if (splitText && /[\n;,]/.test(trimmed)) {
          trimmed
            .split(/[\n;,]+/)
            .map((item) => item.trim())
            .filter(Boolean)
            .forEach((part) => addEntry(part, null, {}));
          return;
        }
        addEntry(trimmed, null, {});
        return;
      }
      if (typeof value === 'number') {
        addEntry(value, null, {});
        return;
      }
      if (typeof value === 'object') {
        if (fromObjectEntry(value)) {
          return;
        }
        const entries = Object.entries(value);
        let handled = false;
        for (const [key, val] of entries) {
          if (val === undefined || val === null) continue;
          if (typeof val === 'number' || typeof val === 'string') {
            addEntry(key, val, {});
            handled = true;
            continue;
          }
          if (typeof val === 'object') {
            const candidate = { ...val };
            if (candidate.value === undefined) {
              candidate.value = key;
            }
            if (candidate.label === undefined) {
              candidate.label = key;
            }
            if (fromObjectEntry(candidate)) {
              handled = true;
            }
          }
        }
        if (!handled) {
          const textCandidate = value.text || value.description || value.summary;
          if (typeof textCandidate === 'string' && textCandidate.trim()) {
            addEntry(textCandidate.trim(), null, {});
          }
        }
      }
    };

    handle(input);

    return results;
  };

  const collectMessages = (...sources) => {
    const items = [];
    for (const source of sources) {
      if (!source) continue;
      if (Array.isArray(source)) {
        source.forEach((item) => {
          if (!item) return;
          if (typeof item === 'string') {
            const trimmed = item.trim();
            if (trimmed) items.push(trimmed);
            return;
          }
          if (typeof item === 'object') {
            const text = item.message || item.msg || item.detail || item.text;
            if (typeof text === 'string' && text.trim()) {
              items.push(text.trim());
              return;
            }
            items.push(JSON.stringify(item));
          } else {
            items.push(String(item));
          }
        });
        continue;
      }
      if (typeof source === 'string') {
        source
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((line) => items.push(line));
        continue;
      }
      if (typeof source === 'object') {
        if (Array.isArray(source.detail)) {
          source.detail.forEach((item) => {
            if (typeof item === 'string') {
              const trimmed = item.trim();
              if (trimmed) items.push(trimmed);
              return;
            }
            if (item && typeof item === 'object') {
              const text = item.message || item.msg || item.detail;
              if (typeof text === 'string' && text.trim()) {
                items.push(text.trim());
              }
            }
          });
          continue;
        }
        const text = source.message || source.msg || source.error || source.detail;
        if (typeof text === 'string' && text.trim()) {
          items.push(text.trim());
        }
      }
    }
    const unique = Array.from(new Set(items));
    return unique;
  };

  const pickObject = (...candidates) => {
    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        return candidate;
      }
    }
    return {};
  };

  const basePredictions = pickObject(
    raw.predictions,
    raw.data && raw.data.predictions,
    raw.result && raw.result.predictions,
    raw.details,
    raw.prediction
  );
  const safety = pickObject(
    raw.safety_guidance,
    raw.guidance,
    raw.safety
  );
  const metadata = pickObject(raw.metadata);

  const baseConfidence = clampConfidence(
    basePredictions.confidence ??
      basePredictions.score ??
      basePredictions.probability ??
      raw.confidence
  );

  const riskLevel = pickText(
    basePredictions.risk_level,
    safety.risk_level,
    metadata.risk_level,
    raw.risk_level
  );
  const handlingMethod = pickText(
    basePredictions.handling_method,
    safety.prohibitions,
    safety.procedure
  );
  const disposalRemarks = pickText(
    basePredictions.disposal_remarks,
    basePredictions.remark,
    safety.special_instructions,
    safety.risks,
    metadata.disposal_remarks,
    raw.disposal_remarks
  );
  const recommendedDisposal = pickText(
    basePredictions.recommended_disposal,
    safety.procedure
  );
  const probabilities =
    basePredictions.all_probabilities ||
    basePredictions.category_probabilities ||
    metadata.all_probabilities ||
    raw.all_probabilities ||
    null;

  const buildDisposalCategory = () => {
    const source =
      basePredictions.disposal_category ||
      basePredictions.category ||
      raw.predicted_category ||
      safety.category ||
      safety.category_name;
    if (!source && !recommendedDisposal && !handlingMethod && !disposalRemarks && !riskLevel) {
      return null;
    }

    const createCategory = (value, meta = {}) => {
      if (value === undefined || value === null) return null;
      const stringValue = value.toString().trim();
      if (!stringValue) return null;
      const category = { value: stringValue };
      if (meta.label) category.label = meta.label;
      if (meta.confidence != null) category.confidence = meta.confidence;
      if (meta.risk_level) category.risk_level = meta.risk_level;
      if (meta.recommended_disposal) category.recommended_disposal = meta.recommended_disposal;
      if (meta.handling_method) category.handling_method = meta.handling_method;
      if (meta.remarks) category.remarks = meta.remarks;
      if (meta.all_probabilities) category.all_probabilities = meta.all_probabilities;
      Object.entries(meta.extra || {}).forEach(([key, val]) => {
        if (val !== undefined && !(key in category)) {
          category[key] = val;
        }
      });
      return category;
    };

    if (Array.isArray(source)) {
      const normalized = normalizePredictionList(source, {
        defaultConfidence: baseConfidence,
        fillConfidence: true
      });
      if (normalized.length) {
        const [primary, ...rest] = normalized;
        const category = { ...primary };
        if (rest.length) {
          category.options = [primary, ...rest];
        }
        if (!category.risk_level && riskLevel) {
          category.risk_level = riskLevel;
        }
        if (!category.recommended_disposal && recommendedDisposal) {
          category.recommended_disposal = recommendedDisposal;
        }
        if (!category.handling_method && handlingMethod) {
          category.handling_method = handlingMethod;
        }
        if (!category.remarks && disposalRemarks) {
          category.remarks = disposalRemarks;
        }
        if (probabilities && !category.all_probabilities) {
          category.all_probabilities = probabilities;
        }
        return category;
      }
    }

    if (source && typeof source === 'object') {
      const meta = { ...source };
      const value =
        meta.value ??
        meta.id ??
        meta.code ??
        meta.category ??
        meta.name ??
        meta.label;
      const label = meta.label ?? meta.name ?? meta.title ?? null;
      const confidence = clampConfidence(
        meta.confidence ?? meta.score ?? meta.probability ?? baseConfidence
      );
      delete meta.value;
      delete meta.id;
      delete meta.code;
      delete meta.category;
      delete meta.name;
      delete meta.label;
      delete meta.title;
      delete meta.confidence;
      delete meta.score;
      delete meta.probability;
      const category = createCategory(value, {
        label,
        confidence,
        risk_level: meta.risk_level || riskLevel || null,
        recommended_disposal: meta.recommended_disposal || recommendedDisposal || null,
        handling_method: meta.handling_method || handlingMethod || null,
        remarks: meta.remarks || meta.remark || disposalRemarks || null,
        all_probabilities: meta.all_probabilities || probabilities || null,
        extra: meta
      });
      if (category) {
        return category;
      }
    }

    return createCategory(source, {
      label: typeof safety.category_name === 'string' ? safety.category_name.trim() : null,
      confidence: baseConfidence,
      risk_level: riskLevel || null,
      recommended_disposal: recommendedDisposal || null,
      handling_method: handlingMethod || null,
      remarks: disposalRemarks || null,
      all_probabilities: probabilities || null
    });
  };

  const methodOfDisposal = normalizePredictionList(
    basePredictions.method_of_disposal ??
      basePredictions.disposal_methods ??
      raw.method_of_disposal ??
      raw.disposal_methods,
    {
      defaultConfidence: baseConfidence,
      splitText: true,
      fillConfidence: true
    }
  );
  if (!methodOfDisposal.length && recommendedDisposal) {
    methodOfDisposal.push({
      value: recommendedDisposal,
      label: recommendedDisposal,
      confidence: baseConfidence ?? null,
      source: 'guidance'
    });
  }

  const dosageForm = normalizePredictionList(
    basePredictions.dosage_form ??
      basePredictions.dosage_forms ??
      basePredictions.dosageForm ??
      raw.dosage_form ??
      raw.dosage_forms,
    {
      splitText: true
    }
  );
  const fallbackDosage = pickText(
    metadata.dosage_form,
    raw.medicine_info && raw.medicine_info.dosage_form
  );
  if (!dosageForm.length && fallbackDosage) {
    dosageForm.push({
      value: fallbackDosage,
      label: fallbackDosage
    });
  }

  const manufacturer = normalizePredictionList(
    basePredictions.manufacturer ??
      basePredictions.manufacturers ??
      raw.manufacturer ??
      raw.manufacturers,
    {
      splitText: true
    }
  );
  const fallbackManufacturer = pickText(
    metadata.manufacturer,
    raw.medicine_info && raw.medicine_info.manufacturer,
    raw.medicine_info && raw.medicine_info.brand_name
  );
  if (!manufacturer.length && fallbackManufacturer) {
    manufacturer.push({
      value: fallbackManufacturer,
      label: fallbackManufacturer
    });
  }

  const similarGenericName = pickText(
    basePredictions.similar_generic_name,
    basePredictions.closest_generic_name,
    metadata.similar_generic_name,
    raw.similar_generic_name
  );
  const similarityDistance = toNumber(
    basePredictions.similarity_distance,
    basePredictions.distance,
    metadata.similarity_distance,
    raw.similarity_distance
  );
  const inputGenericName = pickText(
    basePredictions.input_generic_name,
    raw.input_generic_name,
    raw.medicine_name,
    raw.medicine_info && raw.medicine_info.generic_name,
    metadata.input_generic_name
  );
  const brandName = pickText(
    basePredictions.input_brand_name,
    raw.input_brand_name,
    raw.medicine_info && raw.medicine_info.brand_name,
    metadata.input_brand_name
  );

  const predictionsData = {
    disposal_category: buildDisposalCategory(),
    method_of_disposal: methodOfDisposal,
    dosage_form: dosageForm,
    manufacturer,
    handling_method: handlingMethod || null,
    disposal_remarks: disposalRemarks || null,
    risk_level: riskLevel || null,
    similar_generic_name: similarGenericName || null,
    similarity_distance: similarityDistance,
    input_generic_name: inputGenericName || null,
    input_brand_name: brandName || null,
    all_probabilities: probabilities
  };

  const sanitizeString = (value) => {
    if (value === undefined || value === null) return null;
    const str = value.toString().trim();
    return str ? str : null;
  };

  predictionsData.handling_method = sanitizeString(predictionsData.handling_method);
  predictionsData.disposal_remarks = sanitizeString(predictionsData.disposal_remarks);
  predictionsData.risk_level = sanitizeString(predictionsData.risk_level);
  predictionsData.similar_generic_name = sanitizeString(predictionsData.similar_generic_name);
  predictionsData.input_generic_name = sanitizeString(predictionsData.input_generic_name);
  predictionsData.input_brand_name = sanitizeString(predictionsData.input_brand_name);
  if (!Array.isArray(predictionsData.method_of_disposal)) predictionsData.method_of_disposal = [];
  if (!Array.isArray(predictionsData.dosage_form)) predictionsData.dosage_form = [];
  if (!Array.isArray(predictionsData.manufacturer)) predictionsData.manufacturer = [];

  const analysis = pickText(
    raw.analysis,
    raw.analysis_markdown,
    raw.analysis_text,
    raw.full_analysis,
    raw.analysis_md,
    raw.analysis_html
  );

  const medicineName = pickText(
    raw.medicine_name,
    basePredictions.input_generic_name,
    raw.medicine_info && raw.medicine_info.generic_name,
    metadata.medicine_name
  );

  const inputType = pickText(
    raw.input_type,
    raw.inputType,
    metadata.input_type
  );

  const ocrPayload =
    raw.ocr_info ||
    raw.ocr ||
    raw.ocr_data ||
    raw.ocr_output ||
    null;

  const timestamp =
    raw.timestamp ||
    raw.created_at ||
    raw.createdAt ||
    metadata.timestamp ||
    null;

  const messages = collectMessages(raw.messages, raw.message, metadata.messages);
  const errors = collectMessages(raw.errors, raw.error, raw.detail, metadata.errors);

  return {
    success: raw.success !== false,
    data: {
      medicineName: sanitizeString(medicineName),
      inputType: sanitizeString(inputType),
      riskLevel: sanitizeString(riskLevel),
      predictions: predictionsData,
      analysis: analysis || '',
      messages,
      errors,
      ocr: ocrPayload,
      timestamp,
      raw
    }
  };
}

// runtime selection for the model service (prefer local when developing)
let modelBaseURLPromise = (async () => {
  if (LOCAL_MODEL) {
    const localAvailable = await probeModel(LOCAL_MODEL).catch(() => false);
    if (localAvailable) {
      console.info('Using local model service:', LOCAL_MODEL);
      return LOCAL_MODEL;
    }
  }

  const remoteCandidates = [];
  const configuredRemote = MODEL_API_URL ? MODEL_API_URL.replace(/\/$/, '') : null;
  const defaultRemote = DEFAULT_REMOTE_MODEL.replace(/\/$/, '');

  if (configuredRemote) {
    remoteCandidates.push(configuredRemote);
  }
  if (!remoteCandidates.includes(defaultRemote)) {
    remoteCandidates.push(defaultRemote);
  }

  for (const candidate of remoteCandidates) {
    const available = await probeModel(candidate).catch(() => false);
    if (available) {
      console.info('Using remote model service:', candidate);
      return candidate;
    }
  }

  const fallback = remoteCandidates[0] || defaultRemote;
  console.warn('No model endpoints responded to health checks. Proceeding with fallback URL:', fallback);
  return fallback;
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

