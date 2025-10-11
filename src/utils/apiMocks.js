import { mockMedicines, mockGuidelines } from './mockData';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const predictFromText = async (data) => {
  await delay(800);

  const { generic_name, brand_name, dosage_form } = data;

  const medicine = mockMedicines.find(
    m => m.genericName.toLowerCase() === generic_name.toLowerCase()
  ) || mockMedicines[0];

  const confidence = 0.85 + Math.random() * 0.12;

  const guidanceMap = {
    'LOW': 'Mix with coffee grounds or kitty litter, seal in plastic bag, and dispose in regular trash. Remove personal information from labels.',
    'MEDIUM': 'Return to pharmacy or request CHW pickup. Do not dispose in household trash or flush down toilet. This medicine requires proper disposal to prevent environmental contamination.',
    'HIGH': 'MUST be returned to CHW or authorized collection site immediately. NEVER dispose in household trash. This is a controlled substance with high risk for misuse and environmental harm.',
  };

  const safetyNotes = {
    'LOW': 'Low environmental impact. Standard household disposal acceptable with precautions.',
    'MEDIUM': 'Moderate risk. Professional disposal recommended to prevent water contamination and antibiotic resistance.',
    'HIGH': 'CRITICAL: High risk for misuse, overdose, and severe environmental damage. Mandatory professional disposal.',
  };

  return {
    success: true,
    data: {
      predicted_category: medicine.category,
      risk_level: medicine.riskLevel,
      confidence: parseFloat(confidence.toFixed(2)),
      disposal_guidance: guidanceMap[medicine.riskLevel],
      safety_notes: safetyNotes[medicine.riskLevel],
      requires_chw: medicine.riskLevel === 'HIGH',
      medicine_info: {
        generic_name: generic_name,
        brand_name: brand_name || 'N/A',
        dosage_form: dosage_form || 'N/A',
      },
    },
  };

};

export const predictFromImage = async (imageFile) => {
  await delay(1500);

  const randomMedicine = mockMedicines[Math.floor(Math.random() * mockMedicines.length)];
  const confidence = 0.75 + Math.random() * 0.2;

  const guidanceMap = {
    'LOW': 'Mix with coffee grounds or kitty litter, seal in plastic bag, and dispose in regular trash. Remove personal information from labels.',
    'MEDIUM': 'Return to pharmacy or request CHW pickup. Do not dispose in household trash or flush down toilet.',
    'HIGH': 'MUST be returned to CHW or authorized collection site immediately. NEVER dispose in household trash.',
  };

  return {
    success: true,
    data: {
      ocr_text: {
        medicine_name: randomMedicine.genericName,
        brand_name: randomMedicine.brandName,
        dosage: randomMedicine.strength,
        expiry_date: '2024-12-31',
      },
      predicted_category: randomMedicine.category,
      risk_level: randomMedicine.riskLevel,
      confidence: parseFloat(confidence.toFixed(2)),
      disposal_guidance: guidanceMap[randomMedicine.riskLevel],
      requires_chw: randomMedicine.riskLevel === 'HIGH',
      warnings: randomMedicine.riskLevel === 'HIGH' ? ['Controlled substance', 'Requires supervised disposal'] : [],
    },
  };

};

export const submitPickupRequest = async (requestData) => {
  await delay(600);

  return {
    success: true,
    message: 'Pickup request submitted successfully',
    data: {
      request_id: `req-${Date.now()}`,
      status: 'pending',
      estimated_pickup: '2-3 business days',
      ...requestData,
    },
  };

};

export const getGuidelines = async () => {
  await delay(400);

  return {
    success: true,
    data: mockGuidelines,
  };

};

export const searchMedicines = async (query) => {
  await delay(300);

  if (!query || query.length < 2) {
    return { success: true, data: [] };
  }

  const results = mockMedicines.filter(med =>
    med.genericName.toLowerCase().includes(query.toLowerCase()) ||
    med.brandName.toLowerCase().includes(query.toLowerCase())
  );

  return {
    success: true,
    data: results.slice(0, 10),
  };

};

export const getCHWsNearby = async (location) => {
  await delay(500);

  return {
    success: true,
    data: [
      {
        id: '2',
        name: 'Marie Claire',
        sector: 'Remera',
        availability: 'available',
        distance: '1.2 km',
        rating: 4.8,
      },
      {
        id: '5',
        name: 'Grace Mukamana',
        sector: 'Gikondo',
        availability: 'available',
        distance: '2.5 km',
        rating: 4.9,
      },
    ],
  };

};

export const updateDisposalStatus = async (disposalId, status, notes = '') => {
  await delay(500);

  return {
    success: true,
    message: 'Disposal status updated',
    data: {
      disposal_id: disposalId,
      status: status,
      notes: notes,
      updated_at: new Date().toISOString(),
    },
  };

};

export const getSystemStats = async () => {
  await delay(700);

  return {
    success: true,
    data: {
      total_users: 2847,
      total_chws: 156,
      total_disposals: 8945,
      pending_pickups: 234,
      completed_this_month: 1289,
      high_risk_collected: 487,
      risk_distribution: {
        LOW: 4523,
        MEDIUM: 3234,
        HIGH: 1188,
      },
      monthly_trend: [
        { month: 'May', count: 856 },
        { month: 'Jun', count: 943 },
        { month: 'Jul', count: 1087 },
        { month: 'Aug', count: 1156 },
        { month: 'Sep', count: 1234 },
        { month: 'Oct', count: 1289 },
      ],
      top_medicines: [
        { name: 'Paracetamol', count: 1456 },
        { name: 'Amoxicillin', count: 987 },
        { name: 'Ibuprofen', count: 876 },
        { name: 'Ciprofloxacin', count: 654 },
        { name: 'Diazepam', count: 432 },
      ],
    },
  };

};
