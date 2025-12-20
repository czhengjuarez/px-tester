import { Link } from 'react-router-dom'
import { Text } from '@cloudflare/kumo'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="text-left">
          <div className="mb-2">
            <Text size="lg" weight="bold">
              PX LAB
            </Text>
          </div>
          <div className="mb-6">
            <Link to="/about" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              <Text>About</Text>
            </Link>
          </div>
          <Text color="secondary" size="xs">
            © {currentYear} PX LAB. Built with Cloudflare products.
          </Text>
        </div>
      </div>
    </footer>
  )
}
