import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Text, Badge } from '@cloudflare/kumo'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { TrendUp } from '@phosphor-icons/react/dist/csr/TrendUp'
import SiteCard from '../components/site/SiteCard'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [featuredSites, setFeaturedSites] = useState([])
  const [recentSites, setRecentSites] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchFeaturedSites()
    fetchRecentSites()
  }, [])

  const fetchFeaturedSites = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const url = `${API_URL}/sites?featured=true&limit=3`
      console.log('[Featured Sites] Fetching from:', url)
      const response = await fetch(url)
      const data = await response.json()
      console.log('[Featured Sites] Response:', data)
      console.log('[Featured Sites] Count:', data.sites?.length || 0)
      setFeaturedSites(data.sites || [])
    } catch (error) {
      console.error('[Featured Sites] Error:', error)
    }
  }

  const fetchRecentSites = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://px-tester-api.px-tester.workers.dev/api'
      const response = await fetch(`${API_URL}/sites?limit=6&sort=newest`)
      const data = await response.json()
      setRecentSites(data.sites || [])
    } catch (error) {
      console.error('Failed to fetch recent sites:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gray-900 py-20 dotted-pattern">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Heading */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Our Living Catalog of &quot;What If?&quot;
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              A sandbox for the PX team and beyond. We&apos;re using AI to bridge the gap between design and code. See what we&apos;re building, then add your own.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-6">
              <form onSubmit={(e) => {
                e.preventDefault()
                if (searchQuery.trim()) {
                  navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                }
              }}>
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-shadow border border-gray-300 dark:border-gray-700 shadow-sm">
                  <MagnifyingGlass size={24} className="text-gray-400 dark:text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for websites, tools, inspiration..."
                    className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 outline-none"
                  />
                  <Badge variant="info" size="sm">AI</Badge>
                </div>
              </form>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Link to="/browse">
                <button className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                  Browse Catalog
                </button>
              </Link>
              {isAuthenticated ? (
                <Link to="/submit">
                  <button className="px-6 py-3 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-gray-900 transition-colors">
                    Submit Your Site
                  </button>
                </Link>
              ) : (
                <button 
                  onClick={login}
                  className="px-6 py-3 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white hover:text-gray-900 transition-colors"
                >
                  Log in to Submit Your Site
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Sites */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Text as="h2" size="3xl" weight="bold" className="mb-2">
                Featured Sites
              </Text>
              <Text color="secondary">
                Hand-picked by our team
              </Text>
            </div>
            <Link to="/browse?featured=true">
              <Button variant="outlined">View All</Button>
            </Link>
          </div>

          {featuredSites.length === 0 ? (
            <div className="text-center py-12">
              <Text color="secondary" size="lg">
                No featured sites yet. Check back soon!
              </Text>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredSites.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent Submissions */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <TrendUp size={32} weight="bold" className="text-blue-600" />
              <Text as="h2" size="3xl" weight="bold">
                Recently Added
              </Text>
            </div>
            <Text color="secondary">
              Fresh submissions from the community
            </Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentSites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-orange-500 dark:bg-orange-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Share Your Website?
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Join our community and showcase your work to thousands of visitors
          </p>
          <Link to="/submit" className="inline-block">
            <Button variant="secondary" size="lg">
              Submit Your Site
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
