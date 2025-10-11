import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import AppRoutes from './routes/AppRoutes';
import { initTheme } from './utils/theme';
import { authState } from './utils/mockData';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    initTheme();
  }, []);

  const isLoginPage = window.location.pathname === '/login';

  if (isLoginPage) {
    return (
      <Router>
        <AppRoutes />
      </Router>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <main className="flex-1 overflow-y-auto">
            <AppRoutes />
          </main>
        </div>

        <BottomNav />
      </div>
    </Router>
  );
}

export default App;
