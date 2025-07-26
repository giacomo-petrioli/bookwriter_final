import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from '../context/AuthContext';
import UserHeader from './UserHeader';
import BookCreationForm from './BookCreationForm';

// Configure axios timeout
axios.defaults.timeout = 120000; // 2 minutes timeout for individual requests
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BACKEND_URL = 'https://bc34adc4-cefc-4873-aff9-a3a535069d2f.preview.emergentagent.com';
const API = `${BACKEND_URL}/api`;

const BookWriter = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentStep, setCurrentStep] = useState(1);
  const [projects, setProjects] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [creditBalance, setCreditBalance] = useState(null);
  const [bookCost, setBookCost] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);

  // Utility function for authenticated API calls
  const makeAuthenticatedRequest = async (method, url, data = null, options = {}) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      logout();
      throw new Error('No authentication token found');
    }
    
    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: options.timeout || 60000,
      ...options
    };
    
    if (data) {
      config.data = data;
    }
    
    try {
      return await axios(config);
    } catch (error) {
      if (error.response?.status === 401) {
        console.error("Authentication failed - redirecting to login");
        logout();
      }
      throw error;
    }
  };
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pages: 100,
    chapters: 10,
    language: "English",
    writing_style: "story"
  });
  const [outline, setOutline] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [allChapters, setAllChapters] = useState({});
  const [generatingAllChapters, setGeneratingAllChapters] = useState(false);
  const [generatingChapterNum, setGeneratingChapterNum] = useState(0);
  const [chapterProgress, setChapterProgress] = useState({});
  const [savingChapter, setSavingChapter] = useState(false);
  const [exportingBook, setExportingBook] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isEditingOutline, setIsEditingOutline] = useState(false);
  const [editableOutline, setEditableOutline] = useState("");
  const [savingOutline, setSavingOutline] = useState(false);

  // Load projects and stats on component mount
  useEffect(() => {
    if (user) {
      loadProjects();
      loadUserStats();
      // Calculate initial book cost with default form values
      calculateBookCost(formData.pages, formData.chapters);
    }

    // Cleanup function to clear any pending cost calculation timeouts
    return () => {
      if (window.bookCostTimeout) {
        clearTimeout(window.bookCostTimeout);
      }
    };
  }, [user]);



  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('GET', `${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      setStatsLoading(true);
      const response = await makeAuthenticatedRequest('GET', `${API}/user/stats`);
      setUserStats(response.data);
      // Update credit balance from user stats
      if (response.data.credit_balance !== undefined) {
        setCreditBalance(response.data.credit_balance);
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const refreshCreditBalance = async () => {
    try {
      const response = await axios.get(`${API}/credits/balance`);
      setCreditBalance(response.data.credit_balance);
    } catch (error) {
      console.error("Error loading credit balance:", error);
    }
  };

  const calculateBookCost = async (pages, chapters) => {
    try {
      const response = await axios.post(`${API}/credits/calculate-book-cost`, {
        pages: pages,
        chapters: chapters
      });
      setBookCost(response.data);
      return response.data;
    } catch (error) {
      console.error("Error calculating book cost:", error);
      return null;
    }
  };




  const handleFormSubmitDirect = useCallback(async (formDataToSubmit) => {
    if (!formDataToSubmit.title || !formDataToSubmit.description) return;

    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('POST', `${API}/projects`, formDataToSubmit);
      setCurrentProject(response.data);
      setFormData(formDataToSubmit); // Update parent state
      
      // Immediately start outline generation after project creation
      const project = response.data;
      try {
        const outlineResponse = await makeAuthenticatedRequest('POST', `${API}/generate-outline`, {
          project_id: project.id
        }, {
          timeout: 120000 // 2 minutes timeout for outline generation
        });
        setOutline(outlineResponse.data.outline);
        setCurrentStep(3); // Go directly to outline review
      } catch (outlineError) {
        console.error("Error generating outline:", outlineError);
        // If outline generation fails, go to step 2 with manual generation option
        setCurrentStep(2);
      }
      
      setCurrentView('writing');
      await loadProjects();
      await loadUserStats(); // Refresh stats
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFormSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('POST', `${API}/projects`, formData);
      setCurrentProject(response.data);
      
      // Immediately start outline generation after project creation
      const project = response.data;
      try {
        const outlineResponse = await makeAuthenticatedRequest('POST', `${API}/generate-outline`, {
          project_id: project.id
        }, {
          timeout: 120000 // 2 minutes timeout for outline generation
        });
        setOutline(outlineResponse.data.outline);
        setCurrentStep(3); // Go directly to outline review
      } catch (outlineError) {
        console.error("Error generating outline:", outlineError);
        // If outline generation fails, go to step 2 with manual generation option
        setCurrentStep(2);
      }
      
      setCurrentView('writing');
      await loadProjects();
      await loadUserStats(); // Refresh stats
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setLoading(false);
    }
  }, [formData]);

  const handleFormCancel = useCallback(() => {
    setCurrentView('dashboard');
  }, []);

  const loadProject = async (projectId) => {
    try {
      setLoading(true);
      const response = await makeAuthenticatedRequest('GET', `${API}/projects/${projectId}`);
      setCurrentProject(response.data);
      setOutline(response.data.outline || "");
      setAllChapters(response.data.chapters_content || {});
      setCurrentStep(4); // Go directly to writing interface
      setCurrentView('writing');
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAllChapters = async () => {
    if (!currentProject || !outline) return;

    // Check if user has sufficient credits before starting
    const totalChapters = currentProject.chapters;
    if (creditBalance !== null && creditBalance < totalChapters) {
      alert(`Insufficient credits. You need ${totalChapters} credits to generate all chapters but have ${creditBalance}. Please purchase more credits or generate chapters individually.`);
      return;
    }

    setGeneratingAllChapters(true);
    setGeneratingChapterNum(0);
    setChapterProgress({});

    try {
      const newChapters = {};
      let creditsUsed = 0;
      let currentBalance = creditBalance;

      for (let i = 1; i <= totalChapters; i++) {
        setGeneratingChapterNum(i);
        setChapterProgress(prev => ({
          ...prev,
          [i]: { status: 'generating', progress: 0 }
        }));

        try {
          const response = await axios.post(`${API}/generate-chapter`, {
            project_id: currentProject.id,
            chapter_number: i
          });

          newChapters[i] = response.data.chapter_content;
          setChapterProgress(prev => ({
            ...prev,
            [i]: { status: 'completed', progress: 100 }
          }));

          // Update credit tracking
          if (response.data.credit_cost) {
            creditsUsed += response.data.credit_cost;
          }
          if (response.data.remaining_credits !== undefined) {
            currentBalance = response.data.remaining_credits;
            setCreditBalance(currentBalance);
          }
        } catch (error) {
          console.error(`Error generating chapter ${i}:`, error);
          setChapterProgress(prev => ({
            ...prev,
            [i]: { status: 'error', progress: 0 }
          }));

          // Handle credit-related errors
          if (error.response?.status === 402) {
            alert(`Insufficient credits for chapter ${i}: ${error.response.data.detail}`);
            break; // Stop generating if we run out of credits
          }
        }
      }

      setAllChapters(newChapters);
      // Don't change step or view - stay on current page
      const successfulChapters = Object.keys(newChapters).length;
      console.log(`Successfully generated ${successfulChapters} chapters. Credits used: ${creditsUsed}`);
      
      if (successfulChapters > 0) {
        alert(`Successfully generated ${successfulChapters} chapter(s). Credits used: ${creditsUsed}. Remaining credits: ${currentBalance}`);
      }
    } catch (error) {
      console.error("Error generating chapters:", error);
    } finally {
      setGeneratingAllChapters(false);
      setGeneratingChapterNum(0);
    }
  };

  const getWritingStyleDisplay = (style) => {
    const styles = {
      story: "Story",
      descriptive: "Descriptive",
      academic: "Academic",
      technical: "Technical",
      biography: "Biography",
      self_help: "Self-Help",
      children: "Children's",
      poetry: "Poetry",
      business: "Business"
    };
    return styles[style] || style;
  };

  const editBook = () => {
    setCurrentStep(1);
    setCurrentView('writing');
  };

  // Modern Professional Dashboard Component
  const Dashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <UserHeader>
      </UserHeader>
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-gray-300 text-lg">Ready to create your next masterpiece?</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg">
                  <div className="animate-pulse">
                    <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-white/20 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/15 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Total Books</p>
                      <p className="text-2xl font-bold text-white">{userStats?.total_books || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📚</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/15 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Chapters Written</p>
                      <p className="text-2xl font-bold text-white">{userStats?.total_chapters || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📝</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/15 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Words Written</p>
                      <p className="text-2xl font-bold text-white">{userStats?.total_words?.toLocaleString() || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">✍️</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/15 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">Recent Activity</p>
                      <p className="text-2xl font-bold text-white">{userStats?.recent_activity || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🔥</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Create New Book - Left Column */}
            <div className="lg:col-span-2">
              <BookCreationForm
                onSubmit={handleFormSubmitDirect}
                loading={loading}
                initialData={formData}
              />
            </div>

            {/* Right Sidebar - Platform Info */}
            <div className="space-y-6">
              {/* AI Capabilities */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white">🤖</span>
                  </span>
                  AI Capabilities
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Advanced AI Model</p>
                      <p className="text-xs text-gray-300">Powered by cutting-edge technology</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Multi-language Support</p>
                      <p className="text-xs text-gray-300">10+ languages available</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Professional Export</p>
                      <p className="text-xs text-gray-300">PDF, DOCX, and HTML formats</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credits Section */}
              <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl border border-indigo-400/30 p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                  </span>
                  Credits
                </h3>
                
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-indigo-300 mb-1">
                    {creditBalance !== null ? creditBalance : (userStats?.credit_balance ?? '—')}
                  </div>
                  <p className="text-sm text-gray-300">Available Credits</p>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Cost per chapter:</span>
                    <span className="font-medium text-white">1 credit</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Outline generation:</span>
                    <span className="font-medium text-green-400">Free</span>
                  </div>
                </div>

                <button 
                  onClick={() => window.location.href = '/credits'}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2 px-4 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 font-medium"
                >
                  Buy More Credits
                </button>
              </div>

              {/* User Progress */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white">📊</span>
                  </span>
                  Your Progress
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-300">Writing Streak</span>
                      <span className="text-sm text-gray-400">{userStats?.recent_activity || 0} days</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(((userStats?.recent_activity || 0) / 30) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-300">Average Words/Chapter</span>
                      <span className="text-sm text-gray-400">{userStats?.avg_words_per_chapter || 0}</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(((userStats?.avg_words_per_chapter || 0) / 3000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/20">
                    <p className="text-xs text-gray-400">
                      Member since {userStats?.user_since || 'Recently'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tips & Features */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl border border-purple-400/30 p-6 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white">💡</span>
                  </span>
                  Pro Tips
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-400 mt-1">•</span>
                    <p className="text-sm text-gray-300">Use detailed descriptions for better AI-generated content</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-400 mt-1">•</span>
                    <p className="text-sm text-gray-300">Edit and refine AI-generated chapters for your unique voice</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-400 mt-1">•</span>
                    <p className="text-sm text-gray-300">Export your book in multiple formats for different uses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Books Section */}
          {projects.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-gray-300">📚</span>
                </span>
                Your Books ({projects.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg hover:bg-white/15 transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white line-clamp-1">{project.title}</h4>
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-300">{project.chapters}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-4 text-sm line-clamp-2">{project.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                        {project.pages} pages
                      </span>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                        {project.chapters} chapters
                      </span>
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">
                        {getWritingStyleDisplay(project.writing_style)}
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => loadProject(project.id)}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
                      >
                        Load Project
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Comprehensive Writing Interface with Multi-Step Workflow
  const WritingInterface = () => {
    const [editableOutline, setEditableOutline] = useState(outline || "");
    const [editingOutline, setEditingOutline] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState(1);
    const [editableChapter, setEditableChapter] = useState("");
    const [savingChapter, setSavingChapter] = useState(false);
    const [generatingOutline, setGeneratingOutline] = useState(false);
    const [generatingChapter, setGeneratingChapter] = useState(false);

    // Load chapter content when selectedChapter changes
    useEffect(() => {
      if (allChapters && allChapters[selectedChapter]) {
        setEditableChapter(allChapters[selectedChapter]);
      } else {
        setEditableChapter("");
      }
    }, [selectedChapter, allChapters]);

    const generateOutline = async () => {
      if (!currentProject) return;

      setGeneratingOutline(true);
      try {
        const response = await makeAuthenticatedRequest('POST', `${API}/generate-outline`, {
          project_id: currentProject.id
        }, {
          timeout: 120000 // 2 minutes timeout for outline generation
        });
        setOutline(response.data.outline);
        setCurrentStep(3);
      } catch (error) {
        console.error("Error generating outline:", error);
        if (error.response?.data?.detail) {
          console.error("API Error:", error.response.data.detail);
        }
      } finally {
        setGeneratingOutline(false);
      }
    };

    const updateOutline = async () => {
      if (!currentProject) return;

      setSavingOutline(true);
      try {
        await axios.put(`${API}/update-outline`, {
          project_id: currentProject.id,
          outline: editableOutline
        });
        setOutline(editableOutline);
        setEditingOutline(false);
      } catch (error) {
        console.error("Error updating outline:", error);
      } finally {
        setSavingOutline(false);
      }
    };

    const generateChapter = async (chapterNumber) => {
      if (!currentProject) return;

      setGeneratingChapter(true);
      try {
        const response = await axios.post(`${API}/generate-chapter`, {
          project_id: currentProject.id,
          chapter_number: chapterNumber
        });

        const newChapter = response.data.chapter_content;
        setAllChapters(prev => ({
          ...prev,
          [chapterNumber]: newChapter
        }));
        setEditableChapter(newChapter);

        // Update credit balance if provided
        if (response.data.remaining_credits !== undefined) {
          setCreditBalance(response.data.remaining_credits);
        }
      } catch (error) {
        console.error("Error generating chapter:", error);
        if (error.response?.status === 402) {
          alert(`Insufficient credits: ${error.response.data.detail}`);
        }
      } finally {
        setGeneratingChapter(false);
      }
    };

    const saveChapter = async () => {
      if (!currentProject || !editableChapter) return;

      setSavingChapter(true);
      try {
        await makeAuthenticatedRequest('PUT', `${API}/update-chapter`, {
          project_id: currentProject.id,
          chapter_number: selectedChapter,
          content: editableChapter
        });

        setAllChapters(prev => ({
          ...prev,
          [selectedChapter]: editableChapter
        }));
        
        // Show success message
        console.log("Chapter saved successfully!");
      } catch (error) {
        console.error("Error saving chapter:", error);
        alert("Failed to save chapter. Please try again.");
      } finally {
        setSavingChapter(false);
      }
    };

    const exportBook = async (format) => {
      if (!currentProject) return;

      setExportingBook(true);
      try {
        const response = await makeAuthenticatedRequest('GET', `${API}/export-book${format === 'html' ? '' : `-${format}`}/${currentProject.id}`, null, {
          responseType: format === 'html' ? 'json' : 'blob'
        });

        if (format === 'html') {
          // Backend returns 'html' field, not 'html_content'
          const blob = new Blob([response.data.html], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = response.data.filename || `${currentProject.title}.html`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `${currentProject.title}.${format}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
        
        alert(`Successfully exported as ${format.toUpperCase()}!`);
      } catch (error) {
        console.error(`Error exporting as ${format}:`, error);
        alert(`Failed to export as ${format.toUpperCase()}. Please try again.`);
      } finally {
        setExportingBook(false);
      }
    };

    const renderProgressSteps = () => (
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[
          { step: 1, label: "Setup", icon: "⚙️" },
          { step: 2, label: "Details", icon: "📝" },
          { step: 3, label: "Outline", icon: "📋" },
          { step: 4, label: "Writing", icon: "✍️" }
        ].map(({ step, label, icon }, index) => (
          <React.Fragment key={step}>
            <div className={`flex items-center space-x-2 ${currentStep >= step ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step ? 'bg-green-500 text-white' : 'bg-white/20 text-gray-400'
              }`}>
                {currentStep > step ? '✓' : icon}
              </div>
              <span className="text-sm font-medium whitespace-nowrap">{label}</span>
            </div>
            {index < 3 && (
              <div className={`w-20 h-0.5 ${currentStep > step ? 'bg-green-400' : 'bg-white/20'}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    );

    // Step 1-2: Show loading for outline generation or manual generation option
    if (currentStep <= 2) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <UserHeader>
            <span className="text-white font-medium">Project Setup</span>
          </UserHeader>
          
          <div className="container mx-auto px-6 py-8">
            <div className="max-w-4xl mx-auto">
              {renderProgressSteps()}
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 shadow-lg">
                {generatingOutline ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⏳</div>
                    <h2 className="text-2xl font-bold text-white mb-4">Generating Your Book Outline</h2>
                    <p className="text-gray-300 mb-6">Please wait while we create a comprehensive outline for your book...</p>
                    <div className="w-full bg-white/20 rounded-full h-2 max-w-md mx-auto">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h2 className="text-2xl font-bold text-white mb-4">Ready to Generate Outline</h2>
                    <p className="text-gray-300 mb-6">Click below to generate a comprehensive outline for your book.</p>
                    <button
                      onClick={generateOutline}
                      disabled={generatingOutline}
                      className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
                    >
                      {generatingOutline ? "Generating..." : "Generate Outline"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Step 3: Outline Review
    if (currentStep === 3) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <UserHeader>
            <span className="text-white font-medium">Outline Review</span>
          </UserHeader>
          
          <div className="container mx-auto px-6 py-8">
            <div className="max-w-4xl mx-auto">
              {renderProgressSteps()}
              
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Book Outline</h2>
                  <div className="flex gap-3">
                    {editingOutline ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingOutline(false);
                            setEditableOutline(outline);
                          }}
                          className="px-4 py-2 border border-white/30 text-gray-300 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={updateOutline}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Save Changes
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingOutline(true);
                          setEditableOutline(outline);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Edit Outline
                      </button>
                    )}
                  </div>
                </div>
                
                {editingOutline ? (
                  <div className="mb-6 writing-interface">
                    <ReactQuill
                      value={editableOutline}
                      onChange={setEditableOutline}
                      style={{ height: '400px' }}
                      theme="snow"
                      modules={{
                        toolbar: [
                          [{ 'header': [1, 2, 3, false] }],
                          ['bold', 'italic', 'underline'],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['clean']
                        ],
                      }}
                    />
                  </div>
                ) : (
                  <div 
                    className="prose max-w-none mb-6 p-4 bg-white/5 rounded-lg border border-white/20 text-gray-300"
                    dangerouslySetInnerHTML={{ __html: outline }}
                  />
                )}
                
                  <div className="flex gap-3 mt-8">
                    <button
                      onClick={generateOutline}
                      disabled={generatingOutline || generatingAllChapters}
                      className="px-6 py-3 border border-purple-400 text-purple-400 rounded-xl hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                    >
                      {generatingOutline ? "Regenerating..." : "Regenerate Outline"}
                    </button>
                    
                    <button
                      onClick={generateAllChapters}
                      disabled={generatingAllChapters || !outline}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50"
                    >
                      {generatingAllChapters ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                          Generating Chapter {generatingChapterNum}...
                        </div>
                      ) : (
                        "Generate All Chapters"
                      )}
                    </button>
                  </div>
                  
                  {/* Chapter Generation Progress */}
                  {generatingAllChapters && (
                    <div className="mt-6 p-4 bg-blue-500/20 rounded-xl border border-blue-400/30">
                      <h4 className="text-lg font-semibold text-blue-300 mb-4">
                        Generating Chapters ({Object.keys(chapterProgress).filter(key => chapterProgress[key].status === 'completed').length}/{currentProject?.chapters || 0})
                      </h4>
                      <div className="space-y-3">
                        {Array.from({ length: currentProject?.chapters || 0 }, (_, i) => i + 1).map(chapterNum => {
                          const progress = chapterProgress[chapterNum];
                          return (
                            <div key={chapterNum} className="flex items-center">
                              <span className="w-20 text-sm text-blue-300">Chapter {chapterNum}</span>
                              <div className="flex-1 mx-3">
                                <div className="w-full bg-blue-800/50 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      progress?.status === 'completed' ? 'bg-green-500' :
                                      progress?.status === 'generating' ? 'bg-blue-500' :
                                      progress?.status === 'error' ? 'bg-red-500' : 'bg-gray-600'
                                    }`}
                                    style={{ width: progress?.progress ? `${progress.progress}%` : '0%' }}
                                  ></div>
                                </div>
                              </div>
                              <span className="text-xs text-blue-300 w-16">
                                {progress?.status === 'completed' ? '✓ Done' :
                                 progress?.status === 'generating' ? 'Writing...' :
                                 progress?.status === 'error' ? '✗ Error' : 'Waiting'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Success message and navigation after generation */}
                  {!generatingAllChapters && allChapters && Object.keys(allChapters).length > 0 && (
                    <div className="mt-6 p-4 bg-green-500/20 rounded-xl border border-green-400/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-green-300 mb-2">
                            ✅ All Chapters Generated Successfully!
                          </h4>
                          <p className="text-green-400">
                            {Object.keys(allChapters).length} chapters have been generated and are ready for editing.
                          </p>
                        </div>
                        <button
                          onClick={() => setCurrentStep(4)}
                          className="px-6 py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors"
                        >
                          Go to Writing Interface
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Step 4: Writing and Editing Interface
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <UserHeader>
          <span className="text-white font-medium">Writing & Editing</span>
        </UserHeader>
        
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-6xl mx-auto">
            {renderProgressSteps()}
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Chapter Navigation Sidebar */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Chapters</h3>
                  <span className="text-sm text-gray-300">
                    {Object.keys(allChapters || {}).length}/{currentProject?.chapters || 0}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {Array.from({ length: currentProject?.chapters || 0 }, (_, i) => i + 1).map(chapterNum => (
                    <button
                      key={chapterNum}
                      onClick={() => setSelectedChapter(chapterNum)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedChapter === chapterNum
                          ? 'bg-purple-500/30 text-purple-300 border border-purple-400/50'
                          : 'hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Chapter {chapterNum}</span>
                        {allChapters && allChapters[chapterNum] && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/20">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Export Book</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => exportBook('html')}
                      className="w-full px-3 py-2 text-sm bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors"
                    >
                      Export as HTML
                    </button>
                    <button
                      onClick={() => exportBook('pdf')}
                      className="w-full px-3 py-2 text-sm bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                    >
                      Export as PDF
                    </button>
                    <button
                      onClick={() => exportBook('docx')}
                      className="w-full px-3 py-2 text-sm bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      Export as DOCX
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Main Editor */}
              <div className="lg:col-span-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Chapter {selectedChapter}
                      {currentProject?.title && ` - ${currentProject.title}`}
                    </h2>
                    
                    <div className="flex gap-3">
                      {allChapters && allChapters[selectedChapter] ? (
                        <button
                          onClick={saveChapter}
                          disabled={savingChapter}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          {savingChapter ? "Saving..." : "Save Chapter"}
                        </button>
                      ) : (
                        <button
                          onClick={() => generateChapter(selectedChapter)}
                          disabled={generatingChapter}
                          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                        >
                          {generatingChapter ? "Generating..." : "Generate Chapter"}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {allChapters && allChapters[selectedChapter] ? (
                    <div className="writing-interface">
                      <ReactQuill
                        value={editableChapter}
                        onChange={setEditableChapter}
                        style={{ height: '400px' }}
                        theme="snow"
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['blockquote', 'code-block'],
                            [{ 'align': [] }],
                            ['clean']
                          ],
                        }}
                      />
                      <div className="mt-16"></div>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <div className="text-6xl mb-4">📄</div>
                      <h3 className="text-xl font-bold text-white mb-2">Chapter {selectedChapter} Not Generated Yet</h3>
                      <p className="text-gray-300 mb-6">Click "Generate Chapter" to create this chapter with AI assistance.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="App min-h-screen">
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'writing' && <WritingInterface />}
    </div>
  );
};

export default BookWriter;