import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Text, Button, Surface } from '@cloudflare/kumo';
import { useAuth } from '../contexts/AuthContext';

const categories = [
  { id: 'saas', name: 'SaaS' },
  { id: 'portfolio', name: 'Portfolio' },
  { id: 'ecommerce', name: 'E-commerce' },
  { id: 'blog', name: 'Blog' },
  { id: 'agency', name: 'Agency' },
  { id: 'productivity', name: 'Productivity' },
  { id: 'design', name: 'Design' },
  { id: 'development', name: 'Development' }
];

export default function SubmitSite() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    short_description: '',
    description: '',
    category: 'saas',
    tags: ''
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const tags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          tags
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : (data.error || 'Failed to submit site');
        throw new Error(errorMsg);
      }

      navigate('/dashboard');
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
            Submit Your Site
          </Text>
          <Text color="secondary" size="lg">
            Share your website with the community. Submissions are reviewed before going live.
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
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
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

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Submitting...' : 'Submit Site'}
              </Button>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/dashboard')}
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
