import React, { useState } from 'react';
import { 
  RocketIcon, 
  ExclamationTriangleIcon, 
  CheckCircledIcon,
  ReloadIcon,
  PlusIcon,
  TrashIcon,
  Cross2Icon,
  CalendarIcon,
  LinkBreak2Icon,
  PersonIcon
} from '@radix-ui/react-icons';
import { useRouter } from 'next/router';

// Define the form data structure
interface BuilderFormData {
  keywords: string[];
  googleAccount: string;
  businessDescription: string;
  nicheUtility: string;
  businessUrl: string;
  youtubeVideos: string[];
  logoImages: File[];
  googleBusinessProfileUrl: string;
  customHtml: string;
  
  // Author Bio
  authorName: string;
  authorExpertise: string[];
  generateAuthorBio: boolean;
  
  // Silo Structure
  siloStructure: {
    enabled: boolean;
    categories: string[];
  };
  
  // Content Scheduling
  contentScheduling: {
    enabled: boolean;
    schedules: Array<{
      date: string;
      title: string;
      publish: boolean;
    }>;
  };
  
  // PBN Settings
  pbnSettings: {
    enabled: boolean;
    targetUrls: string[];
    anchorTexts: string[];
  };
  
  // Cloud Platform
  cloudPlatform: 'google' | 'aws' | 'azure';
}

// Define form submission state
type SubmissionState = 'idle' | 'submitting' | 'success' | 'error';

const BuilderForm: React.FC = () => {
  // Next.js router for redirects
  const router = useRouter();
  
  // Initialize form state
  const [formData, setFormData] = useState<BuilderFormData>({
    keywords: Array(8).fill(''),
    googleAccount: '',
    businessDescription: '',
    nicheUtility: '',
    businessUrl: '',
    youtubeVideos: Array(8).fill(''),
    logoImages: [],
    googleBusinessProfileUrl: '',
    customHtml: '',
    
    // Author Bio
    authorName: '',
    authorExpertise: Array(3).fill(''),
    generateAuthorBio: false,
    
    // Silo Structure
    siloStructure: {
      enabled: false,
      categories: [''],
    },
    
    // Content Scheduling
    contentScheduling: {
      enabled: false,
      schedules: [
        { date: '', title: '', publish: true }
      ],
    },
    
    // PBN Settings
    pbnSettings: {
      enabled: false,
      targetUrls: [''],
      anchorTexts: [''],
    },
    
    // Cloud Platform
    cloudPlatform: 'google',
  });

  // Form submission state
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Handle text input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof BuilderFormData
  ) => {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
  };

  // Handle array input changes (keywords, YouTube videos)
  const handleArrayInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'keywords' | 'youtubeVideos' | 'authorExpertise',
    index: number
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = e.target.value;
    setFormData({
      ...formData,
      [field]: newArray,
    });
  };

  // Handle file input changes (logo images)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      // Limit to 8 files
      const limitedFiles = filesArray.slice(0, 8);
      setFormData({
        ...formData,
        logoImages: limitedFiles,
      });
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'generateAuthorBio' | 'siloStructure.enabled' | 'contentScheduling.enabled' | 'pbnSettings.enabled'
  ) => {
    const checked = e.target.checked;
    
    if (field === 'generateAuthorBio') {
      setFormData({
        ...formData,
        generateAuthorBio: checked,
      });
    } else if (field === 'siloStructure.enabled') {
      setFormData({
        ...formData,
        siloStructure: {
          ...formData.siloStructure,
          enabled: checked,
        },
      });
    } else if (field === 'contentScheduling.enabled') {
      setFormData({
        ...formData,
        contentScheduling: {
          ...formData.contentScheduling,
          enabled: checked,
        },
      });
    } else if (field === 'pbnSettings.enabled') {
      setFormData({
        ...formData,
        pbnSettings: {
          ...formData.pbnSettings,
          enabled: checked,
        },
      });
    }
  };
  
  // Handle silo category changes
  const handleCategoryChange = (index: number, value: string) => {
    const newCategories = [...formData.siloStructure.categories];
    newCategories[index] = value;
    setFormData({
      ...formData,
      siloStructure: {
        ...formData.siloStructure,
        categories: newCategories,
      },
    });
  };
  
  // Add a new category
  const addCategory = () => {
    if (formData.siloStructure.categories.length < 5) {
      setFormData({
        ...formData,
        siloStructure: {
          ...formData.siloStructure,
          categories: [...formData.siloStructure.categories, ''],
        },
      });
    }
  };
  
  // Remove a category
  const removeCategory = (index: number) => {
    if (formData.siloStructure.categories.length > 1) {
      const newCategories = [...formData.siloStructure.categories];
      newCategories.splice(index, 1);
      setFormData({
        ...formData,
        siloStructure: {
          ...formData.siloStructure,
          categories: newCategories,
        },
      });
    }
  };
  
  // Handle content schedule changes
  const handleScheduleChange = (index: number, field: 'date' | 'title' | 'publish', value: string | boolean) => {
    const newSchedules = [...formData.contentScheduling.schedules];
    newSchedules[index] = {
      ...newSchedules[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      contentScheduling: {
        ...formData.contentScheduling,
        schedules: newSchedules,
      },
    });
  };
  
  // Add a new schedule
  const addSchedule = () => {
    if (formData.contentScheduling.schedules.length < 5) {
      setFormData({
        ...formData,
        contentScheduling: {
          ...formData.contentScheduling,
          schedules: [
            ...formData.contentScheduling.schedules,
            { date: '', title: '', publish: true },
          ],
        },
      });
    }
  };
  
  // Remove a schedule
  const removeSchedule = (index: number) => {
    if (formData.contentScheduling.schedules.length > 1) {
      const newSchedules = [...formData.contentScheduling.schedules];
      newSchedules.splice(index, 1);
      setFormData({
        ...formData,
        contentScheduling: {
          ...formData.contentScheduling,
          schedules: newSchedules,
        },
      });
    }
  };
  
  // Handle PBN target URL and anchor text changes
  const handlePbnChange = (index: number, field: 'targetUrls' | 'anchorTexts', value: string) => {
    const newArray = [...formData.pbnSettings[field]];
    newArray[index] = value;
    setFormData({
      ...formData,
      pbnSettings: {
        ...formData.pbnSettings,
        [field]: newArray,
      },
    });
  };
  
  // Add a new PBN link pair
  const addPbnLink = () => {
    if (formData.pbnSettings.targetUrls.length < 5) {
      setFormData({
        ...formData,
        pbnSettings: {
          ...formData.pbnSettings,
          targetUrls: [...formData.pbnSettings.targetUrls, ''],
          anchorTexts: [...formData.pbnSettings.anchorTexts, ''],
        },
      });
    }
  };
  
  // Remove a PBN link pair
  const removePbnLink = (index: number) => {
    if (formData.pbnSettings.targetUrls.length > 1) {
      const newTargetUrls = [...formData.pbnSettings.targetUrls];
      const newAnchorTexts = [...formData.pbnSettings.anchorTexts];
      newTargetUrls.splice(index, 1);
      newAnchorTexts.splice(index, 1);
      setFormData({
        ...formData,
        pbnSettings: {
          ...formData.pbnSettings,
          targetUrls: newTargetUrls,
          anchorTexts: newAnchorTexts,
        },
      });
    }
  };
  
  // Handle cloud platform selection
  const handleCloudPlatformChange = (platform: 'google' | 'aws' | 'azure') => {
    setFormData({
      ...formData,
      cloudPlatform: platform,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionState('submitting');
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Create FormData for file uploads
      const submitData = new FormData();
      
      // Add text fields
      submitData.append('keywords', JSON.stringify(formData.keywords));
      submitData.append('googleAccount', formData.googleAccount);
      submitData.append('businessDescription', formData.businessDescription);
      submitData.append('nicheUtility', formData.nicheUtility);
      submitData.append('businessUrl', formData.businessUrl);
      submitData.append('youtubeVideos', JSON.stringify(formData.youtubeVideos));
      submitData.append('googleBusinessProfileUrl', formData.googleBusinessProfileUrl);
      submitData.append('customHtml', formData.customHtml);
      
      // Add logo images
      formData.logoImages.forEach((file, index) => {
        submitData.append(`logoImage-${index}`, file);
      });
      
      // Add author bio fields
      submitData.append('authorName', formData.authorName);
      submitData.append('authorExpertise', JSON.stringify(formData.authorExpertise));
      submitData.append('generateAuthorBio', formData.generateAuthorBio.toString());
      
      // Add silo structure
      submitData.append('siloStructure', JSON.stringify(formData.siloStructure));
      
      // Add content scheduling
      submitData.append('contentScheduling', JSON.stringify(formData.contentScheduling));
      
      // Add PBN settings
      submitData.append('pbnSettings', JSON.stringify(formData.pbnSettings));
      
      // Add cloud platform
      submitData.append('cloudPlatform', formData.cloudPlatform);

      // Submit the form
      const response = await fetch('/api/site-builder', {
        method: 'POST',
        body: submitData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      // Redirect user to status page with jobId query param
      if (result.jobId) {
        router.push(`/site-builder/status?jobId=${result.jobId}`);
      } else {
        // Fallback: show success inline if no jobId returned
        setSubmissionState('success');
        setSuccessMessage('Your site is being built! You will receive a PDF with the URLs soon.');
      }
    } catch (error) {
      setSubmissionState('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  // Validation functions
  const isValidUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidYoutubeUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty
    return url.includes('youtube.com/') || url.includes('youtu.be/');
  };

  const isValidEmail = (email: string): boolean => {
    if (!email) return false; // Don't allow empty
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Form validation
  const isFormValid = (): boolean => {
    // At least one keyword is required
    if (!formData.keywords.some(k => k.trim() !== '')) return false;
    
    // Google account is required and must be valid email
    if (!isValidEmail(formData.googleAccount)) return false;
    
    // Business description is required
    if (!formData.businessDescription.trim()) return false;
    
    // Business URL must be valid if provided
    if (!isValidUrl(formData.businessUrl)) return false;
    
    // YouTube URLs must be valid if provided
    if (formData.youtubeVideos.some(url => url && !isValidYoutubeUrl(url))) return false;
    
    // Google Business Profile URL must be valid if provided
    if (formData.googleBusinessProfileUrl && !isValidUrl(formData.googleBusinessProfileUrl)) return false;
    
    // Author name is required if generate bio is checked
    if (formData.generateAuthorBio && !formData.authorName.trim()) return false;
    
    // PBN target URLs must be valid if enabled
    if (formData.pbnSettings.enabled && 
        formData.pbnSettings.targetUrls.some(url => url && !isValidUrl(url))) return false;
    
    return true;
  };

  return (
    <div className="bg-onyx rounded-xl p-6 shadow-md">
      <div className="mb-6 flex items-center">
        <RocketIcon className="w-6 h-6 text-neon-azure mr-2" />
        <h2 className="text-2xl font-sora font-semibold text-ice-white">Site Builder</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Keywords Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-sora text-ice-white">Keywords <span className="text-critical-red">*</span></h3>
          <p className="text-sm text-text-secondary">Enter up to 8 keywords or phrases for your site</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.keywords.map((keyword, index) => (
              <div key={`keyword-${index}`} className="flex">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => handleArrayInputChange(e, 'keywords', index)}
                  placeholder={`Keyword ${index + 1}`}
                  className="input-field w-full"
                  aria-label={`Keyword ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Google Account */}
        <div className="space-y-2">
          <label htmlFor="googleAccount" className="block text-lg font-sora text-ice-white">
            Google Account Email <span className="text-critical-red">*</span>
          </label>
          <p className="text-sm text-text-secondary">We'll use this to create your Google Site</p>
          <input
            type="email"
            id="googleAccount"
            value={formData.googleAccount}
            onChange={(e) => handleInputChange(e, 'googleAccount')}
            placeholder="your.email@gmail.com"
            className="input-field w-full"
            required
          />
          {formData.googleAccount && !isValidEmail(formData.googleAccount) && (
            <p className="text-critical-red text-sm mt-1">Please enter a valid email address</p>
          )}
        </div>

        {/* Business Description */}
        <div className="space-y-2">
          <label htmlFor="businessDescription" className="block text-lg font-sora text-ice-white">
            Business Description <span className="text-critical-red">*</span>
          </label>
          <p className="text-sm text-text-secondary">Describe your business, products, or services</p>
          <textarea
            id="businessDescription"
            value={formData.businessDescription}
            onChange={(e) => handleInputChange(e, 'businessDescription')}
            placeholder="Provide a detailed description of your business..."
            className="input-field w-full h-32 resize-y"
            required
          />
        </div>

        {/* Niche Utility */}
        <div className="space-y-2">
          <label htmlFor="nicheUtility" className="block text-lg font-sora text-ice-white">
            Niche Utility
          </label>
          <p className="text-sm text-text-secondary">Describe the specific utility or purpose of your site</p>
          <input
            type="text"
            id="nicheUtility"
            value={formData.nicheUtility}
            onChange={(e) => handleInputChange(e, 'nicheUtility')}
            placeholder="e.g., Local plumbing services, Online fitness coaching, etc."
            className="input-field w-full"
          />
        </div>

        {/* Business URL */}
        <div className="space-y-2">
          <label htmlFor="businessUrl" className="block text-lg font-sora text-ice-white">
            Business URL
          </label>
          <p className="text-sm text-text-secondary">Your existing website or social media page</p>
          <input
            type="url"
            id="businessUrl"
            value={formData.businessUrl}
            onChange={(e) => handleInputChange(e, 'businessUrl')}
            placeholder="https://your-business.com"
            className="input-field w-full"
          />
          {formData.businessUrl && !isValidUrl(formData.businessUrl) && (
            <p className="text-critical-red text-sm mt-1">Please enter a valid URL</p>
          )}
        </div>

        {/* YouTube Videos */}
        <div className="space-y-4">
          <h3 className="text-lg font-sora text-ice-white">YouTube Videos</h3>
          <p className="text-sm text-text-secondary">Add up to 8 YouTube video URLs to embed in your site</p>
          
          <div className="space-y-3">
            {formData.youtubeVideos.map((video, index) => (
              <div key={`video-${index}`} className="flex">
                <input
                  type="url"
                  value={video}
                  onChange={(e) => handleArrayInputChange(e, 'youtubeVideos', index)}
                  placeholder={`YouTube Video URL ${index + 1}`}
                  className="input-field w-full"
                  aria-label={`YouTube Video URL ${index + 1}`}
                />
                {video && !isValidYoutubeUrl(video) && (
                  <div className="flex items-center ml-2 text-critical-red">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Logo Images */}
        <div className="space-y-2">
          <label htmlFor="logoImages" className="block text-lg font-sora text-ice-white">
            Logo Images
          </label>
          <p className="text-sm text-text-secondary">Upload up to 8 logo or brand images (PNG, JPG, SVG)</p>
          <div className="mt-2 flex flex-col space-y-2">
            <div className="flex items-center justify-center w-full">
              <label className="w-full flex flex-col items-center px-4 py-6 bg-[#1D2029] text-ice-white rounded-lg shadow-lg tracking-wide border border-[#3D4354] border-dashed cursor-pointer hover:bg-[#252A37] transition-all">
                <PlusIcon className="w-8 h-8" />
                <span className="mt-2 text-base">Select up to 8 images</span>
                <input 
                  id="logoImages" 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileChange} 
                />
              </label>
            </div>
            
            {/* Display selected files */}
            {formData.logoImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.logoImages.map((file, index) => (
                  <div key={`file-${index}`} className="relative group">
                    <div className="h-24 bg-[#1D2029] rounded-md flex items-center justify-center p-2 overflow-hidden">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={`Logo ${index + 1}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="text-xs text-text-secondary mt-1 truncate">{file.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Google Business Profile URL */}
        <div className="space-y-2">
          <label htmlFor="googleBusinessProfileUrl" className="block text-lg font-sora text-ice-white">
            Google Business Profile URL
          </label>
          <p className="text-sm text-text-secondary">Your Google Business Profile to embed</p>
          <input
            type="url"
            id="googleBusinessProfileUrl"
            value={formData.googleBusinessProfileUrl}
            onChange={(e) => handleInputChange(e, 'googleBusinessProfileUrl')}
            placeholder="https://business.google.com/..."
            className="input-field w-full"
          />
          {formData.googleBusinessProfileUrl && !isValidUrl(formData.googleBusinessProfileUrl) && (
            <p className="text-critical-red text-sm mt-1">Please enter a valid URL</p>
          )}
        </div>

        {/* Custom HTML */}
        <div className="space-y-2">
          <label htmlFor="customHtml" className="block text-lg font-sora text-ice-white">
            Custom HTML
          </label>
          <p className="text-sm text-text-secondary">Add any custom HTML code you want to include</p>
          <textarea
            id="customHtml"
            value={formData.customHtml}
            onChange={(e) => handleInputChange(e, 'customHtml')}
            placeholder="<div>Your custom HTML here...</div>"
            className="input-field w-full h-32 resize-y font-mono"
          />
        </div>
        
        {/* Author Bio Section */}
        <div className="space-y-4 border-t border-[#3D4354] pt-6">
          <div className="flex items-center">
            <PersonIcon className="w-5 h-5 text-neon-azure mr-2" />
            <h3 className="text-lg font-sora text-ice-white">Author Bio</h3>
          </div>
          <p className="text-sm text-text-secondary">Add author information to improve E-E-A-T signals</p>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="generateAuthorBio"
                checked={formData.generateAuthorBio}
                onChange={(e) => handleCheckboxChange(e, 'generateAuthorBio')}
                className="w-4 h-4 rounded border-[#3D4354] bg-[#1D2029] text-neon-azure focus:ring-neon-azure focus:ring-opacity-25"
              />
              <label htmlFor="generateAuthorBio" className="ml-2 text-ice-white">
                Generate author bio and image with AI
              </label>
            </div>
            
            {formData.generateAuthorBio && (
              <>
                <div className="space-y-2">
                  <label htmlFor="authorName" className="block text-ice-white">
                    Author Name
                  </label>
                  <input
                    type="text"
                    id="authorName"
                    value={formData.authorName}
                    onChange={(e) => handleInputChange(e, 'authorName')}
                    placeholder="John Doe"
                    className="input-field w-full"
                    required={formData.generateAuthorBio}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-ice-white">
                    Author Expertise (up to 3)
                  </label>
                  <div className="space-y-2">
                    {formData.authorExpertise.map((expertise, index) => (
                      <input
                        key={`expertise-${index}`}
                        type="text"
                        value={expertise}
                        onChange={(e) => handleArrayInputChange(e, 'authorExpertise', index)}
                        placeholder={`Expertise ${index + 1} (e.g., SEO, Content Marketing)`}
                        className="input-field w-full"
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Silo Structure Section */}
        <div className="space-y-4 border-t border-[#3D4354] pt-6">
          <div className="flex items-center">
            <LinkBreak2Icon className="w-5 h-5 text-neon-azure mr-2" />
            <h3 className="text-lg font-sora text-ice-white">Silo Structure</h3>
          </div>
          <p className="text-sm text-text-secondary">Organize your content into silos for better SEO</p>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableSiloStructure"
                checked={formData.siloStructure.enabled}
                onChange={(e) => handleCheckboxChange(e, 'siloStructure.enabled')}
                className="w-4 h-4 rounded border-[#3D4354] bg-[#1D2029] text-neon-azure focus:ring-neon-azure focus:ring-opacity-25"
              />
              <label htmlFor="enableSiloStructure" className="ml-2 text-ice-white">
                Enable Silo Structure
              </label>
            </div>
            
            {formData.siloStructure.enabled && (
              <div className="space-y-3 pl-6 border-l-2 border-[#3D4354]">
                <p className="text-sm text-text-secondary">Add up to 5 categories for your silo structure</p>
                
                {formData.siloStructure.categories.map((category, index) => (
                  <div key={`category-${index}`} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => handleCategoryChange(index, e.target.value)}
                      placeholder={`Category ${index + 1}`}
                      className="input-field flex-1"
                    />
                    {formData.siloStructure.categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="p-2 text-critical-red hover:bg-[#252A37] rounded-md"
                        aria-label="Remove category"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                
                {formData.siloStructure.categories.length < 5 && (
                  <button
                    type="button"
                    onClick={addCategory}
                    className="flex items-center text-neon-azure hover:text-quantum-violet transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" /> Add Category
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Content Scheduling Section */}
        <div className="space-y-4 border-t border-[#3D4354] pt-6">
          <div className="flex items-center">
            <CalendarIcon className="w-5 h-5 text-neon-azure mr-2" />
            <h3 className="text-lg font-sora text-ice-white">Content Scheduling</h3>
          </div>
          <p className="text-sm text-text-secondary">Schedule content to be published automatically</p>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enableContentScheduling"
                checked={formData.contentScheduling.enabled}
                onChange={(e) => handleCheckboxChange(e, 'contentScheduling.enabled')}
                className="w-4 h-4 rounded border-[#3D4354] bg-[#1D2029] text-neon-azure focus:ring-neon-azure focus:ring-opacity-25"
              />
              <label htmlFor="enableContentScheduling" className="ml-2 text-ice-white">
                Enable Content Scheduling
              </label>
            </div>
            
            {formData.contentScheduling.enabled && (
              <div className="space-y-3 pl-6 border-l-2 border-[#3D4354]">
                <p className="text-sm text-text-secondary">Schedule up to 5 content pieces</p>
                
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-text-secondary">
                  <div className="col-span-3">Date</div>
                  <div className="col-span-7">Title</div>
                  <div className="col-span-2">Publish</div>
                </div>
                
                {formData.contentScheduling.schedules.map((schedule, index) => (
                  <div key={`schedule-${index}`} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3">
                      <input
                        type="date"
                        value={schedule.date}
                        onChange={(e) => handleScheduleChange(index, 'date', e.target.value)}
                        className="input-field w-full"
                      />
                    </div>
                    <div className="col-span-7">
                      <input
                        type="text"
                        value={schedule.title}
                        onChange={(e) => handleScheduleChange(index, 'title', e.target.value)}
                        placeholder="Content title"
                        className="input-field w-full"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <input
                        type="checkbox"
                        checked={schedule.publish}
                        onChange={(e) => handleScheduleChange(index, 'publish', e.target.checked)}
                        className="w-4 h-4 rounded border-[#3D4354] bg-[#1D2029] text-neon-azure focus:ring-neon-azure focus:ring-opacity-25"
                      />
                    </div>
                    <div className="col-span-1">
                      {formData.contentScheduling.schedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSchedule(index)}
                          className="p-1 text-critical-red hover:bg-[#252A37] rounded-md"
                          aria-label="Remove schedule"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {formData.contentScheduling.schedules.length < 5 && (
                  <button
                    type="button"
                    onClick={addSchedule}
                    className="flex items-center text-neon-azure hover:text-quantum-violet transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" /> Add Schedule
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* PBN Settings Section */}
        <div className="space-y-4 border-t border-[#3D4354] pt-6">
          <div className="flex items-center">
            <LinkBreak2Icon className="w-5 h-5 text-neon-azure mr-2" />
            <h3 className="text-lg font-sora text-ice-white">PBN Settings</h3>
          </div>
          <p className="text-sm text-text-secondary">Configure private blog network linking</p>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enablePbnLinking"
                checked={formData.pbnSettings.enabled}
                onChange={(e) => handleCheckboxChange(e, 'pbnSettings.enabled')}
                className="w-4 h-4 rounded border-[#3D4354] bg-[#1D2029] text-neon-azure focus:ring-neon-azure focus:ring-opacity-25"
              />
              <label htmlFor="enablePbnLinking" className="ml-2 text-ice-white">
                Enable PBN Linking
              </label>
            </div>
            
            {formData.pbnSettings.enabled && (
              <div className="space-y-3 pl-6 border-l-2 border-[#3D4354]">
                <p className="text-sm text-text-secondary">Add up to 5 target URLs with anchor text</p>
                
                {formData.pbnSettings.targetUrls.map((targetUrl, index) => (
                  <div key={`pbn-${index}`} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <input
                        type="url"
                        value={targetUrl}
                        onChange={(e) => handlePbnChange(index, 'targetUrls', e.target.value)}
                        placeholder="Target URL"
                        className="input-field w-full"
                      />
                      {targetUrl && !isValidUrl(targetUrl) && (
                        <p className="text-critical-red text-xs mt-1">Invalid URL</p>
                      )}
                    </div>
                    <div className="col-span-6">
                      <input
                        type="text"
                        value={formData.pbnSettings.anchorTexts[index]}
                        onChange={(e) => handlePbnChange(index, 'anchorTexts', e.target.value)}
                        placeholder="Anchor Text"
                        className="input-field w-full"
                      />
                    </div>
                    <div className="col-span-1">
                      {formData.pbnSettings.targetUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePbnLink(index)}
                          className="p-1 text-critical-red hover:bg-[#252A37] rounded-md"
                          aria-label="Remove PBN link"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {formData.pbnSettings.targetUrls.length < 5 && (
                  <button
                    type="button"
                    onClick={addPbnLink}
                    className="flex items-center text-neon-azure hover:text-quantum-violet transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" /> Add PBN Link
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Cloud Platform Section */}
        <div className="space-y-4 border-t border-[#3D4354] pt-6">
          <div className="flex items-center">
            <RocketIcon className="w-5 h-5 text-neon-azure mr-2" />
            <h3 className="text-lg font-sora text-ice-white">Cloud Platform</h3>
          </div>
          <p className="text-sm text-text-secondary">Select where to host your site</p>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="cloudGoogle"
                name="cloudPlatform"
                checked={formData.cloudPlatform === 'google'}
                onChange={() => handleCloudPlatformChange('google')}
                className="w-4 h-4 border-[#3D4354] bg-[#1D2029] text-neon-azure focus:ring-neon-azure focus:ring-opacity-25"
              />
              <label htmlFor="cloudGoogle" className="ml-2 text-ice-white">
                Google Sites
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="radio"
                id="cloudAws"
                name="cloudPlatform"
                checked={formData.cloudPlatform === 'aws'}
                onChange={() => handleCloudPlatformChange('aws')}
                className="w-4 h-4 border-[#3D4354] bg-[#1D2029] text-neon-azure focus:ring-neon-azure focus:ring-opacity-25"
              />
              <label htmlFor="cloudAws" className="ml-2 text-ice-white">
                AWS
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="radio"
                id="cloudAzure"
                name="cloudPlatform"
                checked={formData.cloudPlatform === 'azure'}
                onChange={() => handleCloudPlatformChange('azure')}
                className="w-4 h-4 border-[#3D4354] bg-[#1D2029] text-neon-azure focus:ring-neon-azure focus:ring-opacity-25"
              />
              <label htmlFor="cloudAzure" className="ml-2 text-ice-white">
                Azure
              </label>
            </div>
          </div>
        </div>

        {/* Submission Status Messages */}
        {submissionState === 'error' && (
          <div className="p-4 bg-critical-red bg-opacity-20 border border-critical-red rounded-md">
            <p className="text-critical-red flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              {errorMessage || 'An error occurred. Please try again.'}
            </p>
          </div>
        )}

        {submissionState === 'success' && (
          <div className="p-4 bg-lime-pulse bg-opacity-20 border border-lime-pulse rounded-md">
            <p className="text-lime-pulse flex items-center">
              <CheckCircledIcon className="w-5 h-5 mr-2" />
              {successMessage || 'Success! Your site is being built.'}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={submissionState === 'submitting' || !isFormValid()}
            className={`w-full py-3 px-6 rounded-md font-medium text-lg flex items-center justify-center transition-all
              ${isFormValid() && submissionState !== 'submitting' 
                ? 'bg-neon-azure text-carbon hover:bg-opacity-90' 
                : 'bg-[#3D4354] text-text-secondary cursor-not-allowed'}`}
          >
            {submissionState === 'submitting' ? (
              <>
                <ReloadIcon className="w-5 h-5 mr-2 animate-spin" />
                Building Site...
              </>
            ) : (
              <>
                <RocketIcon className="w-5 h-5 mr-2" />
                Start Building
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BuilderForm;
