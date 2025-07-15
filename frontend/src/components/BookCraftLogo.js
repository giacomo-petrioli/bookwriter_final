// Logo component for BookCraft AI
import React from 'react';

const BookCraftLogo = ({ className = "w-8 h-8" }) => {
  // For now, using an improved SVG version based on the user's logo design
  // This will be replaced with the actual image once properly extracted
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="20%" stopColor="#1E3A8A" />
          <stop offset="50%" stopColor="#0891B2" />
          <stop offset="80%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Book Base */}
      <path d="M40 50 L40 150 L100 140 L160 150 L160 50 L100 60 Z" fill="url(#bookGradient)" />
      
      {/* Book Left Side Shadow */}
      <path d="M40 50 L40 150 L100 140 L100 60 Z" fill="#0F172A" opacity="0.4" />
      
      {/* Book Spine Light */}
      <path d="M95 62 L95 138 L105 140 L105 64 Z" fill="url(#circuitGradient)" opacity="0.3" />
      
      {/* Circuit Tree Design */}
      <g filter="url(#glow)">
        {/* Main trunk */}
        <path d="M100 80 L100 120" stroke="url(#circuitGradient)" strokeWidth="3" fill="none" />
        
        {/* Left branches */}
        <path d="M100 90 L85 85 L85 75" stroke="url(#circuitGradient)" strokeWidth="2.5" fill="none" />
        <path d="M100 105 L80 100 L80 90" stroke="url(#circuitGradient)" strokeWidth="2.5" fill="none" />
        <path d="M100 115 L75 110 L75 100" stroke="url(#circuitGradient)" strokeWidth="2.5" fill="none" />
        
        {/* Right branches */}
        <path d="M100 85 L115 80 L115 70" stroke="url(#circuitGradient)" strokeWidth="2.5" fill="none" />
        <path d="M100 100 L120 95 L120 85" stroke="url(#circuitGradient)" strokeWidth="2.5" fill="none" />
        <path d="M100 110 L125 105 L125 95" stroke="url(#circuitGradient)" strokeWidth="2.5" fill="none" />
        
        {/* Circuit nodes */}
        <circle cx="100" cy="80" r="3" fill="#06B6D4" />
        <circle cx="85" cy="75" r="2.5" fill="#06B6D4" />
        <circle cx="115" cy="70" r="2.5" fill="#06B6D4" />
        <circle cx="80" cy="90" r="2.5" fill="#10B981" />
        <circle cx="120" cy="85" r="2.5" fill="#10B981" />
        <circle cx="75" cy="100" r="2.5" fill="#06B6D4" />
        <circle cx="125" cy="95" r="2.5" fill="#06B6D4" />
        <circle cx="100" cy="120" r="3" fill="#10B981" />
      </g>
      
      {/* Digital pixels floating around */}
      <g>
        <rect x="140" y="40" width="4" height="4" fill="#06B6D4" />
        <rect x="148" y="45" width="4" height="4" fill="#10B981" />
        <rect x="145" y="55" width="4" height="4" fill="#06B6D4" />
        <rect x="152" y="65" width="4" height="4" fill="#10B981" />
        <rect x="150" y="75" width="4" height="4" fill="#06B6D4" />
        
        {/* Left side pixels */}
        <rect x="45" y="35" width="4" height="4" fill="#06B6D4" />
        <rect x="52" y="42" width="4" height="4" fill="#10B981" />
        <rect x="48" y="52" width="4" height="4" fill="#06B6D4" />
      </g>
      
      {/* Book page lines */}
      <g opacity="0.3">
        <line x1="110" y1="70" x2="150" y2="75" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="110" y1="80" x2="145" y2="85" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="110" y1="90" x2="150" y2="95" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="110" y1="100" x2="145" y2="105" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="110" y1="110" x2="150" y2="115" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="110" y1="120" x2="145" y2="125" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="110" y1="130" x2="150" y2="135" stroke="#E2E8F0" strokeWidth="1" />
      </g>
    </svg>
  );
};

export default BookCraftLogo;