import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#16232D] border-t border-[#435568] py-8 text-xs text-[#B8C4D0] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center sm:text-left">
          <span className="font-semibold text-[#F0F4F8]">Salem Steel Plant Operations</span>
          <span className="hidden sm:inline text-[#435568]">•</span>
          <span>Powered by SAIL IT Services</span>
        </div>

        <div className="flex items-center space-x-6 text-[#A9C9EE]">
          <a href="#contact" onClick={(e) => { e.preventDefault(); alert("SAIL Salem Steel Plant Materials Management Cell\nEmail: mm.ssp@sail.in\nPhone: +91 427 2382400"); }} className="hover:underline">
            Contact Us
          </a>
          <span className="text-[#435568]">•</span>
          <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("Steel Authority of India Limited (SAIL) Enterprise Data Privacy & Security Policy\nConfidentiality Tier 1 Material Data."); }} className="hover:underline">
            Privacy Policy
          </a>
          <span className="text-[#435568]">•</span>
          <span className="text-[#B8C4D0]">v2.0 Enterprise</span>
        </div>
      </div>
    </footer>
  );
};
