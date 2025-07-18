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

  // Dashboard Component - defined inside BookWriter to access setCurrentStep
  const Dashboard = React.memo(({ 
    user, 
    projects, 
    formData, 
    loading, 
    handleInputChange, 
    handleFormSubmit, 
    loadProject, 
    getWritingStyleDisplay,
    allChapters,
    generateAllChapters,
    generatingAllChapters
  }) => (
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
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
                          onClick={() => setCurrentStep(4)}
                          className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold text-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105"
                        >
                          Edit Book
                        </button>
                      ) : (
                        <button
                          onClick={generateAllChapters}
                          disabled={loading || generatingAllChapters}
                          className="px-8 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-semibold text-lg hover:from-green-600 hover:to-teal-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                        >
                          {generatingAllChapters ? "Generating Chapters..." : "Generate All Chapters"}
                        </button>
                      )}
                      
                      <button
                        onClick={() => loadProject(project.id)}
                        className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 transform hover:scale-105"
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
  ));

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
    e.stopPropagation();
    if (formData.title && formData.description && !loading) {
      createProject();
    }
  };

  const handleInputKeyDown = (e) => {
    // Only prevent form submission on Enter key for non-textarea inputs
    if (e.key === 'Enter' && e.target.type !== 'textarea' && e.target.tagName !== 'TEXTAREA') {
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

  const updateChapterContent = (content) => {
    setChapterContent(content);
  };

  const updateEditableOutline = (content) => {
    setEditableOutline(content);
  };

  const editBook = () => {
    // Go back to step 1 to edit the current project
    setCurrentStep(1);
  };

  // Main render
  return (
    <div className="App min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {currentView === 'dashboard' && (
        <Dashboard 
          user={user}
          projects={projects}
          formData={formData}
          loading={loading}
          handleInputChange={handleInputChange}
          handleFormSubmit={handleFormSubmit}
          loadProject={loadProject}
          getWritingStyleDisplay={getWritingStyleDisplay}
          setCurrentStep={setCurrentStep}
          allChapters={allChapters}
          generateAllChapters={generateAllChapters}
          generatingAllChapters={generatingAllChapters}
        />
      )}
      {currentView === 'writing' && (
        <WritingInterface 
          currentProject={currentProject}
          currentStep={currentStep}
          setCurrentView={setCurrentView}
          setShowExportDropdown={setShowExportDropdown}
          showExportDropdown={showExportDropdown}
          exportBook={exportBook}
          generateOutline={generateOutline}
          generateAllChapters={generateAllChapters}
          generateChapter={generateChapter}
          saveChapter={saveChapter}
          saveOutline={saveOutline}
          switchChapter={switchChapter}
          updateChapterContent={updateChapterContent}
          updateEditableOutline={updateEditableOutline}
          setIsEditingOutline={setIsEditingOutline}
          editBook={editBook}
          loading={loading}
          outline={outline}
          chapterContent={chapterContent}
          currentChapter={currentChapter}
          allChapters={allChapters}
          generatingAllChapters={generatingAllChapters}
          generatingChapterNum={generatingChapterNum}
          chapterProgress={chapterProgress}
          savingChapter={savingChapter}
          exportingBook={exportingBook}
          isEditingOutline={isEditingOutline}
          editableOutline={editableOutline}
          savingOutline={savingOutline}
          getWritingStyleDisplay={getWritingStyleDisplay}
          quillModules={quillModules}
        />
      )}
    </div>
  );
};

export default BookWriter;