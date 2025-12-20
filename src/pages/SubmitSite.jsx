import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Text, Button, Surface } from '@cloudflare/kumo';
import { UploadSimple } from '@phosphor-icons/react/dist/csr/UploadSimple';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { useAuth } from '../contexts/AuthContext';

export default function SubmitSite() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const fromPage = searchParams.get('from');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!editId);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    short_description: '',
    description: '',
    category: '',
    tags: ''
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editId && isAuthenticated) {
      fetchSiteData();
    }
  }, [editId, isAuthenticated]);

  const fetchCategories = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api';
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      setCategories(data.categories || []);
      
      // Set default category to first one's slug if not editing
      if (!editId && data.categories?.length > 0) {
        setFormData(prev => ({ ...prev, category: data.categories[0].slug }));
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      // Fallback to empty array if fetch fails
      setCategories([]);
    }
  };

  // Add paste event listener for clipboard images
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            // Set image directly instead of calling handleImageChange
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const fetchSiteData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/sites/${editId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok && data.site) {
        const site = data.site;
        setFormData({
          name: site.name || '',
          url: site.url || '',
          short_description: site.short_description || '',
          description: site.description || '',
          category: site.category || 'saas',
          tags: Array.isArray(site.tags) ? site.tags.join(', ') : (typeof site.tags === 'string' ? JSON.parse(site.tags).join(', ') : '')
        });
      }
    } catch (err) {
      setError('Failed to load site data');
    } finally {
      setLoadingData(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20">
        <div className="text-center">
          <Text size="2xl" weight="bold" className="mb-4">Sign in to Submit</Text>
          <Text color="secondary" className="mb-6">
            You need to be signed in to submit a site
          </Text>
          <Button variant="primary" onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      // Upload image first if there is one
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      
      let thumbnailUrl = null;
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);
        
        const imageResponse = await fetch(`${API_URL}/upload/image`, {
          method: 'POST',
          credentials: 'include',
          body: imageFormData
        });
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          thumbnailUrl = imageData.url;
        }
      }
      
      const url = editId 
        ? `${API_URL}/sites/${editId}`
        : `${API_URL}/sites`;
      const method = editId ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        tags
      };
      
      if (thumbnailUrl) {
        payload.thumbnail_url = thumbnailUrl;
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to submit site');
        throw new Error(errorMsg);
      }

      // Redirect based on where the edit was initiated from
      if (fromPage === 'admin') {
        navigate('/admin?tab=manage');
      } else if (fromPage === 'dashboard' || editId) {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-8">
          <Text as="h1" size="3xl" weight="bold" className="mb-3">
            {editId ? 'Edit Your Site' : 'Submit Your Site'}
          </Text>
          <Text color="secondary" size="lg">
            {editId ? 'Update your site information below.' : 'Share your website with the community. Submissions are reviewed before going live.'}
          </Text>
        </div>

        <Surface className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <Text className="text-red-600 dark:text-red-400">{error}</Text>
              </div>
            )}

            <div>
              <label className="block mb-2">
                <Text weight="semibold">Site Name *</Text>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="My Awesome Site"
              />
            </div>

            <div>
              <label className="block mb-2">
                <Text weight="semibold">URL *</Text>
              </label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block mb-2">
                <Text weight="semibold">Short Description *</Text>
              </label>
              <input
                type="text"
                name="short_description"
                value={formData.short_description}
                onChange={handleChange}
                required
                maxLength={100}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="A brief one-liner about your site"
              />
              <Text size="sm" color="secondary" className="mt-1">
                {formData.short_description.length}/100 characters
              </Text>
            </div>

            <div>
              <label className="block mb-2">
                <Text weight="semibold">Full Description</Text>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us more about your site..."
              />
            </div>

            <div>
              <label className="block mb-2">
                <Text weight="semibold">Category *</Text>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2">
                <Text weight="semibold">Tags</Text>
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="react, nextjs, tailwind (comma-separated)"
              />
              <Text size="sm" color="secondary" className="mt-1">
                Separate tags with commas
              </Text>
            </div>

            <div>
              <label className="block mb-2">
                <Text weight="semibold">Site Preview Image</Text>
              </label>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X size={20} weight="bold" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadSimple size={48} className="mx-auto mb-4 text-gray-400" />
                    <Text weight="semibold" className="mb-2">
                      Drag and drop, paste, or click to select an image
                    </Text>
                    <Text size="sm" color="secondary" className="mb-4">
                      Recommended: 1200x630px (16:9 aspect ratio)
                    </Text>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleImageChange(e.target.files[0])}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button
                        type="button"
                        variant="outlined"
                        size="sm"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        Select Image
                      </Button>
                    </label>
                  </div>
                )}
              </div>
              <Text size="sm" color="secondary" className="mt-1">
                Upload a custom preview image for this site
              </Text>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (editId ? 'Updating...' : 'Submitting...') : (editId ? 'Update Site' : 'Submit Site')}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => {
                  // Redirect based on where the edit was initiated from
                  if (fromPage === 'admin') {
                    navigate('/admin?tab=manage');
                  } else {
                    navigate('/dashboard');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Surface>
      </div>
    </div>
  );
}
