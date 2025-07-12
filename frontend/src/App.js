import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookWriter = () => {
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
  const [savingChapter, setSavingChapter] = useState(false);
  const [exportingBook, setExportingBook] = useState(false);

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

  // Custom styles for better spacing and formatting
  const editorStyle = {
    '& .ql-editor': {
      lineHeight: '1.8',
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      padding: '20px',
    },
    '& .ql-editor h2': {
      marginTop: '30px',
      marginBottom: '15px',
      fontSize: '1.5em',
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    '& .ql-editor h3': {
      marginTop: '25px',
      marginBottom: '12px',
      fontSize: '1.3em',
      fontWeight: '600',
      color: '#34495e',
    },
    '& .ql-editor p': {
      marginBottom: '15px',
      lineHeight: '1.7',
    },
    '& .ql-editor ul, & .ql-editor ol': {
      marginBottom: '15px',
      paddingLeft: '25px',
    },
    '& .ql-editor li': {
      marginBottom: '8px',
      lineHeight: '1.6',
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pages' || name === 'chapters' ? parseInt(value) : value
    }));
  };

  const createProject = async () => {
    if (!formData.title || !formData.description) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/projects`, formData);
      setCurrentProject(response.data);
      setCurrentStep(2);
      await loadProjects();
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Error creating project");
    } finally {
      setLoading(false);
    }
  };

  const generateOutline = async () => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/generate-outline`, {
        project_id: currentProject.id
      });
      
      if (response.data && response.data.outline) {
        setOutline(response.data.outline);
        setCurrentStep(3);
      } else {
        throw new Error("Invalid response from server");
      }
      
    } catch (error) {
      console.error("Error generating outline:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Error generating outline";
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const updateOutline = async () => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const response = await axios.put(`${API}/update-outline`, {
        project_id: currentProject.id,
        outline: outline
      });
      
      if (response.data) {
        // Update current project
        setCurrentProject(prev => ({
          ...prev,
          outline: outline
        }));
        
        // Move to step 3.5 for batch generation
        setCurrentStep(3.5);
      } else {
        throw new Error("Invalid response from server");
      }
      
    } catch (error) {
      console.error("Error updating outline:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Error updating outline";
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const generateAllChapters = async () => {
    if (!currentProject) return;

    setGeneratingAllChapters(true);
    setChapterProgress(0);
    setCurrentStep(4); // Move to writing step
    
    try {
      const response = await axios.post(`${API}/generate-all-chapters`, {
        project_id: currentProject.id
      });
      
      if (response.data && response.data.chapters) {
        setAllChapters(response.data.chapters);
        setCurrentChapter(1);
        setChapterContent(response.data.chapters["1"] || "");
        
        // Update current project with chapters
        setCurrentProject(prev => ({
          ...prev,
          chapters_content: response.data.chapters
        }));
      } else {
        throw new Error("Invalid response from server");
      }
      
    } catch (error) {
      console.error("Error generating chapters:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Error generating chapters";
      alert(`Error: ${errorMessage}. Please try again.`);
      setCurrentStep(3.5); // Go back to the generation step
    } finally {
      setGeneratingAllChapters(false);
      setChapterProgress(0);
    }
  };

  const saveChapter = async () => {
    if (!currentProject || !chapterContent) return;

    setSavingChapter(true);
    try {
      const response = await axios.put(`${API}/update-chapter`, {
        project_id: currentProject.id,
        chapter_number: currentChapter,
        content: chapterContent
      });
      
      if (response.data) {
        // Update local state
        setAllChapters(prev => ({
          ...prev,
          [currentChapter]: chapterContent
        }));
        
        // Update current project
        setCurrentProject(prev => ({
          ...prev,
          chapters_content: {
            ...prev.chapters_content,
            [currentChapter]: chapterContent
          }
        }));
        
        alert("Chapter saved successfully!");
      } else {
        throw new Error("Invalid response from server");
      }
      
    } catch (error) {
      console.error("Error saving chapter:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Error saving chapter";
      alert(`Error: ${errorMessage}. Please try again.`);
    } finally {
      setSavingChapter(false);
    }
  };

  const exportBook = async () => {
    if (!currentProject) return;

    setExportingBook(true);
    try {
      const response = await axios.get(`${API}/export-book/${currentProject.id}`);
      
      if (response.data && response.data.html) {
        // Create and download HTML file
        const blob = new Blob([response.data.html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.filename || `${currentProject.title.replace(/[^a-zA-Z0-9]/g, '_')}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert("Book exported successfully!");
      } else {
        throw new Error("Invalid response from server");
      }
      
    } catch (error) {
      console.error("Error exporting book:", error);
      const errorMessage = error.response?.data?.detail || error.message || "Error exporting book";
      alert(`Error: ${errorMessage}. Please try again.`);
    } finally {
      setExportingBook(false);
    }
  };

  const generateChapter = async (chapterNum) => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/generate-chapter`, {
        project_id: currentProject.id,
        chapter_number: chapterNum
      });
      setChapterContent(response.data.chapter_content);
      setCurrentChapter(chapterNum);
    } catch (error) {
      console.error("Error generating chapter:", error);
      alert("Error generating chapter");
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (project) => {
    setCurrentProject(project);
    if (project.outline) {
      setOutline(project.outline);
      if (project.chapters_content && Object.keys(project.chapters_content).length > 0) {
        setCurrentStep(4);
        setAllChapters(project.chapters_content);
        const firstChapter = Object.keys(project.chapters_content)[0];
        setCurrentChapter(parseInt(firstChapter));
        setChapterContent(project.chapters_content[firstChapter]);
      } else {
        setCurrentStep(3);
      }
    } else {
      setCurrentStep(2);
    }
  };

  const resetProject = () => {
    setCurrentProject(null);
    setCurrentStep(1);
    setFormData({
      title: "",
      description: "",
      pages: 100,
      chapters: 10,
      language: "English",
      writing_style: "story"
    });
    setOutline("");
    setAllChapters({});
    setGeneratingAllChapters(false);
    setChapterProgress(0);
    setCurrentChapter(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            ✨ AI Book Writer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transform your ideas into complete books with AI assistance. 
            Just describe your vision and let AI help you write chapter by chapter.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  currentStep >= step ? 'bg-purple-600' : 'bg-gray-300'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 ${
                    currentStep > step ? 'bg-purple-600' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600 max-w-lg mx-auto">
            <span>Setup</span>
            <span>Details</span>
            <span>Outline</span>
            <span>Writing</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          
          {/* Step 1: Project Selection/Creation */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">Start Your Book Journey</h2>
              
              {/* Existing Projects */}
              {projects.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">Continue Existing Project</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project) => (
                      <div 
                        key={project.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow"
                        onClick={() => loadProject(project)}
                      >
                        <h4 className="font-semibold text-gray-800">{project.title}</h4>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">{project.description}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          {project.chapters} chapters • {project.pages} pages • {project.language} • {project.writing_style === 'story' ? '📚 Story' : '📖 Descriptive'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-6 mt-6">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Or Create New Project</h3>
                  </div>
                </div>
              )}

              {/* New Project Form */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Book Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter your book title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Book Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe what your book is about, the main themes, target audience, etc..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Pages
                    </label>
                    <input
                      type="number"
                      name="pages"
                      value={formData.pages}
                      onChange={handleInputChange}
                      min="10"
                      max="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Chapters
                    </label>
                    <input
                      type="number"
                      name="chapters"
                      value={formData.chapters}
                      onChange={handleInputChange}
                      min="1"
                      max="50"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Writing Style
                    </label>
                    <select
                      name="writing_style"
                      value={formData.writing_style}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="story">📚 Story - Fluid narrative, character-driven</option>
                      <option value="descriptive">📖 Descriptive - Structured, informational</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Writing Style Guide:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Story:</strong> Perfect for novels, memoirs, or narrative non-fiction. Creates flowing, immersive content with minimal structural breaks.</p>
                    <p><strong>Descriptive:</strong> Ideal for educational content, how-to guides, or reference materials. Uses clear sections and structured organization.</p>
                  </div>
                </div>

                <button
                  onClick={createProject}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50"
                >
                  {loading ? "Creating Project..." : "Create Book Project →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Generate Outline */}
          {currentStep === 2 && currentProject && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Generate Book Outline</h2>
                <button
                  onClick={resetProject}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Back to Projects
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">{currentProject.title}</h3>
                <p className="text-gray-600 mb-4">{currentProject.description}</p>
                <div className="flex space-x-6 text-sm text-gray-500">
                  <span>{currentProject.chapters} chapters</span>
                  <span>{currentProject.pages} pages</span>
                  <span>{currentProject.language}</span>
                  <span>{currentProject.writing_style === 'story' ? '📚 Story' : '📖 Descriptive'}</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-lg text-gray-600 mb-8">
                  Ready to generate a comprehensive outline for your book? 
                  This will create chapter titles, summaries, and structure.
                </p>
                
                <button
                  onClick={generateOutline}
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-8 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Outline...
                    </span>
                  ) : "✨ Generate Outline with AI"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review/Edit Outline */}
          {currentStep === 3 && outline && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Review Your Outline</h2>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Back
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Review and edit your AI-generated outline. You can modify it before proceeding to generate all chapters.
              </p>

              <div className="mb-6">
                <ReactQuill
                  value={outline}
                  onChange={setOutline}
                  modules={quillModules}
                  formats={quillFormats}
                  style={{ height: '400px', marginBottom: '50px' }}
                  placeholder="Your book outline will appear here..."
                />
              </div>

              <div className="flex space-x-4 mt-16">
                <button
                  onClick={generateOutline}
                  disabled={loading}
                  className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  🔄 Regenerate Outline
                </button>
                
                <button
                  onClick={updateOutline}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Outline →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3.5: Generate All Chapters */}
          {currentStep === 3.5 && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Ready to Generate Your Book</h2>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Edit Outline
                </button>
              </div>

              <div className="text-center">
                <p className="text-lg text-gray-600 mb-8">
                  Your outline is ready! Now let's generate all {currentProject?.chapters} chapters using AI. 
                  This process may take a few minutes as we create comprehensive content for each chapter.
                </p>
                
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-8">
                  <h3 className="font-semibold text-gray-800 mb-2">What happens next:</h3>
                  <ul className="text-gray-600 text-left space-y-2">
                    <li>• AI will generate all {currentProject?.chapters} chapters based on your outline</li>
                    <li>• Each chapter will be properly formatted with headings and structure</li>
                    <li>• You can edit any chapter content after generation</li>
                    <li>• Estimated time: {currentProject?.chapters ? Math.ceil(currentProject.chapters * 0.5) : 5} minutes</li>
                  </ul>
                </div>
                
                <button
                  onClick={generateAllChapters}
                  disabled={generatingAllChapters}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-8 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 disabled:opacity-50 text-lg"
                >
                  {generatingAllChapters ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating All Chapters...
                    </span>
                  ) : "🚀 Generate All Chapters with AI"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Chapter Writing */}
          {currentStep === 4 && currentProject && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Your Complete Book</h2>
                <button
                  onClick={() => setCurrentStep(3.5)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Back
                </button>
              </div>

              {/* Chapter Navigation */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.from({ length: currentProject.chapters }, (_, i) => i + 1).map((chapterNum) => (
                    <button
                      key={chapterNum}
                      onClick={() => {
                        setCurrentChapter(chapterNum);
                        if (allChapters && allChapters[chapterNum]) {
                          setChapterContent(allChapters[chapterNum]);
                        } else {
                          setChapterContent("");
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        currentChapter === chapterNum
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Chapter {chapterNum}
                      {allChapters && allChapters[chapterNum] && " ✓"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chapter Content */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Chapter {currentChapter}
                  </h3>
                  <div className="text-sm text-gray-500">
                    Progress: {allChapters ? Object.keys(allChapters).length : 0} of {currentProject.chapters} chapters
                  </div>
                </div>

                <ReactQuill
                  value={chapterContent}
                  onChange={setChapterContent}
                  modules={quillModules}
                  formats={quillFormats}
                  style={{ height: '500px', marginBottom: '50px' }}
                  placeholder={`Chapter ${currentChapter} content will appear here after generating all chapters.`}
                />
              </div>

              {/* Chapter Actions */}
              <div className="flex justify-between items-center mt-16">
                <div className="text-sm text-gray-500">
                  {allChapters && Object.keys(allChapters).length === currentProject.chapters 
                    ? "All chapters generated! You can edit any chapter above."
                    : "Generate all chapters first to start editing content."
                  }
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={saveChapter}
                    disabled={savingChapter || !chapterContent}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {savingChapter ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : "💾 Save Chapter"}
                  </button>
                  <button
                    onClick={exportBook}
                    disabled={exportingBook || !allChapters || Object.keys(allChapters).length === 0}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {exportingBook ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Exporting...
                      </span>
                    ) : "📄 Export Book"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay - Enhanced */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4 shadow-2xl">
                <div className="relative">
                  <svg className="animate-spin mx-auto h-12 w-12 text-purple-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-lg font-medium text-gray-800 mb-2">✨ AI is working on your request...</p>
                <p className="text-sm text-gray-600 mb-4">
                  {currentStep === 2 ? "Generating your book outline..." : 
                   currentStep === 3 ? "Saving your outline..." : 
                   "Processing your request..."}
                </p>
                <div className="mt-4 text-xs text-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce mr-1"></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce mr-1" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <p className="mt-2">This may take a few moments</p>
                </div>
              </div>
            </div>
          )}

          {/* Chapter Generation Loading - Enhanced */}
          {generatingAllChapters && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4 shadow-2xl">
                <div className="relative mb-4">
                  <svg className="animate-spin mx-auto h-16 w-16 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-800 mb-2">🚀 Generating Your Complete Book</p>
                <p className="text-sm text-gray-600 mb-4">
                  AI is writing all {currentProject?.chapters} chapters based on your outline
                </p>
                <div className="bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, chapterProgress)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce mr-1"></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce mr-1" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce mr-1" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                  </div>
                  <p>This may take several minutes. Please be patient while we create your book!</p>
                  <p className="mt-2 text-gray-400">💡 Tip: Keep this tab open to ensure completion</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BookWriter />
    </div>
  );
}

export default App;