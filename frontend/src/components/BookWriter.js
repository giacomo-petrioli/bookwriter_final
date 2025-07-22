import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from '../context/AuthContext';
import UserHeader from './UserHeader';

// Configure axios timeout
axios.defaults.timeout = 120000; // 2 minutes timeout for individual requests
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookWriter = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentStep, setCurrentStep] = useState(1);
  const [projects, setProjects] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
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
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/projects`);
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
      const response = await axios.get(`${API}/user/stats`);
      setUserStats(response.data);
    } catch (error) {
      console.error("Error loading user stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    try {
      setLoading(true);
      const response = await axios.post(`${API}/projects`, formData);
      setCurrentProject(response.data);
      setCurrentStep(2);
      setCurrentView('writing');
      await loadProjects();
      await loadUserStats(); // Refresh stats
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (projectId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/projects/${projectId}`);
      setCurrentProject(response.data);
      setOutline(response.data.outline || "");
      setAllChapters(response.data.chapters_content || {});
      setCurrentStep(response.data.outline ? 3 : 2);
      setCurrentView('writing');
    } catch (error) {
      console.error("Error loading project:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAllChapters = async () => {
    if (!currentProject || !currentProject.outline) return;

    setGeneratingAllChapters(true);
    setGeneratingChapterNum(0);
    setChapterProgress({});

    try {
      const totalChapters = currentProject.chapters;
      const newChapters = {};

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
        } catch (error) {
          console.error(`Error generating chapter ${i}:`, error);
          setChapterProgress(prev => ({
            ...prev,
            [i]: { status: 'error', progress: 0 }
          }));
        }
      }

      setAllChapters(newChapters);
      setCurrentStep(4);
      setCurrentView('writing');
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
    <div className="min-h-screen bg-slate-50">
      <UserHeader>
      </UserHeader>
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-slate-600 text-lg">Ready to create your next masterpiece?</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsLoading ? (
              // Loading skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Books</p>
                      <p className="text-2xl font-bold text-slate-900">{userStats?.total_books || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📚</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Chapters Written</p>
                      <p className="text-2xl font-bold text-slate-900">{userStats?.total_chapters || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📝</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Words Written</p>
                      <p className="text-2xl font-bold text-slate-900">{userStats?.total_words?.toLocaleString() || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">✍️</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Recent Activity</p>
                      <p className="text-2xl font-bold text-slate-900">{userStats?.recent_activity || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
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
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-900">Create New Book</h3>
                </div>
                
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Book Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter your book title..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      Book Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Describe what your book is about..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Target Pages
                      </label>
                      <input
                        type="number"
                        name="pages"
                        value={formData.pages}
                        onChange={handleInputChange}
                        min="10"
                        max="1000"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Number of Chapters
                      </label>
                      <input
                        type="number"
                        name="chapters"
                        value={formData.chapters}
                        onChange={handleInputChange}
                        min="1"
                        max="50"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Language
                      </label>
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Italian">Italian</option>
                        <option value="Portuguese">Portuguese</option>
                        <option value="Russian">Russian</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Korean">Korean</option>
                        <option value="Chinese">Chinese</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Writing Style
                      </label>
                      <select
                        name="writing_style"
                        value={formData.writing_style}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="story">Story (Narrative)</option>
                        <option value="descriptive">Descriptive (Structured)</option>
                      </select>
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading || !formData.title || !formData.description}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Creating Project...
                      </span>
                    ) : (
                      "Create Book Project"
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Sidebar - Platform Info */}
            <div className="space-y-6">
              {/* AI Capabilities */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600">🤖</span>
                  </span>
                  AI Capabilities
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Gemini 2.0 Flash-Lite</p>
                      <p className="text-xs text-slate-600">Latest AI model for creative writing</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Multi-language Support</p>
                      <p className="text-xs text-slate-600">10+ languages available</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Professional Export</p>
                      <p className="text-xs text-slate-600">PDF, DOCX, and HTML formats</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Progress */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-purple-600">📊</span>
                  </span>
                  Your Progress
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">Writing Streak</span>
                      <span className="text-sm text-slate-600">{userStats?.recent_activity || 0} days</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(((userStats?.recent_activity || 0) / 30) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">Average Words/Chapter</span>
                      <span className="text-sm text-slate-600">{userStats?.avg_words_per_chapter || 0}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(((userStats?.avg_words_per_chapter || 0) / 3000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-600">
                      Member since {userStats?.user_since || 'Recently'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tips & Features */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
                  <span className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white">💡</span>
                  </span>
                  Pro Tips
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-600 mt-1">•</span>
                    <p className="text-sm text-slate-700">Use detailed descriptions for better AI-generated content</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-600 mt-1">•</span>
                    <p className="text-sm text-slate-700">Edit and refine AI-generated chapters for your unique voice</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-purple-600 mt-1">•</span>
                    <p className="text-sm text-slate-700">Export your book in multiple formats for different uses</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Existing Books Section */}
          {projects.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                <span className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-slate-600">📚</span>
                </span>
                Your Books ({projects.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-lg font-semibold text-slate-900 line-clamp-1">{project.title}</h4>
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="text-xs text-slate-600">{project.chapters}</span>
                      </div>
                    </div>
                    
                    <p className="text-slate-600 mb-4 text-sm line-clamp-2">{project.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {project.pages} pages
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {project.chapters} chapters
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {getWritingStyleDisplay(project.writing_style)}
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                      {/* Show Edit Book if chapters exist, otherwise Generate All Chapters */}
                      {allChapters && Object.keys(allChapters).length > 0 ? (
                        <button
                          onClick={editBook}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-teal-600 transition-all duration-200"
                        >
                          Edit Book
                        </button>
                      ) : (
                        <button
                          onClick={generateAllChapters}
                          disabled={loading || generatingAllChapters}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50"
                        >
                          {generatingAllChapters ? "Generating..." : "Generate All Chapters"}
                        </button>
                      )}
                      
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

  // Simple Writing Interface placeholder
  const WritingInterface = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <UserHeader>
        <span className="text-gray-300">Book Writing Interface</span>
      </UserHeader>
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <h2 className="text-3xl font-bold text-white mb-6">
              {currentProject?.title || "Book Project"}
            </h2>
            
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-2xl font-bold text-white mb-4">Writing Interface Coming Soon</h3>
              <p className="text-gray-300 mb-8">
                The full writing interface with step-by-step book creation, AI assistance, and editing tools is being prepared.
              </p>
              
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="App min-h-screen">
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'writing' && <WritingInterface />}
    </div>
  );
};

export default BookWriter;