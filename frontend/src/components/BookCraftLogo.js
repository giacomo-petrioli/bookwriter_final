// Logo component for BookCraft AI
import React from 'react';

const BookCraftLogo = ({ className = "w-8 h-8", useImage = false }) => {
  if (useImage) {
    // Use actual image file when available
    return (
      <img 
        src="/images/bookcraft-logo.png" 
        alt="BookCraft AI" 
        className={className}
        style={{ objectFit: 'contain' }}
      />
    );
  }
  
  // SVG version that matches the user's logo design more closely
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="30%" stopColor="#1E3A8A" />
          <stop offset="60%" stopColor="#0891B2" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Book Base - 3D perspective */}
      <path d="M50 60 L50 140 L100 135 L150 140 L150 60 L100 65 Z" fill="url(#bookGradient)" />
      
      {/* Book Left Side Shadow */}
      <path d="M50 60 L50 140 L100 135 L100 65 Z" fill="#0F172A" opacity="0.5" />
      
      {/* Book Right Side Highlight */}
      <path d="M100 65 L100 135 L150 140 L150 60 Z" fill="url(#circuitGradient)" opacity="0.1" />
      
      {/* Circuit Tree Design emerging from book */}
      <g filter="url(#glow)">
        {/* Main trunk */}
        <path d="M100 85 L100 100" stroke="#06B6D4" strokeWidth="3" fill="none" />
        
        {/* Branching circuit paths */}
        <path d="M100 85 L85 80 L85 70 L80 70" stroke="#06B6D4" strokeWidth="2" fill="none" />
        <path d="M100 85 L115 80 L115 70 L120 70" stroke="#06B6D4" strokeWidth="2" fill="none" />
        <path d="M100 90 L75 85 L75 75 L70 75" stroke="#10B981" strokeWidth="2" fill="none" />
        <path d="M100 90 L125 85 L125 75 L130 75" stroke="#10B981" strokeWidth="2" fill="none" />
        <path d="M100 95 L80 90 L80 80" stroke="#06B6D4" strokeWidth="2" fill="none" />
        <path d="M100 95 L120 90 L120 80" stroke="#06B6D4" strokeWidth="2" fill="none" />
        
        {/* Circuit nodes */}
        <circle cx="100" cy="85" r="2.5" fill="#06B6D4" />
        <circle cx="85" cy="70" r="2" fill="#06B6D4" />
        <circle cx="115" cy="70" r="2" fill="#06B6D4" />
        <circle cx="75" cy="75" r="2" fill="#10B981" />
        <circle cx="125" cy="75" r="2" fill="#10B981" />
        <circle cx="80" cy="80" r="2" fill="#06B6D4" />
        <circle cx="120" cy="80" r="2" fill="#06B6D4" />
        <circle cx="100" cy="100" r="2.5" fill="#10B981" />
        
        {/* End nodes */}
        <circle cx="80" cy="70" r="1.5" fill="#06B6D4" />
        <circle cx="120" cy="70" r="1.5" fill="#06B6D4" />
        <circle cx="70" cy="75" r="1.5" fill="#10B981" />
        <circle cx="130" cy="75" r="1.5" fill="#10B981" />
      </g>
      
      {/* Digital pixels floating around */}
      <g>
        <rect x="135" y="45" width="3" height="3" fill="#06B6D4" />
        <rect x="140" y="50" width="3" height="3" fill="#10B981" />
        <rect x="145" y="55" width="3" height="3" fill="#06B6D4" />
        <rect x="150" y="60" width="3" height="3" fill="#10B981" />
        
        {/* Left side pixels */}
        <rect x="45" y="45" width="3" height="3" fill="#06B6D4" />
        <rect x="40" y="50" width="3" height="3" fill="#10B981" />
        <rect x="35" y="55" width="3" height="3" fill="#06B6D4" />
      </g>
      
      {/* Book page detail lines */}
      <g opacity="0.2">
        <line x1="105" y1="70" x2="145" y2="72" stroke="#E2E8F0" strokeWidth="0.5" />
        <line x1="105" y1="75" x2="140" y2="77" stroke="#E2E8F0" strokeWidth="0.5" />
        <line x1="105" y1="80" x2="145" y2="82" stroke="#E2E8F0" strokeWidth="0.5" />
        <line x1="105" y1="110" x2="145" y2="112" stroke="#E2E8F0" strokeWidth="0.5" />
        <line x1="105" y1="115" x2="140" y2="117" stroke="#E2E8F0" strokeWidth="0.5" />
        <line x1="105" y1="120" x2="145" y2="122" stroke="#E2E8F0" strokeWidth="0.5" />
        <line x1="105" y1="125" x2="140" y2="127" stroke="#E2E8F0" strokeWidth="0.5" />
        <line x1="105" y1="130" x2="145" y2="132" stroke="#E2E8F0" strokeWidth="0.5" />
      </g>
    </svg>
  );
};

export default BookCraftLogo;