import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Upload, Loader } from 'lucide-react';
import Input from '../../components/FormFields/Input';
import Select from '../../components/FormFields/Select';
import { medicinesAPI, disposalsAPI } from '../../services/api';
import SearchBar from '../../components/SearchBar';

export default function AddDisposal() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    generic_name: '',
    brand_name: '',
    dosage_form: '',
    packaging_type: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showOCRDetails, setShowOCRDetails] = useState(false);
  const [showAdvancedGuidance, setShowAdvancedGuidance] = useState(false);

  const dosageForms = [
    { value: 'Tablet', label: 'Tablet' },
    { value: 'Capsule', label: 'Capsule' },
    { value: 'Syrup', label: 'Syrup' },
    { value: 'Injection', label: 'Injection' },
    { value: 'Cream', label: 'Cream' },
    { value: 'Inhaler', label: 'Inhaler' },
  ];

  const packagingTypes = [
    { value: 'Blister Pack', label: 'Blister Pack' },
    { value: 'Bottle', label: 'Bottle' },
    { value: 'Tube', label: 'Tube' },
    { value: 'Vial', label: 'Vial' },
    { value: 'Box', label: 'Box' },
  ];

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
      ...formData,
      generic_name: medicine.genericName,
      brand_name: medicine.brandName,
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
        brandName: formData.brand_name,
        dosageForm: formData.dosage_form,
        packagingType: formData.packaging_type
      });

      if (result && result.success) {
        setPrediction(result.data);
      } else {
        // handle server-side failure shape
        const msg = result?.error?.message || result?.error || 'Prediction failed. Please try again.';
        setServerError(msg);
        setPrediction(null);
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
      setFormData({
        generic_name: result.data.ocr_text?.medicine_name || '',
        brand_name: result.data.ocr_text?.brand_name || '',
        dosage_form: '',
        packaging_type: '',
      });
      setPrediction(result.data);
    } else {
      const msg = result?.error?.message || result?.error || 'Image prediction failed. Please try again.';
      setServerError(msg);
      setPrediction(null);
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

    const disposal = {
      genericName: formData.generic_name,
      brandName: formData.brand_name,
      dosageForm: formData.dosage_form,
      packagingType: formData.packaging_type,
      predictedCategory: prediction.predicted_category,
      riskLevel: prediction.risk_level,
      confidence: prediction.confidence,
      disposalGuidance: prediction.disposal_guidance,
      reason: 'user_initiated',
    };

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
      const disposal = {
        genericName: formData.generic_name,
        brandName: formData.brand_name,
        dosageForm: formData.dosage_form,
        packagingType: formData.packaging_type,
        predictedCategory: prediction.predicted_category,
        riskLevel: prediction.risk_level,
        confidence: prediction.confidence,
        disposalGuidance: prediction.disposal_guidance,
        reason: 'user_initiated',
      };

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
              medicineName: `${formData.generic_name}${
                formData.brand_name ? ` (${formData.brand_name})` : ''
              }`,
              disposalGuidance: prediction.disposal_guidance,
              riskLevel: prediction.risk_level,
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
        Enter medicine details to get proper disposal guidance
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
          </div>
        </div>

        {/* Manual entry form - inputs arranged in two columns */}
        <form onSubmit={handlePredictFromText} className="card">
          <h2 className="text-xl font-bold mb-4">Option 2: Enter medecine Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                label="Generic Medicine Name"
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
                        {med.brandName} • {med.dosageForm}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Input
                label="Brand Name (Optional)"
                id="brand_name"
                name="brand_name"
                value={formData.brand_name}
                onChange={handleInputChange}
                placeholder="e.g., Panadol"
              />
            </div>

            <div>
              <Select
                label="Dosage Form"
                id="dosage_form"
                name="dosage_form"
                value={formData.dosage_form}
                onChange={handleInputChange}
                options={dosageForms}
              />
            </div>

            <div>
              <Select
                label="Packaging Type"
                id="packaging_type"
                name="packaging_type"
                value={formData.packaging_type}
                onChange={handleInputChange}
                options={packagingTypes}
              />
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
          </div>
        </form>
      </div>

      {/* Output card placed below the parallel inputs */}
      {prediction && (
        <div className="card mt-6 border-2 border-primary-blue dark:border-accent-cta">
          <div className="flex items-start gap-4 mb-4">
            {prediction.risk_level === 'HIGH' ? (
              <AlertTriangle className="w-8 h-8 text-warning flex-shrink-0" />
            ) : (
              <CheckCircle className="w-8 h-8 text-primary-green flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Classification Results</h3>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="badge badge-info">{prediction.predicted_category}</span>
                <span
                  className={`badge badge-${
                    prediction.risk_level === 'HIGH'
                      ? 'danger'
                      : prediction.risk_level === 'MEDIUM'
                      ? 'warning'
                      : 'success'
                  }`}
                >
                  {prediction.risk_level} Risk
                </span>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Confidence Level
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-primary-green h-3 rounded-full transition-all duration-500"
                    style={{ width: `${prediction.confidence * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {(prediction.confidence * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
            <h4 className="font-bold mb-2">Disposal Guidance:</h4>
            <p className="text-gray-700 dark:text-gray-300">
              {prediction.disposal_guidance}
            </p>
          </div>

          {/* OCR details when available (collapsible) */}
          {prediction.ocr_info && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowOCRDetails(!showOCRDetails)}
                className="text-sm text-primary-blue dark:text-accent-cta font-medium mb-2"
              >
                {showOCRDetails ? 'Hide OCR details' : 'Show OCR details'}
              </button>

              {showOCRDetails && (
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                  <h4 className="font-bold mb-2">OCR Extraction (image)</h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <div><strong>Confidence:</strong> {prediction.ocr_info.confidence ?? 'N/A'}</div>
                    <div><strong>Medicine texts found:</strong> {prediction.ocr_info.medicine_texts_found ?? 0}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div><strong>Generic name:</strong> {prediction.ocr_info.extracted_info?.generic_name || '—'}</div>
                    <div><strong>Brand name:</strong> {prediction.ocr_info.extracted_info?.brand_name || '—'}</div>
                    <div><strong>Dosage / Strength:</strong> {prediction.ocr_info.extracted_info?.dosage_strength || '—'}</div>
                    <div><strong>Dosage form:</strong> {prediction.ocr_info.extracted_info?.dosage_form || '—'}</div>
                    <div className="md:col-span-2"><strong>Active ingredients:</strong> {(prediction.ocr_info.extracted_info?.active_ingredients || []).join(', ') || '—'}</div>
                    {prediction.ocr_info.extracted_info?.other_info && (
                      <div className="md:col-span-2"><strong>Other:</strong> {(prediction.ocr_info.extracted_info.other_info || []).join(', ')}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Safety guidance (primary + collapsible advanced details) */}
          {prediction.safety_guidance && (
            <div className="mb-4">
              {/* Show the most actionable instruction first (prefer procedure, otherwise disposal guidance) */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-2">
                <h4 className="font-bold mb-2">Recommended Action</h4>
                <p className="text-gray-700 dark:text-gray-300">
                  {prediction.safety_guidance.procedure || prediction.disposal_guidance || 'Follow local disposal procedures.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvancedGuidance(!showAdvancedGuidance)}
                className="text-sm text-primary-blue dark:text-accent-cta font-medium mb-2"
              >
                {showAdvancedGuidance ? 'Hide advanced guidance' : 'Show advanced guidance'}
              </button>

              {showAdvancedGuidance && (
                <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4 border">
                  <h4 className="font-bold mb-2">Advanced Safety Guidance</h4>
                  {prediction.safety_guidance.prohibitions && (
                    <div className="mb-2">
                      <strong>Prohibitions:</strong>
                      <p className="text-gray-700 dark:text-gray-300">{prediction.safety_guidance.prohibitions}</p>
                    </div>
                  )}
                  {prediction.safety_guidance.risks && (
                    <div className="mb-2">
                      <strong>Risks:</strong>
                      <p className="text-gray-700 dark:text-gray-300">{prediction.safety_guidance.risks}</p>
                    </div>
                  )}
                  {prediction.safety_guidance.special_instructions && (
                    <div>
                      <strong>Special instructions:</strong>
                      <p className="text-gray-700 dark:text-gray-300">{prediction.safety_guidance.special_instructions}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {prediction.safety_notes && (
            <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-4 mb-4">
              <h4 className="font-bold mb-2">Safety Notes:</h4>
              <p className="text-gray-700 dark:text-gray-300">{prediction.safety_notes}</p>
            </div>
          )}

          <div className="flex gap-4 flex-nowrap">
            <button onClick={handleSaveDisposal} className="btn-secondary flex-1 min-w-0">
              Save Disposal
            </button>
            <button
              onClick={handleRequestPickup}
              className={`btn-primary flex-1 min-w-0 ${!prediction ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!prediction}
              title={!prediction ? 'Analyze to enable pickup request' : 'Request CHW pickup'}
            >
              Request CHW Pickup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
