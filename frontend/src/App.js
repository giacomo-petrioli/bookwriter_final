import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

// Configure axios timeout
axios.defaults.timeout = 120000; // 2 minutes timeout for individual requests
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookWriter = () => {
  const [currentView, setCurrentView] = useState('landing'); // 'landing', 'dashboard', 'writing'
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
    } finally {
      setLoading(false);
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

  // Landing Page Component
  const LandingPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-purple-500/10 via-transparent to-blue-500/10"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-40 right-20 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-cyan-500/20 rounded-full blur-xl animate-pulse delay-2000"></div>
      
      {/* Header */}
      <nav className="relative z-10 p-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">✍️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">AI BookWriter</h1>
        </div>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all duration-300 hover:scale-105"
        >
          Get Started
        </button>
      </nav>
      
      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-500/30 text-purple-200 text-sm mb-8">
            🚀 Powered by Advanced AI Technology
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Write Your
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400"> Dreams</span>
            <br />
            Into Reality
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Transform your ideas into professional books with AI-powered writing assistance. 
            Generate outlines, create chapters, and export beautiful books in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-semibold text-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              Start Writing Now
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300">
              Watch Demo
            </button>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-gray-300 text-lg">Everything you need to create professional books</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "🤖",
              title: "AI-Powered Writing",
              description: "Advanced AI generates high-quality content with natural dialogue and compelling narratives."
            },
            {
              icon: "📚",
              title: "Multiple Styles",
              description: "Choose from story, academic, business, poetry, and more writing styles to match your vision."
            },
            {
              icon: "🎨",
              title: "Professional Export",
              description: "Export your books as beautiful PDF or DOCX files with professional formatting."
            },
            {
              icon: "🌍",
              title: "Multi-Language",
              description: "Write in English, Spanish, French, German, Italian, and Portuguese with native fluency."
            },
            {
              icon: "⚡",
              title: "Fast Generation",
              description: "Generate complete outlines and chapters in minutes, not hours or days."
            },
            {
              icon: "📖",
              title: "Rich Editor",
              description: "Edit and refine your content with a powerful rich text editor and real-time preview."
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:bg-white/10 transform hover:scale-105"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-3xl border border-white/20">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Write Your Masterpiece?
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Join thousands of writers who have transformed their ideas into professional books.
            </p>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full font-semibold text-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
            >
              Start Your Free Book
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>&copy; 2024 AI BookWriter. Powered by advanced AI technology.</p>
        </div>
      </footer>
    </div>
  );

  // Dashboard Component
  const Dashboard = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">✍️</span>
            </div>
            <h1 className="text-2xl font-bold text-white">AI BookWriter</h1>
          </div>
          <button
            onClick={() => setCurrentView('landing')}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </nav>
      
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
            
            <div className="space-y-6">
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
                    <option value="story">📚 Story - Fluid narrative, character-driven</option>
                    <option value="descriptive">📖 Descriptive - Structured, informational</option>
                    <option value="academic">🎓 Academic - Scholarly, research-based</option>
                    <option value="technical">⚙️ Technical - Step-by-step, instructional</option>
                    <option value="biography">👤 Biography - Life story, chronological</option>
                    <option value="self_help">💪 Self-Help - Motivational, actionable</option>
                    <option value="children">🧸 Children's - Age-appropriate, engaging</option>
                    <option value="poetry">🎭 Poetry - Creative, artistic expression</option>
                    <option value="business">💼 Business - Professional, strategic</option>
                  </select>
                </div>
              </div>
              
              <button
                onClick={createProject}
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
            </div>
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

  // Writing Interface Component (existing functionality)
  const WritingInterface = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">✍️</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{currentProject?.title}</h1>
              <p className="text-gray-400 text-sm">{getWritingStyleDisplay(currentProject?.writing_style)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
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
          </div>
        </div>
      </nav>
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
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
              <h3 className="text-2xl font-bold text-white mb-6">Review Your Outline</h3>
              <div className="bg-white/5 rounded-xl p-6 mb-6">
                <div
                  className="text-gray-300 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: outline }}
                />
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
                      Generating All Chapters... ({chapterProgress}%)
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
      {currentView === 'landing' && <LandingPage />}
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'writing' && <WritingInterface />}
    </div>
  );
};

export default BookWriter;