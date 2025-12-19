import { Moon } from '@phosphor-icons/react/dist/csr/Moon';
import { Sun } from '@phosphor-icons/react/dist/csr/Sun';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun size={20} weight="bold" className="text-gray-300" />
      ) : (
        <Moon size={20} weight="bold" className="text-gray-700" />
      )}
    </button>
  );
}
