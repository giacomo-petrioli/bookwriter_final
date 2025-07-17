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

// Dashboard Component - extracted outside to prevent re-renders
const Dashboard = React.memo(({ 
  user, 
  projects, 
  formData, 
  loading, 
  handleInputChange, 
  handleFormSubmit, 
  loadProject, 
  getWritingStyleDisplay 
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
));

// Writing Interface Component - extracted outside to prevent re-renders  
const WritingInterface = React.memo(({ 
  currentProject, 
  currentStep, 
  setCurrentView, 
  setShowExportDropdown, 
  showExportDropdown, 
  exportBook, 
  generateOutline, 
  generateAllChapters, 
  generateChapter, 
  saveChapter, 
  saveOutline, 
  switchChapter, 
  updateChapterContent, 
  updateEditableOutline, 
  setIsEditingOutline, 
  editBook,
  loading, 
  outline, 
  chapterContent, 
  currentChapter, 
  allChapters, 
  generatingAllChapters, 
  generatingChapterNum, 
  chapterProgress, 
  savingChapter, 
  exportingBook, 
  isEditingOutline, 
  editableOutline, 
  savingOutline, 
  getWritingStyleDisplay, 
  quillModules 
}) => (
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
            <div className="absolute right-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-600/50 shadow-xl z-50">
              <button
                onClick={() => exportBook('pdf')}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700/80 transition-colors rounded-t-lg"
              >
                📄 Export as PDF
              </button>
              <button
                onClick={() => exportBook('docx')}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700/80 transition-colors"
              >
                📝 Export as DOCX
              </button>
              <button
                onClick={() => exportBook('html')}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700/80 transition-colors rounded-b-lg"
              >
                🌐 Export as HTML
              </button>
            </div>
          )}
        </div>
      )}
    </UserHeader>
    
    <div className="container mx-auto px-6 py-8 pb-32 min-h-screen">
      <div className="max-w-6xl mx-auto min-h-full">
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
        
        {/* Step 3: Review Outline */}
        {currentStep === 3 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Review Your Outline</h3>
              <button
                onClick={() => {
                  if (!isEditingOutline) {
                    // Initialize editableOutline with current outline content when starting to edit
                    updateEditableOutline(outline);
                  }
                  setIsEditingOutline(!isEditingOutline);
                }}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105"
              >
                {isEditingOutline ? 'Cancel Edit' : 'Edit Outline'}
              </button>
            </div>
            
            {isEditingOutline ? (
              <div className="space-y-4">
                <div className="relative">
                  <ReactQuill
                    value={editableOutline}
                    onChange={updateEditableOutline}
                    modules={quillModules}
                    theme="snow"
                    placeholder="Edit your outline..."
                    className="bg-white/10 rounded-xl"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      minHeight: '400px'
                    }}
                  />
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={saveOutline}
                    disabled={savingOutline}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
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
                    className="px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                  <div 
                    className="text-gray-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: outline }}
                    style={{ minHeight: '300px' }}
                  />
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
                    onClick={generateOutline}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                  >
                    {loading ? "Regenerating..." : "Regenerate Outline"}
                  </button>
                </div>
                
                {generatingAllChapters && (
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-semibold">Generating Chapters...</span>
                      <span className="text-gray-300">{Math.round(chapterProgress)}% complete</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${chapterProgress}%` }}
                      />
                    </div>
                    <p className="text-gray-400 mt-2">
                      Chapter {generatingChapterNum} of {currentProject?.chapters} - This may take a few minutes...
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Step 4: Write Chapters */}
        {currentStep === 4 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Write Your Chapters</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => generateChapter(currentChapter)}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate Chapter"}
                </button>
                <button
                  onClick={saveChapter}
                  disabled={savingChapter}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
                >
                  {savingChapter ? "Saving..." : "Save Chapter"}
                </button>
              </div>
            </div>
            
            {/* Chapter Navigation */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: currentProject?.chapters || 0 }, (_, i) => i + 1).map((chapterNum) => (
                  <button
                    key={chapterNum}
                    onClick={() => switchChapter(chapterNum)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      currentChapter === chapterNum
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                        : allChapters[chapterNum]
                        ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                        : 'bg-white/10 text-gray-400 border border-white/20'
                    }`}
                  >
                    Chapter {chapterNum}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Chapter Content Editor */}
            <div className="relative">
              <ReactQuill
                value={chapterContent}
                onChange={updateChapterContent}
                modules={quillModules}
                theme="snow"
                placeholder={`Write Chapter ${currentChapter} content here...`}
                className="bg-white/10 rounded-xl"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  minHeight: '500px'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
));

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