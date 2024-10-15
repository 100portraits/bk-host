import React from 'react';
import { useTheme } from '../ThemeContext';

const DarkModeToggle = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full bg-red-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
    >
      {isDarkMode ? '🌞' : '🌙'}
    </button>
  );
};

export default DarkModeToggle;
