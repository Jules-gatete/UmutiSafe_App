export const getTheme = () => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('umutisafe-theme');
  if (stored) return stored;

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const setTheme = (theme) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('umutisafe-theme', theme);

  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const toggleTheme = () => {
  const current = getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  setTheme(next);
  return next;
};

export const initTheme = () => {
  const theme = getTheme();
  setTheme(theme);
};
