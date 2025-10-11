import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import Input from '../components/FormFields/Input';
import { authState, setCurrentUser } from '../utils/mockData';
import logoSvg from '../assets/logo.svg';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    setCurrentUser('1');

    navigate('/user');
  };

  const quickLogin = (userId, role) => {
    setCurrentUser(userId);
    navigate(`/${role}`);
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

          <button type="submit" className="btn-primary w-full">
            Sign In
          </button>
        </form>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center">
            Quick Login (Demo Mode)
          </p>
          <div className="space-y-2">
            <button
              onClick={() => quickLogin('1', 'user')}
              className="btn-outline w-full text-sm"
            >
              Login as Household User
            </button>
            <button
              onClick={() => quickLogin('2', 'chw')}
              className="btn-outline w-full text-sm"
            >
              Login as CHW
            </button>
            <button
              onClick={() => quickLogin('3', 'admin')}
              className="btn-outline w-full text-sm"
            >
              Login as Admin
            </button>
          </div>
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
