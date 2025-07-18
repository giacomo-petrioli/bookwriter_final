import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import BookCraftLogo from './BookCraftLogo';

const LandingPage = () => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async (credentialResponse) => {
    setIsLoading(true);
    try {
      await login(credentialResponse.credential);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookCraftLogo size="md" />
            <h1 className="text-2xl font-bold text-white">BookCraft AI</h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <BookCraftLogo size="xl" className="mx-auto mb-6" />
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Write Amazing Books with 
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"> AI</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Create professional books effortlessly with AI-powered writing assistance. 
              From outline to final draft, we help you craft compelling stories and content.
            </p>
          </div>

          {/* CTA Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-12 max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Start Writing Today</h3>
            <p className="text-gray-300 mb-6">Sign in with Google to begin your writing journey</p>
            
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => console.log('Login Failed')}
                useOneTap
                size="large"
                theme="filled_blue"
                text="signin_with"
                disabled={isLoading}
              />
            </div>
            
            {isLoading && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent mr-2"></div>
                  <span className="text-blue-300">Signing you in...</span>
                </div>
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-white text-xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI-Powered Writing</h3>
              <p className="text-gray-300">Generate outlines, chapters, and content with advanced AI assistance</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-white text-xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Multiple Formats</h3>
              <p className="text-gray-300">Export your books as PDF, DOCX, or HTML with professional formatting</p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-white text-xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Writing Styles</h3>
              <p className="text-gray-300">Choose from different writing styles to match your creative vision</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Everything You Need to Write Great Books
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <span className="text-white text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Smart Outlines</h3>
              <p className="text-gray-300">AI generates detailed outlines based on your ideas</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <span className="text-white text-2xl">🖊️</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Chapter Generation</h3>
              <p className="text-gray-300">Generate full chapters with contextual AI assistance</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <span className="text-white text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Rich Editor</h3>
              <p className="text-gray-300">Edit and refine your content with a powerful editor</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <span className="text-white text-2xl">📄</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Professional Export</h3>
              <p className="text-gray-300">Export as PDF, DOCX, or HTML with beautiful formatting</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            How BookCraft AI Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Setup Your Book</h3>
              <p className="text-gray-300">Enter your book title, description, and choose your writing style</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Generate Outline</h3>
              <p className="text-gray-300">AI creates a detailed outline with chapters and structure</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Write Chapters</h3>
              <p className="text-gray-300">Generate and edit chapters with AI assistance</p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-white text-2xl font-bold">4</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Export & Share</h3>
              <p className="text-gray-300">Download your finished book in professional formats</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <BookCraftLogo size="sm" />
            <span className="text-gray-300">BookCraft AI</span>
          </div>
          <div className="text-gray-400 text-sm">
            © 2025 BookCraft AI. Powered by cutting-edge AI technology.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;