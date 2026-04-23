import { createContext, useContext, useState, useEffect } from 'react';

const THEMES = ['paper', 'midnight', 'kraft'];
const STORAGE_KEY = 'followmind-theme';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(saved) ? saved : 'paper';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    // Apply theme class to <html> so it cascades everywhere
    const html = document.documentElement;
    THEMES.forEach(t => html.classList.remove(`theme-${t}`));
    html.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
