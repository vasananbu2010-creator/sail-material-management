import React from 'react';
import { Shield, Factory } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange }) => {
  return (
    <header className="bg-[#16232D] border-b border-[#435568] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: SAIL Emblem + Dual Text */}
          <div 
            onClick={() => onTabChange('home')}
            className="flex items-center space-x-3.5 cursor-pointer group select-none"
          >
            {/* Official SAIL Emblem */}
            <div className="w-12 h-12 rounded-lg bg-white border border-[#435568] flex items-center justify-center p-1.5 shadow-inner group-hover:border-[#A9C9EE] transition-colors">
              <img
                src="/sail-logo.png"
                alt="Steel Authority of India Limited Official Logo"
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="flex flex-col">
              <span className="text-[#F0F4F8] font-bold text-lg tracking-wider leading-tight">
                SAIL MATERIAL MANAGEMENT
              </span>
              <span className="text-[#A9C9EE] text-xs font-semibold tracking-widest uppercase">
                MODULE
              </span>
            </div>
          </div>

          {/* Right: Salem Steel Plant Branding */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[#F0F4F8] font-semibold text-sm tracking-wide flex items-center gap-1.5">
                <Factory className="w-4 h-4 text-[#A9C9EE]" />
                SALEM STEEL PLANT
              </span>
              <span className="text-[#B8C4D0] text-xs">Special Steel Division • ISO 9001:2015</span>
            </div>

            <div className="h-8 w-px bg-[#435568] hidden sm:block"></div>

            {/* Quick Status Pill */}
            <div className="flex items-center space-x-2 bg-[#24313C] border border-[#435568] px-3 py-1.5 rounded-full text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[#B8C4D0] font-medium hidden md:inline">Plant Systems</span>
              <span className="text-[#A9C9EE] font-semibold">Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
