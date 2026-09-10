import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { MaterialTrackingPage } from './pages/MaterialTrackingPage';
import { ReportsPage } from './pages/ReportsPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { api } from './services/api';
import { DashboardData } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const fetchDashboard = async () => {
    try {
      const data = await api.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Poll dashboard updates every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectDocumentFromDashboard = (docId: string) => {
    setCurrentTab('home');
    // HomePage will fetch the selected document
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#101B24] text-[#F0F4F8] selection:bg-[#A9C9EE] selection:text-[#101B24]">
      {/* Header */}
      <Header currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Navigation */}
      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {currentTab === 'home' && (
          <HomePage
            dashboardData={dashboardData}
            onRefreshDashboard={fetchDashboard}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage
            data={dashboardData}
            onSelectDocument={handleSelectDocumentFromDashboard}
          />
        )}

        {currentTab === 'tracking' && <MaterialTrackingPage />}

        {currentTab === 'reports' && <ReportsPage />}

        {currentTab === 'profile' && <UserProfilePage />}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
