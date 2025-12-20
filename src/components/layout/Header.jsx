import { Link } from 'react-router-dom'
import { Button } from '@cloudflare/kumo'
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass'
import { Plus } from '@phosphor-icons/react/dist/csr/Plus'
import { useAuth } from '../../contexts/AuthContext'
import UserMenu from '../auth/UserMenu'
import LoginButton from '../auth/LoginButton'
import ThemeToggle from '../common/ThemeToggle'

export default function Header() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              PX LAB
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-6">
            <Link to="/browse" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              <span className="font-medium">Browse</span>
            </Link>
            <Link to="/search" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors hidden sm:block">
              <span className="font-medium">Search</span>
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/search" className="sm:hidden inline-flex">
              <Button variant="outlined" size="sm">
                <MagnifyingGlass size={20} />
              </Button>
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link to="/submit" className="inline-flex">
                  <Button variant="primary" size="sm">
                    <Plus size={20} weight="bold" />
                    <span className="hidden sm:inline">Submit Site</span>
                  </Button>
                </Link>
                <UserMenu />
              </>
            ) : (
              <LoginButton variant="primary" size="sm" />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
