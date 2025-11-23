import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Upload, Loader } from 'lucide-react';
import Input from '../../components/FormFields/Input';
import Modal from '../../components/Modal';
import { medicinesAPI, disposalsAPI } from '../../services/api';

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
  const [overlayOpen, setOverlayOpen] = useState(false);

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

  const extractConfidence = (entry) => {
    if (!entry || typeof entry !== 'object') return null;
    const candidateKeys = ['confidence', 'confidence_score', 'score', 'probability'];

    for (const key of candidateKeys) {
      const raw = entry[key];
      if (typeof raw === 'number' && !Number.isNaN(raw)) {
        return clampConfidence(raw);
      }
      if (typeof raw === 'string') {
        const parsed = Number.parseFloat(raw);
        if (!Number.isNaN(parsed)) {
          return clampConfidence(parsed);
        }
      }
    }

    return null;
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
            const confidence = extractConfidence(item);
            return {
              label,
              confidence,
              key: item.id || `${label}-${index}`
            };
          })
          .filter(Boolean)
          .sort((a, b) => {
            const aConf = typeof a.confidence === 'number' ? a.confidence : -1;
            const bConf = typeof b.confidence === 'number' ? b.confidence : -1;
            if (bConf !== aConf) return bConf - aConf;
            return a.label.localeCompare(b.label);
          })
          .map((entry) => (
            <li key={entry.key} className="flex items-center justify-between gap-2">
              <span className="font-medium text-base md:text-lg break-words">{entry.label}</span>
              {typeof entry.confidence === 'number' && (
                <span className="text-sm md:text-base text-gray-500 dark:text-gray-400">
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
              <dd className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100 break-words">{item.value}</dd>
              {item.helper && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.helper}</p>
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

  const sortPredictionsByConfidence = (items) => {
    if (!Array.isArray(items) || items.length === 0) return [];

    return items
      .map((item, index) => {
        if (!item) return null;
        const rawValue = item.value ?? item.label;
        if (rawValue === undefined || rawValue === null) return null;
        const normalizedValue = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
        if (!normalizedValue) return null;
        const confidence = extractConfidence(item);
        const label = item.label ?? normalizedValue;

        return {
          ...item,
          value: normalizedValue,
          label,
          confidence,
          id: item.id ?? `${normalizedValue}-${index}`
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aConf = typeof a.confidence === 'number' ? a.confidence : -1;
        const bConf = typeof b.confidence === 'number' ? b.confidence : -1;
        if (bConf !== aConf) return bConf - aConf;
        const aLabel = (a.label ?? a.value ?? '').toString().toLowerCase();
        const bLabel = (b.label ?? b.value ?? '').toString().toLowerCase();
        return aLabel.localeCompare(bLabel);
      });
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

  const extractAnalysisSection = (analysisText, headingLabel) => {
    if (!analysisText || !headingLabel) return '';
    const targetHeading = `## ${headingLabel.trim()}`.toLowerCase();
    const lines = analysisText.split('\n');
    let capture = false;
    const captured = [];

    for (const rawLine of lines) {
      const normalized = rawLine.trim();
      const lower = normalized.toLowerCase();

      if (!capture && lower === targetHeading) {
        capture = true;
        continue;
      }

      if (capture && lower.startsWith('## ') && lower !== targetHeading) {
        break;
      }

      if (capture && normalized) {
        captured.push(normalized);
      }
    }

    return captured.length ? captured.join(' ') : '';
  };

  const isGenericHandlingFallback = (text) => {
    if (!text) return false;
    return /liquid vitamins|readily biodegradable|harmless solutions of salts/i.test(text);
  };

  const isGenericDisposalRemark = (text) => {
    if (!text) return false;
    return /antineoplastics not to be sent to sewer/i.test(text);
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

  const categoryHandlingInstruction = typeof normalizedCategory?.handling_method === 'string'
    ? normalizedCategory.handling_method.trim()
    : '';
  const categoryRemarks = (() => {
    if (!normalizedCategory) return '';
    const candidate =
      normalizedCategory.remarks ??
      normalizedCategory.disposal_remarks ??
      normalizedCategory.remark ??
      null;
    return typeof candidate === 'string' ? candidate.trim() : '';
  })();
  const categoryRecommendedDisposal = typeof normalizedCategory?.recommended_disposal === 'string'
    ? normalizedCategory.recommended_disposal.trim()
    : '';

  const disposalCategoryValue = normalizedCategory?.value ?? null;
  const disposalMethods = sortPredictionsByConfidence(modelPredictions.method_of_disposal);
  const dosageFormPredictions = sortPredictionsByConfidence(modelPredictions.dosage_form);
  const manufacturerPredictions = sortPredictionsByConfidence(modelPredictions.manufacturer);
  const analysisHandlingMethod = extractAnalysisSection(prediction?.analysis, 'Handling Instructions');
  const handlingMethod = (() => {
    if (typeof modelPredictions.handling_method === 'string') {
      const trimmed = modelPredictions.handling_method.trim();
      if (trimmed) return trimmed;
    }
    if (analysisHandlingMethod) {
      return analysisHandlingMethod;
    }
    if (categoryHandlingInstruction && !isGenericHandlingFallback(categoryHandlingInstruction)) {
      return categoryHandlingInstruction;
    }
    return '';
  })();
  const summaryHandleWithCare = categoryHandlingInstruction || handlingMethod || '';
  const disposalRemarks = (() => {
    if (typeof modelPredictions.disposal_remarks === 'string') {
      const trimmed = modelPredictions.disposal_remarks.trim();
      if (trimmed) return trimmed;
    }
    return categoryRemarks;
  })();
  const sanitizedDisposalRemarks = isGenericDisposalRemark(disposalRemarks) ? '' : disposalRemarks;
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
  const topDisposalMethodPrediction = disposalMethods[0] || null;
  const primaryDisposalMethod = (() => {
    const best = topDisposalMethodPrediction?.value
      ? topDisposalMethodPrediction.value.toString().trim()
      : '';
    if (best) return best;
    if (categoryRecommendedDisposal) return categoryRecommendedDisposal;
    return null;
  })();
  const methodConfidence = typeof topDisposalMethodPrediction?.confidence === 'number'
    ? topDisposalMethodPrediction.confidence
    : null;
  const confidenceValue = categoryConfidence ?? methodConfidence ?? 0;

  const predictionHasErrors = Array.isArray(prediction?.errors) && prediction.errors.length > 0;
  const primaryGuidance = primaryDisposalMethod || summaryHandleWithCare || '';
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

  const topDosageFormPrediction = dosageFormPredictions[0] || null;
  const primaryDosageForm = topDosageFormPrediction?.value || null;
  const topManufacturerPrediction = manufacturerPredictions[0] || null;
  const primaryManufacturerRaw = topManufacturerPrediction?.value || null;
  const primaryManufacturer = primaryManufacturerRaw ? primaryManufacturerRaw.trim() : null;
  const normalizedConfidenceValue = clampConfidence(confidenceValue);
  const confidencePercent =
    typeof normalizedConfidenceValue === 'number'
      ? Math.round(normalizedConfidenceValue * 100)
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
      value: primaryDisposalMethod || categoryRecommendedDisposal || 'Not available yet',
      helper:
        categoryRecommendedDisposal && primaryDisposalMethod && primaryDisposalMethod !== categoryRecommendedDisposal
          ? `Category recommendation: ${categoryRecommendedDisposal}`
          : null
    },
    summaryHandleWithCare
      ? {
          label: 'Handle With Care',
          value: summaryHandleWithCare
        }
      : null,
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
    },
    sanitizedDisposalRemarks
      ? {
          label: 'Remember',
          value: sanitizedDisposalRemarks
        }
      : null
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

    if (friendlyCategoryLabel && friendlyCategoryLabel !== 'Not classified yet') {
      const fragments = [`Disposal category: ${friendlyCategoryLabel}.`];
      if (categoryConfidence) {
        fragments.push(`Category confidence: ${formatPercent(categoryConfidence)}.`);
      }
      pushSection('Disposal Category', fragments);
    }

    if (primaryDisposalMethod) {
      pushSection('How To Dispose', [`Dispose of it using ${primaryDisposalMethod}.`]);
    } else if (categoryRecommendedDisposal) {
      pushSection('How To Dispose', [`Recommended disposal: ${categoryRecommendedDisposal}.`]);
    }

    if (summaryHandleWithCare) {
      pushSection('Handle With Care', [summaryHandleWithCare]);
    }

    if (sanitizedDisposalRemarks) {
      pushSection('Remember', [sanitizedDisposalRemarks]);
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

  const summaryIntro = summarySections[0]?.body || null;

  const confidenceDisplay = confidenceText && confidenceText !== '—' ? confidenceText : 'Pending';

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
      dosageFormPredictions[0]?.value || rawMeta?.medicine_info?.dosage_form || null;
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
    setOverlayOpen(false);
    try {
      const result = await medicinesAPI.predictFromText({
        genericName: formData.generic_name,
      });

      if (result && result.success) {
        setPrediction(result.data);
        setShowDetails(false);
        setOverlayOpen(true);
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
        setOverlayOpen(false);
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
    setOverlayOpen(false);
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
        setOverlayOpen(true);
      } else {
        const msg = result?.error?.message || result?.error || 'Image prediction failed. Please try again.';
        setServerError(msg);
        setPrediction(null);
        setShowDetails(false);
        setOverlayOpen(false);
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
      setOverlayOpen(false);

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
        setOverlayOpen(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-blue/10 via-white to-primary-green/10 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="rounded-3xl bg-white/80 dark:bg-gray-900/80 border border-primary-blue/20 dark:border-primary-green/20 shadow-xl backdrop-blur">
          <div className="p-8 sm:p-10 space-y-4">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-blue dark:text-primary-green">
              <span className="block h-2 w-2 rounded-full bg-primary-blue dark:bg-primary-green" />
              Guided Disposal Workspace
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Add New Disposal
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              Upload a medicine photo or type its name to generate tailored disposal guidance. We will highlight the safest handling approach and help you act on the results immediately.
            </p>
          </div>
        </header>
        {serverError && (
          <div className="rounded-2xl border border-red-200/70 bg-red-50/80 dark:border-red-800 dark:bg-red-900/50 text-red-700 dark:text-red-200 px-6 py-4 shadow-lg">
            {serverError}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-primary-blue/20 dark:border-primary-green/20 bg-white/85 dark:bg-gray-900/80 shadow-xl backdrop-blur-sm p-6 sm:p-8 space-y-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Upload Medicine Image</h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Let the assistant read the label for you. We’ll capture the text and match it to known medicines automatically.
            </p>
            <div className="rounded-2xl border-2 border-dashed border-primary-blue/30 dark:border-primary-green/40 bg-white/60 dark:bg-gray-900/60 px-6 py-8 text-center space-y-4">
              {imagePreview ? (
                <div className="mx-auto max-w-xs overflow-hidden rounded-2xl border border-white/40 shadow-lg">
                  <img
                    src={imagePreview}
                    alt="Medicine preview"
                    className="h-52 w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-primary-blue/70 dark:text-primary-green/70">
                  <Upload className="h-12 w-12" />
                  <p className="text-base font-medium">Drop an image here or upload from your device</p>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-primary-blue/40 dark:border-primary-green/40 px-6 py-3 text-base font-semibold text-primary-blue dark:text-primary-green shadow-md hover:shadow-lg transition-transform duration-200 hover:-translate-y-0.5">
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
                    type="button"
                    onClick={handlePredictFromImage}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-blue text-white px-6 py-3 text-base font-semibold shadow-lg shadow-primary-blue/30 hover:shadow-primary-blue/50 transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      'Scan Image'
                    )}
                  </button>
                )}
              </div>
              {prediction && prediction.inputType === 'image' && (
                <p
                  className={`text-xs font-medium ${
                    predictionHasErrors ? 'text-red-600 dark:text-red-300' : 'text-primary-blue dark:text-primary-green'
                  }`}
                >
                  {predictionHasErrors
                    ? 'Image prediction returned warnings. Review the guidance card.'
                    : 'Image prediction ready. View the disposal guidance.'}
                </p>
              )}
            </div>
          </div>

          <form
            onSubmit={handlePredictFromText}
            className="rounded-3xl border border-primary-blue/20 dark:border-primary-green/20 bg-white/85 dark:bg-gray-900/80 shadow-xl backdrop-blur-sm p-6 sm:p-8 space-y-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl"
          >
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Type Medicine Name</h2>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Prefer to type it in? Start with the generic name and we’ll autocomplete the rest.
            </p>
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
                  <div className="absolute z-20 w-full rounded-2xl border border-primary-blue/30 dark:border-primary-green/30 bg-white/95 dark:bg-gray-900/95 shadow-2xl mt-2 max-h-52 overflow-y-auto">
                    {suggestions.map((med) => (
                      <button
                        key={med.id}
                        type="button"
                        onClick={() => handleSuggestionClick(med)}
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-primary-blue/10 dark:hover:bg-primary-green/10"
                      >
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{med.genericName}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {med.brandName}
                          {med.dosageForm ? ` • ${med.dosageForm}` : ''}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-blue text-white px-6 py-3 text-base font-semibold shadow-lg shadow-primary-blue/30 hover:shadow-primary-blue/50 transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                'Get Disposal Guidance'
              )}
            </button>
            {prediction && prediction.inputType === 'text' && (
              <p
                className={`text-xs text-center font-medium ${
                  predictionHasErrors ? 'text-red-600 dark:text-red-300' : 'text-primary-blue dark:text-primary-green'
                }`}
              >
                {predictionHasErrors
                  ? 'Text prediction returned warnings. Review the guidance card.'
                  : 'Text prediction ready. View the disposal guidance.'}
              </p>
            )}
          </form>
        </section>

        {prediction && (
          <section className="relative overflow-hidden rounded-3xl border border-primary-blue/20 dark:border-primary-green/20 bg-white/85 dark:bg-gray-900/80 shadow-2xl px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary-blue/15 dark:bg-primary-green/15 blur-3xl" />
            <div className="absolute -bottom-24 left-[-3rem] h-64 w-64 rounded-full bg-primary-green/10 dark:bg-primary-blue/10 blur-3xl" />
            <div className="relative space-y-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3">
                  {predictionHasErrors ? (
                    <AlertTriangle className="h-9 w-9 text-warning flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-9 w-9 text-primary-green flex-shrink-0" />
                  )}
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Guidance Ready</h2>
                    <p className="text-base text-gray-600 dark:text-gray-300">
                      {summaryIntro || 'Review the recommended disposal guidance below.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-blue dark:bg-primary-green/10 dark:text-primary-green">
                    {inputBadgeLabel}
                  </span>
                  {friendlyRiskLabel !== 'UNKNOWN' && (
                    <span className={`badge ${riskBadgeClass}`}>{friendlyRiskLabel}</span>
                  )}
                  <span className="inline-flex items-center rounded-full border border-primary-blue/30 dark:border-primary-green/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-blue dark:text-primary-green">
                    Confidence {confidenceDisplay}
                  </span>
                </div>
              </div>

              {summaryCallToAction && (
                <p className="text-base font-semibold text-primary-blue dark:text-primary-green">
                  {summaryCallToAction}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOverlayOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-blue text-white px-6 py-3 text-base font-semibold shadow-lg shadow-primary-blue/30 hover:shadow-primary-blue/50 transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary-blue/40"
                >
                  View Disposal Guidance
                </button>
                <button
                  type="button"
                  onClick={handleSaveDisposal}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-blue/30 dark:border-primary-green/30 bg-white/80 dark:bg-gray-900/70 px-6 py-3 text-base font-semibold text-primary-blue dark:text-primary-green shadow-md hover:shadow-lg transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving…' : 'Save Disposal'}
                </button>
                <button
                  type="button"
                  onClick={handleRequestPickup}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-blue/40 dark:border-primary-green/40 px-6 py-3 text-base font-semibold text-primary-blue dark:text-primary-green shadow-md hover:shadow-lg transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Request CHW Pickup
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      <Modal
        isOpen={overlayOpen && Boolean(prediction)}
        onClose={() => {
          setOverlayOpen(false);
          setShowDetails(false);
        }}
        title="Disposal Guidance Preview"
        size="xl"
      >
        {prediction && (
          <div className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl border border-primary-blue/40 bg-gradient-to-br from-primary-blue via-primary-blue/80 to-primary-green text-white shadow-2xl">
              <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_farthest-corner_at_80%_20%,rgba(255,255,255,0.3),transparent_55%)]" />
              <div className="relative space-y-6 p-6 sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3 max-w-3xl">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                      Disposal Guidance Preview
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-semibold leading-snug">{pickupDisplayName}</h3>
                    <p className="text-base sm:text-lg text-white/85 leading-relaxed">
                      {summaryIntro || 'Review the predicted disposal path below.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
                    <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-white">{inputBadgeLabel}</span>
                    {friendlyRiskLabel !== 'UNKNOWN' && (
                      <span className={`badge ${riskBadgeClass}`}>{friendlyRiskLabel}</span>
                    )}
                    <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-white">
                      Confidence {confidenceDisplay}
                    </span>
                    {similarGenericName && (
                      <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-white/85">
                        Similar: {similarGenericName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/25 bg-white/10 p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-white/70">Category</p>
                    <p className="text-lg font-semibold text-white">{friendlyCategoryLabel}</p>
                    {friendlyCategoryLabel === 'Not classified yet' && (
                      <p className="text-xs text-white/70">
                        We will assign a disposal category once the model confirms a match.
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-white/25 bg-white/10 p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-white/70">Confidence</p>
                    <p className="text-lg font-semibold text-white">{confidenceDisplay}</p>
                    {confidencePercent !== null && (
                      <div className="h-2 rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.45)]"
                          style={{ width: `${confidencePercent}%` }}
                        />
                      </div>
                    )}
                    <p className="text-sm text-white/80">
                      {confidenceDisplay === 'Pending'
                        ? 'Confidence will appear once the model confirms a stronger match.'
                        : 'Higher confidence indicates a close match to known medicines.'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/25 bg-white/10 p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-white/70">Dosage Form</p>
                    <p className="text-lg font-semibold text-white">
                      {primaryDosageForm || 'Not detected yet'}
                    </p>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {primaryDosageForm
                        ? 'Likely dosage form inferred from the prediction results.'
                        : 'Scan once more or refine the name to detect the dosage form.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 shadow-lg">
              <div className="space-y-4 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Summary</h4>
                {summarySections.length ? (
                  <div className="space-y-4">
                    {summarySections.map((section) => (
                      <div key={section.label} className="space-y-1">
                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{section.label}</p>
                        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{section.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-base text-gray-600 dark:text-gray-300">
                    Disposal summary is not available yet. Expand the technical insights for raw model output.
                  </p>
                )}
                {summaryCallToAction && (
                  <p className="text-sm font-semibold text-primary-blue dark:text-primary-green">
                    {summaryCallToAction}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 shadow-lg">
              <div className="space-y-4 p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Summary</h4>
                {renderInfoGrid(quickSummaryItems)}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base text-gray-600 dark:text-gray-300">
                Need the technical breakdown?
              </p>
              <button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-blue/30 dark:border-primary-green/30 px-6 py-3 text-base font-semibold text-primary-blue dark:text-primary-green shadow-md hover:shadow-lg transition-transform duration-200 hover:-translate-y-0.5"
              >
                {showDetails ? 'Hide technical insights' : 'Show technical insights'}
              </button>
            </div>

            {showDetails && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 shadow-lg">
                  <div className="space-y-4 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Classification Insights</h4>
                    {renderInfoGrid([
                      {
                        label: 'Category',
                        value: friendlyCategoryLabel
                      },
                      categoryHandlingInstruction
                        ? {
                            label: 'Category Handling Guidance',
                            value: categoryHandlingInstruction
                          }
                        : null,
                      handlingMethod && (!categoryHandlingInstruction || handlingMethod !== categoryHandlingInstruction)
                        ? {
                            label: 'Model Handling Guidance',
                            value: handlingMethod
                          }
                        : null,
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
                      <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{disposalRemarks}</p>
                    )}
                  </div>
                </div>

                {isImagePrediction && (ocrSummaryItems.length > 0 || ocrFullText) && (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 shadow-lg">
                    <div className="space-y-4 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">OCR Summary</h4>
                      {renderInfoGrid(ocrSummaryItems)}
                      {ocrFullText && (
                        <pre className="mt-3 max-h-60 overflow-y-auto rounded-xl bg-gray-100 dark:bg-gray-800 p-4 text-xs text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                          {ocrFullText}
                        </pre>
                      )}
                    </div>
                  </div>
                )}

                {(disposalMethods.length || dosageFormPredictions.length || manufacturerPredictions.length) && (
                  <div className="grid gap-4 lg:grid-cols-3">
                    {disposalMethods.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 shadow-md p-5">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Recommended Disposal Methods</h4>
                        {renderConfidenceList(disposalMethods, 'No disposal methods available.')}
                      </div>
                    )}
                    {dosageFormPredictions.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 shadow-md p-5">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Likely Dosage Forms</h4>
                        {renderConfidenceList(dosageFormPredictions, 'No dosage form predictions returned.')}
                      </div>
                    )}
                    {manufacturerPredictions.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 shadow-md p-5">
                        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Possible Manufacturers</h4>
                        {renderConfidenceList(manufacturerPredictions, 'No manufacturer predictions returned.')}
                      </div>
                    )}
                  </div>
                )}

                {prediction.analysis && (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 shadow-lg">
                    <div className="space-y-2 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Detailed Analysis</h4>
                      {renderAnalysisContent(prediction.analysis)}
                    </div>
                  </div>
                )}

                {prediction.messages && prediction.messages.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 shadow-lg">
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Model Messages</h4>
                      <ul className="list-disc list-inside space-y-1 text-base text-gray-700 dark:text-gray-300">
                        {prediction.messages.map((message, idx) => (
                          <li key={`message-${idx}`}>{message}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {predictionHasErrors && (
                  <div className="rounded-2xl border border-red-300 dark:border-red-800 bg-red-50/80 dark:bg-red-900/40 shadow-lg">
                    <div className="p-6">
                      <h4 className="text-lg font-semibold text-red-700 dark:text-red-200 mb-2">Model Warnings</h4>
                      <ul className="list-disc list-inside space-y-1 text-base text-red-700 dark:text-red-200">
                        {prediction.errors.map((err, idx) => (
                          <li key={`error-${idx}`}>{typeof err === 'string' ? err : JSON.stringify(err)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {prediction?.predictionDetails && (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/80 shadow-lg">
                    <div className="space-y-2 p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Technical Metadata</h4>
                      <pre className="max-h-80 overflow-y-auto rounded-xl bg-gray-100 dark:bg-gray-800 p-4 text-xs text-gray-700 dark:text-gray-200">
                        {JSON.stringify(prediction.predictionDetails, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}