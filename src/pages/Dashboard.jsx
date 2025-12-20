import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Text, Button, Surface, Badge } from '@cloudflare/kumo';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { Pencil } from '@phosphor-icons/react/dist/csr/Pencil';
import { Trash } from '@phosphor-icons/react/dist/csr/Trash';
import { Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { Heart } from '@phosphor-icons/react/dist/csr/Heart';
import { useAuth } from '../contexts/AuthContext';
import { LoadingSpinner, ErrorMessage } from '../components/common/LoadingStates';

export default function Dashboard() {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMySites();
  }, []);

  const fetchMySites = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sites/my`, {
        credentials: 'include'
      });
      const data = await response.json();
      setSites(data.sites || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this site?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/sites/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setSites(sites.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'neutral';
    }
  };

  const totalViews = sites.reduce((sum, site) => sum + (site.views || 0), 0);
  const totalLikes = sites.reduce((sum, site) => sum + (site.likes || 0), 0);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <Text as="h1" size="4xl" weight="bold" className="mb-3">
            Welcome back, {user?.name}!
          </Text>
          <Text color="secondary" size="lg">
            Manage your submitted sites and track their performance
          </Text>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Surface className="p-6">
            <Text color="secondary" className="mb-2">Total Sites</Text>
            <Text size="3xl" weight="bold">{sites.length}</Text>
          </Surface>
          <Surface className="p-6">
            <Text color="secondary" className="mb-2">Total Views</Text>
            <Text size="3xl" weight="bold">{totalViews}</Text>
          </Surface>
          <Surface className="p-6">
            <Text color="secondary" className="mb-2">Total Likes</Text>
            <Text size="3xl" weight="bold">{totalLikes}</Text>
          </Surface>
        </div>

        {/* My Sites Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Text as="h2" size="2xl" weight="bold">
              My Sites
            </Text>
            <Link to="/submit">
              <Button variant="primary">
                <Plus size={20} weight="bold" />
                Submit New Site
              </Button>
            </Link>
          </div>

          {loading && <LoadingSpinner />}
          {error && <ErrorMessage error={error} retry={fetchMySites} />}

          {!loading && !error && sites.length === 0 && (
            <Surface className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus size={32} className="text-gray-400" />
                </div>
                <Text size="xl" weight="semibold" className="mb-2">
                  No sites yet
                </Text>
                <Text color="secondary" className="mb-6">
                  Submit your first website to get started. Share your work with the community!
                </Text>
                <Link to="/submit">
                  <Button variant="primary">
                    <Plus size={20} weight="bold" />
                    Submit Your First Site
                  </Button>
                </Link>
              </div>
            </Surface>
          )}

          {!loading && !error && sites.length > 0 && (
            <Surface>
              <table className="w-full">
                <thead className="border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left p-4">
                      <Text weight="semibold" size="sm">Site Name</Text>
                    </th>
                    <th className="text-left p-4">
                      <Text weight="semibold" size="sm">URL</Text>
                    </th>
                    <th className="text-left p-4">
                      <Text weight="semibold" size="sm">Status</Text>
                    </th>
                    <th className="text-left p-4">
                      <Text weight="semibold" size="sm">Views</Text>
                    </th>
                    <th className="text-left p-4">
                      <Text weight="semibold" size="sm">Likes</Text>
                    </th>
                    <th className="text-left p-4">
                      <Text weight="semibold" size="sm">Actions</Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sites.map((site) => (
                    <tr key={site.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-4">
                        <Text weight="semibold">{site.name}</Text>
                      </td>
                      <td className="p-4">
                        <a 
                          href={site.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                        >
                          {site.url.length > 40 ? site.url.substring(0, 40) + '...' : site.url}
                        </a>
                      </td>
                      <td className="p-4">
                        <Badge 
                          variant={getStatusColor(site.status)}
                          size="sm"
                        >
                          {site.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Eye size={16} className="text-gray-400" />
                          <Text size="sm">{site.views || 0}</Text>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Heart size={16} className="text-gray-400" />
                          <Text size="sm">{site.likes || 0}</Text>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Link to={`/submit?edit=${site.id}&from=dashboard`}>
                            <Button variant="outlined" size="sm">
                              <Pencil size={16} />
                              Edit
                            </Button>
                          </Link>
                          <Button 
                            variant="outlined" 
                            size="sm"
                            onClick={() => handleDelete(site.id)}
                          >
                            <Trash size={16} />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Surface>
          )}
        </div>
      </div>
    </div>
  );
}
