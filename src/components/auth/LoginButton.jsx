import { GoogleLogo } from '@phosphor-icons/react/dist/csr/GoogleLogo';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginButton({ variant = 'primary', size = 'md', className = '' }) {
  const { login } = useAuth();

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800',
    outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
  };

  return (
    <button
      onClick={login}
      className={`inline-flex items-center gap-2 font-semibold rounded-lg transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      <GoogleLogo size={20} weight="bold" />
      Sign in with Google
    </button>
  );
}
