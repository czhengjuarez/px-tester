import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Text, Button, Badge, Surface } from '@cloudflare/kumo';
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight';
import { Calendar } from '@phosphor-icons/react/dist/csr/Calendar';
import { Heart } from '@phosphor-icons/react/dist/csr/Heart';
import { Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { ShareNetwork } from '@phosphor-icons/react/dist/csr/ShareNetwork';
import { LoadingSpinner, ErrorMessage } from '../components/common/LoadingStates';
import SiteCard from '../components/site/SiteCard';
import { useSite } from '../hooks/useSites';

export default function SiteDetail() {
  const { id } = useParams()
  const { data, isLoading, isError, refetch } = useSite(id)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)
  const lastSiteId = useRef(null)

  // Initialize like count and liked state from site data when site changes or loads
  useEffect(() => {
    if (data?.site) {
      // Always update if site ID changed, or if this is initial load
      if (data.site.id !== lastSiteId.current) {
        setLikeCount(data.site.likes || 0)
        setLiked(data.site.liked || false)
        lastSiteId.current = data.site.id
      }
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage error={error} retry={refetch} />
      </div>
    )
  }

  if (!data?.site) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Text size="2xl" weight="bold" className="mb-4">Site Not Found</Text>
          <Link to="/browse">
            <Button variant="primary">Browse Catalog</Button>
          </Link>
        </div>
      </div>
    )
  }

  const site = data.site
  const similarSites = data.similarSites || []
  
  const handleLike = async () => {
    if (isLiking) return
    
    setIsLiking(true)
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/sites/${id}/like`, {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Update with actual count and liked state from server
        setLikeCount(data.likes)
        setLiked(data.liked)
        // Update lastSiteId to prevent useEffect from resetting
        lastSiteId.current = id
      }
    } catch (error) {
      console.error('Failed to like site:', error)
    } finally {
      setIsLiking(false)
    }
  }
  
  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: site.name,
          text: site.short_description,
          url: url
        })
      } catch (err) {
        // User cancelled or error - fallback to clipboard
        if (err.name !== 'AbortError') {
          copyToClipboard(url)
        }
      }
    } else {
      copyToClipboard(url)
    }
  }
  
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Link copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const tags = site?.tags ? (typeof site.tags === 'string' ? JSON.parse(site.tags) : site.tags) : [];
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://px-tester-api.px-tester.workers.dev';
  
  // Handle both local and external screenshot URLs
  const screenshotUrl = site?.screenshot_url;
  const screenshotSrc = screenshotUrl 
    ? (screenshotUrl.startsWith('http') ? screenshotUrl : `${API_URL}${screenshotUrl}`)
    : null;

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link to="/browse" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} />
          <Text>Back to Browse</Text>
        </Link>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <Text as="h1" size="4xl" weight="bold" className="mb-2">
                    {site.name}
                  </Text>
                  <a 
                    href={site.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Text size="lg">{site.url}</Text>
                  </a>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="info">{site.category}</Badge>
                {site.tags.map((tag) => (
                  <Badge key={tag} variant="neutral">{tag}</Badge>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2" role="img" aria-label={`${likeCount.toLocaleString()} likes`}>
                  <Heart 
                    size={20} 
                    weight={liked ? "fill" : "regular"} 
                    className={liked ? "text-red-500" : "text-gray-400"}
                    aria-hidden="true"
                  />
                  <Text className={liked ? "text-red-500 font-semibold" : ""}>{likeCount.toLocaleString()} likes</Text>
                </div>
                <div className="flex items-center gap-2" role="img" aria-label={`${site.views.toLocaleString()} views`}>
                  <Eye size={20} aria-hidden="true" />
                  <Text>{site.views.toLocaleString()} views</Text>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={20} />
                  <Text>{formatDate(site.submitted_at)}</Text>
                </div>
              </div>
            </div>

            {/* Screenshot */}
            <Surface className="mb-8 overflow-hidden">
              {site.thumbnail_url ? (
                <img 
                  src={site.thumbnail_url.startsWith('http') ? site.thumbnail_url : `${API_URL}${site.thumbnail_url}`}
                  alt={site.name}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Text size="4xl" weight="bold" className="text-white opacity-50">
                    {site.name.charAt(0)}
                  </Text>
                </div>
              )}
            </Surface>

            {/* Description */}
            <div className="mb-8">
              <Text as="h2" size="2xl" weight="bold" className="mb-4">
                About
              </Text>
              <Text size="lg" color="secondary" className="leading-relaxed">
                {site.description}
              </Text>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div>
            <Surface className="p-6 sticky top-24">
              <Text weight="bold" className="mb-4">Quick Actions</Text>
              
              <div className="flex gap-2">
                <Button 
                  variant="outlined" 
                  className="flex-1 justify-center"
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  <Heart size={20} weight={liked ? 'fill' : 'regular'} className={liked ? 'text-red-500' : ''} />
                  {liked ? 'Liked' : 'Like'}
                </Button>
                <Button 
                  variant="outlined" 
                  className="flex-1 justify-center"
                  onClick={handleShare}
                >
                  <ShareNetwork size={20} />
                  Share
                </Button>
                <a href={site.url} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button variant="primary" className="w-full justify-center">
                    <ArrowUpRight size={20} weight="bold" />
                    Visit
                  </Button>
                </a>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-6" />

              <div className="mb-6">
                <Text weight="semibold" className="mb-2">Category</Text>
                <Badge variant="info">{site.category}</Badge>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-6" />

              <div>
                <Text weight="semibold" className="mb-3">About</Text>
                <Text size="sm" color="secondary" className="leading-relaxed">
                  {site.description}
                </Text>
              </div>
            </Surface>
          </div>
        </div>

        {/* Similar Sites */}
        {similarSites.length > 0 && (
          <div className="mt-16">
            <Text as="h2" size="3xl" weight="bold" className="mb-6">
              Similar Sites
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarSites.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
