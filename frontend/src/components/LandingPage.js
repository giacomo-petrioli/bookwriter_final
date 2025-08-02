import React, { useState } from 'react';
import AuthPage from './AuthPage';

const LandingPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleGetStarted = () => {
    setIsLoading(true);
    setShowAuth(true);
  };

  const handleBackToHome = () => {
    setShowAuth(false);
    setIsLoading(false);
  };

  if (showAuth) {
    return <AuthPage onBack={handleBackToHome} />;
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/50 animate-pulse"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
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
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Reviews</a>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Write Your
                <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"> Dream Book </span>
                with AI
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
                Transform your ideas into professional books with our cutting-edge AI writing assistant. 
                From outline to final draft, we'll guide you through every step of your writing journey.
              </p>
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
        </section>

        {/* AI Writing Demo Section */}
        <section className="relative px-6 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-slate-700/50 p-8 shadow-2xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Watch AI Create Your Story
                </h2>
                <p className="text-gray-300 text-lg">
                  See how our AI transforms your simple idea into compelling content
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Input Side */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white mb-4">Your Input:</h3>
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
                    <p className="text-gray-300">
                      "I want to write a mystery novel about a detective in Victorian London who discovers supernatural crimes."
                    </p>
                  </div>
                </div>
                
                {/* Output Side */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white mb-4">AI Generated:</h3>
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50 max-h-64 overflow-y-auto">
                    <div className="text-gray-300 text-sm space-y-2">
                      <p><strong>Chapter 1: Shadows and Gaslight</strong></p>
                      <p>Inspector Marlowe adjusted his coat against the October chill as he approached the peculiar crime scene. The gas lamps flickered strangely, casting dancing shadows that seemed to move independently of their sources...</p>
                      <p className="text-cyan-400 italic">✨ Generated in 3.2 seconds</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Everything You Need to Write
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Our AI-powered platform provides all the tools and guidance you need to create professional-quality books
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: "🤖",
                  title: "AI Story Generation",
                  description: "Advanced AI creates compelling narratives, characters, and plot developments tailored to your vision"
                },
                {
                  icon: "📝",
                  title: "Smart Outline Creator",
                  description: "Generate comprehensive book outlines with chapter breakdowns and story structure"
                },
                {
                  icon: "✏️",
                  title: "Intelligent Editor",
                  description: "Built-in editing tools with AI suggestions for grammar, style, and story improvements"
                },
                {
                  icon: "📚",
                  title: "Multiple Genres",
                  description: "Support for fiction, non-fiction, technical writing, and specialized content creation"
                },
                {
                  icon: "📄",
                  title: "Professional Export",
                  description: "Export your finished book in PDF, DOCX, and HTML formats ready for publishing"
                },
                {
                  icon: "☁️",
                  title: "Cloud Sync",
                  description: "Your work is automatically saved and accessible from any device, anywhere"
                }
              ].map((feature, index) => (
                <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 group">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="relative px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Simple 4-Step Process
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                From idea to published book in just four easy steps
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: "01",
                  title: "Share Your Idea",
                  description: "Tell us about your book concept, genre, and target audience",
                  icon: "💡"
                },
                {
                  step: "02",
                  title: "AI Creates Outline",
                  description: "Our AI generates a comprehensive outline with chapters and structure",
                  icon: "📋"
                },
                {
                  step: "03",
                  title: "Write & Edit",
                  description: "Use our AI assistant to write chapters and refine your content",
                  icon: "✍️"
                },
                {
                  step: "04",
                  title: "Export & Publish",
                  description: "Download your finished book in professional formats",
                  icon: "🚀"
                }
              ].map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">{step.icon}</span>
                  </div>
                  <div className="text-cyan-400 font-bold text-lg mb-2">Step {step.step}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="relative px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                What Writers Say About MyBookCrafter AI
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Join thousands of satisfied writers who've published their books with our platform
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Published Author",
                  avatar: "SJ",
                  testimonial: "MyBookCrafter AI transformed my writing process completely. What used to take months now takes minutes. The AI assistance is incredible!"
                },
                {
                  name: "Michael Chen",
                  role: "First-time Author", 
                  avatar: "MC",
                  testimonial: "I never thought I could write a book until I found MyBookCrafter AI. The platform guided me through every step and I published my first novel!"
                },
                {
                  name: "Emma Rodriguez",
                  role: "Content Creator",
                  avatar: "ER", 
                  testimonial: "The AI understands my writing style perfectly. It's like having a co-author who never gets tired and always has great ideas."
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold">{testimonial.avatar}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{testimonial.name}</h4>
                      <p className="text-gray-400 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-4">
                    "{testimonial.testimonial}"
                  </p>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="relative px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Start Free, Upgrade When Ready
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Begin your writing journey at no cost, then choose a plan that fits your needs
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  plan: "Free",
                  price: "$0",
                  period: "forever",
                  description: "Perfect for trying out our platform",
                  features: [
                    "1 book project",
                    "Basic AI assistance", 
                    "Standard templates",
                    "PDF export"
                  ],
                  popular: false
                },
                {
                  plan: "Writer",
                  price: "$19",
                  period: "per month", 
                  description: "For serious authors and content creators",
                  features: [
                    "Unlimited book projects",
                    "Advanced AI assistance",
                    "Premium templates", 
                    "All export formats",
                    "Priority support"
                  ],
                  popular: true
                },
                {
                  plan: "Professional",
                  price: "$49", 
                  period: "per month",
                  description: "For publishers and writing teams",
                  features: [
                    "Everything in Writer",
                    "Team collaboration",
                    "Custom AI training",
                    "API access",
                    "Dedicated support"
                  ],
                  popular: false
                }
              ].map((tier, index) => (
                <div key={index} className={`relative bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border ${tier.popular ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-700/50'} hover:border-cyan-500/50 transition-all duration-300`}>
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-2">{tier.plan}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-white">{tier.price}</span>
                      <span className="text-gray-400">/{tier.period}</span>
                    </div>
                    <p className="text-gray-300 mb-6">{tier.description}</p>
                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-gray-300">
                          <svg className="w-5 h-5 text-cyan-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${tier.popular ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white hover:from-cyan-600 hover:to-emerald-600' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                      {tier.plan === 'Free' ? 'Start Free' : 'Choose Plan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Write Your Book?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of writers who've already created amazing books with MyBookCrafter AI. 
              Start your writing journey today - it's free to get started!
            </p>
            
            <button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-xl hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mb-6"
            >
              {isLoading ? 'Setting up your account...' : 'Start Writing Free Today'}
            </button>
            
            <div className="flex items-center justify-center text-gray-400 text-sm">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              No credit card required • Start writing in seconds
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative px-6 py-12 border-t border-slate-700/50">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.012 3L3 12V21h18v-9L18.012 3H6.012zm1.988 0h8L18 10v9H6v-9l2-7zm3 4v2h4V7h-4zm0 3v2h4v-2h-4z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white">MyBookCrafter AI</h3>
                </div>
                <p className="text-gray-300 mb-4 max-w-md">
                  The most advanced AI-powered book writing platform. Create, edit, and publish professional books with cutting-edge technology.
                </p>
                <div className="text-gray-400 text-sm">
                  © 2025 MyBookCrafter AI. All rights reserved.
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Getting Started</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-gray-300">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;