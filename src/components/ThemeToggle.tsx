import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="12" y1="1.5" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22.5" />
            <line x1="1.5" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22.5" y2="12" />
            <line x1="4.4" y1="4.4" x2="6.2" y2="6.2" />
            <line x1="17.8" y1="17.8" x2="19.6" y2="19.6" />
            <line x1="4.4" y1="19.6" x2="6.2" y2="17.8" />
            <line x1="17.8" y1="6.2" x2="19.6" y2="4.4" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            fill="currentColor"
            d="M20.5 14.7A8.5 8.5 0 0 1 9.3 3.5a.7.7 0 0 0-.9-.9A10 10 0 1 0 21.4 15.6a.7.7 0 0 0-.9-.9Z"
          />
        </svg>
      )}
    </button>
  );
}
