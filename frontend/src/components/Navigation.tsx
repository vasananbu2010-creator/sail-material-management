import React, { useState } from 'react';
import { Home, LayoutDashboard, Database, BarChart3, User, Menu, X } from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tracking', label: 'Material Tracking', icon: Database },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'profile', label: 'User Profile', icon: User },
  ];

  const handleSelect = (id: string) => {
    onTabChange(id);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-[#101B24] border-b border-[#435568]/60 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#24313C] text-[#A9C9EE] border border-[#435568] shadow-sm font-semibold'
                      : 'text-[#B8C4D0] hover:text-[#F0F4F8] hover:bg-[#16232D]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#A9C9EE]' : 'text-[#B8C4D0]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden w-full items-center justify-between py-2">
            <span className="text-xs uppercase tracking-wider text-[#A9C9EE] font-semibold">
              {navItems.find(i => i.id === currentTab)?.label || 'Navigation'}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md bg-[#24313C] border border-[#435568] text-[#F0F4F8] hover:text-[#A9C9EE]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#435568] space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-[#24313C] text-[#A9C9EE] border-l-4 border-[#A9C9EE]'
                      : 'text-[#B8C4D0] hover:bg-[#16232D] hover:text-[#F0F4F8]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};
