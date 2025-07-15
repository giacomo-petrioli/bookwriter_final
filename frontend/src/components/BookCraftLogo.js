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
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="30%" stopColor="#3B82F6" />
          <stop offset="60%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id="circuitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="strongGlow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Book Base - 3D perspective with enhanced colors */}
      <path d="M50 60 L50 140 L100 135 L150 140 L150 60 L100 65 Z" fill="url(#bookGradient)" filter="url(#glow)" />
      
      {/* Book Left Side Shadow - more pronounced */}
      <path d="M50 60 L50 140 L100 135 L100 65 Z" fill="#1E3A8A" opacity="0.7" />
      
      {/* Book Right Side Highlight - brighter */}
      <path d="M100 65 L100 135 L150 140 L150 60 Z" fill="url(#circuitGradient)" opacity="0.3" />
      
      {/* Circuit Tree Design emerging from book - enhanced glow */}
      <g filter="url(#strongGlow)">
        {/* Main trunk - thicker */}
        <path d="M100 85 L100 100" stroke="#06B6D4" strokeWidth="4" fill="none" />
        
        {/* Branching circuit paths - more vibrant */}
        <path d="M100 85 L85 80 L85 70 L80 70" stroke="#3B82F6" strokeWidth="3" fill="none" />
        <path d="M100 85 L115 80 L115 70 L120 70" stroke="#3B82F6" strokeWidth="3" fill="none" />
        <path d="M100 90 L75 85 L75 75 L70 75" stroke="#10B981" strokeWidth="3" fill="none" />
        <path d="M100 90 L125 85 L125 75 L130 75" stroke="#10B981" strokeWidth="3" fill="none" />
        <path d="M100 95 L80 90 L80 80" stroke="#06B6D4" strokeWidth="3" fill="none" />
        <path d="M100 95 L120 90 L120 80" stroke="#06B6D4" strokeWidth="3" fill="none" />
        
        {/* Circuit nodes - larger and brighter */}
        <circle cx="100" cy="85" r="3.5" fill="#06B6D4" />
        <circle cx="85" cy="70" r="3" fill="#3B82F6" />
        <circle cx="115" cy="70" r="3" fill="#3B82F6" />
        <circle cx="75" cy="75" r="3" fill="#10B981" />
        <circle cx="125" cy="75" r="3" fill="#10B981" />
        <circle cx="80" cy="80" r="3" fill="#06B6D4" />
        <circle cx="120" cy="80" r="3" fill="#06B6D4" />
        <circle cx="100" cy="100" r="3.5" fill="#10B981" />
        
        {/* End nodes - brighter */}
        <circle cx="80" cy="70" r="2.5" fill="#3B82F6" />
        <circle cx="120" cy="70" r="2.5" fill="#3B82F6" />
        <circle cx="70" cy="75" r="2.5" fill="#10B981" />
        <circle cx="130" cy="75" r="2.5" fill="#10B981" />
      </g>
      
      {/* Digital pixels floating around - brighter and more prominent */}
      <g filter="url(#glow)">
        <rect x="135" y="45" width="4" height="4" fill="#06B6D4" />
        <rect x="140" y="50" width="4" height="4" fill="#10B981" />
        <rect x="145" y="55" width="4" height="4" fill="#3B82F6" />
        <rect x="150" y="60" width="4" height="4" fill="#10B981" />
        
        {/* Left side pixels */}
        <rect x="45" y="45" width="4" height="4" fill="#06B6D4" />
        <rect x="40" y="50" width="4" height="4" fill="#10B981" />
        <rect x="35" y="55" width="4" height="4" fill="#3B82F6" />
      </g>
      
      {/* Book page detail lines - more visible */}
      <g opacity="0.4">
        <line x1="105" y1="70" x2="145" y2="72" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="105" y1="75" x2="140" y2="77" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="105" y1="80" x2="145" y2="82" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="105" y1="110" x2="145" y2="112" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="105" y1="115" x2="140" y2="117" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="105" y1="120" x2="145" y2="122" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="105" y1="125" x2="140" y2="127" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="105" y1="130" x2="145" y2="132" stroke="#E2E8F0" strokeWidth="1" />
      </g>
    </svg>
  );
};

export default BookCraftLogo;