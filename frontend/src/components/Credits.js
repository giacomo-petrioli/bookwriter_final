import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://a4a476c4-1ae3-4338-af34-da4cf0f722a1.preview.emergentagent.com';

const Credits = () => {
  const { user } = useAuth();
  const [creditBalance, setCreditBalance] = useState(0);
  const [packages, setPackages] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCreditBalance();
    fetchPackages();
  }, []);

  const fetchCreditBalance = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/credits/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCreditBalance(response.data.credit_balance);
    } catch (error) {
      console.error('Error fetching credit balance:', error);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/credits/packages`);
      setPackages(response.data.packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setError('Failed to load credit packages');
    }
  };

  const handlePurchase = async (packageId) => {
    if (loading) return;
    
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const originUrl = window.location.origin;

      const response = await axios.post(
        `${API_URL}/api/payments/create-session`,
        {
          package_id: packageId,
          origin_url: originUrl
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Redirect to Stripe checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error('Error creating payment session:', error);
      setError(error.response?.data?.detail || 'Failed to create payment session');
      setLoading(false);
    }
  };

  const PackageCard = ({ packageId, packageData }) => (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/15 transition-all duration-200">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">{packageData.name}</h3>
        <div className="text-3xl font-bold text-cyan-400 mb-2">
          ${packageData.price.toFixed(2)}
        </div>
        <div className="text-lg text-gray-300 mb-3">
          {packageData.credits} Credits
        </div>
        <p className="text-sm text-gray-400 mb-4">{packageData.description}</p>
        <div className="text-xs text-gray-500 mb-4">
          ${(packageData.price / packageData.credits).toFixed(2)} per credit
        </div>
        <button
          onClick={() => handlePurchase(packageId)}
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
            loading
              ? 'bg-gray-600 cursor-not-allowed text-gray-400'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
          }`}
        >
          {loading ? 'Processing...' : 'Purchase'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Purchase Credits</h1>
          <p className="text-gray-300">Choose a credit package to continue writing your books</p>
        </div>

        {/* Current Balance */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Current Balance</h2>
              <p className="text-gray-300">Your available credits for generating chapters</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-cyan-400">{creditBalance}</div>
              <div className="text-sm text-gray-400">credits</div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Credit Packages */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {Object.entries(packages).map(([packageId, packageData]) => (
            <PackageCard
              key={packageId}
              packageId={packageId}
              packageData={packageData}
            />
          ))}
        </div>

        {/* Features */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">What you get with credits:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white">AI Chapter Generation</h4>
                <p className="text-sm text-gray-300">Generate high-quality book chapters with AI</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white">Multiple Writing Styles</h4>
                <p className="text-sm text-gray-300">Story, descriptive, academic, and more</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white">Export Options</h4>
                <p className="text-sm text-gray-300">Download as HTML, PDF, or DOCX</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white">Unlimited Editing</h4>
                <p className="text-sm text-gray-300">Edit and refine your content</p>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Usage Info */}
        <div className="mt-6 bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-300">Credit Usage</h3>
              <div className="mt-2 text-sm text-blue-400">
                <p>• 1 credit = 1 chapter generation</p>
                <p>• No credit cost for editing existing chapters</p>
                <p>• No credit cost for outline generation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Credits;