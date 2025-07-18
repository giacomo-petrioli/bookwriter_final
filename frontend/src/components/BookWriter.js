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