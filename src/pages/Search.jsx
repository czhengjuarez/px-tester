import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Text, Button } from '@cloudflare/kumo'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { Sparkle } from '@phosphor-icons/react/dist/csr/Sparkle'
import SiteCard from '../components/site/SiteCard'
import { LoadingSpinner } from '../components/common/LoadingStates'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const performSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setResults([])
      setSearched(false)
      return
    }

    setLoading(true)
    setSearched(true)

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      setResults(data.sites || [])
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      performSearch(q)
    }
  }, [searchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query.trim() })
      performSearch(query.trim())
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkle size={32} weight="fill" className="text-blue-600" />
              <Text as="h1" size="3xl" weight="bold">
                AI-Powered Search
              </Text>
            </div>
            <Text color="secondary" className="max-w-2xl mx-auto">
              Search for websites using natural language. Our AI understands context and finds relevant results.
            </Text>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-300 dark:border-gray-700 shadow-lg">
              <MagnifyingGlass size={24} className="text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for websites, tools, inspiration..."
                className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none text-lg"
                autoFocus
              />
              <Button type="submit" variant="primary" disabled={loading || !query.trim()}>
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner />
          </div>
        ) : searched ? (
          <div>
            <div className="mb-6">
              <Text color="secondary">
                {results.length > 0 
                  ? `Found ${results.length} result${results.length === 1 ? '' : 's'} for "${searchParams.get('q')}"`
                  : `No results found for "${searchParams.get('q')}"`
                }
              </Text>
            </div>

            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((site) => (
                  <SiteCard key={site.id} site={site} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <Text size="xl" weight="semibold" className="mb-2">
                  No results found
                </Text>
                <Text color="secondary">
                  Try different keywords or browse our catalog
                </Text>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
