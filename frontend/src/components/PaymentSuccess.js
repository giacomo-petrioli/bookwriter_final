import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://a4a476c4-1ae3-4338-af34-da4cf0f722a1.preview.emergentagent.com';

const PaymentSuccess = () => {
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creditBalance, setCreditBalance] = useState(0);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setError('Missing payment session ID');
      setLoading(false);
    }
  }, []);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000; // 2 seconds

    if (attempts >= maxAttempts) {
      setError('Payment status check timed out. Please check your account or contact support.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_URL}/api/payments/status/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const data = response.data;
      setPaymentStatus(data);

      if (data.payment_status === 'paid') {
        setLoading(false);
        // Fetch updated credit balance
        await fetchCreditBalance();
        return;
      } else if (data.status === 'expired' || data.payment_status === 'failed') {
        setError('Payment failed or expired. Please try again.');
        setLoading(false);
        return;
      }

      // If payment is still pending, continue polling
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setError('Error checking payment status. Please try again.');
      setLoading(false);
    }
  };

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

  const handleContinue = () => {
    // Navigate back to the main app
    window.location.href = '/';
  };

  const handleBuyMore = () => {
    window.location.href = '/credits';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleBuyMore}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={handleContinue}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus && paymentStatus.payment_status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">Thank you for your purchase. Your credits have been added to your account.</p>
          
          {/* Payment Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3">Purchase Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Package:</span>
                <span className="font-medium">{paymentStatus.package_id.charAt(0).toUpperCase() + paymentStatus.package_id.slice(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Credits Added:</span>
                <span className="font-medium text-green-600">+{paymentStatus.credits_amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium">€{paymentStatus.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-gray-600">Current Balance:</span>
                <span className="font-bold text-indigo-600">{creditBalance} credits</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Continue Writing
            </button>
            <button
              onClick={handleBuyMore}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Buy More Credits
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing...</h2>
        <p className="text-gray-600">Checking payment status...</p>
      </div>
    </div>
  );
};

export default PaymentSuccess;