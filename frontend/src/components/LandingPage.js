import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import AuthPage from './AuthPage';

const LandingPage = () => {
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthPage, setShowAuthPage] = useState(false);

  // Show AuthPage if user clicked signup button
  if (showAuthPage) {
    return <AuthPage onBack={() => setShowAuthPage(false)} />;
  }

  const handleGoogleLogin = async (credentialResponse) => {
    setIsLoading(true);
    try {
      await loginWithGoogle(credentialResponse.credential);
      // After successful login, ProtectedRoute should automatically show BookWriter
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    setShowAuthPage(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.012 3L3 12V21h18v-9L18.012 3H6.012zm1.988 0h8L18 10v9H6v-9l2-7zm3 4v2h4V7h-4zm0 3v2h4v-2h-4z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">MyBookCrafter AI</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Reviews</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Create Your
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"> Dream Book</span>
              <br />with AI Power
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform your ideas into professionally written books. AI-powered writing assistant that helps you create, 
              edit, and publish amazing content in multiple languages and styles.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? 'Setting up...' : 'Start Writing Free'}
              </button>
              <div className="flex items-center text-gray-400 text-sm">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                No credit card required
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">10+</div>
              <div className="text-gray-300">Languages</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">9</div>
              <div className="text-gray-300">Writing Styles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">3</div>
              <div className="text-gray-300">Export Formats</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">∞</div>
              <div className="text-gray-300">Possibilities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Powerful Features for Every Writer
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to write, edit, and publish professional books with AI assistance
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Writing Assistant */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">AI Writing Assistant</h3>
              <p className="text-gray-300 mb-4">Powered by advanced Gemini AI technology to generate compelling content, outlines, and chapters tailored to your style and vision.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">Smart Outlines</span>
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">Chapter Generation</span>
              </div>
            </div>

            {/* Multi-Language Support */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Multi-Language Support</h3>
              <p className="text-gray-300 mb-4">Write in over 10 languages including English, Spanish, French, German, Italian, and more with native-level AI assistance.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">English</span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">Spanish</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">Italian</span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm">+7 More</span>
              </div>
            </div>

            {/* Writing Styles */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Multiple Writing Styles</h3>
              <p className="text-gray-300 mb-4">Choose from 9 different writing styles to match your book's genre and audience perfectly.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Story</span>
                <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm">Academic</span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">Business</span>
                <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm">+6 More</span>
              </div>
            </div>

            {/* Rich Text Editor */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Rich Text Editor</h3>
              <p className="text-gray-300 mb-4">Professional editing interface with formatting tools, real-time preview, and seamless chapter navigation.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">Live Preview</span>
                <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">Auto-Save</span>
              </div>
            </div>

            {/* Professional Export */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Professional Export</h3>
              <p className="text-gray-300 mb-4">Export your finished books in multiple formats with beautiful, professional formatting and table of contents.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">PDF</span>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">DOCX</span>
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">HTML</span>
              </div>
            </div>

            {/* Credit System */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Flexible Credit System</h3>
              <p className="text-gray-300 mb-4">Pay only for what you use with our transparent credit system. 1 credit = 1 chapter generation. Free outline generation.</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">Pay As You Go</span>
                <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-sm">No Subscription</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              From Idea to Published Book in 4 Simple Steps
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Our streamlined process makes book creation effortless and enjoyable
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-3xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Setup Your Project</h3>
              <p className="text-gray-300 mb-4">Enter your book details: title, description, target pages, chapters, language, and writing style.</p>
              <div className="text-sm text-blue-300">• 10+ Languages • 9 Writing Styles</div>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-3xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Generates Outline</h3>
              <p className="text-gray-300 mb-4">Our AI creates a comprehensive chapter-by-chapter outline based on your specifications.</p>
              <div className="text-sm text-green-300">• Free Outline Generation • Fully Editable</div>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-3xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Write & Edit Chapters</h3>
              <p className="text-gray-300 mb-4">Generate individual chapters or all at once, then edit and refine using our rich text editor.</p>
              <div className="text-sm text-purple-300">• 1 Credit per Chapter • Unlimited Editing</div>
            </div>

            <div className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-3xl font-bold">4</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Export & Publish</h3>
              <p className="text-gray-300 mb-4">Download your finished book in professional formats ready for publishing or sharing.</p>
              <div className="text-sm text-orange-300">• PDF • DOCX • HTML</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Pay only for what you use. No hidden fees, no subscriptions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Small Package</h3>
                <div className="text-3xl font-bold text-cyan-400 mb-2">$9.99</div>
                <div className="text-lg text-gray-300 mb-4">10 Credits</div>
                <div className="text-sm text-gray-400 mb-6">$1.00 per credit</div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Generate 10 chapters
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Perfect for short books
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl border border-purple-400/30 p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Medium Package</h3>
                <div className="text-3xl font-bold text-purple-400 mb-2">$19.99</div>
                <div className="text-lg text-gray-300 mb-4">25 Credits</div>
                <div className="text-sm text-gray-400 mb-6">$0.80 per credit</div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Generate 25 chapters
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Best value for most books
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/10 transition-all duration-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Large Package</h3>
                <div className="text-3xl font-bold text-emerald-400 mb-2">$49.99</div>
                <div className="text-lg text-gray-300 mb-4">100 Credits</div>
                <div className="text-sm text-gray-400 mb-6">$0.50 per credit</div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Generate 100 chapters
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Most convenient for large projects
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-6 max-w-2xl mx-auto">
              <h4 className="text-lg font-semibold text-blue-300 mb-2">What's Always Free</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-400">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Outline generation
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Unlimited editing
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Project management
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Export in all formats
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              What Writers Say About BookCraft AI
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Join thousands of satisfied writers who've published their books with our platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">SM</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Sarah Miller</h4>
                  <p className="text-gray-400 text-sm">Fiction Author</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                "BookCraft AI transformed my writing process completely. What used to take months now takes minutes. The AI assistance is incredible!"
              </p>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">JD</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">John Davidson</h4>
                  <p className="text-gray-400 text-sm">Business Author</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                "The multi-language support helped me publish my business book in 3 different languages. Professional results every time."
              </p>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">ER</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Emma Rodriguez</h4>
                  <p className="text-gray-400 text-sm">Academic Writer</p>
                </div>
              </div>
              <p className="text-gray-300 mb-4">
                "The different writing styles feature is amazing. I've used it for academic papers, stories, and even children's books!"
              </p>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Write Your Book?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of writers who've already created amazing books with BookCraft AI. 
            Start your writing journey today - it's free to get started!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? 'Setting up...' : 'Start Writing Your Book Free'}
            </button>
          </div>
          
          <div className="mt-8 flex justify-center items-center space-x-8 text-gray-400">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Free to start
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              No credit card required
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              Start writing in minutes
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.012 3L3 12V21h18v-9L18.012 3H6.012zm1.988 0h8L18 10v9H6v-9l2-7zm3 4v2h4V7h-4zm0 3v2h4v-2h-4z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">BookCraft AI</h3>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
                The most advanced AI-powered book writing platform. Create, edit, and publish professional books with cutting-edge technology.
              </p>
              <div className="text-gray-400 text-sm">
                © 2025 BookCraft AI. All rights reserved.
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <div className="space-y-2 text-gray-300 text-sm">
                <div>AI Writing Assistant</div>
                <div>Multi-Language Support</div>
                <div>Professional Export</div>
                <div>Rich Text Editor</div>
                <div>Credit System</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;