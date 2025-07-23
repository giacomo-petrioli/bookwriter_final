import React, { useState, useCallback, memo } from 'react';

const BookCreationForm = memo(({ 
  initialData = {
    title: "",
    description: "",
    pages: 100,
    chapters: 10,
    language: "English",
    writing_style: "story"
  },
  onSubmit,
  onCancel,
  loading = false,
  bookCost = null,
  creditBalance = null,
  onFormChange = null
}) => {
  const [localFormData, setLocalFormData] = useState(initialData);

  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;
    const processedValue = type === 'number' ? parseInt(value) || 0 : value;
    
    setLocalFormData(prev => {
      const newData = { ...prev, [name]: processedValue };
      
      // Notify parent component about form changes for cost calculation
      if (onFormChange) {
        onFormChange(newData);
      }
      
      return newData;
    });
  }, [onFormChange]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!localFormData.title || !localFormData.description) return;
    onSubmit(localFormData);
  }, [localFormData, onSubmit]);

  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Create Your Book Project</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Book Title</label>
          <input
            type="text"
            name="title"
            value={localFormData.title}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            placeholder="Enter your book title"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={localFormData.description}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors h-32"
            placeholder="Describe your book's theme, genre, and main topics"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pages</label>
            <input
              type="number"
              name="pages"
              value={localFormData.pages}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              min="20"
              max="1000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chapters</label>
            <input
              type="number"
              name="chapters"
              value={localFormData.chapters}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              min="3"
              max="50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              name="language"
              value={localFormData.language}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
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
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Writing Style</label>
          <select
            name="writing_style"
            value={localFormData.writing_style}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          >
            <option value="story">Narrative/Story Style</option>
            <option value="descriptive">Descriptive/Educational</option>
            <option value="technical">Technical Writing</option>
            <option value="biography">Biography</option>
            <option value="self_help">Self-Help</option>
            <option value="business">Business</option>
          </select>
        </div>
        
        {/* Credit Cost Display */}
        {bookCost && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mr-2">
                  <span className="text-xs font-bold text-white">₵</span>
                </div>
                Credit Cost
              </h3>
              {creditBalance !== null && (
                <div className="text-sm text-gray-600">
                  Your balance: <span className="font-semibold text-purple-600">{creditBalance} credits</span>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Requested chapters:</span>
                <span className="font-semibold text-gray-800 ml-2">{bookCost.requested_chapters}</span>
              </div>
              <div>
                <span className="text-gray-600">Minimum required:</span>
                <span className="font-semibold text-gray-800 ml-2">{bookCost.minimum_chapters}</span>
              </div>
              <div>
                <span className="text-gray-600">Pages per chapter:</span>
                <span className="font-semibold text-gray-800 ml-2">~{bookCost.pages_per_chapter.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total cost:</span>
                <span className="font-bold text-purple-600 ml-2">{bookCost.total_cost} credits</span>
              </div>
            </div>
            
            {bookCost.requested_chapters < bookCost.minimum_chapters && (
              <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-sm text-yellow-800">
                  📘 <strong>Note:</strong> Your book will have {bookCost.minimum_chapters} chapters 
                  (max 10 pages each) instead of {bookCost.requested_chapters} to meet the page requirement.
                </p>
              </div>
            )}
            
            {creditBalance !== null && creditBalance < bookCost.total_cost && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm text-red-800">
                  ⚠️ <strong>Insufficient Credits:</strong> You need {bookCost.total_cost} credits 
                  but have {creditBalance}. Please purchase {bookCost.total_cost - creditBalance} more credits.
                </p>
              </div>
            )}
          </div>
        )}
        
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            type="submit"
            disabled={loading || !localFormData.title || !localFormData.description}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Creating Project..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
});

BookCreationForm.displayName = 'BookCreationForm';

export default BookCreationForm;