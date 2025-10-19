import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  PlusCircle,
  History,
  Users,
  BookOpen,
  BarChart3,
  User,
  Truck,
  CheckCircle,
  Settings,
  FileText,
  Database,
  ChevronLeft,
  Lightbulb,
  Package,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const [currentRole, setCurrentRole] = useState('user');

  // Update role whenever location changes or component mounts
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    setCurrentRole(user?.role || 'user');
  }, [location]);

  const userLinks = [
    { to: '/user', icon: Home, label: 'Dashboard', end: true },
    { to: '/user/add-disposal', icon: PlusCircle, label: 'New Disposal' },
    { to: '/user/history', icon: History, label: 'History' },
    { to: '/user/chw-interaction', icon: Users, label: 'CHW Pickup' },
    { to: '/user/education', icon: BookOpen, label: 'Education' },
    { to: '/user/profile', icon: User, label: 'Profile' },
  ];

  const chwLinks = [
    { to: '/chw', icon: Home, label: 'Dashboard', end: true },
    { to: '/chw/pickup-requests', icon: Truck, label: 'Pickup Requests' },
    { to: '/chw/profile', icon: User, label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin', icon: Home, label: 'Dashboard', end: true },
    { to: '/admin/disposals', icon: Package, label: 'Disposals' },
    { to: '/admin/users', icon: Users, label: 'Manage Users' },
    { to: '/admin/medicines', icon: Database, label: 'Medicines Registry' },
    { to: '/admin/education', icon: Lightbulb, label: 'Education Tips' },
    { to: '/admin/reports', icon: FileText, label: 'System Reports' },
  ];

  const links =
    currentRole === 'user'
      ? userLinks
      : currentRole === 'chw'
      ? chwLinks
      : adminLinks;

  // Adjust this if your navbar height is different
  const NAVBAR_HEIGHT = 75; // px

  return (
    <>
      {isOpen && (
        <div
          className="fixed left-0 right-0 bg-black bg-opacity-50 z-30"
          onClick={onClose}
          aria-hidden="true"
          style={{ top: `${NAVBAR_HEIGHT}px`, height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
        />
      )}

      <aside
        className={`fixed left-0 bg-surface-light dark:bg-surface-dark border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-64 flex flex-col z-30`}
        style={{ top: `${NAVBAR_HEIGHT}px`, height: `calc(100vh - ${NAVBAR_HEIGHT}px)` }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-accent-cta"
            aria-label="Close menu"
            title="Close sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4" aria-label="Main navigation">
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  onClick={() => onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 min-h-[44px] ${
                      isActive
                        ? 'bg-primary-blue text-white dark:bg-accent-cta'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    } focus:outline-none focus:ring-2 focus:ring-accent-cta`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <link.icon
                        className={`w-5 h-5 ${isActive ? 'text-white' : ''}`}
                        aria-hidden="true"
                      />
                      <span className="font-medium">{link.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="card bg-primary-blue bg-opacity-10 dark:bg-accent-cta dark:bg-opacity-10">
            <h3 className="font-semibold text-sm mb-2">Need Help?</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Contact your local CHW or call the helpline
            </p>
            <a
              href="tel:+250788000000"
              className="text-xs text-primary-blue dark:text-accent-cta hover:underline font-medium"
            >
              +250 788 000 000
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
