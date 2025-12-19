import { useState, useEffect } from 'react'
import { Text, Button, Surface, Badge } from '@cloudflare/kumo'
import { Check } from '@phosphor-icons/react/dist/csr/Check'
import { X } from '@phosphor-icons/react/dist/csr/X'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { useAuth } from '../contexts/AuthContext'
import { LoadingSpinner, ErrorMessage } from '../components/common/LoadingStates'
import api from '../services/api'

export default function Admin() {
  const { user } = useAuth()
  const [pendingSites, setPendingSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    fetchPendingSites()
  }, [])

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
            Review and approve pending site submissions
          </Text>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Surface className="p-6">
            <Text color="secondary" size="sm" className="mb-1">Pending Review</Text>
            <Text size="3xl" weight="bold">{pendingSites.length}</Text>
          </Surface>
        </div>

        {/* Pending Sites */}
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
      </div>
    </div>
  )
}
