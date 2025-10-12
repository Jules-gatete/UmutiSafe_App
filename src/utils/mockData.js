export const mockUsers = [
  {
    id: '1',
    name: 'Jean Baptiste',
    email: 'jean.baptiste@email.com',
    role: 'user',
    avatar: 'JB',
    phone: '+250 788 123 456',
    location: 'Kigali, Gasabo',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Marie Claire',
    email: 'marie.claire@email.com',
    role: 'chw',
    avatar: 'MC',
    phone: '+250 788 234 567',
    sector: 'Remera',
    availability: 'available',
    completedPickups: 45,
    createdAt: '2023-06-10',
  },
  {
    id: '3',
    name: 'Admin User',
    email: 'admin@umutisafe.gov.rw',
    role: 'admin',
    avatar: 'AU',
    phone: '+250 788 345 678',
    createdAt: '2023-01-01',
  },
];

export const mockCHWs = [
  {
    id: '2',
    name: 'Marie Claire',
    avatar: 'MC',
    phone: '+250 788 234 567',
    sector: 'Remera',
    availability: 'available',
    completedPickups: 45,
    rating: 4.8,
    coverageArea: 'Gasabo District - Remera Sector',
  },
  {
    id: '4',
    name: 'Pierre Uwase',
    avatar: 'PU',
    phone: '+250 788 456 789',
    sector: 'Kimironko',
    availability: 'busy',
    completedPickups: 38,
    rating: 4.6,
    coverageArea: 'Gasabo District - Kimironko Sector',
  },
  {
    id: '5',
    name: 'Grace Mukamana',
    avatar: 'GM',
    phone: '+250 788 567 890',
    sector: 'Gikondo',
    availability: 'available',
    completedPickups: 52,
    rating: 4.9,
    coverageArea: 'Kicukiro District - Gikondo Sector',
  },
];

export const mockMedicines = [
  {
    id: 'med-1',
    genericName: 'Paracetamol',
    brandName: 'Panadol',
    dosageForm: 'Tablet',
    strength: '500mg',
    category: 'Analgesic',
    riskLevel: 'LOW',
  },
  {
    id: 'med-2',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    dosageForm: 'Capsule',
    strength: '250mg',
    category: 'Antibiotic',
    riskLevel: 'MEDIUM',
  },
  {
    id: 'med-3',
    genericName: 'Diazepam',
    brandName: 'Valium',
    dosageForm: 'Tablet',
    strength: '5mg',
    category: 'Controlled Substance',
    riskLevel: 'HIGH',
  },
  {
    id: 'med-4',
    genericName: 'Ibuprofen',
    brandName: 'Advil',
    dosageForm: 'Tablet',
    strength: '400mg',
    category: 'NSAID',
    riskLevel: 'LOW',
  },
  {
    id: 'med-5',
    genericName: 'Ciprofloxacin',
    brandName: 'Cipro',
    dosageForm: 'Tablet',
    strength: '500mg',
    category: 'Antibiotic',
    riskLevel: 'MEDIUM',
  },
  {
    id: 'med-6',
    genericName: 'Morphine Sulfate',
    brandName: 'MS Contin',
    dosageForm: 'Tablet',
    strength: '30mg',
    category: 'Opioid',
    riskLevel: 'HIGH',
  },
];

export const mockDisposals = [
  {
    id: 'disp-1',
    userId: '1',
    genericName: 'Paracetamol',
    brandName: 'Panadol',
    dosageForm: 'Tablet',
    packagingType: 'Blister Pack',
    predictedCategory: 'Analgesic',
    riskLevel: 'LOW',
    confidence: 0.95,
    status: 'completed',
    reason: 'expired',
    disposalGuidance: 'Mix with coffee grounds or kitty litter, seal in plastic bag, dispose in regular trash.',
    createdAt: '2024-09-15',
    completedAt: '2024-09-18',
  },
  {
    id: 'disp-2',
    userId: '1',
    genericName: 'Amoxicillin',
    brandName: 'Amoxil',
    dosageForm: 'Capsule',
    packagingType: 'Bottle',
    predictedCategory: 'Antibiotic',
    riskLevel: 'MEDIUM',
    confidence: 0.89,
    status: 'pending_review',
    reason: 'completed_treatment',
    disposalGuidance: 'Return to pharmacy or CHW for proper disposal. Do not flush or throw in trash.',
    createdAt: '2024-10-01',
  },
  {
    id: 'disp-3',
    userId: '1',
    genericName: 'Diazepam',
    brandName: 'Valium',
    dosageForm: 'Tablet',
    packagingType: 'Blister Pack',
    predictedCategory: 'Controlled Substance',
    riskLevel: 'HIGH',
    confidence: 0.92,
    status: 'pickup_requested',
    reason: 'no_longer_needed',
    disposalGuidance: 'MUST be returned to CHW or authorized collection site. Do not dispose in household trash.',
    pickupRequestId: 'req-1',
    createdAt: '2024-10-05',
  },
];

export const mockPickupRequests = [
  {
    id: 'req-1',
    userId: '1',
    userName: 'Jean Baptiste',
    chwId: '2',
    chwName: 'Marie Claire',
    medicineName: 'Diazepam (Valium)',
    disposalGuidance: 'MUST be returned to CHW or authorized collection site. Do not dispose in household trash.',
    reason: 'no_longer_needed',
    pickupLocation: 'KG 123 St, Remera, Kigali',
    preferredTime: '2024-10-08T10:00:00',
    status: 'scheduled',
    consentGiven: true,
    notes: '',
    createdAt: '2024-10-05',
    updatedAt: '2024-10-06',
  },
  {
    id: 'req-2',
    userId: '1',
    userName: 'Jean Baptiste',
    chwId: '5',
    chwName: 'Grace Mukamana',
    medicineName: 'Amoxicillin (Amoxil)',
    disposalGuidance: 'Return to pharmacy or CHW for proper disposal.',
    reason: 'completed_treatment',
    pickupLocation: 'KG 123 St, Remera, Kigali',
    preferredTime: '2024-10-12T14:00:00',
    status: 'pending',
    consentGiven: true,
    notes: '',
    createdAt: '2024-10-08',
  },
];

export const mockEducationTips = [
  {
    id: 'tip-1',
    title: 'Why Proper Medicine Disposal Matters',
    icon: 'AlertTriangle',
    summary: 'Improper disposal can contaminate water supplies, harm wildlife, and lead to medicine misuse.',
    content: 'When medicines are flushed down toilets or thrown in regular trash, they can end up in rivers and lakes, affecting aquatic life and potentially entering our drinking water. Some medicines can persist in the environment for years. Always use proper disposal methods to protect our community and environment.',
  },
  {
    id: 'tip-2',
    title: 'Expired Medicine Risks',
    icon: 'Clock',
    summary: 'Expired medicines may be ineffective or even harmful. Check expiration dates regularly.',
    content: 'Medicines past their expiration date may lose potency or break down into harmful compounds. Create a habit of checking your medicine cabinet every 6 months. Mark expiration dates clearly and set calendar reminders to review your supplies.',
  },
  {
    id: 'tip-3',
    title: 'Safe Storage at Home',
    icon: 'Lock',
    summary: 'Store medicines in a cool, dry place away from children and pets.',
    content: 'Keep all medicines in their original containers with labels intact. Store them in a locked cabinet if possible, away from heat and humidity. Never store medicines in bathrooms where moisture can degrade them. Keep emergency contact numbers visible.',
  },
  {
    id: 'tip-4',
    title: 'Never Share Prescription Medicines',
    icon: 'Users',
    summary: 'Prescription medicines are prescribed for specific individuals and conditions.',
    content: 'What works for one person may be dangerous for another. Sharing prescription medicines can lead to adverse reactions, drug interactions, or mask symptoms of serious conditions. Always consult a healthcare provider before taking any medicine.',
  },
  {
    id: 'tip-5',
    title: 'Recognize High-Risk Medicines',
    icon: 'ShieldAlert',
    summary: 'Some medicines require special disposal procedures due to their potential for misuse or environmental harm.',
    content: 'Controlled substances (opioids, sedatives), chemotherapy drugs, and certain antibiotics must never be thrown in regular trash. UmutiSafe automatically identifies these high-risk medicines and connects you with CHWs for safe disposal.',
  },
  {
    id: 'tip-6',
    title: 'Community Health Worker Support',
    icon: 'Heart',
    summary: 'CHWs are trained professionals ready to help you dispose of medicines safely.',
    content: 'Your local Community Health Worker can provide guidance, arrange pickups for high-risk medicines, and answer questions about medicine safety. They are your trusted partners in keeping your family and community safe.',
  },
];

export const mockGuidelines = [
  {
    category: 'LOW',
    title: 'Low Risk Medicines',
    medicines: ['Paracetamol', 'Ibuprofen', 'Antacids', 'Vitamins'],
    procedure: 'Mix with coffee grounds or kitty litter, seal in plastic bag, dispose in regular trash. Remove or scratch out personal information from labels.',
    warnings: 'Do not flush down toilet or drain.',
  },
  {
    category: 'MEDIUM',
    title: 'Medium Risk Medicines',
    medicines: ['Antibiotics', 'Blood Pressure Medicines', 'Diabetes Medicines'],
    procedure: 'Return to pharmacy or request CHW pickup. Do not dispose in household trash or flush.',
    warnings: 'Improper disposal can contribute to antibiotic resistance and water contamination.',
  },
  {
    category: 'HIGH',
    title: 'High Risk / Controlled Substances',
    medicines: ['Opioids', 'Sedatives', 'Chemotherapy', 'Injectable Medicines'],
    procedure: 'MUST be returned to CHW or authorized collection site. Use UmutiSafe to request immediate pickup.',
    warnings: 'NEVER dispose in household trash. High risk for misuse, overdose, and environmental harm.',
  },
];

export let currentUser = mockUsers[0];

export const authState = {
  isAuthenticated: true,
  currentRole: 'user',
};

export const setCurrentUser = (userId) => {
  const user = mockUsers.find(u => u.id === userId);
  if (user) {
    currentUser = user;
    authState.currentRole = user.role;
    authState.isAuthenticated = true;
  }
};

export const switchRole = (role) => {
  const user = mockUsers.find(u => u.role === role);
  if (user) {
    setCurrentUser(user.id);
  }
};

export const logout = () => {
  authState.isAuthenticated = false;
  authState.currentRole = null;
};

export const addDisposal = (disposal) => {
  const newDisposal = {
    id: `disp-${Date.now()}`,
    userId: currentUser.id,
    status: 'pending_review',
    createdAt: new Date().toISOString().split('T')[0],
    ...disposal,
  };
  mockDisposals.unshift(newDisposal);
  return newDisposal;
};

export const addPickupRequest = (request) => {
  const newRequest = {
    id: `req-${Date.now()}`,
    userId: currentUser.id,
    userName: currentUser.name,
    status: 'pending',
    consentGiven: true,
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0],
    ...request,
  };
  mockPickupRequests.unshift(newRequest);
  return newRequest;
};

export const updatePickupRequestStatus = (requestId, status, notes = '') => {
  const request = mockPickupRequests.find(r => r.id === requestId);
  if (request) {
    request.status = status;
    request.notes = notes;
    request.updatedAt = new Date().toISOString().split('T')[0];
  }
  return request;
};
