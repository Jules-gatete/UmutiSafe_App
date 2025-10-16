import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import Input from '../components/FormFields/Input';
import { authAPI } from '../services/api';
import logoSvg from '../assets/logo.svg';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    // Check for message from registration
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(''); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);

      if (response.success) {
        const user = response.data.user;

        // Redirect based on role
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'chw') {
          navigate('/chw');
        } else {
          navigate('/user');
        }
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Your account is pending approval. You will receive an email once approved.');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-blue to-primary-green p-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <img src={logoSvg} alt="UmutiSafe Logo" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-text-dark dark:text-text-light mb-2">
            UmutiSafe
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Safe Medicine Disposal Platform</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-4 bg-blue-100 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-400 rounded-lg">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <Input
            label="Email"
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your.email@example.com"
            required
          />

          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            required
          />

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Signing In...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-blue dark:text-accent-cta hover:underline font-medium">
              Create Account
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
