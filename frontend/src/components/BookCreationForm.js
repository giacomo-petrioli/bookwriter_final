import React, { useState, useCallback, useEffect, useRef } from 'react';

const BookCreationForm = ({ onSubmit, loading = false, initialData = {} }) => {
  // Local form state - completely isolated from parent
  const [localFormData, setLocalFormData] = useState({
    title: initialData.title || "",
    description: initialData.description || "",
    pages: initialData.pages || 100,
    chapters: initialData.chapters || 10,
    language: initialData.language || "English",
    writing_style: initialData.writing_style || "story"
  });

  // Use refs to prevent unnecessary re-renders
  const formRef = useRef(null);
  const costTimeoutRef = useRef(null);

  // Simple input change handler with no side effects
  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? parseInt(value) || 0 : value;
    
    setLocalFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (localFormData.title && localFormData.description) {
      onSubmit(localFormData);
    }
  }, [localFormData, onSubmit]);

  // Clean up any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (costTimeoutRef.current) {
        clearTimeout(costTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Your Book Project</h2>
          <p className="text-slate-600">Tell us about your book and we'll help you bring it to life</p>
        </div>
        
        <div className="p-8">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {/* Book Title */}
            <div>
              <label htmlFor="book-title" className="block text-sm font-semibold text-slate-700 mb-3">
                Book Title *
              </label>
              <input
                id="book-title"
                type="text"
                name="title"
                value={localFormData.title}
                onChange={handleInputChange}
                placeholder="Enter your book title..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>
            
            {/* Book Description */}
            <div>
              <label htmlFor="book-description" className="block text-sm font-semibold text-slate-700 mb-3">
                Book Description *
              </label>
              <textarea
                id="book-description"
                name="description"
                value={localFormData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Describe what your book is about..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                required
              />
            </div>
            
            {/* Pages and Chapters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="target-pages" className="block text-sm font-semibold text-slate-700 mb-3">
                  Target Pages
                </label>
                <input
                  id="target-pages"
                  type="number"
                  name="pages"
                  value={localFormData.pages}
                  onChange={handleInputChange}
                  min="10"
                  max="1000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              
              <div>
                <label htmlFor="num-chapters" className="block text-sm font-semibold text-slate-700 mb-3">
                  Number of Chapters
                </label>
                <input
                  id="num-chapters"
                  type="number"
                  name="chapters"
                  value={localFormData.chapters}
                  onChange={handleInputChange}
                  min="1"
                  max="50"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            {/* Language and Writing Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="book-language" className="block text-sm font-semibold text-slate-700 mb-3">
                  Language
                </label>
                <select
                  id="book-language"
                  name="language"
                  value={localFormData.language}
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
                <label htmlFor="writing-style" className="block text-sm font-semibold text-slate-700 mb-3">
                  Writing Style
                </label>
                <select
                  id="writing-style"
                  name="writing_style"
                  value={localFormData.writing_style}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="story">Story (Narrative)</option>
                  <option value="descriptive">Descriptive (Structured)</option>
                </select>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !localFormData.title.trim() || !localFormData.description.trim()}
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
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(BookCreationForm);