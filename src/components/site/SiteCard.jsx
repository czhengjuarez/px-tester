import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Surface, Text, Badge } from '@cloudflare/kumo'
import { Heart } from '@phosphor-icons/react/dist/csr/Heart'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'

export default function SiteCard({ site }) {
  const navigate = useNavigate()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const lastSiteId = useRef(null)

  // Update state when site prop changes or loads
  useEffect(() => {
    if (site) {
      // Always update if site ID changed, or if this is initial load
      if (site.id !== lastSiteId.current) {
        setLikeCount(site.likes || 0)
        setLiked(site.liked || false)
        lastSiteId.current = site.id
      }
    }
  }, [site])
  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num
  }

  const handleLike = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isProcessing) return
    
    setIsProcessing(true)
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/sites/${site.id}/like`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Update with actual count and liked state from server
        setLikeCount(data.likes)
        setLiked(data.liked)
        // Update lastSiteId to prevent useEffect from resetting
        lastSiteId.current = site.id
      }
    } catch (error) {
      console.error('Failed to like site:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCardClick = (e) => {
    // Don't navigate if clicking on interactive elements
    if (e.target.closest('button') || e.target.closest('[data-interactive]')) {
      return
    }
    navigate(`/site/${site.id}`)
  }

  const tags = typeof site.tags === 'string' ? JSON.parse(site.tags) : site.tags;
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://px-tester-api.px-tester.workers.dev';
  
  // Use thumbnail_url if available, otherwise screenshot_url, handle both local and external URLs
  const imageUrl = site.thumbnail_url || site.screenshot_url;
  const imageSrc = imageUrl 
    ? (imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`)
    : null;

  return (
    <div onClick={handleCardClick} role="article" aria-label={`${site.name} - ${site.category} site`}>
      <Surface className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col">
        {/* Screenshot or placeholder */}
        <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 relative overflow-hidden">
          {imageSrc ? (
            <img 
              src={imageSrc}
              alt={site.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Text color="white" size="2xl" weight="bold" className="opacity-50">
                {site.name.charAt(0)}
              </Text>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <Text as="h3" size="lg" weight="semibold" className="truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {site.name}
              </Text>
              <Text color="secondary" size="sm" className="truncate">
                {site.url.replace(/^https?:\/\//, '')}
              </Text>
            </div>
          </div>

          {/* Description */}
          <Text color="secondary" size="sm" className="line-clamp-2 mb-4 flex-1">
            {site.short_description}
          </Text>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
            {/* Category Badge */}
            <div className="flex items-center">
              <Badge variant="info" size="sm">
                {site.category}
              </Badge>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
              <button
                onClick={handleLike}
                disabled={isProcessing}
                data-interactive
                className={`flex items-center gap-1.5 transition-all hover:scale-110 ${
                  liked ? 'text-red-500' : 'hover:text-red-500'
                }`}
                aria-label={liked ? 'Unlike this site' : 'Like this site'}
                title={liked ? 'Click to unlike' : 'Click to like'}
              >
                <Heart size={16} weight={liked ? 'fill' : 'regular'} className="flex-shrink-0" aria-hidden="true" />
                <Text size="sm" className="leading-none">{formatNumber(likeCount)}</Text>
              </button>
              <span className="flex items-center gap-1.5" role="img" aria-label={`${formatNumber(site.views)} views`}>
                <Eye size={16} className="flex-shrink-0" aria-hidden="true" />
                <Text size="sm" className="leading-none">{formatNumber(site.views)}</Text>
              </span>
            </div>
          </div>
        </div>
      </Surface>
    </div>
  )
}
