import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BookWriter from './components/BookWriter';
import Credits from './components/Credits';
import PaymentSuccess from './components/PaymentSuccess';
import SEOHelmet from './components/SEOHelmet';
import { SEO_PAGES } from './hooks/useSEO';
import './App.css';

function App() {
  return (
    <HelmetProvider>
      <GoogleOAuthProvider clientId="758478706314-pn8dh4u94p8mt06qialfdigaqs5glj9s.apps.googleusercontent.com">
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/payment-success" element={
                <ProtectedRoute>
                  <SEOHelmet {...SEO_PAGES.payment_success} />
                  <PaymentSuccess />
                </ProtectedRoute>
              } />
              <Route path="/credits" element={
                <ProtectedRoute>
                  <SEOHelmet {...SEO_PAGES.credits} />
                  <Credits />
                </ProtectedRoute>
              } />
              <Route path="/" element={
                <ProtectedRoute>
                  <SEOHelmet {...SEO_PAGES.home} />
                  <BookWriter />
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </GoogleOAuthProvider>
    </HelmetProvider>
  );
}

export default App;