// Logo component for MyBookCrafter AI
import React from 'react';

const BookCraftLogo = ({ className = "w-8 h-8" }) => {
  return (
    <div className={`${className} bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-xl flex items-center justify-center`}>
      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6.012 3L3 12V21h18v-9L18.012 3H6.012zm1.988 0h8L18 10v9H6v-9l2-7zm3 4v2h4V7h-4zm0 3v2h4v-2h-4z"/>
      </svg>
    </div>
  );
};

export default BookCraftLogo;