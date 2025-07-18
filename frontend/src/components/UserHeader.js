import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const UserHeader = ({ children }) => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 p-6">
      <div className="container mx-auto flex justify-between items-center">
        {/* Professional Brand - No Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">BC</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BookCraft AI</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {children}
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 px-4 py-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl text-white hover:bg-slate-700/50 transition-all duration-300"
            >
              {user?.picture ? (
                <img 
                  src={user.picture} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium">{user?.name || 'User'}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700/50 shadow-xl">
                <div className="p-4 border-b border-slate-700/50">
                  <p className="text-white font-semibold">{user?.name}</p>
                  <p className="text-gray-400 text-sm">{user?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                  >
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default UserHeader;