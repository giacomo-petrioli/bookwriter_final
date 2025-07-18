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
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);
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

  // Load projects on component mount
  useEffect(() => {
    if (user) {
      loadProjects();
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
    if (!currentProject) return;

    try {
      setGeneratingAllChapters(true);
      const response = await axios.post(`${API}/generate-all-chapters`, {
        project_id: currentProject.id
      });
      setAllChapters(response.data.chapters || {});
      setCurrentStep(4);
    } catch (error) {
      console.error("Error generating chapters:", error);
    } finally {
      setGeneratingAllChapters(false);
    }
  };

  const getWritingStyleDisplay = (style) => {
    switch(style) {
      case 'story': return 'Story';
      case 'descriptive': return 'Descriptive';
      default: return 'Story';
    }
  };

  const editBook = () => {
    setCurrentStep(4);
    setCurrentView('writing');
  };

  // Dashboard Component
  const Dashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <UserHeader>
        <span className="text-gray-300">Welcome back, {user?.name}!</span>
      </UserHeader>
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Your Books</h2>
            <p className="text-gray-300">Create new books or continue working on existing projects</p>
          </div>
          
          {/* Create New Book Section */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-8">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <span className="mr-3">✨</span>
              Create New Book
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Book Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter your book title..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Book Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Describe what your book is about..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Target Pages
                  </label>
                  <input
                    type="number"
                    name="pages"
                    value={formData.pages}
                    onChange={handleInputChange}
                    min="10"
                    max="1000"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Number of Chapters
                  </label>
                  <input
                    type="number"
                    name="chapters"
                    value={formData.chapters}
                    onChange={handleInputChange}
                    min="1"
                    max="50"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Language
                  </label>
                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
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
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Writing Style
                  </label>
                  <select
                    name="writing_style"
                    value={formData.writing_style}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="story">Story (Narrative)</option>
                    <option value="descriptive">Descriptive (Structured)</option>
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading || !formData.title || !formData.description}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
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
          
          {/* Existing Books Section */}
          {projects.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">📚</span>
                Your Books
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
                    <h4 className="text-xl font-semibold text-white mb-2">{project.title}</h4>
                    <p className="text-gray-300 mb-4 text-sm line-clamp-2">{project.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                        {project.pages} pages
                      </span>
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                        {project.chapters} chapters
                      </span>
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs">
                        {getWritingStyleDisplay(project.writing_style)}
                      </span>
                    </div>
                    
                    <div className="flex gap-4">
                      {/* Show Edit Book if chapters exist, otherwise Generate All Chapters */}
                      {allChapters && Object.keys(allChapters).length > 0 ? (
                        <button
                          onClick={editBook}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105"
                        >
                          Edit Book
                        </button>
                      ) : (
                        <button
                          onClick={generateAllChapters}
                          disabled={loading || generatingAllChapters}
                          className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                        >
                          {generatingAllChapters ? "Generating..." : "Generate All Chapters"}
                        </button>
                      )}
                      
                      <button
                        onClick={() => loadProject(project.id)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105"
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
    <div className="App min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'writing' && <WritingInterface />}
    </div>
  );
};

export default BookWriter;