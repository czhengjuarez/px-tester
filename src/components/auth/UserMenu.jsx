import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Text } from '@cloudflare/kumo';
import { User } from '@phosphor-icons/react/dist/csr/User';
import { SignOut } from '@phosphor-icons/react/dist/csr/SignOut';
import { Gear } from '@phosphor-icons/react/dist/csr/Gear';
import { useAuth } from '../../contexts/AuthContext';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User size={20} weight="bold" className="text-white" />
          </div>
        )}
        <Text weight="medium" className="hidden md:block text-gray-900 dark:text-white">{user.name}</Text>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <Text weight="semibold" className="text-gray-900 dark:text-white">{user.name}</Text>
            <Text size="sm" className="text-gray-600 dark:text-gray-400">{user.email}</Text>
          </div>

          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            onClick={() => setIsOpen(false)}
          >
            <User size={20} />
            <Text className="text-gray-900 dark:text-white">Dashboard</Text>
          </Link>

          {user.role === 'admin' || user.role === 'super_admin' ? (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              onClick={() => setIsOpen(false)}
            >
              <Gear size={20} />
              <Text className="text-gray-900 dark:text-white">Admin Panel</Text>
            </Link>
          ) : null}

          <button
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400"
          >
            <SignOut size={20} />
            <Text className="text-red-600 dark:text-red-400">Sign Out</Text>
          </button>
        </div>
      )}
    </div>
  );
}
