import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Phone, MapPin, Building2 } from 'lucide-react';
import Input from '../components/FormFields/Input';
import { authAPI } from '../services/api';
import logoSvg from '../assets/logo.svg';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    sector: '',
    role: 'user' // Default role
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Email domain validation
    const emailDomain = formData.email.split('@')[1];
    const isGovEmail = emailDomain === 'umutisafe.gov.rw';

    if (formData.role === 'admin') {
      // Admin MUST use @umutisafe.gov.rw
      if (!isGovEmail) {
        setError('Administrator accounts must use @umutisafe.gov.rw email address');
        return;
      }
    } else {
      // Regular users and CHWs CANNOT use @umutisafe.gov.rw
      if (isGovEmail) {
        setError('The @umutisafe.gov.rw domain is reserved for administrators only. Please use a different email address.');
        return;
      }
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await authAPI.register(registerData);

      if (response.success) {
        setSuccess(response.message);
        
        // If user is auto-approved (admin), redirect to login
        if (response.data.user.isApproved) {
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          // Show pending approval message
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Registration successful! Your account is pending approval. You will receive an email once approved.' 
              } 
            });
          }, 3000);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-blue to-primary-green p-4">
      <div className="card max-w-2xl w-full">
        <div className="text-center mb-8">
          <img src={logoSvg} alt="UmutiSafe Logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Join UmutiSafe - Safe Medicine Disposal Platform</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="John Doe"
              required
              icon={User}
            />

            <Input
              label="Email"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your.email@example.com"
              required
              icon={Mail}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="At least 6 characters"
              required
              icon={Lock}
            />

            <Input
              label="Confirm Password"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Re-enter password"
              required
              icon={Lock}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+250 788 123 456"
              icon={Phone}
            />

            <Input
              label="Location"
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Kigali, Gasabo"
              icon={MapPin}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Type
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="input-field w-full"
              required
            >
              <option value="user">Household User</option>
              <option value="admin">Administrator</option>
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formData.role === 'user'
                ? 'For individuals disposing of medicines at home'
                : 'For system administrators (requires approval)'}
            </p>
          </div>

          {/* Show sector field only for regular users */}
          {formData.role === 'user' && (
            <div>
              <Input
                label="Sector"
                id="sector"
                name="sector"
                type="text"
                value={formData.sector}
                onChange={handleInputChange}
                placeholder="e.g., Kimironko, Remera, Nyarutarama"
                icon={Building2}
                required
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your sector helps us connect you with Community Health Workers in your area
              </p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Note:</strong> Your account will be pending approval by an administrator. 
              You will receive an email notification once your account is approved and you can log in.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn-primary w-full flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-blue dark:text-accent-cta hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help?{' '}
            <a href="tel:+250788000000" className="text-primary-blue dark:text-accent-cta hover:underline">
              Call +250 788 000 000
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

