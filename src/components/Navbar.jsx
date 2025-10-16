import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, User, LogOut } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import { authAPI } from '../services/api';
import logoSvg from '../assets/logo.svg';

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  const roleLabels = {
    user: 'Household',
    chw: 'CHW',
    admin: 'Admin',
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-40 bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-cta min-w-[44px] min-h-[44px]"
              aria-label="Toggle menu"
              title="Toggle sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/" className="flex items-center gap-3 group">
              <img src={logoSvg} alt="UmutiSafe Logo" className="w-10 h-10" />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-primary-blue dark:text-accent-cta group-hover:text-primary-green transition-colors">
                  UmutiSafe
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Safe Medicine Disposal
                </p>
              </div>
            </Link>

            <div className="hidden md:flex flex-1 max-w-lg">
              {/* Search moved to per-page locations */}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 min-h-[44px]">
              <span className="text-sm font-medium">
                {roleLabels[user.role]}
              </span>
            </div>

            <button
              className="relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-cta min-w-[44px] min-h-[44px]"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-warning rounded-full"></span>
            </button>

            <DarkModeToggle />

            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-cta min-h-[44px]"
                aria-label="User menu"
                aria-expanded={showUserDropdown}
              >
                <div className="w-8 h-8 rounded-full bg-primary-blue text-white flex items-center justify-center font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="w-4 h-4 hidden sm:block" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    to={`/${user.role}/profile`}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                    onClick={() => setShowUserDropdown(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:hidden mt-3">
          {/* Mobile search moved to per-page locations */}
        </div>
      </div>
    </nav>
  );
}
