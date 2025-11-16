import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Upload, Loader } from 'lucide-react';
import Input from '../../components/FormFields/Input';
import { medicinesAPI, disposalsAPI } from '../../services/api';
import SearchBar from '../../components/SearchBar';

export default function AddDisposal() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    generic_name: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const [showDetails, setShowDetails] = useState(false);

  const clampConfidence = (value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return null;
    if (value > 1 && value <= 100) return Math.min(value / 100, 1);
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  };

  const formatPercent = (value) => {
    const clamped = clampConfidence(value);
    if (typeof clamped !== 'number' || Number.isNaN(clamped)) return null;
    return `${Math.round(clamped * 100)}%`;
  };

  const renderConfidenceList = (items, emptyFallback) => {
    if (!Array.isArray(items) || items.length === 0) {
      return emptyFallback ? <p className="text-gray-600 dark:text-gray-400">{emptyFallback}</p> : null;
    }

    return (
      <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
        {items
          .map((item, index) => {
            if (!item) return null;
            const label = item.label || item.value;
            if (!label) return null;
            const confidence = typeof item.confidence === 'number' ? clampConfidence(item.confidence) : null;
            return {
              label,
              confidence,
              key: item.id || `${label}-${index}`
            };
          })
          .filter(Boolean)
          .map((entry) => (
            <li key={entry.key} className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm md:text-base break-words">{entry.label}</span>
              {typeof entry.confidence === 'number' && (
              <span className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  {formatPercent(entry.confidence)}
              </span>
            )}
          </li>
          ))}
      </ul>
    );
  };

  const renderAnalysisContent = (analysisText) => {
    if (!analysisText) return null;

    return analysisText
      .split('\n')
      .map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={`break-${index}`} className="h-2" />;
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h4 key={`heading-${index}`} className="font-semibold text-gray-800 dark:text-gray-200 mt-3">
              {trimmed.replace(/^##\s*/, '')}
            </h4>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h3 key={`heading-main-${index}`} className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-4">
              {trimmed.replace(/^#\s*/, '')}
            </h3>
          );
        }
        const bolded = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return (
          <p
            key={`paragraph-${index}`}
            className="text-sm md:text-base text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: bolded.replace(/\n/g, '<br />') }}
          />
        );
      });
  };

  const renderInfoGrid = (items) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    return (
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items
          .filter((item) => item?.value)
          .map((item) => (
            <div key={item.label} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
              <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.label}</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{item.value}</dd>
              {item.helper && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.helper}</p>
              )}
            </div>
          ))}
      </dl>
    );
  };

  const toTitleCase = (value) => {
    if (!value) return '';
    return value
      .toString()
      .split(/[_\s]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const pickTopPrediction = (items) => {
    if (!Array.isArray(items) || items.length === 0) return null;
    let best = null;

    for (const item of items) {
      if (!item) continue;
      const value = item.value || item.label;
      if (!value) continue;
      const confidence = typeof item.confidence === 'number' ? clampConfidence(item.confidence) : null;

      if (!best) {
        best = { value, confidence };
        continue;
      }

      const bestConfidence = typeof best.confidence === 'number' ? best.confidence : -1;
      const candidateConfidence = typeof confidence === 'number' ? confidence : -1;

      if (candidateConfidence > bestConfidence) {
        best = { value, confidence };
      }
    }

    return best;
  };

  const buildOcrSummaryItems = (rawOcr) => {
    if (!rawOcr) return [];

    if (Array.isArray(rawOcr)) {
      return rawOcr
        .map((entry, index) => {
          if (!entry) return null;
          if (typeof entry === 'string') {
            const trimmed = entry.trim();
            return trimmed ? { label: `Line ${index + 1}`, value: trimmed } : null;
          }
          if (typeof entry === 'object') {
            const label = entry.label || entry.field || `Line ${index + 1}`;
            const value = entry.text || entry.value || entry.content;
            if (!value) return null;
            if (Array.isArray(value)) {
              const joined = value.map((item) => (item ? item.toString().trim() : '')).filter(Boolean).join(', ');
              return joined ? { label, value: joined } : null;
            }
            const normalized = value.toString().trim();
            return normalized ? { label, value: normalized } : null;
          }
          return null;
        })
        .filter(Boolean);
    }

    if (typeof rawOcr === 'object') {
      const labelMap = {
        medicine_name: 'Medicine Name',
        medicine: 'Medicine',
        medicine_generic_name: 'Medicine Name',
        generic_name: 'Generic Name',
        brand_name: 'Brand Name',
        dosage: 'Dosage',
        dosage_form: 'Dosage Form',
        strength: 'Strength',
        expiry_date: 'Expiry Date',
        expiry: 'Expiry',
        batch_number: 'Batch Number',
        lot_number: 'Lot Number',
        manufacturer: 'Manufacturer',
        country_of_manufacture: 'Country of Manufacture',
        storage_conditions: 'Storage Conditions',
        instructions: 'Instructions',
        warnings: 'Warnings'
      };

      const taken = new Set();
      const entries = [];

      for (const [rawKey, label] of Object.entries(labelMap)) {
        if (!(rawKey in rawOcr)) continue;
        const rawValue = rawOcr[rawKey];
        if (rawValue === undefined || rawValue === null) continue;
        const value = Array.isArray(rawValue)
          ? rawValue
              .map((item) => (item ? item.toString().trim() : ''))
              .filter(Boolean)
              .join(', ')
          : rawValue.toString().trim();
        if (!value) continue;
        entries.push({ label, value });
        taken.add(rawKey);
      }

      for (const [key, rawValue] of Object.entries(rawOcr)) {
        if (taken.has(key)) continue;
        if (rawValue === undefined || rawValue === null) continue;
        const value = Array.isArray(rawValue)
          ? rawValue
              .map((item) => (item ? item.toString().trim() : ''))
              .filter(Boolean)
              .join(', ')
          : rawValue.toString().trim();
        if (!value) continue;
        entries.push({ label: toTitleCase(key), value });
      }

      return entries;
    }

    if (typeof rawOcr === 'string') {
      const trimmed = rawOcr.trim();
      return trimmed ? [{ label: 'OCR Text', value: trimmed }] : [];
    }

    return [];
  };

  const buildJoinedText = (value) => {
    if (!value) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || null;
    }
    if (Array.isArray(value)) {
      const parts = value
        .map((entry) => {
          if (!entry) return '';
          if (typeof entry === 'string') return entry.trim();
          if (typeof entry === 'object' && entry.text) return entry.text.toString().trim();
          return '';
        })
        .filter(Boolean);
      return parts.length ? parts.join('\n') : null;
    }
    if (typeof value === 'object') {
      return null;
    }
    return value.toString().trim() || null;
  };

  const formatCategoryLabel = (value) => {
    if (!value) return 'Not classified yet';
    const stringValue = value.toString().trim();
    if (!stringValue) return 'Not classified yet';
    const primary = stringValue.split('•')[0].split('|')[0].trim();
    if (/^category\s*\d+$/i.test(primary)) {
      return primary.replace(/category/i, 'Category ');
    }
    if (/^\d+$/.test(primary)) {
      return `Category ${primary}`;
    }
    const normalized = primary.replace(/_/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const formatRiskLevel = (value) => {
    if (!value) return 'UNKNOWN';
    return value.toString().replace(/_/g, ' ').toUpperCase();
  };

  const getRiskBadgeClass = (value) => {
    const upper = value ? value.toString().toUpperCase() : '';
    if (upper === 'HIGH') return 'badge-danger';
    if (upper === 'MEDIUM') return 'badge-warning';
    if (upper === 'LOW') return 'badge-success';
    return 'badge-secondary';
  };

  const normalizeRiskLevelForPayload = (value) => {
    if (!value) return null;
    const normalized = value.toString().trim().toUpperCase();
    if (normalized.includes('HIGH')) return 'HIGH';
    if (normalized.includes('MEDIUM')) return 'MEDIUM';
    if (normalized.includes('LOW')) return 'LOW';
    return null;
  };

  const modelPredictions = prediction?.predictions || {};
  const normalizedCategory =
    modelPredictions && typeof modelPredictions.disposal_category === 'object'
      ? modelPredictions.disposal_category
      : modelPredictions.disposal_category
      ? { value: modelPredictions.disposal_category }
      : null;

  const disposalCategoryValue = normalizedCategory?.value ?? null;
  const disposalMethods = Array.isArray(modelPredictions.method_of_disposal)
    ? modelPredictions.method_of_disposal
    : [];
  const dosageFormPredictions = Array.isArray(modelPredictions.dosage_form)
    ? modelPredictions.dosage_form
    : [];
  const manufacturerPredictions = Array.isArray(modelPredictions.manufacturer)
    ? modelPredictions.manufacturer
    : [];
  const handlingMethod = typeof modelPredictions.handling_method === 'string'
    ? modelPredictions.handling_method.trim()
    : '';
  const disposalRemarks = modelPredictions.disposal_remarks || '';
  const similarGenericName = modelPredictions.similar_generic_name || '';
  const similarityDistance =
    typeof modelPredictions.similarity_distance === 'number'
      ? modelPredictions.similarity_distance
      : null;
  const inputGenericName = modelPredictions.input_generic_name || '';

  const categoryConfidence =
    typeof normalizedCategory?.confidence === 'number'
      ? clampConfidence(normalizedCategory.confidence)
      : null;
  const topDisposalMethodPrediction = pickTopPrediction(disposalMethods);
  const primaryDisposalMethod = topDisposalMethodPrediction?.value
    ? topDisposalMethodPrediction.value.trim()
    : null;
  const methodConfidence = typeof topDisposalMethodPrediction?.confidence === 'number'
    ? topDisposalMethodPrediction.confidence
    : null;
  const confidenceValue = categoryConfidence ?? methodConfidence ?? 0;

  const predictionHasErrors = Array.isArray(prediction?.errors) && prediction.errors.length > 0;
  const primaryGuidance = primaryDisposalMethod || handlingMethod || '';
  const riskLevelValue = prediction ? modelPredictions?.risk_level || prediction.riskLevel : null;
  const friendlyRiskLabel = formatRiskLevel(riskLevelValue);
  const riskBadgeClass = getRiskBadgeClass(riskLevelValue);
  const friendlyCategoryLabel = formatCategoryLabel(disposalCategoryValue);
  const identifiedMedicine =
    prediction?.medicineName || inputGenericName || formData.generic_name || 'your medicine';
  const predictedBrandName =
    prediction?.raw?.medicine_info?.brand_name || prediction?.brandName || null;
  const pickupDisplayName = predictedBrandName
    ? `${identifiedMedicine} (${predictedBrandName})`
    : identifiedMedicine;
  const confidenceText = formatPercent(confidenceValue) || '—';
  const rawInputType = prediction?.inputType || (imageFile ? 'image' : 'text');
  const normalizedInputType = typeof rawInputType === 'string' ? rawInputType.toLowerCase() : 'text';
  const inputBadgeLabel = typeof rawInputType === 'string'
    ? rawInputType.replace(/[_\s-]+/g, ' ').toUpperCase()
    : 'TEXT';
  const isImagePrediction = normalizedInputType.includes('image');

  const topDosageFormPrediction = pickTopPrediction(dosageFormPredictions);
  const primaryDosageForm = topDosageFormPrediction?.value || null;
  const topManufacturerPrediction = pickTopPrediction(manufacturerPredictions);
  const primaryManufacturerRaw = topManufacturerPrediction?.value || null;
  const primaryManufacturer =
    primaryManufacturerRaw && !/^(other|unknown)$/i.test(primaryManufacturerRaw.trim())
      ? primaryManufacturerRaw
      : null;

  const quickSummaryItems = [
    {
      label: 'Identified Medicine',
      value: pickupDisplayName
    },
    {
      label: 'Disposal Category',
      value: friendlyCategoryLabel
    },
    primaryDosageForm
      ? {
          label: 'Likely Dosage Form',
          value: primaryDosageForm
        }
      : null,
    primaryManufacturer
      ? {
          label: 'Likely Manufacturer',
          value: primaryManufacturer
        }
      : null,
    {
      label: 'Primary Disposal Method',
      value: primaryGuidance || 'Not available yet'
    },
    friendlyRiskLabel !== 'UNKNOWN'
      ? {
          label: 'Risk Level',
          value: friendlyRiskLabel
        }
      : null,
    {
      label: 'Model Confidence',
      value: confidenceText,
      helper: categoryConfidence
        ? 'Based on category classification'
        : methodConfidence
        ? 'Based on disposal method confidence'
        : null
    },
    {
      label: 'Similar Match',
      value: similarGenericName || 'None suggested'
    }
  ].filter(Boolean);

  const buildSummarySections = () => {
    const sections = [];
    const ensureSentence = (text) => {
      const trimmed = text ? text.trim().replace(/\s+/g, ' ') : '';
      if (!trimmed) return null;
      return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
    };

    const pushSection = (label, sentences = []) => {
      const body = sentences
        .map(ensureSentence)
        .filter(Boolean)
        .join(' ');
      if (body) {
        sections.push({ label, body });
      }
    };

    if (identifiedMedicine) {
      const fragments = [];
      let overview = `The model identified ${identifiedMedicine}`;
      if (primaryDosageForm) {
        overview += ` as ${primaryDosageForm}`;
      }
      if (primaryManufacturer) {
        overview += ` from ${primaryManufacturer}`;
      }
      fragments.push(overview);
      pushSection('What We Found', fragments);
    }

    if (friendlyCategoryLabel && friendlyCategoryLabel !== 'Not classified yet') {
      const fragments = [`Classified under ${friendlyCategoryLabel}.`];
      if (friendlyRiskLabel && friendlyRiskLabel !== 'UNKNOWN') {
        fragments.push(`Risk level: ${friendlyRiskLabel}.`);
      }
      if (confidenceText !== '—') {
        fragments.push(`Model confidence: ${confidenceText}.`);
      }
      pushSection('Why It Matters', fragments);
    }

    if (primaryDisposalMethod || primaryGuidance) {
      const fragments = [];
      if (primaryDisposalMethod) {
        fragments.push(`Dispose of it using ${primaryDisposalMethod}.`);
      } else if (primaryGuidance) {
        fragments.push(primaryGuidance);
      }
      pushSection('How To Dispose', fragments);
    }

    if (handlingMethod && handlingMethod !== primaryDisposalMethod) {
      pushSection('Handle With Care', [`Before disposal: ${handlingMethod}`]);
    }

    if (disposalRemarks) {
      pushSection('Remember', [disposalRemarks]);
    }

    return sections;
  };

  const summarySections = buildSummarySections();

  const summaryCallToAction = (() => {
    if (!prediction) return null;
    if (friendlyRiskLabel === 'HIGH') {
      return 'High-risk medicine: connect with a community health worker if you need supervised disposal.';
    }
    if (friendlyRiskLabel === 'MEDIUM') {
      return 'Prefer help carrying this out? Save the guidance or tap "Request CHW Pickup".';
    }
    return 'Ready to act? Save this guidance for your records or request a CHW pickup if you want assistance.';
  })();

  const hasOcrContent = (value) => {
    if (!value) return false;
    if (typeof value === 'string') return Boolean(value.trim());
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return false;
  };

  const rawOcrSourceCandidates = [
    prediction?.raw?.ocr_summary,
    prediction?.raw?.ocr_summary_items,
    prediction?.raw?.ocr?.summary,
    prediction?.raw?.ocr?.items,
    prediction?.raw?.ocr_results,
    prediction?.raw?.ocr_data,
    prediction?.raw?.ocr_output,
    prediction?.raw?.ocr_text,
    prediction?.raw?.ocr
  ];

  const rawOcrSource = rawOcrSourceCandidates.find(hasOcrContent) || null;

  const ocrSummaryItems = buildOcrSummaryItems(rawOcrSource);
  const ocrLinesJoined = buildJoinedText(prediction?.raw?.ocr_lines);
  const ocrFullText = (() => {
    const candidates = [
      prediction?.raw?.ocr_full_text,
      prediction?.raw?.ocr_text_full,
      prediction?.raw?.ocr_raw_text,
      prediction?.raw?.ocr?.full_text,
      prediction?.raw?.ocr?.raw_text,
      buildJoinedText(rawOcrSource),
      ocrLinesJoined
    ];

    for (const candidate of candidates) {
      const stringValue = buildJoinedText(candidate);
      if (stringValue) return stringValue;
    }
    return null;
  })();

  const buildDisposalPayload = () => {
    if (!prediction) return null;
    const normalizedInputType = prediction.inputType || (imageFile ? 'image' : 'text');
    const rawMeta = prediction.raw || null;
    const modelVersion = rawMeta?.model_version || rawMeta?.version || null;
    const metadata = rawMeta || null;
    const predictedCategoryValue = disposalCategoryValue || null;
    const predictedCategoryConfidence = categoryConfidence ?? null;
    const predictedGenericName =
      prediction.medicineName || inputGenericName || formData.generic_name || null;
    const predictedBrandName = rawMeta?.medicine_info?.brand_name || null;
    const predictedDosageForm =
      rawMeta?.medicine_info?.dosage_form || dosageFormPredictions[0]?.value || null;
    const predictedPackagingType = rawMeta?.medicine_info?.packaging_type || null;
    const storageRiskLevel = normalizeRiskLevelForPayload(riskLevelValue);

    return {
      genericName: predictedGenericName,
      brandName: predictedBrandName,
      dosageForm: predictedDosageForm,
      packagingType: predictedPackagingType,
      medicineName: prediction.medicineName || inputGenericName || null,
      inputGenericName: inputGenericName || null,
      predictedCategory: predictedCategoryValue,
      predictedCategoryConfidence,
      confidence: typeof confidenceValue === 'number' ? confidenceValue : null,
      riskLevel: storageRiskLevel || 'LOW',
      disposalGuidance: primaryGuidance || null,
      handlingMethod: handlingMethod || null,
      disposalRemarks: disposalRemarks || null,
      categoryCode: predictedCategoryValue,
      categoryLabel: null,
      similarGenericName: similarGenericName || null,
      similarityDistance: similarityDistance ?? null,
      predictionInputType: normalizedInputType,
      predictionSource: rawMeta?.requested_url || rawMeta?.endpoint || rawMeta?.source || null,
      modelVersion,
      analysis: prediction.analysis || null,
      disposalMethods: disposalMethods.length ? disposalMethods : null,
      dosageForms: dosageFormPredictions.length ? dosageFormPredictions : null,
      manufacturers: manufacturerPredictions.length ? manufacturerPredictions : null,
      messages: prediction.messages?.length ? prediction.messages : null,
      errors: prediction.errors?.length ? prediction.errors : null,
      predictionDetails: Object.keys(modelPredictions).length ? modelPredictions : null,
      metadata
    };
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'generic_name' && value.length >= 2) {
      try {
        const results = await medicinesAPI.search(value);
        if (results.success) {
          setSuggestions(results.data);
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    } else if (name === 'generic_name') {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (medicine) => {
    setFormData({
      generic_name: medicine.genericName,
    });
    setSuggestions([]);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePredictFromText = async (e) => {
    e.preventDefault();

    if (!formData.generic_name) {
      alert('Please enter at least the generic medicine name.');
      return;
    }

    setLoading(true);
    setServerError(null);
    try {
      const result = await medicinesAPI.predictFromText({
        genericName: formData.generic_name,
      });

      if (result && result.success) {
        setPrediction(result.data);
        setShowDetails(false);
        const predictedGeneric =
          result.data?.medicineName ||
          result.data?.predictions?.input_generic_name ||
          formData.generic_name;

        if (predictedGeneric) {
          setFormData({ generic_name: predictedGeneric });
        }
        setSuggestions([]);
      } else {
        // handle server-side failure shape
        const msg = result?.error?.message || result?.error || 'Prediction failed. Please try again.';
        setServerError(msg);
        setPrediction(null);
        setShowDetails(false);
      }
    } catch (error) {
      console.error('Prediction error:', error);
      setServerError(error?.message || 'Failed to predict. Please try again.');
    } finally {
      setLoading(false);
    }
  };

 const handlePredictFromImage = async () => {
  if (!imageFile) {
    alert('Please upload an image first.');
    return;
  }

  setLoading(true);
  setServerError(null);
  try {
    const result = await medicinesAPI.predictFromImage(imageFile);

    if (result.success) {
      const predictedGeneric =
        result.data?.medicineName ||
        result.data?.predictions?.input_generic_name ||
        '';

      setFormData({
        generic_name: predictedGeneric,
      });
      setPrediction(result.data);
      setShowDetails(false);
    } else {
      const msg = result?.error?.message || result?.error || 'Image prediction failed. Please try again.';
      setServerError(msg);
      setPrediction(null);
      setShowDetails(false);
    }
  } catch (error) {
    console.error('Image prediction error:', error);
    setServerError(error?.message || 'Failed to process image. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const handleSaveDisposal = async () => {
    if (!prediction) {
      alert('Please predict the medicine classification first.');
      return;
    }

    const disposal = buildDisposalPayload();

    if (!disposal) {
      alert('Unable to prepare disposal payload. Please try again.');
      return;
    }

    disposal.reason = 'user_initiated';

    try {
      setLoading(true);

      // If an image was used for prediction and is available, send it as multipart/form-data
      if (imageFile) {
        const payload = {
          ...disposal,
          file: imageFile
        };

        const result = await disposalsAPI.create(payload);

        if (result && result.success) {
          alert('Disposal saved successfully!');
          navigate('/user/history');
        } else {
          const msg = result?.error?.message || result?.error || 'Failed to save disposal.';
          setServerError(msg);
        }
      } else {
  const result = await disposalsAPI.create(disposal);

        if (result && result.success) {
          alert('Disposal saved successfully!');
          navigate('/user/history');
        } else {
          const msg = result?.error?.message || result?.error || 'Failed to save disposal.';
          setServerError(msg);
        }
      }
    } catch (error) {
      console.error('Error saving disposal:', error);
      setServerError(error?.message || 'Failed to save disposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPickup = () => {
    if (!prediction) {
      alert('Please predict the medicine classification first.');
      return;
    }

    // Create the disposal first so we can pass disposalId to the pickup flow
    (async () => {
      setLoading(true);
      setServerError(null);
      const disposal = buildDisposalPayload();

      if (!disposal) {
        alert('Unable to prepare disposal payload. Please try again.');
        return;
      }

      disposal.reason = 'user_initiated';

      try {
        let result;
        if (imageFile) {
          const payload = { ...disposal, file: imageFile };
          result = await disposalsAPI.create(payload);
        } else {
          result = await disposalsAPI.create(disposal);
        }

        if (result && result.success) {
          const createdId = result.data?.id || result.data?.data?.id || result?.data?.id || null;

          navigate('/user/chw-interaction', {
            state: {
              medicineName: pickupDisplayName,
              disposalGuidance: primaryGuidance,
              disposalCategory: disposalCategoryValue,
              predictionInputType: prediction?.inputType || (imageFile ? 'image' : 'text'),
              hasWarnings: predictionHasErrors,
              disposalId: createdId
            }
          });
        } else {
          const msg = result?.error?.message || result?.error || 'Failed to save disposal before pickup request.';
          setServerError(msg);
        }
      } catch (err) {
        console.error('Error creating disposal before pickup request:', err);
        const msg = err?.response?.data?.message || err?.message || 'Failed to save disposal. Please try again.';
        setServerError(msg);
      } finally {
        setLoading(false);
      }
    })();
  };

  const handlePageSearch = async (q) => {
    try {
      const res = await medicinesAPI.search(q);
      if (res.success) setSuggestions(res.data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-5xl mx-auto">
      <div className="mb-6">
        {/* page-specific search */}
        <SearchBar onSearch={handlePageSearch} placeholder="Search medicines for this form..." />
      </div>

      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        Add New Disposal
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Provide a medicine name to generate tailored disposal guidance
      </p>

      {serverError && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg">
          {serverError}
        </div>
      )}

      {/* Make the upload card and manual form parallel on md+ screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Option 1: Upload Image</h2>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            {imagePreview ? (
              <div className="mb-4">
                <img
                  src={imagePreview}
                  alt="Medicine preview"
                  className="max-h-44 w-auto mx-auto rounded-lg object-contain"
                />
              </div>
            ) : (
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            )}
            <label className="btn-outline cursor-pointer inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              {imagePreview ? 'Change Image' : 'Upload Image'}
            </label>
            {imageFile && (
              <button
                onClick={handlePredictFromImage}
                disabled={loading}
                className="btn-primary ml-4"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin inline" />
                ) : (
                  'Scan Image'
                )}
              </button>
            )}
            {prediction && prediction.inputType === 'image' && (
              <p
                className={`mt-4 text-sm ${
                  predictionHasErrors ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'
                }`}
              >
                {predictionHasErrors
                  ? 'Image prediction returned warnings. Review below.'
                  : 'Image prediction ready. Review the model output below.'}
              </p>
            )}
          </div>
        </div>

        {/* Manual entry form - simplified to a single name field */}
        <form onSubmit={handlePredictFromText} className="card">
          <h2 className="text-xl font-bold mb-4">Option 2: Type Medicine Name</h2>

          <div className="space-y-4">
            <div className="relative">
              <Input
                label="Medicine Name"
                id="generic_name"
                name="generic_name"
                value={formData.generic_name}
                onChange={handleInputChange}
                placeholder="e.g., Paracetamol"
                required
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {suggestions.map((med) => (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => handleSuggestionClick(med)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="font-medium">{med.genericName}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {med.brandName}
                        {med.dosageForm ? ` • ${med.dosageForm}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin inline mr-2" />
                  Analyzing...
                </>
              ) : (
                'Get Disposal Guidance'
              )}
            </button>
            {prediction && prediction.inputType === 'text' && (
              <p
                className={`mt-3 text-center text-sm ${
                  predictionHasErrors ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'
                }`}
              >
                {predictionHasErrors
                  ? 'Text prediction returned warnings. Review below.'
                  : 'Text prediction ready. Review the model output below.'}
              </p>
            )}
          </div>
        </form>
      </div>

      {/* Output card placed below the parallel inputs */}
      {prediction && (
        <div className="card mt-6 border border-primary-blue dark:border-accent-cta">
          <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                {predictionHasErrors ? (
                  <AlertTriangle className="w-8 h-8 text-warning flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-primary-green flex-shrink-0" />
                )}
                <div>
                  <h3 className="text-xl font-bold mb-1">Disposal Guidance Preview</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">
                    {`Model identified ${identifiedMedicine} and prepared guidance for you.`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start">
                {friendlyRiskLabel !== 'UNKNOWN' && (
                  <span className={`badge ${riskBadgeClass}`}>{friendlyRiskLabel}</span>
                )}
                <span className="badge badge-secondary">{inputBadgeLabel}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wide">Category</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">{friendlyCategoryLabel}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wide">Confidence</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">{confidenceText}</p>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400 tracking-wide">Warnings</p>
                <p
                  className={`text-sm font-semibold mt-1 ${predictionHasErrors ? 'text-red-600 dark:text-red-300' : 'text-green-600 dark:text-green-300'}`}
                >
                  {predictionHasErrors ? 'Review warnings' : 'None detected'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Summary</h4>
              {summarySections.length ? (
                <div className="space-y-4">
                  {summarySections.map((section) => (
                    <div key={section.label}>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{section.label}</p>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{section.body}</p>
                    </div>
                  ))}
                  {summaryCallToAction && (
                    <p className="text-sm font-semibold text-primary-blue dark:text-accent-cta">
                      {summaryCallToAction}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300">Disposal summary is not available yet.</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">Quick Summary</h4>
              {renderInfoGrid(quickSummaryItems)}
            </div>

            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="btn-outline w-full md:w-auto"
            >
              {showDetails ? 'Hide detailed model output' : 'Show detailed model output'}
            </button>

            {showDetails && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-bold mb-3">Classification Insights</h4>
                  {renderInfoGrid([
                    {
                      label: 'Category',
                      value: friendlyCategoryLabel
                    },
                    friendlyRiskLabel !== 'UNKNOWN'
                      ? {
                          label: 'Risk Level',
                          value: friendlyRiskLabel
                        }
                      : null,
                    {
                      label: 'Confidence Score',
                      value: confidenceText,
                      helper: confidenceText !== '—' ? 'Higher confidence means more reliable guidance' : null
                    },
                    {
                      label: 'Similarity Distance',
                      value: similarityDistance !== null ? similarityDistance.toFixed(3) : null,
                      helper: similarityDistance !== null ? 'Lower distance means a closer match' : null
                    },
                    {
                      label: 'Input Type',
                      value: inputBadgeLabel
                    },
                    {
                      label: 'Predicted Generic Name',
                      value: prediction.medicineName || inputGenericName || null
                    }
                  ])}
                  {disposalRemarks && (
                    <p className="mt-3 text-sm md:text-base text-gray-700 dark:text-gray-300">{disposalRemarks}</p>
                  )}
                </div>

                {isImagePrediction && (ocrSummaryItems.length > 0 || ocrFullText) && (
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold mb-3">OCR Summary</h4>
                    {renderInfoGrid(ocrSummaryItems)}
                    {ocrFullText && (
                      <pre className="mt-3 text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
{ocrFullText}
                      </pre>
                    )}
                  </div>
                )}

                {(disposalMethods.length || dosageFormPredictions.length || manufacturerPredictions.length) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {disposalMethods.length > 0 && (
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h4 className="font-bold mb-2">Recommended Disposal Methods</h4>
                        {renderConfidenceList(disposalMethods, 'No disposal methods available.')}
                      </div>
                    )}
                    {dosageFormPredictions.length > 0 && (
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h4 className="font-bold mb-2">Likely Dosage Forms</h4>
                        {renderConfidenceList(dosageFormPredictions, 'No dosage form predictions returned.')}
                      </div>
                    )}
                    {manufacturerPredictions.length > 0 && (
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <h4 className="font-bold mb-2">Possible Manufacturers</h4>
                        {renderConfidenceList(manufacturerPredictions, 'No manufacturer predictions returned.')}
                      </div>
                    )}
                  </div>
                )}

                {prediction.analysis && (
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold mb-2">Detailed Analysis</h4>
                    <div className="space-y-2">
                      {renderAnalysisContent(prediction.analysis)}
                    </div>
                  </div>
                )}

                {prediction.messages && prediction.messages.length > 0 && (
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold mb-2">Model Messages</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {prediction.messages.map((message, idx) => (
                        <li key={`message-${idx}`}>{message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {predictionHasErrors && (
                  <div className="bg-red-50 dark:bg-red-900/40 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <h4 className="font-bold mb-2 text-red-700 dark:text-red-200">Model Warnings</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-red-700 dark:text-red-200">
                      {prediction.errors.map((err, idx) => (
                        <li key={`error-${idx}`}>{typeof err === 'string' ? err : JSON.stringify(err)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {prediction?.predictionDetails && (
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-bold mb-2">Technical Metadata</h4>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto text-gray-700 dark:text-gray-200">
{JSON.stringify(prediction.predictionDetails, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 flex-nowrap pt-2">
              <button
                type="button"
                onClick={handleSaveDisposal}
                className="btn-secondary flex-1 min-w-0"
                disabled={loading}
              >
                Save Disposal
              </button>
              <button
                type="button"
                onClick={handleRequestPickup}
                className={`btn-primary flex-1 min-w-0 ${!prediction ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!prediction || loading}
                title={!prediction ? 'Analyze to enable pickup request' : 'Request CHW pickup'}
              >
                Request CHW Pickup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
