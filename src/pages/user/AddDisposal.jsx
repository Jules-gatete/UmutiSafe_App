import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Upload, Loader } from 'lucide-react';
import Input from '../../components/FormFields/Input';
import Select from '../../components/FormFields/Select';
import { predictFromText, predictFromImage, searchMedicines } from '../../utils/apiMocks';
import { addDisposal } from '../../utils/mockData';

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
  const [suggestions, setSuggestions] = useState([]);

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
      const results = await searchMedicines(value);
      if (results.success) {
        setSuggestions(results.data);
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
    try {
      const result = await predictFromText(formData);

      if (result.success) {
        setPrediction(result.data);
      }
    } catch (error) {
      console.error('Prediction error:', error);
      alert('Failed to predict. Please try again.');
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
    try {
      const result = await predictFromImage(imageFile);

      if (result.success) {
        setFormData({
          generic_name: result.data.ocr_text.medicine_name,
          brand_name: result.data.ocr_text.brand_name,
          dosage_form: '',
          packaging_type: '',
        });
        setPrediction(result.data);
      }
    } catch (error) {
      console.error('Image prediction error:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDisposal = () => {
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

    addDisposal(disposal);

    alert('Disposal saved successfully!');
    navigate('/user/history');
  };

  const handleRequestPickup = () => {
    if (!prediction) {
      alert('Please predict the medicine classification first.');
      return;
    }

    navigate('/user/chw-interaction', {
      state: {
        medicineName: `${formData.generic_name}${
          formData.brand_name ? ` (${formData.brand_name})` : ''
        }`,
        disposalGuidance: prediction.disposal_guidance,
        riskLevel: prediction.risk_level,
      },
    });
  };

  return (
    <div className="p-4 lg:p-8 pb-24 lg:pb-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
        Add New Disposal
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Enter medicine details to get proper disposal guidance
      </p>

      <div className="card mb-6">
        <h2 className="text-xl font-bold mb-4">Option 1: Upload Image</h2>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
          {imagePreview ? (
            <div className="mb-4">
              <img
                src={imagePreview}
                alt="Medicine preview"
                className="max-h-64 mx-auto rounded-lg"
              />
            </div>
          ) : (
            <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
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

      <div className="text-center mb-6">
        <span className="text-gray-500 dark:text-gray-400 font-medium">OR</span>
      </div>

      <form onSubmit={handlePredictFromText} className="card">
        <h2 className="text-xl font-bold mb-4">Option 2: Enter Details Manually</h2>

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

        <Input
          label="Brand Name (Optional)"
          id="brand_name"
          name="brand_name"
          value={formData.brand_name}
          onChange={handleInputChange}
          placeholder="e.g., Panadol"
        />

        <Select
          label="Dosage Form"
          id="dosage_form"
          name="dosage_form"
          value={formData.dosage_form}
          onChange={handleInputChange}
          options={dosageForms}
        />

        <Select
          label="Packaging Type"
          id="packaging_type"
          name="packaging_type"
          value={formData.packaging_type}
          onChange={handleInputChange}
          options={packagingTypes}
        />

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
      </form>

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

          {prediction.safety_notes && (
            <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-4 mb-4">
              <h4 className="font-bold mb-2">Safety Notes:</h4>
              <p className="text-gray-700 dark:text-gray-300">{prediction.safety_notes}</p>
            </div>
          )}

          <div className="flex gap-4 flex-wrap">
            <button onClick={handleSaveDisposal} className="btn-secondary flex-1">
              Save Disposal
            </button>
            {prediction.requires_chw && (
              <button onClick={handleRequestPickup} className="btn-primary flex-1">
                Request CHW Pickup
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
