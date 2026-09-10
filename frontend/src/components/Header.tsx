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
            {/* Custom SVG Official Style SAIL Emblem */}
            <div className="w-12 h-12 rounded-lg bg-[#24313C] border border-[#435568] flex items-center justify-center p-2 shadow-inner group-hover:border-[#A9C9EE] transition-colors">
              <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
                <circle cx="50" cy="50" r="44" stroke="#A9C9EE" strokeWidth="6" strokeDasharray="2 1"/>
                <circle cx="50" cy="50" r="36" fill="#101B24" stroke="#435568" strokeWidth="2"/>
                {/* Steel Ingot / Plant Geometric Symbol */}
                <polygon points="50,22 75,68 25,68" fill="#A9C9EE" opacity="0.9"/>
                <polygon points="50,38 65,68 35,68" fill="#16232D"/>
                <circle cx="50" cy="54" r="5" fill="#A9C9EE"/>
              </svg>
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
