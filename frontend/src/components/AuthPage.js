import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BookCraftLogo from './BookCraftLogo';

const AuthPage = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for session ID in URL on component mount
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('session_id=')) {
        const sessionId = hash.split('session_id=')[1];
        if (sessionId) {
          try {
            setLoading(true);
            await login(sessionId);
            // Clear the hash from URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch (error) {
            setError('Authentication failed. Please try again.');
            console.error('Auth callback error:', error);
          } finally {
            setLoading(false);
          }
        }
      }
    };

    handleAuthCallback();
  }, [login]);

  const handleLogin = () => {
    setLoading(true);
    setError('');
    
    // Redirect to Emergent auth with current URL as redirect parameter
    const redirectUrl = encodeURIComponent(window.location.origin);
    window.location.href = `https://auth.emergentagent.com/?redirect=${redirectUrl}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-2xl">
          {/* Logo and Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <BookCraftLogo className="w-16 h-16 mr-3" />
              <h1 className="text-3xl font-bold text-white">BookCraft AI</h1>
            </div>
            <p className="text-gray-300 text-sm">
              Create amazing books with AI-powered writing assistance
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Login Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white text-center mb-6">
              Welcome Back
            </h2>
            
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold text-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : (
                "Sign In / Sign Up"
              )}
            </button>

            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Secure authentication powered by Emergent
              </p>
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              What you can do with BookCraft AI
            </h3>
            <div className="space-y-3">
              {[
                { icon: "🤖", text: "AI-powered content generation" },
                { icon: "📚", text: "Multiple writing styles" },
                { icon: "🌍", text: "Multi-language support" },
                { icon: "📄", text: "Professional PDF & DOCX export" }
              ].map((feature, index) => (
                <div key={index} className="flex items-center text-gray-300">
                  <span className="text-xl mr-3">{feature.icon}</span>
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;