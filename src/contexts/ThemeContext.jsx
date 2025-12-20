import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const stored = localStorage.getItem('theme');
    console.log('[ThemeContext] localStorage theme:', stored);
    if (stored) {
      return stored;
    }
    
    // Check if html element has dark class
    const htmlHasDark = document.documentElement.classList.contains('dark');
    console.log('[ThemeContext] HTML has dark class:', htmlHasDark);
    if (htmlHasDark) {
      return 'dark';
    }
    
    // Default to dark mode
    console.log('[ThemeContext] Defaulting to dark');
    return 'dark';
  });

  useEffect(() => {
    console.log('[ThemeContext] Theme changed to:', theme);
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      console.log('[ThemeContext] Added dark class to html');
    } else {
      root.classList.remove('dark');
      console.log('[ThemeContext] Removed dark class from html');
    }
    localStorage.setItem('theme', theme);
    console.log('[ThemeContext] Saved to localStorage:', theme);
  }, [theme]);

  const toggleTheme = () => {
    console.log('[ThemeContext] Toggle clicked, current theme:', theme);
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      console.log('[ThemeContext] Toggling to:', newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
