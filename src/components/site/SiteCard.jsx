import { Link } from 'react-router-dom'
import { Surface, Text, Badge } from '@cloudflare/kumo'
import { Heart } from '@phosphor-icons/react/dist/csr/Heart'
import { Eye } from '@phosphor-icons/react/dist/csr/Eye'
import { ArrowUpRight } from '@phosphor-icons/react/dist/csr/ArrowUpRight'

export default function SiteCard({ site }) {
  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`
    }
    return num
  }

  const tags = typeof site.tags === 'string' ? JSON.parse(site.tags) : site.tags;
  const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://px-tester-api.px-tester.workers.dev';
  
  // Use thumbnail_url if available, otherwise screenshot_url, handle both local and external URLs
  const imageUrl = site.thumbnail_url || site.screenshot_url;
  const imageSrc = imageUrl 
    ? (imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`)
    : null;

  return (
    <Link to={`/site/${site.id}`}>
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
              <div className="flex items-center gap-1.5">
                <Heart size={16} weight="fill" className="flex-shrink-0" />
                <Text size="sm" className="leading-none">{formatNumber(site.likes)}</Text>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye size={16} className="flex-shrink-0" />
                <Text size="sm" className="leading-none">{formatNumber(site.views)}</Text>
              </div>
            </div>
          </div>
        </div>
      </Surface>
    </Link>
  )
}
