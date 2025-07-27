// Logo component for BookCraft AI
import React from 'react';

const BookCraftLogo = ({ className = "w-8 h-8" }) => {
  return (
    <img 
      src="/logo.png" 
      alt="BookCraft AI Logo" 
      className={`${className} object-contain`}
    />
  );
};

export default BookCraftLogo;