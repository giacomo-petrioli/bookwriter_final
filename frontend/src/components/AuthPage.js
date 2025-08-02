import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const AuthPage = ({ onBack }) => {
  const { 
    loginWithGoogle, 
    loginWithEmailPassword, 
    registerWithEmailPassword, 
    loading, 
    error,
    backendHealth 
  } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  // Clear errors when switching between sign in/sign up
  useEffect(() => {
    setLocalError('');
  }, [isSignUp]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLocalLoading(true);
      setLocalError('');
      await loginWithGoogle(credentialResponse.credential);
    } catch (error) {
      console.error('Google login failed:', error);
      setLocalError(error.message || 'Google login failed. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google login error:', error);
    setLocalError('Google login failed. Please try again.');
  };

  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    try {
      setLocalLoading(true);
      setLocalError('');
      
      if (isSignUp) {
        await registerWithEmailPassword(email, password, name);
      } else {
        await loginWithEmailPassword(email, password);
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      setLocalError(error.message || 'Authentication failed. Please try again.');
    } finally {
      setLocalLoading(false);
    }
  };

  const currentError = localError || error;
  const currentLoading = localLoading || loading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute -top-16 left-0 flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
            </svg>
            Back to Home
          </button>
        )}

        {/* Auth Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl p-8">
          {/* Backend Status */}
          {!backendHealth && (
            <div className="mb-6 p-4 bg-yellow-600/20 border border-yellow-500/50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-3"></div>
                <span className="text-yellow-200 text-sm">Connecting to server...</span>
              </div>
            </div>
          )}
          
          {/* Logo and Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.012 3L3 12V21h18v-9L18.012 3H6.012zm1.988 0h8L18 10v9H6v-9l2-7zm3 4v2h4V7h-4zm0 3v2h4v-2h-4z"/>
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white">MyBookCrafter AI</h1>
            <p className="text-gray-300 text-sm">
              Create amazing books with AI-powered writing assistance
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex mb-6 bg-slate-700/50 rounded-lg p-1">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                !isSignUp 
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                isSignUp 
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {currentError && (
            <div className="mb-4 p-3 bg-red-600/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {currentError}
            </div>
          )}

          {/* Google OAuth Login */}
          <div className="mb-6">
            <div className="flex items-center justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                disabled={currentLoading || !backendHealth}
                theme="filled_black"
                size="large"
                width="100%"
                text={isSignUp ? "signup_with" : "signin_with"}
                shape="rectangular"
                logo_alignment="left"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-slate-800 px-2 text-gray-400">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  disabled={currentLoading || !backendHealth}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={currentLoading || !backendHealth}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={currentLoading || !backendHealth}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your password"
                minLength="8"
              />
              {isSignUp && (
                <p className="text-gray-400 text-xs mt-1">
                  Password must be at least 8 characters long
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={currentLoading || !backendHealth}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Terms and Privacy */}
          {isSignUp && (
            <p className="text-center text-gray-400 text-xs mt-4">
              By creating an account, you agree to our{' '}
              <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Privacy Policy
              </a>
            </p>
          )}

          {/* Features Preview */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              What you can do with MyBookCrafter AI
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "🤖", text: "AI Writing" },
                { icon: "📚", text: "Book Templates" },
                { icon: "✏️", text: "Smart Editing" },
                { icon: "📄", text: "Export Options" }
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-gray-300">
                  <span className="text-lg">{feature.icon}</span>
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