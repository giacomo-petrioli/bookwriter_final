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
    language: "English"
  });
  const [outline, setOutline] = useState("");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterContent, setChapterContent] = useState("");

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
      setOutline(response.data.outline);
      setCurrentStep(3);
    } catch (error) {
      console.error("Error generating outline:", error);
      alert("Error generating outline");
    } finally {
      setLoading(false);
    }
  };

  const updateOutline = async () => {
    if (!currentProject) return;

    setLoading(true);
    try {
      await axios.put(`${API}/update-outline`, {
        project_id: currentProject.id,
        outline: outline
      });
      setCurrentStep(4);
    } catch (error) {
      console.error("Error updating outline:", error);
      alert("Error updating outline");
    } finally {
      setLoading(false);
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
      language: "English"
    });
    setOutline("");
    setChapterContent("");
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
                          {project.chapters} chapters • {project.pages} pages • {project.language}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                Review and edit your AI-generated outline. You can modify it before proceeding to write chapters.
              </p>

              <div className="mb-6">
                <textarea
                  value={outline}
                  onChange={(e) => setOutline(e.target.value)}
                  rows="20"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div className="flex space-x-4">
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
                  {loading ? "Saving..." : "Approve Outline & Start Writing →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Chapter Writing */}
          {currentStep === 4 && currentProject && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Write Your Book</h2>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  ← Back to Outline
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
                        if (currentProject.chapters_content && currentProject.chapters_content[chapterNum]) {
                          setChapterContent(currentProject.chapters_content[chapterNum]);
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
                      {currentProject.chapters_content && currentProject.chapters_content[chapterNum] && " ✓"}
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
                  <button
                    onClick={() => generateChapter(currentChapter)}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                  >
                    {loading ? "Generating..." : "✨ Generate with AI"}
                  </button>
                </div>

                <textarea
                  value={chapterContent}
                  onChange={(e) => setChapterContent(e.target.value)}
                  rows="25"
                  placeholder={`Chapter ${currentChapter} content will appear here. Click "Generate with AI" to create content based on your outline.`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Chapter Actions */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Progress: {currentProject.chapters_content ? Object.keys(currentProject.chapters_content).length : 0} of {currentProject.chapters} chapters written
                </div>
                
                <div className="flex space-x-4">
                  <button
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    💾 Save Chapter
                  </button>
                  <button
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📄 Export Book
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 text-center">
                <svg className="animate-spin mx-auto h-12 w-12 text-purple-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg font-medium text-gray-800">AI is working on your request...</p>
                <p className="text-sm text-gray-600 mt-2">This may take a few moments</p>
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