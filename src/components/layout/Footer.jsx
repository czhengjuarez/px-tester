import { Link } from 'react-router-dom'
import { Text } from '@cloudflare/kumo'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Text size="lg" weight="bold">
                PX LAB
              </Text>
            </div>
            <Text color="secondary" className="max-w-md">
              Discover and submit the best websites and web applications. 
              Powered by AI for intelligent search and discovery.
            </Text>
            <div className="mt-6">
              <a 
                href="https://blog.cloudflare.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Visit Cloudflare Blog"
                className="inline-block opacity-60 hover:opacity-100 transition-opacity"
              >
                <img 
                  src="https://www.figma.com/api/mcp/asset/67ab7c1c-95ce-4c54-abdd-ceaae8cca5cd" 
                  alt="Cloudflare" 
                  style={{ width: 'auto', height: '24px', maxWidth: '150px' }}
                  className="object-contain"
                />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <Text weight="semibold" className="mb-4">Product</Text>
            <ul className="space-y-2">
              <li>
                <Link to="/browse" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  <Text>Browse Sites</Text>
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  <Text>AI Search</Text>
                </Link>
              </li>
              <li>
                <Link to="/submit" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  <Text>Submit Site</Text>
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <Text weight="semibold" className="mb-4">Company</Text>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  <Text>About</Text>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  <Text>Contact</Text>
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                  <Text>Privacy</Text>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8">
          <Text color="secondary" size="sm" className="text-center">
            © {currentYear} PX LAB. Built with Cloudflare Workers AI.
          </Text>
        </div>
      </div>
    </footer>
  )
}
