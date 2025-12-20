import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Text, Button, Surface, Badge } from '@cloudflare/kumo'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner, ErrorMessage } from '../components/common/LoadingStates'

export default function Admin() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || 'sites')
  const [pendingSites, setPendingSites] = useState([])
  const [allSites, setAllSites] = useState([])
  const [users, setUsers] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [siteSearchQuery, setSiteSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)
  const [backfillStatus, setBackfillStatus] = useState(null)
  const [backfillLoading, setBackfillLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [categoryLoading, setCategoryLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'sites') {
      fetchPendingSites()
    } else if (activeTab === 'manage') {
      // Debounce search - wait 500ms after user stops typing
      const timeoutId = setTimeout(() => {
        fetchAllSites()
      }, 500)
      
      return () => clearTimeout(timeoutId)
    } else if (activeTab === 'users') {
      // Debounce search - wait 500ms after user stops typing
      const timeoutId = setTimeout(() => {
        fetchUsers()
      }, 500)
      
      return () => clearTimeout(timeoutId)
    } else if (activeTab === 'categories') {
      fetchCategories()
    }
  }, [activeTab, searchQuery, siteSearchQuery, statusFilter])

  const fetchPendingSites = async () => {
    try {
      setLoading(true)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/admin/pending`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending sites')
      }
      
      const data = await response.json()
      setPendingSites(data.sites || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (siteId) => {
    try {
      setProcessingId(siteId)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/admin/sites/${siteId}/approve`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to approve site')
      }
      
      // Remove from pending list
      setPendingSites(pendingSites.filter(site => site.id !== siteId))
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (siteId) => {
    try {
      setProcessingId(siteId)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/admin/sites/${siteId}/reject`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to reject site')
      }
      
      // Remove from pending list
      setPendingSites(pendingSites.filter(site => site.id !== siteId))
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const fetchAllSites = async () => {
    try {
      setLoading(true)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const params = new URLSearchParams()
      if (siteSearchQuery) params.append('search', siteSearchQuery)
      if (statusFilter) params.append('status', statusFilter)
      
      const url = `${API_URL}/admin/sites${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch sites')
      }
      
      const data = await response.json()
      setAllSites(data.sites || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFeatured = async (siteId) => {
    try {
      setProcessingId(siteId)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const url = `${API_URL}/admin/sites/${siteId}/toggle-featured`
      console.log('[Admin] Toggling featured for site:', siteId, 'URL:', url)
      
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include'
      })
      
      console.log('[Admin] Toggle response status:', response.status)
      const data = await response.json()
      console.log('[Admin] Toggle response data:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle featured status')
      }
      
      console.log('[Admin] Successfully toggled, new status:', data.is_featured)
      
      // Refresh sites list
      fetchAllSites()
    } catch (err) {
      console.error('[Admin] Toggle featured error:', err)
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleUpdateStatus = async (siteId, status) => {
    try {
      setProcessingId(siteId)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/admin/sites/${siteId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update site status')
      }
      
      // Refresh sites list
      fetchAllSites()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const url = searchQuery 
        ? `${API_URL}/admin/users?search=${encodeURIComponent(searchQuery)}`
        : `${API_URL}/admin/users`
      
      const response = await fetch(url, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradeUser = async (userId, newRole) => {
    try {
      setProcessingId(userId)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/admin/users/${userId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: newRole })
      })
      
      if (!response.ok) {
        throw new Error('Failed to upgrade user')
      }
      
      // Refresh users list
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      setProcessingId(userId)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await fetchUsers()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Delete user error:', error)
      alert('Failed to delete user')
    } finally {
      setProcessingId(null)
    }
  }

  const handleBackfillEmbeddings = async () => {
    if (!window.confirm('This will generate AI embeddings for all approved sites. This may take a few minutes. Continue?')) {
      return
    }

    try {
      setBackfillLoading(true)
      setBackfillStatus(null)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/admin/backfill-embeddings`, {
        method: 'POST',
        credentials: 'include'
      })

      const data = await response.json()
      
      if (response.ok) {
        setBackfillStatus({
          success: true,
          message: `Successfully generated embeddings for ${data.success} sites. Failed: ${data.failed}`,
          data
        })
      } else {
        setBackfillStatus({
          success: false,
          message: data.error || 'Failed to backfill embeddings'
        })
      }
    } catch (error) {
      console.error('Backfill error:', error)
      setBackfillStatus({
        success: false,
        message: 'Failed to backfill embeddings'
      })
    } finally {
      setBackfillLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/categories`)
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Fetch categories error:', error)
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    
    if (!newCategoryName.trim()) {
      alert('Category name is required')
      return
    }

    try {
      setCategoryLoading(true)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setNewCategoryName('')
        setNewCategoryDescription('')
        await fetchCategories()
        alert('Category created successfully!')
      } else {
        alert(data.error || 'Failed to create category')
      }
    } catch (error) {
      console.error('Create category error:', error)
      alert('Failed to create category')
    } finally {
      setCategoryLoading(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Text as="h1" size="4xl" weight="bold" className="mb-2">
                Admin Panel
              </Text>
              <Text color="secondary">
                Manage site submissions and users
              </Text>
            </div>
            {user.role === 'super_admin' && (
              <Button 
                onClick={handleBackfillEmbeddings}
                disabled={backfillLoading}
                variant="secondary"
              >
                {backfillLoading ? 'Generating Embeddings...' : 'Backfill Search Embeddings'}
              </Button>
            )}
          </div>
          {backfillStatus && (
            <div className={`mt-4 p-4 rounded-lg ${backfillStatus.success ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'}`}>
              <Text>{backfillStatus.message}</Text>
              {backfillStatus.data && (
                <Text size="sm" className="mt-2">
                  Total: {backfillStatus.data.total} | Success: {backfillStatus.data.success} | Failed: {backfillStatus.data.failed}
                </Text>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('sites')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'sites'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Pending Sites
          </button>
          {user.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'manage'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Manage Sites
            </button>
          )}
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Users
          </button>
          {user.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'categories'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Categories
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Surface className="p-6">
            <Text color="secondary" size="sm" className="mb-1">Pending Review</Text>
            <Text size="3xl" weight="bold">{pendingSites.length}</Text>
          </Surface>
        </div>

        {/* Sites Tab */}
        {activeTab === 'sites' && (
          <>
        {pendingSites.length === 0 ? (
          <Surface className="p-12 text-center">
            <Text color="secondary" size="lg">
              No pending submissions to review
            </Text>
          </Surface>
        ) : (
          <div className="space-y-4">
            {pendingSites.map((site) => (
              <Surface key={site.id} className="p-6">
                <div className="flex items-start justify-between gap-6">
                  {/* Site Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Text as="h3" size="xl" weight="semibold">
                        {site.name}
                      </Text>
                      <Badge variant="warning" size="sm">Pending</Badge>
                      <Badge variant="info" size="sm">{site.category}</Badge>
                    </div>
                    
                    <a 
                      href={site.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline mb-3 block"
                    >
                      {site.url}
                    </a>
                    
                    <Text color="secondary" className="mb-3">
                      {site.short_description}
                    </Text>
                    
                    {site.description && (
                      <Text color="secondary" size="sm" className="mb-3">
                        {site.description}
                      </Text>
                    )}
                    
                    {site.tags && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(typeof site.tags === 'string' ? JSON.parse(site.tags) : site.tags).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <Text color="secondary" size="sm">
                      Submitted {new Date(site.created_at).toLocaleDateString()}
                    </Text>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={processingId === site.id}
                      >
                        <Eye size={16} weight="bold" />
                        Visit
                      </Button>
                    </a>
                    
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApprove(site.id)}
                      disabled={processingId === site.id}
                    >
                      <Check size={16} weight="bold" />
                      Approve
                    </Button>
                    
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleReject(site.id)}
                      disabled={processingId === site.id}
                    >
                      <X size={16} weight="bold" />
                      Reject
                    </Button>
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        )}
          </>
        )}

        {/* Manage Sites Tab */}
        {activeTab === 'manage' && (
          <>
            {/* Search and Filter */}
            <div className="mb-6 flex gap-4">
              <div className="relative flex-1">
                <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sites by name, URL, or description..."
                  value={siteSearchQuery}
                  onChange={(e) => setSiteSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Sites Table */}
            {allSites.length === 0 ? (
              <Surface className="p-12 text-center">
                <Text color="secondary" size="lg">
                  No sites found
                </Text>
              </Surface>
            ) : (
              <Surface className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left p-4">
                        <div className="flex flex-col">
                          <Text weight="semibold" size="sm">Featured</Text>
                          <Text color="secondary" size="xs">(up to 3)</Text>
                        </div>
                      </th>
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
                        <Text weight="semibold" size="sm">Submitted</Text>
                      </th>
                      <th className="text-left p-4">
                        <Text weight="semibold" size="sm">Actions</Text>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allSites.map((site) => (
                      <tr key={site.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={site.is_featured === 1}
                            onChange={() => handleToggleFeatured(site.id)}
                            disabled={processingId === site.id}
                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                          />
                        </td>
                        <td className="p-4">
                          <Text weight="semibold">{site.name}</Text>
                          {site.submitter_name && (
                            <Text color="secondary" size="xs">
                              by {site.submitter_name}
                            </Text>
                          )}
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
                            variant={site.status === 'approved' ? 'success' : site.status === 'pending' ? 'warning' : 'danger'}
                            size="sm"
                          >
                            {site.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Text size="sm" color="secondary">
                            {new Date(site.created_at).toLocaleDateString()}
                          </Text>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {site.status !== 'approved' && (
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleUpdateStatus(site.id, 'approved')}
                                disabled={processingId === site.id}
                              >
                                Approve
                              </Button>
                            )}
                            {site.status !== 'rejected' && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleUpdateStatus(site.id, 'rejected')}
                                disabled={processingId === site.id}
                              >
                                Reject
                              </Button>
                            )}
                            <Link to={`/submit?edit=${site.id}&from=admin`}>
                              <Button variant="outlined" size="sm">
                                Edit
                              </Button>
                            </Link>
                            <a href={`/site/${site.id}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="outlined" size="sm">
                                View
                              </Button>
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Surface>
            )}
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Users List */}
            {users.length === 0 ? (
              <Surface className="p-12 text-center">
                <Text color="secondary" size="lg">
                  No users found
                </Text>
              </Surface>
            ) : (
              <div className="space-y-4">
                {users.map((u) => (
                  <Surface key={u.id} className="p-6">
                    <div className="flex items-center justify-between gap-6">
                      {/* User Info */}
                      <div className="flex items-center gap-4 flex-1">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.name} className="w-12 h-12 rounded-full" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                            {u.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Text weight="semibold">{u.name}</Text>
                            <Badge 
                              variant={u.role === 'super_admin' ? 'success' : u.role === 'admin' ? 'info' : 'secondary'}
                              size="sm"
                            >
                              {u.role}
                            </Badge>
                          </div>
                          <Text color="secondary" size="sm">{u.email}</Text>
                          <Text color="secondary" size="sm">
                            Joined {new Date(u.created_at).toLocaleDateString()}
                          </Text>
                        </div>
                      </div>

                      {/* Actions */}
                      {user.role === 'super_admin' && u.id !== user.id && (
                        <div className="flex gap-2">
                          {u.role !== 'super_admin' && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleUpgradeUser(u.id, 'super_admin')}
                              disabled={processingId === u.id}
                            >
                              Make Super Admin
                            </Button>
                          )}
                          {u.role !== 'admin' && u.role !== 'super_admin' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleUpgradeUser(u.id, 'admin')}
                              disabled={processingId === u.id}
                            >
                              Make Admin
                            </Button>
                          )}
                          {u.role !== 'user' && (
                            <Button
                              variant="outlined"
                              size="sm"
                              onClick={() => handleUpgradeUser(u.id, 'user')}
                              disabled={processingId === u.id}
                            >
                              Demote to User
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={processingId === u.id}
                          >
                            Delete User
                          </Button>
                        </div>
                      )}
                    </div>
                  </Surface>
                ))}
              </div>
            )}
          </>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <>
            {/* Create Category Form */}
            <Surface className="p-6 mb-6">
              <Text as="h2" size="xl" weight="bold" className="mb-4">
                Create New Category
              </Text>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., AI Tools, Design, Development"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Brief description of this category..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <Button type="submit" variant="primary" disabled={categoryLoading}>
                  {categoryLoading ? 'Creating...' : 'Create Category'}
                </Button>
              </form>
            </Surface>

            {/* Categories List */}
            <Surface className="p-6">
              <Text as="h2" size="xl" weight="bold" className="mb-4">
                Existing Categories
              </Text>
              {categories.length === 0 ? (
                <Text color="secondary" className="text-center py-8">
                  No categories found
                </Text>
              ) : (
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <Text weight="semibold" className="mb-1">
                            {category.name}
                          </Text>
                          {category.description && (
                            <Text color="secondary" size="sm">
                              {category.description}
                            </Text>
                          )}
                          <Text color="secondary" size="xs" className="mt-1">
                            Slug: {category.slug}
                          </Text>
                        </div>
                        <Badge variant="secondary" size="sm">
                          ID: {category.id}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Surface>
          </>
        )}

      </div>
    </div>
  )
}
