import { useState } from 'react'
import { Text, Button } from '@cloudflare/kumo'
import { Faders } from '@phosphor-icons/react/dist/csr/Faders'
import SiteCard from '../components/site/SiteCard'
import { LoadingGrid, ErrorMessage, EmptyState } from '../components/common/LoadingStates'
import { useSites } from '../hooks/useSites'

const categories = [
  { id: 'all', name: 'All Sites' },
  { id: 'saas', name: 'SaaS' },
  { id: 'portfolio', name: 'Portfolio' },
  { id: 'ecommerce', name: 'E-commerce' },
  { id: 'blog', name: 'Blog' },
  { id: 'agency', name: 'Agency' },
  { id: 'productivity', name: 'Productivity' },
  { id: 'design', name: 'Design' },
  { id: 'development', name: 'Development' }
]

export default function Browse() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error, refetch } = useSites({
    category: selectedCategory,
    sort: sortBy,
    page,
    limit: 12
  })

  const sites = data?.sites || []
  const pagination = data?.pagination || { total: 0, totalPages: 1 }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <Text as="h1" size="4xl" weight="bold" className="mb-3">
            Browse Catalog
          </Text>
          <Text color="secondary" size="lg">
            Explore {pagination.total} curated websites and web applications
          </Text>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Faders size={24} className="text-gray-600 dark:text-gray-400" />
            <Text weight="semibold">Filter by Category</Text>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id)
                  setPage(1)
                }}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Text weight="medium">{category.name}</Text>
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-4">
            <Text weight="semibold">Sort by:</Text>
            <div className="flex gap-2">
              {[
                { value: 'newest', label: 'Newest' },
                { value: 'popular', label: 'Popular' },
                { value: 'likes', label: 'Most Liked' },
                { value: 'views', label: 'Most Viewed' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value)
                    setPage(1)
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    sortBy === option.value
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        {!isLoading && !isError && (
          <div className="mb-6">
            <Text color="secondary">
              Showing {sites.length} of {pagination.total} {pagination.total === 1 ? 'site' : 'sites'}
              {selectedCategory !== 'all' && ` in ${categories.find(c => c.id === selectedCategory)?.name}`}
            </Text>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <LoadingGrid count={12} />}

        {/* Error State */}
        {isError && <ErrorMessage error={error} retry={refetch} />}

        {/* Sites Grid */}
        {!isLoading && !isError && sites.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {sites.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outlined"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-lg transition-all ${
                          page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <Button
                  variant="outlined"
                  size="sm"
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !isError && sites.length === 0 && (
          <EmptyState
            title="No sites found"
            description={`No sites found in ${categories.find(c => c.id === selectedCategory)?.name || 'this category'}`}
          />
        )}
      </div>
    </div>
  )
}
