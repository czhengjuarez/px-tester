import { useState, useEffect } from 'react'
import { Text, Button } from '@cloudflare/kumo'
import { Faders } from '@phosphor-icons/react/dist/csr/Faders'
import SiteCard from '../components/site/SiteCard'
import { LoadingGrid, ErrorMessage, EmptyState } from '../components/common/LoadingStates'
import { useSites } from '../hooks/useSites'

export default function Browse() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState([{ id: 'all', name: 'All Sites' }])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/categories`)
      const data = await response.json()
      
      // Prepend "All Sites" option to the categories from database
      const allCategories = [
        { id: 'all', name: 'All Sites' },
        ...(data.categories || []).map(cat => ({ id: cat.slug, name: cat.name }))
      ]
      setCategories(allCategories)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Keep default "All Sites" if fetch fails
    }
  }

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
            <Faders size={24} className="text-gray-600 dark:text-gray-400" aria-label="Filter icon" />
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
                className={`px-4 py-2 rounded-lg transition-all border-2 ${
                  selectedCategory === category.id
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 font-medium'
                    : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
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
                  className={`px-3 py-1.5 rounded-md text-sm transition-all border-2 ${
                    sortBy === option.value
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 font-medium'
                      : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
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
                        className={`w-10 h-10 rounded-lg transition-all border ${
                          page === pageNum
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-400 dark:hover:border-blue-500'
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
