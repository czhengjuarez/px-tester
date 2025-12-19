import { useState, useEffect } from 'react'
import { Text, Button, Surface, Badge } from '@cloudflare/kumo'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { Copy } from '@phosphor-icons/react/dist/csr/Copy'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner, ErrorMessage } from '../components/common/LoadingStates'
import api from '../services/api'

export default function Admin() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('sites')
  const [pendingSites, setPendingSites] = useState([])
  const [allSites, setAllSites] = useState([])
  const [users, setUsers] = useState([])
  const [invites, setInvites] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [siteSearchQuery, setSiteSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)
  const [copiedCode, setCopiedCode] = useState(null)

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
    } else if (activeTab === 'invites') {
      fetchInvites()
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
      const response = await fetch(`${API_URL}/admin/sites/${siteId}/toggle-featured`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to toggle featured status')
      }
      
      // Refresh sites list
      fetchAllSites()
    } catch (err) {
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
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      setProcessingId(userId)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete user')
      }
      
      // Refresh users list
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const fetchInvites = async () => {
    try {
      setLoading(true)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/admin/invites`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch invites')
      }
      
      const data = await response.json()
      setInvites(data.invites || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvite = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/admin/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail || null })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create invite')
      }
      
      const data = await response.json()
      
      // Show success message
      if (data.emailSent) {
        alert(`Invite created and email sent to ${inviteEmail}!`)
      } else if (inviteEmail) {
        alert(`Invite created but email failed to send. You can copy the link manually.`)
      } else {
        alert('Invite link created! Copy it to share.')
      }
      
      setInviteEmail('')
      fetchInvites()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeInvite = async (inviteId) => {
    try {
      setProcessingId(inviteId)
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/admin/invites/${inviteId}/revoke`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to revoke invite')
      }
      
      fetchInvites()
    } catch (err) {
      setError(err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const copyInviteLink = (code) => {
    const inviteUrl = `${window.location.origin}/invite/${code}`
    navigator.clipboard.writeText(inviteUrl)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
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
          <Text as="h1" size="4xl" weight="bold" className="mb-2">
            Admin Panel
          </Text>
          <Text color="secondary">
            Manage site submissions and users
          </Text>
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
              onClick={() => setActiveTab('invites')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'invites'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Invites
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

            {/* Sites List */}
            {allSites.length === 0 ? (
              <Surface className="p-12 text-center">
                <Text color="secondary" size="lg">
                  No sites found
                </Text>
              </Surface>
            ) : (
              <div className="space-y-4">
                {allSites.map((site) => (
                  <Surface key={site.id} className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      {/* Site Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Text size="lg" weight="semibold">{site.name}</Text>
                          <Badge 
                            variant={site.status === 'approved' ? 'success' : site.status === 'pending' ? 'warning' : 'danger'}
                            size="sm"
                          >
                            {site.status}
                          </Badge>
                          {site.is_featured === 1 && (
                            <Badge variant="info" size="sm">
                              ⭐ Featured
                            </Badge>
                          )}
                        </div>
                        <a 
                          href={site.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline mb-2 block"
                        >
                          {site.url}
                        </a>
                        <Text color="secondary" size="sm" className="mb-2">
                          {site.short_description || site.description?.substring(0, 100)}
                        </Text>
                        {site.submitter_name && (
                          <Text color="secondary" size="sm">
                            Submitted by {site.submitter_name} ({site.submitter_email})
                          </Text>
                        )}
                        <Text color="secondary" size="sm">
                          Created {new Date(site.created_at).toLocaleDateString()}
                        </Text>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button
                          variant={site.is_featured ? 'warning' : 'secondary'}
                          size="sm"
                          onClick={() => handleToggleFeatured(site.id)}
                          disabled={processingId === site.id}
                        >
                          {site.is_featured ? '⭐ Unfeature' : '⭐ Feature'}
                        </Button>
                        
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
                        
                        <a href={`/site/${site.id}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="outlined" size="sm">
                            View Details
                          </Button>
                        </a>
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
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

        {/* Invites Tab */}
        {activeTab === 'invites' && user.role === 'super_admin' && (
          <>
            {/* Create Invite Form */}
            <Surface className="p-6 mb-6">
              <Text size="lg" weight="semibold" className="mb-4">Create New Invite</Text>
              <form onSubmit={handleCreateInvite} className="flex gap-4">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500"
                />
                <Button type="submit" variant="primary">
                  {inviteEmail ? 'Send Invite Email' : 'Generate Link'}
                </Button>
              </form>
              <Text color="secondary" size="sm" className="mt-2">
                {inviteEmail 
                  ? '✉️ An invitation email will be sent to this address with the invite link'
                  : 'Enter an email to send an invitation, or leave blank to generate a shareable link'}
              </Text>
            </Surface>

            {/* Invites List */}
            {invites.length === 0 ? (
              <Surface className="p-12 text-center">
                <Text color="secondary" size="lg">
                  No invites created yet
                </Text>
              </Surface>
            ) : (
              <div className="space-y-4">
                {invites.map((invite) => (
                  <Surface key={invite.id} className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      {/* Invite Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Text weight="semibold" className="font-mono">{invite.code}</Text>
                          <Badge 
                            variant={
                              invite.status === 'accepted' ? 'success' : 
                              invite.status === 'revoked' ? 'danger' : 
                              invite.expires_at < Date.now() ? 'warning' : 'info'
                            }
                            size="sm"
                          >
                            {invite.status === 'accepted' ? 'Used' : 
                             invite.status === 'revoked' ? 'Revoked' : 
                             invite.expires_at < Date.now() ? 'Expired' : 'Active'}
                          </Badge>
                        </div>
                        
                        {invite.email && (
                          <Text color="secondary" size="sm" className="mb-1">
                            For: {invite.email}
                          </Text>
                        )}
                        
                        <Text color="secondary" size="sm" className="mb-1">
                          Created by: {invite.invited_by_name}
                        </Text>
                        
                        <Text color="secondary" size="sm" className="mb-1">
                          Created: {new Date(invite.created_at).toLocaleDateString()}
                        </Text>
                        
                        <Text color="secondary" size="sm">
                          Expires: {new Date(invite.expires_at).toLocaleDateString()}
                        </Text>

                        {invite.used_by && (
                          <Text color="secondary" size="sm" className="mt-2">
                            Used by: {invite.used_by_name} ({invite.used_by_email})
                          </Text>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {invite.status === 'pending' && invite.expires_at > Date.now() && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => copyInviteLink(invite.code)}
                              disabled={processingId === invite.id}
                            >
                              <Copy size={16} weight="bold" />
                              {copiedCode === invite.code ? 'Copied!' : 'Copy Link'}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRevokeInvite(invite.id)}
                              disabled={processingId === invite.id}
                            >
                              Revoke
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
