import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, BookOpen, User } from 'lucide-react';
import { authState } from '../utils/mockData';

export default function BottomNav() {
  const userLinks = [
    { to: '/user', icon: Home, label: 'Home' },
    { to: '/user/chw-interaction', icon: Users, label: 'CHW' },
    { to: '/user/education', icon: BookOpen, label: 'Guide' },
    { to: '/user/profile', icon: User, label: 'Profile' },
  ];

  const chwLinks = [
    { to: '/chw', icon: Home, label: 'Home' },
    { to: '/chw/pickup-requests', icon: Users, label: 'Pickups' },
    { to: '/chw/profile', icon: User, label: 'Profile' },
  ];

  const adminLinks = [
    { to: '/admin', icon: Home, label: 'Home' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/medicines', icon: BookOpen, label: 'Meds' },
    { to: '/admin/reports', icon: User, label: 'Reports' },
  ];

  const links =
    authState.currentRole === 'user'
      ? userLinks
      : authState.currentRole === 'chw'
      ? chwLinks
      : adminLinks;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-light dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700 shadow-lg"
      aria-label="Bottom navigation"
    >
      <ul className="flex justify-around items-center h-16">
        {links.map((link) => (
          <li key={link.to} className="flex-1">
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full gap-1 transition-colors min-h-[44px] min-w-[44px] ${
                  isActive
                    ? 'text-primary-blue dark:text-accent-cta'
                    : 'text-gray-600 dark:text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon
                    className={`w-6 h-6 ${
                      isActive ? 'text-primary-blue dark:text-accent-cta' : ''
                    }`}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium">{link.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
