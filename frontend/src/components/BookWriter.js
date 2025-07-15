import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from '../context/AuthContext';
import UserHeader from './UserHeader';
import BookCraftLogo from './BookCraftLogo';

// Configure axios timeout
axios.defaults.timeout = 120000; // 2 minutes timeout for individual requests
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookWriter = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard'); // Start with dashboard for authenticated users
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
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterContent, setChapterContent] = useState("");
  const [allChapters, setAllChapters] = useState({});
  const [generatingAllChapters, setGeneratingAllChapters] = useState(false);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [generatingChapterNum, setGeneratingChapterNum] = useState(0);
  const [savingChapter, setSavingChapter] = useState(false);
  const [exportingBook, setExportingBook] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isEditingOutline, setIsEditingOutline] = useState(false);
  const [editableOutline, setEditableOutline] = useState("");
  const [savingOutline, setSavingOutline] = useState(false);

  // Rich text editor configuration for better HTML formatting
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'blockquote',
    'code-block', 'list', 'bullet', 'indent', 'link', 'align'
  ];

  // Helper function to get writing style display
  const getWritingStyleDisplay = (style) => {
    const styleMap = {
      story: '📚 Story',
      descriptive: '📖 Descriptive',
      academic: '🎓 Academic',
      technical: '⚙️ Technical',
      biography: '👤 Biography',
      self_help: '💪 Self-Help',
      children: '🧸 Children\'s',
      poetry: '🎭 Poetry',
      business: '💼 Business'
    };
    return styleMap[style] || '📚 Story';
  };

  // Load projects on component mount
  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchProjects();
    }
  }, [currentView]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      if (error.response?.status === 401) {
        await logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.description && !loading) {
      createProject();
    }
  };

  const handleInputKeyDown = (e) => {
    // Prevent form submission on Enter key for input fields
    if (e.key === 'Enter' && e.target.type !== 'textarea') {
      e.preventDefault();
    }
  };

  const loadProject = async (projectId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/projects/${projectId}`);
      const project = response.data;
      setCurrentProject(project);
      setFormData({
        title: project.title,
        description: project.description,
        pages: project.pages,
        chapters: project.chapters,
        language: project.language,
        writing_style: project.writing_style
      });
      setOutline(project.outline || "");
      setAllChapters(project.chapters_content || {});
      
      // Set current chapter to first available chapter, or 1 if none
      const availableChapters = Object.keys(project.chapters_content || {}).map(Number).sort((a, b) => a - b);
      if (availableChapters.length > 0) {
        setCurrentChapter(availableChapters[0]);
        setChapterContent(project.chapters_content[availableChapters[0].toString()] || "");
      } else {
        setCurrentChapter(1);
        setChapterContent("");
      }
      
      if (project.outline) {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
      
      setCurrentView('writing');
    } catch (error) {
      console.error('Error loading project:', error);
      if (error.response?.status === 401) {
        await logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/projects`, formData);
      setCurrentProject(response.data);
      setCurrentStep(2);
      setCurrentView('writing');
    } catch (error) {
      console.error('Error creating project:', error);
      if (error.response?.status === 401) {
        await logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const generateOutline = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/generate-outline`, {
        project_id: currentProject.id
      });
      setOutline(response.data.outline);
      setCurrentStep(3);
    } catch (error) {
      console.error('Error generating outline:', error);
      if (error.response?.status === 401) {
        await logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const generateChapter = async (chapterNum) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/generate-chapter`, {
        project_id: currentProject.id,
        chapter_number: chapterNum
      });
      
      const newChapterContent = response.data.chapter_content;
      setAllChapters(prev => ({
        ...prev,
        [chapterNum]: newChapterContent
      }));
      
      if (chapterNum === currentChapter) {
        setChapterContent(newChapterContent);
      }
      
      setCurrentStep(4);
    } catch (error) {
      console.error('Error generating chapter:', error);
      if (error.response?.status === 401) {
        await logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const saveOutline = async () => {
    try {
      setSavingOutline(true);
      await axios.put(`${API}/update-outline`, {
        project_id: currentProject.id,
        outline: editableOutline
      });
      setOutline(editableOutline);
      setIsEditingOutline(false);
    } catch (error) {
      console.error('Error saving outline:', error);
      if (error.response?.status === 401) {
        await logout();
      }
    } finally {
      setSavingOutline(false);
    }
  };

  const saveChapter = async () => {
    try {
      setSavingChapter(true);
      await axios.put(`${API}/update-chapter`, {
        project_id: currentProject.id,
        chapter_number: currentChapter,
        content: chapterContent
      });
      
      setAllChapters(prev => ({
        ...prev,
        [currentChapter]: chapterContent
      }));
      
      console.log('Chapter saved successfully');
    } catch (error) {
      console.error('Error saving chapter:', error);
      if (error.response?.status === 401) {
        await logout();
      }
    } finally {
      setSavingChapter(false);
    }
  };

  const exportBook = async (format) => {
    try {
      setExportingBook(true);
      setShowExportDropdown(false);
      
      const response = await axios.get(`${API}/export-book-${format}/${currentProject.id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${currentProject.title}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting book:', error);
      if (error.response?.status === 401) {
        await logout();
      }
    } finally {
      setExportingBook(false);
    }
  };

  const generateAllChapters = async () => {
    try {
      setGeneratingAllChapters(true);
      setChapterProgress(0);
      
      for (let i = 1; i <= currentProject.chapters; i++) {
        if (!allChapters[i]) {
          setGeneratingChapterNum(i);
          await generateChapter(i);
          setChapterProgress(Math.round((i / currentProject.chapters) * 100));
        }
      }
      
      setCurrentStep(4);
    } catch (error) {
      console.error('Error generating all chapters:', error);
    } finally {
      setGeneratingAllChapters(false);
      setGeneratingChapterNum(0);
    }
  };

  const switchChapter = (chapterNum) => {
    setCurrentChapter(chapterNum);
    setChapterContent(allChapters[chapterNum] || "");
  };

  // Dashboard Component
  const Dashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <UserHeader>
        <span className="text-gray-300">Welcome back, {user?.name}!</span>
      </UserHeader>
      
      <div className="container mx-auto px-6 py-8">
        {/* Dashboard Content */}
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
                  onKeyDown={handleInputKeyDown}
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
                  onKeyDown={handleInputKeyDown}
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
                    onKeyDown={handleInputKeyDown}
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
                    onKeyDown={handleInputKeyDown}
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
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="English" className="bg-gray-800 text-white">English</option>
                    <option value="Spanish" className="bg-gray-800 text-white">Spanish</option>
                    <option value="French" className="bg-gray-800 text-white">French</option>
                    <option value="German" className="bg-gray-800 text-white">German</option>
                    <option value="Italian" className="bg-gray-800 text-white">Italian</option>
                    <option value="Portuguese" className="bg-gray-800 text-white">Portuguese</option>
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
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  >
                    <option value="story" className="bg-gray-800 text-white">📚 Story - Fluid narrative, character-driven</option>
                    <option value="descriptive" className="bg-gray-800 text-white">📖 Descriptive - Structured, informational</option>
                    <option value="academic" className="bg-gray-800 text-white">🎓 Academic - Scholarly, research-based</option>
                    <option value="technical" className="bg-gray-800 text-white">⚙️ Technical - Step-by-step, instructional</option>
                    <option value="biography" className="bg-gray-800 text-white">👤 Biography - Life story, chronological</option>
                    <option value="self_help" className="bg-gray-800 text-white">💪 Self-Help - Motivational, actionable</option>
                    <option value="children" className="bg-gray-800 text-white">🧸 Children's - Age-appropriate, engaging</option>
                    <option value="poetry" className="bg-gray-800 text-white">🎭 Poetry - Creative, artistic expression</option>
                    <option value="business" className="bg-gray-800 text-white">💼 Business - Professional, strategic</option>
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!formData.title || !formData.description || loading}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Book...
                  </span>
                ) : (
                  "Create Book"
                )}
              </button>
            </form>
          </div>
          
          {/* Existing Books */}
          {projects.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">📚</span>
                Your Books
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-purple-500/50 transition-all duration-300 hover:bg-white/10 transform hover:scale-105 cursor-pointer"
                    onClick={() => loadProject(project.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-2xl">{getWritingStyleDisplay(project.writing_style).split(' ')[0]}</div>
                      <div className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                        {project.language}
                      </div>
                    </div>
                    
                    <h4 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                      {project.title}
                    </h4>
                    
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {project.description}
                    </p>
                    
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>{project.chapters} chapters</span>
                      <span>{project.pages} pages</span>
                    </div>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {project.outline ? 'Outline ready' : 'Draft'}
                      </span>
                      <button className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm rounded-full hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
                        Continue →
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

  // Writing Interface Component
  const WritingInterface = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <UserHeader>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
        {currentStep >= 4 && (
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
            >
              Export Book
            </button>
            {showExportDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-xl">
                <button
                  onClick={() => exportBook('pdf')}
                  className="w-full px-4 py-2 text-left text-white hover:bg-white/20 transition-colors"
                >
                  📄 Export as PDF
                </button>
                <button
                  onClick={() => exportBook('docx')}
                  className="w-full px-4 py-2 text-left text-white hover:bg-white/20 transition-colors"
                >
                  📝 Export as DOCX
                </button>
                <button
                  onClick={() => exportBook('html')}
                  className="w-full px-4 py-2 text-left text-white hover:bg-white/20 transition-colors"
                >
                  🌐 Export as HTML
                </button>
              </div>
            )}
          </div>
        )}
      </UserHeader>
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Project Info */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">{currentProject?.title}</h2>
            <p className="text-gray-400">{getWritingStyleDisplay(currentProject?.writing_style)} • {currentProject?.language}</p>
          </div>
          
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[
                { num: 1, label: "Project Setup", active: currentStep >= 1 },
                { num: 2, label: "Generate Outline", active: currentStep >= 2 },
                { num: 3, label: "Review Outline", active: currentStep >= 3 },
                { num: 4, label: "Write Chapters", active: currentStep >= 4 }
              ].map((step, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step.active 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                      : 'bg-white/10 text-gray-400'
                  }`}>
                    {step.num}
                  </div>
                  <span className={`ml-2 font-medium ${
                    step.active ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                  {index < 3 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      step.active ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Step Content */}
          {currentStep === 2 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Generate Book Outline</h3>
              <p className="text-gray-300 mb-6">
                Create a detailed outline for "{currentProject?.title}" with {currentProject?.chapters} chapters.
              </p>
              <button
                onClick={generateOutline}
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold text-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Outline...
                  </span>
                ) : (
                  "Generate Outline"
                )}
              </button>
            </div>
          )}
          
          {currentStep === 3 && outline && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Review Your Outline</h3>
                <button
                  onClick={() => {
                    setIsEditingOutline(!isEditingOutline);
                    if (!isEditingOutline) {
                      setEditableOutline(outline);
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105"
                >
                  {isEditingOutline ? 'Cancel Edit' : 'Edit Outline'}
                </button>
              </div>
              
              <div className="bg-white/5 rounded-xl p-6 mb-6">
                {isEditingOutline ? (
                  <div className="space-y-4">
                    <ReactQuill
                      value={editableOutline}
                      onChange={setEditableOutline}
                      modules={quillModules}
                      formats={quillFormats}
                      theme="snow"
                      className="text-white"
                      placeholder="Edit your outline..."
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '0.75rem',
                        minHeight: '400px'
                      }}
                    />
                    <div className="flex space-x-4 mt-4">
                      <button
                        onClick={saveOutline}
                        disabled={savingOutline}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                      >
                        {savingOutline ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          "Save Outline"
                        )}
                      </button>
                      <button
                        onClick={() => setIsEditingOutline(false)}
                        className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-gray-300 prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: outline }}
                  />
                )}
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105"
                >
                  Continue to Writing
                </button>
                <button
                  onClick={generateAllChapters}
                  disabled={generatingAllChapters}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  {generatingAllChapters ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Chapter {generatingChapterNum} of {currentProject?.chapters} ({chapterProgress}%)...
                    </span>
                  ) : (
                    "Generate All Chapters"
                  )}
                </button>
              </div>
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Chapter Navigation */}
              <div className="lg:col-span-1">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Chapters</h3>
                  <div className="space-y-2">
                    {Array.from({ length: currentProject?.chapters }, (_, i) => i + 1).map((chapterNum) => (
                      <button
                        key={chapterNum}
                        onClick={() => switchChapter(chapterNum)}
                        className={`w-full text-left p-3 rounded-lg transition-all duration-300 ${
                          currentChapter === chapterNum
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>Chapter {chapterNum}</span>
                          {allChapters[chapterNum] && (
                            <span className="text-green-400 text-sm">✓</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Chapter Editor */}
              <div className="lg:col-span-3">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Chapter {currentChapter}</h3>
                    <div className="flex space-x-2">
                      {!allChapters[currentChapter] && (
                        <button
                          onClick={() => generateChapter(currentChapter)}
                          disabled={loading}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                        >
                          {loading ? "Generating..." : "Generate Chapter"}
                        </button>
                      )}
                      <button
                        onClick={saveChapter}
                        disabled={savingChapter}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                      >
                        {savingChapter ? "Saving..." : "Save Chapter"}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 rounded-xl">
                    <ReactQuill
                      value={chapterContent}
                      onChange={setChapterContent}
                      modules={quillModules}
                      formats={quillFormats}
                      className="text-white"
                      theme="snow"
                      style={{ height: '500px' }}
                    />
                  </div>
                  
                  {/* Export Button at bottom of chapter editor */}
                  <div className="mt-6 flex justify-center">
                    <div className="relative">
                      <button
                        onClick={() => setShowExportDropdown(!showExportDropdown)}
                        disabled={exportingBook}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 shadow-lg"
                      >
                        {exportingBook ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Exporting...
                          </span>
                        ) : (
                          "📚 Export Book"
                        )}
                      </button>
                      {showExportDropdown && (
                        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-48 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 shadow-xl z-50">
                          <button
                            onClick={() => exportBook('pdf')}
                            className="w-full px-4 py-2 text-left text-white hover:bg-white/20 transition-colors rounded-t-lg"
                          >
                            📄 Export as PDF
                          </button>
                          <button
                            onClick={() => exportBook('docx')}
                            className="w-full px-4 py-2 text-left text-white hover:bg-white/20 transition-colors"
                          >
                            📝 Export as DOCX
                          </button>
                          <button
                            onClick={() => exportBook('html')}
                            className="w-full px-4 py-2 text-left text-white hover:bg-white/20 transition-colors rounded-b-lg"
                          >
                            🌐 Export as HTML
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="App">
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'writing' && <WritingInterface />}
    </div>
  );
};

export default BookWriter;