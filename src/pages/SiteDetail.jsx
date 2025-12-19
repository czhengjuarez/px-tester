import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Text, Button, Badge, Surface } from '@cloudflare/kumo';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/csr/ArrowSquareOut';
import { Heart } from '@phosphor-icons/react/dist/csr/Heart';
import { Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { api } from '../services/api';
import { LoadingSpinner, ErrorMessage } from '../components/common/LoadingStates';
import SiteCard from '../components/site/SiteCard';
import { useSite } from '../hooks/useSites'

export default function SiteDetail() {
  const { id } = useParams()
  const { data, isLoading, isError, error, refetch } = useSite(id)

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
                <a href={site.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="primary" size="lg">
                    <ArrowUpRight size={20} weight="bold" />
                    Visit Site
                  </Button>
                </a>
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
                <div className="flex items-center gap-2">
                  <Heart size={20} weight="fill" className="text-red-500" />
                  <Text>{site.likes.toLocaleString()} likes</Text>
                </div>
                <div className="flex items-center gap-2">
                  <Eye size={20} />
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
              <img 
                src={site.thumbnail_url} 
                alt={site.name}
                className="w-full aspect-video object-cover"
              />
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
              
              <div className="space-y-3">
                <Button variant="outlined" className="w-full justify-center">
                  <Heart size={20} />
                  Like this site
                </Button>
                <Button variant="outlined" className="w-full justify-center">
                  Share
                </Button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-6" />

              <div>
                <Text weight="semibold" className="mb-2">Category</Text>
                <Badge variant="info">{site.category}</Badge>
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
