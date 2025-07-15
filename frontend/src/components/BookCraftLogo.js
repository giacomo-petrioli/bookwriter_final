// Logo component for BookCraft AI
import React from 'react';

const BookCraftLogo = ({ className = "w-8 h-8" }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="30%" stopColor="#1E40AF" />
        <stop offset="70%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
    </defs>
    
    {/* Book shape */}
    <path d="M20 25 L20 75 L50 70 L80 75 L80 25 L50 30 Z" fill="url(#bookGradient)" />
    
    {/* Book spine */}
    <path d="M20 25 L20 75 L50 70 L50 30 Z" fill="#0F172A" opacity="0.3" />
    
    {/* Digital circuit lines */}
    <path d="M35 40 L45 40 L45 35 L55 35" stroke="#06B6D4" strokeWidth="2" fill="none" />
    <path d="M35 50 L40 50 L40 45 L50 45" stroke="#06B6D4" strokeWidth="2" fill="none" />
    <path d="M35 60 L42 60 L42 55 L52 55" stroke="#06B6D4" strokeWidth="2" fill="none" />
    
    {/* Circuit nodes */}
    <circle cx="35" cy="40" r="2" fill="#06B6D4" />
    <circle cx="55" cy="35" r="2" fill="#06B6D4" />
    <circle cx="35" cy="50" r="2" fill="#06B6D4" />
    <circle cx="50" cy="45" r="2" fill="#06B6D4" />
    <circle cx="35" cy="60" r="2" fill="#06B6D4" />
    <circle cx="52" cy="55" r="2" fill="#06B6D4" />
    
    {/* Digital pixels */}
    <rect x="70" y="30" width="3" height="3" fill="#06B6D4" />
    <rect x="75" y="32" width="3" height="3" fill="#10B981" />
    <rect x="72" y="37" width="3" height="3" fill="#06B6D4" />
    <rect x="77" y="40" width="3" height="3" fill="#10B981" />
  </svg>
);

export default BookCraftLogo;